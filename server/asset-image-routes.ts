import { Router, Request, Response } from 'express';
import { db } from './db';
import { assetImages, assets } from '@shared/schema';
import { eq, and, desc, ne } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { replitObjectStorage } from './objectStorage-replit';

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'assets');
    
    // Crear el directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `asset-${uniqueSuffix}${ext}`);
  }
});

// Filtro para validar tipos de archivo
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG y WebP.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
});

/**
 * Registra las rutas para gestión de imágenes de activos
 */
export function registerAssetImageRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  
  // Obtener todas las imágenes de un activo
  apiRouter.get('/assets/:id/images', async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      
      if (isNaN(assetId)) {
        return res.status(400).json({ error: 'ID de activo inválido' });
      }

      const images = await db
        .select()
        .from(assetImages)
        .where(eq(assetImages.assetId, assetId))
        .orderBy(desc(assetImages.isPrimary), desc(assetImages.createdAt));

      res.json(images);
    } catch (error) {
      console.error('Error al obtener imágenes del activo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Subir una nueva imagen para un activo
  apiRouter.post('/assets/:id/images', isAuthenticated, upload.single('image'), async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      
      if (isNaN(assetId)) {
        return res.status(400).json({ error: 'ID de activo inválido' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
      }

      // Verificar que el activo existe
      const [asset] = await db
        .select()
        .from(assets)
        .where(eq(assets.id, assetId))
        .limit(1);

      if (!asset) {
        return res.status(404).json({ error: 'Activo no encontrado' });
      }

      const { caption, isPrimary } = req.body;
      const userId = (req as any).user?.id || 1; // Usuario autenticado

      // Si se marca como imagen principal, quitar la marca de otras imágenes
      if (isPrimary === 'true') {
        await db
          .update(assetImages)
          .set({ 
            isPrimary: false,
            updatedAt: new Date()
          })
          .where(eq(assetImages.assetId, assetId));
      }

      // Crear la URL relativa para acceder a la imagen
      const imageUrl = `/uploads/assets/${req.file.filename}`;

      // Insertar la nueva imagen en la base de datos
      const [newImage] = await db
        .insert(assetImages)
        .values({
          assetId,
          imageUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          caption: caption || null,
          isPrimary: isPrimary === 'true',
          uploadedById: userId
        })
        .returning();

      res.status(201).json({
        ...newImage,
        imageUrl: replitObjectStorage.normalizeUrl(newImage.imageUrl)
      });
    } catch (error) {
      console.error('Error al subir imagen:', error);
      
      // Verificar si es un error específico de multer
      if ((error as any).code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB permitido.' });
      }
      
      if ((error as any).message && (error as any).message.includes('Tipo de archivo no permitido')) {
        return res.status(400).json({ error: (error as any).message });
      }
      
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Actualizar información de una imagen
  apiRouter.put('/asset-images/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const imageId = parseInt(req.params.id);
      
      if (isNaN(imageId)) {
        return res.status(400).json({ error: 'ID de imagen inválido' });
      }

      const { caption, isPrimary } = req.body;
      console.log('Actualizando imagen:', { imageId, caption, isPrimary });

      // Verificar que la imagen existe
      const [existingImage] = await db
        .select()
        .from(assetImages)
        .where(eq(assetImages.id, imageId))
        .limit(1);

      if (!existingImage) {
        return res.status(404).json({ error: 'Imagen no encontrada' });
      }

      // Si se marca como imagen principal, quitar la marca de otras imágenes del mismo activo
      if (isPrimary === true) {
        await db
          .update(assetImages)
          .set({ 
            isPrimary: false,
            updatedAt: new Date()
          })
          .where(and(
            eq(assetImages.assetId, existingImage.assetId),
            ne(assetImages.id, imageId)
          ));
      }

      // Actualizar la imagen
      const [updatedImage] = await db
        .update(assetImages)
        .set({
          caption: caption !== undefined ? caption : existingImage.caption,
          isPrimary: isPrimary !== undefined ? isPrimary : existingImage.isPrimary,
          updatedAt: new Date()
        })
        .where(eq(assetImages.id, imageId))
        .returning();

      res.json(updatedImage);
    } catch (error) {
      console.error('Error al actualizar imagen:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Eliminar una imagen
  apiRouter.delete('/asset-images/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const imageId = parseInt(req.params.id);
      
      if (isNaN(imageId)) {
        return res.status(400).json({ error: 'ID de imagen inválido' });
      }

      // Obtener información de la imagen antes de eliminarla
      const [imageToDelete] = await db
        .select()
        .from(assetImages)
        .where(eq(assetImages.id, imageId))
        .limit(1);

      if (!imageToDelete) {
        return res.status(404).json({ error: 'Imagen no encontrada' });
      }

      // Eliminar el archivo físico
      const filePath = path.join(process.cwd(), 'public', imageToDelete.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Eliminar el registro de la base de datos
      await db
        .delete(assetImages)
        .where(eq(assetImages.id, imageId));

      res.json({ message: 'Imagen eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Establecer imagen como principal
  apiRouter.post('/asset-images/:id/set-primary', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const imageId = parseInt(req.params.id);
      
      if (isNaN(imageId)) {
        return res.status(400).json({ error: 'ID de imagen inválido' });
      }

      // Obtener la imagen
      const [image] = await db
        .select()
        .from(assetImages)
        .where(eq(assetImages.id, imageId))
        .limit(1);

      if (!image) {
        return res.status(404).json({ error: 'Imagen no encontrada' });
      }

      // Quitar la marca principal de todas las imágenes del activo
      await db
        .update(assetImages)
        .set({ 
          isPrimary: false,
          updatedAt: new Date()
        })
        .where(eq(assetImages.assetId, image.assetId));

      // Establecer esta imagen como principal
      const [updatedImage] = await db
        .update(assetImages)
        .set({
          isPrimary: true,
          updatedAt: new Date()
        })
        .where(eq(assetImages.id, imageId))
        .returning();

      res.json(updatedImage);
    } catch (error) {
      console.error('Error al establecer imagen principal:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
}