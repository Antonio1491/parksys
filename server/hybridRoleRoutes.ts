import type { Express } from "express";
import { roleService } from "./roleService";
import { requireSuperAdmin } from "./permissions-middleware";
import { isAuthenticated } from "./middleware/auth";
import { storage } from "./storage";
import { z } from "zod";
import { db } from "./db";
import { roles, systemPermissions, rolePermissions } from "../shared/schema";
import { eq, and, inArray } from "drizzle-orm";

// ===== ESQUEMAS DE VALIDACIÓN =====
const updatePermissionsSchema = z.object({
  permissions: z.record(
    z.string(), // role slug
    z.array(z.string()) // array of permission keys
  )
});

/**
 * Endpoints adicionales para el sistema híbrido adaptativo de roles
 * Complementa a roleRoutes.ts con funcionalidades específicas del sistema CRUD
 */
export function registerHybridRoleRoutes(app: Express) {
  console.log("🔧 [HYBRID] Registrando endpoints híbridos de roles...");

  // ===== RUTAS ESPECÍFICAS PRIMERO (antes de rutas con parámetros) =====

  // Obtener matriz completa de permisos (DEBE IR ANTES QUE CUALQUIER RUTA CON PARÁMETROS)
  app.get("/api/roles/permissions", isAuthenticated, requireSuperAdmin(), async (req, res) => {
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

  // Obtener estructura de módulos adaptativos (para frontend)
  app.get("/api/roles/adaptive-modules", isAuthenticated, requireSuperAdmin(), async (req, res) => {
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



  // Guardar permisos de matriz (para PermissionsMatrix)
  app.post("/api/roles/permissions/save-matrix", isAuthenticated, requireSuperAdmin(), async (req, res) => {
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
          const success = await roleService.updateRolePermissions(roleId, permissions as Record<string, any>);
          if (success) {
            results.push({ roleId, status: 'updated' });
          } else {
            errors.push(`Error actualizando rol ${roleId}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          errors.push(`Error actualizando rol ${roleId}: ${errorMessage}`);
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
  app.get("/api/roles/permissions-stats", isAuthenticated, requireSuperAdmin(), async (req, res) => {
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
  app.get("/api/roles/:id/permissions", isAuthenticated, requireSuperAdmin(), async (req, res) => {
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

  // Verificar múltiples permisos de un usuario (para hooks adaptativos)
  app.post("/api/users/:userId/check-permissions", isAuthenticated, requireSuperAdmin(), async (req, res) => {
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

  // ===== NUEVOS ENDPOINTS PARA MATRIZ DE PERMISOS GRANULARES =====
  
  // Obtener módulos de permisos (TEMPORAL - SIN AUTH)
  app.get("/api/permissions/modules", async (req, res) => {
    try {
      const modules = await storage.getPermissionModules();
      res.json(modules);
    } catch (error) {
      console.error("❌ Error obteniendo módulos de permisos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener acciones de permisos (TEMPORAL - SIN AUTH)
  app.get("/api/permissions/actions", async (req, res) => {
    try {
      const actions = await storage.getPermissionActions();
      res.json(actions);
    } catch (error) {
      console.error("❌ Error obteniendo acciones de permisos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener permisos del sistema (TEMPORAL - SIN AUTH)
  app.get("/api/permissions/system", async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("❌ Error obteniendo permisos del sistema:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener matriz de permisos por rol (versión granular) (TEMPORAL - SIN AUTH)
  app.get("/api/roles/permissions/matrix", async (req, res) => {
    try {
      // Obtener todos los roles
      const allRoles = await db.select().from(roles);
      const result: Record<string, string[]> = {};
      
      // Para cada rol, obtener sus permisos asignados activos
      for (const role of allRoles) {
        const rolePermissionsList = await db
          .select({
            permissionKey: systemPermissions.permissionKey
          })
          .from(rolePermissions)
          .innerJoin(systemPermissions, 
            eq(rolePermissions.permissionId, systemPermissions.id)
          )
          .where(
            and(
              eq(rolePermissions.roleId, role.id),
              eq(rolePermissions.isActive, true)
            )
          );
        
        result[role.slug] = rolePermissionsList.map(p => p.permissionKey);
      }
      
      res.json(result);
    } catch (error) {
      console.error("❌ Error obteniendo matriz granular de permisos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Actualizar permisos granulares (SOLO SUPER ADMIN)
  app.post("/api/permissions/roles/update", isAuthenticated, requireSuperAdmin(), async (req, res) => {
    try {
      // Validar entrada con Zod
      const validationResult = updatePermissionsSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("❌ [PERMISSIONS] Validación fallida:", validationResult.error);
        return res.status(400).json({ 
          error: "Datos de permisos inválidos",
          details: validationResult.error.issues 
        });
      }

      const { permissions } = validationResult.data;
      console.log("🔧 [PERMISSIONS] Iniciando actualización de permisos granulares para", Object.keys(permissions).length, "roles");

      // Procesar cada rol individualmente para evitar bloqueos de transacción
      const updates = [];
      const errors = [];

      for (const [roleSlug, permissionKeys] of Object.entries(permissions)) {
        try {
          // Usar transacciones individuales para cada rol
          const roleResult = await db.transaction(async (tx) => {
            // 1. Obtener el rol por slug
            const roleQuery = await tx.select().from(roles).where(eq(roles.slug, roleSlug)).limit(1);
            if (roleQuery.length === 0) {
              throw new Error(`Rol no encontrado: ${roleSlug}`);
            }
            const role = roleQuery[0];

            // 2. Limpiar permisos existentes para este rol
            await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));

            let assignedCount = 0;
            let missingCount = 0;

            if (permissionKeys.length > 0) {
              // 3. Obtener IDs de permisos basados en las claves
              const permissionResults = await tx
                .select({ id: systemPermissions.id, permissionKey: systemPermissions.permissionKey })
                .from(systemPermissions)
                .where(
                  and(
                    inArray(systemPermissions.permissionKey, permissionKeys),
                    eq(systemPermissions.isActive, true)
                  )
                );

              // 4. Verificar que todos los permisos existan
              const foundPermissionKeys = permissionResults.map((p: { permissionKey: string }) => p.permissionKey);
              const missingPermissions = permissionKeys.filter(key => !foundPermissionKeys.includes(key));
              missingCount = missingPermissions.length;
              
              if (missingPermissions.length > 0) {
                console.warn(`⚠️ [PERMISSIONS] Permisos no encontrados para rol ${roleSlug}:`, missingPermissions);
              }

              // 5. Insertar nuevos permisos para el rol
              if (permissionResults.length > 0) {
                const rolePermissionInserts = permissionResults.map(permission => ({
                  roleId: role.id,
                  permissionId: permission.id,
                  isActive: true,
                  grantedAt: new Date(),
                  grantedBy: null
                }));

                await tx.insert(rolePermissions).values(rolePermissionInserts);
                assignedCount = permissionResults.length;
              }
            }

            return {
              roleSlug, 
              roleId: role.id,
              permissionsAssigned: assignedCount,
              missingPermissions: missingCount 
            };
          });

          updates.push(roleResult);
          console.log(`✅ [PERMISSIONS] Rol ${roleSlug} actualizado: ${permissionKeys.length} permisos asignados`);
        } catch (roleError) {
          console.error(`❌ [PERMISSIONS] Error actualizando rol ${roleSlug}:`, roleError);
          const errorMessage = roleError instanceof Error ? roleError.message : 'Error desconocido';
          errors.push(`Error actualizando rol ${roleSlug}: ${errorMessage}`);
        }
      }

      const result = { updates, errors };

      // Preparar respuesta
      if (result.errors.length > 0 && result.updates.length === 0) {
        return res.status(400).json({ 
          error: "No se pudieron actualizar los permisos", 
          errors: result.errors 
        });
      }

      console.log(`✅ [PERMISSIONS] Actualización completada: ${result.updates.length} roles actualizados`);
      
      res.json({ 
        success: true,
        message: `Permisos granulares actualizados correctamente para ${result.updates.length} roles`,
        updates: result.updates,
        errors: result.errors.length > 0 ? result.errors : undefined,
        summary: {
          rolesUpdated: result.updates.length,
          totalErrors: result.errors.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("❌ [PERMISSIONS] Error grave actualizando permisos granulares:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ 
        error: "Error interno del servidor",
        message: "Error al actualizar permisos granulares",
        details: errorMessage 
      });
    }
  });

  console.log("✅ [HYBRID] Endpoints híbridos de roles registrados correctamente");
}