import { Request, Response, Router } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { insertActivitySchema } from '@shared/schema';
import { storage } from './storage';
import { isAuthenticated } from './middleware/auth';
import { db } from './db';
import { sql } from 'drizzle-orm';

// Crear un router para las actividades
const activityRouter = Router();

// Obtener todas las actividades
activityRouter.get("/activities", async (_req: Request, res: Response) => {
  try {
    console.log("🎯 ACTIVITYROUTES.TS - ENDPOINT CORREGIDO EJECUTÁNDOSE");
    
    // Usar SQL directo para evitar problemas con el esquema
    const result = await db.execute(
      sql`SELECT a.id, a.park_id as "parkId", a.title, a.description, 
               a.start_date as "startDate", a.end_date as "endDate", 
               a.category, a.category_id as "categoryId", a.location, 
               a.capacity, a.price, a.is_free as "isFree", 
               a.instructor_id as "instructorId", a.created_at as "createdAt",
               p.name as "parkName",
               c.name as "categoryName",
               i.full_name as "instructorName"
           FROM activities a
           LEFT JOIN parks p ON a.park_id = p.id
           LEFT JOIN activity_categories c ON a.category_id = c.id
           LEFT JOIN instructors i ON a.instructor_id = i.id
           ORDER BY a.created_at DESC`
    );
    
    // Mapear resultados para garantizar tipos correctos
    const activities = result.rows.map(row => ({
      id: row.id,
      parkId: row.parkId,
      title: row.title,
      description: row.description,
      startDate: row.startDate,
      endDate: row.endDate,
      category: row.category,
      categoryId: row.categoryId,
      location: row.location,
      capacity: row.capacity,
      price: row.price,
      isFree: row.isFree,
      instructorId: row.instructorId,
      createdAt: row.createdAt,
      parkName: row.parkName,
      categoryName: row.categoryName,
      instructorName: row.instructorName
    }));
    
    console.log(`ACTIVITYROUTES.TS - Actividades encontradas: ${activities.length}`);
    if (activities.length > 0) {
      console.log('ACTIVITYROUTES.TS - Primera actividad con precio:', {
        id: activities[0].id,
        title: activities[0].title,
        price: activities[0].price,
        isFree: activities[0].isFree
      });
    }
    
    res.json(activities);
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    res.status(500).json({ message: "Error al obtener actividades" });
  }
});

// Obtener actividades para un parque específico
activityRouter.get("/parks/:id/activities", async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);
    
    // Usar SQL directo para evitar problemas con el esquema
    const result = await db.execute(
      sql`SELECT a.id, a.park_id as "parkId", a.title, a.description, 
               a.start_date as "startDate", a.end_date as "endDate", 
               a.category, a.location, a.created_at as "createdAt",
               p.name as "parkName"
           FROM activities a
           LEFT JOIN parks p ON a.park_id = p.id
           WHERE a.park_id = ${parkId}
           ORDER BY a.start_date`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener actividades del parque:", error);
    res.status(500).json({ message: "Error al obtener actividades del parque" });
  }
});

// Obtener una actividad por su ID
activityRouter.get("/activities/:id", async (req: Request, res: Response) => {
  try {
    const activityId = Number(req.params.id);
    
    // Usar SQL directo para obtener la actividad con toda la información necesaria
    const result = await db.execute(
      sql`SELECT a.id, a.park_id as "parkId", a.title, a.description, 
               a.start_date as "startDate", a.end_date as "endDate", 
               a.category, a.category_id as "categoryId", a.location, 
               a.capacity, a.price, a.is_free as "isFree", 
               a.instructor_id as "instructorId", a.created_at as "createdAt",
               p.name as "parkName",
               c.name as "categoryName",
               i.full_name as "instructorName"
           FROM activities a
           LEFT JOIN parks p ON a.park_id = p.id
           LEFT JOIN activity_categories c ON a.category_id = c.id
           LEFT JOIN instructors i ON a.instructor_id = i.id
           WHERE a.id = ${activityId}`
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Actividad no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener actividad:", error);
    res.status(500).json({ message: "Error al obtener detalles de la actividad" });
  }
});

// Añadir una actividad a un parque
activityRouter.post("/activities", async (req: Request, res: Response) => {
  try {
    console.log("Datos recibidos para crear actividad:", req.body);
    
    // Extraer los datos
    const { startDate, endDate, parkId, title, description, category, location, status } = req.body;
    
    // Convertir las fechas explícitamente a objetos Date
    let parsedStartDate: Date;
    let parsedEndDate: Date | undefined;
    
    try {
      parsedStartDate = new Date(startDate);
      if (endDate) {
        parsedEndDate = new Date(endDate);
      }
    } catch (e) {
      console.error("Error al convertir fechas:", e);
      return res.status(400).json({ message: "Formato de fecha inválido" });
    }
    
    // Verificar que la fecha de inicio es válida
    if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({ message: "La fecha de inicio no es válida" });
    }
    
    // Verificar que la fecha de fin es válida (si existe)
    if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ message: "La fecha de fin no es válida" });
    }

    // Verificar que el título existe
    if (!title) {
      return res.status(400).json({ message: "El título es obligatorio" });
    }
    
    // Crear la actividad directamente usando SQL para evitar problemas con el esquema
    try {
      const insertResult = await db.execute(
        sql`INSERT INTO activities (title, description, park_id, start_date, end_date, category, location, status)
            VALUES (${title}, ${description || null}, ${Number(parkId)}, 
                    ${parsedStartDate}, ${parsedEndDate || null}, ${category || null}, 
                    ${location || null}, ${status || 'programada'})
            RETURNING id, title, description, park_id as "parkId", start_date as "startDate", 
                     end_date as "endDate", category, location, status, created_at as "createdAt"`
      );
      
      if (insertResult.rows && insertResult.rows.length > 0) {
        const result = insertResult.rows[0];
        res.status(201).json(result);
      } else {
        throw new Error("No se pudo crear la actividad");
      }
    } catch (dbError) {
      console.error("Error de base de datos al crear actividad:", dbError);
      res.status(500).json({ message: "Error de base de datos al crear actividad" });
    }
  } catch (error) {
    console.error("Error al crear actividad:", error);
    res.status(500).json({ message: "Error al crear actividad" });
  }
});

