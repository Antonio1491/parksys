import { Router, Request, Response } from 'express';
import { db } from './db';
import { assetHistory, assets, users, insertAssetHistorySchema } from '../shared/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * Registra las rutas para el historial de activos
 */
export function registerAssetHistoryRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  
  // Obtener historial de un activo específico
  apiRouter.get('/assets/:id/history', async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      const { pool } = await import("./db");

      const query = `
        SELECT 
          ah.id,
          ah.asset_id as "assetId",
          ah.change_type as "changeType",
          ah.field_name as "fieldName",
          ah.previous_value as "previousValue",
          ah.new_value as "newValue",
          ah.description,
          ah.user_id as "userId",
          ah.notes,
          ah.timestamp,
          ah.ip_address as "ipAddress",
          u.full_name as "userName",
          u.username as "userUsername"
        FROM asset_history ah
        LEFT JOIN users u ON ah.user_id = u.id
        WHERE ah.asset_id = $1
        ORDER BY ah.timestamp DESC
      `;

      const result = await pool.query(query, [assetId]);
      
      console.log(`📋 Encontrados ${result.rows.length} registros de historial para activo ${assetId}`);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching asset history:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Crear nueva entrada de historial
  apiRouter.post('/assets/:id/history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      
      // Validar datos de entrada con Zod
      const validationResult = insertAssetHistorySchema.safeParse({
        assetId,
        ...req.body
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Datos de entrada inválidos',
          details: validationResult.error.errors 
        });
      }

      const {
        changeType,
        fieldName,
        previousValue,
        newValue,
        description,
        notes
      } = validationResult.data;

      const userId = (req as any).user?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const { pool } = await import("./db");

      const query = `
        INSERT INTO asset_history (
          asset_id, change_type, field_name, previous_value, 
          new_value, description, user_id, notes, 
          ip_address, user_agent, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING 
          id,
          asset_id as "assetId",
          change_type as "changeType",
          field_name as "fieldName",
          previous_value as "previousValue",
          new_value as "newValue",
          description,
          user_id as "userId",
          notes,
          timestamp
      `;

      const result = await pool.query(query, [
        assetId,
        changeType,
        fieldName || null,
        previousValue || null,
        newValue || null,
        description,
        userId,
        notes || null,
        ipAddress || null,
        userAgent || null
      ]);

      // Obtener datos del usuario para la respuesta consistente - SIEMPRE incluir campos
      let createdEntry = result.rows[0];
      let userName = null;
      let userUsername = null;
      
      if (userId) {
        const userQuery = `
          SELECT 
            u.full_name as "userName",
            u.username as "userUsername"
          FROM users u 
          WHERE u.id = $1
        `;
        const userResult = await pool.query(userQuery, [userId]);
        if (userResult.rows.length > 0) {
          userName = userResult.rows[0].userName;
          userUsername = userResult.rows[0].userUsername;
        }
      }
      
      // ALWAYS include userName and userUsername for consistent response shape
      createdEntry = {
        ...createdEntry,
        userName,
        userUsername
      };

      console.log(`✅ Nueva entrada de historial creada para activo ${assetId}: ${changeType}`);
      res.status(201).json(createdEntry);
    } catch (error) {
      console.error('Error creating asset history entry:', error);
      res.status(500).json({ error: 'Error al crear la entrada de historial' });
    }
  });

  // Obtener resumen de historial (últimos cambios)
  apiRouter.get('/assets/history/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const { pool } = await import("./db");

      const query = `
        SELECT 
          ah.id,
          ah.asset_id as "assetId",
          ah.change_type as "changeType",
          ah.description,
          ah.timestamp,
          u.full_name as "userName",
          a.name as "assetName"
        FROM asset_history ah
        LEFT JOIN users u ON ah.user_id = u.id
        LEFT JOIN assets a ON ah.asset_id = a.id
        ORDER BY ah.timestamp DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);
      
      console.log(`📋 Encontrados ${result.rows.length} registros recientes de historial`);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching recent asset history:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Obtener estadísticas de historial
  apiRouter.get('/assets/history/stats', async (req: Request, res: Response) => {
    try {
      const { pool } = await import("./db");

      const query = `
        SELECT 
          change_type as "changeType",
          COUNT(*) as count,
          DATE_TRUNC('day', timestamp) as date
        FROM asset_history 
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY change_type, DATE_TRUNC('day', timestamp)
        ORDER BY date DESC, count DESC
      `;

      const result = await pool.query(query);
      
      console.log(`📊 Estadísticas de historial calculadas: ${result.rows.length} registros`);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching asset history stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
}

/**
 * Función de utilidad para registrar cambios automáticamente
 */
export async function logAssetChange(
  assetId: number,
  changeType: string,
  description: string,
  fieldName?: string,
  previousValue?: any,
  newValue?: any,
  userId?: number,
  notes?: string
) {
  try {
    const { pool } = await import("./db");

    const query = `
      INSERT INTO asset_history (
        asset_id, change_type, field_name, previous_value, 
        new_value, description, user_id, notes, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;

    await pool.query(query, [
      assetId,
      changeType,
      fieldName || null,
      previousValue ? String(previousValue) : null,
      newValue ? String(newValue) : null,
      description,
      userId || null,
      notes || null
    ]);

    console.log(`📝 Cambio registrado para activo ${assetId}: ${changeType} - ${description}`);
    return true;
  } catch (error) {
    console.error('Error logging asset change:', error);
    return false;
  }
}

/**
 * Función para comparar objetos y registrar cambios campo por campo
 */
export async function logAssetUpdate(
  assetId: number,
  previousData: any,
  newData: any,
  userId?: number
) {
  const fieldLabels: { [key: string]: string } = {
    name: 'Nombre',
    status: 'Estado',
    condition: 'Condición',
    parkId: 'Parque',
    categoryId: 'Categoría',
    manufacturer: 'Fabricante',
    model: 'Modelo',
    serialNumber: 'Número de Serie',
    acquisitionCost: 'Costo de Adquisición',
    currentValue: 'Valor Actual',
    responsiblePersonId: 'Responsable',
    locationDescription: 'Ubicación',
    notes: 'Notas'
  };

  try {
    const changes = [];
    
    // Comparar cada campo relevante
    for (const [field, label] of Object.entries(fieldLabels)) {
      const oldValue = previousData[field];
      const newValue = newData[field];
      
      if (oldValue !== newValue) {
        await logAssetChange(
          assetId,
          'updated',
          `Campo '${label}' actualizado`,
          field,
          oldValue,
          newValue,
          userId,
          `Cambio de '${oldValue || 'N/A'}' a '${newValue || 'N/A'}'`
        );
        changes.push({ field, oldValue, newValue });
      }
    }
    
    console.log(`🔄 Registrados ${changes.length} cambios para activo ${assetId}`);
    return changes;
  } catch (error) {
    console.error('Error logging asset update:', error);
    return [];
  }
}