import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Configuraciones centralizadas de Multer para uploads de archivos
 * 
 * Uso:
 *   import { parkImageUpload, documentUpload, videoUpload } from './middleware/upload';
 *   app.post('/api/parks/:id/images', parkImageUpload.single('image'), handler);
 */

// ============================================================================
// CONSTANTES
// ============================================================================

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

// Tamaños máximos de archivo
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024,      // 10MB
  ICON: 2 * 1024 * 1024,        // 2MB
  DOCUMENT: 10 * 1024 * 1024,   // 10MB
  VIDEO: 100 * 1024 * 1024,     // 100MB
  SPONSOR_LOGO: 5 * 1024 * 1024, // 5MB
  EXCEL: 10 * 1024 * 1024,      // 10MB
} as const;

// Tipos MIME permitidos
export const ALLOWED_MIME_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ICONS: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ],
  VIDEOS: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/ogg'
  ],
  EXCEL: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ]
} as const;

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Genera un nombre de archivo único
 */
function generateUniqueFilename(prefix: string, originalName: string): string {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = originalName.split('.').pop();
  return `${prefix}-${uniqueSuffix}.${extension}`;
}

/**
 * Crea un directorio si no existe
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Crea un filtro de archivos basado en tipos MIME permitidos
 */
function createFileFilter(allowedTypes: readonly string[], errorMessage: string) {
  return (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(errorMessage));
    }
  };
}

// ============================================================================
// CONFIGURACIONES DE MULTER
// ============================================================================

/**
 * Upload genérico con memoria (para Object Storage)
 */
export const memoryUpload = multer({ 
  storage: multer.memoryStorage() 
});

/**
 * Upload de imágenes de parques (memoria para Object Storage)
 */
export const parkImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: createFileFilter(
    ALLOWED_MIME_TYPES.IMAGES,
    'Formato de archivo no válido. Solo se permiten JPG, PNG, GIF y WEBP'
  ),
  limits: {
    fileSize: FILE_SIZE_LIMITS.IMAGE
  }
});

/**
 * Upload de documentos (disco)
 */
export const documentUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadsDir = isProduction ? 'public/uploads/documents/' : 'uploads/documents/';
      ensureDirectoryExists(uploadsDir);
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      cb(null, generateUniqueFilename('doc', file.originalname));
    }
  }),
  fileFilter: createFileFilter(
    ALLOWED_MIME_TYPES.DOCUMENTS,
    'Formato de archivo no válido. Solo se permiten PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX y TXT'
  ),
  limits: {
    fileSize: FILE_SIZE_LIMITS.DOCUMENT
  }
});

/**
 * Upload de iconos de amenidades (disco)
 */
export const iconUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadsDir = 'public/uploads/';
      ensureDirectoryExists(uploadsDir);
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      cb(null, generateUniqueFilename('amenity-icon', file.originalname));
    }
  }),
  fileFilter: createFileFilter(
    ALLOWED_MIME_TYPES.ICONS,
    'Formato de archivo no válido. Solo se permiten PNG, JPG, JPEG y SVG'
  ),
  limits: {
    fileSize: FILE_SIZE_LIMITS.ICON
  }
});

/**
 * Upload de videos (disco)
 */
export const videoUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadsDir = isProduction ? 'public/uploads/videos/' : 'uploads/videos/';
      ensureDirectoryExists(uploadsDir);
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      cb(null, generateUniqueFilename('video', file.originalname));
    }
  }),
  fileFilter: createFileFilter(
    ALLOWED_MIME_TYPES.VIDEOS,
    'Tipo de archivo no permitido. Solo se aceptan videos (MP4, MPEG, MOV, AVI, WebM, OGG)'
  ),
  limits: {
    fileSize: FILE_SIZE_LIMITS.VIDEO
  }
});

/**
 * Upload de logos de patrocinadores (disco)
 */
export const sponsorLogoUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = 'public/uploads/sponsor-logos/';
      ensureDirectoryExists(uploadDir);
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, generateUniqueFilename('sponsor-logo', file.originalname));
    }
  }),
  fileFilter: createFileFilter(
    ['image/png', 'image/jpeg', 'image/jpg'],
    'Formato de archivo no válido. Solo se permiten PNG y JPG'
  ),
  limits: {
    fileSize: FILE_SIZE_LIMITS.SPONSOR_LOGO
  }
});

/**
 * Upload de archivos Excel para importación
 */
export const excelUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: createFileFilter(
    ALLOWED_MIME_TYPES.EXCEL,
    'Formato de archivo no válido. Solo se permiten archivos Excel (XLS, XLSX) o CSV'
  ),
  limits: {
    fileSize: FILE_SIZE_LIMITS.EXCEL
  }
});

/**
 * Upload de imágenes de actividades (memoria para Object Storage)
 */
export const activityImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: createFileFilter(
    ALLOWED_MIME_TYPES.IMAGES,
    'Formato de archivo no válido. Solo se permiten JPG, PNG, GIF y WEBP'
  ),
  limits: {
    fileSize: FILE_SIZE_LIMITS.IMAGE
  }
});

/**
 * Upload de imágenes de eventos (memoria para Object Storage)
 */
export const eventImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: createFileFilter(
    ALLOWED_MIME_TYPES.IMAGES,
    'Formato de archivo no válido. Solo se permiten JPG, PNG, GIF y WEBP'
  ),
  limits: {
    fileSize: FILE_SIZE_LIMITS.IMAGE
  }
});

/**
 * Upload de imágenes de activos (memoria para Object Storage)
 */
export const assetImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: createFileFilter(
    ALLOWED_MIME_TYPES.IMAGES,
    'Formato de archivo no válido. Solo se permiten JPG, PNG, GIF y WEBP'
  ),
  limits: {
    fileSize: FILE_SIZE_LIMITS.IMAGE
  }
});

// ============================================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ============================================================================

/**
 * Middleware para manejar errores de Multer
 */
export function handleMulterError(err: any, req: any, res: any, next: any) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Archivo demasiado grande',
        message: 'El archivo excede el tamaño máximo permitido'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Campo de archivo inesperado',
        message: 'Se recibió un campo de archivo no esperado'
      });
    }
    return res.status(400).json({
      error: 'Error de upload',
      message: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      error: 'Error de upload',
      message: err.message
    });
  }

  next();
}

// Export default con todas las configuraciones
export default {
  memoryUpload,
  parkImageUpload,
  documentUpload,
  iconUpload,
  videoUpload,
  sponsorLogoUpload,
  excelUpload,
  activityImageUpload,
  eventImageUpload,
  assetImageUpload,
  handleMulterError,
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES
};