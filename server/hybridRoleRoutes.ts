import type { Express } from "express";
import { roleService } from "./roleService";

/**
 * Endpoints adicionales para el sistema híbrido adaptativo de roles
 * Complementa a roleRoutes.ts con funcionalidades específicas del sistema CRUD
 */
export function registerHybridRoleRoutes(app: Express) {
  console.log("🔧 [HYBRID] Registrando endpoints híbridos de roles...");

  // ===== RUTAS ESPECÍFICAS PRIMERO (antes de rutas con parámetros) =====

  // Obtener estructura de módulos adaptativos (para frontend)
  app.get("/api/roles/adaptive-modules", async (req, res) => {
    try {
      // Este endpoint devuelve los módulos detectados dinámicamente
      // En una implementación completa, esto vendría del AdminSidebarComplete
      const adaptiveModules = {
        sistema: {
          id: 'sistema',
          name: 'Sistema',
          submodules: ['dashboard', 'usuarios', 'roles', 'configuracion']
        },
        gestion: {
          id: 'gestion',  
          name: 'Gestión',
          submodules: ['parques', 'actividades', 'instructores', 'voluntarios']
        },
        om: {
          id: 'om',
          name: 'O&M', 
          submodules: ['activos', 'mantenimiento', 'inventario', 'incidencias']
        },
        'admin-finanzas': {
          id: 'admin-finanzas',
          name: 'Admin/Finanzas',
          submodules: ['contabilidad', 'presupuestos', 'facturacion', 'reportes-financieros']
        },
        'mkt-comm': {
          id: 'mkt-comm',
          name: 'Mkt & Comm',
          submodules: ['campanas', 'contenido', 'publicidad', 'comunicaciones']
        },
        'config-seguridad': {
          id: 'config-seguridad',
          name: 'Config & Seguridad', 
          submodules: ['configuracion', 'seguridad', 'auditoria', 'respaldos']
        }
      };

      res.json(adaptiveModules);
    } catch (error) {
      console.error("Error obteniendo módulos adaptativos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener matriz completa de permisos (para PermissionsMatrix)
  app.get("/api/roles/permissions", async (req, res) => {
    try {
      console.log("🔧 [HYBRID] Obteniendo matriz completa de permisos...");
      const permissionsMatrix = await roleService.getAllRolePermissions();
      
      console.log(`✅ [HYBRID] Matriz de permisos obtenida: ${Object.keys(permissionsMatrix).length} roles`);
      res.json(permissionsMatrix);
    } catch (error) {
      console.error("❌ [HYBRID] Error obteniendo matriz de permisos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Validar jerarquía de permisos (para sistema adaptativo)
  app.post("/api/roles/permissions/validate-hierarchy", async (req, res) => {
    try {
      const { permissions } = req.body;
      
      if (!permissions || typeof permissions !== 'object') {
        return res.status(400).json({ error: "Permisos inválidos" });
      }

      // Función para validar jerarquía CRUD: admin > delete > update > create > read
      const validatePermissionHierarchy = (actions: string[]): string[] => {
        const hierarchy = ['read', 'create', 'update', 'delete', 'admin'];
        const validActions = new Set<string>();
        
        actions.forEach(action => {
          if (hierarchy.includes(action)) {
            const actionIndex = hierarchy.indexOf(action);
            // Agregar la acción y todas las de menor nivel
            for (let i = 0; i <= actionIndex; i++) {
              validActions.add(hierarchy[i]);
            }
          }
        });
        
        return Array.from(validActions).sort((a, b) => 
          hierarchy.indexOf(a) - hierarchy.indexOf(b)
        );
      };

      // Validar cada módulo
      const validatedPermissions: Record<string, string[]> = {};
      Object.keys(permissions).forEach(moduleId => {
        const actions = permissions[moduleId];
        if (Array.isArray(actions)) {
          validatedPermissions[moduleId] = validatePermissionHierarchy(actions);
        }
      });

      res.json({ 
        validatedPermissions,
        hierarchyRules: {
          order: ['read', 'create', 'update', 'delete', 'admin'],
          description: 'Permisos superiores incluyen automáticamente los inferiores'
        }
      });
    } catch (error) {
      console.error("Error validando jerarquía:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Guardar permisos de matriz (para PermissionsMatrix)
  app.post("/api/roles/permissions/save-matrix", async (req, res) => {
    try {
      const { rolePermissions } = req.body;
      
      if (!rolePermissions || typeof rolePermissions !== 'object') {
        return res.status(400).json({ error: "Datos de permisos inválidos" });
      }

      const results = [];
      const errors = [];

      // Actualizar permisos para cada rol
      for (const [roleIdStr, permissions] of Object.entries(rolePermissions)) {
        const roleId = parseInt(roleIdStr);
        if (isNaN(roleId)) {
          errors.push(`ID de rol inválido: ${roleIdStr}`);
          continue;
        }

        try {
          const success = await roleService.updateRolePermissions(roleId, permissions);
          if (success) {
            results.push({ roleId, status: 'updated' });
          } else {
            errors.push(`Error actualizando rol ${roleId}`);
          }
        } catch (error) {
          errors.push(`Error actualizando rol ${roleId}: ${error.message}`);
        }
      }

      if (errors.length > 0 && results.length === 0) {
        return res.status(400).json({ error: "No se pudieron actualizar los permisos", errors });
      }

      res.json({ 
        success: true,
        message: "Permisos actualizados correctamente",
        results,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error guardando matriz de permisos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener estadísticas de permisos por módulo (para dashboard administrativo)
  app.get("/api/roles/permissions-stats", async (req, res) => {
    try {
      const roles = await roleService.getAllRoles();
      const stats: Record<string, any> = {};

      roles.forEach(role => {
        const permissions = role.permissions as Record<string, string[]> || {};
        Object.keys(permissions).forEach(moduleId => {
          if (!stats[moduleId]) {
            stats[moduleId] = {
              moduleId,
              totalRoles: roles.length,
              rolesWithAccess: 0,
              permissionBreakdown: {
                read: 0,
                create: 0,
                update: 0,
                delete: 0,
                admin: 0
              }
            };
          }

          const modulePermissions = permissions[moduleId];
          if (modulePermissions && modulePermissions.length > 0) {
            stats[moduleId].rolesWithAccess++;
            
            modulePermissions.forEach(permission => {
              if (stats[moduleId].permissionBreakdown[permission] !== undefined) {
                stats[moduleId].permissionBreakdown[permission]++;
              }
            });
          }
        });
      });

      // Calcular porcentajes
      Object.values(stats).forEach((stat: any) => {
        stat.accessPercentage = Math.round((stat.rolesWithAccess / stat.totalRoles) * 100);
      });

      res.json(stats);
    } catch (error) {
      console.error("Error obteniendo estadísticas de permisos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ===== RUTAS CON PARÁMETROS AL FINAL =====

  // Obtener permisos específicos de un rol (para PermissionsMatrix)
  app.get("/api/roles/:id/permissions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de rol inválido" });
      }

      const role = await roleService.getRoleById(id);
      if (!role) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }

      res.json({ permissions: role.permissions || {} });
    } catch (error) {
      console.error("Error obteniendo permisos de rol:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Validar jerarquía de permisos (para sistema adaptativo)
  app.post("/api/roles/permissions/validate-hierarchy", async (req, res) => {
    try {
      const { permissions } = req.body;
      
      if (!permissions || typeof permissions !== 'object') {
        return res.status(400).json({ error: "Permisos inválidos" });
      }

      // Función para validar jerarquía CRUD: admin > delete > update > create > read
      const validatePermissionHierarchy = (actions: string[]): string[] => {
        const hierarchy = ['read', 'create', 'update', 'delete', 'admin'];
        const validActions = new Set<string>();
        
        actions.forEach(action => {
          if (hierarchy.includes(action)) {
            const actionIndex = hierarchy.indexOf(action);
            // Agregar la acción y todas las de menor nivel
            for (let i = 0; i <= actionIndex; i++) {
              validActions.add(hierarchy[i]);
            }
          }
        });
        
        return Array.from(validActions).sort((a, b) => 
          hierarchy.indexOf(a) - hierarchy.indexOf(b)
        );
      };

      // Validar cada módulo
      const validatedPermissions: Record<string, string[]> = {};
      Object.keys(permissions).forEach(moduleId => {
        const actions = permissions[moduleId];
        if (Array.isArray(actions)) {
          validatedPermissions[moduleId] = validatePermissionHierarchy(actions);
        }
      });

      res.json({ 
        validatedPermissions,
        hierarchyRules: {
          order: ['read', 'create', 'update', 'delete', 'admin'],
          description: 'Permisos superiores incluyen automáticamente los inferiores'
        }
      });
    } catch (error) {
      console.error("Error validando jerarquía:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Guardar permisos de matriz (para PermissionsMatrix)
  app.post("/api/roles/permissions/save-matrix", async (req, res) => {
    try {
      const { rolePermissions } = req.body;
      
      if (!rolePermissions || typeof rolePermissions !== 'object') {
        return res.status(400).json({ error: "Datos de permisos inválidos" });
      }

      const results = [];
      const errors = [];

      // Actualizar permisos para cada rol
      for (const [roleIdStr, permissions] of Object.entries(rolePermissions)) {
        const roleId = parseInt(roleIdStr);
        if (isNaN(roleId)) {
          errors.push(`ID de rol inválido: ${roleIdStr}`);
          continue;
        }

        try {
          const success = await roleService.updateRolePermissions(roleId, permissions);
          if (success) {
            results.push({ roleId, status: 'updated' });
          } else {
            errors.push(`Error actualizando rol ${roleId}`);
          }
        } catch (error) {
          errors.push(`Error actualizando rol ${roleId}: ${error.message}`);
        }
      }

      if (errors.length > 0 && results.length === 0) {
        return res.status(400).json({ error: "No se pudieron actualizar los permisos", errors });
      }

      res.json({ 
        success: true,
        message: "Permisos actualizados correctamente",
        results,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error guardando matriz de permisos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Verificar múltiples permisos de un usuario (para hooks adaptativos)
  app.post("/api/users/:userId/check-permissions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { checks } = req.body;

      if (isNaN(userId) || !Array.isArray(checks)) {
        return res.status(400).json({ error: "Parámetros inválidos" });
      }

      const results: Record<string, boolean> = {};

      for (const check of checks) {
        const { moduleId, action } = check;
        if (moduleId && action) {
          try {
            const hasPermission = await roleService.hasModulePermission(userId, moduleId, action);
            results[`${moduleId}_${action}`] = hasPermission;
          } catch (error) {
            results[`${moduleId}_${action}`] = false;
          }
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("Error verificando múltiples permisos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener estadísticas de permisos por módulo (para dashboard administrativo)
  app.get("/api/roles/permissions-stats", async (req, res) => {
    try {
      const roles = await roleService.getAllRoles();
      const stats: Record<string, any> = {};

      roles.forEach(role => {
        const permissions = role.permissions as Record<string, string[]> || {};
        Object.keys(permissions).forEach(moduleId => {
          if (!stats[moduleId]) {
            stats[moduleId] = {
              moduleId,
              totalRoles: roles.length,
              rolesWithAccess: 0,
              permissionBreakdown: {
                read: 0,
                create: 0,
                update: 0,
                delete: 0,
                admin: 0
              }
            };
          }

          const modulePermissions = permissions[moduleId];
          if (modulePermissions && modulePermissions.length > 0) {
            stats[moduleId].rolesWithAccess++;
            
            modulePermissions.forEach(permission => {
              if (stats[moduleId].permissionBreakdown[permission] !== undefined) {
                stats[moduleId].permissionBreakdown[permission]++;
              }
            });
          }
        });
      });

      // Calcular porcentajes
      Object.values(stats).forEach((stat: any) => {
        stat.accessPercentage = Math.round((stat.rolesWithAccess / stat.totalRoles) * 100);
      });

      res.json(stats);
    } catch (error) {
      console.error("Error obteniendo estadísticas de permisos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  console.log("✅ [HYBRID] Endpoints híbridos de roles registrados correctamente");
}