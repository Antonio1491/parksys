import { Router } from 'express';
import { db } from './db';
import { pool } from './db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { adMediaFiles } from '../shared/advertising-schema';

const router = Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/advertising';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `ad-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Función para generar hash SHA256 de un archivo
function generateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Función para obtener dimensiones de imagen (simplificada)
function getImageDimensions(filePath: string, mimeType: string): string {
  // En un sistema real, usarías una librería como sharp o image-size
  // Para este ejemplo, retornamos dimensiones por defecto
  if (mimeType.startsWith('image/')) {
    return '800x600'; // Placeholder
  }
  return '';
}

// =====================================
// ENDPOINTS PARA GESTIÓN DE ARCHIVOS MULTIMEDIA
// =====================================

// Subir archivo multimedia
router.post('/media/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
    }

    const file = req.file;
    const filePath = file.path;
    const fileUrl = `/uploads/advertising/${file.filename}`;
    const fileHash = generateFileHash(filePath);
    
    // Verificar si ya existe un archivo con el mismo hash
    const existingFile = await pool.query(
      'SELECT * FROM ad_media_files WHERE file_hash = $1',
      [fileHash]
    );
    
    if (existingFile.rows.length > 0) {
      // Si existe, eliminar el archivo duplicado y devolver el existente
      fs.unlinkSync(filePath);
      return res.json({
        success: true,
        data: existingFile.rows[0],
        message: 'Archivo ya existe en el sistema'
      });
    }

    // Determinar el tipo de media
    let mediaType = 'image';
    if (file.mimetype.startsWith('video/')) {
      mediaType = 'video';
    } else if (file.mimetype === 'image/gif') {
      mediaType = 'gif';
    }

    // Obtener dimensiones
    const dimensions = getImageDimensions(filePath, file.mimetype);
    
    // Guardar información del archivo en la base de datos
    const result = await pool.query(`
      INSERT INTO ad_media_files (
        filename, original_name, mime_type, file_size, file_path, file_url,
        media_type, dimensions, file_hash, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      file.filename,
      file.originalname,
      file.mimetype,
      file.size,
      filePath,
      fileUrl,
      mediaType,
      dimensions,
      fileHash,
      req.user?.id || 1 // Default a admin user
    ]);

    console.log('✅ Archivo multimedia subido exitosamente:', file.filename);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Archivo subido exitosamente'
    });
  } catch (error) {
    console.error('❌ Error subiendo archivo:', error);
    
    // Limpiar archivo si hubo error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('❌ Error eliminando archivo temporal:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Error subiendo archivo: ' + (error as Error).message });
  }
});

// Obtener archivos multimedia
router.get('/media', async (req, res) => {
  try {
    const { mediaType, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM ad_media_files';
    const params = [];
    
    if (mediaType && mediaType !== 'all') {
      query += ' WHERE media_type = $1';
      params.push(mediaType);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('❌ Error obteniendo archivos multimedia:', error);
    res.status(500).json({ error: 'Error obteniendo archivos: ' + (error as Error).message });
  }
});

// Eliminar archivo multimedia
router.delete('/media/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el archivo no esté siendo usado por anuncios
    const usageCheck = await pool.query(
      'SELECT COUNT(*) as count FROM advertisements WHERE media_file_id = $1',
      [id]
    );
    
    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el archivo porque está siendo usado por anuncios activos' 
      });
    }
    
    // Obtener información del archivo
    const fileInfo = await pool.query(
      'SELECT * FROM ad_media_files WHERE id = $1',
      [id]
    );
    
    if (fileInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    // Eliminar archivo físico
    const filePath = fileInfo.rows[0].file_path;
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsError) {
      console.error('❌ Error eliminando archivo físico:', fsError);
    }
    
    // Eliminar registro de la base de datos
    await pool.query('DELETE FROM ad_media_files WHERE id = $1', [id]);
    
    console.log('✅ Archivo multimedia eliminado exitosamente:', id);
    
    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando archivo:', error);
    res.status(500).json({ error: 'Error eliminando archivo: ' + (error as Error).message });
  }
});

// =====================================
// ENDPOINTS PARA GESTIÓN DE ESPACIOS
// =====================================

// Obtener todos los espacios publicitarios con métricas
router.get('/spaces', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM ad_spaces
      ORDER BY created_at DESC
    `);
    
    console.log('✅ Espacios obtenidos exitosamente:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error obteniendo espacios:', error);
    res.status(500).json({ error: 'Error obteniendo espacios publicitarios: ' + (error as Error).message });
  }
});

