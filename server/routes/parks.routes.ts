import { Router, Request, Response } from 'express';
import { pool, db } from '../db';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { parkImageUpload, documentUpload, videoUpload, memoryUpload } from '../middleware/upload';
import { insertParkSchema, insertCommentSchema, insertIncidentSchema, insertParkEvaluationSchema } from '@shared/schema';
import * as schema from '@shared/schema';
import { ZodError, z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { generateParkPrefix } from '../code-generator';
import { processImportFile } from '../api/parksImport';
import { replitObjectStorage } from '../objectStorage-replit';
import { sql, eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

const router = Router();

// =============================================================================
// SECCIÓN 1: RUTAS PÚBLICAS - LISTADOS
// =============================================================================

/**
 * GET /parks - Listar todos los parques
 * Soporta variantes: list, card, full, legacy
 * Query params: variant, parkType, postalCode, municipality, search, amenities
 */
router.get('/', async (req: Request, res: Response) => {
  console.log('🚀 [PARKS] GET / - Query:', req.query);
  try {
    const { 
      getParksListVariant, 
      getParksCardVariant, 
      getParksFullVariant,
      getParksDirectly 
    } = await import('../direct-park-queries');

    const variant = String(req.query.variant || 'full').toLowerCase();

    // Variante LIST - Para dropdowns y selects
    if (variant === 'list') {
      const parks = await getParksListVariant();
      return res.json(parks);
    }

    // Preparar filtros
    const filters: any = {};
    if (req.query.parkType) filters.parkType = String(req.query.parkType);
    if (req.query.postalCode) filters.postalCode = String(req.query.postalCode);
    if (req.query.municipality) filters.municipality = String(req.query.municipality);
    if (req.query.search) filters.search = String(req.query.search);

    // Filtro de amenidades
    if (req.query.amenities) {
      const amenityIds = String(req.query.amenities)
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));
      if (amenityIds.length > 0) filters.amenities = amenityIds;
    }

    // Variante CARD - Para tarjetas con datos mínimos
    if (variant === 'card') {
      const parks = await getParksCardVariant(filters);
      return res.json({ data: parks });
    }

    // Variante FULL (default) - Datos completos
    if (variant === 'full' || variant === 'optimized') {
      const parks = await getParksFullVariant(filters);
      return res.json({ data: parks });
    }

    // Variante LEGACY - Compatibilidad con código antiguo
    if (variant === 'legacy') {
      const parks = await getParksDirectly(filters);
      if (req.query.simple === 'true') {
        return res.json(parks.map(p => ({ id: p.id, name: p.name, location: p.location })));
      }
      return res.json({ data: parks });
    }

    // Default: FULL
    const parks = await getParksFullVariant(filters);
    res.json({ data: parks });

  } catch (error) {
    console.error('❌ [PARKS] Error en GET /:', error);
    res.status(500).json({ message: 'Error fetching parks' });
  }
});

/**
 * GET /parks/dashboard - Dashboard estadístico de parques
 */
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const { getParksDirectly } = await import('../direct-park-queries');
    const parks = await getParksDirectly();

    const dashboard = {
      totalParks: parks.length,
      parksByType: {} as Record<string, number>,
      parksByStatus: {} as Record<string, number>,
      totalArea: 0,
      averageArea: 0
    };

    parks.forEach(park => {
      const type = park.parkType || 'Sin tipo';
      dashboard.parksByType[type] = (dashboard.parksByType[type] || 0) + 1;

      const status = park.status || 'Sin estado';
      dashboard.parksByStatus[status] = (dashboard.parksByStatus[status] || 0) + 1;

      if (park.area) dashboard.totalArea += Number(park.area);
    });

    dashboard.averageArea = parks.length > 0 ? dashboard.totalArea / parks.length : 0;
    res.json(dashboard);
  } catch (error) {
    console.error('Error getting park dashboard:', error);
    res.status(500).json({ message: 'Error fetching dashboard' });
  }
});

/**
 * GET /parks/export/csv - Exportar parques a CSV
 */
