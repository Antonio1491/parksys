import { pgTable, serial, varchar, text, timestamp, integer, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './schema';

// ============================================
// TABLA: ad_campaigns (sin cambios)
// ============================================
export const adCampaigns = pgTable('ad_campaigns', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  client: varchar('client', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'), // active, paused, completed, cancelled
  budget: decimal('budget', { precision: 10, scale: 2 }),
  priority: integer('priority').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ============================================
// TABLA: ad_spaces (sin cambios)
// ============================================
export const adSpaces = pgTable('ad_spaces', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  description: text('description'),
  dimensions: varchar('dimensions', { length: 50 }), // 1200x90, 300x250, etc.
  position: varchar('position', { length: 50 }).notNull(), // header, sidebar, footer, content, modal
  pageType: varchar('page_type').notNull(), // ['parks', 'species', 'activities', 'concessions', 'home']
  isActive: boolean('is_active').default(true),
  maxFileSize: integer('max_file_size').default(5242880), // en bytes
  allowedFormats: text('allowed_formats').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ============================================
// TABLA: advertisements (SIMPLIFICADA)
// De 16 campos → 15 campos
// ============================================
export const advertisements = pgTable('advertisements', {
  // ============================================
  // IDENTIFICACIÓN (2 campos)
  // ============================================
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').references(() => adCampaigns.id),

  // ============================================
  // CONTENIDO (2 campos)
  // ============================================
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'), // ✅ Cambio: "content" → "description"

  // ============================================
  // MEDIA UNIFICADA (4 campos)
  // ============================================
  // ✅ Cambio: Unificar imageUrl + videoUrl → mediaUrl
  mediaUrl: varchar('media_url', { length: 500 }),
  mediaType: varchar('media_type', { length: 20 }).notNull().default('image'), // "image", "video", "html"
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }), // ✅ Nuevo: para videos
  duration: integer('duration'), // Para videos, en segundos

  // ============================================
  // CALL TO ACTION (2 campos)
  // ============================================
  linkUrl: varchar('link_url', { length: 500 }),
  buttonText: varchar('button_text', { length: 100 }), // ✅ Nuevo: texto del CTA

  // ============================================
  // CONFIGURACIÓN (2 campos)
  // ============================================
  // ✅ Cambio: "type" → "adType" para claridad
  adType: varchar('ad_type', { length: 50 }).notNull().default('banner'), // banner, video, native, institutional, commercial, promotional
  priority: integer('priority').default(5), // 1-10

  // ============================================
  // ESTADO (1 campo)
  // ============================================
  // ✅ Cambio: Usar solo isActive, eliminar "status"
  isActive: boolean('is_active').default(true),

  // ============================================
  // TIMESTAMPS (2 campos)
  // ============================================
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ============================================
// CAMPOS ELIMINADOS Y JUSTIFICACIÓN:
// ============================================
/*
❌ ELIMINADOS:
1. storageType - Innecesario (se deduce de la URL)
2. mediaFileId - Redundante (usar solo mediaUrl)
3. imageUrl - Unificado en mediaUrl
4. videoUrl - Unificado en mediaUrl
5. altText - Opcional, usar title si se necesita
6. type - Renombrado a adType
7. status - Usar solo isActive (más simple)
8. content - Renombrado a description

✅ NUEVOS:
1. thumbnailUrl - Necesario para previews de video
2. buttonText - Mejor UX para CTAs
3. description - Nombre más descriptivo que "content"
*/

// ============================================
// TABLA: ad_placements (MEJORADA)
// ============================================
export const adPlacements = pgTable('ad_placements', {
  id: serial('id').primaryKey(),
  advertisementId: integer('advertisement_id').references(() => advertisements.id).notNull(),
  adSpaceId: integer('ad_space_id').references(() => adSpaces.id).notNull(),

  // Targeting
  pageType: varchar('page_type', { length: 50 }).notNull(), // parks, species, activities, concessions, home, all
  pageId: integer('page_id'), // ID específico de la página (opcional, null = todas las páginas del tipo)

  // Programación
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),

  // Configuración
  priority: integer('priority').default(5),
  isActive: boolean('is_active').default(true),

  // ✅ Programación horaria (movido desde advertisements)
  frequency: varchar('frequency', { length: 20 }).default('always'), // always, once_per_session, once_per_day, custom
  scheduledDays: text('scheduled_days').array(), // ['monday', 'tuesday', ...]
  scheduledHours: integer('scheduled_hours').array(), // [9, 10, 11, 12, ...]

  // ✅ Métricas básicas (mover a ad_analytics para reporting detallado)
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ============================================
// TABLA: ad_analytics (sin cambios)
// ============================================
export const adAnalytics = pgTable('ad_analytics', {
  id: serial('id').primaryKey(),
  placementId: integer('placement_id').references(() => adPlacements.id).notNull(),
  date: timestamp('date').notNull(),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  conversions: integer('conversions').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// ============================================
// RELACIONES
// ============================================

export const adCampaignsRelations = relations(adCampaigns, ({ many }) => ({
  advertisements: many(advertisements)
}));

export const adSpacesRelations = relations(adSpaces, ({ many }) => ({
  placements: many(adPlacements)
}));

export const advertisementsRelations = relations(advertisements, ({ one, many }) => ({
  campaign: one(adCampaigns, {
    fields: [advertisements.campaignId],
    references: [adCampaigns.id]
  }),
  placements: many(adPlacements)
}));

export const adPlacementsRelations = relations(adPlacements, ({ one, many }) => ({
  advertisement: one(advertisements, {
    fields: [adPlacements.advertisementId],
    references: [advertisements.id]
  }),
  space: one(adSpaces, {
    fields: [adPlacements.adSpaceId],
    references: [adSpaces.id]
  }),
  analytics: many(adAnalytics)
}));

export const adAnalyticsRelations = relations(adAnalytics, ({ one }) => ({
  placement: one(adPlacements, {
    fields: [adAnalytics.placementId],
    references: [adPlacements.id]
  })
}));

// ============================================
// SCHEMAS DE VALIDACIÓN ZOD
// ============================================

// Schema base para advertisements
export const insertAdvertisementSchema = createInsertSchema(advertisements, {
  title: z.string().min(1, "El título es requerido").max(255),
  description: z.string().optional(),
  mediaUrl: z.string().url("URL inválida").optional(),
  mediaType: z.enum(["image", "video", "html"]).default("image"),
  thumbnailUrl: z.string().url("URL inválida").optional(),
  duration: z.number().int().positive().optional(),
  linkUrl: z.string().url("URL inválida").optional(),
  buttonText: z.string().max(100).optional(),
  adType: z.enum([
    "banner",
    "video", 
    "native",
    "institutional",
    "commercial",
    "promotional"
  ]).default("banner"),
  priority: z.number().int().min(1).max(10).default(5),
  isActive: z.boolean().default(true),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Validaciones condicionales
export const advertisementFormSchema = insertAdvertisementSchema
  .refine(
    (data) => {
      // Si es tipo video, debe tener mediaUrl
      if (data.mediaType === "video" && !data.mediaUrl) {
        return false;
      }
      return true;
    },
    {
      message: "Los anuncios de video requieren una URL de media",
      path: ["mediaUrl"],
    }
  )
  .refine(
    (data) => {
      // Si es tipo video, debe tener thumbnail
      if (data.mediaType === "video" && !data.thumbnailUrl) {
        return false;
      }
      return true;
    },
    {
      message: "Los anuncios de video requieren un thumbnail",
      path: ["thumbnailUrl"],
    }
  );

// Schemas para otras tablas
export const insertAdCampaignSchema = createInsertSchema(adCampaigns, {
  name: z.string().min(1, "El nombre es requerido"),
  client: z.string().min(1, "El cliente es requerido"),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(["active", "paused", "completed", "cancelled"]).default("active"),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["endDate"],
  }
);

export const insertAdSpaceSchema = createInsertSchema(adSpaces, {
  position: z.string().min(1, "La posición es requerida"),
  pageType: z.string().min(1, "El tipo de página es requerido"),
});

export const insertAdPlacementSchema = createInsertSchema(adPlacements, {
  startDate: z.date(),
  endDate: z.date(),
  frequency: z.enum(["always", "once_per_session", "once_per_day", "custom"]).default("always"),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["endDate"],
  }
);

export const insertAdAnalyticsSchema = createInsertSchema(adAnalytics);

// ============================================
// TIPOS TYPESCRIPT
// ============================================

export type AdCampaign = typeof adCampaigns.$inferSelect;
export type InsertAdCampaign = z.infer<typeof insertAdCampaignSchema>;

export type AdSpace = typeof adSpaces.$inferSelect;
export type InsertAdSpace = z.infer<typeof insertAdSpaceSchema>;

export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type AdvertisementFormData = z.infer<typeof advertisementFormSchema>;

export type AdPlacement = typeof adPlacements.$inferSelect;
export type InsertAdPlacement = z.infer<typeof insertAdPlacementSchema>;

export type AdAnalytics = typeof adAnalytics.$inferSelect;
export type InsertAdAnalytics = z.infer<typeof insertAdAnalyticsSchema>;

// ============================================
// TIPOS EXTENDIDOS CON RELACIONES
// ============================================

export type AdvertisementWithRelations = Advertisement & {
  campaign?: AdCampaign | null;
  placements?: AdPlacementWithSpace[];
};

export type AdPlacementWithSpace = AdPlacement & {
  advertisement?: Advertisement;
  space?: AdSpace;
};

export type AdCampaignWithAds = AdCampaign & {
  advertisements?: Advertisement[];
};

// ============================================
// CONSTANTES Y ENUMS
// ============================================

export const MEDIA_TYPES = ["image", "video", "html"] as const;
export const AD_TYPES = [
  "banner",
  "video",
  "native",
  "institutional",
  "commercial",
  "promotional",
] as const;
export const CAMPAIGN_STATUS = ["active", "paused", "completed", "cancelled"] as const;
export const FREQUENCY_TYPES = ["always", "once_per_session", "once_per_day", "custom"] as const;