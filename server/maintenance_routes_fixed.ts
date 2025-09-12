import { Router, Request, Response } from 'express';
import { db, pool } from './db';
import { eq, desc } from 'drizzle-orm';
import { logAssetMaintenance } from './utils/assetHistoryLogger';

/**
 * Registra las rutas para el módulo de mantenimientos de activos
 */
export function registerMaintenanceRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  // Obtener todos los mantenimientos con información del activo
  apiRouter.get('/asset-maintenances', async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          am.id,
          am.asset_id as "assetId",
          a.name as "assetName",
          am.maintenance_type as "maintenanceType",
          am.description,
          am.date,
          am.status,
          am.cost,
          am.performed_by as "performedBy",
          am.created_at as "createdAt"
        FROM asset_maintenances am
        LEFT JOIN assets a ON am.asset_id = a.id
        ORDER BY am.created_at DESC
      `;

      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching asset maintenances:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Obtener mantenimientos de un activo específico
  apiRouter.get('/assets/:id/maintenances', async (req: Request, res: Response) => {
    console.log(`🔧 MAINTENANCE_ROUTES_FIXED - Endpoint ejecutándose para activo ${req.params.id}`);
    try {
      const assetId = parseInt(req.params.id);

      const query = `
        SELECT 
          id,
          asset_id as "assetId",
          maintenance_type as "maintenanceType",
          description,
          date,
          performed_by as "performedBy",
          performer_id as "performerId",
          cost,
          findings,
          actions,
          next_maintenance_date as "nextMaintenanceDate",
          photos,
          status,
          notes,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM asset_maintenances
        WHERE asset_id = $1
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [assetId]);
      
      console.log(`📋 Devolviendo ${result.rows.length} mantenimientos para activo ${assetId}`);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching asset maintenances:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Crear nuevo mantenimiento con automatic secure history logging
  apiRouter.post('/assets/:id/maintenances', isAuthenticated, async (req: Request, res: Response) => {
    console.log('🔧 [SECURE] POST /assets/:id/maintenances - Solicitud recibida para activo:', req.params.id);
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const assetId = parseInt(req.params.id);
      const {
        maintenanceType,
        description,
        date,
        status,
        cost,
        performedBy,
        nextMaintenanceDate,
        notes
      } = req.body;

      console.log('🔧 [SECURE] Datos de mantenimiento recibidos en backend:', {
        assetId,
        maintenanceType,
        description,
        date,
        status,
        cost,
        performedBy,
        nextMaintenanceDate,
        notes
      });

      const query = `
        INSERT INTO asset_maintenances (
          asset_id, 
          maintenance_type, 
          description, 
          date, 
          status, 
          cost, 
          performed_by,
          next_maintenance_date,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await client.query(query, [
        assetId,
        maintenanceType,
        description,
        date,
        status || 'completed',
        cost || null,
        performedBy || null,
        nextMaintenanceDate || null,
        notes || null
      ]);

      // Mapear respuesta a camelCase
      const maintenance = {
        id: result.rows[0].id,
        assetId: result.rows[0].asset_id,
        date: result.rows[0].date,
        maintenanceType: result.rows[0].maintenance_type,
        description: result.rows[0].description,
        cost: result.rows[0].cost,
        performedBy: result.rows[0].performed_by,
        nextMaintenanceDate: result.rows[0].next_maintenance_date,
        status: result.rows[0].status,
        notes: result.rows[0].notes,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      };

      // 🔒 SECURE: Log maintenance action within the same transaction
      const userId = (req as any).user?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      await logAssetMaintenance(client, assetId, req.body, userId, ipAddress, userAgent);
      
      await client.query('COMMIT');
      console.log(`🔒 [SECURE] Maintenance created with automatic history logging for asset ${assetId}`);
      
      res.status(201).json(maintenance);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('🚨 [SECURE] Error creating maintenance - transaction rolled back:', error);
      res.status(500).json({ error: 'Error al crear el mantenimiento' });
    } finally {
      client.release();
    }
  });

  // Actualizar mantenimiento
  apiRouter.put('/asset-maintenances/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      const {
        maintenanceType,
        description,
        date,
        status,
        cost,
        performedBy
      } = req.body;

      const query = `
        UPDATE asset_maintenances 
        SET 
          maintenance_type = $1,
          description = $2,
          date = $3,
          status = $4,
          cost = $5,
          performed_by = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `;

      const result = await pool.query(query, [
        maintenanceType,
        description,
        date,
        status,
        cost,
        performedBy,
        maintenanceId
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Mantenimiento no encontrado' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating maintenance:', error);
      res.status(500).json({ error: 'Error al actualizar el mantenimiento' });
    }
  });

  // Actualizar solo el estado del mantenimiento
  apiRouter.patch('/asset-maintenances/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      const { status } = req.body;

      const query = `
        UPDATE asset_maintenances 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [status, maintenanceId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Mantenimiento no encontrado' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      res.status(500).json({ error: 'Error al actualizar el estado del mantenimiento' });
    }
  });

  // Eliminar mantenimiento
  apiRouter.delete('/asset-maintenances/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const maintenanceId = parseInt(req.params.id);

      const query = `
        DELETE FROM asset_maintenances 
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [maintenanceId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Mantenimiento no encontrado' });
      }

      res.json({ message: 'Mantenimiento eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      res.status(500).json({ error: 'Error al eliminar el mantenimiento' });
    }
  });

  // Obtener estadísticas de mantenimientos
  apiRouter.get('/maintenance-stats', async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          status,
          maintenance_type
        FROM asset_maintenances
        GROUP BY status, maintenance_type
      `;

      const result = await pool.query(query);
      
      const stats = result.rows.reduce((acc: any, row: any) => {
        acc.total = (acc.total || 0) + parseInt(row.total);
        acc.byStatus = acc.byStatus || {};
        acc.byType = acc.byType || {};
        acc.byStatus[row.status] = (acc.byStatus[row.status] || 0) + parseInt(row.total);
        acc.byType[row.maintenance_type] = (acc.byType[row.maintenance_type] || 0) + parseInt(row.total);
        return acc;
      }, {});

      res.json(stats);
    } catch (error) {
      console.error('Error fetching maintenance stats:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  });
}