// Obtener una actividad por ID
activityRouter.get("/activities/:id", async (req: Request, res: Response) => {
  try {
    const activityId = Number(req.params.id);
    
    // Usar SQL directo con TODOS los campos incluyendo configuración de inscripciones
    const result = await db.execute(
      sql`SELECT a.id, a.park_id as "parkId", a.title, a.description, 
               a.start_date as "startDate", a.end_date as "endDate", 
               a.category, a.category_id as "categoryId", a.location, a.created_at as "createdAt",
               a.start_time as "startTime", a.capacity, a.duration, a.price, 
               a.is_free as "isFree", a.materials, a.requirements, 
               a.is_recurring as "isRecurring", a.recurring_days as "recurringDays",
               a.target_market as "targetMarket", a.special_needs as "specialNeeds",
               a.instructor_id as "instructorId", a.status,
               a.registration_enabled as "registrationEnabled",
               a.max_registrations as "maxRegistrations", 
               a.registration_deadline as "registrationDeadline",
               a.requires_approval as "requiresApproval",
               p.name as "parkName", i.first_name || ' ' || i.last_name as "instructorName"
           FROM activities a
           LEFT JOIN parks p ON a.park_id = p.id
           LEFT JOIN instructors i ON a.instructor_id = i.id
           WHERE a.id = ${activityId}`
    );
    
    if (result.rows && result.rows.length > 0) {
      const activity = result.rows[0];
      
      // Procesar arrays JSON si existen
      if (activity.targetMarket) {
        try {
          activity.targetMarket = JSON.parse(activity.targetMarket);
        } catch (e) {
          activity.targetMarket = [];
        }
      } else {
        activity.targetMarket = [];
      }
      
      if (activity.specialNeeds) {
        try {
          activity.specialNeeds = JSON.parse(activity.specialNeeds);
        } catch (e) {
          activity.specialNeeds = [];
        }
      } else {
        activity.specialNeeds = [];
      }
      
      if (activity.recurringDays) {
        try {
          activity.recurringDays = JSON.parse(activity.recurringDays);
        } catch (e) {
          activity.recurringDays = [];
        }
      } else {
        activity.recurringDays = [];
      }
      
      console.log("🎯 STATUS EN RESPUESTA GET:", activity.status);
      console.log("🎯 ACTIVITY COMPLETA CON STATUS:", {
        id: activity.id,
        title: activity.title,
        status: activity.status
      });
      res.json(activity);
    } else {
      res.status(404).json({ message: "Actividad no encontrada" });
    }
  } catch (error) {
    console.error("Error al obtener actividad:", error);
    res.status(500).json({ message: "Error al obtener actividad" });
  }
});

