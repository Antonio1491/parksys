import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { activityImages, activities } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// Configuración de multer para imágenes de actividades
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Configuración dinámica basada en el entorno
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    const uploadDir = isProduction ? 'public/uploads/activity-images' : 'uploads/activity-images';
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'activity-img-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    
    if (mimeType && extName) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB límite
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

// Subir una nueva imagen a una actividad
router.post("/:activityId/images", upload.single('image'), async (req: Request, res: Response) => {
  try {
    const activityId = parseInt(req.params.activityId);
    
    if (isNaN(activityId)) {
      return res.status(400).json({ error: "ID de actividad inválido" });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó archivo de imagen" });
    }
    
    // Verificar que la actividad existe
    const activity = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    if (activity.length === 0) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }
    
    const { caption } = req.body;
    const isPrimary = req.body.isPrimary === 'true';
    
    // Si esta imagen va a ser principal, quitar el flag de las demás
    if (isPrimary) {
      await db
        .update(activityImages)
        .set({ isPrimary: false })
        .where(eq(activityImages.activityId, activityId));
    }
    
    // ✅ SIMPLE: Direct URL like fauna/instructors/parks
    const imageUrl = `/uploads/activity-images/${req.file.filename}`;
    console.log(`✅ [ACTIVITY-IMAGE] Image processed:`, { imageUrl, caption, isPrimary });

    const newImage = await db
      .insert(activityImages)
      .values({
        activityId,
        imageUrl: imageUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        caption: caption || null,
        isPrimary,
        uploadedById: 1 // TODO: Obtener del contexto de usuario
      })
      .returning();
    
    res.status(201).json(newImage[0]);
  } catch (error) {
    console.error("Error al subir imagen de actividad:", error);
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
    
    // Eliminar archivo físico
    const filePath = path.join(process.cwd(), 'uploads/activity-images', path.basename(image[0].imageUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
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