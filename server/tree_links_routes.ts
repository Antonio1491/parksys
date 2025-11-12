/**
 * Rutas para la vinculación de árboles con áreas (Sistema Mixto)
 */

import { Router, Request, Response } from "express";
import { db } from './db';
import { trees, parkAreas } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Verifica si un punto (lat, lng) está dentro de un polígono
 * Usa el algoritmo Ray Casting
 */
function isPointInPolygon(lat: number, lng: number, polygon: any): boolean {
  if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Verifica si el código del árbol coincide con el prefijo del área
 */
function matchesPrefix(treeCode: string, areaCode: string): boolean {
  if (!treeCode || !areaCode) return false;
  return treeCode.startsWith(areaCode);
}

/**
 * Registra las rutas relacionadas con vinculación de árboles
 * @param app Aplicación Express
 * @param apiRouter Router de la API
 * @param isAuthenticated Middleware de autenticación
 */
export function registerTreeLinksRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  console.log("🔗 Registrando rutas de vinculación de árboles");

  // ============================================
  // POST /trees/link/manual - Vincular árbol manualmente
  // ============================================
  apiRouter.post("/trees/link/manual", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { treeId, areaId } = req.body;

      if (!treeId) {
        return res.status(400).json({ error: "El campo treeId es obligatorio" });
      }

      // Si areaId es null, desvincular el árbol
      if (areaId === null) {
        await db
          .update(trees)
          .set({
            area_id: null,
            updatedAt: new Date(),
          })
          .where(eq(trees.id, Number(treeId)));

        return res.json({
          message: "Árbol desvinculado correctamente",
          treeId: Number(treeId),
          areaId: null,
        });
      }

      // Verificar que el árbol existe
      const tree = await db
        .select()
        .from(trees)
        .where(eq(trees.id, Number(treeId)))
        .limit(1);

      if (tree.length === 0) {
        return res.status(404).json({ error: "Árbol no encontrado" });
      }

      // Verificar que el área existe
      const area = await db
        .select()
        .from(parkAreas)
        .where(eq(parkAreas.id, Number(areaId)))
        .limit(1);

      if (area.length === 0) {
        return res.status(404).json({ error: "Área no encontrada" });
      }

      // Vincular
      const updated = await db
        .update(trees)
        .set({
          area_id: Number(areaId),
          updatedAt: new Date(),
        })
        .where(eq(trees.id, Number(treeId)))
        .returning();

      res.json({
        message: "Árbol vinculado correctamente",
        tree: updated[0],
      });
    } catch (error) {
      console.error("Error linking tree manually:", error);
      res.status(500).json({ error: "Error al vincular el árbol" });
    }
  });

  // ============================================
  // POST /trees/link/auto-gps - Vincular por GPS automático
  // ============================================
  apiRouter.post("/trees/link/auto-gps", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { treeId } = req.body;

      if (!treeId) {
        return res.status(400).json({ error: "El campo treeId es obligatorio" });
      }

      // Obtener el árbol
      const tree = await db
        .select()
        .from(trees)
        .where(eq(trees.id, Number(treeId)))
        .limit(1);

      if (tree.length === 0) {
        return res.status(404).json({ error: "Árbol no encontrado" });
      }

      const treeData = tree[0];

      // Verificar que el árbol tenga coordenadas
      if (!treeData.latitude || !treeData.longitude) {
        return res.status(400).json({
          error: "El árbol no tiene coordenadas GPS",
        });
      }

      // Obtener todas las áreas del mismo parque que tengan polígonos
      const areas = await db
        .select()
        .from(parkAreas)
        .where(eq(parkAreas.parkId, treeData.park_id));

      let matchedArea = null;

      // Buscar el área que contenga el punto
      for (const area of areas) {
        if (area.polygon) {
          try {
            const polygon = typeof area.polygon === "string" 
              ? JSON.parse(area.polygon) 
              : area.polygon;

            if (isPointInPolygon(Number(treeData.latitude), Number(treeData.longitude), polygon)) {
              matchedArea = area;
              break;
            }
          } catch (parseError) {
            console.error(`Error parsing polygon for area ${area.id}:`, parseError);
          }
        }
      }

      if (!matchedArea) {
        return res.status(404).json({
          error: "No se encontró ningún área que contenga las coordenadas del árbol",
        });
      }

      // Vincular
      const updated = await db
        .update(trees)
        .set({
          area_id: matchedArea.id,
          updatedAt: new Date(),
        })
        .where(eq(trees.id, Number(treeId)))
        .returning();

      res.json({
        message: "Árbol vinculado automáticamente por GPS",
        tree: updated[0],
        matchedArea: {
          id: matchedArea.id,
          name: matchedArea.name,
          code: matchedArea.code,
        },
      });
    } catch (error) {
      console.error("Error linking tree by GPS:", error);
      res.status(500).json({ error: "Error al vincular el árbol por GPS" });
    }
  });

  // ============================================
  // POST /trees/link/auto-prefix - Vincular por prefijo automático
  // ============================================
  apiRouter.post("/trees/link/auto-prefix", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { treeId } = req.body;

      if (!treeId) {
        return res.status(400).json({ error: "El campo treeId es obligatorio" });
      }

      // Obtener el árbol
      const tree = await db
        .select()
        .from(trees)
        .where(eq(trees.id, Number(treeId)))
        .limit(1);

      if (tree.length === 0) {
        return res.status(404).json({ error: "Árbol no encontrado" });
      }

      const treeData = tree[0];

      // Verificar que el árbol tenga código
      if (!treeData.code) {
        return res.status(400).json({
          error: "El árbol no tiene código asignado",
        });
      }

      // Obtener todas las áreas del mismo parque
      const areas = await db
        .select()
        .from(parkAreas)
        .where(eq(parkAreas.parkId, treeData.park_id));

      let matchedArea = null;

      // Buscar el área cuyo código coincida como prefijo
      for (const area of areas) {
        if (matchesPrefix(treeData.code, area.code)) {
          matchedArea = area;
          break;
        }
      }

      if (!matchedArea) {
        return res.status(404).json({
          error: `No se encontró ningún área cuyo código coincida con el prefijo del árbol "${treeData.code}"`,
        });
      }

      // Vincular
      const updated = await db
        .update(trees)
        .set({
          area_id: matchedArea.id,
          updatedAt: new Date(),
        })
        .where(eq(trees.id, Number(treeId)))
        .returning();

      res.json({
        message: "Árbol vinculado automáticamente por prefijo de código",
        tree: updated[0],
        matchedArea: {
          id: matchedArea.id,
          name: matchedArea.name,
          code: matchedArea.code,
        },
      });
    } catch (error) {
      console.error("Error linking tree by prefix:", error);
      res.status(500).json({ error: "Error al vincular el árbol por prefijo" });
    }
  });

  // ============================================
  // POST /trees/link/bulk - Vinculación masiva
  // ============================================
  apiRouter.post("/trees/link/bulk", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { treeIds, areaId, method = "manual" } = req.body;

      if (!treeIds || !Array.isArray(treeIds) || treeIds.length === 0) {
        return res.status(400).json({
          error: "El campo treeIds debe ser un array con al menos un ID",
        });
      }

      // Validar método
      if (!["manual", "gps", "prefix"].includes(method)) {
        return res.status(400).json({
          error: "El método debe ser 'manual', 'gps' o 'prefix'",
        });
      }

      // Si es manual, verificar que se proporcione areaId
      if (method === "manual" && !areaId) {
        return res.status(400).json({
          error: "Para vinculación manual masiva, areaId es obligatorio",
        });
      }

      const results = {
        success: [],
        failed: [],
      };

      // Procesar cada árbol
      for (const treeId of treeIds) {
        try {
          if (method === "manual") {
            await db
              .update(trees)
              .set({
                area_id: Number(areaId),
                updatedAt: new Date(),
              })
              .where(eq(trees.id, Number(treeId)));

            results.success.push({
              treeId: Number(treeId),
              areaId: Number(areaId),
              method: "manual",
            });
          } else if (method === "gps") {
            const tree = await db
              .select()
              .from(trees)
              .where(eq(trees.id, Number(treeId)))
              .limit(1);

            if (tree.length === 0 || !tree[0].latitude || !tree[0].longitude) {
              results.failed.push({
                treeId: Number(treeId),
                reason: "Árbol sin coordenadas GPS",
              });
              continue;
            }

            const treeData = tree[0];
            const areas = await db
              .select()
              .from(parkAreas)
              .where(eq(parkAreas.parkId, treeData.park_id));

            let matched = false;
            for (const area of areas) {
              if (area.polygon) {
                try {
                  const polygon = typeof area.polygon === "string"
                    ? JSON.parse(area.polygon)
                    : area.polygon;

                  if (isPointInPolygon(Number(treeData.latitude), Number(treeData.longitude), polygon)) {
                    await db
                      .update(trees)
                      .set({
                        area_id: area.id,
                        updatedAt: new Date(),
                      })
                      .where(eq(trees.id, Number(treeId)));

                    results.success.push({
                      treeId: Number(treeId),
                      areaId: area.id,
                      method: "gps",
                    });
                    matched = true;
                    break;
                  }
                } catch (parseError) {
                  console.error(`Error parsing polygon for area ${area.id}`);
                }
              }
            }

            if (!matched) {
              results.failed.push({
                treeId: Number(treeId),
                reason: "No se encontró área que contenga las coordenadas",
              });
            }
          } else if (method === "prefix") {
            const tree = await db
              .select()
              .from(trees)
              .where(eq(trees.id, Number(treeId)))
              .limit(1);

            if (tree.length === 0 || !tree[0].code) {
              results.failed.push({
                treeId: Number(treeId),
                reason: "Árbol sin código",
              });
              continue;
            }

            const treeData = tree[0];
            const areas = await db
              .select()
              .from(parkAreas)
              .where(eq(parkAreas.parkId, treeData.park_id));

            let matched = false;
            for (const area of areas) {
              if (matchesPrefix(treeData.code, area.code)) {
                await db
                  .update(trees)
                  .set({
                    area_id: area.id,
                    updatedAt: new Date(),
                  })
                  .where(eq(trees.id, Number(treeId)));

                results.success.push({
                  treeId: Number(treeId),
                  areaId: area.id,
                  method: "prefix",
                });
                matched = true;
                break;
              }
            }

            if (!matched) {
              results.failed.push({
                treeId: Number(treeId),
                reason: "No se encontró área con prefijo coincidente",
              });
            }
          }
        } catch (error) {
          console.error(`Error processing tree ${treeId}:`, error);
          results.failed.push({
            treeId: Number(treeId),
            reason: "Error al procesar",
          });
        }
      }

      res.json({
        message: `Vinculación masiva completada`,
        summary: {
          total: treeIds.length,
          successful: results.success.length,
          failed: results.failed.length,
        },
        results,
      });
    } catch (error) {
      console.error("Error in bulk linking:", error);
      res.status(500).json({ error: "Error en la vinculación masiva" });
    }
  });

  // ============================================
  // GET /trees/link/unlinked - Árboles sin área asignada
  // ============================================
  apiRouter.get("/trees/link/unlinked", async (req: Request, res: Response) => {
    try {
      const { parkId } = req.query;

      let query = db.select().from(trees).where(isNull(trees.area_id));

      if (parkId) {
        query = query.where(eq(trees.park_id, Number(parkId)));
      }

      const unlinkedTrees = await query;

      res.json({
        count: unlinkedTrees.length,
        trees: unlinkedTrees,
      });
    } catch (error) {
      console.error("Error fetching unlinked trees:", error);
      res.status(500).json({ error: "Error al obtener árboles sin área" });
    }
  });
}