router.get('/export/csv', async (req: Request, res: Response) => {
  try {
    const { getParksDirectly } = await import('../direct-park-queries');
    const parks = await getParksDirectly();

    if (!parks || parks.length === 0) {
      return res.status(404).json({ message: 'No parks found to export' });
    }

    const csvData = parks.map(park => ({
      'ID': park.id,
      'Nombre': park.name,
      'Tipo de Parque': park.parkType || 'N/A',
      'Descripción': park.description || 'N/A',
      'Dirección': park.address || 'N/A',
      'Código Postal': park.postalCode || 'N/A',
      'Área (m²)': park.area || 'N/A',
      'Año de Fundación': park.foundationYear || 'N/A',
      'Administrador': park.administrator || 'N/A',
      'Estado de Conservación': park.conservationStatus || 'N/A',
      'Email de Contacto': park.contactEmail || 'N/A',
      'Teléfono de Contacto': park.contactPhone || 'N/A',
      'Latitud': park.latitude || 'N/A',
      'Longitud': park.longitude || 'N/A',
      'Certificaciones': park.certificaciones || 'N/A'
    }));

    const headers = Object.keys(csvData[0]);
    const csvRows = [headers.join(',')];

    csvData.forEach(row => {
      const values = headers.map(header => {
        const value = (row as any)[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=parques.csv');
    res.send('\uFEFF' + csvContent);

  } catch (error) {
    console.error('Error exporting parks to CSV:', error);
    res.status(500).json({ message: 'Error exporting parks' });
  }
});

/**
 * GET /parks/export/xlsx - Exportar parques a Excel
 */
router.get('/export/xlsx', async (req: Request, res: Response) => {
  try {
    const XLSX = await import('xlsx');
    const { getParksDirectly } = await import('../direct-park-queries');
    const parks = await getParksDirectly();

    if (!parks || parks.length === 0) {
      return res.status(404).json({ message: 'No parks found to export' });
    }

    const exportData = parks.map(park => ({
      'ID': park.id,
      'Nombre': park.name,
      'Tipo': park.parkType || '',
      'Descripción': park.description || '',
      'Dirección': park.address || '',
      'Código Postal': park.postalCode || '',
      'Área (m²)': park.area || '',
      'Año Fundación': park.foundationYear || '',
      'Administrador': park.administrator || '',
      'Email': park.contactEmail || '',
      'Teléfono': park.contactPhone || '',
      'Latitud': park.latitude || '',
      'Longitud': park.longitude || '',
      'Certificaciones': park.certificaciones || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Parques');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=parques.xlsx');
    res.send(buffer);

  } catch (error) {
    console.error('Error exporting parks to Excel:', error);
    res.status(500).json({ message: 'Error exporting parks' });
  }
});

// =============================================================================
// SECCIÓN 2: RUTAS PROTEGIDAS - MÉTRICAS Y SUMMARY (DEBE IR ANTES DE /:id)
// =============================================================================

/**
 * GET /parks/summary - Métricas consolidadas para múltiples parques
 * OPTIMIZADO: Resuelve problema N+1 con queries agregadas
 * Query: ?ids=1,2,3,4
 */
router.get('/summary', isAuthenticated, requirePermission('management:parks:parks:view'), async (req: Request, res: Response) => {
  try {
    console.log('🔥 [PARKS-SUMMARY] Iniciando endpoint');
    const idsParam = req.query.ids as string;

    if (!idsParam) {
      return res.status(400).json({ message: 'Missing ids parameter' });
    }

    const parkIds = idsParam.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));

    if (parkIds.length === 0) {
      return res.status(400).json({ message: 'No valid park IDs provided' });
    }

    const summary: Record<number, any> = {};

    // Inicializar todos los parques
    parkIds.forEach(id => {
      summary[id] = {
        metrics: null,
        incidents: { total: 0, priorityBreakdown: { high: 0, medium: 0, low: 0 } },
        assets: { total: 0, typeBreakdown: { preventive: 0, corrective: 0, emergency: 0 } },
        reports: { total: 0, typeBreakdown: { complaint: 0, suggestion: 0, compliment: 0 } },
        schedule: { total: 0, breakdown: { activities: 0, events: 0 } }
      };
    });

    // 1. Métricas de evaluaciones (query agregada)
    const metricsQuery = `
      SELECT 
        park_id,
        ROUND(AVG(overall_rating), 1) as average_rating,
        COUNT(*) as total_evaluations,
        ROUND(AVG(cleanliness), 1) as avg_cleanliness,
        ROUND(AVG(safety), 1) as avg_safety,
        ROUND(AVG(maintenance), 1) as avg_maintenance,
        ROUND(AVG(accessibility), 1) as avg_accessibility,
        ROUND(AVG(amenities), 1) as avg_amenities,
        ROUND(AVG(activities), 1) as avg_activities,
        ROUND(AVG(staff), 1) as avg_staff,
        ROUND(AVG(natural_beauty), 1) as avg_natural_beauty
      FROM park_evaluations 
      WHERE park_id = ANY($1)
      GROUP BY park_id
    `;
    const metricsResult = await pool.query(metricsQuery, [parkIds]);

    metricsResult.rows.forEach((row: any) => {
      summary[row.park_id].metrics = {
        averageRating: row.average_rating || 0,
        totalEvaluations: parseInt(row.total_evaluations) || 0,
        ratingBreakdown: {
          cleanliness: row.avg_cleanliness || 0,
          safety: row.avg_safety || 0,
          maintenance: row.avg_maintenance || 0,
          accessibility: row.avg_accessibility || 0,
          amenities: row.avg_amenities || 0,
          activities: row.avg_activities || 0,
          staff: row.avg_staff || 0,
          naturalBeauty: row.avg_natural_beauty || 0
        }
      };
    });

    // 2. Incidentes pendientes
    const incidentsQuery = `
      SELECT 
        park_id,
        priority,
        COUNT(*) as count
      FROM incidents 
      WHERE park_id = ANY($1) 
      AND status NOT IN ('resolved', 'closed', 'cancelled')
      GROUP BY park_id, priority
    `;
    const incidentsResult = await pool.query(incidentsQuery, [parkIds]);

    incidentsResult.rows.forEach((row: any) => {
      const parkId = row.park_id;
      const priority = row.priority;
      const count = parseInt(row.count);

      summary[parkId].incidents.total += count;
      if (priority === 'high') summary[parkId].incidents.priorityBreakdown.high = count;
      else if (priority === 'medium') summary[parkId].incidents.priorityBreakdown.medium = count;
      else if (priority === 'low') summary[parkId].incidents.priorityBreakdown.low = count;
    });

    // 3. Activos en mantenimiento
    const assetsQuery = `
      SELECT 
        a.park_id,
        am.maintenance_type,
        COUNT(*) as count
      FROM asset_maintenances am
      JOIN assets a ON am.asset_id = a.id
      WHERE a.park_id = ANY($1)
      AND am.status IN ('scheduled', 'in_progress')
      GROUP BY a.park_id, am.maintenance_type
    `;
    const assetsResult = await pool.query(assetsQuery, [parkIds]);

    assetsResult.rows.forEach((row: any) => {
      const parkId = row.park_id;
      const maintenanceType = row.maintenance_type;
      const count = parseInt(row.count);

      summary[parkId].assets.total += count;
      if (maintenanceType === 'preventive') summary[parkId].assets.typeBreakdown.preventive = count;
      else if (maintenanceType === 'corrective') summary[parkId].assets.typeBreakdown.corrective = count;
      else if (maintenanceType === 'emergency') summary[parkId].assets.typeBreakdown.emergency = count;
    });

    // 4. Reportes pendientes
    const reportsQuery = `
      SELECT 
        park_id,
        form_type,
        COUNT(*) as count
      FROM park_feedback 
      WHERE park_id = ANY($1)
      AND status IN ('pending', 'under_review')
      GROUP BY park_id, form_type
    `;
    const reportsResult = await pool.query(reportsQuery, [parkIds]);

    reportsResult.rows.forEach((row: any) => {
      const parkId = row.park_id;
      const formType = row.form_type;
      const count = parseInt(row.count);

      summary[parkId].reports.total += count;
      if (formType === 'report_problem') summary[parkId].reports.typeBreakdown.complaint = count;
      else if (formType === 'suggest_improvement') summary[parkId].reports.typeBreakdown.suggestion = count;
      else if (formType === 'share') summary[parkId].reports.typeBreakdown.compliment = count;
    });

    // 5. Próximas actividades y eventos
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const scheduleQuery = `
      SELECT 
        park_id,
        'activity' as type,
        COUNT(*) as count
      FROM activities 
      WHERE park_id = ANY($1)
      AND start_date >= $2 AND start_date <= $3
      GROUP BY park_id

      UNION ALL

      SELECT 
        p.id as park_id,
        'event' as type,
        COUNT(*) as count
      FROM events e
      INNER JOIN parks p ON true  
      WHERE p.id = ANY($1)
      AND e.location ILIKE '%' || p.name || '%'
      AND e.start_date >= $2 AND e.start_date <= $3
      GROUP BY p.id
    `;
    const scheduleResult = await pool.query(scheduleQuery, [parkIds, now, thirtyDaysFromNow]);

    scheduleResult.rows.forEach((row: any) => {
      const parkId = row.park_id;
      const type = row.type;
      const count = parseInt(row.count);

      summary[parkId].schedule.total += count;
      if (type === 'activity') summary[parkId].schedule.breakdown.activities = count;
      else if (type === 'event') summary[parkId].schedule.breakdown.events = count;
    });

    res.json(summary);
  } catch (error) {
    console.error('Error fetching parks summary:', error);
    res.status(500).json({ message: 'Error fetching parks summary' });
  }
});

/**
 * GET /parks/:id/metrics - Métricas individuales de evaluación
 */
router.get('/:id/metrics', isAuthenticated, requirePermission('management:parks:parks:view'), async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);

    if (isNaN(parkId)) {
      return res.status(400).json({ message: 'Invalid park ID' });
    }

    const evaluationsResult = await db.select({
      overallRating: schema.parkEvaluations.overallRating,
      cleanliness: schema.parkEvaluations.cleanliness,
      safety: schema.parkEvaluations.safety,
      maintenance: schema.parkEvaluations.maintenance,
      accessibility: schema.parkEvaluations.accessibility,
      amenities: schema.parkEvaluations.amenities,
      activities: schema.parkEvaluations.activities,
      staff: schema.parkEvaluations.staff,
      naturalBeauty: schema.parkEvaluations.naturalBeauty
    })
    .from(schema.parkEvaluations)
    .where(eq(schema.parkEvaluations.parkId, parkId));

    if (evaluationsResult.length === 0) {
      return res.json({
        averageRating: null,
        totalEvaluations: 0,
        ratingBreakdown: null
      });
    }

    const totalRatings = evaluationsResult.reduce((sum, evaluation) => sum + (evaluation.overallRating || 0), 0);
    const averageRating = totalRatings / evaluationsResult.length;

    const categoryAverages = {
      cleanliness: evaluationsResult.reduce((sum, e) => sum + (e.cleanliness || 0), 0) / evaluationsResult.length,
      safety: evaluationsResult.reduce((sum, e) => sum + (e.safety || 0), 0) / evaluationsResult.length,
      maintenance: evaluationsResult.reduce((sum, e) => sum + (e.maintenance || 0), 0) / evaluationsResult.length,
      accessibility: evaluationsResult.reduce((sum, e) => sum + (e.accessibility || 0), 0) / evaluationsResult.length,
      amenities: evaluationsResult.reduce((sum, e) => sum + (e.amenities || 0), 0) / evaluationsResult.length,
      activities: evaluationsResult.reduce((sum, e) => sum + (e.activities || 0), 0) / evaluationsResult.length,
      staff: evaluationsResult.reduce((sum, e) => sum + (e.staff || 0), 0) / evaluationsResult.length,
      naturalBeauty: evaluationsResult.reduce((sum, e) => sum + (e.naturalBeauty || 0), 0) / evaluationsResult.length
    };

    res.json({
      averageRating: Math.round(averageRating * 10) / 10,
      totalEvaluations: evaluationsResult.length,
      ratingBreakdown: categoryAverages
    });
  } catch (error) {
    console.error('Error fetching park metrics:', error);
    res.status(500).json({ message: 'Error fetching park metrics' });
  }
});

/**
 * GET /parks/:id/pending-incidents - Incidencias pendientes del parque
 */
router.get('/:id/pending-incidents', isAuthenticated, requirePermission('management:parks:parks:view'), async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);

    if (isNaN(parkId)) {
      return res.status(400).json({ message: 'Invalid park ID' });
    }

    const pendingIncidents = await db.select({
      id: schema.incidents.id,
      title: schema.incidents.title,
      incidentType: schema.incidents.incidentType,
      status: schema.incidents.status,
      priority: schema.incidents.priority,
      createdAt: schema.incidents.createdAt
    })
    .from(schema.incidents)
    .where(eq(schema.incidents.parkId, parkId));

    const pending = pendingIncidents.filter(incident => 
      incident.status !== 'resolved' && 
      incident.status !== 'closed' && 
      incident.status !== 'cancelled'
    );

    const priorityCount = {
      high: pending.filter(i => i.priority === 'high').length,
      medium: pending.filter(i => i.priority === 'medium').length,
      low: pending.filter(i => i.priority === 'low').length
    };

    res.json({
      total: pending.length,
      incidents: pending,
      priorityBreakdown: priorityCount
    });
  } catch (error) {
    console.error('Error fetching pending incidents:', error);
    res.status(500).json({ message: 'Error fetching pending incidents' });
  }
});

