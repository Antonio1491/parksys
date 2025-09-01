/**
 * SISTEMA DE OBJECT STORAGE PARA PARKSYS
 * =====================================
 * 
 * Migración completa de uploads de filesystem a Object Storage de Replit
 * Mantiene compatibilidad con el sistema existente
 */

import { Router, Request, Response } from 'express';
import { ObjectStorageService } from './objectStorage';
import { storage } from './storage';
import path from 'path';
import { randomUUID } from 'crypto';

const objectStorage = new ObjectStorageService();

export function registerObjectStorageRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  
  // =============================================
  // PARK IMAGES - OBJECT STORAGE
  // =============================================

  // Upload park image to Object Storage
  apiRouter.post('/parks/:parkId/images/upload-os', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.parkId);
      console.log(`🚀 [OBJECT STORAGE] Iniciando upload de imagen para parque ${parkId}`);
      
      // Verify park exists
      const park = await storage.getPark(parkId);
      if (!park) {
        return res.status(404).json({ error: 'Parque no encontrado' });
      }

      // Generate unique filename for Object Storage
      const timestamp = Date.now();
      const randomId = Math.floor(Math.random() * 1000000);
      const imageId = randomUUID();
      const filename = `park-img-${timestamp}-${randomId}-${imageId}`;
      
      // Get upload URL from Object Storage
      const uploadUrl = await objectStorage.getObjectEntityUploadURL();
      
      console.log(`📤 [OBJECT STORAGE] URL de upload generada para parque ${parkId}`);
      
      res.json({
        uploadUrl,
        imageId,
        filename,
        parkId
      });
      
    } catch (error) {
      console.error('❌ [OBJECT STORAGE] Error generando URL de upload:', error);
      res.status(500).json({ error: 'Error generando URL de upload' });
    }
  });

  // Confirm park image upload and save to database
  apiRouter.post('/parks/:parkId/images/confirm-os', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.parkId);
      const { imageId, filename, caption, isPrimary, uploadUrl } = req.body;
      
      console.log(`✅ [OBJECT STORAGE] Confirmando upload de imagen para parque ${parkId}:`, {
        imageId,
        filename,
        caption,
        isPrimary
      });
      
      // Normalize the object path for storage
      const normalizedPath = objectStorage.normalizeObjectEntityPath(uploadUrl);
      
      // Set ACL policy for public access (since these are park images)
      const finalImageUrl = await objectStorage.trySetObjectEntityAclPolicy(normalizedPath, {
        visibility: 'public',
        owner: req.user?.id || 'system'
      });
      
      // If setting as primary, unmark other images
      if (isPrimary === 'true' || isPrimary === true) {
        const existingImages = await storage.getParkImages(parkId);
        for (const image of existingImages) {
          if (image.isPrimary) {
            await storage.updateParkImage(image.id, { isPrimary: false });
          }
        }
        console.log(`⭐ [OBJECT STORAGE] Desmarcando otras imágenes principales del parque ${parkId}`);
      }
      
      // Create new park image record
      const imageData = {
        parkId,
        imageUrl: finalImageUrl,
        caption: caption || null,
        isPrimary: Boolean(isPrimary === 'true' || isPrimary === true)
      };
      
      const newImage = await storage.createParkImage(imageData);
      
      console.log(`📸 [OBJECT STORAGE] Nueva imagen guardada para parque ${parkId}:`, newImage);
      
      // Return mapped response for frontend compatibility
      const mappedImage = {
        id: newImage.id,
        parkId: newImage.parkId,
        imageUrl: newImage.imageUrl,
        caption: newImage.caption,
        isPrimary: newImage.isPrimary,
        createdAt: newImage.createdAt
      };
      
      res.status(201).json(mappedImage);
      
    } catch (error) {
      console.error('❌ [OBJECT STORAGE] Error confirmando upload de imagen:', error);
      res.status(500).json({ error: 'Error confirmando upload de imagen: ' + (error as Error).message });
    }
  });

  // =============================================
  // ACTIVITY IMAGES - OBJECT STORAGE  
  // =============================================

  // Upload activity image to Object Storage
  apiRouter.post('/activities/:activityId/images/upload-os', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const activityId = parseInt(req.params.activityId);
      console.log(`🚀 [OBJECT STORAGE] Iniciando upload de imagen para actividad ${activityId}`);
      
      // Generate unique filename for Object Storage
      const timestamp = Date.now();
      const randomId = Math.floor(Math.random() * 1000000);
      const imageId = randomUUID();
      const filename = `activity-img-${timestamp}-${randomId}-${imageId}`;
      
      // Get upload URL from Object Storage
      const uploadUrl = await objectStorage.getObjectEntityUploadURL();
      
      console.log(`📤 [OBJECT STORAGE] URL de upload generada para actividad ${activityId}`);
      
      res.json({
        uploadUrl,
        imageId,
        filename,
        activityId
      });
      
    } catch (error) {
      console.error('❌ [OBJECT STORAGE] Error generando URL de upload para actividad:', error);
      res.status(500).json({ error: 'Error generando URL de upload' });
    }
  });

  // Confirm activity image upload
  apiRouter.post('/activities/:activityId/images/confirm-os', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const activityId = parseInt(req.params.activityId);
      const { imageId, filename, uploadUrl } = req.body;
      
      console.log(`✅ [OBJECT STORAGE] Confirmando upload de imagen para actividad ${activityId}`);
      
      // Normalize the object path for storage
      const normalizedPath = objectStorage.normalizeObjectEntityPath(uploadUrl);
      
      // Set ACL policy for public access
      const finalImageUrl = await objectStorage.trySetObjectEntityAclPolicy(normalizedPath, {
        visibility: 'public',
        owner: req.user?.id || 'system'
      });
      
      console.log(`📸 [OBJECT STORAGE] Imagen de actividad ${activityId} disponible en: ${finalImageUrl}`);
      
      res.json({
        imageUrl: finalImageUrl,
        success: true
      });
      
    } catch (error) {
      console.error('❌ [OBJECT STORAGE] Error confirmando upload de imagen de actividad:', error);
      res.status(500).json({ error: 'Error confirmando upload de imagen: ' + (error as Error).message });
    }
  });

  // =============================================
  // EVENT IMAGES - OBJECT STORAGE
  // =============================================

  // Upload event image to Object Storage
  apiRouter.post('/events/:eventId/images/upload-os', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      console.log(`🚀 [OBJECT STORAGE] Iniciando upload de imagen para evento ${eventId}`);
      
      // Generate unique filename for Object Storage
      const timestamp = Date.now();
      const randomId = Math.floor(Math.random() * 1000000);
      const imageId = randomUUID();
      const filename = `event-img-${timestamp}-${randomId}-${imageId}`;
      
      // Get upload URL from Object Storage
      const uploadUrl = await objectStorage.getObjectEntityUploadURL();
      
      console.log(`📤 [OBJECT STORAGE] URL de upload generada para evento ${eventId}`);
      
      res.json({
        uploadUrl,
        imageId,
        filename,
        eventId
      });
      
    } catch (error) {
      console.error('❌ [OBJECT STORAGE] Error generando URL de upload para evento:', error);
      res.status(500).json({ error: 'Error generando URL de upload' });
    }
  });

  // Confirm event image upload
  apiRouter.post('/events/:eventId/images/confirm-os', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const { imageId, filename, uploadUrl } = req.body;
      
      console.log(`✅ [OBJECT STORAGE] Confirmando upload de imagen para evento ${eventId}`);
      
      // Normalize the object path for storage
      const normalizedPath = objectStorage.normalizeObjectEntityPath(uploadUrl);
      
      // Set ACL policy for public access
      const finalImageUrl = await objectStorage.trySetObjectEntityAclPolicy(normalizedPath, {
        visibility: 'public',
        owner: req.user?.id || 'system'
      });
      
      console.log(`📸 [OBJECT STORAGE] Imagen de evento ${eventId} disponible en: ${finalImageUrl}`);
      
      res.json({
        imageUrl: finalImageUrl,
        success: true
      });
      
    } catch (error) {
      console.error('❌ [OBJECT STORAGE] Error confirmando upload de imagen de evento:', error);
      res.status(500).json({ error: 'Error confirmando upload de imagen: ' + (error as Error).message });
    }
  });

  // =============================================
  // GENERIC OBJECT STORAGE UTILITIES
  // =============================================

  // Generic upload URL generator
  apiRouter.post('/object-storage/upload-url', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { category, entityId } = req.body;
      
      console.log(`🚀 [OBJECT STORAGE] Generando URL genérica para categoría: ${category}, entidad: ${entityId}`);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.floor(Math.random() * 1000000);
      const uploadId = randomUUID();
      const filename = `${category}-${entityId || 'generic'}-${timestamp}-${randomId}-${uploadId}`;
      
      // Get upload URL from Object Storage
      const uploadUrl = await objectStorage.getObjectEntityUploadURL();
      
      res.json({
        uploadUrl,
        uploadId,
        filename,
        category,
        entityId
      });
      
    } catch (error) {
      console.error('❌ [OBJECT STORAGE] Error generando URL genérica:', error);
      res.status(500).json({ error: 'Error generando URL de upload' });
    }
  });

  // Object Storage health check
  apiRouter.get('/object-storage/health', async (req: Request, res: Response) => {
    try {
      const publicPaths = objectStorage.getPublicObjectSearchPaths();
      const privateDir = objectStorage.getPrivateObjectDir();
      
      res.json({
        status: 'healthy',
        config: {
          publicPaths,
          privateDir,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ [OBJECT STORAGE] Health check failed:', error);
      res.status(500).json({ 
        status: 'unhealthy', 
        error: (error as Error).message 
      });
    }
  });

  console.log('✅ [OBJECT STORAGE] Rutas de Object Storage registradas correctamente');
}