import { Request, Response, Router } from 'express';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from './db';
import { 
  instructors, 
  parks, 
  activities, 
  instructorAssignments, 
  instructorEvaluations, 
  instructorRecognitions,
  insertInstructorSchema,
  insertInstructorAssignmentSchema,
  insertInstructorEvaluationSchema,
  insertInstructorRecognitionSchema
} from '../shared/schema';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/instructors';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'profileImage') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos de imagen'));
      }
    } else if (file.fieldname === 'curriculum') {
      if (file.mimetype === 'application/pdf' || 
          file.mimetype === 'application/msword' || 
          file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos PDF, DOC o DOCX'));
      }
    } else {
      cb(new Error('Campo de archivo no reconocido'));
    }
  }
});

/**
 * Registra las rutas para gestión de instructores
 */
export function registerInstructorRoutes(app: any, apiRouter: Router, publicApiRouter: any, isAuthenticated: any) {
  
  // === RUTAS PÚBLICAS PARA INSTRUCTORES ===
  if (publicApiRouter) {
    // Ruta pública para obtener todos los instructores activos
    publicApiRouter.get("/instructors", async (_req: Request, res: Response) => {
      try {
        // Usamos DISTINCT ON para eliminar duplicados basados en nombre y correo
        const result = await db.execute(
          sql`WITH unique_instructors AS (
                SELECT DISTINCT ON (LOWER(full_name), LOWER(email)) 
                  id, 
                  full_name, 
                  email, 
                  phone, 
                  specialties, 
                  experience_years, 
                  status, 
                  profile_image_url, 
                  created_at
                FROM instructors 
                WHERE status = 'active'
                ORDER BY LOWER(full_name), LOWER(email), created_at DESC
              )
              SELECT * FROM unique_instructors
              ORDER BY id DESC`
        );
        
        // Filtro adicional en memoria para seguridad
        const uniqueInstructors = new Map();
        
        if (result.rows && result.rows.length > 0) {
          result.rows.forEach((instructor: any) => {
            const key = `${instructor.full_name.toLowerCase()}|${instructor.email.toLowerCase()}`;
            if (!uniqueInstructors.has(key)) {
              uniqueInstructors.set(key, instructor);
            }
          });
        }
        
        const instructorsArray = Array.from(uniqueInstructors.values());
        res.json(instructorsArray);
      } catch (error) {
        console.error("Error al obtener instructores públicos:", error);
        res.status(500).json({ message: "Error al obtener instructores" });
      }
    });
  }
  
  // === RUTAS ADMINISTRATIVAS PARA INSTRUCTORES ===
  
  // Ruta para eliminar (inactivar) todos los instructores (solo administradores)
  apiRouter.delete("/instructors/batch/all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar que el usuario sea administrador
      if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ message: "No autorizado. Solo administradores pueden realizar esta acción" });
      }
      
      // Obtenemos una lista de IDs de instructores activos para mostrar el conteo
      const activeInstructors = await db.execute(
        sql`SELECT id FROM instructors WHERE status = 'active'`
      );
      
      const activeCount = activeInstructors.rows?.length || 0;
      
      if (activeCount === 0) {
        return res.json({ 
          message: "No hay instructores activos para eliminar",
          count: 0
        });
      }
      
      // Realizamos un soft delete cambiando el estado a "inactive"
      await db.execute(
        sql`UPDATE instructors SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE status = 'active'`
      );
      
      res.json({ 
        message: `${activeCount} instructores han sido inactivados correctamente`,
        count: activeCount
      });
    } catch (error) {
      console.error("Error al eliminar todos los instructores:", error);
      res.status(500).json({ message: "Error al eliminar los instructores" });
    }
  });

  // Obtener todos los instructores
  apiRouter.get('/instructors', async (req: Request, res: Response) => {
    try {
      const result = await db
        .select({
          id: instructors.id,
          firstName: instructors.firstName,
          lastName: instructors.lastName,
          fullName: instructors.fullName,
          email: instructors.email,
          phone: instructors.phone,
          specialties: instructors.specialties,
          experienceYears: instructors.experienceYears,
          bio: instructors.bio,
          profileImageUrl: instructors.profileImageUrl,
          hourlyRate: instructors.hourlyRate,
          availableDays: instructors.availableDays,
          qualifications: instructors.qualifications,
          preferredParkId: instructors.preferredParkId,
          createdAt: instructors.createdAt,
          status: instructors.status,
          rating: instructors.rating,
          activitiesCount: instructors.activitiesCount,
        })
        .from(instructors)
        .orderBy(desc(instructors.createdAt));

      // Obtener nombres de parques preferidos si existen y construir fullName si es null
      const instructorsWithParkNames = await Promise.all(
        result.map(async (instructor) => {
          let updatedInstructor = {
            ...instructor,
            // Construir fullName si es null o vacío
            fullName: instructor.fullName || `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim()
          };

          if (instructor.preferredParkId) {
            try {
              const parkResult = await db
                .select({ name: parks.name })
                .from(parks)
                .where(eq(parks.id, instructor.preferredParkId))
                .limit(1);
              
              (updatedInstructor as any).preferredParkName = parkResult[0]?.name || null;
            } catch (error) {
              console.error('Error fetching park name:', error);
            }
          }
          return updatedInstructor;
        })
      );

      res.json(instructorsWithParkNames);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      res.status(500).json({ message: 'Error al obtener instructores' });
    }
  });

  // Obtener instructor por ID
  apiRouter.get('/instructors/:id', async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);
      
      const result = await db
        .select()
        .from(instructors)
        .where(eq(instructors.id, instructorId))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ message: 'Instructor no encontrado' });
      }

      const instructor = result[0];

      // Construir fullName si es null
      const updatedInstructor = {
        ...instructor,
        fullName: instructor.fullName || `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim()
      };

      res.json(updatedInstructor);
    } catch (error) {
      console.error('Error fetching instructor:', error);
      res.status(500).json({ message: 'Error al obtener instructor' });
    }
  });

  // Crear nuevo instructor
  apiRouter.post('/instructors', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'curriculum', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      const data = JSON.parse(req.body.data || '{}');
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Agregar URLs de archivos subidos
      if (files?.profileImage?.[0]) {
        data.profileImageUrl = `/uploads/instructors/${files.profileImage[0].filename}`;
      }
      
      if (files?.curriculum?.[0]) {
        data.curriculumUrl = `/uploads/instructors/${files.curriculum[0].filename}`;
      }

      // Construir fullName si no está presente
      if (!data.fullName && (data.firstName || data.lastName)) {
        data.fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      }

      const validationResult = insertInstructorSchema.safeParse(data);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Datos de instructor no válidos', 
          errors: validationResult.error.format() 
        });
      }

      const [newInstructor] = await db
        .insert(instructors)
        .values({
          ...validationResult.data,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      res.status(201).json(newInstructor);
    } catch (error) {
      console.error('Error creating instructor:', error);
      res.status(500).json({ message: 'Error al crear instructor' });
    }
  });

  // Actualizar instructor
  apiRouter.put('/instructors/:id', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'curriculum', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);
      
      if (isNaN(instructorId)) {
        return res.status(400).json({ message: 'ID de instructor no válido' });
      }

      const data = JSON.parse(req.body.data || '{}');
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Agregar URLs de archivos subidos si existen
      if (files?.profileImage?.[0]) {
        data.profileImageUrl = `/uploads/instructors/${files.profileImage[0].filename}`;
      }
      
      if (files?.curriculum?.[0]) {
        data.curriculumUrl = `/uploads/instructors/${files.curriculum[0].filename}`;
      }

      // Construir fullName si no está presente
      if (!data.fullName && (data.firstName || data.lastName)) {
        data.fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      }

      const validationResult = insertInstructorSchema.partial().safeParse(data);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Datos de instructor no válidos', 
          errors: validationResult.error.format() 
        });
      }

      const [updatedInstructor] = await db
        .update(instructors)
        .set({
          ...validationResult.data,
          updatedAt: new Date()
        })
        .where(eq(instructors.id, instructorId))
        .returning();

      if (!updatedInstructor) {
        return res.status(404).json({ message: 'Instructor no encontrado' });
      }

      res.json(updatedInstructor);
    } catch (error) {
      console.error('Error updating instructor:', error);
      res.status(500).json({ message: 'Error al actualizar instructor' });
    }
  });

  // Eliminar instructor
  apiRouter.delete('/instructors/:id', async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);
      
      if (isNaN(instructorId)) {
        return res.status(400).json({ message: 'ID de instructor no válido' });
      }

      // Obtener instructor para verificar si existe
      const instructorToDelete = await db
        .select()
        .from(instructors)
        .where(eq(instructors.id, instructorId))
        .limit(1);

      if (instructorToDelete.length === 0) {
        return res.status(404).json({ message: 'Instructor no encontrado' });
      }

      const instructor = instructorToDelete[0];

      // Eliminar archivos asociados si existen
      if (instructor.profileImageUrl) {
        const imagePath = path.join(process.cwd(), 'public', instructor.profileImageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      if (instructor.curriculumUrl) {
        const curriculumPath = path.join(process.cwd(), 'public', instructor.curriculumUrl);
        if (fs.existsSync(curriculumPath)) {
          fs.unlinkSync(curriculumPath);
        }
      }

      // Eliminar instructor
      await db
        .delete(instructors)
        .where(eq(instructors.id, instructorId));

      console.log('✅ Instructor eliminado exitosamente:', {
        instructorId,
        email: instructor.email
      });

      res.json({ message: 'Instructor eliminado exitosamente' });

    } catch (error) {
      console.error('Error deleting instructor:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Error al eliminar instructor' 
      });
    }
  });

  // === RUTAS PARA ASIGNACIONES DE INSTRUCTORES ===
  
  // Obtener todas las asignaciones de un instructor
  apiRouter.get("/instructors/:id/assignments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);
      
      if (isNaN(instructorId)) {
        return res.status(400).json({ message: "ID de instructor no válido" });
      }
      
      const assignments = await db
        .select()
        .from(instructorAssignments)
        .where(eq(instructorAssignments.instructorId, instructorId))
        .orderBy(desc(instructorAssignments.assignmentDate));
      
      // Obtener nombres de los parques donde están asignados
      const parkIds = Array.from(new Set(assignments.map(a => a.parkId)));
      let parkNames: { id: number, name: string }[] = [];
      
      if (parkIds.length > 0) {
        for (const parkId of parkIds) {
          const [park] = await db
            .select({
              id: parks.id,
              name: parks.name
            })
            .from(parks)
            .where(eq(parks.id, parkId));
          
          if (park) {
            parkNames.push(park);
          }
        }
      }
      
      // Obtener información de las actividades asignadas
      const activityIds = assignments.map(a => a.activityId).filter(Boolean) as number[];
      let activityDetails: { id: number, title: string, category: string | null }[] = [];
      
      if (activityIds.length > 0) {
        for (const activityId of activityIds) {
          const [activity] = await db
            .select({
              id: activities.id,
              title: activities.title,
              category: activities.category
            })
            .from(activities)
            .where(eq(activities.id, activityId));
          
          if (activity) {
            activityDetails.push(activity);
          }
        }
      }
      
      // Procesar asignaciones con información adicional
      const processedAssignments = assignments.map(assignment => {
        const park = parkNames.find(p => p.id === assignment.parkId);
        const activity = activityDetails.find(a => a.id === assignment.activityId);
        
        return {
          ...assignment,
          parkName: park ? park.name : 'Parque desconocido',
          activityName: activity ? activity.title : 'Actividad no encontrada',
          activityCategory: activity ? activity.category : null
        };
      });
      
      res.json(processedAssignments);
    } catch (error) {
      console.error(`Error al obtener asignaciones del instructor ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al obtener asignaciones" });
    }
  });
  
  // Crear nueva asignación de instructor
  apiRouter.post("/instructors/:id/assignments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);
      
      if (isNaN(instructorId)) {
        return res.status(400).json({ message: "ID de instructor no válido" });
      }
      
      const validationResult = insertInstructorAssignmentSchema.safeParse({
        ...req.body,
        instructorId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos de asignación no válidos", 
          errors: validationResult.error.format() 
        });
      }
      
      const [newAssignment] = await db
        .insert(instructorAssignments)
        .values({
          ...validationResult.data,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      res.status(201).json(newAssignment);
    } catch (error) {
      console.error(`Error al crear asignación para instructor ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al crear asignación" });
    }
  });
  
  // === RUTAS PARA EVALUACIONES DE INSTRUCTORES ===
  
  // Obtener todas las evaluaciones de un instructor
  apiRouter.get("/instructors/:id/evaluations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);
      
      if (isNaN(instructorId)) {
        return res.status(400).json({ message: "ID de instructor no válido" });
      }
      
      const evaluations = await db
        .select()
        .from(instructorEvaluations)
        .where(eq(instructorEvaluations.instructorId, instructorId))
        .orderBy(desc(instructorEvaluations.evaluationDate));
      
      res.json(evaluations);
    } catch (error) {
      console.error(`Error al obtener evaluaciones del instructor ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al obtener evaluaciones" });
    }
  });
  
  // Crear nueva evaluación de instructor
  apiRouter.post("/instructors/:id/evaluations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);
      
      if (isNaN(instructorId)) {
        return res.status(400).json({ message: "ID de instructor no válido" });
      }
      
      const validationResult = insertInstructorEvaluationSchema.safeParse({
        ...req.body,
        instructorId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos de evaluación no válidos", 
          errors: validationResult.error.format() 
        });
      }
      
      const [newEvaluation] = await db
        .insert(instructorEvaluations)
        .values({
          ...validationResult.data,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      res.status(201).json(newEvaluation);
    } catch (error) {
      console.error(`Error al crear evaluación para instructor ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al crear evaluación" });
    }
  });
  
  // === RUTAS PARA RECONOCIMIENTOS DE INSTRUCTORES ===
  
  // Obtener todos los reconocimientos de un instructor
  apiRouter.get("/instructors/:id/recognitions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);
      
      if (isNaN(instructorId)) {
        return res.status(400).json({ message: "ID de instructor no válido" });
      }
      
      const recognitions = await db
        .select()
        .from(instructorRecognitions)
        .where(eq(instructorRecognitions.instructorId, instructorId))
        .orderBy(desc(instructorRecognitions.createdAt));
      
      res.json(recognitions);
    } catch (error) {
      console.error(`Error al obtener reconocimientos del instructor ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al obtener reconocimientos" });
    }
  });
  
  // Crear nuevo reconocimiento de instructor
  apiRouter.post("/instructors/:id/recognitions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);
      
      if (isNaN(instructorId)) {
        return res.status(400).json({ message: "ID de instructor no válido" });
      }
      
      const validationResult = insertInstructorRecognitionSchema.safeParse({
        ...req.body,
        instructorId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos de reconocimiento no válidos", 
          errors: validationResult.error.format() 
        });
      }
      
      const [newRecognition] = await db
        .insert(instructorRecognitions)
        .values({
          ...validationResult.data,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      res.status(201).json(newRecognition);
    } catch (error) {
      console.error(`Error al crear reconocimiento para instructor ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al crear reconocimiento" });
    }
  });

}