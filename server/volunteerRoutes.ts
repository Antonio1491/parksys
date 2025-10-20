import { Request, Response } from "express";
import { db } from "./db";
import { 
  insertVolunteerSchema,
  insertVolunteerParticipationSchema,
  insertVolunteerEvaluationSchema,
  insertVolunteerRecognitionSchema
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { replitObjectStorage } from './objectStorage-replit';
import { volunteers, volunteerParticipations, volunteerEvaluations, volunteerRecognitions, users, parks } from "@shared/schema";
// Importamos nuestro nuevo módulo para actualizar los campos de voluntarios preservando valores
import { 
  updateVolunteerFieldsPreserving, 
  updateExperienceAndAvailability,
  updateCompleteProfile
} from "./volunteer-fields-updater";

/**
 * Función que registra las rutas relacionadas con el módulo de voluntariado
 */
export function registerVolunteerRoutes(app: any, apiRouter: any, publicApiRouter: any, isAuthenticated: any) {
  
  // === RUTAS PARA VOLUNTARIOS ===
  
  // Endpoint público para obtener voluntarios con información del parque
  apiRouter.get("/volunteers/public", async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          v.id,
          v.full_name as "fullName",
          v.email,
          v.phone,
          v.skills,
          v.status,
          v.age,
          v.gender,
          v.available_hours as "availability",
          v.previous_experience as "experience",
          v.interest_areas as "interestAreas",
          v.available_days as "availableDays",
          v.created_at as "createdAt",
          v.profile_image_url as "profileImageUrl",
          v.preferred_park_id as "preferredParkId",
          p.name as "parkName"
        FROM volunteers v
        LEFT JOIN parks p ON v.preferred_park_id = p.id
        WHERE v.status = 'activo'
        ORDER BY v.created_at DESC
      `);
      
      // 🎯 NORMALIZAR URLs de imágenes antes de enviar al cliente
      const volunteersWithNormalizedImages = (result.rows || []).map(volunteer => ({
        ...volunteer,
        profileImageUrl: volunteer.profileImageUrl ? replitObjectStorage.normalizeUrl(volunteer.profileImageUrl) : volunteer.profileImageUrl
      }));
      
      res.json(volunteersWithNormalizedImages);
    } catch (error) {
      console.error('Error obteniendo voluntarios públicos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Crear un perfil de voluntario completo a partir de un usuario existente con rol "voluntario"
  apiRouter.post("/volunteers/create-from-user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { 
        fullName, email, phoneNumber, address, age, gender, 
        previousExperience, availability, availableDays, interestAreas, 
        preferredParkId, legalConsent, userId 
      } = req.body;
      
      // Validar que el usuario exista y tenga el rol "voluntario"
      const userResults = await db.execute(
        sql`SELECT * FROM users WHERE id = ${userId} AND role = 'voluntario'`
      );
      
      if (!userResults.rows || userResults.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "No se encontró el usuario o no tiene el rol de voluntario" 
        });
      }
      
      // Verificar si ya existe un voluntario asociado a este usuario
      const existingVolunteerResults = await db.execute(
        sql`SELECT * FROM volunteers WHERE email = ${email}`
      );
      
      if (existingVolunteerResults.rows && existingVolunteerResults.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Ya existe un voluntario con este correo electrónico" 
        });
      }
      
      // Crear el registro de voluntario en la base de datos
      const volunteerResult = await db.execute(
        sql`INSERT INTO volunteers (
          full_name, email, phone, address, age, gender, 
          previous_experience, available_hours, available_days, interest_areas,
          preferred_park_id, legal_consent, status, created_at, updated_at
        ) VALUES (
          ${fullName}, 
          ${email}, 
          ${phoneNumber || null}, 
          ${address || null}, 
          ${age ? parseInt(age) : null}, 
          ${gender || null},
          ${previousExperience || null}, 
          ${availability || null}, 
          ${availableDays ? JSON.stringify(availableDays) : null}, 
          ${interestAreas ? JSON.stringify(interestAreas) : null},
          ${preferredParkId ? parseInt(preferredParkId) : null}, 
          ${legalConsent === true}, 
          'active', 
          NOW(), 
          NOW()
        ) RETURNING *`
      );
      
      // Validar si se creó correctamente
      if (!volunteerResult.rows || volunteerResult.rows.length === 0) {
        return res.status(500).json({ 
          success: false, 
          message: "Error al crear el perfil de voluntario" 
        });
      }
      
      // Relacionar el usuario con el voluntario (esto podría hacerse en una tabla de relaciones si se desea)
      // Para esto habría que crear una tabla adicional, pero por ahora lo manejamos con el email
      
      res.status(201).json({
        success: true,
        message: "Perfil de voluntario creado exitosamente",
        volunteer: volunteerResult.rows[0]
      });
    } catch (error) {
      console.error("Error al crear perfil de voluntario desde usuario:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error interno al crear el perfil de voluntario" 
      });
    }
  });
  
  // Obtener todos los voluntarios (incluidos usuarios con rol 'voluntario')
  apiRouter.get("/volunteers", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      let allVolunteers: any[] = [];
      let userVolunteerIds: Set<number> = new Set(); // Para rastrear IDs de usuarios que ya son voluntarios
      
      // 1. Primero obtenemos los voluntarios tradicionales
      try {
        const traditionalVolunteersResult = await db.execute(
          sql`SELECT 
            id, 
            full_name, 
            email, 
            phone, 
            status, 
            profile_image_url as "profileImageUrl", 
            created_at,
            age,
            available_hours as availability,
            previous_experience,
            'module' as source
          FROM volunteers 
          WHERE status = 'activo'
          ORDER BY id DESC`
        );
        
        if (traditionalVolunteersResult.rows && Array.isArray(traditionalVolunteersResult.rows)) {
          // Normalizar URLs de imágenes antes de agregar voluntarios a la lista
          const volunteersWithNormalizedImages = traditionalVolunteersResult.rows.map(volunteer => ({
            ...volunteer,
            profileImageUrl: volunteer.profileImageUrl ? replitObjectStorage.normalizeUrl(volunteer.profileImageUrl) : volunteer.profileImageUrl
          }));
          
          // Agregamos los voluntarios tradicionales a nuestra lista
          allVolunteers = [...volunteersWithNormalizedImages];
          
          // Los voluntarios tradicionales no tienen user_id, simplemente agregamos los voluntarios
        }
      } catch (err) {
        console.error("Error al obtener voluntarios tradicionales:", err);
        // Continuamos con la siguiente consulta en caso de error
      }
      
      // Por ahora solo usamos los voluntarios de la tabla principal
      
      console.log(`Total de ${allVolunteers.length} voluntarios encontrados`);
      res.json(allVolunteers);
    } catch (error) {
      console.error("Error al obtener voluntarios:", error);
      res.status(500).json({ message: "Error al obtener voluntarios" });
    }
  });

  // Obtener un voluntario por ID de usuario
  apiRouter.get("/volunteers/by-user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario no válido" });
      }
      
      const result = await db.execute(
        sql`SELECT 
          id, 
          full_name, 
          email, 
          phone, 
          gender, 
          age, 
          status, 
          profile_image_url,
          previous_experience,
          available_hours,
          available_days,
          interest_areas,
          preferred_park_id,
          legal_consent,
          address,
          emergency_contact,
          emergency_phone,
          skills,
          created_at,
          updated_at,
        FROM volunteers 
        WHERE id = ${userId}
        AND status = 'active'`
      );
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ message: "Voluntario no encontrado para este usuario" });
      }
      
      // Log para depuración
      console.log("Datos del voluntario por usuario recuperados:", result.rows[0]);
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error(`Error al obtener voluntario con userId ${req.params.userId}:`, error);
      res.status(500).json({ message: "Error al obtener datos del voluntario" });
    }
  });
  
  // Obtener un voluntario específico (sin autenticación para edición admin)
  apiRouter.get("/volunteers/:id", async (req: Request, res: Response) => {
    try {
      const volunteerId = parseInt(req.params.id);
      
      if (isNaN(volunteerId)) {
        return res.status(400).json({ message: "ID de voluntario no válido" });
      }
      
      // Obtener datos del voluntario con información del usuario (LEFT JOIN para manejar voluntarios sin user_id)
      const result = await db.execute(
        sql`SELECT 
              v.id,
              v.full_name,
              v.email,
              v.phone,
              v.gender,
              v.status,
              v.address,
              v.emergency_contact,
              v.emergency_phone,
              v.preferred_park_id,
              v.previous_experience,
              v.skills,
              v.available_hours,
              v.available_days,
              v.interest_areas,
              v.legal_consent,
              v.age,
              v.profile_image_url,
              v.created_at,
              v.updated_at,
              v.full_name as user_full_name,
              '1990-01-01' as birth_date
            FROM volunteers v
            WHERE v.id = ${volunteerId}`
      );
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ message: "Voluntario no encontrado" });
      }
      
      const volunteerData = result.rows[0];
      
      // Formatear datos para el frontend
      // Separar nombre completo en first_name y last_name
      const fullName = volunteerData.user_full_name || volunteerData.full_name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Manejar áreas de interés - pueden estar como string JSON o array
      let interestAreas = [];
      try {
        if (typeof volunteerData.interest_areas === 'string') {
          interestAreas = JSON.parse(volunteerData.interest_areas);
        } else if (Array.isArray(volunteerData.interest_areas)) {
          interestAreas = volunteerData.interest_areas;
        }
      } catch (e) {
        interestAreas = [];
      }

      const formattedVolunteer = {
        id: volunteerData.id,
        firstName: firstName,
        lastName: lastName,
        email: volunteerData.email || '',
        phone: volunteerData.phone || '',
        gender: volunteerData.gender || 'no_especificar',
        birthDate: volunteerData.birth_date ? new Date(volunteerData.birth_date).toISOString().split('T')[0] : '1990-01-01',
        address: volunteerData.address || '',
        emergencyContactName: volunteerData.emergency_contact || '',
        emergencyContactPhone: volunteerData.emergency_phone || '',
        preferredParkId: volunteerData.preferred_park_id?.toString() || '',
        volunteerExperience: volunteerData.previous_experience || '',
        skills: volunteerData.skills || '',
        availability: volunteerData.available_hours || 'flexible',
        legalConsent: volunteerData.legal_consent !== false,
        status: volunteerData.status || 'active',
        userId: volunteerData.user_id,
        municipalityId: 2, // Guadalajara por defecto
        profileImageUrl: volunteerData.profile_image_url || null,
        // Manejar áreas de interés con datos por defecto
        interestNature: interestAreas.includes('nature') || interestAreas.includes('naturaleza'),
        interestEvents: interestAreas.includes('events') || interestAreas.includes('eventos'),
        interestEducation: interestAreas.includes('education') || interestAreas.includes('educacion'),
        interestMaintenance: interestAreas.includes('maintenance') || interestAreas.includes('mantenimiento'),
        interestSports: interestAreas.includes('sports') || interestAreas.includes('deportes'),
        interestCultural: interestAreas.includes('cultural') || interestAreas.includes('cultura'),
        // Valores por defecto para los campos requeridos
        ageConsent: true,
        conductConsent: true
      };
      
      res.json(formattedVolunteer);
    } catch (error) {
      console.error(`Error al obtener voluntario ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al obtener datos del voluntario" });
    }
  });

  // Crear nuevo voluntario
  // Configuración de multer para subida de imágenes de voluntarios
  const volunteerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Asegurarse de que el directorio existe
      const uploadDir = './public/uploads/volunteers';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'volunteer-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const volunteerUpload = multer({ 
    storage: volunteerStorage,
    limits: {
      fileSize: 5 * 1024 * 1024 // Límite de 5MB
    },
    fileFilter: function (req, file, cb) {
      // Aceptar solo imágenes
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Solo se permiten archivos de imagen'), false);
      }
      cb(null, true);
    }
  });

  // Registro público de voluntarios - Utilizamos directamente apiRouter en lugar de publicApiRouter
  apiRouter.post("/volunteers/register", volunteerUpload.single('profileImage'), async (req: Request, res: Response) => {
    try {
      // Campos mínimos requeridos para registro público
      const requiredFields = [
        'fullName', 'email', 'phoneNumber', 'address', 'birthDate', 
        'emergencyContact', 'emergencyPhone', 'availability', 'skills',
        'interests', 'previousExperience', 'healthConditions', 'occupation',
        'termsAccepted'
      ];
      
      // Validar que todos los campos obligatorios estén presentes
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({ 
            message: `El campo '${field}' es obligatorio` 
          });
        }
      }
      
      // Validar fecha de nacimiento (mayor de 18 años)
      const birthDate = new Date(req.body.birthDate);
      
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ 
          message: "Fecha de nacimiento no válida" 
        });
      }
      
      // Validar que sea mayor de 18 años
      const today = new Date();
      const minAgeDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      );
      
      if (birthDate > minAgeDate) {
        return res.status(400).json({ 
          message: "Debes ser mayor de 18 años para registrarte" 
        });
      }
      
      // Validar aceptación de términos
      if (req.body.termsAccepted !== 'true') {
        return res.status(400).json({ 
          message: "Debes aceptar los términos y condiciones" 
        });
      }
      
      // Usar SQL directo para insertar en volunteers con los nombres de columnas correctos
      const volunteerData = {
        user_id: 0, // Temporal, vamos a usar una consulta SQL directa
        full_name: req.body.fullName,
        age: req.body.age || null,
        gender: req.body.gender || null,
        email: req.body.email,
        phone: req.body.phoneNumber || null,
        profile_image_url: req.file ? `/uploads/volunteers/${req.file.filename}` : null,
        preferred_park_id: req.body.preferredParkId ? parseInt(req.body.preferredParkId) : null,
        interest_areas: null, // Simplificar por ahora
        available_days: null, // Simplificar por ahora
        available_hours: req.body.availableHours || null,
        previous_experience: req.body.previousExperience || null,
        legal_consent: req.body.termsAccepted === 'true',
        status: 'pending',
        address: req.body.address || null,
        emergency_contact: req.body.emergencyContact || null,
        emergency_phone: req.body.emergencyPhone || null,
        skills: req.body.skills || null
      };
      
      // Primero crear un usuario temporal para el voluntario
      const escapeSql = (str) => str ? str.replace(/'/g, "''") : null;
      
      // Crear usuario temporal en la tabla users
      const username = `${req.body.email.split('@')[0]}_${Date.now()}`;
      const userInsertQuery = `
        INSERT INTO users (
          username, email, password, full_name, phone, role, 
          gender, municipality_id, created_at, updated_at
        ) VALUES (
          '${username}',
          '${escapeSql(req.body.email)}',
          '',
          '${escapeSql(req.body.fullName)}',
          ${req.body.phoneNumber ? `'${escapeSql(req.body.phoneNumber)}'` : 'NULL'},
          'volunteer',
          'no especificado',
          2,
          NOW(),
          NOW()
        ) RETURNING id
      `;
      
      console.log('Usuario SQL Query:', userInsertQuery);
      const userResult = await db.execute(sql.raw(userInsertQuery));
      const newUserId = userResult.rows[0].id;
      
      // Ahora crear el registro de voluntario
      const volunteerInsertQuery = `
        INSERT INTO volunteers (
          user_id, full_name, gender, email, phone, address, emergency_contact,
          emergency_phone, previous_experience, legal_consent, status,
          skills, created_at, updated_at
        ) VALUES (
          ${newUserId}, 
          '${escapeSql(req.body.fullName)}', 
          'no especificado', 
          '${escapeSql(req.body.email)}', 
          ${req.body.phoneNumber ? `'${escapeSql(req.body.phoneNumber)}'` : 'NULL'}, 
          ${req.body.address ? `'${escapeSql(req.body.address)}'` : 'NULL'}, 
          ${req.body.emergencyContact ? `'${escapeSql(req.body.emergencyContact)}'` : 'NULL'}, 
          ${req.body.emergencyPhone ? `'${escapeSql(req.body.emergencyPhone)}'` : 'NULL'}, 
          ${req.body.previousExperience ? `'${escapeSql(req.body.previousExperience)}'` : 'NULL'}, 
          ${req.body.termsAccepted === 'true' ? 'true' : 'false'}, 
          'pending', 
          ${req.body.skills ? `'${escapeSql(req.body.skills)}'` : 'NULL'}, 
          NOW(), 
          NOW()
        ) RETURNING id, full_name, email, status, gender
      `;
      
      console.log('Voluntario SQL Query:', volunteerInsertQuery);
      const result = await db.execute(sql.raw(volunteerInsertQuery));
      
      const newVolunteer = result.rows[0];
      
      // Responder con éxito y datos básicos del voluntario
      res.status(201).json({
        id: newVolunteer.id,
        fullName: newVolunteer.full_name,
        email: newVolunteer.email,
        status: newVolunteer.status,
        message: "Solicitud de registro enviada exitosamente. En breve nos pondremos en contacto contigo."
      });
    } catch (error) {
      console.error("Error en registro público de voluntario:", error);
      res.status(400).json({ 
        message: "Error al procesar la solicitud de registro", 
        error: error instanceof Error ? error.message : "Error desconocido" 
      });
    }
  });

  apiRouter.post("/volunteers", volunteerUpload.single('profileImage'), async (req: Request, res: Response) => {
    try {
      console.log("Datos recibidos:", req.body);
      
      // Preparar datos incluyendo la imagen si se subió
      const formData = {
        ...req.body,
        profile_image_url: req.file ? `/uploads/volunteers/${req.file.filename}` : req.body.profile_image_url || null
      };
      
      // Adaptar los datos a la estructura real de la base de datos
      const volunteerData = {
        full_name: formData.full_name || "Sin nombre",
        email: formData.email || "voluntario@ejemplo.com",
        phone: formData.phone || "",
        age: parseInt(formData.age) || 30,
        status: formData.status || "active",
        previous_experience: formData.previous_experience || "",
        available_hours: formData.available_hours || "",
        gender: formData.gender || "No especificado",
        profile_image_url: formData.profile_image_url,
        legal_consent: formData.legal_consent === "true" || true,
        interest_areas: formData.interest_areas ? JSON.parse(formData.interest_areas) : [],
        available_days: formData.available_days ? JSON.parse(formData.available_days) : [],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Usar SQL directo para evitar problemas con el esquema
      const result = await db.execute(
        sql`INSERT INTO volunteers (
          full_name, email, phone, age, status, previous_experience, 
          available_hours, gender, profile_image_url, legal_consent, 
          interest_areas, available_days, created_at, updated_at
        ) VALUES (
          ${volunteerData.full_name}, ${volunteerData.email}, ${volunteerData.phone},
          ${volunteerData.age}, ${volunteerData.status}, ${volunteerData.previous_experience},
          ${volunteerData.available_hours}, ${volunteerData.gender}, ${volunteerData.profile_image_url},
          ${volunteerData.legal_consent}, ${JSON.stringify(volunteerData.interest_areas)}, 
          ${JSON.stringify(volunteerData.available_days)}, ${volunteerData.created_at}, ${volunteerData.updated_at}
        ) RETURNING *`
      );
      
      const newVolunteer = result.rows[0];
      res.status(201).json(newVolunteer);
    } catch (error) {
      console.error("Error al crear voluntario:", error);
      res.status(500).json({ message: "Error al crear voluntario", error: error.message });
    }
  });

  // Actualizar voluntario
  apiRouter.put("/volunteers/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const volunteerId = parseInt(req.params.id);
      
      if (isNaN(volunteerId)) {
        return res.status(400).json({ message: "ID de voluntario no válido" });
      }
      
      console.log("Actualizando voluntario ID:", volunteerId);
      console.log("Datos recibidos:", req.body);
      
      // Verificar si el voluntario existe
      const checkResult = await db.execute(
        sql`SELECT * FROM volunteers WHERE id = ${volunteerId}`
      );
      
      if (!checkResult.rows || checkResult.rows.length === 0) {
        return res.status(404).json({ message: "Voluntario no encontrado" });
      }
      
      const existingVolunteer = checkResult.rows[0];
      
      // Preparar datos para la actualización
      console.log("Body completo recibido:", JSON.stringify(req.body, null, 2));
      console.log("preferredParkId recibido:", req.body.preferredParkId, "tipo:", typeof req.body.preferredParkId);
      console.log("Areas de interés recibidas:", {
        nature: req.body.interestNature,
        events: req.body.interestEvents,
        education: req.body.interestEducation,
        maintenance: req.body.interestMaintenance,
        sports: req.body.interestSports,
        cultural: req.body.interestCultural
      });
      
      // Convertir los datos del formulario del frontend a formato backend
      const updateData = {
        full_name: `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim(),
        email: req.body.email,
        phone: req.body.phone,
        gender: req.body.gender,
        address: req.body.address,
        emergency_contact: req.body.emergencyContactName,
        emergency_phone: req.body.emergencyContactPhone,
        preferred_park_id: req.body.preferredParkId && req.body.preferredParkId !== '' ? parseInt(req.body.preferredParkId) : null,
        previous_experience: req.body.volunteerExperience,
        skills: req.body.skills,
        available_hours: req.body.availability,
        legal_consent: req.body.legalConsent
      };
      
      // Construir areas de interés basadas en los checkboxes del frontend
      const interestAreas = [];
      if (req.body.interestNature) interestAreas.push('nature');
      if (req.body.interestEvents) interestAreas.push('events');
      if (req.body.interestEducation) interestAreas.push('education');
      if (req.body.interestMaintenance) interestAreas.push('maintenance');
      if (req.body.interestSports) interestAreas.push('sports');
      if (req.body.interestCultural) interestAreas.push('cultural');
      
      // Preparar arrays para PostgreSQL usando sintaxis nativa
      const availableDaysArray = `{${['flexible'].join(',')}}`;
      const interestAreasArray = `{${interestAreas.join(',')}}`;
        
      // Usar SQL directo para actualizar todos los campos usando los datos mapeados
      const result = await db.execute(
        sql`UPDATE volunteers SET
          full_name = ${updateData.full_name || existingVolunteer.full_name},
          email = ${updateData.email || existingVolunteer.email},
          phone = ${updateData.phone || existingVolunteer.phone},
          gender = ${updateData.gender || existingVolunteer.gender},
          address = ${updateData.address || existingVolunteer.address},
          emergency_contact = ${updateData.emergency_contact || existingVolunteer.emergency_contact},
          emergency_phone = ${updateData.emergency_phone || existingVolunteer.emergency_phone},
          preferred_park_id = ${updateData.preferred_park_id !== null ? updateData.preferred_park_id : existingVolunteer.preferred_park_id},
          previous_experience = ${updateData.previous_experience || existingVolunteer.previous_experience},
          skills = ${updateData.skills || existingVolunteer.skills},
          available_hours = ${updateData.available_hours || existingVolunteer.available_hours},
          available_days = ${availableDaysArray}::text[],
          interest_areas = ${interestAreasArray}::text[],
          legal_consent = ${updateData.legal_consent !== undefined ? updateData.legal_consent : existingVolunteer.legal_consent},
          updated_at = NOW()
        WHERE id = ${volunteerId}
        RETURNING *`
      );
      
      console.log("Resultado de la actualización:", result.rows[0]);
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(500).json({ message: "Error al actualizar el voluntario" });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error(`Error al actualizar voluntario ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al actualizar voluntario" });
    }
  });

  // Cambiar estado de voluntario (activar/desactivar)
  apiRouter.patch("/volunteers/:id/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const volunteerId = parseInt(req.params.id);
      
      if (isNaN(volunteerId)) {
        return res.status(400).json({ message: "ID de voluntario no válido" });
      }
      
      const { status } = req.body;
      
      if (!status || !["active", "inactive", "suspended", "pending"].includes(status)) {
        return res.status(400).json({ message: "Estado no válido. Debe ser 'active', 'inactive', 'pending' o 'suspended'" });
      }
      
      // Verificar si el voluntario existe
      const [existingVolunteer] = await db
        .select()
        .from(volunteers)
        .where(eq(volunteers.id, volunteerId));
      
      if (!existingVolunteer) {
        return res.status(404).json({ message: "Voluntario no encontrado" });
      }
      
      // Actualizar el estado del voluntario
      const [updatedVolunteer] = await db
        .update(volunteers)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(volunteers.id, volunteerId))
        .returning();
        
      res.json(updatedVolunteer);
    } catch (error) {
      console.error(`Error al actualizar estado del voluntario ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al actualizar estado del voluntario" });
    }
  });

  // Eliminar voluntario (soft delete cambiando estado a "inactive")
  apiRouter.delete("/volunteers/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const volunteerId = parseInt(req.params.id);
      
      if (isNaN(volunteerId)) {
        return res.status(400).json({ message: "ID de voluntario no válido" });
      }
      
      // Usamos SQL directo para evitar problemas con los campos
      const existingVolunteerResult = await db.execute(
        sql`SELECT * FROM volunteers WHERE id = ${volunteerId}`
      );
      
      if (!existingVolunteerResult.rows || existingVolunteerResult.rows.length === 0) {
        return res.status(404).json({ message: "Voluntario no encontrado" });
      }
      
      // Realizamos un soft delete cambiando el estado a "inactive" con SQL directo
      await db.execute(
        sql`UPDATE volunteers SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ${volunteerId}`
      );
        
      res.json({ message: "Voluntario inactivado correctamente", volunteerId });
    } catch (error) {
      console.error(`Error al eliminar voluntario ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al eliminar voluntario" });
    }
  });
  
  // Eliminar todos los voluntarios (soft delete cambiando estado a "inactive" para todos)
  apiRouter.delete("/volunteers/batch/all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Solo administradores pueden usar esta función
      if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ message: "No autorizado. Solo administradores pueden realizar esta acción" });
      }
      
      // Obtenemos una lista de IDs de voluntarios activos para mostrar el conteo
      const activeVolunteers = await db.execute(
        sql`SELECT id FROM volunteers WHERE status = 'active'`
      );
      
      const activeCount = activeVolunteers.rows?.length || 0;
      
      if (activeCount === 0) {
        return res.json({ 
          message: "No hay voluntarios activos para eliminar",
          count: 0
        });
      }
      
      // Realizamos un soft delete cambiando el estado a "inactive" para todos los voluntarios activos
      await db.execute(
        sql`UPDATE volunteers SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE status = 'active'`
      );
      
      res.json({ 
        message: `${activeCount} voluntarios han sido inactivados correctamente`,
        count: activeCount
      });
    } catch (error) {
      console.error("Error al eliminar todos los voluntarios:", error);
      res.status(500).json({ message: "Error al eliminar voluntarios" });
    }
  });

  // Ruta específica para actualizar solo experiencia y disponibilidad
  apiRouter.post("/volunteers/experience/:id", async (req: Request, res: Response) => {
    try {
      const volunteerId = parseInt(req.params.id);
      const { experience, availability } = req.body;
      
      if (isNaN(volunteerId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID de voluntario no válido" 
        });
      }
      
      console.log(`Actualizando experiencia y disponibilidad para voluntario ${volunteerId}:`, {
        experience, availability
      });
      
      const updatedVolunteer = await updateExperienceAndAvailability(
        volunteerId, 
        experience,
        availability
      );
      
      if (!updatedVolunteer) {
        return res.status(500).json({ 
          success: false, 
          message: "No se pudo actualizar la experiencia del voluntario" 
        });
      }
      
      res.json({
        success: true,
        message: "Experiencia y disponibilidad actualizadas correctamente",
        data: {
          experience: updatedVolunteer.previous_experience,
          availability: updatedVolunteer.available_hours
        }
      });
    } catch (error) {
      console.error("Error al actualizar experiencia y disponibilidad:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error al actualizar la experiencia y disponibilidad" 
      });
    }
  });

  // === RUTAS PARA PARTICIPACIONES ===

  // Obtener todas las participaciones 
  // Usamos un nombre diferente para el endpoint para evitar conflictos con la ruta parametrizada
  apiRouter.get("/participations/all", async (_req: Request, res: Response) => {
    try {
      console.log("Obteniendo todas las participaciones");

      const { pool } = await import("./db");

      const result = await pool.query(`
        SELECT 
          id,
          volunteer_id as "volunteerId",
          activity_id as "activityId",
          activity_name as "activityName",
          activity_date as "activityDate",
          hours_contributed as "hoursContributed",
          park_id as "parkId",
          supervisor_id as "supervisorId",
          notes,
          created_at as "createdAt"
        FROM volunteer_participations
        ORDER BY activity_date DESC NULLS LAST
      `);

      console.log(`Se encontraron ${result.rows.length} participaciones`);
      res.json(result.rows);
    } catch (error) {
      console.error(`Error al obtener todas las participaciones:`, error);
      res.status(500).json({ 
        message: "Error al obtener participaciones",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Obtener participaciones de un voluntario
  apiRouter.get("/volunteers/:id/participations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const volunteerId = parseInt(req.params.id);

      if (isNaN(volunteerId)) {
        return res.status(400).json({ message: "ID de voluntario no válido" });
      }

      console.log(`Obteniendo participaciones para voluntario ${volunteerId}`);

      const { pool } = await import("./db");

      const result = await pool.query(`
        SELECT 
          vp.id,
          vp.volunteer_id as "volunteerId",
          vp.activity_id as "activityId",
          vp.activity_name as "activityName",
          vp.activity_date as "activityDate",
          vp.hours_contributed as "hoursContributed",
          vp.park_id as "parkId",
          vp.supervisor_id as "supervisorId",
          vp.notes,
          vp.created_at as "createdAt",
          p.name as "parkName"
        FROM volunteer_participations vp
        LEFT JOIN parks p ON vp.park_id = p.id
        WHERE vp.volunteer_id = $1
        ORDER BY vp.activity_date DESC NULLS LAST
      `, [volunteerId]);

      console.log(`Se encontraron ${result.rows.length} participaciones para voluntario ${volunteerId}`);
      res.json(result.rows);
    } catch (error) {
      console.error(`Error al obtener participaciones del voluntario ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Error al obtener participaciones",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Actualizar perfil completo de voluntario (para integrar con perfil de usuario)
  apiRouter.post("/volunteers/update-profile", async (req: Request, res: Response) => {
    try {
      console.log("🔥 DEBUGGING COMPLETO - TODO EL OBJETO REQ.BODY:");
      console.log(JSON.stringify(req.body, null, 2));
      
      console.log("🔥 TODAS LAS CLAVES DEL OBJETO:");
      console.log(Object.keys(req.body));
      
      // BÚSQUEDA EXHAUSTIVA de cualquier campo que contenga skills/habilidades
      let extractedSkills = undefined;
      
      // Primero intentamos la búsqueda directa
      if (req.body.skills !== undefined) {
        extractedSkills = req.body.skills;
        console.log("✅ Skills encontrados directamente:", extractedSkills);
      }
      
      // Si no encontramos directamente, buscamos en TODAS las claves
      if (extractedSkills === undefined) {
        for (const [key, value] of Object.entries(req.body)) {
          console.log(`🔍 Examinando clave '${key}' con valor:`, value);
          
          if (key.toLowerCase().includes('skill') || 
              key.toLowerCase().includes('habilidad') ||
              key === 'skill' || 
              key === 'Skills' || 
              key === 'SKILLS') {
            extractedSkills = value;
            console.log(`✅ Skills encontrados en clave '${key}':`, extractedSkills);
            break;
          }
        }
      }
      
      console.log("🎯 SKILLS FINALES EXTRAÍDOS:", extractedSkills);
      
      const { 
        userId, 
        volunteerId, 
        volunteerExperience, 
        availability,
        availableDays,
        legalConsent, 
        preferredParkId,
        interestNature,
        interestEvents,
        interestEducation,
        interestMaintenance,
        interestSports,
        interestCultural,
        address,
        emergencyContactName,
        emergencyContactPhone,
      } = req.body;
      
      // Usamos las habilidades extraídas en lugar de las originales
      const skills = extractedSkills;
      
      if (!volunteerId && !userId) {
        return res.status(400).json({ message: "Se requiere un ID de voluntario o usuario" });
      }
      
      // Buscar el ID del voluntario
      let volunteerIdToUpdate: number;
      
      if (volunteerId) {
        volunteerIdToUpdate = parseInt(volunteerId);
      } else {
        // Buscar por userId
        const volunteerResult = await db.execute(
          sql`SELECT id FROM volunteers WHERE user_id = ${parseInt(userId)}`
        );
        
        if (!volunteerResult.rows || volunteerResult.rows.length === 0) {
          return res.status(404).json({ message: "Voluntario no encontrado para este usuario" });
        }
        
        volunteerIdToUpdate = volunteerResult.rows[0].id;
      }
      
      // Preparar áreas de interés como un array
      const interestAreas = [];
      if (interestNature) interestAreas.push('nature');
      if (interestEvents) interestAreas.push('events');
      if (interestEducation) interestAreas.push('education');
      if (interestMaintenance) interestAreas.push('maintenance');
      if (interestSports) interestAreas.push('sports');
      if (interestCultural) interestAreas.push('cultural');
      
      // SOLUCIÓN MEJORADA: Usar el actualizador que preserva campos existentes
      try {
        console.log("ACTUALIZANDO DATOS con preservación de valores:", {
          volunteerExperience, 
          availability,
          availableDays,
          interestAreas,
          skills,
          address,
          emergencyContactName,
          emergencyContactPhone,
          volunteerIdToUpdate
        });
        
        // Verificar que el preferredParkId sea un número válido
        let parsedParkId = null;
        if (preferredParkId && !isNaN(parseInt(preferredParkId.toString()))) {
          parsedParkId = parseInt(preferredParkId.toString());
        }
        
        // IMPORTANTE: Solo enviamos campos si realmente tienen un valor
        // Esto garantiza que no sobrescribamos valores existentes con vacíos
        const updateData: any = {};
        
        // Solo incluimos la experiencia si se proporcionó explícitamente y no está vacía
        if (volunteerExperience !== undefined && volunteerExperience !== '') {
          updateData.experience = volunteerExperience;
        }
        
        // Solo incluimos disponibilidad si se proporcionó explícitamente y no está vacía
        if (availability !== undefined && availability !== '') {
          updateData.availability = availability;
        }
        
        // Solo incluimos días disponibles si se proporcionaron explícitamente
        if (availableDays !== undefined && availableDays !== '') {
          updateData.availableDays = availableDays;
        }
        
        // Solo incluimos habilidades si se proporcionaron explícitamente
        // IMPORTANTE: En este punto no filtramos strings vacíos para las habilidades
        // ya que puede ser que el usuario esté actualizando otros campos
        if (skills !== undefined) {
          updateData.skills = skills;
        }
        
        // Solo incluimos áreas de interés si hay alguna
        if (interestAreas && interestAreas.length > 0) {
          updateData.interestAreas = interestAreas;
        }
        
        // Incluimos los datos básicos que siempre se actualizan
        updateData.address = address;
        updateData.emergencyContact = emergencyContactName;
        updateData.emergencyPhone = emergencyContactPhone;
        updateData.preferredParkId = parsedParkId;
        updateData.legalConsent = legalConsent === true;
        
        // Ya hemos añadido las habilidades en la condición anterior, así que eliminamos esta duplicación
        
        console.log("🔍 Datos que se van a actualizar:", updateData);
        
        // Usamos el nuevo método que preserva los valores existentes
        const updatedVolunteer = await updateCompleteProfile(volunteerIdToUpdate, updateData);
        
        if (!updatedVolunteer) {
          return res.status(500).json({ message: "Error al actualizar el perfil del voluntario" });
        }
        
        console.log("✅ PERFIL ACTUALIZADO EXITOSAMENTE CON PRESERVACIÓN:", {
          experiencia: updatedVolunteer.previous_experience,
          disponibilidad: updatedVolunteer.available_hours,
          diasDisponibles: updatedVolunteer.available_days,
          areasInteres: updatedVolunteer.interest_areas,
          direccion: updatedVolunteer.address,
          contacto: updatedVolunteer.emergency_contact,
          telefono: updatedVolunteer.emergency_phone,
          habilidades: updatedVolunteer.skills
        });
        
        res.json(updatedVolunteer);
      } catch (updateError) {
        console.error("Error específico al actualizar el perfil:", updateError);
        res.status(500).json({ message: "Error al actualizar el perfil de voluntario" });
      }
    } catch (error) {
      console.error("Error al actualizar perfil de voluntario:", error);
      res.status(500).json({ message: "Error al actualizar perfil de voluntario" });
    }
  });
  
  // Registrar nueva participación
  apiRouter.post("/volunteers/:id/participations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const volunteerId = parseInt(req.params.id);

      if (isNaN(volunteerId)) {
        return res.status(400).json({ message: "ID de voluntario no válido" });
      }

      console.log(`Creando participación para voluntario ${volunteerId}:`, req.body);

      // Validar campos requeridos
      const { activityName, activityDate, hoursContributed, parkId, activityId, supervisorId, notes } = req.body;

      if (!activityName || !activityDate || !hoursContributed || !parkId) {
        return res.status(400).json({ 
          message: "Campos requeridos faltantes: activityName, activityDate, hoursContributed, parkId" 
        });
      }

      const { pool } = await import("./db");

      const result = await pool.query(`
        INSERT INTO volunteer_participations (
          volunteer_id,
          activity_id,
          activity_name,
          activity_date,
          hours_contributed,
          park_id,
          supervisor_id,
          notes,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING 
          id,
          volunteer_id as "volunteerId",
          activity_id as "activityId",
          activity_name as "activityName",
          activity_date as "activityDate",
          hours_contributed as "hoursContributed",
          park_id as "parkId",
          supervisor_id as "supervisorId",
          notes,
          created_at as "createdAt"
      `, [
        volunteerId,
        activityId || null,
        activityName,
        activityDate,
        hoursContributed,
        parkId,
        supervisorId || null,
        notes || null
      ]);

      console.log(`✅ Participación creada exitosamente:`, result.rows[0]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(`Error al crear participación para voluntario ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Error al registrar participación",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });
  
  // Obtener una participación específica por ID
  apiRouter.get("/participations/:id", async (req: Request, res: Response) => {
    try {
      const participationId = parseInt(req.params.id);

      if (isNaN(participationId)) {
        return res.status(400).json({ message: "ID de participación no válido" });
      }

      console.log(`Obteniendo participación ${participationId}`);

      const { pool } = await import("./db");

      const result = await pool.query(`
        SELECT 
          vp.id,
          vp.volunteer_id as "volunteerId",
          vp.activity_id as "activityId",
          vp.activity_name as "activityName",
          vp.activity_date as "activityDate",
          vp.hours_contributed as "hoursContributed",
          vp.park_id as "parkId",
          vp.supervisor_id as "supervisorId",
          vp.notes,
          vp.created_at as "createdAt",
          v.full_name as "volunteerName",
          p.name as "parkName"
        FROM volunteer_participations vp
        LEFT JOIN volunteers v ON vp.volunteer_id = v.id
        LEFT JOIN parks p ON vp.park_id = p.id
        WHERE vp.id = $1
      `, [participationId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Participación no encontrada" });
      }

      console.log(`✅ Participación encontrada:`, result.rows[0]);
      res.json(result.rows[0]);
    } catch (error) {
      console.error(`Error al obtener participación ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Error al obtener datos de la participación",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });
  
  // Actualizar una participación
  apiRouter.put("/participations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const participationId = parseInt(req.params.id);

      if (isNaN(participationId)) {
        return res.status(400).json({ message: "ID de participación no válido" });
      }

      console.log(`Actualizando participación ${participationId}:`, req.body);

      const { pool } = await import("./db");

      // Verificar si la participación existe
      const checkResult = await pool.query(
        'SELECT id, volunteer_id FROM volunteer_participations WHERE id = $1',
        [participationId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: "Participación no encontrada" });
      }

      // Preparar datos para actualización (solo campos permitidos)
      const { activityName, activityDate, hoursContributed, parkId, activityId, supervisorId, notes } = req.body;

      // Construir query dinámica solo con campos proporcionados
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (activityName !== undefined) {
        updateFields.push(`activity_name = $${paramIndex++}`);
        values.push(activityName);
      }
      if (activityDate !== undefined) {
        updateFields.push(`activity_date = $${paramIndex++}`);
        values.push(activityDate);
      }
      if (hoursContributed !== undefined) {
        updateFields.push(`hours_contributed = $${paramIndex++}`);
        values.push(hoursContributed);
      }
      if (parkId !== undefined) {
        updateFields.push(`park_id = $${paramIndex++}`);
        values.push(parkId);
      }
      if (activityId !== undefined) {
        updateFields.push(`activity_id = $${paramIndex++}`);
        values.push(activityId);
      }
      if (supervisorId !== undefined) {
        updateFields.push(`supervisor_id = $${paramIndex++}`);
        values.push(supervisorId);
      }
      if (notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ message: "No hay campos para actualizar" });
      }

      // Agregar ID al final de los valores
      values.push(participationId);

      const result = await pool.query(`
        UPDATE volunteer_participations 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING 
          id,
          volunteer_id as "volunteerId",
          activity_id as "activityId",
          activity_name as "activityName",
          activity_date as "activityDate",
          hours_contributed as "hoursContributed",
          park_id as "parkId",
          supervisor_id as "supervisorId",
          notes,
          created_at as "createdAt"
      `, values);

      console.log(`✅ Participación actualizada exitosamente:`, result.rows[0]);
      res.json(result.rows[0]);
    } catch (error) {
      console.error(`Error al actualizar participación ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Error al actualizar participación",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // === RUTAS PARA EVALUACIONES ===

  // Obtener todas las evaluaciones
  apiRouter.get("/volunteers/evaluations/all", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      console.log("Obteniendo todas las evaluaciones");
      const evaluations = await db
        .select()
        .from(volunteerEvaluations)
        .orderBy(desc(volunteerEvaluations.createdAt));
        
      console.log(`Se encontraron ${evaluations.length} evaluaciones`);
      res.json(evaluations);
    } catch (error) {
      console.error("Error al obtener evaluaciones:", error);
      res.status(500).json({ message: "Error al obtener evaluaciones" });
    }
  });
  
  // Obtener una evaluación específica por ID
  apiRouter.get("/volunteers/evaluations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const evaluationId = parseInt(req.params.id);
      
      if (isNaN(evaluationId)) {
        return res.status(400).json({ message: "ID de evaluación inválido" });
      }
      
      const [evaluation] = await db
        .select()
        .from(volunteerEvaluations)
        .where(eq(volunteerEvaluations.id, evaluationId));
        
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluación no encontrada" });
      }
      
      res.json(evaluation);
    } catch (error) {
      console.error("Error al obtener evaluación:", error);
      res.status(500).json({ message: "Error al obtener evaluación" });
    }
  });
  
  // Actualizar una evaluación
  apiRouter.put("/volunteers/evaluations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const evaluationId = parseInt(req.params.id);
      
      if (isNaN(evaluationId)) {
        return res.status(400).json({ message: "ID de evaluación inválido" });
      }
      
      const { punctuality, attitude, responsibility, overallPerformance, comments, followUpRequired } = req.body;
      
      // Validar los campos requeridos
      if (punctuality === undefined || attitude === undefined || 
          responsibility === undefined || overallPerformance === undefined) {
        return res.status(400).json({ message: "Faltan campos requeridos" });
      }
      
      // Actualizar la evaluación
      const [updatedEvaluation] = await db
        .update(volunteerEvaluations)
        .set({
          punctuality,
          attitude,
          responsibility,
          overallPerformance,
          comments,
          followUpRequired,
          updatedAt: new Date(),
        })
        .where(eq(volunteerEvaluations.id, evaluationId))
        .returning();
      
      if (!updatedEvaluation) {
        return res.status(404).json({ message: "Evaluación no encontrada" });
      }
      
      res.json(updatedEvaluation);
    } catch (error) {
      console.error("Error al actualizar evaluación:", error);
      res.status(500).json({ message: "Error al actualizar evaluación" });
    }
  });

  // Obtener evaluaciones de un voluntario
  apiRouter.get("/volunteers/:id/evaluations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const volunteerId = parseInt(req.params.id);
      
      if (isNaN(volunteerId)) {
        return res.status(400).json({ message: "ID de voluntario no válido" });
      }
      
      const evaluations = await db
        .select()
        .from(volunteerEvaluations)
        .where(eq(volunteerEvaluations.volunteerId, volunteerId))
        .orderBy(desc(volunteerEvaluations.createdAt));
        
      res.json(evaluations);
    } catch (error) {
      console.error(`Error al obtener evaluaciones del voluntario ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al obtener evaluaciones" });
    }
  });

  // Crear evaluación para una participación
  apiRouter.post("/participations/:id/evaluations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const participationId = parseInt(req.params.id);
      
      if (isNaN(participationId)) {
        return res.status(400).json({ message: "ID de participación no válido" });
      }
      
      // Verificar que existe la participación
      const [participation] = await db
        .select()
        .from(volunteerParticipations)
        .where(eq(volunteerParticipations.id, participationId));
      
      if (!participation) {
        return res.status(404).json({ message: "Participación no encontrada" });
      }
      
      // Aseguramos que el participationId coincida con el de la URL
      const evaluationData = {
        ...req.body,
        participationId,
        // Tomamos el ID del voluntario de la participación
        volunteerId: participation.volunteerId,
        // El evaluador es el usuario autenticado o el proporcionado en el cuerpo
        evaluatorId: req.user?.id || req.body.evaluatorId,
        // Agregamos la fecha de creación
        createdAt: new Date()
      };
      
      const validationResult = insertVolunteerEvaluationSchema.safeParse(evaluationData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos de evaluación no válidos", 
          errors: validationResult.error.format() 
        });
      }
      
      // Insertamos la nueva evaluación en la base de datos
      const [newEvaluation] = await db
        .insert(volunteerEvaluations)
        .values(validationResult.data)
        .returning();
        
      res.status(201).json(newEvaluation);
    } catch (error) {
      console.error(`Error al crear evaluación para participación ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al registrar evaluación" });
    }
  });

  // === RUTAS PARA RECONOCIMIENTOS ===
  
  // Obtener todos los reconocimientos (importante colocar las rutas más específicas primero)
  apiRouter.get("/volunteers/recognitions/all", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      console.log("Obteniendo todos los reconocimientos");
      const result = await db.execute(sql`
        SELECT 
          id,
          volunteer_id,
          recognition_type,
          level,
          reason,
          hours_completed,
          certificate_url,
          issued_at,
          issued_by_id,
          additional_comments
        FROM volunteer_recognitions 
        ORDER BY issued_at DESC
      `);
      
      const recognitions = result.rows;
      console.log(`Se encontraron ${recognitions.length} reconocimientos`);
      res.json(recognitions);
    } catch (error) {
      console.error("Error al obtener reconocimientos:", error);
      res.status(500).json({ message: "Error al obtener reconocimientos" });
    }
  });

  // Obtener reconocimientos de un voluntario específico
  apiRouter.get("/volunteers/:id/recognitions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const volunteerId = parseInt(req.params.id);
      
      if (isNaN(volunteerId)) {
        return res.status(400).json({ message: "ID de voluntario no válido" });
      }
      
      const result = await db.execute(sql`
        SELECT 
          id,
          volunteer_id,
          recognition_type,
          level,
          reason,
          hours_completed,
          certificate_url,
          issued_at,
          issued_by_id,
          additional_comments
        FROM volunteer_recognitions 
        WHERE volunteer_id = ${volunteerId}
        ORDER BY issued_at DESC
      `);
      
      const recognitions = result.rows;
      res.json(recognitions);
    } catch (error) {
      console.error(`Error al obtener reconocimientos del voluntario ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al obtener reconocimientos" });
    }
  });

  // Crear reconocimiento para un voluntario
  apiRouter.post("/volunteers/:id/recognitions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const volunteerId = parseInt(req.params.id);
      
      if (isNaN(volunteerId)) {
        return res.status(400).json({ message: "ID de voluntario no válido" });
      }
      
      // Verificar que existe el voluntario
      const [volunteer] = await db
        .select()
        .from(volunteers)
        .where(eq(volunteers.id, volunteerId));
      
      if (!volunteer) {
        return res.status(404).json({ message: "Voluntario no encontrado" });
      }
      
      // Aseguramos que el volunteerId coincida con el de la URL
      const recognitionData = {
        ...req.body,
        volunteerId,
        // El emisor es el usuario autenticado o el proporcionado en el cuerpo
        issuedById: req.user?.id || req.body.issuedById,
        // Agregamos la fecha de creación
        createdAt: new Date()
      };
      
      const validationResult = insertVolunteerRecognitionSchema.safeParse(recognitionData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos de reconocimiento no válidos", 
          errors: validationResult.error.format() 
        });
      }
      
      // Insertamos el nuevo reconocimiento en la base de datos
      const [newRecognition] = await db
        .insert(volunteerRecognitions)
        .values(validationResult.data)
        .returning();
        
      res.status(201).json(newRecognition);
    } catch (error) {
      console.error(`Error al crear reconocimiento para voluntario ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al crear reconocimiento" });
    }
  });
  
  // === RUTAS PARA ESTADÍSTICAS ===
  
  // Obtener estadísticas del dashboard de un voluntario específico
  apiRouter.get("/volunteers/dashboard", async (req: Request, res: Response) => {
    try {
      const volunteerId = req.query.id;
      
      if (!volunteerId) {
        return res.status(400).json({ message: "ID de voluntario no proporcionado" });
      }
      
      console.log("Consultando dashboard para voluntario ID:", volunteerId);
      
      // Manejar el ID del voluntario de manera más robusta
      const numVolunteerId = parseInt(volunteerId as string, 10);
      
      if (isNaN(numVolunteerId)) {
        console.error("ID de voluntario no válido:", volunteerId);
        return res.status(400).json({ message: "ID de voluntario no válido" });
      }
      
      console.log("Buscando voluntario con ID:", numVolunteerId);
      
      // Obtener información básica del voluntario
      const [volunteerInfo] = await db
        .select({
          id: volunteers.id,
          fullName: volunteers.fullName,
          email: volunteers.email,
          status: volunteers.status,
          totalHours: sql<number>`COALESCE(
            (SELECT SUM(hours_contributed) FROM volunteer_participations WHERE volunteer_id = ${volunteers.id}), 0
          )::int`,
          joinDate: volunteers.createdAt,
          profileImage: volunteers.profileImageUrl
        })
        .from(volunteers)
        .where(eq(volunteers.id, numVolunteerId));
        
      if (!volunteerInfo) {
        return res.status(404).json({ message: "Voluntario no encontrado" });
      }
      
      // Participaciones del voluntario
      const participations = await db
        .select({
          id: volunteerParticipations.id,
          activityName: volunteerParticipations.activityName,
          activityDate: volunteerParticipations.activityDate,
          hoursContributed: volunteerParticipations.hoursContributed,
          parkId: volunteerParticipations.parkId,
          role: sql<string>`'Voluntario'::text`,
          status: sql<string>`'Completado'::text`
        })
        .from(volunteerParticipations)
        .where(eq(volunteerParticipations.volunteerId, Number(volunteerId)))
        .orderBy(desc(volunteerParticipations.activityDate))
        .limit(5);
        
      // Obtener nombres de parques
      const parkIds = participations.map(p => p.parkId);
      let parkNames: { id: number, name: string }[] = [];
      
      if (parkIds.length > 0) {
        parkNames = await db
          .select({
            id: parks.id,
            name: parks.name
          })
          .from(parks)
          .where(sql`${parks.id} = ANY(${parkIds})`);
      }
      
      const participationsWithParkNames = participations.map(p => {
        const park = parkNames.find(park => park.id === p.parkId);
        return {
          ...p,
          parkName: park ? park.name : 'Parque desconocido'
        };
      });
      
      // Evaluaciones del voluntario
      const evaluations = await db
        .select({
          id: volunteerEvaluations.id,
          evaluationDate: volunteerEvaluations.createdAt,
          punctuality: volunteerEvaluations.punctuality,
          attitude: volunteerEvaluations.attitude,
          responsibility: volunteerEvaluations.responsibility,
          overallPerformance: volunteerEvaluations.overallPerformance,
          comments: volunteerEvaluations.comments
        })
        .from(volunteerEvaluations)
        .where(eq(volunteerEvaluations.volunteerId, Number(volunteerId)))
        .orderBy(desc(volunteerEvaluations.createdAt))
        .limit(5);
        
      // Reconocimientos del voluntario
      const recognitions = await db
        .select({
          id: volunteerRecognitions.id,
          recognitionType: volunteerRecognitions.recognitionType,
          achievementDate: volunteerRecognitions.date,
          description: volunteerRecognitions.notes,
          createdAt: sql<Date>`NOW()`
        })
        .from(volunteerRecognitions)
        .where(eq(volunteerRecognitions.volunteerId, Number(volunteerId)))
        .orderBy(desc(volunteerRecognitions.date))
        .limit(5);
        
      // Estadísticas básicas
      const [hoursStats] = await db
        .select({
          totalHours: sql<number>`sum(${volunteerParticipations.hoursContributed})::int`,
          avgHoursPerActivity: sql<number>`avg(${volunteerParticipations.hoursContributed})::float`,
          participationCount: sql<number>`count(*)::int`
        })
        .from(volunteerParticipations)
        .where(eq(volunteerParticipations.volunteerId, Number(volunteerId)));
        
      // Promedio de evaluaciones
      const [avgEvaluation] = await db
        .select({
          avgPunctuality: sql<number>`avg(${volunteerEvaluations.punctuality})::float`,
          avgAttitude: sql<number>`avg(${volunteerEvaluations.attitude})::float`,
          avgResponsibility: sql<number>`avg(${volunteerEvaluations.responsibility})::float`,
          avgOverall: sql<number>`avg(${volunteerEvaluations.overallPerformance})::float`
        })
        .from(volunteerEvaluations)
        .where(eq(volunteerEvaluations.volunteerId, Number(volunteerId)));
        
      // Devolver todos los datos en formato dashboard
      res.json({
        volunteerInfo,
        stats: {
          participations: {
            count: hoursStats?.participationCount || 0,
            totalHours: hoursStats?.totalHours || 0,
            avgHoursPerActivity: hoursStats?.avgHoursPerActivity || 0
          },
          evaluations: {
            avgPunctuality: avgEvaluation?.avgPunctuality || 0,
            avgAttitude: avgEvaluation?.avgAttitude || 0,
            avgResponsibility: avgEvaluation?.avgResponsibility || 0,
            avgOverall: avgEvaluation?.avgOverall || 0
          },
          recognitions: {
            count: recognitions.length
          }
        },
        recentActivity: {
          participations: participationsWithParkNames,
          evaluations,
          recognitions
        }
      });
    } catch (error) {
      console.error(`Error al obtener dashboard del voluntario:`, error);
      res.status(500).json({ message: "Error al obtener dashboard del voluntario" });
    }
  });
  
  // Obtener estadísticas generales del dashboard de voluntarios
  apiRouter.get("/volunteers/stats/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Conteo total de voluntarios por estado
      const volunteersByStatus = await db
        .select({
          status: volunteers.status,
          count: sql<number>`count(*)::int`
        })
        .from(volunteers)
        .groupBy(volunteers.status);
        
      // Total de horas de voluntariado
      const [totalHours] = await db
        .select({
          total: sql<number>`sum(${volunteerParticipations.hoursContributed})::int`
        })
        .from(volunteerParticipations);
        
      // Actividades más populares
      const popularActivities = await db
        .select({
          activityName: volunteerParticipations.activityName,
          count: sql<number>`count(*)::int`
        })
        .from(volunteerParticipations)
        .groupBy(volunteerParticipations.activityName)
        .orderBy(sql`count(*) desc`)
        .limit(5);
        
      // Parques con más participación
      const popularParks = await db
        .select({
          parkId: volunteerParticipations.parkId,
          count: sql<number>`count(*)::int`
        })
        .from(volunteerParticipations)
        .groupBy(volunteerParticipations.parkId)
        .orderBy(sql`count(*) desc`)
        .limit(5);
        
      // Obtener nombres de parques populares
      const parkIds = popularParks.map(p => p.parkId);
      let parkNames = [];
      
      if (parkIds.length > 0) {
        parkNames = await db
          .select({
            id: parks.id,
            name: parks.name
          })
          .from(parks)
          .where(sql`${parks.id} = ANY(${parkIds})`);
      }
      
      // Combinar datos de parques populares con sus nombres
      const parksWithNames = popularParks.map(park => {
        const parkInfo = parkNames.find(p => p.id === park.parkId);
        return {
          ...park,
          parkName: parkInfo ? parkInfo.name : 'Parque desconocido'
        };
      });
      
      // Rendimiento promedio de los voluntarios
      const [avgPerformance] = await db
        .select({
          punctuality: sql<number>`avg(${volunteerEvaluations.punctuality})::float`,
          attitude: sql<number>`avg(${volunteerEvaluations.attitude})::float`,
          responsibility: sql<number>`avg(${volunteerEvaluations.responsibility})::float`,
          overall: sql<number>`avg(${volunteerEvaluations.overallPerformance})::float`
        })
        .from(volunteerEvaluations);
      
      res.json({
        volunteerCounts: {
          total: volunteersByStatus.reduce((sum, group) => sum + group.count, 0),
          byStatus: volunteersByStatus.reduce((obj, item) => {
            obj[item.status] = item.count;
            return obj;
          }, {} as Record<string, number>)
        },
        activities: {
          totalHours: totalHours?.total || 0,
          popularActivities
        },
        locations: {
          popularParks: parksWithNames
        },
        performance: avgPerformance || {
          punctuality: 0,
          attitude: 0,
          responsibility: 0,
          overall: 0
        }
      });
    } catch (error) {
      console.error("Error al obtener estadísticas de voluntarios:", error);
      res.status(500).json({ message: "Error al obtener estadísticas de voluntarios" });
    }
  });
}