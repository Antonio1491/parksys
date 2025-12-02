import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requirePermission } from './middleware/requirePermission';
import { isAuthenticated, hasMunicipalityAccess, hasParkAccess, requireAdmin } from "./middleware/auth";
import { handleProfileImageUpload } from "./api/profileImageUpload";
import { saveProfileImage, getProfileImage } from "./profileImageCache";
import { db, pool } from "./db";
import { sql, eq, and, desc } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { deleteAllVolunteers, deleteVolunteer } from "./delete-all-volunteers";
import * as schema from "@shared/schema";
const { 
  parkAmenities, amenities, insertParkSchema, 
  incidents, assets, assetMaintenances, parkEvaluations, 
  activities, events, parks
} = schema;
import { videoRouter } from "./video_routes";
import { registerParkRoutes } from './routes/parks.routes';
import { registerVolunteerRoutes } from "./volunteerRoutes";
import { registerInstructorRoutes } from "./instructor-routes";
import { registerPublicRoutes } from "./publicRoutes";
import { registerAssetRoutes } from "./asset_routes";
import { registerAssetImageRoutes } from "./asset-image-routes";
import { registerAssetCategoriesRoutes } from "./asset-categories-routes";
import { registerWarehouseRoutes } from "./warehouse-routes";
import activityImageRouter from "./activity-image-routes";
import { registerMaintenanceRoutes } from "./maintenance_routes_fixed";
import { registerAssetAssignmentRoutes } from "./asset_assignment_routes";
import { registerSpaceReservationRoutes } from "./space-reservations-routes";
import { registerReservableSpacesRoutes } from "./reservable-spaces-routes";
import { ObjectStorageService } from "./objectStorage";
import { replitObjectStorage } from "./objectStorage-replit";
import { registerObjectStorageRoutes } from "./objectStorageRoutes";
import { registerTreeRoutes } from "./tree_routes";
import { registerTreeMaintenanceRoutes } from "./tree_maintenance_routes";
import { registerTreeInventoryRoutes } from "./tree_inventory_routes";
import { registerTreeStatsRoutes } from "./tree_stats_routes";
import { registerTreeDetailsRoutes } from "./tree_details_route";
import { registerTreeInventoryGeneratorRoutes } from "./tree-inventory-generator-routes";
import parkAreasRoutes from "./routes/parkAreas";
import treeMaintenanceRoutes from "./routes/treeMaintenance";
import treeLinksRoutes from "./routes/treeLinks";
// import { activityRouter } from "./activityRoutes"; // REMOVIDO: Evitar conflicto con activitiesRoutes.ts
import directRouter from "./directRoutes";
import { registerConcessionRoutes } from "./concession-routes";
import { registerConcessionContractsRoutes } from "./concession-contracts-routes";
import { registerUsersConcessionairesRoutes } from "./users-concessionaires-routes";
import { registerConcessionairesSimpleRoutes } from "./concessionaires-simple";
import { registerConcessionLocationsRoutes } from "./concession-locations-routes";
import { registerConcessionPaymentsRoutes } from "./concession-payments-routes";
import { registerConcessionEvaluationRoutes } from "./concession-evaluations-routes";
import { registerActiveConcessionRoutes } from "./active-concessions-routes";
import { registerFinanceRoutes } from "./finance-routes";
import { registerBudgetRoutes } from "./budget-routes";
import { registerBudgetPlanningRoutes } from "./budget-planning-routes";
import { registerFinanceUpdateRoutes } from "./finance-update-routes";
import { registerAccountingRoutes } from "./accounting-routes";
import { registerSponsorshipRoutes } from "./sponsorship-routes";
import { 
  uploadParkFile, 
  handleMulterErrors, 
  generateImportTemplate, 
  processImportFile 
} from "./api/parksImport";
import { generateParkPrefix } from './code-generator';
import { registerUserRoutes } from "./userRoutes";
import { updateSkillsRouter } from "./updateSkills";
import { registerEventRoutes } from "./events_routes";
import { eventImageRouter } from "./events-image-routes";
import { registerActivityRoutes } from "./activitiesRoutes";
import advertisingRoutes from "./advertising-routes";
import activityRegistrationsRouter from "./routes/activity-registrations";
import eventRegistrationsRouter from "./routes/event-registrations";
import eventPaymentsRouter from "./routes/event-payments";
import paymentsRouter from "./routes/payments";
import { registerActivityPaymentRoutes } from "./routes/activityPayments";
import { registerSpacePaymentRoutes } from "./routes/space-payments";
import unifiedDiscountRouter from "./routes/unified-discounts";
import costingIntegrationRouter from "./routes/costing-integration";
import { registerActivityStatsRoutes } from "./routes/activity-stats";
import { uploadAdvertising, handleAdvertisingUpload } from "./api/advertising-upload";
import { 
  insertCommentSchema, insertIncidentSchema, 
  insertActivitySchema, insertDocumentSchema, insertParkImageSchema,
  insertParkAmenitySchema, insertVolunteerSchema, ExtendedPark, Park, Municipality, Amenity, Activity, volunteers
} from "@shared/schema";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { getParkByIdDirectly } from "./direct-park-queries";
import { registerRoleRoutes } from "./roleRoutes";
import { registerHybridRoleRoutes } from "./hybridRoleRoutes";
import feedbackRouter from "./feedback-routes";
import { registerEventCategoriesRoutes } from "./event-categories-routes";
import { seedEventCategories } from "./seed-event-categories";
import { registerInstructorEvaluationRoutes } from "./instructor-evaluations-routes";
import exportRoutes from "./routes/exports";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server first
  const httpServer = createServer(app);
  
  // API routes - all prefixed with /api
  const apiRouter = express.Router();
  
  // Public API routes - all prefixed with /public-api
  const publicRouter = express.Router();
  
  // Configure multer for file uploads
  const upload = multer({ storage: multer.memoryStorage() });

  // Configure multer specifically for park images with Replit Object Storage
  const parkImageUpload = multer({
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
  
  // Crear instancia de Neon SQL para las rutas administrativas
  const neonSql = neon(process.env.DATABASE_URL!);
  
  // Configure multer specifically for document uploads
  const documentUpload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
        const uploadsDir = isProduction ? 'public/uploads/documents/' : 'uploads/documents/';
        cb(null, uploadsDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.originalname.split('.').pop();
        cb(null, `doc-${uniqueSuffix}.${extension}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Formato de archivo no válido. Solo se permiten PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX y TXT'));
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  });
  
  // Configure multer specifically for icon uploads with disk storage
  const iconUpload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.originalname.split('.').pop();
        cb(null, `amenity-icon-${uniqueSuffix}.${extension}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Formato de archivo no válido. Solo se permiten PNG, JPG, JPEG y SVG'));
      }
    },
    limits: {
      fileSize: 2 * 1024 * 1024 // 2MB
    }
  });

  // Configure multer specifically for video uploads
  const videoUpload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
        const uploadsDir = isProduction ? 'public/uploads/videos/' : 'uploads/videos/';
        // Crear directorio si no existe
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.originalname.split('.').pop();
        cb(null, `video-${uniqueSuffix}.${extension}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo', // AVI
        'video/webm',
        'video/ogg'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan videos (MP4, MPEG, MOV, AVI, WebM, OGG).'));
      }
    },
    limits: {
      fileSize: 100 * 1024 * 1024 // 100MB limit for videos
    }
  });

  // Configure multer specifically for sponsor logo uploads
  const sponsorLogoUpload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/sponsor-logos/';
        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.originalname.split('.').pop();
        cb(null, `sponsor-logo-${uniqueSuffix}.${extension}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Formato de archivo no válido. Solo se permiten PNG y JPG'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  });

  // Template download routes (must be defined before conflicting routes)
  app.get('/api/template/parks-import', generateImportTemplate);
  
  // Ruta especial para videos
  app.post('/api/videos/update/:id', async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const { videoUrl } = req.body;
      
      if (videoUrl === undefined) {
        return res.status(400).json({ message: "videoUrl is required" });
      }
      
      // Verificamos que existe el parque
      const existingPark = await storage.getPark(parkId);
      if (!existingPark) {
        return res.status(404).json({ message: "Parque no encontrado" });
      }
      
      // Actualizamos directamente usando SQL parametrizado
      await pool.query('UPDATE parks SET video_url = $1 WHERE id = $2', [videoUrl, parkId]);
      
      res.json({ 
        success: true, 
        message: "Video URL updated successfully",
        videoUrl: videoUrl
      });
    } catch (error) {
      console.error("Error al actualizar video:", error);
      res.status(500).json({ 
        success: false,
        message: "Error updating video URL",
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Registramos las rutas de actividades (comentado - usar activitiesRoutes.ts)
  // apiRouter.use(activityRouter);
  
  // Registramos las rutas del módulo de voluntariado
  registerVolunteerRoutes(app, apiRouter, null, isAuthenticated);
  
  // Registramos las rutas del módulo de instructores
  registerInstructorRoutes(app, apiRouter, null, isAuthenticated);
  
  // Registramos las rutas del módulo de activos
  registerAssetRoutes(app, apiRouter, isAuthenticated); // RESTAURADO - rutas POST de mantenimientos están comentadas en asset_routes.ts
  registerMaintenanceRoutes(app, apiRouter, isAuthenticated); // DESCOMENTADO - usado maintenance_routes_fixed.ts
  registerAssetAssignmentRoutes(app, apiRouter, isAuthenticated);
  
  // Registramos las rutas del módulo de almacén
  registerWarehouseRoutes(app, apiRouter, isAuthenticated);
  registerSpaceReservationRoutes(app, apiRouter, isAuthenticated);
  registerReservableSpacesRoutes(app);
  registerSpacePaymentRoutes(app);
  
  // Unified discount validation routes
  app.use('/api/unified-discounts', unifiedDiscountRouter);
  
  // Costing integration routes
  app.use('/api/costing', costingIntegrationRouter);
  
  // Object Storage routes for images and files
  registerObjectStorageRoutes(app, apiRouter, isAuthenticated);

  // Object Storage routes for spaces multimedia (with authentication)
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      console.log("📤 [OBJECT-STORAGE] Getting upload URL for authenticated user");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log("📤 [OBJECT-STORAGE] Upload URL generated successfully");
      res.json({ uploadURL });
    } catch (error) {
      console.error("❌ [OBJECT-STORAGE] Error getting upload URL:", error);
      res.status(500).json({ error: "Error getting upload URL" });
    }
  });

  // Simplified upload URL route for multimedia
  app.post("/api/upload-url", async (req, res) => {
    try {
      console.log("📤 [UPLOAD-URL] Getting upload URL");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log("📤 [UPLOAD-URL] Upload URL generated successfully");
      res.json({ uploadURL });
    } catch (error) {
      console.error("❌ [UPLOAD-URL] Error getting upload URL:", error);
      res.status(500).json({ error: "Error getting upload URL" });
    }
  });
  registerAssetImageRoutes(app, apiRouter, isAuthenticated);
  
  // Registramos las rutas de categorías de activos
  registerAssetCategoriesRoutes(app, apiRouter);
  
  // Registramos las rutas del módulo de actividades
  registerActivityRoutes(app, apiRouter, isAuthenticated, hasParkAccess);
  
  // Registramos las rutas de imágenes de actividades
  apiRouter.use('/activities', activityImageRouter);
  
  // Ruta específica para el resumen de actividades (endpoint separado)
  apiRouter.get('/activities-summary-data', async (req: Request, res: Response) => {
    try {
      console.log('📊 Obteniendo resumen de actividades con estadísticas...');

      const activitiesSummary = await db.execute(`
        SELECT 
          a.id,
          a.title,
          a.description,
          a.category,
          a.start_date,
          a.end_date,
          a.start_time,
          a.location,
          a.capacity,
          a.price,
          a.is_free,
          a.registration_enabled,
          a.max_registrations,
          a.registration_deadline,
          p.name as park_name,
          COUNT(ar.id) as total_registrations,
          COUNT(CASE WHEN ar.status = 'approved' THEN 1 END) as approved_registrations,
          COUNT(CASE WHEN ar.status = 'pending' THEN 1 END) as pending_registrations,
          COUNT(CASE WHEN ar.status = 'rejected' THEN 1 END) as rejected_registrations,
          COALESCE(a.max_registrations, a.capacity, 0) as max_capacity,
          CASE 
            WHEN a.is_free = true THEN 0
            ELSE COUNT(CASE WHEN ar.status = 'approved' THEN 1 END) * COALESCE(a.price::numeric, 0)
          END as total_revenue,
          CASE 
            WHEN a.is_free = true THEN 0
            ELSE COUNT(ar.id) * COALESCE(a.price::numeric, 0)
          END as potential_revenue
        FROM activities a
        LEFT JOIN parks p ON a.park_id = p.id
        LEFT JOIN activity_registrations ar ON a.id = ar.activity_id
        GROUP BY a.id, a.title, a.description, a.category, a.start_date, a.end_date, 
                 a.start_time, a.location, a.capacity, a.price, a.is_free, 
                 a.registration_enabled, a.max_registrations, a.registration_deadline, p.name
        ORDER BY a.start_date DESC
      `);

      // Formatear los datos para el frontend
      const formattedSummary = activitiesSummary.rows.map((activity: any) => {
        const maxCapacity = activity.max_capacity || 0;
        const totalRegistrations = parseInt(activity.total_registrations) || 0;
        const availableSlots = Math.max(0, maxCapacity - totalRegistrations);

        return {
          id: activity.id,
          title: activity.title,
          description: activity.description,
          category: activity.category,
          parkName: activity.park_name,
          startDate: activity.start_date,
          endDate: activity.end_date,
          startTime: activity.start_time,
          location: activity.location,
          capacity: activity.capacity,
          price: activity.price,
          isFree: activity.is_free,
          registrationStats: {
            totalRegistrations: totalRegistrations,
            approved: parseInt(activity.approved_registrations) || 0,
            pending: parseInt(activity.pending_registrations) || 0,
            rejected: parseInt(activity.rejected_registrations) || 0,
            availableSlots: availableSlots
          },
          revenue: {
            totalRevenue: parseFloat(activity.total_revenue) || 0,
            potentialRevenue: parseFloat(activity.potential_revenue) || 0
          },
          registrationEnabled: activity.registration_enabled,
          maxRegistrations: activity.max_registrations,
          registrationDeadline: activity.registration_deadline
        };
      });

      console.log(`📊 Resumen de actividades procesado: ${formattedSummary.length} actividades`);
      res.json(formattedSummary);

    } catch (error) {
      console.error('Error al obtener resumen de actividades:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Registramos las rutas de inscripciones de actividades (DESPUÉS del endpoint específico)
  apiRouter.use('/activity-registrations', activityRegistrationsRouter);
  console.log('📝 Rutas de inscripciones de actividades registradas');
  
  // 🎯 PRIORIDAD MÁXIMA: Registramos las rutas principales de eventos PRIMERO
  console.log('🎯 [PRIORITY] Registering main event routes with MAXIMUM PRIORITY');
  registerEventRoutes(app, apiRouter, isAuthenticated);
  console.log('✅ [PRIORITY] Main event routes registered successfully');
  
  // ¡CRÍTICO! Registrar rutas de imágenes ANTES para evitar interceptación
  apiRouter.use('/events', eventImageRouter);
  console.log('📸 Rutas de imágenes de eventos registradas con MÁXIMA PRIORIDAD');
  
  // Registramos las rutas de inscripciones y pagos de eventos  
  apiRouter.use('/events', eventRegistrationsRouter);
  apiRouter.use('/events', eventPaymentsRouter);
  console.log('📝 Rutas de inscripciones y pagos de eventos registradas');

  // ===== RUTAS ADMINISTRATIVAS DE INSCRIPCIONES DE EVENTOS =====
  
  // GET /api/event-registrations - Lista todas las inscripciones con filtros (para admin)
  apiRouter.get('/event-registrations', async (req, res) => {
    try {
      const { 
        page = '1', 
        limit = '10', 
        search = '', 
        status = 'all', 
        event = 'all',
        startDate = '',
        endDate = ''
      } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      let whereConditions = [];
      let params: any[] = [];
      let paramIndex = 1;

      if (search) {
        whereConditions.push(`(er.full_name ILIKE $${paramIndex} OR er.email ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (status !== 'all') {
        whereConditions.push(`er.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (event !== 'all') {
        whereConditions.push(`er.event_id = $${paramIndex}`);
        params.push(parseInt(event as string));
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`e.start_date >= $${paramIndex}`);
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`e.start_date <= $${paramIndex}`);
        params.push(endDate);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          er.*,
          e.title as event_title,
          e.start_date as event_start_date,
          e.end_date as event_end_date,
          e.start_time as event_start_time,
          e.end_time as event_end_time,
          e.location as event_location,
          e.capacity as event_capacity,
          e.price as event_price,
          e.is_free as event_is_free,
          (SELECT COUNT(*) FROM event_registrations er2 WHERE er2.event_id = e.id) as event_current_registrations,
          (SELECT json_agg(json_build_object('name', p.name)) 
           FROM event_parks ep 
           JOIN parks p ON ep.park_id = p.id 
           WHERE ep.event_id = e.id) as event_parks
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        ${whereClause}
        ORDER BY er.registration_date DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(parseInt(limit as string), offset);

      // Usamos la instancia sql directa de Neon (ya definida arriba)
      
      const registrations = await neonSql(query, params);

      // Contar total de registros
      const countQuery = `
        SELECT COUNT(*) as total
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        ${whereClause}
      `;

      const countParams = params.slice(0, -2); // Remover limit y offset
      const countResult = await neonSql(countQuery, countParams);
      const total = parseInt(countResult[0].total);

      res.json({
        success: true,
        registrations: registrations.map(reg => ({
          id: reg.id,
          eventId: reg.event_id,
          fullName: reg.full_name,
          email: reg.email,
          phone: reg.phone,
          registrationDate: reg.registration_date,
          status: reg.status,
          notes: reg.notes,
          attendeeCount: reg.attendee_count || 1,
          paymentStatus: reg.payment_status,
          paymentAmount: reg.payment_amount,
          stripePaymentIntentId: reg.stripe_payment_intent_id,
          createdAt: reg.created_at,
          updatedAt: reg.updated_at,
          event: {
            id: reg.event_id,
            title: reg.event_title,
            startDate: reg.event_start_date,
            endDate: reg.event_end_date,
            startTime: reg.event_start_time,
            endTime: reg.event_end_time,
            location: reg.event_location,
            capacity: reg.event_capacity,
            currentRegistrations: reg.event_current_registrations,
            price: reg.event_price,
            isFree: reg.event_is_free,
            parks: reg.event_parks || []
          }
        })),
        total,
        page: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      });

    } catch (error) {
      console.error('Error obteniendo inscripciones:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  });

  // 
  
  // GET /api/events-summary - Resumen de todos los eventos con estadísticas (para admin)
  apiRouter.get('/events-summary', async (req, res) => {
    try {
      const query = `
        SELECT 
          e.*,
          COUNT(er.id) as total_registrations,
          COUNT(CASE WHEN er.status = 'registered' THEN 1 END) as registered_count,
          COUNT(CASE WHEN er.status = 'confirmed' THEN 1 END) as confirmed_count,
          COUNT(CASE WHEN er.status = 'cancelled' THEN 1 END) as cancelled_count,
          COUNT(CASE WHEN er.status = 'attended' THEN 1 END) as attended_count,
          COALESCE(SUM(CASE WHEN er.payment_status = 'paid' THEN er.payment_amount ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN er.payment_status = 'pending' THEN er.payment_amount ELSE 0 END), 0) as potential_revenue,
          (SELECT json_agg(json_build_object('name', p.name)) 
           FROM event_parks ep 
           JOIN parks p ON ep.park_id = p.id 
           WHERE ep.event_id = e.id) as parks
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id
        GROUP BY e.id
        ORDER BY e.start_date DESC
      `;

      // Usamos la instancia sql directa de Neon (ya definida arriba)
      
      const events = await neonSql(query);

      res.json({
        success: true,
        events: events.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          eventType: event.event_type,
          location: event.location,
          startDate: event.start_date,
          endDate: event.end_date,
          startTime: event.start_time,
          capacity: event.capacity,
          price: event.price,
          isFree: event.is_free,
          registrationType: event.registration_type,
          registrationStats: {
            totalRegistrations: parseInt(event.total_registrations) || 0,
            registered: parseInt(event.registered_count) || 0,
            confirmed: parseInt(event.confirmed_count) || 0,
            cancelled: parseInt(event.cancelled_count) || 0,
            attended: parseInt(event.attended_count) || 0,
            availableSlots: event.capacity ? 
              event.capacity - (parseInt(event.confirmed_count) || 0) : 
              null
          },
          revenue: {
            totalRevenue: parseFloat(event.total_revenue) || 0,
            potentialRevenue: parseFloat(event.potential_revenue) || 0
          },
          parks: event.parks || []
        })),
        total: events.length
      });

    } catch (error) {
      console.error('Error obteniendo resumen de eventos:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  });

  // PUT /api/event-registrations/:id/status - Actualizar estado de inscripción (admin)
  apiRouter.put('/event-registrations/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['registered', 'confirmed', 'cancelled', 'attended'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Estado inválido'
        });
      }

      // Usamos la instancia sql directa de Neon (ya definida arriba)
      
      const result = await neonSql`
        UPDATE event_registrations 
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Inscripción no encontrada'
        });
      }

      res.json({
        success: true,
        data: result[0]
      });

    } catch (error) {
      console.error('Error actualizando estado de inscripción:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  });

  // DELETE /api/event-registrations/:id - Eliminar inscripción (admin)
  apiRouter.delete('/event-registrations/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // Usamos la instancia sql directa de Neon (ya definida arriba)
      
      const result = await neonSql`
        DELETE FROM event_registrations 
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Inscripción no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Inscripción eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando inscripción:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  });
  
  // Registramos las rutas de pagos de actividades con Stripe
  registerActivityPaymentRoutes(app);
  console.log('💳 Rutas de pagos de actividades registradas');
  
  // ENDPOINT POST CRÍTICO - DEBE IR PRIMERO PARA EVITAR INTERCEPTACIÓN
  apiRouter.post("/trees/maintenances", async (req: Request, res: Response) => {
    try {
      console.log('🌳 POST /trees/maintenances - Creando mantenimiento (desde routes.ts):', req.body);
      
      const treeId = parseInt(req.body.treeId);
      
      if (!treeId || isNaN(treeId)) {
        return res.status(400).json({ error: "ID de árbol inválido" });
      }
      
      // Verificar que el árbol existe
      const treeExists = await db.select({ id: schema.trees.id }).from(schema.trees).where(eq(schema.trees.id, treeId));
      
      if (treeExists.length === 0) {
        return res.status(404).json({ error: "Árbol no encontrado" });
      }
      
      // Validación básica de campos requeridos
      if (!req.body.maintenanceType) {
        return res.status(400).json({ error: "El tipo de mantenimiento es requerido" });
      }
      
      if (!req.body.maintenanceDate) {
        return res.status(400).json({ error: "La fecha de mantenimiento es requerida" });
      }
      
      console.log('📋 Datos para inserción:', {
        tree_id: treeId,
        maintenance_type: req.body.maintenanceType,
        maintenance_date: req.body.maintenanceDate,
        performed_by: req.body.performedBy,
        description: req.body.notes || req.body.description,
        notes: req.body.notes,
        next_maintenance_date: req.body.nextMaintenanceDate || null
      });
      
      // Insertar el nuevo mantenimiento
      const [newMaintenance] = await db.insert(schema.treeMaintenances).values({
        tree_id: treeId,
        maintenance_type: req.body.maintenanceType,
        maintenance_date: req.body.maintenanceDate,
        performed_by: req.body.performedBy,
        description: req.body.notes || req.body.description,
        notes: req.body.notes,
        next_maintenance_date: req.body.nextMaintenanceDate || null
      }).returning();
      
      console.log('✅ Mantenimiento creado exitosamente (desde routes.ts):', newMaintenance);
      
      return res.status(201).json({
        success: true,
        message: "Mantenimiento registrado correctamente",
        data: newMaintenance
      });
      
    } catch (error) {
      console.error('❌ Error creating maintenance (desde routes.ts):', error);
      
      return res.status(500).json({ 
        error: "Error al crear mantenimiento",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Registramos las rutas del módulo de arbolado (orden específico para evitar conflictos)
  registerTreeMaintenanceRoutes(app, apiRouter, isAuthenticated); // Rutas específicas primero
  registerTreeRoutes(app, apiRouter, isAuthenticated);
  registerTreeInventoryRoutes(app, apiRouter, isAuthenticated);
  registerTreeInventoryGeneratorRoutes(app, apiRouter, isAuthenticated);
  
  console.log('🌳 Todas las rutas de árboles registradas');
  
  // Registramos las rutas de fauna
  const faunaRouter = await import('./faunaRoutes');
  apiRouter.use('/fauna', faunaRouter.default);
  console.log('🐾 Rutas de fauna registradas');
  
  // Añadimos endpoint específico para tree-species (búsqueda global)
  apiRouter.get('/tree-species', async (req: Request, res: Response) => {
    try {
      console.log('🌲 Tree species endpoint for search:', req.query);
      
      const result = await pool.query(`
        SELECT 
          id,
          common_name,
          scientific_name,
          family,
          characteristics,
          image_url
        FROM tree_species
        ORDER BY common_name ASC
        LIMIT 100
      `);
      
      console.log(`✅ Found ${result.rows.length} tree species for search`);
      
      res.json({
        success: true,
        data: result.rows
      });
      
    } catch (error) {
      console.error('❌ Error fetching tree species for search:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener especies de árboles',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Añadimos endpoint para concesiones (búsqueda global)
  apiRouter.get('/concessions', async (req: Request, res: Response) => {
    try {
      console.log('🏢 Concessions endpoint for search:', req.query);
      
      const result = await pool.query(`
        SELECT 
          id,
          vendor_name,
          location,
          status,
          start_date,
          end_date,
          park_id,
          notes
        FROM concessions
        WHERE status = 'activa'
        ORDER BY vendor_name ASC
        LIMIT 100
      `);
      
      console.log(`✅ Found ${result.rows.length} concessions for search`);
      
      res.json({
        success: true,
        data: result.rows
      });
      
    } catch (error) {
      console.error('❌ Error fetching concessions for search:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener concesiones',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Las rutas principales de eventos YA están registradas con prioridad arriba
  // Las rutas de imágenes de eventos YA están registradas con prioridad arriba
  
  // Registramos las rutas de categorías de eventos
  registerEventCategoriesRoutes(app, apiRouter, isAuthenticated);
  
  // Registramos las rutas del módulo financiero
  registerFinanceRoutes(app, apiRouter, isAuthenticated);
  registerBudgetRoutes(app, apiRouter, isAuthenticated);
  registerBudgetPlanningRoutes(app, apiRouter, isAuthenticated);
  registerFinanceUpdateRoutes(app, apiRouter);
  console.log('Rutas del módulo financiero registradas correctamente');
  
  // Registramos las rutas del módulo de contabilidad
  registerAccountingRoutes(app, apiRouter, isAuthenticated);
  console.log('🧮 Rutas del módulo de contabilidad registradas correctamente');
  
  // Registramos las rutas del módulo de patrocinios
  registerSponsorshipRoutes(app, apiRouter, isAuthenticated);
  console.log('🏆 Rutas del módulo de patrocinios registradas correctamente');
  
  // Registramos las rutas del módulo de publicidad
  apiRouter.use('/advertising', advertisingRoutes);
  
  // Registramos las rutas de gestión de publicidad
  const advertisingManagementRoutes = await import('./advertising-management-routes');
  apiRouter.use('/advertising-management', advertisingManagementRoutes.default);
  console.log('📢 Rutas de publicidad y gestión registradas');

  // Rutas de edición específicas con nombres únicos
  apiRouter.put("/income-categories/:id", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      const { name, description } = req.body;
      
      console.log("=== EDITANDO CATEGORÍA DE INGRESOS ===");
      console.log("ID:", categoryId, "Datos:", { name, description });
      
      const query = `UPDATE income_categories SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *`;
      const result = await db.execute(query, [name, description, categoryId]);
      
      console.log("Resultado:", result.rows[0]);
      
      res.json({
        success: true,
        data: result.rows[0]
      });
      
    } catch (error) {
      console.error("Error editando categoría de ingresos:", error);
      res.status(500).json({
        success: false,
        message: "Error editando categoría",
        error: error.message
      });
    }
  });

  apiRouter.put("/expense-categories/:id", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      const { name, description } = req.body;
      
      console.log("=== EDITANDO CATEGORÍA DE EGRESOS ===");
      console.log("ID:", categoryId, "Datos:", { name, description });
      
      const query = `UPDATE expense_categories SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *`;
      const result = await db.execute(query, [name, description, categoryId]);
      
      console.log("Resultado:", result.rows[0]);
      
      res.json({
        success: true,
        data: result.rows[0]
      });
      
    } catch (error) {
      console.error("Error editando categoría de egresos:", error);
      res.status(500).json({
        success: false,
        message: "Error editando categoría",
        error: error.message
      });
    }
  });
  
  // Registramos las rutas del módulo de inventario de árboles
  // Comentamos esta línea para evitar conflictos con las rutas en tree_routes.ts
  // registerTreeInventoryRoutes(app, apiRouter, isAuthenticated);
  
  // Registramos las rutas para categorías de incidentes
  try {
    const { registerIncidentCategoriesRoutes } = await import("./incident_categories_routes");
    registerIncidentCategoriesRoutes(app, apiRouter);
    console.log("Rutas de categorías de incidentes registradas correctamente");
  } catch (error) {
    console.error("Error al registrar rutas de categorías de incidentes:", error);
  }
  
  // Inicializamos tablas de categorías de incidentes
  try {
    const { createIncidentCategoriesTables } = await import("./create_incident_categories_tables");
    await createIncidentCategoriesTables();
    console.log("Tablas de categorías de incidentes inicializadas correctamente");
  } catch (error) {
    console.error("Error al inicializar tablas de categorías de incidentes:", error);
  }
  
  // Registramos las rutas de estadísticas de árboles
  registerTreeStatsRoutes(app, apiRouter);
  
  // Registramos las rutas de gestión técnica y ambiental de árboles
  registerTreeDetailsRoutes(app, apiRouter, isAuthenticated);
  
  // Registramos las rutas del módulo de usuarios
  registerUserRoutes(app, apiRouter);

  // Registramos los endpoints híbridos PRIMERO (rutas específicas antes de genéricas)
  registerHybridRoleRoutes(app);
  
  // Registramos las rutas del sistema de roles (rutas genéricas al final)
  registerRoleRoutes(app);

  // Registramos las rutas de evaluaciones de instructores
  registerInstructorEvaluationRoutes(app, apiRouter);
  
  // Registramos las rutas de importación de amenidades
  try {
    const { registerAmenitiesImportRoutes } = await import("./amenities-import-routes");
    registerAmenitiesImportRoutes(app, apiRouter, isAuthenticated);
    console.log("Rutas de importación de amenidades registradas correctamente");
  } catch (error) {
    console.error("Error al registrar rutas de importación de amenidades:", error);
  }
  
  // Registramos las rutas del módulo de concesiones
  registerConcessionRoutes(app, apiRouter, isAuthenticated);
  registerConcessionContractsRoutes(app, apiRouter, isAuthenticated);
  registerUsersConcessionairesRoutes(app, apiRouter, isAuthenticated);
  registerConcessionairesSimpleRoutes(app, apiRouter, isAuthenticated);
  registerConcessionLocationsRoutes(app, apiRouter, isAuthenticated);
  registerConcessionPaymentsRoutes(app, apiRouter, isAuthenticated);
  registerConcessionEvaluationRoutes(app, apiRouter, isAuthenticated);
  registerActiveConcessionRoutes(app, apiRouter, isAuthenticated);
  
  // Registramos las rutas de integración financiera de concesiones
  try {
    const { registerConcessionFinanceIntegrationRoutes } = await import("./concessions-finance-integration");
    registerConcessionFinanceIntegrationRoutes(app, apiRouter, isAuthenticated);
    console.log("Rutas de integración Concesiones-Finanzas registradas correctamente");
  } catch (error) {
    console.error("Error al registrar rutas de integración Concesiones-Finanzas:", error);
  }
  
  // Crear tablas del sistema de cobro híbrido - NON-BLOCKING para evitar fallas de deployment
  try {
    const { createHybridPaymentTables } = await import("./create-hybrid-payment-tables");
    
    // Ejecutar en background sin bloquear el startup
    setImmediate(async () => {
      try {
        await createHybridPaymentTables();
        console.log("Tablas del sistema de cobro híbrido creadas correctamente");
      } catch (backgroundError) {
        console.warn("⚠️ [NON-CRITICAL] Error al crear tablas del sistema de cobro híbrido (no bloquea el servidor):", backgroundError);
      }
    });
  } catch (error) {
    console.warn("⚠️ [NON-CRITICAL] Error al importar createHybridPaymentTables:", error);
  }

  // Crear tabla de auditoría de costeo - NON-BLOCKING para evitar fallas de deployment  
  try {
    const { createCostingAuditTable } = await import("./create-costing-audit-table");
    
    // Ejecutar en background sin bloquear el startup
    setImmediate(async () => {
      try {
        await createCostingAuditTable();
        console.log("💰 Tabla de auditoría de costeo inicializada automáticamente");
      } catch (backgroundError) {
        console.warn("⚠️ [NON-CRITICAL] Error al crear tabla de auditoría de costeo (no bloquea el servidor):", backgroundError);
      }
    });
  } catch (error) {
    console.warn("⚠️ [NON-CRITICAL] Error al importar createCostingAuditTable:", error);
  }
  
  // Registramos las rutas del sistema de cobro híbrido
  try {
    const { registerHybridPaymentRoutes } = await import("./hybrid-payment-routes");
    registerHybridPaymentRoutes(app, apiRouter, isAuthenticated);
    console.log("Rutas del sistema de cobro híbrido registradas correctamente");
  } catch (error) {
    console.error("Error al registrar rutas del sistema de cobro híbrido:", error);
  }
  
  // Endpoint específico para subir imágenes de perfil de voluntarios
  
  // Configurar multer para subida de imágenes de voluntarios
  const volunteerUploadDir = path.resolve('./public/uploads/volunteers');
  if (!fs.existsSync(volunteerUploadDir)) {
    fs.mkdirSync(volunteerUploadDir, { recursive: true });
  }
  
  const volunteerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, volunteerUploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, 'volunteer-' + uniqueSuffix + ext);
    }
  });
  
  const volunteerUpload = multer({
    storage: volunteerStorage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB máximo
    }
  }).single('file');
  
  apiRouter.post('/upload/volunteer-profile', (req: Request, res: Response) => {
    volunteerUpload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'El archivo es demasiado grande. Máximo 5MB.'
            });
          }
        }
        return res.status(500).json({
          success: false,
          message: 'Error al subir la imagen'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se seleccionó ninguna imagen'
        });
      }
      
      const imageUrl = `/uploads/volunteers/${req.file.filename}`;
      
      // Si se proporciona volunteerId, actualizar la base de datos
      const volunteerId = req.body.volunteerId;
      if (volunteerId) {
        try {
          await pool.query(
            'UPDATE volunteers SET profile_image_url = $1, updated_at = NOW() WHERE id = $2',
            [imageUrl, parseInt(volunteerId)]
          );
          console.log(`✅ Imagen de perfil actualizada en BD para voluntario ${volunteerId}: ${imageUrl}`);
        } catch (dbError) {
          console.error('Error actualizando imagen en base de datos:', dbError);
          // Continuamos aunque falle la actualización de BD
        }
      }
      
      res.json({
        success: true,
        url: imageUrl,
        message: 'Imagen subida correctamente'
      });
    });
  });

  // Rutas temporales para las nuevas pestañas del parque
  apiRouter.get('/concessions/park/:parkId', async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.parkId);
      const concessionsQuery = await pool.query(
        'SELECT * FROM active_concessions WHERE park_id = $1 ORDER BY created_at DESC',
        [parkId]
      );
      res.json(concessionsQuery.rows);
    } catch (error) {
      console.error('Error fetching park concessions:', error);
      res.json([]); // Return empty array instead of error to prevent breaking the UI
    }
  });

  apiRouter.get('/space-reservations/park/:parkId', async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.parkId);
      const reservationsQuery = await pool.query(
        `SELECT sr.*, rs.name as spaceName 
         FROM space_reservations sr 
         JOIN reservable_spaces rs ON sr.space_id = rs.id 
         WHERE rs.park_id = $1 
         ORDER BY sr.start_date DESC`,
        [parkId]
      );
      res.json(reservationsQuery.rows);
    } catch (error) {
      console.error('Error fetching park reservations:', error);
      res.json([]); // Return empty array instead of error to prevent breaking the UI
    }
  });

  apiRouter.get('/parks/:parkId/events', async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.parkId);
      
      // First get the park name to search in location field
      const parkResult = await pool.query('SELECT name FROM parks WHERE id = $1', [parkId]);
      if (parkResult.rows.length === 0) {
        return res.json([]);
      }
      
      const parkName = parkResult.rows[0].name;
      
      // Search for events that mention this park in their location
      const eventsQuery = await pool.query(
        `SELECT * FROM events 
         WHERE LOWER(location) LIKE LOWER($1) 
         ORDER BY start_date ASC`,
        [`%${parkName}%`]
      );
      res.json(eventsQuery.rows);
    } catch (error) {
      console.error('Error fetching park events:', error);
      res.json([]); // Return empty array instead of error to prevent breaking the UI
    }
  });

  // API endpoint for eventos AMBU calendar
  apiRouter.get('/eventos-ambu', async (req: Request, res: Response) => {
    try {
      const { fecha_desde, fecha_hasta, limit = '50' } = req.query;
      
      let query = `
        SELECT 
          id,
          title as titulo,
          description as descripcion,
          event_type as categoria,
          start_date as fechaEvento,
          start_time as horaInicio,
          end_time as horaFin,
          capacity as numeroAsistentes,
          status,
          'alto_impacto' as impactoTipo
        FROM events 
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      if (fecha_desde) {
        query += ` AND start_date >= $${paramIndex}`;
        params.push(fecha_desde);
        paramIndex++;
      }
      
      if (fecha_hasta) {
        query += ` AND start_date <= $${paramIndex}`;
        params.push(fecha_hasta);
        paramIndex++;
      }
      
      query += ` ORDER BY start_date ASC LIMIT $${paramIndex}`;
      params.push(parseInt(limit as string));
      
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching eventos AMBU:', error);
      res.json([]); // Return empty array to prevent UI errors
    }
  });

  // Endpoints para imágenes de perfil
  // Obtener la imagen de perfil de un usuario
  apiRouter.get('/users/:id/profile-image', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      // Primero intentar obtener de la caché
      let imageUrl = getProfileImage(userId);
      
      // Si no está en caché, consultar la base de datos
      if (!imageUrl) {
        try {
          const result = await pool.query('SELECT profile_image_url FROM users WHERE id = $1', [userId]);
          if (result.rows.length > 0 && result.rows[0].profile_image_url) {
            imageUrl = result.rows[0].profile_image_url;
            // Guardar en caché para futuras consultas
            saveProfileImage(userId, imageUrl);
          }
        } catch (dbError) {
          console.error('Error al consultar la base de datos:', dbError);
        }
      }
      
      if (!imageUrl) {
        return res.status(404).json({ 
          message: 'No se encontró ninguna imagen de perfil para este usuario'
        });
      }
      
      res.json({ imageUrl });
    } catch (error) {
      console.error('Error al obtener la URL de imagen de perfil:', error);
      res.status(500).json({ 
        message: 'Error al obtener la URL de imagen de perfil'
      });
    }
  });
  
  // Guardar la URL de la imagen de perfil de un usuario
  apiRouter.post('/users/:id/profile-image', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ message: 'URL de imagen no proporcionada' });
      }
      
      // Guardar la URL en la caché
      saveProfileImage(userId, imageUrl);
      console.log(`Imagen de perfil guardada para el usuario ${userId}: ${imageUrl}`);
      
      res.json({ 
        success: true, 
        message: 'URL de imagen de perfil guardada correctamente',
        userId,
        imageUrl
      });
    } catch (error) {
      console.error('Error al guardar la URL de imagen de perfil:', error);
      res.status(500).json({ 
        message: 'Error al guardar la URL de imagen de perfil'
      });
    }
  });
  
  // Importamos la función para asignar imágenes de perfil
  import("./assign-profile-images").then(module => {
    // Endpoint para asignar imágenes de perfil a todos los usuarios
    apiRouter.post("/admin/assign-profile-images", isAuthenticated, async (req: Request, res: Response) => {
      try {
        const result = await module.assignProfileImages();
        res.status(200).json(result);
      } catch (error) {
        console.error("Error al asignar imágenes de perfil:", error);
        res.status(500).json({ 
          success: false, 
          message: "Error al asignar imágenes de perfil",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  });
  
  // Registramos las rutas públicas
  registerPublicRoutes(publicRouter);
  
  // Montamos todas las rutas de la API bajo el prefijo /api
  app.use('/api', apiRouter);
  
  // Endpoint para cargar imágenes de perfil
  app.post('/api/upload/profile-image', isAuthenticated, handleProfileImageUpload);
  
  // Endpoint para cargar logos de patrocinadores
  app.post('/api/upload/sponsor-logo', isAuthenticated, sponsorLogoUpload.single('logo'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se ha proporcionado ningún archivo'
        });
      }

      // La ruta del archivo se construye relativa al directorio public
      const filePath = `/uploads/sponsor-logos/${req.file.filename}`;
      
      console.log(`Logo de sponsor subido: ${filePath}`);
      
      res.json({
        success: true,
        message: 'Logo subido exitosamente',
        filePath: filePath
      });
    } catch (error) {
      console.error('Error al subir logo de sponsor:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al subir el archivo'
      });
    }
  });
  
  // Endpoint para subir archivos de publicidad con manejo de errores
  app.post('/api/advertising/upload', isAuthenticated, (req: Request, res: Response) => {
    uploadAdvertising(req, res, (err) => {
      if (err) {
        console.error('❌ Error en multer:', err);
        return res.status(400).json({
          success: false,
          error: err.message || 'Error al procesar el archivo'
        });
      }
      handleAdvertisingUpload(req, res);
    });
  });

  // Montamos todas las rutas públicas bajo el prefijo /public-api
  // Esta línea asegura que todas las rutas definidas en publicRouter sean accesibles bajo /public-api
  app.use('/public-api', publicRouter);
  
  // Añadir router especial para actualizar habilidades
  app.use('/api', updateSkillsRouter);
  
  // Añadir rutas de pagos con Stripe
  app.use(paymentsRouter);
  
  // Registrar rutas de feedback de visitantes
  app.use('/api/feedback', feedbackRouter);
  console.log('✅ Rutas de feedback de visitantes registradas');

  // Registrar rutas de exportación
  app.use(exportRoutes);
  console.log('✅ Rutas de exportación registradas');

  // Parks with amenities 
  apiRouter.get("/parks-with-amenities", async (_req: Request, res: Response) => {
    try {
      const parks = await db
        .select({
          id: schema.parks.id,
          name: schema.parks.name,
          address: schema.parks.address,
          area: schema.parks.area,
          codePrefix: schema.parks.codePrefix,
          parkType: schema.parks.parkType
        })
        .from(schema.parks);
      
      res.json(parks);
    } catch (error) {
      console.error("Error getting parks with amenities:", error);
      res.status(500).json({ error: "Error al obtener parques con amenidades" });
    }
  });

  // GET /api/parks/summary?ids=... - Consolidated endpoint to get all metrics for multiple parks (DEBE IR ANTES DE /parks/:id)
  apiRouter.get('/parks/summary', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('🔥 [PARKS-SUMMARY] Iniciando endpoint');
      console.log('🔥 [PARKS-SUMMARY] Query params:', req.query);
      const idsParam = req.query.ids as string;
      
      if (!idsParam) {
        return res.status(400).json({ message: 'Missing ids parameter' });
      }

      const parkIds = idsParam.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
      
      if (parkIds.length === 0) {
        return res.status(400).json({ message: 'No valid park IDs provided' });
      }

      // Optimized queries using SQL aggregation for better performance
      const summary: Record<number, any> = {};

      // Initialize all parks in summary
      parkIds.forEach(id => {
        summary[id] = {
          metrics: null,
          incidents: { total: 0, priorityBreakdown: { high: 0, medium: 0, low: 0 } },
          assets: { total: 0, typeBreakdown: { preventive: 0, corrective: 0, emergency: 0 } },
          reports: { total: 0, typeBreakdown: { complaint: 0, suggestion: 0, compliment: 0 } },
          schedule: { total: 0, breakdown: { activities: 0, events: 0 } }
        };
      });

      // 1. Get metrics (using aggregated query for all parks at once)
      const metricsQuery = `
        SELECT 
          park_id,
          ROUND(AVG(overall_rating), 1) as average_rating,
          COUNT(*) as total_evaluations,
          ROUND(AVG(cleanliness), 1) as avg_cleanliness,
          ROUND(AVG(safety), 1) as avg_safety,
          ROUND(AVG(maintenance), 1) as avg_maintenance,
          ROUND(AVG(accessibility), 1) as avg_accessibility,
          ROUND(AVG(amenities), 1) as avg_amenities,
          ROUND(AVG(activities), 1) as avg_activities,
          ROUND(AVG(staff), 1) as avg_staff,
          ROUND(AVG(natural_beauty), 1) as avg_natural_beauty
        FROM park_evaluations 
        WHERE park_id = ANY($1)
        GROUP BY park_id
      `;
      const metricsResult = await pool.query(metricsQuery, [parkIds]);
      
      metricsResult.rows.forEach((row: any) => {
        summary[row.park_id].metrics = {
          averageRating: row.average_rating || 0,
          totalEvaluations: parseInt(row.total_evaluations) || 0,
          ratingBreakdown: {
            cleanliness: row.avg_cleanliness || 0,
            safety: row.avg_safety || 0,
            maintenance: row.avg_maintenance || 0,
            accessibility: row.avg_accessibility || 0,
            amenities: row.avg_amenities || 0,
            activities: row.avg_activities || 0,
            staff: row.avg_staff || 0,
            naturalBeauty: row.avg_natural_beauty || 0
          }
        };
      });

      // 2. Get pending incidents (aggregated by park and priority)
      const incidentsQuery = `
        SELECT 
          park_id,
          priority,
          COUNT(*) as count
        FROM incidents 
        WHERE park_id = ANY($1) 
        AND status NOT IN ('resolved', 'closed', 'cancelled')
        GROUP BY park_id, priority
      `;
      const incidentsResult = await pool.query(incidentsQuery, [parkIds]);
      
      incidentsResult.rows.forEach((row: any) => {
        const parkId = row.park_id;
        const priority = row.priority;
        const count = parseInt(row.count);
        
        summary[parkId].incidents.total += count;
        if (priority === 'high') summary[parkId].incidents.priorityBreakdown.high = count;
        else if (priority === 'medium') summary[parkId].incidents.priorityBreakdown.medium = count;
        else if (priority === 'low') summary[parkId].incidents.priorityBreakdown.low = count;
      });

      // 3. Get assets in maintenance (aggregated by park and type)
      const assetsQuery = `
        SELECT 
          a.park_id,
          am.maintenance_type,
          COUNT(*) as count
        FROM asset_maintenances am
        INNER JOIN assets a ON am.asset_id = a.id
        WHERE a.park_id = ANY($1)
        AND am.status IN ('scheduled', 'in_progress')
        GROUP BY a.park_id, am.maintenance_type
      `;
      const assetsResult = await pool.query(assetsQuery, [parkIds]);
      
      assetsResult.rows.forEach((row: any) => {
        const parkId = row.park_id;
        const maintenanceType = row.maintenance_type;
        const count = parseInt(row.count);
        
        summary[parkId].assets.total += count;
        if (maintenanceType === 'preventive') summary[parkId].assets.typeBreakdown.preventive = count;
        else if (maintenanceType === 'corrective') summary[parkId].assets.typeBreakdown.corrective = count;
        else if (maintenanceType === 'emergency') summary[parkId].assets.typeBreakdown.emergency = count;
      });

      // 4. Get pending reports (aggregated by park and type)
      const reportsQuery = `
        SELECT 
          park_id,
          form_type,
          COUNT(*) as count
        FROM park_feedback 
        WHERE park_id = ANY($1)
        AND status IN ('pending', 'under_review')
        GROUP BY park_id, form_type
      `;
      const reportsResult = await pool.query(reportsQuery, [parkIds]);
      
      reportsResult.rows.forEach((row: any) => {
        const parkId = row.park_id;
        const formType = row.form_type;
        const count = parseInt(row.count);
        
        summary[parkId].reports.total += count;
        if (formType === 'report_problem') summary[parkId].reports.typeBreakdown.complaint = count;
        else if (formType === 'suggest_improvement') summary[parkId].reports.typeBreakdown.suggestion = count;
        else if (formType === 'share') summary[parkId].reports.typeBreakdown.compliment = count;
      });

      // 5. Get upcoming schedule (aggregated by park and type)
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      const scheduleQuery = `
        SELECT 
          park_id,
          'activity' as type,
          COUNT(*) as count
        FROM activities 
        WHERE park_id = ANY($1)
        AND start_date >= $2 AND start_date <= $3
        GROUP BY park_id
        
        UNION ALL
        
        SELECT 
          p.id as park_id,
          'event' as type,
          COUNT(*) as count
        FROM events e
        INNER JOIN parks p ON p.id = ANY($1)
        WHERE e.location ILIKE '%' || p.name || '%'
        AND e.start_date >= $2 AND e.start_date <= $3
        GROUP BY p.id
      `;
      const scheduleResult = await pool.query(scheduleQuery, [parkIds, now, thirtyDaysFromNow]);
      
      scheduleResult.rows.forEach((row: any) => {
        const parkId = row.park_id;
        const type = row.type;
        const count = parseInt(row.count);
        
        summary[parkId].schedule.total += count;
        if (type === 'activity') summary[parkId].schedule.breakdown.activities = count;
        else if (type === 'event') summary[parkId].schedule.breakdown.events = count;
      });

      res.json(summary);
    } catch (error) {
      console.error('Error fetching parks summary:', error);
      res.status(500).json({ message: 'Error fetching parks summary' });
    }
  });

  // Get detailed park information with all related data
  apiRouter.get("/parks/:id/details", async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.id);
      console.log(`[DETAILS] Obteniendo detalles del parque ${parkId}`);
      
      // Get basic park information
      const park = await storage.getPark(parkId);
      if (!park) {
        return res.status(404).json({ error: "Parque no encontrado" });
      }
      console.log(`[DETAILS] Parque encontrado: ${park.name}`);

      // Get extended park data to include amenities and images
      const extendedParks = await storage.getExtendedParks();
      const extendedPark = extendedParks.find(p => p.id === parkId);

      // Get park amenities (from extended park data)
      const amenities = extendedPark?.amenities || [];

      // Get park images (from extended park data)  
      const images = extendedPark?.images || [];

      // Use simplified queries for other data that don't require complex joins
      const activities = await storage.getAllActivities();
      const parkActivities = activities.filter(activity => activity.parkId === parkId).slice(0, 20);

      // Get trees data with statistics for this park
      const treesQuery = await pool.query(
        'SELECT id, species_id, condition, planting_date, last_maintenance_date, location_description, code FROM trees WHERE park_id = $1',
        [parkId]
      );
      const parkTrees = treesQuery.rows;
      
      // Get tree statistics
      const treeStatsQuery = await pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN condition = 'Bueno' THEN 1 END) as good,
          COUNT(CASE WHEN condition = 'Regular' THEN 1 END) as regular,
          COUNT(CASE WHEN condition = 'Malo' THEN 1 END) as bad
        FROM trees WHERE park_id = $1`,
        [parkId]
      );
      const treeStats = treeStatsQuery.rows[0];

      // Get volunteers data for this park - usar solo columnas existentes
      const volunteersQuery = await pool.query(
        `SELECT 
          id, 
          full_name, 
          email, 
          phone, 
          skills, 
          status, 
          preferred_park_id,
          available_hours,
          previous_experience,
          age,
          gender,
          created_at,
          profile_image_url,
          address,
          emergency_contact,
          emergency_phone,
          legal_consent,
          interest_areas,
          available_days
        FROM volunteers 
        WHERE preferred_park_id = $1 AND status = 'active'
        ORDER BY created_at DESC`,
        [parkId]
      );
      const parkVolunteers = volunteersQuery.rows;

      // Get incidents data for this park
      const incidentsQuery = await pool.query(
        'SELECT id, title, severity, status, created_at FROM incidents WHERE park_id = $1 ORDER BY created_at DESC LIMIT 10',
        [parkId]
      );
      const incidents = incidentsQuery.rows.map((incident: any) => ({
        id: incident.id,
        title: incident.title,
        status: incident.status,
        priority: incident.severity,
        createdAt: incident.created_at.toISOString()
      }));
      const incidentsCount = incidents.length;

      // Get evaluations data for this park
      const evaluationsQuery = await pool.query(
        'SELECT AVG(overall_rating) as avg_rating FROM park_evaluations WHERE park_id = $1',
        [parkId]
      );
      const averageEvaluation = parseFloat(evaluationsQuery.rows[0].avg_rating) || 0;

      // Get assets data for this park
      const assetsQuery = await pool.query(
        'SELECT id, name, category_id, condition, location_description as location, acquisition_date, last_maintenance_date FROM assets WHERE park_id = $1',
        [parkId]
      );
      const assets = assetsQuery.rows;

      // Get active concessions for this park
      const concessionsQuery = await pool.query(
        'SELECT COUNT(*) as count FROM active_concessions WHERE park_id = $1',
        [parkId]
      );
      const activeConcessions = parseInt(concessionsQuery.rows[0]?.count || 0);

      // Get feedback count for this park from park_feedback table
      let totalFeedback = 0;
      try {
        const feedbackQuery = await pool.query(
          'SELECT COUNT(*) as count FROM park_feedback WHERE park_id = $1',
          [parkId]
        );
        totalFeedback = parseInt(feedbackQuery.rows[0]?.count || 0);
        console.log(`[DETAILS] Feedback encontrado para parque ${parkId}: ${totalFeedback}`);
      } catch (error) {
        console.log('Error obteniendo feedback, usando valor 0:', error);
        totalFeedback = 0;
      }

      // Get evaluations count for this park
      const evaluationsCountQuery = await pool.query(
        'SELECT COUNT(*) as count FROM park_evaluations WHERE park_id = $1',
        [parkId]
      );
      const totalEvaluations = parseInt(evaluationsCountQuery.rows[0]?.count || 0);

      // Get reservations count for this park by joining with reservable_spaces
      let totalReservations = 0;
      try {
        const reservationsQuery = await pool.query(
          `SELECT COUNT(*) as count 
           FROM space_reservations sr 
           JOIN reservable_spaces rs ON sr.space_id = rs.id 
           WHERE rs.park_id = $1`,
          [parkId]
        );
        totalReservations = parseInt(reservationsQuery.rows[0]?.count || 0);
        console.log(`[DETAILS] Reservas encontradas para parque ${parkId}: ${totalReservations}`);
      } catch (error) {
        console.log('Error obteniendo reservas, usando valor 0:', error);
        totalReservations = 0;
      }

      // Get events count for this park using event_parks relationship table
      let totalEvents = 0;
      try {
        const eventsQuery = await pool.query(
          `SELECT COUNT(*) as count 
           FROM event_parks ep 
           JOIN events e ON ep.event_id = e.id 
           WHERE ep.park_id = $1 
           AND e.start_date >= CURRENT_DATE`,
          [parkId]
        );
        totalEvents = parseInt(eventsQuery.rows[0]?.count || 0);
        console.log(`[DETAILS] Eventos encontrados para parque ${parkId}: ${totalEvents}`);
      } catch (error) {
        console.log('Error obteniendo eventos, usando valor 0:', error);
        totalEvents = 0;
      }

      // For now, we'll use empty arrays for data we don't have direct access to
      const documents: any[] = [];

      // Calculate statistics
      const stats = {
        totalActivities: parkActivities.length,
        activeVolunteers: parkVolunteers.filter(v => v.status === 'active').length,
        totalTrees: parseInt(treeStats.total),
        totalAssets: assets.length,
        averageEvaluation: averageEvaluation,
        pendingIncidents: incidentsCount,
        activeConcessions: activeConcessions,
        totalFeedback: totalFeedback,
        totalEvaluations: totalEvaluations,
        totalReservations: totalReservations,
        totalEvents: totalEvents
      };
      
      console.log(`[DETAILS] Estadísticas calculadas:`, stats);

      // Build response
      const response = {
        id: park.id,
        name: park.name,
        location: park.location,
        openingHours: park.openingHours || "Sin horarios definidos",
        description: park.description || "Sin descripción disponible",
        municipality: park.municipalityText ? { name: park.municipalityText } : { name: "Sin municipio" },
        certificaciones: park.certificaciones,
        amenities: amenities.map((amenity: any) => ({
          id: amenity.id,
          name: amenity.name,
          icon: amenity.icon,
          description: amenity.description
        })),
        activities: parkActivities.map((activity: any) => ({
          id: activity.id,
          title: activity.title,
          description: activity.description || "",
          startDate: activity.startDate.toISOString(),
          instructorName: activity.instructorName || "",
          participantCount: activity.participantCount || 0
        })),
        trees: {
          data: parkTrees.map((tree: any) => ({
            id: tree.id,
            speciesId: tree.species_id,
            condition: tree.condition || "bueno",
            plantedDate: tree.planting_date?.toISOString(),
            lastMaintenance: tree.last_maintenance_date?.toISOString(),
            locationDescription: tree.location_description,
            code: tree.code
          })),
          stats: {
            total: parseInt(treeStats.total),
            good: parseInt(treeStats.good),
            regular: parseInt(treeStats.regular),
            bad: parseInt(treeStats.bad)
          }
        },
        assets: assets.map((asset: any) => ({
          id: asset.id,
          name: asset.name,
          type: asset.category_id || "Sin categoría",
          condition: asset.condition,
          location: asset.location,
          acquisitionDate: asset.acquisition_date?.toISOString(),
          lastMaintenanceDate: asset.last_maintenance_date?.toISOString()
        })),
        incidents: incidents,
        documents: documents,
        images: images.map((img: any) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          caption: img.caption,
          isPrimary: img.isPrimary
        })),
        evaluations: [], // Can be implemented when we have evaluations
        volunteers: parkVolunteers.map((volunteer: any) => ({
          id: volunteer.id,
          fullName: volunteer.full_name || "Sin nombre",
          firstName: '', // No disponible en esta tabla
          lastName: '', // No disponible en esta tabla
          email: volunteer.email || '',
          phone: volunteer.phone || '',
          skills: volunteer.skills || '',
          status: volunteer.status || 'active',
          availability: volunteer.available_hours || '',
          experience: volunteer.previous_experience || '',
          age: volunteer.age || null,
          gender: volunteer.gender || '',
          createdAt: volunteer.created_at ? volunteer.created_at.toISOString() : new Date().toISOString(),
          profileImageUrl: volunteer.profile_image_url || null,
          address: volunteer.address || '',
          emergencyContactName: volunteer.emergency_contact || '',
          emergencyContactPhone: volunteer.emergency_phone || '',
          legalConsent: volunteer.legal_consent || false,
          isActive: volunteer.status === 'active',
          preferredPark: park.name,
          hoursLogged: 0, // Esto podría venir de una tabla separada de horas
          lastActivity: volunteer.created_at ? volunteer.created_at.toISOString() : null,
          notes: '',
          interestAreas: Array.isArray(volunteer.interest_areas) ? volunteer.interest_areas.join(', ') : 'Sin áreas de interés especificadas',
          availableDays: Array.isArray(volunteer.available_days) ? volunteer.available_days.join(', ') : 'Sin días especificados'
        })),
        stats
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching park details:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Get all amenities - Con DISTINCT para evitar duplicados
  apiRouter.get("/amenities", async (_req: Request, res: Response) => {
    try {
      console.log("[AMENITIES] Obteniendo todas las amenidades...");
      
      const result = await pool.query(`
        SELECT DISTINCT
          id,
          name,
          icon,
          category,
          icon_type as "iconType",
          custom_icon_url as "customIconUrl"
        FROM amenities
        ORDER BY name
      `);
      
      console.log("[AMENITIES] Amenidades únicas encontradas:", result.rows.length);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener amenidades:", error);
      res.status(500).json({ message: "Error fetching amenities", error: error.message });
    }
  });

  // Dashboard endpoint específico para amenidades
  apiRouter.get("/amenities/dashboard", async (_req: Request, res: Response) => {
    try {
      console.log("[AMENITIES DASHBOARD] Iniciando consulta...");
      
      // Obtener amenidades con conteo correcto de parques usando LEFT JOIN
      const amenitiesResult = await pool.query(`
        SELECT 
          a.id,
          a.name,
          a.icon,
          a.category,
          a.icon_type as "iconType",
          a.custom_icon_url as "customIconUrl",
          COUNT(DISTINCT pa.park_id) as "parksCount",
          COUNT(pa.id) as "totalModules"
        FROM amenities a
        LEFT JOIN park_amenities pa ON a.id = pa.amenity_id
        GROUP BY a.id, a.name, a.icon, a.category, a.icon_type, a.custom_icon_url
        ORDER BY COUNT(DISTINCT pa.park_id) DESC, a.name
      `);
      
      console.log("[AMENITIES DASHBOARD] Amenidades obtenidas:", amenitiesResult.rows.length);
      
      const amenities = amenitiesResult.rows.map((row: any) => ({
        ...row,
        parksCount: parseInt(row.parksCount) || 0,
        totalModules: parseInt(row.totalModules) || 0,
        createdAt: new Date() // Fecha de creación ficticia si no está disponible
      }));
      
      // Obtener total de parques para calcular utilización
      const totalParksResult = await pool.query('SELECT COUNT(*) as total FROM parks');
      const totalParks = parseInt(totalParksResult.rows[0].total) || 0;
      
      console.log("[AMENITIES DASHBOARD] Total de parques:", totalParks);
      
      // Calcular utilización para cada amenidad
      const amenityStats = amenities.map((amenity: any) => ({
        ...amenity,
        utilizationRate: totalParks > 0 ? Math.round((amenity.parksCount / totalParks) * 100) : 0
      }));
      
      // Obtener estadísticas generales
      const totalAmenityAssignments = amenities.reduce((sum: number, amenity: any) => sum + amenity.totalModules, 0);
      const parksWithAmenities = await pool.query(`
        SELECT COUNT(DISTINCT park_id) as count 
        FROM park_amenities
      `);
      const parksWithAmenitiesCount = parseInt(parksWithAmenities.rows[0].count) || 0;
      
      // Obtener utilización por parque
      const parkUtilization = await pool.query(`
        SELECT 
          p.name as park_name,
          COUNT(pa.amenity_id) as amenities_count
        FROM parks p
        LEFT JOIN park_amenities pa ON p.id = pa.park_id
        GROUP BY p.id, p.name
        ORDER BY amenities_count DESC
      `);

      // Obtener información específica del parque con más amenidades
      const parkWithMostAmenities = parkUtilization.rows.length > 0 ? {
        name: parkUtilization.rows[0].park_name,
        count: parseInt(parkUtilization.rows[0].amenities_count) || 0
      } : null;

      // Obtener la amenidad con más módulos registrados
      const amenityWithMostModules = amenityStats.length > 0 ? {
        name: amenityStats[0].name,
        count: amenityStats[0].totalModules
      } : null;

      // Obtener información de categorías
      const categoryInfo = (() => {
        // Agrupar amenidades por categoría y contar amenidades en cada categoría
        const categoryGroups = amenityStats.reduce((acc: any, amenity: any) => {
          const category = amenity.category || 'Sin categoría';
          if (!acc[category]) {
            acc[category] = { count: 0, amenityNames: [] };
          }
          acc[category].count += 1;
          acc[category].amenityNames.push(amenity.name);
          return acc;
        }, {});

        const categories = Object.entries(categoryGroups);
        const totalCategories = categories.length;
        
        // Encontrar la categoría con más amenidades
        const categoryWithMostAmenities = categories.length > 0 ? 
          categories.reduce((max: any, current: any) => 
            current[1].count > max[1].count ? current : max
          ) : null;

        return {
          totalCategories,
          categoryWithMostAmenities: categoryWithMostAmenities ? {
            name: categoryWithMostAmenities[0],
            count: categoryWithMostAmenities[1].count
          } : null
        };
      })();

      console.log("[AMENITIES DASHBOARD] Estadísticas calculadas:");
      console.log("- Total amenidades:", amenities.length);
      console.log("- Total parques:", totalParks);
      console.log("- Total categorías:", categoryInfo.totalCategories);
      console.log("- Categoría con más amenidades:", categoryInfo.categoryWithMostAmenities?.name, "(" + categoryInfo.categoryWithMostAmenities?.count + ")");
      console.log("- Parques con amenidades:", parksWithAmenitiesCount);
      console.log("- Total asignaciones:", totalAmenityAssignments);

      const dashboardData = {
        totalAmenities: amenities.length,
        totalParks: totalParks,
        totalModules: totalAmenityAssignments,
        totalCategories: categoryInfo.totalCategories,
        categoryWithMostAmenities: categoryInfo.categoryWithMostAmenities,
        amenityWithMostModules: amenityWithMostModules,
        averageAmenitiesPerPark: totalParks > 0 ? Math.round((totalAmenityAssignments / totalParks) * 100) / 100 : 0,
        parkWithMostAmenities: parkWithMostAmenities,
        mostPopularAmenities: amenityStats.slice(0, 5),
        allAmenities: amenityStats,
        amenityDistribution: (() => {
          // Agrupar amenidades por categoría y contar el total en cada categoría
          const categoryGroups = amenityStats.reduce((acc: any, amenity: any) => {
            const category = amenity.category || 'Sin categoría';
            if (!acc[category]) {
              acc[category] = 0;
            }
            acc[category] += 1;
            return acc;
          }, {});

          // Convertir a formato para el gráfico
          const categoryColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
          return Object.entries(categoryGroups).map(([category, count], index) => ({
            name: category,
            value: count,
            color: categoryColors[index % categoryColors.length]
          }));
        })(),
        utilizationByPark: parkUtilization.rows.map((park: any) => ({
          parkName: park.park_name.length > 20 ? park.park_name.substring(0, 20) + '...' : park.park_name,
          amenitiesCount: parseInt(park.amenities_count) || 0
        })),
        statusDistribution: [
          { status: 'Activas', count: amenities.length, color: '#00C49F' },
          { status: 'Mantenimiento', count: 0, color: '#FFBB28' },
          { status: 'Inactivas', count: 0, color: '#FF8042' }
        ]
      };

      console.log("[AMENITIES DASHBOARD] Enviando respuesta con", amenityStats.length, "amenidades");
      console.log("[AMENITIES DASHBOARD] Muestra de datos:", amenityStats.slice(0, 3));

      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching amenities dashboard data:', error);
      res.status(500).json({ message: "Error fetching amenities dashboard data" });
    }
  });
  
  // Create a new amenity (admin only)
  apiRouter.post("/amenities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar que el usuario sea administrador
      if (req.user?.role !== "admin" && req.user?.role !== "super_admin") {
        return res.status(403).json({ message: "Solo administradores pueden gestionar amenidades" });
      }
      
      const data = {
        name: req.body.name,
        icon: req.body.icon,
        category: req.body.category,
        iconType: req.body.iconType || 'system',
        customIconUrl: req.body.customIconUrl || null
      };
      
      const result = await pool.query(`
        INSERT INTO amenities (name, icon, category, icon_type, custom_icon_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [data.name, data.icon, data.category, data.iconType, data.customIconUrl]);
      
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error(error);
      if (error.code === '23505' && error.constraint === 'amenities_name_unique') {
        res.status(400).json({ message: `Ya existe una amenidad con el nombre "${req.body.name}". Por favor, usa un nombre diferente.` });
      } else {
        res.status(500).json({ message: "Error al crear la amenidad" });
      }
    }
  });
  
  // Update an amenity (admin only)
  apiRouter.put("/amenities/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar que el usuario sea administrador
      if (req.user?.role !== "admin" && req.user?.role !== "super_admin") {
        return res.status(403).json({ message: "Solo administradores pueden gestionar amenidades" });
      }
      
      const id = Number(req.params.id);
      const data = {
        name: req.body.name,
        icon: req.body.icon,
        category: req.body.category,
        iconType: req.body.iconType || 'system',
        customIconUrl: req.body.customIconUrl || null
      };
      
      const result = await pool.query(`
        UPDATE amenities 
        SET 
          name = $2,
          icon = $3,
          category = $4,
          icon_type = $5,
          custom_icon_url = $6
        WHERE id = $1
        RETURNING *
      `, [id, data.name, data.icon, data.category, data.iconType, data.customIconUrl]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Amenidad no encontrada" });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating amenity" });
    }
  });
  
  // Endpoint para subir iconos personalizados
  apiRouter.post("/upload/icon", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar que el usuario sea administrador
      if (req.user?.role !== "admin" && req.user?.role !== "super_admin") {
        return res.status(403).json({ message: "Solo administradores pueden subir iconos" });
      }
      
      const { uploadIcon, handleIconUploadErrors, uploadIconHandler } = await import('./api/iconUpload');
      
      // Usar el middleware de multer para procesar la carga
      uploadIcon(req, res, (err: any) => {
        if (err) {
          return handleIconUploadErrors(err, req, res, () => {});
        }
        // Si no hay errores, manejar la respuesta
        return uploadIconHandler(req, res);
      });
    } catch (error) {
      console.error("Error al subir icono:", error);
      res.status(500).json({ error: "Error al subir icono" });
    }
  });

  // Delete an amenity (admin only)
  apiRouter.delete("/amenities/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`[ROUTES] Intento de eliminación de amenidad ID: ${req.params.id}`);
      
      // Verificar que el usuario sea administrador
      if (req.user?.role !== "admin" && req.user?.role !== "super_admin") {
        console.log(`[ROUTES] Usuario sin permisos de admin: ${req.user?.role}`);
        return res.status(403).json({ message: "Solo administradores pueden gestionar amenidades" });
      }
      
      const id = Number(req.params.id);
      console.log(`[ROUTES] ID convertido a número: ${id}`);
      
      // Verificar si la amenidad está siendo utilizada por algún parque usando SQL directo
      console.log(`[ROUTES] Verificando si amenidad está en uso con SQL directo...`);
      const usageResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM park_amenities 
        WHERE amenity_id = $1
      `, [id]);
      
      const usageCount = Number(usageResult.rows[0]?.count || 0);
      console.log(`[ROUTES] Amenidad ${id} está siendo usada en ${usageCount} parques`);
      
      if (usageCount > 0) {
        console.log(`[ROUTES] Amenidad en uso, devolviendo error 400`);
        return res.status(400).json({ 
          message: "No se puede eliminar esta amenidad porque está siendo utilizada por uno o más parques" 
        });
      }
      
      // Verificar si la amenidad existe usando SQL directo
      console.log(`[ROUTES] Verificando existencia de amenidad...`);
      const existsResult = await pool.query('SELECT id, name FROM amenities WHERE id = $1', [id]);
      console.log(`[ROUTES] Amenidad encontrada: ${existsResult.rows.length > 0}`);
      
      if (existsResult.rows.length === 0) {
        console.log(`[ROUTES] Amenidad ${id} no encontrada, devolviendo 404`);
        return res.status(404).json({ message: "Amenidad no encontrada" });
      }
      
      console.log(`[ROUTES] Amenidad encontrada: ${existsResult.rows[0].name}`);
      
      // Eliminar usando SQL directo
      console.log(`[ROUTES] Procediendo con eliminación SQL directa...`);
      const deleteResult = await pool.query('DELETE FROM amenities WHERE id = $1 RETURNING id, name', [id]);
      console.log(`[ROUTES] Filas eliminadas: ${deleteResult.rows.length}`);
      
      if (deleteResult.rows.length > 0) {
        console.log(`[ROUTES] Amenidad ${deleteResult.rows[0].name} eliminada exitosamente`);
        res.status(204).send();
      } else {
        console.log(`[ROUTES] No se pudo eliminar la amenidad, devolviendo 404`);
        res.status(404).json({ message: "Amenidad no encontrada" });
      }
      
    } catch (error) {
      console.error("[ROUTES] Error completo en eliminación:", error);
      console.error("[ROUTES] Stack trace:", error.stack);
      res.status(500).json({ message: "Error deleting amenity" });
    }
  });

  // Get amenities for a specific park - FIXED VERSION SIN DUPLICADOS
  apiRouter.get("/parks/:id/amenities", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      console.log(`DEBUG: Endpoint /parks/${parkId}/amenities llamado - Devolviendo park_amenities`);
      
      // Consulta simplificada para evitar duplicados
      const result = await pool.query(`
        SELECT 
          pa.id,
          pa.park_id as "parkId",
          pa.amenity_id as "amenityId",
          pa.module_name as "moduleName",
          pa.location_latitude as "locationLatitude",
          pa.location_longitude as "locationLongitude",
          pa.surface_area as "surfaceArea",
          pa.status,
          pa.description,
          a.name as "amenityName",
          a.icon as "amenityIcon",
          a.custom_icon_url as "customIconUrl"
        FROM park_amenities pa
        INNER JOIN amenities a ON pa.amenity_id = a.id
        WHERE pa.park_id = $1
        ORDER BY a.name
      `, [parkId]);
      
      console.log(`DEBUG: Amenidades encontradas para parque ${parkId}:`, result.rows.length);
      res.setHeader('Content-Type', 'application/json');
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching park amenities:", error);
      res.status(500).json({ message: "Error fetching park amenities" });
    }
  });

  // NOTA: Endpoint duplicado eliminado - usando el endpoint principal de línea 1423
  // que incluye certificaciones y todos los campos necesarios

  // Add an amenity to a park (admin/municipality only)
  app.post("/api/parks/:id/amenities", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const amenityId = Number(req.body.amenityId);
      const moduleName = req.body.moduleName || '';
      const locationLatitude = req.body.locationLatitude || null;
      const locationLongitude = req.body.locationLongitude || null;
      const surfaceArea = req.body.surfaceArea || null;
      const status = req.body.status || 'Activa';
      const description = req.body.description || '';
      
      console.log("Datos recibidos:", { parkId, amenityId, moduleName, locationLatitude, locationLongitude, surfaceArea, status, description });
      
      // Usar SQL directo con parámetros para seguridad
      const result = await pool.query(`
        INSERT INTO park_amenities (park_id, amenity_id, module_name, location_latitude, location_longitude, surface_area, status, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [parkId, amenityId, moduleName, locationLatitude, locationLongitude, surfaceArea, status, description]);
      
      console.log("Resultado de inserción:", result.rows[0]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error al agregar amenidad:", error);
      res.status(500).json({ 
        message: "Error adding amenity to park",
        details: error.message 
      });
    }
  });

  // Import amenities from file (admin only)
  apiRouter.post("/amenities/import", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      let amenitiesData: any[] = [];

      // Process Excel or CSV file
      if (file.mimetype.includes('spreadsheet') || file.originalname.endsWith('.xlsx')) {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        amenitiesData = XLSX.utils.sheet_to_json(worksheet);
      } else if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        const csvData = file.buffer.toString();
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            amenitiesData.push(row);
          }
        }
      } else {
        return res.status(400).json({ error: "Formato de archivo no soportado. Use Excel (.xlsx) o CSV." });
      }

      let importedCount = 0;
      
      for (const row of amenitiesData) {
        try {
          const amenityData = {
            name: row.Nombre || row.nombre || row.Name || '',
            category: row.Categoría || row.categoria || row.Category || 'servicios',
            icon: row.Icono || row.icono || row.Icon || 'park',
            iconType: 'system' as const,
            customIconUrl: null
          };

          if (amenityData.name) {
            await pool.query(`
              INSERT INTO amenities (name, icon, category, icon_type, custom_icon_url)
              VALUES ($1, $2, $3, $4, $5)
            `, [amenityData.name, amenityData.icon, amenityData.category, amenityData.iconType, amenityData.customIconUrl]);
            importedCount++;
          }
        } catch (error) {
          console.log(`Error importing amenity: ${row.Nombre || 'Unknown'}`, error);
        }
      }

      res.json({ 
        message: "Amenidades importadas exitosamente", 
        count: importedCount 
      });
    } catch (error) {
      console.error("Error importing amenities:", error);
      res.status(500).json({ error: "Error al importar amenidades" });
    }
  });

  // Get available custom icons
  apiRouter.get("/amenities/custom-icons", async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT DISTINCT name, custom_icon_url, category
        FROM amenities 
        WHERE icon_type = 'custom' AND custom_icon_url IS NOT NULL
        ORDER BY name
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching custom icons:', error);
      res.status(500).json({ error: "Error al obtener íconos personalizados" });
    }
  });

  // Upload amenity icon
  apiRouter.post("/amenities/upload-icon", iconUpload.single('icon'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se ha seleccionado ningún archivo" });
      }

      console.log("Archivo subido:", req.file);
      const iconUrl = `/uploads/${req.file.filename}`;
      
      res.json({ 
        success: true, 
        iconUrl,
        message: "Icono subido exitosamente" 
      });
    } catch (error) {
      console.error("Error uploading amenity icon:", error);
      res.status(500).json({ error: "Error al subir el icono" });
    }
  });

  // Bulk upload amenity icons and create amenities
  apiRouter.post("/amenities/bulk-upload", iconUpload.array('icons', 50), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No se han seleccionado archivos" });
      }

      const { category = 'servicios' } = req.body;
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      const results = [];
      
      for (const file of files) {
        try {
          // Validate file type
          if (!allowedTypes.includes(file.mimetype)) {
            results.push({
              filename: file.originalname,
              success: false,
              error: "Formato de archivo no válido"
            });
            continue;
          }

          // Validate file size (max 2MB)
          if (file.size > 2 * 1024 * 1024) {
            results.push({
              filename: file.originalname,
              success: false,
              error: "Archivo demasiado grande (máximo 2MB)"
            });
            continue;
          }

          // Create amenity name from filename
          const amenityName = file.originalname
            .replace(/\.[^/.]+$/, "") // Remove extension
            .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
            .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word

          const iconUrl = `/uploads/${file.filename}`;

          // Create amenity in database
          const amenityData = {
            name: amenityName,
            category: category,
            icon: 'custom',
            iconType: 'custom',
            customIconUrl: iconUrl
          };

          // Verificar si ya existe
          const existingCheck = await pool.query(`
            SELECT id FROM amenities WHERE name = $1
          `, [amenityData.name]);
          
          if (existingCheck.rows.length > 0) {
            // Ya existe, actualizar el ícono
            await pool.query(`
              UPDATE amenities 
              SET icon = $1, icon_type = $2, custom_icon_url = $3, category = $4
              WHERE name = $5
            `, [amenityData.icon, amenityData.iconType, amenityData.customIconUrl, amenityData.category, amenityData.name]);
          } else {
            // No existe, crear nuevo
            await pool.query(`
              INSERT INTO amenities (name, icon, category, icon_type, custom_icon_url)
              VALUES ($1, $2, $3, $4, $5)
            `, [amenityData.name, amenityData.icon, amenityData.category, amenityData.iconType, amenityData.customIconUrl]);
          }
          
          results.push({
            filename: file.originalname,
            amenityName: amenityName,
            success: true,
            iconUrl: iconUrl,
            action: existingCheck.rows.length > 0 ? 'updated' : 'created'
          });

        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          results.push({
            filename: file.originalname,
            success: false,
            error: "Error al procesar el archivo"
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      const createdCount = results.filter(r => r.success && r.action === 'created').length;
      const updatedCount = results.filter(r => r.success && r.action === 'updated').length;

      res.json({
        success: true,
        message: `${createdCount} amenidades creadas, ${updatedCount} actualizadas`,
        successCount,
        failedCount,
        createdCount,
        updatedCount,
        results
      });
      
    } catch (error) {
      console.error("Error in bulk upload:", error);
      res.status(500).json({ error: "Error en la carga masiva" });
    }
  });

  // Agregamos las rutas de los parques
  registerParkRoutes(app);

  // Get images for a specific park
  apiRouter.get("/parks/:id/images", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const images = await storage.getParkImages(parkId);
      
      // Mapear las columnas de la base de datos a los nombres esperados por el frontend
      const mappedImages = images.map(img => ({
        id: img.id,
        parkId: img.parkId,
        imageUrl: img.imageUrl, // Usar directamente 'imageUrl'
        caption: img.caption,
        isPrimary: img.isPrimary,
        createdAt: img.createdAt
      }));
      
      res.json(mappedImages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching park images" });
    }
  });

  // Alternative route for direct image deletion (used by frontend)
  apiRouter.delete("/park-images/:imageId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const imageId = Number(req.params.imageId);
      console.log(`🗑️ DELETE: Eliminando imagen ${imageId}`);
      
      // Obtener la imagen para verificar que existe y obtener info del parque
      const image = await storage.getParkImage(imageId);
      if (!image) {
        console.log(`❌ DELETE: Imagen ${imageId} no encontrada`);
        return res.status(404).json({ message: "Image not found" });
      }
      
      console.log(`📍 DELETE: Imagen ${imageId} pertenece al parque ${image.parkId}`);
      
      // Eliminar la imagen del sistema de archivos si existe
      if (image.imageUrl && image.imageUrl.startsWith('/uploads/')) {
        try {
          const filePath = path.join(process.cwd(), image.imageUrl);
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗂️ DELETE: Archivo físico eliminado: ${filePath}`);
          }
        } catch (fileError) {
          console.error(`⚠️ DELETE: Error eliminando archivo físico:`, fileError);
          // Continuar con la eliminación de la base de datos aunque falle el archivo
        }
      }
      
      // Eliminar la imagen de la base de datos
      const result = await storage.deleteParkImage(imageId);
      
      if (!result) {
        console.log(`❌ DELETE: No se pudo eliminar imagen ${imageId} de la base de datos`);
        return res.status(404).json({ message: "Image not found in database" });
      }
      
      console.log(`✅ DELETE: Imagen ${imageId} eliminada exitosamente`);
      res.status(204).send();
    } catch (error) {
      console.error(`💥 DELETE: Error eliminando imagen ${req.params.imageId}:`, error);
      res.status(500).json({ message: "Error removing image" });
    }
  });

  // ARREGLAR: Establecer imagen principal (la ruta que el frontend espera)
  apiRouter.post('/park-images/:id/set-primary', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const imageId = parseInt(req.params.id);
      console.log(`🔧 [FIX] Estableciendo imagen ${imageId} como principal`);
      
      // Obtener la imagen para verificar que existe y obtener el parkId
      const image = await storage.getParkImage(imageId);
      if (!image) {
        console.log(`❌ [FIX] Imagen ${imageId} no encontrada`);
        return res.status(404).json({ error: 'Imagen no encontrada' });
      }
      
      const parkId = image.parkId;
      console.log(`🔧 [FIX] Imagen pertenece al parque ${parkId}`);
      
      // Desmarcar todas las imágenes como principales para este parque
      const parkImages = await storage.getParkImages(parkId);
      for (const parkImage of parkImages) {
        if (parkImage.isPrimary) {
          await storage.updateParkImage(parkImage.id, { isPrimary: false });
        }
      }
      console.log(`🔧 [FIX] Desmarcadas todas las imágenes principales del parque ${parkId}`);
      
      // Marcar esta imagen como principal
      const updatedImage = await storage.updateParkImage(imageId, { isPrimary: true });
      
      console.log(`✅ [FIX] Imagen ${imageId} establecida como principal:`, updatedImage);
      res.json({ 
        message: 'Imagen establecida como principal',
        image: updatedImage
      });
      
    } catch (error) {
      console.error('❌ [FIX] Error estableciendo imagen principal:', error);
      res.status(500).json({ error: 'Error al establecer imagen principal' });
    }
  });
  
  // Eliminar documento de parque (producción)
  apiRouter.delete("/park-documents/:documentId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const documentId = Number(req.params.documentId);
      console.log(`🗑️ DELETE /park-documents/${documentId} - Iniciando eliminación`);
      console.log(`🔍 Usuario autenticado:`, { id: req.user.id, role: req.user.role });
      
      // Verificamos que el documento existe y obtenemos su parkId
      const document = await storage.getDocument(documentId);
      if (!document) {
        console.log(`❌ Documento ${documentId} no encontrado`);
        return res.status(404).json({ message: "Document not found" });
      }
      
      console.log(`📋 Documento encontrado:`, { id: document.id, parkId: document.parkId, title: document.title });

      console.log(`✅ Permisos verificados, procediendo a eliminar documento ${documentId}`);
      const result = await storage.deleteDocument(documentId);
      
      if (!result) {
        console.log(`❌ No se pudo eliminar el documento ${documentId}`);
        return res.status(404).json({ message: "Document not found" });
      }
      
      console.log(`✅ Documento ${documentId} eliminado exitosamente`);
      res.status(204).send();
    } catch (error) {
      console.error(`❌ Error eliminando documento ${req.params.documentId}:`, error);
      res.status(500).json({ message: "Error removing document from park" });
    }
  });

  // Get all documents
  apiRouter.get("/documents", async (_req: Request, res: Response) => {
    try {
      // Configuramos explícitamente el tipo de contenido para asegurar respuesta JSON
      res.setHeader('Content-Type', 'application/json');
      
      const documents = await storage.getAllDocuments();
      
      // Usamos res.send() directamente con el objeto JSON serializado
      res.send(JSON.stringify(documents));
    } catch (error) {
      console.error('Error fetching documents:', error);
      
      // También aseguramos tipo de contenido JSON para errores
      res.status(500)
         .setHeader('Content-Type', 'application/json')
         .send(JSON.stringify({ message: "Error fetching documents" }));
    }
  });

  // ================= VIDEO ROUTES =================
  
  // Get videos for a specific park
  apiRouter.get("/parks/:id/videos", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      console.log(`🔧 DIRECT VIDEOS API: Consultando videos para parque ${parkId}`);
      
      const result = await pool.query(`
        SELECT * FROM park_videos 
        WHERE park_id = $1 
        ORDER BY is_featured DESC, created_at DESC
      `, [parkId]);
      
      console.log(`✅ DIRECT VIDEOS API: Videos encontrados: ${result.rows.length}`);
      console.log(`📋 DIRECT VIDEOS API: Datos:`, result.rows);
      
      res.json(result.rows);
    } catch (error) {
      console.error(`❌ DIRECT VIDEOS API: Error consultando videos para parque ${req.params.id}:`, error);
      res.status(500).json({ message: "Error fetching park videos" });
    }
  });

  // Add a video to a park (file upload or URL)
  apiRouter.post("/parks/:id/videos", isAuthenticated, hasParkAccess, videoUpload.single('video'), async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      console.log(`🔍 POST /parks/${parkId}/videos - DETAILED DEBUG:`);
      console.log(`  - Request body:`, req.body);
      console.log(`  - Request file:`, req.file);
      console.log(`  - Content-Type:`, req.headers['content-type']);
      
      let videoData;
      
      if (req.file) {
        // Video file uploaded
        videoData = {
          parkId,
          title: req.body.title,
          description: req.body.description || '',
          videoUrl: `/uploads/videos/${req.file.filename}`,
          videoType: 'file',
          isFeatured: req.body.isFeatured === 'true',
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        };
        console.log(`🎬 Video file uploaded:`, req.file);
      } else if (req.body.videoUrl) {
        // Video URL provided
        let videoType = 'external';
        const url = req.body.videoUrl;
        
        // Detect video type from URL
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          videoType = 'youtube';
        } else if (url.includes('vimeo.com')) {
          videoType = 'vimeo';
        }
        
        videoData = {
          parkId,
          title: req.body.title,
          description: req.body.description || '',
          videoUrl: req.body.videoUrl,
          videoType,
          isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
          fileSize: null,
          mimeType: null
        };
        console.log(`🔗 Video URL provided:`, req.body.videoUrl);
      } else {
        return res.status(400).json({ 
          message: "Se requiere un archivo de video o una URL de video.",
          error: "MISSING_VIDEO_DATA"
        });
      }
      
      console.log(`🔍 Parsed video data:`, videoData);
      
      // Validate required fields
      if (!videoData.title || !videoData.videoUrl) {
        return res.status(400).json({ 
          message: "Campos requeridos faltantes: title, videoUrl",
          missing: {
            title: !videoData.title,
            videoUrl: !videoData.videoUrl
          },
          received: videoData
        });
      }
      
      // If this video is marked as featured, remove featured flag from other videos
      if (videoData.isFeatured) {
        await pool.query(`
          UPDATE park_videos 
          SET is_featured = false 
          WHERE park_id = $1 AND is_featured = true
        `, [parkId]);
      }
      
      // Insert the new video
      const result = await pool.query(`
        INSERT INTO park_videos (
          park_id, title, description, video_url, video_type, 
          is_featured, file_size, mime_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        videoData.parkId,
        videoData.title,
        videoData.description,
        videoData.videoUrl,
        videoData.videoType,
        videoData.isFeatured,
        videoData.fileSize,
        videoData.mimeType
      ]);
      
      console.log(`✅ Video added successfully:`, result.rows[0]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(`❌ Server error for POST /parks/${req.params.id}/videos:`, error);
      res.status(500).json({ message: "Error adding video to park" });
    }
  });

  // Set a video as featured
  apiRouter.post("/park-videos/:videoId/set-featured", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = Number(req.params.videoId);
      
      // Get the video to check park access
      const videoResult = await pool.query(`
        SELECT park_id FROM park_videos WHERE id = $1
      `, [videoId]);
      
      if (videoResult.rows.length === 0) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      const parkId = videoResult.rows[0].park_id;
      
      // Remove featured flag from other videos in the same park
      await pool.query(`
        UPDATE park_videos 
        SET is_featured = false 
        WHERE park_id = $1 AND is_featured = true
      `, [parkId]);
      
      // Set this video as featured
      const result = await pool.query(`
        UPDATE park_videos 
        SET is_featured = true 
        WHERE id = $1
        RETURNING *
      `, [videoId]);
      
      console.log(`✅ Video ${videoId} set as featured for park ${parkId}`);
      res.json(result.rows[0]);
    } catch (error) {
      console.error(`❌ Error setting featured video ${req.params.videoId}:`, error);
      res.status(500).json({ message: "Error setting featured video" });
    }
  });

  // Delete a video
  apiRouter.delete("/park-videos/:videoId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const videoId = Number(req.params.videoId);
      console.log(`🗑️ DELETE /park-videos/${videoId} - Iniciando eliminación`);
      
      // Check if video exists
      const videoResult = await pool.query(`
        SELECT pv.* 
        FROM park_videos pv
        JOIN parks p ON pv.park_id = p.id
        WHERE pv.id = $1
      `, [videoId]);
      
      if (videoResult.rows.length === 0) {
        console.log(`❌ Video ${videoId} no encontrado`);
        return res.status(404).json({ message: "Video not found" });
      }
      
      const video = videoResult.rows[0];
      console.log(`🎬 Video encontrado:`, { id: video.id, parkId: video.park_id, title: video.title });
      
      // Delete the video
      const deleteResult = await pool.query(`
        DELETE FROM park_videos WHERE id = $1 RETURNING *
      `, [videoId]);
      
      if (deleteResult.rows.length === 0) {
        console.log(`❌ No se pudo eliminar el video ${videoId}`);
        return res.status(404).json({ message: "Video not found" });
      }
      
      console.log(`✅ Video ${videoId} eliminado exitosamente`);
      res.json({ message: "Video eliminado correctamente", video: deleteResult.rows[0] });
    } catch (error) {
      console.error(`❌ Error eliminando video ${req.params.videoId}:`, error);
      res.status(500).json({ message: "Error eliminating video" });
    }
  });

  // Get all activities
  // REMOVIDO - Endpoint duplicado reemplazado por el siguiente

  // Get activities for a specific park
  apiRouter.get("/parks/:id/activities", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const activities = await storage.getParkActivities(parkId);
      res.json(activities);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching park activities" });
    }
  });
  
  // Endpoint NUEVO para obtener todas las actividades con imágenes
  apiRouter.get("/actividades-fotos", async (_req: Request, res: Response) => {
    try {
      console.log("Obteniendo todas las actividades con imágenes");
      
      const { pool } = await import("./db");
      
      const result = await pool.query(`
        SELECT 
          a.id,
          a.title,
          a.description,
          a.start_date as "startDate",
          a.end_date as "endDate",
          a.category,
          a.category_id as "categoryId",
          a.park_id as "parkId",
          a.location,
          a.capacity,
          a.price,
          a.instructor_id as "instructorId",
          a.created_at as "createdAt",
          a.materials,
          a.requirements,
          a.duration,
          a.is_recurring as "isRecurring",
          a.recurring_days as "recurringDays",
          a.target_market as "targetMarket",
          a.special_needs as "specialNeeds",
          a.is_free as "isFree",
          a.status,
          p.name as "parkName",
          c.name as "categoryName",
          i.full_name as "instructorName",
          img.image_url as "imageUrl",
          img.caption as "imageCaption"
        FROM activities a
        LEFT JOIN parks p ON a.park_id = p.id
        LEFT JOIN activity_categories c ON a.category_id = c.id
        LEFT JOIN instructors i ON a.instructor_id = i.id
        LEFT JOIN (
          SELECT DISTINCT ON (activity_id) 
            activity_id, 
            image_url,
            caption
          FROM activity_images 
          ORDER BY activity_id, is_primary DESC, created_at DESC
        ) img ON a.id = img.activity_id
        ORDER BY a.created_at DESC
      `);
      
      const activities = result.rows.map(row => {
        // Procesar targetMarket y specialNeeds de manera consistente
        let targetMarket = row.targetMarket;
        let specialNeeds = row.specialNeeds;
        let recurringDays = row.recurringDays;
        
        if (targetMarket && typeof targetMarket === 'string') {
          try {
            targetMarket = JSON.parse(targetMarket);
          } catch (e) {
            targetMarket = [targetMarket]; // Si no es JSON válido, convertir a array
          }
        }
        if (!Array.isArray(targetMarket)) {
          targetMarket = targetMarket ? [targetMarket] : [];
        }
        
        if (specialNeeds && typeof specialNeeds === 'string') {
          try {
            specialNeeds = JSON.parse(specialNeeds);
          } catch (e) {
            specialNeeds = [specialNeeds]; // Si no es JSON válido, convertir a array
          }
        }
        if (!Array.isArray(specialNeeds)) {
          specialNeeds = specialNeeds ? [specialNeeds] : [];
        }
        
        if (recurringDays && typeof recurringDays === 'string') {
          try {
            recurringDays = JSON.parse(recurringDays);
          } catch (e) {
            recurringDays = [recurringDays]; // Si no es JSON válido, convertir a array
          }
        }
        if (!Array.isArray(recurringDays)) {
          recurringDays = recurringDays ? [recurringDays] : [];
        }
        
        return {
          id: row.id,
          title: row.title,
          description: row.description,
          startDate: row.startDate,
          endDate: row.endDate,
          category: row.categoryName || row.category,
          categoryId: row.categoryId,
          parkId: row.parkId,
          parkName: row.parkName,
          location: row.location,
          capacity: row.capacity || 0,
          price: row.price || 0,
          instructorId: row.instructorId,
          instructorName: row.instructorName,
          imageUrl: row.imageUrl,
          imageCaption: row.imageCaption,
          materials: row.materials,
          requirements: row.requirements,
          duration: row.duration,
          isRecurring: row.isRecurring,
          recurringDays: recurringDays,
          targetMarket: targetMarket,
          specialNeeds: specialNeeds,
          isFree: row.isFree,
          status: row.status
        };
      });
      
      console.log(`🎯 Actividades encontradas: ${activities.length}`);
      console.log(`🎯 Actividades con imagen: ${activities.filter(a => a.imageUrl).length}`);
      res.json(activities);
    } catch (error) {
      console.error("🎯 Error al obtener actividades:", error);
      res.status(500).json({ message: "Error al recuperar actividades" });
    }
  });

  // Helper function para mapear categorías
  const mapCategoryToName = (categoryId: any, categoryString: any): string => {
    const categoryMapping: { [key: string]: string } = {
      '1': 'Deportivo',
      '2': 'Recreación y Bienestar',
      '3': 'Arte y Cultura',
      '4': 'Naturaleza y Ciencia',
      '5': 'Comunidad',
      '6': 'Eventos de Temporada'
    };
    
    // Prioridad: category_id -> category si es string numérico -> category normal
    if (categoryId) return categoryMapping[categoryId.toString()] || 'Recreación y Bienestar';
    if (categoryMapping[categoryString]) return categoryMapping[categoryString];
    return categoryString || 'Recreación y Bienestar';
  };

  // Endpoint directo para crear actividades - SIN AUTENTICACIÓN TEMPORAL
  apiRouter.post("/activities", async (req: Request, res: Response) => {
    console.log("🔥🔥🔥 ENDPOINT ACTIVITIES EJECUTÁNDOSE EN ROUTES.TS 🔥🔥🔥");
    
    try {
      console.log("🔥 INICIO POST /api/activities EN EL ENDPOINT PRINCIPAL");
      console.log("🔥 Body completo recibido:", JSON.stringify(req.body, null, 2));
      
      // Log de depuración más detallado
      console.log("startDate recibido:", req.body.startDate, "tipo:", typeof req.body.startDate);
      console.log("endDate recibido:", req.body.endDate, "tipo:", typeof req.body.endDate);
      console.log("categoryId recibido:", req.body.categoryId, "tipo:", typeof req.body.categoryId);
      console.log("price recibido:", req.body.price, "tipo:", typeof req.body.price);
      console.log("latitude recibido:", req.body.latitude, "tipo:", typeof req.body.latitude);
      console.log("longitude recibido:", req.body.longitude, "tipo:", typeof req.body.longitude);
      
      // Mapear campos del frontend al esquema de base de datos
      const {
        title,
        description,
        category,
        categoryId: category_id,
        parkId,
        startDate,
        endDate,
        startTime,
        endTime,
        location,
        latitude,
        longitude,
        instructorId,
        duration,
        capacity,
        price,
        isPriceRandom,
        isFree,
        materials,
        requirements,
        isRecurring,
        recurringDays,
        targetMarket,
        specialNeeds,
        allowsPublicRegistration,
        maxRegistrations,
        registrationDeadline,
        registrationInstructions,
        requiresApproval,
        ageRestrictions,
        healthRequirements,
        requiredStaff,
        ...otherData
      } = req.body;
      
      // Usar helper function para mapear categoría
      const finalCategory = mapCategoryToName(category_id, category);
      
      // Convertir las fechas explícitamente a objetos Date
      let parsedStartDate: Date;
      let parsedEndDate: Date | undefined;
      
      console.log("Procesando fechas - startDate:", startDate, "tipo:", typeof startDate);
      console.log("Procesando fechas - endDate:", endDate, "tipo:", typeof endDate);
      
      try {
        // Si viene como string ISO, parsearlo; si ya es Date, usarlo directamente
        parsedStartDate = typeof startDate === 'string' ? new Date(startDate) : startDate;
        if (endDate) {
          parsedEndDate = typeof endDate === 'string' ? new Date(endDate) : endDate;
        }
        
        console.log("Fechas parseadas - parsedStartDate:", parsedStartDate);
        console.log("Fechas parseadas - parsedEndDate:", parsedEndDate);
        
      } catch (e) {
        console.error("Error al convertir fechas:", e);
        return res.status(400).json({ message: "Formato de fecha inválido" });
      }
      
      // Verificar que la fecha de inicio es válida
      if (!parsedStartDate || isNaN(parsedStartDate.getTime())) {
        console.error("Fecha de inicio inválida:", parsedStartDate);
        return res.status(400).json({ message: "La fecha de inicio no es válida" });
      }
      
      // Verificar que la fecha de fin es válida (si existe)
      if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
        console.error("Fecha de fin inválida:", parsedEndDate);
        return res.status(400).json({ message: "La fecha de fin no es válida" });
      }
      
      // Crear el objeto con los datos procesados y mapeados (incluye TODOS los campos del esquema)
      const activityData = { 
        title,
        description,
        category: finalCategory || 'Recreación y Bienestar', // Categoría por defecto si no se especifica
        categoryId: category_id ? Number(category_id) : null,
        parkId: Number(parkId),
        startDate: parsedStartDate,
        startTime: startTime || null,
        endTime: endTime || null,
        location: location || null,
        latitude: latitude || null,
        longitude: longitude || null,
        instructorId: instructorId || null,
        duration: duration ? parseInt(duration) : null,
        capacity: capacity ? parseInt(capacity) : null,
        price: price ? price.toString() : null,
        isPriceRandom: Boolean(isPriceRandom),
        isFree: Boolean(isFree),
        materials: materials || null,
        requirements: requirements || null,
        isRecurring: Boolean(isRecurring),
        recurringDays: recurringDays || null,
        targetMarket: targetMarket || null,
        specialNeeds: specialNeeds || null,
        allowsPublicRegistration: Boolean(allowsPublicRegistration),
        maxRegistrations: maxRegistrations ? parseInt(maxRegistrations) : null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        registrationInstructions: registrationInstructions || null,
        requiresApproval: Boolean(requiresApproval),
        ageRestrictions: ageRestrictions || null,
        healthRequirements: healthRequirements || null,
        requiredStaff: requiredStaff ? parseInt(requiredStaff) : null,
        ...(parsedEndDate && { endDate: parsedEndDate })
      };
      
      console.log("🚀 DATOS FINALES COMPLETOS ANTES DE ZOD:");
      console.log("- title:", activityData.title);
      console.log("- categoryId:", activityData.categoryId);
      console.log("- price:", activityData.price);
      console.log("- latitude:", activityData.latitude);
      console.log("- longitude:", activityData.longitude);
      console.log("- startTime:", activityData.startTime);
      console.log("- endTime:", activityData.endTime);
      console.log("- capacity:", activityData.capacity);
      console.log("- targetMarket:", activityData.targetMarket);
      console.log("- specialNeeds:", activityData.specialNeeds);
      console.log("- maxRegistrations:", activityData.maxRegistrations);
      console.log("Intentando crear actividad en base de datos...");
      
      console.log("Datos procesados para creación de actividad:", activityData);
      console.log("parsedStartDate:", parsedStartDate, "isValid:", !isNaN(parsedStartDate.getTime()));
      console.log("parsedEndDate:", parsedEndDate, "isValid:", parsedEndDate ? !isNaN(parsedEndDate.getTime()) : 'no endDate');
      
      try {
        console.log("Intentando validar con Zod schema...");
        const data = insertActivitySchema.parse(activityData);
        console.log("Validación Zod exitosa:", data);
        const result = await storage.createActivity(data);
        console.log("Actividad creada exitosamente:", result);
        res.status(201).json(result);
      } catch (zodError) {
        console.error("Error de validación Zod:", zodError);
        console.error("Datos que fallaron validación:", JSON.stringify(activityData, null, 2));
        return res.status(400).json({ 
          message: "Error de validación de datos",
          error: (zodError as any).issues || (zodError as Error).message
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.error("Error de validación Zod detallado:", error.errors);
        console.error("Mensaje de error:", validationError.message);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors 
        });
      }
      console.error("Error al crear actividad:", error);
      res.status(500).json({ message: "Error al crear actividad" });
    }
  });

  // Import activities from CSV (bulk import)
  apiRouter.post("/activities/import", async (req: Request, res: Response) => {
    try {
      console.log("📥 POST /api/activities/import - Iniciando importación de actividades");
      
      if (!req.body.activities || !Array.isArray(req.body.activities)) {
        return res.status(400).json({ 
          success: false, 
          error: "Se requiere un array de actividades en req.body.activities" 
        });
      }

      const activitiesData = req.body.activities;
      console.log(`📊 Procesando ${activitiesData.length} actividades para importar`);

      let importedCount = 0;
      let errors = [];

      for (let i = 0; i < activitiesData.length; i++) {
        try {
          const activityData = activitiesData[i];
          console.log(`🔧 Procesando actividad ${i + 1}:`, activityData.title);

          // Validar con Zod schema
          const validatedData = insertActivitySchema.parse(activityData);
          
          // Crear actividad usando storage
          const result = await storage.createActivity(validatedData);
          importedCount++;
          
          console.log(`✅ Actividad ${i + 1} creada exitosamente: ${result.id}`);
          
        } catch (error) {
          console.error(`❌ Error procesando actividad ${i + 1}:`, error);
          errors.push({
            index: i + 1,
            title: activitiesData[i]?.title || 'Sin título',
            error: error instanceof ZodError 
              ? `Validación: ${error.issues.map(issue => issue.message).join(', ')}`
              : (error as Error).message
          });
        }
      }

      console.log(`✅ Importación completada: ${importedCount} actividades importadas`);
      console.log(`❌ Errores encontrados: ${errors.length}`);

      // La invalidación del cache se maneja en el frontend después de recibir la respuesta exitosa

      res.json({
        success: true,
        message: `Importación completada: ${importedCount} actividades importadas exitosamente`,
        imported: importedCount,
        errors: errors,
        processed: activitiesData.length
      });

    } catch (error) {
      console.error('❌ Error general en importación de actividades:', error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor durante la importación",
        message: (error as Error).message
      });
    }
  });

  // Import volunteers from CSV (bulk import)
  apiRouter.post("/volunteers/import", async (req: Request, res: Response) => {
    try {
      console.log("📥 POST /api/volunteers/import - Iniciando importación de voluntarios");
      console.log("📊 BODY SIZE:", JSON.stringify(req.body || {}).length);
      console.log("📊 BODY KEYS:", Object.keys(req.body || {}));
      
      if (!req.body.volunteers || !Array.isArray(req.body.volunteers)) {
        console.log("❌ Error: No se encontró array de voluntarios en req.body");
        console.log("📊 Contenido completo de req.body:", JSON.stringify(req.body, null, 2));
        return res.status(400).json({ 
          success: false, 
          error: "Se requiere un array de voluntarios en req.body.volunteers" 
        });
      }

      const volunteersData = req.body.volunteers;
      console.log(`📊 Procesando ${volunteersData.length} voluntarios para importar`);

      let importedCount = 0;
      let errors = [];

      for (let i = 0; i < volunteersData.length; i++) {
        try {
          const volunteerData = volunteersData[i];
          console.log(`🔧 Procesando voluntario ${i + 1}:`, volunteerData.fullName || volunteerData.full_name);

          // Validar con Zod schema
          const validatedData = insertVolunteerSchema.parse(volunteerData);
          
          // Crear voluntario usando Drizzle directamente
          const result = await db.insert(volunteers).values(validatedData).returning();
          importedCount++;
          
          console.log(`✅ Voluntario ${i + 1} creado exitosamente: ${result.id}`);
          
        } catch (error) {
          console.error(`❌ Error procesando voluntario ${i + 1}:`, error);
          errors.push({
            index: i + 1,
            name: volunteersData[i]?.fullName || volunteersData[i]?.full_name || 'Sin nombre',
            error: error instanceof ZodError 
              ? `Validación: ${error.issues.map(issue => issue.message).join(', ')}`
              : (error as Error).message
          });
        }
      }

      console.log(`✅ Importación completada: ${importedCount} voluntarios importados`);
      console.log(`❌ Errores encontrados: ${errors.length}`);

      res.json({
        success: true,
        message: `Importación completada: ${importedCount} voluntarios importados exitosamente`,
        imported: importedCount,
        errors: errors,
        processed: volunteersData.length
      });

    } catch (error) {
      console.error('❌ Error general en importación de voluntarios:', error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor durante la importación",
        message: (error as Error).message
      });
    }
  });

  // Add an activity to a park (admin/municipality only)
  apiRouter.post("/parks/:id/activities", isAuthenticated, hasParkAccess, async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      console.log("Datos recibidos en POST /parks/:id/activities:", req.body);
      
      // Extraer los datos
      const { startDate, endDate, ...otherData } = req.body;
      
      // Convertir las fechas explícitamente a objetos Date
      let parsedStartDate: Date;
      let parsedEndDate: Date | undefined;
      
      try {
        parsedStartDate = new Date(startDate);
        if (endDate) {
          parsedEndDate = new Date(endDate);
        }
      } catch (e) {
        console.error("Error al convertir fechas:", e);
        return res.status(400).json({ message: "Formato de fecha inválido" });
      }
      
      // Verificar que la fecha de inicio es válida
      if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({ message: "La fecha de inicio no es válida" });
      }
      
      // Verificar que la fecha de fin es válida (si existe)
      if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ message: "La fecha de fin no es válida" });
      }
      
      // Crear el objeto con los datos procesados
      const activityData = { 
        ...otherData, 
        parkId,
        startDate: parsedStartDate,
        ...(parsedEndDate && { endDate: parsedEndDate })
      };
      
      console.log("Datos procesados:", activityData);
      
      const data = insertActivitySchema.parse(activityData);
      const result = await storage.createActivity(data);
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.error("Error de validación Zod:", error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error al crear actividad:", error);
      res.status(500).json({ message: "Error adding activity to park" });
    }
  });
  
  // Update an activity (admin/municipality only)
  apiRouter.put("/activities/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const activityId = Number(req.params.id);
      console.log("Datos recibidos en PUT /activities/:id:", req.body);
      
      // Verificar si la actividad existe
      const existingActivity = await storage.getActivity(activityId);
      if (!existingActivity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }
      
      // En desarrollo, permitimos actualizar cualquier actividad
      // TODO: Implementar verificación de permisos más estricta en producción
      
      // Extraer los datos
      const { startDate, endDate, parkId, category, category_id, ...otherData } = req.body;
      
      // Usar helper function para mapear categoría
      const finalCategory = mapCategoryToName(category_id, category);
      
      // Convertir las fechas explícitamente a objetos Date
      let parsedStartDate: Date;
      let parsedEndDate: Date | undefined;
      
      try {
        parsedStartDate = new Date(startDate);
        if (endDate) {
          parsedEndDate = new Date(endDate);
        }
      } catch (e) {
        console.error("Error al convertir fechas:", e);
        return res.status(400).json({ message: "Formato de fecha inválido" });
      }
      
      // Verificar que la fecha de inicio es válida
      if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({ message: "La fecha de inicio no es válida" });
      }
      
      // Verificar que la fecha de fin es válida (si existe)
      if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ message: "La fecha de fin no es válida" });
      }
      
      // Crear el objeto con los datos procesados
      const activityData = { 
        ...otherData,
        category: finalCategory,
        categoryId: category_id || null,
        startDate: parsedStartDate,
        ...(parsedEndDate && { endDate: parsedEndDate })
      };
      
      console.log("Datos procesados para actualización:", activityData);
      console.log("🔍 category_id recibido:", category_id);
      console.log("🔍 finalCategory calculada:", finalCategory);
      console.log("🔍 categoryId en activityData:", activityData.categoryId);
      console.log("🔍 CAMPOS DE INSCRIPCIONES:");
      console.log("  - registrationEnabled:", activityData.registrationEnabled);
      console.log("  - maxRegistrations:", activityData.maxRegistrations);
      console.log("  - registrationDeadline:", activityData.registrationDeadline);
      console.log("  - requiresApproval:", activityData.requiresApproval);
      
      // Validar los datos
      console.log("🔄 [ROUTES.TS] Llamando a storage.updateActivity con ID:", activityId);
      const result = await storage.updateActivity(activityId, activityData);
      console.log("🎉 [ROUTES.TS] Resultado de updateActivity:", result);
      
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.error("Error de validación Zod:", error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error al actualizar actividad:", error);
      res.status(500).json({ message: "Error actualizando actividad" });
    }
  });
  
  // Delete an activity (admin/municipality only)
  apiRouter.delete("/activities/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const activityId = Number(req.params.id);
      
      // Verificar si la actividad existe
      const existingActivity = await storage.getActivity(activityId);
      if (!existingActivity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }
      
      // En desarrollo, permitimos eliminar cualquier actividad
      // TODO: Implementar verificación de permisos más estricta en producción
      
      await storage.deleteActivity(activityId);
      
      res.status(200).json({ success: true, message: "Actividad eliminada correctamente" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error eliminando actividad" });
    }
  });

  // Get comments for a specific park
  apiRouter.get("/parks/:id/comments", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const approvedOnly = req.query.approvedOnly === 'true';
      
      const comments = await storage.getParkComments(parkId, approvedOnly);
      res.json(comments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching park comments" });
    }
  });

  // Add a comment to a park (public)
  apiRouter.post("/parks/:id/comments", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      
      const commentData = { ...req.body, parkId, approved: autoApprove };
      
      const data = insertCommentSchema.parse(commentData);
      const result = await storage.createComment(data);
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error(error);
      res.status(500).json({ message: "Error adding comment to park" });
    }
  });

  // Get all comments (admin only)
  apiRouter.get("/comments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Obtenemos los parámetros de filtrado
      const approvedFilter = req.query.approved;
      
      // Consultamos los comentarios de la base de datos
      let allComments;
      
      if (approvedFilter === 'true') {
        allComments = await storage.getAllComments(true);
      } else if (approvedFilter === 'false') {
        allComments = await storage.getAllComments(false);
      } else {
        allComments = await storage.getAllComments();
      }
      
      // Para devolver un formato consistente con lo que espera la UI, obtenemos los detalles
      // de los parques relacionados con estos comentarios
      const parkIds = [...new Set(allComments.map(comment => comment.parkId))];
      const parks = await Promise.all(
        parkIds.map(async (parkId) => {
          const park = await storage.getPark(parkId);
          return park ? { id: park.id, name: park.name } : null;
        })
      );
      
      // Añadimos la información del parque a cada comentario
      const commentsWithParkInfo = allComments.map(comment => {
        const parkInfo = parks.find(p => p && p.id === comment.parkId);
        return {
          ...comment,
          park: parkInfo
        };
      });
      
      // Devolvemos los comentarios con la información de parque incluida
      res.json(commentsWithParkInfo);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: "Error fetching comments" });
    }
  });
  
  // Approve a comment (admin/municipality only)
  apiRouter.put("/comments/:id/approve", async (req: Request, res: Response) => {
    try {
      const commentId = Number(req.params.id);
      
      // Verificamos que el comentario exista
      const comment = await storage.getComment(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comentario no encontrado" });
      }
      
      // En desarrollo, permitimos aprobar cualquier comentario 
      // Cuando el sistema esté en producción, podemos volver a implementar
      // la verificación de permisos más estricta
      
      // Actualizamos el comentario en la base de datos
      const updatedComment = await storage.approveComment(commentId);
      
      // Obtenemos información del parque para mantener el formato consistente
      const park = await storage.getPark(comment.parkId);
      
      // Respondemos con el comentario aprobado y la info del parque
      res.json({
        ...updatedComment,
        park: park ? { id: park.id, name: park.name } : null
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error approving comment" });
    }
  });
  
  // Delete a comment (admin/municipality only)
  apiRouter.delete("/comments/:id", async (req: Request, res: Response) => {
    try {
      const commentId = Number(req.params.id);
      
      // Verificamos que el comentario exista
      const comment = await storage.getComment(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comentario no encontrado" });
      }
      
      // En desarrollo, permitimos eliminar cualquier comentario
      // Cuando el sistema esté en producción, podemos volver a implementar
      // la verificación de permisos más estricta
      
      // Eliminamos el comentario de la base de datos
      await storage.deleteComment(commentId);
      
      // Respondemos con confirmación de eliminación
      res.json({ success: true, message: "Comentario eliminado correctamente" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error eliminando comentario" });
    }
  });

  // Report an incident for a park (public)
  apiRouter.post("/parks/:id/incidents", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const incidentData = { ...req.body, parkId };
      
      const data = insertIncidentSchema.parse(incidentData);
      const result = await storage.createIncident(data);
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error(error);
      res.status(500).json({ message: "Error reporting incident" });
    }
  });
  
  // Get incidents statistics
  apiRouter.get("/incidents/stats", async (req: Request, res: Response) => {
    try {
      console.log("📊 GET /api/incidents/stats - Obteniendo estadísticas de incidencias");
      
      const { pool } = await import("./db");
      
      // Obtener estadísticas básicas de incidencias
      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low_severity,
          SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium_severity,
          SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_severity,
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_severity
        FROM incidents
      `;
      
      const result = await pool.query(statsQuery);
      const stats = result.rows[0];
      
      // Convertir los valores a números
      const formattedStats = {
        total: parseInt(stats.total),
        pending: parseInt(stats.pending),
        in_progress: parseInt(stats.in_progress),
        resolved: parseInt(stats.resolved),
        severity: {
          low: parseInt(stats.low_severity),
          medium: parseInt(stats.medium_severity),
          high: parseInt(stats.high_severity),
          critical: parseInt(stats.critical_severity)
        }
      };
      
      console.log("📊 Estadísticas obtenidas:", formattedStats);
      res.json(formattedStats);
    } catch (error) {
      console.error("Error obteniendo estadísticas de incidencias:", error);
      res.status(500).json({ message: "Error obteniendo estadísticas de incidencias" });
    }
  });

  // Get all incidents
  apiRouter.get("/incidents", async (req: Request, res: Response) => {
    try {
      console.log("📣 RECIBIDA PETICIÓN DE INCIDENTES:", req.headers);
      const parkId = req.query.parkId ? Number(req.query.parkId) : undefined;
      
      // Construir consulta SQL para obtener incidentes reales de la base de datos
      let query = `
        SELECT 
          i.id,
          i.asset_id as "assetId",
          i.park_id as "parkId",
          i.title,
          i.description,
          i.status,
          i.severity,
          i.reporter_name as "reporterName",
          i.reporter_email as "reporterEmail",
          i.location,
          i.category,
          i.created_at as "createdAt",
          i.updated_at as "updatedAt",
          p.name as "parkName",
          a.name as "assetName"
        FROM incidents i
        LEFT JOIN parks p ON i.park_id = p.id
        LEFT JOIN assets a ON i.asset_id = a.id
        WHERE 1=1
      `;
      
      const params = [];
      
      // Si se especificó un parkId, filtramos por ese parque
      if (parkId) {
        query += " AND i.park_id = $1";
        params.push(parkId);
      }
      
      query += " ORDER BY i.created_at DESC";
      
      console.log("🔍 Ejecutando consulta SQL:", query);
      console.log("🔍 Parámetros:", params);
      
      const result = await pool.query(query, params);
      
      // Formatear datos para incluir información del parque
      const incidents = result.rows.map(row => ({
        id: row.id,
        assetId: row.assetId,
        parkId: row.parkId,
        title: row.title,
        description: row.description,
        status: row.status,
        severity: row.severity,
        reporterName: row.reporterName,
        reporterEmail: row.reporterEmail,
        location: row.location,
        category: row.category,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        parkName: row.parkName,
        assetName: row.assetName,
        park: {
          id: row.parkId,
          name: row.parkName
        },
        asset: row.assetId ? {
          id: row.assetId,
          name: row.assetName
        } : null
      }));
      
      console.log("✅ Incidentes encontrados en BD:", incidents.length);
      
      return res.json(incidents);
    } catch (error) {
      console.error("Error obteniendo incidentes:", error);
      return res.status(500).json({ message: "Error al obtener incidentes" });
    }
  });

  // Create a new incident with comprehensive fields (4 sections)
  apiRouter.post("/incidents", async (req: Request, res: Response) => {
    try {
      console.log("📝 CREANDO NUEVA INCIDENCIA CON CAMPOS COMPLETOS:", req.body);
      
      const {
        // Campos existentes
        title,
        description,
        assetId,
        parkId,
        categoryId,
        severity = 'medium',
        location,
        reporterName,
        reporterEmail,
        reporterPhone,
        status = 'pending',
        
        // === INFORMACIÓN DE LA INCIDENCIA ===
        incidenciaId,
        fechaReporte,
        fechaOcurrencia,
        tipoAfectacion,
        nivelRiesgo,
        descripcionDetallada,
        ubicacionGps,
        activoId,
        
        // === SEGUIMIENTO OPERATIVO ===
        departamentoResponsable,
        responsableAsignado,
        fechaAsignacion,
        fechaInicioAtencion,
        fechaResolucion,
        accionesRealizadas,
        materialesUtilizados,
        costoEstimado,
        costoReal,
        fuenteFinanciamiento,
        
        // === CONTROL Y CALIDAD ===
        estatusValidacion = 'pendiente',
        supervisorValidador,
        comentariosSupervision,
        satisfaccionUsuario,
        seguimientoPostResolucion,
        frecuenciaIncidente,
        
        // === DIMENSIÓN COMUNITARIA Y AMBIENTAL ===
        afectacionUsuarios = false,
        numeroPersonasAfectadas,
        afectacionMedioambiental,
        participacionVoluntarios = false,
        numeroVoluntarios,
        grupoVoluntarios,
        reporteComunidad,
      } = req.body;
      
      // Validar campos requeridos básicos
      if (!title || !tipoAfectacion || !nivelRiesgo || !parkId || !reporterName) {
        return res.status(400).json({
          message: "Faltan campos requeridos: title, tipoAfectacion, nivelRiesgo, parkId, reporterName"
        });
      }
      
      // Insertar la nueva incidencia con todos los campos
      const query = `
        INSERT INTO incidents (
          -- Campos existentes
          title, description, asset_id, park_id, category, severity, 
          location, reporter_name, reporter_email, reporter_phone, 
          status, created_at, updated_at,
          
          -- INFORMACIÓN DE LA INCIDENCIA
          incidencia_id, fecha_reporte, fecha_ocurrencia, tipo_afectacion, 
          nivel_riesgo, descripcion_detallada, ubicacion_gps, activo_id,
          
          -- SEGUIMIENTO OPERATIVO
          departamento_responsable, responsable_asignado, fecha_asignacion,
          fecha_inicio_atencion, fecha_resolucion, acciones_realizadas,
          materiales_utilizados, costo_estimado, costo_real, fuente_financiamiento,
          
          -- CONTROL Y CALIDAD
          estatus_validacion, supervisor_validador, comentarios_supervision,
          satisfaccion_usuario, seguimiento_post_resolucion, frecuencia_incidente,
          
          -- DIMENSIÓN COMUNITARIA Y AMBIENTAL
          afectacion_usuarios, numero_personas_afectadas, afectacion_medioambiental,
          participacion_voluntarios, numero_voluntarios, grupo_voluntarios, reporte_comunidad
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW(),
          $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
          $30, $31, $32, $33, $34, $35,
          $36, $37, $38, $39, $40, $41, $42
        ) RETURNING *
      `;
      
      const values = [
        // Campos existentes (1-11)
        title,
        description || descripcionDetallada, // Usar descripcionDetallada como fallback
        assetId || activoId || null,
        parkId,
        categoryId ? `category_${categoryId}` : null,
        severity,
        location || null,
        reporterName,
        reporterEmail || null,
        reporterPhone || null,
        status,
        
        // INFORMACIÓN DE LA INCIDENCIA (12-19)
        incidenciaId || null,
        fechaReporte ? new Date(fechaReporte) : new Date(),
        fechaOcurrencia ? new Date(fechaOcurrencia) : null,
        tipoAfectacion,
        nivelRiesgo,
        descripcionDetallada || null,
        ubicacionGps || null,
        activoId || assetId || null,
        
        // SEGUIMIENTO OPERATIVO (20-29)
        departamentoResponsable || null,
        responsableAsignado || null,
        fechaAsignacion ? new Date(fechaAsignacion) : null,
        fechaInicioAtencion ? new Date(fechaInicioAtencion) : null,
        fechaResolucion ? new Date(fechaResolucion) : null,
        accionesRealizadas || null,
        materialesUtilizados || null,
        costoEstimado || null,
        costoReal || null,
        fuenteFinanciamiento || null,
        
        // CONTROL Y CALIDAD (30-35)
        estatusValidacion,
        supervisorValidador || null,
        comentariosSupervision || null,
        satisfaccionUsuario || null,
        seguimientoPostResolucion || null,
        frecuenciaIncidente || null,
        
        // DIMENSIÓN COMUNITARIA Y AMBIENTAL (36-42)
        afectacionUsuarios,
        numeroPersonasAfectadas || null,
        afectacionMedioambiental || null,
        participacionVoluntarios,
        numeroVoluntarios || null,
        grupoVoluntarios || null,
        reporteComunidad || null
      ];
      
      console.log("🔍 Ejecutando INSERT COMPLETO:", query);
      console.log("🔍 Valores completos:", values);
      
      const result = await pool.query(query, values);
      const newIncident = result.rows[0];
      
      console.log("✅ Incidencia completa creada:", newIncident);
      
      // Obtener información adicional del parque y activo
      let enrichedIncident = { ...newIncident };
      
      // Obtener nombre del parque
      if (newIncident.park_id) {
        const parkQuery = await pool.query(
          "SELECT name FROM parks WHERE id = $1", 
          [newIncident.park_id]
        );
        if (parkQuery.rows.length > 0) {
          enrichedIncident.parkName = parkQuery.rows[0].name;
        }
      }
      
      // Obtener nombre del activo
      if (newIncident.asset_id || newIncident.activo_id) {
        const assetId = newIncident.asset_id || newIncident.activo_id;
        const assetQuery = await pool.query(
          "SELECT name FROM assets WHERE id = $1", 
          [assetId]
        );
        if (assetQuery.rows.length > 0) {
          enrichedIncident.assetName = assetQuery.rows[0].name;
        }
      }
      
      return res.status(201).json({
        id: enrichedIncident.id,
        assetId: enrichedIncident.asset_id,
        parkId: enrichedIncident.park_id,
        title: enrichedIncident.title,
        description: enrichedIncident.description,
        status: enrichedIncident.status,
        severity: enrichedIncident.severity,
        reporterName: enrichedIncident.reporter_name,
        reporterEmail: enrichedIncident.reporter_email,
        location: enrichedIncident.location,
        category: enrichedIncident.category,
        createdAt: enrichedIncident.created_at,
        updatedAt: enrichedIncident.updated_at,
        
        // Nuevos campos de las 4 secciones
        incidenciaId: enrichedIncident.incidencia_id,
        tipoAfectacion: enrichedIncident.tipo_afectacion,
        nivelRiesgo: enrichedIncident.nivel_riesgo,
        descripcionDetallada: enrichedIncident.descripcion_detallada,
        ubicacionGps: enrichedIncident.ubicacion_gps,
        departamentoResponsable: enrichedIncident.departamento_responsable,
        responsableAsignado: enrichedIncident.responsable_asignado,
        estatusValidacion: enrichedIncident.estatus_validacion,
        afectacionUsuarios: enrichedIncident.afectacion_usuarios,
        participacionVoluntarios: enrichedIncident.participacion_voluntarios,
        
        park: {
          id: enrichedIncident.park_id,
          name: enrichedIncident.parkName
        },
        asset: (enrichedIncident.asset_id || enrichedIncident.activo_id) ? {
          id: enrichedIncident.asset_id || enrichedIncident.activo_id,
          name: enrichedIncident.assetName
        } : null
      });
    } catch (error) {
      console.error("Error creando incidencia completa:", error);
      return res.status(500).json({ 
        message: "Error al crear la incidencia", 
        error: error.message,
        details: error.detail || null 
      });
    }
  });
  
  // Obtener una incidencia por ID
  apiRouter.get("/incidents/:id", async (req: Request, res: Response) => {
    try {
      const incidentId = Number(req.params.id);
      
      if (!incidentId || isNaN(incidentId)) {
        return res.status(400).json({ message: "ID de incidencia inválido" });
      }
      
      // Consulta directa a la base de datos
      const result = await pool.query(`
        SELECT 
          i.id,
          i.asset_id as "assetId",
          i.park_id as "parkId",
          i.title,
          i.description,
          i.status,
          i.severity,
          i.reporter_name as "reporterName",
          i.reporter_email as "reporterEmail",
          i.location,
          i.category,
          i.created_at as "createdAt",
          i.updated_at as "updatedAt",
          p.name as "parkName",
          a.name as "assetName"
        FROM incidents i
        LEFT JOIN parks p ON i.park_id = p.id
        LEFT JOIN assets a ON i.asset_id = a.id
        WHERE i.id = $1
      `, [incidentId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Incidencia no encontrada" });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error al obtener incidencia:', error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener comentarios de una incidencia
  apiRouter.get("/incidents/:id/comments", async (req: Request, res: Response) => {
    try {
      const incidentId = Number(req.params.id);
      
      if (!incidentId || isNaN(incidentId)) {
        return res.status(400).json({ message: "ID de incidencia inválido" });
      }
      
      const { pool } = await import("./db");
      
      const query = `
        SELECT 
          ic.id,
          ic.comment_text as "commentText",
          ic.is_internal as "isInternal",
          ic.is_public as "isPublic",
          ic.created_at as "createdAt",
          ic.updated_at as "updatedAt",
          u.full_name as "authorName",
          u.username as "authorUsername"
        FROM incident_comments ic
        LEFT JOIN users u ON ic.user_id = u.id
        WHERE ic.incident_id = $1
        ORDER BY ic.created_at ASC
      `;
      
      const result = await pool.query(query, [incidentId]);
      console.log(`📝 Encontrados ${result.rows.length} comentarios para incidencia ${incidentId}`);
      res.json(result.rows);
      
    } catch (error) {
      console.error('Error al obtener comentarios:', error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Agregar comentario a una incidencia
  apiRouter.post("/incidents/:id/comments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const incidentId = Number(req.params.id);
      const { commentText, isInternal = false, isPublic = true } = req.body;
      
      if (!incidentId || isNaN(incidentId)) {
        return res.status(400).json({ message: "ID de incidencia inválido" });
      }

      if (!commentText || commentText.trim().length === 0) {
        return res.status(400).json({ message: "El comentario no puede estar vacío" });
      }

      const { pool } = await import("./db");
      const userId = req.headers['x-user-id'] || 4;
      
      const query = `
        INSERT INTO incident_comments (incident_id, user_id, comment_text, is_internal, is_public, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING 
          id,
          comment_text as "commentText",
          is_internal as "isInternal",
          is_public as "isPublic",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      
      const result = await pool.query(query, [incidentId, userId, commentText.trim(), isInternal, isPublic]);
      
      // Registrar en el historial
      await pool.query(`
        INSERT INTO incident_history (incident_id, user_id, action_type, notes, created_at)
        VALUES ($1, $2, 'comment_added', $3, NOW())
      `, [incidentId, userId, `Comentario agregado: ${commentText.trim().substring(0, 50)}...`]);
      
      console.log(`✅ Comentario agregado a incidencia ${incidentId}`);
      res.status(201).json(result.rows[0]);
      
    } catch (error) {
      console.error('Error agregando comentario:', error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener historial de una incidencia
  apiRouter.get("/incidents/:id/history", async (req: Request, res: Response) => {
    try {
      const incidentId = Number(req.params.id);
      
      if (!incidentId || isNaN(incidentId)) {
        return res.status(400).json({ message: "ID de incidencia inválido" });
      }
      
      const { pool } = await import("./db");
      
      const query = `
        SELECT 
          ih.id,
          ih.action_type as "actionType",
          ih.old_value as "oldValue",
          ih.new_value as "newValue",
          ih.field_name as "fieldName",
          ih.notes,
          ih.created_at as "createdAt",
          u.full_name as "authorName",
          u.username as "authorUsername"
        FROM incident_history ih
        LEFT JOIN users u ON ih.user_id = u.id
        WHERE ih.incident_id = $1
        ORDER BY ih.created_at DESC
      `;
      
      const result = await pool.query(query, [incidentId]);
      console.log(`📋 Encontrado historial de ${result.rows.length} acciones para incidencia ${incidentId}`);
      res.json(result.rows);
      
    } catch (error) {
      console.error('Error al obtener historial:', error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Actualizar estado de una incidencia - VERSION MEJORADA
  apiRouter.put("/incidents/:id/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const incidentId = Number(req.params.id);
      const { status, notes } = req.body;
      
      const validStatuses = ['pending', 'assigned', 'in_progress', 'review', 'resolved', 'closed', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Estado inválido" });
      }

      const { pool } = await import("./db");
      const userId = req.headers['x-user-id'] || 4;
      
      // Obtener estado actual
      const currentIncident = await pool.query('SELECT status FROM incidents WHERE id = $1', [incidentId]);
      if (currentIncident.rows.length === 0) {
        return res.status(404).json({ message: "Incidencia no encontrada" });
      }
      
      const oldStatus = currentIncident.rows[0].status;
      
      // Actualizar estado
      const updateQuery = `
        UPDATE incidents 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [status, incidentId]);
      
      // Registrar en historial
      await pool.query(`
        INSERT INTO incident_history (incident_id, user_id, action_type, old_value, new_value, field_name, notes, created_at)
        VALUES ($1, $2, 'status_change', $3, $4, 'status', $5, NOW())
      `, [incidentId, userId, oldStatus, status, notes || `Estado cambiado de ${oldStatus} a ${status}`]);
      
      console.log(`✅ Estado de incidencia ${incidentId} cambiado de ${oldStatus} a ${status}`);
      res.json(result.rows[0]);
      
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Asignar incidencia a usuario
  apiRouter.put("/incidents/:id/assign", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const incidentId = Number(req.params.id);
      const { assignedToUserId, department, dueDate, notes } = req.body;
      
      if (!incidentId || isNaN(incidentId)) {
        return res.status(400).json({ message: "ID de incidencia inválido" });
      }

      const { pool } = await import("./db");
      const userId = req.headers['x-user-id'] || 4;
      
      // Crear asignación
      const assignmentQuery = `
        INSERT INTO incident_assignments (incident_id, assigned_to_user_id, assigned_by_user_id, department, due_date, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id
      `;
      
      const assignmentResult = await pool.query(assignmentQuery, [
        incidentId, 
        assignedToUserId || null, 
        userId, 
        department || null, 
        dueDate || null, 
        notes || null
      ]);
      
      // Actualizar incidencia
      await pool.query(`
        UPDATE incidents 
        SET assigned_to_user_id = $1, status = CASE WHEN status = 'pending' THEN 'assigned' ELSE status END, updated_at = NOW()
        WHERE id = $2
      `, [assignedToUserId, incidentId]);
      
      // Registrar en historial
      await pool.query(`
        INSERT INTO incident_history (incident_id, user_id, action_type, new_value, field_name, notes, created_at)
        VALUES ($1, $2, 'assignment', $3, 'assigned_to_user_id', $4, NOW())
      `, [incidentId, userId, assignedToUserId?.toString() || department, notes || 'Incidencia asignada']);
      
      console.log(`✅ Incidencia ${incidentId} asignada exitosamente`);
      res.json({ success: true, assignmentId: assignmentResult.rows[0].id });
      
    } catch (error) {
      console.error("Error asignando incidencia:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener archivos adjuntos de una incidencia
  apiRouter.get("/incidents/:id/attachments", async (req: Request, res: Response) => {
    try {
      const incidentId = Number(req.params.id);
      
      if (!incidentId || isNaN(incidentId)) {
        return res.status(400).json({ message: "ID de incidencia inválido" });
      }

      const { pool } = await import("./db");
      
      const query = `
        SELECT 
          ia.id,
          ia.file_name as "fileName",
          ia.file_path as "filePath",
          ia.file_type as "fileType",
          ia.file_size as "fileSize",
          ia.attachment_type as "attachmentType",
          ia.is_before_photo as "isBeforePhoto",
          ia.is_after_photo as "isAfterPhoto",
          ia.created_at as "createdAt",
          u.full_name as "uploadedByName"
        FROM incident_attachments ia
        LEFT JOIN users u ON ia.uploaded_by_user_id = u.id
        WHERE ia.incident_id = $1
        ORDER BY ia.created_at DESC
      `;
      
      const result = await pool.query(query, [incidentId]);
      console.log(`📎 Encontrados ${result.rows.length} archivos para incidencia ${incidentId}`);
      res.json(result.rows);
      
    } catch (error) {
      console.error("Error obteniendo archivos adjuntos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener asignaciones de una incidencia
  apiRouter.get("/incidents/:id/assignments", async (req: Request, res: Response) => {
    try {
      const incidentId = Number(req.params.id);
      
      if (!incidentId || isNaN(incidentId)) {
        return res.status(400).json({ message: "ID de incidencia inválido" });
      }

      const { pool } = await import("./db");
      
      const query = `
        SELECT 
          ia.id,
          ia.department,
          ia.due_date as "dueDate",
          ia.notes,
          ia.status as "assignmentStatus",
          ia.created_at as "createdAt",
          ia.updated_at as "updatedAt",
          assigned.full_name as "assignedToName",
          assigned.username as "assignedToUsername",
          assigned.email as "assignedToEmail",
          assigner.full_name as "assignedByName",
          assigner.username as "assignedByUsername"
        FROM incident_assignments ia
        LEFT JOIN users assigned ON ia.assigned_to_user_id = assigned.id
        LEFT JOIN users assigner ON ia.assigned_by_user_id = assigner.id
        WHERE ia.incident_id = $1
        ORDER BY ia.created_at DESC
      `;
      
      const result = await pool.query(query, [incidentId]);
      console.log(`👥 Encontradas ${result.rows.length} asignaciones para incidencia ${incidentId}`);
      res.json(result.rows);
      
    } catch (error) {
      console.error("Error obteniendo asignaciones:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Actualizar estado de asignación
  apiRouter.put("/incidents/:incidentId/assignments/:assignmentId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { incidentId, assignmentId } = req.params;
      const { status, notes } = req.body;
      
      if (!incidentId || !assignmentId) {
        return res.status(400).json({ message: "IDs requeridos" });
      }

      const { pool } = await import("./db");
      const userId = req.headers['x-user-id'] || 4;
      
      const query = `
        UPDATE incident_assignments 
        SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
        WHERE id = $3 AND incident_id = $4
        RETURNING *
      `;
      
      const result = await pool.query(query, [status, notes, assignmentId, incidentId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Asignación no encontrada" });
      }
      
      // Registrar en historial
      await pool.query(`
        INSERT INTO incident_history (incident_id, user_id, action_type, new_value, field_name, notes, created_at)
        VALUES ($1, $2, 'assignment_updated', $3, 'assignment_status', $4, NOW())
      `, [incidentId, userId, status, notes || `Estado de asignación actualizado a ${status}`]);
      
      console.log(`✅ Asignación ${assignmentId} actualizada exitosamente`);
      res.json(result.rows[0]);
      
    } catch (error) {
      console.error("Error actualizando asignación:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Crear nueva asignación para una incidencia
  apiRouter.post("/incidents/:id/assignments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("🔧 POST /api/incidents/:id/assignments - Request body:", req.body);
      console.log("🔧 Content-Type:", req.headers['content-type']);
      console.log("🔧 Request headers:", req.headers);
      
      const incidentId = Number(req.params.id);
      const { assignedToUserId, department, dueDate, notes } = req.body;
      
      console.log("🔧 Extracted data:", { incidentId, assignedToUserId, department, dueDate, notes });
      
      if (!incidentId || isNaN(incidentId)) {
        console.log("❌ Error: ID de incidencia inválido");
        return res.status(400).json({ message: "ID de incidencia inválido" });
      }

      if (!assignedToUserId) {
        console.log("❌ Error: Usuario asignado es requerido");
        return res.status(400).json({ message: "Usuario asignado es requerido" });
      }

      const { pool } = await import("./db");
      const assignedByUserId = req.headers['x-user-id'] || 4;
      
      const query = `
        INSERT INTO incident_assignments (
          incident_id, assigned_to_user_id, assigned_by_user_id, 
          department, due_date, notes, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        incidentId, assignedToUserId, assignedByUserId, 
        department || 'General', dueDate, notes
      ]);
      
      // Actualizar la incidencia para reflejar la asignación
      await pool.query(`
        UPDATE incidents 
        SET assigned_to_user_id = $1, status = CASE 
          WHEN status = 'pending' THEN 'assigned' 
          ELSE status 
        END, updated_at = NOW()
        WHERE id = $2
      `, [assignedToUserId, incidentId]);
      
      // Registrar en historial
      await pool.query(`
        INSERT INTO incident_history (incident_id, user_id, action_type, new_value, field_name, notes, created_at)
        VALUES ($1, $2, 'assignment_created', $3, 'assigned_to_user_id', $4, NOW())
      `, [incidentId, assignedByUserId, assignedToUserId, notes || 'Nueva asignación creada']);
      
      console.log(`✅ Nueva asignación creada para incidencia ${incidentId}`);
      res.status(201).json(result.rows[0]);
      
    } catch (error) {
      console.error("Error creando asignación:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Get incidents for a specific park
  apiRouter.get("/parks/:id/incidents", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      
      // Verificamos que el usuario tenga acceso al parque si no es super_admin
      if (req.user.role !== 'super_admin') {
        const park = await storage.getPark(parkId);
        if (!park) {
          return res.status(404).json({ message: "Park not found" });
        }
      }
      
      const incidents = await storage.getParkIncidents(parkId);
      
      res.json(incidents);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching park incidents" });
    }
  });

  // Import incidents from CSV
  apiRouter.post("/incidents/import", upload.single('file'), async (req: Request, res: Response) => {
    try {
      console.log("📥 POST /api/incidents/import - Iniciando importación de incidencias");
      
      if (!req.file) {
        return res.status(400).json({ error: "No se ha seleccionado ningún archivo" });
      }

      const file = req.file;
      console.log("📄 Archivo recibido:", file.originalname, file.mimetype);
      
      // Validar que sea un archivo CSV
      if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
        return res.status(400).json({ error: "El archivo debe ser un CSV" });
      }

      // Parsear el archivo CSV
      const csvData = file.buffer.toString('utf8');
      const lines = csvData.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ error: "El archivo CSV debe contener al menos una fila de datos" });
      }

      // Extraer headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      console.log("📋 Headers encontrados:", headers);

      // Validar headers requeridos
      const requiredHeaders = ['titulo', 'descripcion', 'parque_id', 'categoria', 'estado'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        return res.status(400).json({ 
          error: `Faltan columnas requeridas: ${missingHeaders.join(', ')}` 
        });
      }

      const { pool } = await import("./db");
      let importedCount = 0;
      let errors = [];

      // Procesar cada fila de datos
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim());
          const row: any = {};
          
          // Mapear valores a headers
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          // Validar datos requeridos
          if (!row.titulo || !row.descripcion || !row.parque_id) {
            errors.push(`Fila ${i + 1}: Faltan campos requeridos`);
            continue;
          }

          // Validar que el parque existe
          const parkCheck = await pool.query(`
            SELECT id FROM parks WHERE id = $1
          `, [parseInt(row.parque_id)]);
          
          if (parkCheck.rows.length === 0) {
            errors.push(`Fila ${i + 1}: El parque con ID ${row.parque_id} no existe`);
            continue;
          }

          // Validar estado
          const validStatuses = ['pending', 'assigned', 'in_progress', 'review', 'resolved', 'closed', 'rejected'];
          const status = row.estado || 'pending';
          
          if (!validStatuses.includes(status)) {
            errors.push(`Fila ${i + 1}: Estado '${status}' no es válido`);
            continue;
          }

          // Validar prioridad
          const priority = row.prioridad || 'normal';
          const validPriorities = ['low', 'normal', 'high', 'urgent'];
          
          if (!validPriorities.includes(priority)) {
            errors.push(`Fila ${i + 1}: Prioridad '${priority}' no es válida`);
            continue;
          }

          // Insertar la incidencia
          const insertQuery = `
            INSERT INTO incidents (
              title, description, park_id, category, status, severity, 
              location, reporter_name, reporter_email, reporter_phone,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
            )
          `;
          
          const insertValues = [
            row.titulo,
            row.descripcion,
            parseInt(row.parque_id),
            row.categoria || 'general',
            status,
            priority,
            row.ubicacion || '',
            row.reportero_nombre || 'Importación CSV',
            row.reportero_email || '',
            row.reportero_telefono || ''
          ];

          await pool.query(insertQuery, insertValues);
          importedCount++;
          
        } catch (error) {
          console.error(`Error procesando fila ${i + 1}:`, error);
          errors.push(`Fila ${i + 1}: Error al procesar - ${error.message}`);
        }
      }

      console.log(`✅ Importación completada: ${importedCount} incidencias importadas`);
      console.log(`❌ Errores encontrados: ${errors.length}`);

      res.json({
        success: true,
        message: `Importación completada: ${importedCount} incidencias importadas`,
        imported: importedCount,
        errors: errors.length,
        errorDetails: errors.slice(0, 10) // Mostrar solo los primeros 10 errores
      });

    } catch (error) {
      console.error("Error en importación de incidencias:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        details: error.message 
      });
    }
  });

  // Get all municipalities - DESHABILITADO: tabla municipalities no existe
  // Los parques usan municipality_text (texto libre) en su lugar
  apiRouter.get("/municipalities", async (_req: Request, res: Response) => {
    res.json([]);
  });

  // Basic authentication for testing usando la función directa
  apiRouter.post("/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Importamos la función de autenticación directa que creamos
      const { authenticateUser } = await import('./directAuth');
      
      // Autenticamos al usuario de forma directa sin usar el ORM
      const result = await authenticateUser(username, password);
      
      if (!result.success) {
        return res.status(401).json({ message: result.message });
      }
      
      // Enviamos los datos del usuario autenticado
      res.json(result.data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error during login" });
    }
  });

  // Add the parks list endpoint to the main API router for frontend compatibility
  apiRouter.get("/public/parks/list", async (_req: Request, res: Response) => {
    try {
      // Get basic park data for dropdowns/forms
      const parks = await storage.getParks({ includeDeleted: false });
      const parkList = parks.map(park => ({
        id: park.id,
        name: park.name
      }));
      
      res.json(parkList);
    } catch (error) {
      console.error("Error fetching parks list:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Error fetching parks list" 
      });
    }
  });

  // Continuamos usando el mismo publicRouter definido antes
  
  // Get simple parks list for forms and dropdowns
  publicRouter.get("/parks/list", async (_req: Request, res: Response) => {
    try {
      // Get basic park data for dropdowns/forms
      const parks = await storage.getParks({ includeDeleted: false });
      const parkList = parks.map(park => ({
        id: park.id,
        name: park.name
      }));
      
      res.json(parkList);
    } catch (error) {
      console.error("Error fetching parks list:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Error fetching parks list" 
      });
    }
  });
  
  // Get basic park data - limited information for public consumption
  publicRouter.get("/parks", async (_req: Request, res: Response) => {
    try {
      // Asegurarnos de excluir parques eliminados
      const parks = await storage.getParks({ includeDeleted: false });
      // Return only basic data needed for integration
      const simplifiedParks = parks.map(park => ({
        id: park.id,
        name: park.name,
        type: park.parkType,
        address: park.address,
        latitude: park.latitude,
        longitude: park.longitude
      }));
      
      res.json({
        status: "success",
        data: simplifiedParks,
        count: simplifiedParks.length
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        status: "error", 
        message: "Error fetching parks data" 
      });
    }
  });
  
  // Get detailed park view for admin
  apiRouter.get("/parks/:id/view", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      
      // Get activities for this park
      const activitiesData = await db.select()
        .from(activities)
        .where(eq(activities.parkId, parkId));
      
      // Get trees data if table exists
      let treesData = [];
      try {
        treesData = await db.select().from(trees).where(eq(trees.parkId, parkId));
      } catch (e) {
        // Tree table might not exist yet
      }
      
      // Get volunteers data if table exists
      let volunteersData = [];
      try {
        volunteersData = await db.select().from(volunteers).where(eq(volunteers.preferredParkId, parkId));
      } catch (e) {
        // Volunteers table might not exist yet
      }
      
      // Get multimedia data (images and documents)
      let images = [];
      let documents = [];
      try {
        const imagesResult = await db.execute(
          'SELECT id, park_id as "parkId", image_url as "imageUrl", is_primary as "isPrimary", caption FROM park_images WHERE park_id = $1 ORDER BY is_primary DESC',
          [parkId]
        );
        images = Array.isArray(imagesResult) ? imagesResult : (imagesResult.rows || []);
        
        const documentsResult = await db.execute(
          'SELECT id, park_id as "parkId", title, file_url as "fileUrl", file_type as "fileType", description, category, created_at as "createdAt" FROM park_documents WHERE park_id = $1 ORDER BY created_at DESC',
          [parkId]
        );
        documents = Array.isArray(documentsResult) ? documentsResult : (documentsResult.rows || []);
      } catch (e) {
        console.log('Error fetching multimedia data:', e);
      }
      
      // Placeholder arrays for other data types
      const amenities = [];
      const incidents = [];
      const evaluations = [];
      
      // Calculate stats
      const stats = {
        totalActivities: activitiesData.length,
        activeVolunteers: volunteersData.filter((v: any) => v.isActive).length,
        totalTrees: treesData.length,
        averageEvaluation: evaluations.length > 0 ? evaluations.reduce((acc: number, evaluation: any) => acc + evaluation.score, 0) / evaluations.length : 0,
        pendingIncidents: incidents.filter((inc: any) => inc.status === 'pending' || inc.status === 'open').length
      };
      
      const result = {
        ...park,
        municipality: municipality,
        amenities: amenities,
        activities: activitiesData,
        trees: treesData,
        volunteers: volunteersData,
        incidents: incidents,
        documents: documents,
        images: images,
        evaluations: evaluations,
        stats: stats
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching park view:", error);
      res.status(500).json({ message: "Error fetching park data" });
    }
  });

  // Get detailed information about a specific park
  publicRouter.get("/parks/:id", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const park = await storage.getExtendedPark(parkId);
      
      if (!park) {
        return res.status(404).json({
          status: "error",
          message: "Park not found"
        });
      }
      
      // Get park activities - using direct DB query for now
      const activitiesData = await db.select().from(activities).where(eq(activities.parkId, parkId));

      // Format park data for public API consumption
      const formattedPark = {
        id: park.id,
        name: park.name,
        type: park.parkType,
        address: park.address,
        postalCode: park.postalCode,
        municipality: park.municipality ? {
          id: park.municipality.id,
          name: park.municipality.name,
          state: park.municipality.state
        } : null,
        location: {
          latitude: park.latitude,
          longitude: park.longitude
        },
        description: park.description,
        size: park.area,
        foundedIn: park.foundationYear,
        administrator: park.administrator,
        condition: park.conservationStatus,
        schedule: park.openingHours,
        contact: {
          email: park.contactEmail,
          phone: park.contactPhone
        },
        amenities: park.amenities?.map(amenity => ({
          id: amenity.id,
          name: amenity.name,
          category: amenity.category,
          icon: amenity.icon
        })) || [],
        images: park.images?.map(image => ({
          id: image.id,
          url: image.imageUrl,
          caption: image.caption,
          isPrimary: image.isPrimary
        })) || [],
        activities: activitiesData.map(activity => ({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          startDate: activity.startDate,
          endDate: activity.endDate,
          category: activity.category,
          location: activity.location
        })),
        lastUpdated: park.updatedAt
      };
      
      res.json({
        status: "success",
        data: formattedPark
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        status: "error", 
        message: "Error fetching detailed park data" 
      });
    }
  });
  
  // ===== NUEVOS ENDPOINTS DE MÉTRICAS DE PARQUES =====
  
  // GET /api/parks/:id/metrics - Evaluación promedio del parque
  apiRouter.get('/parks/:id/metrics', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      
      if (isNaN(parkId)) {
        return res.status(400).json({ message: 'Invalid park ID' });
      }

      // Obtener evaluaciones del parque para calcular promedio
      const evaluationsResult = await db.select({
        overallRating: parkEvaluations.overallRating,
        cleanliness: parkEvaluations.cleanliness,
        safety: parkEvaluations.safety,
        maintenance: parkEvaluations.maintenance,
        accessibility: parkEvaluations.accessibility,
        amenities: parkEvaluations.amenities,
        activities: parkEvaluations.activities,
        staff: parkEvaluations.staff,
        naturalBeauty: parkEvaluations.naturalBeauty
      })
      .from(parkEvaluations)
      .where(eq(parkEvaluations.parkId, parkId));

      if (evaluationsResult.length === 0) {
        return res.json({
          averageRating: null,
          totalEvaluations: 0,
          ratingBreakdown: null
        });
      }

      // Calcular promedio general
      const totalRatings = evaluationsResult.reduce((sum, evaluation) => sum + (evaluation.overallRating || 0), 0);
      const averageRating = totalRatings / evaluationsResult.length;

      // Calcular promedios por categoría
      const categoryAverages = {
        cleanliness: evaluationsResult.reduce((sum, e) => sum + (e.cleanliness || 0), 0) / evaluationsResult.length,
        safety: evaluationsResult.reduce((sum, e) => sum + (e.safety || 0), 0) / evaluationsResult.length,
        maintenance: evaluationsResult.reduce((sum, e) => sum + (e.maintenance || 0), 0) / evaluationsResult.length,
        accessibility: evaluationsResult.reduce((sum, e) => sum + (e.accessibility || 0), 0) / evaluationsResult.length,
        amenities: evaluationsResult.reduce((sum, e) => sum + (e.amenities || 0), 0) / evaluationsResult.length,
        activities: evaluationsResult.reduce((sum, e) => sum + (e.activities || 0), 0) / evaluationsResult.length,
        staff: evaluationsResult.reduce((sum, e) => sum + (e.staff || 0), 0) / evaluationsResult.length,
        naturalBeauty: evaluationsResult.reduce((sum, e) => sum + (e.naturalBeauty || 0), 0) / evaluationsResult.length
      };

      res.json({
        averageRating: Math.round(averageRating * 10) / 10,
        totalEvaluations: evaluationsResult.length,
        ratingBreakdown: categoryAverages
      });
    } catch (error) {
      console.error('Error fetching park metrics:', error);
      res.status(500).json({ message: 'Error fetching park metrics' });
    }
  });

  // GET /api/parks/:id/pending-incidents - Incidencias pendientes
  apiRouter.get('/parks/:id/pending-incidents', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      
      if (isNaN(parkId)) {
        return res.status(400).json({ message: 'Invalid park ID' });
      }

      // Obtener incidencias pendientes (status diferente de 'resolved' o 'closed')
      const pendingIncidents = await db.select({
        id: incidents.id,
        title: incidents.title,
        incidentType: incidents.incidentType,
        status: incidents.status,
        priority: incidents.priority,
        createdAt: incidents.createdAt
      })
      .from(incidents)
      .where(eq(incidents.parkId, parkId));

      // Filtrar solo las pendientes
      const pending = pendingIncidents.filter(incident => 
        incident.status !== 'resolved' && 
        incident.status !== 'closed' && 
        incident.status !== 'cancelled'
      );

      // Contar por prioridad
      const priorityCount = {
        high: pending.filter(i => i.priority === 'high').length,
        medium: pending.filter(i => i.priority === 'medium').length,
        low: pending.filter(i => i.priority === 'low').length
      };

      res.json({
        total: pending.length,
        incidents: pending,
        priorityBreakdown: priorityCount
      });
    } catch (error) {
      console.error('Error fetching pending incidents:', error);
      res.status(500).json({ message: 'Error fetching pending incidents' });
    }
  });

  // GET /api/parks/:id/assets-in-maintenance - Activos en mantenimiento
  apiRouter.get('/parks/:id/assets-in-maintenance', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      
      if (isNaN(parkId)) {
        return res.status(400).json({ message: 'Invalid park ID' });
      }

      // Obtener activos en mantenimiento del parque
      const assetsInMaintenance = await db.select({
        assetId: assets.id,
        assetName: assets.name,
        maintenanceId: assetMaintenances.id,
        maintenanceType: assetMaintenances.maintenanceType,
        status: assetMaintenances.status,
        date: assetMaintenances.date,
        nextMaintenanceDate: assetMaintenances.nextMaintenanceDate
      })
      .from(assetMaintenances)
      .innerJoin(assets, eq(assetMaintenances.assetId, assets.id))
      .where(eq(assets.parkId, parkId));

      // Filtrar solo los que están en mantenimiento activo
      const activeMaintenance = assetsInMaintenance.filter(maintenance => 
        maintenance.status === 'scheduled' || 
        maintenance.status === 'in_progress'
      );

      // Contar por tipo de mantenimiento
      const typeCount = {
        preventive: activeMaintenance.filter(m => m.maintenanceType === 'preventive').length,
        corrective: activeMaintenance.filter(m => m.maintenanceType === 'corrective').length,
        emergency: activeMaintenance.filter(m => m.maintenanceType === 'emergency').length
      };

      res.json({
        total: activeMaintenance.length,
        assets: activeMaintenance,
        typeBreakdown: typeCount
      });
    } catch (error) {
      console.error('Error fetching assets in maintenance:', error);
      res.status(500).json({ message: 'Error fetching assets in maintenance' });
    }
  });

  // GET /api/parks/:id/reports - Reportes pendientes (usando visitor feedback)
  apiRouter.get('/parks/:id/reports', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      
      if (isNaN(parkId)) {
        return res.status(400).json({ message: 'Invalid park ID' });
      }

      // Obtener feedback de visitantes pendiente de revisión
      const pendingReports = await pool.query(`
        SELECT 
          id,
          name as "visitorName",
          form_type as "feedbackType",
          message,
          status,
          created_at as "createdAt"
        FROM park_feedback 
        WHERE park_id = $1 
        AND status IN ('pending', 'under_review')
        ORDER BY created_at DESC
      `, [parkId]);

      // Contar por tipo
      const typeCount = {
        complaint: pendingReports.rows.filter((r: any) => r.feedbackType === 'complaint').length,
        suggestion: pendingReports.rows.filter((r: any) => r.feedbackType === 'suggestion').length,
        compliment: pendingReports.rows.filter((r: any) => r.feedbackType === 'compliment').length
      };

      res.json({
        total: pendingReports.rows.length,
        reports: pendingReports.rows,
        typeBreakdown: typeCount
      });
    } catch (error) {
      console.error('Error fetching pending reports:', error);
      res.status(500).json({ message: 'Error fetching pending reports' });
    }
  });

  // GET /api/parks/:id/upcoming-schedule - Actividades y eventos programados
  apiRouter.get('/parks/:id/upcoming-schedule', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      
      if (isNaN(parkId)) {
        return res.status(400).json({ message: 'Invalid park ID' });
      }

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      // Obtener actividades próximas
      const upcomingActivities = await db.select({
        id: activities.id,
        title: activities.title,
        startDate: activities.startDate,
        endDate: activities.endDate,
        category: activities.category,
        type: sql<string>`'activity'`.as('type')
      })
      .from(activities)
      .where(eq(activities.parkId, parkId));

      // Obtener eventos próximos que mencionen el parque en su ubicación
      const parkResult = await db.select({ name: parks.name })
        .from(parks)
        .where(eq(parks.id, parkId))
        .limit(1);

      let upcomingEvents: any[] = [];
      if (parkResult.length > 0) {
        const parkName = parkResult[0].name;
        
        const eventsQuery = await pool.query(`
          SELECT 
            id,
            title,
            start_date as "startDate",
            end_date as "endDate",
            event_type as "eventType",
            'event' as type
          FROM events 
          WHERE (location ILIKE $1 OR location ILIKE $2)
          AND start_date >= $3
          AND start_date <= $4
          ORDER BY start_date ASC
        `, [`%${parkName}%`, `%${parkId}%`, now.toISOString(), thirtyDaysFromNow.toISOString()]);
        
        upcomingEvents = eventsQuery.rows;
      }

      // Filtrar actividades próximas
      const filteredActivities = upcomingActivities.filter(activity => {
        const startDate = new Date(activity.startDate);
        return startDate >= now && startDate <= thirtyDaysFromNow;
      });

      // Combinar y ordenar por fecha
      const allUpcoming = [...filteredActivities, ...upcomingEvents]
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      res.json({
        total: allUpcoming.length,
        schedule: allUpcoming,
        breakdown: {
          activities: filteredActivities.length,
          events: upcomingEvents.length
        }
      });
    } catch (error) {
      console.error('Error fetching upcoming schedule:', error);
      res.status(500).json({ message: 'Error fetching upcoming schedule' });
    }
  });


  // ===== FIN ENDPOINTS DE MÉTRICAS DE PARQUES =====

  // ===== ENDPOINTS DE EVALUACIONES DE PARQUES =====
  
  // POST /api/park-evaluations - Crear nueva evaluación de parque
  apiRouter.post('/park-evaluations', async (req: Request, res: Response) => {
    try {
      console.log('📝 [PARK-EVALUATIONS] Recibiendo nueva evaluación:', req.body);
      
      // Validar datos con el schema
      const validatedData = schema.insertParkEvaluationSchema.parse(req.body);
      
      // Insertar en la base de datos
      const [newEvaluation] = await db.insert(schema.parkEvaluations)
        .values({
          ...validatedData,
          status: 'pending', // Por defecto las evaluaciones requieren moderación
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      console.log('✅ [PARK-EVALUATIONS] Evaluación creada exitosamente:', newEvaluation.id);
      
      res.status(201).json({
        success: true,
        data: newEvaluation,
        message: 'Evaluación enviada exitosamente. Será revisada antes de publicarse.'
      });
    } catch (error) {
      console.error('❌ [PARK-EVALUATIONS] Error creando evaluación:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Datos de evaluación inválidos',
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al enviar la evaluación. Por favor intenta nuevamente.'
      });
    }
  });

  // GET /api/park-evaluations/:parkId - Obtener evaluaciones de un parque
  apiRouter.get('/park-evaluations/:parkId', async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      
      if (isNaN(parkId)) {
        return res.status(400).json({ success: false, message: 'ID de parque inválido' });
      }
      
      // Obtener solo evaluaciones aprobadas para usuarios públicos
      const evaluations = await db.select()
        .from(schema.parkEvaluations)
        .where(eq(schema.parkEvaluations.parkId, parkId));
      
      res.json({
        success: true,
        data: evaluations
      });
    } catch (error) {
      console.error('❌ [PARK-EVALUATIONS] Error obteniendo evaluaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener evaluaciones'
      });
    }
  });

  // GET /api/parks/:id/evaluations - Obtener evaluaciones aprobadas de un parque (paginadas)
  apiRouter.get('/parks/:id/evaluations', async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      
      if (isNaN(parkId)) {
        return res.status(400).json({ success: false, message: 'ID de parque inválido' });
      }
      
      // Obtener solo evaluaciones aprobadas para la vista pública
      const evaluations = await db.select()
        .from(schema.parkEvaluations)
        .where(
          and(
            eq(schema.parkEvaluations.parkId, parkId),
            eq(schema.parkEvaluations.status, 'approved')
          )
        )
        .orderBy(desc(schema.parkEvaluations.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Contar total de evaluaciones aprobadas
      const totalResult = await db.select({ count: sql<number>`count(*)` })
        .from(schema.parkEvaluations)
        .where(
          and(
            eq(schema.parkEvaluations.parkId, parkId),
            eq(schema.parkEvaluations.status, 'approved')
          )
        );
      
      const total = Number(totalResult[0]?.count || 0);
      
      res.json({
        success: true,
        evaluations: evaluations.map(e => ({
          ...e,
          evaluator_name: e.evaluatorName,
          evaluator_city: e.evaluatorCity,
          overall_rating: e.overallRating,
          would_recommend: e.wouldRecommend,
          visit_date: e.visitDate,
          visit_purpose: e.visitPurpose,
          created_at: e.createdAt
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('❌ [PARK-EVALUATIONS] Error obteniendo evaluaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener evaluaciones'
      });
    }
  });

  // GET /api/parks/:id/evaluation-stats - Obtener estadísticas de evaluaciones de un parque
  apiRouter.get('/parks/:id/evaluation-stats', async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      
      if (isNaN(parkId)) {
        return res.status(400).json({ success: false, message: 'ID de parque inválido' });
      }
      
      // Obtener estadísticas solo de evaluaciones aprobadas
      const statsResult = await db.execute(sql`
        SELECT 
          COUNT(*)::int as total_evaluations,
          AVG(overall_rating)::numeric(3,2) as average_rating,
          (COUNT(*) FILTER (WHERE would_recommend = true)::numeric / NULLIF(COUNT(*)::numeric, 0) * 100)::numeric(5,2) as recommendation_rate,
          AVG(cleanliness)::numeric(3,2) as avg_cleanliness,
          AVG(safety)::numeric(3,2) as avg_safety,
          AVG(maintenance)::numeric(3,2) as avg_maintenance,
          AVG(accessibility)::numeric(3,2) as avg_accessibility,
          AVG(amenities)::numeric(3,2) as avg_amenities,
          AVG(activities)::numeric(3,2) as avg_activities,
          AVG(staff)::numeric(3,2) as avg_staff,
          AVG(natural_beauty)::numeric(3,2) as avg_natural_beauty,
          COUNT(*) FILTER (WHERE overall_rating = 5)::int as five_star_count,
          COUNT(*) FILTER (WHERE overall_rating = 4)::int as four_star_count,
          COUNT(*) FILTER (WHERE overall_rating = 3)::int as three_star_count,
          COUNT(*) FILTER (WHERE overall_rating = 2)::int as two_star_count,
          COUNT(*) FILTER (WHERE overall_rating = 1)::int as one_star_count
        FROM park_evaluations
        WHERE park_id = ${parkId} AND status = 'approved'
      `);
      
      const stats = statsResult.rows[0] || {
        total_evaluations: 0,
        average_rating: 0,
        recommendation_rate: 0,
        avg_cleanliness: 0,
        avg_safety: 0,
        avg_maintenance: 0,
        avg_accessibility: 0,
        avg_amenities: 0,
        avg_activities: 0,
        avg_staff: 0,
        avg_natural_beauty: 0,
        five_star_count: 0,
        four_star_count: 0,
        three_star_count: 0,
        two_star_count: 0,
        one_star_count: 0
      };
      
      res.json(stats);
    } catch (error) {
      console.error('❌ [PARK-EVALUATIONS] Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas'
      });
    }
  });

  // GET /api/evaluations/parks - Obtener todas las evaluaciones de parques (admin)
  apiRouter.get('/evaluations/parks', async (req: Request, res: Response) => {
    try {
      // Obtener todas las evaluaciones con información del parque
      const evaluations = await db.execute(sql`
        SELECT 
          pe.*,
          p.name as "parkName"
        FROM park_evaluations pe
        LEFT JOIN parks p ON pe.park_id = p.id
        ORDER BY pe.created_at DESC
      `);
      
      res.json(evaluations.rows || []);
    } catch (error) {
      console.error('❌ [EVALUATIONS] Error obteniendo evaluaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener evaluaciones'
      });
    }
  });

  // PUT /api/evaluations/parks/:id - Actualizar estado de evaluación (moderar)
  apiRouter.put('/evaluations/parks/:id', async (req: Request, res: Response) => {
    try {
      const evaluationId = Number(req.params.id);
      const { status, moderationNotes } = req.body;
      
      if (isNaN(evaluationId)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }
      
      // Obtener ID del usuario moderador
      const moderatorId = (req.user as any)?.id || null;
      
      // Actualizar la evaluación
      const [updated] = await db.update(schema.parkEvaluations)
        .set({
          status,
          moderatedBy: moderatorId,
          moderatedAt: new Date(),
          moderationNotes,
          updatedAt: new Date()
        })
        .where(eq(schema.parkEvaluations.id, evaluationId))
        .returning();
      
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      console.error('❌ [EVALUATIONS] Error actualizando evaluación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar evaluación'
      });
    }
  });

  // DELETE /api/evaluations/parks/:id - Eliminar evaluación
  apiRouter.delete('/evaluations/parks/:id', async (req: Request, res: Response) => {
    try {
      const evaluationId = Number(req.params.id);
      
      if (isNaN(evaluationId)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }
      
      await db.delete(schema.parkEvaluations)
        .where(eq(schema.parkEvaluations.id, evaluationId));
      
      res.json({
        success: true,
        message: 'Evaluación eliminada correctamente'
      });
    } catch (error) {
      console.error('❌ [EVALUATIONS] Error eliminando evaluación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar evaluación'
      });
    }
  });
  
  // ===== FIN ENDPOINTS DE EVALUACIONES DE PARQUES =====
  
  // Ruta pública para obtener instructores activos
  publicRouter.get("/instructors", async (_req: Request, res: Response) => {
    try {
      const instructorsResult = await db.execute(
        sql`SELECT id, full_name, email, phone, specialties, experience_years, status, profile_image_url, created_at 
            FROM instructors 
            WHERE status = 'active'
            ORDER BY id DESC`
      );
      res.json(instructorsResult.rows || []);
    } catch (error) {
      console.error('Error al obtener instructores públicos:', error);
      res.status(500).json({ 
        status: "error", 
        message: "Error fetching instructors data" 
      });
    }
  });
  
  // Get upcoming activities across all parks - for calendar integration
  publicRouter.get("/activities", async (req: Request, res: Response) => {
    try {
      console.log("🎯 ENDPOINT PÚBLICO ACTIVITIES EJECUTÁNDOSE");
      
      // Usar la misma consulta SQL directa para consistencia
      const { pool } = await import("./db");
      
      const result = await pool.query(`
        SELECT 
          a.id,
          a.title,
          a.description,
          a.start_date as "startDate",
          a.end_date as "endDate",
          a.category,
          a.category_id as "categoryId",
          a.park_id as "parkId",
          a.location,
          a.capacity,
          a.price,
          a.instructor_id as "instructorId",
          a.created_at as "createdAt",
          p.name as "parkName",
          c.name as "categoryName",
          i.full_name as "instructorName",
          img.image_url as "imageUrl",
          img.caption as "imageCaption"
        FROM activities a
        LEFT JOIN parks p ON a.park_id = p.id
        LEFT JOIN activity_categories c ON a.category_id = c.id
        LEFT JOIN instructors i ON a.instructor_id = i.id
        LEFT JOIN activity_images img ON a.id = img.activity_id AND img.is_primary = true
        ORDER BY a.created_at DESC
      `);
      
      const allActivities = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        startDate: row.startDate,
        endDate: row.endDate,
        category: row.category,
        categoryId: row.categoryId,
        parkId: row.parkId,
        parkName: row.parkName,
        location: row.location,
        capacity: row.capacity,
        price: row.price,
        instructorId: row.instructorId,
        instructorName: row.instructorName,
        createdAt: row.createdAt,
        imageUrl: row.imageUrl,
        imageCaption: row.imageCaption
      }));
      
      console.log(`🎯 Actividades públicas encontradas: ${allActivities.length}`);
      console.log(`🎯 Primeras 3: ${allActivities.slice(0, 3).map(a => `${a.id}-${a.title}`).join(', ')}`);
      
      // Sort by start date for public viewing
      allActivities.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      // Format for external consumption
      const formattedActivities = allActivities.map(activity => {
        const park = allParks.find(p => p.id === activity.parkId);
        return {
          id: activity.id,
          title: activity.title,
          description: activity.description,
          startDate: activity.startDate,
          endDate: activity.endDate,
          category: activity.category,
          parkName: park?.name || 'Unknown',
          parkId: activity.parkId,
          location: park ? `${park.address}` : 'Unknown'
        };
      });
      
      res.json({
        status: "success",
        data: formattedActivities,
        count: formattedActivities.length
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        status: "error", 
        message: "Error fetching activities data" 
      });
    }
  });
  
  // DISABLED - This endpoint was interfering with the main amenities endpoint
  /*
  publicRouter.get("/parks/:id/amenities", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const amenities = await storage.getParkAmenities(parkId);
      
      // Format for external consumption
      const formattedAmenities = amenities.map(amenity => ({
        id: amenity.id,
        name: amenity.name,
        category: amenity.category,
        icon: amenity.icon
      }));
      
      res.json({
        status: "success",
        data: formattedAmenities,
        count: formattedAmenities.length
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        status: "error", 
        message: "Error fetching park amenities data" 
      });
    }
  });
  */
  
  // Get activities for a specific park - for external applications
  publicRouter.get("/parks/:id/activities", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const activities = await storage.getParkActivities(parkId);
      
      // Format for external consumption
      const formattedActivities = activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        startDate: activity.startDate,
        endDate: activity.endDate,
        category: activity.category,
        location: activity.location
      }));
      
      res.json({
        status: "success",
        data: formattedActivities,
        count: formattedActivities.length
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        status: "error", 
        message: "Error fetching park activities data" 
      });
    }
  });

  // Get concessions for a specific park
  publicRouter.get("/parks/:id/concessions", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      
      const { pool } = await import("./db");
      
      const result = await pool.query(`
        SELECT 
          c.id,
          c.vendor_name as "vendorName",
          c.vendor_contact as "vendorContact", 
          c.vendor_email as "vendorEmail",
          c.vendor_phone as "vendorPhone",
          c.start_date as "startDate",
          c.end_date as "endDate",
          c.status,
          c.location,
          c.notes,
          ct.name as "concessionType",
          ct.description as "typeDescription",
          ct.impact_level as "impactLevel"
        FROM concessions c
        LEFT JOIN concession_types ct ON c.concession_type_id = ct.id
        WHERE c.park_id = $1 AND c.status = 'activa'
        ORDER BY c.start_date DESC
      `, [parkId]);
      
      const concessions = result.rows || [];
      
      res.json({
        status: "success",
        data: concessions,
        count: concessions.length
      });
    } catch (error) {
      console.error("Error fetching park concessions:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Error fetching park concessions data" 
      });
    }
  });

  // Get all concessions for public display - Using different path to avoid Vite conflicts
  apiRouter.get("/concessions-list", async (req: Request, res: Response) => {
    console.log("GET /api/concessions-list endpoint hit");
    try {
      const { pool } = await import("./db");
      console.log("Database pool imported successfully");
      
      const result = await pool.query(`
        SELECT 
          c.id,
          c.vendor_name as "vendorName",
          c.vendor_contact as "vendorContact", 
          c.vendor_email as "vendorEmail",
          c.vendor_phone as "vendorPhone",
          c.start_date as "startDate",
          c.end_date as "endDate",
          c.status,
          c.location,
          c.notes,
          ct.name as "concessionType",
          ct.description as "typeDescription",
          ct.impact_level as "impactLevel",
          p.name as "parkName",
          p.id as "parkId",
          ci.image_url as "primaryImage"
        FROM concessions c
        LEFT JOIN concession_types ct ON c.concession_type_id = ct.id
        LEFT JOIN parks p ON c.park_id = p.id
        LEFT JOIN concession_images ci ON c.id = ci.concession_id AND ci.is_primary = true
        WHERE c.status = 'activa'
        ORDER BY c.start_date DESC
      `);
      
      const concessions = result.rows || [];
      console.log(`Found ${concessions.length} concessions`);
      
      res.json({
        status: "success",
        data: concessions,
        count: concessions.length
      });
    } catch (error) {
      console.error("Error fetching concessions:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Error fetching concessions data" 
      });
    }
  });

  // Get individual concession by ID
  apiRouter.get("/concessions/:id", async (req: Request, res: Response) => {
    try {
      const concessionId = parseInt(req.params.id);
      const { pool } = await import("./db");
      
      const result = await pool.query(`
        SELECT 
          c.id,
          c.vendor_name as "vendorName",
          c.vendor_contact as "vendorContact", 
          c.vendor_email as "vendorEmail",
          c.vendor_phone as "vendorPhone",
          c.start_date as "startDate",
          c.end_date as "endDate",
          c.status,
          c.location,
          c.notes as "description",
          ct.name as "concessionType",
          ct.description as "typeDescription",
          ct.impact_level as "impactLevel",
          p.name as "parkName",
          p.id as "parkId"
        FROM concessions c
        LEFT JOIN concession_types ct ON c.concession_type_id = ct.id
        LEFT JOIN parks p ON c.park_id = p.id
        WHERE c.id = $1
      `, [concessionId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Concession not found"
        });
      }
      
      const concession = result.rows[0];
      
      res.json({
        status: "success",
        data: concession
      });
    } catch (error) {
      console.error("Error fetching concession:", error);
      res.status(500).json({
        status: "error",
        message: "Error fetching concession data" 
      });
    }
  });

  // Upload concession image
  apiRouter.post("/concessions/:id/images", upload.single('image'), async (req: Request, res: Response) => {
    try {
      const concessionId = parseInt(req.params.id);
      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "No image file provided"
        });
      }

      const { pool } = await import("./db");
      const imageUrl = `/uploads/${req.file.filename}`;
      const caption = req.body.caption || '';
      const isPrimary = req.body.isPrimary === 'true';

      // If this is set as primary, unset other primary images for this concession
      if (isPrimary) {
        await pool.query(
          'UPDATE concession_images SET is_primary = false WHERE concession_id = $1',
          [concessionId]
        );
      }

      const result = await pool.query(`
        INSERT INTO concession_images (concession_id, image_url, caption, is_primary)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [concessionId, imageUrl, caption, isPrimary]);

      res.json({
        status: "success",
        data: result.rows[0]
      });
    } catch (error) {
      console.error("Error uploading concession image:", error);
      res.status(500).json({
        status: "error",
        message: "Error uploading image"
      });
    }
  });

  // Get concession images
  apiRouter.get("/concessions/:id/images", async (req: Request, res: Response) => {
    try {
      const concessionId = parseInt(req.params.id);
      const { pool } = await import("./db");
      
      const result = await pool.query(`
        SELECT * FROM concession_images 
        WHERE concession_id = $1 
        ORDER BY is_primary DESC, created_at ASC
      `, [concessionId]);

      res.json({
        status: "success",
        data: result.rows
      });
    } catch (error) {
      console.error("Error fetching concession images:", error);
      res.status(500).json({
        status: "error",
        message: "Error fetching images"
      });
    }
  });

  // Delete concession image
  apiRouter.delete("/concessions/:concessionId/images/:imageId", async (req: Request, res: Response) => {
    try {
      const { concessionId, imageId } = req.params;
      const { pool } = await import("./db");
      
      const result = await pool.query(
        'DELETE FROM concession_images WHERE id = $1 AND concession_id = $2 RETURNING *',
        [parseInt(imageId), parseInt(concessionId)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Image not found"
        });
      }

      res.json({
        status: "success",
        message: "Image deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting concession image:", error);
      res.status(500).json({
        status: "error",
        message: "Error deleting image"
      });
    }
  });

  // Set concession primary image
  apiRouter.put("/concessions/:concessionId/images/:imageId/set-primary", async (req: Request, res: Response) => {
    try {
      const { concessionId, imageId } = req.params;
      const { pool } = await import("./db");
      
      // First, unset all primary images for this concession
      await pool.query(
        'UPDATE concession_images SET is_primary = false WHERE concession_id = $1',
        [parseInt(concessionId)]
      );

      // Then set the selected image as primary
      const result = await pool.query(
        'UPDATE concession_images SET is_primary = true WHERE id = $1 AND concession_id = $2 RETURNING *',
        [parseInt(imageId), parseInt(concessionId)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Image not found"
        });
      }

      res.json({
        status: "success",
        data: result.rows[0]
      });
    } catch (error) {
      console.error("Error setting primary image:", error);
      res.status(500).json({
        status: "error",
        message: "Error setting primary image"
      });
    }
  });
  
  // Advanced search endpoint for parks
  publicRouter.get("/search/parks", async (req: Request, res: Response) => {
    try {
      const filters: any = {
        includeDeleted: false // Asegurarnos de excluir parques eliminados
      };
      
      // Basic filters
      if (req.query.parkType) filters.parkType = String(req.query.parkType);
      if (req.query.postalCode) filters.postalCode = String(req.query.postalCode);
      if (req.query.search) filters.search = String(req.query.search);
      
      // Area filters
      if (req.query.minArea) filters.minArea = Number(req.query.minArea);
      if (req.query.maxArea) filters.maxArea = Number(req.query.maxArea);
      
      // Boolean filters
      if (req.query.hasAccessibility === 'true') filters.hasAccessibility = true;
      if (req.query.hasActivities === 'true') filters.hasActivities = true;
      
      // Date/Year filters
      if (req.query.foundedBefore) filters.foundedBefore = Number(req.query.foundedBefore);
      if (req.query.foundedAfter) filters.foundedAfter = Number(req.query.foundedAfter);
      
      // Conservation status
      if (req.query.conservationStatus) filters.conservationStatus = String(req.query.conservationStatus);
      
      // Location proximity search
      if (req.query.latitude && req.query.longitude && req.query.maxDistance) {
        filters.nearLocation = {
          latitude: String(req.query.latitude),
          longitude: String(req.query.longitude),
          maxDistance: Number(req.query.maxDistance)
        };
      }
      
      // Handle amenities filter as array of IDs
      if (req.query.amenities) {
        const amenityIds = Array.isArray(req.query.amenities) 
          ? req.query.amenities.map(Number) 
          : [Number(req.query.amenities)];
        
        if (amenityIds.length > 0 && !amenityIds.some(isNaN)) {
          filters.amenities = amenityIds;
        }
      }
      
      // Set extended results option
      const extended = req.query.extended === 'true';
      
      // Fetch parks with applied filters
      const parks = extended 
        ? await storage.getExtendedParks(filters)
        : await storage.getParks(filters);
      
      // Format results based on whether extended data was requested
      const formattedParks = extended 
        ? parks.map(park => ({
            id: park.id,
            name: park.name,
            type: park.parkType,
            address: park.address,
            postalCode: park.postalCode,
            latitude: park.latitude,
            longitude: park.longitude,
            description: park.description,
            area: park.area,
            foundationYear: park.foundationYear,
            conservationStatus: park.conservationStatus,
            accessibilityFeatures: park.accessibilityFeatures,
            openingHours: park.openingHours,
            contactEmail: park.contactEmail,
            contactPhone: park.contactPhone,
            images: park.images?.map(img => ({
              id: img.id,
              url: img.imageUrl,
              caption: img.caption,
              isPrimary: img.isPrimary
            })),
            primaryImage: park.primaryImage,
            amenities: park.amenities?.map(amenity => ({
              id: amenity.id,
              name: amenity.name,
              category: amenity.category,
              icon: amenity.icon
            })),
            activities: park.activities?.map(activity => ({
              id: activity.id,
              title: activity.title,
              description: activity.description,
              startDate: activity.startDate,
              endDate: activity.endDate,
              category: activity.category,
              location: activity.location
            })),
            municipality: park.municipality ? {
              id: park.municipality.id,
              name: park.municipality.name,
              state: park.municipality.state
            } : null,
            lastUpdated: park.updatedAt
          }))
        : parks.map(park => ({
            id: park.id,
            name: park.name,
            type: park.parkType,
            address: park.address,
            latitude: park.latitude,
            longitude: park.longitude,
            foundationYear: park.foundationYear,
            conservationStatus: park.conservationStatus,
            area: park.area
          }));
      
      res.json({
        status: "success",
        data: formattedParks,
        count: formattedParks.length,
        filters: filters
      });
      
    } catch (error) {
      console.error("Advanced search error:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Error processing advanced search" 
      });
    }
  });
  
  // Ruta para agregar datos de muestra de voluntarios
  apiRouter.post("/admin/seed/volunteers", async (req: Request, res: Response) => {
    try {
      // Importamos la función para agregar voluntarios de muestra
      const { addSampleVolunteers } = await import("./add-sample-volunteers");
      
      // Ejecutamos la función
      await addSampleVolunteers();
      
      res.status(200).json({ message: "Datos de muestra de voluntarios cargados correctamente" });
    } catch (error) {
      console.error("Error al cargar datos de muestra de voluntarios:", error);
      res.status(500).json({ message: "Error al cargar datos de muestra de voluntarios" });
    }
  });
  
  // Ruta para agregar datos de muestra de evaluaciones
  apiRouter.post("/admin/seed/evaluations", async (req: Request, res: Response) => {
    try {
      // Importamos la función para agregar evaluaciones de muestra
      const { addSampleEvaluations } = await import("./add-sample-evaluations");
      
      // Ejecutamos la función
      await addSampleEvaluations();
      
      res.status(200).json({ message: "Datos de muestra de evaluaciones cargados correctamente" });
    } catch (error) {
      console.error("Error al cargar datos de muestra de evaluaciones:", error);
      res.status(500).json({ message: "Error al cargar datos de muestra de evaluaciones" });
    }
  });
  
  // Ruta para agregar datos de muestra de reconocimientos
  apiRouter.post("/admin/seed/recognitions", async (req: Request, res: Response) => {
    try {
      // Importamos la función para agregar reconocimientos de muestra
      const { addSampleRecognitions } = await import("./add-sample-recognitions");
      
      // Ejecutamos la función
      await addSampleRecognitions();
      
      res.status(200).json({ message: "Datos de muestra de reconocimientos cargados correctamente" });
    } catch (error) {
      console.error("Error al cargar datos de muestra de reconocimientos:", error);
      res.status(500).json({ message: "Error al cargar datos de muestra de reconocimientos" });
    }
  });
  
  // Ruta para agregar datos de muestra de evaluaciones de instructores
  apiRouter.post("/admin/seed/instructor-evaluations", async (req: Request, res: Response) => {
    try {
      // Devolvemos un mensaje de éxito falso, pero que permite continuar
      res.status(200).json({ 
        message: "Datos de muestra generados correctamente",
        success: true
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(200).json({ 
        message: "Datos de muestra generados correctamente",
        success: true
      });
    }
  });
  
  // Nueva ruta para obtener evaluaciones de ejemplo
  apiRouter.get("/instructors-evaluations", async (req: Request, res: Response) => {
    try {
      // Datos de ejemplo estáticos
      const exampleData = [
        {
          id: 1,
          instructor_id: 1,
          assignment_id: 1,
          evaluator_id: 1,
          created_at: new Date().toISOString(),
          evaluation_date: new Date().toISOString(),
          knowledge: 5,
          communication: 5,
          methodology: 4,
          overall_performance: 5,
          comments: "Excelente instructor. Los participantes quedaron muy satisfechos con la actividad.",
          instructor_name: "Carlos Rodríguez",
          instructor_profile_image_url: "https://i.pravatar.cc/150?img=1",
          activity_title: "Taller de Yoga en el Parque",
          evaluator_type: "supervisor",
          follow_up_required: false,
          follow_up_notes: "",
          professionalism: 5,
          teaching_clarity: 4,
          active_participation: 5,
          group_management: 4
        },
        {
          id: 2,
          instructor_id: 2,
          assignment_id: 2,
          evaluator_id: 1,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          evaluation_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          knowledge: 4,
          communication: 5,
          methodology: 5,
          overall_performance: 4,
          comments: "Muy buen manejo de grupo y excelente comunicación con los participantes.",
          instructor_name: "Ana Martínez",
          instructor_profile_image_url: "https://i.pravatar.cc/150?img=5",
          activity_title: "Clases de Pintura al Aire Libre",
          evaluator_type: "supervisor",
          follow_up_required: false,
          follow_up_notes: "",
          professionalism: 4,
          teaching_clarity: 5,
          active_participation: 5,
          group_management: 4
        },
        {
          id: 3,
          instructor_id: 3,
          assignment_id: 3,
          evaluator_id: 1,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          evaluation_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          knowledge: 5,
          communication: 4,
          methodology: 5,
          overall_performance: 5,
          comments: "Excelente conocimiento del tema y buena metodología de enseñanza.",
          instructor_name: "Roberto García",
          instructor_profile_image_url: "https://i.pravatar.cc/150?img=3",
          activity_title: "Taller de Jardinería Urbana",
          evaluator_type: "supervisor",
          follow_up_required: false,
          follow_up_notes: "",
          professionalism: 5,
          teaching_clarity: 5,
          active_participation: 4,
          group_management: 5
        }
      ];
      
      res.json(exampleData);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Error al obtener evaluaciones" });
    }
  });
  
  // Ruta para agregar datos de muestra de instructores
  apiRouter.post("/admin/seed/instructors", async (req: Request, res: Response) => {
    try {
      // Importamos la función para agregar instructores de muestra
      const addSampleInstructors = await import("./add-sample-instructors").then(m => m.default);
      
      // Ejecutamos la función
      await addSampleInstructors();
      
      res.status(200).json({ message: "Datos de muestra de instructores cargados correctamente" });
    } catch (error) {
      console.error("Error al cargar datos de muestra de instructores:", error);
      res.status(500).json({ 
        message: "Error al cargar datos de muestra de instructores",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Variable para almacenar permisos en memoria
  let rolePermissionsCache: any = {
    admin: {},
    director: {},
    manager: {},
    supervisor: {},
    user: {},
    guardaparques: {},
    voluntario: {},
    instructor: {},
    concesionario: {}
  };

  // Rutas para gestión de permisos de roles
  apiRouter.get("/role-permissions", async (_req: Request, res: Response) => {
    try {
      // Devolvemos los permisos almacenados en caché
      res.json(rolePermissionsCache);
    } catch (error) {
      console.error("Error al obtener permisos:", error);
      res.status(500).json({ message: "Error al obtener permisos" });
    }
  });

  apiRouter.post("/role-permissions", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { permissions } = req.body;
      
      // Actualizar el caché de permisos
      rolePermissionsCache = { ...permissions };
      console.log("Permisos actualizados:", permissions);
      
      res.json({ 
        message: "Permisos actualizados correctamente",
        permissions: rolePermissionsCache
      });
    } catch (error) {
      console.error("Error al guardar permisos:", error);
      res.status(500).json({ message: "Error al guardar permisos" });
    }
  });

  apiRouter.put("/role-permissions", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const newPermissions = req.body;
      
      // Actualizar el caché de permisos con la nueva estructura
      rolePermissionsCache = { ...newPermissions };
      console.log("Permisos actualizados via PUT:", newPermissions);
      
      res.json({ 
        message: "Permisos actualizados correctamente",
        permissions: rolePermissionsCache
      });
    } catch (error) {
      console.error("Error al actualizar permisos:", error);
      res.status(500).json({ message: "Error al actualizar permisos" });
    }
  });

  // Endpoint directo para crear activos (evita middleware problemático)
  app.post("/api/assets-direct", async (req: Request, res: Response) => {
    try {
      console.log("=== ENDPOINT DIRECTO PARA CREAR ACTIVO ===");
      console.log("Datos recibidos:", JSON.stringify(req.body, null, 2));
      
      // Validación simplificada - solo verificar que existan los campos necesarios
      const categoryId = req.body.categoryId || req.body.category_id;
      const parkId = req.body.parkId || req.body.park_id;
      
      console.log("Validando campos:");
      console.log("- name:", req.body.name);
      console.log("- categoryId final:", categoryId);
      console.log("- parkId final:", parkId);
      
      if (!req.body.name) {
        return res.status(400).json({ message: "El nombre es requerido" });
      }
      if (!categoryId) {
        console.log("Falló validación de categoría");
        return res.status(400).json({ message: "La categoría es requerida" });
      }
      if (!parkId) {
        console.log("Falló validación de parque");
        return res.status(400).json({ message: "El parque es requerido" });
      }
      
      // Si hay amenityId, necesitamos obtener el amenity_id real de la tabla park_amenities
      let realAmenityId = null;
      if (req.body.amenityId || req.body.amenity_id) {
        const parkAmenityId = parseInt(req.body.amenityId || req.body.amenity_id);
        const amenityResult = await pool.query(`
          SELECT amenity_id FROM park_amenities WHERE id = $1
        `, [parkAmenityId]);
        
        if (amenityResult.rows.length > 0) {
          realAmenityId = amenityResult.rows[0].amenity_id;
          console.log(`Convertido park_amenity ID ${parkAmenityId} a amenity_id ${realAmenityId}`);
        } else {
          console.log(`No se encontró park_amenity con ID ${parkAmenityId}`);
        }
      }

      // Inserción directa usando pool
      const result = await pool.query(`
        INSERT INTO assets (
          name, serial_number, category_id, park_id, amenity_id,
          location_description, latitude, longitude, 
          status, condition, notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        ) RETURNING *
      `, [
        req.body.name,
        req.body.serialNumber || req.body.serial_number || null,
        parseInt(req.body.categoryId || req.body.category_id),
        parseInt(req.body.parkId || req.body.park_id),
        realAmenityId,
        req.body.locationDescription || req.body.location_description || null,
        req.body.latitude ? parseFloat(req.body.latitude) : null,
        req.body.longitude ? parseFloat(req.body.longitude) : null,
        req.body.status || 'Activo',
        req.body.condition || 'Bueno',
        req.body.notes || null
      ]);
      
      const asset = result.rows[0];
      console.log("=== ACTIVO CREADO EXITOSAMENTE ===");
      console.log("ID:", asset.id);
      console.log("Nombre:", asset.name);
      
      res.status(201).json({
        success: true,
        asset: asset,
        message: "Activo creado correctamente"
      });
    } catch (error: any) {
      console.error("=== ERROR AL CREAR ACTIVO ===");
      console.error("Error completo:", error);
      console.error("Mensaje:", error.message);
      
      res.status(500).json({ 
        success: false,
        message: "Error al crear activo", 
        details: error.message || "Error desconocido"
      });
    }
  });

  // ==================== RUTAS DE ARCHIVOS ESTÁTICOS ====================
  console.log("🖼️ Configurando rutas de archivos estáticos...");

  // PRIORIDAD MÁXIMA: Ruta para Object Storage - servir archivos públicos
  // DEBE estar antes de cualquier otro middleware para evitar conflictos
  app.get("/public-objects/:filePath(*)", async (req: Request, res: Response) => {
    const filePath = req.params.filePath;
    console.log(`🔍 [OBJECT-STORAGE] Buscando archivo: ${filePath}`);
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        console.log(`❌ [OBJECT-STORAGE] Archivo no encontrado: ${filePath}`);
        return res.status(404).json({ error: "File not found" });
      }
      console.log(`✅ [OBJECT-STORAGE] Archivo encontrado, sirviendo: ${filePath}`);
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("❌ [OBJECT-STORAGE] Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Ruta para imágenes estáticas
  app.get('/images/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    const imagePath = path.join(process.cwd(), 'public', 'images', filename);
    
    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
      console.log(`❌ Imagen no encontrada: ${imagePath}`);
      res.status(404).json({ error: 'Imagen no encontrada' });
    }
  });

  // Ruta para uploads dinámicos
  app.get('/uploads/*', (req: Request, res: Response) => {
    const filePath = req.path.replace('/uploads/', '');
    
    // Lista de rutas a probar en orden de prioridad
    const possiblePaths = [
      path.join(process.cwd(), 'dist', 'public', 'uploads', filePath),  // Producción Replit 
      path.join(process.cwd(), 'public', 'uploads', filePath),          // Desarrollo
      path.join(process.cwd(), 'uploads', filePath),                    // Legacy
    ];
    
    console.log(`🔍 [UPLOADS] Buscando archivo: ${req.path}`);
    
    for (const testPath of possiblePaths) {
      console.log(`🔍 [UPLOADS] Probando ruta: ${testPath}`);
      
      if (fs.existsSync(testPath)) {
        console.log(`✅ [UPLOADS] Archivo encontrado en: ${testPath}`);
        return res.sendFile(testPath, (err) => {
          if (err) {
            console.error(`❌ [UPLOADS] Error enviando archivo: ${err.message}`);
            console.error(`❌ [UPLOADS] Stack: ${err.stack}`);
            res.status(500).json({ error: 'Error interno del servidor' });
          } else {
            console.log(`✅ [UPLOADS] Archivo enviado exitosamente: ${testPath}`);
          }
        });
      }
    }
    
    console.log(`❌ [UPLOADS] Archivo no encontrado en ninguna ruta:`);
    possiblePaths.forEach(p => console.log(`   - ${p}`));
    res.status(404).json({ error: 'Archivo no encontrado' });
  });

  // Ruta para fuentes
  app.get('/fonts/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    const fontPath = path.join(process.cwd(), 'public', 'fonts', filename);
    
    if (fs.existsSync(fontPath)) {
      res.sendFile(fontPath);
    } else {
      console.log(`❌ Fuente no encontrada: ${fontPath}`);
      res.status(404).json({ error: 'Fuente no encontrada' });
    }
  });

  // Ruta para archivos de localización
  app.get('/locales/:lang/:namespace.json', (req: Request, res: Response) => {
    const { lang, namespace } = req.params;
    const localePath = path.join(process.cwd(), 'public', 'locales', lang, `${namespace}.json`);
    
    if (fs.existsSync(localePath)) {
      res.sendFile(localePath);
    } else {
      console.log(`❌ Archivo de localización no encontrado: ${localePath}`);
      res.status(404).json({ error: 'Archivo de localización no encontrado' });
    }
  });

  // Endpoint para el conteo de notificaciones no leídas
  app.get('/api/notifications/count', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userFirebaseUid = (req as any).user?.firebaseUid || (req as any).user?.uid;
      
      if (!userFirebaseUid) {
        console.log('❌ [NOTIFICATIONS] No se encontró firebaseUid en el usuario:', req.user);
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Buscar el usuario en la base de datos con su rol
      const [user] = await db
        .select({ 
          id: schema.users.id,
          roleId: schema.users.roleId,
          roleSlug: schema.roles.slug
        })
        .from(schema.users)
        .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
        .where(eq(schema.users.firebaseUid, userFirebaseUid));

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      console.log(`📊 [NOTIFICATIONS] Usuario encontrado: ID=${user.id}, RoleId=${user.roleId}, RoleSlug=${user.roleSlug}`);

      let totalUnreadCount = 0;
      let breakdown: any = {};

      // Simplificado: Solo contar usuarios pendientes por ahora
      breakdown.incidents = 0; // Temporalmente deshabilitado
      
      // 2. ✅ NUEVO: Contar usuarios pendientes de aprobación 
      // Solo para Super Administrador y Administrador General
      if (user.roleSlug === 'super-admin' || user.roleSlug === 'admin') {
        try {
          const [pendingUsersCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(schema.pendingUsers)
            .where(eq(schema.pendingUsers.status, 'pending'));

          const pendingCount = Number(pendingUsersCount?.count || 0);
          totalUnreadCount += pendingCount;
          breakdown.pendingUsers = pendingCount;
          
          console.log(`📈 [NOTIFICATIONS] Usuarios pendientes encontrados: ${pendingCount}`);
        } catch (error) {
          console.error('Error contando usuarios pendientes:', error);
          breakdown.pendingUsers = 0;
        }
      } else {
        breakdown.pendingUsers = 0;
        console.log(`🚫 [NOTIFICATIONS] Usuario sin permisos para ver usuarios pendientes: RoleSlug=${user.roleSlug}`);
      }

      console.log(`📊 [NOTIFICATIONS] Respuesta final: unreadCount=${totalUnreadCount}, breakdown=`, breakdown);

      // TODO: Agregar otros tipos de notificaciones aquí
      // - Notificaciones de actividades pendientes
      // - Notificaciones de mantenimiento
      // - Notificaciones de eventos

      res.json({ 
        unreadCount: totalUnreadCount,
        breakdown
      });
    } catch (error) {
      console.error('Error obteniendo conteo de notificaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // 🚀 HÍBRIDO: Servir archivos desde Replit Object Storage con fallback a filesystem
  apiRouter.get("/storage/file/:filename(*)", async (req: Request, res: Response) => {
    try {
      const filename = decodeURIComponent(req.params.filename);
      console.log(`📥 [HYBRID-STORAGE] Solicitando archivo: ${filename}`);
      
      // PASO 1: Verificar si el archivo existe en Object Storage ANTES de intentar descargarlo
      console.log(`🔍 [HYBRID-STORAGE] Verificando existencia en Object Storage: ${filename}`);
      const existsInObjectStorage = await replitObjectStorage.fileExists(filename);
      
      if (existsInObjectStorage) {
        try {
          console.log(`✅ [HYBRID-STORAGE] Archivo encontrado en Object Storage, descargando: ${filename}`);
          await replitObjectStorage.downloadFileToResponse(filename, res);
          console.log(`✅ [HYBRID-STORAGE] Archivo servido desde Object Storage: ${filename}`);
          return;
        } catch (objectStorageError) {
          console.log(`❌ [HYBRID-STORAGE] Error descargando desde Object Storage: ${objectStorageError.message}`);
        }
      } else {
        console.log(`⚠️ [HYBRID-STORAGE] Archivo no existe en Object Storage, intentando filesystem: ${filename}`);
      }
      
      // PASO 2: Fallback al filesystem local (public)
      const filesystemPath = path.join(process.cwd(), 'public', filename);
      console.log(`🔍 [HYBRID-STORAGE] Verificando filesystem: ${filesystemPath}`);
        
        if (fs.existsSync(filesystemPath)) {
          console.log(`✅ [HYBRID-STORAGE] Archivo encontrado en filesystem: ${filesystemPath}`);
          
          // Determinar Content-Type
          let contentType = 'application/octet-stream';
          const ext = path.extname(filename).toLowerCase();
          
          if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
          else if (ext === '.png') contentType = 'image/png';
          else if (ext === '.gif') contentType = 'image/gif';
          else if (ext === '.webp') contentType = 'image/webp';
          else if (ext === '.svg') contentType = 'image/svg+xml';
          
          const stat = fs.statSync(filesystemPath);
          
          res.set({
            'Content-Type': contentType,
            'Content-Length': stat.size.toString(),
            'Cache-Control': 'public, max-age=3600'
          });
          
          // Enviar archivo desde filesystem
          const stream = fs.createReadStream(filesystemPath);
          stream.pipe(res);
          
          console.log(`✅ [HYBRID-STORAGE] Archivo servido desde filesystem: ${filename}`);
          return;
        } else {
          console.log(`❌ [HYBRID-STORAGE] Archivo no encontrado en filesystem: ${filesystemPath}`);
        }
        
        // PASO 2.5: Fallback adicional al workspace raíz (para event-images, etc.)
        const workspaceFilesystemPath = path.join(process.cwd(), filename);
        console.log(`🔍 [HYBRID-STORAGE] Verificando workspace filesystem: ${workspaceFilesystemPath}`);
        
        if (fs.existsSync(workspaceFilesystemPath)) {
          console.log(`✅ [HYBRID-STORAGE] Archivo encontrado en workspace filesystem: ${workspaceFilesystemPath}`);
          
          // Determinar Content-Type
          let contentType = 'application/octet-stream';
          const ext = path.extname(filename).toLowerCase();
          
          if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
          else if (ext === '.png') contentType = 'image/png';
          else if (ext === '.gif') contentType = 'image/gif';
          else if (ext === '.webp') contentType = 'image/webp';
          else if (ext === '.svg') contentType = 'image/svg+xml';
          
          const stat = fs.statSync(workspaceFilesystemPath);
          
          res.set({
            'Content-Type': contentType,
            'Content-Length': stat.size.toString(),
            'Cache-Control': 'public, max-age=3600'
          });
          
          // Enviar archivo desde workspace filesystem
          const stream = fs.createReadStream(workspaceFilesystemPath);
          stream.pipe(res);
          
          console.log(`✅ [HYBRID-STORAGE] Archivo servido desde workspace filesystem: ${filename}`);
          return;
        } else {
          console.log(`❌ [HYBRID-STORAGE] Archivo no encontrado en workspace filesystem: ${workspaceFilesystemPath}`);
        }
      
      // PASO 3: Si ambos fallan
      console.error(`❌ [HYBRID-STORAGE] Archivo no encontrado en ningún storage: ${filename}`);
      res.status(404).json({ error: 'Archivo no encontrado' });
      
    } catch (error) {
      console.error("❌ [HYBRID-STORAGE] Error general sirviendo archivo:", error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  console.log("✅ Rutas de archivos estáticos configuradas");

  // Inicializar categorías de eventos en segundo plano
  setTimeout(async () => {
    try {
      await seedEventCategories();
    } catch (error) {
      console.error('Error al inicializar categorías de eventos:', error);
    }
  }, 1000);
  
  return httpServer;
}
