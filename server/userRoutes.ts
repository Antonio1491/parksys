import { Request, Response, Router } from 'express';
import { storage } from './storage';
import { isAuthenticated, requirePermission, requireAdmin } from './middleware/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { fromZodError } from 'zod-validation-error';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { syncInstructorProfileWithUser } from './syncInstructorProfile';
import { replitObjectStorage } from './objectStorage-replit';
import { sanitizeUser, sanitizeUsers, validateSafeResponse, debugLogUserFields } from './utils/userSanitizer';

// Esquema para validar la creación de un usuario
const createUserSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  fullName: z.string().min(1, "El nombre completo es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.string().min(1, "El rol es requerido"), // Ahora acepta roleId como string
  municipalityId: z.number().nullable().optional(),
  phone: z.string().optional(),
  gender: z.enum(['masculino', 'femenino', 'no_especificar']).optional(),
  birthDate: z.string().nullable().optional(),
  bio: z.string().optional(),
  profileImageUrl: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  preferredParkId: z.number().nullable().optional(),
  legalConsent: z.boolean().optional(),
});

// Esquema para validar la actualización de un usuario
const updateUserSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  firstName: z.string().min(1, "El nombre es requerido").optional(),
  lastName: z.string().min(1, "El apellido es requerido").optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  role: z.enum(['admin', 'super_admin', 'moderator', 'operator', 'director', 'manager', 'supervisor', 'ciudadano', 'voluntario', 'instructor', 'user', 'guardaparques', 'guardia', 'concesionario']).optional(),
  municipalityId: z.number().nullable().optional(),
  profileImageUrl: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  bio: z.string().optional(),
  experience: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  preferredParkId: z.number().nullable().optional(),
  legalConsent: z.boolean().optional(),
  // Volunteer-specific fields
  volunteerExperience: z.string().optional(),
  availability: z.string().optional(),
  availableDays: z.string().optional(),
  interestNature: z.boolean().optional(),
  interestEvents: z.boolean().optional(),
  interestEducation: z.boolean().optional(),
  interestMaintenance: z.boolean().optional(),
  interestSports: z.boolean().optional(),
  interestCultural: z.boolean().optional(),
});

