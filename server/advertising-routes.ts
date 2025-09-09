import { Router } from 'express';
import { db, pool } from './db';
import { adCampaigns, adSpaces, advertisements, adPlacements, adAnalytics } from '../shared/advertising-schema';
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';
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
    const campaigns = await db.select().from(adCampaigns).orderBy(desc(adCampaigns.createdAt));
    res.json({ success: true, data: campaigns });
  } catch (error) {
    console.error('Error obteniendo campañas:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo campañas' });
  }
});

// Crear nueva campaña
router.post('/campaigns', isAuthenticated, async (req, res) => {
  try {
    const { name, client, description, startDate, endDate, budget, priority } = req.body;
    
    const [campaign] = await db.insert(adCampaigns).values({
      name,
      client,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget,
      priority: priority || 0
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
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget,
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
    
    // Eliminar anuncios relacionados y sus asignaciones
    await db.delete(adPlacements).where(
      sql`ad_id IN (SELECT id FROM advertisements WHERE campaign_id = ${parseInt(id)})`
    );
    await db.delete(advertisements).where(eq(advertisements.campaignId, parseInt(id)));
    
    // Eliminar campaña
    await db.delete(adCampaigns).where(eq(adCampaigns.id, parseInt(id)));
    
    res.json({ success: true, message: 'Campaña eliminada exitosamente' });
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
      pageType: row.page_type,
      position: row.position,
      dimensions: row.dimensions,
      maxFileSize: row.max_file_size,
      allowedFormats: row.allowed_formats,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
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
    const { spaceKey, name, description, dimensions, locationType, pageTypes, maxAds } = req.body;
    
    const [space] = await db.insert(adSpaces).values({
      spaceKey,
      name,
      description,
      dimensions,
      locationType,
      pageTypes,
      maxAds: maxAds || 1
    }).returning();
    
    res.json({ success: true, data: space });
  } catch (error) {
    console.error('Error creando espacio:', error);
    res.status(500).json({ success: false, error: 'Error creando espacio' });
  }
});

// Actualizar espacio publicitario
router.put('/spaces/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const result = await pool.query(
      'UPDATE ad_spaces SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [isActive, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Espacio no encontrado' });
    }
    
    const space = result.rows[0];
    res.json({ success: true, data: {
      id: space.id,
      name: space.name,
      pageType: space.page_type,
      position: space.position,
      dimensions: space.dimensions,
      isActive: space.is_active,
      updatedAt: space.updated_at
    }});
  } catch (error) {
    console.error('Error actualizando espacio:', error);
    res.status(500).json({ success: false, error: 'Error actualizando espacio' });
  }
});

// ===================
// ANUNCIOS
// ===================

// Obtener todos los anuncios
router.get('/advertisements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM advertisements ORDER BY created_at DESC');
    const ads = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.image_url ? replitObjectStorage.normalizeUrl(row.image_url) : row.image_url,
      content: row.content,
      targetUrl: row.content, // Asegurar que targetUrl existe para el formulario de assignments
      button_text: row.button_text,
      altText: row.alt_text,
      campaignId: row.campaign_id,
      isActive: row.is_active,
      mediaType: row.media_type || 'image',
      storageType: row.storage_type || 'url',
      duration: row.duration || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json({ success: true, data: ads });
  } catch (error) {
    console.error('Error obteniendo anuncios:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo anuncios' });
  }
});

// Obtener mapeo completo de espacios publicitarios y anuncios
router.get('/space-mappings', async (req, res) => {
  try {
    const mappings = await pool.query(`
      SELECT 
        asp.id as space_id,
        asp.name as space_name,
        asp.page_type,
        asp.position,
        asp.description,
        ads.id as ad_id,
        ads.title as ad_title,
        ads.content as ad_content,
        ads.image_url,
        ads.content as link_url,
        ap.id as placement_id,
        ap.priority,
        ap.start_date,
        ap.end_date,
        ap.is_active as placement_active,
        asp.is_active as space_active
      FROM ad_spaces asp
      LEFT JOIN ad_placements ap ON asp.id = ap.ad_space_id AND ap.is_active = true
      LEFT JOIN advertisements ads ON ap.advertisement_id = ads.id
      ORDER BY asp.page_type, asp.position, asp.id
    `);
    
    res.json(mappings.rows);
  } catch (error) {
    console.error('Error al obtener mapeo de espacios:', error);
    res.status(500).json({ error: 'Error al obtener mapeo de espacios' });
  }
});

