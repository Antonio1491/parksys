import { pgTable, text, serial, integer, boolean, timestamp, date, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { parks, users, amenities } from "./schema";

// 1. Tabla de categorías de activos
export const assetCategories = pgTable("asset_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"), // Nombre del icono a mostrar en la UI
  color: text("color"), // Color asociado a la categoría para visualización 
  parentId: integer("parent_id"), // Para categorías jerárquicas
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 2. Tabla principal de activos
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  serialNumber: text("serial_number"), // Número de serie o identificador único del activo
  categoryId: integer("category_id").notNull(),
  parkId: integer("park_id").notNull(), // Parque donde se encuentra el activo
  amenityId: integer("amenity_id"), // Amenidad donde se encuentra el activo (opcional)
  locationDescription: text("location_description"), // Descripción textual de la ubicación (manual o desde amenidad)
  latitude: text("latitude"), // Coordenadas para ubicación exacta
  longitude: text("longitude"),
  acquisitionDate: date("acquisition_date"), // Fecha de adquisición
  acquisitionCost: decimal("acquisition_cost", { precision: 10, scale: 2 }), // Costo de adquisición
  currentValue: decimal("current_value", { precision: 10, scale: 2 }), // Valor actual después de depreciación
  manufacturer: text("manufacturer"), // Fabricante
  model: text("model"), // Modelo
  status: text("status").notNull().default("active"), // active, maintenance, damaged, retired
  condition: text("condition").notNull().default("good"), // excellent, good, fair, poor
  maintenanceFrequency: text("maintenance_frequency"), // daily, weekly, monthly, quarterly, yearly
  lastMaintenanceDate: date("last_maintenance_date"),
  nextMaintenanceDate: date("next_maintenance_date"),
  expectedLifespan: integer("expected_lifespan"), // Vida útil esperada en meses
  notes: text("notes"),
  qrCode: text("qr_code"), // URL o identificador del código QR para escaneo
  responsiblePersonId: integer("responsible_person_id"), // Persona responsable del activo
  photos: text("photos").array(), // URLs de fotos del activo
  documents: text("documents").array(), // URLs de documentos relacionados (manuales, garantías)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 3. Tabla de mantenimientos de activos
export const assetMaintenances = pgTable("asset_maintenances", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull(),
  maintenanceType: text("maintenance_type").notNull(), // preventive, corrective, inspection
  date: date("date").notNull(),
  description: text("description").notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  assignedToId: integer("assigned_to_id"), // Técnico asignado al mantenimiento
  notes: text("notes"), // Notas adicionales para la programación
  findings: text("findings"), // Hallazgos durante el mantenimiento
  actions: text("actions"), // Acciones realizadas
  completionNotes: text("completion_notes"), // Notas sobre la finalización
  photos: text("photos").array(), // Fotos del mantenimiento
  status: text("status").notNull().default("scheduled"), // scheduled, in-progress, completed, cancelled
  completedAt: timestamp("completed_at"), // Fecha de finalización real
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 4. Tabla de historial de cambios de activos
export const assetHistory = pgTable("asset_history", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull(),
  changeType: text("change_type").notNull(), // acquisition, transfer, status_change, maintenance, retirement
  date: date("date").notNull(), // Date field (matches database)
  description: text("description").notNull(),
  changedBy: text("changed_by"), // Usuario como texto (matches database TEXT field)
  previousValue: text("previous_value"), // Valor anterior como texto (matches database)
  newValue: text("new_value"), // Nuevo valor como texto (matches database)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(), // Matches database
  updatedAt: timestamp("updated_at").defaultNow(), // Matches database
});

// Definición de relaciones
export const assetCategoriesRelations = relations(assetCategories, ({ one, many }) => ({
  parentCategory: one(assetCategories, {
    fields: [assetCategories.parentId],
    references: [assetCategories.id],
    relationName: "parentChildCategories"
  }),
  childCategories: many(assetCategories, { relationName: "parentChildCategories" }),
  assets: many(assets)
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  category: one(assetCategories, {
    fields: [assets.categoryId],
    references: [assetCategories.id]
  }),
  park: one(parks, {
    fields: [assets.parkId],
    references: [parks.id]
  }),
  amenity: one(amenities, {
    fields: [assets.amenityId],
    references: [amenities.id]
  }),
  maintenances: many(assetMaintenances),
  historyEntries: many(assetHistory),
  responsiblePerson: one(users, {
    fields: [assets.responsiblePersonId],
    references: [users.id]
  }),
}));

export const assetMaintenancesRelations = relations(assetMaintenances, ({ one }) => ({
  asset: one(assets, {
    fields: [assetMaintenances.assetId],
    references: [assets.id]
  }),
  assignedTo: one(users, {
    fields: [assetMaintenances.assignedToId],
    references: [users.id],
    relationName: "maintenanceAssignee"
  })
}));

export const assetHistoryRelations = relations(assetHistory, ({ one }) => ({
  asset: one(assets, {
    fields: [assetHistory.assetId],
    references: [assets.id]
  }),
  // 🚨 Note: changedBy is TEXT field, not a foreign key, so no user relation here
  // Use backend queries to JOIN with users table when needed
}));

// Schemas de Inserción
export const insertAssetCategorySchema = createInsertSchema(assetCategories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetMaintenanceSchema = createInsertSchema(assetMaintenances).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetHistorySchema = createInsertSchema(assetHistory).omit({ id: true, createdAt: true });

// Tipos para uso en la aplicación
export type AssetCategory = typeof assetCategories.$inferSelect;
export type InsertAssetCategory = z.infer<typeof insertAssetCategorySchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type AssetMaintenance = typeof assetMaintenances.$inferSelect;
export type InsertAssetMaintenance = z.infer<typeof insertAssetMaintenanceSchema>;

export type AssetHistoryEntry = typeof assetHistory.$inferSelect;
export type InsertAssetHistoryEntry = z.infer<typeof insertAssetHistorySchema>;

// Definir categorías comunes de activos para inicialización
export const DEFAULT_ASSET_CATEGORIES = [
  { name: "Mobiliario Urbano", icon: "couch", color: "#3B82F6", description: "Bancas, mesas, basureros y otros elementos de mobiliario" },
  { name: "Equipamiento Deportivo", icon: "dumbbell", color: "#10B981", description: "Equipos para ejercicio y práctica deportiva" },
  { name: "Juegos Infantiles", icon: "playCircle", color: "#F59E0B", description: "Columpios, resbaladillas y otros juegos para niños" },
  { name: "Infraestructura", icon: "building", color: "#6366F1", description: "Elementos estructurales como caminos, puentes, etc." },
  { name: "Tecnología", icon: "wifi", color: "#EC4899", description: "Equipos tecnológicos como cámaras, sensores, etc." },
  { name: "Herramientas", icon: "wrench", color: "#8B5CF6", description: "Herramientas para mantenimiento y reparación" },
  { name: "Vehículos", icon: "truck", color: "#EF4444", description: "Vehículos de mantenimiento, transporte y seguridad" },
  { name: "Iluminación", icon: "lightbulb", color: "#F59E0B", description: "Postes de luz, reflectores y otros elementos de iluminación" },
  { name: "Señalización", icon: "signpost", color: "#14B8A6", description: "Señales informativas, preventivas y restrictivas" },
  { name: "Sistemas de Riego", icon: "droplet", color: "#3B82F6", description: "Equipo para riego y mantenimiento de áreas verdes" }
] as const;

// Condiciones para activos
export const ASSET_CONDITIONS = [
  { value: "excellent", label: "Excelente" },
  { value: "good", label: "Bueno" },
  { value: "fair", label: "Regular" },
  { value: "poor", label: "Malo" },
] as const;

// Estados de activos
export const ASSET_STATUSES = [
  { value: "active", label: "Activo" },
  { value: "maintenance", label: "En Mantenimiento" },
  { value: "damaged", label: "Dañado" },
  { value: "retired", label: "Retirado" },
] as const;

// Frecuencias de mantenimiento
export const MAINTENANCE_FREQUENCIES = [
  { value: "daily", label: "Diario" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "quarterly", label: "Trimestral" },
  { value: "biannual", label: "Semestral" },
  { value: "yearly", label: "Anual" },
] as const;

// Tipos de mantenimiento
export const MAINTENANCE_TYPES = [
  { value: "preventive", label: "Preventivo" },
  { value: "corrective", label: "Correctivo" },
  { value: "inspection", label: "Inspección" },
  { value: "emergency", label: "Emergencia" },
] as const;