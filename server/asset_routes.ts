import { Request, Response, Router } from "express";
import { db, pool } from "./db";
import { assets, assetCategories, assetMaintenances, parks, parkAmenities } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  logAssetCreation, 
  logAssetUpdate, 
  logAssetDeletion, 
  logAssetMaintenance 
} from './utils/assetHistoryLogger';

export function registerAssetRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  // Configurar multer para subida de fotos de mantenimiento
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'maintenance-photos');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `maintenance-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB límite
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif)'));
      }
    }
  });
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

  // NOTA: Ruta de categorías por ID movida a asset-categories-routes.ts
  // para evitar conflictos con rutas específicas como /parents

  // Get all assets for inventory with filtering and pagination
  apiRouter.get("/assets/inventory", async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = 'all',
        condition = 'all',
        park = 'all',
        category = 'all'
      } = req.query;

      // Build WHERE conditions
      const conditions = [];
      const queryParams = [];
      let paramIndex = 1;

      if (search && search !== '') {
        // Búsqueda mejorada que incluye tolerancia a errores comunes
        const searchString = Array.isArray(search) ? search[0] : String(search);
        const searchTerm = searchString.toLowerCase();
        
        conditions.push(`(
          LOWER(a.name) LIKE LOWER($${paramIndex}) 
          OR LOWER(COALESCE(a.description, '')) LIKE LOWER($${paramIndex + 1})
          OR LOWER(a.name) LIKE LOWER($${paramIndex + 2})
          OR LOWER(a.name) LIKE LOWER($${paramIndex + 3})
        )`);
        
        queryParams.push(
          `%${search}%`, 
          `%${search}%`,
          `%${searchTerm.replace('rebaladilla', 'resbaladilla')}%`, // Corrige error común
          `%${searchTerm.replace('resbaladilla', 'rebaladilla')}%`   // Permite búsqueda inversa
        );
        paramIndex += 4;
      }

      if (status !== 'all') {
        conditions.push(`a.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (condition !== 'all') {
        conditions.push(`a.condition = $${paramIndex}`);
        queryParams.push(condition);
        paramIndex++;
      }

      if (park !== 'all') {
        conditions.push(`a.park_id = $${paramIndex}`);
        queryParams.push(parseInt(park as string));
        paramIndex++;
      }

      if (category !== 'all') {
        conditions.push(`a.category_id = $${paramIndex}`);
        queryParams.push(parseInt(category as string));
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count and total value
      const countQuery = `
        SELECT 
          COUNT(*) as count,
          COALESCE(SUM(CAST(a.acquisition_cost AS DECIMAL(10,2))), 0) as total_value
        FROM assets a
        LEFT JOIN asset_categories ac ON a.category_id = ac.id
        LEFT JOIN parks p ON a.park_id = p.id
        ${whereClause}
      `;

      const countResult = await pool.query(countQuery, queryParams);
      const totalAssets = parseInt(countResult.rows[0]?.count || '0');
      const totalValue = parseFloat(countResult.rows[0]?.total_value || '0');

      // Get paginated results
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      const assetsQuery = `
        SELECT 
          a.id,
          a.name,
          a.description,
          a.serial_number as "serialNumber",
          a.acquisition_date as "acquisitionDate",
          a.acquisition_cost as "acquisitionCost",
          a.current_value as "currentValue",
          a.manufacturer,
          a.model,
          a.park_id as "parkId",
          a.category_id as "categoryId",
          a.amenity_id as "amenityId",
          a.status,
          a.condition,
          a.location_description as "locationDescription",
          a.latitude,
          a.longitude,
          a.maintenance_frequency as "maintenanceFrequency",
          a.last_maintenance_date as "lastMaintenanceDate",
          a.next_maintenance_date as "nextMaintenanceDate",
          a.expected_lifespan as "expectedLifespan",
          a.qr_code as "qrCode",
          a.responsible_person_id as "responsiblePersonId",
          a.notes,
          a.created_at as "createdAt",
          a.updated_at as "updatedAt",
          ac.name as "categoryName",
          p.name as "parkName",
          am.name as "amenityName",
          u.full_name as "responsiblePersonName"
        FROM assets a
        LEFT JOIN asset_categories ac ON a.category_id = ac.id
        LEFT JOIN parks p ON a.park_id = p.id
        LEFT JOIN amenities am ON a.amenity_id = am.id
        LEFT JOIN users u ON a.responsible_person_id = u.id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(parseInt(limit as string), offset);
      const assetsResult = await pool.query(assetsQuery, queryParams);

      res.json({
        assets: assetsResult.rows,
        totalAssets,
        totalValue,
        totalPages: Math.ceil(totalAssets / parseInt(limit as string)),
        currentPage: parseInt(page as string),
        itemsPerPage: parseInt(limit as string)
      });
    } catch (error) {
      console.error("Error al obtener inventario de activos:", error);
      res.status(500).json({ message: "Error al obtener inventario de activos" });
    }
  });

  // Export all assets endpoint (sin paginación)
  apiRouter.get("/assets/export", async (req: Request, res: Response) => {
    try {
      const exportQuery = `
        SELECT 
          a.id,
          a.name,
          a.description,
          a.serial_number as "serialNumber",
          a.acquisition_date as "acquisitionDate",
          a.acquisition_cost as "acquisitionCost",
          a.current_value as "currentValue",
          a.manufacturer,
          a.model,
          a.park_id as "parkId",
          a.category_id as "categoryId",
          a.amenity_id as "amenityId",
          a.status,
          a.condition,
          a.location_description as "locationDescription",
          a.latitude,
          a.longitude,
          a.maintenance_frequency as "maintenanceFrequency",
          a.last_maintenance_date as "lastMaintenanceDate",
          a.next_maintenance_date as "nextMaintenanceDate",
          a.expected_lifespan as "expectedLifespan",
          a.qr_code as "qrCode",
          a.responsible_person_id as "responsiblePersonId",
          a.notes,
          a.created_at as "createdAt",
          a.updated_at as "updatedAt",
          ac.name as "categoryName",
          p.name as "parkName",
          am.name as "amenityName",
          u.full_name as "responsiblePersonName"
        FROM assets a
        LEFT JOIN asset_categories ac ON a.category_id = ac.id
        LEFT JOIN parks p ON a.park_id = p.id
        LEFT JOIN amenities am ON a.amenity_id = am.id
        LEFT JOIN users u ON a.responsible_person_id = u.id
        ORDER BY a.created_at DESC
      `;

      const result = await pool.query(exportQuery);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al exportar activos:", error);
      res.status(500).json({ message: "Error al exportar activos" });
    }
  });

  // Get all assets
  apiRouter.get("/assets", async (req: Request, res: Response) => {
    try {
      const allAssets = await db
        .select({
          id: assets.id,
          name: assets.name,
          description: assets.description,
          serialNumber: assets.serialNumber,
          acquisitionDate: assets.acquisitionDate,
          acquisitionCost: assets.acquisitionCost,
          parkId: assets.parkId,
          categoryId: assets.categoryId,
          status: assets.status,
          condition: assets.condition,
          locationDescription: assets.locationDescription,
          latitude: assets.latitude,
          longitude: assets.longitude,
          lastMaintenanceDate: assets.lastMaintenanceDate,
          nextMaintenanceDate: assets.nextMaintenanceDate,
          createdAt: assets.createdAt,
          updatedAt: assets.updatedAt,
          categoryName: assetCategories.name,
          parkName: parks.name
        })
        .from(assets)
        .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
        .leftJoin(parks, eq(assets.parkId, parks.id));
      
      res.json(allAssets);
    } catch (error) {
      console.error("Error al obtener activos:", error);
      res.status(500).json({ message: "Error al obtener activos" });
    }
  });

  // Get asset by ID - DEBE IR DESPUÉS DE RUTAS ESPECÍFICAS
  apiRouter.get("/assets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de activo inválido" });
      }
      
      console.log(`Intentando obtener activo con ID: ${id}`);
      
      const [asset] = await db.select({
        id: assets.id,
        name: assets.name,
        description: assets.description,
        serialNumber: assets.serialNumber,
        categoryId: assets.categoryId,
        subcategoryId: assets.subcategoryId,
        parkId: assets.parkId,
        amenityId: assets.amenityId,
        status: assets.status,
        condition: assets.condition,
        locationDescription: assets.locationDescription,
        acquisitionDate: assets.acquisitionDate,
        acquisitionCost: assets.acquisitionCost,
        currentValue: assets.currentValue,
        notes: assets.notes,
        latitude: assets.latitude,
        longitude: assets.longitude,
        manufacturer: assets.manufacturer,
        model: assets.model,
        maintenanceFrequency: assets.maintenanceFrequency,
        lastMaintenanceDate: assets.lastMaintenanceDate,
        nextMaintenanceDate: assets.nextMaintenanceDate,
        expectedLifespan: assets.expectedLifespan,
        qrCode: assets.qrCode,
        responsiblePersonId: assets.responsiblePersonId,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt
      }).from(assets).where(eq(assets.id, id));
      
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

  // Create new asset with automatic secure history logging
  apiRouter.post("/assets", isAuthenticated, async (req: Request, res: Response) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const assetData = {
        name: req.body.name,
        description: req.body.description || null,
        serialNumber: req.body.serialNumber || null,
        categoryId: parseInt(req.body.categoryId),
        parkId: parseInt(req.body.parkId),
        status: req.body.status || 'active',
        condition: req.body.condition || 'good',
        locationDescription: req.body.location || null,
        acquisitionDate: req.body.acquisitionDate || null,
        acquisitionCost: req.body.acquisitionCost ? req.body.acquisitionCost.toString() : null,
        notes: req.body.notes || null,
        amenityId: req.body.amenityId || null,
        latitude: req.body.latitude || null,
        longitude: req.body.longitude || null,
        manufacturer: req.body.manufacturer || null,
        model: req.body.model || null,
        currentValue: req.body.currentValue || null,
        maintenanceFrequency: req.body.maintenanceFrequency || null,
        lastMaintenanceDate: req.body.lastMaintenanceDate || null,
        nextMaintenanceDate: req.body.nextMaintenanceDate || null,
        expectedLifespan: req.body.expectedLifespan ? parseInt(req.body.expectedLifespan) : null,
        qrCode: req.body.qrCode || null,
        responsiblePersonId: req.body.responsiblePersonId ? parseInt(req.body.responsiblePersonId) : null
      };

      // 🔒 SECURE: Use raw SQL with the same client for true transactional integrity
      const insertQuery = `
        INSERT INTO assets (
          name, description, serial_number, category_id, park_id, status, condition,
          location_description, acquisition_date, acquisition_cost, notes, amenity_id,
          latitude, longitude, manufacturer, model, current_value, maintenance_frequency,
          last_maintenance_date, next_maintenance_date, expected_lifespan, qr_code,
          responsible_person_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW())
        RETURNING id, name, description, serial_number as "serialNumber", category_id as "categoryId",
                  park_id as "parkId", status, condition, location_description as "locationDescription",
                  acquisition_date as "acquisitionDate", acquisition_cost as "acquisitionCost",
                  notes, amenity_id as "amenityId", latitude, longitude, manufacturer, model,
                  current_value as "currentValue", maintenance_frequency as "maintenanceFrequency",
                  last_maintenance_date as "lastMaintenanceDate", next_maintenance_date as "nextMaintenanceDate",
                  expected_lifespan as "expectedLifespan", qr_code as "qrCode",
                  responsible_person_id as "responsiblePersonId", created_at as "createdAt", updated_at as "updatedAt"
      `;
      
      const insertResult = await client.query(insertQuery, [
        assetData.name,
        assetData.description,
        assetData.serialNumber,
        assetData.categoryId,
        assetData.parkId,
        assetData.status,
        assetData.condition,
        assetData.locationDescription,
        assetData.acquisitionDate,
        assetData.acquisitionCost,
        assetData.notes,
        assetData.amenityId,
        assetData.latitude,
        assetData.longitude,
        assetData.manufacturer,
        assetData.model,
        assetData.currentValue,
        assetData.maintenanceFrequency,
        assetData.lastMaintenanceDate,
        assetData.nextMaintenanceDate,
        assetData.expectedLifespan,
        assetData.qrCode,
        assetData.responsiblePersonId
      ]);
      
      const newAsset = insertResult.rows[0];
      
      // 🔒 SECURE: Log asset creation within the same transaction
      const userId = (req as any).user?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      await logAssetCreation(client, newAsset.id, assetData, userId, ipAddress, userAgent);
      
      await client.query('COMMIT');
      console.log(`🔒 [SECURE] Asset created with automatic history logging: ${newAsset.id}`);
      
      res.status(201).json(newAsset);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("🚨 [SECURE] Error creating asset - transaction rolled back:", error);
      res.status(500).json({ message: "Error al crear activo" });
    } finally {
      client.release();
    }
  });

  // Update asset with automatic secure history logging
  apiRouter.put("/assets/:id", async (req: Request, res: Response) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const id = parseInt(req.params.id);
      
      console.log(`🔒 [SECURE] Actualizando activo ID: ${id}`);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de activo inválido" });
      }

      // 🔒 SECURE: Get existing asset data BEFORE updating using the same client
      const existingAssetQuery = 'SELECT * FROM assets WHERE id = $1';
      const existingAssetResult = await client.query(existingAssetQuery, [id]);
      
      if (existingAssetResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: "Activo no encontrado" });
      }
      
      const existingAsset = existingAssetResult.rows[0];

      // Prepare update data - only include fields that are actually being sent
      const updateData: any = {
        updatedAt: new Date()
      };
      
      // Only update fields that are explicitly provided
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.description !== undefined) updateData.description = req.body.description || null;
      if (req.body.serialNumber !== undefined) updateData.serialNumber = req.body.serialNumber || null;
      if (req.body.categoryId !== undefined) updateData.categoryId = req.body.categoryId;
      if (req.body.parkId !== undefined) updateData.parkId = req.body.parkId;
      if (req.body.status !== undefined) updateData.status = req.body.status;
      if (req.body.condition !== undefined) updateData.condition = req.body.condition;
      if (req.body.location !== undefined) updateData.locationDescription = req.body.location || null;
      if (req.body.acquisitionDate !== undefined) updateData.acquisitionDate = req.body.acquisitionDate || null;
      if (req.body.acquisitionCost !== undefined) updateData.acquisitionCost = req.body.acquisitionCost ? req.body.acquisitionCost.toString() : null;
      if (req.body.currentValue !== undefined) updateData.currentValue = req.body.currentValue ? req.body.currentValue.toString() : null;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes || null;

      // Handle amenityId - convert from park_amenities.id to amenities.id
      if (req.body.amenityId !== undefined && req.body.amenityId !== null) {
        // Get the actual amenity_id from park_amenities table
        const [parkAmenity] = await db
          .select({ amenityId: parkAmenities.amenityId })
          .from(parkAmenities)
          .where(eq(parkAmenities.id, req.body.amenityId));
          
        if (parkAmenity) {
          updateData.amenityId = parkAmenity.amenityId;
          console.log(`Convertido park_amenities.id ${req.body.amenityId} a amenities.id ${parkAmenity.amenityId}`);
        } else {
          updateData.amenityId = null;
          console.log(`No se encontró park_amenity con id ${req.body.amenityId}`);
        }
      } else {
        updateData.amenityId = null;
      }

      // Handle latitude and longitude with proper cleanup
      if (req.body.latitude !== undefined) {
        let cleanLat = req.body.latitude.toString().trim().replace(/,+$/, ''); // Remove trailing commas
        updateData.latitude = cleanLat;
        console.log(`Latitud limpiada: "${req.body.latitude}" -> "${cleanLat}"`);
      }

      if (req.body.longitude !== undefined) {
        let cleanLng = req.body.longitude.toString().trim().replace(/^[\s,]+/, ''); // Remove leading spaces and commas
        updateData.longitude = cleanLng;
        console.log(`Longitud limpiada: "${req.body.longitude}" -> "${cleanLng}"`);
      }

      console.log("🔒 [SECURE] Datos de actualización preparados:", JSON.stringify(updateData, null, 2));
      
      // 🔒 SECURE: Use raw SQL with the same client for true transactional integrity
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (key !== 'updatedAt') { // Handle updatedAt separately
          const sqlKey = key === 'locationDescription' ? 'location_description' :
                        key === 'serialNumber' ? 'serial_number' :
                        key === 'categoryId' ? 'category_id' :
                        key === 'parkId' ? 'park_id' :
                        key === 'amenityId' ? 'amenity_id' :
                        key === 'acquisitionDate' ? 'acquisition_date' :
                        key === 'acquisitionCost' ? 'acquisition_cost' :
                        key === 'currentValue' ? 'current_value' :
                        key === 'maintenanceFrequency' ? 'maintenance_frequency' :
                        key === 'lastMaintenanceDate' ? 'last_maintenance_date' :
                        key === 'nextMaintenanceDate' ? 'next_maintenance_date' :
                        key === 'expectedLifespan' ? 'expected_lifespan' :
                        key === 'qrCode' ? 'qr_code' :
                        key === 'responsiblePersonId' ? 'responsible_person_id' :
                        key.replace(/([A-Z])/g, '_$1').toLowerCase();
          
          updateFields.push(`${sqlKey} = $${paramIndex}`);
          updateValues.push(updateData[key]);
          paramIndex++;
        }
      });
      
      // Always update the timestamp
      updateFields.push(`updated_at = NOW()`);
      
      const updateQuery = `
        UPDATE assets 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, description, serial_number as "serialNumber", category_id as "categoryId",
                  park_id as "parkId", status, condition, location_description as "locationDescription",
                  acquisition_date as "acquisitionDate", acquisition_cost as "acquisitionCost",
                  notes, amenity_id as "amenityId", latitude, longitude, manufacturer, model,
                  current_value as "currentValue", maintenance_frequency as "maintenanceFrequency",
                  last_maintenance_date as "lastMaintenanceDate", next_maintenance_date as "nextMaintenanceDate",
                  expected_lifespan as "expectedLifespan", qr_code as "qrCode",
                  responsible_person_id as "responsiblePersonId", created_at as "createdAt", updated_at as "updatedAt"
      `;
      
      updateValues.push(id);
      const updateResult = await client.query(updateQuery, updateValues);
      const updatedAsset = updateResult.rows[0];

      // 🔒 SECURE: Log asset changes within the same transaction
      const userId = (req as any).user?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      // Create merged new data for comparison (includes unchanged fields)
      const newAssetData = { ...existingAsset, ...updateData };
      
      await logAssetUpdate(client, id, existingAsset, newAssetData, userId, ipAddress, userAgent);
      
      await client.query('COMMIT');
      console.log(`🔒 [SECURE] Asset updated with automatic history logging: ${id}`);
      
      res.json(updatedAsset);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("🚨 [SECURE] Error updating asset - transaction rolled back:", error);
      res.status(500).json({ message: "Error al actualizar activo", details: error.message });
    } finally {
      client.release();
    }
  });

  // Bulk delete assets with cascading delete and secure history logging
  apiRouter.delete("/assets/bulk-delete", isAuthenticated, async (req: Request, res: Response) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Se requiere un array de IDs válidos" });
      }

      // Validate all IDs are numbers
      const assetIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
      
      if (assetIds.length !== ids.length) {
        return res.status(400).json({ message: "Todos los IDs deben ser números válidos" });
      }

      console.log(`🔒 [SECURE BULK DELETE] Iniciando eliminación de ${assetIds.length} activos: [${assetIds.join(', ')}]`);

      // 🔒 SECURE: Get asset data BEFORE deletion for history logging (using same client)
      const existingAssetsQuery = `SELECT * FROM assets WHERE id = ANY($1)`;
      const existingAssetsResult = await client.query(existingAssetsQuery, [assetIds]);

      if (existingAssetsResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: "No se encontraron activos para eliminar" });
      }

      const existingAssets = existingAssetsResult.rows;
      const foundIds = existingAssets.map(asset => asset.id);
      const notFoundIds = assetIds.filter(id => !foundIds.includes(id));

      console.log(`🔒 [SECURE BULK DELETE] Activos encontrados: ${foundIds.length}`);
      console.log(`🔒 [SECURE BULK DELETE] Activos no encontrados: ${notFoundIds.length}`);

      let deletedCount = 0;
      const errors = [];
      
      // Get user context for history logging
      const userId = (req as any).user?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // 🔒 SECURE: Process each asset deletion within the same transaction
      for (const asset of existingAssets) {
        try {
          console.log(`🔒 [SECURE BULK DELETE] Eliminando activo ID: ${asset.id} - ${asset.name}`);

          // 🔒 SECURE: Log asset deletion BEFORE deleting (using same client)
          await logAssetDeletion(client, asset.id, asset, userId, ipAddress, userAgent);

          // Delete related maintenance records first (using same client)
          await client.query('DELETE FROM asset_maintenances WHERE asset_id = $1', [asset.id]);
          console.log(`🔒 Mantenimientos eliminados para activo ${asset.id}`);
          
          // Delete from asset_assignments table if it exists (using same client)
          await client.query('DELETE FROM asset_assignments WHERE asset_id = $1', [asset.id]);
          console.log(`🔒 Asignaciones eliminadas para activo ${asset.id}`);
          
          // Delete the asset itself (using same client)
          const deleteAssetQuery = 'DELETE FROM assets WHERE id = $1';
          await client.query(deleteAssetQuery, [asset.id]);
          console.log(`🔒 Activo ${asset.id} eliminado exitosamente`);
          
          deletedCount++;
        } catch (error) {
          console.error(`🚨 [SECURE BULK DELETE] Error eliminando activo ${asset.id}:`, error);
          errors.push({ assetId: asset.id, error: error.message });
          // Continue with other assets instead of rolling back entire transaction
        }
      }
      
      if (errors.length === existingAssets.length) {
        // All deletions failed, rollback
        await client.query('ROLLBACK');
        return res.status(500).json({ 
          message: "Error: No se pudo eliminar ningún activo", 
          errors 
        });
      }

      await client.query('COMMIT');
      console.log(`🔒 [SECURE BULK DELETE] Eliminación completada: ${deletedCount} activos eliminados con historial seguro`);
      
      const response = {
        message: `${deletedCount} activos eliminados correctamente con historial completo`,
        deletedCount,
        totalRequested: assetIds.length,
        notFound: notFoundIds.length > 0 ? notFoundIds : undefined,
        errors: errors.length > 0 ? errors : undefined
      };

      res.json(response);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("🚨 [SECURE BULK DELETE] Error en eliminación masiva - transaction rolled back:", error);
      res.status(500).json({ message: "Error en eliminación masiva", error: error.message });
    } finally {
      client.release();
    }
  });

  // Delete asset with cascading delete and automatic secure history logging
  apiRouter.delete("/assets/:id", isAuthenticated, async (req: Request, res: Response) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de activo inválido" });
      }

      console.log(`🔒 [SECURE] Intentando eliminar activo con ID: ${id}`);

      // 🔒 SECURE: Check if asset exists and get data for history logging (using same client)
      const existingAssetQuery = 'SELECT * FROM assets WHERE id = $1';
      const existingAssetResult = await client.query(existingAssetQuery, [id]);
      
      if (existingAssetResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: "Activo no encontrado" });
      }
      
      const existingAsset = existingAssetResult.rows[0];

      console.log(`🔒 [SECURE] Activo encontrado, procediendo con eliminación: ${existingAsset.name}`);

      // 🔒 SECURE: Log asset deletion BEFORE deleting (so we have asset data)
      const userId = (req as any).user?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      await logAssetDeletion(client, id, existingAsset, userId, ipAddress, userAgent);

      // 🔒 SECURE: Perform cascading delete using same client for true transactional integrity
      // Delete related maintenance records first (using same client)
      await client.query('DELETE FROM asset_maintenances WHERE asset_id = $1', [id]);
      console.log(`🔒 [SECURE DELETE] Registros de mantenimiento eliminados para activo ${id}`);
        
      // Delete from asset_assignments table if it exists (using same client)
      try {
        await client.query("DELETE FROM asset_assignments WHERE asset_id = $1", [id]);
        console.log("🔒 [SECURE DELETE] Asignaciones de activos eliminadas para activo ${id}");
      } catch (assignmentsError) {
        console.log("🔒 [SECURE DELETE] Tabla asset_assignments no existe o no hay registros para activo ${id}");
      }
      
      // Delete the asset itself (using same client)
      await client.query('DELETE FROM assets WHERE id = $1', [id]);
      console.log(`🔒 [SECURE DELETE] Activo ${id} eliminado exitosamente`);

      await client.query('COMMIT');
      console.log(`🔒 [SECURE] Asset deleted with automatic history logging: ${id}`);
      
      res.json({ message: "Activo eliminado correctamente" });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("🚨 [SECURE] Error deleting asset - transaction rolled back:", error);
      res.status(500).json({ message: "Error al eliminar activo" });
    } finally {
      client.release();
    }
  });

  // COMENTADO - usar maintenance_routes_fixed.ts en su lugar
  // Get asset maintenances
  /*
  apiRouter.get("/assets/:id/maintenances", async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      
      if (isNaN(assetId)) {
        return res.status(400).json({ message: "ID de activo inválido" });
      }

      // Use direct SQL query to avoid schema mismatches
      const result = await pool.query(`
        SELECT id, asset_id, maintenance_type, performed_by, performer_id, 
               date, cost, description, findings, actions, next_maintenance_date, 
               photos, status, created_at, updated_at
        FROM asset_maintenances 
        WHERE asset_id = $1 
        ORDER BY date DESC
      `, [assetId]);

      res.json(result.rows || []);
    } catch (error) {
      console.error("Error al obtener mantenimientos:", error);
      res.status(500).json({ message: "Error al obtener mantenimientos del activo" });
    }
  });
  */

  // COMENTADO - usar maintenance_routes_fixed.ts en su lugar
  // Create new maintenance record
  /*
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
        status: req.body.status || 'scheduled'
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
  */

  // Update maintenance record
  apiRouter.put("/asset-maintenances/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('🔄 Actualizando mantenimiento:', req.params.id);
      console.log('Datos recibidos:', req.body);
      
      const maintenanceId = parseInt(req.params.id);
      
      if (isNaN(maintenanceId)) {
        return res.status(400).json({ message: "ID de mantenimiento inválido" });
      }

      // Obtener el mantenimiento actual para preservar las fotos
      const [currentMaintenance] = await db
        .select()
        .from(assetMaintenances)
        .where(eq(assetMaintenances.id, maintenanceId));

      if (!currentMaintenance) {
        return res.status(404).json({ message: "Mantenimiento no encontrado" });
      }

      console.log('📋 Mantenimiento actual encontrado, fotos existentes:', currentMaintenance.photos);

      const updateData = {
        maintenanceType: req.body.maintenanceType,
        description: req.body.description,
        date: req.body.date,
        status: req.body.status || 'scheduled',
        cost: req.body.cost || null,
        performedBy: req.body.performedBy || null,
        notes: req.body.notes || null,
        // Preservar las fotos existentes
        photos: currentMaintenance.photos || [],
      };

      console.log('💾 Datos de actualización (preservando fotos):', updateData);

      const [updatedMaintenance] = await db
        .update(assetMaintenances)
        .set(updateData)
        .where(eq(assetMaintenances.id, maintenanceId))
        .returning();

      console.log('✅ Mantenimiento actualizado con fotos preservadas:', updatedMaintenance);
      res.json(updatedMaintenance);
    } catch (error) {
      console.error("Error al actualizar mantenimiento:", error);
      res.status(500).json({ message: "Error al actualizar mantenimiento" });
    }
  });

  // Delete maintenance record
  apiRouter.delete("/asset-maintenances/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      
      if (isNaN(maintenanceId)) {
        return res.status(400).json({ message: "ID de mantenimiento inválido" });
      }

      const [deletedMaintenance] = await db
        .delete(assetMaintenances)
        .where(eq(assetMaintenances.id, maintenanceId))
        .returning();

      if (!deletedMaintenance) {
        return res.status(404).json({ message: "Mantenimiento no encontrado" });
      }

      res.json({ message: "Mantenimiento eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar mantenimiento:", error);
      res.status(500).json({ message: "Error al eliminar mantenimiento" });
    }
  });

  // Upload photos for maintenance
  apiRouter.post("/maintenance-photos/:id", isAuthenticated, upload.array('photos', 5), async (req: Request, res: Response) => {
    try {
      console.log('📸 Iniciando subida de fotos para mantenimiento');
      console.log('Request params:', req.params);
      console.log('Files received:', req.files);
      
      const maintenanceId = parseInt(req.params.id);
      
      if (isNaN(maintenanceId)) {
        console.error('❌ ID de mantenimiento inválido:', req.params.id);
        return res.status(400).json({ message: "ID de mantenimiento inválido" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        console.error('❌ No se recibieron archivos');
        return res.status(400).json({ message: "No se subieron archivos" });
      }

      console.log('✅ Archivos recibidos:', files.length);
      files.forEach((file, index) => {
        console.log(`  Archivo ${index + 1}:`, {
          originalname: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype
        });
      });

      // Generar URLs de las fotos subidas
      const photoUrls = files.map(file => `/uploads/maintenance-photos/${file.filename}`);
      console.log('📂 URLs generadas:', photoUrls);

      // Obtener fotos existentes del mantenimiento
      const [existingMaintenance] = await db
        .select({ photos: assetMaintenances.photos })
        .from(assetMaintenances)
        .where(eq(assetMaintenances.id, maintenanceId));

      if (!existingMaintenance) {
        console.error('❌ Mantenimiento no encontrado:', maintenanceId);
        return res.status(404).json({ message: "Mantenimiento no encontrado" });
      }

      console.log('📋 Mantenimiento encontrado, fotos existentes:', existingMaintenance.photos);

      // Combinar fotos existentes con las nuevas
      const existingPhotos = existingMaintenance.photos || [];
      const allPhotos = [...existingPhotos, ...photoUrls];
      console.log('🔄 Fotos combinadas:', allPhotos);

      // Actualizar el mantenimiento con las nuevas fotos
      const [updatedMaintenance] = await db
        .update(assetMaintenances)
        .set({ photos: allPhotos })
        .where(eq(assetMaintenances.id, maintenanceId))
        .returning();

      console.log('✅ Mantenimiento actualizado exitosamente');
      res.json({
        message: 'Fotos subidas exitosamente',
        photos: photoUrls,
        maintenance: updatedMaintenance
      });
    } catch (error) {
      console.error("❌ Error detallado al subir fotos:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace available');
      res.status(500).json({ message: "Error al subir fotos", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get photos for maintenance
  apiRouter.get("/maintenance-photos/:id", async (req: Request, res: Response) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      
      if (isNaN(maintenanceId)) {
        return res.status(400).json({ message: "ID de mantenimiento inválido" });
      }

      const [maintenance] = await db
        .select({ photos: assetMaintenances.photos })
        .from(assetMaintenances)
        .where(eq(assetMaintenances.id, maintenanceId));

      if (!maintenance) {
        return res.status(404).json({ message: "Mantenimiento no encontrado" });
      }

      res.json({ photos: maintenance.photos || [] });
    } catch (error) {
      console.error("Error al obtener fotos:", error);
      res.status(500).json({ message: "Error al obtener fotos" });
    }
  });

  // Delete photo from maintenance
  apiRouter.delete("/maintenance-photos/:id/:photoIndex", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      const photoIndex = parseInt(req.params.photoIndex);
      
      if (isNaN(maintenanceId) || isNaN(photoIndex)) {
        return res.status(400).json({ message: "Parámetros inválidos" });
      }

      // Obtener el mantenimiento actual
      const [maintenance] = await db
        .select({ photos: assetMaintenances.photos })
        .from(assetMaintenances)
        .where(eq(assetMaintenances.id, maintenanceId));

      if (!maintenance) {
        return res.status(404).json({ message: "Mantenimiento no encontrado" });
      }

      const photos = maintenance.photos || [];
      if (photoIndex < 0 || photoIndex >= photos.length) {
        return res.status(400).json({ message: "Índice de foto inválido" });
      }

      // Eliminar archivo físico
      const photoUrl = photos[photoIndex];
      const filePath = path.join(process.cwd(), 'public', photoUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Eliminar la foto del array
      const updatedPhotos = photos.filter((_, index) => index !== photoIndex);

      // Actualizar el mantenimiento
      const [updatedMaintenance] = await db
        .update(assetMaintenances)
        .set({ photos: updatedPhotos })
        .where(eq(assetMaintenances.id, maintenanceId))
        .returning();

      res.json({
        message: 'Foto eliminada exitosamente',
        maintenance: updatedMaintenance
      });
    } catch (error) {
      console.error("Error al eliminar foto:", error);
      res.status(500).json({ message: "Error al eliminar foto" });
    }
  });

  // Get asset history (simplified version)
  apiRouter.get("/assets/:id/history", async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      
      if (isNaN(assetId)) {
        return res.status(400).json({ message: "ID de activo inválido" });
      }

      // Return empty array if history table doesn't exist
      try {
        const historyResult = await pool.query("SELECT * FROM asset_history WHERE asset_id = $1 ORDER BY created_at DESC", [assetId]);
        res.json(historyResult.rows || []);
      } catch (error) {
        console.log("Tabla asset_history no existe, devolviendo array vacío");
        res.json([]);
      }
    } catch (error) {
      console.error("Error al obtener historial:", error);
      res.status(500).json({ message: "Error al obtener historial del activo" });
    }
  });

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

      // Get total value and value by category
      const totalValueResult = await db
        .select({
          totalValue: sql<number>`COALESCE(SUM(CAST(acquisition_cost AS DECIMAL)), 0)`
        })
        .from(assets);

      const categoryValueResult = await db
        .select({
          categoryName: assetCategories.name,
          totalValue: sql<number>`COALESCE(SUM(CAST(${assets.acquisitionCost} AS DECIMAL)), 0)`
        })
        .from(assets)
        .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
        .groupBy(assetCategories.name);

      const stats = {
        total,
        totalValue: Number(totalValueResult[0]?.totalValue || 0),
        byStatus: statusResult.reduce((acc, item) => {
          acc[item.status] = Number(item.count);
          return acc;
        }, {} as Record<string, number>),
        byCondition: conditionResult.reduce((acc, item) => {
          acc[item.condition] = Number(item.count);
          return acc;
        }, {} as Record<string, number>),
        categoryValues: categoryValueResult.map(item => ({
          category: item.categoryName || 'Sin categoría',
          totalValue: Number(item.totalValue || 0)
        }))
      };

      res.json(stats);
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      res.status(500).json({ message: "Error al obtener estadísticas de activos" });
    }
  });

  // Generate sample assets
  apiRouter.post("/assets/generate-sample", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('🏗️ Iniciando generación de activos de muestra...');
      
      // Import the sample data generator
      const { addSampleAssets } = await import('./add-sample-assets');
      const result = await addSampleAssets();
      
      console.log('✅ Activos de muestra generados exitosamente');
      res.json({ 
        message: "100 activos ficticios creados exitosamente",
        success: true,
        created: result.created
      });
    } catch (error) {
      console.error("❌ Error al generar activos de muestra:", error);
      res.status(500).json({ 
        message: "Error al generar activos de muestra",
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // Configurar multer para importación de CSV
  const csvUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos CSV'));
      }
    }
  });

  // Endpoint para importar activos desde CSV
  apiRouter.post("/assets/import", isAuthenticated, csvUpload.single('file'), async (req: Request, res: Response) => {
    try {
      console.log('📥 Iniciando importación de activos desde CSV');

      if (!req.file) {
        return res.status(400).json({ 
          message: "No se proporcionó archivo CSV",
          success: 0,
          errors: []
        });
      }

      // Importar csv-parse
      const { parse } = await import('csv-parse/sync');
      
      // Parsear el CSV
      const csvContent = req.file.buffer.toString('utf8');
      
      // Detectar y remover BOM si existe
      const cleanContent = csvContent.replace(/^\uFEFF/, '');
      
      const records = parse(cleanContent, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
        quote: '"',
        escape: '"'
      });

      console.log(`📊 CSV parseado exitosamente: ${records.length} filas`);

      const results = {
        success: 0,
        errors: [] as Array<{ row: number; message: string }>
      };

      // Obtener datos de referencia
      const [categoriesData, parksData, amenitiesData] = await Promise.all([
        pool.query('SELECT id, name FROM asset_categories WHERE parent_id IS NULL'),
        pool.query('SELECT id, name FROM parks'),
        pool.query('SELECT id, name FROM amenities')
      ]);

      const categoriesMap = new Map(categoriesData.rows.map(cat => [cat.name, cat.id]));
      const parksMap = new Map(parksData.rows.map(park => [park.name, park.id]));
      const amenitiesMap = new Map(amenitiesData.rows.map(amenity => [amenity.name, amenity.id]));

      // Procesar cada fila
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // +2 porque empezamos desde 1 y hay header

        try {
          // Validar campos requeridos
          if (!row.Nombre?.trim()) {
            throw new Error('Nombre del activo es requerido');
          }

          // Mapear nombres a IDs usando las columnas exactas de la plantilla
          const categoryId = categoriesMap.get(row['Categoría Principal']?.trim());
          const parkId = parksMap.get(row.Parque?.trim());
          const amenityId = amenitiesMap.get(row.Amenidad?.trim());

          if (!categoryId) {
            throw new Error(`Categoría Principal '${row['Categoría Principal']}' no encontrada`);
          }
          if (!parkId) {
            throw new Error(`Parque '${row.Parque}' no encontrado`);
          }

          // Preparar datos del activo
          const assetData = {
            name: row.Nombre?.trim(),
            description: row.Descripción?.trim() || null,
            serial_number: row['Número de Serie']?.trim() || null,
            category_id: categoryId,
            park_id: parkId,
            amenity_id: amenityId || null,
            location_description: row['Ubicación Descripción']?.trim() || null,
            latitude: row.Latitud ? parseFloat(row.Latitud) : null,
            longitude: row.Longitud ? parseFloat(row.Longitud) : null,
            status: translateStatusFromSpanish(row.Estado?.trim()) || 'active',
            condition: translateConditionFromSpanish(row.Condición?.trim()) || 'good',
            manufacturer: row.Fabricante?.trim() || null,
            model: row.Modelo?.trim() || null,
            acquisition_date: row['Fecha de Adquisición'] ? new Date(row['Fecha de Adquisición']) : null,
            acquisition_cost: row['Costo de Adquisición (MXN)'] ? parseFloat(row['Costo de Adquisición (MXN)'].replace(/[$,]/g, '')) : null,
            current_value: row['Valor Actual (MXN)'] ? parseFloat(row['Valor Actual (MXN)'].replace(/[$,]/g, '')) : null,
            maintenance_frequency: row['Frecuencia de Mantenimiento']?.trim() || null,
            expected_lifespan: row['Vida Útil Esperada (meses)'] ? parseInt(row['Vida Útil Esperada (meses)']) : null,
            qr_code: row['Código QR']?.trim() || null,
            notes: row.Notas?.trim() || null,
            created_at: new Date(),
            updated_at: new Date()
          };

          // Insertar en base de datos
          const query = `
            INSERT INTO assets (
              name, description, serial_number, category_id, park_id, amenity_id,
              location_description, latitude, longitude, status, condition,
              manufacturer, model, acquisition_date, acquisition_cost, current_value,
              maintenance_frequency, expected_lifespan, qr_code, notes,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
            )
          `;

          await pool.query(query, [
            assetData.name, assetData.description, assetData.serial_number,
            assetData.category_id, assetData.park_id, assetData.amenity_id,
            assetData.location_description, assetData.latitude, assetData.longitude,
            assetData.status, assetData.condition, assetData.manufacturer,
            assetData.model, assetData.acquisition_date, assetData.acquisition_cost,
            assetData.current_value, assetData.maintenance_frequency,
            assetData.expected_lifespan, assetData.qr_code, assetData.notes,
            assetData.created_at, assetData.updated_at
          ]);

          results.success++;

        } catch (error) {
          console.error(`Error en fila ${rowNumber}:`, error);
          results.errors.push({
            row: rowNumber,
            message: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }

      console.log(`✅ Importación completada: ${results.success} éxitos, ${results.errors.length} errores`);

      res.json({
        message: 'Importación procesada',
        success: results.success,
        errors: results.errors,
        total: records.length
      });

    } catch (error) {
      console.error("❌ Error en importación de CSV:", error);
      res.status(500).json({ 
        message: "Error al procesar archivo CSV",
        error: error instanceof Error ? error.message : 'Error desconocido',
        success: 0,
        errors: []
      });
    }
  });

  // Endpoint para obtener datos del reporte ejecutivo
  apiRouter.post("/assets/report-data", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('📊 Obteniendo datos para reporte ejecutivo');

      const { filters } = req.body;
      
      // Construir query SQL con filtros
      let whereConditions = ['1=1']; // Base condition
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (filters?.search && filters.search !== '') {
        whereConditions.push(`(a.name ILIKE $${paramIndex} OR a.description ILIKE $${paramIndex})`);
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      if (filters?.status && filters.status !== 'all') {
        whereConditions.push(`a.status = $${paramIndex}`);
        queryParams.push(filters.status);
        paramIndex++;
      }

      if (filters?.condition && filters.condition !== 'all') {
        whereConditions.push(`a.condition = $${paramIndex}`);
        queryParams.push(filters.condition);
        paramIndex++;
      }

      if (filters?.park && filters.park !== 'all') {
        const parkId = parseInt(filters.park);
        if (!isNaN(parkId)) {
          whereConditions.push(`a.park_id = $${paramIndex}`);
          queryParams.push(parkId);
          paramIndex++;
        }
      }

      if (filters?.category && filters.category !== 'all') {
        const categoryId = parseInt(filters.category);
        if (!isNaN(categoryId)) {
          whereConditions.push(`a.category_id = $${paramIndex}`);
          queryParams.push(categoryId);
          paramIndex++;
        }
      }

      const whereClause = whereConditions.join(' AND ');

      // Consultas para obtener datos del reporte
      const [
        statisticsResult,
        categoriesResult,
        parksResult,
        financialResult
      ] = await Promise.all([
        // Estadísticas generales
        pool.query(`
          SELECT 
            COUNT(*) as total_assets,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_assets,
            COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_assets,
            COUNT(CASE WHEN condition = 'excellent' THEN 1 END) as excellent_condition,
            COUNT(CASE WHEN condition = 'good' THEN 1 END) as good_condition,
            COUNT(CASE WHEN condition = 'fair' THEN 1 END) as fair_condition,
            COUNT(CASE WHEN condition = 'poor' THEN 1 END) as poor_condition,
            COALESCE(SUM(acquisition_cost), 0) as total_acquisition_cost,
            COALESCE(SUM(current_value), 0) as total_current_value
          FROM assets a
          WHERE ${whereClause}
        `, queryParams),

        // Distribución por categorías
        pool.query(`
          SELECT c.name as category, COUNT(a.id) as count,
                 COALESCE(SUM(a.current_value), 0) as total_value
          FROM asset_categories c
          LEFT JOIN assets a ON c.id = a.category_id AND (${whereClause.replace(/a\./g, 'a.')})
          WHERE c.parent_id IS NULL
          GROUP BY c.name
          ORDER BY count DESC
        `, queryParams),

        // Distribución por parques
        pool.query(`
          SELECT p.name as park, COUNT(a.id) as count,
                 COALESCE(SUM(a.current_value), 0) as total_value
          FROM parks p
          LEFT JOIN assets a ON p.id = a.park_id AND (${whereClause.replace(/a\./g, 'a.')})
          GROUP BY p.name
          ORDER BY count DESC
        `, queryParams),

        // Análisis financiero por año
        pool.query(`
          SELECT 
            EXTRACT(YEAR FROM acquisition_date) as year,
            COUNT(*) as assets_count,
            COALESCE(SUM(acquisition_cost), 0) as total_invested
          FROM assets a
          WHERE ${whereClause} AND acquisition_date IS NOT NULL
          GROUP BY EXTRACT(YEAR FROM acquisition_date)
          ORDER BY year DESC
          LIMIT 5
        `, queryParams)
      ]);

      const statistics = statisticsResult.rows[0];
      const categoriesStats = categoriesResult.rows;
      const parksStats = parksResult.rows;
      const financialStats = financialResult.rows;

      // Enviar datos JSON
      res.json({
        statistics,
        categoriesStats,
        parksStats,
        financialStats
      });

      console.log('✅ Datos de reporte obtenidos exitosamente');

    } catch (error) {
      console.error("❌ Error al obtener datos del reporte:", error);
      res.status(500).json({ 
        message: "Error al obtener datos del reporte",
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // Funciones auxiliares para traducir valores del español al inglés
  function translateStatusFromSpanish(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Activo': 'active',
      'Mantenimiento': 'maintenance',
      'Retirado': 'retired',
      'Dañado': 'damaged'
    };
    return statusMap[status] || status.toLowerCase();
  }

  function translateConditionFromSpanish(condition: string): string {
    const conditionMap: { [key: string]: string } = {
      'Excelente': 'excellent',
      'Bueno': 'good',
      'Regular': 'fair',
      'Malo': 'poor',
      'Crítico': 'critical'
    };
    return conditionMap[condition] || condition.toLowerCase();
  }
}