// Obtener anuncios por campaña
router.get('/campaigns/:campaignId/advertisements', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const result = await db.execute(sql`
      SELECT * FROM advertisements 
      WHERE campaign_id = ${parseInt(campaignId)}
      ORDER BY created_at DESC
    `);
    const ads = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.image_url ? replitObjectStorage.normalizeUrl(row.image_url) : row.image_url,
      content: row.content,
      button_text: row.button_text,
      campaignId: row.campaign_id,
      startDate: row.start_date,
      endDate: row.end_date,
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

// Crear nuevo anuncio
router.post('/advertisements', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { 
      campaign_id, 
      title, 
      description, 
      content, 
      image_url, 
      button_text,
      media_type, 
      storage_type, 
      duration, 
      alt_text, 
      is_active 
    } = req.body;
    
    console.log('Datos recibidos para crear anuncio:', req.body);
    
    // Usar SQL con SERIAL para generar ID automáticamente
    const result = await pool.query(`
      INSERT INTO advertisements (
        campaign_id, 
        title, 
        description, 
        content, 
        image_url, 
        button_text,
        media_type, 
        storage_type, 
        duration, 
        alt_text, 
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      campaign_id && campaign_id !== 0 ? parseInt(campaign_id) : null,
      title || 'Anuncio sin título',
      description || '',
      content || '',
      image_url || '',
      button_text || '',
      media_type || 'image',
      storage_type || 'url',
      duration ? parseInt(duration) : 0,
      alt_text || '',
      is_active !== undefined ? is_active : true,
      new Date(),
      new Date()
    ]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creando anuncio:', error);
    res.status(500).json({ success: false, error: 'Error creando anuncio' });
  }
});

// Actualizar anuncio
router.put('/advertisements/:id', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    console.log('Datos recibidos para actualizar anuncio:', data);
    
    // Mapear los campos que vienen del frontend
    const updateQuery = `
      UPDATE advertisements 
      SET 
        title = $1,
        description = $2,
        image_url = $3,
        content = $4,
        campaign_id = $5,
        is_active = $6,
        media_type = $7,
        storage_type = $8,
        duration = $9,
        alt_text = $10,
        button_text = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;
    
    const params = [
      data.title || '',
      data.description || '',
      data.image_url || '',
      data.content || '',
      data.campaign_id || 1,
      data.is_active !== undefined ? data.is_active : true,
      data.media_type || 'image',
      data.storage_type || 'url',
      data.duration || 0,
      data.alt_text || '',
      data.button_text || '',
      parseInt(id)
    ];
    
    const result = await pool.query(updateQuery, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Anuncio no encontrado' });
    }
    
    // Mapear respuesta a camelCase
    const updatedAd = result.rows[0];
    const response = {
      id: updatedAd.id,
      title: updatedAd.title,
      description: updatedAd.description,
      imageUrl: updatedAd.image_url,
      content: updatedAd.content,
      button_text: updatedAd.button_text,
      campaignId: updatedAd.campaign_id,
      isActive: updatedAd.is_active,
      mediaType: updatedAd.media_type,
      storageType: updatedAd.storage_type,
      duration: updatedAd.duration,
      altText: updatedAd.alt_text,
      createdAt: updatedAd.created_at,
      updatedAt: updatedAd.updated_at
    };
    
    console.log('Anuncio actualizado exitosamente:', response);
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Error actualizando anuncio:', error);
    res.status(500).json({ success: false, error: 'Error actualizando anuncio' });
  }
});

// ===================
// ASIGNACIONES (PLACEMENTS)
// ===================

