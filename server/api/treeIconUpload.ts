import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Obtener el directorio actual en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar la carpeta de destino para iconos de especies de árboles
const uploadDir = path.join(__dirname, '../../public/uploads/tree-icons');

// Asegurarse de que existe la carpeta para los iconos de árboles
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer para el almacenamiento de iconos de especies de árboles
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar un nombre único basado en timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Obtener la extensión original del archivo
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'tree-icon-' + uniqueSuffix + ext);
  }
});

// Filtro para asegurar que solo se suban imágenes
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Validar que sea un tipo de imagen permitido
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/svg+xml') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos JPEG, PNG o SVG'));
  }
};

// Configurar multer con los parámetros definidos
export const uploadTreeIcon = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB límite
  },
}).single('icon');

// Configurar multer para subida de fotos de especies de árboles
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const photoDir = path.join(__dirname, '../../public/uploads/tree-photos');
    if (!fs.existsSync(photoDir)) {
      fs.mkdirSync(photoDir, { recursive: true });
    }
    cb(null, photoDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'tree-photo-' + uniqueSuffix + ext);
  }
});

export const uploadTreePhoto = multer({
  storage: photoStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite para fotos
  },
}).single('photo');

// Manejador de errores de multer para iconos
export function handleTreeIconUploadErrors(err: any, req: Request, res: Response, next: Function) {
  if (err instanceof multer.MulterError) {
    // Errores específicos de multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'El archivo es demasiado grande. El tamaño máximo es 2MB para iconos' 
      });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    // Otros errores
    return res.status(400).json({ error: err.message });
  }
  next();
}

// Manejador de errores de multer para fotos
export function handleTreePhotoUploadErrors(err: any, req: Request, res: Response, next: Function) {
  if (err instanceof multer.MulterError) {
    // Errores específicos de multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'El archivo es demasiado grande. El tamaño máximo es 5MB para fotos' 
      });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    // Otros errores
    return res.status(400).json({ error: err.message });
  }
  next();
}

// Función para manejar la carga del icono
export function uploadTreeIconHandler(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  
  const file = req.file;
  // Devuelve la URL relativa al archivo
  const fileUrl = `/uploads/tree-icons/${file.filename}`;
  
  return res.status(200).json({
    message: 'Icono de especie de árbol subido exitosamente',
    filename: file.filename,
    url: fileUrl,
    iconUrl: fileUrl
  });
}

// Función para manejar la carga de la foto
export function uploadTreePhotoHandler(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  
  const file = req.file;
  // Devuelve la URL relativa al archivo
  const fileUrl = `/uploads/tree-photos/${file.filename}`;
  
  return res.status(200).json({
    message: 'Foto de especie de árbol subida exitosamente',
    filename: file.filename,
    url: fileUrl,
    photoUrl: fileUrl
  });
}

// Configuración para subida múltiple de iconos
export const uploadMultipleTreeIcons = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB límite
  },
}).array('icons', 50); // máximo 50 iconos a la vez