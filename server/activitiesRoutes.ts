import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { sql, eq } from 'drizzle-orm';
import { insertActivitySchema, activityCategories, insertActivityCategorySchema, activities } from '@shared/schema';
import { storage } from './storage';
import { db } from './db';

// Controladores para gestión de actividades
export function registerActivityRoutes(app: any, apiRouter: any, isAuthenticated: any, hasParkAccess: any) {
  // Obtener todas las categorías de actividades
  apiRouter.get("/activity-categories", async (_req: Request, res: Response) => {
    try {
      const categories = await db.select().from(activityCategories).orderBy(activityCategories.sortOrder);
      res.json(categories);
    } catch (error) {
      console.error("Error al obtener categorías de actividades:", error);
      res.status(500).json({ message: "Error al obtener categorías de actividades" });
    }
  });

  // Crear nueva categoría de actividad
  apiRouter.post("/activity-categories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categoryData = insertActivityCategorySchema.parse(req.body);
      const [newCategory] = await db.insert(activityCategories).values(categoryData).returning();
      res.status(201).json(newCategory);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error al crear categoría:", error);
      res.status(500).json({ message: "Error al crear categoría de actividad" });
    }
  });

  // Actualizar categoría de actividad
  apiRouter.put("/activity-categories/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categoryId = Number(req.params.id);
      const categoryData = insertActivityCategorySchema.parse(req.body);
      
      const [updatedCategory] = await db
        .update(activityCategories)
        .set({ ...categoryData, updatedAt: new Date() })
        .where(sql`${activityCategories.id} = ${categoryId}`)
        .returning();

      if (!updatedCategory) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }

      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error al actualizar categoría:", error);
      res.status(500).json({ message: "Error al actualizar categoría de actividad" });
    }
  });

  // Eliminar categoría de actividad
  apiRouter.delete("/activity-categories/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categoryId = Number(req.params.id);

      // Verificar si hay actividades usando esta categoría
      const activitiesUsingCategory = await db
        .select()
        .from(activities)
        .where(eq(activities.categoryId, categoryId))
        .limit(1);

      if (activitiesUsingCategory.length > 0) {
        return res.status(400).json({ 
          message: "No se puede eliminar la categoría porque tiene actividades asociadas" 
        });
      }

      const [deletedCategory] = await db
        .delete(activityCategories)
        .where(eq(activityCategories.id, categoryId))
        .returning();

      if (!deletedCategory) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }

      res.json({ message: "Categoría eliminada exitosamente" });
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      res.status(500).json({ message: "Error al eliminar categoría de actividad" });
    }
  });

  // Obtener todas las actividades
  apiRouter.get("/activities", async (_req: Request, res: Response) => {
    try {
      // Usar consulta SQL directa para incluir categorías y parques
      const result = await db.execute(
        sql`SELECT a.id, a.park_id as "parkId", a.title, a.description, 
                 a.start_date as "startDate", a.end_date as "endDate", 
                 a.category, a.location, a.capacity, a.price, a.is_free as "isFree", 
                 a.category_id as "categoryId", a.created_at as "createdAt",
                 p.name as "parkName",
                 ac.name as "categoryName"
             FROM activities a
             LEFT JOIN parks p ON a.park_id = p.id
             LEFT JOIN activity_categories ac ON a.category_id = ac.id
             ORDER BY a.start_date DESC`
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener actividades:", error);
      res.status(500).json({ message: "Error al obtener actividades" });
    }
  });


  // Obtener actividades para un parque específico
  apiRouter.get("/parks/:id/activities", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const activities = await (storage as any).getParkActivities(parkId);
      res.json(activities);
    } catch (error) {
      console.error("Error al obtener actividades del parque:", error);
      res.status(500).json({ message: "Error al obtener actividades del parque" });
    }
  });

  // Añadir una actividad a un parque
  apiRouter.post("/parks/:id/activities", isAuthenticated, hasParkAccess, async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      console.log("Headers recibidos:", req.headers);
      console.log("Datos recibidos para crear actividad:", req.body);
      
      // Extraer los datos
      const { startDate, endDate, ...otherData } = req.body;
      
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
      
      // Crear el objeto con los datos procesados
      const activityData = { 
        ...otherData, 
        parkId,
        startDate: parsedStartDate,
        ...(parsedEndDate && { endDate: parsedEndDate })
      };
      
      console.log("Datos procesados para crear actividad:", activityData);
      
      const data = insertActivitySchema.parse(activityData);
      const result = await (storage as any).createActivity(data);
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.error("Error de validación Zod:", error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error al crear actividad:", error);
      res.status(500).json({ message: "Error al crear actividad" });
    }
  });

  // Actualizar una actividad existente
  console.log("🔧 REGISTRANDO ENDPOINT PUT /activities/:id");
  apiRouter.put("/activities/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const activityId = Number(req.params.id);
      
      console.log("Headers recibidos:", req.headers);
      console.log("Datos recibidos para actualizar actividad:", req.body);
      console.log("🎯 INICIO DEL PROCESO DE ACTUALIZACIÓN - ID:", activityId);
      
      // Verificar si la actividad existe
      const existingActivity = await (storage as any).getActivity(activityId);
      if (!existingActivity) {
        console.log("❌ ACTIVIDAD NO ENCONTRADA - ID:", activityId);
        return res.status(404).json({ message: "Actividad no encontrada" });
      }
      console.log("✅ ACTIVIDAD ENCONTRADA - Continuando proceso...");
      
      // Extraer los datos
      console.log("🔄 EXTRAYENDO DATOS - startDate:", req.body.startDate, "endDate:", req.body.endDate);
      const { startDate, endDate, ...otherData } = req.body;
      
      // Convertir las fechas explícitamente a objetos Date
      let parsedStartDate: Date;
      let parsedEndDate: Date | undefined;
      
      console.log("🔄 CONVIRTIENDO FECHAS...");
      try {
        parsedStartDate = new Date(startDate);
        if (endDate) {
          parsedEndDate = new Date(endDate);
        }
        console.log("✅ FECHAS CONVERTIDAS EXITOSAMENTE");
      } catch (e) {
        console.error("❌ Error al convertir fechas:", e);
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
      
      // Crear el objeto con los datos procesados
      const activityData = { 
        ...otherData,
        startDate: parsedStartDate,
        ...(parsedEndDate && { endDate: parsedEndDate })
      };
      
      // Debug logging para verificar valores críticos
      console.log("🔍 Valores recibidos del frontend:", {
        categoryId: activityData.categoryId,
        allowsPublicRegistration: activityData.allowsPublicRegistration,
        targetMarket: activityData.targetMarket,
        specialNeeds: activityData.specialNeeds,
        maxRegistrations: activityData.maxRegistrations,
        registrationDeadline: activityData.registrationDeadline,
        requiresApproval: activityData.requiresApproval
      });
      
      console.log("🚀 PUNTO DE CONTROL: Antes de llamar al storage...");
      
      console.log("🔄 Llamando a storage.updateActivity con ID:", activityId);
      console.log("📤 Datos que se envían al storage:", activityData);
      console.log("🔎 Específicamente categoryId y allowsPublicRegistration:", {
        categoryId: activityData.categoryId,
        allowsPublicRegistration: activityData.allowsPublicRegistration
      });
      
      try {
        const result = await (storage as any).updateActivity(activityId, activityData);
        console.log("🎉 Resultado de updateActivity:", result);
        res.json(result);
      } catch (storageError) {
        console.error("❌ Error en storage.updateActivity:", storageError);
        throw storageError;
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.error("Error de validación Zod:", validationError);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error al actualizar actividad:", error);
      res.status(500).json({ message: "Error al actualizar actividad" });
    }
  });

  // Eliminar una actividad
  apiRouter.delete("/activities/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const activityId = Number(req.params.id);
      
      console.log("Headers recibidos:", req.headers);
      console.log("Eliminando actividad con ID:", activityId);
      
      // Verificar si la actividad existe
      const existingActivity = await (storage as any).getActivity(activityId);
      if (!existingActivity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }
      
      // Eliminar la actividad
      const result = await (storage as any).deleteActivity(activityId);
      
      if (result) {
        res.status(200).json({ success: true, message: "Actividad eliminada correctamente" });
      } else {
        res.status(500).json({ success: false, message: "Error al eliminar la actividad" });
      }
    } catch (error) {
      console.error("Error al eliminar actividad:", error);
      res.status(500).json({ message: "Error al eliminar actividad" });
    }
  });

  // Importar actividades desde CSV
  apiRouter.post("/activities/import", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`🔥 ENDPOINT IMPORT: Iniciando procesamiento`);
      console.log(`🔥 ENDPOINT IMPORT: Body keys:`, Object.keys(req.body));
      const { activities: csvActivities } = req.body;
      
      if (!Array.isArray(csvActivities) || csvActivities.length === 0) {
        return res.status(400).json({ 
          message: "Se requiere un array de actividades para importar" 
        });
      }

      console.log(`📥 Iniciando importación de ${csvActivities.length} actividades`);
      console.log(`🔍 Primera actividad de ejemplo:`, JSON.stringify(csvActivities[0], null, 2));
      
      let imported = 0;
      let errors: string[] = [];
      
      console.log(`🚀 INICIANDO BUCLE: Procesando ${csvActivities.length} actividades`);
      console.log(`🔍 Estructura de primera actividad:`, Object.keys(csvActivities[0]));
      console.log(`🔧 PUNTO CRÍTICO: A punto de entrar al try del bucle`);

      try {
        console.log(`🔥 ENTRANDO AL BUCLE FOR - Length: ${csvActivities.length}`);
        
        for (let i = 0; i < csvActivities.length; i++) {
        const activityData = csvActivities[i];
        console.log(`\n🔄 Procesando actividad ${i + 1}/${csvActivities.length}: "${activityData.title}"`);
        
        try {
          // Validate required fields
          console.log(`🔍 Validando campos requeridos para "${activityData.title}"`);
          if (!activityData.title || activityData.title.trim() === '') {
            throw new Error(`Fila ${i + 2}: El título es requerido`);
          }
          console.log(`✅ Título válido: "${activityData.title}"`);;
          
          if (!activityData.parkId || activityData.parkId === '') {
            throw new Error(`Fila ${i + 2}: El parque es requerido`);
          }
          
          if (!activityData.categoryId || activityData.categoryId === '') {
            throw new Error(`Fila ${i + 2}: La categoría es requerida`);
          }

          // Parse registration deadline if provided
          let parsedRegistrationDeadline = null;
          if (activityData.registrationDeadline && activityData.registrationDeadline.trim() !== '') {
            // Handle DD/MM/YY format like "10/03/24"
            const [day, month, year] = activityData.registrationDeadline.split('/');
            const fullYear = year.length === 2 ? `20${year}` : year;
            parsedRegistrationDeadline = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            
            if (isNaN(parsedRegistrationDeadline.getTime())) {
              parsedRegistrationDeadline = null;
            }
          }

          console.log(`🔧 Intentando validar actividad "${activityData.title}"`);
          
          const validatedActivity = insertActivitySchema.parse({
            title: activityData.title?.trim() || '',
            description: activityData.description || '',
            parkId: parseInt(activityData.parkId),
            categoryId: parseInt(activityData.categoryId),
            startDate: activityData.startDate,
            endDate: activityData.endDate,
            startTime: activityData.startTime || null,
            endTime: activityData.endTime || null,
            location: activityData.location || null,
            latitude: activityData.latitude,
            longitude: activityData.longitude,
            capacity: activityData.capacity ? parseInt(activityData.capacity) : null,
            duration: activityData.duration ? parseInt(activityData.duration) : null,
            price: activityData.price || '0',
            isFree: Boolean(activityData.isFree),
            materials: activityData.materials || '',
            requirements: activityData.requirements || '',
            isRecurring: Boolean(activityData.isRecurring),
            recurringDays: Array.isArray(activityData.recurringDays) ? activityData.recurringDays : [],
            targetMarket: Array.isArray(activityData.targetMarket) ? activityData.targetMarket : [],
            specialNeeds: Array.isArray(activityData.specialNeeds) ? activityData.specialNeeds : [],
            registrationEnabled: Boolean(activityData.registrationEnabled),
            maxRegistrations: activityData.maxRegistrations ? parseInt(activityData.maxRegistrations) : null,
            registrationDeadline: parsedRegistrationDeadline,
            registrationInstructions: activityData.registrationInstructions || '',
            requiresApproval: Boolean(activityData.requiresApproval),
            ageRestrictions: activityData.ageRestrictions || '',
            healthRequirements: activityData.healthRequirements || '',
            status: 'programada',
          });
          console.log(`✅ Validación Zod exitosa para "${activityData.title}"`);

          // Insert the activity using storage layer
          await (storage as any).createActivity(validatedActivity);
          imported++;
          
          console.log(`✓ Actividad importada: "${validatedActivity.title}"`);
          
        } catch (error) {
          console.error(`❌ Error importando actividad en fila ${i + 2}:`, error);
          console.error(`🔍 Datos que causaron el error:`, JSON.stringify(activityData, null, 2));
          if (error instanceof ZodError) {
            const validationError = fromZodError(error);
            console.error(`🚨 Error de validación Zod:`, validationError.message);
            errors.push(`Fila ${i + 2}: ${validationError.message}`);
          } else {
            const errorMessage = error instanceof Error ? error.message : `Error desconocido en fila ${i + 2}`;
            console.error(`🚨 Error general:`, errorMessage);
            errors.push(errorMessage);
          }
        }
      } 
      } catch (bucleError) {
        console.error(`🚨 ERROR CRÍTICO EN EL BUCLE:`, bucleError);
        console.error(`🚨 Stack trace:`, (bucleError as Error).stack);
        return res.status(500).json({
          message: "Error crítico en el procesamiento del bucle",
          error: (bucleError as Error).message
        });
      }

      if (errors.length > 0 && imported === 0) {
        return res.status(400).json({
          message: "No se pudo importar ninguna actividad",
          errors: errors.slice(0, 10), // Limit error messages
          total: csvActivities.length,
          imported: 0
        });
      }

      const response = {
        message: `Importación completada: ${imported} actividades importadas`,
        imported,
        total: csvActivities.length,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined
      };

      console.log(`📊 Importación completada: ${imported} exitosas, ${errors.length} errores`);
      res.status(200).json(response);
      
    } catch (error) {
      console.error("Error general al importar CSV:", error);
      res.status(500).json({ 
        message: "Error interno del servidor al importar actividades",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });
}