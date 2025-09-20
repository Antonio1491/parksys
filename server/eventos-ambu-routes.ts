import { Request, Response, Router } from "express";
import { eq, desc, and, gte, lte, like, sql } from "drizzle-orm";
import { db } from "./db";
import {
  eventosAmbu,
  solicitudesAmbu,
  documentosAmbu,
  costosAmbu,
  seguimientoAmbu,
  reunionesAmbu,
  insertEventoAmbuSchema,
  insertSolicitudAmbuSchema,
  insertDocumentoAmbuSchema,
  insertCostoAmbuSchema,
  insertSeguimientoAmbuSchema,
  insertReunionAmbuSchema,
  EventoAmbu,
  InsertEventoAmbu
} from "@shared/events-ambu-schema";

// === TABULADOR DE COSTOS (USO INTERNO) ===
const tabuladorCostos = {
  // Fotografía y Video
  fotografiaSocial: 2000,
  fotografiaComercial: 5000,
  videoComercial: 8000,
  sesionQuinceanos: 3500,
  
  // Eventos deportivos y recreativos
  actividadesFisicas: 1500,
  carrerasComerciales: {
    porParticipante: 25,
    permisoRuta: 1000
  },
  
  // Infraestructura y servicios
  montajeDesmontaje: 800,
  limpiezaPostEvento: 1200,
  seguridadPrivada: 300, // por hora
  sonidoLuces: 2500,
  
  // Permisos especiales
  usoNocturno: 2000,
  alcohol: 5000,
  ventaComida: 1500,
  publicidadComercial: 3000
};