// Obtener asignaciones activas
router.get('/placements', async (req, res) => {
  try {
    const { spaceId, pageType, position } = req.query;
    
    let query = `
      SELECT 
        ap.id,
        ap.advertisement_id,
        ap.ad_space_id,
        ap.priority,
        ap.start_date,
        ap.end_date,
        ap.is_active,
        a.title,
        a.description,
        a.image_url,
        a.content as target_url,
        a.alt_text,
        a.button_text,
        a.media_type,
        a.duration,
        a.is_active as ad_is_active,
        a.updated_at as ad_updated_at
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
      params.push(spaceId);
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
    
    const result = await pool.query(query, params);
    
    // Formatear los datos para el frontend
    const formattedData = result.rows.map(row => ({
      id: row.id,
      adSpaceId: row.ad_space_id,
      advertisementId: row.advertisement_id,
      startDate: row.start_date,
      endDate: row.end_date,
      isActive: row.is_active,
      advertisement: {
        id: row.advertisement_id,
        title: row.title,
        description: row.description,
        imageUrl: row.image_url ? replitObjectStorage.normalizeUrl(row.image_url) : row.image_url,
        targetUrl: row.target_url,
        altText: row.alt_text,
        buttonText: row.button_text,
        mediaType: row.media_type || 'image',
        duration: row.duration,
        isActive: row.ad_is_active,
        updatedAt: row.ad_updated_at
      }
    }));
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error obteniendo asignaciones:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo asignaciones' });
  }
});

// Crear nueva asignación
router.post('/placements', isAuthenticated, async (req, res) => {
  try {
    const { adId, spaceId, pageType, pageId, startDate, endDate } = req.body;
    
    const result = await pool.query(`
      INSERT INTO ad_placements 
      (advertisement_id, ad_space_id, priority, start_date, end_date, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      parseInt(adId),
      parseInt(spaceId),
      1, // priority default
      new Date(startDate),
      new Date(endDate),
      true,
      new Date(),
      new Date()
    ]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creando asignación:', error);
    res.status(500).json({ success: false, error: 'Error creando asignación' });
  }
});

// ===================
// ANALYTICS
// ===================

