import { Router } from 'express';
import { db, pool } from './db';
import { adCampaigns, advertisements, adPlacements, adAnalytics } from '../shared/advertising-schema';
import { eq, gte, lte, desc, asc, sql } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import { isAuthenticated } from './middleware/auth';
import { replitObjectStorage } from './objectStorage-replit';

const router = Router();

// Configuración de multer para subida de imágenes publicitarias
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/advertisements/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ad-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ===================
// CAMPAÑAS PUBLICITARIAS
// ===================

// Obtener todas las campañas
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await db
      .select()
      .from(adCampaigns)
      .orderBy(desc(adCampaigns.createdAt));

    // Convertir fechas PostgreSQL a ISO string sin cambiar timezone
    const formattedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      startDate: campaign.startDate 
        ? String(campaign.startDate).replace(' ', 'T').replace('+00', '.000Z')
        : null,
      endDate: campaign.endDate 
        ? String(campaign.endDate).replace(' ', 'T').replace('+00', '.000Z')
        : null,
      createdAt: campaign.createdAt 
        ? String(campaign.createdAt).replace(' ', 'T').replace('+00', '.000Z')
        : null,
      updatedAt: campaign.updatedAt 
        ? String(campaign.updatedAt).replace(' ', 'T').replace('+00', '.000Z')
        : null,
    }));

    res.json({ success: true, data: formattedCampaigns });
  } catch (error) {
    console.error('Error obteniendo campañas:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo campañas' });
  }
});

router.get('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [campaign] = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.id, parseInt(id)));

    if (!campaign) {
      return res.status(404).json({ 
        success: false, 
        error: 'Campaña no encontrada' 
      });
    }

    // Convertir fechas PostgreSQL a ISO string sin cambiar timezone
    const formattedCampaign = {
      ...campaign,
      startDate: campaign.startDate 
        ? String(campaign.startDate).replace(' ', 'T').replace('+00', '.000Z')
        : null,
      endDate: campaign.endDate 
        ? String(campaign.endDate).replace(' ', 'T').replace('+00', '.000Z')
        : null,
      createdAt: campaign.createdAt 
        ? String(campaign.createdAt).replace(' ', 'T').replace('+00', '.000Z')
        : null,
      updatedAt: campaign.updatedAt 
        ? String(campaign.updatedAt).replace(' ', 'T').replace('+00', '.000Z')
        : null,
    };

    res.json({ success: true, data: formattedCampaign });
  } catch (error) {
    console.error('Error obteniendo campaña:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo campaña' });
  }
});

// Crear nueva campaña
router.post('/campaigns', isAuthenticated, async (req, res) => {
  try {
    const { name, client, description, startDate, endDate, budget, priority, status } = req.body;
    
    const [campaign] = await db.insert(adCampaigns).values({
      name,
      client,
      description: description || null,
      startDate: new Date(startDate + 'T00:00:00Z').toISOString(),
      endDate: new Date(endDate + 'T23:59:59Z').toISOString(),
      budget: budget ? budget.toString() : '0.00',
      priority: priority || 'medium',
      status: status || 'active'
    }).returning();
    
    res.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Error creando campaña:', error);
    res.status(500).json({ success: false, error: 'Error creando campaña' });
  }
});

// Actualizar campaña
router.put('/campaigns/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, client, description, startDate, endDate, budget, priority, status } = req.body;
    
    const [campaign] = await db.update(adCampaigns)
    .set({
      name,
      client,
      description: description || null,
      startDate: new Date(startDate + 'T00:00:00Z').toISOString(),
      endDate: new Date(endDate + 'T23:59:59Z').toISOString(),
      budget: budget ? budget.toString() : '0.00',
      priority,
      status,
      updatedAt: new Date()
    })
    .where(eq(adCampaigns.id, parseInt(id)))
    .returning();
    
    res.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Error actualizando campaña:', error);
    res.status(500).json({ success: false, error: 'Error actualizando campaña' });
  }
});