export function registerEventosAmbuRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  
  // === EVENTOS PRINCIPALES ===
  
  // Obtener todos los eventos con filtros
  apiRouter.get("/eventos-ambu", async (req: Request, res: Response) => {
    try {
      const { 
        categoria, 
        status, 
        parque_id, 
        fecha_desde, 
        fecha_hasta,
        page = 1, 
        limit = 10 
      } = req.query;
      
      let whereConditions: any[] = [];
      
      
      if (categoria) {
        whereConditions.push(eq(eventosAmbu.categoria, categoria as any));
      }
      
      if (status) {
        whereConditions.push(eq(eventosAmbu.status, status as any));
      }
      
      if (parque_id) {
        whereConditions.push(eq(eventosAmbu.parqueId, parseInt(parque_id as string)));
      }
      
      if (fecha_desde) {
        whereConditions.push(gte(eventosAmbu.fechaEvento, fecha_desde as string));
      }
      
      if (fecha_hasta) {
        whereConditions.push(lte(eventosAmbu.fechaEvento, fecha_hasta as string));
      }
      
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      let query = db.select().from(eventosAmbu);
      
      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }
      
      const eventos = await query
        .orderBy(desc(eventosAmbu.createdAt))
        .limit(parseInt(limit as string))
        .offset(offset);
      
      // Obtener conteo total usando sql`count(*)`
      let countQuery = db.select({ count: sql`count(*)` }).from(eventosAmbu);
      if (whereConditions.length > 0) {
        countQuery = countQuery.where(and(...whereConditions));
      }
      
      const countResult = await countQuery;
      const count = Number(countResult?.[0]?.count) || 0;
      
      res.json({
        eventos,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: count,
          pages: Math.ceil(count / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error("Error al obtener eventos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  
  // === CALENDARIO ===
  
  // Obtener eventos para calendario (debe ir ANTES de la ruta /:id)
  apiRouter.get("/eventos-ambu/calendario", async (req: Request, res: Response) => {
    try {
      const { mes, anio } = req.query;
      
      let whereConditions: any[] = [];
      
      // Si se especifica mes y año, filtrar por ese periodo
      if (mes && anio) {
        const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
        const ultimoDia = new Date(parseInt(anio as string), parseInt(mes as string), 0).getDate();
        const fechaFin = `${anio}-${String(mes).padStart(2, '0')}-${ultimoDia}`;
        
        whereConditions.push(gte(eventosAmbu.fechaEvento, fechaInicio));
        whereConditions.push(lte(eventosAmbu.fechaEvento, fechaFin));
      }
      
      let query = db.select({
        id: eventosAmbu.id,
        titulo: eventosAmbu.titulo,
        descripcion: eventosAmbu.descripcion,
        fechaEvento: eventosAmbu.fechaEvento,
        horaInicio: eventosAmbu.horaInicio,
        horaFin: eventosAmbu.horaFin,
        categoria: eventosAmbu.categoria,
        status: eventosAmbu.status,
        parqueId: eventosAmbu.parqueId,
        numeroAsistentes: eventosAmbu.numeroAsistentes
      }).from(eventosAmbu);
      
      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }
      
      const eventos = await query.orderBy(eventosAmbu.fechaEvento);
      
      res.json(eventos);
    } catch (error) {
      console.error("Error al obtener calendario de eventos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener evento específico con toda la información relacionada
  apiRouter.get("/eventos-ambu/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validar que el ID sea un número válido
      const eventoId = parseInt(id);
      if (isNaN(eventoId)) {
        return res.status(400).json({ error: "ID de evento inválido" });
      }
      
      const evento = await db.select().from(eventosAmbu)
        .where(eq(eventosAmbu.id, eventoId))
        .limit(1);
      
      if (evento.length === 0) {
        return res.status(404).json({ error: "Evento no encontrado" });
      }
      
      // Obtener datos relacionados
      const solicitud = await db.select().from(solicitudesAmbu)
        .where(eq(solicitudesAmbu.eventoId, eventoId))
        .limit(1);
      
      const documentos = await db.select().from(documentosAmbu)
        .where(eq(documentosAmbu.eventoId, eventoId));
      
      const costos = await db.select().from(costosAmbu)
        .where(eq(costosAmbu.eventoId, eventoId));
      
      const seguimiento = await db.select().from(seguimientoAmbu)
        .where(eq(seguimientoAmbu.eventoId, eventoId))
        .orderBy(desc(seguimientoAmbu.fechaAccion));
      
      const reuniones = await db.select().from(reunionesAmbu)
        .where(eq(reunionesAmbu.eventoId, eventoId))
        .orderBy(desc(reunionesAmbu.fechaReunion));
      
      res.json({
        evento: evento[0],
        solicitud: solicitud[0] || null,
        documentos,
        costos,
        seguimiento,
        reuniones
      });
    } catch (error) {
      console.error("Error al obtener evento:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  
  // Crear nuevo evento
  apiRouter.post("/eventos-ambu", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventoData = insertEventoAmbuSchema.parse(req.body.evento);
      const solicitudData = insertSolicitudAmbuSchema.parse(req.body.solicitud);
      
      // Calcular fecha límite de anticipación (usar 30 días como estándar)
      const fechaEvento = new Date(eventoData.fechaEvento);
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + 30); // 30 días estándar
      
      eventoData.fechaLimiteAnticipacion = fechaLimite.toISOString().split('T')[0];
      
      // Crear evento
      const [nuevoEvento] = await db.insert(eventosAmbu)
        .values(eventoData)
        .returning();
      
      // Crear solicitud asociada
      solicitudData.eventoId = nuevoEvento.id;
      const [nuevaSolicitud] = await db.insert(solicitudesAmbu)
        .values(solicitudData)
        .returning();
      
      // Calcular costos automáticamente
      await calcularCostosEvento(nuevoEvento.id, eventoData);
      
      // Registrar seguimiento inicial
      await db.insert(seguimientoAmbu).values({
        eventoId: nuevoEvento.id,
        accion: "solicitud_creada",
        observaciones: "Solicitud de evento creada inicialmente",
        responsable: solicitudData.nombreSolicitante
      });
      
      res.status(201).json({ evento: nuevoEvento, solicitud: nuevaSolicitud });
    } catch (error) {
      console.error("Error al crear evento:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  
  // Actualizar evento
  apiRouter.put("/eventos-ambu/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const eventoData = insertEventoAmbuSchema.partial().parse(req.body.evento);
      const solicitudData = insertSolicitudAmbuSchema.partial().parse(req.body.solicitud);
      
      // Actualizar evento
      const [eventoActualizado] = await db.update(eventosAmbu)
        .set({ ...eventoData, updatedAt: new Date() })
        .where(eq(eventosAmbu.id, parseInt(id)))
        .returning();
      
      // Actualizar solicitud si existe
      if (solicitudData && Object.keys(solicitudData).length > 0) {
        await db.update(solicitudesAmbu)
          .set({ ...solicitudData, updatedAt: new Date() })
          .where(eq(solicitudesAmbu.eventoId, parseInt(id)));
      }
      
      // Recalcular costos si cambió información relevante
      if (eventoData.categoria || eventoData.numeroAsistentes) {
        await calcularCostosEvento(parseInt(id), eventoActualizado);
      }
      
      // Registrar seguimiento
      await db.insert(seguimientoAmbu).values({
        eventoId: parseInt(id),
        accion: "evento_actualizado",
        observaciones: "Información del evento actualizada",
        responsable: (req as any).user?.fullName || "Sistema"
      });
      
      res.json({ evento: eventoActualizado });
    } catch (error) {
      console.error("Error al actualizar evento:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  
  // Cambiar estado del evento
  apiRouter.patch("/eventos-ambu/:id/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, observaciones } = req.body;
      
      const [eventoActualizado] = await db.update(eventosAmbu)
        .set({ status, updatedAt: new Date() })
        .where(eq(eventosAmbu.id, parseInt(id)))
        .returning();
      
      // Registrar seguimiento del cambio de estado
      await db.insert(seguimientoAmbu).values({
        eventoId: parseInt(id),
        accion: `status_cambiado_${status}`,
        observaciones: observaciones || `Estado cambiado a: ${status}`,
        responsable: (req as any).user?.fullName || "Sistema"
      });
      
      res.json({ evento: eventoActualizado });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  
  // === DOCUMENTOS ===
  
  // Subir documento
  apiRouter.post("/eventos-ambu/:id/documentos", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const documentoData = insertDocumentoEventoSchema.parse(req.body);
      documentoData.eventoId = parseInt(id);
      
      const [nuevoDocumento] = await db.insert(documentosEvento)
        .values(documentoData)
        .returning();
      
      // Registrar seguimiento
      await db.insert(seguimientoAmbu).values({
        eventoId: parseInt(id),
        accion: "documento_subido",
        observaciones: `Documento subido: ${documentoData.tipoDocumento}`,
        responsable: (req as any).user?.fullName || "Sistema"
      });
      
      res.status(201).json(nuevoDocumento);
    } catch (error) {
      console.error("Error al subir documento:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  
  // === REUNIONES DE LOGÍSTICA ===
  
  // Crear reunión de logística
  apiRouter.post("/eventos-ambu/:id/reuniones", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const reunionData = insertReunionLogisticaSchema.parse(req.body);
      reunionData.eventoId = parseInt(id);
      
      const [nuevaReunion] = await db.insert(reunionesLogistica)
        .values(reunionData)
        .returning();
      
      // Registrar seguimiento
      await db.insert(seguimientoAmbu).values({
        eventoId: parseInt(id),
        accion: "reunion_programada",
        observaciones: `Reunión programada para: ${reunionData.fechaReunion}`,
        responsable: reunionData.responsableReunion || "Sistema"
      });
      
      res.status(201).json(nuevaReunion);
    } catch (error) {
      console.error("Error al crear reunión:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  
  // === CÁLCULO DE COSTOS ===
  
  // Calcular costo de un evento
  apiRouter.post("/eventos-ambu/calcular-costo", async (req: Request, res: Response) => {
    try {
      const { categoria, numeroAsistentes, equipamiento, extras } = req.body;
      const costo = await calcularCostoEvento(categoria, numeroAsistentes, equipamiento, extras);
      res.json(costo);
    } catch (error) {
      console.error("Error al calcular costo:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  


  // === ESTADÍSTICAS Y REPORTES ===
  
  // Dashboard de eventos
  apiRouter.get("/eventos-ambu/dashboard", async (req: Request, res: Response) => {
    try {
      // Estadísticas generales
      const totalEventos = await db.select({ count: eventosAmbu.id }).from(eventosAmbu);
      const eventosPorEstado = await db.select({ 
        status: eventosAmbu.status,
        count: eventosAmbu.id 
      }).from(eventosAmbu);
      
      const eventosPorTipo = await db.select({
        impactoTipo: eventosAmbu.impactoTipo,
        count: eventosAmbu.id
      }).from(eventosAmbu);
      
      // Eventos próximos (siguientes 30 días)
      const fechaHoy = new Date().toISOString().split('T')[0];
      const fecha30Dias = new Date();
      fecha30Dias.setDate(fecha30Dias.getDate() + 30);
      
      const eventosProximos = await db.select().from(eventosAmbu)
        .where(and(
          gte(eventosAmbu.fechaEvento, fechaHoy),
          lte(eventosAmbu.fechaEvento, fecha30Dias.toISOString().split('T')[0])
        ))
        .orderBy(eventosAmbu.fechaEvento);
      
      res.json({
        totalEventos: totalEventos[0]?.count || 0,
        eventosPorEstado,
        eventosPorTipo,
        eventosProximos
      });
    } catch (error) {
      console.error("Error al obtener dashboard:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
}

// === FUNCIONES AUXILIARES ===

async function calcularCostosEvento(eventoId: number, eventoData: any) {
  try {
    // Limpiar costos existentes
    await db.delete(costosEvento).where(eq(costosEvento.eventoId, eventoId));
    
    const costos = await calcularCostoEvento(
      eventoData.categoria,
      eventoData.numeroAsistentes,
      eventoData.equipamiento,
      {}
    );
    
    // Insertar nuevos costos
    for (const costo of costos.desglose) {
      await db.insert(costosEvento).values({
        eventoId,
        concepto: costo.concepto,
        descripcion: costo.descripcion,
        cantidad: costo.cantidad,
        precioUnitario: parseFloat(costo.precioUnitario.toString()),
        subtotal: parseFloat(costo.subtotal.toString()),
        referenciaTabulator: costo.referencia
      });
    }
    
    // Actualizar costos totales en el evento (sin diferenciación de impacto)
    await db.update(eventosAmbu).set({
      costoTotal: parseFloat(costos.total.toString()),
      anticipo: parseFloat((costos.total * 0.3).toString()), // 30% estándar
      depositoGarantia: parseFloat((costos.total * 0.1).toString()) // 10% estándar
    }).where(eq(eventosAmbu.id, eventoId));
    
  } catch (error) {
    console.error("Error al calcular costos:", error);
  }
}

async function calcularCostoEvento(categoria: string, numeroAsistentes: number, equipamiento: string, extras: any) {
  const desglose: any[] = [];
  let total = 0;
  
  switch (categoria) {
    case "sesion_fotografia":
      desglose.push({
        concepto: "Sesión Fotográfica Social",
        descripcion: "Fotografía social en parques (excepto Jardín Japonés)",
        cantidad: 1,
        precioUnitario: tabuladorCostos.fotografiaSocial,
        subtotal: tabuladorCostos.fotografiaSocial,
        referencia: "Tabulador-4"
      });
      total += tabuladorCostos.fotografiaSocial;
      break;
      
    case "carrera_deportiva":
      const costoParticipantes = numeroAsistentes * tabuladorCostos.carrerasComerciales.porParticipante;
      desglose.push({
        concepto: "Carrera Comercial - Participantes",
        descripcion: `${numeroAsistentes} participantes x $${tabuladorCostos.carrerasComerciales.porParticipante}`,
        cantidad: numeroAsistentes,
        precioUnitario: tabuladorCostos.carrerasComerciales.porParticipante,
        subtotal: costoParticipantes,
        referencia: "Tabulador-9"
      });
      
      desglose.push({
        concepto: "Permiso de Uso de Ruta",
        descripcion: "Autorización para uso de ruta en el parque",
        cantidad: 1,
        precioUnitario: tabuladorCostos.carrerasComerciales.permisoRuta,
        subtotal: tabuladorCostos.carrerasComerciales.permisoRuta,
        referencia: "Tabulador-9"
      });
      
      total += costoParticipantes + tabuladorCostos.carrerasComerciales.permisoRuta;
      break;
      
    case "actividad_fisica_grupal":
      desglose.push({
        concepto: "Actividad Física Grupal",
        descripcion: "Actividad física mensual (máx. 15-20 personas, 8 hrs/semana)",
        cantidad: 1,
        precioUnitario: tabuladorCostos.actividadesFisicas,
        subtotal: tabuladorCostos.actividadesFisicas,
        referencia: "Tabulador-13"
      });
      total += tabuladorCostos.actividadesFisicas;
      break;
      
    default:
      // Evento básico sin costo específico
      break;
  }
  
  // Costos adicionales por equipamiento/montaje
  if (equipamiento && equipamiento.length > 0) {
    desglose.push({
      concepto: "Montaje/Desmontaje",
      descripcion: "Costo por montaje y desmontaje de equipamiento",
      cantidad: 1,
      precioUnitario: tabuladorCostos.montajeDesmontaje,
      subtotal: tabuladorCostos.montajeDesmontaje,
      referencia: "Tabulador-12"
    });
    total += tabuladorCostos.montajeDesmontaje;
  }
  
  return {
    total,
    desglose,
    moneda: "MXN"
  };
}