import { pgTable, serial, varchar, text, timestamp, integer, boolean, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { users } from './schema';

// Archivos multimedia para publicidad (almacenamiento híbrido)
export const adMediaFiles = pgTable('ad_media_files', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(), // en bytes
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  mediaType: varchar('media_type', { length: 20 }).notNull(), // "image", "video", "gif"
  duration: integer('duration'), // para videos, en segundos
  dimensions: varchar('dimensions', { length: 50 }), // "1920x1080"
  fileHash: varchar('file_hash', { length: 64 }), // hash SHA256 para evitar duplicados
  uploadedBy: integer('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Campañas publicitarias
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

// Espacios publicitarios disponibles
export const adSpaces = pgTable('ad_spaces', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  description: text('description'),
  dimensions: varchar('dimensions', { length: 50 }), // 1200x90, 300x250, etc.
  position: varchar('position', { length: 50 }).notNull(), // header, sidebar, footer, content, modal
  pageType: varchar('page_type').notNull(), // ['parks', 'species', 'activities', 'concessions', 'home']
  isActive: boolean('is_active').default(true),
  maxFileSize: integer('max_file_size').default(5242880), // en bytes
  allowedFormats: text('allowed_formats').array().default(sql`ARRAY['image/jpeg', 'image/png', 'image/gif']`),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Anuncios individuales
export const advertisements = pgTable('advertisements', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').references(() => adCampaigns.id),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  
  // Almacenamiento híbrido - puede usar URL externa o archivo interno
  storageType: varchar('storage_type', { length: 20 }).notNull().default('url'), // "url" o "file"
  mediaFileId: integer('media_file_id').references(() => adMediaFiles.id), // Para archivos internos
  imageUrl: varchar('image_url', { length: 500 }), // Para URLs externas
  videoUrl: varchar('video_url', { length: 500 }), // Para videos externos
  
  linkUrl: varchar('link_url', { length: 500 }),
  altText: varchar('alt_text', { length: 255 }),
  
  // Tipo de contenido multimedia
  mediaType: varchar('media_type', { length: 20 }).notNull().default('image'), // "image", "video", "gif"
  duration: integer('duration'), // para videos, en segundos
  
  type: varchar('type', { length: 50 }).notNull(), // banner, text, video, interactive
  priority: integer('priority').default(0),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Asignaciones de anuncios a espacios
export const adPlacements = pgTable('ad_placements', {
  id: serial('id').primaryKey(),
  adId: integer('ad_id').references(() => advertisements.id),
  spaceId: integer('space_id').references(() => adSpaces.id),
  pageType: varchar('page_type', { length: 50 }).notNull(), // parks, species, activities, concessions, home
  pageId: integer('page_id'), // ID específico de la página (opcional, null = todas las páginas del tipo)
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isActive: boolean('is_active').default(true),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// Métricas de rendimiento
export const adAnalytics = pgTable('ad_analytics', {
  id: serial('id').primaryKey(),
  placementId: integer('placement_id').references(() => adPlacements.id),
  date: timestamp('date').notNull(),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  conversions: integer('conversions').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// Relaciones
export const adCampaignsRelations = relations(adCampaigns, ({ many }) => ({
  advertisements: many(advertisements)
}));

export const adSpacesRelations = relations(adSpaces, ({ many }) => ({
  placements: many(adPlacements)
}));

export const adMediaFilesRelations = relations(adMediaFiles, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [adMediaFiles.uploadedBy],
    references: [users.id]
  }),
  advertisements: many(advertisements)
}));

export const advertisementsRelations = relations(advertisements, ({ one, many }) => ({
  campaign: one(adCampaigns, {
    fields: [advertisements.campaignId],
    references: [adCampaigns.id]
  }),
  mediaFile: one(adMediaFiles, {
    fields: [advertisements.mediaFileId],
    references: [adMediaFiles.id]
  }),
  placements: many(adPlacements)
}));

export const adPlacementsRelations = relations(adPlacements, ({ one, many }) => ({
  advertisement: one(advertisements, {
    fields: [adPlacements.adId],
    references: [advertisements.id]
  }),
  space: one(adSpaces, {
    fields: [adPlacements.spaceId],
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

// Schemas de validación
export const insertAdMediaFileSchema = createInsertSchema(adMediaFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export const insertAdCampaignSchema = createInsertSchema(adCampaigns);
export const insertAdSpaceSchema = createInsertSchema(adSpaces);
export const insertAdvertisementSchema = createInsertSchema(advertisements);
export const insertAdPlacementSchema = createInsertSchema(adPlacements);
export const insertAdAnalyticsSchema = createInsertSchema(adAnalytics);

// Tipos
export type AdMediaFile = typeof adMediaFiles.$inferSelect;
export type InsertAdMediaFile = z.infer<typeof insertAdMediaFileSchema>;
export type AdCampaign = typeof adCampaigns.$inferSelect;
export type InsertAdCampaign = z.infer<typeof insertAdCampaignSchema>;
export type AdSpace = typeof adSpaces.$inferSelect;
export type InsertAdSpace = z.infer<typeof insertAdSpaceSchema>;
export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type AdPlacement = typeof adPlacements.$inferSelect;
export type InsertAdPlacement = z.infer<typeof insertAdPlacementSchema>;
export type AdAnalytics = typeof adAnalytics.$inferSelect;
export type InsertAdAnalytics = z.infer<typeof insertAdAnalyticsSchema>;