// Crear nuevo espacio publicitario
router.post('/spaces', async (req, res) => {
  try {
    const {
      name,
      description,
      page_type,
      position,
      page_identifier,
      width,
      height,
      category,
      is_active = true
    } = req.body;

    console.log('🔧 Creando espacio con datos:', req.body);

    const result = await pool.query(`
      INSERT INTO ad_spaces (
        name, description, page_type, position, page_identifier, 
        width, height, category, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [name, description, page_type, position, page_identifier, width, height, category, is_active]);

    console.log('✅ Espacio creado exitosamente:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creando espacio:', error);
    res.status(500).json({ error: 'Error creando espacio publicitario: ' + (error as Error).message });
  }
});

// Actualizar espacio publicitario
router.put('/spaces/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      page_type,
      position,
      page_identifier,
      width,
      height,
      category,
      is_active
    } = req.body;

    console.log('🔧 Actualizando espacio con datos:', req.body);

    const result = await pool.query(`
      UPDATE ad_spaces 
      SET name = $1, description = $2, page_type = $3, position = $4, 
          is_active = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [name, description, page_type, position, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Espacio no encontrado' });
    }

    console.log('✅ Espacio actualizado exitosamente:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error actualizando espacio:', error);
    res.status(500).json({ error: 'Error actualizando espacio publicitario: ' + (error as Error).message });
  }
});

// Eliminar espacio publicitario
router.delete('/spaces/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM ad_spaces WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Espacio no encontrado' });
    }

    res.json({ message: 'Espacio eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando espacio:', error);
    res.status(500).json({ error: 'Error eliminando espacio publicitario' });
  }
});

// =====================================
// ENDPOINTS PARA GESTIÓN DE ANUNCIOS
// =====================================

// Obtener todos los anuncios con métricas
router.get('/advertisements', async (req, res) => {
  try {
    const { ad_type, media_type, is_active } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (ad_type) {
      whereClause += ' WHERE a.ad_type = $' + (params.length + 1);
      params.push(ad_type);
    }
    
    if (media_type) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' a.media_type = $' + (params.length + 1);
      params.push(media_type);
    }
    
    if (is_active !== undefined) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' a.is_active = $' + (params.length + 1);
      params.push(is_active === 'true');
    }

    const result = await pool.query(`
      SELECT 
        a.*,
        c.name as campaign_name,
        COUNT(DISTINCT p.id) as active_placements,
        COUNT(DISTINCT m.id) FILTER (WHERE m.event_type = 'impression') as total_impressions,
        COUNT(DISTINCT m.id) FILTER (WHERE m.event_type = 'click') as total_clicks,
        ROUND(
          COALESCE(
            (COUNT(DISTINCT m.id) FILTER (WHERE m.event_type = 'click')::numeric / 
             NULLIF(COUNT(DISTINCT m.id) FILTER (WHERE m.event_type = 'impression'), 0)) * 100,
            0
          )::numeric, 2
        ) as click_rate
      FROM advertisements a
      LEFT JOIN ad_campaigns c ON a.campaign_id = c.id
      LEFT JOIN ad_placements p ON a.id = p.advertisement_id AND p.is_active = true
      LEFT JOIN ad_metrics m ON a.id = m.advertisement_id AND m.event_date >= CURRENT_DATE - INTERVAL '30 days'
      ${whereClause}
      GROUP BY a.id, c.name
      ORDER BY a.created_at DESC
    `, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo anuncios:', error);
    res.status(500).json({ error: 'Error obteniendo anuncios' });
  }
});

