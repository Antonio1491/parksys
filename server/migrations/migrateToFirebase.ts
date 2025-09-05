import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../db';
import { users, userRoles } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Configuración Firebase Admin (para crear usuarios en el backend)
const serviceAccount: ServiceAccount = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
};

const adminApp = initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});

const auth = getAuth(adminApp);

interface LocalUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
}

export async function migrateUsersToFirebase() {
  console.log('🔥 [MIGRATION] Iniciando migración de usuarios a Firebase...');
  
  try {
    // 1. Obtener usuarios actuales de la base de datos local
    const localUsers = await db.select().from(users);
    console.log(`📊 [MIGRATION] Encontrados ${localUsers.length} usuarios para migrar`);

    const migrationResults = [];

    // 2. Crear cada usuario en Firebase Authentication
    for (const localUser of localUsers) {
      try {
        console.log(`👤 [MIGRATION] Migrando usuario: ${localUser.username}`);

        // Crear usuario en Firebase Auth
        const firebaseUser = await auth.createUser({
          email: localUser.email,
          displayName: localUser.fullName || localUser.username,
          disabled: !localUser.isActive,
          // Generar contraseña temporal - el usuario deberá resetearla
          password: `temp${localUser.id}${Date.now()}`, 
        });

        console.log(`✅ [MIGRATION] Usuario creado en Firebase: ${firebaseUser.uid}`);

        // 3. Actualizar el registro local para asociar Firebase UID
        await db.update(users)
          .set({ 
            firebaseUid: firebaseUser.uid,
            needsPasswordReset: true // Flag para forzar cambio de contraseña
          })
          .where(eq(users.id, localUser.id));

        // 4. Mantener los roles existentes vinculados al Firebase UID
        // Los roles se mantendrán en la base de datos local usando firebaseUid como referencia

        migrationResults.push({
          localId: localUser.id,
          firebaseUid: firebaseUser.uid,
          email: localUser.email,
          status: 'success'
        });

        console.log(`🔗 [MIGRATION] Usuario ${localUser.username} vinculado: ${firebaseUser.uid}`);

      } catch (error: any) {
        console.error(`❌ [MIGRATION] Error migrando usuario ${localUser.username}:`, error);
        migrationResults.push({
          localId: localUser.id,
          firebaseUid: null,
          email: localUser.email,
          status: 'error',
          error: error.message
        });
      }
    }

    // 5. Generar reporte de migración
    const successful = migrationResults.filter(r => r.status === 'success').length;
    const failed = migrationResults.filter(r => r.status === 'error').length;

    console.log(`🎯 [MIGRATION] Migración completada:`);
    console.log(`   ✅ Exitosos: ${successful}`);
    console.log(`   ❌ Fallidos: ${failed}`);

    // 6. Crear tabla de usuarios pendientes si no existe (para nuevos registros)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS pending_users (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
      );
    `);

    console.log('📋 [MIGRATION] Tabla de usuarios pendientes creada/verificada');

    return {
      success: successful,
      failed: failed,
      results: migrationResults
    };

  } catch (error) {
    console.error('🚨 [MIGRATION] Error general en migración:', error);
    throw error;
  }
}

// Función para aprobar usuarios pendientes
export async function approveUser(firebaseUid: string, approvedByUserId: number, assignedRoleId: number = 2) {
  try {
    console.log(`✅ [APPROVAL] Aprobando usuario: ${firebaseUid}`);

    // 1. Crear el usuario en la tabla local users
    const [newUser] = await db.insert(users).values({
      firebaseUid: firebaseUid,
      username: '', // Se actualizará desde Firebase
      email: '', // Se actualizará desde Firebase  
      roleId: assignedRoleId, // Role por defecto o asignado
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // 2. Actualizar estado en pending_users
    await db.execute(`
      UPDATE pending_users 
      SET status = 'approved', 
          approved_by = ${approvedByUserId}, 
          approved_at = CURRENT_TIMESTAMP 
      WHERE firebase_uid = '${firebaseUid}'
    `);

    // 3. Habilitar el usuario en Firebase Auth
    await auth.updateUser(firebaseUid, { disabled: false });

    console.log(`🎉 [APPROVAL] Usuario aprobado exitosamente: ${firebaseUid}`);
    return newUser;

  } catch (error) {
    console.error(`❌ [APPROVAL] Error aprobando usuario ${firebaseUid}:`, error);
    throw error;
  }
}