/**
 * GET /parks/:id/assets-in-maintenance - Activos en mantenimiento
 */
router.get('/:id/assets-in-maintenance', isAuthenticated, requirePermission('management:parks:parks:view'), async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);

    if (isNaN(parkId)) {
      return res.status(400).json({ message: 'Invalid park ID' });
    }

    const assetsInMaintenance = await db.select({
      assetId: schema.assets.id,
      assetName: schema.assets.name,
      maintenanceId: schema.assetMaintenances.id,
      maintenanceType: schema.assetMaintenances.maintenanceType,
      status: schema.assetMaintenances.status,
      date: schema.assetMaintenances.date,
      nextMaintenanceDate: schema.assetMaintenances.nextMaintenanceDate
    })
    .from(schema.assetMaintenances)
    .innerJoin(schema.assets, eq(schema.assetMaintenances.assetId, schema.assets.id))
    .where(eq(schema.assets.parkId, parkId));

    const activeMaintenance = assetsInMaintenance.filter(maintenance => 
      maintenance.status === 'scheduled' || 
      maintenance.status === 'in_progress'
    );

    const typeCount = {
      preventive: activeMaintenance.filter(m => m.maintenanceType === 'preventive').length,
      corrective: activeMaintenance.filter(m => m.maintenanceType === 'corrective').length,
      emergency: activeMaintenance.filter(m => m.maintenanceType === 'emergency').length
    };

    res.json({
      total: activeMaintenance.length,
      assets: activeMaintenance,
      typeBreakdown: typeCount
    });
  } catch (error) {
    console.error('Error fetching assets in maintenance:', error);
    res.status(500).json({ message: 'Error fetching assets in maintenance' });
  }
});

/**
 * GET /parks/:id/reports - Reportes pendientes del parque
 */
router.get('/:id/reports', isAuthenticated, requirePermission('management:parks:parks:view'), async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);

    if (isNaN(parkId)) {
      return res.status(400).json({ message: 'Invalid park ID' });
    }

    const pendingReports = await pool.query(`
      SELECT 
        id,
        name as "visitorName",
        form_type as "feedbackType",
        message,
        status,
        created_at as "createdAt"
      FROM park_feedback 
      WHERE park_id = $1 
      AND status IN ('pending', 'under_review')
      ORDER BY created_at DESC
    `, [parkId]);

    const typeCount = {
      complaint: pendingReports.rows.filter((r: any) => r.feedbackType === 'complaint').length,
      suggestion: pendingReports.rows.filter((r: any) => r.feedbackType === 'suggestion').length,
      compliment: pendingReports.rows.filter((r: any) => r.feedbackType === 'compliment').length
    };

    res.json({
      total: pendingReports.rows.length,
      reports: pendingReports.rows,
      typeBreakdown: typeCount
    });
  } catch (error) {
    console.error('Error fetching pending reports:', error);
    res.status(500).json({ message: 'Error fetching pending reports' });
  }
});

/**
 * GET /parks/:id/upcoming-schedule - Actividades y eventos próximos
 */
router.get('/:id/upcoming-schedule', isAuthenticated, requirePermission('management:parks:parks:view'), async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);

    if (isNaN(parkId)) {
      return res.status(400).json({ message: 'Invalid park ID' });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Actividades próximas
    const upcomingActivities = await db.select({
      id: schema.activities.id,
      title: schema.activities.title,
      startDate: schema.activities.startDate,
      endDate: schema.activities.endDate,
      category: schema.activities.category,
      type: sql<string>`'activity'`.as('type')
    })
    .from(schema.activities)
    .where(eq(schema.activities.parkId, parkId));

    // Eventos próximos
    const parkResult = await db.select({ name: schema.parks.name })
      .from(schema.parks)
      .where(eq(schema.parks.id, parkId));

    const parkName = parkResult[0]?.name || '';

    const upcomingEvents = await pool.query(`
      SELECT id, title, start_date as "startDate", end_date as "endDate", 
             category, 'event' as type
      FROM events 
      WHERE location ILIKE $1
      AND start_date >= $2 AND start_date <= $3
      ORDER BY start_date
    `, [`%${parkName}%`, now, thirtyDaysFromNow]);

    const schedule = [
      ...upcomingActivities.filter(a => {
        const startDate = new Date(a.startDate);
        return startDate >= now && startDate <= thirtyDaysFromNow;
      }),
      ...upcomingEvents.rows
    ].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    res.json({
      total: schedule.length,
      schedule,
      breakdown: {
        activities: upcomingActivities.length,
        events: upcomingEvents.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching upcoming schedule:', error);
    res.status(500).json({ message: 'Error fetching upcoming schedule' });
  }
});

/**
 * GET /parks/:id/details - Detalles completos del parque (vista admin)
 */
router.get('/:id/details', async (req: Request, res: Response) => {
  try {
    const parkId = parseInt(req.params.id);
    console.log(`[DETAILS] Obteniendo detalles del parque ${parkId}`);

    const park = await storage.getPark(parkId);
    if (!park) {
      return res.status(404).json({ error: "Parque no encontrado" });
    }

    // Datos extendidos
    const extendedParks = await storage.getExtendedParks();
    const extendedPark = extendedParks.find(p => p.id === parkId);

    const amenities = extendedPark?.amenities || [];
    const images = extendedPark?.images || [];

    // Actividades
    const activities = await storage.getAllActivities();
    const parkActivities = activities.filter(activity => activity.parkId === parkId).slice(0, 20);

    // Árboles
    const treesQuery = await pool.query(
      'SELECT id, species_id, condition, planting_date, last_maintenance_date, location_description, code FROM trees WHERE park_id = $1',
      [parkId]
    );
    const parkTrees = treesQuery.rows;

    const treeStatsQuery = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN condition = 'Bueno' THEN 1 END) as good,
        COUNT(CASE WHEN condition = 'Regular' THEN 1 END) as regular,
        COUNT(CASE WHEN condition = 'Malo' THEN 1 END) as bad
      FROM trees WHERE park_id = $1`,
      [parkId]
    );
    const treeStats = treeStatsQuery.rows[0];

    // Voluntarios
    const volunteersQuery = await pool.query(
      `SELECT id, full_name, email, phone, skills, status, preferred_park_id,
              available_hours, previous_experience, age, gender, created_at,
              profile_image_url, address, emergency_contact, emergency_phone,
              legal_consent, interest_areas, available_days
       FROM volunteers 
       WHERE preferred_park_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [parkId]
    );
    const parkVolunteers = volunteersQuery.rows;

    // Incidentes
    const incidentsQuery = await pool.query(
      'SELECT id, title, severity, status, created_at FROM incidents WHERE park_id = $1 ORDER BY created_at DESC LIMIT 10',
      [parkId]
    );
    const incidents = incidentsQuery.rows;

    // Evaluaciones
    const evaluationsQuery = await pool.query(
      'SELECT AVG(overall_rating) as avg_rating, COUNT(*) as count FROM park_evaluations WHERE park_id = $1',
      [parkId]
    );
    const averageEvaluation = parseFloat(evaluationsQuery.rows[0].avg_rating) || 0;
    const totalEvaluations = parseInt(evaluationsQuery.rows[0].count) || 0;

    // Activos
    const assetsQuery = await pool.query(
      'SELECT id, name, category_id, condition, location_description as location, acquisition_date, last_maintenance_date FROM assets WHERE park_id = $1',
      [parkId]
    );
    const assets = assetsQuery.rows;

    // Concesiones
    const concessionsQuery = await pool.query(
      'SELECT COUNT(*) as count FROM active_concessions WHERE park_id = $1',
      [parkId]
    );
    const activeConcessions = parseInt(concessionsQuery.rows[0]?.count || 0);

    // Estadísticas
    const stats = {
      totalActivities: parkActivities.length,
      activeVolunteers: parkVolunteers.length,
      totalTrees: parseInt(treeStats.total) || 0,
      totalAssets: assets.length,
      averageEvaluation,
      totalEvaluations,
      pendingIncidents: incidents.filter((i: any) => i.status !== 'resolved' && i.status !== 'closed').length,
      activeConcessions
    };

    res.json({
      ...park,
      amenities,
      images,
      activities: parkActivities,
      trees: parkTrees,
      treeStats,
      volunteers: parkVolunteers,
      incidents,
      assets,
      stats
    });
  } catch (error) {
    console.error("Error fetching park details:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * GET /parks/:id/dependencies - Dependencias antes de eliminar
 */
router.get('/:id/dependencies', isAuthenticated, requirePermission('management:parks:parks:view'), async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);
    const dependencies = await storage.getParkDependencies(parkId);
    res.json(dependencies);
  } catch (error) {
    console.error('Error fetching park dependencies:', error);
    res.status(500).json({ message: 'Error fetching park dependencies' });
  }
});

