/**
 * Rutas para la gestión de mantenimiento de árboles
 */
import { Router, Request, Response } from "express";
import { db } from "./db";
import { pool } from "./db";
import { 
  treeMaintenances, 
  trees, 
  treeSpecies,
  parks,
  insertTreeMaintenanceSchema
} from "@shared/schema";
import { eq, desc, and, like, or, gte, lte, isNull } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sql } from 'drizzle-orm';

/**
 * Registra las rutas relacionadas con la gestión de mantenimiento de árboles
 * @param app Aplicación Express
 * @param apiRouter Router de la API
 * @param isAuthenticated Middleware de autenticación
 */
export function registerTreeMaintenanceRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  // Obtener todos los mantenimientos de árboles con paginación
  apiRouter.get("/trees/maintenances", async (req: Request, res: Response) => {
    try {
      // Parámetros de paginación
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      
      // Parámetros de filtros
      const search = req.query.search as string || '';
      const type = req.query.type as string || 'all';
      const park = req.query.park as string || 'all';
      const treeId = req.query.treeId ? parseInt(req.query.treeId as string) : null;

      // Construir condiciones WHERE
      let whereConditions = [];
      let whereParams = [];
      
      if (treeId && !isNaN(treeId)) {
        whereConditions.push('tm.tree_id = ?');
        whereParams.push(treeId);
      }
      
      if (search) {
        whereConditions.push('(t.code ILIKE ? OR ts.common_name ILIKE ? OR p.name ILIKE ? OR tm.performed_by ILIKE ?)');
        const searchParam = `%${search}%`;
        whereParams.push(searchParam, searchParam, searchParam, searchParam);
      }
      
      if (type !== 'all') {
        whereConditions.push('tm.maintenance_type = ?');
        whereParams.push(type);
      }
      
      if (park !== 'all') {
        whereConditions.push('p.name = ?');
        whereParams.push(park);
      }
      
      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      
      // Contar total de registros
      const countQuery = `
        SELECT COUNT(*) as count
        FROM tree_maintenances tm
        LEFT JOIN trees t ON tm.tree_id = t.id
        LEFT JOIN parks p ON t.park_id = p.id
        LEFT JOIN tree_species ts ON t.species_id = ts.id
        ${whereClause}
      `;
      
      const countResult = await pool.query(countQuery, whereParams);
      const totalCount = parseInt(String(countResult.rows[0]?.count || 0));
      
      if (totalCount === 0) {
        return res.status(200).json({ 
          data: [], 
          pagination: {
            total: 0,
            totalPages: 0,
            page: page,
            limit: limit
          }
        });
      }
      
      // Consulta principal con datos disponibles en la tabla real
      const mainQuery = `
        SELECT 
          tm.id,
          tm.tree_id as "treeId",
          tm.maintenance_type as "maintenanceType",
          tm.maintenance_date as "maintenanceDate",
          tm.performed_by as "performedBy",
          tm.description,
          tm.notes,
          tm.next_maintenance_date as "nextMaintenanceDate",
          tm.created_at as "createdAt",
          COALESCE(t.code, 'N/A') as "treeCode",
          COALESCE(p.name, 'N/A') as "parkName",
          COALESCE(ts.common_name, 'N/A') as "speciesName",
          COALESCE(ts.scientific_name, 'N/A') as "scientificName"
        FROM 
          tree_maintenances tm
        LEFT JOIN 
          trees t ON tm.tree_id = t.id
        LEFT JOIN 
          parks p ON t.park_id = p.id
        LEFT JOIN 
          tree_species ts ON t.species_id = ts.id
        ${whereClause}
        ORDER BY tm.maintenance_date DESC, tm.created_at DESC
        LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}
      `;
      
      const result = await pool.query(mainQuery, [...whereParams, limit, offset]);
      
      const totalPages = Math.ceil(totalCount / limit);
      
      return res.status(200).json({
        data: result.rows,
        pagination: {
          total: totalCount,
          totalPages: totalPages,
          page: page,
          limit: limit
        }
      });
      
    } catch (error) {
      console.error('Error fetching tree maintenances:', error);
      return res.status(500).json({ 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Endpoint para exportar todos los mantenimientos a CSV
  apiRouter.get("/trees/maintenances/export-csv", async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          tm.id,
          COALESCE(t.code, 'N/A') as tree_code,
          COALESCE(ts.common_name, 'N/A') as species_name,
          COALESCE(ts.scientific_name, 'N/A') as scientific_name,
          COALESCE(p.name, 'N/A') as park_name,
          tm.maintenance_type,
          tm.maintenance_date,
          tm.performed_by,
          tm.description,
          tm.notes,
          tm.next_maintenance_date,
          tm.created_at
        FROM 
          tree_maintenances tm
        LEFT JOIN 
          trees t ON tm.tree_id = t.id
        LEFT JOIN 
          parks p ON t.park_id = p.id
        LEFT JOIN 
          tree_species ts ON t.species_id = ts.id
        ORDER BY tm.maintenance_date DESC, tm.created_at DESC
      `);
      
      const headers = [
        'ID',
        'Código Árbol',
        'Especie',
        'Nombre Científico',
        'Parque',
        'Tipo Mantenimiento',
        'Fecha Mantenimiento',
        'Realizado Por',
        'Descripción',
        'Notas',
        'Próximo Mantenimiento',
        'Fecha Creación'
      ];
      
      let csvContent = '\uFEFF' + headers.join(',') + '\n';
      
      result.rows.forEach(row => {
        const values = [
          row.id,
          `"${row.tree_code || ''}"`,
          `"${row.species_name || ''}"`,
          `"${row.scientific_name || ''}"`,
          `"${row.park_name || ''}"`,
          `"${row.maintenance_type || ''}"`,
          row.maintenance_date || '',
          `"${row.performed_by || ''}"`,
          `"${String(row.description || '').replace(/"/g, '""')}"`,
          `"${String(row.notes || '').replace(/"/g, '""')}"`,
          row.next_maintenance_date || '',
          row.created_at || ''
        ];
        csvContent += values.join(',') + '\n';
      });
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="mantenimientos_arboles.csv"');
      res.send(csvContent);
      
    } catch (error) {
      console.error('Error exporting maintenances to CSV:', error);
      return res.status(500).json({ 
        error: "Error al exportar mantenimientos",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Endpoint para crear un nuevo mantenimiento
  apiRouter.post("/trees/:id/maintenances", async (req: Request, res: Response) => {
    try {
      const treeId = parseInt(req.params.id);
      
      if (!treeId || isNaN(treeId)) {
        return res.status(400).json({ error: "ID de árbol inválido" });
      }
      
      // Verificar que el árbol existe
      const treeExists = await db.select({ id: trees.id }).from(trees).where(eq(trees.id, treeId));
      
      if (treeExists.length === 0) {
        return res.status(404).json({ error: "Árbol no encontrado" });
      }
      
      // Validación básica de campos requeridos
      if (!req.body.maintenanceType) {
        return res.status(400).json({ error: "El tipo de mantenimiento es requerido" });
      }
      
      if (!req.body.maintenanceDate) {
        return res.status(400).json({ error: "La fecha de mantenimiento es requerida" });
      }
      
      // Insertar el nuevo mantenimiento con solo los campos que existen en el esquema
      const [newMaintenance] = await db.insert(treeMaintenances).values({
        tree_id: treeId,
        maintenance_type: req.body.maintenanceType,
        maintenance_date: req.body.maintenanceDate,
        performed_by: req.body.performedBy,
        description: req.body.notes || req.body.description,
        notes: req.body.notes,
        next_maintenance_date: req.body.nextMaintenanceDate || null
      }).returning();
      
      return res.status(201).json({
        success: true,
        message: "Mantenimiento registrado correctamente",
        data: newMaintenance
      });
      
    } catch (error) {
      console.error('Error creating maintenance:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          details: fromZodError(error).toString()
        });
      }
      
      return res.status(500).json({ 
        error: "Error al crear mantenimiento",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Endpoint para importar mantenimientos desde CSV
  apiRouter.post("/trees/maintenances/import-csv", async (req: Request, res: Response) => {
    try {
      // Este endpoint necesitaría implementación de multer para manejar archivos
      // Por ahora devolvemos un placeholder
      return res.status(200).json({
        success: true,
        message: "Funcionalidad de importación en desarrollo",
        imported: 0
      });
    } catch (error) {
      console.error('Error importing maintenances from CSV:', error);
      return res.status(500).json({ 
        error: "Error al importar mantenimientos",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Endpoint para eliminar mantenimiento
  apiRouter.delete("/trees/maintenances/:id", async (req: Request, res: Response) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      
      if (!maintenanceId || isNaN(maintenanceId)) {
        return res.status(400).json({ error: "ID de mantenimiento inválido" });
      }
      
      const result = await db.execute(sql`
        DELETE FROM tree_maintenances 
        WHERE id = ${maintenanceId}
      `);
      
      return res.status(200).json({ 
        message: "Mantenimiento eliminado correctamente",
        id: maintenanceId 
      });
      
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      return res.status(500).json({ 
        error: "Error al eliminar mantenimiento",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Mantener el endpoint original para compatibilidad
  apiRouter.get("/trees/maintenances/legacy", async (req: Request, res: Response) => {
    try {
      // Verificar si hay un parámetro de ID de árbol específico
      const treeId = req.query.treeId ? parseInt(req.query.treeId as string) : null;
      
      // Si hay registros, procedemos con la consulta principal
      let result;
      
      if (treeId && !isNaN(treeId)) {
        // Consulta filtrada por ID de árbol
        result = await db.execute(sql`
          SELECT 
            tm.id,
            tm.tree_id,
            tm.maintenance_type,
            tm.maintenance_date,
            tm.performed_by,
            tm.notes,
            tm.created_at,
            t.species_id,
            p.id AS park_id,
            p.name AS park_name,
            ts.common_name AS species_name,
            ts.scientific_name,
            u.username AS performed_by_username,
            u.full_name AS performed_by_name
          FROM 
            tree_maintenances tm
          LEFT JOIN 
            trees t ON tm.tree_id = t.id
          LEFT JOIN 
            parks p ON t.park_id = p.id
          LEFT JOIN 
            tree_species ts ON t.species_id = ts.id
          LEFT JOIN
            users u ON tm.performed_by = u.id
          WHERE
            tm.tree_id = ${treeId}
          ORDER BY 
            tm.maintenance_date DESC
        `);
      } else {
        // Consulta sin filtro por ID
        result = await db.execute(sql`
          SELECT 
            tm.id,
            tm.tree_id,
            tm.maintenance_type,
            tm.maintenance_date,
            tm.performed_by,
            tm.notes,
            tm.created_at,
            t.species_id,
            p.id AS park_id,
            p.name AS park_name,
            ts.common_name AS species_name,
            ts.scientific_name,
            u.username AS performed_by_username,
            u.full_name AS performed_by_name
          FROM 
            tree_maintenances tm
          LEFT JOIN 
            trees t ON tm.tree_id = t.id
          LEFT JOIN 
            parks p ON t.park_id = p.id
          LEFT JOIN 
            tree_species ts ON t.species_id = ts.id
          LEFT JOIN
            users u ON tm.performed_by = u.id
          ORDER BY 
            tm.maintenance_date DESC
        `);
      }
      
      if (!result || !result.rows || result.rows.length === 0) {
        return res.status(200).json({ data: [] });
      }

          // Procesar los resultados
      const formattedMaintenances = [];
      
      if (result && result.rows) {
        for (const m of result.rows) {
          // Asegurar que tree_id sea tratado como número o usar 0 si es nulo
          const treeIdNum = m.tree_id ? parseInt(String(m.tree_id)) : 0;
          
          formattedMaintenances.push({
            id: m.id,
            treeId: treeIdNum,
            treeCode: `ARB-${treeIdNum.toString().padStart(5, '0')}`,
            maintenanceType: m.maintenance_type || 'Desconocido',
            maintenanceDate: m.maintenance_date,
            performedBy: m.performed_by,
            performedByName: m.performed_by_name || m.performed_by_username || `Usuario ${m.performed_by || ''}`,
            notes: m.notes || '',
            createdAt: m.created_at,
            parkId: m.park_id,
            parkName: m.park_name || 'Desconocido',
            speciesId: m.species_id,
            speciesName: m.species_name || 'Desconocida',
            scientificName: m.scientific_name || ''
          });
        }
      }
      
      // Devolver los resultados formateados
      return res.status(200).json({ data: formattedMaintenances });
    } catch (error) {
      console.error("Error al obtener mantenimientos de árboles:", error);
      return res.status(500).json({ error: "Error al obtener mantenimientos de árboles" });
    }
  });

  // Obtener resumen estadístico de mantenimientos
  apiRouter.get("/trees/maintenances/stats", async (_req: Request, res: Response) => {
    try {
      // Obtener conteo total de mantenimientos
      const totalResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM tree_maintenances
      `);
      const total = totalResult.rows?.[0]?.total || 0;
      
      // Obtener mantenimientos recientes (últimos 30 días)
      const recentResult = await db.execute(sql`
        SELECT COUNT(*) as recent 
        FROM tree_maintenances 
        WHERE maintenance_date >= CURRENT_DATE - INTERVAL '30 days'
      `);
      const recent = recentResult.rows?.[0]?.recent || 0;
      
      // Obtener conteo por tipo de mantenimiento
      const typeResult = await db.execute(sql`
        SELECT 
          maintenance_type, 
          COUNT(*) as count 
        FROM 
          tree_maintenances 
        GROUP BY 
          maintenance_type 
        ORDER BY 
          count DESC
      `);
      
      // Obtener conteo por mes (últimos 12 meses)
      const monthlyResult = await db.execute(sql`
        SELECT 
          DATE_TRUNC('month', maintenance_date) as month,
          COUNT(*) as count
        FROM 
          tree_maintenances
        WHERE 
          maintenance_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY 
          month
        ORDER BY 
          month ASC
      `);
      
      // Formatear los resultados por tipo
      const byType = typeResult.rows?.map(r => ({
        type: r.maintenance_type,
        count: r.count
      })) || [];
      
      // Formatear los resultados por mes
      const byMonth = monthlyResult.rows?.map(r => ({
        month: r.month,
        count: r.count
      })) || [];
      
      res.json({
        total,
        recent,
        byType,
        byMonth
      });
    } catch (error) {
      console.error("Error al obtener estadísticas de mantenimientos:", error);
      res.status(500).json({ error: "Error al obtener estadísticas de mantenimientos" });
    }
  });
}