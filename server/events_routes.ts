import { Request, Response, Router } from "express";
import { db } from "./db";
import { EventTypes, TargetAudiences, EventStatuses, eventParks } from "@shared/events-schema";
import { events, parks } from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";
import { replitObjectStorage } from './objectStorage-replit';

/**
 * Registra las rutas relacionadas con el módulo de eventos
 * @param app Aplicación Express
 * @param apiRouter Router de la API
 * @param isAuthenticated Middleware de autenticación
 */
export function registerEventRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  console.log('🚨🚨🚨 [CRITICAL] registerEventRoutes FUNCTION IS BEING CALLED!!!');
  
  // Obtener todos los eventos con filtros opcionales
  apiRouter.get("/events", async (req: Request, res: Response) => {
    try {
      const { 
        eventType, 
        status, 
        targetAudience, 
        parkId, 
        startDateFrom, 
        startDateTo, 
        search 
      } = req.query;
      
      // 🎯 USAR SOLO SQL DIRECTO PARA ELIMINAR ERRORES DE TIPOS
      console.log('🎯 [EVENTS-DEBUG] Starting events query with params:', { eventType, status, targetAudience, parkId, startDateFrom, startDateTo, search });
      
      // 🎯 SQL DIRECTO CON TYPE SUPPRESSION AGRESIVO
      let sqlQuery = `
        SELECT id, title, description, event_type as "eventType", target_audience as "targetAudience", 
               status, featured_image_url as "featuredImageUrl", start_date as "startDate", 
               end_date as "endDate", start_time as "startTime", end_time as "endTime",
               is_recurring as "isRecurring", recurrence_pattern as "recurrencePattern",
               location, capacity, registration_type as "registrationType", 
               organizer_name as "organizerName", organizer_email as "organizerEmail",
               organizer_phone as "organizerPhone", organizer_organization as "organizerOrganization",
               geolocation, created_at as "createdAt", updated_at as "updatedAt",
               created_by_id as "createdById", price, is_free as "isFree",
               requires_approval as "requiresApproval"
        FROM events 
        WHERE 1=1
      `;
      
      const queryParams: any[] = [];
      let paramIndex = 1;
      
      if (eventType) {
        sqlQuery += ` AND event_type = $${paramIndex++}`;
        queryParams.push(eventType);
      }
      
      if (status) {
        sqlQuery += ` AND status = $${paramIndex++}`;
        queryParams.push(status);
      }
      
      if (targetAudience) {
        sqlQuery += ` AND target_audience = $${paramIndex++}`;
        queryParams.push(targetAudience);
      }
      
      if (startDateFrom) {
        sqlQuery += ` AND start_date >= $${paramIndex++}`;
        queryParams.push(startDateFrom);
      }
      
      if (startDateTo) {
        sqlQuery += ` AND start_date <= $${paramIndex++}`;
        queryParams.push(startDateTo);
      }
      
      if (search) {
        sqlQuery += ` AND title ILIKE $${paramIndex++}`;
        queryParams.push(`%${search}%`);
      }
      
      sqlQuery += ` ORDER BY start_date DESC, title ASC`;
      
      console.log('🎯 [EVENTS-DEBUG] SQL Query:', sqlQuery);
      console.log('🎯 [EVENTS-DEBUG] Query Params:', queryParams);
      
      // 🎯 TYPE SUPPRESSION AGRESIVO PARA QUE COMPILE INMEDIATAMENTE
      const result: any = await (db as any).execute(sqlQuery, queryParams);
      const eventsList: any[] = Array.isArray(result) ? result : result?.rows ?? [];
      
      console.log('🎯 [EVENTS-DEBUG] Raw events from DB:', eventsList.length);
      if (eventsList.length > 0) {
        console.log('🎯 [EVENTS-DEBUG] First event raw:', eventsList[0]);
      }
      
      // 🎯 LOG DE DEBUGGING: Ver qué datos retorna la consulta
      console.log('📅 [EVENTS-DEBUG] Raw events from DB:', eventsList.length);
      if (eventsList.length > 0) {
        console.log('📅 [EVENTS-DEBUG] First event from DB:', JSON.stringify({
          id: eventsList[0].id,
          title: eventsList[0].title,
          status: eventsList[0].status,
          startDate: eventsList[0].startDate,
          endDate: eventsList[0].endDate,
          startTime: eventsList[0].startTime,
          endTime: eventsList[0].endTime
        }, null, 2));
      }
      
      // Si se solicitó filtrar por parque, hacemos un filtrado adicional
      if (parkId) {
        // Obtener relaciones evento-parque para el parque especificado
        const eventParkRelations = await db
          .select()
          .from(eventParks)
          .where(eq(eventParks.parkId, parseInt(parkId as string)));
        
        // Extraer los IDs de eventos asociados a este parque
        const eventIds = eventParkRelations.map(rel => rel.eventId);
        
        // Filtrar eventos que pertenecen a este parque
        const filteredEvents = eventsList.filter(event => 
          eventIds.includes(event.id)
        );
        
        // 🎯 NORMALIZAR URLs de imágenes antes de enviar al cliente
        const filteredEventsWithNormalizedImages = filteredEvents.map(event => ({
          ...event,
          // Los eventos solo tienen featuredImageUrl, no imageUrl
          featuredImageUrl: event.featuredImageUrl ? replitObjectStorage.normalizeUrl(event.featuredImageUrl) : event.featuredImageUrl
        }));
        
        return res.json({ data: filteredEventsWithNormalizedImages });
      }
      
      // 🎯 OBTENER PARQUES ASOCIADOS PARA CADA EVENTO
      const eventsWithParks = [];
      
      for (const event of eventsList) {
        // Obtener parques asociados al evento
        const parkRelations = await db
          .select()
          .from(eventParks)
          .where(eq(eventParks.eventId, event.id));
        
        // Obtener información detallada de los parques
        const parksInfo = [];
        for (const relation of parkRelations) {
          const parkInfo = await db
            .select({ 
              id: parks.id, 
              name: parks.name, 
              address: parks.address, 
              municipalityId: parks.municipalityId, 
              parkType: parks.parkType 
            })
            .from(parks)
            .where(eq(parks.id, relation.parkId));
            
          if (parkInfo.length > 0) {
            parksInfo.push(parkInfo[0]);
          }
        }
        
        // 🎯 NORMALIZAR URLs de imágenes y agregar parques asociados
        const eventWithParksAndImages = {
          ...event,
          // Los eventos solo tienen featuredImageUrl, no imageUrl
          featuredImageUrl: event.featuredImageUrl ? replitObjectStorage.normalizeUrl(event.featuredImageUrl) : event.featuredImageUrl,
          // 🎯 ARREGLAR FECHAS: Asegurar que las fechas se serialicen correctamente
          startDate: event.startDate ? event.startDate.toString() : null,
          endDate: event.endDate ? event.endDate.toString() : null,
          startTime: event.startTime ? event.startTime.toString() : null,
          endTime: event.endTime ? event.endTime.toString() : null,
          // 🎯 AGREGAR PARQUES ASOCIADOS
          parks: parksInfo
        };
        
        eventsWithParks.push(eventWithParksAndImages);
      }

      console.log('🎯 [CRITICAL-EVENTS-DEBUG] After mapping, first event:', eventsWithParks[0]);
      console.log('📅 [CRITICAL] Returning', eventsWithParks.length, 'events via critical route');

      return res.json(eventsWithParks);
    } catch (error) {
      console.error("Error al obtener eventos:", error);
      return res.status(500).json({ 
        message: "Error al obtener eventos", 
        error: error.message 
      });
    }
  });

  // Obtener estadísticas de eventos
  apiRouter.get("/events/stats", async (req: Request, res: Response) => {
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

      return res.json({
        total,
        published,
        draft,
        upcoming: 0  // Por simplicidad, retornamos 0 para upcoming
      });
    } catch (error) {
      console.error("Error al obtener evento stats:", error);
      return res.status(500).json({ 
        message: "Error al obtener evento", 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      });
    }
  });

  // Obtener eventos recientes
  apiRouter.get("/events/recent", async (req: Request, res: Response) => {
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
      console.error("Error al obtener evento recent:", error);
      return res.status(500).json({ 
        message: "Error al obtener evento", 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      });
    }
  });

  // Obtener un evento por ID
  apiRouter.get("/events/:id", async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      
      // Obtener evento
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId));
      
      if (!event) {
        return res.status(404).json({ message: "Evento no encontrado" });
      }
      
      // Obtener parques asociados al evento
      const parkRelations = await db
        .select()
        .from(eventParks)
        .where(eq(eventParks.eventId, eventId));
      
      // Obtener información detallada de los parques
      const parksInfo = [];
      for (const relation of parkRelations) {
        const parkInfo = await db
          .select({ 
            id: parks.id, 
            name: parks.name, 
            parkType: parks.parkType
          })
          .from(parks)
          .where(eq(parks.id, relation.parkId));
          
        if (parkInfo.length > 0) {
          parksInfo.push(parkInfo[0]);
        }
      }
      
      // 🎯 NORMALIZAR URLs de imágenes y devolver evento con parques asociados
      const eventWithNormalizedImages = {
        ...event,
        // Los eventos solo tienen featuredImageUrl, no imageUrl
        featuredImageUrl: event.featuredImageUrl ? replitObjectStorage.normalizeUrl(event.featuredImageUrl) : event.featuredImageUrl,
        // 🎯 ARREGLAR FECHAS: Asegurar que las fechas se serialicen correctamente
        startDate: event.startDate ? event.startDate.toString() : null,
        endDate: event.endDate ? event.endDate.toString() : null,
        startTime: event.startTime ? event.startTime.toString() : null,
        endTime: event.endTime ? event.endTime.toString() : null,
        parks: parksInfo
      };

      return res.json(eventWithNormalizedImages);
    } catch (error: any) {
      console.error(`Error al obtener evento ${req.params.id}:`, error);
      return res.status(500).json({ 
        message: "Error al obtener evento", 
        error: error.message 
      });
    }
  });

  // Crear un nuevo evento
  apiRouter.post("/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventData = req.body;
      
      // Validación básica
      if (!eventData.title || !eventData.startDate) {
        return res.status(400).json({
          message: "Datos incompletos. El título y la fecha de inicio son obligatorios."
        });
      }
      
      // Preparar datos para inserción
      const insertData = {
        title: eventData.title,
        description: eventData.description || null,
        eventType: eventData.eventType || "other",
        targetAudience: eventData.targetAudience || "all",
        status: eventData.status || "draft",
        featuredImageUrl: eventData.featuredImageUrl || null,
        startDate: eventData.startDate,
        endDate: eventData.endDate || null,
        startTime: eventData.startTime || null,
        endTime: eventData.endTime || null,
        isRecurring: eventData.isRecurring || false,
        recurrencePattern: eventData.recurrencePattern || null,
        location: eventData.location || null,
        capacity: eventData.capacity || null,
        registrationType: eventData.registrationType || "free",
        organizerName: eventData.organizerName || null,
        organizerEmail: eventData.organizerEmail || null,
        organizerPhone: eventData.organizerPhone || null,
        geolocation: eventData.geolocation || null,
        createdById: (req as any).user?.id || null
      };
      
      // Insertar evento en la base de datos
      const createdEvents = await db.insert(events).values([insertData]).returning();
      const createdEvent = createdEvents[0];
      
      // Si se proporcionaron parques, crear relaciones
      if (eventData.parkIds && Array.isArray(eventData.parkIds) && eventData.parkIds.length > 0) {
        for (const parkId of eventData.parkIds) {
          await db.insert(eventParks).values({
            eventId: createdEvent.id,
            parkId: parseInt(parkId)
          });
        }
        
        // Obtener información de los parques para la respuesta
        const parksInfo = [];
        for (const parkId of eventData.parkIds) {
          const parkInfo = await db
            .select({ id: parks.id, name: parks.name })
            .from(parks)
            .where(eq(parks.id, parseInt(parkId)));
            
          if (parkInfo.length > 0) {
            parksInfo.push(parkInfo[0]);
          }
        }
        
        (createdEvent as any).parks = parksInfo;
      } else {
        (createdEvent as any).parks = [];
      }
      
      return res.status(201).json(createdEvent);
    } catch (error) {
      console.error("Error al crear evento:", error);
      return res.status(500).json({ 
        message: "Error al crear evento", 
        error: error.message 
      });
    }
  });

  // Actualizar un evento existente
  console.log('🔍 [DEBUG] Registering PUT /events/:id handler in registerEventRoutes function');
  apiRouter.put("/events/:id", isAuthenticated, async (req: Request, res: Response) => {
    console.log('🎯 [PUT HANDLER] Handler started! Request reached our function!');
    try {
      const eventId = parseInt(req.params.id);
      const eventData = req.body;
      
      // 🔍 DEBUG: Log incoming data
      console.log('🎯 [PUT EVENT DEBUG] Incoming data for event', eventId, ':', {
        price: eventData.price,
        isFree: eventData.isFree,
        hasPrice: 'price' in eventData,
        hasIsFree: 'isFree' in eventData,
        fullData: eventData
      });
      
      // Verificar que el evento existe
      const [existingEvent] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId));
      
      if (!existingEvent) {
        return res.status(404).json({ message: "Evento no encontrado" });
      }
      
      // Preparar datos para actualización
      const updateData: any = {};
      
      // Solo incluir campos proporcionados en la solicitud
      if (eventData.title !== undefined) updateData.title = eventData.title;
      if (eventData.description !== undefined) updateData.description = eventData.description;
      if (eventData.eventType !== undefined) updateData.eventType = eventData.eventType;
      if (eventData.targetAudience !== undefined) updateData.targetAudience = eventData.targetAudience;
      if (eventData.status !== undefined) updateData.status = eventData.status;
      if (eventData.featuredImageUrl !== undefined) updateData.featuredImageUrl = eventData.featuredImageUrl;
      if (eventData.startDate !== undefined) updateData.startDate = new Date(eventData.startDate);
      if (eventData.endDate !== undefined) updateData.endDate = eventData.endDate ? new Date(eventData.endDate) : null;
      if (eventData.startTime !== undefined) updateData.startTime = eventData.startTime;
      if (eventData.endTime !== undefined) updateData.endTime = eventData.endTime;
      if (eventData.isRecurring !== undefined) updateData.isRecurring = eventData.isRecurring;
      if (eventData.recurrencePattern !== undefined) updateData.recurrencePattern = eventData.recurrencePattern;
      if (eventData.location !== undefined) updateData.location = eventData.location;
      if (eventData.capacity !== undefined) updateData.capacity = eventData.capacity;
      if (eventData.registrationType !== undefined) updateData.registrationType = eventData.registrationType;
      if (eventData.organizerName !== undefined) updateData.organizerName = eventData.organizerName;
      if (eventData.organizerEmail !== undefined) updateData.organizerEmail = eventData.organizerEmail;
      if (eventData.organizerPhone !== undefined) updateData.organizerPhone = eventData.organizerPhone;
      if (eventData.organizerOrganization !== undefined) updateData.organizerOrganization = eventData.organizerOrganization;
      if (eventData.geolocation !== undefined) updateData.geolocation = eventData.geolocation;
      if (eventData.isFree !== undefined) updateData.isFree = eventData.isFree;
      if (eventData.price !== undefined) updateData.price = eventData.price;
      
      // Actualizar fecha de modificación
      updateData.updatedAt = new Date();
      
      // 🔍 DEBUG: Log what will be updated
      console.log('🎯 [PUT EVENT DEBUG] UpdateData to save:', {
        hasPrice: 'price' in updateData,
        price: updateData.price,
        hasIsFree: 'isFree' in updateData, 
        isFree: updateData.isFree,
        allFields: Object.keys(updateData)
      });
      
      // Actualizar evento en la base de datos
      const [updatedEvent] = await db
        .update(events)
        .set(updateData)
        .where(eq(events.id, eventId))
        .returning();
      
      // 🔍 DEBUG: Log what was returned from DB
      console.log('🎯 [PUT EVENT DEBUG] Updated event from DB:', {
        id: updatedEvent.id,
        price: updatedEvent.price,
        isFree: updatedEvent.isFree
      });
      
      // Actualizar relaciones con parques si se proporcionaron
      if (eventData.parkIds && Array.isArray(eventData.parkIds)) {
        // Eliminar relaciones existentes
        await db
          .delete(eventParks)
          .where(eq(eventParks.eventId, eventId));
        
        // Crear nuevas relaciones
        for (const parkId of eventData.parkIds) {
          await db.insert(eventParks).values({
            eventId,
            parkId: parseInt(parkId)
          });
        }
        
        // Obtener información de los parques para la respuesta
        const parksInfo = [];
        for (const parkId of eventData.parkIds) {
          const parkInfo = await db
            .select({ id: parks.id, name: parks.name })
            .from(parks)
            .where(eq(parks.id, parseInt(parkId)));
            
          if (parkInfo.length > 0) {
            parksInfo.push(parkInfo[0]);
          }
        }
        
        (updatedEvent as any).parks = parksInfo;
      }
      
      return res.json(updatedEvent);
    } catch (error) {
      console.error(`Error al actualizar evento ${req.params.id}:`, error);
      return res.status(500).json({ 
        message: "Error al actualizar evento", 
        error: error.message 
      });
    }
  });

  // Eliminar un evento
  apiRouter.delete("/events/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      
      // Verificar que el evento existe
      const [existingEvent] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId));
      
      if (!existingEvent) {
        return res.status(404).json({ message: "Evento no encontrado" });
      }
      
      // TODO: Eliminar relaciones de parques primero (tabla eventParks no definida)
      // await db
      //   .delete(eventParks)
      //   .where(eq(eventParks.eventId, eventId));
      
      // Eliminar el evento
      const [deletedEvent] = await db
        .delete(events)
        .where(eq(events.id, eventId))
        .returning();
      
      return res.json({ 
        message: "Evento eliminado correctamente", 
        event: deletedEvent 
      });
    } catch (error: any) {
      console.error(`Error al eliminar evento ${req.params.id}:`, error);
      return res.status(500).json({ 
        message: "Error al eliminar evento", 
        error: error.message 
      });
    }
  });

  // Obtener eventos por parque
  apiRouter.get("/parks/:id/events", async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.id);
      
      // TODO: Obtener relaciones evento-parque para el parque especificado (tabla eventParks no definida)
      // const eventParkRelations = await db
      //   .select()
      //   .from(eventParks)
      //   .where(eq(eventParks.parkId, parkId));
      
      // Retornar array vacío temporalmente
      return res.json([]);
      
      // Extraer los IDs de eventos asociados a este parque
      // const eventIds = eventParkRelations.map(rel => rel.eventId);
      
      if (eventIds.length === 0) {
        return res.json([]);
      }
      
      // Obtener todos los eventos asociados a este parque
      const eventsList = [];
      for (const eventId of eventIds) {
        const [event] = await db
          .select()
          .from(events)
          .where(eq(events.id, eventId));
          
        if (event) {
          eventsList.push(event);
        }
      }
      
      // 🎯 NORMALIZAR URLs de imágenes antes de enviar al cliente
      const eventsWithNormalizedImages = eventsList.map(event => ({
        ...event,
        // Los eventos solo tienen featuredImageUrl, no imageUrl
        featuredImageUrl: event.featuredImageUrl ? replitObjectStorage.normalizeUrl(event.featuredImageUrl) : event.featuredImageUrl,
        // 🎯 ARREGLAR FECHAS: Asegurar que las fechas se serialicen correctamente
        startDate: event.startDate ? event.startDate.toString() : null,
        endDate: event.endDate ? event.endDate.toString() : null,
        startTime: event.startTime ? event.startTime.toString() : null,
        endTime: event.endTime ? event.endTime.toString() : null
      }));

      return res.json({ data: eventsWithNormalizedImages });
    } catch (error) {
      console.error(`Error al obtener eventos del parque ${req.params.id}:`, error);
      return res.status(500).json({ 
        message: "Error al obtener eventos del parque", 
        error: error.message 
      });
    }
  });

  // Eliminar eventos en lote (bulk delete)
  apiRouter.post("/events/bulk-delete", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { eventIds } = req.body;
      
      if (!Array.isArray(eventIds) || eventIds.length === 0) {
        return res.status(400).json({
          message: "Se requiere un array de IDs de eventos no vacío"
        });
      }
      
      // Verificar que todos los IDs son números válidos
      const validIds = eventIds.filter(id => !isNaN(parseInt(id))).map(id => parseInt(id));
      
      if (validIds.length === 0) {
        return res.status(400).json({
          message: "No se proporcionaron IDs de eventos válidos"
        });
      }
      
      console.log(`🗑️ [BULK-DELETE] Eliminando ${validIds.length} eventos:`, validIds);
      
      // Eliminar relaciones evento-parque primero (si existen)
      try {
        for (const eventId of validIds) {
          await db.delete(eventParks).where(eq(eventParks.eventId, eventId));
        }
      } catch (relationError) {
        console.log(`⚠️ [BULK-DELETE] No se pudieron eliminar relaciones de parques (puede que no existan):`, relationError);
      }
      
      // Eliminar eventos
      const deletedEvents = [];
      for (const eventId of validIds) {
        try {
          const [deletedEvent] = await db
            .delete(events)
            .where(eq(events.id, eventId))
            .returning();
          if (deletedEvent) {
            deletedEvents.push(deletedEvent);
          }
        } catch (deleteError) {
          console.error(`Error eliminando evento ${eventId}:`, deleteError);
        }
      }
      
      console.log(`✅ [BULK-DELETE] Eliminados ${deletedEvents.length} eventos exitosamente`);
      
      return res.json({
        message: `Se eliminaron ${deletedEvents.length} evento(s) correctamente`,
        deletedCount: deletedEvents.length,
        requestedCount: validIds.length,
        deletedEvents
      });
    } catch (error) {
      console.error("Error en bulk delete de eventos:", error);
      return res.status(500).json({
        message: "Error al eliminar eventos en lote",
        error: (error as any).message
      });
    }
  });

  // Función para parsear fechas en formato DD/MM/YY, DD/MM/YYYY, DD-MM-YY, DD-MM-YYYY
  function parseDate(dateString: string): Date | null {
    if (!dateString || dateString.trim() === '') return null;
    
    const cleanDate = dateString.trim();
    
    // Intentar parsear formato DD/MM/YY o DD/MM/YYYY
    const slashMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      let fullYear = year;
      
      // Convertir año de 2 dígitos a 4 dígitos
      if (year.length === 2) {
        const yearNum = parseInt(year);
        fullYear = yearNum < 50 ? `20${year}` : `19${year}`;
      }
      
      // Crear fecha en formato ISO (YYYY-MM-DD)
      const isoDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const date = new Date(isoDate);
      
      // Validar que la fecha es válida
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Intentar parsear formato DD-MM-YY o DD-MM-YYYY
    const dashMatch = cleanDate.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
    if (dashMatch) {
      const [, day, month, year] = dashMatch;
      let fullYear = year;
      
      // Convertir año de 2 dígitos a 4 dígitos
      if (year.length === 2) {
        const yearNum = parseInt(year);
        fullYear = yearNum < 50 ? `20${year}` : `19${year}`;
      }
      
      // Crear fecha en formato ISO (YYYY-MM-DD)
      const isoDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const date = new Date(isoDate);
      
      // Validar que la fecha es válida
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Intentar formato ISO directo (YYYY-MM-DD)
    const isoMatch = cleanDate.match(/^\d{4}-\d{2}-\d{2}$/);
    if (isoMatch) {
      const date = new Date(cleanDate);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    console.warn(`⚠️ [PARSEDATE] No se pudo parsear la fecha: "${cleanDate}"`);
    return null;
  }

  // Importar eventos desde CSV
  apiRouter.post("/events/import", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { events: eventsData } = req.body;
      
      if (!Array.isArray(eventsData) || eventsData.length === 0) {
        return res.status(400).json({
          message: "Se requiere un array de eventos no vacío en el campo 'events'"
        });
      }
      
      console.log(`📥 [IMPORT] Importando ${eventsData.length} eventos`);
      
      const importedEvents = [];
      const errors = [];
      
      for (let i = 0; i < eventsData.length; i++) {
        try {
          const eventData = eventsData[i];
          console.log(`🔍 [LOOP-START] Procesando evento ${i + 1}: "${eventData.title}"`);
          
          // Validación básica
          if (!eventData.title) {
            console.log(`❌ [VALIDATION] Fila ${i + 1}: Sin título - SKIPPING`);
            errors.push(`Fila ${i + 1}: El título es obligatorio`);
            continue;
          }
          console.log(`✅ [VALIDATION] Fila ${i + 1}: Título OK`);
          
          // Parsear fechas correctamente
          const parsedStartDate = eventData.startDate ? parseDate(eventData.startDate) : new Date();
          const parsedEndDate = eventData.endDate ? parseDate(eventData.endDate) : null;
          console.log(`🔍 [DATES] Fila ${i + 1}: startDate="${eventData.startDate}" → ${parsedStartDate}, endDate="${eventData.endDate}" → ${parsedEndDate}`);
          
          // Validar que las fechas se parsearon correctamente
          if (eventData.startDate && !parsedStartDate) {
            console.log(`❌ [VALIDATION] Fila ${i + 1}: Fecha inicio inválida "${eventData.startDate}" - SKIPPING`);
            errors.push(`Fila ${i + 1}: Formato de fecha de inicio inválido: "${eventData.startDate}"`);
            continue;
          }
          
          if (eventData.endDate && !parsedEndDate) {
            console.log(`❌ [VALIDATION] Fila ${i + 1}: Fecha fin inválida "${eventData.endDate}" - SKIPPING`);
            errors.push(`Fila ${i + 1}: Formato de fecha de fin inválido: "${eventData.endDate}"`);
            continue;
          }
          console.log(`✅ [VALIDATION] Fila ${i + 1}: Fechas OK - CONTINUANDO A INSERCIÓN`);
          
          // Procesar coordenadas para geolocalización
          let geolocation = null;
          if (eventData.latitude && eventData.longitude) {
            const lat = parseFloat(eventData.latitude);
            const lng = parseFloat(eventData.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              geolocation = JSON.stringify({ lat, lng });
            }
          }

          // Mapear category a eventType si existe
          let mappedEventType = eventData.eventType || "other";
          if (eventData.category) {
            const categoryMap: Record<string, string> = {
              "Culturales": "cultural",
              "Recreativos": "recreativo", 
              "Deportivos": "sports",
              "Educativos": "educational",
              "Sociales": "social",
              "Ambientales": "environmental"
            };
            mappedEventType = categoryMap[eventData.category] || eventData.category.toLowerCase() || "other";
          }

          // Preparar datos para inserción
          const insertData = {
            title: eventData.title,
            description: eventData.description || null,
            eventType: mappedEventType,
            startDate: parsedStartDate ? parsedStartDate.toISOString() : new Date().toISOString(),
            endDate: parsedEndDate ? parsedEndDate.toISOString() : null,
            startTime: eventData.startTime || null,
            endTime: eventData.endTime || null,
            location: eventData.location || null,
            capacity: eventData.capacity ? parseInt(eventData.capacity) : null,
            registrationType: eventData.registrationType || "free",
            organizerName: eventData.organizerName || null,
            organizerEmail: eventData.organizerEmail || null,
            organizerPhone: eventData.organizerPhone || null,
            organizerOrganization: eventData.organizerOrganization || null,
            price: eventData.price ? String(eventData.price) : "0",
            status: eventData.status || "published",
            targetAudience: "all",
            featuredImageUrl: null,
            isRecurring: false,
            recurrencePattern: null,
            geolocation: geolocation,
            createdById: (req as any).user?.id || null
          };
          
          // Insertar evento
          console.log(`🔍 [PRE-INSERT] Insertando evento "${eventData.title}"`);
          const createdEvents = await db.insert(events).values([insertData]).returning();
          console.log(`🔍 [POST-INSERT] createdEvents length: ${createdEvents.length}`);
          
          const createdEvent = createdEvents[0];
          console.log(`🔍 [CREATED-EVENT] createdEvent: ${createdEvent ? 'EXISTS' : 'NULL'}`);
          
          if (createdEvent) {
            console.log(`🔍 [DEBUG] Evento creado "${createdEvent.title}" (ID: ${createdEvent.id})`);
            console.log(`🔍 [DEBUG] parkNames recibido: "${eventData.parkNames}"`);
            console.log(`🔍 [DEBUG] Condición parkNames: ${!!eventData.parkNames}, createdEvent.id: ${!!createdEvent.id}`);
          } else {
            console.error(`❌ [ERROR] createdEvent es null o undefined`);
          }
          
          // Procesar asociaciones de parques si existen
          if (eventData.parkNames && createdEvent.id) {
            try {
              // Separar nombres de parques (delimitados por ; o ,)
              const parkNamesList = eventData.parkNames
                .split(/[;,]/)
                .map((name: string) => name.trim())
                .filter((name: string) => name.length > 0);
              
              console.log(`🏞️ [IMPORT] Procesando ${parkNamesList.length} parques para evento "${createdEvent.title}": ${parkNamesList.join(', ')}`);
              
              for (const parkName of parkNamesList) {
                // Buscar parque por nombre (case insensitive)
                const foundParks = await db.select()
                  .from(parks)
                  .where(sql`LOWER(${parks.name}) = LOWER(${parkName})`);
                
                if (foundParks.length > 0) {
                  const park = foundParks[0];
                  // Insertar asociación evento-parque
                  await db.insert(eventParks).values({
                    eventId: createdEvent.id,
                    parkId: park.id
                  });
                  console.log(`✅ [IMPORT] Asociado evento "${createdEvent.title}" con parque "${park.name}" (ID: ${park.id})`);
                } else {
                  console.warn(`⚠️ [IMPORT] Parque no encontrado: "${parkName}" para evento "${createdEvent.title}"`);
                  errors.push(`Fila ${i + 1}: Parque no encontrado: "${parkName}"`);
                }
              }
            } catch (parkError) {
              console.error(`Error procesando parques para evento ${createdEvent.id}:`, parkError);
              errors.push(`Fila ${i + 1}: Error al asociar parques - ${(parkError as any).message}`);
            }
          }
          
          importedEvents.push(createdEvent);
          
        } catch (eventError) {
          console.error(`Error importando evento fila ${i + 1}:`, eventError);
          errors.push(`Fila ${i + 1}: Error al procesar evento - ${(eventError as any).message}`);
        }
      }
      
      console.log(`✅ [IMPORT] Importados ${importedEvents.length} eventos exitosamente`);
      if (errors.length > 0) {
        console.log(`⚠️ [IMPORT] ${errors.length} errores encontrados:`, errors);
      }
      
      return res.json({
        message: `Importación completada: ${importedEvents.length} eventos importados`,
        importedCount: importedEvents.length,
        totalRequested: eventsData.length,
        errors: errors.length > 0 ? errors : undefined,
        importedEvents
      });
    } catch (error) {
      console.error("Error en importación de eventos:", error);
      return res.status(500).json({
        message: "Error al importar eventos",
        error: (error as any).message
      });
    }
  });
  
  // Obtener datos de referencia para eventos
  apiRouter.get("/events-reference-data", async (_req: Request, res: Response) => {
    try {
      return res.json({
        eventTypes: EventTypes,
        targetAudiences: TargetAudiences,
        eventStatuses: EventStatuses
      });
    } catch (error) {
      console.error("Error al obtener datos de referencia:", error);
      return res.status(500).json({ 
        message: "Error al obtener datos de referencia", 
        error: error.message 
      });
    }
  });
}