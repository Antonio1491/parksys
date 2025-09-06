/**
 * SISTEMA COMPLETO DE MULTIMEDIA PARA PARQUES
 * ==========================================
 * 
 * Sistema integral para gestión de imágenes y documentos de parques
 * con almacenamiento local y funcionalidades completas CRUD
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from './db';
import { eq, and, desc } from 'drizzle-orm';
import { isAuthenticated } from './middleware/auth';
import pkg from 'pg';
const { Pool } = pkg;

// Importar pool de configuración existente
import { pool } from './db';

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // CRÍTICO: Guardar directamente en public/uploads como hacen los árboles que funcionan
    const uploadPath = file.fieldname === 'document' 
      ? 'public/uploads/documents' 
      : 'public/uploads/park-images';
    
    // Asegurar que el directorio existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 1000000);
    const extension = path.extname(file.originalname);
    const baseName = file.fieldname === 'document' ? 'park-doc' : 'park-img';
    cb(null, `${baseName}-${timestamp}-${randomId}${extension}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.fieldname === 'document') {
    // Documentos: PDF, DOC, DOCX, TXT
    if (file.mimetype.includes('pdf') || 
        file.mimetype.includes('document') || 
        file.mimetype.includes('text')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, DOC, DOCX y TXT'), false);
    }
  } else {
    // Imágenes: JPG, PNG, GIF, WebP
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

export function registerMultimediaRoutes(app: any, apiRouter: Router, isAuthenticated: any) {

  // =============================================
  // ENDPOINT DE PRUEBA PARA VERIFICAR ROUTING
  // =============================================
  
  apiRouter.post('/test-upload', (req: Request, res: Response) => {
    console.log('🧪 TEST ENDPOINT REACHED - /test-upload');
    res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
  });

  // =============================================
  // GESTIÓN DE IMÁGENES DE PARQUES
  // =============================================

  // Obtener todas las imágenes de un parque
  apiRouter.get('/parks/:parkId/images', async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.parkId);
      
      const query = `
        SELECT 
          id, 
          park_id as "parkId", 
          image_url as "imageUrl", 
          caption, 
          is_primary as "isPrimary", 
          created_at as "createdAt"
        FROM park_images 
        WHERE park_id = $1 
        ORDER BY is_primary DESC, created_at DESC
      `;
      
      const result = await pool.query(query, [parkId]);
      console.log(`Imágenes encontradas para parque ${parkId}:`, result.rows.length);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error obteniendo imágenes del parque:', error);
      res.status(500).json({ error: 'Error al obtener las imágenes del parque' });
    }
  });

  // Subir nueva imagen (archivo o URL)
  apiRouter.post('/parks/:parkId/images', (req: Request, res: Response, next: any) => {
    console.log('🚀 MULTIMEDIA ENDPOINT REACHED - POST /parks/:parkId/images');
    console.log('📝 Request details:', {
      method: req.method,
      url: req.url,
      params: req.params,
      headers: Object.keys(req.headers),
      contentType: req.headers['content-type']
    });
    next();
  }, isAuthenticated, (req: Request, res: Response, next: any) => {
    console.log('🔐 Authentication passed, processing file upload...');
    upload.single('image')(req, res, (err: any) => {
      if (err) {
        console.error('❌ Error de multer:', err);
        return res.status(400).json({ error: 'Error procesando archivo: ' + err.message });
      }
      console.log('📁 Multer processing completed successfully');
      next();
    });
  }, async (req: Request, res: Response) => {
    try {
      console.log('🔧 POST /parks/:parkId/images - Datos recibidos:', {
        params: req.params,
        body: req.body,
        file: req.file ? { filename: req.file.filename, size: req.file.size } : null
      });
      
      const parkId = parseInt(req.params.parkId);
      const { imageUrl, caption, isPrimary } = req.body;
      
      let finalImageUrl = imageUrl;
      let filePath = null;
      
      // Validar que se proporcionó una imagen (archivo o URL)
      if (!req.file && !imageUrl) {
        console.log('❌ Error: No se proporcionó archivo ni URL de imagen');
        return res.status(400).json({ error: 'Debe proporcionar un archivo de imagen o una URL' });
      }
      
      // Si se subió un archivo
      if (req.file) {
        filePath = req.file.path;
        finalImageUrl = `/uploads/park-images/${req.file.filename}`;
        console.log('📁 [PRODUCTION] Archivo guardado directamente en public/uploads:', finalImageUrl);
        
        // TAMBIÉN copiar a uploads/ para compatibilidad con desarrollo
        const developmentDestination = `uploads/park-images/${req.file.filename}`;
        try {
          // Asegurar que el directorio de desarrollo existe
          const devDir = 'uploads/park-images';
          if (!fs.existsSync(devDir)) {
            fs.mkdirSync(devDir, { recursive: true });
          }
          // Copiar archivo a ubicación de desarrollo
          fs.copyFileSync(req.file.path, developmentDestination);
          console.log(`📁 [DEVELOPMENT] File copied to: ${developmentDestination}`);
        } catch (copyError) {
          console.error('❌ Error copying to development directory:', copyError);
        }

        // CRÍTICO: También copiar a dist/public/uploads para producción inmediata
        const productionDestination = `dist/public/uploads/park-images/${req.file.filename}`;
        try {
          // Asegurar que el directorio de producción existe
          const prodDir = 'dist/public/uploads/park-images';
          if (!fs.existsSync(prodDir)) {
            fs.mkdirSync(prodDir, { recursive: true });
          }
          // Copiar archivo a ubicación de producción
          fs.copyFileSync(req.file.path, productionDestination);
          console.log(`📁 [PRODUCTION] File copied to: ${productionDestination}`);
        } catch (copyError) {
          console.error('❌ Error copying to production directory:', copyError);
        }
      } else {
        console.log('🔗 URL proporcionada:', finalImageUrl);
      }
      
      // Si es imagen principal, desmarcar otras
      if (isPrimary === 'true' || isPrimary === true) {
        await pool.query(
          'UPDATE park_images SET is_primary = false WHERE park_id = $1',
          [parkId]
        );
        console.log('⭐ Desmarcando otras imágenes principales');
      }
      
      const insertQuery = `
        INSERT INTO park_images (park_id, image_url, caption, is_primary)
        VALUES ($1, $2, $3, $4)
        RETURNING id, park_id as "parkId", image_url as "imageUrl", caption, is_primary as "isPrimary"
      `;
      
      const result = await pool.query(insertQuery, [
        parkId,
        finalImageUrl,
        caption || '',
        isPrimary === 'true' || isPrimary === true
      ]);
      
      console.log(`✅ Nueva imagen creada para parque ${parkId}:`, result.rows[0]);
      res.status(201).json(result.rows[0]);
      
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      res.status(400).json({ error: 'Error al subir la imagen: ' + message });
    }
  });

  // Establecer imagen como principal
  apiRouter.post('/park-images/:id/set-primary', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const imageId = parseInt(req.params.id);
      console.log(`🔧 Estableciendo imagen ${imageId} como principal`);
      
      // Obtener parkId de la imagen
      const imageResult = await pool.query(
        'SELECT park_id FROM park_images WHERE id = $1',
        [imageId]
      );
      
      if (imageResult.rows.length === 0) {
        console.log(`❌ Imagen ${imageId} no encontrada`);
        return res.status(404).json({ error: 'Imagen no encontrada' });
      }
      
      const parkId = imageResult.rows[0].park_id;
      console.log(`🔧 Imagen pertenece al parque ${parkId}`);
      
      // Desmarcar todas las imágenes como principales para este parque
      await pool.query(
        'UPDATE park_images SET is_primary = false WHERE park_id = $1',
        [parkId]
      );
      console.log(`🔧 Desmarcadas todas las imágenes principales del parque ${parkId}`);
      
      // Marcar esta imagen como principal
      const updateResult = await pool.query(
        'UPDATE park_images SET is_primary = true WHERE id = $1 RETURNING id, park_id as "parkId", is_primary as "isPrimary"',
        [imageId]
      );
      
      console.log(`✅ Imagen ${imageId} establecida como principal:`, updateResult.rows[0]);
      res.json({ 
        message: 'Imagen establecida como principal',
        image: updateResult.rows[0]
      });
      
    } catch (error) {
      console.error('❌ Error estableciendo imagen principal:', error);
      res.status(500).json({ error: 'Error al establecer imagen principal' });
    }
  });

  // Eliminar imagen
  apiRouter.delete('/park-images/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const imageId = parseInt(req.params.id);
      console.log('Eliminando imagen con ID:', imageId);
      
      // Eliminar registro de base de datos usando pool
      const result = await pool.query('DELETE FROM park_images WHERE id = $1', [imageId]);
      
      console.log('Resultado de eliminación:', result);
      console.log(`Imagen ${imageId} eliminada exitosamente`);
      res.status(204).send();
      
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      res.status(500).json({ error: 'Error al eliminar la imagen' });
    }
  });

  // =============================================
  // GESTIÓN DE DOCUMENTOS DE PARQUES
  // =============================================

  // Obtener todos los documentos de un parque
  apiRouter.get('/parks/:parkId/documents', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.parkId);
      console.log(`🔍 MULTIMEDIA SYSTEM: Consultando documentos para parque ${parkId}`);
      
      const query = `
        SELECT 
          id, 
          park_id as "parkId", 
          title, 
          file_url as "fileUrl",
          file_size as "fileSize",
          file_type as "fileType",
          description,
          created_at as "createdAt"
        FROM documents 
        WHERE park_id = $1 
        ORDER BY created_at DESC
      `;
      
      console.log(`🔍 MULTIMEDIA SYSTEM: Ejecutando query:`, query);
      console.log(`🔍 MULTIMEDIA SYSTEM: Con parámetros:`, [parkId]);
      
      const result = await pool.query(query, [parkId]);
      console.log(`✅ MULTIMEDIA SYSTEM: Documentos encontrados para parque ${parkId}:`, result.rows.length);
      console.log(`📋 MULTIMEDIA SYSTEM: Datos de documentos:`, result.rows);
      
      res.json(result.rows);
    } catch (error) {
      console.error('❌ MULTIMEDIA SYSTEM: Error obteniendo documentos del parque:', error);
      res.status(500).json({ error: 'Error al obtener los documentos del parque' });
    }
  });

  // Subir nuevo documento
  apiRouter.post('/parks/:parkId/documents', isAuthenticated, upload.single('document'), async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.parkId);
      const { title, description, category, fileUrl } = req.body;
      
      let finalFileUrl = fileUrl;
      let filePath = null;
      let fileSize = 0;
      let fileType = '';
      
      // Si se subió un archivo
      if (req.file) {
        filePath = req.file.path;
        finalFileUrl = `/uploads/park-documents/${req.file.filename}`;
        fileSize = req.file.size;
        fileType = req.file.mimetype;
      } else if (fileUrl) {
        // URL externa - detectar tipo de archivo por extensión
        const getFileTypeFromUrl = (url: string) => {
          const extension = url.split('.').pop()?.toLowerCase();
          switch (extension) {
            case 'pdf': return 'application/pdf';
            case 'doc': return 'application/msword';
            case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            case 'txt': return 'text/plain';
            case 'jpg':
            case 'jpeg': return 'image/jpeg';
            case 'png': return 'image/png';
            default: return 'application/octet-stream';
          }
        };
        
        fileType = getFileTypeFromUrl(fileUrl);
        fileSize = 0; // No podemos determinar el tamaño de URLs externas
      }
      
      const insertQuery = `
        INSERT INTO park_documents (park_id, title, file_path, file_url, file_size, file_type, description, category)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, park_id as "parkId", title, file_url as "fileUrl", file_size as "fileSize", file_type as "fileType", description, category, created_at as "createdAt"
      `;
      
      console.log('Insertando documento con datos:', {
        parkId,
        title,
        filePath,
        finalFileUrl,
        fileSize,
        fileType,
        description: description || '',
        category: category || 'general'
      });
      
      const result = await pool.query(insertQuery, [
        parkId,
        title,
        filePath,
        finalFileUrl,
        fileSize,
        fileType,
        description || '',
        category || 'general'
      ]);
      
      console.log('Resultado de inserción:', result.rows);
      
      console.log(`Nuevo documento creado para parque ${parkId}:`, result.rows[0]);
      res.status(201).json(result.rows[0]);
      
    } catch (error) {
      console.error('Error subiendo documento:', error);
      res.status(500).json({ error: 'Error al subir el documento' });
    }
  });

  // Eliminar documento
  apiRouter.delete('/park-documents/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      console.log(`🗑️ DELETE /park-documents/${documentId} - Iniciando eliminación`);
      console.log('🔍 Usuario autenticado:', { id: req.user?.id, role: req.user?.role });
      
      // Buscar en la tabla 'documents' que es la que usa el frontend
      const docResult = await pool.query(
        'SELECT file_url FROM documents WHERE id = $1',
        [documentId]
      );
      
      if (docResult.rows.length === 0) {
        console.log(`❌ Documento ${documentId} no encontrado en tabla documents`);
        // Return success even if document doesn't exist (idempotent operation)
        return res.status(200).json({ 
          success: true, 
          message: 'Documento ya eliminado o no existe',
          documentId 
        });
      }
      
      const fileUrl = docResult.rows[0].file_url;
      console.log(`📄 Documento encontrado con URL: ${fileUrl}`);
      
      // Solo eliminar archivo físico si es un archivo local (no URL externa)
      if (fileUrl && fileUrl.startsWith('/uploads/')) {
        const filePath = `public${fileUrl}`;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Archivo físico eliminado: ${filePath}`);
        }
      } else {
        console.log(`📋 Documento es una URL externa, no se elimina archivo físico: ${fileUrl}`);
      }
      
      // Eliminar registro de base de datos de la tabla 'documents'
      await pool.query('DELETE FROM documents WHERE id = $1', [documentId]);
      
      console.log(`✅ Documento ${documentId} eliminado exitosamente de tabla documents`);
      res.status(200).json({ 
        success: true, 
        message: 'Documento eliminado correctamente',
        documentId 
      });
      
    } catch (error) {
      console.error('❌ Error eliminando documento:', error);
      res.status(500).json({ error: 'Error al eliminar el documento' });
    }
  });

  // =============================================
  // ENDPOINTS DE UTILIDAD
  // =============================================

  // Obtener estadísticas de multimedia de un parque
  apiRouter.get('/parks/:parkId/multimedia-stats', async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.parkId);
      
      const imagesResult = await pool.query(
        'SELECT COUNT(*) as count FROM park_images WHERE park_id = $1',
        [parkId]
      );
      
      const documentsResult = await pool.query(
        'SELECT COUNT(*) as count FROM park_documents WHERE park_id = $1',
        [parkId]
      );
      
      const stats = {
        totalImages: parseInt(imagesResult.rows[0]?.count || '0'),
        totalDocuments: parseInt(documentsResult.rows[0]?.count || '0')
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error obteniendo estadísticas multimedia:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  });

  console.log('✅ Sistema completo de multimedia para parques registrado');
}

/**
 * FUNCIÓN PARA CREAR TABLAS DE MULTIMEDIA
 */
export async function createMultimediaTables() {
  try {
    // Crear tabla de imágenes de parques
    await db.execute(`
      CREATE TABLE IF NOT EXISTS park_images (
        id SERIAL PRIMARY KEY,
        park_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        file_path TEXT,
        caption TEXT DEFAULT '',
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE
      )
    `);

    // Crear tabla de documentos de parques
    await db.execute(`
      CREATE TABLE IF NOT EXISTS park_documents (
        id SERIAL PRIMARY KEY,
        park_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        file_path TEXT,
        file_url TEXT,
        file_size INTEGER DEFAULT 0,
        file_type TEXT DEFAULT '',
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Tablas de multimedia creadas exitosamente');
  } catch (error) {
    console.error('Error creando tablas de multimedia:', error);
  }
}