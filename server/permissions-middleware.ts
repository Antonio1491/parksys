import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Extender la interfaz Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: number;
    }
  }
}

/**
 * Middleware para verificar permisos específicos
 * @param permissionKey - Clave del permiso en formato 'module:submodule:page:action'
 * @param allowSelf - Permitir acceso si el usuario está accediendo a su propio recurso
 */
export function requirePermission(permissionKey: string, allowSelf: boolean = false) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar si hay un usuario autenticado
      if (!req.user && !req.userId) {
        console.log(`⛔ Acceso denegado: Usuario no autenticado para permiso ${permissionKey}`);
        return res.status(401).json({ 
          error: 'No autorizado',
          message: 'Debe iniciar sesión para acceder a este recurso'
        });
      }

      const userId = req.userId || req.user?.id;
      
      if (!userId) {
        console.log(`⛔ Acceso denegado: No se pudo obtener ID de usuario para permiso ${permissionKey}`);
        return res.status(401).json({ 
          error: 'No autorizado',
          message: 'Usuario no identificado'
        });
      }

      // Si allowSelf está habilitado, verificar si el usuario está accediendo a su propio recurso
      if (allowSelf) {
        const resourceUserId = parseInt(req.params.userId || req.params.id);
        if (resourceUserId === userId) {
          console.log(`✅ Acceso permitido: Usuario ${userId} accediendo a su propio recurso`);
          return next();
        }
      }

      // Verificar el permiso usando el nuevo método híbrido (FK + legacy)
      const hasPermission = await storage.checkUserPermissionHybrid(userId, permissionKey);
      
      if (!hasPermission) {
        console.log(`⛔ Acceso denegado: Usuario ${userId} no tiene permiso ${permissionKey}`);
        return res.status(403).json({ 
          error: 'Acceso denegado',
          message: 'No tiene permisos suficientes para realizar esta acción',
          requiredPermission: permissionKey
        });
      }

      console.log(`✅ Acceso permitido: Usuario ${userId} tiene permiso ${permissionKey}`);
      next();
    } catch (error) {
      console.error('Error en middleware de permisos:', error);
      return res.status(500).json({ 
        error: 'Error del servidor',
        message: 'Error al verificar permisos'
      });
    }
  };
}

/**
 * Middleware para requerir múltiples permisos (debe tener al menos uno)
 * @param permissionKeys - Array de claves de permisos
 */
export function requireAnyPermission(permissionKeys: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user && !req.userId) {
        return res.status(401).json({ 
          error: 'No autorizado',
          message: 'Debe iniciar sesión para acceder a este recurso'
        });
      }

      const userId = req.userId || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'No autorizado',
          message: 'Usuario no identificado'
        });
      }

      // Verificar si tiene al menos uno de los permisos usando método híbrido
      for (const permissionKey of permissionKeys) {
        const hasPermission = await storage.checkUserPermissionHybrid(userId, permissionKey);
        if (hasPermission) {
          console.log(`✅ Acceso permitido: Usuario ${userId} tiene permiso ${permissionKey}`);
          return next();
        }
      }

      console.log(`⛔ Acceso denegado: Usuario ${userId} no tiene ninguno de los permisos requeridos`);
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: 'No tiene ninguno de los permisos requeridos para realizar esta acción',
        requiredPermissions: permissionKeys
      });
    } catch (error) {
      console.error('Error en middleware de permisos:', error);
      return res.status(500).json({ 
        error: 'Error del servidor',
        message: 'Error al verificar permisos'
      });
    }
  };
}

/**
 * Middleware para requerir todos los permisos especificados
 * @param permissionKeys - Array de claves de permisos
 */
export function requireAllPermissions(permissionKeys: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user && !req.userId) {
        return res.status(401).json({ 
          error: 'No autorizado',
          message: 'Debe iniciar sesión para acceder a este recurso'
        });
      }

      const userId = req.userId || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'No autorizado',
          message: 'Usuario no identificado'
        });
      }

      // Verificar que tenga todos los permisos usando método híbrido
      const missingPermissions: string[] = [];
      
      for (const permissionKey of permissionKeys) {
        const hasPermission = await storage.checkUserPermissionHybrid(userId, permissionKey);
        if (!hasPermission) {
          missingPermissions.push(permissionKey);
        }
      }

      if (missingPermissions.length > 0) {
        console.log(`⛔ Acceso denegado: Usuario ${userId} no tiene los permisos: ${missingPermissions.join(', ')}`);
        return res.status(403).json({ 
          error: 'Acceso denegado',
          message: 'No tiene todos los permisos requeridos para realizar esta acción',
          missingPermissions
        });
      }

      console.log(`✅ Acceso permitido: Usuario ${userId} tiene todos los permisos requeridos`);
      next();
    } catch (error) {
      console.error('Error en middleware de permisos:', error);
      return res.status(500).json({ 
        error: 'Error del servidor',
        message: 'Error al verificar permisos'
      });
    }
  };
}