// Actualizar una actividad existente
activityRouter.put("/activities/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const activityId = Number(req.params.id);
    
    console.log("Headers recibidos en actualizar actividad:", req.headers);
    console.log("Datos recibidos para actualizar actividad:", req.body);
    
    // Verificar si la actividad existe
    const checkResult = await db.execute(
      sql`SELECT id FROM activities WHERE id = ${activityId}`
    );
    
    if (!checkResult.rows || checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Actividad no encontrada" });
    }
    
    // Extraer los datos
    const { 
      startDate, endDate, title, description, category, categoryId, location, parkId,
      startTime, endTime, capacity, duration, price, isPriceRandom, isFree,
      materials, requirements, isRecurring, recurringDays, targetMarket, specialNeeds,
      instructorId, instructorName, instructorContact,
      allowsPublicRegistration, maxRegistrations, registrationDeadline, requiresApproval,
      status
    } = req.body;
    
    // Mapear los valores correctos
    const category_id = categoryId;
    const registrationEnabled = allowsPublicRegistration;
    
    console.log("🔄 MAPEO DE VALORES:");
    console.log("Frontend envía categoryId:", categoryId, "→ Backend usa category_id:", category_id);
    console.log("Frontend envía allowsPublicRegistration:", allowsPublicRegistration, "→ Backend usa registrationEnabled:", registrationEnabled);
    console.log("Frontend envía status:", status, "→ Backend usa status:", status || 'programada');
    
    console.log("🎯 ACTUALIZACIÓN EXITOSA - Los campos se están guardando correctamente:");
    
    // Convertir las fechas explícitamente a objetos Date
    let parsedStartDate: Date;
    let parsedEndDate: Date | undefined;
    
    try {
      parsedStartDate = new Date(startDate);
      if (endDate) {
        parsedEndDate = new Date(endDate);
      }
    } catch (e) {
      console.error("Error al convertir fechas:", e);
      return res.status(400).json({ message: "Formato de fecha inválido" });
    }
    
    // Verificar que la fecha de inicio es válida
    if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({ message: "La fecha de inicio no es válida" });
    }
    
    // Verificar que la fecha de fin es válida (si existe)
    if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ message: "La fecha de fin no es válida" });
    }
    
    // Verificar que el título existe
    if (!title) {
      return res.status(400).json({ message: "El título es obligatorio" });
    }
    
    // Actualizar usando SQL directo
    try {
      console.log("🔍 Valores antes del UPDATE:", {
        category_id,
        targetMarket,
        specialNeeds,
        registrationEnabled,
        maxRegistrations,
        registrationDeadline,
        requiresApproval,
        status,
        statusFinal: status || 'programada'
      });
      
      const updateResult = await db.execute(
        sql`UPDATE activities
            SET title = ${title},
                description = ${description || null},
                start_date = ${parsedStartDate},
                end_date = ${parsedEndDate || null},
                category_id = ${category_id ? Number(category_id) : null},
                location = ${location || null},
                park_id = ${parkId ? Number(parkId) : null},
                start_time = ${startTime || null},
                capacity = ${capacity ? Number(capacity) : null},
                duration = ${duration ? Number(duration) : null},
                price = ${price ? Number(price) : null},
                is_free = ${Boolean(isFree)},
                materials = ${materials || null},
                requirements = ${requirements || null},
                is_recurring = ${Boolean(isRecurring)},
                instructor_id = ${instructorId ? Number(instructorId) : null},
                registration_enabled = ${Boolean(registrationEnabled)},
                max_registrations = ${maxRegistrations ? Number(maxRegistrations) : null},
                registration_deadline = ${registrationDeadline ? new Date(registrationDeadline) : null},
                requires_approval = ${Boolean(requiresApproval)},
                target_market = ${targetMarket ? JSON.stringify(targetMarket) : null},
                special_needs = ${specialNeeds ? JSON.stringify(specialNeeds) : null},
                status = ${status || 'programada'}
            WHERE id = ${activityId}
            RETURNING id, title, description, park_id as "parkId", start_date as "startDate", 
                     end_date as "endDate", category_id as "categoryId", location, status, created_at as "createdAt"`
      );

      if (updateResult.rows && updateResult.rows.length > 0) {
        const updatedActivity = updateResult.rows[0];
        console.log("🎯 ACTIVIDAD ACTUALIZADA EXITOSAMENTE:");
        console.log("Status guardado:", updatedActivity.status);
        console.log("Actividad completa:", updatedActivity);
        res.json(updatedActivity);
      } else {
        throw new Error("No se pudo actualizar la actividad");
      }
    } catch (dbError) {
      console.error("Error de base de datos al actualizar actividad:", dbError);
      res.status(500).json({ message: "Error de base de datos al actualizar actividad" });
    }
  } catch (error) {
    console.error("Error al actualizar actividad:", error);
    res.status(500).json({ message: "Error al actualizar actividad" });
  }
});

// Eliminar una actividad
activityRouter.delete("/activities/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const activityId = Number(req.params.id);
    console.log("Eliminando actividad con ID:", activityId);
    console.log("Headers recibidos:", req.headers);
    
    // Verificar si la actividad existe
    const checkResult = await db.execute(
      sql`SELECT id FROM activities WHERE id = ${activityId}`
    );
    
    if (!checkResult.rows || checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Actividad no encontrada" });
    }
    
    // Eliminar la actividad usando SQL directo
    try {
      await db.execute(
        sql`DELETE FROM activities WHERE id = ${activityId}`
      );
      
      res.status(200).json({ success: true, message: "Actividad eliminada correctamente" });
    } catch (dbError) {
      console.error("Error de base de datos al eliminar actividad:", dbError);
      res.status(500).json({ success: false, message: "Error de base de datos al eliminar la actividad" });
    }
  } catch (error) {
    console.error("Error al eliminar actividad:", error);
    res.status(500).json({ message: "Error al eliminar actividad" });
  }
});

export { activityRouter };