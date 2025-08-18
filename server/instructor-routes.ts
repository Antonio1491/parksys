import { Request, Response, Router } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from './db';
import { instructors, parks, activities, users } from '../shared/schema';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcryptjs from 'bcryptjs';

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
export function registerInstructorRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
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
              
              updatedInstructor.preferredParkName = parkResult[0]?.name || null;
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

      res.json(result[0]);
    } catch (error) {
      console.error('Error fetching instructor:', error);
      res.status(500).json({ message: 'Error al obtener instructor' });
    }
  });

  // Crear nuevo instructor (con creación automática de usuario) - maneja FormData
  apiRouter.post('/instructors', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'curriculum', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      console.log('📥 Datos recibidos en POST /instructors:', {
        body: req.body,
        files: req.files
      });

      const {
        firstName,
        lastName,
        email,
        phone,
        specialties: specialtiesStr,
        experienceYears,
        bio,
        qualifications,
        availability,
        hourlyRate,

        preferredParkId
      } = req.body;

      // Parsear specialties de string a array
      let specialties = [];
      try {
        specialties = specialtiesStr ? JSON.parse(specialtiesStr) : [];
      } catch (e) {
        specialties = [specialtiesStr]; // Si no es JSON válido, usar como string único
      }

      // Parsear availability - convertir string único a array
      let availabilityArray = [];
      if (availability) {
        if (availability.startsWith('[')) {
          try {
            availabilityArray = JSON.parse(availability);
          } catch (e) {
            availabilityArray = [availability];
          }
        } else {
          availabilityArray = [availability];
        }
      }

      // Parsear qualifications como certifications array
      let certificationsArray = [];
      if (qualifications) {
        if (qualifications.startsWith('[')) {
          try {
            certificationsArray = JSON.parse(qualifications);
          } catch (e) {
            certificationsArray = [qualifications];
          }
        } else {
          certificationsArray = [qualifications];
        }
      }

      console.log('🔍 Debugging arrays:', {
        specialties: { original: specialtiesStr, parsed: specialties },
        availability: { original: availability, parsed: availabilityArray },
        certifications: { original: qualifications, parsed: certificationsArray }
      });

      // Validaciones básicas
      if (!firstName || !lastName || !email) {
        console.log('❌ Validación fallida - campos requeridos:', { firstName, lastName, email });
        return res.status(400).json({ 
          message: 'Los campos nombre, apellido y email son requeridos' 
        });
      }

      // Verificar que el email no esté en uso
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ 
          message: 'Ya existe un usuario con este email' 
        });
      }

      // Procesar archivos subidos
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let profileImageUrl = '';
      let curriculumUrl = '';

      if (files?.profileImage?.[0]) {
        profileImageUrl = `/uploads/instructors/${files.profileImage[0].filename}`;
      }

      if (files?.curriculum?.[0]) {
        curriculumUrl = `/uploads/instructors/${files.curriculum[0].filename}`;
      }

      // Usar las specialties ya procesadas anteriormente
      const processedSpecialties = specialties;

      // 1. Primero crear el usuario automáticamente
      const hashedPassword = await bcryptjs.hash('instructor123', 10); // Contraseña temporal
      const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
      
      const userResult = await db
        .insert(users)
        .values({
          username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}`,
          email,
          fullName: `${firstName} ${lastName}`,
          password: hashedPassword,
          role: 'instructor',
          profileImageUrl,
          phone,
          bio,
          municipalityId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (userResult.length === 0) {
        throw new Error('Error al crear usuario para instructor');
      }

      const createdUser = userResult[0];

      // 2. Crear el registro del instructor vinculado al usuario
      const instructorResult = await db
        .insert(instructors)
        .values({
          fullName: `${firstName} ${lastName}`,
          firstName,
          lastName,
          email,
          phone: phone || '',
          specialties: processedSpecialties,
          certifications: certificationsArray,
          experienceYears: parseInt(experienceYears) || 1,
          bio: bio || '',
          qualifications: qualifications || '',
          availableDays: availabilityArray,
          hourlyRate: parseFloat(hourlyRate) || 0,
          preferredParkId: preferredParkId ? parseInt(preferredParkId) : null,
          profileImageUrl,
          curriculumUrl,
          userId: createdUser.id,
          rating: 0,
          activitiesCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log('✅ Instructor creado exitosamente:', {
        instructorId: instructorResult[0].id,
        userId: createdUser.id,
        email,
        name: `${firstName} ${lastName}`
      });

      res.status(201).json({
        message: 'Instructor creado exitosamente',
        instructor: instructorResult[0],
        user: {
          id: createdUser.id,
          username: createdUser.username,
          email: createdUser.email,
          role: createdUser.role
        }
      });

    } catch (error) {
      console.error('❌ Error creating instructor:', error);
      
      // Si el error está relacionado con la creación del usuario
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return res.status(400).json({ 
          message: 'Ya existe un usuario con este email o nombre de usuario' 
        });
      }
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Error al crear instructor' 
      });
    }
  });

  // Actualizar instructor
  apiRouter.put('/instructors/:id', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'curriculum', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);
      const {
        firstName,
        lastName,
        email,
        phone,
        specialties,
        experienceYears,
        bio,
        qualifications,
        availability,
        hourlyRate,

        preferredParkId
      } = req.body;

      // Obtener instructor actual
      const currentInstructor = await db
        .select()
        .from(instructors)
        .where(eq(instructors.id, instructorId))
        .limit(1);

      if (currentInstructor.length === 0) {
        return res.status(404).json({ message: 'Instructor no encontrado' });
      }

      // Procesar archivos subidos
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let profileImageUrl = currentInstructor[0].profileImageUrl;
      let curriculumUrl = currentInstructor[0].curriculumUrl;

      if (files?.profileImage?.[0]) {
        profileImageUrl = `/uploads/instructors/${files.profileImage[0].filename}`;
      }

      if (files?.curriculum?.[0]) {
        curriculumUrl = `/uploads/instructors/${files.curriculum[0].filename}`;
      }

      // Procesar especialidades
      let processedSpecialties: string[] = [];
      try {
        processedSpecialties = typeof specialties === 'string' 
          ? JSON.parse(specialties) 
          : specialties || [];
      } catch (error) {
        processedSpecialties = currentInstructor[0].specialties || [];
      }

      // Parsear availability - convertir string único a array
      let availabilityArray = [];
      if (availability) {
        if (availability.startsWith('[')) {
          try {
            availabilityArray = JSON.parse(availability);
          } catch (e) {
            availabilityArray = [availability];
          }
        } else {
          availabilityArray = [availability];
        }
      }

      // Actualizar instructor
      const updateData = {
        firstName,
        lastName,
        email,
        phone: phone || '',
        specialties: processedSpecialties,
        experienceYears: parseInt(experienceYears) || 1,
        bio: bio || '',
        qualifications: qualifications || '',
        availableDays: availabilityArray,
        hourlyRate: parseFloat(hourlyRate) || 0,
        preferredParkId: preferredParkId ? parseInt(preferredParkId) : null,
        profileImageUrl,
        curriculumUrl,
        updatedAt: new Date(),
      };

      const result = await db
        .update(instructors)
        .set(updateData)
        .where(eq(instructors.id, instructorId))
        .returning();

      // También actualizar el usuario asociado si existe
      if (currentInstructor[0].userId) {
        await db
          .update(users)
          .set({
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            email,
            phone,
            bio,
            specialties: processedSpecialties,
    
            profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, currentInstructor[0].userId));
      }

      res.json({
        message: 'Instructor actualizado exitosamente',
        instructor: result[0]
      });

    } catch (error) {
      console.error('Error updating instructor:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Error al actualizar instructor' 
      });
    }
  });

  // Eliminar instructor
  apiRouter.delete('/instructors/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);

      // Obtener instructor para verificar si existe y obtener userId
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

      // Eliminar usuario asociado si existe
      if (instructor.userId) {
        await db
          .delete(users)
          .where(eq(users.id, instructor.userId));
      }

      console.log('✅ Instructor eliminado exitosamente:', {
        instructorId,
        userId: instructor.userId,
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

  // Endpoint público para obtener instructores (para landing pages)
  apiRouter.get('/public-api/instructors/public', async (req: Request, res: Response) => {
    try {
      const result = await db
        .select({
          id: instructors.id,
          firstName: instructors.firstName,
          lastName: instructors.lastName,
          specialties: instructors.specialties,
          experienceYears: instructors.experienceYears,
          bio: instructors.bio,
          profileImageUrl: instructors.profileImageUrl,
          rating: instructors.rating,
          preferredParkId: instructors.preferredParkId,
        })
        .from(instructors)
        .orderBy(desc(instructors.rating));

      res.json(result);
    } catch (error) {
      console.error('Error fetching public instructors:', error);
      res.status(500).json({ message: 'Error al obtener instructores públicos' });
    }
  });

  // Endpoint para obtener instructores de un parque específico
  apiRouter.get('/parks/:parkId/instructors', async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.parkId);
      
      const result = await db
        .select({
          id: instructors.id,
          firstName: instructors.firstName,
          lastName: instructors.lastName,
          specialties: instructors.specialties,
          experienceYears: instructors.experienceYears,
          bio: instructors.bio,
          profileImageUrl: instructors.profileImageUrl,
          rating: instructors.rating,
        })
        .from(instructors)
        .where(eq(instructors.preferredParkId, parkId))
        .orderBy(desc(instructors.rating));

      res.json(result);
    } catch (error) {
      console.error('Error fetching park instructors:', error);
      res.status(500).json({ message: 'Error al obtener instructores del parque' });
    }
  });

  // Obtener actividades asignadas a un instructor
  apiRouter.get('/instructors/:id/assignments', async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);

      if (isNaN(instructorId)) {
        return res.status(400).json({ message: 'ID de instructor inválido' });
      }

      // Obtener actividades asignadas al instructor con información del parque
      const result = await db.execute(`
        SELECT 
          a.id, 
          a.title, 
          a.description, 
          a.start_date as "startDate", 
          a.end_date as "endDate", 
          a.location, 
          a.park_id as "parkId", 
          p.name as "parkName", 
          a.category, 
          a.category_id as "categoryId", 
          a.created_at as "createdAt"
        FROM activities a 
        LEFT JOIN parks p ON a.park_id = p.id 
        WHERE a.instructor_id = ${instructorId}
        ORDER BY a.start_date DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching instructor activities:', error);
      res.status(500).json({ message: 'Error al obtener actividades del instructor' });
    }
  });

  console.log('✅ Rutas de instructores registradas correctamente');
}