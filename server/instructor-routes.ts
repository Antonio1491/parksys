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
import { replitObjectStorage } from './objectStorage-replit';

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
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
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
    // Ruta pública para crear evaluación de instructor
    publicApiRouter.post("/instructors/:id/evaluations", async (req: Request, res: Response) => {
      try {
        const instructorId = parseInt(req.params.id);
        
        if (isNaN(instructorId)) {
          return res.status(400).json({ message: "ID de instructor no válido" });
        }
        
        // Verificar que el instructor existe
        const instructor = await db
          .select({ id: instructors.id })
          .from(instructors)
          .where(eq(instructors.id, instructorId))
          .limit(1);
          
        if (instructor.length === 0) {
          return res.status(404).json({ message: "Instructor no encontrado" });
        }
        
        // Obtener IP del evaluador para prevención de spam
        const evaluatorIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
        
        // Preparar datos de evaluación con campos requeridos
        const evaluationData = {
          instructorId,
          evaluatorName: req.body.evaluatorName,
          evaluatorEmail: req.body.evaluatorEmail || null,
          evaluatorCity: req.body.evaluatorCity || null,
          evaluatorIp: evaluatorIp?.split(',')[0] || null, // Tomar la primera IP si hay múltiples
          overallRating: req.body.overallRating,
          knowledgeRating: req.body.knowledgeRating,
          patienceRating: req.body.patienceRating,
          clarityRating: req.body.clarityRating,
          punctualityRating: req.body.punctualityRating,
          wouldRecommend: req.body.wouldRecommend || false,
          comments: req.body.comments || null,
          attendedActivity: req.body.attendedActivity || null,
          status: "pending", // Todas las evaluaciones públicas requieren moderación
          evaluationDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Validar los datos
        const validationResult = insertInstructorEvaluationSchema.safeParse(evaluationData);
        
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
            instructorId // Asegurar que instructorId esté incluido
          })
          .returning();
        
        res.status(201).json({
          message: "Evaluación enviada exitosamente. Será revisada antes de publicarse.",
          evaluation: newEvaluation
        });
        
      } catch (error) {
        console.error(`Error al crear evaluación pública para instructor ${req.params.id}:`, error);
        res.status(500).json({ message: "Error al enviar evaluación" });
      }
    });

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
        
        // 🎯 NORMALIZAR URLs de imágenes antes de enviar al cliente
        const instructorsWithNormalizedImages = instructorsArray.map(instructor => ({
          ...instructor,
          profile_image_url: instructor.profile_image_url ? replitObjectStorage.normalizeUrl(instructor.profile_image_url) : instructor.profile_image_url
        }));
        
        res.json(instructorsWithNormalizedImages);
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

      // 🎯 NORMALIZAR URLs de imágenes antes de enviar al cliente
      const instructorsWithNormalizedImages = instructorsWithParkNames.map(instructor => ({
        ...instructor,
        profileImageUrl: instructor.profileImageUrl ? replitObjectStorage.normalizeUrl(instructor.profileImageUrl) : instructor.profileImageUrl
      }));

      res.json(instructorsWithNormalizedImages);
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

      // 🎯 NORMALIZAR URLs de imágenes antes de enviar al cliente
      const instructorWithNormalizedImages = {
        ...updatedInstructor,
        profileImageUrl: updatedInstructor.profileImageUrl ? replitObjectStorage.normalizeUrl(updatedInstructor.profileImageUrl) : updatedInstructor.profileImageUrl
      };

      res.json(instructorWithNormalizedImages);
    } catch (error) {
      console.error('Error fetching instructor:', error);
      res.status(500).json({ message: 'Error al obtener instructor' });
    }
  });

  // Importar instructores desde CSV
  apiRouter.post('/instructors/import', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { instructors: instructorsData } = req.body;

      if (!instructorsData || !Array.isArray(instructorsData)) {
        return res.status(400).json({ 
          message: 'Se requiere un array de instructores válido' 
        });
      }

      console.log(`🔍 Procesando importación de ${instructorsData.length} instructores...`);

      const results = [];
      const errors = [];

      for (const [index, instructorData] of instructorsData.entries()) {
        try {
          // Procesar campos especiales
          const processedData = {
            ...instructorData,
            // Construir fullName si no existe
            fullName: instructorData.fullName || `${instructorData.firstName || ''} ${instructorData.lastName || ''}`.trim(),
            
            // Convertir números
            age: instructorData.age ? parseInt(instructorData.age) : undefined,
            experienceYears: instructorData.experienceYears ? parseInt(instructorData.experienceYears) : 0,
            hourlyRate: instructorData.hourlyRate ? parseFloat(instructorData.hourlyRate) : 0,
            
            // Procesar arrays (specialties, certifications, availableDays)
            specialties: Array.isArray(instructorData.specialties) 
              ? instructorData.specialties 
              : (instructorData.specialties ? instructorData.specialties.split(',').map(s => s.trim()) : []),
            
            certifications: Array.isArray(instructorData.certifications)
              ? instructorData.certifications
              : (instructorData.certifications ? instructorData.certifications.split(',').map(s => s.trim()) : []),
            
            availableDays: Array.isArray(instructorData.availableDays)
              ? instructorData.availableDays
              : (instructorData.availableDays ? instructorData.availableDays.split(',').map(s => s.trim()) : []),
            
            // Establecer valores por defecto
            status: instructorData.status || 'active',
            rating: 0,
            activitiesCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Validar datos
          const validationResult = insertInstructorSchema.safeParse(processedData);
          
          if (!validationResult.success) {
            errors.push({
              row: index + 1,
              email: instructorData.email,
              errors: validationResult.error.format()
            });
            continue;
          }

          // Verificar si el email ya existe
          const existingInstructor = await db
            .select({ id: instructors.id })
            .from(instructors)
            .where(eq(instructors.email, validationResult.data.email))
            .limit(1);

          if (existingInstructor.length > 0) {
            errors.push({
              row: index + 1,
              email: instructorData.email,
              error: 'El email ya existe'
            });
            continue;
          }

          // Insertar instructor
          const [newInstructor] = await db
            .insert(instructors)
            .values(validationResult.data)
            .returning();

          results.push(newInstructor);

        } catch (error) {
          errors.push({
            row: index + 1,
            email: instructorData.email,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }

      console.log(`✅ Importación completada: ${results.length} exitosos, ${errors.length} errores`);

      res.json({
        message: `Importación completada: ${results.length} instructores creados, ${errors.length} errores`,
        successful: results.length,
        errors: errors.length,
        errorDetails: errors
      });

    } catch (error) {
      console.error('Error en importación de instructores:', error);
      res.status(500).json({ 
        message: 'Error al procesar la importación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // Crear nuevo instructor
  apiRouter.post('/instructors', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'curriculum', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      // Parsear datos del formulario
      let data: any = {};
      
      if (req.body.data) {
        // Si viene como FormData con campo 'data'
        data = JSON.parse(req.body.data);
      } else {
        // Si viene como JSON directo
        data = req.body;
      }
      
      console.log('🔍 DEBUG: Datos recibidos en creación:', data);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Agregar URLs de archivos subidos
      if (files?.profileImage?.[0]) {
        data.profileImageUrl = `/uploads/instructors/${files.profileImage[0].filename}`;
      }
      
      if (files?.curriculum?.[0]) {
        data.curriculumUrl = `/uploads/instructors/${files.curriculum[0].filename}`;
      }

      // Construir fullName - es REQUERIDO por el schema
      if (!data.fullName) {
        data.fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        if (!data.fullName) {
          return res.status(400).json({ 
            message: 'firstName y lastName son requeridos para generar fullName' 
          });
        }
      }

      // Mapear campos del formulario a campos de base de datos
      if (data.experience) {
        data.bio = data.experience;
        delete data.experience;
      }

      // Procesar availability como availableDays array
      if (data.availability && typeof data.availability === 'string') {
        const availabilityMap: { [key: string]: string[] } = {
          'full-time': ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
          'part-time': ['Lunes', 'Miércoles', 'Viernes'],
          'weekends': ['Sábado', 'Domingo'],
          'evenings': ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
          'mornings': ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
          'flexible': ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        };
        data.availableDays = availabilityMap[data.availability] || ['Flexible'];
        delete data.availability;
      }

      // Procesar especialidades si vienen como string JSON
      if (data.specialties && typeof data.specialties === 'string') {
        try {
          data.specialties = JSON.parse(data.specialties);
        } catch (e) {
          // Si no es JSON válido, mantener como está
        }
      }
      
      console.log('🔍 DEBUG: Datos procesados para validación:', { 
        fullName: data.fullName, 
        email: data.email, 
        firstName: data.firstName,
        lastName: data.lastName 
      });

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

      // Parsear datos del formulario
      let data: any = {};
      
      if (req.body.data) {
        // Si viene como FormData con campo 'data'
        data = JSON.parse(req.body.data);
      } else {
        // Si viene como JSON directo
        data = req.body;
      }
      
      console.log('🔍 DEBUG: Datos recibidos en actualización:', data);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Agregar URLs de archivos subidos si existen
      if (files?.profileImage?.[0]) {
        data.profileImageUrl = `/uploads/instructors/${files.profileImage[0].filename}`;
      }
      
      if (files?.curriculum?.[0]) {
        data.curriculumUrl = `/uploads/instructors/${files.curriculum[0].filename}`;
      }

      // Construir fullName si está presente firstName/lastName
      if ((data.firstName || data.lastName) && !data.fullName) {
        data.fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      }

      // Mapear campos del formulario a campos de base de datos
      if (data.experience) {
        data.bio = data.experience;
        delete data.experience;
      }

      // Procesar availability como availableDays array
      if (data.availability && typeof data.availability === 'string') {
        const availabilityMap: { [key: string]: string[] } = {
          'full-time': ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
          'part-time': ['Lunes', 'Miércoles', 'Viernes'],
          'weekends': ['Sábado', 'Domingo'],
          'evenings': ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
          'mornings': ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
          'flexible': ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        };
        data.availableDays = availabilityMap[data.availability] || ['Flexible'];
        delete data.availability;
      }

      // Procesar especialidades si vienen como string JSON
      if (data.specialties && typeof data.specialties === 'string') {
        try {
          data.specialties = JSON.parse(data.specialties);
        } catch (e) {
          // Si no es JSON válido, mantener como está
        }
      }
      
      console.log('🔍 DEBUG: Datos procesados para actualización:', { 
        fullName: data.fullName, 
        email: data.email, 
        firstName: data.firstName,
        lastName: data.lastName 
      });

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
      
      const evaluationData = {
        ...req.body,
        instructorId
      };
      
      const validationResult = insertInstructorEvaluationSchema.safeParse(evaluationData);
      
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
          instructorId // Asegurar que instructorId esté incluido
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