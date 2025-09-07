import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { activityImages, activities } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { replitObjectStorage } from "./objectStorage-replit";

const router = Router();

// Configure multer specifically for activity images with Replit Object Storage
const activityImageUpload = multer({
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
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Obtener todas las imágenes de una actividad
router.get("/:activityId/images", async (req: Request, res: Response) => {
  try {
    const activityId = parseInt(req.params.activityId);
    
    if (isNaN(activityId)) {
      return res.status(400).json({ error: "ID de actividad inválido" });
    }
    
    // Verificar que la actividad existe
    const activity = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    if (activity.length === 0) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }
    
    const images = await db
      .select()
      .from(activityImages)
      .where(eq(activityImages.activityId, activityId))
      .orderBy(desc(activityImages.isPrimary), desc(activityImages.createdAt));
    
    res.json(images);
  } catch (error) {
    console.error("Error al obtener imágenes de actividad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Subir una nueva imagen a una actividad (SISTEMA HÍBRIDO - igual que parques)
router.post("/:activityId/images", activityImageUpload.single('imageFile'), async (req: Request, res: Response) => {
  try {
    const activityId = parseInt(req.params.activityId);
    
    if (isNaN(activityId)) {
      return res.status(400).json({ error: "ID de actividad inválido" });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó archivo de imagen" });
    }
    
    console.log(`📤 [ACTIVITY-HÍBRIDO] Iniciando upload para actividad ${activityId}: ${req.file.originalname}`);
    
    // Verificar que la actividad existe
    const activity = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    if (activity.length === 0) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }
    
    const { caption } = req.body;
    const isPrimary = req.body.isPrimary === 'true';
    
    let imageUrl: string;
    
    try {
      // 1. INTENTAR REPLIT OBJECT STORAGE (persistente)
      console.log('📤 [ACTIVITY-HÍBRIDO] Intentando Replit Object Storage...');
      imageUrl = await replitObjectStorage.uploadFile(req.file.buffer, req.file.originalname);
      imageUrl = replitObjectStorage.getPublicUrl(imageUrl);
      console.log('✅ [ACTIVITY-HÍBRIDO] Object Storage exitoso:', imageUrl);
      
    } catch (objectStorageError) {
      console.log('⚠️ [ACTIVITY-HÍBRIDO] Object Storage falló, usando filesystem...', objectStorageError);
      
      // 2. FALLBACK A FILESYSTEM (carpeta persistente)
      const uploadDir = path.join(process.cwd(), 'uploads', 'activity-images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `activity-img-${uniqueSuffix}${path.extname(req.file.originalname)}`;
      const filePath = path.join(uploadDir, filename);
      
      fs.writeFileSync(filePath, req.file.buffer);
      imageUrl = `/uploads/activity-images/${filename}`;
      console.log('✅ [ACTIVITY-HÍBRIDO] Filesystem usado:', imageUrl);
    }
    
    // Si esta imagen va a ser principal, quitar el flag de las demás
    if (isPrimary) {
      await db
        .update(activityImages)
        .set({ isPrimary: false })
        .where(eq(activityImages.activityId, activityId));
    }
    
    const newImage = await db
      .insert(activityImages)
      .values({
        activityId,
        imageUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        caption: caption || null,
        isPrimary,
        uploadedById: 1 // TODO: Obtener del contexto de usuario
      })
      .returning();
    
    console.log(`✅ [ACTIVITY-HÍBRIDO] Imagen guardada en DB para actividad ${activityId}: ${imageUrl}`);
    
    res.status(201).json(newImage[0]);
  } catch (error) {
    console.error("❌ [ACTIVITY-HÍBRIDO] Error al subir imagen de actividad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar una imagen de actividad
router.delete("/:activityId/images/:imageId", async (req: Request, res: Response) => {
  try {
    const activityId = parseInt(req.params.activityId);
    const imageId = parseInt(req.params.imageId);
    
    if (isNaN(activityId) || isNaN(imageId)) {
      return res.status(400).json({ error: "IDs inválidos" });
    }
    
    // Buscar la imagen
    const image = await db
      .select()
      .from(activityImages)
      .where(and(eq(activityImages.id, imageId), eq(activityImages.activityId, activityId)))
      .limit(1);
    
    if (image.length === 0) {
      return res.status(404).json({ error: "Imagen no encontrada" });
    }
    
    // Eliminar archivo físico (sistema híbrido)
    const imageUrl = image[0].imageUrl;
    
    if (imageUrl.startsWith('/api/storage/file/')) {
      // Es Replit Object Storage - intentar eliminar
      try {
        const filename = imageUrl.replace('/api/storage/file/', '');
        await replitObjectStorage.deleteFile(decodeURIComponent(filename));
        console.log('🗑️ [ACTIVITY-HÍBRIDO] Archivo eliminado de Object Storage');
      } catch (error) {
        console.error('⚠️ [ACTIVITY-HÍBRIDO] Error eliminando de Object Storage:', error);
      }
    } else if (imageUrl.startsWith('/uploads/')) {
      // Es filesystem local
      const filePath = path.join(process.cwd(), imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ [ACTIVITY-HÍBRIDO] Archivo eliminado de filesystem');
      }
    }
    
    // Eliminar registro de la base de datos
    await db
      .delete(activityImages)
      .where(and(eq(activityImages.id, imageId), eq(activityImages.activityId, activityId)));
    
    res.json({ message: "Imagen eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar imagen de actividad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar información de una imagen (caption, isPrimary)
router.put("/:activityId/images/:imageId", async (req: Request, res: Response) => {
  try {
    const activityId = parseInt(req.params.activityId);
    const imageId = parseInt(req.params.imageId);
    
    if (isNaN(activityId) || isNaN(imageId)) {
      return res.status(400).json({ error: "IDs inválidos" });
    }
    
    const { caption, isPrimary } = req.body;
    
    // Verificar que la imagen existe y pertenece a la actividad
    const existingImage = await db
      .select()
      .from(activityImages)
      .where(and(eq(activityImages.id, imageId), eq(activityImages.activityId, activityId)))
      .limit(1);
    
    if (existingImage.length === 0) {
      return res.status(404).json({ error: "Imagen no encontrada" });
    }
    
    // Si va a ser imagen principal, quitar el flag de las demás
    if (isPrimary === true) {
      await db
        .update(activityImages)
        .set({ isPrimary: false })
        .where(eq(activityImages.activityId, activityId));
    }
    
    // Actualizar la imagen
    const updatedImage = await db
      .update(activityImages)
      .set({
        caption: caption !== undefined ? caption : existingImage[0].caption,
        isPrimary: isPrimary !== undefined ? isPrimary : existingImage[0].isPrimary,
        updatedAt: new Date()
      })
      .where(and(eq(activityImages.id, imageId), eq(activityImages.activityId, activityId)))
      .returning();
    
    res.json(updatedImage[0]);
  } catch (error) {
    console.error("Error al actualizar imagen de actividad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener imagen principal de una actividad
router.get("/:activityId/main-image", async (req: Request, res: Response) => {
  try {
    const activityId = parseInt(req.params.activityId);
    
    if (isNaN(activityId)) {
      return res.status(400).json({ error: "ID de actividad inválido" });
    }
    
    const mainImage = await db
      .select()
      .from(activityImages)
      .where(and(eq(activityImages.activityId, activityId), eq(activityImages.isPrimary, true)))
      .limit(1);
    
    if (mainImage.length === 0) {
      // Si no hay imagen principal, devolver la primera imagen
      const firstImage = await db
        .select()
        .from(activityImages)
        .where(eq(activityImages.activityId, activityId))
        .orderBy(desc(activityImages.createdAt))
        .limit(1);
        
      return res.json(firstImage[0] || null);
    }
    
    res.json(mainImage[0]);
  } catch (error) {
    console.error("Error al obtener imagen principal de actividad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;