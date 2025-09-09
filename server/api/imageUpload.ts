import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { storage } from '../storage';
import { replitObjectStorage } from '../objectStorage-replit';

// Obtener el directorio actual en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar la carpeta de destino para imágenes
const uploadDir = path.join(__dirname, '../../public/uploads/images');

// Asegurarse de que existe la carpeta para las imágenes
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer para el almacenamiento de imágenes
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar un nombre único basado en timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Obtener la extensión original del archivo
    const ext = path.extname(file.originalname).toLowerCase();
    // Crear nombre único para la imagen
    cb(null, 'park-image-' + uniqueSuffix + ext);
  }
});

// Filtro para asegurar que solo se suban imágenes permitidas
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Validar que sea un tipo de imagen permitido
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos JPEG, PNG o WebP'));
  }
};

// Configurar multer con los parámetros definidos
export const uploadParkImage = multer({
  storage: diskStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
  },
}).single('image');

// Manejador de errores de multer
export function handleImageUploadErrors(err: any, req: Request, res: Response, next: Function) {
  if (err instanceof multer.MulterError) {
    // Errores específicos de multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'El archivo es demasiado grande. El tamaño máximo es 5MB' 
      });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    // Otros errores
    return res.status(400).json({ error: err.message });
  }
  next();
}

// Función para manejar la carga de imágenes
export async function uploadParkImageHandler(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    
    const parkId = Number(req.params.id);
    if (!parkId || isNaN(parkId)) {
      return res.status(400).json({ error: 'ID de parque inválido' });
    }
    
    // Verificar que el parque existe
    const park = await storage.getPark(parkId);
    if (!park) {
      return res.status(404).json({ error: 'Parque no encontrado' });
    }
    
    const file = req.file;
    // Crear la URL relativa al archivo
    const fileUrl = `/uploads/images/${file.filename}`;
    
    // Guardar la imagen en la base de datos
    const parkImage = await storage.createParkImage({
      parkId,
      imageUrl: replitObjectStorage.normalizeUrl(fileUrl),
      caption: req.body.caption || 'Imagen del parque',
      isPrimary: req.body.isPrimary === 'true' || false
    });
    
    return res.status(201).json({
      message: 'Imagen subida exitosamente',
      image: {
        ...parkImage,
        imageUrl: replitObjectStorage.normalizeUrl(parkImage.imageUrl)
      }
    });
  } catch (error) {
    console.error('Error al procesar la imagen:', error);
    return res.status(500).json({ error: 'Error al procesar la imagen' });
  }
}