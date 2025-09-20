import { pgTable, serial, varchar, text, date, time, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { parks } from "./schema";

// ===========================
// EVENTOS AMBU SCHEMA
// ===========================

// Tabla principal de eventos AMBU
export const eventosAmbu = pgTable("eventos_ambu", {
  id: serial("id").primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descripcion: text("descripcion").notNull(),
  categoria: varchar("categoria", { length: 100 }).notNull(),
  fechaEvento: date("fecha_evento").notNull(),
  horaInicio: time("hora_inicio").notNull(),
  horaFin: time("hora_fin").notNull(),
  fechaMontaje: date("fecha_montaje"),
  horaMontaje: time("hora_montaje"),
  fechaDesmontaje: date("fecha_desmontaje"),
  horaDesmontaje: time("hora_desmontaje"),
  parqueId: integer("parque_id").references(() => parks.id),
  zonasRequeridas: text("zonas_requeridas"),
  numeroAsistentes: integer("numero_asistentes").notNull(),
  numeroMenores: integer("numero_menores").default(0),
  numeroAdultos: integer("numero_adultos").default(0),
  equipamiento: text("equipamiento"),
  materiales: text("materiales"),
  mobiliario: text("mobiliario"),
  tiposResiduos: text("tipos_residuos"),
  logisticaDetallada: text("logistica_detallada"),
  sembrado: text("sembrado"),
  minutoAMinuto: text("minuto_a_minuto"),
  requiereFotografiaAutorizada: boolean("requiere_fotografia_autorizada").default(false),
  status: varchar("status", { length: 20 }).notNull().default("borrador"), // borrador, solicitado, en_revision, aprobado, rechazado, cancelado, realizado
  costoTotal: decimal("costo_total", { precision: 10, scale: 2 }).default("0.00"),
  anticipo: decimal("anticipo", { precision: 10, scale: 2 }).default("0.00"),
  depositoGarantia: decimal("deposito_garantia", { precision: 10, scale: 2 }).default("0.00"),
  observaciones: text("observaciones"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Datos del solicitante
export const solicitudesAmbu = pgTable("solicitudes_ambu", {
  id: serial("id").primaryKey(),
  eventoId: integer("evento_id").references(() => eventosAmbu.id).notNull(),
  nombreSolicitante: varchar("nombre_solicitante", { length: 255 }).notNull(),
  telefonoSolicitante: varchar("telefono_solicitante", { length: 20 }).notNull(),
  emailSolicitante: varchar("email_solicitante", { length: 255 }).notNull(),
  nombreInstitucion: varchar("nombre_institucion", { length: 255 }),
  domicilioCalle: varchar("domicilio_calle", { length: 255 }),
  domicilioNumero: varchar("domicilio_numero", { length: 20 }),
  domicilioInterior: varchar("domicilio_interior", { length: 20 }),
  domicilioColonia: varchar("domicilio_colonia", { length: 100 }),
  domicilioCP: varchar("domicilio_cp", { length: 10 }),
  telefonoInstitucion: varchar("telefono_institucion", { length: 20 }),
  emailInstitucion: varchar("email_institucion", { length: 255 }),
  municipio: varchar("municipio", { length: 100 }),
  requiereFactura: boolean("requiere_factura").default(false),
  rfc: varchar("rfc", { length: 20 }),
  razonSocial: varchar("razon_social", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow()
});

// Documentos del evento
export const documentosAmbu = pgTable("documentos_ambu", {
  id: serial("id").primaryKey(),
  eventoId: integer("evento_id").references(() => eventosAmbu.id).notNull(),
  tipoDocumento: varchar("tipo_documento", { length: 100 }).notNull(),
  nombreArchivo: varchar("nombre_archivo", { length: 255 }).notNull(),
  rutaArchivo: varchar("ruta_archivo", { length: 500 }).notNull(),
  tamaño: integer("tamaño"),
  status: varchar("status", { length: 20 }).default("pendiente"), // pendiente, validado, rechazado
  observaciones: text("observaciones"),
  uploadedAt: timestamp("uploaded_at").defaultNow()
});

// Desglose de costos
export const costosAmbu = pgTable("costos_ambu", {
  id: serial("id").primaryKey(),
  eventoId: integer("evento_id").references(() => eventosAmbu.id).notNull(),
  concepto: varchar("concepto", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  cantidad: integer("cantidad").default(1),
  precioUnitario: decimal("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Seguimiento del evento
export const seguimientoAmbu = pgTable("seguimiento_ambu", {
  id: serial("id").primaryKey(),
  eventoId: integer("evento_id").references(() => eventosAmbu.id).notNull(),
  accion: varchar("accion", { length: 100 }).notNull(),
  observaciones: text("observaciones"),
  responsable: varchar("responsable", { length: 255 }),
  fechaAccion: timestamp("fecha_accion").defaultNow()
});

// Reuniones de logística
export const reunionesAmbu = pgTable("reuniones_ambu", {
  id: serial("id").primaryKey(),
  eventoId: integer("evento_id").references(() => eventosAmbu.id).notNull(),
  fechaReunion: date("fecha_reunion").notNull(),
  horaReunion: time("hora_reunion").notNull(),
  lugar: varchar("lugar", { length: 255 }),
  agenda: text("agenda"),
  acuerdos: text("acuerdos"),
  asistentes: text("asistentes"),
  responsableReunion: varchar("responsable_reunion", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow()
});

// Schemas de validación con Zod
export const insertEventoAmbuSchema = createInsertSchema(eventosAmbu);
export const insertSolicitudAmbuSchema = createInsertSchema(solicitudesAmbu);
export const insertDocumentoAmbuSchema = createInsertSchema(documentosAmbu);
export const insertCostoAmbuSchema = createInsertSchema(costosAmbu);
export const insertSeguimientoAmbuSchema = createInsertSchema(seguimientoAmbu);
export const insertReunionAmbuSchema = createInsertSchema(reunionesAmbu);

// Tipos TypeScript
export type EventoAmbu = typeof eventosAmbu.$inferSelect;
export type InsertEventoAmbu = z.infer<typeof insertEventoAmbuSchema>;
export type SolicitudAmbu = typeof solicitudesAmbu.$inferSelect;
export type InsertSolicitudAmbu = z.infer<typeof insertSolicitudAmbuSchema>;
export type DocumentoAmbu = typeof documentosAmbu.$inferSelect;
export type InsertDocumentoAmbu = z.infer<typeof insertDocumentoAmbuSchema>;
export type CostoAmbu = typeof costosAmbu.$inferSelect;
export type InsertCostoAmbu = z.infer<typeof insertCostoAmbuSchema>;
export type SeguimientoAmbu = typeof seguimientoAmbu.$inferSelect;
export type InsertSeguimientoAmbu = z.infer<typeof insertSeguimientoAmbuSchema>;
export type ReunionAmbu = typeof reunionesAmbu.$inferSelect;
export type InsertReunionAmbu = z.infer<typeof insertReunionAmbuSchema>;