/**
 * Middleware para verificar si el usuario es Super Admin
 */
export function requireSuperAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user && !req.userId) {
        return res.status(401).json({ 
          error: 'No autorizado',
          message: 'Debe iniciar sesión para acceder a este recurso'
        });
      }

      const userId = req.userId || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'No autorizado',
          message: 'Usuario no identificado'
        });
      }

      // Obtener el usuario
      const user = await storage.getUser(userId);
      
      if (!user || user.roleId !== 1) {
        console.log(`⛔ Acceso denegado: Usuario ${userId} no es Super Admin`);
        return res.status(403).json({ 
          error: 'Acceso denegado',
          message: 'Se requieren privilegios de Super Administrador'
        });
      }

      console.log(`✅ Acceso permitido: Usuario ${userId} es Super Admin`);
      next();
    } catch (error) {
      console.error('Error en middleware de Super Admin:', error);
      return res.status(500).json({ 
        error: 'Error del servidor',
        message: 'Error al verificar privilegios de administrador'
      });
    }
  };
}

/**
 * Helper para obtener permisos del usuario actual
 */
export async function getUserPermissionsHelper(req: Request): Promise<string[]> {
  try {
    const userId = req.userId || req.user?.id;
    
    if (!userId) {
      return [];
    }

    return await storage.getUserPermissions(userId);
  } catch (error) {
    console.error('Error obteniendo permisos del usuario:', error);
    return [];
  }
}

/**
 * Constantes de permisos comunes para facilitar el uso
 */
export const PERMISSIONS = {
  // Parques
  PARKS: {
    VIEW: 'parks:admin:list:view',
    CREATE: 'parks:admin:create:create',
    EDIT: 'parks:admin:edit:edit',
    DELETE: 'parks:admin:list:delete',
    MANAGE_AMENITIES: 'parks:amenities:manage',
  },
  
  // Actividades
  ACTIVITIES: {
    VIEW: 'activities:catalog:list:view',
    CREATE: 'activities:catalog:create:create',
    EDIT: 'activities:catalog:edit:edit',
    DELETE: 'activities:catalog:list:delete',
    MANAGE_REGISTRATIONS: 'activities:registrations',
    MANAGE_INSTRUCTORS: 'activities:instructors',
  },
  
  // Recursos Humanos
  HR: {
    VIEW_EMPLOYEES: 'hr:employees:directory:view',
    CREATE_EMPLOYEE: 'hr:employees:create:create',
    EDIT_EMPLOYEE: 'hr:employees:edit:edit',
    DELETE_EMPLOYEE: 'hr:employees:directory:delete',
    MANAGE_PAYROLL: 'hr:payroll',
    MANAGE_VACATIONS: 'hr:vacations',
  },
  
  // Finanzas
  FINANCE: {
    VIEW_INCOME: 'finance:income:view',
    VIEW_EXPENSES: 'finance:expenses:view',
    MANAGE_BUDGETS: 'finance:budgets',
    VIEW_REPORTS: 'finance:reports:view',
    EXPORT_REPORTS: 'finance:reports:export',
  },
  
  // Marketing
  MARKETING: {
    VIEW_SPONSORS: 'marketing:sponsors:list:view',
    CREATE_SPONSOR: 'marketing:sponsors:create',
    MANAGE_CONTRACTS: 'marketing:contracts',
    MANAGE_ASSETS: 'marketing:assets',
    MANAGE_CAMPAIGNS: 'marketing:campaigns',
  },
  
  // Configuración
  CONFIG: {
    VIEW_USERS: 'config:users:list:view',
    CREATE_USER: 'config:users:create:create',
    EDIT_USER: 'config:users:edit:edit',
    DELETE_USER: 'config:users:list:delete',
    MANAGE_ROLES: 'config:roles',
    MANAGE_PERMISSIONS: 'config:permissions',
    SYSTEM_SETTINGS: 'config:system',
  },
  
  // Seguridad
  SECURITY: {
    VIEW_AUDIT: 'security:audit:view',
    MANAGE_BACKUPS: 'security:backups',
    VIEW_LOGS: 'security:logs:view',
  }
};

// Exportar middleware de ejemplo para rutas comunes
export const commonMiddleware = {
  // Middleware para rutas de solo lectura
  readOnly: requireAnyPermission([
    PERMISSIONS.PARKS.VIEW,
    PERMISSIONS.ACTIVITIES.VIEW,
    PERMISSIONS.HR.VIEW_EMPLOYEES,
    PERMISSIONS.FINANCE.VIEW_INCOME,
    PERMISSIONS.FINANCE.VIEW_EXPENSES,
  ]),
  
  // Middleware para creación de contenido
  createContent: requireAnyPermission([
    PERMISSIONS.PARKS.CREATE,
    PERMISSIONS.ACTIVITIES.CREATE,
    PERMISSIONS.HR.CREATE_EMPLOYEE,
  ]),
  
  // Middleware para administración completa
  fullAdmin: requireSuperAdmin(),
};