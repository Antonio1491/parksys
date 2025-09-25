import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// ====================================
// INTERFACES
// ====================================

interface SpaceMapping {
  id?: number;
  pageType: string;
  position: string;
  spaceId: number;
  isActive: boolean;
  priority: number;
  fallbackBehavior: 'hide' | 'placeholder' | 'alternative';
  layoutConfig?: {
    responsive: boolean;
    aspectRatio?: string;
    maxWidth?: string;
    minHeight?: string;
    customStyles?: Record<string, string>;
  };
}

// ====================================
// CREAR TABLA SI NO EXISTE
// ====================================

async function ensureSpaceMappingTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS space_mappings (
        id SERIAL PRIMARY KEY,
        page_type VARCHAR(50) NOT NULL,
        position VARCHAR(50) NOT NULL,
        space_id INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 1,
        fallback_behavior VARCHAR(20) DEFAULT 'hide',
        layout_config JSONB DEFAULT '{"responsive": true}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(page_type, position, space_id),
        FOREIGN KEY (space_id) REFERENCES ad_spaces(id) ON DELETE CASCADE
      )
    `);

    // Crear índices para mejor rendimiento
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_space_mappings_page_position 
      ON space_mappings(page_type, position, is_active)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_space_mappings_space_id 
      ON space_mappings(space_id)
    `);

    console.log('✅ Tabla space_mappings inicializada correctamente');
  } catch (error) {
    console.error('❌ Error creando tabla space_mappings:', error);
  }
}

// Inicializar tabla al cargar el módulo
ensureSpaceMappingTable();

// ====================================
// FUNCIONES DE UTILIDAD
// ====================================

const validateSpaceMapping = (mapping: Partial<SpaceMapping>): string[] => {
  const errors: string[] = [];
  
  if (!mapping.pageType) errors.push('pageType es requerido');
  if (!mapping.position) errors.push('position es requerido');
  if (!mapping.spaceId) errors.push('spaceId es requerido');
  if (mapping.priority && (mapping.priority < 1 || mapping.priority > 10)) {
    errors.push('priority debe estar entre 1 y 10');
  }
  if (mapping.fallbackBehavior && !['hide', 'placeholder', 'alternative'].includes(mapping.fallbackBehavior)) {
    errors.push('fallbackBehavior debe ser hide, placeholder o alternative');
  }
  
  return errors;
};

// ====================================
// ENDPOINTS
// ====================================