// Crear nuevo anuncio
router.post('/advertisements', async (req, res) => {
  try {
    const {
      title,
      description,
      image_url,
      link_url,
      alt_text,
      ad_type = 'institutional',
      media_type = 'image',
      frequency = 'always',
      start_date,
      end_date,
      priority = 5,
      is_active = true,
      video_url,
      html_content,
      carousel_images = [],
      scheduled_days = [],
      scheduled_hours = [],
      target_pages = [],
      target_positions = [],
      campaign_id
    } = req.body;

    const result = await pool.query(`
      INSERT INTO advertisements (
        title, description, image_url, link_url, alt_text, ad_type, media_type, 
        frequency, start_date, end_date, priority, is_active, video_url, html_content,
        carousel_images, scheduled_days, scheduled_hours, target_pages, target_positions,
        campaign_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `, [
      title, description, image_url, link_url, alt_text, ad_type, media_type, 
      frequency, start_date, end_date, priority, is_active, video_url, html_content,
      carousel_images, scheduled_days, scheduled_hours, target_pages, target_positions,
      campaign_id
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando anuncio:', error);
    res.status(500).json({ error: 'Error creando anuncio' });
  }
});

// Actualizar anuncio
router.put('/advertisements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔧 Actualizando anuncio con ID:', id);
    console.log('📋 Content-Type:', req.get('Content-Type'));
    console.log('📋 Datos recibidos:', req.body);
    console.log('📋 Body keys:', Object.keys(req.body));
    
    const {
      title,
      description,
      image_url,
      link_url,
      alt_text,
      ad_type,
      media_type,
      frequency,
      priority,
      is_active,
      video_url,
      html_content,
      carousel_images,
      scheduled_days,
      scheduled_hours,
      target_pages,
      target_positions,
      campaign_id,
      content,
      storage_type,
      media_file_id,
      duration,
      type,
      status
    } = req.body;

    const result = await pool.query(`
      UPDATE advertisements 
      SET title = $1, description = $2, image_url = $3, link_url = $4, alt_text = $5,
          ad_type = $6, media_type = $7, frequency = $8, priority = $9, is_active = $10,
          video_url = $11, html_content = $12, carousel_images = $13, scheduled_days = $14,
          scheduled_hours = $15, target_pages = $16, target_positions = $17, campaign_id = $18,
          content = $19, storage_type = $20, media_file_id = $21, duration = $22,
          type = $23, status = $24, updated_at = CURRENT_TIMESTAMP
      WHERE id = $25
      RETURNING *
    `, [
      title, description, image_url, link_url, alt_text, ad_type, media_type, 
      frequency, priority, is_active, video_url, html_content, carousel_images,
      scheduled_days, scheduled_hours, target_pages, target_positions, campaign_id,
      content, storage_type, media_file_id, duration, type, status, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    console.log('✅ Anuncio actualizado exitosamente:', result.rows[0]);
    
    // Invalidar el cache para forzar actualización de imágenes
    console.log('🔄 Cache invalidado para anuncio ID:', id);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error actualizando anuncio:', error);
    res.status(500).json({ error: 'Error actualizando anuncio: ' + (error as Error).message });
  }
});

// Eliminar anuncio
router.delete('/advertisements/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM advertisements WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    res.json({ message: 'Anuncio eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando anuncio:', error);
    res.status(500).json({ error: 'Error eliminando anuncio' });
  }
});

// =====================================
// ENDPOINTS PARA GESTIÓN DE ASIGNACIONES
// =====================================

// Obtener todas las asignaciones
router.get('/assignments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        a.title as advertisement_title,
        a.description as advertisement_description,
        a.image_url as advertisement_image_url,
        a.ad_type as advertisement_ad_type,
        a.media_type as advertisement_media_type,
        s.name as space_name,
        s.page_type as space_page_type,
        s.position as space_position,
        s.dimensions as space_dimensions
      FROM ad_placements p
      LEFT JOIN advertisements a ON p.advertisement_id = a.id
      LEFT JOIN ad_spaces s ON p.ad_space_id = s.id
      ORDER BY p.created_at DESC
    `);
    
    // Transformar datos para coincidir con interfaz
    const transformedData = result.rows.map(row => ({
      id: row.id,
      adSpaceId: row.ad_space_id,
      advertisementId: row.advertisement_id,
      startDate: row.start_date,
      endDate: row.end_date,
      frequency: row.frequency,
      priority: row.priority,
      isActive: row.is_active,
      advertisement: {
        id: row.advertisement_id,
        title: row.advertisement_title,
        description: row.advertisement_description,
        imageUrl: row.advertisement_image_url,
        adType: row.advertisement_ad_type,
        mediaType: row.advertisement_media_type,
        isActive: true
      },
      space: {
        id: row.ad_space_id,
        name: row.space_name,
        pageType: row.space_page_type,
        position: row.space_position,
        dimensions: row.space_dimensions
      }
    }));
    
    res.json(transformedData);
  } catch (error) {
    console.error('Error obteniendo asignaciones:', error);
    res.status(500).json({ error: 'Error obteniendo asignaciones publicitarias' });
  }
});

// Crear nueva asignación
router.post('/assignments', async (req, res) => {
  try {
    const {
      ad_space_id,
      advertisement_id,
      start_date,
      end_date,
      frequency = 'always',
      priority = 5,
      is_active = true
    } = req.body;

    const result = await pool.query(`
      INSERT INTO ad_placements (
        ad_space_id, advertisement_id, start_date, end_date, frequency, priority, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [ad_space_id, advertisement_id, start_date, end_date, frequency, priority, is_active]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando asignación:', error);
    res.status(500).json({ error: 'Error creando asignación publicitaria' });
  }
});

