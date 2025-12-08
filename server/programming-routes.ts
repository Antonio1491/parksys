/**
 * Rutas del módulo de Programación
 * Lee de la nueva tabla unificada 'programming'
 */

import { Router, Request, Response } from 'express';
import { pool } from './db';

const router = Router();

/**
 * Calcula la subcategoría automática basada en tipo y capacidad
 */
function getSubcategory(type: string, capacity: number | null): string {
  const cap = capacity || 0;

  if (type === 'activity') {
    if (cap <= 20) return 'actividad_pequena';
    if (cap <= 50) return 'actividad_mediana';
    return 'actividad_grande';
  } else {
    if (cap <= 100) return 'evento_mini';
    if (cap <= 500) return 'evento_mediano';
    return 'evento_masivo';
  }
}

/**
 * Obtiene el nombre legible de la subcategoría
 */
function getSubcategoryLabel(subcategory: string): string {
  const labels: Record<string, string> = {
    'actividad_pequena': 'Actividad Pequeña',
    'actividad_mediana': 'Actividad Mediana',
    'actividad_grande': 'Actividad Grande',
    'evento_mini': 'Evento Mini',
    'evento_mediano': 'Evento Mediano',
    'evento_masivo': 'Evento Masivo',
  };
  return labels[subcategory] || subcategory;
}

/**
 * GET /api/programming
 * Obtiene toda la programación
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📅 [PROGRAMMING] Obteniendo programación...');

    const query = `
      SELECT 
        p.id,
        p.type,
        p.title,
        p.description,
        p.start_date as "startDate",
        p.end_date as "endDate",
        p.start_time as "startTime",
        p.end_time as "endTime",
        p.location,
        p.capacity,
        p.price,
        p.is_free as "isFree",
        p.is_recurring as "isRecurring",
        p.duration,
        p.park_id as "parkId",
        pk.name as "parkName",
        p.thematic_axis_id as "thematicAxisId",
        ta.name as "thematicAxisName",
        ta.color as "thematicAxisColor",
        p.instructor_id as "instructorId",
        p.organizer_name as "organizerName",
        p.featured_image_url as "imageUrl",
        p.status,
        p.target_audience as "targetAudience",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt"
      FROM programming p
      LEFT JOIN parks pk ON p.park_id = pk.id
      LEFT JOIN thematic_axes ta ON p.thematic_axis_id = ta.id
      ORDER BY p.start_date DESC
    `;

    const result = await pool.query(query);

    // Procesar resultados
    const programming = result.rows.map(item => ({
      ...item,
      category: item.type === 'activity' ? 'Actividad' : 'Evento',
      subcategory: getSubcategory(item.type, item.capacity),
      subcategoryLabel: getSubcategoryLabel(getSubcategory(item.type, item.capacity)),
    }));

    console.log(`📅 [PROGRAMMING] Total: ${programming.length}`);

    res.json({
      data: programming,
      meta: {
        total: programming.length,
        activities: programming.filter(p => p.type === 'activity').length,
        events: programming.filter(p => p.type === 'event').length,
      }
    });

  } catch (error) {
    console.error('❌ [PROGRAMMING] Error:', error);
    res.status(500).json({ 
      error: 'Error al obtener la programación',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/programming/stats
 * Obtiene estadísticas de la programación
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Contar por tipo
    const countByType = await pool.query(`
      SELECT type, COUNT(*) as count
      FROM programming
      GROUP BY type
    `);

    // Contar este mes
    const thisMonth = await pool.query(`
      SELECT COUNT(*) as count
      FROM programming
      WHERE start_date >= $1 AND start_date <= $2
    `, [startOfMonth.toISOString(), endOfMonth.toISOString()]);

    const activities = countByType.rows.find(r => r.type === 'activity')?.count || 0;
    const events = countByType.rows.find(r => r.type === 'event')?.count || 0;

    res.json({
      total: parseInt(activities) + parseInt(events),
      activities: parseInt(activities),
      events: parseInt(events),
      thisMonth: parseInt(thisMonth.rows[0]?.count || 0),
    });

  } catch (error) {
    console.error('❌ [PROGRAMMING] Error en stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

/**
 * GET /api/programming/:id
 * Obtiene un elemento por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.*,
        pk.name as "parkName",
        ta.name as "thematicAxisName",
        ta.color as "thematicAxisColor"
      FROM programming p
      LEFT JOIN parks pk ON p.park_id = pk.id
      LEFT JOIN thematic_axes ta ON p.thematic_axis_id = ta.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Programación no encontrada' });
    }

    const item = result.rows[0];

    res.json({
      ...item,
      category: item.type === 'activity' ? 'Actividad' : 'Evento',
      subcategory: getSubcategory(item.type, item.capacity),
      subcategoryLabel: getSubcategoryLabel(getSubcategory(item.type, item.capacity)),
    });

  } catch (error) {
    console.error('❌ [PROGRAMMING] Error:', error);
    res.status(500).json({ error: 'Error al obtener el elemento' });
  }
});

/**
 * GET /api/programming/thematic-axes
 * Obtiene todos los ejes temáticos
 */
router.get('/thematic-axes/list', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM thematic_axes
      WHERE is_active = true
      ORDER BY sort_order ASC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error('❌ [PROGRAMMING] Error:', error);
    res.status(500).json({ error: 'Error al obtener ejes temáticos' });
  }
});

export default router;