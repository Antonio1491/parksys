import { db } from './db';
import { users } from '../shared/schema';
import { eq, isNull } from 'drizzle-orm';

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

// Función para migrar usuarios conocidos (versión simplificada)
export async function migrateKnownUsers() {
  try {
    console.log('🚀 [MIGRATION] Iniciando migración simplificada...');
    
    // Obtener usuarios que no tienen Firebase UID
    const usersWithoutFirebase = await db.select()
      .from(users)
      .where(isNull(users.firebaseUid));
    
    console.log(`📊 [MIGRATION] Usuarios sin Firebase UID: ${usersWithoutFirebase.length}`);
    
    // Crear instrucciones para migración manual
    console.log('📋 [MIGRATION] Instrucciones de migración:');
    console.log('1. Los usuarios existentes deben:');
    console.log('   - Ir a la página de login');
    console.log('   - Hacer clic en "Registrarse"');
    console.log('   - Usar exactamente el mismo email que tienen en el sistema');
    console.log('   - El sistema vinculará automáticamente su cuenta');
    console.log('');
    console.log('2. Usuarios que requieren migración:');
    
    for (const user of usersWithoutFirebase) {
      console.log(`   📧 ${user.email} (${user.fullName || user.username})`);
    }
    
    return {
      usersToMigrate: usersWithoutFirebase.length,
      users: usersWithoutFirebase.map(u => ({
        email: u.email,
        name: u.fullName || u.username
      }))
    };
    
  } catch (error) {
    console.error('💥 [MIGRATION] Error en migración simplificada:', error);
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