// Eliminar campaña
router.delete('/campaigns/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Primero eliminar placements de anuncios de esta campaña
    const adsInCampaign = await db
      .select({ id: advertisements.id })
      .from(advertisements)
      .where(eq(advertisements.campaignId, parseInt(id)));

    const adIds = adsInCampaign.map(ad => ad.id);

    if (adIds.length > 0) {
      await db.delete(adPlacements)
        .where(inArray(adPlacements.advertisementId, adIds));
    }

    // Luego eliminar anuncios de esta campaña
    await db.delete(advertisements)
      .where(eq(advertisements.campaignId, parseInt(id)));

    // Finalmente eliminar la campaña
    await db.delete(adCampaigns)
      .where(eq(adCampaigns.id, parseInt(id)));

    res.json({ 
      success: true, 
      message: 'Campaña eliminada exitosamente' 
    });
  } catch (error) {
    console.error('Error eliminando campaña:', error);
    res.status(500).json({ success: false, error: 'Error eliminando campaña' });
  }
});

// ===================
// ESPACIOS PUBLICITARIOS
// ===================

// Obtener todos los espacios
router.get('/spaces', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ad_spaces ORDER BY id ASC');
    const spaces = result.rows.map(row => ({
      id: row.id,
      name: row.name || `Espacio ${row.id}`,
      description: row.description,
      pageType: row.page_type,
      position: row.position,
      dimensions: row.dimensions,
      maxFileSize: row.max_file_size,
      allowedFormats: row.allowed_formats,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,

    }));
    res.json({ success: true, data: spaces });
  } catch (error) {
    console.error('Error obteniendo espacios:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo espacios' });
  }
});

