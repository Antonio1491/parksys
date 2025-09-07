import express, { Request, Response } from 'express';
import multer from 'multer';
import { isAuthenticated } from './middleware/auth';
import { UnifiedStorageService } from './UnifiedStorageService';

const router = express.Router();

// 🚀 USAR SISTEMA HÍBRIDO IGUAL QUE PARQUES Y ACTIVIDADES
const unifiedStorage = new UnifiedStorageService();

// Configuración de multer para memoria (no disco)
const eventImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  },
  fileFilter: function (req, file, cb) {
    // Validar tipos de archivo
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, GIF, WebP)'));
    }
  }
});

// Endpoint para subir imagen de evento con SISTEMA HÍBRIDO
router.post('/upload-image', isAuthenticated, eventImageUpload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se recibió ningún archivo' 
      });
    }

    console.log('📸 [EVENT-HÍBRIDO] Iniciando upload de imagen de evento:', req.file.originalname);

    // ✅ USAR UNIFIED STORAGE SERVICE (igual que parques y actividades)
    const uploadResult = await unifiedStorage.uploadImage(
      req.file, 
      'event-images',
      {
        caption: 'Imagen de evento',
        isPrimary: true
      }
    );

    console.log('✅ [EVENT-HÍBRIDO] Upload exitoso:', {
      method: uploadResult.method,
      persistent: uploadResult.persistent,
      url: uploadResult.imageUrl,
      originalName: req.file.originalname
    });

    res.json({
      success: true,
      message: 'Imagen subida exitosamente',
      imageUrl: uploadResult.imageUrl,
      filename: uploadResult.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      method: uploadResult.method,
      persistent: uploadResult.persistent
    });

  } catch (error) {
    console.error('❌ [EVENT-HÍBRIDO] Error al subir imagen de evento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor al subir la imagen' 
    });
  }
});

// Middleware para manejar errores de multer
router.use((error: any, req: Request, res: Response, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 5MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de archivo inesperado.'
      });
    }
  }
  
  if (error.message === 'Solo se permiten archivos de imagen (JPEG, JPG, PNG, GIF, WebP)') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  console.error('❌ [EVENT-HÍBRIDO] Error en upload de imagen de evento:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

export { router as eventImageRouter };