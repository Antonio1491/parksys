import { Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { sql, eq } from 'drizzle-orm';
import { insertActivitySchema, activityCategories, insertActivityCategorySchema, activities } from '@shared/schema';
import { storage } from './storage';
import { db } from './db';
import { isAuthenticated, requirePermission, hasParkAccess } from './middleware/auth';

// Schema para validar cálculos financieros - preserva todos los campos para fidelidad completa
const financialCalculationSchema = z.object({
  data: z.object({
    title: z.string(),
    concept: z.string(),
    audience: z.string(),
    location: z.string(),
    durationPerClass: z.number(),
    minCapacity: z.number(),
    maxCapacity: z.number(),
    feePerPerson: z.number(),
    classesPerMonth: z.number(),
    desiredMarginPercentage: z.number(),
    instructorCost: z.number(),
    materialsCost: z.number(),
    variableCostPerPerson: z.number(),
    indirect1: z.number(),
    indirect2: z.number(),
    indirect3: z.number(),
    // Campos adicionales de la calculadora
    amenityCost: z.number().optional(),
    otherDirectCosts: z.number().optional(),
    otherIndirectCosts: z.number().optional()
  }).passthrough(), // Preserva campos no definidos para compatibilidad futura
  calculations: z.object({
    minNetIncomePerClass: z.number(),
    maxNetIncomePerClass: z.number(),
    maxTotalCostsPerClass: z.number(),
    minTotalCostsPerClass: z.number().optional(),
    minGrossProfitPerClass: z.number(),
    maxGrossProfitPerClass: z.number(),
    maxGrossMargin: z.number(),
    minGrossMargin: z.number().optional(),
    breakEvenPoint: z.number(),
    maxMeetsExpectations: z.boolean(),
    minMeetsExpectations: z.boolean().optional(),
    monthlyTotalCosts: z.number(),
    maxMonthlyIncome: z.number(),
    minMonthlyIncome: z.number().optional(),
    maxMonthlyGrossProfit: z.number(),
    minMonthlyGrossProfit: z.number().optional()
  }).passthrough(), // Preserva métricas adicionales calculadas por la UI
  recommendations: z.array(z.object({
    type: z.string(),
    message: z.string(),
    priority: z.string()
  })).optional(), // Opcional en caso de que no haya recomendaciones
  timestamp: z.string(),
  calculatorVersion: z.string().default("unified-1.0")
}).passthrough(); // Preserva campos adicionales a nivel raíz

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

  // Endpoint duplicado eliminado - se usa el de activityRoutes.ts


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
          
          // Convert string dates to Date objects for Zod validation
          const startDate = activityData.startDate ? new Date(activityData.startDate) : new Date();
          const endDate = activityData.endDate ? new Date(activityData.endDate) : new Date();

          const validatedActivity = insertActivitySchema.parse({
            title: activityData.title?.trim() || '',
            description: activityData.description || '',
            parkId: parseInt(activityData.parkId),
            categoryId: parseInt(activityData.categoryId),
            startDate: startDate,
            endDate: endDate,
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
          
          console.log(`✓ Actividad importada: "${activityData.title}"`);
          
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

  // ===== ENDPOINTS DE CÁLCULO FINANCIERO =====
  
  // Guardar cálculo financiero para una actividad
  apiRouter.post("/activities/:id/financial-calculation", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const activityId = Number(req.params.id);
      const calculationData = req.body;

      // Validar la estructura del cálculo usando Zod
      const validatedCalculation = financialCalculationSchema.parse(calculationData);

      console.log(`💰 Guardando cálculo financiero para actividad ${activityId}`);

      // Actualizar la actividad con el cálculo validado
      const [updatedActivity] = await db
        .update(activities)
        .set({
          financialCalculation: validatedCalculation,
          calculationSavedAt: new Date(),
          calculationVersion: validatedCalculation.calculatorVersion
        })
        .where(eq(activities.id, activityId))
        .returning();

      if (!updatedActivity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }

      console.log(`✅ Cálculo financiero guardado para actividad "${updatedActivity.title}"`);
      res.json({ 
        message: "Cálculo financiero guardado exitosamente",
        calculation: validatedCalculation,
        savedAt: updatedActivity.calculationSavedAt
      });

    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error al guardar cálculo financiero:", error);
      res.status(500).json({ message: "Error al guardar cálculo financiero" });
    }
  });

  // Obtener cálculo financiero de una actividad
  apiRouter.get("/activities/:id/financial-calculation", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const activityId = Number(req.params.id);

      const [activity] = await db
        .select({
          id: activities.id,
          title: activities.title,
          financialCalculation: activities.financialCalculation,
          calculationSavedAt: activities.calculationSavedAt,
          calculationVersion: activities.calculationVersion,
          price: activities.price,
          capacity: activities.capacity,
          duration: activities.duration
        })
        .from(activities)
        .where(eq(activities.id, activityId))
        .limit(1);

      if (!activity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }

      res.json({
        activityId: activity.id,
        title: activity.title,
        calculation: activity.financialCalculation,
        savedAt: activity.calculationSavedAt,
        version: activity.calculationVersion,
        basicData: {
          price: activity.price,
          capacity: activity.capacity,
          duration: activity.duration
        }
      });

    } catch (error) {
      console.error("Error al obtener cálculo financiero:", error);
      res.status(500).json({ message: "Error al obtener cálculo financiero" });
    }
  });

  // Obtener actividades con cálculos financieros (para dashboard)
  apiRouter.get("/activities/with-calculations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      
      let query = db
        .select({
          id: activities.id,
          title: activities.title,
          financialStatus: activities.financialStatus,
          status: activities.status,
          price: activities.price,
          capacity: activities.capacity,
          duration: activities.duration,
          calculationSavedAt: activities.calculationSavedAt,
          financialCalculation: activities.financialCalculation,
          startDate: activities.startDate,
          endDate: activities.endDate
        })
        .from(activities)
        .where(sql`${activities.financialCalculation} IS NOT NULL`);

      // Filtrar por estado si se proporciona
      if (status && typeof status === 'string') {
        query = query.where(eq(activities.financialStatus, status as any));
      }

      const activitiesWithCalculations = await query.orderBy(sql`${activities.calculationSavedAt} DESC`);

      res.json({
        activities: activitiesWithCalculations,
        total: activitiesWithCalculations.length,
        message: "Actividades con cálculos financieros obtenidas exitosamente"
      });

    } catch (error) {
      console.error("Error al obtener actividades con cálculos:", error);
      res.status(500).json({ message: "Error al obtener actividades con cálculos financieros" });
    }
  });

  // ============= SISTEMA DE DECISIONES FINANCIERAS =============

  // Schema para validar decisiones financieras
  const financialDecisionSchema = z.object({
    decision: z.enum(["approved", "rejected", "requires_revision"]),
    reason: z.string().min(10, "La justificación debe tener al menos 10 caracteres"),
    budgetImpact: z.number().optional(),
    riskAssessment: z.string().optional(),
    urgencyLevel: z.enum(["low", "normal", "high", "critical"]).default("normal")
  });

  // Tomar decisión financiera sobre una actividad
  apiRouter.post("/activities/:id/financial-decision", isAuthenticated, requirePermission('Finanzas', 'approve'), async (req: Request, res: Response) => {
    try {
      const activityId = Number(req.params.id);
      const decisionData = req.body;

      // Validar la estructura de la decisión usando Zod
      const validatedDecision = financialDecisionSchema.parse(decisionData);

      console.log(`💰 [DECISION] Procesando decisión financiera para actividad ${activityId}:`, validatedDecision.decision);

      // Verificar que la actividad existe
      const [existingActivity] = await db
        .select()
        .from(activities)
        .where(eq(activities.id, activityId))
        .limit(1);

      if (!existingActivity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }

      // CRITICAL: Verificar autorización a nivel de recurso - acceso al parque
      if (existingActivity.parkId) {
        // Verificar si el usuario tiene acceso al parque de la actividad
        const user = (req as any).user;
        const userCanAccessPark = user.roles?.some((role: any) => 
          role.permissions?.includes('all') || 
          role.municipalityIds?.includes(existingActivity.municipalityId) ||
          role.parkIds?.includes(existingActivity.parkId)
        ) || user.isSuper || user.permissions?.includes('all');
        
        if (!userCanAccessPark) {
          console.log(`🚫 [SECURITY] Usuario ${user.id} intentó aprobar actividad del parque ${existingActivity.parkId} sin acceso`);
          return res.status(403).json({ 
            message: "No tienes autorización para tomar decisiones financieras sobre actividades de este parque" 
          });
        }
        console.log(`✅ [SECURITY] Usuario ${user.id} autorizado para parque ${existingActivity.parkId}`);
      }

      // Actualizar el estado de la actividad con la decisión
      const newStatus = validatedDecision.decision === "approved" ? "aprobada" : 
                       validatedDecision.decision === "rejected" ? "rechazada" : "por_costear";

      const [updatedActivity] = await db
        .update(activities)
        .set({
          financialDecision: validatedDecision.decision,
          financialDecisionReason: validatedDecision.reason,
          financialDecisionDate: new Date(),
          financialDecisionBy: (req as any).user.id, // Usuario autenticado
          financialStatus: newStatus as any,
          reviewedBy: (req as any).user.id,
          reviewedAt: new Date(),
          financialNotes: validatedDecision.reason // Mantener también en el campo legacy
        })
        .where(eq(activities.id, activityId))
        .returning();

      console.log(`✅ [DECISION] Decisión "${validatedDecision.decision}" aplicada a actividad "${updatedActivity.title}"`);

      res.json({ 
        message: "Decisión financiera registrada exitosamente",
        decision: validatedDecision,
        activity: {
          id: updatedActivity.id,
          title: updatedActivity.title,
          status: updatedActivity.status,
          financialStatus: updatedActivity.financialStatus,
          financialDecision: updatedActivity.financialDecision,
          decidedAt: updatedActivity.financialDecisionDate
        }
      });

    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error al procesar decisión financiera:", error);
      res.status(500).json({ message: "Error al procesar decisión financiera" });
    }
  });

  // Obtener historial de decisiones de una actividad
  apiRouter.get("/activities/:id/financial-decisions", isAuthenticated, requirePermission('Finanzas', 'read'), async (req: Request, res: Response) => {
    try {
      const activityId = Number(req.params.id);

      // Obtener la actividad con su decisión actual
      const [activity] = await db
        .select({
          id: activities.id,
          title: activities.title,
          financialDecision: activities.financialDecision,
          financialDecisionReason: activities.financialDecisionReason,
          financialDecisionDate: activities.financialDecisionDate,
          financialDecisionBy: activities.financialDecisionBy,
          financialStatus: activities.financialStatus,
          financialNotes: activities.financialNotes,
          reviewedBy: activities.reviewedBy,
          reviewedAt: activities.reviewedAt
        })
        .from(activities)
        .where(eq(activities.id, activityId))
        .limit(1);

      if (!activity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }

      // Por ahora devolvemos la decisión actual - en el futuro se puede implementar tabla de historial
      const decisions = [];
      if (activity.financialDecision) {
        decisions.push({
          id: 1,
          decision: activity.financialDecision,
          reason: activity.financialDecisionReason,
          decisionDate: activity.financialDecisionDate,
          decisionBy: activity.financialDecisionBy,
          status: activity.financialStatus
        });
      }

      res.json({
        activityId: activity.id,
        activityTitle: activity.title,
        currentDecision: activity.financialDecision,
        currentStatus: activity.financialStatus,
        decisions: decisions,
        total: decisions.length
      });

    } catch (error) {
      console.error("Error al obtener historial de decisiones:", error);
      res.status(500).json({ message: "Error al obtener historial de decisiones financieras" });
    }
  });

  // Obtener actividades pendientes de decisión financiera
  apiRouter.get("/activities/pending-financial-decision", isAuthenticated, requirePermission('Finanzas', 'read'), async (req: Request, res: Response) => {
    try {
      const { urgency, limit } = req.query;

      let query = db
        .select({
          id: activities.id,
          title: activities.title,
          description: activities.description,
          startDate: activities.startDate,
          endDate: activities.endDate,
          price: activities.price,
          capacity: activities.capacity,
          financialStatus: activities.financialStatus,
          status: activities.status,
          financialCalculation: activities.financialCalculation,
          calculationSavedAt: activities.calculationSavedAt,
          financialNotes: activities.financialNotes,
          reviewedBy: activities.reviewedBy,
          reviewedAt: activities.reviewedAt
        })
        .from(activities)
        .where(sql`${activities.financialDecision} IS NULL AND ${activities.financialCalculation} IS NOT NULL`);

      // Ordenar por fecha de cálculo guardado (más recientes primero)
      query = query.orderBy(sql`${activities.calculationSavedAt} DESC`);

      // Limitar resultados si se especifica
      if (limit && !isNaN(Number(limit))) {
        query = query.limit(Number(limit));
      }

      const pendingActivities = await query;

      res.json({
        activities: pendingActivities,
        total: pendingActivities.length,
        message: "Actividades pendientes de decisión financiera obtenidas exitosamente"
      });

    } catch (error) {
      console.error("Error al obtener actividades pendientes de decisión:", error);
      res.status(500).json({ message: "Error al obtener actividades pendientes de decisión financiera" });
    }
  });
}