import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, jsonb, date, decimal, pgEnum, real, numeric, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ===== SISTEMA DE COMUNICACIONES =====

// Plantillas de email
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  templateType: varchar("template_type", { length: 100 }).notNull(), // welcome, notification, marketing, etc.
  moduleId: varchar("module_id", { length: 100 }), // hr, parks, events, etc.
  variables: json("variables").$type<string[]>().default([]), // Variables disponibles como {{name}}, {{park}}
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cola de emails
export const emailQueue = pgTable("email_queue", {
  id: serial("id").primaryKey(),
  to: varchar("to", { length: 255 }).notNull(),
  cc: varchar("cc", { length: 255 }),
  bcc: varchar("bcc", { length: 255 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  templateId: integer("template_id").references(() => emailTemplates.id),
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  status: varchar("status", { length: 50 }).default("pending"), // pending, sending, sent, failed, cancelled
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  errorMessage: text("error_message"),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campañas de email
export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  templateId: integer("template_id").references(() => emailTemplates.id),
  targetUserTypes: json("target_user_types").$type<string[]>().default([]), // admin, employee, volunteer, etc.
  targetModules: json("target_modules").$type<string[]>().default([]), // hr, parks, events, etc.
  status: varchar("status", { length: 50 }).default("draft"), // draft, scheduled, sending, sent, cancelled
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  totalRecipients: integer("total_recipients").default(0),
  successfulSends: integer("successful_sends").default(0),
  failedSends: integer("failed_sends").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Logs de emails
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  queueId: integer("queue_id").references(() => emailQueue.id),
  campaignId: integer("campaign_id").references(() => emailCampaigns.id),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(), // sent, failed, bounced, opened, clicked
  provider: varchar("provider", { length: 50 }), // gmail, sendgrid
  messageId: varchar("message_id", { length: 255 }),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========== MÓDULO DE FINANZAS ==========

// Categorías de ingresos
export const incomeCategories = pgTable("income_categories", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  level: integer("level").default(1),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categorías de egresos
export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  level: integer("level").default(1),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Presupuestos anuales
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id"),
  year: integer("year").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).default("draft"),
  totalIncome: decimal("total_income", { precision: 15, scale: 2 }).default("0"),
  totalExpenses: decimal("total_expenses", { precision: 15, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ingresos reales
export const actualIncomes = pgTable("actual_incomes", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull(),
  categoryId: integer("category_id").references(() => incomeCategories.id),
  concept: varchar("concept", { length: 200 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  date: date("date").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  description: text("description"),
  referenceNumber: varchar("reference_number", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Egresos reales
export const actualExpenses = pgTable("actual_expenses", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull(),
  categoryId: integer("category_id").references(() => expenseCategories.id),
  concept: varchar("concept", { length: 200 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  date: date("date").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  supplier: varchar("supplier", { length: 200 }),
  description: text("description"),
  referenceNumber: varchar("reference_number", { length: 50 }),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  isPaid: boolean("is_paid").default(false),
  paymentDate: date("payment_date"),
  // Campos para integraciones automáticas  
  isPayrollGenerated: boolean("is_payroll_generated").default(false),
  payrollPeriodId: integer("payroll_period_id"),
  isAssetsGenerated: boolean("is_assets_generated").default(false),
  assetId: integer("asset_id"),
  assetMaintenanceId: integer("asset_maintenance_id"),
  isTreesGenerated: boolean("is_trees_generated").default(false), 
  isVolunteersGenerated: boolean("is_volunteers_generated").default(false),
  isIncidentsGenerated: boolean("is_incidents_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas de validación para finanzas
export const insertIncomeCategorySchema = createInsertSchema(incomeCategories);
export const selectIncomeCategorySchema = createInsertSchema(incomeCategories);
export type InsertIncomeCategory = z.infer<typeof insertIncomeCategorySchema>;
export type IncomeCategory = typeof incomeCategories.$inferSelect;

export const insertExpenseCategorySchema = createInsertSchema(expenseCategories);
export const selectExpenseCategorySchema = createInsertSchema(expenseCategories);
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;

export const insertActualIncomeSchema = createInsertSchema(actualIncomes);
export const insertActualExpenseSchema = createInsertSchema(actualExpenses);
export type InsertActualIncome = z.infer<typeof insertActualIncomeSchema>;
export type InsertActualExpense = z.infer<typeof insertActualExpenseSchema>;

// ========== MÓDULO DE RECURSOS HUMANOS ==========

// Tabla de empleados - Matching actual database structure
// Tabla employees - Catálogo independiente de activos humanos
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Nullable - Solo si el empleado también es usuario organizacional
  employeeCode: varchar("employee_code", { length: 20 }).unique(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  position: varchar("position", { length: 100 }),
  department: varchar("department", { length: 100 }),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  hireDate: date("hire_date"),
  status: varchar("status", { length: 20 }).default("active"),
  workSchedule: varchar("work_schedule", { length: 100 }),
  education: text("education"),
  address: text("address"),
  emergencyContact: varchar("emergency_contact", { length: 100 }),
  emergencyPhone: varchar("emergency_phone", { length: 20 }),
  skills: text("skills").array(),
  certifications: text("certifications").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conceptos de nómina
export const payrollConcepts = pgTable("payroll_concepts", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // income, deduction, benefit
  category: varchar("category", { length: 50 }).notNull(), // salary, overtime, bonus, tax, insurance
  isFixed: boolean("is_fixed").default(false),
  formula: text("formula"),
  isActive: boolean("is_active").default(true),
  expenseCategoryId: integer("expense_category_id").references(() => expenseCategories.id),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Periodos de nómina - Matching actual database structure
export const payrollPeriods = pgTable("payroll_periods", {
  id: serial("id").primaryKey(),
  period: varchar("period", { length: 7 }).notNull(), // Format: YYYY-MM
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: varchar("status", { length: 20 }).default("draft"),
  processedAt: timestamp("processed_at"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }),
  employeesCount: integer("employees_count"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Detalle de nómina - Matching actual database structure
export const payrollDetails = pgTable("payroll_details", {
  id: serial("id").primaryKey(),
  periodId: integer("period_id").references(() => payrollPeriods.id),
  payrollPeriodId: integer("payroll_period_id").references(() => payrollPeriods.id), // For HR integration compatibility
  employeeId: integer("employee_id").references(() => employees.id),
  conceptId: integer("concept_id").references(() => payrollConcepts.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  quantity: decimal("quantity", { precision: 8, scale: 2 }).default("1"),
  hours: decimal("hours", { precision: 8, scale: 2 }),
  rate: decimal("rate", { precision: 10, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Nota: Los campos de nómina están integrados en la tabla actualExpenses principal

// Relaciones HR
export const employeesRelations = relations(employees, ({ many }) => ({
  payrollDetails: many(payrollDetails),
}));

export const payrollConceptsRelations = relations(payrollConcepts, ({ many }) => ({
  payrollDetails: many(payrollDetails),
}));

export const payrollPeriodsRelations = relations(payrollPeriods, ({ many }) => ({
  details: many(payrollDetails),
}));

export const payrollDetailsRelations = relations(payrollDetails, ({ one }) => ({
  period: one(payrollPeriods, {
    fields: [payrollDetails.periodId],
    references: [payrollPeriods.id],
  }),
  employee: one(employees, {
    fields: [payrollDetails.employeeId],
    references: [employees.id],
  }),
  concept: one(payrollConcepts, {
    fields: [payrollDetails.conceptId],
    references: [payrollConcepts.id],
  }),
}));

// Esquemas HR
export const insertEmployeeSchema = createInsertSchema(employees);
export const insertPayrollConceptSchema = createInsertSchema(payrollConcepts);
export const insertPayrollPeriodSchema = createInsertSchema(payrollPeriods);
export const insertPayrollDetailSchema = createInsertSchema(payrollDetails);

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type PayrollConcept = typeof payrollConcepts.$inferSelect;
export type InsertPayrollConcept = z.infer<typeof insertPayrollConceptSchema>;
export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type InsertPayrollPeriod = z.infer<typeof insertPayrollPeriodSchema>;
export type PayrollDetail = typeof payrollDetails.$inferSelect;
export type InsertPayrollDetail = z.infer<typeof insertPayrollDetailSchema>;

// ========== MÓDULO DE VACACIONES ==========
// Using the existing vacation tables defined later in the file to avoid duplicates

// ========== FIN MÓDULO DE RECURSOS HUMANOS ==========

// Tabla para almacenar sesiones (requerida para la autenticación con Replit)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

// Tablas para el módulo de arbolado
export const treeEnvironmentalServices = pgTable("tree_environmental_services", {
  id: serial("id").primaryKey(),
  treeId: integer("tree_id").notNull(),
  co2CaptureAnnual: decimal("co2_capture_annual", { precision: 10, scale: 2 }),
  co2CaptureLifetime: decimal("co2_capture_lifetime", { precision: 10, scale: 2 }),
  o2ProductionAnnual: decimal("o2_production_annual", { precision: 10, scale: 2 }),
  pollutantRemovalNO2: decimal("pollutant_removal_no2", { precision: 10, scale: 2 }),
  pollutantRemovalSO2: decimal("pollutant_removal_so2", { precision: 10, scale: 2 }),
  pollutantRemovalPM25: decimal("pollutant_removal_pm25", { precision: 10, scale: 2 }),
  stormwaterInterception: decimal("stormwater_interception", { precision: 10, scale: 2 }),
  shadeArea: decimal("shade_area", { precision: 10, scale: 2 }),
  temperatureReduction: decimal("temperature_reduction", { precision: 5, scale: 2 }),
  economicValueAnnual: decimal("economic_value_annual", { precision: 10, scale: 2 }),
  calculationDate: date("calculation_date").notNull(),
  calculationMethod: text("calculation_method"),
  notes: text("notes"),
  calculatedById: integer("calculated_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type TreeEnvironmentalService = typeof treeEnvironmentalServices.$inferSelect;
export type InsertTreeEnvironmentalService = typeof treeEnvironmentalServices.$inferInsert;

export const insertTreeEnvironmentalServiceSchema = createInsertSchema(treeEnvironmentalServices).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export const treeRiskAssessments = pgTable("tree_risk_assessments", {
  id: serial("id").primaryKey(),
  treeId: integer("tree_id").notNull(),
  assessmentDate: date("assessment_date").notNull(),
  riskLevel: text("risk_level").notNull(),
  methodology: text("methodology"),
  assessedById: integer("assessed_by_id"),
  observations: text("observations"),
  recommendedActions: text("recommended_actions"),
  reassessmentDate: date("reassessment_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type TreeRiskAssessment = typeof treeRiskAssessments.$inferSelect;
export type InsertTreeRiskAssessment = typeof treeRiskAssessments.$inferInsert;

export const insertTreeRiskAssessmentSchema = createInsertSchema(treeRiskAssessments).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export const treeInterventions = pgTable("tree_interventions", {
  id: serial("id").primaryKey(),
  treeId: integer("tree_id").notNull(),
  interventionType: text("intervention_type").notNull(),
  interventionDate: date("intervention_date"),
  scheduledDate: date("scheduled_date"),
  status: text("status").default("scheduled"),
  priority: text("priority").default("medium"),
  description: text("description"),
  performedById: integer("performed_by_id"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type TreeIntervention = typeof treeInterventions.$inferSelect;
export type InsertTreeIntervention = typeof treeInterventions.$inferInsert;

export const insertTreeInterventionSchema = createInsertSchema(treeInterventions).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

// ===== SISTEMA DE ROLES =====

// Tabla de roles del sistema
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  level: integer("level").notNull(), // 1 = Super-admin, 2 = Admin, 3 = User
  color: varchar("color", { length: 7 }).default("#6366f1"), // Color para badges
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

export const insertRoleSchema = createInsertSchema(roles).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  email: text("email").notNull(),
  roleId: integer("role_id").references(() => roles.id), // Referencia a roles
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  gender: text("gender"),
  birthDate: date("birth_date"),
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  // Firebase Integration
  firebaseUid: text("firebase_uid").unique(),
  needsPasswordReset: boolean("needs_password_reset").default(false),
  // Nuevos campos de alta prioridad
  notificationPreferences: jsonb("notification_preferences").$type<Record<string, any>>().default({}),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  department: text("department"),
  position: text("position"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===== TABLA INTERMEDIA PARA MÚLTIPLES ROLES POR USUARIO =====
// Tabla user_roles - Relación many-to-many entre usuarios y roles
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  isPrimary: boolean("is_primary").default(false), // Indica si es el rol principal del usuario
  assignedBy: integer("assigned_by").references(() => users.id), // Usuario que asignó el rol
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // Opcional: roles temporales
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tabla para usuarios pendientes de aprobación
export const pendingUsers = pgTable("pending_users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  requestedAt: timestamp("requested_at").defaultNow(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  requestedRole: text("requested_role").default("employee"), // Usuario puede solicitar un rol específico
  additionalInfo: jsonb("additional_info").$type<Record<string, any>>().default({}),
});

export type PendingUser = typeof pendingUsers.$inferSelect;
export type InsertPendingUser = typeof pendingUsers.$inferInsert;

export const insertPendingUserSchema = createInsertSchema(pendingUsers).omit({
  id: true,
  requestedAt: true
});

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users), // Relación legacy - mantener para compatibilidad
  userRoles: many(userRoles), // Nueva relación many-to-many
}));

// Elementos adicionales necesarios para el funcionamiento del sistema
export const parkImages = pgTable("park_images", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const parkVideos = pgTable("park_videos", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  videoType: text("video_type").default("file"), // 'file' or 'url'
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const amenities = pgTable("amenities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(),
  iconType: text("icon_type").notNull().default("system"),
  customIconUrl: text("custom_icon_url"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const parkAmenities = pgTable("park_amenities", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull(),
  amenityId: integer("amenity_id").notNull(),
  description: text("description"),
  moduleName: text("module_name"),
  locationLatitude: decimal("location_latitude", { precision: 10, scale: 8 }),
  locationLongitude: decimal("location_longitude", { precision: 11, scale: 8 }),
  surfaceArea: decimal("surface_area", { precision: 10, scale: 2 }),
  status: text("status").default("Activa"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull(),
  title: text("title").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  description: text("description"),
  // referenceUrl: text("reference_url"), // URL opcional de referencia - Column doesn't exist in DB
  uploadedById: integer("uploaded_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Enum para estados de actividades
export const activityStatusEnum = pgEnum('activity_status', ['por_costear', 'activa', 'programada', 'cancelada', 'finalizada', 'en_pausa']);

// Enum para estado financiero de actividades
export const financialStatusEnum = pgEnum('financial_status', ['por_costear', 'en_revision', 'autorizada', 'rechazada']);

// Categorías de actividades
export const activityCategories = pgTable("activity_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#00a587"),
  icon: varchar("icon", { length: 50 }).default("calendar"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  category: text("category"), // Campo de texto para categoría legacy
  createdAt: timestamp("created_at").notNull().defaultNow(),
  location: text("location"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }), // Coordenadas GPS - latitud
  longitude: decimal("longitude", { precision: 11, scale: 8 }), // Coordenadas GPS - longitud
  categoryId: integer("category_id").references(() => activityCategories.id),
  instructorId: integer("instructor_id").references(() => instructors.id),
  // Campos adicionales del formulario
  startTime: text("start_time"), // horaInicio
  endTime: text("end_time"), // horaFin
  duration: integer("duration"), // duracion en minutos
  capacity: integer("capacity"), // capacidad maxima
  materials: text("materials"), // materiales necesarios
  requiredStaff: integer("required_staff"), // personalRequerido
  isRecurring: boolean("is_recurring").default(false), // esRecurrente
  isFree: boolean("is_free").default(true), // esGratuita
  isPriceRandom: boolean("is_price_random").default(false), // precio aleatorio
  price: decimal("price", { precision: 10, scale: 2 }), // precio
  
  // Campos de descuentos aplicables
  discountSeniors: decimal("discount_seniors", { precision: 5, scale: 2 }).default("0.00"), // descuento adultos mayores
  discountStudents: decimal("discount_students", { precision: 5, scale: 2 }).default("0.00"), // descuento estudiantes  
  discountFamilies: decimal("discount_families", { precision: 5, scale: 2 }).default("0.00"), // descuento familias numerosas
  discountDisability: decimal("discount_disability", { precision: 5, scale: 2 }).default("0.00"), // descuento discapacidad
  discountEarlyBird: decimal("discount_early_bird", { precision: 5, scale: 2 }).default("0.00"), // descuento inscripción temprana
  discountEarlyBirdDeadline: timestamp("discount_early_bird_deadline"), // fecha límite inscripción temprana
  
  requirements: text("requirements"), // requisitos
  recurringDays: text("recurring_days").array(), // diasRecurrentes
  // Campos de segmentación como JSONB
  targetMarket: jsonb("target_market"), // mercado objetivo
  specialNeeds: jsonb("special_needs"), // necesidades especiales
  // Campos para registro ciudadano - Solo las columnas que existen en la base de datos
  registrationEnabled: boolean("registration_enabled").default(false), // permitir registro publico
  registrationDeadline: timestamp("registration_deadline"), // fecha limite de registro
  maxRegistrations: integer("max_registrations"), // limite de inscripciones (puede ser diferente a capacity)
  requiresApproval: boolean("requires_approval").default(false), // requiere aprobacion manual
  // Campos adicionales de registro ciudadano que existen en DB
  registrationInstructions: text("registration_instructions"),
  ageRestrictions: text("age_restrictions"),
  healthRequirements: text("health_requirements"),
  // Estado de la actividad
  status: activityStatusEnum("status").default("por_costear"),
  
  // Campos de costeo financiero
  financialStatus: financialStatusEnum("financial_status").default("por_costear"),
  costRecoveryPercentage: decimal("cost_recovery_percentage", { precision: 5, scale: 2 }).default("30.00"), // % objetivo de recuperación
  financialNotes: text("financial_notes"), // observaciones del área de finanzas
  reviewedBy: integer("reviewed_by"), // ID del usuario que revisó (referencias a users)
  reviewedAt: timestamp("reviewed_at"), // fecha de revisión financiera
  
  // Cálculo financiero detallado de la calculadora
  financialCalculation: jsonb("financial_calculation"), // datos completos del cálculo de la calculadora unificada
  calculationSavedAt: timestamp("calculation_saved_at"), // fecha cuando se guardó el cálculo
  calculationVersion: text("calculation_version").default("1.0"), // versión del cálculo para compatibilidad
  
  // Campos de decisión financiera ampliados
  financialDecision: text("financial_decision"), // "approved", "rejected", "requires_revision"
  financialDecisionReason: text("financial_decision_reason"), // justificación detallada de la decisión
  financialDecisionDate: timestamp("financial_decision_date"), // fecha de la decisión final
  financialDecisionBy: integer("financial_decision_by").references(() => users.id), // usuario que tomó la decisión final
  
  // Imagen simple (estandarizado como otros módulos)
  imageUrl: text("image_url"),
});

// Tabla de historial de decisiones financieras para actividades
export const activityFinancialDecisions = pgTable("activity_financial_decisions", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  decision: text("decision").notNull(), // "approved", "rejected", "requires_revision", "pending_review"
  reason: text("reason").notNull(), // justificación obligatoria de la decisión
  decisionBy: integer("decision_by").notNull().references(() => users.id), // usuario que tomó la decisión
  decisionDate: timestamp("decision_date").notNull().defaultNow(),
  
  // Contexto adicional de la decisión
  previousStatus: text("previous_status"), // estado anterior para trazabilidad
  financialAnalysis: jsonb("financial_analysis"), // análisis financiero asociado (referencia al cálculo usado)
  budgetImpact: decimal("budget_impact", { precision: 12, scale: 2 }), // impacto presupuestal estimado
  riskAssessment: text("risk_assessment"), // evaluación de riesgos financieros
  
  // Metadatos
  departmentReview: boolean("department_review").default(false), // requiere revisión adicional del departamento
  urgencyLevel: text("urgency_level").default("normal"), // "low", "normal", "high", "critical"
  approvalLevel: text("approval_level").default("financial"), // "financial", "management", "executive"
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type ActivityFinancialDecision = typeof activityFinancialDecisions.$inferSelect;
export type InsertActivityFinancialDecision = typeof activityFinancialDecisions.$inferInsert;

export const insertActivityFinancialDecisionSchema = createInsertSchema(activityFinancialDecisions).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tabla de imágenes de actividades
export const activityImages = pgTable("activity_images", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"), // Tamaño en bytes
  mimeType: text("mime_type").notNull(),
  caption: text("caption"),
  isPrimary: boolean("is_primary").notNull().default(false),
  uploadedById: integer("uploaded_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Tabla de inscripciones ciudadanas a actividades
export const activityRegistrations = pgTable("activity_registrations", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  // Datos del ciudadano
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  dateOfBirth: date("date_of_birth"),
  age: integer("age"),
  emergencyContact: varchar("emergency_contact", { length: 100 }),
  emergencyPhone: varchar("emergency_phone", { length: 20 }),
  // Información médica básica
  medicalConditions: text("medical_conditions"),
  allergies: text("allergies"),
  medicationsCurrently: text("medications_currently"),
  // Estado de la inscripción
  status: varchar("status", { length: 20 }).default("pending"), // pending/approved/rejected
  approvedById: integer("approved_by_id"), // admin que aprobó
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  // Datos adicionales
  specialRequests: text("special_requests"),
  experienceLevel: varchar("experience_level", { length: 20 }), // beginner/intermediate/advanced
  hasParticipatedBefore: boolean("has_participated_before").default(false),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending/paid/exempt (para actividades de pago)
  paymentReference: varchar("payment_reference", { length: 100 }),
  // Campos Stripe para pagos
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeSessionId: varchar("stripe_session_id", { length: 100 }),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  paymentDate: timestamp("payment_date"),
  // Campos de descuentos aplicados (para auditoría y conciliación)
  appliedDiscountType: varchar("applied_discount_type", { length: 50 }), // seniors, students, families, disability, early_bird
  appliedDiscountPercentage: integer("applied_discount_percentage"), // porcentaje de descuento aplicado
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }), // precio original antes del descuento
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }), // monto del descuento aplicado
  // Consentimientos
  acceptsTerms: boolean("accepts_terms").default(false),
  acceptsPhotos: boolean("accepts_photos").default(false), // autoriza fotos durante la actividad
  parentalConsent: boolean("parental_consent").default(false), // para menores de edad
  parentName: varchar("parent_name", { length: 100 }), // nombre del padre/tutor
  parentPhone: varchar("parent_phone", { length: 20 }), // teléfono del padre/tutor
  // Metadatos
  registrationSource: varchar("registration_source", { length: 50 }).default("web"), // web/app/phone/in-person
  ipAddress: varchar("ip_address", { length: 45 }), // para auditoria
  userAgent: text("user_agent"), // información del navegador
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Tabla de histórico de cambios en inscripciones (auditoría)
export const activityRegistrationHistory = pgTable("activity_registration_history", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id").notNull().references(() => activityRegistrations.id, { onDelete: "cascade" }),
  changeType: varchar("change_type", { length: 50 }).notNull(), // created/status_changed/updated/cancelled
  previousStatus: varchar("previous_status", { length: 20 }),
  newStatus: varchar("new_status", { length: 20 }),
  changeReason: text("change_reason"),
  changedById: integer("changed_by_id"), // ID del admin que hizo el cambio
  changeDetails: jsonb("change_details"), // detalles adicionales del cambio en JSON
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  rating: integer("rating"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  incidentType: text("incident_type").notNull(),
  status: text("status").default("reported"),
  priority: text("priority").default("medium"),
  reportedById: integer("reported_by_id"),
  assignedToId: integer("assigned_to_id"),
  locationDetails: text("location_details"),
  imageUrls: text("image_urls").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  
  // === INFORMACIÓN DE LA INCIDENCIA ===
  incidenciaId: text("incidencia_id"), // identificador único personalizado
  fechaReporte: timestamp("fecha_reporte").defaultNow(),
  fechaOcurrencia: timestamp("fecha_ocurrencia"),
  tipoAfectacion: text("tipo_afectacion"), // seguridad, ambiental, infraestructura, servicio, usuario, otro
  nivelRiesgo: text("nivel_riesgo"), // bajo, medio, alto, crítico
  descripcionDetallada: text("descripcion_detallada"),
  fotosVideosAdjuntos: text("fotos_videos_adjuntos").array().default([]),
  ubicacionGps: text("ubicacion_gps"), // coordenadas exactas
  activoId: integer("activo_id"), // vinculado al inventario de activos
  
  // === SEGUIMIENTO OPERATIVO ===
  departamentoResponsable: text("departamento_responsable"), // mantenimiento, seguridad, jardinería, concesiones, etc.
  responsableAsignado: text("responsable_asignado"), // persona o cuadrilla
  fechaAsignacion: timestamp("fecha_asignacion"),
  fechaInicioAtencion: timestamp("fecha_inicio_atencion"),
  fechaResolucion: timestamp("fecha_resolucion"),
  tiempoRespuesta: integer("tiempo_respuesta"), // calculado en horas
  accionesRealizadas: text("acciones_realizadas"), // texto o checklist
  materialesUtilizados: text("materiales_utilizados"), // catálogo de insumos
  costoEstimado: decimal("costo_estimado", { precision: 10, scale: 2 }),
  costoReal: decimal("costo_real", { precision: 10, scale: 2 }),
  fuenteFinanciamiento: text("fuente_financiamiento"), // presupuesto municipal, concesión, patrocinio, donativo, voluntariado
  
  // === CONTROL Y CALIDAD ===
  estatusValidacion: text("estatus_validacion").default("pendiente"), // pendiente, validado, rechazado
  supervisorValidador: text("supervisor_validador"), // firma o ID de quien valida
  comentariosSupervision: text("comentarios_supervision"),
  satisfaccionUsuario: integer("satisfaccion_usuario"), // escala 1–5
  seguimientoPostResolucion: text("seguimiento_post_resolucion"), // para revisitas, garantías o reincidencia
  frecuenciaIncidente: text("frecuencia_incidente"), // único, recurrente, patrón detectado
  
  // === DIMENSIÓN COMUNITARIA Y AMBIENTAL ===
  afectacionUsuarios: boolean("afectacion_usuarios").default(false), // sí/no
  numeroPersonasAfectadas: integer("numero_personas_afectadas"), // número estimado
  afectacionMedioambiental: text("afectacion_medioambiental"), // suelo, agua, flora, fauna
  participacionVoluntarios: boolean("participacion_voluntarios").default(false), // sí/no
  numeroVoluntarios: integer("numero_voluntarios"), // cuántos
  grupoVoluntarios: text("grupo_voluntarios"), // de qué grupo
  reporteComunidad: text("reporte_comunidad"), // si fue un vecino, asociación o visitante
});

// Tabla volunteers - Catálogo independiente alimentado desde /volunteers/register
export const volunteers = pgTable("volunteers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  age: integer("age"),
  gender: text("gender").notNull(),
  address: text("address"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelation: text("emergency_contact_relation"),
  preferredParkId: integer("preferred_park_id"),
  previousExperience: text("previous_experience"),
  availableDays: text("available_days").array(),
  availableHours: text("available_hours"),
  interestAreas: text("interest_areas").array(),
  skills: text("skills"),
  profileImageUrl: text("profile_image_url"),
  legalConsent: boolean("legal_consent").default(false),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const volunteerParticipations = pgTable("volunteer_participations", {
  id: serial("id").primaryKey(),
  volunteerId: integer("volunteer_id").notNull(),
  activityId: integer("activity_id"),
  parkId: integer("park_id").notNull(),
  participationDate: date("participation_date").notNull(),
  hoursServed: decimal("hours_served", { precision: 4, scale: 2 }).notNull(),
  tasks: text("tasks").notNull(),
  feedback: text("feedback"),
  status: text("status").default("completed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const volunteerEvaluations = pgTable("volunteer_evaluations", {
  id: serial("id").primaryKey(),
  participationId: integer("participation_id"),
  volunteerId: integer("volunteer_id").notNull(),
  evaluatorId: integer("evaluator_id").notNull(),
  punctuality: integer("punctuality").notNull(),
  attitude: integer("attitude").notNull(),
  responsibility: integer("responsibility").notNull(),
  overallPerformance: integer("overall_performance").notNull(),
  comments: text("comments"),
  followUpRequired: boolean("follow_up_required").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const volunteerRecognitions = pgTable("volunteer_recognitions", {
  id: serial("id").primaryKey(),
  volunteerId: integer("volunteer_id").notNull(),
  recognitionType: text("recognition_type").notNull(),
  level: text("level"),
  reason: text("reason").notNull(),
  hoursCompleted: integer("hours_completed"),
  certificateUrl: text("certificate_url"),
  issuedAt: timestamp("issued_at").notNull(),
  issuedById: integer("issued_by_id").notNull(),
  additionalComments: text("additional_comments"),
});

// Constantes y tipos adicionales
export const PARK_TYPES = [
  "urbano",
  "natural",
  "lineal",
  "metropolitano",
  "vecinal",
  "de bolsillo",
  "temático"
];

export const DEFAULT_AMENITIES = [
  "Juegos Infantiles", 
  "Área de Picnic", 
  "Baños", 
  "Estacionamiento", 
  "Senderos", 
  "Área Deportiva",
  "Fuente", 
  "Iluminación", 
  "Bancas", 
  "Área de Mascotas"
];

// Tipos extendidos
export type ExtendedPark = typeof parks.$inferSelect & {
  amenities?: typeof amenities.$inferSelect[];
  activities?: typeof activities.$inferSelect[];
  images?: typeof parkImages.$inferSelect[];
  primaryImage?: string | null;
  mainImageUrl?: string | null;
  typology?: typeof parkTypology.$inferSelect;
};

export type ExtendedVolunteer = typeof volunteers.$inferSelect & {
  user?: typeof users.$inferSelect;
  park?: typeof parks.$inferSelect;
};

// Tipos para las tablas
export type ParkImage = typeof parkImages.$inferSelect;
export type InsertParkImage = typeof parkImages.$inferInsert;

export const insertParkImageSchema = createInsertSchema(parkImages).omit({ 
  id: true,
  createdAt: true
});

export type ParkVideo = typeof parkVideos.$inferSelect;
export type InsertParkVideo = typeof parkVideos.$inferInsert;

export const insertParkVideoSchema = createInsertSchema(parkVideos).omit({ 
  id: true,
  createdAt: true
});

export type Amenity = typeof amenities.$inferSelect;
export type InsertAmenity = typeof amenities.$inferInsert;

export type ParkAmenity = typeof parkAmenities.$inferSelect;
export type InsertParkAmenity = typeof parkAmenities.$inferInsert;

export const insertParkAmenitySchema = createInsertSchema(parkAmenities).omit({ 
  id: true,
  createdAt: true
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export const insertDocumentSchema = createInsertSchema(documents).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  fileType: z.string().min(1, "File type is required"), // Requerir fileType
  uploadedById: z.number().optional() // Hacer uploadedById opcional
});

export type ActivityCategory = typeof activityCategories.$inferSelect;
export type InsertActivityCategory = typeof activityCategories.$inferInsert;

export const insertActivityCategorySchema = createInsertSchema(activityCategories).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

export const insertActivitySchema = createInsertSchema(activities).omit({ 
  id: true,
  createdAt: true
});

export type ActivityImage = typeof activityImages.$inferSelect;
export type InsertActivityImage = typeof activityImages.$inferInsert;

export const insertActivityImageSchema = createInsertSchema(activityImages).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tipos para inscripciones de actividades
export type ActivityRegistration = typeof activityRegistrations.$inferSelect;
export type InsertActivityRegistration = typeof activityRegistrations.$inferInsert;

export const insertActivityRegistrationSchema = createInsertSchema(activityRegistrations).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Teléfono debe tener al menos 10 dígitos").optional(),
  age: z.number().min(1).max(120).optional(),
  emergencyPhone: z.string().min(10, "Teléfono de emergencia debe tener al menos 10 dígitos").optional(),
  acceptsTerms: z.literal(true, { errorMap: () => ({ message: "Debe aceptar los términos y condiciones" }) })
});

export type ActivityRegistrationHistory = typeof activityRegistrationHistory.$inferSelect;
export type InsertActivityRegistrationHistory = typeof activityRegistrationHistory.$inferInsert;

export const insertActivityRegistrationHistorySchema = createInsertSchema(activityRegistrationHistory).omit({ 
  id: true,
  createdAt: true
});

// Tipo extendido para inscripciones con información de actividad
export type ExtendedActivityRegistration = ActivityRegistration & {
  activity?: Activity & {
    park?: typeof parks.$inferSelect;
    category?: ActivityCategory;
    instructor?: typeof instructors.$inferSelect;
  };
  approvedBy?: typeof users.$inferSelect;
};

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

export const insertCommentSchema = createInsertSchema(comments).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;

export const insertIncidentSchema = createInsertSchema(incidents).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export type Volunteer = typeof volunteers.$inferSelect;
export type InsertVolunteer = typeof volunteers.$inferInsert;

export const insertVolunteerSchema = createInsertSchema(volunteers).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export type VolunteerParticipation = typeof volunteerParticipations.$inferSelect;
export type InsertVolunteerParticipation = typeof volunteerParticipations.$inferInsert;

export const insertVolunteerParticipationSchema = createInsertSchema(volunteerParticipations).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export type VolunteerEvaluation = typeof volunteerEvaluations.$inferSelect;
export type InsertVolunteerEvaluation = typeof volunteerEvaluations.$inferInsert;

export const insertVolunteerEvaluationSchema = createInsertSchema(volunteerEvaluations).omit({ 
  id: true,
  createdAt: true
});

export type VolunteerRecognition = typeof volunteerRecognitions.$inferSelect;
export type InsertVolunteerRecognition = typeof volunteerRecognitions.$inferInsert;

export const insertVolunteerRecognitionSchema = createInsertSchema(volunteerRecognitions).omit({ 
  id: true
});

// Perfiles de concesionarios - Catálogo independiente sin user_id
export const concessionaireProfiles = pgTable("concessionaire_profiles", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // persona_fisica, persona_moral
  rfc: varchar("rfc", { length: 20 }).notNull().unique(),
  businessName: varchar("business_name", { length: 200 }),
  contactPerson: varchar("contact_person", { length: 200 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  taxAddress: text("tax_address").notNull(),
  legalRepresentative: varchar("legal_representative", { length: 200 }),
  registrationDate: date("registration_date").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("activo"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type ConcessionaireProfile = typeof concessionaireProfiles.$inferSelect;
export type InsertConcessionaireProfile = typeof concessionaireProfiles.$inferInsert;

export const insertConcessionaireProfileSchema = createInsertSchema(concessionaireProfiles).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

// Documentos de concesionarios
export const concessionaireDocuments = pgTable("concessionaire_documents", {
  id: serial("id").primaryKey(),
  concessionaireProfileId: integer("concessionaire_profile_id").notNull().references(() => concessionaireProfiles.id),
  documentType: varchar("document_type", { length: 50 }).notNull(), // rfc, identificacion, acta_constitutiva, poder_notarial, etc.
  documentName: varchar("document_name", { length: 200 }).notNull(),
  documentUrl: varchar("document_url", { length: 255 }).notNull(),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  expiryDate: date("expiry_date"),
  isVerified: boolean("is_verified").default(false),
  verificationDate: timestamp("verification_date"),
  verifiedById: integer("verified_by_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ConcessionaireDocument = typeof concessionaireDocuments.$inferSelect;
export type InsertConcessionaireDocument = typeof concessionaireDocuments.$inferInsert;

export const insertConcessionaireDocumentSchema = createInsertSchema(concessionaireDocuments).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

// Relaciones para las tablas de concesionarios
export const concessionaireProfilesRelations = relations(concessionaireProfiles, ({ many }) => ({
  documents: many(concessionaireDocuments)
}));

export const concessionaireDocumentsRelations = relations(concessionaireDocuments, ({ one }) => ({
  concessionaireProfile: one(concessionaireProfiles, {
    fields: [concessionaireDocuments.concessionaireProfileId],
    references: [concessionaireProfiles.id]
  }),
  verifiedBy: one(users, {
    fields: [concessionaireDocuments.verifiedById],
    references: [users.id]
  })
}));

// Relaciones de usuarios - solo roles, sin conexión directa a concessionaires
export const usersRelations = relations(users, ({ one, many }) => ({
  userRole: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }), // Relación legacy - mantener para compatibilidad
  userRoles: many(userRoles), // Nueva relación many-to-many
}));

// Relaciones para la tabla intermedia user_roles
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
  })
}));

// Definición de tablas de instructores
// Tabla instructors - Catálogo independiente con registro por invitación
export const instructors = pgTable("instructors", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  age: integer("age"),
  gender: text("gender"),
  address: text("address"),
  specialties: text("specialties").array(),
  certifications: text("certifications").array(),
  experienceYears: integer("experience_years").default(0),
  availableDays: text("available_days").array(),
  availableHours: text("available_hours"),
  preferredParkId: integer("preferred_park_id"),
  status: text("status").default("pending"), // pending, active, rejected, inactive
  bio: text("bio"),
  qualifications: text("qualifications"),
  education: text("education"),
  profileImageUrl: text("profile_image_url"),
  curriculumUrl: text("curriculum_url"),
  hourlyRate: real("hourly_rate").default(0),
  rating: real("rating").default(0),
  activitiesCount: integer("activities_count").default(0),
  // Campos para el proceso de aplicación
  applicationCampaignId: integer("application_campaign_id").references(() => instructorApplicationCampaigns.id),
  applicationDate: timestamp("application_date").defaultNow(),
  evaluatedBy: integer("evaluated_by").references(() => users.id),
  evaluatedAt: timestamp("evaluated_at"),
  evaluationNotes: text("evaluation_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Tabla para campañas de aplicaciones de instructores
export const instructorApplicationCampaigns = pgTable("instructor_application_campaigns", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(false),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxApplications: integer("max_applications"), // Límite opcional de aplicaciones
  currentApplications: integer("current_applications").default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla para invitaciones de instructores por email (mantener para compatibilidad)
export const instructorInvitations = pgTable("instructor_invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  invitationToken: varchar("invitation_token", { length: 255 }).notNull().unique(),
  invitedBy: integer("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, used, expired
  createdAt: timestamp("created_at").defaultNow()
});

export const instructorAssignments = pgTable("instructor_assignments", {
  id: serial("id").primaryKey(),
  instructorId: integer("instructor_id").notNull(),
  activityId: integer("activity_id").notNull(),
  parkId: integer("park_id").notNull(),
  assignmentDate: date("assignment_date").notNull(),
  status: text("status").default("assigned"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const instructorEvaluations = pgTable("instructor_evaluations", {
  id: serial("id").primaryKey(),
  instructorId: integer("instructor_id").references(() => instructors.id).notNull(),
  
  // Información del evaluador (puede ser usuario registrado o ciudadano)
  evaluatorId: integer("evaluator_id").references(() => users.id), // Opcional para usuarios registrados
  evaluatorName: varchar("evaluator_name", { length: 255 }), // Para ciudadanos sin registro
  evaluatorEmail: varchar("evaluator_email", { length: 255 }),
  evaluatorCity: varchar("evaluator_city", { length: 100 }),
  evaluatorIp: varchar("evaluator_ip", { length: 45 }), // Para evitar spam
  
  // Calificaciones específicas (1-5)
  overallRating: integer("overall_rating").notNull(),
  knowledgeRating: integer("knowledge_rating").notNull(),
  patienceRating: integer("patience_rating").notNull(),
  clarityRating: integer("clarity_rating").notNull(),
  punctualityRating: integer("punctuality_rating").notNull(),
  
  // Información adicional
  wouldRecommend: boolean("would_recommend"),
  comments: text("comments"),
  attendedActivity: varchar("attended_activity", { length: 255 }),
  
  // Control de moderación
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected
  moderationNotes: text("moderation_notes"),
  moderatedBy: integer("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  
  // Metadatos
  evaluationDate: date("evaluation_date").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const instructorRecognitions = pgTable("instructor_recognitions", {
  id: serial("id").primaryKey(),
  instructorId: integer("instructor_id").notNull(),
  recognitionType: text("recognition_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  issuedDate: date("issued_date").notNull(),
  issuedById: integer("issued_by_id").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Tipos para las tablas de instructores
export type Instructor = typeof instructors.$inferSelect;
export type InsertInstructor = typeof instructors.$inferInsert;
export type InstructorInvitation = typeof instructorInvitations.$inferSelect;
export type InsertInstructorInvitation = typeof instructorInvitations.$inferInsert;
export type InstructorApplicationCampaign = typeof instructorApplicationCampaigns.$inferSelect;
export type InsertInstructorApplicationCampaign = typeof instructorApplicationCampaigns.$inferInsert;

export const insertInstructorSchema = createInsertSchema(instructors).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
  applicationDate: true,
  evaluatedBy: true,
  evaluatedAt: true,
  evaluationNotes: true
});

export const insertInstructorApplicationCampaignSchema = createInsertSchema(instructorApplicationCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentApplications: true
});

// Schema para aplicaciones públicas de instructores
export const instructorApplicationSchema = createInsertSchema(instructors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  applicationDate: true,
  evaluatedBy: true,
  evaluatedAt: true,
  evaluationNotes: true,
  rating: true,
  activitiesCount: true,
  status: true // Se asigna automáticamente como "pending"
}).extend({
  applicationCampaignId: z.number().positive("ID de campaña requerido"),
  fullName: z.string().min(2, "Nombre completo debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Teléfono debe tener al menos 10 dígitos").optional(),
  experienceYears: z.number().min(0).max(50).default(0),
  specialties: z.array(z.string()).min(1, "Debe especificar al menos una especialidad"),
  bio: z.string().min(50, "La biografía debe tener al menos 50 caracteres").optional(),
  qualifications: z.string().optional()
});

export const insertInstructorInvitationSchema = createInsertSchema(instructorInvitations).omit({
  id: true,
  createdAt: true,
  invitationToken: true,
  invitedAt: true,
  usedAt: true,
  status: true,
});

// Nota: Los tipos Volunteer, Employee y sus esquemas de inserción ya están definidos más adelante en el archivo

export type InstructorAssignment = typeof instructorAssignments.$inferSelect;
export type InsertInstructorAssignment = typeof instructorAssignments.$inferInsert;

export const insertInstructorAssignmentSchema = createInsertSchema(instructorAssignments).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InstructorEvaluation = typeof instructorEvaluations.$inferSelect;
export type InsertInstructorEvaluation = typeof instructorEvaluations.$inferInsert;

export const insertInstructorEvaluationSchema = createInsertSchema(instructorEvaluations, {
  evaluatorName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  evaluatorEmail: z.string().email("Email inválido").optional(),
  evaluatorCity: z.string().max(100).optional(),
  overallRating: z.number().min(1, "Calificación mínima: 1").max(5, "Calificación máxima: 5"),
  knowledgeRating: z.number().min(1).max(5),
  patienceRating: z.number().min(1).max(5),
  clarityRating: z.number().min(1).max(5),
  punctualityRating: z.number().min(1).max(5),
  wouldRecommend: z.boolean().optional(),
  comments: z.string().max(500, "Máximo 500 caracteres").optional(),
  attendedActivity: z.string().max(255).optional(),
}).omit({
  id: true,
  instructorId: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  moderationNotes: true,
  moderatedBy: true,
  moderatedAt: true,
  evaluatorIp: true,
  evaluationDate: true,
});

export type InstructorRecognition = typeof instructorRecognitions.$inferSelect;
export type InsertInstructorRecognition = typeof instructorRecognitions.$inferInsert;

export const insertInstructorRecognitionSchema = createInsertSchema(instructorRecognitions).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

// Creando tipos para las categorías de incidentes
export const incidentCategories = pgTable("incident_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6B7280"),
  icon: text("icon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type IncidentCategory = typeof incidentCategories.$inferSelect;
export type InsertIncidentCategory = typeof incidentCategories.$inferInsert;

export const incidentSubcategories = pgTable("incident_subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type IncidentSubcategory = typeof incidentSubcategories.$inferSelect;
export type InsertIncidentSubcategory = typeof incidentSubcategories.$inferInsert;

export const incidentComments = pgTable("incident_comments", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export type IncidentComment = typeof incidentComments.$inferSelect;
export type InsertIncidentComment = typeof incidentComments.$inferInsert;

export const incidentHistory = pgTable("incident_history", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").notNull(),
  userId: integer("user_id").notNull(),
  actionType: text("action_type").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export type IncidentHistory = typeof incidentHistory.$inferSelect;
export type InsertIncidentHistory = typeof incidentHistory.$inferInsert;

export const incidentNotifications = pgTable("incident_notifications", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").notNull(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export type IncidentNotification = typeof incidentNotifications.$inferSelect;
export type InsertIncidentNotification = typeof incidentNotifications.$inferInsert;

export const municipalities = pgTable("municipalities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  state: text("state").notNull(),
  logoUrl: text("logo_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tabla de tipologías de parques según NOM-001-SEDATU-2021
export const parkTypology = pgTable("park_typology", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Vecinal, Comunitario, Barrial, Urbano, Metropolitano
  minArea: text("min_area"), // Superficie mínima en m²
  maxArea: text("max_area"), // Superficie máxima en m²
  code: varchar("code", { length: 50 }), // A-1, B-2, C-3, D-4, E-5
  normativeReference: varchar("normative_reference", { length: 255 }), // NOM-001-SEDATU-2021
  country: varchar("country", { length: 100 }).notNull() // Mexico
});

export const parks = pgTable("parks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  municipalityText: text("municipality_text"), // Campo para municipio como texto libre
  parkType: text("park_type").notNull(), // Campo legacy mantenido para retrocompatibilidad
  typologyId: integer("typology_id").references(() => parkTypology.id), // Relación con tipología oficial
  description: text("description"),
  address: text("address").notNull(),
  postalCode: text("postal_code"),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  area: numeric("area"), // Superficie total
  greenArea: numeric("green_area"), // Área permeable
  foundationYear: integer("foundation_year"),
  administrator: text("administrator"),
  status: varchar("status", { length: 50 }).default("en_funcionamiento"), // Estado del parque: en_funcionamiento, operando_parcialmente, en_mantenimiento, cerrado_temporalmente, cerrado_indefinidamente, reapertura_proxima, en_proyecto_construccion, uso_restringido
  regulationUrl: text("regulation_url"),
  openingHours: text("opening_hours"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  videoUrl: text("video_url"),
  certificaciones: text("certificaciones"), // Campo para certificaciones múltiples separadas por comas
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Tablas para el módulo de árboles
export const treeSpecies = pgTable("tree_species", {
  id: serial("id").primaryKey(),
  commonName: text("common_name").notNull(),
  scientificName: text("scientific_name").notNull(),
  family: text("family"),
  origin: text("origin"), // Nativo, Introducido, etc.
  climateZone: text("climate_zone"),
  growthRate: text("growth_rate"), // Lento, Medio, Rapido
  heightMature: decimal("height_mature", { precision: 5, scale: 2 }), // altura máxima en metros
  canopyDiameter: decimal("canopy_diameter", { precision: 5, scale: 2 }), // diámetro de copa en metros
  lifespan: integer("lifespan"), // años aproximados
  imageUrl: text("image_url"), // URL de la imagen
  description: text("description"),
  maintenanceRequirements: text("maintenance_requirements"),
  waterRequirements: text("water_requirements"), // Bajo, Medio, Alto
  sunRequirements: text("sun_requirements"), // Sombra, Parcial, Pleno sol
  soilRequirements: text("soil_requirements"),
  ecologicalBenefits: text("ecological_benefits"),
  ornamentalValue: text("ornamental_value"), // Bajo, Medio, Alto
  commonUses: text("common_uses"),
  isEndangered: boolean("is_endangered").default(false),
  iconColor: text("icon_color").default("#4CAF50"),
  // Campos para iconos personalizados
  iconType: text("icon_type").default("system"), // 'system' o 'custom'
  customIconUrl: text("custom_icon_url"), // URL del icono personalizado
  // Campos adicionales para fotos
  photoUrl: text("photo_url"), // URL de la foto principal
  photoCaption: text("photo_caption"), // Descripción de la foto
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const trees = pgTable("trees", {
  id: serial("id").primaryKey(),
  species_id: integer("species_id").references(() => treeSpecies.id),
  park_id: integer("park_id").references(() => parks.id),
  code: varchar("code", { length: 20 }).unique(), // Código único de identificación
  last_maintenance_date: date("last_maintenance_date"),
  created_by: integer("created_by"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  // Datos de geolocalización
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  // Datos físicos
  height: decimal("height"),
  trunk_diameter: decimal("trunk_diameter"),
  age_estimate: integer("age_estimate"),
  canopy_coverage: decimal("canopy_coverage", { precision: 5, scale: 2 }),
  // Datos administrativos
  planting_date: date("planting_date"),
  location_description: varchar("location_description", { length: 255 }),
  notes: text("notes"),
  // Estado físico y condiciones
  condition: varchar("condition", { length: 50 }),
  development_stage: varchar("development_stage", { length: 50 }),
  health_status: varchar("health_status", { length: 50 }),
  has_hollows: boolean("has_hollows").default(false),
  has_exposed_roots: boolean("has_exposed_roots").default(false),
  has_pests: boolean("has_pests").default(false),
  is_protected: boolean("is_protected").default(false),
  // Multimedia
  image_url: text("image_url")
});

export const treeMaintenances = pgTable("tree_maintenances", {
  id: serial("id").primaryKey(),
  tree_id: integer("tree_id").references(() => trees.id),
  maintenance_type: varchar("maintenance_type").notNull(),
  maintenance_date: date("maintenance_date").notNull(),
  description: text("description"),
  performed_by: varchar("performed_by", { length: 255 }), // Cambiado de integer a varchar para nombres
  notes: text("notes"),
  next_maintenance_date: date("next_maintenance_date"),
  created_at: timestamp("created_at").notNull().defaultNow()
});

// Tabla de relación entre parques y especies arbóreas
export const parkTreeSpecies = pgTable("park_tree_species", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull().references(() => parks.id),
  speciesId: integer("species_id").notNull().references(() => treeSpecies.id),
  recommendedQuantity: integer("recommended_quantity"),
  currentQuantity: integer("current_quantity").default(0),
  plantingZone: text("planting_zone"), // Zona específica dentro del parque
  notes: text("notes"),
  status: varchar("status", { length: 50 }).default("planificado"), // planificado, en_desarrollo, establecido
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Esquemas de inserción

export const insertMunicipalitySchema = createInsertSchema(municipalities).omit({ 
  id: true,
  createdAt: true
});

export const insertParkSchema = createInsertSchema(parks).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  // Corregir campos numeric para aceptar tanto string como number
  area: z.coerce.number().nullable().optional(),
  greenArea: z.coerce.number().nullable().optional(),
  foundationYear: z.coerce.number().nullable().optional(),
  capacity: z.coerce.number().nullable().optional(),
  // Validación para el campo status
  status: z.enum([
    "en_funcionamiento",
    "operando_parcialmente", 
    "en_mantenimiento",
    "cerrado_temporalmente",
    "cerrado_indefinidamente",
    "reapertura_proxima",
    "en_proyecto_construccion",
    "uso_restringido"
  ]).default("en_funcionamiento").optional(),
});

// Categorías de eventos (diferente de actividades)
export const eventCategories = pgTable("event_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"), // Color hex para UI
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Eventos generales (diferente de actividades)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 50 }).notNull(), // deportivo, cultural, ambiental, etc.
  targetAudience: varchar("target_audience", { length: 100 }), // niños, jóvenes, adultos mayores, familias
  status: varchar("status", { length: 20 }).default("draft").notNull(), // borrador, publicado, cancelado, pospuesto
  featuredImageUrl: varchar("featured_image_url", { length: 500 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  startTime: time("start_time"),
  endTime: time("end_time"),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: varchar("recurrence_pattern", { length: 100 }), // 'weekly', 'monthly', etc.
  location: varchar("location", { length: 255 }),
  capacity: integer("capacity"),
  registrationType: varchar("registration_type", { length: 50 }).default("none"), // none, required, optional
  organizerName: varchar("organizer_name", { length: 255 }),
  organizerEmail: varchar("organizer_email", { length: 255 }),
  organizerPhone: varchar("organizer_phone", { length: 20 }),
  organizerOrganization: varchar("organizer_organization", { length: 255 }),
  geolocation: varchar("geolocation", { length: 100 }), // lat,lng format
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdById: integer("created_by_id"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00"),
  isFree: boolean("is_free").default(true),
  requiresApproval: boolean("requires_approval").default(false),
  
  // Campos de descuentos aplicables (unificado con actividades)
  discountSeniors: decimal("discount_seniors", { precision: 5, scale: 2 }).default("0.00"), // descuento adultos mayores
  discountStudents: decimal("discount_students", { precision: 5, scale: 2 }).default("0.00"), // descuento estudiantes  
  discountFamilies: decimal("discount_families", { precision: 5, scale: 2 }).default("0.00"), // descuento familias numerosas
  discountDisability: decimal("discount_disability", { precision: 5, scale: 2 }).default("0.00"), // descuento discapacidad
  discountEarlyBird: decimal("discount_early_bird", { precision: 5, scale: 2 }).default("0.00"), // descuento inscripción temprana
  discountEarlyBirdDeadline: timestamp("discount_early_bird_deadline"), // fecha límite inscripción temprana
  
  // Campos de costeo financiero (unificado con actividades)
  costRecoveryPercentage: decimal("cost_recovery_percentage", { precision: 5, scale: 2 }).default("30.00"), // % objetivo de recuperación
  financialNotes: text("financial_notes"), // observaciones del área de finanzas
  reviewedBy: integer("reviewed_by"), // ID del usuario que revisó (referencias a users)
  reviewedAt: timestamp("reviewed_at"), // fecha de revisión financiera
});

// Tabla de imágenes de eventos (idéntica al patrón de actividades y parques)
export const eventImages = pgTable("event_images", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"), // Tamaño en bytes
  mimeType: text("mime_type").notNull(),
  caption: text("caption"),
  isPrimary: boolean("is_primary").notNull().default(false),
  uploadedById: integer("uploaded_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Tipos para eventos
export type EventCategory = typeof eventCategories.$inferSelect;
export type InsertEventCategory = typeof eventCategories.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

// Tipos para imágenes de eventos
export type EventImage = typeof eventImages.$inferSelect;
export type InsertEventImage = typeof eventImages.$inferInsert;

export const insertEventImageSchema = createInsertSchema(eventImages).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

// Esquemas de validación para categorías de eventos
export const insertEventCategorySchema = createInsertSchema(eventCategories).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateEventCategorySchema = insertEventCategorySchema.partial();

export const insertTreeSpeciesSchema = createInsertSchema(treeSpecies).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTreeSchema = createInsertSchema(trees).omit({ 
  id: true,
  created_at: true,
  updated_at: true
});

export const insertTreeMaintenanceSchema = createInsertSchema(treeMaintenances).omit({ 
  id: true,
  created_at: true
});

// ========== MÓDULO DE FAUNA ==========

// Enum para categorías de fauna
export const faunaCategoryEnum = pgEnum("fauna_category", [
  "aves",
  "mamiferos", 
  "insectos",
  "vida_acuatica"
]);

// Enum para estado de conservación
export const conservationStatusEnum = pgEnum("conservation_status", [
  "estable",
  "vulnerable",
  "en_peligro",
  "en_peligro_critico",
  "extinto_local"
]);

// Tabla de especies de fauna
export const faunaSpecies = pgTable("fauna_species", {
  id: serial("id").primaryKey(),
  commonName: text("common_name").notNull(),
  scientificName: text("scientific_name").notNull(),
  family: text("family"),
  category: faunaCategoryEnum("category").notNull(),
  habitat: text("habitat"),
  description: text("description"),
  behavior: text("behavior"),
  diet: text("diet"),
  reproductionPeriod: text("reproduction_period"),
  conservationStatus: conservationStatusEnum("conservation_status").default("estable"),
  sizeCm: decimal("size_cm", { precision: 8, scale: 2 }), // tamaño en centímetros
  weightGrams: decimal("weight_grams", { precision: 10, scale: 2 }), // peso en gramos
  lifespan: integer("lifespan"), // años aproximados
  isNocturnal: boolean("is_nocturnal").default(false),
  isMigratory: boolean("is_migratory").default(false),
  isEndangered: boolean("is_endangered").default(false),
  imageUrl: text("image_url"),
  photoUrl: text("photo_url"),
  photoCaption: text("photo_caption"),
  ecologicalImportance: text("ecological_importance"),
  threats: text("threats"),
  protectionMeasures: text("protection_measures"),
  observationTips: text("observation_tips"),
  bestObservationTime: text("best_observation_time"),
  commonLocations: text("common_locations").array().default([]), // ubicaciones comunes en los parques
  iconColor: text("icon_color").default("#16a085"),
  iconType: text("icon_type").default("system"),
  customIconUrl: text("custom_icon_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type FaunaSpecies = typeof faunaSpecies.$inferSelect;
export type InsertFaunaSpecies = typeof faunaSpecies.$inferInsert;

// Schema más simple y permisivo para fauna
export const insertFaunaSpeciesSchema = z.object({
  commonName: z.string().min(1, 'El nombre común es requerido'),
  scientificName: z.string().min(1, 'El nombre científico es requerido'),
  family: z.string().min(1, 'La familia es requerida'),
  category: z.enum(['aves', 'mamiferos', 'insectos', 'vida_acuatica']),
  habitat: z.string().optional(),
  description: z.string().optional(),
  behavior: z.string().optional(),
  diet: z.string().optional(),
  reproductionPeriod: z.string().optional(),
  conservationStatus: z.enum(['estable', 'vulnerable', 'en_peligro', 'en_peligro_critico', 'extinto_local']).default('estable'),
  sizeCm: z.string().optional(),
  weightGrams: z.string().optional(),
  lifespan: z.number().optional(),
  isNocturnal: z.boolean().default(false),
  isMigratory: z.boolean().default(false),
  isEndangered: z.boolean().default(false),
  imageUrl: z.string().optional(),
  photoUrl: z.string().optional(),
  photoCaption: z.string().optional(),
  ecologicalImportance: z.string().optional(),
  threats: z.string().optional(),
  protectionMeasures: z.string().optional(),
  observationTips: z.string().optional(),
  bestObservationTime: z.string().optional(),
  commonLocations: z.array(z.string()).default([]),
  iconColor: z.string().default('#16a085'),
  iconType: z.string().default('system'),
  customIconUrl: z.string().optional()
});

// Tipos
export type Municipality = typeof municipalities.$inferSelect;
export type InsertMunicipality = z.infer<typeof insertMunicipalitySchema>;

export type Park = typeof parks.$inferSelect;
export type InsertPark = z.infer<typeof insertParkSchema>;

export type ParkTypology = typeof parkTypology.$inferSelect;
export type InsertParkTypology = typeof parkTypology.$inferInsert;

export type TreeSpecies = typeof treeSpecies.$inferSelect;
export type InsertTreeSpecies = z.infer<typeof insertTreeSpeciesSchema>;

export type Tree = typeof trees.$inferSelect;
export type InsertTree = z.infer<typeof insertTreeSchema>;

export type TreeMaintenance = typeof treeMaintenances.$inferSelect;
export type InsertTreeMaintenance = z.infer<typeof insertTreeMaintenanceSchema>;

export type ParkTreeSpecies = typeof parkTreeSpecies.$inferSelect;
export const insertParkTreeSpeciesSchema = createInsertSchema(parkTreeSpecies).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertParkTreeSpecies = z.infer<typeof insertParkTreeSpeciesSchema>;

// Relaciones
export const treesRelations = relations(trees, ({ one }) => ({
  species: one(treeSpecies, {
    fields: [trees.species_id],
    references: [treeSpecies.id],
  }),
  park: one(parks, {
    fields: [trees.park_id],
    references: [parks.id],
  })
}));

export const treeMaintenancesRelations = relations(treeMaintenances, ({ one }) => ({
  tree: one(trees, {
    fields: [treeMaintenances.tree_id],
    references: [trees.id],
  })
}));

export const parksRelations = relations(parks, ({ one }) => ({
  typology: one(parkTypology, {
    fields: [parks.typologyId],
    references: [parkTypology.id],
  })
}));

export const parkTypologyRelations = relations(parkTypology, ({ many }) => ({
  parks: many(parks)
}));

// Enumeraciones
export const impactLevelEnum = pgEnum('impact_level', ['bajo', 'medio', 'alto', 'muy_alto']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'overdue', 'cancelled', 'refunded']);
export const paymentTypeEnum = pgEnum('payment_type', ['monthly', 'quarterly', 'biannual', 'annual', 'one_time', 'variable']);
export const evaluationStatusEnum = pgEnum('evaluation_status', ['draft', 'completed', 'pending_review', 'approved', 'rejected']);
export const sanctionStatusEnum = pgEnum('sanction_status', ['pending', 'resolved', 'appealed', 'cancelled']);
export const changeTypeEnum = pgEnum('change_type', ['creation', 'acquisition', 'updated', 'maintenance', 'retirement', 'status_changed', 'location_changed', 'assigned']);

// Tabla para el catálogo de tipos de concesiones
export const concessionTypes = pgTable("concession_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  technicalRequirements: text("technical_requirements"),
  legalRequirements: text("legal_requirements"),
  operatingRules: text("operating_rules"),
  impactLevel: impactLevelEnum("impact_level").notNull().default('bajo'),
  isActive: boolean("is_active").notNull().default(true),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type ConcessionType = typeof concessionTypes.$inferSelect;
export type InsertConcessionType = typeof concessionTypes.$inferInsert;

export const insertConcessionTypeSchema = createInsertSchema(concessionTypes).omit({
  id: true,
  createdById: true,
  createdAt: true,
  updatedAt: true
});

// Tabla para las concesiones asignadas a parques específicos
export const concessions = pgTable("concessions", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull(),
  concessionTypeId: integer("concession_type_id").notNull(),
  vendorName: varchar("vendor_name", { length: 100 }).notNull(),
  vendorContact: varchar("vendor_contact", { length: 100 }),
  vendorEmail: varchar("vendor_email", { length: 100 }),
  vendorPhone: varchar("vendor_phone", { length: 20 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: varchar("status", { length: 20 }).notNull().default('activa'),
  location: text("location"),
  notes: text("notes"),
  contractFile: varchar("contract_file", { length: 255 }),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type Concession = typeof concessions.$inferSelect;
export type InsertConcession = typeof concessions.$inferInsert;

export const insertConcessionSchema = createInsertSchema(concessions).omit({
  id: true,
  createdById: true,
  createdAt: true,
  updatedAt: true
});

// Tabla para contratos de concesiones
export const concessionContracts = pgTable("concession_contracts", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull(),
  concessionaireId: integer("concessionaire_id").notNull(),
  concessionTypeId: integer("concession_type_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  exclusivityClauses: text("exclusivity_clauses"),
  restrictions: text("restrictions"),
  contractFileUrl: text("contract_file_url"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  hasExtension: boolean("has_extension").default(false),
  extensionDate: date("extension_date"),
  notes: text("notes"),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Tabla para ubicación y georreferenciación de concesiones
export const concessionLocations = pgTable("concession_locations", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  zoneName: varchar("zone_name", { length: 100 }),
  subzoneName: varchar("subzone_name", { length: 100 }),
  coordinates: text("coordinates"), // Almacenamos como texto 'lat,lng'
  areaSqm: decimal("area_sqm", { precision: 10, scale: 2 }).notNull(),
  mapReference: text("map_reference"),
  locationDescription: text("location_description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Tabla para gestión financiera de concesiones
export const concessionPayments = pgTable("concession_payments", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  paymentDate: date("payment_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: paymentTypeEnum("payment_type").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default('pending'),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  invoiceUrl: text("invoice_url"),
  notes: text("notes"),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Tabla para evaluación y cumplimiento de concesiones
export const concessionEvaluations = pgTable("concession_evaluations", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  evaluationDate: date("evaluation_date").notNull(),
  evaluatorId: integer("evaluator_id"),
  sanitaryRating: integer("sanitary_rating"),
  operationalRating: integer("operational_rating"),
  technicalRating: integer("technical_rating"),
  complianceRating: integer("compliance_rating"),
  customerSatisfactionRating: integer("customer_satisfaction_rating"),
  overallRating: decimal("overall_rating", { precision: 3, scale: 1 }),
  findings: text("findings"),
  recommendations: text("recommendations"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: date("follow_up_date"),
  status: evaluationStatusEnum("status").default('draft'),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Tabla para checklists personalizables
export const concessionEvaluationChecklists = pgTable("concession_evaluation_checklists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  items: jsonb("items").notNull(),
  isActive: boolean("is_active").default(true),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Tabla para sanciones e incidencias
export const concessionSanctions = pgTable("concession_sanctions", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  evaluationId: integer("evaluation_id"),
  sanctionDate: date("sanction_date").notNull(),
  sanctionType: varchar("sanction_type", { length: 100 }).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  resolutionStatus: sanctionStatusEnum("resolution_status").default('pending'),
  resolutionDate: date("resolution_date"),
  resolutionNotes: text("resolution_notes"),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type ConcessionContract = typeof concessionContracts.$inferSelect;
export type InsertConcessionContract = typeof concessionContracts.$inferInsert;

export type ConcessionLocation = typeof concessionLocations.$inferSelect;
export type InsertConcessionLocation = typeof concessionLocations.$inferInsert;

export type ConcessionPayment = typeof concessionPayments.$inferSelect;
export type InsertConcessionPayment = typeof concessionPayments.$inferInsert;

export type ConcessionEvaluation = typeof concessionEvaluations.$inferSelect;
export type InsertConcessionEvaluation = typeof concessionEvaluations.$inferInsert;

export type ConcessionEvaluationChecklist = typeof concessionEvaluationChecklists.$inferSelect;
export type InsertConcessionEvaluationChecklist = typeof concessionEvaluationChecklists.$inferInsert;

export type ConcessionSanction = typeof concessionSanctions.$inferSelect;
export type InsertConcessionSanction = typeof concessionSanctions.$inferInsert;

export const insertConcessionContractSchema = createInsertSchema(concessionContracts).omit({
  id: true,
  createdById: true,
  createdAt: true,
  updatedAt: true
});

export const insertConcessionLocationSchema = createInsertSchema(concessionLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertConcessionPaymentSchema = createInsertSchema(concessionPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertConcessionEvaluationSchema = createInsertSchema(concessionEvaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertConcessionEvaluationChecklistSchema = createInsertSchema(concessionEvaluationChecklists).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertConcessionSanctionSchema = createInsertSchema(concessionSanctions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Relaciones para los contratos de concesiones
export const concessionContractsRelations = relations(concessionContracts, ({ one, many }) => ({
  park: one(parks, {
    fields: [concessionContracts.parkId],
    references: [parks.id]
  }),
  concessionaire: one(users, {
    fields: [concessionContracts.concessionaireId],
    references: [users.id]
  }),
  concessionType: one(concessionTypes, {
    fields: [concessionContracts.concessionTypeId],
    references: [concessionTypes.id]
  }),
  // Nuevas relaciones para las funcionalidades extendidas
  locations: many(concessionLocations),
  payments: many(concessionPayments),
  evaluations: many(concessionEvaluations),
  sanctions: many(concessionSanctions)
}));

// Relaciones para ubicaciones de concesiones
export const concessionLocationsRelations = relations(concessionLocations, ({ one }) => ({
  contract: one(concessionContracts, {
    fields: [concessionLocations.contractId],
    references: [concessionContracts.id]
  })
}));

// Relaciones para pagos de concesiones
export const concessionPaymentsRelations = relations(concessionPayments, ({ one }) => ({
  contract: one(concessionContracts, {
    fields: [concessionPayments.contractId],
    references: [concessionContracts.id]
  })
}));

// Relaciones para evaluaciones de concesiones
export const concessionEvaluationsRelations = relations(concessionEvaluations, ({ one, many }) => ({
  contract: one(concessionContracts, {
    fields: [concessionEvaluations.contractId],
    references: [concessionContracts.id]
  }),
  evaluator: one(users, {
    fields: [concessionEvaluations.evaluatorId],
    references: [users.id]
  }),
  sanctions: many(concessionSanctions)
}));

// Relaciones para sanciones de concesiones
export const concessionSanctionsRelations = relations(concessionSanctions, ({ one }) => ({
  contract: one(concessionContracts, {
    fields: [concessionSanctions.contractId],
    references: [concessionContracts.id]
  }),
  evaluation: one(concessionEvaluations, {
    fields: [concessionSanctions.evaluationId],
    references: [concessionEvaluations.id]
  })
}));

// ============ CATÁLOGO DE PROVEEDORES ============
export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  businessName: varchar("business_name", { length: 200 }),
  taxId: varchar("tax_id", { length: 20 }),
  contactPerson: varchar("contact_person", { length: 100 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 10 }),
  country: varchar("country", { length: 50 }).default('México'),
  providerType: varchar("provider_type", { length: 50 }), // servicios, productos, construcción, etc.
  paymentTerms: varchar("payment_terms", { length: 100 }), // 30 días, contado, etc.
  bankAccount: varchar("bank_account", { length: 50 }),
  bank: varchar("bank", { length: 100 }),
  website: varchar("website", { length: 200 }),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).notNull().default('activo'),
  rating: integer("rating").default(5), // 1-5 estrellas
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = typeof providers.$inferInsert;

export const insertProviderSchema = createInsertSchema(providers).omit({
  id: true,
  code: true,
  createdById: true,
  createdAt: true,
  updatedAt: true
});

// ============ CATÁLOGO DE INGRESOS ============
export const incomeRecords = pgTable("income_records", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  categoryId: integer("category_id").notNull(),
  subcategoryId: integer("subcategory_id"),
  description: text("description").notNull(),
  source: varchar("source", { length: 200 }), // fuente del ingreso: empresa, gobierno, etc.
  referenceNumber: varchar("reference_number", { length: 50 }), // número de referencia o folio
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('MXN'),
  incomeDate: date("income_date").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }), // efectivo, transferencia, cheque, etc.
  bankAccount: varchar("bank_account", { length: 50 }),
  receiptNumber: varchar("receipt_number", { length: 50 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default('0.00'),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default('0.00'),
  netAmount: decimal("net_amount", { precision: 12, scale: 2 }),
  parkId: integer("park_id"),
  projectId: integer("project_id"),
  notes: text("notes"),
  attachments: json("attachments").$type<string[]>(),
  status: varchar("status", { length: 20 }).notNull().default('registrado'),
  verifiedBy: integer("verified_by"),
  verifiedAt: timestamp("verified_at"),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type IncomeRecord = typeof incomeRecords.$inferSelect;
export type InsertIncomeRecord = typeof incomeRecords.$inferInsert;

export const insertIncomeRecordSchema = createInsertSchema(incomeRecords).omit({
  id: true,
  code: true,
  netAmount: true,
  verifiedBy: true,
  verifiedAt: true,
  createdById: true,
  createdAt: true,
  updatedAt: true
});

// Relaciones para las concesiones
export const concessionsRelations = relations(concessions, ({ one }) => ({
  park: one(parks, {
    fields: [concessions.parkId],
    references: [parks.id]
  }),
  concessionType: one(concessionTypes, {
    fields: [concessions.concessionTypeId],
    references: [concessionTypes.id]
  })
}));

// Relaciones para proveedores
export const providersRelations = relations(providers, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [providers.createdById],
    references: [users.id]
  })
}));

// Relaciones para registros de ingresos
export const incomeRecordsRelations = relations(incomeRecords, ({ one }) => ({
  park: one(parks, {
    fields: [incomeRecords.parkId],
    references: [parks.id]
  }),
  createdBy: one(users, {
    fields: [incomeRecords.createdById],
    references: [users.id]
  }),
  verifier: one(users, {
    fields: [incomeRecords.verifiedBy],
    references: [users.id]
  })
}));

// Relaciones para amenidades
export const amenitiesRelations = relations(amenities, ({ many }) => ({
  parkAmenities: many(parkAmenities)
}));

// ============ MÓDULO DE ACTIVOS ============

// Tabla de categorías de activos
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

// Tabla principal de activos
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  // IDENTIFICACIÓN
  name: text("name").notNull(),
  serialNumber: text("serial_number"), // Número de serie
  categoryId: integer("category_id").notNull(), // Categoría principal
  subcategoryId: integer("subcategory_id"), // Subcategoría
  customAssetId: text("custom_asset_id"), // ID del activo personalizado
  description: text("description"),
  
  // UBICACIÓN
  parkId: integer("park_id").notNull(), // Parque donde se encuentra
  amenityId: integer("amenity_id"), // Amenidad (opcional)
  locationDescription: text("location_description"), // Descripción de la ubicación
  latitude: text("latitude"), // Coordenadas
  longitude: text("longitude"),
  
  // ESPECIFICACIONES TÉCNICAS
  manufacturer: text("manufacturer"), // Fabricante
  model: text("model"), // Modelo
  serialNumberTech: text("serial_number_tech"), // Número de serie técnico
  material: text("material"), // metal, madera, plástico, mixto
  dimensionsCapacity: text("dimensions_capacity"), // Dimensiones/Capacidad
  
  // CICLO DE VIDA
  installationDate: date("installation_date"), // Fecha de instalación
  lastInspectionDate: date("last_inspection_date"), // Fecha última inspección
  estimatedUsefulLife: integer("estimated_useful_life"), // Vida útil estimada en meses
  status: text("status").notNull().default("activo"), // activo, en mantenimiento, dañado, retirado
  maintenanceHistory: text("maintenance_history").array(), // Historial de mantenimientos
  
  // COSTOS
  acquisitionCost: decimal("acquisition_cost", { precision: 10, scale: 2 }), // Costo de adquisición
  currentValue: decimal("current_value", { precision: 10, scale: 2 }), // Valor actual (amortización)
  financingSource: text("financing_source"), // Presupuesto, Patrocinio, Donación, Concesión
  
  // CONTROL Y GESTIÓN
  responsiblePersonId: integer("responsible_person_id"), // Responsable asignado
  assignedArea: text("assigned_area"), // Área o departamento asignado
  maintenanceManualUrl: text("maintenance_manual_url"), // Manual de mantenimiento (URL)
  usagePolicies: text("usage_policies"), // Políticas de uso
  
  // CAMPOS HEREDADOS (para compatibilidad)
  acquisitionDate: date("acquisition_date"), // Fecha de adquisición
  condition: text("condition").notNull().default("good"), // excellent, good, fair, poor
  maintenanceFrequency: text("maintenance_frequency"), // daily, weekly, monthly, quarterly, yearly
  lastMaintenanceDate: date("last_maintenance_date"),
  nextMaintenanceDate: date("next_maintenance_date"),
  expectedLifespan: integer("expected_lifespan"), // Vida útil esperada en meses
  notes: text("notes"), // Notas adicionales
  qrCode: text("qr_code"), // URL o identificador del código QR
  photos: text("photos").array(), // URLs de fotos del activo
  documents: text("documents").array(), // URLs de documentos relacionados
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tabla de mantenimientos de activos
export const assetMaintenances = pgTable("asset_maintenances", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull(),
  maintenanceType: text("maintenance_type").notNull(), // preventive, corrective, emergency
  description: text("description").notNull(),
  date: date("date"), // Fixed to match actual database column
  performedBy: text("performed_by"), // Nombre del técnico o empresa
  performerId: integer("performer_id"), // ID del técnico
  cost: decimal("cost", { precision: 10, scale: 2 }),
  findings: text("findings"), // Hallazgos
  actions: text("actions"), // Acciones realizadas
  nextMaintenanceDate: date("next_maintenance_date"), // Próximo mantenimiento
  photos: text("photos").array(), // Fotos
  status: text("status").notNull().default("completed"), // completed, scheduled, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tabla de asignaciones de activos
export const assetAssignments = pgTable("asset_assignments", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull(),
  instructorId: integer("instructor_id"), // Instructor responsable
  activityId: integer("activity_id"), // Actividad donde se usa el activo
  assignmentDate: date("assignment_date").notNull(),
  returnDate: date("return_date"),
  purpose: text("purpose"), // Propósito de la asignación
  condition: text("condition").notNull().default("good"), // Estado al momento de asignación
  notes: text("notes"),
  status: text("status").notNull().default("active"), // active, returned, overdue
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tabla de imágenes de activos
export const assetImages = pgTable("asset_images", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull(),
  imageUrl: text("image_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"), // Tamaño en bytes
  mimeType: text("mime_type").notNull(),
  caption: text("caption"),
  isPrimary: boolean("is_primary").notNull().default(false),
  uploadedById: integer("uploaded_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tipos exportados para activos
export type AssetCategory = typeof assetCategories.$inferSelect;
export type InsertAssetCategory = typeof assetCategories.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

// ⚠️ DEPRECATED: assetHistory schema moved to shared/asset-schema.ts
// This avoids duplicate definitions and conflicts. Import from shared/asset-schema.ts instead.

export type AssetMaintenance = typeof assetMaintenances.$inferSelect;
export type InsertAssetMaintenance = typeof assetMaintenances.$inferInsert;

export type AssetAssignment = typeof assetAssignments.$inferSelect;
export type InsertAssetAssignment = typeof assetAssignments.$inferInsert;

export type AssetImage = typeof assetImages.$inferSelect;
export type InsertAssetImage = typeof assetImages.$inferInsert;

// Esquemas de inserción para activos
export const insertAssetCategorySchema = createInsertSchema(assetCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAssetMaintenanceSchema = createInsertSchema(assetMaintenances).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAssetAssignmentSchema = createInsertSchema(assetAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAssetImageSchema = createInsertSchema(assetImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// ⚠️ DEPRECATED: insertAssetHistorySchema moved to shared/asset-schema.ts

// Relaciones para activos
export const assetCategoriesRelations = relations(assetCategories, ({ many, one }) => ({
  assets: many(assets),
  parent: one(assetCategories, {
    fields: [assetCategories.parentId],
    references: [assetCategories.id]
  }),
  children: many(assetCategories)
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
  responsiblePerson: one(users, {
    fields: [assets.responsiblePersonId],
    references: [users.id]
  }),
  maintenances: many(assetMaintenances),
  assignments: many(assetAssignments),
  images: many(assetImages),
  // ⚠️ history: moved to shared/asset-schema.ts - import assetHistory from there if needed
}));

export const assetMaintenancesRelations = relations(assetMaintenances, ({ one }) => ({
  asset: one(assets, {
    fields: [assetMaintenances.assetId],
    references: [assets.id]
  })
}));

export const assetImagesRelations = relations(assetImages, ({ one }) => ({
  asset: one(assets, {
    fields: [assetImages.assetId],
    references: [assets.id]
  }),
  uploadedBy: one(users, {
    fields: [assetImages.uploadedById],
    references: [users.id]
  })
}));

export const assetAssignmentsRelations = relations(assetAssignments, ({ one }) => ({
  asset: one(assets, {
    fields: [assetAssignments.assetId],
    references: [assets.id]
  }),
  instructor: one(instructors, {
    fields: [assetAssignments.instructorId],
    references: [instructors.id]
  }),
  activity: one(activities, {
    fields: [assetAssignments.activityId],
    references: [activities.id]
  })
}));

// ============ MÓDULO DE ALMACÉN ============

// Tabla de categorías de consumibles
export const consumableCategories = pgTable("consumable_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // Nombre del icono lucide-react
  color: varchar("color", { length: 20 }), // Color hex para visualización
  parentId: integer("parent_id"), // Para categorías jerárquicas
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabla principal de consumibles (catálogo)
export const consumables = pgTable("consumables", {
  id: serial("id").primaryKey(),
  // IDENTIFICACIÓN
  code: varchar("code", { length: 50 }).notNull().unique(), // Código interno único
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: integer("category_id").notNull(),
  
  // ESPECIFICACIONES
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  unitOfMeasure: varchar("unit_of_measure", { length: 20 }).notNull(), // pieza, litro, kilo, metro, etc.
  presentation: varchar("presentation", { length: 100 }), // Presentación (ej: "Botella 1L", "Caja 12 piezas")
  
  // GESTIÓN DE INVENTARIO
  minimumStock: integer("minimum_stock").default(0), // Stock mínimo para alertas
  maximumStock: integer("maximum_stock"), // Stock máximo recomendado
  reorderPoint: integer("reorder_point"), // Punto de reorden
  
  // COSTOS
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }), // Costo unitario promedio
  lastPurchasePrice: decimal("last_purchase_price", { precision: 10, scale: 2 }),
  
  // PROVEEDOR Y COMPRAS
  preferredSupplierId: integer("preferred_supplier_id"),
  supplierCode: varchar("supplier_code", { length: 50 }), // Código del proveedor
  
  // CARACTERÍSTICAS ESPECIALES
  requiresExpiration: boolean("requires_expiration").default(false), // Si requiere control de vencimiento
  perishable: boolean("perishable").default(false), // Si es perecedero
  hazardous: boolean("hazardous").default(false), // Si es material peligroso
  storageRequirements: text("storage_requirements"), // Requisitos de almacenamiento
  
  // METADATOS
  tags: text("tags").array(), // Etiquetas para búsqueda
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabla de stock por ubicación
export const inventoryStock = pgTable("inventory_stock", {
  id: serial("id").primaryKey(),
  consumableId: integer("consumable_id").notNull(),
  parkId: integer("park_id").notNull(), // Ubicación del stock
  warehouseLocation: varchar("warehouse_location", { length: 100 }), // Ubicación específica en almacén
  
  // CANTIDADES
  quantity: integer("quantity").notNull().default(0), // Cantidad actual
  reservedQuantity: integer("reserved_quantity").default(0), // Cantidad reservada
  availableQuantity: integer("available_quantity").default(0), // Cantidad disponible
  
  // CONTROL DE LOTES (opcional)
  batchNumber: varchar("batch_number", { length: 50 }),
  expirationDate: date("expiration_date"),
  
  // UBICACIÓN FÍSICA
  zone: varchar("zone", { length: 50 }), // Zona del almacén
  shelf: varchar("shelf", { length: 50 }), // Estante
  position: varchar("position", { length: 50 }), // Posición específica
  
  // METADATOS
  lastCountDate: date("last_count_date"), // Última fecha de conteo físico
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tipos de movimiento de inventario
export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", [
  "entrada_compra", // Entrada por compra
  "entrada_donacion", // Entrada por donación
  "entrada_transferencia", // Entrada por transferencia
  "entrada_devolucion", // Entrada por devolución
  "salida_consumo", // Salida por consumo/uso
  "salida_transferencia", // Salida por transferencia
  "salida_merma", // Salida por merma/deterioro
  "salida_robo", // Salida por robo/pérdida
  "ajuste_positivo", // Ajuste de inventario positivo
  "ajuste_negativo", // Ajuste de inventario negativo
  "conteo_fisico" // Ajuste por conteo físico
]);

// Tabla de movimientos de inventario
export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  // BÁSICOS
  consumableId: integer("consumable_id").notNull(),
  stockId: integer("stock_id").notNull(), // Referencia al stock afectado
  movementType: inventoryMovementTypeEnum("movement_type").notNull(),
  
  // CANTIDADES
  quantity: integer("quantity").notNull(), // Cantidad (positiva o negativa)
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }), // Costo unitario en este movimiento
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }), // Costo total del movimiento
  
  // ORIGEN Y DESTINO
  originType: varchar("origin_type", { length: 50 }), // compra, transferencia, devolucion, etc.
  originId: integer("origin_id"), // ID del documento origen (orden de compra, transferencia, etc.)
  destinationType: varchar("destination_type", { length: 50 }),
  destinationId: integer("destination_id"),
  
  // REFERENCIAS EXTERNAS
  workOrderId: integer("work_order_id"), // Orden de trabajo que generó el movimiento
  purchaseOrderId: integer("purchase_order_id"), // Orden de compra
  transferRequestId: integer("transfer_request_id"), // Solicitud de transferencia
  
  // METADATOS
  description: text("description").notNull(),
  reference: varchar("reference", { length: 100 }), // Número de factura, guía, etc.
  performedById: integer("performed_by_id").notNull(), // Usuario que realizó el movimiento
  approvedById: integer("approved_by_id"), // Usuario que aprobó (si aplica)
  
  // CONTROL DE LOTES
  batchNumber: varchar("batch_number", { length: 50 }),
  expirationDate: date("expiration_date"),
  
  // FECHA Y ESTADO
  movementDate: timestamp("movement_date").defaultNow(),
  status: varchar("status", { length: 20 }).default("completed"), // pending, completed, cancelled
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Estados de requisición
export const requisitionStatusEnum = pgEnum("requisition_status", [
  "draft", // Borrador
  "submitted", // Enviada
  "approved", // Aprobada
  "rejected", // Rechazada
  "in_progress", // En progreso
  "completed", // Completada
  "cancelled" // Cancelada
]);

// Tabla de requisiciones de materiales
export const requisitions = pgTable("requisitions", {
  id: serial("id").primaryKey(),
  // IDENTIFICACIÓN
  requisitionNumber: varchar("requisition_number", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // ORIGEN
  requestedById: integer("requested_by_id").notNull(), // Usuario solicitante
  departmentId: integer("department_id"), // Departamento solicitante
  parkId: integer("park_id"), // Parque solicitante
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  
  // JUSTIFICACIÓN
  purpose: text("purpose").notNull(), // Propósito de la requisición
  workOrderId: integer("work_order_id"), // Orden de trabajo relacionada (si aplica)
  projectId: integer("project_id"), // Proyecto relacionado (si aplica)
  
  // FECHAS
  requestDate: timestamp("request_date").defaultNow(),
  requiredDate: date("required_date"), // Fecha requerida
  
  // ESTADO Y APROBACIÓN
  status: requisitionStatusEnum("status").default("draft"),
  reviewedById: integer("reviewed_by_id"), // Usuario que revisó
  approvedById: integer("approved_by_id"), // Usuario que aprobó
  rejectionReason: text("rejection_reason"),
  reviewDate: timestamp("review_date"),
  approvalDate: timestamp("approval_date"),
  
  // COSTOS
  estimatedTotal: decimal("estimated_total", { precision: 12, scale: 2 }), // Costo estimado total
  actualTotal: decimal("actual_total", { precision: 12, scale: 2 }), // Costo real total
  
  // METADATOS
  notes: text("notes"),
  attachments: text("attachments").array(), // URLs de archivos adjuntos
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabla de items de requisiciones
export const requisitionItems = pgTable("requisition_items", {
  id: serial("id").primaryKey(),
  requisitionId: integer("requisition_id").notNull(),
  consumableId: integer("consumable_id").notNull(),
  
  // CANTIDADES
  requestedQuantity: integer("requested_quantity").notNull(),
  approvedQuantity: integer("approved_quantity"), // Cantidad aprobada (puede ser diferente)
  deliveredQuantity: integer("delivered_quantity").default(0), // Cantidad entregada
  
  // COSTOS
  estimatedUnitCost: decimal("estimated_unit_cost", { precision: 10, scale: 2 }),
  actualUnitCost: decimal("actual_unit_cost", { precision: 10, scale: 2 }),
  
  // JUSTIFICACIÓN ESPECÍFICA
  justification: text("justification"), // Justificación para este item específico
  notes: text("notes"),
  
  // ESTADO
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected, delivered
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tipos exportados para almacén
export type ConsumableCategory = typeof consumableCategories.$inferSelect;
export type InsertConsumableCategory = typeof consumableCategories.$inferInsert;

export type Consumable = typeof consumables.$inferSelect;
export type InsertConsumable = typeof consumables.$inferInsert;

export type InventoryStock = typeof inventoryStock.$inferSelect;
export type InsertInventoryStock = typeof inventoryStock.$inferInsert;

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = typeof inventoryMovements.$inferInsert;

export type Requisition = typeof requisitions.$inferSelect;
export type InsertRequisition = typeof requisitions.$inferInsert;

export type RequisitionItem = typeof requisitionItems.$inferSelect;
export type InsertRequisitionItem = typeof requisitionItems.$inferInsert;

// Esquemas de inserción para almacén
export const insertConsumableCategorySchema = createInsertSchema(consumableCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertConsumableSchema = createInsertSchema(consumables).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  code: z.string().min(1, "Código es requerido"),
  name: z.string().min(1, "Nombre es requerido"),
  unitOfMeasure: z.string().min(1, "Unidad de medida es requerida")
});

export const insertInventoryStockSchema = createInsertSchema(inventoryStock).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  description: z.string().min(1, "Descripción es requerida")
});

export const insertRequisitionSchema = createInsertSchema(requisitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  title: z.string().min(1, "Título es requerido"),
  purpose: z.string().min(1, "Propósito es requerido")
});

export const insertRequisitionItemSchema = createInsertSchema(requisitionItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  requestedQuantity: z.number().min(1, "Cantidad debe ser mayor a 0")
});

// Relaciones para almacén
export const consumableCategoriesRelations = relations(consumableCategories, ({ many, one }) => ({
  consumables: many(consumables),
  parent: one(consumableCategories, {
    fields: [consumableCategories.parentId],
    references: [consumableCategories.id]
  }),
  children: many(consumableCategories)
}));

export const consumablesRelations = relations(consumables, ({ one, many }) => ({
  category: one(consumableCategories, {
    fields: [consumables.categoryId],
    references: [consumableCategories.id]
  }),
  stocks: many(inventoryStock),
  movements: many(inventoryMovements),
  requisitionItems: many(requisitionItems)
}));

export const inventoryStockRelations = relations(inventoryStock, ({ one, many }) => ({
  consumable: one(consumables, {
    fields: [inventoryStock.consumableId],
    references: [consumables.id]
  }),
  park: one(parks, {
    fields: [inventoryStock.parkId],
    references: [parks.id]
  }),
  movements: many(inventoryMovements)
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  consumable: one(consumables, {
    fields: [inventoryMovements.consumableId],
    references: [consumables.id]
  }),
  stock: one(inventoryStock, {
    fields: [inventoryMovements.stockId],
    references: [inventoryStock.id]
  }),
  performedBy: one(users, {
    fields: [inventoryMovements.performedById],
    references: [users.id]
  }),
  approvedBy: one(users, {
    fields: [inventoryMovements.approvedById],
    references: [users.id]
  })
}));

export const requisitionsRelations = relations(requisitions, ({ one, many }) => ({
  requestedBy: one(users, {
    fields: [requisitions.requestedById],
    references: [users.id]
  }),
  reviewedBy: one(users, {
    fields: [requisitions.reviewedById],
    references: [users.id]
  }),
  approvedBy: one(users, {
    fields: [requisitions.approvedById],
    references: [users.id]
  }),
  park: one(parks, {
    fields: [requisitions.parkId],
    references: [parks.id]
  }),
  items: many(requisitionItems)
}));

export const requisitionItemsRelations = relations(requisitionItems, ({ one }) => ({
  requisition: one(requisitions, {
    fields: [requisitionItems.requisitionId],
    references: [requisitions.id]
  }),
  consumable: one(consumables, {
    fields: [requisitionItems.consumableId],
    references: [consumables.id]
  })
}));

// ========== MÓDULO DE RECIBOS DE NÓMINA ==========

// Estados de recibos
export const payrollReceiptStatusEnum = pgEnum("payroll_receipt_status", [
  "draft",
  "generated", 
  "sent",
  "confirmed"
]);

// Tabla de recibos de nómina
export const payrollReceipts = pgTable("payroll_receipts", {
  id: serial("id").primaryKey(),
  periodId: integer("period_id").notNull().references(() => payrollPeriods.id),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  receiptNumber: varchar("receipt_number", { length: 50 }).notNull().unique(),
  generatedDate: timestamp("generated_date").defaultNow(),
  payDate: date("pay_date").notNull(),
  
  // Datos del empleado al momento de la generación
  employeeName: varchar("employee_name", { length: 200 }).notNull(),
  employeePosition: varchar("employee_position", { length: 100 }),
  employeeDepartment: varchar("employee_department", { length: 100 }),
  employeeRFC: varchar("employee_rfc", { length: 20 }),
  
  // Totales del recibo
  totalGross: decimal("total_gross", { precision: 15, scale: 2 }).notNull(),
  totalDeductions: decimal("total_deductions", { precision: 15, scale: 2 }).notNull(),
  totalNet: decimal("total_net", { precision: 15, scale: 2 }).notNull(),
  
  // Archivo PDF
  pdfFileName: varchar("pdf_file_name", { length: 255 }),
  pdfPath: text("pdf_path"),
  pdfGenerated: boolean("pdf_generated").default(false),
  
  // Estado y metadatos
  status: payrollReceiptStatusEnum("status").default("draft"),
  notes: text("notes"),
  generatedById: integer("generated_by_id").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Detalles de conceptos en recibos
export const payrollReceiptDetails = pgTable("payroll_receipt_details", {
  id: serial("id").primaryKey(),
  receiptId: integer("receipt_id").notNull().references(() => payrollReceipts.id),
  conceptId: integer("concept_id").notNull().references(() => payrollConcepts.id),
  
  // Datos del concepto al momento de la generación
  conceptCode: varchar("concept_code", { length: 20 }).notNull(),
  conceptName: varchar("concept_name", { length: 100 }).notNull(),
  conceptType: varchar("concept_type", { length: 20 }).notNull(), // income, deduction, benefit
  conceptCategory: varchar("concept_category", { length: 50 }).notNull(),
  
  // Valores calculados
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1.00"),
  rate: decimal("rate", { precision: 15, scale: 2 }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  
  // Metadatos
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow()
});

// Schemas de validación para recibos
export const insertPayrollReceiptSchema = createInsertSchema(payrollReceipts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPayrollReceiptDetailSchema = createInsertSchema(payrollReceiptDetails).omit({
  id: true,
  createdAt: true
});

export type InsertPayrollReceipt = z.infer<typeof insertPayrollReceiptSchema>;
export type PayrollReceipt = typeof payrollReceipts.$inferSelect;
export type InsertPayrollReceiptDetail = z.infer<typeof insertPayrollReceiptDetailSchema>;
export type PayrollReceiptDetail = typeof payrollReceiptDetails.$inferSelect;

// Relaciones para recibos de nómina
export const payrollReceiptsRelations = relations(payrollReceipts, ({ one, many }) => ({
  period: one(payrollPeriods, {
    fields: [payrollReceipts.periodId],
    references: [payrollPeriods.id]
  }),
  employee: one(employees, {
    fields: [payrollReceipts.employeeId],
    references: [employees.id]
  }),
  generatedBy: one(users, {
    fields: [payrollReceipts.generatedById],
    references: [users.id]
  }),
  details: many(payrollReceiptDetails)
}));

export const payrollReceiptDetailsRelations = relations(payrollReceiptDetails, ({ one }) => ({
  receipt: one(payrollReceipts, {
    fields: [payrollReceiptDetails.receiptId],
    references: [payrollReceipts.id]
  }),
  concept: one(payrollConcepts, {
    fields: [payrollReceiptDetails.conceptId],
    references: [payrollConcepts.id]
  })
}));

// ========== MÓDULO DE VACACIONES Y PERMISOS ==========

// Tipos de solicitudes
export const requestTypeEnum = pgEnum("request_type", [
  "vacation",        // Vacaciones
  "permission",      // Permisos
  "sick_leave",      // Incapacidad médica
  "maternity_leave", // Licencia de maternidad
  "paternity_leave", // Licencia de paternidad
  "personal_leave",  // Licencia personal
  "bereavement",     // Luto
  "study_leave",     // Licencia de estudios
  "unpaid_leave"     // Licencia sin goce de sueldo
]);

// Estados de solicitudes
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled"
]);

// Tabla de solicitudes de vacaciones, permisos e incapacidades
export const timeOffRequests = pgTable("time_off_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  requestType: requestTypeEnum("request_type").notNull(),
  
  // Fechas
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  requestedDays: decimal("requested_days", { precision: 5, scale: 2 }).notNull(),
  
  // Detalles
  reason: text("reason").notNull(),
  description: text("description"),
  medicalCertificate: text("medical_certificate"), // URL del certificado médico
  attachments: text("attachments").array(), // URLs de archivos adjuntos
  
  // Aprobación
  status: requestStatusEnum("status").default("pending"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  
  // Metadatos
  submittedAt: timestamp("submitted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de balance de vacaciones por empleado
export const vacationBalances = pgTable("vacation_balances", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  year: integer("year").notNull(),
  
  // Días disponibles
  totalDays: decimal("total_days", { precision: 5, scale: 2 }).notNull(), // Días totales por año
  usedDays: decimal("used_days", { precision: 5, scale: 2 }).default("0.00"), // Días utilizados
  pendingDays: decimal("pending_days", { precision: 5, scale: 2 }).default("0.00"), // Días pendientes de aprobación
  availableDays: decimal("available_days", { precision: 5, scale: 2 }).notNull(), // Días disponibles
  
  // Fechas
  startDate: date("start_date").notNull(), // Inicio del período
  endDate: date("end_date").notNull(), // Fin del período
  
  // Metadatos
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ========== MÓDULO DE CONTROL DE HORAS TRABAJADAS ==========

// Tipos de registros de tiempo
export const timeRecordTypeEnum = pgEnum("time_record_type", [
  "check_in",        // Entrada
  "check_out",       // Salida
  "break_start",     // Inicio de descanso
  "break_end",       // Fin de descanso
  "overtime_start",  // Inicio de horas extra
  "overtime_end"     // Fin de horas extra
]);

// Tabla de registros de tiempo (check-in/check-out)
export const timeRecords = pgTable("time_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  
  // Datos del registro
  recordType: timeRecordTypeEnum("record_type").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  date: date("date").notNull(),
  
  // Ubicación
  latitude: text("latitude"),
  longitude: text("longitude"),
  location: text("location"), // Descripción de la ubicación
  
  // Metadatos
  notes: text("notes"),
  isManualEntry: boolean("is_manual_entry").default(false),
  manualReason: text("manual_reason"),
  registeredBy: integer("registered_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow()
});

// Tabla de resumen diario de horas trabajadas
export const dailyTimeSheets = pgTable("daily_time_sheets", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  date: date("date").notNull(),
  
  // Horarios
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  
  // Horas calculadas
  regularHours: decimal("regular_hours", { precision: 5, scale: 2 }).default("0.00"),
  overtimeHours: decimal("overtime_hours", { precision: 5, scale: 2 }).default("0.00"),
  breakHours: decimal("break_hours", { precision: 5, scale: 2 }).default("0.00"),
  totalHours: decimal("total_hours", { precision: 5, scale: 2 }).default("0.00"),
  
  // Estado del día
  isLate: boolean("is_late").default(false),
  lateMinutes: integer("late_minutes").default(0),
  isEarlyLeave: boolean("is_early_leave").default(false),
  earlyLeaveMinutes: integer("early_leave_minutes").default(0),
  isAbsent: boolean("is_absent").default(false),
  
  // Justificaciones
  absenceReason: text("absence_reason"),
  lateReason: text("late_reason"),
  isJustified: boolean("is_justified").default(false),
  
  // Metadatos
  notes: text("notes"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de horarios de trabajo por empleado
export const workSchedules = pgTable("work_schedules", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  
  // Días de la semana
  monday: boolean("monday").default(true),
  tuesday: boolean("tuesday").default(true),
  wednesday: boolean("wednesday").default(true),
  thursday: boolean("thursday").default(true),
  friday: boolean("friday").default(true),
  saturday: boolean("saturday").default(false),
  sunday: boolean("sunday").default(false),
  
  // Horarios
  startTime: text("start_time").notNull(), // Formato HH:MM
  endTime: text("end_time").notNull(), // Formato HH:MM
  breakStartTime: text("break_start_time"), // Hora de inicio de descanso
  breakEndTime: text("break_end_time"), // Hora de fin de descanso
  
  // Configuración
  regularHoursPerDay: decimal("regular_hours_per_day", { precision: 5, scale: 2 }).default("8.00"),
  toleranceMinutes: integer("tolerance_minutes").default(15), // Tolerancia para llegadas tarde
  
  // Fechas de vigencia
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  
  // Metadatos
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Schemas de validación para vacaciones y permisos
export const insertTimeOffRequestSchema = createInsertSchema(timeOffRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertVacationBalanceSchema = createInsertSchema(vacationBalances).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTimeRecordSchema = createInsertSchema(timeRecords).omit({
  id: true,
  createdAt: true
});

export const insertDailyTimeSheetSchema = createInsertSchema(dailyTimeSheets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWorkScheduleSchema = createInsertSchema(workSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tipos TypeScript
export type InsertTimeOffRequest = z.infer<typeof insertTimeOffRequestSchema>;
export type TimeOffRequest = typeof timeOffRequests.$inferSelect;
export type InsertVacationBalance = z.infer<typeof insertVacationBalanceSchema>;
export type VacationBalance = typeof vacationBalances.$inferSelect;
export type InsertTimeRecord = z.infer<typeof insertTimeRecordSchema>;
export type TimeRecord = typeof timeRecords.$inferSelect;
export type InsertDailyTimeSheet = z.infer<typeof insertDailyTimeSheetSchema>;
export type DailyTimeSheet = typeof dailyTimeSheets.$inferSelect;
export type InsertWorkSchedule = z.infer<typeof insertWorkScheduleSchema>;
export type WorkSchedule = typeof workSchedules.$inferSelect;

// Relaciones para vacaciones y permisos
export const timeOffRequestsRelations = relations(timeOffRequests, ({ one }) => ({
  employee: one(employees, {
    fields: [timeOffRequests.employeeId],
    references: [employees.id]
  }),
  approver: one(users, {
    fields: [timeOffRequests.approvedBy],
    references: [users.id]
  })
}));

export const vacationBalancesRelations = relations(vacationBalances, ({ one }) => ({
  employee: one(employees, {
    fields: [vacationBalances.employeeId],
    references: [employees.id]
  })
}));

// Relaciones para control de horas
export const timeRecordsRelations = relations(timeRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [timeRecords.employeeId],
    references: [employees.id]
  }),
  registeredBy: one(users, {
    fields: [timeRecords.registeredBy],
    references: [users.id]
  })
}));

export const dailyTimeSheetsRelations = relations(dailyTimeSheets, ({ one }) => ({
  employee: one(employees, {
    fields: [dailyTimeSheets.employeeId],
    references: [employees.id]
  }),
  approver: one(users, {
    fields: [dailyTimeSheets.approvedBy],
    references: [users.id]
  })
}));

export const workSchedulesRelations = relations(workSchedules, ({ one }) => ({
  employee: one(employees, {
    fields: [workSchedules.employeeId],
    references: [employees.id]
  }),
  createdBy: one(users, {
    fields: [workSchedules.createdBy],
    references: [users.id]
  })
}));

// ========== MÓDULO DE COBRO HÍBRIDO PARA CONCESIONES ==========

// Enums para el sistema de cobro híbrido
export const paymentFrequencyEnum = pgEnum("payment_frequency", [
  "monthly",    // Mensual
  "quarterly",  // Trimestral
  "biannual",   // Semestral
  "annual"      // Anual
]);

export const chargeTypeEnum = pgEnum("charge_type", [
  "fixed",         // Pago fijo periódico
  "percentage",    // Porcentaje de ingresos
  "per_unit",      // Por unidad de servicio
  "per_m2",        // Por metro cuadrado
  "minimum_guarantee" // Garantía mínima
]);

export const bonusTypeEnum = pgEnum("bonus_type", [
  "bonus",    // Bonificación
  "penalty"   // Penalización
]);

export const bonusFrequencyEnum = pgEnum("bonus_frequency", [
  "once",     // Una sola vez
  "monthly",  // Mensual
  "annual"    // Anual
]);

// Tabla principal de configuración de cobro para contratos
export const contractPaymentConfigs = pgTable("contract_payment_configs", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => concessionContracts.id),
  
  // Configuraciones generales
  hasFixedPayment: boolean("has_fixed_payment").default(false),
  hasPercentagePayment: boolean("has_percentage_payment").default(false),
  hasPerUnitPayment: boolean("has_per_unit_payment").default(false),
  hasSpacePayment: boolean("has_space_payment").default(false),
  hasMinimumGuarantee: boolean("has_minimum_guarantee").default(false),
  
  // Garantía mínima mensual
  minimumGuaranteeAmount: decimal("minimum_guarantee_amount", { precision: 10, scale: 2 }),
  
  // Metadatos
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de cargos específicos (pago fijo, porcentaje, etc.)
export const contractCharges = pgTable("contract_charges", {
  id: serial("id").primaryKey(),
  paymentConfigId: integer("payment_config_id").notNull().references(() => contractPaymentConfigs.id),
  
  // Tipo de cargo
  chargeType: chargeTypeEnum("charge_type").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  
  // Configuración del cargo
  fixedAmount: decimal("fixed_amount", { precision: 10, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }), // Para porcentajes (ej: 15.50%)
  perUnitAmount: decimal("per_unit_amount", { precision: 10, scale: 2 }),
  perM2Amount: decimal("per_m2_amount", { precision: 10, scale: 2 }),
  
  // Frecuencia de cobro
  frequency: paymentFrequencyEnum("frequency").notNull(),
  
  // Configuraciones adicionales
  unitType: varchar("unit_type", { length: 50 }), // "boleto", "bicicleta", "alimento", etc.
  spaceM2: decimal("space_m2", { precision: 8, scale: 2 }), // Metros cuadrados ocupados
  
  // Estado
  isActive: boolean("is_active").default(true),
  startDate: date("start_date"),
  endDate: date("end_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de registro de inversión inicial
export const contractInvestments = pgTable("contract_investments", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => concessionContracts.id),
  
  // Detalles de la inversión
  description: text("description").notNull(),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }).notNull(),
  actualValue: decimal("actual_value", { precision: 12, scale: 2 }),
  
  // Fechas
  deadlineDate: date("deadline_date").notNull(),
  completedDate: date("completed_date"),
  
  // Amortización
  isAmortizable: boolean("is_amortizable").default(false),
  amortizationMonths: integer("amortization_months"),
  monthlyAmortization: decimal("monthly_amortization", { precision: 10, scale: 2 }),
  
  // Estado
  status: varchar("status", { length: 20 }).default("pending"), // pending, in_progress, completed, overdue
  
  // Documentación
  documentation: text("documentation"),
  attachments: jsonb("attachments"), // URLs de archivos adjuntos
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de bonificaciones y penalizaciones por desempeño
export const contractBonuses = pgTable("contract_bonuses", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => concessionContracts.id),
  
  // Tipo y descripción
  bonusType: bonusTypeEnum("bonus_type").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  
  // Configuración financiera
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: bonusFrequencyEnum("frequency").notNull(),
  
  // Condiciones de aplicación
  conditions: text("conditions"), // Condiciones específicas para aplicar
  evaluationCriteria: jsonb("evaluation_criteria"), // Criterios de evaluación
  
  // Estado
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de servicios autorizados para el concesionario
export const contractAuthorizedServices = pgTable("contract_authorized_services", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => concessionContracts.id),
  
  // Servicio
  serviceName: varchar("service_name", { length: 100 }).notNull(),
  serviceDescription: text("service_description"),
  serviceCategory: varchar("service_category", { length: 50 }), // "comida", "tours", "renta", etc.
  
  // Configuración de precios
  canChargePublic: boolean("can_charge_public").default(true),
  maxPublicRate: decimal("max_public_rate", { precision: 10, scale: 2 }),
  rateDescription: text("rate_description"), // Descripción de la tarifa
  
  // Restricciones
  restrictions: text("restrictions"),
  requiredPermits: text("required_permits"),
  
  // Estado
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de reportes mensuales de ingresos del concesionario
export const contractIncomeReports = pgTable("contract_income_reports", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => concessionContracts.id),
  
  // Período del reporte
  reportMonth: integer("report_month").notNull(), // 1-12
  reportYear: integer("report_year").notNull(),
  
  // Ingresos reportados
  grossIncome: decimal("gross_income", { precision: 12, scale: 2 }).notNull(),
  netIncome: decimal("net_income", { precision: 12, scale: 2 }),
  
  // Detalles por servicio
  serviceBreakdown: jsonb("service_breakdown"), // Desglose por tipo de servicio
  unitsSold: jsonb("units_sold"), // Unidades vendidas por tipo
  
  // Documentación de soporte
  supportingDocuments: jsonb("supporting_documents"), // URLs de facturas, reportes, etc.
  notes: text("notes"),
  
  // Control de calidad
  isVerified: boolean("is_verified").default(false),
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  
  // Estado
  status: varchar("status", { length: 20 }).default("submitted"), // submitted, under_review, approved, rejected
  
  submittedAt: timestamp("submitted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de cálculo de pagos mensuales
export const contractMonthlyPayments = pgTable("contract_monthly_payments", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => concessionContracts.id),
  incomeReportId: integer("income_report_id").references(() => contractIncomeReports.id),
  
  // Período
  paymentMonth: integer("payment_month").notNull(),
  paymentYear: integer("payment_year").notNull(),
  
  // Cálculos de pago
  fixedAmount: decimal("fixed_amount", { precision: 10, scale: 2 }).default("0.00"),
  percentageAmount: decimal("percentage_amount", { precision: 10, scale: 2 }).default("0.00"),
  perUnitAmount: decimal("per_unit_amount", { precision: 10, scale: 2 }).default("0.00"),
  spaceAmount: decimal("space_amount", { precision: 10, scale: 2 }).default("0.00"),
  
  // Subtotal antes de ajustes
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  
  // Aplicación de garantía mínima
  minimumGuaranteeApplied: boolean("minimum_guarantee_applied").default(false),
  minimumGuaranteeAdjustment: decimal("minimum_guarantee_adjustment", { precision: 10, scale: 2 }).default("0.00"),
  
  // Bonificaciones y penalizaciones
  bonusAmount: decimal("bonus_amount", { precision: 10, scale: 2 }).default("0.00"),
  penaltyAmount: decimal("penalty_amount", { precision: 10, scale: 2 }).default("0.00"),
  
  // Amortización de inversión
  investmentAmortization: decimal("investment_amortization", { precision: 10, scale: 2 }).default("0.00"),
  
  // Total final
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Estado del pago
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending, paid, overdue, partial
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0.00"),
  paidDate: date("paid_date"),
  
  // Detalles del cálculo
  calculationDetails: jsonb("calculation_details"), // JSON con el desglose completo
  notes: text("notes"),
  
  // Metadatos
  calculatedBy: integer("calculated_by").references(() => users.id),
  calculatedAt: timestamp("calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Schemas de validación para el sistema de cobro híbrido
export const insertContractPaymentConfigSchema = createInsertSchema(contractPaymentConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertContractChargeSchema = createInsertSchema(contractCharges).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertContractInvestmentSchema = createInsertSchema(contractInvestments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertContractBonusSchema = createInsertSchema(contractBonuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertContractAuthorizedServiceSchema = createInsertSchema(contractAuthorizedServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertContractIncomeReportSchema = createInsertSchema(contractIncomeReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true
});

export const insertContractMonthlyPaymentSchema = createInsertSchema(contractMonthlyPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  calculatedAt: true
});

// Tipos TypeScript para el sistema de cobro híbrido
export type ContractPaymentConfig = typeof contractPaymentConfigs.$inferSelect;
export type InsertContractPaymentConfig = z.infer<typeof insertContractPaymentConfigSchema>;

export type ContractCharge = typeof contractCharges.$inferSelect;
export type InsertContractCharge = z.infer<typeof insertContractChargeSchema>;

export type ContractInvestment = typeof contractInvestments.$inferSelect;
export type InsertContractInvestment = z.infer<typeof insertContractInvestmentSchema>;

export type ContractBonus = typeof contractBonuses.$inferSelect;
export type InsertContractBonus = z.infer<typeof insertContractBonusSchema>;

export type ContractAuthorizedService = typeof contractAuthorizedServices.$inferSelect;
export type InsertContractAuthorizedService = z.infer<typeof insertContractAuthorizedServiceSchema>;

export type ContractIncomeReport = typeof contractIncomeReports.$inferSelect;
export type InsertContractIncomeReport = z.infer<typeof insertContractIncomeReportSchema>;

export type ContractMonthlyPayment = typeof contractMonthlyPayments.$inferSelect;
export type InsertContractMonthlyPayment = z.infer<typeof insertContractMonthlyPaymentSchema>;

// ===== SISTEMA DE PATROCINIOS =====

// Enum para categorías de beneficios de patrocinio
export const benefitsCategoriesEnum = pgEnum("benefits_categories", [
  "Visibilidad",
  "Acceso", 
  "Branding", 
  "Otro"
]);

// Tabla de paquetes de patrocinio
export const sponsorshipPackages = pgTable("sponsorship_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de beneficios disponibles para patrocinios
export const sponsorshipBenefits = pgTable("sponsorship_benefits", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: benefitsCategoriesEnum("category"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de relación entre paquetes y beneficios
export const sponsorshipPackageBenefits = pgTable("sponsorship_package_benefits", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id").notNull().references(() => sponsorshipPackages.id, { onDelete: 'cascade' }),
  benefitId: integer("benefit_id").notNull().references(() => sponsorshipBenefits.id, { onDelete: 'cascade' }),
  quantity: integer("quantity").default(1),
  customValue: text("custom_value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de patrocinadores simplificada
export const sponsors = pgTable("sponsors", {
  id: serial("id").primaryKey(), // Mantengo serial por compatibilidad
  name: varchar("name", { length: 255 }).notNull(),
  sector: varchar("sector", { length: 100 }).notNull(), // sector económico
  logo_url: varchar("logo_url", { length: 500 }), // imagen/logo
  status: varchar("status", { length: 50 }).default("Activo"), // Activo, Inactivo, Suspendido
  website_url: varchar("website_url", { length: 255 }), // sitio web
  representative: varchar("representative", { length: 255 }), // nombre del contacto
  contact_info: json("contact_info").$type<{
    phone?: string;
    email?: string;
    social_media?: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      instagram?: string;
    };
    additional_contacts?: {
      secondary_phone?: string;
      secondary_email?: string;
    };
  }>().default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de campañas de patrocinio
export const sponsorshipCampaigns = pgTable("sponsorship_campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }).notNull(),
  sponsorsCount: integer("sponsors_count").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0.00"),
  status: varchar("status", { length: 50 }).default("planificacion"), // planificacion, activa, completada, cancelada
  events: json("events").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Schemas de validación para patrocinios
export const insertSponsorshipPackageSchema = createInsertSchema(sponsorshipPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSponsorshipBenefitSchema = createInsertSchema(sponsorshipBenefits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSponsorshipPackageBenefitSchema = createInsertSchema(sponsorshipPackageBenefits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSponsorSchema = createInsertSchema(sponsors).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSponsorshipCampaignSchema = createInsertSchema(sponsorshipCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Enums para contratos de patrocinio
export const contractTypeEnum = pgEnum("contract_type", ["paquete", "activo", "evento", "otro"]);
export const contractStatusEnum = pgEnum("contract_status", ["activo", "vencido", "en_negociacion", "en_revision"]);

// Tabla de contratos de patrocinio  
export const sponsorshipContracts = pgTable("sponsorship_contracts", {
  id: serial("id").primaryKey(), // Mantengo serial por compatibilidad con datos existentes
  number: varchar("number", { length: 50 }).notNull().unique(), // clave alfanumérica para control
  sponsorId: integer("sponsor_id").notNull().references(() => sponsors.id),
  type: contractTypeEnum("type").notNull(),
  packageId: integer("package_id").references(() => sponsorshipPackages.id), // nullable, solo si type es "paquete"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // aportación económica
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: contractStatusEnum("status").default("en_negociacion"),
  notes: text("notes"), // observaciones
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de eventos vinculados a contratos de patrocinio
export const sponsorshipEventsLinks = pgTable("sponsorship_events_links", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => sponsorshipContracts.id, { onDelete: "cascade" }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  visibility: varchar("visibility", { length: 255 }).notNull().default("public"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Keep the original sponsorshipEvents for legacy compatibility but point to different table
export const sponsorshipEvents = pgTable("sponsorship_events", {
  id: serial("id").primaryKey(),
  sponsorId: integer("sponsor_id").notNull().references(() => sponsors.id),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  eventDate: date("event_date").notNull(),
  eventType: varchar("event_type", { length: 100 }),
  participantsCount: integer("participants_count").default(0),
  budgetAllocated: decimal("budget_allocated", { precision: 10, scale: 2 }).default("0.00"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});

// Tabla de métricas de patrocinio
export const sponsorshipMetrics = pgTable("sponsorship_metrics", {
  id: serial("id").primaryKey(),
  sponsorId: integer("sponsor_id").notNull().references(() => sponsors.id),
  eventId: integer("event_id").references(() => events.id),
  
  // Métricas de alcance
  impressions: integer("impressions").default(0),
  reach: integer("reach").default(0),
  engagement: integer("engagement").default(0),
  
  // Métricas de conversión
  leadsGenerated: integer("leads_generated").default(0),
  conversions: integer("conversions").default(0),
  
  // Métricas de marca
  brandMentions: integer("brand_mentions").default(0),
  socialMediaReach: integer("social_media_reach").default(0),
  websiteClicks: integer("website_clicks").default(0),
  emailSignups: integer("email_signups").default(0),
  
  // Período de medición
  measurementPeriod: varchar("measurement_period", { length: 50 }).default("monthly"), // daily, weekly, monthly, event
  reportDate: date("report_date").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de activos vinculados a contratos de patrocinio
export const sponsorshipAssets = pgTable("sponsorship_assets", {
  id: serial("id").primaryKey(), // Mantengo serial por compatibilidad y seguridad
  contractId: integer("contract_id").notNull().references(() => sponsorshipContracts.id, { onDelete: "cascade" }),
  assetId: integer("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  branding: varchar("branding", { length: 255 }).notNull(), // elemento publicitario en el activo
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de evaluaciones de patrocinio
export const sponsorshipEvaluations = pgTable("sponsorship_evaluations", {
  id: serial("id").primaryKey(),
  sponsorId: integer("sponsor_id").notNull().references(() => sponsors.id),
  eventId: integer("event_id").references(() => events.id),
  
  // Calificaciones (1-10)
  overallSatisfaction: integer("overall_satisfaction").notNull(),
  valueForMoney: integer("value_for_money").notNull(),
  organizationQuality: integer("organization_quality").notNull(),
  audienceQuality: integer("audience_quality").notNull(),
  communicationRating: integer("communication_rating").notNull(),
  logisticsRating: integer("logistics_rating").notNull(),
  
  // NPS
  recommendationScore: integer("recommendation_score").notNull(), // 0-10
  
  // Comentarios
  feedback: text("feedback"),
  improvements: text("improvements"),
  
  // Renovación
  wouldRenew: boolean("would_renew").default(false),
  
  evaluationDate: date("evaluation_date").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de renovaciones
export const sponsorshipRenewals = pgTable("sponsorship_renewals", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => sponsorshipContracts.id),
  
  // Detalles de renovación
  reminderSentDate: date("reminder_sent_date"),
  responseDate: date("response_date"),
  decision: varchar("decision", { length: 50 }), // pending, accepted, rejected, negotiating
  
  // Nuevos términos (si aplica)
  newPackageId: integer("new_package_id").references(() => sponsorshipPackages.id),
  newAmount: decimal("new_amount", { precision: 10, scale: 2 }),
  newStartDate: date("new_start_date"),
  newEndDate: date("new_end_date"),
  
  // Comentarios
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de beneficios específicos por evento
export const sponsorEventBenefits = pgTable("sponsor_event_benefits", {
  id: serial("id").primaryKey(),
  sponsorEventId: integer("sponsor_event_id").notNull().references(() => sponsorshipEvents.id),
  
  // Beneficio específico
  benefitType: varchar("benefit_type", { length: 50 }).notNull(), // logo_placement, stand_space, social_media, etc.
  benefitDescription: text("benefit_description").notNull(),
  
  // Especificaciones
  specifications: text("specifications"), // tamaño, ubicación, duración
  
  // Estado
  status: varchar("status", { length: 50 }).default("planned"), // planned, delivered, cancelled
  deliveryDate: date("delivery_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Schemas de validación para las nuevas tablas
export const insertSponsorshipContractSchema = createInsertSchema(sponsorshipContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  // Validaciones adicionales
  number: z.string().min(1, "El número de contrato es requerido"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "El monto debe ser mayor a 0"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida")
});

// Insert schema for the links table
export const insertSponsorshipEventLinkSchema = createInsertSchema(sponsorshipEventsLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Keep the old schema for legacy compatibility
export const insertSponsorshipEventSchema = createInsertSchema(sponsorshipEvents).omit({
  id: true,
  createdAt: true
});

export const insertSponsorshipMetricsSchema = createInsertSchema(sponsorshipMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSponsorshipAssetSchema = createInsertSchema(sponsorshipAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSponsorshipEvaluationSchema = createInsertSchema(sponsorshipEvaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSponsorshipRenewalSchema = createInsertSchema(sponsorshipRenewals).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSponsorEventBenefitSchema = createInsertSchema(sponsorEventBenefits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tipos TypeScript para patrocinios
export type SponsorshipPackage = typeof sponsorshipPackages.$inferSelect;
export type InsertSponsorshipPackage = z.infer<typeof insertSponsorshipPackageSchema>;

export type SponsorshipBenefit = typeof sponsorshipBenefits.$inferSelect;
export type InsertSponsorshipBenefit = z.infer<typeof insertSponsorshipBenefitSchema>;

export type SponsorshipPackageBenefit = typeof sponsorshipPackageBenefits.$inferSelect;
export type InsertSponsorshipPackageBenefit = z.infer<typeof insertSponsorshipPackageBenefitSchema>;

export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;

export type SponsorshipCampaign = typeof sponsorshipCampaigns.$inferSelect;
export type InsertSponsorshipCampaign = z.infer<typeof insertSponsorshipCampaignSchema>;

export type SponsorshipContract = typeof sponsorshipContracts.$inferSelect;
export type InsertSponsorshipContract = z.infer<typeof insertSponsorshipContractSchema>;

// Types for the links table
export type SponsorshipEventLink = typeof sponsorshipEventsLinks.$inferSelect;
export type InsertSponsorshipEventLink = z.infer<typeof insertSponsorshipEventLinkSchema>;

// Legacy types
export type SponsorshipEvent = typeof sponsorshipEvents.$inferSelect;
export type InsertSponsorshipEvent = z.infer<typeof insertSponsorshipEventSchema>;

export type SponsorshipMetrics = typeof sponsorshipMetrics.$inferSelect;
export type InsertSponsorshipMetrics = z.infer<typeof insertSponsorshipMetricsSchema>;

export type SponsorshipAsset = typeof sponsorshipAssets.$inferSelect;
export type InsertSponsorshipAsset = z.infer<typeof insertSponsorshipAssetSchema>;

export type SponsorshipEvaluation = typeof sponsorshipEvaluations.$inferSelect;
export type InsertSponsorshipEvaluation = z.infer<typeof insertSponsorshipEvaluationSchema>;

export type SponsorshipRenewal = typeof sponsorshipRenewals.$inferSelect;
export type InsertSponsorshipRenewal = z.infer<typeof insertSponsorshipRenewalSchema>;

export type SponsorEventBenefit = typeof sponsorEventBenefits.$inferSelect;
export type InsertSponsorEventBenefit = z.infer<typeof insertSponsorEventBenefitSchema>;

// ===== CONCESIONES ACTIVAS - ESTRUCTURA MEJORADA =====

// Tabla principal de concesiones activas (nueva estructura lógica)
export const activeConcessions = pgTable("active_concessions", {
  id: serial("id").primaryKey(),
  
  // Información básica de la concesión
  name: varchar("name", { length: 255 }).notNull(), // Nombre específico de la concesión
  description: text("description").notNull(),
  
  // Relaciones principales
  concessionTypeId: integer("concession_type_id").notNull().references(() => concessionTypes.id),
  concessionaireId: integer("concessionaire_id").notNull().references(() => users.id), // Usuario con rol concesionario
  parkId: integer("park_id").notNull().references(() => parks.id),
  
  // Ubicación específica en el parque
  specificLocation: text("specific_location").notNull(), // "Entrada principal", "Zona deportiva", etc.
  coordinates: varchar("coordinates", { length: 100 }), // GPS si es necesario
  area: decimal("area", { precision: 10, scale: 2 }), // Metros cuadrados
  
  // Operación y vigencia
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  operatingHours: varchar("operating_hours", { length: 255 }), // "8:00-18:00" o JSON
  operatingDays: varchar("operating_days", { length: 100 }), // "Lunes a Domingo" o JSON
  
  // Estado y gestión
  status: varchar("status", { length: 50 }).notNull().default('activa'), // activa, suspendida, vencida, renovacion
  priority: varchar("priority", { length: 20 }).default("normal"), // alta, normal, baja
  
  // Términos específicos de la concesión
  specificTerms: text("specific_terms"), // Condiciones particulares
  specialRequirements: text("special_requirements"), // Requisitos específicos
  
  // Documentación
  contractNumber: varchar("contract_number", { length: 100 }),
  contractFile: varchar("contract_file", { length: 500 }), // URL del contrato firmado
  permitFile: varchar("permit_file", { length: 500 }), // URL del permiso municipal
  insuranceFile: varchar("insurance_file", { length: 500 }), // URL del seguro
  
  // Información financiera básica
  monthlyPayment: decimal("monthly_payment", { precision: 10, scale: 2 }), // Pago mensual fijo si aplica
  revenuePercentage: decimal("revenue_percentage", { precision: 5, scale: 2 }), // % de ingresos si aplica
  deposit: decimal("deposit", { precision: 10, scale: 2 }), // Depósito en garantía
  
  // Contacto de emergencia/operación
  emergencyContact: varchar("emergency_contact", { length: 255 }),
  emergencyPhone: varchar("emergency_phone", { length: 50 }),
  
  // Notas y observaciones
  notes: text("notes"),
  internalNotes: text("internal_notes"), // Solo para administradores
  
  // Metadatos
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla para imágenes de concesiones activas (mejorando la existente)
export const activeConcessionImages = pgTable("active_concession_images", {
  id: serial("id").primaryKey(),
  concessionId: integer("concession_id").notNull().references(() => activeConcessions.id, { onDelete: 'cascade' }),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  imageType: varchar("image_type", { length: 50 }).default("general"), // general, exterior, interior, products, menu, etc.
  isPrimary: boolean("is_primary").default(false),
  displayOrder: integer("display_order").default(0),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla para documentos adicionales de concesiones
export const activeConcessionDocuments = pgTable("active_concession_documents", {
  id: serial("id").primaryKey(),
  concessionId: integer("concession_id").notNull().references(() => activeConcessions.id, { onDelete: 'cascade' }),
  documentUrl: varchar("document_url", { length: 500 }).notNull(),
  documentType: varchar("document_type", { length: 100 }).notNull(), // contrato, permiso, seguro, menu, reglamento, etc.
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  expirationDate: date("expiration_date"), // Para documentos que vencen
  isRequired: boolean("is_required").default(false),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Schemas de validación
export const insertActiveConcessionSchema = createInsertSchema(activeConcessions).omit({
  id: true,
  createdBy: true,
  lastModifiedBy: true,
  createdAt: true,
  updatedAt: true
});

export const insertActiveConcessionImageSchema = createInsertSchema(activeConcessionImages).omit({
  id: true,
  uploadedBy: true,
  createdAt: true,
  updatedAt: true
});

export const insertActiveConcessionDocumentSchema = createInsertSchema(activeConcessionDocuments).omit({
  id: true,
  uploadedBy: true,
  createdAt: true,
  updatedAt: true
});

// Tipos TypeScript
export type ActiveConcession = typeof activeConcessions.$inferSelect;
export type InsertActiveConcession = z.infer<typeof insertActiveConcessionSchema>;

export type ActiveConcessionImage = typeof activeConcessionImages.$inferSelect;
export type InsertActiveConcessionImage = z.infer<typeof insertActiveConcessionImageSchema>;

export type ActiveConcessionDocument = typeof activeConcessionDocuments.$inferSelect;
export type InsertActiveConcessionDocument = z.infer<typeof insertActiveConcessionDocumentSchema>;

// ===== SISTEMA DE RESERVAS DE ESPACIOS =====

// Espacios reservables en los parques
export const reservableSpaces = pgTable("reservable_spaces", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull().references(() => parks.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  spaceType: varchar("space_type", { length: 100 }).notNull(), // "playground", "kiosk", "open_area", "pavilion"
  capacity: integer("capacity"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).default("0.00"),
  minimumHours: integer("minimum_hours").default(1),
  maximumHours: integer("maximum_hours").default(8),
  amenities: text("amenities"),
  rules: text("rules"),
  isActive: boolean("is_active").default(true),
  requiresApproval: boolean("requires_approval").default(false),
  advanceBookingDays: integer("advance_booking_days").default(30),
  images: text("images"),
  coordinates: text("coordinates"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reservas de espacios
export const spaceReservations = pgTable("space_reservations", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull().references(() => reservableSpaces.id),
  eventId: integer("event_id").references(() => events.id),
  activityId: integer("activity_id").references(() => activities.id),
  reservedBy: integer("reserved_by").notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 20 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  reservationDate: date("reservation_date").notNull(),
  startTime: varchar("start_time", { length: 8 }).notNull(), // "09:00:00"
  endTime: varchar("end_time", { length: 8 }).notNull(), // "17:00:00"
  expectedAttendees: integer("expected_attendees"),
  purpose: text("purpose").notNull(),
  specialRequests: text("special_requests"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).default("0.00"),
  depositPaid: decimal("deposit_paid", { precision: 10, scale: 2 }).default("0.00"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, confirmed, cancelled, completed
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  cancellationReason: text("cancellation_reason"),
  notes: text("notes"),
  
  // Campos de descuentos aplicables (unificado con actividades)
  discountSeniors: decimal("discount_seniors", { precision: 5, scale: 2 }).default("0.00"), // descuento adultos mayores
  discountStudents: decimal("discount_students", { precision: 5, scale: 2 }).default("0.00"), // descuento estudiantes  
  discountFamilies: decimal("discount_families", { precision: 5, scale: 2 }).default("0.00"), // descuento familias numerosas
  discountDisability: decimal("discount_disability", { precision: 5, scale: 2 }).default("0.00"), // descuento discapacidad
  discountEarlyBird: decimal("discount_early_bird", { precision: 5, scale: 2 }).default("0.00"), // descuento inscripción temprana
  discountEarlyBirdDeadline: timestamp("discount_early_bird_deadline"), // fecha límite inscripción temprana
  
  // Campos de costeo financiero (unificado con actividades)
  costRecoveryPercentage: decimal("cost_recovery_percentage", { precision: 5, scale: 2 }).default("30.00"), // % objetivo de recuperación
  financialNotes: text("financial_notes"), // observaciones del área de finanzas
  reviewedBy: integer("reviewed_by"), // ID del usuario que revisó (referencias a users)
  reviewedAt: timestamp("reviewed_at"), // fecha de revisión financiera
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Disponibilidad de espacios
export const spaceAvailability = pgTable("space_availability", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull().references(() => reservableSpaces.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Domingo, 1=Lunes, etc.
  startTime: varchar("start_time", { length: 8 }).notNull(),
  endTime: varchar("end_time", { length: 8 }).notNull(),
  isAvailable: boolean("is_available").default(true),
  exceptionDate: date("exception_date"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Imágenes de espacios reservables
export const spaceImages = pgTable("space_images", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull().references(() => reservableSpaces.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Documentos de espacios reservables
export const spaceDocuments = pgTable("space_documents", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull().references(() => reservableSpaces.id, { onDelete: "cascade" }),
  documentUrl: text("document_url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relaciones para reservas de espacios
export const reservableSpacesRelations = relations(reservableSpaces, ({ one, many }) => ({
  park: one(parks, {
    fields: [reservableSpaces.parkId],
    references: [parks.id],
  }),
  reservations: many(spaceReservations),
  availability: many(spaceAvailability),
  images: many(spaceImages),
  documents: many(spaceDocuments),
}));

export const spaceImagesRelations = relations(spaceImages, ({ one }) => ({
  space: one(reservableSpaces, {
    fields: [spaceImages.spaceId],
    references: [reservableSpaces.id],
  }),
}));

export const spaceDocumentsRelations = relations(spaceDocuments, ({ one }) => ({
  space: one(reservableSpaces, {
    fields: [spaceDocuments.spaceId],
    references: [reservableSpaces.id],
  }),
}));

export const spaceReservationsRelations = relations(spaceReservations, ({ one }) => ({
  space: one(reservableSpaces, {
    fields: [spaceReservations.spaceId],
    references: [reservableSpaces.id],
  }),
  event: one(events, {
    fields: [spaceReservations.eventId],
    references: [events.id],
  }),
  activity: one(activities, {
    fields: [spaceReservations.activityId],
    references: [activities.id],
  }),
}));

// Esquemas de validación para reservas
export const insertReservableSpaceSchema = createInsertSchema(reservableSpaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSpaceReservationSchema = createInsertSchema(spaceReservations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSpaceImageSchema = createInsertSchema(spaceImages).omit({
  id: true,
  createdAt: true
});

export const insertSpaceDocumentSchema = createInsertSchema(spaceDocuments).omit({
  id: true,
  createdAt: true
});

// Tipos TypeScript para reservas
export type ReservableSpace = typeof reservableSpaces.$inferSelect;
export type InsertReservableSpace = z.infer<typeof insertReservableSpaceSchema>;
export type SpaceReservation = typeof spaceReservations.$inferSelect;
export type InsertSpaceReservation = z.infer<typeof insertSpaceReservationSchema>;
export type SpaceAvailability = typeof spaceAvailability.$inferSelect;
export type SpaceImage = typeof spaceImages.$inferSelect;
export type InsertSpaceImage = z.infer<typeof insertSpaceImageSchema>;
export type SpaceDocument = typeof spaceDocuments.$inferSelect;
export type InsertSpaceDocument = z.infer<typeof insertSpaceDocumentSchema>;

// ===== SISTEMA DE CONTEO DE VISITANTES =====

export const visitorCounts = pgTable("visitor_counts", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").references(() => parks.id).notNull(),
  date: date("date").notNull(),
  adults: integer("adults").default(0).notNull(),
  children: integer("children").default(0).notNull(),
  seniors: integer("seniors").default(0).notNull(),
  pets: integer("pets").default(0).notNull(),
  groups: integer("groups").default(0).notNull(),
  countingMethod: varchar("counting_method", { length: 50 }).notNull(), // estimation, manual_counter, event_based, entrance_control
  dayType: varchar("day_type", { length: 20 }), // weekday, weekend, holiday - opcional para rangos
  weather: varchar("weather", { length: 20 }), // sunny, cloudy, rainy, other - opcional para rangos
  notes: text("notes"),
  registeredBy: integer("registered_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relaciones para conteo de visitantes
export const visitorCountsRelations = relations(visitorCounts, ({ one }) => ({
  park: one(parks, { fields: [visitorCounts.parkId], references: [parks.id] }),
  registeredBy: one(users, { fields: [visitorCounts.registeredBy], references: [users.id] }),
}));

// Schemas de inserción para conteo de visitantes
export const insertVisitorCountSchema = createInsertSchema(visitorCounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dayType: z.string().optional(),
  weather: z.string().optional(),
});

export type InsertVisitorCount = z.infer<typeof insertVisitorCountSchema>;
export type VisitorCount = typeof visitorCounts.$inferSelect;

// ===== SISTEMA DE EVALUACIONES DE PARQUES =====

export const parkEvaluations = pgTable("park_evaluations", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").references(() => parks.id).notNull(),
  
  // Información del evaluador
  evaluatorName: varchar("evaluator_name", { length: 255 }).notNull(),
  evaluatorEmail: varchar("evaluator_email", { length: 255 }),
  evaluatorPhone: varchar("evaluator_phone", { length: 20 }),
  evaluatorCity: varchar("evaluator_city", { length: 100 }),
  evaluatorAge: integer("evaluator_age"),
  isFrequentVisitor: boolean("is_frequent_visitor").default(false),
  
  // Criterios de evaluación (1-5 estrellas)
  cleanliness: integer("cleanliness").notNull(), // Limpieza
  safety: integer("safety").notNull(), // Seguridad
  maintenance: integer("maintenance").notNull(), // Mantenimiento
  accessibility: integer("accessibility").notNull(), // Accesibilidad
  amenities: integer("amenities").notNull(), // Amenidades
  activities: integer("activities").notNull(), // Actividades
  staff: integer("staff").notNull(), // Personal
  naturalBeauty: integer("natural_beauty").notNull(), // Belleza natural
  
  // Calificación general
  overallRating: integer("overall_rating").notNull(), // Calificación general
  
  // Comentarios y sugerencias
  comments: text("comments"),
  suggestions: text("suggestions"),
  wouldRecommend: boolean("would_recommend").default(true),
  
  // Información adicional
  visitDate: date("visit_date"),
  visitPurpose: varchar("visit_purpose", { length: 100 }), // recreation, exercise, family, work, etc.
  visitDuration: integer("visit_duration"), // en minutos
  
  // Moderación
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected
  moderatedBy: integer("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationNotes: text("moderation_notes"),
  
  // Metadata
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relaciones para evaluaciones de parques
export const parkEvaluationsRelations = relations(parkEvaluations, ({ one }) => ({
  park: one(parks, { fields: [parkEvaluations.parkId], references: [parks.id] }),
  moderatedBy: one(users, { fields: [parkEvaluations.moderatedBy], references: [users.id] }),
}));

// Esquemas de validación para evaluaciones
export const insertParkEvaluationSchema = createInsertSchema(parkEvaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  moderatedBy: true,
  moderatedAt: true,
  moderationNotes: true,
}).extend({
  // Validación de calificaciones (1-5)
  cleanliness: z.number().min(1).max(5),
  safety: z.number().min(1).max(5),
  maintenance: z.number().min(1).max(5),
  accessibility: z.number().min(1).max(5),
  amenities: z.number().min(1).max(5),
  activities: z.number().min(1).max(5),
  staff: z.number().min(1).max(5),
  naturalBeauty: z.number().min(1).max(5),
  overallRating: z.number().min(1).max(5),
  
  // Validación de campos opcionales
  evaluatorEmail: z.string().email().optional(),
  evaluatorPhone: z.string().optional(),
  evaluatorCity: z.string().optional(),
  evaluatorAge: z.number().min(13).max(120).optional(),
  comments: z.string().optional(),
  suggestions: z.string().optional(),
  visitDate: z.string().optional(),
  visitPurpose: z.string().optional(),
  visitDuration: z.number().min(1).optional(),
});

export const updateParkEvaluationSchema = createInsertSchema(parkEvaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["pending", "approved", "rejected"]),
  moderationNotes: z.string().optional(),
});

// Tipos TypeScript para evaluaciones
export type ParkEvaluation = typeof parkEvaluations.$inferSelect;
export type InsertParkEvaluation = z.infer<typeof insertParkEvaluationSchema>;
export type UpdateParkEvaluation = z.infer<typeof updateParkEvaluationSchema>;

// ===== CRITERIOS DE EVALUACIÓN CONFIGURABLES =====

export const evaluationCriteria = pgTable("evaluation_criteria", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  fieldType: varchar("field_type", { length: 50 }).notNull().default("rating"), // rating, boolean, text
  minValue: integer("min_value").default(1),
  maxValue: integer("max_value").default(5),
  isRequired: boolean("is_required").default(true),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  icon: varchar("icon", { length: 50 }),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relaciones para criterios de evaluación
export const evaluationCriteriaRelations = relations(evaluationCriteria, ({ many }) => ({
  responses: many(evaluationResponses),
}));

// Tabla para almacenar respuestas flexibles basadas en criterios configurables
export const evaluationResponses = pgTable("evaluation_responses", {
  id: serial("id").primaryKey(),
  evaluationId: integer("evaluation_id").notNull().references(() => parkEvaluations.id),
  criteriaId: integer("criteria_id").notNull().references(() => evaluationCriteria.id),
  ratingValue: integer("rating_value"), // Para criterios tipo rating
  textValue: text("text_value"), // Para criterios tipo text
  booleanValue: boolean("boolean_value"), // Para criterios tipo boolean
  createdAt: timestamp("created_at").defaultNow(),
});

// Relaciones para respuestas de evaluación
export const evaluationResponsesRelations = relations(evaluationResponses, ({ one }) => ({
  evaluation: one(parkEvaluations, { fields: [evaluationResponses.evaluationId], references: [parkEvaluations.id] }),
  criteria: one(evaluationCriteria, { fields: [evaluationResponses.criteriaId], references: [evaluationCriteria.id] }),
}));

// Esquemas de validación para criterios
export const insertEvaluationCriteriaSchema = createInsertSchema(evaluationCriteria).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEvaluationResponseSchema = createInsertSchema(evaluationResponses).omit({
  id: true,
  createdAt: true,
});

// Tipos TypeScript para criterios
export type EvaluationCriteria = typeof evaluationCriteria.$inferSelect;
export type InsertEvaluationCriteria = z.infer<typeof insertEvaluationCriteriaSchema>;
export type EvaluationResponse = typeof evaluationResponses.$inferSelect;
export type InsertEvaluationResponse = z.infer<typeof insertEvaluationResponseSchema>;

// ===== SISTEMA UNIFICADO DE EVALUACIONES MULTI-ENTIDAD =====

// Enum para tipos de entidades evaluables
export const evaluationEntityTypeEnum = pgEnum("evaluation_entity_type", [
  "park", 
  "instructor", 
  "volunteer", 
  "activity", 
  "concessionaire", 
  "event"
]);

// Configuración de criterios por tipo de entidad
export const evaluationCriteriaAssignments = pgTable("evaluation_criteria_assignments", {
  id: serial("id").primaryKey(),
  criteriaId: integer("criteria_id").references(() => evaluationCriteria.id).notNull(),
  entityType: evaluationEntityTypeEnum("entity_type").notNull(),
  isRequired: boolean("is_required").default(true),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabla principal de evaluaciones unificadas (para instructores, voluntarios, actividades, concesionarios, eventos)
export const universalEvaluations = pgTable("universal_evaluations", {
  id: serial("id").primaryKey(),
  
  // Tipo de entidad y referencia flexible
  entityType: evaluationEntityTypeEnum("entity_type").notNull(),
  entityId: integer("entity_id").notNull(), // ID de la entidad (instructor.id, volunteer.id, etc.)
  
  // Información del evaluador
  evaluatorName: varchar("evaluator_name", { length: 255 }).notNull(),
  evaluatorEmail: varchar("evaluator_email", { length: 255 }),
  evaluatorPhone: varchar("evaluator_phone", { length: 20 }),
  evaluatorCity: varchar("evaluator_city", { length: 100 }),
  evaluatorAge: integer("evaluator_age"),
  evaluatorRole: varchar("evaluator_role", { length: 100 }), // participant, citizen, admin, etc.
  
  // Información contextual (flexible según tipo de entidad)
  contextualInfo: jsonb("contextual_info").$type<Record<string, any>>(), // Información específica del contexto
  
  // Calificación general
  overallRating: integer("overall_rating").notNull(), // Calificación general 1-5
  
  // Comentarios y sugerencias
  comments: text("comments"),
  suggestions: text("suggestions"),
  wouldRecommend: boolean("would_recommend").default(true),
  
  // Información de la experiencia
  experienceDate: date("experience_date"), // Fecha de la experiencia evaluada
  experienceDetails: jsonb("experience_details").$type<Record<string, any>>(), // Detalles específicos
  
  // Moderación
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected
  moderatedBy: integer("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationNotes: text("moderation_notes"),
  
  // Metadata
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  source: varchar("source", { length: 50 }).default("web"), // web, mobile, admin
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Respuestas de evaluaciones universales (usando criterios configurables)
export const universalEvaluationResponses = pgTable("universal_evaluation_responses", {
  id: serial("id").primaryKey(),
  evaluationId: integer("evaluation_id").notNull().references(() => universalEvaluations.id),
  criteriaId: integer("criteria_id").notNull().references(() => evaluationCriteria.id),
  ratingValue: integer("rating_value"), // Para criterios tipo rating
  textValue: text("text_value"), // Para criterios tipo text
  booleanValue: boolean("boolean_value"), // Para criterios tipo boolean
  createdAt: timestamp("created_at").defaultNow(),
});

// Vista consolidada para el administrador (une parques y evaluaciones universales)
export const consolidatedEvaluationsView = pgTable("consolidated_evaluations_view", {
  id: serial("id").primaryKey(),
  evaluationType: varchar("evaluation_type", { length: 20 }).notNull(), // "park" | "universal"
  originalEvaluationId: integer("original_evaluation_id").notNull(),
  entityType: varchar("entity_type", { length: 20 }).notNull(),
  entityId: integer("entity_id").notNull(),
  entityName: varchar("entity_name", { length: 255 }).notNull(),
  evaluatorName: varchar("evaluator_name", { length: 255 }).notNull(),
  evaluatorEmail: varchar("evaluator_email", { length: 255 }),
  overallRating: integer("overall_rating").notNull(),
  comments: text("comments"),
  status: varchar("status", { length: 20 }).notNull(),
  experienceDate: date("experience_date"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Relaciones para evaluaciones universales
export const universalEvaluationsRelations = relations(universalEvaluations, ({ one, many }) => ({
  moderatedBy: one(users, { fields: [universalEvaluations.moderatedBy], references: [users.id] }),
  responses: many(universalEvaluationResponses),
}));

export const evaluationCriteriaAssignmentsRelations = relations(evaluationCriteriaAssignments, ({ one }) => ({
  criteria: one(evaluationCriteria, { fields: [evaluationCriteriaAssignments.criteriaId], references: [evaluationCriteria.id] }),
}));

export const universalEvaluationResponsesRelations = relations(universalEvaluationResponses, ({ one }) => ({
  evaluation: one(universalEvaluations, { fields: [universalEvaluationResponses.evaluationId], references: [universalEvaluations.id] }),
  criteria: one(evaluationCriteria, { fields: [universalEvaluationResponses.criteriaId], references: [evaluationCriteria.id] }),
}));

// Esquemas de validación para sistema unificado
export const insertUniversalEvaluationSchema = createInsertSchema(universalEvaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  moderatedBy: true,
  moderatedAt: true,
  moderationNotes: true,
}).extend({
  overallRating: z.number().min(1).max(5),
  evaluatorEmail: z.string().email().optional(),
  evaluatorAge: z.number().min(13).max(120).optional(),
});

export const insertEvaluationCriteriaAssignmentSchema = createInsertSchema(evaluationCriteriaAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUniversalEvaluationResponseSchema = createInsertSchema(universalEvaluationResponses).omit({
  id: true,
  createdAt: true,
});

// Tipos TypeScript para sistema unificado
export type UniversalEvaluation = typeof universalEvaluations.$inferSelect;
export type InsertUniversalEvaluation = z.infer<typeof insertUniversalEvaluationSchema>;
export type UniversalEvaluationResponse = typeof universalEvaluationResponses.$inferSelect;
export type InsertUniversalEvaluationResponse = z.infer<typeof insertUniversalEvaluationResponseSchema>;
export type EvaluationCriteriaAssignment = typeof evaluationCriteriaAssignments.$inferSelect;
export type InsertEvaluationCriteriaAssignment = z.infer<typeof insertEvaluationCriteriaAssignmentSchema>;
export type ConsolidatedEvaluation = typeof consolidatedEvaluationsView.$inferSelect;

// ===== SISTEMA DE RETROALIMENTACIÓN =====

// Enum para tipos de formulario
export const formTypeEnum = pgEnum("form_type", ["share", "report_problem", "suggest_improvement", "propose_event"]);

// Tabla para retroalimentación de acciones de parques
export const parkFeedback = pgTable("park_feedback", {
  id: serial("id").primaryKey(),
  parkId: integer("park_id").notNull().references(() => parks.id),
  formType: formTypeEnum("form_type").notNull(),
  // Datos del usuario
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  // Contenido de la retroalimentación
  subject: varchar("subject", { length: 500 }),
  message: text("message").notNull(),
  // Campos específicos para cada tipo de formulario
  category: varchar("category", { length: 100 }), // Para reportes y sugerencias
  priority: varchar("priority", { length: 20 }), // Para reportes: low, medium, high, urgent
  eventType: varchar("event_type", { length: 100 }), // Para propuestas de eventos
  suggestedDate: date("suggested_date"), // Para propuestas de eventos
  expectedAttendance: integer("expected_attendance"), // Para propuestas de eventos
  socialMedia: varchar("social_media", { length: 255 }), // Para compartir
  // Metadatos
  status: varchar("status", { length: 50 }).default("pending"), // pending, reviewed, in_progress, resolved, closed
  tags: json("tags").$type<string[]>().default([]),
  adminNotes: text("admin_notes"),
  assignedTo: integer("assigned_to").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  // Auditoría
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relaciones para retroalimentación de parques
export const parkFeedbackRelations = relations(parkFeedback, ({ one }) => ({
  park: one(parks, { fields: [parkFeedback.parkId], references: [parks.id] }),
  assignedUser: one(users, { fields: [parkFeedback.assignedTo], references: [users.id] }),
}));

// Esquemas de validación para retroalimentación
export const insertParkFeedbackSchema = createInsertSchema(parkFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos TypeScript para retroalimentación
export type ParkFeedback = typeof parkFeedback.$inferSelect;
export type InsertParkFeedback = z.infer<typeof insertParkFeedbackSchema>;

// ===== SISTEMA DE PAGOS CON STRIPE =====

// Enum para tipos de servicios que se pueden pagar
export const paymentServiceTypeEnum = pgEnum("payment_service_type", [
  "activity",
  "event", 
  "space_reservation",
  "concession_fee",
  "sponsorship",
  "permit",
  "maintenance_service",
  "other"
]);

// Enum para estado de pagos Stripe
export const stripePaymentStatusEnum = pgEnum("stripe_payment_status", [
  "pending",
  "processing", 
  "succeeded",
  "failed",
  "canceled",
  "refunded",
  "partially_refunded"
]);

// Tabla principal de pagos
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  
  // Información de Stripe
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }).unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  
  // Información del servicio
  serviceType: paymentServiceTypeEnum("service_type").notNull(),
  serviceId: integer("service_id").notNull(), // ID del servicio (actividad, evento, etc.)
  serviceName: varchar("service_name", { length: 255 }).notNull(),
  serviceDescription: text("service_description"),
  
  // Información del cliente
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }),
  
  // Información financiera
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Monto en pesos mexicanos
  currency: varchar("currency", { length: 3 }).default("mxn"),
  applicationFeeAmount: decimal("application_fee_amount", { precision: 10, scale: 2 }).default("0.00"),
  
  // Estado y fechas
  status: stripePaymentStatusEnum("status").default("pending"),
  paidAt: timestamp("paid_at"),
  failedAt: timestamp("failed_at"),
  canceledAt: timestamp("canceled_at"),
  refundedAt: timestamp("refunded_at"),
  
  // Información adicional
  paymentMethod: varchar("payment_method", { length: 50 }), // card, oxxo, spei, etc.
  receiptEmail: varchar("receipt_email", { length: 255 }),
  
  // Metadatos
  metadata: jsonb("metadata").default({}), // Información adicional del servicio
  notes: text("notes"),
  
  // Error handling
  errorMessage: text("error_message"),
  lastErrorAt: timestamp("last_error_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de reembolsos
export const paymentRefunds = pgTable("payment_refunds", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").notNull().references(() => payments.id),
  
  // Información de Stripe
  stripeRefundId: varchar("stripe_refund_id", { length: 255 }).unique(),
  
  // Información del reembolso
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 100 }), // duplicate, fraudulent, requested_by_customer
  description: text("description"),
  
  // Estado
  status: varchar("status", { length: 50 }).default("pending"), // pending, succeeded, failed, canceled
  
  // Información administrativa
  requestedBy: integer("requested_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de métodos de pago guardados (para clientes recurrentes)
export const savedPaymentMethods = pgTable("saved_payment_methods", {
  id: serial("id").primaryKey(),
  
  // Información de Stripe
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  stripePaymentMethodId: varchar("stripe_payment_method_id", { length: 255 }).notNull(),
  
  // Información del cliente
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  
  // Información de la tarjeta
  cardBrand: varchar("card_brand", { length: 50 }), // visa, mastercard, amex
  cardLast4: varchar("card_last_4", { length: 4 }),
  cardExpMonth: integer("card_exp_month"),
  cardExpYear: integer("card_exp_year"),
  
  // Estado
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de configuración de precios por servicio
export const servicePaymentConfigs = pgTable("service_payment_configs", {
  id: serial("id").primaryKey(),
  
  // Configuración del servicio
  serviceType: paymentServiceTypeEnum("service_type").notNull(),
  serviceId: integer("service_id").notNull(), // ID del servicio específico
  
  // Configuración de precios
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("mxn"),
  
  // Descuentos y promociones
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0.00"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  discountValidUntil: timestamp("discount_valid_until"),
  
  // Configuración de Stripe
  stripeProductId: varchar("stripe_product_id", { length: 255 }),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  
  // Configuración de pagos
  allowInstallments: boolean("allow_installments").default(false),
  maxInstallments: integer("max_installments").default(1),
  requiresDeposit: boolean("requires_deposit").default(false),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }).default("0.00"),
  
  // Estado
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de transacciones webhook de Stripe
export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: serial("id").primaryKey(),
  
  // Información del webhook
  stripeEventId: varchar("stripe_event_id", { length: 255 }).unique().notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  
  // Datos del evento
  eventData: jsonb("event_data").notNull(),
  
  // Estado de procesamiento
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  
  // Información relacionada
  relatedPaymentId: integer("related_payment_id").references(() => payments.id),
  
  createdAt: timestamp("created_at").defaultNow()
});

// Schemas de validación para pagos
export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => String(val))
});

export const insertPaymentRefundSchema = createInsertSchema(paymentRefunds).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => String(val))
});

export const insertSavedPaymentMethodSchema = createInsertSchema(savedPaymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertServicePaymentConfigSchema = createInsertSchema(servicePaymentConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  basePrice: z.union([z.string(), z.number()]).transform(val => String(val)),
  discountPercentage: z.union([z.string(), z.number()]).transform(val => String(val)),
  discountAmount: z.union([z.string(), z.number()]).transform(val => String(val)),
  depositAmount: z.union([z.string(), z.number()]).transform(val => String(val))
});

export const insertStripeWebhookEventSchema = createInsertSchema(stripeWebhookEvents).omit({
  id: true,
  createdAt: true
});

// Tipos TypeScript para pagos
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type PaymentRefund = typeof paymentRefunds.$inferSelect;
export type InsertPaymentRefund = z.infer<typeof insertPaymentRefundSchema>;

export type SavedPaymentMethod = typeof savedPaymentMethods.$inferSelect;
export type InsertSavedPaymentMethod = z.infer<typeof insertSavedPaymentMethodSchema>;

export type ServicePaymentConfig = typeof servicePaymentConfigs.$inferSelect;
export type InsertServicePaymentConfig = z.infer<typeof insertServicePaymentConfigSchema>;

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type InsertStripeWebhookEvent = z.infer<typeof insertStripeWebhookEventSchema>;

// ===== SISTEMA DE AUDITORÍA DE ROLES =====

export const roleAuditLogs = pgTable("role_audit_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  action: varchar("action", { length: 100 }).notNull(), // role_change, permission_granted, permission_revoked, login_attempt, bulk_assignment, matrix_update
  userId: integer("user_id"), // Usuario afectado
  username: varchar("username", { length: 255 }),
  fromRoleId: varchar("from_role_id", { length: 50 }),
  toRoleId: varchar("to_role_id", { length: 50 }),
  permission: varchar("permission", { length: 100 }),
  module: varchar("module", { length: 100 }).notNull(),
  performedBy: varchar("performed_by", { length: 255 }).notNull(),
  performedById: integer("performed_by_id"),
  description: text("description").notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"), // low, medium, high
  ipAddress: varchar("ip_address", { length: 45 }),
  result: varchar("result", { length: 50 }), // success, failed, etc.
  affectedUsers: integer("affected_users"), // Para bulk operations
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type RoleAuditLog = typeof roleAuditLogs.$inferSelect;
export type InsertRoleAuditLog = typeof roleAuditLogs.$inferInsert;

export const insertRoleAuditLogSchema = createInsertSchema(roleAuditLogs).omit({
  id: true,
  timestamp: true,
  createdAt: true
});

// ========== MÓDULO DE ÓRDENES DE TRABAJO ==========

// Tabla principal de órdenes de trabajo
export const workOrders = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  folio: varchar("folio", { length: 50 }).notNull().unique(), // Auto-generado: OT-2025-0001
  
  // CLASIFICACIÓN
  tipo: varchar("tipo", { length: 50 }).notNull(), // correctivo, preventivo, mejora, emergencia
  prioridad: varchar("prioridad", { length: 20 }).notNull().default("normal"), // baja, normal, alta, crítica
  estado: varchar("estado", { length: 30 }).notNull().default("pendiente"), // pendiente, asignada, en_proceso, pausada, completada, cancelada
  
  // ORIGEN
  origenTipo: varchar("origen_tipo", { length: 50 }), // incidencia, mantenimiento_preventivo, solicitud_directa
  incidenciaId: integer("incidencia_id").references(() => incidents.id),
  activoId: integer("activo_id").references(() => assets.id),
  parkId: integer("park_id").notNull().references(() => parks.id),
  
  // DESCRIPCIÓN
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descripcionTrabajo: text("descripcion_trabajo").notNull(),
  instruccionesEspeciales: text("instrucciones_especiales"),
  
  // ASIGNACIÓN
  asignadoAId: integer("asignado_a_id").references(() => employees.id),
  asignadoANombre: varchar("asignado_a_nombre", { length: 200 }), // Nombre de cuadrilla o equipo
  departamento: varchar("departamento", { length: 100 }),
  supervisorId: integer("supervisor_id").references(() => employees.id),
  
  // PLANIFICACIÓN
  fechaSolicitud: timestamp("fecha_solicitud").notNull().defaultNow(),
  fechaProgramada: timestamp("fecha_programada"),
  fechaInicio: timestamp("fecha_inicio"),
  fechaCompletada: timestamp("fecha_completada"),
  horasEstimadas: decimal("horas_estimadas", { precision: 6, scale: 2 }),
  horasReales: decimal("horas_reales", { precision: 6, scale: 2 }),
  
  // COSTOS
  costoManoObra: decimal("costo_mano_obra", { precision: 10, scale: 2 }).default("0"),
  costoMateriales: decimal("costo_materiales", { precision: 10, scale: 2 }).default("0"),
  costoTotal: decimal("costo_total", { precision: 10, scale: 2 }).default("0"),
  presupuestoAsignado: decimal("presupuesto_asignado", { precision: 10, scale: 2 }),
  
  // CIERRE
  trabajoRealizado: text("trabajo_realizado"),
  observaciones: text("observaciones"),
  validadoPor: integer("validado_por").references(() => users.id),
  fechaValidacion: timestamp("fecha_validacion"),
  calificacion: integer("calificacion"), // 1-5 estrellas
  
  // CANCELACIÓN
  motivoCancelacion: text("motivo_cancelacion"),
  canceladoPor: integer("cancelado_por").references(() => users.id),
  fechaCancelacion: timestamp("fecha_cancelacion"),
  
  // METADATOS
  creadoPor: integer("creado_por").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Materiales consumidos en la orden de trabajo
export const workOrderMaterials = pgTable("work_order_materials", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItems.id),
  nombreMaterial: varchar("nombre_material", { length: 255 }).notNull(),
  cantidad: decimal("cantidad", { precision: 10, scale: 2 }).notNull(),
  unidad: varchar("unidad", { length: 50 }).notNull(),
  costoUnitario: decimal("costo_unitario", { precision: 10, scale: 2 }),
  costoTotal: decimal("costo_total", { precision: 10, scale: 2 }),
  estado: varchar("estado", { length: 30 }).default("solicitado"), // solicitado, reservado, consumido
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Checklist de tareas de la orden de trabajo
export const workOrderChecklist = pgTable("work_order_checklist", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  descripcion: text("descripcion").notNull(),
  esObligatorio: boolean("es_obligatorio").default(false),
  completado: boolean("completado").default(false),
  completadoPor: integer("completado_por").references(() => users.id),
  fechaCompletado: timestamp("fecha_completado"),
  ordenIndex: integer("orden_index").default(0),
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Archivos adjuntos (evidencias: fotos antes/después, documentos)
export const workOrderAttachments = pgTable("work_order_attachments", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 50 }).notNull(), // foto_antes, foto_despues, documento, otro
  nombreArchivo: varchar("nombre_archivo", { length: 255 }).notNull(),
  urlArchivo: text("url_archivo").notNull(),
  descripcion: text("descripcion"),
  subidoPor: integer("subido_por").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Historial de cambios de estado
export const workOrderHistory = pgTable("work_order_history", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  campoModificado: varchar("campo_modificado", { length: 100 }), // estado, asignado_a, prioridad, etc.
  valorAnterior: text("valor_anterior"),
  valorNuevo: text("valor_nuevo"),
  accion: varchar("accion", { length: 50 }).notNull(), // creada, asignada, iniciada, pausada, completada, cancelada
  comentario: text("comentario"),
  realizadoPor: integer("realizado_por").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schemas de validación para órdenes de trabajo
export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  folio: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkOrderMaterialSchema = createInsertSchema(workOrderMaterials).omit({
  id: true,
  createdAt: true,
});

export const insertWorkOrderChecklistSchema = createInsertSchema(workOrderChecklist).omit({
  id: true,
  createdAt: true,
});

export const insertWorkOrderAttachmentSchema = createInsertSchema(workOrderAttachments).omit({
  id: true,
  createdAt: true,
});

export const insertWorkOrderHistorySchema = createInsertSchema(workOrderHistory).omit({
  id: true,
  createdAt: true,
});

// Tipos TypeScript para órdenes de trabajo
export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;

export type WorkOrderMaterial = typeof workOrderMaterials.$inferSelect;
export type InsertWorkOrderMaterial = z.infer<typeof insertWorkOrderMaterialSchema>;

export type WorkOrderChecklist = typeof workOrderChecklist.$inferSelect;
export type InsertWorkOrderChecklist = z.infer<typeof insertWorkOrderChecklistSchema>;

export type WorkOrderAttachment = typeof workOrderAttachments.$inferSelect;
export type InsertWorkOrderAttachment = z.infer<typeof insertWorkOrderAttachmentSchema>;

export type WorkOrderHistory = typeof workOrderHistory.$inferSelect;
export type InsertWorkOrderHistory = z.infer<typeof insertWorkOrderHistorySchema>;

// ===== SISTEMA ROBUSTO DE PERMISOS =====

// Tabla de módulos del sistema
export const permissionModules = pgTable("permission_modules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de submódulos
export const permissionSubmodules = pgTable("permission_submodules", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => permissionModules.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de páginas/componentes
export const permissionPages = pgTable("permission_pages", {
  id: serial("id").primaryKey(),
  submoduleId: integer("submodule_id").references(() => permissionSubmodules.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull(),
  route: varchar("route", { length: 200 }),
  description: text("description"),
  component: varchar("component", { length: 100 }),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de acciones estándar
export const permissionActions = pgTable("permission_actions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Tabla de permisos jerárquicos
export const systemPermissions = pgTable("system_permissions", {
  id: serial("id").primaryKey(),
  permissionKey: varchar("permission_key", { length: 200 }).notNull().unique(), // formato: modulo:submodulo:pagina:accion
  moduleId: integer("module_id").references(() => permissionModules.id), // nullable para wildcard 'all'
  submoduleId: integer("submodule_id").references(() => permissionSubmodules.id),
  pageId: integer("page_id").references(() => permissionPages.id),
  actionId: integer("action_id").references(() => permissionActions.id), // nullable para wildcard 'all'
  description: text("description"),
  isWildcard: boolean("is_wildcard").default(false), // para permisos como modulo:*:*:*
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabla de relación roles-permisos
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  permissionId: integer("permission_id").references(() => systemPermissions.id).notNull(),
  grantedBy: integer("granted_by").references(() => users.id),
  revokedBy: integer("revoked_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
  isActive: boolean("is_active").default(true)
});

// Relaciones para sistema de permisos
export const permissionModulesRelations = relations(permissionModules, ({ many }) => ({
  submodules: many(permissionSubmodules)
}));

export const permissionSubmodulesRelations = relations(permissionSubmodules, ({ one, many }) => ({
  module: one(permissionModules, {
    fields: [permissionSubmodules.moduleId],
    references: [permissionModules.id]
  }),
  pages: many(permissionPages)
}));

export const permissionPagesRelations = relations(permissionPages, ({ one }) => ({
  submodule: one(permissionSubmodules, {
    fields: [permissionPages.submoduleId],
    references: [permissionSubmodules.id]
  })
}));

export const systemPermissionsRelations = relations(systemPermissions, ({ one, many }) => ({
  module: one(permissionModules, {
    fields: [systemPermissions.moduleId],
    references: [permissionModules.id]
  }),
  submodule: one(permissionSubmodules, {
    fields: [systemPermissions.submoduleId],
    references: [permissionSubmodules.id]
  }),
  page: one(permissionPages, {
    fields: [systemPermissions.pageId],
    references: [permissionPages.id]
  }),
  action: one(permissionActions, {
    fields: [systemPermissions.actionId],
    references: [permissionActions.id]
  }),
  rolePermissions: many(rolePermissions)
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id]
  }),
  permission: one(systemPermissions, {
    fields: [rolePermissions.permissionId],
    references: [systemPermissions.id]
  }),
  grantedByUser: one(users, {
    fields: [rolePermissions.grantedBy],
    references: [users.id]
  }),
  revokedByUser: one(users, {
    fields: [rolePermissions.revokedBy],
    references: [users.id]
  })
}));

// Schemas de validación para sistema de permisos
export const insertPermissionModuleSchema = createInsertSchema(permissionModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPermissionSubmoduleSchema = createInsertSchema(permissionSubmodules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPermissionPageSchema = createInsertSchema(permissionPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPermissionActionSchema = createInsertSchema(permissionActions).omit({
  id: true,
  createdAt: true
});

export const insertSystemPermissionSchema = createInsertSchema(systemPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  grantedAt: true
});

// Tipos TypeScript para sistema de permisos
export type PermissionModule = typeof permissionModules.$inferSelect;
export type InsertPermissionModule = z.infer<typeof insertPermissionModuleSchema>;

export type PermissionSubmodule = typeof permissionSubmodules.$inferSelect;
export type InsertPermissionSubmodule = z.infer<typeof insertPermissionSubmoduleSchema>;

export type PermissionPage = typeof permissionPages.$inferSelect;
export type InsertPermissionPage = z.infer<typeof insertPermissionPageSchema>;

export type PermissionAction = typeof permissionActions.$inferSelect;
export type InsertPermissionAction = z.infer<typeof insertPermissionActionSchema>;

export type SystemPermission = typeof systemPermissions.$inferSelect;
export type InsertSystemPermission = z.infer<typeof insertSystemPermissionSchema>;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;



