import { db } from './db';
import { roles } from '../shared/schema';
import { eq } from 'drizzle-orm';
import type { InsertRole } from '../shared/schema';

// Definición de roles del sistema sincronizada con RoleBadge.tsx
const SYSTEM_ROLES = [
  {
    name: 'Super Administrador',
    slug: 'super-admin',
    description: 'Acceso total al sistema',
    level: 1,
    color: '#1e40af',
    permissions: {
      all: true // Super admin tiene todos los permisos
    }
  },
  {
    name: 'Administrador General',
    slug: 'admin-general',
    description: 'Administrador general del sistema',
    level: 2,
    color: '#1e40af',
    permissions: {
      'Configuración': ['read', 'write'],
      'Gestión': ['read', 'write', 'admin'],
      'Operaciones': ['read', 'write', 'admin'],
      'Finanzas': ['read', 'write', 'admin'],
      'Marketing': ['read', 'write', 'admin'],
      'RH': ['read', 'write', 'admin'],
      'Seguridad': ['read', 'write']
    }
  },
  {
    name: 'Coordinador de Parques',
    slug: 'coordinador-parques',
    description: 'Coordinador de parques urbanos',
    level: 3,
    color: '#1e40af',
    permissions: {
      'Configuración': ['read'],
      'Gestión': ['read', 'write', 'admin'],
      'Operaciones': ['read', 'write', 'admin'],
      'Finanzas': ['read'],
      'Marketing': ['read', 'write'],
      'RH': ['read'],
      'Seguridad': ['read']
    }
  },
  {
    name: 'Supervisor de Operaciones',
    slug: 'supervisor-operaciones',
    description: 'Supervisor de operaciones de campo',
    level: 4,
    color: '#1e40af',
    permissions: {
      'Configuración': ['read'],
      'Gestión': ['read', 'write'],
      'Operaciones': ['read', 'write'],
      'Finanzas': ['read'],
      'Marketing': ['read', 'write', 'admin'],
      'RH': ['read'],
      'Seguridad': ['read']
    }
  },
  {
    name: 'Técnico Especialista',
    slug: 'tecnico-especialista',
    description: 'Técnico especialista en áreas',
    level: 5,
    color: '#1e40af',
    permissions: {
      'Configuración': ['read'],
      'Gestión': ['read'],
      'Operaciones': ['read'],
      'Finanzas': ['read', 'write', 'admin'],
      'Marketing': ['read'],
      'RH': ['read', 'write'],
      'Seguridad': ['read']
    }
  },
  {
    name: 'Operador de Campo',
    slug: 'operador-campo',
    description: 'Operador de campo',
    level: 6,
    color: '#1e40af',
    permissions: {
      'Configuración': [],
      'Gestión': ['read'],
      'Operaciones': ['read', 'write'],
      'Finanzas': [],
      'Marketing': ['read'],
      'RH': [],
      'Seguridad': []
    }
  },
  {
    name: 'Consultor Auditor',
    slug: 'consultor-auditor',
    description: 'Consultor auditor externo',
    level: 7,
    color: '#1e40af',
    permissions: {
      'Configuración': ['read'],
      'Gestión': ['read'],
      'Operaciones': ['read'],
      'Finanzas': ['read'],
      'Marketing': ['read'],
      'RH': ['read'],
      'Seguridad': ['read']
    }
  }
];

export class RoleSeeder {

  // Sincronizar roles del sistema con la base de datos
  async seedSystemRoles(): Promise<void> {
    console.log('🌱 [ROLE SEEDER] Iniciando sincronización de roles del sistema...');

    try {
      for (const roleData of SYSTEM_ROLES) {
        // Verificar si el rol ya existe por slug
        const existingRole = await db
          .select()
          .from(roles)
          .where(eq(roles.slug, roleData.slug));

        if (existingRole.length > 0) {
          // Actualizar rol existente
          await db
            .update(roles)
            .set({
              name: roleData.name,
              description: roleData.description,
              level: roleData.level,
              color: roleData.color,
              permissions: roleData.permissions,
              updatedAt: new Date()
            })
            .where(eq(roles.slug, roleData.slug));

          console.log(`✅ [ROLE SEEDER] Rol actualizado: ${roleData.name} (${roleData.slug})`);
        } else {
          // Crear nuevo rol
          const insertData: InsertRole = {
            name: roleData.name,
            slug: roleData.slug,
            description: roleData.description,
            level: roleData.level,
            color: roleData.color,
            permissions: roleData.permissions,
            isActive: true
          };

          await db.insert(roles).values(insertData);
          console.log(`🆕 [ROLE SEEDER] Rol creado: ${roleData.name} (${roleData.slug})`);
        }
      }

      console.log('✅ [ROLE SEEDER] Sincronización de roles completada exitosamente');
    } catch (error) {
      console.error('❌ [ROLE SEEDER] Error en sincronización de roles:', error);
      throw error;
    }
  }

  // Verificar integridad del sistema de roles
  async verifyRoleIntegrity(): Promise<boolean> {
    try {
      const dbRoles = await db.select().from(roles);
      
      // Verificar que todos los roles del sistema existen
      for (const systemRole of SYSTEM_ROLES) {
        const dbRole = dbRoles.find(r => r.slug === systemRole.slug);
        if (!dbRole) {
          console.warn(`⚠️ [ROLE SEEDER] Rol faltante en BD: ${systemRole.slug}`);
          return false;
        }

        // Verificar que el nivel coincide
        if (dbRole.level !== systemRole.level) {
          console.warn(`⚠️ [ROLE SEEDER] Nivel incorrecto para ${systemRole.slug}: BD=${dbRole.level}, Sistema=${systemRole.level}`);
          return false;
        }
      }

      console.log('✅ [ROLE SEEDER] Integridad del sistema de roles verificada');
      return true;
    } catch (error) {
      console.error('❌ [ROLE SEEDER] Error verificando integridad:', error);
      return false;
    }
  }

  // Obtener mapeo de slugs a IDs para migración
  async getSlugToIdMapping(): Promise<Map<string, number>> {
    const dbRoles = await db.select().from(roles);
    const mapping = new Map<string, number>();
    
    dbRoles.forEach(role => {
      mapping.set(role.slug, role.id);
    });

    return mapping;
  }

  // Migrar usuarios existentes que tengan roleId como string a integer
  async migrateUserRoles(): Promise<void> {
    console.log('🔄 [ROLE SEEDER] Iniciando migración de roles de usuarios...');
    
    try {
      const slugToIdMap = await this.getSlugToIdMapping();
      
      // Esta función se puede usar si hay usuarios con roleId como string
      // Por ahora solo registramos el mapeo disponible
      console.log('📝 [ROLE SEEDER] Mapeo de roles disponible:');
      slugToIdMap.forEach((id, slug) => {
        console.log(`   ${slug} → ID: ${id}`);
      });

      console.log('✅ [ROLE SEEDER] Migración de roles de usuarios completada');
    } catch (error) {
      console.error('❌ [ROLE SEEDER] Error en migración de roles:', error);
      throw error;
    }
  }
}

export const roleSeeder = new RoleSeeder();

// Auto-ejecutar seeding en desarrollo
if (process.env.NODE_ENV === 'development') {
  roleSeeder.seedSystemRoles().catch(console.error);
}