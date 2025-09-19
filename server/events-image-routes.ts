import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { eventImages, events } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { replitObjectStorage } from "./objectStorage-replit";

const router = Router();

// Configure multer specifically for event images with Replit Object Storage
const eventImageUpload = multer({
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

// Upload genérico para eventos (cuando aún no existe eventId - caso creación)
router.post("/upload-event-image", eventImageUpload.single('image'), async (req: Request, res: Response) => {
  try {
    console.log('📤 [EVENT-GENERIC] Iniciando upload genérico de imagen de evento');
    
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó archivo de imagen" });
    }

    console.log(`📤 [EVENT-GENERIC] Procesando archivo: ${req.file.originalname}`);
    
    let imageUrl: string;
    
    try {
      // 1. INTENTAR REPLIT OBJECT STORAGE (persistente)
      console.log('📤 [EVENT-GENERIC] Intentando Replit Object Storage...');
      imageUrl = await replitObjectStorage.uploadFile(req.file.buffer, req.file.originalname);
      imageUrl = replitObjectStorage.getPublicUrl(imageUrl);
      console.log('✅ [EVENT-GENERIC] Object Storage exitoso:', imageUrl);
      
    } catch (objectStorageError) {
      console.log('⚠️ [EVENT-GENERIC] Object Storage falló, usando filesystem...', objectStorageError);
      
      // 2. FALLBACK A FILESYSTEM (carpeta persistente)
      const uploadDir = path.join(process.cwd(), 'uploads', 'event-images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `event-generic-${uniqueSuffix}${path.extname(req.file.originalname)}`;
      const filePath = path.join(uploadDir, filename);
      
      fs.writeFileSync(filePath, req.file.buffer);
      imageUrl = `/uploads/event-images/${filename}`;
      console.log('✅ [EVENT-GENERIC] Filesystem usado:', imageUrl);
    }
    
    console.log(`✅ [EVENT-GENERIC] Upload completado: ${imageUrl}`);
    
    res.status(200).json({
      imageUrl: replitObjectStorage.normalizeUrl(imageUrl),
      url: replitObjectStorage.normalizeUrl(imageUrl), // Compatibilidad 
      method: imageUrl.includes('/api/storage/file/') ? 'object-storage' : 'filesystem'
    });
  } catch (error) {
    console.error("❌ [EVENT-GENERIC] Error al subir imagen genérica:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener todas las imágenes de un evento
router.get("/:eventId/images", async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "ID de evento inválido" });
    }
    
    // Verificar que el evento existe
    const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (event.length === 0) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }
    
    const images = await db
      .select()
      .from(eventImages)
      .where(eq(eventImages.eventId, eventId))
      .orderBy(desc(eventImages.isPrimary), desc(eventImages.createdAt));
    
    res.json(images);
  } catch (error) {
    console.error("Error al obtener imágenes de evento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Subir una nueva imagen a un evento (SISTEMA HÍBRIDO - igual que actividades)
router.post("/:eventId/images", eventImageUpload.single('imageFile'), async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "ID de evento inválido" });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó archivo de imagen" });
    }
    
    console.log(`📤 [EVENT-HÍBRIDO] Iniciando upload para evento ${eventId}: ${req.file.originalname}`);
    
    // Verificar que el evento existe
    const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (event.length === 0) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }
    
    const { caption } = req.body;
    const isPrimary = req.body.isPrimary === 'true';
    
    let imageUrl: string;
    
    try {
      // 1. INTENTAR REPLIT OBJECT STORAGE (persistente)
      console.log('📤 [EVENT-HÍBRIDO] Intentando Replit Object Storage...');
      imageUrl = await replitObjectStorage.uploadFile(req.file.buffer, req.file.originalname);
      imageUrl = replitObjectStorage.getPublicUrl(imageUrl);
      console.log('✅ [EVENT-HÍBRIDO] Object Storage exitoso:', imageUrl);
      
    } catch (objectStorageError) {
      console.log('⚠️ [EVENT-HÍBRIDO] Object Storage falló, usando filesystem...', objectStorageError);
      
      // 2. FALLBACK A FILESYSTEM (carpeta persistente)
      const uploadDir = path.join(process.cwd(), 'uploads', 'event-images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `event-images-${uniqueSuffix}${path.extname(req.file.originalname)}`;
      const filePath = path.join(uploadDir, filename);
      
      fs.writeFileSync(filePath, req.file.buffer);
      imageUrl = `/uploads/event-images/${filename}`;
      console.log('✅ [EVENT-HÍBRIDO] Filesystem usado:', imageUrl);
    }
    
    // Si esta imagen va a ser principal, quitar el flag de las demás
    if (isPrimary) {
      await db
        .update(eventImages)
        .set({ isPrimary: false })
        .where(eq(eventImages.eventId, eventId));
    }
    
    const newImage = await db
      .insert(eventImages)
      .values({
        eventId,
        imageUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        caption: caption || null,
        isPrimary,
        uploadedById: 1 // TODO: Obtener del contexto de usuario
      })
      .returning();
    
    console.log(`✅ [EVENT-HÍBRIDO] Imagen guardada en DB para evento ${eventId}: ${imageUrl}`);
    
    res.status(201).json({
      ...newImage[0],
      imageUrl: replitObjectStorage.normalizeUrl(newImage[0].imageUrl)
    });
  } catch (error) {
    console.error("❌ [EVENT-HÍBRIDO] Error al subir imagen de evento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar una imagen de evento
router.delete("/:eventId/images/:imageId", async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const imageId = parseInt(req.params.imageId);
    
    if (isNaN(eventId) || isNaN(imageId)) {
      return res.status(400).json({ error: "IDs inválidos" });
    }
    
    // Buscar la imagen
    const image = await db
      .select()
      .from(eventImages)
      .where(and(eq(eventImages.id, imageId), eq(eventImages.eventId, eventId)))
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
        console.log('🗑️ [EVENT-HÍBRIDO] Archivo eliminado de Object Storage');
      } catch (error) {
        console.error('⚠️ [EVENT-HÍBRIDO] Error eliminando de Object Storage:', error);
      }
    } else if (imageUrl.startsWith('/uploads/')) {
      // Es filesystem local
      const filePath = path.join(process.cwd(), imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ [EVENT-HÍBRIDO] Archivo eliminado de filesystem');
      }
    }
    
    // Eliminar de la base de datos
    await db
      .delete(eventImages)
      .where(and(eq(eventImages.id, imageId), eq(eventImages.eventId, eventId)));
    
    console.log(`🗑️ [EVENT-HÍBRIDO] Imagen eliminada de la DB para evento ${eventId}`);
    
    res.json({ message: "Imagen eliminada exitosamente" });
  } catch (error) {
    console.error("❌ [EVENT-HÍBRIDO] Error al eliminar imagen de evento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Establecer una imagen como principal
router.patch("/:eventId/images/:imageId/set-primary", async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const imageId = parseInt(req.params.imageId);
    
    if (isNaN(eventId) || isNaN(imageId)) {
      return res.status(400).json({ error: "IDs inválidos" });
    }
    
    // Verificar que la imagen existe y pertenece al evento
    const image = await db
      .select()
      .from(eventImages)
      .where(and(eq(eventImages.id, imageId), eq(eventImages.eventId, eventId)))
      .limit(1);
    
    if (image.length === 0) {
      return res.status(404).json({ error: "Imagen no encontrada" });
    }
    
    // Quitar el flag de principal de todas las demás imágenes del evento
    await db
      .update(eventImages)
      .set({ isPrimary: false })
      .where(eq(eventImages.eventId, eventId));
    
    // Establecer esta imagen como principal
    await db
      .update(eventImages)
      .set({ isPrimary: true })
      .where(and(eq(eventImages.id, imageId), eq(eventImages.eventId, eventId)));
    
    console.log(`✅ [EVENT-HÍBRIDO] Imagen ${imageId} establecida como principal para evento ${eventId}`);
    
    res.json({ message: "Imagen establecida como principal exitosamente" });
  } catch (error) {
    console.error("❌ [EVENT-HÍBRIDO] Error al establecer imagen principal:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export { router as eventImageRouter };