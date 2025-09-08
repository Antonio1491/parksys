import { Request, Response } from "express";
import { db } from "./db";
import { 
  events, 
  eventParks, 
  eventResources, 
  eventRegistrations,
  eventStaff,
  eventEvaluations,
  insertEventSchema 
} from "../shared/events-schema";
import { parks, eventCategories, eventImages } from "../shared/schema";
import { eq, and, desc, gte, sql, inArray } from "drizzle-orm";
import { z } from "zod";

// Esquema de validación para registro de participantes
const registerParticipantSchema = z.object({
  name: z.string().min(3, "El nombre es requerido y debe tener al menos 3 caracteres"),
  email: z.string().email("Debe proporcionar un email válido"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

// Obtener todos los eventos con filtros opcionales
export async function getAllEvents(req: Request, res: Response) {
  try {
    const { status, type, park, search, upcoming } = req.query;
    
    // Construir query con JOIN usando SQL directo (igual que actividades)
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    // Aplicar filtros
    if (status) {
      whereConditions.push(`e.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    if (type) {
      whereConditions.push(`e.event_type = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }
    
    if (search) {
      whereConditions.push(`(e.title ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      whereConditions.push(`e.start_date >= $${paramIndex}`);
      queryParams.push(today);
      paramIndex++;
    }
    
    // Para filtrar por parque, necesitamos un join adicional
    let parkJoin = '';
    if (park) {
      const parkId = parseInt(park as string);
      parkJoin = 'INNER JOIN event_parks ep ON e.id = ep.event_id';
      whereConditions.push(`ep.park_id = $${paramIndex}`);
      queryParams.push(parkId);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Usar el query builder de Drizzle con JOIN (más seguro que raw SQL)
    const eventsQuery = db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        eventType: events.eventType,
        targetAudience: events.targetAudience,
        status: events.status,
        startDate: events.startDate,
        endDate: events.endDate,
        startTime: events.startTime,
        endTime: events.endTime,
        isRecurring: events.isRecurring,
        recurrencePattern: events.recurrencePattern,
        location: events.location,
        capacity: events.capacity,
        registrationType: events.registrationType,
        organizerName: events.organizerName,
        organizerEmail: events.organizerEmail,
        organizerPhone: events.organizerPhone,
        organizerOrganization: events.organizerOrganization,
        geolocation: events.geolocation,
        price: events.price,
        isFree: events.isFree,
        requiresApproval: events.requiresApproval,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        imageUrl: eventImages.imageUrl
      })
      .from(events)
      .leftJoin(eventImages, and(
        eq(eventImages.eventId, events.id),
        eq(eventImages.isPrimary, true)
      ))
      .orderBy(desc(events.startDate));

    console.log("🎯 USING DRIZZLE QUERY BUILDER FOR EVENTS");
    const allEvents = await eventsQuery;
    
    // Si la consulta incluye eventos con parques, obtenemos la información de parques
    if (allEvents.length > 0) {
      const eventsWithParks = await Promise.all(
        allEvents.map(async (event) => {
          // Obtener los parques relacionados con este evento
          const eventParkRelations = await db
            .select({
              parkId: eventParks.parkId
            })
            .from(eventParks)
            .where(eq(eventParks.eventId, event.id));
          
          // Obtener los detalles de los parques
          const parkIds = eventParkRelations.map(rel => rel.parkId);
          
          const parkDetails = parkIds.length > 0 
            ? await db
                .select({
                  id: parks.id,
                  name: parks.name,
                  address: parks.address
                })
                .from(parks)
                .where(inArray(parks.id, parkIds))
            : [];
          
          return {
            ...event,
            parks: parkDetails
          };
        })
      );
      
      return res.json(eventsWithParks);
    }
    
    return res.json(allEvents);
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    return res.status(500).json({ message: "Error al obtener eventos", error });
  }
}

// Obtener un evento por ID
export async function getEventById(req: Request, res: Response) {
  try {
    const eventId = parseInt(req.params.id);
    
    // Validar que el ID sea un número válido
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "ID de evento inválido" });
    }
    
    // Usar el query builder de Drizzle con JOIN (más seguro)
    console.log("🎯 GET EVENT BY ID - Using Drizzle query builder for event ID:", eventId);
    
    const eventData = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        eventType: events.eventType,
        targetAudience: events.targetAudience,
        status: events.status,
        startDate: events.startDate,
        endDate: events.endDate,
        startTime: events.startTime,
        endTime: events.endTime,
        isRecurring: events.isRecurring,
        recurrencePattern: events.recurrencePattern,
        location: events.location,
        capacity: events.capacity,
        registrationType: events.registrationType,
        organizerName: events.organizerName,
        organizerEmail: events.organizerEmail,
        organizerPhone: events.organizerPhone,
        organizerOrganization: events.organizerOrganization,
        geolocation: events.geolocation,
        price: events.price,
        isFree: events.isFree,
        requiresApproval: events.requiresApproval,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        imageUrl: eventImages.imageUrl
      })
      .from(events)
      .leftJoin(eventImages, and(
        eq(eventImages.eventId, events.id),
        eq(eventImages.isPrimary, true)
      ))
      .where(eq(events.id, eventId))
      .limit(1);
    
    if (eventData.length === 0) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }
    
    const [event] = eventData;
    
    // Obtener los parques relacionados
    const eventParkRelations = await db
      .select({
        parkId: eventParks.parkId
      })
      .from(eventParks)
      .where(eq(eventParks.eventId, eventId));
    
    // Obtener los detalles de los parques
    const parkIds = eventParkRelations.map(rel => rel.parkId);
    
    const parkDetails = parkIds.length > 0 
      ? await db
          .select({
            id: parks.id,
            name: parks.name,
            address: parks.address
          })
          .from(parks)
          .where(inArray(parks.id, parkIds))
      : [];
    
    // Obtener recursos asignados al evento
    const resources = await db
      .select()
      .from(eventResources)
      .where(eq(eventResources.eventId, eventId));
    
    // Obtener registros de participantes
    const registrations = await db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId));
    
    // Obtener personal y voluntarios asignados
    const staff = await db
      .select()
      .from(eventStaff)
      .where(eq(eventStaff.eventId, eventId));
    
    // Obtener evaluaciones del evento
    const evaluations = await db
      .select()
      .from(eventEvaluations)
      .where(eq(eventEvaluations.eventId, eventId));
    
    // Devolver el evento con toda su información relacionada
    return res.json({
      ...event,
      parks: parkDetails,
      resources,
      registrations,
      staff,
      evaluations
    });
  } catch (error) {
    console.error("Error al obtener evento:", error);
    return res.status(500).json({ message: "Error al obtener evento", error });
  }
}

// Crear un nuevo evento
export async function createEvent(req: Request, res: Response) {
  try {
    console.log("🎯 CREATE EVENT - Datos recibidos:", JSON.stringify(req.body, null, 2));
    
    // Validar los datos de entrada
    const validationResult = insertEventSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      console.error("❌ Validación fallida:", validationResult.error.errors);
      return res.status(400).json({ 
        message: "Datos inválidos", 
        errors: validationResult.error.errors 
      });
    }

    console.log("✅ Validación exitosa, procesando creación del evento...");
    const { parkIds, ...eventDataWithoutParks } = req.body;
    
    // Asegurarse de que hay al menos un parque seleccionado
    if (!parkIds || !Array.isArray(parkIds) || parkIds.length === 0) {
      return res.status(400).json({ 
        message: "Debes seleccionar al menos un parque" 
      });
    }
    
    // Añadir createdById si está disponible
    let createdById = null;
    if (req.headers["x-user-id"]) {
      createdById = parseInt(req.headers["x-user-id"] as string);
    }
    
    // Insertar el evento
    const [createdEvent] = await db
      .insert(events)
      .values({
        ...eventDataWithoutParks,
        createdById,
        // Convertir fechas de string a Date si vienen como string
        startDate: eventDataWithoutParks.startDate instanceof Date 
          ? eventDataWithoutParks.startDate 
          : new Date(eventDataWithoutParks.startDate),
        endDate: eventDataWithoutParks.endDate instanceof Date 
          ? eventDataWithoutParks.endDate 
          : eventDataWithoutParks.endDate ? new Date(eventDataWithoutParks.endDate) : null,
      })
      .returning();
    
    // Relacionar el evento con los parques seleccionados
    const eventParkValues = parkIds.map((parkId: string) => ({
      eventId: createdEvent.id,
      parkId: parseInt(parkId),
    }));
    
    if (eventParkValues.length > 0) {
      await db
        .insert(eventParks)
        .values(eventParkValues);
    }
    
    return res.status(201).json(createdEvent);
  } catch (error) {
    console.error("Error al crear evento:", error);
    return res.status(500).json({ message: "Error al crear evento", error });
  }
}

// Actualizar un evento existente
export async function updateEvent(req: Request, res: Response) {
  try {
    const eventId = parseInt(req.params.id);
    
    // Validar que el ID sea un número válido
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "ID de evento inválido" });
    }
    
    // Verificar que el evento existe
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    
    if (!existingEvent) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }
    
    // Importar el schema de actualización
    const { updateEventSchema } = await import("@shared/events-schema");
    
    // Validar los datos de entrada con el schema de actualización
    const validationResult = updateEventSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      console.log("❌ Errores de validación:", validationResult.error.errors);
      return res.status(400).json({ 
        message: "Datos inválidos", 
        errors: validationResult.error.errors 
      });
    }
    
    const { parkIds, imageUrl, ...eventData } = req.body;
    
    // Asegurarse de que hay al menos un parque seleccionado
    if (!parkIds || !Array.isArray(parkIds) || parkIds.length === 0) {
      return res.status(400).json({ 
        message: "Debes seleccionar al menos un parque" 
      });
    }
    
    console.log('🖼️ [UPDATE-EVENT] Datos procesados:', { parkIds, imageUrl, eventData });
    
    // Actualizar el evento (SIN imageUrl que se maneja por separado)
    const [updatedEvent] = await db
      .update(events)
      .set({
        ...eventData,
        // Convertir fechas de string a Date si vienen como string
        startDate: eventData.startDate instanceof Date 
          ? eventData.startDate 
          : new Date(eventData.startDate),
        endDate: eventData.endDate instanceof Date 
          ? eventData.endDate 
          : eventData.endDate ? new Date(eventData.endDate) : null,
        updatedAt: new Date()
      })
      .where(eq(events.id, eventId))
      .returning();
    
    // Si se proporciona una imagen, manejar la tabla event_images
    if (imageUrl !== undefined) {
      console.log("🖼️ [UPDATE-EVENT] Procesando imagen:", imageUrl);
      
      if (imageUrl && imageUrl.trim() !== '') {
        // Verificar si ya existe una imagen primaria para este evento
        const existingImage = await db
          .select()
          .from(eventImages)
          .where(and(
            eq(eventImages.eventId, eventId),
            eq(eventImages.isPrimary, true)
          ))
          .limit(1);
        
        if (existingImage.length > 0) {
          // Actualizar la imagen existente
          console.log("🔄 [UPDATE-EVENT] Actualizando imagen existente");
          await db
            .update(eventImages)
            .set({
              imageUrl: imageUrl,
              fileName: 'updated-image',
              updatedAt: new Date()
            })
            .where(and(
              eq(eventImages.eventId, eventId),
              eq(eventImages.isPrimary, true)
            ));
        } else {
          // Crear nueva imagen primaria
          console.log("➕ [UPDATE-EVENT] Creando nueva imagen primaria");
          await db
            .insert(eventImages)
            .values({
              eventId: eventId,
              imageUrl: imageUrl,
              fileName: 'event-image',
              fileSize: null,
              mimeType: 'image/jpeg',
              caption: null,
              isPrimary: true,
              uploadedById: 1 // TODO: obtener del contexto de usuario
            });
        }
      } else {
        // Si imageUrl está vacío, eliminar imágenes existentes
        console.log("🗑️ [UPDATE-EVENT] Eliminando imágenes del evento");
        await db
          .delete(eventImages)
          .where(eq(eventImages.eventId, eventId));
      }
    }
    
    // Actualizar las relaciones con parques (eliminar las existentes y crear nuevas)
    await db
      .delete(eventParks)
      .where(eq(eventParks.eventId, eventId));
    
    const eventParkValues = parkIds.map((parkId: string) => ({
      eventId: eventId,
      parkId: parseInt(parkId),
    }));
    
    if (eventParkValues.length > 0) {
      await db
        .insert(eventParks)
        .values(eventParkValues);
    }
    
    return res.json(updatedEvent);
  } catch (error) {
    console.error("Error al actualizar evento:", error);
    return res.status(500).json({ message: "Error al actualizar evento", error });
  }
}

// Eliminar un evento
export async function deleteEvent(req: Request, res: Response) {
  try {
    const eventId = parseInt(req.params.id);
    
    // Validar que el ID sea un número válido
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "ID de evento inválido" });
    }
    
    // Verificar que el evento existe
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    
    if (!existingEvent) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }
    
    // Eliminar el evento (las relaciones se eliminarán en cascada gracias a las referencias)
    await db
      .delete(events)
      .where(eq(events.id, eventId));
    
    return res.json({ message: "Evento eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    return res.status(500).json({ message: "Error al eliminar evento", error });
  }
}

// Obtener eventos de un parque específico
export async function getParkEvents(req: Request, res: Response) {
  try {
    const parkId = parseInt(req.params.id);
    
    // Validar que el ID sea un número válido
    if (isNaN(parkId)) {
      return res.status(400).json({ message: "ID de parque inválido" });
    }
    
    // Primero obtenemos los IDs de los eventos relacionados con este parque
    const eventIds = await db
      .select({ eventId: eventParks.eventId })
      .from(eventParks)
      .where(eq(eventParks.parkId, parkId));
    
    if (eventIds.length === 0) {
      return res.json([]);
    }
    
    const ids = eventIds.map(item => item.eventId);
    
    // Obtenemos los eventos
    const parkEvents = await db
      .select()
      .from(events)
      .where(inArray(events.id, ids))
      .orderBy(desc(events.startDate));
    
    return res.json(parkEvents);
  } catch (error) {
    console.error("Error al obtener eventos del parque:", error);
    return res.status(500).json({ message: "Error al obtener eventos del parque", error });
  }
}

// Obtener datos de referencia para eventos (tipos, audiencias, estados)
export async function getEventReferenceData(req: Request, res: Response) {
  try {
    // Estos datos podrían venir de la base de datos en un entorno de producción
    const referenceData = {
      eventTypes: ["sports", "cultural", "environmental", "social", "educational", "recreational", "health", "other"],
      targetAudiences: ["children", "youth", "adults", "seniors", "families", "all"],
      eventStatuses: ["draft", "published", "canceled", "postponed", "completed"],
      registrationTypes: ["free", "registration", "paid"]
    };
    
    return res.json(referenceData);
  } catch (error) {
    console.error("Error al obtener datos de referencia:", error);
    return res.status(500).json({ message: "Error al obtener datos de referencia", error });
  }
}

// Obtener participantes de un evento
export async function getEventParticipants(req: Request, res: Response) {
  try {
    const eventId = parseInt(req.params.id);
    
    // Validar que el ID sea un número válido
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "ID de evento inválido" });
    }
    
    // Verificar que el evento existe
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    
    if (!event) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }
    
    // Obtener los participantes
    const participants = await db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId))
      .orderBy(desc(eventRegistrations.registrationDate));
    
    // Mapear los datos para ajustarlos al formato esperado por el frontend
    const formattedParticipants = participants.map(p => ({
      id: p.id,
      eventId: p.eventId,
      name: p.fullName,
      email: p.email,
      phone: p.phone,
      status: p.status,
      notes: p.notes,
      registrationDate: p.registrationDate,
    }));
    
    return res.json(formattedParticipants);
  } catch (error) {
    console.error("Error al obtener participantes:", error);
    return res.status(500).json({ message: "Error al obtener participantes", error });
  }
}

// Registrar un nuevo participante en un evento
export async function registerParticipant(req: Request, res: Response) {
  try {
    const eventId = parseInt(req.params.id);
    
    // Validar que el ID sea un número válido
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "ID de evento inválido" });
    }
    
    // Verificar que el evento existe
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    
    if (!event) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }
    
    // Validar datos del formulario
    const validationResult = registerParticipantSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Datos inválidos", 
        errors: validationResult.error.errors 
      });
    }
    
    const { name, email, phone, notes } = req.body;
    
    // Verificar si ya existe un registro con el mismo email para este evento
    if (email) {
      const existingRegistration = await db
        .select()
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, eventId),
            eq(eventRegistrations.email, email)
          )
        );
      
      if (existingRegistration.length > 0) {
        return res.status(409).json({ 
          message: "Este email ya está registrado para este evento" 
        });
      }
    }
    
    // Verificar capacidad del evento
    if (event.capacity) {
      const currentParticipants = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, eventId));
      
      const count = Number(currentParticipants[0].count);
      
      if (count >= event.capacity) {
        return res.status(409).json({ 
          message: "El evento ha alcanzado su capacidad máxima" 
        });
      }
    }
    
    // Registrar al participante
    const [registration] = await db
      .insert(eventRegistrations)
      .values({
        eventId,
        fullName: name,
        email,
        phone: phone || null,
        notes: notes || null,
        status: "registered",
        registrationDate: new Date(),
      })
      .returning();
    
    // Mapear los datos para ajustarlos al formato esperado por el frontend
    const formattedRegistration = {
      id: registration.id,
      eventId: registration.eventId,
      name: registration.fullName,
      email: registration.email,
      phone: registration.phone,
      status: registration.status,
      notes: registration.notes,
      registrationDate: registration.registrationDate,
    };
    
    return res.status(201).json(formattedRegistration);
  } catch (error) {
    console.error("Error al registrar participante:", error);
    return res.status(500).json({ message: "Error al registrar participante", error });
  }
}

// Actualizar estado de un participante
export async function updateParticipantStatus(req: Request, res: Response) {
  try {
    const eventId = parseInt(req.params.eventId);
    const participantId = parseInt(req.params.id);
    const { status } = req.body;
    
    // Validar que los IDs sean números válidos
    if (isNaN(eventId) || isNaN(participantId)) {
      return res.status(400).json({ message: "IDs inválidos" });
    }
    
    // Validar el estado
    if (!["registered", "confirmed", "attended", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Estado inválido" });
    }
    
    // Verificar que el registro existe
    const [existingRegistration] = await db
      .select()
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.id, participantId),
          eq(eventRegistrations.eventId, eventId)
        )
      );
    
    if (!existingRegistration) {
      return res.status(404).json({ message: "Registro de participante no encontrado" });
    }
    
    // Actualizar el estado
    const [updatedRegistration] = await db
      .update(eventRegistrations)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(eventRegistrations.id, participantId))
      .returning();
    
    // Mapear los datos para ajustarlos al formato esperado por el frontend
    const formattedRegistration = {
      id: updatedRegistration.id,
      eventId: updatedRegistration.eventId,
      name: updatedRegistration.fullName,
      email: updatedRegistration.email,
      phone: updatedRegistration.phone,
      status: updatedRegistration.status,
      notes: updatedRegistration.notes,
      registrationDate: updatedRegistration.registrationDate,
    };
    
    return res.json(formattedRegistration);
  } catch (error) {
    console.error("Error al actualizar estado del participante:", error);
    return res.status(500).json({ message: "Error al actualizar estado del participante", error });
  }
}

// Obtener estadísticas de eventos
export async function getEventStats(req: Request, res: Response) {
  try {
    // Obtener total de eventos
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(events);
    const total = Number(totalResult[0].count);

    // Obtener eventos publicados
    const publishedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.status, 'published'));
    const published = Number(publishedResult[0].count);

    // Obtener eventos en borrador
    const draftResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.status, 'draft'));
    const draft = Number(draftResult[0].count);

    // Obtener eventos próximos (futuras fechas)
    const today = new Date().toISOString().split('T')[0];
    const upcomingResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(sql`${events.startDate} >= ${today}`);
    const upcoming = Number(upcomingResult[0].count);

    // Obtener número de categorías
    const categoriesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventCategories);
    const categories = Number(categoriesResult[0].count);

    const stats = {
      total,
      published,
      draft,
      upcoming,
      categories
    };

    return res.json(stats);
  } catch (error) {
    console.error("Error al obtener estadísticas de eventos:", error);
    return res.status(500).json({ message: "Error al obtener estadísticas de eventos", error });
  }
}

// Obtener eventos recientes
export async function getRecentEvents(req: Request, res: Response) {
  try {
    const recentEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        eventType: events.eventType,
        status: events.status,
        startDate: events.startDate,
        endDate: events.endDate,
        location: events.location,
        capacity: events.capacity,
        featuredImageUrl: events.featuredImageUrl,
        createdAt: events.createdAt
      })
      .from(events)
      .orderBy(desc(events.createdAt))
      .limit(10);

    return res.json(recentEvents);
  } catch (error) {
    console.error("Error al obtener eventos recientes:", error);
    return res.status(500).json({ message: "Error al obtener eventos recientes", error });
  }
}