// Crear nuevo espacio
router.post('/spaces', isAuthenticated, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      pageType, 
      position, 
      dimensions, 
      maxFileSize, 
      allowedFormats, 
      isActive 
    } = req.body;

    console.log('📝 Creando espacio:', req.body);

    const result = await pool.query(
      `INSERT INTO ad_spaces (
         name,
         description,
         page_type,
         position,
         dimensions,
         max_file_size,
         allowed_formats,
         is_active,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name,
        description || null,
        pageType,
        position,
        dimensions || null,
        maxFileSize || 5242880,
        allowedFormats, // Ya viene como array desde el frontend
        isActive !== undefined ? isActive : true,
        new Date(),
        new Date()
      ]
    );

    const space = result.rows[0];

    // Mapear respuesta a camelCase
    const response = {
      id: space.id,
      name: space.name,
      description: space.description,
      pageType: space.page_type,
      position: space.position,
      dimensions: space.dimensions,
      maxFileSize: space.max_file_size,
      allowedFormats: space.allowed_formats,
      isActive: space.is_active,
      createdAt: space.created_at,
      updatedAt: space.updated_at
    };

    console.log('✅ Espacio creado:', response);

    res.json({ success: true, data: response });
  } catch (error) {
    console.error('❌ Error creando espacio:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error creando espacio',
      details: error.message 
    });
  }
});

// Actualizar espacio publicitario
router.put('/spaces/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      pageType, 
      position, 
      dimensions, 
      maxFileSize, 
      allowedFormats, 
      isActive 
    } = req.body;

    console.log('📝 Actualizando espacio:', id, req.body);

    const result = await pool.query(
      `UPDATE ad_spaces 
       SET 
         name = $1,
         description = $2,
         page_type = $3,
         position = $4,
         dimensions = $5,
         max_file_size = $6,
         allowed_formats = $7,
         is_active = $8,
         updated_at = CURRENT_TIMESTAMP 
       WHERE id = $9 
       RETURNING *`,
      [
        name,
        description || null,
        pageType,
        position,
        dimensions || null,
        maxFileSize || 5242880,
        allowedFormats, // Ya viene como array desde el frontend
        isActive !== undefined ? isActive : true,
        parseInt(id)
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Espacio no encontrado' 
      });
    }

    const space = result.rows[0];

    // Mapear respuesta a camelCase
    const response = {
      id: space.id,
      name: space.name,
      description: space.description,
      pageType: space.page_type,
      position: space.position,
      dimensions: space.dimensions,
      maxFileSize: space.max_file_size,
      allowedFormats: space.allowed_formats,
      isActive: space.is_active,
      createdAt: space.created_at,
      updatedAt: space.updated_at
    };

    console.log('✅ Espacio actualizado:', response);

    res.json({ success: true, data: response });
  } catch (error) {
    console.error('❌ Error actualizando espacio:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error actualizando espacio',
      details: error.message 
    });
  }
});

// Eliminar espacio publicitario
router.delete('/spaces/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Eliminando espacio:', id);

    // Verificar si hay placements activos usando este espacio
    const placementsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM ad_placements WHERE ad_space_id = $1 AND is_active = true',
      [parseInt(id)]
    );

    if (parseInt(placementsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se puede eliminar el espacio porque tiene asignaciones activas' 
      });
    }

    const result = await pool.query(
      'DELETE FROM ad_spaces WHERE id = $1 RETURNING *',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Espacio no encontrado' 
      });
    }

    console.log('✅ Espacio eliminado:', result.rows[0]);

    res.json({ 
      success: true, 
      message: 'Espacio eliminado exitosamente' 
    });
  } catch (error) {
    console.error('❌ Error eliminando espacio:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error eliminando espacio',
      details: error.message 
    });
  }
});

// ===================
// SPACE MAPPING (para componente público)
// ===================

// Obtener espacios mapeados para una página/posición específica
router.get('/space-mapping', async (req, res) => {
  try {
    const { pageType, position } = req.query;

    if (!pageType || !position) {
      return res.status(400).json({ 
        success: false, 
        error: 'pageType y position son requeridos' 
      });
    }

    const result = await pool.query(`
      SELECT 
        id as space_id,
        name,
        page_type,
        position,
        dimensions,
        is_active
      FROM ad_spaces
      WHERE page_type = $1 
        AND position = $2 
        AND is_active = true
      ORDER BY id ASC
      LIMIT 1
    `, [pageType, position]);

    // Formatear respuesta para el frontend
    const mappings = result.rows.map(row => ({
      spaceId: row.space_id,
      name: row.name,
      pageType: row.page_type,
      position: row.position,
      dimensions: row.dimensions,
      isActive: row.is_active,
      fallbackBehavior: 'hide' // Valor por defecto
    }));

    res.json({ success: true, data: mappings });
  } catch (error) {
    console.error('Error obteniendo space mapping:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error obteniendo mapeo de espacios' 
    });
  }
});

// ===================
// ANUNCIOS
// ===================

// Obtener todos los anuncios
router.get('/advertisements', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.*,
        c.name as campaign_name,
        c.client as campaign_client
      FROM advertisements a
      LEFT JOIN ad_campaigns c ON a.campaign_id = c.id
      ORDER BY a.created_at DESC
    `);

    const ads = result.rows.map(row => ({
      id: row.id,
      campaignId: row.campaign_id,
      title: row.title,
      description: row.description,
      mediaUrl: row.media_url,
      mediaType: row.media_type,
      thumbnailUrl: row.thumbnail_url,
      duration: row.duration,
      linkUrl: row.link_url,
      buttonText: row.button_text,
      adType: row.ad_type,
      priority: row.priority,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Relación con campaña
      campaign: row.campaign_id ? {
        name: row.campaign_name,
        client: row.campaign_client
      } : null
    }));

    res.json({ success: true, data: ads });
  } catch (error) {
    console.error('Error obteniendo anuncios:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo anuncios' });
  }
});

// Obtener anuncios por campaña
router.get('/campaigns/:campaignId/advertisements', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const result = await pool.query(`
      SELECT * FROM advertisements 
      WHERE campaign_id = $1
      ORDER BY created_at DESC
    `, [parseInt(campaignId)]);

    const ads = result.rows.map(row => ({
      id: row.id,
      campaignId: row.campaign_id,
      title: row.title,
      description: row.description,
      mediaUrl: row.media_url,
      mediaType: row.media_type,
      thumbnailUrl: row.thumbnail_url,
      duration: row.duration,
      linkUrl: row.link_url,
      buttonText: row.button_text,
      adType: row.ad_type,
      priority: row.priority,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({ success: true, data: ads });
  } catch (error) {
    console.error('Error obteniendo anuncios:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo anuncios' });
  }
});

