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

/**
 * POST /api/programming
 * Crea un nuevo elemento de programación
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('📅 [PROGRAMMING] Creando nuevo elemento...');

    const {
      type,
      title,
      description,
      parkId,
      location,
      latitude,
      longitude,
      startDate,
      endDate,
      startTime,
      endTime,
      duration,
      isRecurring,
      recurrencePattern,
      capacity,
      thematicAxisId,
      targetAudience,
      isFree,
      price,
      discountSeniors,
      discountStudents,
      discountFamilies,
      discountDisability,
      discountEarlyBird,
      discountEarlyBirdDeadline,
      instructorId,
      organizerName,
      organizerEmail,
      organizerPhone,
      organizerOrganization,
      materials,
      requirements,
      requiredStaff,
      featuredImageUrl,
      status,
      registrationType,
      requiresApproval,
    } = req.body;

    // Validación básica
    if (!title || !startDate || !type) {
      return res.status(400).json({ 
        error: 'Campos requeridos: title, startDate, type' 
      });
    }

    const query = `
      INSERT INTO programming (
        type, title, description, park_id, location, latitude, longitude,
        start_date, end_date, start_time, end_time, duration,
        is_recurring, recurrence_pattern, capacity, thematic_axis_id,
        target_audience, is_free, price, discount_seniors, discount_students,
        discount_families, discount_disability, discount_early_bird,
        discount_early_bird_deadline, instructor_id, organizer_name,
        organizer_email, organizer_phone, organizer_organization,
        materials, requirements, required_staff, featured_image_url,
        status, registration_type, requires_approval, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34, $35, $36, $37, NOW(), NOW()
      )
      RETURNING *
    `;

    const values = [
      type || 'activity',
      title,
      description || null,
      parkId || null,
      location || null,
      latitude || null,
      longitude || null,
      startDate,
      endDate || null,
      startTime || null,
      endTime || null,
      duration || null,
      isRecurring || false,
      recurrencePattern || null,
      capacity || null,
      thematicAxisId || null,
      targetAudience || null,
      isFree !== undefined ? isFree : true,
      price || 0,
      discountSeniors || 0,
      discountStudents || 0,
      discountFamilies || 0,
      discountDisability || 0,
      discountEarlyBird || 0,
      discountEarlyBirdDeadline || null,
      instructorId || null,
      organizerName || null,
      organizerEmail || null,
      organizerPhone || null,
      organizerOrganization || null,
      materials || null,
      requirements || null,
      requiredStaff || null,
      featuredImageUrl || null,
      status || 'draft',
      registrationType || 'none',
      requiresApproval || false,
    ];

    const result = await pool.query(query, values);

    console.log('📅 [PROGRAMMING] Creado:', result.rows[0].id);
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('❌ [PROGRAMMING] Error al crear:', error);
    res.status(500).json({ 
      error: 'Error al crear la programación',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/programming/:id
 * Actualiza un elemento de programación
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('📅 [PROGRAMMING] Actualizando elemento:', id);

    const {
      type,
      title,
      description,
      parkId,
      location,
      latitude,
      longitude,
      startDate,
      endDate,
      startTime,
      endTime,
      duration,
      isRecurring,
      recurrencePattern,
      capacity,
      thematicAxisId,
      targetAudience,
      isFree,
      price,
      discountSeniors,
      discountStudents,
      discountFamilies,
      discountDisability,
      discountEarlyBird,
      discountEarlyBirdDeadline,
      instructorId,
      organizerName,
      organizerEmail,
      organizerPhone,
      organizerOrganization,
      materials,
      requirements,
      requiredStaff,
      featuredImageUrl,
      status,
      registrationType,
      requiresApproval,
    } = req.body;

    const query = `
      UPDATE programming SET
        type = COALESCE($1, type),
        title = COALESCE($2, title),
        description = $3,
        park_id = $4,
        location = $5,
        latitude = $6,
        longitude = $7,
        start_date = COALESCE($8, start_date),
        end_date = $9,
        start_time = $10,
        end_time = $11,
        duration = $12,
        is_recurring = COALESCE($13, is_recurring),
        recurrence_pattern = $14,
        capacity = $15,
        thematic_axis_id = $16,
        target_audience = $17,
        is_free = COALESCE($18, is_free),
        price = COALESCE($19, price),
        discount_seniors = COALESCE($20, discount_seniors),
        discount_students = COALESCE($21, discount_students),
        discount_families = COALESCE($22, discount_families),
        discount_disability = COALESCE($23, discount_disability),
        discount_early_bird = COALESCE($24, discount_early_bird),
        discount_early_bird_deadline = $25,
        instructor_id = $26,
        organizer_name = $27,
        organizer_email = $28,
        organizer_phone = $29,
        organizer_organization = $30,
        materials = $31,
        requirements = $32,
        required_staff = $33,
        featured_image_url = $34,
        status = COALESCE($35, status),
        registration_type = COALESCE($36, registration_type),
        requires_approval = COALESCE($37, requires_approval),
        updated_at = NOW()
      WHERE id = $38
      RETURNING *
    `;

    const values = [
      type,
      title,
      description,
      parkId || null,
      location || null,
      latitude || null,
      longitude || null,
      startDate,
      endDate || null,
      startTime || null,
      endTime || null,
      duration || null,
      isRecurring,
      recurrencePattern || null,
      capacity || null,
      thematicAxisId || null,
      targetAudience || null,
      isFree,
      price,
      discountSeniors,
      discountStudents,
      discountFamilies,
      discountDisability,
      discountEarlyBird,
      discountEarlyBirdDeadline || null,
      instructorId || null,
      organizerName || null,
      organizerEmail || null,
      organizerPhone || null,
      organizerOrganization || null,
      materials || null,
      requirements || null,
      requiredStaff || null,
      featuredImageUrl || null,
      status,
      registrationType,
      requiresApproval,
      id,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Programación no encontrada' });
    }

    console.log('📅 [PROGRAMMING] Actualizado:', id);
    res.json(result.rows[0]);

  } catch (error) {
    console.error('❌ [PROGRAMMING] Error al actualizar:', error);
    res.status(500).json({ 
      error: 'Error al actualizar la programación',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/programming/:id
 * Elimina un elemento de programación
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('📅 [PROGRAMMING] Eliminando elemento:', id);

    // Primero eliminar registros relacionados
    await pool.query('DELETE FROM programming_registrations WHERE programming_id = $1', [id]);
    await pool.query('DELETE FROM programming_images WHERE programming_id = $1', [id]);

    // Luego eliminar el elemento principal
    const result = await pool.query(
      'DELETE FROM programming WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Programación no encontrada' });
    }

    console.log('📅 [PROGRAMMING] Eliminado:', id);
    res.json({ message: 'Programación eliminada correctamente', deleted: result.rows[0] });

  } catch (error) {
    console.error('❌ [PROGRAMMING] Error al eliminar:', error);
    res.status(500).json({ 
      error: 'Error al eliminar la programación',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/programming/bulk
 * Elimina múltiples elementos de programación
 */
