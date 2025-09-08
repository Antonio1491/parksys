import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { replitObjectStorage } from './objectStorage-replit';

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/active-concessions';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `concession-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image') {
      // Solo imágenes para el campo 'image'
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)'));
      }
    } else if (file.fieldname === 'document') {
      // Documentos para el campo 'document'
      const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten documentos PDF o Word'));
      }
    } else {
      cb(new Error('Campo de archivo no válido'));
    }
  }
});

/**
 * Registra todas las rutas para el módulo de Concesiones Activas (versión simplificada)
 */
export function registerActiveConcessionRoutes(app: any, apiRouter: any, isAuthenticated: any) {
  
  // ========== RUTAS PRINCIPALES ==========
  
  // Obtener todas las concesiones activas con información relacionada
  apiRouter.get('/active-concessions', async (req: Request, res: Response) => {
    try {
      const { pool } = await import('./db');
      
      const result = await pool.query(`
        SELECT 
          ac.*,
          ct.name as "concessionTypeName",
          ct.description as "concessionTypeDescription",
          ct.impact_level as "impactLevel",
          cn.name as "concessionaireName",
          cn.email as "concessionaireEmail",
          cn.phone as "concessionairePhone",
          p.name as "parkName",
          p.address as "parkLocation",
          COALESCE(img_count.count, 0) as "imageCount",
          primary_img.image_url as "primaryImage"
        FROM active_concessions ac
        LEFT JOIN concession_types ct ON ac.concession_type_id = ct.id
        LEFT JOIN concessionaires cn ON ac.concessionaire_id = cn.id
        LEFT JOIN parks p ON ac.park_id = p.id
        LEFT JOIN (
          SELECT concession_id, COUNT(*) as count
          FROM active_concession_images 
          GROUP BY concession_id
        ) img_count ON ac.id = img_count.concession_id
        LEFT JOIN active_concession_images primary_img ON ac.id = primary_img.concession_id AND primary_img.is_primary = true
        ORDER BY ac.created_at DESC
      `);
      


      // Mapear campos para consistencia con frontend
      const mappedData = result.rows.map(row => ({
        ...row,
        imageCount: parseInt(row.imageCount?.toString()) || 0,
        primaryImage: row.primaryImage || null
      }));

      res.json(mappedData);
    } catch (error) {
      console.error('Error al obtener concesiones activas:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error al obtener concesiones activas'
      });
    }
  });

  // Obtener una concesión activa específica
  apiRouter.get('/active-concessions/:id', async (req: Request, res: Response) => {
    try {
      const { pool } = await import('./db');
      const concessionId = parseInt(req.params.id);

      const concessionResult = await pool.query(`
        SELECT 
          ac.*,
          ct.name as "concessionTypeName",
          ct.description as "concessionTypeDescription",
          ct.impact_level as "impactLevel",
          cn.name as "concessionaireName",
          cn.email as "concessionaireEmail",
          cn.phone as "concessionairePhone",
          p.name as "parkName",
          p.address as "parkLocation",
          COALESCE(img_count.count, 0) as "imageCount",
          primary_img.image_url as "primaryImage"
        FROM active_concessions ac
        LEFT JOIN concession_types ct ON ac.concession_type_id = ct.id
        LEFT JOIN concessionaires cn ON ac.concessionaire_id = cn.id
        LEFT JOIN parks p ON ac.park_id = p.id
        LEFT JOIN (
          SELECT concession_id, COUNT(*) as count
          FROM active_concession_images 
          GROUP BY concession_id
        ) img_count ON ac.id = img_count.concession_id
        LEFT JOIN active_concession_images primary_img ON ac.id = primary_img.concession_id AND primary_img.is_primary = true
        WHERE ac.id = $1
      `, [concessionId]);

      if (concessionResult.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Concesión no encontrada'
        });
      }
      
      const concession = concessionResult.rows[0];
      
      // Obtener todas las imágenes de la concesión
      const imagesResult = await pool.query(`
        SELECT id, image_url, title, description, image_type, is_primary, display_order
        FROM active_concession_images 
        WHERE concession_id = $1 
        ORDER BY is_primary DESC, display_order ASC
      `, [concessionId]);
      
      // Mapear campos para consistencia
      concession.imageCount = parseInt(concession.imageCount?.toString()) || 0;
      concession.image_url = concession.primaryImage || null;
      concession.images = imagesResult.rows || [];
      concession.documents = [];

      res.json({
        status: 'success',
        data: concession
      });
    } catch (error) {
      console.error('Error al obtener concesión activa:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error al obtener concesión activa'
      });
    }
  });

  // Crear una nueva concesión activa
  apiRouter.post('/active-concessions', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('🔄 [CONCESSIONS] POST /active-concessions llamado');
      console.log('📥 [CONCESSIONS] Datos recibidos:', req.body);
      const { pool } = await import('./db');
      
      const concessionData = {
        name: req.body.name,
        description: req.body.description,
        concession_type_id: req.body.concessionTypeId,
        concessionaire_id: req.body.concessionaireId,
        park_id: req.body.parkId,
        specific_location: req.body.specificLocation,
        coordinates: req.body.coordinates,
        area: req.body.area,
        start_date: req.body.startDate,
        end_date: req.body.endDate,
        status: req.body.status || 'pending',
        priority: req.body.priority || 'medium',
        operating_hours: req.body.operatingHours,
        operating_days: req.body.operatingDays,
        monthly_payment: req.body.monthlyPayment,
        revenue_percentage: req.body.revenuePercentage,
        deposit: req.body.deposit,
        emergency_contact: req.body.emergencyContact,
        emergency_phone: req.body.emergencyPhone,
        terms_conditions: req.body.termsConditions,
        special_requirements: req.body.specialRequirements,
        contract_number: req.body.contractNumber,
        notes: req.body.notes,
        internal_notes: req.body.internalNotes,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await pool.query(`
        INSERT INTO active_concessions (
          name, description, concession_type_id, concessionaire_id, park_id, 
          specific_location, coordinates, area, start_date, end_date, status, priority, 
          operating_hours, operating_days, monthly_payment, revenue_percentage, deposit,
          emergency_contact, emergency_phone, terms_conditions, special_requirements,
          contract_number, notes, internal_notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17, $18, $19, 
          $20, $21, $22, $23, $24, $25, $26
        ) RETURNING *
      `, [
        concessionData.name, concessionData.description, concessionData.concession_type_id,
        concessionData.concessionaire_id, concessionData.park_id, concessionData.specific_location,
        concessionData.coordinates, concessionData.area, concessionData.start_date, concessionData.end_date, 
        concessionData.status, concessionData.priority, concessionData.operating_hours, concessionData.operating_days,
        concessionData.monthly_payment, concessionData.revenue_percentage, concessionData.deposit,
        concessionData.emergency_contact, concessionData.emergency_phone, concessionData.terms_conditions,
        concessionData.special_requirements, concessionData.contract_number, concessionData.notes,
        concessionData.internal_notes, concessionData.created_at, concessionData.updated_at
      ]);

      console.log('✅ [CONCESSIONS] Concesión creada exitosamente:', result.rows[0].id);
      res.status(201).json({
        status: 'success',
        message: 'Concesión activa creada exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al crear concesión activa:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error al crear concesión activa'
      });
    }
  });

  // Actualizar una concesión activa
  apiRouter.put('/active-concessions/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { pool } = await import('./db');
      const concessionId = parseInt(req.params.id);

      const updateData = {
        name: req.body.name,
        description: req.body.description,
        concession_type_id: req.body.concessionTypeId,
        concessionaire_id: req.body.concessionaireId,
        park_id: req.body.parkId,
        specific_location: req.body.specificLocation,
        coordinates: req.body.coordinates,
        area: req.body.area,
        start_date: req.body.startDate,
        end_date: req.body.endDate,
        status: req.body.status,
        priority: req.body.priority,
        operating_hours: req.body.operatingHours,
        operating_days: req.body.operatingDays,
        monthly_payment: req.body.monthlyPayment,
        revenue_percentage: req.body.revenuePercentage,
        deposit: req.body.deposit,
        emergency_contact: req.body.emergencyContact,
        emergency_phone: req.body.emergencyPhone,
        terms_conditions: req.body.termsConditions,
        special_requirements: req.body.specialRequirements,
        contract_number: req.body.contractNumber,
        notes: req.body.notes,
        internal_notes: req.body.internalNotes,
        updated_at: new Date()
      };

      const result = await pool.query(`
        UPDATE active_concessions SET
          name = $1, description = $2, concession_type_id = $3, concessionaire_id = $4,
          park_id = $5, specific_location = $6, coordinates = $7, area = $8, 
          start_date = $9, end_date = $10, status = $11, priority = $12, 
          operating_hours = $13, operating_days = $14, monthly_payment = $15, 
          revenue_percentage = $16, deposit = $17, emergency_contact = $18, 
          emergency_phone = $19, terms_conditions = $20, special_requirements = $21,
          contract_number = $22, notes = $23, internal_notes = $24, updated_at = $25
        WHERE id = $26
        RETURNING *
      `, [
        updateData.name, updateData.description, updateData.concession_type_id,
        updateData.concessionaire_id, updateData.park_id, updateData.specific_location,
        updateData.coordinates, updateData.area, updateData.start_date, updateData.end_date, 
        updateData.status, updateData.priority, updateData.operating_hours, updateData.operating_days,
        updateData.monthly_payment, updateData.revenue_percentage, updateData.deposit,
        updateData.emergency_contact, updateData.emergency_phone, updateData.terms_conditions,
        updateData.special_requirements, updateData.contract_number, updateData.notes,
        updateData.internal_notes, updateData.updated_at, concessionId
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Concesión no encontrada'
        });
      }

      res.json({
        status: 'success',
        message: 'Concesión activa actualizada exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al actualizar concesión activa:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error al actualizar concesión activa'
      });
    }
  });

  // Eliminar una concesión activa
  apiRouter.delete('/active-concessions/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('🗑️ [CONCESSIONS] DELETE /active-concessions/:id llamado para ID:', req.params.id);
      const { pool } = await import('./db');
      const concessionId = parseInt(req.params.id);

      const result = await pool.query('DELETE FROM active_concessions WHERE id = $1 RETURNING *', [concessionId]);
      console.log('📊 [CONCESSIONS] Registros eliminados:', result.rowCount);

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Concesión no encontrada'
        });
      }

      console.log('✅ [CONCESSIONS] Concesión eliminada exitosamente:', concessionId);
      res.json({
        status: 'success',
        message: 'Concesión activa eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar concesión activa:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error al eliminar concesión activa'
      });
    }
  });

  // ========== RUTAS DE DATOS RELACIONADOS ==========
  
  // Obtener concesionarios (usuarios con rol 'concesionario')
  apiRouter.get('/concessionaires', async (req: Request, res: Response) => {
    try {
      const { pool } = await import('./db');
      
      const result = await pool.query(`
        SELECT id, username, full_name as "fullName", email, phone, created_at
        FROM users 
        WHERE role = 'concesionario'
        ORDER BY full_name ASC
      `);

      res.json({
        status: 'success',
        data: result.rows
      });
    } catch (error) {
      console.error('Error al obtener concesionarios:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error al obtener concesionarios'
      });
    }
  });

  // Obtener tipos de concesión disponibles
  apiRouter.get('/concession-types-active', async (req: Request, res: Response) => {
    try {
      const { pool } = await import('./db');
      
      const result = await pool.query(`
        SELECT id, name, description, impact_level, created_at
        FROM concession_types 
        ORDER BY name ASC
      `);

      res.json({
        status: 'success',
        data: result.rows
      });
    } catch (error) {
      console.error('Error al obtener tipos de concesión:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error al obtener tipos de concesión'
      });
    }
  });

  // ============================================================================
  // RUTAS PARA GESTIÓN DE IMÁGENES DE CONCESIONES ACTIVAS
  // ============================================================================

  // Obtener imágenes de una concesión activa
  apiRouter.get('/active-concessions/:id/images', async (req: Request, res: Response) => {
    try {
      const { pool } = await import('./db');
      const { id } = req.params;
      
      const result = await pool.query(`
        SELECT ci.id, ci.concession_id, ci.image_url, ci.title, ci.description, ci.is_primary, ci.created_at
        FROM active_concession_images ci
        WHERE ci.concession_id = $1
        ORDER BY ci.is_primary DESC, ci.created_at DESC
      `, [id]);

      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener imágenes de concesión:', error);
      res.status(500).json({ error: 'Error al obtener imágenes de concesión' });
    }
  });

  // Configuración de multer para concesiones con sistema híbrido (igual que actividades)
  const concessionImageUpload = multer({
    storage: multer.memoryStorage(), // Use memory storage for Object Storage uploads
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Formato de archivo no válido. Solo se permiten JPG, PNG, GIF y WEBP'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  });

  // Subir nueva imagen para una concesión activa (SISTEMA HÍBRIDO - igual que actividades)
  apiRouter.post('/active-concessions/:id/images', isAuthenticated, concessionImageUpload.single('image'), async (req: Request, res: Response) => {
    try {
      const { pool } = await import('./db');
      const concessionId = parseInt(req.params.id);
      
      if (isNaN(concessionId)) {
        return res.status(400).json({ error: 'ID de concesión inválido' });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó archivo de imagen' });
      }

      console.log(`📤 [CONCESSION-HÍBRIDO] Iniciando upload para concesión ${concessionId}: ${req.file.originalname}`);
      
      // Verificar que la concesión activa existe
      const concessionCheck = await pool.query('SELECT id FROM active_concessions WHERE id = $1', [concessionId]);
      if (concessionCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Concesión activa no encontrada' });
      }

      const { caption } = req.body;
      let imageUrl: string;
      
      try {
        // 1. INTENTAR REPLIT OBJECT STORAGE (persistente)
        console.log('📤 [CONCESSION-HÍBRIDO] Intentando Replit Object Storage...');
        imageUrl = await replitObjectStorage.uploadFile(req.file.buffer, req.file.originalname);
        imageUrl = replitObjectStorage.getPublicUrl(imageUrl);
        console.log('✅ [CONCESSION-HÍBRIDO] Object Storage exitoso:', imageUrl);
        
      } catch (objectStorageError) {
        console.log('⚠️ [CONCESSION-HÍBRIDO] Object Storage falló, usando filesystem...', objectStorageError);
        
        // 2. FALLBACK A FILESYSTEM (carpeta persistente)
        const uploadDir = path.join(process.cwd(), 'uploads', 'concession-images');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `concession-img-${uniqueSuffix}${path.extname(req.file.originalname)}`;
        const filePath = path.join(uploadDir, filename);
        
        fs.writeFileSync(filePath, req.file.buffer);
        imageUrl = `/uploads/concession-images/${filename}`;
        console.log('✅ [CONCESSION-HÍBRIDO] Filesystem usado:', imageUrl);
      }
      
      // Si es la primera imagen, marcarla como principal
      const existingImages = await pool.query('SELECT COUNT(*) as count FROM active_concession_images WHERE concession_id = $1', [concessionId]);
      const isPrimary = existingImages.rows[0].count === '0';

      const result = await pool.query(
        'INSERT INTO active_concession_images (concession_id, image_url, title, description, is_primary) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [concessionId, imageUrl, caption || null, null, isPrimary]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error al subir imagen de concesión:', error);
      res.status(500).json({ error: 'Error al subir imagen de concesión' });
    }
  });

  // Eliminar imagen de concesión
  apiRouter.delete('/concession-images/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { pool } = await import('./db');
      const { id } = req.params;

      // Obtener la imagen antes de eliminarla
      const imageResult = await pool.query('SELECT * FROM active_concession_images WHERE id = $1', [id]);
      if (imageResult.rows.length === 0) {
        return res.status(404).json({ error: 'Imagen no encontrada' });
      }

      const image = imageResult.rows[0];
      const wasPrimary = image.is_primary;
      const concessionId = image.concession_id;

      // Eliminar la imagen de la base de datos
      await pool.query('DELETE FROM active_concession_images WHERE id = $1', [id]);

      // Si era la imagen principal, hacer principal a otra imagen
      if (wasPrimary) {
        await pool.query(
          'UPDATE active_concession_images SET is_primary = true WHERE concession_id = $1 AND id = (SELECT id FROM active_concession_images WHERE concession_id = $1 ORDER BY created_at ASC LIMIT 1)',
          [concessionId]
        );
      }

      // Eliminar archivo físico  
      const filePath = path.join(process.cwd(), concessionUploadsDir, path.basename(image.image_url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({ message: 'Imagen eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar imagen de concesión:', error);
      res.status(500).json({ error: 'Error al eliminar imagen de concesión' });
    }
  });

  // Establecer imagen principal
  apiRouter.post('/concession-images/:id/set-primary', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { pool } = await import('./db');
      const { id } = req.params;

      // Obtener la concesión de la imagen
      const imageResult = await pool.query('SELECT concession_id FROM active_concession_images WHERE id = $1', [id]);
      if (imageResult.rows.length === 0) {
        return res.status(404).json({ error: 'Imagen no encontrada' });
      }

      const concessionId = imageResult.rows[0].concession_id;

      // Quitar principal de todas las imágenes de la concesión
      await pool.query('UPDATE active_concession_images SET is_primary = false WHERE concession_id = $1', [concessionId]);

      // Establecer esta imagen como principal
      await pool.query('UPDATE active_concession_images SET is_primary = true WHERE id = $1', [id]);

      res.json({ message: 'Imagen principal actualizada' });
    } catch (error) {
      console.error('Error al establecer imagen principal:', error);
      res.status(500).json({ error: 'Error al establecer imagen principal' });
    }
  });

  console.log('✅ Rutas de concesiones activas con gestión de imágenes registradas exitosamente');
}