// Registrar impresión
router.post('/analytics/impression', async (req, res) => {
  try {
    const { placementId } = req.body;
    
    // Incrementar contador de impresiones
    await pool.query(`
      UPDATE ad_placements 
      SET impressions = impressions + 1 
      WHERE id = $1
    `, [parseInt(placementId)]);
    
    // Registrar en analytics diario
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await pool.query(`
      INSERT INTO ad_analytics (placement_id, date, impressions, clicks, conversions, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (placement_id, date) 
      DO UPDATE SET 
        impressions = ad_analytics.impressions + 1,
        updated_at = $7
    `, [
      parseInt(placementId),
      today,
      1,
      0,
      0,
      new Date(),
      new Date()
    ]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error registrando impresión:', error);
    res.status(500).json({ success: false, error: 'Error registrando impresión' });
  }
});

// Registrar click
router.post('/analytics/click', async (req, res) => {
  try {
    const { placementId } = req.body;
    
    // Incrementar contador de clicks
    await pool.query(`
      UPDATE ad_placements 
      SET clicks = clicks + 1 
      WHERE id = $1
    `, [parseInt(placementId)]);
    
    // Registrar en analytics diario
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await pool.query(`
      INSERT INTO ad_analytics (placement_id, date, impressions, clicks, conversions, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (placement_id, date) 
      DO UPDATE SET 
        clicks = ad_analytics.clicks + 1,
        updated_at = $7
    `, [
      parseInt(placementId),
      today,
      0,
      1,
      0,
      new Date(),
      new Date()
    ]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error registrando click:', error);
    res.status(500).json({ success: false, error: 'Error registrando click' });
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

// Obtener anuncios para una página específica
router.get('/public/ads', async (req, res) => {
  try {
    const { pageType, pageId, spaceKey } = req.query;
    
    // Construir condiciones dinámicamente
    const conditions = [
      eq(adPlacements.isActive, true),
      lte(adPlacements.startDate, new Date()),
      gte(adPlacements.endDate, new Date())
    ];
    
    if (pageType) {
      conditions.push(eq(adPlacements.pageType, pageType as string));
    }
    
    if (pageId) {
      conditions.push(
        sql`(${adPlacements.pageId} = ${parseInt(pageId as string)} OR ${adPlacements.pageId} IS NULL)`
      );
    }
    
    if (spaceKey) {
      conditions.push(eq(adSpaces.spaceKey, spaceKey as string));
    }

    const query = db.select({
      id: adPlacements.id,
      advertisement: {
        id: advertisements.id,
        title: advertisements.title,
        content: advertisements.content,
        imageUrl: advertisements.imageUrl,
        linkUrl: advertisements.linkUrl,
        type: advertisements.type,
        priority: advertisements.priority
      },
      space: {
        spaceKey: adSpaces.spaceKey,
        name: adSpaces.name,
        dimensions: adSpaces.dimensions,
        locationType: adSpaces.locationType
      }
    }).from(adPlacements)
      .leftJoin(advertisements, eq(adPlacements.adId, advertisements.id))
      .leftJoin(adSpaces, eq(adPlacements.spaceId, adSpaces.id))
      .where(and(...conditions));
    
    const ads = await query.orderBy(desc(advertisements.priority));
    
    res.json({ success: true, data: ads });
  } catch (error) {
    console.error('Error obteniendo anuncios públicos:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo anuncios públicos' });
  }
});

// ===================
// ASSIGNMENTS ENDPOINTS
// ===================

// Obtener todas las asignaciones
router.get('/assignments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ap.id,
        ap.ad_space_id,
        ap.advertisement_id,
        ap.start_date,
        ap.end_date,
        ap.priority,
        ap.is_active,
        ap.created_at,
        asp.name as space_name,
        asp.page_type,
        asp.position,
        asp.dimensions,
        ads.title as ad_title,
        ads.description as ad_description,
        ads.image_url,
        ads.content as target_url,
        ads.is_active as ad_is_active
      FROM ad_placements ap
      LEFT JOIN ad_spaces asp ON ap.ad_space_id = asp.id
      LEFT JOIN advertisements ads ON ap.advertisement_id = ads.id
      ORDER BY ap.created_at DESC
    `);
    
    const assignments = result.rows.map(row => ({
      id: row.id,
      adSpaceId: row.ad_space_id,
      advertisementId: row.advertisement_id,
      startDate: row.start_date,
      endDate: row.end_date,
      frequency: 'always', // Default value since column doesn't exist
      priority: row.priority,
      isActive: row.is_active,
      createdAt: row.created_at,
      space: {
        id: row.ad_space_id,
        name: row.space_name,
        pageType: row.page_type,
        position: row.position,
        dimensions: row.dimensions,
      },
      advertisement: {
        id: row.advertisement_id,
        title: row.ad_title,
        description: row.ad_description,
        imageUrl: row.image_url ? replitObjectStorage.normalizeUrl(row.image_url) : row.image_url,
        targetUrl: row.target_url,
        isActive: row.ad_is_active,
      }
    }));
    
    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error obteniendo asignaciones:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo asignaciones' });
  }
});

// Crear nueva asignación
router.post('/assignments', isAuthenticated, async (req, res) => {
  try {
    const { ad_space_id, advertisement_id, start_date, end_date, frequency, priority, is_active } = req.body;
    
    // Validar que los IDs sean números válidos
    const spaceId = parseInt(ad_space_id);
    const advertisementId = parseInt(advertisement_id);
    
    if (isNaN(spaceId) || isNaN(advertisementId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Los IDs de espacio y anuncio deben ser números válidos' 
      });
    }
    
    const result = await pool.query(`
      INSERT INTO ad_placements (
        ad_space_id, 
        advertisement_id, 
        start_date, 
        end_date, 
        priority, 
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      spaceId,
      advertisementId,
      new Date(start_date),
      new Date(end_date),
      priority || 5,
      is_active !== undefined ? is_active : true,
      new Date(),
      new Date()
    ]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creando asignación:', error);
    res.status(500).json({ success: false, error: 'Error creando asignación' });
  }
});

// Actualizar asignación
router.put('/assignments/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { ad_space_id, advertisement_id, start_date, end_date, frequency, priority, is_active } = req.body;
    
    const result = await pool.query(`
      UPDATE ad_placements 
      SET 
        ad_space_id = $1,
        advertisement_id = $2,
        start_date = $3,
        end_date = $4,
        priority = $5,
        is_active = $6,
        updated_at = $7
      WHERE id = $8
      RETURNING *
    `, [
      parseInt(ad_space_id),
      parseInt(advertisement_id),
      new Date(start_date),
      new Date(end_date),
      priority,
      is_active,
      new Date(),
      parseInt(id)
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Asignación no encontrada' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando asignación:', error);
    res.status(500).json({ success: false, error: 'Error actualizando asignación' });
  }
});

// Eliminar asignación
router.delete('/assignments/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM ad_placements WHERE id = $1 RETURNING *', [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Asignación no encontrada' });
    }
    
    res.json({ success: true, message: 'Asignación eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando asignación:', error);
    res.status(500).json({ success: false, error: 'Error eliminando asignación' });
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
    
    // Registrar la impresión (por ahora solo log)
    console.log(`📊 Impresión registrada para placement ID: ${placementId}`);
    
    // Aquí podrías insertar en una tabla de analytics si existe
    // await pool.query('INSERT INTO ad_impressions (placement_id, timestamp) VALUES ($1, NOW())', [placementId]);
    
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
    
    // Registrar el click (por ahora solo log)
    console.log(`🖱️ Click registrado para placement ID: ${placementId}`);
    
    // Aquí podrías insertar en una tabla de analytics si existe
    // await pool.query('INSERT INTO ad_clicks (placement_id, timestamp) VALUES ($1, NOW())', [placementId]);
    
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