/**
 * Rutas para la gestión de áreas de parques
 */

import { Router, Request, Response } from "express";
import { db } from './db';
import { parkAreas, trees } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { generateAreaCode } from './code-generator';

/**
 * Registra las rutas relacionadas con áreas de parques
 * @param app Aplicación Express
 * @param apiRouter Router de la API
 * @param isAuthenticated Middleware de autenticación
 */
export function registerTreeAreasRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  console.log("🌳 Registrando rutas de áreas de parques");

  // ============================================
  // GET /trees/areas - Listar todas las áreas
  // ============================================
  apiRouter.get("/trees/areas", async (req: Request, res: Response) => {
    try {
      const { parkId } = req.query;

      let query = db.select().from(parkAreas);

      // Filtrar por parque si se proporciona
      if (parkId) {
        query = query.where(eq(parkAreas.parkId, Number(parkId)));
      }

      const areas = await query;

      // Contar árboles por área
      const areasWithCounts = await Promise.all(
        areas.map(async (area) => {
          const treeCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(trees)
            .where(eq(trees.area_id, area.id));

          return {
            ...area,
            treeCount: Number(treeCount[0]?.count || 0),
          };
        })
      );

      res.json(areasWithCounts);
    } catch (error) {
      console.error("Error fetching park areas:", error);
      res.status(500).json({ error: "Error al obtener las áreas" });
    }
  });

  // ============================================
  // GET /trees/areas/:id - Obtener área específica
  // ============================================
  apiRouter.get("/trees/areas/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const area = await db
        .select()
        .from(parkAreas)
        .where(eq(parkAreas.id, Number(id)))
        .limit(1);

      if (!area || area.length === 0) {
        return res.status(404).json({ error: "Área no encontrada" });
      }

      // Contar árboles del área
      const treeCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(trees)
        .where(eq(trees.area_id, Number(id)));

      res.json({
        ...area[0],
        treeCount: Number(treeCount[0]?.count || 0),
      });
    } catch (error) {
      console.error("Error fetching park area:", error);
      res.status(500).json({ error: "Error al obtener el área" });
    }
  });

  // ============================================
  // POST /trees/areas - Crear nueva área
  // ============================================
  apiRouter.post("/trees/areas", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const {
        parkId,
        name,
        description,
        dimensions,
        imageUrl,
        polygon,
        status = "activa",
      } = req.body;

      // Validaciones
      if (!parkId || !name) {
        return res.status(400).json({
          error: "Los campos parkId y name son obligatorios",
        });
      }

      // Generar código automáticamente
      const areaCode = await generateAreaCode(name, Number(parkId));
      console.log('🔤 Código de área generado:', areaCode);

      const newArea = await db
        .insert(parkAreas)
        .values({
          parkId: Number(parkId),
          name,
          code: areaCode,
          areaCode: areaCode,
          description: description || null,
          dimensions: dimensions || null,
          imageUrl: imageUrl || null,
          polygon: polygon || null,
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log(`✅ Área creada: ${name} (Código: ${areaCode})`);
      res.status(201).json(newArea[0]);
    } catch (error) {
      console.error("Error creating park area:", error);
      res.status(500).json({ error: "Error al crear el área" });
    }
  });

  // ============================================
  // PUT /trees/areas/:id - Actualizar área
  // ============================================
  apiRouter.put("/trees/areas/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        parkId,
        name,
        code,
        description,
        dimensions,
        imageUrl,
        polygon,
        status,
      } = req.body;

      // Verificar que el área existe
      const existingArea = await db
        .select()
        .from(parkAreas)
        .where(eq(parkAreas.id, Number(id)))
        .limit(1);

      if (existingArea.length === 0) {
        return res.status(404).json({ error: "Área no encontrada" });
      }

      // Si se cambia el código, verificar que no exista
      if (code && code !== existingArea[0].code) {
        const codeExists = await db
          .select()
          .from(parkAreas)
          .where(eq(parkAreas.code, code))
          .limit(1);

        if (codeExists.length > 0) {
          return res.status(400).json({
            error: `Ya existe un área con el código ${code}`,
          });
        }
      }

      const updatedArea = await db
        .update(parkAreas)
        .set({
          parkId: parkId ? Number(parkId) : existingArea[0].parkId,
          name: name || existingArea[0].name,
          code: code || existingArea[0].code,
          description: description !== undefined ? description : existingArea[0].description,
          dimensions: dimensions !== undefined ? dimensions : existingArea[0].dimensions,
          imageUrl: imageUrl !== undefined ? imageUrl : existingArea[0].imageUrl,
          polygon: polygon !== undefined ? polygon : existingArea[0].polygon,
          status: status || existingArea[0].status,
          updatedAt: new Date(),
        })
        .where(eq(parkAreas.id, Number(id)))
        .returning();

      res.json(updatedArea[0]);
    } catch (error) {
      console.error("Error updating park area:", error);
      res.status(500).json({ error: "Error al actualizar el área" });
    }
  });

  // ============================================
  // DELETE /trees/areas/:id - Eliminar área
  // ============================================
  apiRouter.delete("/trees/areas/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar que el área existe
      const area = await db
        .select()
        .from(parkAreas)
        .where(eq(parkAreas.id, Number(id)))
        .limit(1);

      if (area.length === 0) {
        return res.status(404).json({ error: "Área no encontrada" });
      }

      // Verificar que no tenga árboles asignados
      const treesInArea = await db
        .select({ count: sql<number>`count(*)` })
        .from(trees)
        .where(eq(trees.area_id, Number(id)));

      const count = Number(treesInArea[0]?.count || 0);

      if (count > 0) {
        return res.status(400).json({
          error: `No se puede eliminar el área porque tiene ${count} árbol(es) asignado(s)`,
        });
      }

      await db.delete(parkAreas).where(eq(parkAreas.id, Number(id)));

      res.json({ message: "Área eliminada correctamente" });
    } catch (error) {
      console.error("Error deleting park area:", error);
      res.status(500).json({ error: "Error al eliminar el área" });
    }
  });

  // ============================================
  // GET /trees/areas/:id/trees - Árboles de un área
  // ============================================
  apiRouter.get("/trees/areas/:id/trees", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar que el área existe
      const area = await db
        .select()
        .from(parkAreas)
        .where(eq(parkAreas.id, Number(id)))
        .limit(1);

      if (area.length === 0) {
        return res.status(404).json({ error: "Área no encontrada" });
      }

      const areaTrees = await db
        .select()
        .from(trees)
        .where(eq(trees.area_id, Number(id)));

      res.json(areaTrees);
    } catch (error) {
      console.error("Error fetching area trees:", error);
      res.status(500).json({ error: "Error al obtener los árboles del área" });
    }
  });
}