// Obtener anuncio por ID
router.get('/advertisements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        a.*,
        c.name as campaign_name,
        c.client as campaign_client
      FROM advertisements a
      LEFT JOIN ad_campaigns c ON a.campaign_id = c.id
      WHERE a.id = $1
    `, [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Anuncio no encontrado' });
    }

    const row = result.rows[0];
    const ad = {
      id: row.id,
      campaignId: row.campaign_id,
      title: row.title,
      description: row.description,
      mediaUrl: row.media_url,
      mediaType: row.media_type,
      thumbnailUrl: row.thumbnail_url,
      duration: row.duration,
      linkUrl: row.link_url,
      buttonText: row.button_text,
      adType: row.ad_type,
      priority: row.priority,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      campaign: row.campaign_id ? {
        name: row.campaign_name,
        client: row.campaign_client
      } : null
    };

    res.json({ success: true, data: ad });
  } catch (error) {
    console.error('Error obteniendo anuncio:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo anuncio' });
  }
});

// Crear nuevo anuncio
router.post('/advertisements', isAuthenticated, async (req, res) => {
  try {
    const { 
      campaignId, title, description, mediaUrl, mediaType,
      thumbnailUrl, duration, linkUrl, buttonText, adType,
      priority, isActive
    } = req.body;

    console.log('📝 Creando anuncio:', req.body);

    const result = await pool.query(`
      INSERT INTO advertisements (
        campaign_id, title, description, media_url, media_type,
        thumbnail_url, duration, link_url, button_text, ad_type,
        priority, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      campaignId || null,
      title,
      description || null,
      mediaUrl || null,
      mediaType || 'image',
      thumbnailUrl || null,
      duration || null,
      linkUrl || null,
      buttonText || null,
      adType || 'banner',
      priority || 5,
      isActive !== undefined ? isActive : true
    ]);

    const row = result.rows[0];
    console.log('✅ Anuncio creado:', row.id);

    res.json({ 
      success: true, 
      data: {
        id: row.id,
        campaignId: row.campaign_id,
        title: row.title,
        description: row.description,
        mediaUrl: row.media_url,
        mediaType: row.media_type,
        thumbnailUrl: row.thumbnail_url,
        duration: row.duration,
        linkUrl: row.link_url,
        buttonText: row.button_text,
        adType: row.ad_type,
        priority: row.priority,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Error creando anuncio:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error creando anuncio' 
    });
  }
});

