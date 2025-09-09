import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { activities } from "@shared/schema";
import { eq } from "drizzle-orm";
import { replitObjectStorage } from './objectStorage-replit';

const router = Router();

// Configuración de multer para imágenes de actividades (SISTEMA SIMPLE)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'activity-images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `activity-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// ENDPOINT SIMPLE: Subir imagen directamente a actividad
router.post("/:activityId/image", upload.single('image'), async (req: Request, res: Response) => {
  try {
    const activityId = parseInt(req.params.activityId);
    
    if (isNaN(activityId)) {
      return res.status(400).json({ error: "ID de actividad inválido" });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó archivo de imagen" });
    }
    
    console.log(`🔄 [ACTIVITY-IMG] Procesando imagen para actividad ${activityId}: ${req.file.filename}`);
    
    // Verificar que la actividad existe
    const activity = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    if (activity.length === 0) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }
    
    // VERIFICAR que el archivo se guardó físicamente 
    const fullPath = path.join(process.cwd(), 'uploads', 'activity-images', req.file.filename);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ [ACTIVITY-IMG] Archivo no encontrado después de multer: ${fullPath}`);
      return res.status(500).json({ error: "Error al guardar archivo físicamente" });
    }
    
    console.log(`✅ [ACTIVITY-IMG] Archivo físico verificado: ${fullPath}`);
    
    // COPIA DE SEGURIDAD: También copiar a public/uploads/activity-images/
    const publicPath = path.join(process.cwd(), 'public', 'uploads', 'activity-images');
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }
    const publicFullPath = path.join(publicPath, req.file.filename);
    fs.copyFileSync(fullPath, publicFullPath);
    console.log(`✅ [ACTIVITY-IMG] Copia de seguridad creada: ${publicFullPath}`);
    
    // Actualizar directamente el campo image_url de la actividad (SISTEMA SIMPLE)
    const imageUrl = `/uploads/activity-images/${req.file.filename}`;
    
    const updatedActivity = await db
      .update(activities)
      .set({ imageUrl })
      .where(eq(activities.id, activityId))
      .returning();
    
    console.log(`✅ [ACTIVITY-IMG] DB actualizada - Actividad ${activityId}: ${imageUrl}`);
    
    // 🎯 NORMALIZAR URLs de imágenes antes de enviar al cliente
    const activityWithNormalizedImages = {
      ...updatedActivity[0],
      imageUrl: updatedActivity[0].imageUrl ? replitObjectStorage.normalizeUrl(updatedActivity[0].imageUrl) : updatedActivity[0].imageUrl
    };

    res.json({
      success: true,
      activity: activityWithNormalizedImages,
      imageUrl: imageUrl ? replitObjectStorage.normalizeUrl(imageUrl) : imageUrl,
      fileInfo: {
        filename: req.file.filename,
        size: req.file.size,
        path: fullPath,
        verified: true
      }
    });
    
  } catch (error) {
    console.error("❌ [ACTIVITY-IMG] Error al subir imagen de actividad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ENDPOINT SIMPLE: Eliminar imagen de actividad
router.delete("/:activityId/image", async (req: Request, res: Response) => {
  try {
    const activityId = parseInt(req.params.activityId);
    
    if (isNaN(activityId)) {
      return res.status(400).json({ error: "ID de actividad inválido" });
    }
    
    // Obtener la actividad para encontrar la imagen actual
    const activity = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    if (activity.length === 0) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }
    
    const currentImageUrl = activity[0].imageUrl;
    
    // Actualizar la base de datos para remover la imagen
    await db
      .update(activities)
      .set({ imageUrl: null })
      .where(eq(activities.id, activityId));
    
    // Intentar eliminar el archivo físico si es local
    if (currentImageUrl && currentImageUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', currentImageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Archivo eliminado: ${filePath}`);
      }
    }
    
    console.log(`✅ Imagen eliminada de actividad ${activityId}`);
    
    res.json({
      success: true,
      message: "Imagen eliminada correctamente"
    });
    
  } catch (error) {
    console.error("Error al eliminar imagen de actividad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;