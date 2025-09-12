import { Router, Request, Response } from 'express';
import { db } from './db';
import { assetHistory, insertAssetHistorySchema } from '../shared/asset-schema';
import { assets, users } from '../shared/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * Registra las rutas para el historial de activos
 */
export function registerAssetHistoryRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  
  // Obtener historial de un activo específico
  apiRouter.get('/assets/:id/history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      const { pool } = await import("./db");

      // 🔧 Updated query to handle text changed_by field and provide frontend-expected field names
      const query = `
        SELECT 
          ah.id,
          ah.asset_id as "assetId",
          ah.change_type as "changeType",
          ah.description,
          ah.previous_value as "previousValue",
          ah.new_value as "newValue",
          ah.changed_by as "changedBy",
          ah.notes,
          ah.date,
          ah.created_at as "createdAt",
          ah.updated_at as "updatedAt",
          -- Try to get user info by joining with users table (changed_by might be user ID as text or username)
          COALESCE(u.full_name, u.username, ah.changed_by) as "userName",
          COALESCE(u.username, ah.changed_by) as "userUsername",
          -- Use created_at as timestamp for frontend compatibility
          ah.created_at as "timestamp",
          -- For now, set fieldName to change_type until we have better field tracking
          ah.change_type as "fieldName"
        FROM asset_history ah
        LEFT JOIN users u ON (
          -- Try to match changed_by as user ID (if it's numeric) or username
          CASE 
            WHEN ah.changed_by ~ '^[0-9]+$' THEN u.id::text = ah.changed_by
            ELSE u.username = ah.changed_by OR u.email = ah.changed_by
          END
        )
        WHERE ah.asset_id = $1
        ORDER BY ah.created_at DESC
      `;

      const result = await pool.query(query, [assetId]);
      
      console.log(`📋 Encontrados ${result.rows.length} registros de historial para activo ${assetId}`);
      console.log(`🔍 Muestra de datos:`, result.rows.slice(0, 1));
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching asset history:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // 🔒 SECURITY: RESTRICTED - Direct client history creation is BLOCKED to prevent forged entries
  // History entries are now automatically created server-side during asset operations
  apiRouter.post('/assets/:id/history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // 🚨 SECURITY BLOCK: Prevent direct client manipulation of asset history
      console.warn(`🚨 [SECURITY] Blocked attempt to directly create asset history entry from client. IP: ${req.ip}, User: ${(req as any).user?.id}`);
      
      res.status(403).json({ 
        error: 'ACCESO DENEGADO - Las entradas de historial se crean automáticamente',
        message: 'Por motivos de seguridad, las entradas de historial se crean automáticamente durante las operaciones de activos. No se permite la creación directa desde el cliente.',
        details: 'History entries are automatically created server-side during asset operations to prevent forged data.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('🚨 [SECURITY] Error in blocked history endpoint:', error);
      res.status(403).json({ error: 'Acceso denegado' });
    }
  });

  // Obtener resumen de historial (últimos cambios)
  apiRouter.get('/assets/history/recent', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const { pool } = await import("./db");

      const query = `
        SELECT 
          ah.id,
          ah.asset_id as "assetId",
          ah.change_type as "changeType",
          ah.description,
          ah.created_at as "createdAt",
          ah.changed_by as "changedBy",
          a.name as "assetName"
        FROM asset_history ah
        LEFT JOIN assets a ON ah.asset_id = a.id
        ORDER BY ah.created_at DESC
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
  apiRouter.get('/assets/history/stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { pool } = await import("./db");

      const query = `
        SELECT 
          change_type as "changeType",
          COUNT(*) as count,
          DATE_TRUNC('day', created_at) as date
        FROM asset_history 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY change_type, DATE_TRUNC('day', created_at)
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

// ⚠️ DEPRECATED: Use server/utils/assetHistoryLogger.ts for secure transactional logging
// These utility functions have been moved to the secure logger to ensure transactional integrity

// ⚠️ DEPRECATED: Use logAssetUpdate from server/utils/assetHistoryLogger.ts for secure transactional logging
// This function has been moved to the secure logger to ensure transactional integrity