// =============================================================================
// SECCIÓN 3: RUTAS PÚBLICAS - CONSULTAS POR ID
// =============================================================================

/**
 * GET /parks/:id - Obtener un parque por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);

    // Evitar conflicto con rutas como /parks/summary
    if (isNaN(parkId)) {
      return res.status(400).json({ message: 'Invalid park ID' });
    }

    const { getParkByIdDirectly } = await import('../direct-park-queries');
    const park = await getParkByIdDirectly(parkId);

    if (!park) {
      return res.status(404).json({ message: 'Park not found' });
    }

    res.json(park);
  } catch (error) {
    console.error('Error al obtener parque:', error);
    res.status(500).json({ message: 'Error fetching park' });
  }
});

/**
 * GET /parks/:id/extended - Datos extendidos del parque (con todas las relaciones)
 */
router.get('/:id/extended', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);

    if (isNaN(parkId) || parkId <= 0) {
      return res.status(400).json({ message: 'Invalid park ID' });
    }

    // Datos básicos del parque
    const parkResult = await pool.query(`
      SELECT 
        p.id, p.name, p.park_type as "parkType", p.description, p.address, 
        p.postal_code as "postalCode", p.latitude, p.longitude, 
        p.area, p.foundation_year as "foundationYear",
        p.administrator, p.status,
        p.regulation_url as "regulationUrl", p.opening_hours as "openingHours", 
        p.contact_email as "contactEmail", p.contact_phone as "contactPhone",
        p.video_url as "videoUrl", p.municipality_text as "municipalityText"
      FROM parks p
      WHERE p.id = $1
    `, [parkId]);

    if (parkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Park not found' });
    }

    const park = parkResult.rows[0];

    // ✅ Amenidades (ya existe)
    const amenitiesResult = await pool.query(`
      SELECT a.id, a.name, a.icon, a.category, 
             a.icon_type as "iconType", a.custom_icon_url as "customIconUrl",
             pa.module_name as "moduleName", pa.surface_area as "surfaceArea"
      FROM amenities a
      JOIN park_amenities pa ON a.id = pa.amenity_id
      WHERE pa.park_id = $1 AND pa.status = 'activo'
      ORDER BY a.category, a.name
    `, [parkId]);

    // ✅ Imágenes (ya existe)
    const imagesResult = await pool.query(`
      SELECT id, image_url as "imageUrl", caption, is_primary as "isPrimary"
      FROM park_images
      WHERE park_id = $1
      ORDER BY is_primary DESC, created_at DESC
    `, [parkId]);

    // ✅ AGREGAR: Actividades del parque
    const activitiesResult = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.start_date as "startDate",
        a.end_date as "endDate",
        a.category,
        a.location,
        a.instructor_id as "instructorId",
        img.image_url as "imageUrl"
      FROM activities a
      LEFT JOIN activity_images img ON a.id = img.activity_id AND img.is_primary = true
      WHERE a.park_id = $1 
      ORDER BY a.start_date ASC
      LIMIT 10
    `, [parkId]);

    // ✅ AGREGAR: Instructores que dan clases en este parque
    const instructorsResult = await pool.query(`
      SELECT DISTINCT
        i.id,
        i.full_name as "fullName",
        i.email,
        i.specialties,
        i.bio,
        i.profile_image_url as "profileImageUrl",
        i.certifications
      FROM instructors i
      INNER JOIN activities a ON i.id = a.instructor_id
      WHERE a.park_id = $1
      ORDER BY i.full_name
    `, [parkId]);

    // ✅ AGREGAR: Especies arbóreas del parque
    const treeSpeciesResult = await pool.query(`
      SELECT 
        ts.id,
        ts.common_name as "commonName",
        ts.scientific_name as "scientificName",
        ts.family,
        ts.origin,
        ts.image_url as "photoUrl",
        ts.image_url as "customPhotoUrl",
        ts.is_endangered as "isEndangered"
      FROM tree_species ts
      INNER JOIN park_tree_species pts ON ts.id = pts.species_id
      WHERE pts.park_id = $1
        AND pts.status != 'eliminado'
      ORDER BY ts.common_name
    `, [parkId]);

    // Voluntarios relacionados con este parque (han participado O lo prefieren)
    const volunteersResult = await pool.query(`
      SELECT DISTINCT
        v.id,
        v.full_name as "fullName",
        v.email,
        v.phone,
        v.profile_image_url as "profileImageUrl",
        v.skills,
        v.status,
        v.interest_areas as "interestAreas"
      FROM volunteers v
      WHERE v.status = 'activo'
        AND (
          -- Voluntarios que prefieren este parque
          v.preferred_park_id = $1
          OR
          -- Voluntarios que han participado en actividades de este parque
          v.id IN (
            SELECT DISTINCT vp.volunteer_id
            FROM volunteer_participations vp
            INNER JOIN volunteer_activities va ON vp.volunteer_activity_id = va.id
            WHERE va.park_id = $1
          )
        )
      ORDER BY v.full_name
    `, [parkId]);

    // Concesiones activas del parque
    const concessionsResult = await pool.query(`
      SELECT 
        ac.id,
        ac.name as "vendorName",
        ac.specific_location as location,
        ac.start_date as "startDate",
        ct.name as "concessionType",
        ct.description as "typeDescription",
        aci.image_url as "primaryImage",
        con.phone as "vendorPhone"
      FROM active_concessions ac
      LEFT JOIN concession_types ct ON ac.concession_type_id = ct.id
      LEFT JOIN active_concession_images aci 
        ON ac.id = aci.concession_id 
        AND aci.is_primary = true
      LEFT JOIN concessionaires con ON ac.concessionaire_id = con.id
      WHERE ac.park_id = $1
        AND ac.status = 'activa'
      ORDER BY ac.name
    `, [parkId]);

    // ✅ Respuesta completa con todas las relaciones
    res.json({
      ...park,
      amenities: amenitiesResult.rows,
      images: imagesResult.rows,
      activities: activitiesResult.rows,
      instructors: instructorsResult.rows,
      treeSpecies: treeSpeciesResult.rows,
      volunteers: volunteersResult.rows,
      concessions: concessionsResult.rows,
    });

  } catch (error) {
    console.error('❌ Error getting extended park data:', error);
    res.status(500).json({ message: 'Error fetching park data' });
  }
});

// =============================================================================
// SECCIÓN 4: RUTAS PÚBLICAS - SUBRECURSOS (lectura)
// =============================================================================

/**
 * GET /parks/:id/amenities - Obtener amenidades de un parque
 */
router.get('/:id/amenities', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);

    const result = await pool.query(`
      SELECT 
        pa.id,
        pa.park_id as "parkId",
        pa.amenity_id as "amenityId",
        pa.module_name as "moduleName",
        pa.location_latitude as "locationLatitude",
        pa.location_longitude as "locationLongitude",
        pa.surface_area as "surfaceArea",
        pa.status,
        pa.description,
        a.name as "amenityName",
        a.icon as "amenityIcon",
        a.custom_icon_url as "customIconUrl"
      FROM park_amenities pa
      INNER JOIN amenities a ON pa.amenity_id = a.id
      WHERE pa.park_id = $1
      ORDER BY a.name
    `, [parkId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching park amenities:', error);
    res.status(500).json({ message: 'Error fetching park amenities' });
  }
});

/**
 * GET /parks/:id/images - Obtener imágenes de un parque
 */
router.get('/:id/images', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);
    const images = await storage.getParkImages(parkId);

    const mappedImages = images.map(img => ({
      id: img.id,
      parkId: img.parkId,
      imageUrl: img.imageUrl,
      caption: img.caption,
      isPrimary: img.isPrimary,
      createdAt: img.createdAt
    }));

    res.json(mappedImages);
  } catch (error) {
    console.error('Error fetching park images:', error);
    res.status(500).json({ message: 'Error fetching park images' });
  }
});

/**
 * GET /parks/:id/documents - Obtener documentos de un parque
 */
router.get('/:id/documents', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);
    const documents = await storage.getParkDocuments(parkId);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching park documents:', error);
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

router.get('/:id/evaluations', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (isNaN(parkId)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de parque inválido' 
      });
    }

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Parámetros de paginación inválidos' 
      });
    }

    const result = await pool.query(`
      SELECT 
        pe.id,
        pe.park_id as "parkId",
        pe.evaluator_name as "evaluator_name",
        pe.evaluator_email as "evaluator_email",
        pe.evaluator_phone as "evaluator_phone",
        pe.evaluator_city as "evaluator_city",
        pe.evaluator_age as "evaluator_age",
        pe.is_frequent_visitor as "is_frequent_visitor",
        pe.overall_rating as "overall_rating",
        pe.cleanliness,
        pe.safety,
        pe.maintenance,
        pe.accessibility,
        pe.amenities,
        pe.activities,
        pe.staff,
        pe.natural_beauty,
        pe.comments,
        pe.suggestions,
        pe.would_recommend as "would_recommend",
        pe.visit_date as "visit_date",
        pe.visit_purpose as "visit_purpose",
        pe.visit_duration as "visit_duration",
        pe.status,
        pe.created_at as "created_at",
        pe.updated_at as "updated_at"
      FROM park_evaluations pe
      WHERE pe.park_id = $1
        AND pe.status = 'approved'
      ORDER BY pe.created_at DESC
      LIMIT $2 OFFSET $3
    `, [parkId, limit, offset]);

    const countResult = await pool.query(`
      SELECT COUNT(*)::int as total
      FROM park_evaluations
      WHERE park_id = $1
        AND status = 'approved'
    `, [parkId]);

    const total = countResult.rows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      evaluations: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching park evaluations:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener evaluaciones del parque' 
    });
  }
});

/**
 * GET /parks/:id/evaluation-stats - Estadísticas de evaluaciones
 */
router.get('/:id/evaluation-stats', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);

    if (isNaN(parkId)) {
      return res.status(400).json({ success: false, message: 'ID de parque inválido' });
    }

    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(*)::int as total_evaluations,
        AVG(overall_rating)::float as average_rating,
        (COUNT(*) FILTER (WHERE would_recommend = true)::float / NULLIF(COUNT(*)::float, 0) * 100)::float as recommendation_rate,
        AVG(cleanliness)::float as avg_cleanliness,
        AVG(safety)::float as avg_safety,
        AVG(maintenance)::float as avg_maintenance,
        AVG(accessibility)::float as avg_accessibility,
        AVG(amenities)::float as avg_amenities,
        AVG(activities)::float as avg_activities,
        AVG(staff)::float as avg_staff,
        AVG(natural_beauty)::float as avg_natural_beauty,
        COUNT(*) FILTER (WHERE overall_rating = 5)::int as five_star_count,
        COUNT(*) FILTER (WHERE overall_rating = 4)::int as four_star_count,
        COUNT(*) FILTER (WHERE overall_rating = 3)::int as three_star_count,
        COUNT(*) FILTER (WHERE overall_rating = 2)::int as two_star_count,
        COUNT(*) FILTER (WHERE overall_rating = 1)::int as one_star_count
      FROM park_evaluations
      WHERE park_id = ${parkId} AND status = 'approved'
    `);

    const stats = statsResult.rows[0] || {
      total_evaluations: 0,
      average_rating: 0,
      recommendation_rate: 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas de evaluaciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
});

