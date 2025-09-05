import express from 'express';
import { db } from './db';
import { users, pendingUsers, userRoles } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

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
        
        // Obtener roles del usuario
        const userRolesList = await db.select()
          .from(userRoles)
          .where(eq(userRoles.userId, approvedUser.id));

        const userWithRoles = {
          ...approvedUser,
          roles: userRolesList
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

      // Verificar si ya existe solicitud
      const [existingRequest] = await db.select()
        .from(pendingUsers)
        .where(eq(pendingUsers.firebaseUid, firebaseUid))
        .limit(1);

      if (existingRequest) {
        console.log(`⚠️ [AUTH-REQUEST] Solicitud ya existe para: ${email}`);
        return res.status(400).json({ error: 'Ya existe una solicitud para este usuario' });
      }

      // Crear nueva solicitud
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
        message: 'Solicitud enviada correctamente',
        requestId: newRequest.id 
      });

    } catch (error) {
      console.error('❌ [AUTH-REQUEST] Error creando solicitud:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Obtener usuarios pendientes (solo para super admins)
  app.get('/api/auth/pending-users', async (req, res) => {
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

  // Aprobar usuario (solo para super admins)
  app.post('/api/auth/approve-user/:requestId', async (req, res) => {
    try {
      const { requestId } = req.params;
      const { approvedBy, assignedRoleId = 2 } = req.body; // Role 2 = empleado por defecto
      
      console.log(`✅ [APPROVE-USER] Aprobando solicitud: ${requestId}`);

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
        roleId: assignedRoleId,
        isActive: true,
        needsPasswordReset: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // 3. Asignar rol en tabla user_roles
      await db.insert(userRoles).values({
        userId: newUser.id,
        roleId: assignedRoleId,
        assignedBy: approvedBy,
        assignedAt: new Date()
      });

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

  // Rechazar usuario (solo para super admins)
  app.post('/api/auth/reject-user/:requestId', async (req, res) => {
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

  console.log('✅ [FIREBASE-AUTH] Rutas de autenticación Firebase registradas correctamente');
}