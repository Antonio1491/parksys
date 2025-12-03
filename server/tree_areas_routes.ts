/**
 * Rutas para la gestión de áreas de parques
 */

import { Router, Request, Response } from "express";
import { db } from './db';
import { parkAreas, trees } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { generateAreaCode } from './code-generator';
import multer from 'multer';
import { replitObjectStorage } from './objectStorage-replit';
import path from 'path';
import fs from 'fs';

/**
 * Registra las rutas relacionadas con áreas de parques
 * @param app Aplicación Express
 * @param apiRouter Router de la API
 * @param isAuthenticated Middleware de autenticación
 */

// Configurar multer para imágenes de áreas
const areaImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no válido. Solo se permiten JPG, PNG, GIF y WEBP'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

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

      // Obtener área con nombre del parque usando SQL directo
      const result = await db.execute(sql`
        SELECT 
          pa.id,
          pa.park_id,
          pa.name,
          pa.code,
          pa.area_code,
          pa.code_prefix,
          pa.description,
          pa.dimensions,
          pa.image_url,
          pa.polygon,
          pa.use_gps_matching,
          pa.use_code_matching,
          pa.status,
          pa.created_at,
          pa.updated_at,
          p.name as park_name
        FROM park_areas pa
        LEFT JOIN parks p ON pa.park_id = p.id
        WHERE pa.id = ${Number(id)}
        LIMIT 1
      `);

      const areas = result.rows || result;

      if (!areas || areas.length === 0) {
        return res.status(404).json({ error: "Área no encontrada" });
      }

      // Contar árboles del área
      const treeCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(trees)
        .where(eq(trees.area_id, Number(id)));

      // Mapear campos para el frontend (camelCase)
      const area = areas[0];
      res.json({
        id: area.id,
        parkId: area.park_id,
        name: area.name,
        code: area.code || area.area_code,
        areaCode: area.area_code,
        codePrefix: area.code_prefix,
        description: area.description,
        dimensions: area.dimensions,
        imageUrl: area.image_url,
        polygon: area.polygon,
        useGpsMatching: area.use_gps_matching,
        useCodeMatching: area.use_code_matching,
        status: area.status,
        createdAt: area.created_at,
        updatedAt: area.updated_at,
        parkName: area.park_name,
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
          areaCode: areaCode,
          description: description || null,
          dimensions: dimensions || null,
          imageUrl: imageUrl || null,
          polygon: polygon || null,
          status,
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
  apiRouter.put("/trees/areas/:id", isAuthenticated, areaImageUpload.single('imageFile'), async (req: Request, res: Response) => {
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

      // Manejar imagen
      let finalImageUrl = imageUrl !== undefined ? imageUrl : existingArea[0].imageUrl;

      // Si se subió un archivo, guardarlo en Object Storage
      if (req.file) {
        console.log(`📤 [AREA-IMG] Procesando imagen para área ${id}: ${req.file.originalname}`);

        try {
          // 1. INTENTAR REPLIT OBJECT STORAGE (persistente)
          console.log('📤 [AREA-IMG] Intentando Replit Object Storage...');
          const storedFilename = await replitObjectStorage.uploadFile(req.file.buffer, req.file.originalname);
          finalImageUrl = replitObjectStorage.getPublicUrl(storedFilename);
          finalImageUrl = replitObjectStorage.normalizeUrl(finalImageUrl);
          console.log(`✅ [AREA-IMG] Object Storage exitoso: ${finalImageUrl}`);

        } catch (objectStorageError) {
          console.log('⚠️ [AREA-IMG] Object Storage falló, usando filesystem...', objectStorageError);

          // 2. FALLBACK A FILESYSTEM (carpeta persistente)
          const uploadDir = path.join(process.cwd(), 'uploads', 'area-images');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = `area-${id}-${uniqueSuffix}${path.extname(req.file.originalname)}`;
          const filePath = path.join(uploadDir, filename);

          fs.writeFileSync(filePath, req.file.buffer);
          finalImageUrl = `/uploads/area-images/${filename}`;
          console.log(`✅ [AREA-IMG] Filesystem usado: ${finalImageUrl}`);
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
          imageUrl: finalImageUrl,
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

  // ============================================
  // GET /trees/areas/:id/maintenances - Mantenimientos del área
  // ============================================
  apiRouter.get("/trees/areas/:id/maintenances", async (req: Request, res: Response) => {
    try {
      const areaId = parseInt(req.params.id);

      if (isNaN(areaId)) {
        return res.status(400).json({ error: "ID de área inválido" });
      }

      // Obtener mantenimientos de todos los árboles del área
      const result = await db.execute(sql`
        SELECT 
          tm.id,
          tm.tree_id,
          tm.maintenance_type,
          tm.maintenance_date,
          tm.description,
          tm.performed_by,
          tm.notes,
          tm.next_maintenance_date,
          tm.created_at,
          t.code as tree_code,
          ts.common_name as species_name,
          ts.scientific_name
        FROM tree_maintenances tm
        INNER JOIN trees t ON tm.tree_id = t.id
        LEFT JOIN tree_species ts ON t.species_id = ts.id
        WHERE t.area_id = ${areaId}
        ORDER BY tm.maintenance_date DESC
      `);

      const maintenances = (result.rows || []).map((m: any) => ({
        id: m.id,
        treeId: m.tree_id,
        treeCode: m.tree_code,
        maintenanceType: m.maintenance_type,
        maintenanceDate: m.maintenance_date,
        description: m.description,
        performedBy: m.performed_by,
        notes: m.notes,
        nextMaintenanceDate: m.next_maintenance_date,
        createdAt: m.created_at,
        speciesName: m.species_name,
        scientificName: m.scientific_name
      }));

      res.json({ data: maintenances, total: maintenances.length });
    } catch (error) {
      console.error("Error fetching area maintenances:", error);
      res.status(500).json({ error: "Error al obtener mantenimientos del área" });
    }
  });
}