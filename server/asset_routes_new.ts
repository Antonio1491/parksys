import { Request, Response, Router } from "express";
import { db, pool } from "./db";
import { assets, assetCategories, assetMaintenances, assetHistory } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export function registerAssetRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  // Get all asset categories - COMENTADO PARA EVITAR CONFLICTO CON asset-categories-routes.ts
  // apiRouter.get("/asset-categories", async (_req: Request, res: Response) => {
  //   try {
  //     const categories = await db.select().from(assetCategories);
  //     res.json(categories);
  //   } catch (error) {
  //     console.error("Error al obtener categorías de activos:", error);
  //     res.status(500).json({ message: "Error al obtener categorías de activos" });
  //   }
  // });

  // Get asset category by ID - COMENTADO PARA EVITAR CONFLICTO CON asset-categories-routes.ts
  // apiRouter.get("/asset-categories/:id", async (req: Request, res: Response) => {
  //   try {
  //     const id = parseInt(req.params.id);
  //     const [category] = await db.select().from(assetCategories).where(eq(assetCategories.id, id));
  //     
  //     if (!category) {
  //       return res.status(404).json({ message: "Categoría no encontrada" });
  //     }
  //     
  //     res.json(category);
  //   } catch (error) {
  //     console.error("Error al obtener categoría:", error);
  //     res.status(500).json({ message: "Error al obtener categoría de activo" });
  //   }
  // });

  // Get all assets
  apiRouter.get("/assets", async (req: Request, res: Response) => {
    try {
      const allAssets = await db.select().from(assets);
      res.json(allAssets);
    } catch (error) {
      console.error("Error al obtener activos:", error);
      res.status(500).json({ message: "Error al obtener activos" });
    }
  });

  // Get asset by ID
  apiRouter.get("/assets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de activo inválido" });
      }
      
      console.log(`Intentando obtener activo con ID: ${id}`);
      
      const [asset] = await db.select().from(assets).where(eq(assets.id, id));
      
      if (!asset) {
        console.log(`No se encontró ningún activo con ID: ${id}`);
        return res.status(404).json({ message: "Activo no encontrado" });
      }
      
      console.log(`Activo encontrado: ${asset.name}`);
      res.json(asset);
    } catch (error) {
      console.error("Error al obtener activo:", error);
      res.status(500).json({ message: "Error al obtener activo" });
    }
  });

  // Create new asset
  apiRouter.post("/assets", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const assetData = {
        name: req.body.name,
        description: req.body.description || null,
        serialNumber: req.body.serialNumber || null,
        categoryId: parseInt(req.body.categoryId),
        parkId: parseInt(req.body.parkId),
        status: req.body.status || 'Activo',
        condition: req.body.condition || 'Bueno',
        location: req.body.location || null,
        acquisitionDate: req.body.acquisitionDate || null,
        acquisitionCost: req.body.acquisitionCost || null,
        notes: req.body.notes || null
      };

      const [newAsset] = await db.insert(assets).values(assetData).returning();
      res.status(201).json(newAsset);
    } catch (error) {
      console.error("Error al crear activo:", error);
      res.status(500).json({ message: "Error al crear activo" });
    }
  });

  // Update asset
  apiRouter.put("/assets/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de activo inválido" });
      }

      // Check if asset exists
      const [existingAsset] = await db.select().from(assets).where(eq(assets.id, id));
      if (!existingAsset) {
        return res.status(404).json({ message: "Activo no encontrado" });
      }

      const updateData = {
        name: req.body.name,
        description: req.body.description,
        serialNumber: req.body.serialNumber,
        categoryId: req.body.categoryId,
        parkId: req.body.parkId,
        status: req.body.status,
        condition: req.body.condition,
        location: req.body.location,
        acquisitionDate: req.body.acquisitionDate,
        acquisitionCost: req.body.acquisitionCost,
        notes: req.body.notes,
        updatedAt: new Date()
      };

      const [updatedAsset] = await db
        .update(assets)
        .set(updateData)
        .where(eq(assets.id, id))
        .returning();

      res.json(updatedAsset);
    } catch (error) {
      console.error("Error al actualizar activo:", error);
      res.status(500).json({ message: "Error al actualizar activo" });
    }
  });

  // Delete asset with cascading delete
  apiRouter.delete("/assets/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de activo inválido" });
      }

      // Check if asset exists
      const [existingAsset] = await db.select().from(assets).where(eq(assets.id, id));
      if (!existingAsset) {
        return res.status(404).json({ message: "Activo no encontrado" });
      }

      // Use transaction for cascading delete
      await db.transaction(async (tx) => {
        // Delete related maintenance records
        await tx.delete(assetMaintenances).where(eq(assetMaintenances.assetId, id));
        
        // Delete related history records
        await tx.delete(assetHistory).where(eq(assetHistory.assetId, id));
        
        // Delete the asset itself
        await tx.delete(assets).where(eq(assets.id, id));
      });

      res.json({ message: "Activo eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar activo:", error);
      res.status(500).json({ message: "Error al eliminar activo" });
    }
  });

  // Get asset maintenances
  apiRouter.get("/assets/:id/maintenances", async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      
      if (isNaN(assetId)) {
        return res.status(400).json({ message: "ID de activo inválido" });
      }

      const maintenances = await db
        .select()
        .from(assetMaintenances)
        .where(eq(assetMaintenances.assetId, assetId));

      res.json(maintenances);
    } catch (error) {
      console.error("Error al obtener mantenimientos:", error);
      res.status(500).json({ message: "Error al obtener mantenimientos del activo" });
    }
  });

  // Create new maintenance record
  apiRouter.post("/assets/:id/maintenances", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      
      if (isNaN(assetId)) {
        return res.status(400).json({ message: "ID de activo inválido" });
      }

      const maintenanceData = {
        assetId,
        maintenanceType: req.body.maintenanceType,
        description: req.body.description,
        date: req.body.date,
        cost: req.body.cost || null,
        performedBy: req.body.performedBy || null,
        nextMaintenanceDate: req.body.nextMaintenanceDate || null,
        status: 'completed'
      };

      const [newMaintenance] = await db
        .insert(assetMaintenances)
        .values(maintenanceData)
        .returning();

      res.status(201).json(newMaintenance);
    } catch (error) {
      console.error("Error al registrar mantenimiento:", error);
      res.status(500).json({ message: "Error al registrar mantenimiento" });
    }
  });

  // Asset history route moved to server/asset-history-routes.ts for better security and authentication

  // Get assets by park
  apiRouter.get("/parks/:id/assets", async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.id);
      
      if (isNaN(parkId)) {
        return res.status(400).json({ message: "ID de parque inválido" });
      }

      const parkAssets = await db
        .select()
        .from(assets)
        .where(eq(assets.parkId, parkId));

      res.json(parkAssets);
    } catch (error) {
      console.error("Error al obtener activos del parque:", error);
      res.status(500).json({ message: "Error al obtener activos del parque" });
    }
  });

  // Get asset statistics
  apiRouter.get("/assets-stats", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(assets);
      
      const total = totalResult[0]?.count || 0;

      // Get count by status
      const statusResult = await db
        .select({
          status: assets.status,
          count: sql<number>`COUNT(*)`
        })
        .from(assets)
        .groupBy(assets.status);

      // Get count by condition
      const conditionResult = await db
        .select({
          condition: assets.condition,
          count: sql<number>`COUNT(*)`
        })
        .from(assets)
        .groupBy(assets.condition);

      const stats = {
        total,
        byStatus: statusResult.reduce((acc, item) => {
          acc[item.status] = Number(item.count);
          return acc;
        }, {} as Record<string, number>),
        byCondition: conditionResult.reduce((acc, item) => {
          acc[item.condition] = Number(item.count);
          return acc;
        }, {} as Record<string, number>)
      };

      res.json(stats);
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      res.status(500).json({ message: "Error al obtener estadísticas de activos" });
    }
  });
}