// Actualizar asignación
router.put('/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ad_space_id,
      advertisement_id,
      start_date,
      end_date,
      frequency,
      priority,
      is_active
    } = req.body;

    const result = await pool.query(`
      UPDATE ad_placements 
      SET ad_space_id = $1, advertisement_id = $2, start_date = $3, end_date = $4,
          frequency = $5, priority = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [ad_space_id, advertisement_id, start_date, end_date, frequency, priority, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando asignación:', error);
    res.status(500).json({ error: 'Error actualizando asignación publicitaria' });
  }
});

// Obtener asignaciones activas (ENDPOINT FALTANTE)
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
        a.link_url as target_url,
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
    
    // Parse spaceId as integer and validate it's a valid number
    if (spaceId && spaceId !== 'undefined' && !isNaN(parseInt(String(spaceId)))) {
      query += ` AND ads.id = $${params.length + 1}`;
      params.push(parseInt(String(spaceId)));
    }
    
    if (pageType && pageType !== 'undefined') {
      query += ` AND ads.page_type = $${params.length + 1}`;
      params.push(pageType);
    }
    
    if (position && position !== 'undefined') {
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
        imageUrl: row.image_url,
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

// Registrar impresión
router.post('/track-impression', async (req, res) => {
  try {
    const { placementId } = req.body;
    
    if (!placementId) {
      return res.status(400).json({ error: 'placementId es requerido' });
    }

    await pool.query(`
      INSERT INTO ad_metrics (advertisement_id, event_type, event_date, event_hour, placement_id)
      SELECT ap.advertisement_id, 'impression', CURRENT_DATE, EXTRACT(HOUR FROM CURRENT_TIMESTAMP), $1
      FROM ad_placements ap
      WHERE ap.id = $1
    `, [placementId]);

    console.log('📊 Impresión registrada para placement ID:', placementId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking impression:', error);
    res.status(500).json({ error: 'Error tracking impression' });
  }
});

// Registrar click
router.post('/track-click', async (req, res) => {
  try {
    const { placementId } = req.body;
    
    if (!placementId) {
      return res.status(400).json({ error: 'placementId es requerido' });
    }

    await pool.query(`
      INSERT INTO ad_metrics (advertisement_id, event_type, event_date, event_hour, placement_id)
      SELECT ap.advertisement_id, 'click', CURRENT_DATE, EXTRACT(HOUR FROM CURRENT_TIMESTAMP), $1
      FROM ad_placements ap
      WHERE ap.id = $1
    `, [placementId]);

    console.log('🖱️ Click registrado para placement ID:', placementId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Error tracking click' });
  }
});

// Eliminar asignación
router.delete('/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM ad_placements WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    res.json({ message: 'Asignación eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando asignación:', error);
    res.status(500).json({ error: 'Error eliminando asignación publicitaria' });
  }
});

// =====================================
// ENDPOINTS PARA SUBIDA DE ARCHIVOS
// =====================================

// Subir archivo multimedia
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const fileUrl = `/uploads/advertising/${req.file.filename}`;
    
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    res.status(500).json({ error: 'Error subiendo archivo' });
  }
});

// Subir múltiples archivos para carrusel
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' });
    }

    const files = (req.files as Express.Multer.File[]).map(file => ({
      url: `/uploads/advertising/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size
    }));

    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Error subiendo archivos:', error);
    res.status(500).json({ error: 'Error subiendo archivos' });
  }
});

// =====================================
// ENDPOINTS PARA MÉTRICAS Y ANALYTICS
// =====================================

