import type { Express } from "express";
import { roleService } from "./roleService";
import { insertRoleSchema, insertUserSchema } from "../shared/schema";
import { z } from "zod";

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

  // Obtener rol por ID
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

  console.log("✅ Rutas del sistema de roles registradas correctamente");
}