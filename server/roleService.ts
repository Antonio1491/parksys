import { db } from './db';
import { roles, users } from '../shared/schema';
import { eq, asc } from 'drizzle-orm';
import type { Role, User, InsertRole } from '../shared/schema';

export class RoleService {
  
  // Obtener todos los roles ordenados por nivel jerárquico
  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(asc(roles.level));
  }

  // Obtener rol por ID
  async getRoleById(id: number): Promise<Role | null> {
    const result = await db.select().from(roles).where(eq(roles.id, id));
    return result[0] || null;
  }

  // Obtener rol por slug
  async getRoleBySlug(slug: string): Promise<Role | null> {
    const result = await db.select().from(roles).where(eq(roles.slug, slug));
    return result[0] || null;
  }

  // Verificar si un usuario tiene un nivel de rol específico o superior
  async hasRoleLevel(userId: number, requiredLevel: number): Promise<boolean> {
    const result = await db
      .select({ level: roles.level })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId));
    
    if (!result[0]) return false;
    
    // Niveles más bajos tienen mayor autoridad (1 = Super Admin, 7 = Consultor)
    return result[0].level <= requiredLevel;
  }

  // Verificar si un usuario tiene una permiso específico
  async hasPermission(userId: number, permission: string): Promise<boolean> {
    const result = await db
      .select({ permissions: roles.permissions })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId));
    
    if (!result[0]) return false;
    
    const permissions = result[0].permissions as Record<string, any>;
    
    // Super Admin tiene todos los permisos
    if (permissions.all === true) return true;
    
    // Verificar permiso específico
    return this.checkPermissionInObject(permissions, permission);
  }

  // Método privado para verificar permisos anidados
  private checkPermissionInObject(permissions: Record<string, any>, permission: string): boolean {
    const parts = permission.split('.');
    let current: any = permissions;
    
    for (const part of parts) {
      if (current[part] === undefined) return false;
      if (current[part] === true) return true;
      if (typeof current[part] === 'object' && current[part] !== null) {
        current = current[part];
      } else {
        return false;
      }
    }
    
    return current === true;
  }

  // Obtener estadísticas de usuarios por rol
  async getRoleUsageStats(): Promise<Array<{
    roleId: string;
    roleName: string;
    userCount: number;
    activeUsers: number;
    lastActivity: string;
  }>> {
    const result = await db
      .select({
        roleId: roles.slug,
        roleName: roles.name,
        userCount: db.$count(users, eq(users.roleId, roles.id)),
        // Por ahora usaremos el mismo valor para activeUsers
        // En el futuro se puede agregar una tabla de sesiones para datos reales
      })
      .from(roles)
      .leftJoin(users, eq(users.roleId, roles.id))
      .groupBy(roles.id, roles.slug, roles.name)
      .orderBy(asc(roles.level));

    // Por ahora simulamos datos de actividad - en el futuro se puede conectar con tabla de sesiones
    return result.map(row => ({
      roleId: row.roleId,
      roleName: row.roleName,
      userCount: row.userCount,
      activeUsers: Math.max(0, row.userCount - Math.floor(Math.random() * 3)),
      lastActivity: this.generateMockLastActivity()
    }));
  }

  private generateMockLastActivity(): string {
    const activities = ['5 min', '15 min', '30 min', '45 min', '1 hora', '2 horas', '1 día', '2 días'];
    return activities[Math.floor(Math.random() * activities.length)];
  }

  // Obtener usuario con rol
  async getUserWithRole(userId: number): Promise<(User & { userRole?: Role }) | null> {
    const result = await db
      .select()
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId));
    
    if (!result[0]) return null;
    
    const { users: user, roles: role } = result[0];
    return {
      ...user,
      userRole: role || undefined
    };
  }

  // Asignar rol a usuario
  async assignRole(userId: number, roleId: number): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({ roleId, updatedAt: new Date() })
        .where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error('Error asignando rol:', error);
      return false;
    }
  }

  // Obtener todos los usuarios con sus roles
  async getUsersWithRoles(): Promise<(User & { userRole?: Role })[]> {
    const result = await db
      .select()
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .orderBy(asc(users.fullName));
    
    return result.map(({ users: user, roles: role }) => ({
      ...user,
      userRole: role || undefined
    }));
  }

  // ===== NUEVAS FUNCIONES PARA SISTEMA DINÁMICO =====

  // Crear rol
  async createRole(roleData: InsertRole): Promise<Role> {
    const result = await db.insert(roles).values(roleData).returning();
    return result[0];
  }

  // Actualizar rol
  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role | null> {
    const result = await db
      .update(roles)
      .set({ ...roleData, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return result[0] || null;
  }

  // Eliminar rol (solo si no tiene usuarios asignados)
  async deleteRole(id: number): Promise<boolean> {
    try {
      // Verificar que no hay usuarios con este rol
      const usersWithRole = await db
        .select()
        .from(users)
        .where(eq(users.roleId, id));
      
      if (usersWithRole.length > 0) {
        throw new Error(`No se puede eliminar el rol. Tiene ${usersWithRole.length} usuario(s) asignado(s).`);
      }

      await db.delete(roles).where(eq(roles.id, id));
      return true;
    } catch (error) {
      console.error('Error eliminando rol:', error);
      return false;
    }
  }

  // Verificar permisos de módulo específico
  async hasModulePermission(
    userId: number, 
    module: string, 
    permission: 'read' | 'write' | 'admin'
  ): Promise<boolean> {
    const result = await db
      .select({ permissions: roles.permissions })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId));
    
    if (!result[0]) return false;
    
    const permissions = result[0].permissions as Record<string, any>;
    
    // Super Admin tiene todos los permisos
    if (permissions.all === true) return true;
    
    // Verificar permiso específico del módulo
    const modulePermissions = permissions[module];
    if (!modulePermissions || !Array.isArray(modulePermissions)) return false;
    
    return modulePermissions.includes(permission);
  }

  // Obtener permisos completos de un usuario
  async getUserPermissions(userId: number): Promise<Record<string, string[]> | null> {
    const result = await db
      .select({ 
        permissions: roles.permissions,
        roleLevel: roles.level,
        roleName: roles.name
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId));
    
    if (!result[0]) return null;
    
    const permissions = result[0].permissions as Record<string, any>;
    
    // Si es super admin, generar permisos completos
    if (permissions.all === true) {
      return {
        'Configuración': ['read', 'write', 'admin'],
        'Gestión': ['read', 'write', 'admin'],
        'Operaciones': ['read', 'write', 'admin'],
        'Finanzas': ['read', 'write', 'admin'],
        'Marketing': ['read', 'write', 'admin'],
        'RH': ['read', 'write', 'admin'],
        'Seguridad': ['read', 'write', 'admin']
      };
    }

    return permissions as Record<string, string[]>;
  }

  // Actualizar permisos de rol
  async updateRolePermissions(roleId: number, permissions: Record<string, any>): Promise<boolean> {
    try {
      await db
        .update(roles)
        .set({ permissions, updatedAt: new Date() })
        .where(eq(roles.id, roleId));
      return true;
    } catch (error) {
      console.error('Error actualizando permisos:', error);
      return false;
    }
  }
}

export const roleService = new RoleService();