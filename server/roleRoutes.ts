import type { Express } from "express";
import { roleService } from "./roleService";
import type { InsertUserRole } from "../shared/schema";
import { roleSeeder } from "./roleSeeder";
import { insertRoleSchema, insertUserSchema } from "../shared/schema";
import { z } from "zod";
import { isAuthenticated } from './middleware/auth';

export function registerRoleRoutes(app: Express) {
  
  // ===== RUTAS DE ROLES =====
  
  // Obtener todos los roles
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await roleService.getAllRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error obteniendo roles:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener estadísticas de roles y usuarios
  app.get("/api/role-stats", async (req, res) => {
    try {
      const stats = await roleService.getRoleUsageStats();
      res.json(stats);
    } catch (error) {
      console.error("Error obteniendo estadísticas de roles:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Crear nuevo rol (solo super-admin y admin)
  app.post("/api/roles", isAuthenticated, async (req, res) => {
    try {
      // Verificar permisos - solo super-admin y admin pueden crear roles
      const userRole = req.user?.role;
      if (userRole !== 'super_admin' && userRole !== 'admin') {
        return res.status(403).json({ 
          error: 'No tienes permisos para crear roles. Solo Super Administradores y Administradores Generales pueden crear roles.' 
        });
      }

      // Validar datos de entrada
      const roleData = insertRoleSchema.parse(req.body);
      
      // Obtener el nivel del usuario actual
      const currentUser = await roleService.getUserWithRole(req.user.id);
      const currentUserLevel = currentUser?.userRole?.level || 999; // Si no se encuentra, asumir nivel más bajo
      
      // Validar que el usuario no pueda crear roles de nivel superior o igual al suyo
      // Super-admin (nivel 1) puede crear cualquier nivel
      // Admin (nivel 2) solo puede crear nivel 3 (User)
      if (currentUserLevel > 1 && roleData.level <= currentUserLevel) {
        return res.status(403).json({ 
          error: `No puedes crear roles de nivel ${roleData.level} o superior. Tu nivel actual es ${currentUserLevel}.` 
        });
      }
      
      // Crear el rol
      const newRole = await roleService.createRole(roleData);
      
      console.log(`✅ [ROLES] Rol creado exitosamente: ${newRole.name} por usuario ${req.user?.email}`);
      
      res.status(201).json(newRole);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      
      console.error("Error creando rol:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // MOVIDO AL FINAL - Los endpoints con parámetros van al final

  // ===== RUTAS DE USUARIOS CON ROLES =====
  
  // Obtener todos los usuarios con sus roles
  app.get("/api/users-with-roles", async (req, res) => {
    try {
      const users = await roleService.getUsersWithRoles();
      res.json(users);
    } catch (error) {
      console.error("Error obteniendo usuarios con roles:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ENDPOINT FALTANTE - Obtener usuarios con múltiples roles
  app.get("/api/users/all-with-multiple-roles", async (req, res) => {
    try {
      console.log("🔍 [MULTIPLE-ROLES] Obteniendo todos los usuarios con múltiples roles...");
      const users = await roleService.getUsersWithRoles();
      // Filtrar solo usuarios que tienen múltiples roles
      const usersWithMultipleRoles = users.filter(user => 
        user.roles && user.roles.length > 1
      );
      
      console.log(`✅ [MULTIPLE-ROLES] Encontrados ${usersWithMultipleRoles.length} usuarios con múltiples roles`);
      res.json(usersWithMultipleRoles);
    } catch (error) {
      console.error("❌ [MULTIPLE-ROLES] Error obteniendo usuarios con múltiples roles:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener usuario específico con rol
  app.get("/api/users/:id/with-role", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de usuario inválido" });
      }

      const user = await roleService.getUserWithRole(id);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error obteniendo usuario con rol:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Asignar rol a usuario
  app.post("/api/users/:userId/assign-role", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { roleId } = req.body;

      if (isNaN(userId) || !roleId) {
        return res.status(400).json({ error: "Datos inválidos" });
      }

      const success = await roleService.assignRole(userId, roleId);
      if (!success) {
        return res.status(500).json({ error: "Error asignando rol" });
      }

      res.json({ success: true, message: "Rol asignado correctamente" });
    } catch (error) {
      console.error("Error asignando rol:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ===== RUTAS DE VERIFICACIÓN DE PERMISOS =====
  
  // Verificar si usuario tiene nivel de rol requerido
  app.get("/api/users/:userId/has-role-level/:level", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const level = parseInt(req.params.level);

      if (isNaN(userId) || isNaN(level)) {
        return res.status(400).json({ error: "Parámetros inválidos" });
      }

      const hasLevel = await roleService.hasRoleLevel(userId, level);
      res.json({ hasRoleLevel: hasLevel });
    } catch (error) {
      console.error("Error verificando nivel de rol:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Verificar si usuario tiene permiso específico
  app.get("/api/users/:userId/has-permission/:permission", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const permission = req.params.permission;

      if (isNaN(userId) || !permission) {
        return res.status(400).json({ error: "Parámetros inválidos" });
      }

      const hasPermission = await roleService.hasPermission(userId, permission);
      res.json({ hasPermission });
    } catch (error) {
      console.error("Error verificando permiso:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ===== NUEVAS RUTAS PARA SISTEMA DINÁMICO =====

  // Sincronizar roles del sistema
  app.post("/api/roles/sync-system-roles", async (req, res) => {
    try {
      await roleSeeder.seedSystemRoles();
      const integrity = await roleSeeder.verifyRoleIntegrity();
      
      res.json({ 
        success: true, 
        message: "Roles del sistema sincronizados correctamente",
        integrityCheck: integrity
      });
    } catch (error) {
      console.error("Error sincronizando roles:", error);
      res.status(500).json({ error: "Error sincronizando roles del sistema" });
    }
  });

  // Endpoint duplicado eliminado - usar el de arriba con autenticación

  // Actualizar rol
  app.put("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de rol inválido" });
      }

      const validatedData = insertRoleSchema.partial().parse(req.body);
      const updatedRole = await roleService.updateRole(id, validatedData);
      
      if (!updatedRole) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }

      res.json(updatedRole);
    } catch (error) {
      console.error("Error actualizando rol:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Eliminar rol
  app.delete("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de rol inválido" });
      }

      const success = await roleService.deleteRole(id);
      if (!success) {
        return res.status(400).json({ error: "No se puede eliminar el rol" });
      }

      res.json({ success: true, message: "Rol eliminado correctamente" });
    } catch (error) {
      console.error("Error eliminando rol:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener permisos completos de un usuario
  app.get("/api/users/:userId/permissions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "ID de usuario inválido" });
      }

      const permissions = await roleService.getUserPermissions(userId);
      if (!permissions) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({ permissions });
    } catch (error) {
      console.error("Error obteniendo permisos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Verificar permiso de módulo específico
  app.get("/api/users/:userId/module-permission/:module/:permission", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { module, permission } = req.params;

      if (isNaN(userId) || !module || !permission) {
        return res.status(400).json({ error: "Parámetros inválidos" });
      }

      if (!['create', 'read', 'update', 'delete', 'admin'].includes(permission)) {
        return res.status(400).json({ error: "Permiso inválido. Debe ser: create, read, update, delete, admin" });
      }

      // ✅ ACTUALIZAR: Mapear permisos a tipos compatibles con hasModulePermission
      const permissionMap: Record<string, 'admin' | 'read' | 'write'> = {
        'admin': 'admin',
        'read': 'read', 
        'create': 'write',
        'update': 'write',
        'delete': 'write'
      };
      
      const mappedPermission = permissionMap[permission] || 'read';
      const hasPermission = await roleService.hasModulePermission(userId, module, mappedPermission);
      
      res.json({ hasPermission });
    } catch (error) {
      console.error("Error verificando permiso de módulo:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Actualizar permisos de rol
  app.put("/api/roles/:id/permissions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { permissions } = req.body;

      if (isNaN(id) || !permissions) {
        return res.status(400).json({ error: "Datos inválidos" });
      }

      const success = await roleService.updateRolePermissions(id, permissions);
      if (!success) {
        return res.status(500).json({ error: "Error actualizando permisos" });
      }

      res.json({ success: true, message: "Permisos actualizados correctamente" });
    } catch (error) {
      console.error("Error actualizando permisos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ===== NUEVAS RUTAS PARA MÚLTIPLES ROLES POR USUARIO =====

  // Obtener todos los roles de un usuario
  app.get("/api/users/:userId/roles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "ID de usuario inválido" });
      }

      const includeInactive = req.query.includeInactive === 'true';
      const userRoles = await roleService.getUserRoles(userId, includeInactive);
      
      res.json(userRoles);
    } catch (error) {
      console.error("Error obteniendo roles del usuario:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Asignar rol a usuario
  app.post("/api/users/:userId/roles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { roleId, isPrimary, assignedBy } = req.body;

      if (isNaN(userId) || !roleId) {
        return res.status(400).json({ error: "Datos inválidos: userId y roleId son requeridos" });
      }

      // Verificar que el rol existe
      const role = await roleService.getRoleById(roleId);
      if (!role) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }

      const newUserRole = await roleService.assignRoleToUser(
        userId, 
        roleId, 
        assignedBy, 
        isPrimary || false
      );
      
      res.status(201).json({
        success: true,
        message: "Rol asignado exitosamente",
        userRole: newUserRole
      });
    } catch (error) {
      console.error("Error asignando rol al usuario:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Remover rol específico de usuario
  app.delete("/api/users/:userId/roles/:roleId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const roleId = parseInt(req.params.roleId);

      if (isNaN(userId) || isNaN(roleId)) {
        return res.status(400).json({ error: "IDs inválidos" });
      }

      const success = await roleService.removeRoleFromUser(userId, roleId);
      
      if (!success) {
        return res.status(404).json({ error: "Asignación de rol no encontrada" });
      }

      res.json({ success: true, message: "Rol removido exitosamente" });
    } catch (error) {
      console.error("Error removiendo rol del usuario:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Establecer rol primario para usuario
  app.put("/api/users/:userId/primary-role", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { roleId } = req.body;

      if (isNaN(userId) || !roleId) {
        return res.status(400).json({ error: "Datos inválidos: userId y roleId son requeridos" });
      }

      const success = await roleService.setPrimaryRole(userId, roleId);
      
      if (!success) {
        return res.status(404).json({ error: "No se pudo establecer el rol como primario" });
      }

      res.json({ success: true, message: "Rol primario establecido exitosamente" });
    } catch (error) {
      console.error("Error estableciendo rol primario:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener rol primario del usuario
  app.get("/api/users/:userId/primary-role", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "ID de usuario inválido" });
      }

      const primaryRole = await roleService.getPrimaryRole(userId);
      
      if (!primaryRole) {
        return res.status(404).json({ error: "Usuario no tiene rol primario definido" });
      }

      res.json(primaryRole);
    } catch (error) {
      console.error("Error obteniendo rol primario:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Verificar si usuario tiene múltiples roles
  app.get("/api/users/:userId/has-multiple-roles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "ID de usuario inválido" });
      }

      const hasMultiple = await roleService.hasMultipleRoles(userId);
      
      res.json({ hasMultipleRoles: hasMultiple });
    } catch (error) {
      console.error("Error verificando múltiples roles:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener permisos completos del usuario (actualizado para múltiples roles)
  app.get("/api/users/:id/comprehensive-permissions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de usuario inválido" });
      }

      const permissions = await roleService.getUserPermissions(id);
      res.json(permissions);
    } catch (error) {
      console.error("Error obteniendo permisos completos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Asignación masiva de roles (para administradores)
  app.post("/api/users/:userId/roles/bulk", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { roleIds, assignedBy } = req.body;

      if (isNaN(userId) || !Array.isArray(roleIds) || roleIds.length === 0) {
        return res.status(400).json({ error: "Datos inválidos: userId y roleIds (array) son requeridos" });
      }

      const results = [];
      
      for (let i = 0; i < roleIds.length; i++) {
        const roleId = roleIds[i];
        const isPrimary = i === 0; // El primer rol será el primario
        
        try {
          const newUserRole = await roleService.assignRoleToUser(userId, roleId, assignedBy, isPrimary);
          results.push({ success: true, roleId, userRole: newUserRole });
        } catch (error) {
          results.push({ success: false, roleId, error: (error as Error).message });
        }
      }

      res.json({
        success: true,
        message: `Asignación masiva completada`,
        results
      });
    } catch (error) {
      console.error("Error en asignación masiva de roles:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ===== ENDPOINTS CON PARÁMETROS AL FINAL =====
  
  // Obtener rol por ID (DEBE estar al final)
  app.get("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de rol inválido" });
      }

      const role = await roleService.getRoleById(id);
      if (!role) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }

      res.json(role);
    } catch (error) {
      console.error("Error obteniendo rol:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  console.log("✅ Rutas del sistema de roles (incluye múltiples roles) registradas correctamente");
}