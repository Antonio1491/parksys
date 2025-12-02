/**
 * Parks Media Routes - Imágenes, Videos, Documentos
 * 
 * Rutas normalizadas bajo /api/parks/:parkId/...
 * Incluye rutas de compatibilidad para migración gradual
 */

import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { parkImageUpload, documentUpload, videoUpload } from '../middleware/upload';
import { replitObjectStorage } from '../objectStorage-replit';
import path from 'path';
import fs from 'fs';

const router = Router();

// ============================================================================
// IMÁGENES - Rutas normalizadas
// ============================================================================

/**
 * GET /parks/:parkId/images - Obtener imágenes de un parque
 */
router.get('/:parkId/images', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.parkId);
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
 * POST /parks/:parkId/images - Subir imagen
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

      // Verificar si es la primera imagen (hacer primaria por defecto)
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
    // Redirigir a la ruta PUT
    req.method = 'PUT';
    return router.handle(req, res, () => {});
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

      // Obtener la imagen para eliminar del storage
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

// ============================================================================
// DOCUMENTOS - Rutas normalizadas
// ============================================================================

/**
 * GET /parks/:parkId/documents - Obtener documentos de un parque
 */
router.get('/:parkId/documents', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.parkId);
    const documents = await storage.getParkDocuments(parkId);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching park documents:', error);
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

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
        name: req.body.name || req.file.originalname,
        documentUrl: `/uploads/documents/${req.file.filename}`,
        documentType: req.body.documentType || 'other',
        description: req.body.description
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

      console.log(`🗑️ DELETE /parks/${parkId}/documents/${documentId} - Iniciando eliminación`);

      // Verificar que el documento pertenece al parque
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Documento no encontrado' });
      }

      if (document.parkId !== parkId) {
        return res.status(400).json({ message: 'El documento no pertenece a este parque' });
      }

      // Eliminar archivo físico si existe
      if (document.documentUrl) {
        const filePath = path.join(process.cwd(), 'public', document.documentUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`✅ Archivo físico eliminado: ${filePath}`);
        }
      }

      // Eliminar de BD
      await storage.deleteDocument(documentId);

      console.log(`✅ Documento ${documentId} eliminado`);
      res.json({ message: 'Documento eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ message: 'Error deleting document' });
    }
  }
);

// ============================================================================
// VIDEOS - Rutas normalizadas
// ============================================================================

/**
 * GET /parks/:parkId/videos - Obtener videos de un parque
 */
router.get('/:parkId/videos', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.parkId);

    const result = await pool.query(`
      SELECT id, park_id as "parkId", video_url as "videoUrl", 
             title, description, thumbnail_url as "thumbnailUrl",
             is_featured as "isFeatured", created_at as "createdAt"
      FROM park_videos 
      WHERE park_id = $1 
      ORDER BY is_featured DESC, created_at DESC
    `, [parkId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching park videos:', error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
});

/**
 * POST /parks/:parkId/videos - Subir video
 */
router.post('/:parkId/videos',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  videoUpload.single('video'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);

      // Puede ser un archivo o una URL de YouTube/Vimeo
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

      // Quitar featured de todos los videos del parque
      await pool.query(
        'UPDATE park_videos SET is_featured = false WHERE park_id = $1',
        [parkId]
      );

      // Establecer el nuevo video como featured
      const result = await pool.query(`
        UPDATE park_videos SET is_featured = true 
        WHERE id = $1 AND park_id = $2
        RETURNING id, park_id as "parkId", video_url as "videoUrl", 
                  title, is_featured as "isFeatured"
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
    // Llamar a la lógica de PUT directamente
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
        RETURNING id, park_id as "parkId", video_url as "videoUrl", 
                  title, is_featured as "isFeatured"
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

      console.log(`🗑️ DELETE /parks/${parkId}/videos/${videoId} - Iniciando eliminación`);

      // Obtener el video
      const videoResult = await pool.query(
        'SELECT video_url FROM park_videos WHERE id = $1 AND park_id = $2',
        [videoId, parkId]
      );

      if (videoResult.rows.length === 0) {
        return res.status(404).json({ message: 'Video no encontrado' });
      }

      const videoUrl = videoResult.rows[0].video_url;

      // Eliminar de BD
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

// ============================================================================
// RUTAS DE COMPATIBILIDAD (legacy) - Mantener hasta actualizar frontend
// ============================================================================

/**
 * Estas rutas redirigen a las rutas normalizadas
 * Eliminar después de actualizar el frontend
 */

// Imágenes - Rutas legacy
// DELETE /park-images/:imageId -> necesita parkId, se maneja en routes.ts por ahora

// Videos - Rutas legacy  
// POST /park-videos/:videoId/set-featured -> necesita parkId, se maneja en routes.ts por ahora
// DELETE /park-videos/:videoId -> necesita parkId, se maneja en routes.ts por ahora

// Documentos - Rutas legacy
// DELETE /park-documents/:documentId -> necesita parkId, se maneja en routes.ts por ahora

// ============================================================================
// EXPORT
// ============================================================================

export default router;

/**
 * Función para registrar las rutas de media de parks
 */
export function registerParkMediaRoutes(app: any) {
  app.use('/api/parks', router);
  console.log('✅ Rutas de Parks Media registradas');
}