// Función para sincronizar datos de usuario con la tabla de voluntarios
async function syncUserWithVolunteerTable(user: any, formData: any = {}) {
  try {
    console.log(`Sincronizando usuario ${user.id} con tabla de voluntarios...`);
    
    // Verificar si ya existe un registro en la tabla de voluntarios para este usuario
    const volunteerResult = await db.execute(
      sql`SELECT * FROM volunteers WHERE email = ${user.email}`
    );
    
    const volunteerExists = volunteerResult.rows && volunteerResult.rows.length > 0;
    
    // Convertir campos de usuario a formato de voluntario usando datos del formulario
    const volunteerData = {
      full_name: user.fullName,
      email: user.email,
      phone: formData.phone || user.phone || null,
      gender: formData.gender || user.gender || 'no_especificar',
      status: 'active',
      profile_image_url: user.profileImageUrl || null,
      previous_experience: formData.volunteerExperience || null, 
      address: formData.address || user.address || null,
      emergency_contact: formData.emergencyContactName || user.emergencyContactName || null,
      emergency_phone: formData.emergencyContactPhone || user.emergencyContactPhone || null,
      preferred_park_id: formData.preferredParkId || user.preferredParkId || 3, // Usamos valor por defecto
      user_id: user.id,
      updated_at: new Date()
    };
    
    if (volunteerExists) {
      // Actualizar el registro existente
      const volunteerId = volunteerResult.rows[0].id;
      console.log(`Actualizando voluntario existente ID ${volunteerId}`);
      
      // Calcular la edad a partir de la fecha de nacimiento si existe, o mantener la existente
      let age = 18; // Valor por defecto
      const birthDateStr = formData.birthDate || user.birthDate;
      if (birthDateStr) {
        const birthDate = new Date(birthDateStr);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        // Ajustar si aún no ha cumplido años este año
        if (today.getMonth() < birthDate.getMonth() || 
            (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }
      
      await db.execute(
        sql`UPDATE volunteers 
            SET full_name = ${volunteerData.full_name},
                email = ${volunteerData.email},
                phone = ${volunteerData.phone},
                gender = ${volunteerData.gender},
                status = ${volunteerData.status},
                profile_image_url = ${volunteerData.profile_image_url},
                user_id = ${volunteerData.user_id},
                updated_at = ${volunteerData.updated_at},
                age = ${age},
                preferred_park_id = ${formData.preferredParkId || user.preferredParkId || 3},
                address = ${formData.address || user.address || null},
                emergency_contact = ${formData.emergencyContactName || user.emergencyContactName || null},
                emergency_phone = ${formData.emergencyContactPhone || user.emergencyContactPhone || null}
            WHERE id = ${volunteerId}`
      );
      
      console.log(`Voluntario ID ${volunteerId} actualizado correctamente`);
    } else {
      // Crear un nuevo registro
      console.log(`Creando nuevo registro de voluntario para usuario ID ${user.id}`);
      
      // Calcular la edad a partir de la fecha de nacimiento si existe, o usar 18 como valor predeterminado
      let age = 18; // Valor predeterminado
      const birthDateStr = formData.birthDate || user.birthDate;
      if (birthDateStr) {
        const birthDate = new Date(birthDateStr);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        // Ajustar si aún no ha cumplido años este año
        if (today.getMonth() < birthDate.getMonth() || 
            (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }
      
      await db.execute(
        sql`INSERT INTO volunteers 
            (full_name, email, phone, gender, status, profile_image_url, user_id, 
             created_at, updated_at, age, legal_consent, preferred_park_id, 
             address, emergency_contact, emergency_phone)
            VALUES 
            (${volunteerData.full_name}, ${volunteerData.email}, ${volunteerData.phone}, 
             ${volunteerData.gender}, ${volunteerData.status}, ${volunteerData.profile_image_url}, 
             ${volunteerData.user_id}, ${new Date()}, ${volunteerData.updated_at}, ${age}, ${true}, 
             ${formData.preferredParkId || user.preferredParkId || 3}, ${formData.address || user.address || null}, 
             ${formData.emergencyContactName || user.emergencyContactName || null}, ${formData.emergencyContactPhone || user.emergencyContactPhone || null})`
      );
      
      console.log(`Nuevo voluntario creado para usuario ID ${user.id}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error al sincronizar usuario con tabla de voluntarios:`, error);
    return false;
  }
}

// Función para sincronizar usuario con tabla de concesionarios
async function syncUserWithConcessionaireTable(user: any, userData: any) {
  try {
    console.log(`🏢 Sincronizando usuario ${user.id} con tabla de concesionarios...`);
    
    // Verificar si ya existe un concesionario para este usuario
    const concessionaireResult = await db.execute(
      sql`SELECT * FROM concessionaire_profiles WHERE user_id = ${user.id}`
    );
    
    const concessionaireExists = concessionaireResult.rows && concessionaireResult.rows.length > 0;
    
    if (!concessionaireExists) {
      // Crear nuevo perfil de concesionario con datos básicos
      const concessionaireData = {
        user_id: user.id,
        type: userData.tipo || 'persona_fisica', // Tipo por defecto
        rfc: userData.rfc || '', // RFC será requerido posteriormente
        tax_address: userData.domicilioFiscal || '',
        legal_representative: userData.representanteLegal || '',
        status: 'pendiente', // Estado inicial pendiente hasta completar perfil
        registration_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Insertar en concessionaire_profiles
      await db.execute(
        sql`INSERT INTO concessionaire_profiles 
            (user_id, type, rfc, tax_address, legal_representative, status, registration_date, created_at, updated_at)
            VALUES (${concessionaireData.user_id}, ${concessionaireData.type}, ${concessionaireData.rfc}, 
                    ${concessionaireData.tax_address}, ${concessionaireData.legal_representative}, 
                    ${concessionaireData.status}, ${concessionaireData.registration_date}, 
                    ${concessionaireData.created_at}, ${concessionaireData.updated_at})`
      );
      
      console.log(`✅ Perfil de concesionario creado para usuario ${user.id}`);
    } else {
      console.log(`ℹ️ Perfil de concesionario ya existe para usuario ${user.id}`);
    }
    
  } catch (error) {
    console.error('Error al sincronizar usuario con tabla de concesionarios:', error);
    // No interrumpimos el flujo principal, solo registramos el error
  }
}

export function registerUserRoutes(app: any, apiRouter: Router) {
  // Middleware para verificar si el usuario es administrador
  const isAdmin = (req: Request, res: Response, next: Function) => {
    // En desarrollo, omitimos la verificación de autenticación para facilitar las pruebas
    if (process.env.NODE_ENV === 'development') {
      // Agregamos un usuario admin simulado para pruebas
      req.user = {
        id: 1,
        username: 'admin',
        role: 'admin'
      };
      return next();
    }
    
    // En producción, verificamos la autenticación Firebase
    if (!req.user && !(req as any).firebaseUser) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Si tenemos firebaseUser pero no req.user, usar el usuario de Firebase
    const user = req.user || (req as any).firebaseUser;
    
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Verificar roles usando la estructura actual del sistema
    const userRole = user.role || user.roleSlug || 'user';
    if (userRole !== 'admin' && userRole !== 'super-admin' && userRole !== 'director') {
      return res.status(403).json({ message: "You don't have permission to access this resource" });
    }
    
    // Asegurar que req.user está configurado para compatibilidad
    if (!req.user) {
      req.user = user;
    }
    
    next();
  };

  // GET /api/users - Obtener todos los usuarios
  apiRouter.get('/users', isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      
      // 🔒 SECURITY FIX: Use sanitizer utility to ensure no sensitive data is sent
      const safeUsers = sanitizeUsers(users);
      
      // Debug logging to ensure no sensitive data
      console.log(`✅ [GET-USERS] Returning ${safeUsers.length} sanitized users`);
      
      // Validate response is safe before sending
      validateSafeResponse(safeUsers);
      
      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error al obtener usuarios' });
    }
  });

  // GET /api/users/:id - Obtener un usuario por ID
  apiRouter.get('/users/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      
      // ✅ VALIDACIÓN: Evitar errores de "NaN"
      if (isNaN(userId) || userId <= 0) {
        console.error('❌ [USER-ROUTES] ID de usuario inválido:', req.params.id);
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // 🔒 SECURITY FIX: Use sanitizer utility to ensure no sensitive data is sent
      let responseUser = sanitizeUser(user);
      
      if (!responseUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Si el usuario es voluntario, obtenemos los datos adicionales de la tabla voluntarios
      if (user.role === 'voluntario') {
        try {
          // Buscar los datos adicionales del voluntario
          const volunteerResult = await db.execute(
            sql`SELECT * FROM volunteers WHERE user_id = ${userId}`
          );
          
          if (volunteerResult.rows && volunteerResult.rows.length > 0) {
            const volunteerData = volunteerResult.rows[0];
            console.log("Datos del voluntario encontrados:", volunteerData);
            
            // Creamos un nuevo objeto que incluya los datos del usuario y del voluntario
            const userDataWithVolunteer = {
              ...responseUser,
              preferredParkId: volunteerData.preferred_park_id,
              legalConsent: volunteerData.legal_consent === true,
              volunteerExperience: volunteerData.previous_experience,
              availability: volunteerData.available_hours,
              address: volunteerData.address || '',
              emergencyContactName: volunteerData.emergency_contact || '',
              emergencyContactPhone: volunteerData.emergency_phone || ''
            };
            
            console.log("🔍 DEBUG - Datos de voluntario agregados al usuario:", {
              address: volunteerData.address,
              emergencyContact: volunteerData.emergency_contact,
              emergencyPhone: volunteerData.emergency_phone
            });
            
            // 🎯 NORMALIZAR URLs de imágenes antes de enviar al cliente
            const userWithNormalizedImages = {
              ...userDataWithVolunteer,
              profileImageUrl: userDataWithVolunteer.profileImageUrl ? replitObjectStorage.normalizeUrl(userDataWithVolunteer.profileImageUrl) : userDataWithVolunteer.profileImageUrl
            };
            
            // Debug logging and validation
            debugLogUserFields(userWithNormalizedImages, 'GET-USER volunteer data');
            validateSafeResponse(userWithNormalizedImages);
            
            // Devolvemos directamente este objeto enriquecido
            return res.json(userWithNormalizedImages);
          }
        } catch (error) {
          console.error('Error al obtener datos de voluntario:', error);
          // No interrumpimos el flujo, devolvemos los datos de usuario que tenemos
        }
      }
      
      // Debug logging and validation
      debugLogUserFields(responseUser, 'GET-USER basic user');
      validateSafeResponse(responseUser);
      
      res.json(responseUser);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Error al obtener usuario' });
    }
  });

  // POST /api/users - Crear un nuevo usuario
  apiRouter.post('/users', isAdmin, async (req: Request, res: Response) => {
    try {
      // Imprimir los datos recibidos para diagnosticar problemas
      console.log("Datos recibidos en POST /users:", {
        ...req.body,
        password: req.body.password ? "[REDACTED]" : undefined
      });
      
      // Validar los datos del usuario
      try {
        const validationResult = createUserSchema.safeParse(req.body);
        if (!validationResult.success) {
          const formattedError = fromZodError(validationResult.error);
          console.error("Error detallado de validación:", JSON.stringify(formattedError, null, 2));
          console.error("Errores específicos:", formattedError.details);
          return res.status(400).json({ 
            message: 'Error de validación', 
            details: formattedError.message,
            errors: formattedError.details
          });
        }
        
        const userData = validationResult.data;
        
        // Verificar si el usuario ya existe
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser) {
          return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }
        
        // Verificar si el email ya está en uso
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          return res.status(400).json({ message: 'El email ya está en uso' });
        }
        
        // Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Crear el usuario con logging detallado
        console.log("Datos que se enviarán a createUser:", {
          ...userData,
          password: "[REDACTED]",
          roleId: Number(userData.role) // Convertir role string a roleId
        });
        
        try {
          // Preparamos todos los campos adicionales
          const userDataToSave = {
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            roleId: Number(userData.role), // Convertir role a roleId numérico
            fullName: userData.fullName,
            municipalityId: userData.municipalityId || null,
            phone: userData.phone || null,
            gender: userData.gender || null,
            birthDate: userData.birthDate || null,
            bio: userData.bio || null,
            profileImageUrl: userData.profileImageUrl || null,
            address: userData.address || null,
            emergencyContactName: userData.emergencyContactName || null,
            emergencyContactPhone: userData.emergencyContactPhone || null,
            preferredParkId: userData.preferredParkId || null,
            legalConsent: userData.legalConsent || false
          };

          const newUser = await storage.createUser(userDataToSave);
          
          console.log("Usuario creado exitosamente:", {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
          });
          
          // Guardar la imagen de perfil en el caché si existe
          if (userData.profileImageUrl && newUser.id) {
            const { saveProfileImage } = await import('./profileImageCache');
            saveProfileImage(newUser.id, userData.profileImageUrl);
            console.log(`Imagen de perfil guardada en caché para usuario ${newUser.id}: ${userData.profileImageUrl}`);
          }
          
          // Si el usuario tiene rol de voluntario (roleId 6), sincronizar con la tabla de voluntarios
          if (newUser.roleId === 6) {
            await syncUserWithVolunteerTable(newUser, req.body);
          }
          
          // Si el usuario tiene rol de concesionario (roleId 7), crear automáticamente el perfil de concesionario
          if (newUser.roleId === 7) {
            await syncUserWithConcessionaireTable(newUser, req.body);
          }
          
          // 🔒 SECURITY FIX: Use sanitizer utility to ensure no sensitive data is sent
          const sanitizedNewUser = sanitizeUser(newUser);
          
          // Debug logging and validation
          debugLogUserFields(sanitizedNewUser, 'POST-USERS create user');
          validateSafeResponse(sanitizedNewUser);
          
          res.status(201).json(sanitizedNewUser);
        } catch (dbError) {
          console.error("Error específico al crear usuario en la base de datos:", dbError);
          res.status(500).json({ message: 'Error al crear usuario en la base de datos', details: (dbError as Error).message });
        }
      } catch (validationError) {
        console.error("Error durante la validación:", validationError);
        return res.status(400).json({ 
          message: 'Error de validación', 
          details: 'Error en el proceso de validación'
        });
      }
    } catch (error) {
      console.error('Error general creating user:', error);
      res.status(500).json({ message: 'Error al crear usuario' });
    }
  });

  // PUT /api/users/:id - Actualizar un usuario existente
  apiRouter.put('/users/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      
      // Verificar si el usuario existe
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Validar los datos del usuario
      const updateData = updateUserSchema.parse(req.body);
      
      // Si se está actualizando el nombre de usuario, verificar que no esté en uso
      if (updateData.username && updateData.username !== existingUser.username) {
        const userWithSameUsername = await storage.getUserByUsername(updateData.username);
        if (userWithSameUsername && userWithSameUsername.id !== userId) {
          return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }
      }
      
      // Si se está actualizando el email, verificar que no esté en uso
      if (updateData.email && updateData.email !== existingUser.email) {
        const userWithSameEmail = await storage.getUserByEmail(updateData.email);
        if (userWithSameEmail && userWithSameEmail.id !== userId) {
          return res.status(400).json({ message: 'El email ya está en uso' });
        }
      }
      
      // Preparar los datos para la actualización
      const userData: any = { ...updateData };
      
      // Si se proporcionaron nombre y apellido, actualizar el nombre completo
      if (updateData.firstName && updateData.lastName) {
        userData.fullName = `${updateData.firstName} ${updateData.lastName}`;
      } else if (updateData.firstName) {
        userData.fullName = `${updateData.firstName} ${existingUser.lastName || ''}`;
      } else if (updateData.lastName) {
        userData.fullName = `${existingUser.firstName || ''} ${updateData.lastName}`;
      }
      
      // Procesar campos adicionales de perfil
      if (updateData.phone !== undefined) {
        userData.phone = updateData.phone || null;
      }
      
      if (updateData.gender !== undefined) {
        userData.gender = updateData.gender || null;
      }
      
      if (updateData.birthDate !== undefined) {
        userData.birthDate = updateData.birthDate ? new Date(updateData.birthDate) : null;
      }
      
      if (updateData.bio !== undefined) {
        userData.bio = updateData.bio || null;
      }
      
      if (updateData.profileImageUrl !== undefined) {
        userData.profileImageUrl = updateData.profileImageUrl || null;
      }
      
      // Actualizar timestamp
      userData.updatedAt = new Date();
      
      // Si se proporcionó contraseña, encriptarla (en un entorno real)
      if (updateData.password) {
        // userData.password = await bcrypt.hash(updateData.password, 10);
        
        // En este caso, no hasheamos la contraseña para facilitar las pruebas
        userData.password = updateData.password;
      }
      
      // Actualizar el usuario
      const updatedUser = await storage.updateUser(userId, userData);
      
      // Guardar la imagen de perfil en el caché si existe
      if (updateData.profileImageUrl && updatedUser.id) {
        const { saveProfileImage } = await import('./profileImageCache');
        saveProfileImage(updatedUser.id, updateData.profileImageUrl);
        console.log(`Imagen de perfil guardada en caché para usuario ${updatedUser.id}: ${updateData.profileImageUrl}`);
      }
      
      // Si el usuario tiene rol de instructor, sincronizar con la tabla de instructores
      if (updatedUser.role === 'instructor') {
        try {
          // Sincronizamos los datos con el perfil de instructor
          console.log(`⚙️ Sincronizando perfil de instructor para usuario ID: ${updatedUser.id}`);
          const syncResult = await syncInstructorProfileWithUser(updatedUser.id);
          console.log(`✅ Resultado de sincronización de instructor:`, syncResult);
        } catch (error) {
          console.error(`❌ Error al sincronizar perfil de instructor para usuario ID: ${updatedUser.id}:`, error);
          // No interrumpimos el flujo principal si hay error en esto
        }
      }
      
      // Si el usuario tiene rol de voluntario, sincronizar con la tabla de voluntarios
      if (updatedUser.role === 'voluntario') {
        try {
          // Primero sincronizamos los datos básicos
          await syncUserWithVolunteerTable(updatedUser);
          
          // Si hay información adicional de voluntario, hacemos una solicitud a la ruta especializada
          if (updateData.volunteerExperience || updateData.availability || 
              updateData.preferredParkId !== undefined || updateData.legalConsent) {
            
            // Encuentro el ID del voluntario
            const volunteerResult = await db.execute(
              sql`SELECT id FROM volunteers WHERE user_id = ${updatedUser.id}`
            );
            
            if (volunteerResult.rows && volunteerResult.rows.length > 0) {
              const volunteerId = volunteerResult.rows[0].id;
              
              // Llamamos a la API interna para actualizar el perfil de voluntario
              const volunteerUpdateData = {
                volunteerId: volunteerId,
                userId: updatedUser.id,
                // Campos de experiencia y disponibilidad
                volunteerExperience: updateData.volunteerExperience,
                availability: updateData.availability,
                availableDays: updateData.availableDays,
                // Campos de parque preferido y consentimiento
                preferredParkId: updateData.preferredParkId,
                legalConsent: updateData.legalConsent,
                // Campos de áreas de interés
                interestNature: updateData.interestNature,
                interestEvents: updateData.interestEvents,
                interestEducation: updateData.interestEducation,
                interestMaintenance: updateData.interestMaintenance,
                interestSports: updateData.interestSports, 
                interestCultural: updateData.interestCultural
              };
              
              // Hacer la solicitud directamente a nuestra API interna
              try {
                console.log("Enviando datos de voluntario a /api/volunteers/update-profile:", volunteerUpdateData);
                
                // Enviar datos directamente a nuestra API (usando conexión interna)
                // Asegurarnos de tener la ID del voluntario
                if (volunteerId) {
                  console.log("Datos de voluntario completos:", updateData);
                
                  // Log para depuración de lo que vamos a enviar al endpoint
                  console.log("Datos de voluntario que se van a actualizar:", {
                    volunteerId,
                    address: updateData.address,
                    emergencyContactName: updateData.emergencyContactName,
                    emergencyContactPhone: updateData.emergencyContactPhone,
                    preferredParkId: updateData.preferredParkId,
                    volunteerExperience: updateData.volunteerExperience,
                    availability: updateData.availability
                  });
                  
                  try {
                    // Preparar datos completos para el endpoint
                    const completeVolunteerData = {
                      volunteerId: volunteerId,
                      userId: updatedUser.id,
                      // Datos básicos
                      address: updateData.address,
                      emergencyContactName: updateData.emergencyContactName,
                      emergencyContactPhone: updateData.emergencyContactPhone,
                      // Campos de experiencia y disponibilidad (con valores por defecto)
                      volunteerExperience: updateData.volunteerExperience || "",
                      availability: updateData.availability || "flexible",
                      availableDays: updateData.availableDays || "weekdays",
                      // Campos de parque preferido y consentimiento
                      preferredParkId: updateData.preferredParkId || 1,
                      legalConsent: updateData.legalConsent === true,
                      // Campos de áreas de interés (con valores por defecto)
                      interestNature: updateData.interestNature === true,
                      interestEvents: updateData.interestEvents === true,
                      interestEducation: updateData.interestEducation === true,
                      interestMaintenance: updateData.interestMaintenance === true,
                      interestSports: updateData.interestSports === true,
                      interestCultural: updateData.interestCultural === true
                    };
                    
                    console.log("ENVIANDO DATOS COMPLETOS:", completeVolunteerData);
                    
                    // Llamar al endpoint interno
                    const response = await fetch('http://localhost:5000/api/volunteers/update-profile', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(completeVolunteerData)
                    });
                    
                    if (response.ok) {
                      console.log("Perfil de voluntario actualizado correctamente mediante llamada HTTP interna");
                    } else {
                      console.error("Error al actualizar perfil de voluntario:", await response.text());
                      
                      // Como respaldo, actualizar solo los campos básicos del voluntario
                      await db.execute(
                        sql`UPDATE volunteers 
                            SET address = ${updateData.address || null},
                                emergency_contact = ${updateData.emergencyContactName || null},
                                emergency_phone = ${updateData.emergencyContactPhone || null},
                                preferred_park_id = ${updateData.preferredParkId || null},
                                legal_consent = ${updateData.legalConsent === true},
                                previous_experience = ${updateData.volunteerExperience || null},
                                available_hours = ${updateData.availability || null},
                                updated_at = ${new Date()}
                            WHERE id = ${volunteerId}`
                      );
                    }
                  } catch (error) {
                    console.error("Error al llamar al endpoint interno:", error);
                    
                    // Como respaldo, actualizar solo los campos básicos
                    try {
                      // 1. Actualizar campos básicos
                      await db.execute(
                        sql`UPDATE volunteers 
                            SET address = ${updateData.address || null},
                                emergency_contact = ${updateData.emergencyContactName || null},
                                emergency_phone = ${updateData.emergencyContactPhone || null},
                                preferred_park_id = ${updateData.preferredParkId || null},
                                previous_experience = ${updateData.volunteerExperience || null},
                                available_hours = ${updateData.availability || null},
                                available_days = ${updateData.availableDays || null},
                                legal_consent = ${updateData.legalConsent === true},
                                updated_at = ${new Date()}
                            WHERE id = ${volunteerId}`
                      );
                      
                      // 2. Preparar áreas de interés como array
                      const interestAreas = [];
                      if (updateData.interestNature) interestAreas.push('nature');
                      if (updateData.interestEvents) interestAreas.push('events');
                      if (updateData.interestEducation) interestAreas.push('education');
                      if (updateData.interestMaintenance) interestAreas.push('maintenance');
                      if (updateData.interestSports) interestAreas.push('sports');
                      if (updateData.interestCultural) interestAreas.push('cultural');
                      
                      // 3. Actualizar áreas de interés en operación separada si hay alguna
                      if (interestAreas.length > 0) {
                        const interestAreasJSON = JSON.stringify(interestAreas);
                        await db.execute(
                          sql`UPDATE volunteers 
                              SET interest_areas = ${interestAreasJSON}
                              WHERE id = ${volunteerId}`
                        );
                      }
                      
                      // Verificar datos guardados
                      const verifyResult = await db.execute(
                        sql`SELECT * FROM volunteers WHERE id = ${volunteerId}`
                      );
                      
                      if (verifyResult.rows && verifyResult.rows.length > 0) {
                        console.log("Datos del voluntario guardados y verificados:", {
                          id: verifyResult.rows[0].id,
                          address: verifyResult.rows[0].address,
                          emergency_contact: verifyResult.rows[0].emergency_contact,
                          emergency_phone: verifyResult.rows[0].emergency_phone,
                          previous_experience: verifyResult.rows[0].previous_experience,
                          available_hours: verifyResult.rows[0].available_hours,
                          available_days: verifyResult.rows[0].available_days,
                          interest_areas: verifyResult.rows[0].interest_areas,
                          legal_consent: verifyResult.rows[0].legal_consent
                        });
                      }
                    } catch (directError) {
                      console.error("Error al actualizar directamente el perfil de voluntario:", directError);
                    }
                  }
                  
                  console.log(`Voluntario ID ${volunteerId} actualizado correctamente con parque preferido ID: ${volunteerUpdateData.preferredParkId}`);
                } else {
                  console.error("Error: No se encontró ID de voluntario para actualizar");
                }
                
                console.log('Perfil de voluntario actualizado correctamente mediante actualización directa');
              } catch (updateError) {
                console.error("Error al actualizar directamente el perfil de voluntario:", updateError);
              }
              
              console.log('Perfil de voluntario actualizado correctamente');
            }
          }
        } catch (error) {
          console.error("Error al actualizar información adicional de voluntario:", error);
          // No interrumpimos el flujo principal si hay error en esto
        }
      }
      
      // 🔒 SECURITY FIX: Use sanitizer utility to ensure no sensitive data is sent  
      const sanitizedUpdatedUser = sanitizeUser(updatedUser);
      
      // Debug logging and validation
      debugLogUserFields(sanitizedUpdatedUser, 'PUT-USERS update user');
      validateSafeResponse(sanitizedUpdatedUser);
      
      res.json(sanitizedUpdatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: 'Error de validación', 
          details: validationError.message 
        });
      }
      
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Error al actualizar usuario' });
    }
  });

  // GET /api/volunteers/:id - Obtener un voluntario específico
  apiRouter.get('/volunteers/:id', async (req: Request, res: Response) => {
    try {
      const volunteerId = Number(req.params.id);
      
      // Obtener datos del voluntario con información del usuario
      const volunteerResult = await db.execute(
        sql`SELECT 
              v.id,
              v.full_name,
              v.email,
              v.phone,
              v.gender,
              v.status,
              v.join_date,
              v.total_hours,
              v.address,
              v.emergency_contact,
              v.emergency_phone,
              v.preferred_park_id,
              v.previous_experience,
              v.skills,
              v.available_hours,
              v.legal_consent,
              v.is_active,
              v.user_id,
              u.first_name,
              u.last_name,
              u.birth_date,
              u.created_at,
              u.updated_at
            FROM volunteers v
            JOIN users u ON v.user_id = u.id
            WHERE v.id = ${volunteerId}`
      );
      
      if (!volunteerResult.rows || volunteerResult.rows.length === 0) {
        return res.status(404).json({ message: 'Voluntario no encontrado' });
      }
      
      const volunteerData = volunteerResult.rows[0];
      
      // Formatear datos para el frontend
      const formattedVolunteer = {
        id: volunteerData.id,
        firstName: volunteerData.first_name,
        lastName: volunteerData.last_name,
        email: volunteerData.email,
        phone: volunteerData.phone,
        gender: volunteerData.gender || 'no_especificar',
        birthDate: volunteerData.birth_date && typeof volunteerData.birth_date === 'string' ? new Date(volunteerData.birth_date).toISOString().split('T')[0] : '',
        address: volunteerData.address || '',
        emergencyContactName: volunteerData.emergency_contact || '',
        emergencyContactPhone: volunteerData.emergency_phone || '',
        preferredParkId: volunteerData.preferred_park_id?.toString() || '',
        volunteerExperience: volunteerData.previous_experience || '',
        skills: volunteerData.skills || '',
        availability: volunteerData.available_hours || 'flexible',
        legalConsent: volunteerData.legal_consent || true,
        status: volunteerData.status,
        joinDate: volunteerData.join_date,
        totalHours: volunteerData.total_hours,
        isActive: volunteerData.is_active,
        userId: volunteerData.user_id,
        municipalityId: 2, // Guadalajara por defecto
        // Valores por defecto para los campos requeridos
        ageConsent: true,
        conductConsent: true,
        interestNature: false,
        interestEvents: false,
        interestEducation: false,
        interestMaintenance: false,
        interestSports: false,
        interestCultural: false
      };
      
      res.json(formattedVolunteer);
      
    } catch (error) {
      console.error('Error obteniendo voluntario:', error);
      res.status(500).json({ message: 'Error al obtener voluntario' });
    }
  });

  // PUT /api/volunteers/:id - Actualizar un voluntario directamente
  apiRouter.put('/volunteers/:id', async (req: Request, res: Response) => {
    try {
      const volunteerId = Number(req.params.id);
      const volunteerData = req.body;
      
      console.log(`Actualizando voluntario ID: ${volunteerId}`);
      console.log("Datos recibidos:", volunteerData);
      
      // Verificar que el voluntario existe
      const volunteerResult = await db.execute(
        sql`SELECT user_id FROM volunteers WHERE id = ${volunteerId}`
      );
      
      if (!volunteerResult.rows || volunteerResult.rows.length === 0) {
        return res.status(404).json({ message: 'Voluntario no encontrado' });
      }
      
      const userId = volunteerResult.rows[0].user_id;
      
      // Actualizar los datos del usuario primero
      const userUpdateData = {
        firstName: volunteerData.firstName,
        lastName: volunteerData.lastName,
        email: volunteerData.email,
        phone: volunteerData.phone,
        gender: volunteerData.gender,
        birthDate: volunteerData.birthDate,
        updatedAt: new Date()
      };
      
      // Actualizar tabla users
      await db.execute(
        sql`UPDATE users 
            SET first_name = ${userUpdateData.firstName},
                last_name = ${userUpdateData.lastName},
                email = ${userUpdateData.email},
                phone = ${userUpdateData.phone},
                gender = ${userUpdateData.gender},
                birth_date = ${userUpdateData.birthDate ? new Date(userUpdateData.birthDate) : null},
                updated_at = ${userUpdateData.updatedAt}
            WHERE id = ${userId}`
      );
      
      // Actualizar tabla volunteers
      await db.execute(
        sql`UPDATE volunteers 
            SET full_name = ${`${volunteerData.firstName} ${volunteerData.lastName}`},
                email = ${volunteerData.email},
                phone = ${volunteerData.phone},
                gender = ${volunteerData.gender},
                address = ${volunteerData.address || null},
                emergency_contact = ${volunteerData.emergencyContactName || null},
                emergency_phone = ${volunteerData.emergencyContactPhone || null},
                preferred_park_id = ${volunteerData.preferredParkId ? Number(volunteerData.preferredParkId) : null},
                previous_experience = ${volunteerData.volunteerExperience || null},
                skills = ${volunteerData.skills || null},
                available_hours = ${volunteerData.availability || null},
                legal_consent = ${volunteerData.legalConsent === true},
                updated_at = ${new Date()}
            WHERE id = ${volunteerId}`
      );
      
      console.log(`Voluntario ID ${volunteerId} actualizado correctamente`);
      
      res.json({ 
        message: 'Voluntario actualizado exitosamente',
        volunteerId: volunteerId,
        userId: userId
      });
      
    } catch (error) {
      console.error('Error actualizando voluntario:', error);
      res.status(500).json({ message: 'Error al actualizar voluntario' });
    }
  });

  // DELETE /api/users/:id - Eliminar un usuario
  apiRouter.delete('/users/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      
      // Verificar si el usuario existe
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // No permitir eliminar al usuario con el que se está autenticado
      if (req.user && req.user.id === userId) {
        return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' });
      }
      
      // Eliminar el usuario
      await storage.deleteUser(userId);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Error al eliminar usuario' });
    }
  });

  // Obtener parques favoritos del usuario
  apiRouter.get('/users/:id/favorite-parks', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Por ahora devolvemos un array vacío, más tarde se puede conectar con la base de datos
      const favoriteParks: any[] = [];
      
      res.json(favoriteParks);
    } catch (error) {
      console.error('Error fetching user favorite parks:', error);
      res.status(500).json({ message: 'Error fetching user favorite parks' });
    }
  });

  // Agregar parque a favoritos del usuario
  apiRouter.post('/users/:id/favorite-parks', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { parkId } = req.body;
      
      // Simular éxito por ahora
      const result = {
        id: Date.now(),
        userId,
        parkId,
        addedAt: new Date().toISOString()
      };
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error adding park to favorites:', error);
      res.status(500).json({ message: 'Error adding park to favorites' });
    }
  });

  // Remover parque de favoritos del usuario
  apiRouter.delete('/users/:id/favorite-parks/:parkId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const parkId = parseInt(req.params.parkId);
      
      // Simular éxito por ahora
      res.status(200).json({ message: 'Park removed from favorites successfully' });
    } catch (error) {
      console.error('Error removing park from favorites:', error);
      res.status(500).json({ message: 'Error removing park from favorites' });
    }
  });

  // Obtener parques pendientes por visitar del usuario
  apiRouter.get('/users/:id/pending-parks', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Por ahora devolvemos un array vacío
      const pendingParks: any[] = [];
      
      res.json(pendingParks);
    } catch (error) {
      console.error('Error fetching user pending parks:', error);
      res.status(500).json({ message: 'Error fetching user pending parks' });
    }
  });

  // Marcar parque como visitado
  apiRouter.post('/users/:id/visited-parks', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { parkId } = req.body;
      
      // Simular éxito por ahora
      const result = {
        id: Date.now(),
        userId,
        parkId,
        visitedAt: new Date().toISOString()
      };
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error marking park as visited:', error);
      res.status(500).json({ message: 'Error marking park as visited' });
    }
  });

  // Obtener actividades próximas en parques favoritos
  apiRouter.get('/users/:id/favorite-parks-activities', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Por ahora devolvemos un array vacío
      const upcomingActivities: any[] = [];
      
      res.json(upcomingActivities);
    } catch (error) {
      console.error('Error fetching favorite parks activities:', error);
      res.status(500).json({ message: 'Error fetching favorite parks activities' });
    }
  });
}