// Actualizar anuncio
router.put('/advertisements/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      campaignId,
      title,
      description,
      mediaUrl,
      mediaType,
      thumbnailUrl,
      duration,
      linkUrl,
      buttonText,
      adType,
      priority,
      isActive
    } = req.body;

    console.log('Actualizando anuncio con datos:', req.body);

    const result = await pool.query(`
      UPDATE advertisements 
      SET 
        campaign_id = $1,
        title = $2,
        description = $3,
        media_url = $4,
        media_type = $5,
        thumbnail_url = $6,
        duration = $7,
        link_url = $8,
        button_text = $9,
        ad_type = $10,
        priority = $11,
        is_active = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [
      campaignId || null,
      title,
      description || null,
      mediaUrl || null,
      mediaType,
      thumbnailUrl || null,
      duration || null,
      linkUrl || null,
      buttonText || null,
      adType,
      priority || 5,
      isActive !== undefined ? isActive : true,
      parseInt(id)
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Anuncio no encontrado' });
    }

    const row = result.rows[0];
    const response = {
      id: row.id,
      campaignId: row.campaign_id,
      title: row.title,
      description: row.description,
      mediaUrl: row.media_url,
      mediaType: row.media_type,
      thumbnailUrl: row.thumbnail_url,
      duration: row.duration,
      linkUrl: row.link_url,
      buttonText: row.button_text,
      adType: row.ad_type,
      priority: row.priority,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Error actualizando anuncio:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar anuncio
router.delete('/advertisements/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Eliminando anuncio:', id);

    const result = await pool.query(
      'DELETE FROM advertisements WHERE id = $1 RETURNING *',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Anuncio no encontrado' 
      });
    }

    console.log('✅ Anuncio eliminado:', result.rows[0].id);

    res.json({ 
      success: true, 
      message: 'Anuncio eliminado correctamente' 
    });
  } catch (error) {
    console.error('❌ Error eliminando anuncio:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error eliminando anuncio' 
    });
  }
});

// ===================
// ASIGNACIONES (PLACEMENTS) - ACTUALIZADO CON PATRÓN UTC
// ===================

// Obtener placements para el admin (con todos los datos)
router.get('/placements', async (req, res) => {
  try {
    const { isActive } = req.query;

    console.log('🔍 GET /placements (admin)');

    let query = `
      SELECT 
        ap.id,
        ap.advertisement_id,
        ap.ad_space_id,
        ap.page_id,
        ap.priority,
        ap.start_date,
        ap.end_date,
        ap.is_active,
        ap.frequency,
        ap.scheduled_days,
        ap.scheduled_hours,
        ap.impressions,
        ap.clicks,
        ap.created_at,
        ap.updated_at,
        a.title as ad_title,
        ads.name as space_name,
        ads.page_type as page_type,
        ads.position as space_position
      FROM ad_placements ap
      LEFT JOIN advertisements a ON ap.advertisement_id = a.id
      LEFT JOIN ad_spaces ads ON ap.ad_space_id = ads.id
    `;

    const params = [];

    // Filtro opcional por estado activo
    if (isActive !== undefined) {
      query += ` WHERE ap.is_active = $1`;
      params.push(isActive === 'true');
    }

    query += ` ORDER BY ap.created_at DESC`;

    const result = await pool.query(query, params);

    console.log(`✅ Admin placements encontrados: ${result.rows.length}`);

    const formattedData = result.rows.map(row => ({
      id: row.id,
      advertisementId: row.advertisement_id,
      adSpaceId: row.ad_space_id,
      pageType: row.page_type,
      pageId: row.page_id,
      priority: row.priority,
      startDate: row.start_date,
      endDate: row.end_date,
      isActive: row.is_active,
      frequency: row.frequency || 'always',
      scheduledDays: row.scheduled_days,
      scheduledHours: row.scheduled_hours,
      impressions: row.impressions || 0,
      clicks: row.clicks || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      advertisement: {
        title: row.ad_title
      },
      space: {
        name: row.space_name,
        pageType: row.space_page_type,
        position: row.space_position
      }
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('❌ Error obteniendo placements:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo placements' });
  }
});

// GET - Obtener un placement por ID
router.get('/placements/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        ap.*,
        a.title as ad_title,
        ads.name as space_name,
        ads.page_type as page_type
      FROM ad_placements ap
      LEFT JOIN advertisements a ON ap.advertisement_id = a.id
      LEFT JOIN ad_spaces ads ON ap.ad_space_id = ads.id
      WHERE ap.id = $1
    `, [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Placement no encontrado' 
      });
    }

    const row = result.rows[0];
    const placement = {
      id: row.id,
      advertisementId: row.advertisement_id,
      adSpaceId: row.ad_space_id,
      pageType: row.page_type,
      pageId: row.page_id,
      startDate: row.start_date ? new Date(row.start_date).toISOString() : null,
      endDate: row.end_date ? new Date(row.end_date).toISOString() : null,
      priority: row.priority,
      isActive: row.is_active,
      frequency: row.frequency,
      scheduledDays: row.scheduled_days,
      scheduledHours: row.scheduled_hours,
      impressions: row.impressions,
      clicks: row.clicks,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      advertisement: row.ad_title ? {
        title: row.ad_title
      } : null,
      space: row.space_name ? {
        name: row.space_name
      } : null
    };

    res.json({ success: true, data: placement });
  } catch (error) {
    console.error('Error obteniendo placement:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo placement' });
  }
});