/**
 * GET /parks/:id/comments - Obtener comentarios de un parque
 */
router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);
    const approvedOnly = req.query.approvedOnly === 'true';

    const comments = await storage.getParkComments(parkId, approvedOnly);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching park comments:', error);
    res.status(500).json({ message: 'Error fetching park comments' });
  }
});

// =============================================================================
// SECCIÓN 5: RUTAS PROTEGIDAS - CRUD PARQUES
// =============================================================================

/**
 * POST /parks - Crear un nuevo parque
 */
router.post('/',
  isAuthenticated,
  requirePermission('management:parks:parks:create'),
  async (req: Request, res: Response) => {
    try {
      console.log('🚀 Creando parque:', req.body.name);

      const dataToValidate = {
        name: req.body.name,
        municipalityText: req.body.municipality || req.body.municipalityText,
        parkType: req.body.parkType || 'urbano',
        description: req.body.description,
        address: req.body.address,
        postalCode: req.body.postalCode,
        latitude: req.body.latitude,
        longitude: req.body.longitude?.trim(),
        area: req.body.area,
        foundationYear: req.body.foundationYear,
        administrator: req.body.administrator,
        contactPhone: req.body.contactPhone,
        contactEmail: req.body.contactEmail,
        certificaciones: req.body.certificaciones,
      };

      const parkData = insertParkSchema.parse(dataToValidate);
      const codePrefix = await generateParkPrefix(parkData.name);

      const newPark = await storage.createPark({
        ...parkData,
        code_prefix: codePrefix
      });

      console.log(`✅ Parque creado: ${newPark.name} (ID: ${newPark.id})`);
      res.status(201).json(newPark);

    } catch (error: any) {
      console.error('❌ Error creando parque:', error);

      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: 'Datos de entrada inválidos: ' + validationError.message,
          details: error.issues 
        });
      }

      res.status(500).json({ 
        message: 'Error creating park',
        details: error?.message || 'Unknown error'
      });
    }
  }
);

