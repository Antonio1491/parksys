import { Request, Response, NextFunction } from 'express';
import { roleService } from '../roleService';

/**
 * Middleware para verificar permisos en endpoints usando el sistema de 4 niveles
 * Formato: module:submodule:page:action
 * 
 * Uso:
 *   app.post('/api/parks', requirePermission('management:parks:parks:create'), handler)
 *   app.patch('/api/parks/:id', requirePermission('management:parks:parks:edit'), handler)
 *   app.delete('/api/parks/:id', requirePermission('management:parks:parks:delete'), handler)
 */
export function requirePermission(requiredPermission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;

      // Verificar autenticación
      if (!user || !user.id) {
        console.log(`[requirePermission] ❌ No hay usuario autenticado para ${req.method} ${req.path}`);
        return res.status(401).json({ 
          error: 'No autenticado',
          message: 'Debes iniciar sesión para acceder a este recurso'
        });
      }

      const userId = user.id;
      const roleId = user.roleId;

      console.log(`[requirePermission] 🔐 Verificando: ${requiredPermission} | Usuario: ${userId} | Rol: ${roleId} | ${req.method} ${req.path}`);

      // Super Admin (roleId === 1) siempre tiene acceso
      if (roleId === 1 || user.role === 'super_admin' || user.role === 'super-admin') {
        console.log(`[requirePermission] 👑 Super Admin - acceso permitido`);
        return next();
      }

      // Obtener permisos estructurados del usuario
      const permissions = await roleService.getUserPermissions(userId);

      if (!permissions) {
        console.log(`[requirePermission] ❌ No se pudieron obtener permisos para usuario ${userId}`);
        return res.status(403).json({ 
          error: 'Acceso denegado',
          message: 'No se pudieron verificar tus permisos'
        });
      }

      // Si tiene all: true (Super Admin via BD)
      if (permissions.all === true) {
        console.log(`[requirePermission] 👑 Permiso total (all:true) - acceso permitido`);
        return next();
      }

      // Verificar permiso con sistema híbrido
      const hasPermission = checkPermission(permissions, requiredPermission);

      if (hasPermission) {
        console.log(`[requirePermission] ✅ Permiso concedido: ${requiredPermission}`);
        return next();
      }

      console.log(`[requirePermission] ⛔ Permiso denegado: ${requiredPermission}`);
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: 'No tienes permisos para realizar esta acción',
        requiredPermission
      });

    } catch (error) {
      console.error(`[requirePermission] 💥 Error:`, error);
      return res.status(500).json({ 
        error: 'Error interno',
        message: 'Error al verificar permisos'
      });
    }
  };
}

/**
 * Verifica si el usuario tiene el permiso requerido
 * Sistema híbrido: submódulo (default) + página (override)
 */
function checkPermission(userPermissions: Record<string, any>, requiredPermission: string): boolean {
  // Limpiar campos de metadata
  const cleanPermissions = { ...userPermissions };
  delete cleanPermissions.metadata;
  delete cleanPermissions.source;
  delete cleanPermissions.userId;
  delete cleanPermissions.all;

  // Parsear permiso requerido
  const parts = requiredPermission.split(':');
  if (parts.length !== 4) {
    console.warn(`[requirePermission] ⚠️ Formato inválido: ${requiredPermission}`);
    return false;
  }

  const [module, submodule, page, action] = parts;

  // Jerarquía de acciones
  const actionHierarchy: Record<string, string[]> = {
    'view': ['view', 'create', 'edit', 'delete', 'admin', 'manage'],
    'create': ['create', 'edit', 'delete', 'admin', 'manage'],
    'edit': ['edit', 'delete', 'admin', 'manage'],
    'delete': ['delete', 'admin', 'manage'],
    'admin': ['admin', 'manage'],
    'manage': ['manage', 'admin'],
  };

  const allowedActions = actionHierarchy[action] || [action];

  // NIVEL 2 (Override): Permiso específico de página
  const pageKey = `${module}.${submodule}.${page}`;
  const pageActions = cleanPermissions[pageKey];

  if (pageActions && Array.isArray(pageActions) && pageActions.length > 0) {
    const result = pageActions.some((a: string) => allowedActions.includes(a));
    console.log(`[requirePermission] 📄 Página [${pageKey}]: ${result ? '✅' : '❌'}`, { userActions: pageActions, required: action });
    return result;
  }

  // NIVEL 1 (Default): Permiso de submódulo
  const submoduleKey = `${module}.${submodule}`;
  const submoduleActions = cleanPermissions[submoduleKey];

  if (!submoduleActions || !Array.isArray(submoduleActions)) {
    console.log(`[requirePermission] 📁 Submódulo [${submoduleKey}]: no encontrado ❌`);
    return false;
  }

  const result = submoduleActions.some((a: string) => allowedActions.includes(a));
  console.log(`[requirePermission] 📁 Submódulo [${submoduleKey}]: ${result ? '✅' : '❌'}`, { userActions: submoduleActions, required: action });
  return result;
}

/**
 * Middleware para requerir solo autenticación (sin permisos específicos)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;

  if (!user || !user.id) {
    return res.status(401).json({ 
      error: 'No autenticado',
      message: 'Debes iniciar sesión para acceder a este recurso'
    });
  }

  next();
}

/**
 * Middleware para requerir Super Admin
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;

  if (!user || !user.id) {
    return res.status(401).json({ 
      error: 'No autenticado',
      message: 'Debes iniciar sesión'
    });
  }

  if (user.roleId !== 1 && user.role !== 'super_admin' && user.role !== 'super-admin') {
    return res.status(403).json({ 
      error: 'Acceso denegado',
      message: 'Se requieren privilegios de Super Administrador'
    });
  }

  next();
}

export default requirePermission;