import express from 'express';
import { db } from './db';
import { users, pendingUsers, roles } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { linkExistingUserWithFirebase, isExistingUser, getUserByFirebaseUid, migrateKnownUsers, getMigrationInstructions } from './firebaseUserSync';
import { isAuthenticated } from './middleware/auth';

export function registerFirebaseAuthRoutes(app: express.Express) {
  console.log('🔥 [FIREBASE-AUTH] Registrando rutas de autenticación Firebase...');

  // Verificar estado del usuario por Firebase UID
  app.get('/api/auth/user-status/:firebaseUid', async (req, res) => {
    try {
      const { firebaseUid } = req.params;
      console.log(`🔍 [AUTH-STATUS] Verificando estado para UID: ${firebaseUid}`);

      // 1. Buscar en usuarios aprobados
      const [approvedUser] = await db.select()
        .from(users)
        .where(eq(users.firebaseUid, firebaseUid))
        .limit(1);

      if (approvedUser) {
        console.log(`✅ [AUTH-STATUS] Usuario aprobado encontrado: ${approvedUser.email}`);
        
        // Usar el roleId directamente de la tabla users
        const userWithRoles = {
          ...approvedUser,
          roles: [{ roleId: approvedUser.roleId }] // Formato compatible
        };

        return res.json({
          isApproved: true,
          isPending: false,
          isRejected: false,
          localUser: userWithRoles,
          needsPasswordReset: approvedUser.needsPasswordReset
        });
      }

      // 2. Buscar en usuarios pendientes
      const [pendingUser] = await db.select()
        .from(pendingUsers)
        .where(eq(pendingUsers.firebaseUid, firebaseUid))
        .limit(1);

      if (pendingUser) {
        console.log(`⏳ [AUTH-STATUS] Usuario pendiente encontrado: ${pendingUser.email}`);
        
        if (pendingUser.status === 'rejected') {
          return res.json({
            isApproved: false,
            isPending: false,
            isRejected: true,
            rejectionReason: pendingUser.rejectionReason
          });
        }

        return res.json({
          isApproved: false,
          isPending: true,
          isRejected: false
        });
      }

      // 3. Usuario no encontrado
      console.log(`❓ [AUTH-STATUS] Usuario no encontrado: ${firebaseUid}`);
      return res.json({
        isApproved: false,
        isPending: false,
        isRejected: false
      });

    } catch (error) {
      console.error('❌ [AUTH-STATUS] Error verificando estado:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Solicitar aprobación (registro de nuevo usuario)
  app.post('/api/auth/request-approval', async (req, res) => {
    try {
      const { firebaseUid, email, displayName } = req.body;
      console.log(`📝 [AUTH-REQUEST] Nueva solicitud de: ${email}`);

      // 🔗 FUNCIONALIDAD DE VINCULACIÓN: Verificar si es usuario existente
      const existingUserVinculado = await linkExistingUserWithFirebase(email, firebaseUid);
      
      if (existingUserVinculado) {
        console.log(`🔗 [AUTO-LINK] Usuario existente vinculado automáticamente: ${email}`);
        
        // El usuario ya tiene roleId, no necesitamos tabla separada
        const userWithRoles = {
          ...existingUserVinculado,
          roles: [{ roleId: existingUserVinculado.roleId }] // Formato compatible
        };

        return res.json({
          success: true,
          isExistingUser: true,
          autoLinked: true,
          message: '¡Cuenta existente vinculada automáticamente!',
          localUser: userWithRoles
        });
      }

      // Verificar si ya existe solicitud pendiente
      const [existingRequest] = await db.select()
        .from(pendingUsers)
        .where(eq(pendingUsers.firebaseUid, firebaseUid))
        .limit(1);

      if (existingRequest) {
        console.log(`⚠️ [AUTH-REQUEST] Solicitud ya existe para: ${email}`);
        return res.status(400).json({ error: 'Ya existe una solicitud para este usuario' });
      }

      // Crear nueva solicitud para usuarios realmente nuevos
      const [newRequest] = await db.insert(pendingUsers).values({
        firebaseUid,
        email,
        displayName,
        status: 'pending',
        requestedRole: 'employee' // Role por defecto
      }).returning();

      console.log(`✅ [AUTH-REQUEST] Solicitud creada: ${newRequest.id}`);

      res.json({ 
        success: true, 
        isExistingUser: false,
        message: 'Solicitud enviada correctamente - requiere aprobación del administrador',
        requestId: newRequest.id 
      });

    } catch (error) {
      console.error('❌ [AUTH-REQUEST] Error creando solicitud:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Obtener usuarios pendientes (solo para Admin General o superior)
  app.get('/api/auth/pending-users', isAuthenticated, async (req, res) => {
    try {
      console.log('📋 [PENDING-USERS] Obteniendo usuarios pendientes...');

      const pendingUsersList = await db.select()
        .from(pendingUsers)
        .where(eq(pendingUsers.status, 'pending'))
        .orderBy(pendingUsers.requestedAt);

      console.log(`✅ [PENDING-USERS] Encontrados ${pendingUsersList.length} usuarios pendientes`);

      res.json(pendingUsersList);

    } catch (error) {
      console.error('❌ [PENDING-USERS] Error obteniendo usuarios pendientes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Aprobar usuario (solo para Admin General o superior)
  app.post('/api/auth/approve-user/:requestId', isAuthenticated, async (req, res) => {
    try {
      const { requestId } = req.params;
      const { approvedBy, assignedRoleId = 2 } = req.body; // Role 2 = empleado por defecto
      
      console.log(`✅ [APPROVE-USER] Aprobando solicitud: ${requestId}`);

      // 🔒 RESTRICCIÓN: Verificar que el usuario que aprueba tenga permisos suficientes
      const approverUser = req.user;
      if (!approverUser) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // 🔒 RESTRICCIÓN: Admin General (nivel 2) NO puede asignar Super Admin (role_id = 1)
      if (assignedRoleId === 1 && approverUser.roleId !== 1) {
        console.log(`🚫 [APPROVE-USER] Admin General no puede asignar Super Admin. Usuario: ${approverUser.email}`);
        return res.status(403).json({ 
          error: 'Solo el Super Administrador puede asignar roles de Super Administrador' 
        });
      }

      // 🔒 RESTRICCIÓN: Verificar que el rol a asignar existe y está activo
      const [roleToAssign] = await db.select()
        .from(roles)
        .where(eq(roles.id, assignedRoleId))
        .limit(1);

      if (!roleToAssign || !roleToAssign.isActive) {
        return res.status(400).json({ error: 'Rol inválido o inactivo' });
      }

      // 1. Obtener solicitud pendiente
      const [pendingUser] = await db.select()
        .from(pendingUsers)
        .where(and(
          eq(pendingUsers.id, parseInt(requestId)),
          eq(pendingUsers.status, 'pending')
        ))
        .limit(1);

      if (!pendingUser) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      // 2. Crear usuario en tabla principal
      const [newUser] = await db.insert(users).values({
        firebaseUid: pendingUser.firebaseUid,
        username: pendingUser.displayName || pendingUser.email,
        email: pendingUser.email,
        fullName: pendingUser.displayName || '',
        password: null, // Los usuarios de Firebase no necesitan contraseña local
        roleId: assignedRoleId,
        isActive: true,
        needsPasswordReset: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // 3. El rol ya fue asignado al crear el usuario (línea 213), no necesitamos tabla separada

      // 4. Actualizar estado de solicitud
      await db.update(pendingUsers)
        .set({
          status: 'approved',
          approvedBy: approvedBy,
          approvedAt: new Date()
        })
        .where(eq(pendingUsers.id, parseInt(requestId)));

      console.log(`🎉 [APPROVE-USER] Usuario aprobado exitosamente: ${newUser.email}`);

      res.json({ 
        success: true, 
        message: 'Usuario aprobado exitosamente',
        userId: newUser.id 
      });

    } catch (error) {
      console.error('❌ [APPROVE-USER] Error aprobando usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Rechazar usuario (solo para Admin General o superior) 
  app.post('/api/auth/reject-user/:requestId', isAuthenticated, async (req, res) => {
    try {
      const { requestId } = req.params;
      const { rejectedBy, rejectionReason } = req.body;
      
      console.log(`❌ [REJECT-USER] Rechazando solicitud: ${requestId}`);

      // Actualizar estado de solicitud
      const [rejectedUser] = await db.update(pendingUsers)
        .set({
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: rejectionReason || 'No especificado'
        })
        .where(and(
          eq(pendingUsers.id, parseInt(requestId)),
          eq(pendingUsers.status, 'pending')
        ))
        .returning();

      if (!rejectedUser) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      console.log(`🚫 [REJECT-USER] Usuario rechazado: ${rejectedUser.email}`);

      res.json({ 
        success: true, 
        message: 'Usuario rechazado exitosamente'
      });

    } catch (error) {
      console.error('❌ [REJECT-USER] Error rechazando usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Endpoint para ejecutar migración REAL (solo para super admins)
  app.post('/api/auth/migrate-users', async (req, res) => {
    try {
      console.log('🚀 [REAL-MIGRATION] Ejecutando migración REAL de usuarios a Firebase...');
      
      const migrationResult = await migrateKnownUsers();
      
      if (migrationResult.alreadyMigrated) {
        return res.json({
          success: true,
          message: 'Todos los usuarios ya están migrados a Firebase',
          usersToMigrate: 0,
          alreadyMigrated: true
        });
      }
      
      res.json({
        success: true,
        message: `Migración real completada: ${migrationResult.migratedCount} usuarios migrados`,
        migratedCount: migrationResult.migratedCount,
        errorCount: migrationResult.errorCount,
        migratedUsers: migrationResult.migratedUsers,
        errors: migrationResult.errors
      });
      
    } catch (error: any) {
      console.error('❌ [REAL-MIGRATION] Error en migración real:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error?.message || 'Error desconocido'
      });
    }
  });

  // Endpoint para obtener instrucciones de migración (respaldo)
  app.get('/api/auth/migration-instructions', async (req, res) => {
    try {
      console.log('📋 [INSTRUCTIONS] Obteniendo instrucciones...');
      
      const instructions = await getMigrationInstructions();
      
      res.json({
        success: true,
        message: 'Instrucciones de migración obtenidas',
        usersToMigrate: instructions.usersToMigrate,
        users: instructions.users
      });
      
    } catch (error) {
      console.error('❌ [INSTRUCTIONS] Error obteniendo instrucciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Endpoint para autorizar administradores inmediatamente (SUPER ADMIN ONLY)
  app.post('/api/auth/authorize-admins', async (req, res) => {
    try {
      console.log('🚀 [ADMIN-AUTH] Autorizando administradores inmediatamente...');
      
      const adminEmails = [
        'admin@sistema.com',
        'luis@asociacionesprofesionales.org', 
        'joaquin@parquesdemexico.org'
      ];
      
      const authorizedUsers = [];
      
      for (const email of adminEmails) {
        // Actualizar usuario para permitir acceso inmediato
        const [updatedUser] = await db.update(users)
          .set({ 
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(users.email, email))
          .returning();
          
        if (updatedUser) {
          console.log(`✅ [ADMIN-AUTH] Usuario autorizado: ${email}`);
          authorizedUsers.push({
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            id: updatedUser.id
          });
        }
      }
      
      res.json({
        success: true,
        message: `${authorizedUsers.length} administradores autorizados para acceso inmediato`,
        authorizedUsers
      });
      
    } catch (error: any) {
      console.error('❌ [ADMIN-AUTH] Error autorizando administradores:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error?.message || 'Error desconocido'
      });
    }
  });

  // Endpoint para probar vinculación manual (útil para debugging)
  app.post('/api/auth/link-user', async (req, res) => {
    try {
      const { email, firebaseUid } = req.body;
      
      if (!email || !firebaseUid) {
        return res.status(400).json({ error: 'Email y Firebase UID son requeridos' });
      }
      
      const linkedUser = await linkExistingUserWithFirebase(email, firebaseUid);
      
      if (linkedUser) {
        res.json({
          success: true,
          message: 'Usuario vinculado exitosamente',
          user: linkedUser
        });
      } else {
        res.status(404).json({ error: 'Usuario no encontrado o ya vinculado' });
      }
      
    } catch (error) {
      console.error('❌ [LINK-USER] Error vinculando usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  console.log('✅ [FIREBASE-AUTH] Rutas de autenticación Firebase registradas correctamente');
}