router.post('/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de IDs' });
    }

    console.log('📅 [PROGRAMMING] Eliminando múltiples:', ids);

    // Eliminar registros relacionados
    await pool.query(
      'DELETE FROM programming_registrations WHERE programming_id = ANY($1)',
      [ids]
    );
    await pool.query(
      'DELETE FROM programming_images WHERE programming_id = ANY($1)',
      [ids]
    );

    // Eliminar elementos principales
    const result = await pool.query(
      'DELETE FROM programming WHERE id = ANY($1) RETURNING id',
      [ids]
    );

    console.log('📅 [PROGRAMMING] Eliminados:', result.rowCount);
    res.json({ 
      message: `${result.rowCount} elementos eliminados`,
      deletedIds: result.rows.map(r => r.id)
    });

  } catch (error) {
    console.error('❌ [PROGRAMMING] Error en bulk delete:', error);
    res.status(500).json({ 
      error: 'Error al eliminar la programación',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/programming/parks
 * Obtiene la lista de parques para el selector
 */
router.get('/parks/list', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, name FROM parks ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ [PROGRAMMING] Error:', error);
    res.status(500).json({ error: 'Error al obtener parques' });
  }
});

/**
 * GET /api/programming/instructors
 * Obtiene la lista de instructores para el selector
 */
router.get('/instructors/list', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name as "fullName" FROM instructors ORDER BY full_name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ [PROGRAMMING] Error:', error);
    res.status(500).json({ error: 'Error al obtener instructores' });
  }
});

export default router;