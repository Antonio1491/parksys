import type { Express, Request, Response } from "express";
import { eq, sql, desc, and, or, isNull } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import { z } from "zod";

const {
  consumableCategories,
  consumables, 
  inventoryStock,
  inventoryMovements,
  requisitions,
  requisitionItems,
  parks,
  users,
  insertConsumableCategorySchema,
  insertConsumableSchema,
  insertInventoryStockSchema,
  insertInventoryMovementSchema,
  insertRequisitionSchema,
  insertRequisitionItemSchema
} = schema;

export function registerWarehouseRoutes(app: Express, apiRouter: any, isAuthenticated: any) {
  
  // =============== CATEGORÍAS DE CONSUMIBLES ===============
  
  // GET /api/warehouse/categories - Obtener todas las categorías
  apiRouter.get("/warehouse/categories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categories = await db
        .select()
        .from(consumableCategories)
        .where(eq(consumableCategories.isActive, true))
        .orderBy(consumableCategories.name);

      res.json(categories);
    } catch (error) {
      console.error("Error obteniendo categorías de consumibles:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // POST /api/warehouse/categories - Crear nueva categoría
  apiRouter.post("/warehouse/categories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertConsumableCategorySchema.parse(req.body);
      
      const [newCategory] = await db
        .insert(consumableCategories)
        .values(validatedData)
        .returning();

      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creando categoría de consumibles:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // PUT /api/warehouse/categories/:id - Actualizar categoría
  apiRouter.put("/warehouse/categories/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      const validatedData = insertConsumableCategorySchema.parse(req.body);
      
      const [updatedCategory] = await db
        .update(consumableCategories)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(consumableCategories.id, categoryId))
        .returning();

      if (!updatedCategory) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }

      res.json(updatedCategory);
    } catch (error) {
      console.error("Error actualizando categoría:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // DELETE /api/warehouse/categories/:id - Eliminar categoría (soft delete)
  apiRouter.delete("/warehouse/categories/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      const [deletedCategory] = await db
        .update(consumableCategories)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(consumableCategories.id, categoryId))
        .returning();

      if (!deletedCategory) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }

      res.json({ message: "Categoría eliminada correctamente" });
    } catch (error) {
      console.error("Error eliminando categoría:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // =============== CONSUMIBLES ===============
  
  // GET /api/warehouse/consumables - Obtener todos los consumibles
  apiRouter.get("/warehouse/consumables", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { categoryId, search, active } = req.query;
      
      let query = db
        .select({
          id: consumables.id,
          code: consumables.code,
          name: consumables.name,
          description: consumables.description,
          categoryId: consumables.categoryId,
          brand: consumables.brand,
          model: consumables.model,
          unitOfMeasure: consumables.unitOfMeasure,
          presentation: consumables.presentation,
          minimumStock: consumables.minimumStock,
          maximumStock: consumables.maximumStock,
          reorderPoint: consumables.reorderPoint,
          unitCost: consumables.unitCost,
          lastPurchasePrice: consumables.lastPurchasePrice,
          preferredSupplierId: consumables.preferredSupplierId,
          supplierCode: consumables.supplierCode,
          requiresExpiration: consumables.requiresExpiration,
          perishable: consumables.perishable,
          hazardous: consumables.hazardous,
          storageRequirements: consumables.storageRequirements,
          tags: consumables.tags,
          notes: consumables.notes,
          isActive: consumables.isActive,
          createdAt: consumables.createdAt,
          updatedAt: consumables.updatedAt,
          category: {
            id: consumableCategories.id,
            name: consumableCategories.name,
            icon: consumableCategories.icon,
            color: consumableCategories.color
          }
        })
        .from(consumables)
        .leftJoin(consumableCategories, eq(consumables.categoryId, consumableCategories.id));

      // Aplicar filtros
      const conditions = [];
      
      if (active !== undefined) {
        conditions.push(eq(consumables.isActive, active === 'true'));
      } else {
        conditions.push(eq(consumables.isActive, true)); // Por defecto solo activos
      }

      if (categoryId) {
        conditions.push(eq(consumables.categoryId, parseInt(categoryId as string)));
      }

      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            sql`${consumables.name} ILIKE ${searchTerm}`,
            sql`${consumables.code} ILIKE ${searchTerm}`,
            sql`${consumables.description} ILIKE ${searchTerm}`,
            sql`${consumables.brand} ILIKE ${searchTerm}`
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query.orderBy(consumables.name);
      res.json(result);
    } catch (error) {
      console.error("Error obteniendo consumibles:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // GET /api/warehouse/consumables/:id - Obtener consumible específico
  apiRouter.get("/warehouse/consumables/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const consumableId = parseInt(req.params.id);
      
      const [consumable] = await db
        .select({
          id: consumables.id,
          code: consumables.code,
          name: consumables.name,
          description: consumables.description,
          categoryId: consumables.categoryId,
          brand: consumables.brand,
          model: consumables.model,
          unitOfMeasure: consumables.unitOfMeasure,
          presentation: consumables.presentation,
          minimumStock: consumables.minimumStock,
          maximumStock: consumables.maximumStock,
          reorderPoint: consumables.reorderPoint,
          unitCost: consumables.unitCost,
          lastPurchasePrice: consumables.lastPurchasePrice,
          preferredSupplierId: consumables.preferredSupplierId,
          supplierCode: consumables.supplierCode,
          requiresExpiration: consumables.requiresExpiration,
          perishable: consumables.perishable,
          hazardous: consumables.hazardous,
          storageRequirements: consumables.storageRequirements,
          tags: consumables.tags,
          notes: consumables.notes,
          isActive: consumables.isActive,
          createdAt: consumables.createdAt,
          updatedAt: consumables.updatedAt,
          category: {
            id: consumableCategories.id,
            name: consumableCategories.name,
            icon: consumableCategories.icon,
            color: consumableCategories.color
          }
        })
        .from(consumables)
        .leftJoin(consumableCategories, eq(consumables.categoryId, consumableCategories.id))
        .where(eq(consumables.id, consumableId));

      if (!consumable) {
        return res.status(404).json({ error: "Consumible no encontrado" });
      }

      res.json(consumable);
    } catch (error) {
      console.error("Error obteniendo consumible:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // POST /api/warehouse/consumables - Crear nuevo consumible
  apiRouter.post("/warehouse/consumables", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertConsumableSchema.parse(req.body);
      
      const [newConsumable] = await db
        .insert(consumables)
        .values(validatedData)
        .returning();

      res.status(201).json(newConsumable);
    } catch (error) {
      console.error("Error creando consumible:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // PUT /api/warehouse/consumables/:id - Actualizar consumible
  apiRouter.put("/warehouse/consumables/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const consumableId = parseInt(req.params.id);
      const validatedData = insertConsumableSchema.parse(req.body);
      
      const [updatedConsumable] = await db
        .update(consumables)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(consumables.id, consumableId))
        .returning();

      if (!updatedConsumable) {
        return res.status(404).json({ error: "Consumible no encontrado" });
      }

      res.json(updatedConsumable);
    } catch (error) {
      console.error("Error actualizando consumible:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // DELETE /api/warehouse/consumables/:id - Eliminar consumible (soft delete)
  apiRouter.delete("/warehouse/consumables/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const consumableId = parseInt(req.params.id);
      
      const [deletedConsumable] = await db
        .update(consumables)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(consumables.id, consumableId))
        .returning();

      if (!deletedConsumable) {
        return res.status(404).json({ error: "Consumible no encontrado" });
      }

      res.json({ message: "Consumible eliminado correctamente" });
    } catch (error) {
      console.error("Error eliminando consumible:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // =============== INVENTARIO/STOCK ===============
  
  // GET /api/warehouse/stock - Obtener stock por ubicación
  apiRouter.get("/warehouse/stock", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { parkId, consumableId, lowStock } = req.query;
      
      let query = db
        .select({
          id: inventoryStock.id,
          consumableId: inventoryStock.consumableId,
          parkId: inventoryStock.parkId,
          warehouseLocation: inventoryStock.warehouseLocation,
          quantity: inventoryStock.quantity,
          reservedQuantity: inventoryStock.reservedQuantity,
          availableQuantity: inventoryStock.availableQuantity,
          batchNumber: inventoryStock.batchNumber,
          expirationDate: inventoryStock.expirationDate,
          zone: inventoryStock.zone,
          shelf: inventoryStock.shelf,
          position: inventoryStock.position,
          lastCountDate: inventoryStock.lastCountDate,
          notes: inventoryStock.notes,
          createdAt: inventoryStock.createdAt,
          updatedAt: inventoryStock.updatedAt,
          consumable: {
            id: consumables.id,
            code: consumables.code,
            name: consumables.name,
            unitOfMeasure: consumables.unitOfMeasure,
            minimumStock: consumables.minimumStock,
            unitCost: consumables.unitCost
          },
          park: {
            id: parks.id,
            name: parks.name
          }
        })
        .from(inventoryStock)
        .leftJoin(consumables, eq(inventoryStock.consumableId, consumables.id))
        .leftJoin(parks, eq(inventoryStock.parkId, parks.id));

      // Aplicar filtros
      const conditions = [];
      
      if (parkId) {
        conditions.push(eq(inventoryStock.parkId, parseInt(parkId as string)));
      }

      if (consumableId) {
        conditions.push(eq(inventoryStock.consumableId, parseInt(consumableId as string)));
      }

      if (lowStock === 'true') {
        conditions.push(sql`${inventoryStock.quantity} <= ${consumables.minimumStock}`);
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query.orderBy(parks.name, consumables.name);
      res.json(result);
    } catch (error) {
      console.error("Error obteniendo stock:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // POST /api/warehouse/stock - Crear/actualizar stock
  apiRouter.post("/warehouse/stock", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertInventoryStockSchema.parse(req.body);
      
      // Calcular cantidad disponible
      const availableQuantity = validatedData.quantity - (validatedData.reservedQuantity || 0);
      
      const [newStock] = await db
        .insert(inventoryStock)
        .values({
          ...validatedData,
          availableQuantity
        })
        .returning();

      res.status(201).json(newStock);
    } catch (error) {
      console.error("Error creando stock:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // PUT /api/warehouse/stock/:id - Actualizar stock
  apiRouter.put("/warehouse/stock/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const stockId = parseInt(req.params.id);
      const validatedData = insertInventoryStockSchema.parse(req.body);
      
      // Calcular cantidad disponible
      const availableQuantity = validatedData.quantity - (validatedData.reservedQuantity || 0);
      
      const [updatedStock] = await db
        .update(inventoryStock)
        .set({ 
          ...validatedData, 
          availableQuantity,
          updatedAt: new Date() 
        })
        .where(eq(inventoryStock.id, stockId))
        .returning();

      if (!updatedStock) {
        return res.status(404).json({ error: "Stock no encontrado" });
      }

      res.json(updatedStock);
    } catch (error) {
      console.error("Error actualizando stock:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // =============== MOVIMIENTOS DE INVENTARIO ===============
  
  // GET /api/warehouse/movements - Obtener movimientos de inventario
  apiRouter.get("/warehouse/movements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { 
        consumableId, 
        stockId, 
        movementType, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 50 
      } = req.query;
      
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      let query = db
        .select({
          id: inventoryMovements.id,
          consumableId: inventoryMovements.consumableId,
          stockId: inventoryMovements.stockId,
          movementType: inventoryMovements.movementType,
          quantity: inventoryMovements.quantity,
          unitCost: inventoryMovements.unitCost,
          totalCost: inventoryMovements.totalCost,
          originType: inventoryMovements.originType,
          originId: inventoryMovements.originId,
          destinationType: inventoryMovements.destinationType,
          destinationId: inventoryMovements.destinationId,
          workOrderId: inventoryMovements.workOrderId,
          purchaseOrderId: inventoryMovements.purchaseOrderId,
          transferRequestId: inventoryMovements.transferRequestId,
          description: inventoryMovements.description,
          reference: inventoryMovements.reference,
          performedById: inventoryMovements.performedById,
          approvedById: inventoryMovements.approvedById,
          batchNumber: inventoryMovements.batchNumber,
          expirationDate: inventoryMovements.expirationDate,
          movementDate: inventoryMovements.movementDate,
          status: inventoryMovements.status,
          createdAt: inventoryMovements.createdAt,
          consumable: {
            id: consumables.id,
            code: consumables.code,
            name: consumables.name,
            unitOfMeasure: consumables.unitOfMeasure
          },
          performedBy: {
            id: users.id,
            username: users.username,
            fullName: users.fullName
          }
        })
        .from(inventoryMovements)
        .leftJoin(consumables, eq(inventoryMovements.consumableId, consumables.id))
        .leftJoin(users, eq(inventoryMovements.performedById, users.id));

      // Aplicar filtros
      const conditions = [];
      
      if (consumableId) {
        conditions.push(eq(inventoryMovements.consumableId, parseInt(consumableId as string)));
      }

      if (stockId) {
        conditions.push(eq(inventoryMovements.stockId, parseInt(stockId as string)));
      }

      if (movementType) {
        conditions.push(eq(inventoryMovements.movementType, movementType as string));
      }

      if (startDate) {
        conditions.push(sql`${inventoryMovements.movementDate} >= ${startDate}`);
      }

      if (endDate) {
        conditions.push(sql`${inventoryMovements.movementDate} <= ${endDate}`);
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query
        .orderBy(desc(inventoryMovements.movementDate))
        .limit(parseInt(limit as string))
        .offset(offset);

      res.json(result);
    } catch (error) {
      console.error("Error obteniendo movimientos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // POST /api/warehouse/movements - Registrar movimiento de inventario
  apiRouter.post("/warehouse/movements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertInventoryMovementSchema.parse(req.body);
      
      // Iniciar transacción para asegurar consistencia
      const result = await db.transaction(async (tx) => {
        // Crear el movimiento
        const [newMovement] = await tx
          .insert(inventoryMovements)
          .values(validatedData)
          .returning();

        // Actualizar el stock según el tipo de movimiento
        const isIncoming = validatedData.movementType.startsWith('entrada_') || 
                          validatedData.movementType === 'ajuste_positivo' ||
                          validatedData.movementType === 'conteo_fisico';
        
        const quantityChange = isIncoming ? validatedData.quantity : -validatedData.quantity;

        await tx
          .update(inventoryStock)
          .set({
            quantity: sql`${inventoryStock.quantity} + ${quantityChange}`,
            availableQuantity: sql`${inventoryStock.availableQuantity} + ${quantityChange}`,
            updatedAt: new Date()
          })
          .where(eq(inventoryStock.id, validatedData.stockId));

        return newMovement;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Error registrando movimiento:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // =============== DASHBOARD ===============
  
  // GET /api/warehouse/dashboard - Obtener métricas del dashboard
  apiRouter.get("/warehouse/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Estadísticas básicas
      const [
        totalConsumables,
        totalCategories,
        lowStockCount,
        recentMovements
      ] = await Promise.all([
        // Total de consumibles activos
        db.select({ count: sql<number>`count(*)` })
          .from(consumables)
          .where(eq(consumables.isActive, true)),
        
        // Total de categorías activas
        db.select({ count: sql<number>`count(*)` })
          .from(consumableCategories)
          .where(eq(consumableCategories.isActive, true)),
        
        // Productos con stock bajo
        db.select({ count: sql<number>`count(*)` })
          .from(inventoryStock)
          .leftJoin(consumables, eq(inventoryStock.consumableId, consumables.id))
          .where(
            and(
              eq(consumables.isActive, true),
              sql`${inventoryStock.quantity} <= ${consumables.minimumStock}`
            )
          ),
        
        // Movimientos recientes (últimos 7 días)
        db.select({ count: sql<number>`count(*)` })
          .from(inventoryMovements)
          .where(sql`${inventoryMovements.movementDate} >= NOW() - INTERVAL '7 days'`)
      ]);

      // Movimientos por tipo (últimos 30 días)
      const movementsByType = await db
        .select({
          movementType: inventoryMovements.movementType,
          count: sql<number>`count(*)`,
          totalValue: sql<number>`sum(${inventoryMovements.totalCost})`
        })
        .from(inventoryMovements)
        .where(sql`${inventoryMovements.movementDate} >= NOW() - INTERVAL '30 days'`)
        .groupBy(inventoryMovements.movementType);

      // Top 5 consumibles más usados (últimos 30 días)
      const topConsumables = await db
        .select({
          consumableId: inventoryMovements.consumableId,
          consumableName: consumables.name,
          consumableCode: consumables.code,
          totalQuantity: sql<number>`sum(abs(${inventoryMovements.quantity}))`,
          totalValue: sql<number>`sum(abs(${inventoryMovements.totalCost}))`
        })
        .from(inventoryMovements)
        .leftJoin(consumables, eq(inventoryMovements.consumableId, consumables.id))
        .where(
          and(
            sql`${inventoryMovements.movementDate} >= NOW() - INTERVAL '30 days'`,
            sql`${inventoryMovements.movementType} LIKE 'salida_%'`
          )
        )
        .groupBy(inventoryMovements.consumableId, consumables.name, consumables.code)
        .orderBy(sql`sum(abs(${inventoryMovements.quantity})) DESC`)
        .limit(5);

      // Alertas de stock bajo
      const lowStockItems = await db
        .select({
          id: inventoryStock.id,
          consumableId: inventoryStock.consumableId,
          consumableName: consumables.name,
          consumableCode: consumables.code,
          parkId: inventoryStock.parkId,
          parkName: parks.name,
          currentStock: inventoryStock.quantity,
          minimumStock: consumables.minimumStock,
          unitOfMeasure: consumables.unitOfMeasure
        })
        .from(inventoryStock)
        .leftJoin(consumables, eq(inventoryStock.consumableId, consumables.id))
        .leftJoin(parks, eq(inventoryStock.parkId, parks.id))
        .where(
          and(
            eq(consumables.isActive, true),
            sql`${inventoryStock.quantity} <= ${consumables.minimumStock}`
          )
        )
        .orderBy(sql`(${inventoryStock.quantity} / ${consumables.minimumStock}) ASC`)
        .limit(10);

      const dashboard = {
        summary: {
          totalConsumables: Number(totalConsumables[0]?.count || 0),
          totalCategories: Number(totalCategories[0]?.count || 0),
          lowStockCount: Number(lowStockCount[0]?.count || 0),
          recentMovements: Number(recentMovements[0]?.count || 0)
        },
        movementsByType,
        topConsumables,
        lowStockItems
      };

      res.json(dashboard);
    } catch (error) {
      console.error("Error obteniendo dashboard del almacén:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  console.log("✅ Rutas del módulo de Almacén registradas correctamente");
}