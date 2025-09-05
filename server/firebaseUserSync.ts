import { db } from './db';
import { users } from '../shared/schema';
import { eq, isNull } from 'drizzle-orm';
import admin from 'firebase-admin';

/**
 * Sistema de sincronización automática entre Firebase y usuarios locales
 * Este enfoque funciona sin credenciales de Firebase Admin SDK
 */

// Función para vincular cuenta existente con Firebase UID
export async function linkExistingUserWithFirebase(email: string, firebaseUid: string) {
  try {
    console.log(`🔗 [SYNC] Vinculando usuario existente: ${email} -> ${firebaseUid}`);
    
    // Buscar usuario existente por email
    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!existingUser) {
      console.log(`❌ [SYNC] Usuario no encontrado para email: ${email}`);
      return null;
    }
    
    // Si ya tiene Firebase UID, verificar que coincida
    if (existingUser.firebaseUid) {
      if (existingUser.firebaseUid === firebaseUid) {
        console.log(`✅ [SYNC] Usuario ya vinculado correctamente: ${email}`);
        return existingUser;
      } else {
        console.log(`⚠️ [SYNC] Usuario tiene diferente Firebase UID: ${email}`);
        return null;
      }
    }
    
    // Vincular Firebase UID al usuario existente
    const [updatedUser] = await db.update(users)
      .set({
        firebaseUid: firebaseUid,
        updatedAt: new Date()
      })
      .where(eq(users.id, existingUser.id))
      .returning();
    
    console.log(`✅ [SYNC] Usuario vinculado exitosamente: ${email} -> ${firebaseUid}`);
    return updatedUser;
    
  } catch (error) {
    console.error(`💥 [SYNC] Error vinculando usuario ${email}:`, error);
    throw error;
  }
}

// Función para verificar si un email corresponde a un usuario existente
export async function isExistingUser(email: string): Promise<boolean> {
  try {
    const [user] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return !!user;
  } catch (error) {
    console.error(`💥 [SYNC] Error verificando usuario existente ${email}:`, error);
    return false;
  }
}

// Función para obtener usuario por Firebase UID
export async function getUserByFirebaseUid(firebaseUid: string) {
  try {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);
    
    return user || null;
  } catch (error) {
    console.error(`💥 [SYNC] Error obteniendo usuario por Firebase UID ${firebaseUid}:`, error);
    return null;
  }
}

// Función para migrar usuarios conocidos - MIGRACIÓN REAL A FIREBASE
export async function migrateKnownUsers() {
  try {
    console.log('🚀 [REAL-MIGRATION] Iniciando migración REAL de usuarios a Firebase...');
    
    // Obtener usuarios que no tienen Firebase UID
    const usersWithoutFirebase = await db.select()
      .from(users)
      .where(isNull(users.firebaseUid));
    
    console.log(`📊 [REAL-MIGRATION] Usuarios sin Firebase UID: ${usersWithoutFirebase.length}`);
    
    if (usersWithoutFirebase.length === 0) {
      console.log('✅ [REAL-MIGRATION] Todos los usuarios ya están migrados');
      return {
        alreadyMigrated: true,
        usersToMigrate: 0,
        users: []
      };
    }
    
    const migratedUsers = [];
    const errors = [];
    
    for (const localUser of usersWithoutFirebase) {
      try {
        console.log(`🔄 [REAL-MIGRATION] Migrando usuario: ${localUser.email}`);
        
        // Crear usuario en Firebase
        const firebaseUser = await admin.auth().createUser({
          email: localUser.email,
          displayName: localUser.fullName || localUser.username,
          // Generar contraseña temporal - el usuario puede cambiarla después
          password: 'TempPassword123!',
          emailVerified: true // Marcar como verificado ya que son usuarios existentes
        });
        
        console.log(`✅ [REAL-MIGRATION] Usuario creado en Firebase: ${firebaseUser.uid}`);
        
        // Actualizar usuario local con Firebase UID
        const [updatedUser] = await db.update(users)
          .set({
            firebaseUid: firebaseUser.uid,
            needsPasswordReset: true, // Forzar cambio de contraseña
            updatedAt: new Date()
          })
          .where(eq(users.id, localUser.id))
          .returning();
        
        console.log(`🔗 [REAL-MIGRATION] Usuario local actualizado: ${updatedUser.email}`);
        
        migratedUsers.push({
          email: localUser.email,
          name: localUser.fullName || localUser.username,
          firebaseUid: firebaseUser.uid,
          localId: localUser.id
        });
        
      } catch (error: any) {
        console.error(`❌ [REAL-MIGRATION] Error migrando ${localUser.email}:`, error);
        errors.push({
          email: localUser.email,
          error: error?.message || 'Error desconocido'
        });
      }
    }
    
    console.log(`🎉 [REAL-MIGRATION] Migración completada: ${migratedUsers.length} exitosos, ${errors.length} errores`);
    
    return {
      success: true,
      migratedCount: migratedUsers.length,
      errorCount: errors.length,
      migratedUsers,
      errors
    };
    
  } catch (error) {
    console.error('💥 [REAL-MIGRATION] Error general en migración:', error);
    throw error;
  }
}

// Función para migración simplificada (instrucciones) - respaldo
export async function getMigrationInstructions() {
  try {
    console.log('📋 [INSTRUCTIONS] Obteniendo instrucciones de migración...');
    
    // Obtener usuarios que no tienen Firebase UID
    const usersWithoutFirebase = await db.select()
      .from(users)
      .where(isNull(users.firebaseUid));
    
    console.log(`📊 [INSTRUCTIONS] Usuarios sin Firebase UID: ${usersWithoutFirebase.length}`);
    
    return {
      usersToMigrate: usersWithoutFirebase.length,
      users: usersWithoutFirebase.map(u => ({
        email: u.email,
        name: u.fullName || u.username
      }))
    };
    
  } catch (error) {
    console.error('💥 [INSTRUCTIONS] Error obteniendo instrucciones:', error);
    throw error;
  }
}

// Función para restablecer vinculación (útil para testing)
export async function resetUserFirebaseLink(email: string) {
  try {
    console.log(`🔄 [RESET] Restableciendo vinculación para: ${email}`);
    
    const [updatedUser] = await db.update(users)
      .set({
        firebaseUid: null as any,
        updatedAt: new Date()
      })
      .where(eq(users.email, email))
      .returning();
    
    if (updatedUser) {
      console.log(`✅ [RESET] Vinculación restablecida para: ${email}`);
      return updatedUser;
    } else {
      console.log(`❌ [RESET] Usuario no encontrado: ${email}`);
      return null;
    }
    
  } catch (error) {
    console.error(`💥 [RESET] Error restableciendo vinculación ${email}:`, error);
    throw error;
  }
}