// GET /api/advertising-management/space-mappings - Obtener todos los mapeos
router.get('/', async (req, res) => {
  try {
    const { pageType, position, active } = req.query;
    
    let query = `
      SELECT 
        sm.*,
        ads.name as space_name,
        ads.dimensions as space_dimensions,
        ads.page_type as space_page_type
      FROM space_mappings sm
      JOIN ad_spaces ads ON sm.space_id = ads.id
    `;
    
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 0;
    
    if (pageType) {
      paramCount++;
      conditions.push(`sm.page_type = $${paramCount}`);
      values.push(pageType);
    }
    
    if (position) {
      paramCount++;
      conditions.push(`sm.position = $${paramCount}`);
      values.push(position);
    }
    
    if (active !== undefined) {
      paramCount++;
      conditions.push(`sm.is_active = $${paramCount}`);
      values.push(active === 'true');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY sm.priority DESC, sm.created_at ASC';
    
    const result = await pool.query(query, values);
    
    const mappings = result.rows.map(row => ({
      id: row.id,
      pageType: row.page_type,
      position: row.position,
      spaceId: row.space_id,
      isActive: row.is_active,
      priority: row.priority,
      fallbackBehavior: row.fallback_behavior,
      layoutConfig: row.layout_config,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      space: {
        name: row.space_name,
        dimensions: row.space_dimensions,
        pageType: row.space_page_type
      }
    }));
    
    console.log(`🗺️ Obtenidos ${mappings.length} mapeos de espacios`);
    
    res.json({
      success: true,
      data: mappings,
      total: mappings.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo mapeos de espacios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/advertising-management/space-mappings - Crear nuevo mapeo
router.post('/', async (req, res) => {
  try {
    const mapping: Partial<SpaceMapping> = req.body;
    
    // Validar datos
    const validationErrors = validateSpaceMapping(mapping);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: validationErrors
      });
    }
    
    // Verificar que el espacio existe y está activo
    const spaceCheck = await pool.query(
      'SELECT id, is_active FROM ad_spaces WHERE id = $1',
      [mapping.spaceId]
    );
    
    if (spaceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Espacio publicitario no encontrado'
      });
    }
    
    if (!spaceCheck.rows[0].is_active) {
      return res.status(400).json({
        success: false,
        error: 'No se puede mapear un espacio inactivo'
      });
    }
    
    // Verificar si ya existe un mapeo para esta página/posición
    const existingMapping = await pool.query(
      'SELECT id FROM space_mappings WHERE page_type = $1 AND position = $2 AND is_active = true',
      [mapping.pageType, mapping.position]
    );
    
    if (existingMapping.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un mapeo activo para esta página/posición'
      });
    }
    
    // Crear el mapeo
    const result = await pool.query(`
      INSERT INTO space_mappings (
        page_type, position, space_id, is_active, priority, 
        fallback_behavior, layout_config, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      mapping.pageType,
      mapping.position,
      mapping.spaceId,
      mapping.isActive ?? true,
      mapping.priority ?? 1,
      mapping.fallbackBehavior ?? 'hide',
      JSON.stringify(mapping.layoutConfig ?? { responsive: true })
    ]);
    
    const createdMapping = {
      id: result.rows[0].id,
      pageType: result.rows[0].page_type,
      position: result.rows[0].position,
      spaceId: result.rows[0].space_id,
      isActive: result.rows[0].is_active,
      priority: result.rows[0].priority,
      fallbackBehavior: result.rows[0].fallback_behavior,
      layoutConfig: result.rows[0].layout_config,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
    
    console.log(`✅ Mapeo de espacio creado: ${mapping.pageType}:${mapping.position} -> espacio ${mapping.spaceId}`);
    
    res.status(201).json({
      success: true,
      data: createdMapping
    });
    
  } catch (error) {
    console.error('❌ Error creando mapeo de espacio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/advertising-management/space-mappings/:id - Actualizar mapeo
router.put('/:id', async (req, res) => {
  try {
    const mappingId = parseInt(req.params.id);
    const updates: Partial<SpaceMapping> = req.body;
    
    if (isNaN(mappingId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de mapeo inválido'
      });
    }
    
    // Verificar que el mapeo existe
    const existingMapping = await pool.query(
      'SELECT * FROM space_mappings WHERE id = $1',
      [mappingId]
    );
    
    if (existingMapping.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Mapeo no encontrado'
      });
    }
    
    // Construir query de actualización dinámicamente
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;
    
    if (updates.pageType !== undefined) {
      paramCount++;
      updateFields.push(`page_type = $${paramCount}`);
      values.push(updates.pageType);
    }
    
    if (updates.position !== undefined) {
      paramCount++;
      updateFields.push(`position = $${paramCount}`);
      values.push(updates.position);
    }
    
    if (updates.spaceId !== undefined) {
      paramCount++;
      updateFields.push(`space_id = $${paramCount}`);
      values.push(updates.spaceId);
    }
    
    if (updates.isActive !== undefined) {
      paramCount++;
      updateFields.push(`is_active = $${paramCount}`);
      values.push(updates.isActive);
    }
    
    if (updates.priority !== undefined) {
      paramCount++;
      updateFields.push(`priority = $${paramCount}`);
      values.push(updates.priority);
    }
    
    if (updates.fallbackBehavior !== undefined) {
      paramCount++;
      updateFields.push(`fallback_behavior = $${paramCount}`);
      values.push(updates.fallbackBehavior);
    }
    
    if (updates.layoutConfig !== undefined) {
      paramCount++;
      updateFields.push(`layout_config = $${paramCount}`);
      values.push(JSON.stringify(updates.layoutConfig));
    }
    
    // Siempre actualizar updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    
    // Agregar ID para WHERE clause
    paramCount++;
    values.push(mappingId);
    
    if (updateFields.length === 1) { // Solo updated_at
      return res.status(400).json({
        success: false,
        error: 'No se proporcionaron campos para actualizar'
      });
    }
    
    const query = `
      UPDATE space_mappings 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    const updatedMapping = {
      id: result.rows[0].id,
      pageType: result.rows[0].page_type,
      position: result.rows[0].position,
      spaceId: result.rows[0].space_id,
      isActive: result.rows[0].is_active,
      priority: result.rows[0].priority,
      fallbackBehavior: result.rows[0].fallback_behavior,
      layoutConfig: result.rows[0].layout_config,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
    
    console.log(`🔄 Mapeo de espacio actualizado: ID ${mappingId}`);
    
    res.json({
      success: true,
      data: updatedMapping
    });
    
  } catch (error) {
    console.error('❌ Error actualizando mapeo de espacio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/advertising-management/space-mappings/:id - Eliminar mapeo
router.delete('/:id', async (req, res) => {
  try {
    const mappingId = parseInt(req.params.id);
    
    if (isNaN(mappingId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de mapeo inválido'
      });
    }
    
    const result = await pool.query(
      'DELETE FROM space_mappings WHERE id = $1 RETURNING *',
      [mappingId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Mapeo no encontrado'
      });
    }
    
    console.log(`🗑️ Mapeo de espacio eliminado: ID ${mappingId}`);
    
    res.json({
      success: true,
      message: 'Mapeo eliminado correctamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando mapeo de espacio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// RUTA DUPLICADA REMOVIDA - La ruta principal router.get('/', ...) ya maneja estos filtros con pageType y position

// POST /api/advertising-management/space-mappings/auto-populate - Auto-poblar mapeos faltantes
router.post('/auto-populate', async (req, res) => {
  try {
    // Obtener espacios sin mapeo
    const orphanedSpaces = await pool.query(`
      SELECT ads.* 
      FROM ad_spaces ads
      LEFT JOIN space_mappings sm ON ads.id = sm.space_id AND sm.is_active = true
      WHERE ads.is_active = true AND sm.id IS NULL
    `);
    
    const createdMappings: any[] = [];
    
    for (const space of orphanedSpaces.rows) {
      try {
        // Crear mapeo automático basado en page_type y position del espacio
        const result = await pool.query(`
          INSERT INTO space_mappings (
            page_type, position, space_id, is_active, priority, 
            fallback_behavior, layout_config
          ) VALUES ($1, $2, $3, true, 1, 'hide', '{"responsive": true}')
          RETURNING *
        `, [space.page_type, space.position, space.id]);
        
        createdMappings.push({
          id: result.rows[0].id,
          pageType: result.rows[0].page_type,
          position: result.rows[0].position,
          spaceId: result.rows[0].space_id,
          spaceName: space.name
        });
        
      } catch (mappingError) {
        console.warn(`⚠️ No se pudo crear mapeo automático para espacio ${space.id}:`, mappingError);
      }
    }
    
    console.log(`🤖 Auto-poblados ${createdMappings.length} mapeos de espacios`);
    
    res.json({
      success: true,
      data: createdMappings,
      message: `Se crearon ${createdMappings.length} mapeos automáticamente`
    });
    
  } catch (error) {
    console.error('❌ Error en auto-población de mapeos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;