// POST - Crear nuevo placement con validación
router.post('/placements', isAuthenticated, async (req, res) => {
  try {
    const { 
      advertisementId, 
      adSpaceId, 
      pageId,
      startDate, 
      endDate,
      priority,
      isActive,
      frequency,
      scheduledDays,
      scheduledHours
    } = req.body;

    console.log('📝 Creando placement:', req.body);

    // Validaciones básicas
    if (!advertisementId || !adSpaceId || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos requeridos: advertisementId, adSpaceId, startDate, endDate' 
      });
    }

    // Validar que startDate sea menor que endDate
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T23:59:59Z');

    if (start >= end) {
      return res.status(400).json({ 
        success: false, 
        error: 'La fecha de inicio debe ser anterior a la fecha de fin' 
      });
    }

    const result = await pool.query(`
      INSERT INTO ad_placements (
        advertisement_id,
        ad_space_id,
        page_id,
        start_date,
        end_date,
        priority,
        is_active,
        frequency,
        scheduled_days,
        scheduled_hours,
        impressions,
        clicks,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      parseInt(advertisementId),
      parseInt(adSpaceId),
      pageId ? parseInt(pageId) : null,
      start.toISOString(),
      end.toISOString(),
      priority || 5,
      isActive !== undefined ? isActive : true,
      frequency || 'always',
      scheduledDays || null,
      scheduledHours || null,
      0, // impressions inicial
      0, // clicks inicial
      new Date().toISOString(),
      new Date().toISOString()
    ]);

    // Al retornar, obtener pageType del space
    const row = result.rows[0];

    // Obtener el pageType del space
    const spaceResult = await pool.query(
      'SELECT page_type FROM ad_spaces WHERE id = $1',
      [row.ad_space_id]
    );
    
    const placement = {
      id: row.id,
      advertisementId: row.advertisement_id,
      adSpaceId: row.ad_space_id,
      pageType: spaceResult.rows[0]?.page_type,
      pageId: row.page_id,
      startDate: row.start_date ? new Date(row.start_date).toISOString() : null,
      endDate: row.end_date ? new Date(row.end_date).toISOString() : null,
      priority: row.priority,
      isActive: row.is_active,
      frequency: row.frequency,
      scheduledDays: row.scheduled_days,
      scheduledHours: row.scheduled_hours,
      impressions: row.impressions,
      clicks: row.clicks,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
    };

    console.log('✅ Placement creado:', placement);

    res.json({ success: true, data: placement });
  } catch (error) {
    console.error('❌ Error creando placement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error creando placement',
      details: error.message 
    });
  }
});

// PUT - Actualizar placement
router.put('/placements/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      advertisementId, 
      adSpaceId,  
      pageId,
      startDate, 
      endDate,
      priority,
      isActive,
      frequency,
      scheduledDays,
      scheduledHours
    } = req.body;

    console.log('📝 Actualizando placement:', id, req.body);

    // Validaciones básicas
    if (!advertisementId || !adSpaceId || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos requeridos: advertisementId, adSpaceId, startDate, endDate' 
      });
    }

    // Validar que startDate sea menor que endDate
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T23:59:59Z');

    if (start >= end) {
      return res.status(400).json({ 
        success: false, 
        error: 'La fecha de inicio debe ser anterior a la fecha de fin' 
      });
    }

    const result = await pool.query(`
      UPDATE ad_placements 
      SET 
        advertisement_id = $1,
        ad_space_id = $2,
        page_id = $3,
        start_date = $4,
        end_date = $5,
        priority = $6,
        is_active = $7,
        frequency = $8,
        scheduled_days = $9,
        scheduled_hours = $10,
        updated_at = $11
      WHERE id = $12
      RETURNING *
    `, [
      parseInt(advertisementId),
      parseInt(adSpaceId),
      pageId ? parseInt(pageId) : null,
      start.toISOString(),
      end.toISOString(),
      priority || 5,
      isActive !== undefined ? isActive : true,
      frequency || 'always',
      scheduledDays || null,
      scheduledHours || null,
      new Date().toISOString(),
      parseInt(id)
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Placement no encontrado' 
      });
    }

    // Al retornar, obtener pageType del space
    const row = result.rows[0];

    const spaceResult = await pool.query(
      'SELECT page_type FROM ad_spaces WHERE id = $1',
      [row.ad_space_id]
    );
    
    const placement = {
      id: row.id,
      advertisementId: row.advertisement_id,
      adSpaceId: row.ad_space_id,
      pageType: spaceResult.rows[0]?.page_type,
      pageId: row.page_id,
      startDate: row.start_date ? new Date(row.start_date).toISOString() : null,
      endDate: row.end_date ? new Date(row.end_date).toISOString() : null,
      priority: row.priority,
      isActive: row.is_active,
      frequency: row.frequency,
      scheduledDays: row.scheduled_days,
      scheduledHours: row.scheduled_hours,
      impressions: row.impressions,
      clicks: row.clicks,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
    };

    console.log('✅ Placement actualizado:', placement);

    res.json({ success: true, data: placement });
  } catch (error) {
    console.error('❌ Error actualizando placement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error actualizando placement',
      details: error.message 
    });
  }
});

// DELETE - Eliminar placement
router.delete('/placements/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Eliminando placement:', id);

    const result = await pool.query(
      'DELETE FROM ad_placements WHERE id = $1 RETURNING *',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Placement no encontrado' 
      });
    }

    console.log('✅ Placement eliminado:', result.rows[0].id);

    res.json({ 
      success: true, 
      message: 'Placement eliminado exitosamente' 
    });
  } catch (error) {
    console.error('❌ Error eliminando placement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error eliminando placement',
      details: error.message 
    });
  }
});

// Obtener analytics por campaña
router.get('/analytics/campaigns/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const analytics = await db.select({
      date: adAnalytics.date,
      impressions: sql`SUM(${adAnalytics.impressions})`,
      clicks: sql`SUM(${adAnalytics.clicks})`,
      conversions: sql`SUM(${adAnalytics.conversions})`
    }).from(adAnalytics)
      .leftJoin(adPlacements, eq(adAnalytics.placementId, adPlacements.id))
      .leftJoin(advertisements, eq(adPlacements.adId, advertisements.id))
      .where(eq(advertisements.campaignId, parseInt(campaignId)))
      .groupBy(adAnalytics.date)
      .orderBy(desc(adAnalytics.date));
    
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error obteniendo analytics:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo analytics' });
  }
});

// ===================
// API PÚBLICA PARA PÁGINAS
// ===================

// Obtener anuncios para páginas públicas (usado por AdSpaceIntelligent)
router.get('/public/ads', async (req, res) => {
  try {
    const { pageType, position, spaceId } = req.query;

    console.log(`🔍 GET /public/ads - Params:`, { pageType, position, spaceId });

    let query = `
      SELECT 
        ap.id,
        ap.advertisement_id,
        ap.ad_space_id,
        ap.priority,
        ap.start_date,
        ap.end_date,
        ap.is_active,
        ap.frequency,
        a.id as ad_id,
        a.title,
        a.description,
        a.media_url as image_url,
        a.link_url as target_url,
        a.button_text,
        a.media_type,
        a.duration,
        a.is_active as ad_is_active,
        a.updated_at as ad_updated_at,
        ads.dimensions,
        ads.page_type as page_type
      FROM ad_placements ap
      LEFT JOIN advertisements a ON ap.advertisement_id = a.id
      LEFT JOIN ad_spaces ads ON ap.ad_space_id = ads.id
      WHERE ap.is_active = true 
        AND a.is_active = true
        AND ads.is_active = true
        AND ap.start_date <= CURRENT_DATE
        AND ap.end_date >= CURRENT_DATE
    `;

    const params = [];

    if (spaceId) {
      query += ` AND ads.id = $${params.length + 1}`;
      params.push(parseInt(spaceId as string));
    }

    if (pageType) {
      query += ` AND ads.page_type = $${params.length + 1}`;
      params.push(pageType);
    }

    if (position) {
      query += ` AND ads.position = $${params.length + 1}`;
      params.push(position);
    }

    query += ` ORDER BY ap.priority DESC LIMIT 10`;

    console.log(`📊 Query SQL:`, query);
    console.log(`📊 Params:`, params);

    const result = await pool.query(query, params);

    console.log(`✅ Placements públicos encontrados: ${result.rows.length}`);

    // Formatear datos para el frontend
    const formattedData = result.rows.map(row => ({
      id: row.id,
      spaceId: row.ad_space_id,
      advertisementId: row.advertisement_id,
      startDate: row.start_date,
      endDate: row.end_date,
      isActive: row.is_active,
      priority: row.priority,
      frequency: row.frequency || 'always',
      spaceDimensions: row.dimensions,
      advertisement: {
        id: row.ad_id,
        title: row.title,
        description: row.description,
        imageUrl: row.image_url ? replitObjectStorage.normalizeUrl(row.image_url) : null,
        targetUrl: row.target_url,
        buttonText: row.button_text,
        mediaType: row.media_type || 'image',
        duration: row.duration,
        isActive: row.ad_is_active,
        updatedAt: row.ad_updated_at
      }
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('❌ Error obteniendo anuncios públicos:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo anuncios públicos' });
  }
});

// ===================
// TRACKING ENDPOINTS
// ===================

// Endpoint para tracking de impresiones
router.post('/track-impression', async (req, res) => {
  try {
    const { placementId } = req.body;

    if (!placementId) {
      return res.status(400).json({
        success: false,
        error: 'placementId es requerido'
      });
    }

    // 1. Incrementar contador en ad_placements
    await pool.query(`
      UPDATE ad_placements 
      SET impressions = impressions + 1,
          updated_at = NOW()
      WHERE id = $1
    `, [parseInt(placementId)]);

    // 2. Registrar en ad_analytics (tabla diaria)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await pool.query(`
      INSERT INTO ad_analytics (placement_id, date, impressions, clicks, conversions, created_at, updated_at)
      VALUES ($1, $2, 1, 0, 0, NOW(), NOW())
      ON CONFLICT (placement_id, date) 
      DO UPDATE SET 
        impressions = ad_analytics.impressions + 1,
        updated_at = NOW()
    `, [parseInt(placementId), today]);

    console.log(`📊 Impresión registrada para placement ID: ${placementId}`);

    res.json({
      success: true,
      message: 'Impresión registrada'
    });
  } catch (error) {
    console.error('Error al registrar impresión:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar impresión'
    });
  }
});

// Endpoint para tracking de clicks
router.post('/track-click', async (req, res) => {
  try {
    const { placementId } = req.body;

    if (!placementId) {
      return res.status(400).json({
        success: false,
        error: 'placementId es requerido'
      });
    }

    // 1. Incrementar contador en ad_placements
    await pool.query(`
      UPDATE ad_placements 
      SET clicks = clicks + 1,
          updated_at = NOW()
      WHERE id = $1
    `, [parseInt(placementId)]);

    // 2. Registrar en ad_analytics (tabla diaria)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await pool.query(`
      INSERT INTO ad_analytics (placement_id, date, impressions, clicks, conversions, created_at, updated_at)
      VALUES ($1, $2, 0, 1, 0, NOW(), NOW())
      ON CONFLICT (placement_id, date) 
      DO UPDATE SET 
        clicks = ad_analytics.clicks + 1,
        updated_at = NOW()
    `, [parseInt(placementId), today]);

    console.log(`🖱️ Click registrado para placement ID: ${placementId}`);

    res.json({
      success: true,
      message: 'Click registrado'
    });
  } catch (error) {
    console.error('Error al registrar click:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar click'
    });
  }
});

export default router;