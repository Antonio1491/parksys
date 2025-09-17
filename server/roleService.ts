import { db } from './db';
import { roles, users, userRoles } from '../shared/schema';
import { eq, asc, and, inArray } from 'drizzle-orm';
import type { Role, User, InsertRole, UserRole, InsertUserRole } from '../shared/schema';

export class RoleService {
  
  // ===== MÉTODOS PARA MÚLTIPLES ROLES =====
  
  // Obtener todos los roles de un usuario
  async getUserRoles(userId: number, includeInactive = false): Promise<(UserRole & { role: Role })[]> {
    // Build where conditions based on includeInactive flag
    const whereConditions = includeInactive
      ? eq(userRoles.userId, userId)
      : and(
          eq(userRoles.userId, userId),
          eq(userRoles.isActive, true),
          eq(roles.isActive, true)
        );

    const query = db
      .select({
        id: userRoles.id,
        userId: userRoles.userId,
        roleId: userRoles.roleId,
        isPrimary: userRoles.isPrimary,
        assignedBy: userRoles.assignedBy,
        assignedAt: userRoles.assignedAt,
        expiresAt: userRoles.expiresAt,
        isActive: userRoles.isActive,
        createdAt: userRoles.createdAt,
        updatedAt: userRoles.updatedAt,
        role: roles
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(whereConditions);
    
    return await query.orderBy(asc(roles.level));
  }
  
  // Asignar rol a usuario
  async assignRoleToUser(userId: number, roleId: number, assignedBy?: number, isPrimary = false): Promise<UserRole> {
    // Si es rol primario, quitar la marca de otros roles
    if (isPrimary) {
      await db
        .update(userRoles)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(eq(userRoles.userId, userId));
    }
    
    const [newUserRole] = await db
      .insert(userRoles)
      .values({
        userId,
        roleId,
        isPrimary,
        assignedBy,
        assignedAt: new Date(),
        isActive: true
      })
      .returning();
      
    return newUserRole;
  }
  
  // Remover rol de usuario
  async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
    const result = await db
      .delete(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId)
      ))
      .returning();
      