/**
 * POST /parks/import - Importar parques desde Excel/CSV
 */
router.post('/import',
  isAuthenticated,
  requirePermission('management:parks:parks:create'),
  memoryUpload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Debe seleccionar un archivo para importar'
        });
      }
      return await processImportFile(req, res);
    } catch (error) {
      console.error('Error en importación de parques:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante la importación'
      });
    }
  }
);

/**
 * POST /parks/bulk-delete - Eliminar múltiples parques
 */
router.post('/bulk-delete',
  isAuthenticated,
  requirePermission('management:parks:parks:delete'),
  async (req: Request, res: Response) => {
    try {
      const { parkIds } = req.body;

      if (!parkIds || !Array.isArray(parkIds) || parkIds.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de IDs de parques' });
      }

      console.log(`🗑️ [BULK DELETE] Eliminando ${parkIds.length} parques`);

      const deletedParks = [];
      const errors = [];

      for (const parkId of parkIds) {
        try {
          const numParkId = Number(parkId);
          if (isNaN(numParkId)) {
            errors.push({ parkId, error: 'ID de parque inválido' });
            continue;
          }

          await pool.query('BEGIN');

          // Eliminar dependencias
          await pool.query('DELETE FROM park_amenities WHERE park_id = $1', [numParkId]);
          await pool.query('DELETE FROM park_images WHERE park_id = $1', [numParkId]);
          await pool.query('DELETE FROM activities WHERE park_id = $1', [numParkId]);
          await pool.query('DELETE FROM incidents WHERE park_id = $1', [numParkId]);

          const deleteResult = await pool.query(
            'DELETE FROM parks WHERE id = $1 RETURNING name', 
            [numParkId]
          );

          if (deleteResult.rows.length > 0) {
            await pool.query('COMMIT');
            deletedParks.push({ id: numParkId, name: deleteResult.rows[0].name });
          } else {
            await pool.query('ROLLBACK');
            errors.push({ parkId: numParkId, error: 'Parque no encontrado' });
          }
        } catch (error: any) {
          await pool.query('ROLLBACK');
          errors.push({ parkId, error: error.message });
        }
      }

      res.json({
        success: true,
        deleted: deletedParks,
        errors: errors.length > 0 ? errors : undefined,
        message: `${deletedParks.length} parques eliminados`
      });

    } catch (error) {
      console.error('Error in bulk delete:', error);
      res.status(500).json({ error: 'Error eliminando parques' });
    }
  }
);

/**
 * PUT /parks/:id - Actualizar un parque
 */
router.put('/:id',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const parkData = { ...req.body };

      if (parkData.municipality && typeof parkData.municipality === 'string') {
        parkData.municipalityText = parkData.municipality;
        delete parkData.municipality;
      }

      const updatedPark = await storage.updatePark(parkId, parkData);

      if (!updatedPark) {
        return res.status(404).json({ message: 'Park not found' });
      }

      res.json(updatedPark);
    } catch (error) {
      console.error('Error updating park:', error);
      res.status(500).json({ message: 'Error updating park' });
    }
  }
);

/**
 * DELETE /parks/:id - Eliminar un parque
 */
router.delete('/:id',
  isAuthenticated,
  requirePermission('management:parks:parks:delete'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      console.log(`🗑️ Eliminando parque ${parkId}`);

      // Eliminar dependencias en orden
      await db.execute(sql`DELETE FROM tree_maintenances WHERE tree_id IN (SELECT id FROM trees WHERE park_id = ${parkId})`);
      await db.execute(sql`DELETE FROM trees WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM park_amenities WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM park_images WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM park_videos WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM park_documents WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM activities WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM incidents WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM comments WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM park_evaluations WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM parks WHERE id = ${parkId}`);

      res.status(200).json({ message: 'Park deleted successfully' });
    } catch (error) {
      console.error('Error al eliminar parque:', error);
      res.status(500).json({ message: 'Error deleting park' });
    }
  }
);

// =============================================================================
// SECCIÓN 6: RUTAS PROTEGIDAS - AMENIDADES
// =============================================================================

/**
 * POST /parks/:parkId/amenities - Agregar amenidad a un parque
 */