// Obtener métricas generales
router.get('/metrics', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT ad_space_id) as total_spaces,
        COUNT(DISTINCT advertisement_id) as total_advertisements,
        COUNT(DISTINCT id) FILTER (WHERE event_type = 'impression') as total_impressions,
        COUNT(DISTINCT id) FILTER (WHERE event_type = 'click') as total_clicks,
        ROUND(
          COALESCE(
            (COUNT(DISTINCT id) FILTER (WHERE event_type = 'click')::numeric / 
             NULLIF(COUNT(DISTINCT id) FILTER (WHERE event_type = 'impression'), 0)) * 100,
            0
          )::numeric, 2
        ) as click_rate,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM ad_metrics
      WHERE event_date >= CURRENT_DATE - INTERVAL '${period} days'
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({ error: 'Error obteniendo métricas' });
  }
});

// Obtener métricas por espacio
router.get('/metrics/spaces', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.page_type,
        s.position,
        COUNT(DISTINCT m.id) FILTER (WHERE m.event_type = 'impression') as impressions,
        COUNT(DISTINCT m.id) FILTER (WHERE m.event_type = 'click') as clicks,
        ROUND(
          COALESCE(
            (COUNT(DISTINCT m.id) FILTER (WHERE m.event_type = 'click')::numeric / 
             NULLIF(COUNT(DISTINCT m.id) FILTER (WHERE m.event_type = 'impression'), 0)) * 100,
            0
          )::numeric, 2
        ) as click_rate
      FROM ad_spaces s
      LEFT JOIN ad_metrics m ON s.id = m.ad_space_id AND m.event_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY s.id, s.name, s.page_type, s.position
      ORDER BY impressions DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo métricas por espacio:', error);
    res.status(500).json({ error: 'Error obteniendo métricas por espacio' });
  }
});

// Registrar impresión
router.post('/track-impression', async (req, res) => {
  try {
    const { 
      ad_space_id, 
      advertisement_id, 
      placement_id, 
      page_url, 
      user_agent, 
      ip_address 
    } = req.body;
    
    const now = new Date();
    
    await pool.query(`
      INSERT INTO ad_metrics (
        ad_space_id, advertisement_id, placement_id, event_type, 
        event_date, event_hour, page_url, user_agent, ip_address
      ) VALUES ($1, $2, $3, 'impression', $4, $5, $6, $7, $8)
    `, [
      ad_space_id, advertisement_id, placement_id, 
      now.toISOString().split('T')[0], 
      now.getHours(), 
      page_url, 
      user_agent, 
      ip_address
    ]);
    
    // Actualizar contador en advertisement
    await pool.query(`
      UPDATE advertisements 
      SET impression_count = impression_count + 1 
      WHERE id = $1
    `, [advertisement_id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error registrando impresión:', error);
    res.status(500).json({ error: 'Error registrando impresión' });
  }
});

// Registrar click
router.post('/track-click', async (req, res) => {
  try {
    const { 
      ad_space_id, 
      advertisement_id, 
      placement_id, 
      page_url, 
      user_agent, 
      ip_address 
    } = req.body;
    
    const now = new Date();
    
    await pool.query(`
      INSERT INTO ad_metrics (
        ad_space_id, advertisement_id, placement_id, event_type, 
        event_date, event_hour, page_url, user_agent, ip_address
      ) VALUES ($1, $2, $3, 'click', $4, $5, $6, $7, $8)
    `, [
      ad_space_id, advertisement_id, placement_id, 
      now.toISOString().split('T')[0], 
      now.getHours(), 
      page_url, 
      user_agent, 
      ip_address
    ]);
    
    // Actualizar contador en advertisement
    await pool.query(`
      UPDATE advertisements 
      SET click_count = click_count + 1 
      WHERE id = $1
    `, [advertisement_id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error registrando click:', error);
    res.status(500).json({ error: 'Error registrando click' });
  }
});

// =====================================
// ENDPOINTS PARA GESTIÓN DE CAMPAÑAS
// =====================================

// Obtener todas las campañas
router.get('/campaigns', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        client,
        description,
        start_date as "startDate",
        end_date as "endDate",
        budget,
        status,
        priority,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ad_campaigns
      ORDER BY created_at DESC
    `);
    
    console.log('✅ Campañas obtenidas exitosamente:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error obteniendo campañas:', error);
    res.status(500).json({ error: 'Error obteniendo campañas: ' + (error as Error).message });
  }
});

// Crear nueva campaña
router.post('/campaigns', async (req, res) => {
  try {
    const {
      name,
      client,
      description,
      startDate,
      endDate,
      budget,
      priority = 'medium'
    } = req.body;

    console.log('🔧 Creando campaña con datos:', req.body);

    const result = await pool.query(`
      INSERT INTO ad_campaigns (
        name, client, description, start_date, end_date, budget, priority, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING 
        id,
        name,
        client,
        description,
        start_date as "startDate",
        end_date as "endDate",
        budget,
        status,
        priority,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, [name, client, description, startDate, endDate, budget, priority]);

    console.log('✅ Campaña creada exitosamente:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creando campaña:', error);
    res.status(500).json({ error: 'Error creando campaña: ' + (error as Error).message });
  }
});

// Actualizar campaña
router.put('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      client,
      description,
      startDate,
      endDate,
      budget,
      priority
    } = req.body;

    console.log('🔧 Actualizando campaña ID:', id, 'con datos:', req.body);

    const result = await pool.query(`
      UPDATE ad_campaigns 
      SET 
        name = $1,
        client = $2,
        description = $3,
        start_date = $4,
        end_date = $5,
        budget = $6,
        priority = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING 
        id,
        name,
        client,
        description,
        start_date as "startDate",
        end_date as "endDate",
        budget,
        status,
        priority,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, [name, client, description, startDate, endDate, budget, priority, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    console.log('✅ Campaña actualizada exitosamente:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error actualizando campaña:', error);
    res.status(500).json({ error: 'Error actualizando campaña: ' + (error as Error).message });
  }
});

// Cambiar estado de campaña
router.patch('/campaigns/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('🔧 Cambiando estado de campaña ID:', id, 'a:', status);

    const result = await pool.query(`
      UPDATE ad_campaigns 
      SET 
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING 
        id,
        name,
        client,
        description,
        start_date as "startDate",
        end_date as "endDate",
        budget,
        status,
        priority,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    console.log('✅ Estado de campaña cambiado exitosamente:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error cambiando estado de campaña:', error);
    res.status(500).json({ error: 'Error cambiando estado de campaña: ' + (error as Error).message });
  }
});