    return result.length > 0;
  }
  
  // Establecer rol como primario
  async setPrimaryRole(userId: number, roleId: number): Promise<boolean> {
    // Primero quitar la marca primaria de todos los roles
    await db
      .update(userRoles)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(eq(userRoles.userId, userId));
    
    // Luego establecer el rol específico como primario
    const result = await db
      .update(userRoles)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId)
      ))
      .returning();
      
    return result.length > 0;
  }
  
  // Obtener rol primario del usuario
  async getPrimaryRole(userId: number): Promise<Role | null> {
    const result = await db
      .select({ role: roles })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.isPrimary, true),
        eq(userRoles.isActive, true),
        eq(roles.isActive, true)
      ))
      .limit(1);
      
    return result[0]?.role || null;
  }
  
  // Verificar si un usuario tiene múltiples roles
  async hasMultipleRoles(userId: number): Promise<boolean> {
    const result = await db
      .select({ count: userRoles.id })
      .from(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.isActive, true)
      ));
      
    return result.length > 1;
  }
  
  // ===== MÉTODOS ACTUALIZADOS PARA COMPATIBILIDAD =====
  
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

  // Verificar si un usuario tiene un nivel de rol específico o superior (ACTUALIZADO para múltiples roles)
  async hasRoleLevel(userId: number, requiredLevel: number): Promise<boolean> {
    // Primero intentar con múltiples roles
    const multiRoleResult = await db
      .select({ level: roles.level })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.isActive, true),
        eq(roles.isActive, true)
      ))
      .orderBy(asc(roles.level)); // Ordenar por nivel, el más bajo (más autoridad) primero
    
    if (multiRoleResult.length > 0) {
      // Si tiene múltiples roles, verificar si alguno cumple el nivel requerido
      return multiRoleResult.some(r => r.level <= requiredLevel);
    }
    
    // Fallback: usar el sistema legacy de rol único
    const legacyResult = await db
      .select({ level: roles.level })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId));
    
    if (!legacyResult[0]) return false;
    
    // Niveles más bajos tienen mayor autoridad (1 = Super Admin, 7 = Consultor)
    return legacyResult[0].level <= requiredLevel;
  }

  // Verificar si un usuario tiene un permiso específico (ACTUALIZADO para múltiples roles)
  async hasPermission(userId: number, permission: string): Promise<boolean> {
    // Primero intentar con múltiples roles
    const multiRoleResult = await db
      .select({ permissions: roles.permissions, level: roles.level })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.isActive, true),
        eq(roles.isActive, true)
      ));
    
    if (multiRoleResult.length > 0) {
      // Combinar permisos de todos los roles activos
      return this.checkCombinedPermissions(multiRoleResult.map(r => ({
        permissions: r.permissions as Record<string, any>,
        level: r.level
      })), permission);
    }
    
    // Fallback: usar el sistema legacy de rol único
    const legacyResult = await db
      .select({ permissions: roles.permissions })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId));
    
    if (!legacyResult[0]) return false;
    
    const permissions = legacyResult[0].permissions as Record<string, any>;
    
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
  
  // Método privado para combinar permisos de múltiples roles
  private checkCombinedPermissions(rolePermissions: Array<{ permissions: Record<string, any>, level: number }>, permission: string): boolean {
    // Si algún rol tiene permisos totales, conceder acceso
    if (rolePermissions.some(rp => rp.permissions.all === true)) {
      return true;
    }
    
    // Verificar si algún rol tiene el permiso específico
    for (const rolePermission of rolePermissions) {
      if (this.checkPermissionInObject(rolePermission.permissions, permission)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Método privado para combinar permisos de múltiples roles
  private combineMultiplePermissions(permissionsArray: Record<string, any>[]): Record<string, any> {
    const combined: Record<string, any> = {};
    
    for (const permissions of permissionsArray) {
      // Si algún rol tiene acceso total, el resultado final lo tendrá
      if (permissions.all === true) {
        return { all: true };
      }
      
      // Combinar permisos específicos
      this.mergePermissions(combined, permissions);
    }
    
    return combined;
  }
  
  // Método privado para fusionar permisos recursivamente
  private mergePermissions(target: Record<string, any>, source: Record<string, any>): void {
    for (const [key, value] of Object.entries(source)) {
      if (key === 'all' && value === true) {
        target[key] = true;
        return;
      }
      
      if (typeof value === 'boolean') {
        // Si el valor es boolean, usar OR lógico (más permisivo gana)
        target[key] = target[key] === true || value === true;
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Si es objeto (no array), recursivamente combinar
        if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
          target[key] = {};
        }
        this.mergePermissions(target[key], value);
      } else if (Array.isArray(value)) {
        // Si es array, combinar arrays eliminando duplicados
        if (!target[key]) {
          target[key] = [...value];
        } else if (Array.isArray(target[key])) {
          target[key] = Array.from(new Set([...target[key], ...value]));
        } else {
          target[key] = [...value];
        }
      } else {
        // Para otros tipos, tomar el valor
        target[key] = value;
      }
    }
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

  // Verificar permisos de módulo específico (ACTUALIZADO para múltiples roles)
  async hasModulePermission(
    userId: number, 
    module: string, 
    permission: 'read' | 'write' | 'admin'
  ): Promise<boolean> {
    // Primero intentar con múltiples roles
    const multiRoleResult = await db
      .select({ permissions: roles.permissions })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.isActive, true),
        eq(roles.isActive, true)
      ));
    
    if (multiRoleResult.length > 0) {
      // Verificar si alguno de los roles tiene el permiso del módulo
      for (const roleResult of multiRoleResult) {
        const permissions = roleResult.permissions as Record<string, any>;
        
        // Super Admin tiene todos los permisos
        if (permissions.all === true) return true;
        
        // Verificar permiso específico del módulo
        const modulePermissions = permissions[module];
        if (modulePermissions && Array.isArray(modulePermissions) && modulePermissions.includes(permission)) {
          return true;
        }
      }
      return false;
    }
    
    // Fallback: sistema legacy
    const legacyResult = await db
      .select({ permissions: roles.permissions })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId));
    
    if (!legacyResult[0]) return false;
    
    const permissions = legacyResult[0].permissions as Record<string, any>;
    
    // Super Admin tiene todos los permisos
    if (permissions.all === true) return true;
    
    // Verificar permiso específico del módulo
    const modulePermissions = permissions[module];
    if (!modulePermissions || !Array.isArray(modulePermissions)) return false;
    
    return modulePermissions.includes(permission);
  }

  // Obtener permisos completos de un usuario (ACTUALIZADO para múltiples roles)
  async getUserPermissions(userId: number): Promise<Record<string, any>> {
    // Primero intentar con múltiples roles
    const multiRoleResult = await db
      .select({ 
        permissions: roles.permissions,
        level: roles.level,
        roleName: roles.name,
        roleSlug: roles.slug,
        isPrimary: userRoles.isPrimary
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.isActive, true),
        eq(roles.isActive, true)
      ))
      .orderBy(asc(roles.level));
    
    if (multiRoleResult.length > 0) {
      // Usuario tiene múltiples roles - combinar permisos
      const combinedPermissions = this.combineMultiplePermissions(
        multiRoleResult.map(r => r.permissions as Record<string, any>)
      );
      
      const primaryRole = multiRoleResult.find(r => r.isPrimary) || multiRoleResult[0];
      
      return {
        userId,
        roles: multiRoleResult.map(r => ({
          name: r.roleName,
          slug: r.roleSlug,
          level: r.level,
          isPrimary: r.isPrimary,
          permissions: r.permissions
        })),
        primaryRole: {
          name: primaryRole.roleName,
          slug: primaryRole.roleSlug,
          level: primaryRole.level
        },
        combinedPermissions,
        // Metadata adicional
        metadata: {
          source: 'multiple_roles',
          roleCount: multiRoleResult.length,
          hasMultipleRoles: multiRoleResult.length > 1,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Fallback: sistema legacy de rol único
    const legacyResult = await db
      .select({ 
        permissions: roles.permissions,
        level: roles.level,
        roleName: roles.name,
        roleSlug: roles.slug 
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId));
    
    if (!legacyResult[0]) {
      return { userId, permissions: {}, metadata: { source: 'none' } };
    }
    
    const permissions = legacyResult[0].permissions as Record<string, any>;
    
    // Si es super admin, expandir permisos
    const expandedPermissions = permissions.all === true ? {
      'Configuración': ['read', 'write', 'admin'],
      'Gestión': ['read', 'write', 'admin'],
      'Operaciones': ['read', 'write', 'admin'],
      'Finanzas': ['read', 'write', 'admin'],
      'Marketing': ['read', 'write', 'admin'],
      'RH': ['read', 'write', 'admin'],
      'Seguridad': ['read', 'write', 'admin']
    } : permissions;
    
    return {
      userId,
      role: {
        name: legacyResult[0].roleName,
        slug: legacyResult[0].roleSlug,
        level: legacyResult[0].level
      },
      permissions: expandedPermissions,
      // Metadata adicional para debugging
      metadata: {
        source: 'single_role_legacy',
        hasMultipleRoles: false,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Crear nuevo rol
  async createRole(roleData: InsertRole): Promise<Role> {
    const [newRole] = await db
      .insert(roles)
      .values({
        ...roleData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newRole;
  }

  // Actualizar permisos de rol
  async updateRolePermissions(roleId: number, permissions: Record<string, any>): Promise<boolean> {
    try {
      // ✅ CRÍTICO: Para super-admin, mantener el formato {"all": true}
      const role = await this.getRoleById(roleId);
      if (role?.slug === 'super-admin') {
        // Super admin siempre mantiene {"all": true}
        await db
          .update(roles)
          .set({ permissions: { all: true }, updatedAt: new Date() })
          .where(eq(roles.id, roleId));
      } else {
        // ✅ CRÍTICO: Para otros roles, convertir de módulos modernos a formato legacy
        const legacyPermissions = this.mapToLegacyPermissions(permissions);
        
        await db
          .update(roles)
          .set({ permissions: legacyPermissions, updatedAt: new Date() })
          .where(eq(roles.id, roleId));
      }
      return true;
    } catch (error) {
      console.error('Error actualizando permisos:', error);
      return false;
    }
  }

  // Mapeo de módulos antiguos a nuevos para migración de datos (SOLO LECTURA)
  private mapLegacyPermissions(legacyPermissions: Record<string, string[]>): Record<string, string[]> {
    const mappedPermissions: Record<string, string[]> = {};
    
    // Mapeo de categorías antiguas a módulos específicos
    const legacyMapping: Record<string, string[]> = {
      // Recursos Humanos → múltiples módulos
      'RH': ['empleados', 'nomina', 'vacaciones', 'instructores'],
      
      // Finanzas → múltiples módulos financieros  
      'Finanzas': ['finanzas', 'contabilidad', 'presupuestos', 'facturacion', 'reportes-financieros', 'concesiones'],
      
      // Gestión → múltiples módulos de gestión
      'Gestión': ['parques', 'actividades', 'eventos', 'reservas', 'evaluaciones'],
      
      // Marketing → múltiples módulos de comunicación
      'Marketing': ['marketing', 'publicidad', 'comunicaciones', 'campanas', 'contenido'],
      
      // Seguridad → múltiples módulos de seguridad
      'Seguridad': ['seguridad', 'auditoria', 'control-acceso', 'politicas'],
      
      // Operaciones → múltiples módulos operativos
      'Operaciones': ['activos', 'incidencias', 'mantenimiento', 'inventario'],
      
      // Configuración → múltiples módulos del sistema
      'Configuración': ['configuracion', 'usuarios', 'roles', 'notificaciones', 'respaldos']
    };
    
    // Procesar cada permiso existente
    Object.entries(legacyPermissions).forEach(([moduleKey, permissions]) => {
      if (legacyMapping[moduleKey]) {
        // Es un módulo antiguo - mapear a múltiples módulos nuevos
        legacyMapping[moduleKey].forEach(newModuleId => {
          mappedPermissions[newModuleId] = [...permissions];
        });
      } else {
        // Es un módulo ya actualizado - mantener
        mappedPermissions[moduleKey] = [...permissions];
      }
    });
    
    return mappedPermissions;
  }

  // Mapeo INVERSO: de módulos nuevos a categorías legacy para escritura en BD
  private mapToLegacyPermissions(modernPermissions: Record<string, string[]>): Record<string, string[]> {
    const legacyPermissions: Record<string, string[]> = {};
    
    // Mapeo inverso: agrupar módulos modernos en categorías legacy
    const modernToLegacy: Record<string, { category: string; modules: string[] }> = {
      'RH': {
        category: 'RH',
        modules: ['empleados', 'nomina', 'vacaciones', 'instructores']
      },
      'Finanzas': {
        category: 'Finanzas', 
        modules: ['finanzas', 'contabilidad', 'presupuestos', 'facturacion', 'reportes-financieros', 'concesiones']
      },
      'Gestión': {
        category: 'Gestión',
        modules: ['parques', 'actividades', 'eventos', 'reservas', 'evaluaciones']
      },
      'Marketing': {
        category: 'Marketing',
        modules: ['marketing', 'publicidad', 'comunicaciones', 'campanas', 'contenido']
      },
      'Seguridad': {
        category: 'Seguridad',
        modules: ['seguridad', 'auditoria', 'control-acceso', 'politicas']
      },
      'Operaciones': {
        category: 'Operaciones',
        modules: ['activos', 'incidencias', 'mantenimiento', 'inventario']
      },
      'Configuración': {
        category: 'Configuración',
        modules: ['configuracion', 'usuarios', 'roles', 'notificaciones', 'respaldos']
      }
    };

    // Procesar cada categoría legacy
    Object.entries(modernToLegacy).forEach(([legacyKey, { category, modules }]) => {
      // Obtener la unión de permisos de todos los módulos en esta categoría
      const categoryPermissions = new Set<string>();
      
      modules.forEach(moduleId => {
        const modulePerms = modernPermissions[moduleId] || [];
        modulePerms.forEach(perm => categoryPermissions.add(perm));
      });
      
      // Solo agregar si tiene permisos
      if (categoryPermissions.size > 0) {
        legacyPermissions[category] = Array.from(categoryPermissions);
      }
    });

    // Agregar módulos individuales que no están en categorías legacy
    Object.entries(modernPermissions).forEach(([moduleId, permissions]) => {
      const isInLegacyCategory = Object.values(modernToLegacy).some(
        ({ modules }) => modules.includes(moduleId)
      );
      
      if (!isInLegacyCategory && permissions.length > 0) {
        legacyPermissions[moduleId] = [...permissions];
      }
    });
    
    return legacyPermissions;
  }

  // Obtener todos los módulos esperados por useAdaptiveModules
  private getAllExpectedModules(): string[] {
    return [
      // Dashboard
      'dashboard',
      
      // Gestión
      'parques', 'actividades', 'eventos', 'reservas', 'evaluaciones', 'amenidades', 'arbolado', 'fauna', 'visitantes',
      
      // Operaciones y Mantenimiento
      'activos', 'incidencias', 'voluntarios', 'mantenimiento', 'inventario',
      
      // Finanzas
      'finanzas', 'contabilidad', 'concesiones', 'presupuestos', 'facturacion', 'reportes-financieros',
      
      // Marketing y Comunicaciones
      'marketing', 'publicidad', 'comunicaciones', 'campanas', 'contenido',
      
      // Recursos Humanos
      'empleados', 'nomina', 'vacaciones', 'instructores',
      
      // Sistema y Seguridad
      'usuarios', 'roles', 'configuracion', 'seguridad', 'auditoria', 'control-acceso', 'politicas', 
      'notificaciones', 'mantenimiento-sistema', 'exportaciones', 'respaldos'
    ];
  }

  // Obtener matriz completa de permisos (para PermissionsMatrix)
  async getAllRolePermissions(): Promise<Record<string, Record<string, string[]>>> {
    try {
      const allRoles = await this.getAllRoles();
      const permissionsMatrix: Record<string, Record<string, string[]>> = {};
      const expectedModules = this.getAllExpectedModules();
      
      allRoles.forEach(role => {
        // Usar el slug del rol como clave
        const roleSlug = role.slug;
        const rawPermissions = role.permissions as Record<string, any> || {};
        
        if (rawPermissions.all === true) {
          // Super Admin: todos los módulos con permisos completos
          const superAdminPermissions: Record<string, string[]> = {};
          expectedModules.forEach(moduleId => {
            superAdminPermissions[moduleId] = ['read', 'write', 'admin'];
          });
          permissionsMatrix[roleSlug] = superAdminPermissions;
        } else {
          // Otros roles: mapear permisos existentes y normalizar
          const mappedPermissions = this.mapLegacyPermissions(rawPermissions);
          
          // Asegurar que todos los módulos están presentes (vacíos si no tienen permisos)
          const normalizedPermissions: Record<string, string[]> = {};
          expectedModules.forEach(moduleId => {
            normalizedPermissions[moduleId] = mappedPermissions[moduleId] || [];
          });
          
          permissionsMatrix[roleSlug] = normalizedPermissions;
        }
      });
      
      return permissionsMatrix;
    } catch (error) {
      console.error('Error obteniendo matriz de permisos:', error);
      return {};
    }
  }
}

export const roleService = new RoleService();