router.post('/:parkId/amenities',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      const { amenityId, moduleName, surfaceArea, status, description, locationLatitude, locationLongitude } = req.body;

      if (!amenityId) {
        return res.status(400).json({ message: 'amenityId es requerido' });
      }

      // Verificar si ya existe
      const existingCheck = await pool.query(`
        SELECT id FROM park_amenities 
        WHERE park_id = $1 AND amenity_id = $2
      `, [parkId, amenityId]);

      if (existingCheck.rows.length > 0) {
        return res.status(400).json({ 
          message: 'Esta amenidad ya está asignada a este parque'
        });
      }

      const result = await pool.query(`
        INSERT INTO park_amenities (park_id, amenity_id, module_name, surface_area, status, description, location_latitude, location_longitude)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [parkId, amenityId, moduleName || null, surfaceArea || null, status || 'activo', description || null, locationLatitude || null, locationLongitude || null]);

      res.status(201).json({
        message: 'Amenidad asignada correctamente',
        parkAmenity: result.rows[0]
      });
    } catch (error) {
      console.error('Error asignando amenidad:', error);
      res.status(500).json({ message: 'Error al asignar amenidad al parque' });
    }
  }
);

/**
 * PUT /parks/:parkId/amenities/:amenityId - Actualizar amenidad
 */
router.put('/:parkId/amenities/:amenityId',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      const amenityId = Number(req.params.amenityId);
      const { moduleName, surfaceArea, status, locationLatitude, locationLongitude, description } = req.body;

      const result = await pool.query(`
        UPDATE park_amenities 
        SET module_name = $3, surface_area = $4, status = $5,
            location_latitude = $6, location_longitude = $7, description = $8,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND park_id = $2
        RETURNING *
      `, [amenityId, parkId, moduleName, surfaceArea, status, locationLatitude, locationLongitude, description]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Amenidad no encontrada' });
      }

      res.json({ message: 'Amenidad actualizada', updatedAmenity: result.rows[0] });
    } catch (error) {
      console.error('Error actualizando amenidad:', error);
      res.status(500).json({ message: 'Error al actualizar amenidad' });
    }
  }
);

/**
 * DELETE /parks/:parkId/amenities/:amenityId - Eliminar amenidad
 */
router.delete('/:parkId/amenities/:amenityId',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      const amenityId = Number(req.params.amenityId);

      const result = await pool.query(`
        DELETE FROM park_amenities 
        WHERE id = $1 AND park_id = $2
        RETURNING *
      `, [amenityId, parkId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Amenidad no encontrada' });
      }

      res.json({ message: 'Amenidad eliminada', deletedAmenity: result.rows[0] });
    } catch (error) {
      console.error('Error eliminando amenidad:', error);
      res.status(500).json({ message: 'Error al eliminar amenidad' });
    }
  }
);

// =============================================================================
// SECCIÓN 7: RUTAS PROTEGIDAS - IMÁGENES
// =============================================================================

/**
 * POST /parks/:parkId/images - Subir imagen de parque
 */
router.post('/:parkId/images',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  parkImageUpload.single('image'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);

      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó imagen' });
      }

      console.log(`📸 Subiendo imagen para parque ${parkId}`);

      // Subir a Object Storage
      const filename = `park-images/${parkId}/${Date.now()}-${req.file.originalname}`;
      const imageUrl = await replitObjectStorage.uploadFile(req.file.buffer, filename, req.file.mimetype);

      // Verificar si es la primera imagen
      const existingImages = await pool.query(
        'SELECT COUNT(*) as count FROM park_images WHERE park_id = $1',
        [parkId]
      );
      const isFirst = parseInt(existingImages.rows[0].count) === 0;

      // Guardar en BD
      const result = await pool.query(`
        INSERT INTO park_images (park_id, image_url, caption, is_primary)
        VALUES ($1, $2, $3, $4)
        RETURNING id, park_id as "parkId", image_url as "imageUrl", caption, is_primary as "isPrimary", created_at as "createdAt"
      `, [parkId, imageUrl, req.body.caption || null, req.body.isPrimary === 'true' || isFirst]);

      console.log(`✅ Imagen subida: ${result.rows[0].id}`);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error uploading park image:', error);
      res.status(500).json({ message: 'Error uploading image' });
    }
  }
);

/**
 * PUT /parks/:parkId/images/:imageId/set-primary - Establecer imagen principal
 */
router.put('/:parkId/images/:imageId/set-primary',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      const imageId = Number(req.params.imageId);

      console.log(`⭐ Estableciendo imagen ${imageId} como principal para parque ${parkId}`);

      // Quitar primary de todas las imágenes del parque
      await pool.query(
        'UPDATE park_images SET is_primary = false WHERE park_id = $1',
        [parkId]
      );

      // Establecer la nueva imagen como primary
      const result = await pool.query(`
        UPDATE park_images SET is_primary = true 
        WHERE id = $1 AND park_id = $2
        RETURNING id, park_id as "parkId", image_url as "imageUrl", caption, is_primary as "isPrimary"
      `, [imageId, parkId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Imagen no encontrada' });
      }

      console.log(`✅ Imagen ${imageId} establecida como principal`);
      res.json({ message: 'Imagen establecida como principal', image: result.rows[0] });
    } catch (error) {
      console.error('Error setting primary image:', error);
      res.status(500).json({ message: 'Error setting primary image' });
    }
  }
);

/**
 * POST /parks/:parkId/images/:imageId/set-primary - Alias para compatibilidad
 */
router.post('/:parkId/images/:imageId/set-primary',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    const parkId = Number(req.params.parkId);
    const imageId = Number(req.params.imageId);

    try {
      await pool.query(
        'UPDATE park_images SET is_primary = false WHERE park_id = $1',
        [parkId]
      );

      const result = await pool.query(`
        UPDATE park_images SET is_primary = true 
        WHERE id = $1 AND park_id = $2
        RETURNING id, park_id as "parkId", image_url as "imageUrl", caption, is_primary as "isPrimary"
      `, [imageId, parkId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Imagen no encontrada' });
      }

      res.json({ message: 'Imagen establecida como principal', image: result.rows[0] });
    } catch (error) {
      console.error('Error setting primary image:', error);
      res.status(500).json({ message: 'Error setting primary image' });
    }
  }
);

/**
 * DELETE /parks/:parkId/images/:imageId - Eliminar imagen
 */
router.delete('/:parkId/images/:imageId',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      const imageId = Number(req.params.imageId);

      console.log(`🗑️ Eliminando imagen ${imageId} del parque ${parkId}`);

      // Obtener la imagen
      const imageResult = await pool.query(
        'SELECT image_url FROM park_images WHERE id = $1 AND park_id = $2',
        [imageId, parkId]
      );

      if (imageResult.rows.length === 0) {
        return res.status(404).json({ message: 'Imagen no encontrada' });
      }

      const imageUrl = imageResult.rows[0].image_url;

      // Eliminar de la BD
      await pool.query(
        'DELETE FROM park_images WHERE id = $1 AND park_id = $2',
        [imageId, parkId]
      );

      // Intentar eliminar del Object Storage
      try {
        if (imageUrl && imageUrl.includes('park-images/')) {
          const filename = imageUrl.split('/').slice(-2).join('/');
          await replitObjectStorage.deleteFile(`park-images/${filename}`);
        }
      } catch (storageError) {
        console.warn('No se pudo eliminar del storage:', storageError);
      }

      console.log(`✅ Imagen ${imageId} eliminada`);
      res.json({ message: 'Imagen eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting park image:', error);
      res.status(500).json({ message: 'Error deleting image' });
    }
  }
);

// =============================================================================
// SECCIÓN 8: RUTAS PROTEGIDAS - DOCUMENTOS
// =============================================================================

/**
 * POST /parks/:parkId/documents - Subir documento
 */
router.post('/:parkId/documents',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  documentUpload.single('document'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);

      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó documento' });
      }

      console.log(`📄 Subiendo documento para parque ${parkId}`);

      const documentData = {
        parkId,
        title: req.body.title || req.file.originalname,
        fileUrl: `/uploads/documents/${req.file.filename}`,
        fileType: req.file.mimetype || 'application/octet-stream',
        description: req.body.description || '',
        uploadedById: req.user?.id || null
      };

      const newDocument = await storage.createDocument(documentData);

      console.log(`✅ Documento subido: ${newDocument.id}`);
      res.status(201).json(newDocument);
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ message: 'Error uploading document' });
    }
  }
);

/**
 * DELETE /parks/:parkId/documents/:documentId - Eliminar documento
 */
router.delete('/:parkId/documents/:documentId',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      const documentId = Number(req.params.documentId);

      console.log(`🗑️ Eliminando documento ${documentId} del parque ${parkId}`);

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Documento no encontrado' });
      }

      if (document.parkId !== parkId) {
        return res.status(400).json({ message: 'El documento no pertenece a este parque' });
      }

      // Eliminar archivo físico
      if (document.fileUrl) {
        const filePath = path.join(process.cwd(), 'public', document.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`✅ Archivo físico eliminado: ${filePath}`);
        }
      }

      await storage.deleteDocument(documentId);

      console.log(`✅ Documento ${documentId} eliminado`);
      res.json({ message: 'Documento eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ message: 'Error deleting document' });
    }
  }
);

// =============================================================================
// SECCIÓN 9: RUTAS PROTEGIDAS - VIDEOS
// =============================================================================

/**
 * POST /parks/:parkId/videos - Agregar video
 */
router.post('/:parkId/videos',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  videoUpload.single('video'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);

      let videoUrl = req.body.videoUrl;

      if (req.file) {
        videoUrl = `/uploads/videos/${req.file.filename}`;
      }

      if (!videoUrl) {
        return res.status(400).json({ message: 'Se requiere un video o URL' });
      }

      console.log(`🎬 Agregando video para parque ${parkId}`);

      let videoType = 'file';
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        videoType = 'youtube';
      } else if (videoUrl.includes('vimeo.com')) {
        videoType = 'vimeo';
      } else if (!req.file) {
        videoType = 'external';
      }

      const result = await pool.query(`
        INSERT INTO park_videos (park_id, video_url, title, video_type, description, is_featured)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, park_id as "parkId", video_url as "videoUrl", 
                  title, video_type as "videoType", description, is_featured as "isFeatured", created_at as "createdAt"
      `, [parkId, videoUrl, req.body.title || 'Sin título', videoType, req.body.description || null, req.body.isFeatured === 'true' || req.body.isFeatured === true]);

      console.log(`✅ Video agregado: ${result.rows[0].id}`);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error adding video:', error);
      res.status(500).json({ message: 'Error adding video' });
    }
  }
);

/**
 * PUT /parks/:parkId/videos/:videoId/set-featured - Establecer video destacado
 */
router.put('/:parkId/videos/:videoId/set-featured',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      const videoId = Number(req.params.videoId);

      console.log(`⭐ Estableciendo video ${videoId} como destacado para parque ${parkId}`);

      await pool.query(
        'UPDATE park_videos SET is_featured = false WHERE park_id = $1',
        [parkId]
      );

      const result = await pool.query(`
        UPDATE park_videos SET is_featured = true 
        WHERE id = $1 AND park_id = $2
        RETURNING id, park_id as "parkId", video_url as "videoUrl", title, is_featured as "isFeatured"
      `, [videoId, parkId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Video no encontrado' });
      }

      console.log(`✅ Video ${videoId} establecido como destacado`);
      res.json({ message: 'Video establecido como destacado', video: result.rows[0] });
    } catch (error) {
      console.error('Error setting featured video:', error);
      res.status(500).json({ message: 'Error setting featured video' });
    }
  }
);

/**
 * POST /parks/:parkId/videos/:videoId/set-featured - Alias para compatibilidad
 */
router.post('/:parkId/videos/:videoId/set-featured',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    const parkId = Number(req.params.parkId);
    const videoId = Number(req.params.videoId);

    try {
      await pool.query(
        'UPDATE park_videos SET is_featured = false WHERE park_id = $1',
        [parkId]
      );

      const result = await pool.query(`
        UPDATE park_videos SET is_featured = true 
        WHERE id = $1 AND park_id = $2
        RETURNING id, park_id as "parkId", video_url as "videoUrl", title, is_featured as "isFeatured"
      `, [videoId, parkId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Video no encontrado' });
      }

      res.json({ message: 'Video establecido como destacado', video: result.rows[0] });
    } catch (error) {
      console.error('Error setting featured video:', error);
      res.status(500).json({ message: 'Error setting featured video' });
    }
  }
);

/**
 * DELETE /parks/:parkId/videos/:videoId - Eliminar video
 */
router.delete('/:parkId/videos/:videoId',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      const videoId = Number(req.params.videoId);

      console.log(`🗑️ Eliminando video ${videoId} del parque ${parkId}`);

      const videoResult = await pool.query(
        'SELECT video_url FROM park_videos WHERE id = $1 AND park_id = $2',
        [videoId, parkId]
      );

      if (videoResult.rows.length === 0) {
        return res.status(404).json({ message: 'Video no encontrado' });
      }

      const videoUrl = videoResult.rows[0].video_url;

      await pool.query(
        'DELETE FROM park_videos WHERE id = $1 AND park_id = $2',
        [videoId, parkId]
      );

      // Eliminar archivo físico si es local
      if (videoUrl && videoUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), videoUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`✅ Archivo de video eliminado: ${filePath}`);
        }
      }

      console.log(`✅ Video ${videoId} eliminado`);
      res.json({ message: 'Video eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting video:', error);
      res.status(500).json({ message: 'Error deleting video' });
    }
  }
);

// =============================================================================
// SECCIÓN 10: RUTAS PROTEGIDAS - VOLUNTARIOS
// =============================================================================

/**
 * GET /parks/:id/volunteers - Obtener voluntarios de un parque
 */
router.get('/:id/volunteers',
  isAuthenticated,
  requirePermission('management:parks:parks:view'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);

      const result = await pool.query(`
        SELECT v.*, u.full_name as "userName", u.email as "userEmail"
        FROM volunteers v
        LEFT JOIN users u ON v.user_id = u.id
        WHERE v.preferred_park_id = $1
        ORDER BY v.created_at DESC
      `, [parkId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching park volunteers:', error);
      res.status(500).json({ message: 'Error fetching volunteers' });
    }
  }
);

/**
 * POST /parks/:id/volunteers - Asignar voluntario a parque
 */
router.post('/:id/volunteers',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const { volunteerId } = req.body;

      const result = await pool.query(`
        UPDATE volunteers SET preferred_park_id = $1 WHERE id = $2 RETURNING *
      `, [parkId, volunteerId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Voluntario no encontrado' });
      }

      res.json({ message: 'Voluntario asignado', volunteer: result.rows[0] });
    } catch (error) {
      console.error('Error assigning volunteer:', error);
      res.status(500).json({ message: 'Error assigning volunteer' });
    }
  }
);

/**
 * DELETE /parks/:id/volunteers/:volunteerId - Remover voluntario
 */
router.delete('/:id/volunteers/:volunteerId',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const volunteerId = Number(req.params.volunteerId);

      const result = await pool.query(`
        UPDATE volunteers SET preferred_park_id = NULL 
        WHERE id = $1 AND preferred_park_id = $2
        RETURNING *
      `, [volunteerId, parkId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Voluntario no encontrado en este parque' });
      }

      res.json({ message: 'Voluntario removido del parque' });
    } catch (error) {
      console.error('Error removing volunteer:', error);
      res.status(500).json({ message: 'Error removing volunteer' });
    }
  }
);

// =============================================================================
// SECCIÓN 11: RUTAS PROTEGIDAS - COMENTARIOS
// =============================================================================

/**
 * POST /parks/:id/comments - Agregar comentario (público)
 */
router.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);
    const autoApprove = false; // Comentarios requieren moderación

    const commentData = { ...req.body, parkId, approved: autoApprove };
    const data = insertCommentSchema.parse(commentData);
    const result = await storage.createComment(data);

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment to park' });
  }
});

// =============================================================================
// SECCIÓN 12: RUTAS PROTEGIDAS - INCIDENTES
// =============================================================================

/**
 * GET /parks/:id/incidents - Obtener incidentes de un parque
 */
router.get('/:id/incidents', isAuthenticated, requirePermission('management:parks:parks:view'), async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);

    if (req.user.role !== 'super_admin') {
      const park = await storage.getPark(parkId);
      if (!park) {
        return res.status(404).json({ message: "Park not found" });
      }
    }

    const incidents = await storage.getParkIncidents(parkId);
    res.json(incidents);
  } catch (error) {
    console.error('Error fetching park incidents:', error);
    res.status(500).json({ message: 'Error fetching park incidents' });
  }
});

/**
 * POST /parks/:id/incidents - Reportar incidente (público)
 */
router.post('/:id/incidents', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);
    const incidentData = { ...req.body, parkId };

    const data = insertIncidentSchema.parse(incidentData);
    const result = await storage.createIncident(data);

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Error reporting incident:', error);
    res.status(500).json({ message: 'Error reporting incident' });
  }
});

// =============================================================================
// SECCIÓN 13: RUTAS PROTEGIDAS - EVALUACIONES
// =============================================================================

/**
 * POST /park-evaluations - Crear evaluación (público)
 * Nota: Ruta sin parkId en path, parkId viene en body
 */
router.post('/evaluations', async (req: Request, res: Response) => {
  try {
    console.log('📝 [PARK-EVALUATIONS] Recibiendo nueva evaluación');

    const validatedData = insertParkEvaluationSchema.parse(req.body);

    const [newEvaluation] = await db.insert(schema.parkEvaluations)
      .values({
        ...validatedData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log('✅ [PARK-EVALUATIONS] Evaluación creada:', newEvaluation.id);

    res.status(201).json({
      success: true,
      data: newEvaluation,
      message: 'Evaluación enviada exitosamente. Será revisada antes de publicarse.'
    });
  } catch (error) {
    console.error('❌ [PARK-EVALUATIONS] Error creando evaluación:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de evaluación inválidos',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al enviar la evaluación'
    });
  }
});

/**
 * GET /parks/:parkId/events - Eventos del parque
 */
router.get('/:parkId/events', async (req: Request, res: Response) => {
  try {
    const parkId = parseInt(req.params.parkId);

    const parkResult = await pool.query('SELECT name FROM parks WHERE id = $1', [parkId]);
    if (parkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Parque no encontrado' });
    }

    const parkName = parkResult.rows[0].name;

    const events = await pool.query(`
      SELECT id, title, description, start_date, end_date, location, category
      FROM events 
      WHERE location ILIKE $1
      ORDER BY start_date DESC
    `, [`%${parkName}%`]);

    res.json(events.rows);
  } catch (error) {
    console.error('Error fetching park events:', error);
    res.status(500).json({ message: 'Error fetching park events' });
  }
});

/**
 * GET /parks/:id/activities - Actividades del parque
 */
router.get('/:id/activities', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);
    const activities = await storage.getParkActivities(parkId);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching park activities:', error);
    res.status(500).json({ message: 'Error fetching park activities' });
  }
});

// =============================================================================
// SECCIÓN 14: EXPORT
// =============================================================================

export default router;

/**
 * Función para registrar las rutas de Parks en la aplicación Express
 */
export function registerParkRoutes(app: any) {
  app.use('/api/parks', router);
  console.log('✅ [PARKS] Rutas consolidadas registradas');
}