// Eliminar campaña
router.delete('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔧 Eliminando campaña ID:', id);

    // Verificar si la campaña existe
    const checkResult = await pool.query('SELECT id FROM ad_campaigns WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    // Eliminar la campaña (los anuncios asociados se eliminarán en cascada)
    await pool.query('DELETE FROM ad_campaigns WHERE id = $1', [id]);

    console.log('✅ Campaña eliminada exitosamente');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error eliminando campaña:', error);
    res.status(500).json({ error: 'Error eliminando campaña: ' + (error as Error).message });
  }
});

// Obtener campaña específica con anuncios
router.get('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔧 Obteniendo campaña ID:', id);

    const campaignResult = await pool.query(`
      SELECT 
        id,
        name,
        client,
        description,
        start_date as "startDate",
        end_date as "endDate",
        budget,
        status,
        priority,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ad_campaigns
      WHERE id = $1
    `, [id]);

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    const campaign = campaignResult.rows[0];

    // Obtener anuncios asociados a la campaña
    const advertisementsResult = await pool.query(`
      SELECT 
        id,
        title,
        description,
        image_url as "imageUrl",
        target_url as "targetUrl",
        alt_text as "altText",
        is_active as "isActive",
        click_count as "clickCount",
        impression_count as "impressionCount",
        created_at as "createdAt"
      FROM advertisements
      WHERE campaign_id = $1
      ORDER BY created_at DESC
    `, [id]);

    campaign.advertisements = advertisementsResult.rows;

    console.log('✅ Campaña obtenida exitosamente con', advertisementsResult.rows.length, 'anuncios');
    res.json(campaign);
  } catch (error) {
    console.error('❌ Error obteniendo campaña:', error);
    res.status(500).json({ error: 'Error obteniendo campaña: ' + (error as Error).message });
  }
});

// =====================================
// ENDPOINTS PARA MAPEO DINÁMICO DE ESPACIOS
// =====================================

// Importar rutas de mapeo de espacios
import spaceMappingRouter from './routes/space-mapping-routes';
router.use('/space-mappings', spaceMappingRouter);

export default router;