CREATE TYPE "public"."activity_status" AS ENUM('activa', 'programada', 'cancelada', 'finalizada', 'en_pausa');--> statement-breakpoint
CREATE TYPE "public"."benefits_categories" AS ENUM('Visibilidad', 'Acceso', 'Branding', 'Otro');--> statement-breakpoint
CREATE TYPE "public"."bonus_frequency" AS ENUM('once', 'monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."bonus_type" AS ENUM('bonus', 'penalty');--> statement-breakpoint
CREATE TYPE "public"."change_type" AS ENUM('creation', 'acquisition', 'updated', 'maintenance', 'retirement', 'status_changed', 'location_changed', 'assigned');--> statement-breakpoint
CREATE TYPE "public"."charge_type" AS ENUM('fixed', 'percentage', 'per_unit', 'per_m2', 'minimum_guarantee');--> statement-breakpoint
CREATE TYPE "public"."conservation_status" AS ENUM('estable', 'vulnerable', 'en_peligro', 'en_peligro_critico', 'extinto_local');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('activo', 'vencido', 'en_negociacion', 'en_revision');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('paquete', 'activo', 'evento', 'otro');--> statement-breakpoint
CREATE TYPE "public"."evaluation_entity_type" AS ENUM('park', 'instructor', 'volunteer', 'activity', 'concessionaire', 'event');--> statement-breakpoint
CREATE TYPE "public"."evaluation_status" AS ENUM('draft', 'completed', 'pending_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."fauna_category" AS ENUM('aves', 'mamiferos', 'insectos', 'vida_acuatica');--> statement-breakpoint
CREATE TYPE "public"."form_type" AS ENUM('share', 'report_problem', 'suggest_improvement', 'propose_event');--> statement-breakpoint
CREATE TYPE "public"."impact_level" AS ENUM('bajo', 'medio', 'alto', 'muy_alto');--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_type" AS ENUM('entrada_compra', 'entrada_donacion', 'entrada_transferencia', 'entrada_devolucion', 'salida_consumo', 'salida_transferencia', 'salida_merma', 'salida_robo', 'ajuste_positivo', 'ajuste_negativo', 'conteo_fisico');--> statement-breakpoint
CREATE TYPE "public"."payment_frequency" AS ENUM('monthly', 'quarterly', 'biannual', 'annual');--> statement-breakpoint
CREATE TYPE "public"."payment_service_type" AS ENUM('activity', 'event', 'space_reservation', 'concession_fee', 'sponsorship', 'permit', 'maintenance_service', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'overdue', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('monthly', 'quarterly', 'biannual', 'annual', 'one_time', 'variable');--> statement-breakpoint
CREATE TYPE "public"."payroll_receipt_status" AS ENUM('draft', 'generated', 'sent', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."request_type" AS ENUM('vacation', 'permission', 'sick_leave', 'maternity_leave', 'paternity_leave', 'personal_leave', 'bereavement', 'study_leave', 'unpaid_leave');--> statement-breakpoint
CREATE TYPE "public"."requisition_status" AS ENUM('draft', 'submitted', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."sanction_status" AS ENUM('pending', 'resolved', 'appealed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."stripe_payment_status" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."time_record_type" AS ENUM('check_in', 'check_out', 'break_start', 'break_end', 'overtime_start', 'overtime_end');--> statement-breakpoint
CREATE TABLE "active_concession_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"concession_id" integer NOT NULL,
	"document_url" varchar(500) NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"expiration_date" date,
	"is_required" boolean DEFAULT false,
	"uploaded_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "active_concession_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"concession_id" integer NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"title" varchar(255),
	"description" text,
	"image_type" varchar(50) DEFAULT 'general',
	"is_primary" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"uploaded_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "active_concessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"concession_type_id" integer NOT NULL,
	"concessionaire_id" integer NOT NULL,
	"park_id" integer NOT NULL,
	"specific_location" text NOT NULL,
	"coordinates" varchar(100),
	"area" numeric(10, 2),
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"operating_hours" varchar(255),
	"operating_days" varchar(100),
	"status" varchar(50) DEFAULT 'activa' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal',
	"specific_terms" text,
	"special_requirements" text,
	"contract_number" varchar(100),
	"contract_file" varchar(500),
	"permit_file" varchar(500),
	"insurance_file" varchar(500),
	"monthly_payment" numeric(10, 2),
	"revenue_percentage" numeric(5, 2),
	"deposit" numeric(10, 2),
	"emergency_contact" varchar(255),
	"emergency_phone" varchar(50),
	"notes" text,
	"internal_notes" text,
	"created_by" integer,
	"last_modified_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"category" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"location" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"category_id" integer,
	"instructor_id" integer,
	"start_time" text,
	"end_time" text,
	"duration" integer,
	"capacity" integer,
	"materials" text,
	"required_staff" integer,
	"is_recurring" boolean DEFAULT false,
	"is_free" boolean DEFAULT true,
	"is_price_random" boolean DEFAULT false,
	"price" numeric(10, 2),
	"discount_seniors" numeric(5, 2) DEFAULT '0.00',
	"discount_students" numeric(5, 2) DEFAULT '0.00',
	"discount_families" numeric(5, 2) DEFAULT '0.00',
	"discount_disability" numeric(5, 2) DEFAULT '0.00',
	"discount_early_bird" numeric(5, 2) DEFAULT '0.00',
	"discount_early_bird_deadline" timestamp,
	"requirements" text,
	"recurring_days" text[],
	"target_market" jsonb,
	"special_needs" jsonb,
	"registration_enabled" boolean DEFAULT false,
	"registration_deadline" timestamp,
	"max_registrations" integer,
	"requires_approval" boolean DEFAULT false,
	"registration_instructions" text,
	"age_restrictions" text,
	"health_requirements" text,
	"status" "activity_status" DEFAULT 'programada',
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "activity_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#00a587',
	"icon" varchar(50) DEFAULT 'calendar',
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"mime_type" text NOT NULL,
	"caption" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"uploaded_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_registration_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"registration_id" integer NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"previous_status" varchar(20),
	"new_status" varchar(20),
	"change_reason" text,
	"changed_by_id" integer,
	"change_details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"phone" varchar(20),
	"date_of_birth" date,
	"age" integer,
	"emergency_contact" varchar(100),
	"emergency_phone" varchar(20),
	"medical_conditions" text,
	"allergies" text,
	"medications_currently" text,
	"status" varchar(20) DEFAULT 'pending',
	"approved_by_id" integer,
	"approved_at" timestamp,
	"rejection_reason" text,
	"special_requests" text,
	"experience_level" varchar(20),
	"has_participated_before" boolean DEFAULT false,
	"payment_status" varchar(20) DEFAULT 'pending',
	"payment_reference" varchar(100),
	"stripe_payment_intent_id" varchar(100),
	"stripe_customer_id" varchar(100),
	"stripe_session_id" varchar(100),
	"paid_amount" numeric(10, 2),
	"payment_date" timestamp,
	"applied_discount_type" varchar(50),
	"applied_discount_percentage" integer,
	"original_amount" numeric(10, 2),
	"discount_amount" numeric(10, 2),
	"accepts_terms" boolean DEFAULT false,
	"accepts_photos" boolean DEFAULT false,
	"parental_consent" boolean DEFAULT false,
	"parent_name" varchar(100),
	"parent_phone" varchar(20),
	"registration_source" varchar(50) DEFAULT 'web',
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actual_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"category_id" integer,
	"concept" varchar(200) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"date" date NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"supplier" varchar(200),
	"description" text,
	"reference_number" varchar(50),
	"is_paid" boolean DEFAULT false,
	"payroll_period_id" integer,
	"is_payroll_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "actual_incomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"category_id" integer,
	"concept" varchar(200) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"date" date NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"description" text,
	"reference_number" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"category" text NOT NULL,
	"icon_type" text DEFAULT 'system' NOT NULL,
	"custom_icon_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"instructor_id" integer,
	"activity_id" integer,
	"assignment_date" date NOT NULL,
	"return_date" date,
	"purpose" text,
	"condition" text DEFAULT 'good' NOT NULL,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "asset_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"mime_type" text NOT NULL,
	"caption" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"uploaded_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_maintenances" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"maintenance_type" text NOT NULL,
	"description" text NOT NULL,
	"date" date,
	"performed_by" text,
	"performer_id" integer,
	"cost" numeric(10, 2),
	"findings" text,
	"actions" text,
	"next_maintenance_date" date,
	"photos" text[],
	"status" text DEFAULT 'completed' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"serial_number" text,
	"category_id" integer NOT NULL,
	"subcategory_id" integer,
	"custom_asset_id" text,
	"description" text,
	"park_id" integer NOT NULL,
	"amenity_id" integer,
	"location_description" text,
	"latitude" text,
	"longitude" text,
	"manufacturer" text,
	"model" text,
	"serial_number_tech" text,
	"material" text,
	"dimensions_capacity" text,
	"installation_date" date,
	"last_inspection_date" date,
	"estimated_useful_life" integer,
	"status" text DEFAULT 'activo' NOT NULL,
	"maintenance_history" text[],
	"acquisition_cost" numeric(10, 2),
	"current_value" numeric(10, 2),
	"financing_source" text,
	"responsible_person_id" integer,
	"assigned_area" text,
	"maintenance_manual_url" text,
	"usage_policies" text,
	"acquisition_date" date,
	"condition" text DEFAULT 'good' NOT NULL,
	"maintenance_frequency" text,
	"last_maintenance_date" date,
	"next_maintenance_date" date,
	"expected_lifespan" integer,
	"notes" text,
	"qr_code" text,
	"photos" text[],
	"documents" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"municipality_id" integer,
	"park_id" integer,
	"year" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'draft',
	"total_income" numeric(15, 2) DEFAULT '0',
	"total_expenses" numeric(15, 2) DEFAULT '0',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"rating" integer,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concession_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"concessionaire_id" integer NOT NULL,
	"concession_type_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"fee" numeric(10, 2) NOT NULL,
	"exclusivity_clauses" text,
	"restrictions" text,
	"contract_file_url" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"has_extension" boolean DEFAULT false,
	"extension_date" date,
	"notes" text,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concession_evaluation_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"items" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concession_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"evaluation_date" date NOT NULL,
	"evaluator_id" integer,
	"sanitary_rating" integer,
	"operational_rating" integer,
	"technical_rating" integer,
	"compliance_rating" integer,
	"customer_satisfaction_rating" integer,
	"overall_rating" numeric(3, 1),
	"findings" text,
	"recommendations" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" date,
	"status" "evaluation_status" DEFAULT 'draft',
	"attachments" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concession_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"zone_name" varchar(100),
	"subzone_name" varchar(100),
	"coordinates" text,
	"area_sqm" numeric(10, 2) NOT NULL,
	"map_reference" text,
	"location_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concession_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"payment_date" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_type" "payment_type" NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"invoice_number" varchar(100),
	"invoice_url" text,
	"notes" text,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concession_sanctions" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"evaluation_id" integer,
	"sanction_date" date NOT NULL,
	"sanction_type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2),
	"resolution_status" "sanction_status" DEFAULT 'pending',
	"resolution_date" date,
	"resolution_notes" text,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concession_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"technical_requirements" text,
	"legal_requirements" text,
	"operating_rules" text,
	"impact_level" "impact_level" DEFAULT 'bajo' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concessionaire_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"concessionaire_profile_id" integer NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_name" varchar(200) NOT NULL,
	"document_url" varchar(255) NOT NULL,
	"upload_date" timestamp DEFAULT now() NOT NULL,
	"expiry_date" date,
	"is_verified" boolean DEFAULT false,
	"verification_date" timestamp,
	"verified_by_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concessionaire_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"rfc" varchar(20) NOT NULL,
	"business_name" varchar(200),
	"contact_person" varchar(200),
	"email" varchar(255),
	"phone" varchar(20),
	"tax_address" text NOT NULL,
	"legal_representative" varchar(200),
	"registration_date" date DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'activo' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "concessionaire_profiles_rfc_unique" UNIQUE("rfc")
);
--> statement-breakpoint
CREATE TABLE "concessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"concession_type_id" integer NOT NULL,
	"vendor_name" varchar(100) NOT NULL,
	"vendor_contact" varchar(100),
	"vendor_email" varchar(100),
	"vendor_phone" varchar(20),
	"start_date" date NOT NULL,
	"end_date" date,
	"status" varchar(20) DEFAULT 'activa' NOT NULL,
	"location" text,
	"notes" text,
	"contract_file" varchar(255),
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consolidated_evaluations_view" (
	"id" serial PRIMARY KEY NOT NULL,
	"evaluation_type" varchar(20) NOT NULL,
	"original_evaluation_id" integer NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"entity_id" integer NOT NULL,
	"entity_name" varchar(255) NOT NULL,
	"evaluator_name" varchar(255) NOT NULL,
	"evaluator_email" varchar(255),
	"overall_rating" integer NOT NULL,
	"comments" text,
	"status" varchar(20) NOT NULL,
	"experience_date" date,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consumable_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"color" varchar(20),
	"parent_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "consumable_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "consumables" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category_id" integer NOT NULL,
	"brand" varchar(100),
	"model" varchar(100),
	"unit_of_measure" varchar(20) NOT NULL,
	"presentation" varchar(100),
	"minimum_stock" integer DEFAULT 0,
	"maximum_stock" integer,
	"reorder_point" integer,
	"unit_cost" numeric(10, 2),
	"last_purchase_price" numeric(10, 2),
	"preferred_supplier_id" integer,
	"supplier_code" varchar(50),
	"requires_expiration" boolean DEFAULT false,
	"perishable" boolean DEFAULT false,
	"hazardous" boolean DEFAULT false,
	"storage_requirements" text,
	"tags" text[],
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "consumables_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "contract_authorized_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"service_name" varchar(100) NOT NULL,
	"service_description" text,
	"service_category" varchar(50),
	"can_charge_public" boolean DEFAULT true,
	"max_public_rate" numeric(10, 2),
	"rate_description" text,
	"restrictions" text,
	"required_permits" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_bonuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"bonus_type" "bonus_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"frequency" "bonus_frequency" NOT NULL,
	"conditions" text,
	"evaluation_criteria" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_charges" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_config_id" integer NOT NULL,
	"charge_type" charge_type NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"fixed_amount" numeric(10, 2),
	"percentage" numeric(5, 2),
	"per_unit_amount" numeric(10, 2),
	"per_m2_amount" numeric(10, 2),
	"frequency" "payment_frequency" NOT NULL,
	"unit_type" varchar(50),
	"space_m2" numeric(8, 2),
	"is_active" boolean DEFAULT true,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_income_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"report_month" integer NOT NULL,
	"report_year" integer NOT NULL,
	"gross_income" numeric(12, 2) NOT NULL,
	"net_income" numeric(12, 2),
	"service_breakdown" jsonb,
	"units_sold" jsonb,
	"supporting_documents" jsonb,
	"notes" text,
	"is_verified" boolean DEFAULT false,
	"verified_by" integer,
	"verified_at" timestamp,
	"status" varchar(20) DEFAULT 'submitted',
	"submitted_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_investments" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"description" text NOT NULL,
	"estimated_value" numeric(12, 2) NOT NULL,
	"actual_value" numeric(12, 2),
	"deadline_date" date NOT NULL,
	"completed_date" date,
	"is_amortizable" boolean DEFAULT false,
	"amortization_months" integer,
	"monthly_amortization" numeric(10, 2),
	"status" varchar(20) DEFAULT 'pending',
	"documentation" text,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_monthly_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"income_report_id" integer,
	"payment_month" integer NOT NULL,
	"payment_year" integer NOT NULL,
	"fixed_amount" numeric(10, 2) DEFAULT '0.00',
	"percentage_amount" numeric(10, 2) DEFAULT '0.00',
	"per_unit_amount" numeric(10, 2) DEFAULT '0.00',
	"space_amount" numeric(10, 2) DEFAULT '0.00',
	"subtotal" numeric(10, 2) NOT NULL,
	"minimum_guarantee_applied" boolean DEFAULT false,
	"minimum_guarantee_adjustment" numeric(10, 2) DEFAULT '0.00',
	"bonus_amount" numeric(10, 2) DEFAULT '0.00',
	"penalty_amount" numeric(10, 2) DEFAULT '0.00',
	"investment_amortization" numeric(10, 2) DEFAULT '0.00',
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_status" varchar(20) DEFAULT 'pending',
	"paid_amount" numeric(10, 2) DEFAULT '0.00',
	"paid_date" date,
	"calculation_details" jsonb,
	"notes" text,
	"calculated_by" integer,
	"calculated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_payment_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"has_fixed_payment" boolean DEFAULT false,
	"has_percentage_payment" boolean DEFAULT false,
	"has_per_unit_payment" boolean DEFAULT false,
	"has_space_payment" boolean DEFAULT false,
	"has_minimum_guarantee" boolean DEFAULT false,
	"minimum_guarantee_amount" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_time_sheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"date" date NOT NULL,
	"check_in_time" timestamp,
	"check_out_time" timestamp,
	"regular_hours" numeric(5, 2) DEFAULT '0.00',
	"overtime_hours" numeric(5, 2) DEFAULT '0.00',
	"break_hours" numeric(5, 2) DEFAULT '0.00',
	"total_hours" numeric(5, 2) DEFAULT '0.00',
	"is_late" boolean DEFAULT false,
	"late_minutes" integer DEFAULT 0,
	"is_early_leave" boolean DEFAULT false,
	"early_leave_minutes" integer DEFAULT 0,
	"is_absent" boolean DEFAULT false,
	"absence_reason" text,
	"late_reason" text,
	"is_justified" boolean DEFAULT false,
	"notes" text,
	"approved_by" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"title" text NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer,
	"description" text,
	"uploaded_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"template_id" integer,
	"target_user_types" json DEFAULT '[]'::json,
	"target_modules" json DEFAULT '[]'::json,
	"status" varchar(50) DEFAULT 'draft',
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"total_recipients" integer DEFAULT 0,
	"successful_sends" integer DEFAULT 0,
	"failed_sends" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"queue_id" integer,
	"campaign_id" integer,
	"recipient" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"status" varchar(50) NOT NULL,
	"provider" varchar(50),
	"message_id" varchar(255),
	"error_message" text,
	"sent_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"to" varchar(255) NOT NULL,
	"cc" varchar(255),
	"bcc" varchar(255),
	"subject" varchar(500) NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"template_id" integer,
	"priority" varchar(20) DEFAULT 'normal',
	"status" varchar(50) DEFAULT 'pending',
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"attempts" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 3,
	"error_message" text,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"template_type" varchar(100) NOT NULL,
	"module_id" varchar(100),
	"variables" json DEFAULT '[]'::json,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"employee_code" varchar(20),
	"full_name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"phone" varchar(20),
	"position" varchar(100),
	"department" varchar(100),
	"salary" numeric(10, 2),
	"hire_date" date,
	"status" varchar(20) DEFAULT 'active',
	"work_schedule" varchar(100),
	"education" text,
	"address" text,
	"emergency_contact" varchar(100),
	"emergency_phone" varchar(20),
	"skills" text[],
	"certifications" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "employees_employee_code_unique" UNIQUE("employee_code")
);
--> statement-breakpoint
CREATE TABLE "evaluation_criteria" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"label" varchar(255) NOT NULL,
	"description" text,
	"field_type" varchar(50) DEFAULT 'rating' NOT NULL,
	"min_value" integer DEFAULT 1,
	"max_value" integer DEFAULT 5,
	"is_required" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"icon" varchar(50),
	"category" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "evaluation_criteria_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"criteria_id" integer NOT NULL,
	"entity_type" "evaluation_entity_type" NOT NULL,
	"is_required" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "evaluation_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"evaluation_id" integer NOT NULL,
	"criteria_id" integer NOT NULL,
	"rating_value" integer,
	"text_value" text,
	"boolean_value" boolean,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#3B82F6',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "event_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "event_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"mime_type" text NOT NULL,
	"caption" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"uploaded_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"event_type" varchar(50) NOT NULL,
	"target_audience" varchar(100),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"featured_image_url" varchar(500),
	"start_date" date NOT NULL,
	"end_date" date,
	"start_time" time,
	"end_time" time,
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" varchar(100),
	"location" varchar(255),
	"capacity" integer,
	"registration_type" varchar(50) DEFAULT 'none',
	"organizer_name" varchar(255),
	"organizer_email" varchar(255),
	"organizer_phone" varchar(20),
	"organizer_organization" varchar(255),
	"geolocation" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by_id" integer,
	"price" numeric(10, 2) DEFAULT '0.00',
	"is_free" boolean DEFAULT true,
	"requires_approval" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"level" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "expense_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "fauna_species" (
	"id" serial PRIMARY KEY NOT NULL,
	"common_name" text NOT NULL,
	"scientific_name" text NOT NULL,
	"family" text,
	"category" "fauna_category" NOT NULL,
	"habitat" text,
	"description" text,
	"behavior" text,
	"diet" text,
	"reproduction_period" text,
	"conservation_status" "conservation_status" DEFAULT 'estable',
	"size_cm" numeric(8, 2),
	"weight_grams" numeric(10, 2),
	"lifespan" integer,
	"is_nocturnal" boolean DEFAULT false,
	"is_migratory" boolean DEFAULT false,
	"is_endangered" boolean DEFAULT false,
	"image_url" text,
	"photo_url" text,
	"photo_caption" text,
	"ecological_importance" text,
	"threats" text,
	"protection_measures" text,
	"observation_tips" text,
	"best_observation_time" text,
	"common_locations" text[] DEFAULT '{}',
	"icon_color" text DEFAULT '#16a085',
	"icon_type" text DEFAULT 'system',
	"custom_icon_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6B7280',
	"icon" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"action_type" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_subcategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"incident_type" text NOT NULL,
	"status" text DEFAULT 'reported',
	"priority" text DEFAULT 'medium',
	"reported_by_id" integer,
	"assigned_to_id" integer,
	"location_details" text,
	"image_urls" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"incidencia_id" text,
	"fecha_reporte" timestamp DEFAULT now(),
	"fecha_ocurrencia" timestamp,
	"tipo_afectacion" text,
	"nivel_riesgo" text,
	"descripcion_detallada" text,
	"fotos_videos_adjuntos" text[] DEFAULT '{}',
	"ubicacion_gps" text,
	"activo_id" integer,
	"departamento_responsable" text,
	"responsable_asignado" text,
	"fecha_asignacion" timestamp,
	"fecha_inicio_atencion" timestamp,
	"fecha_resolucion" timestamp,
	"tiempo_respuesta" integer,
	"acciones_realizadas" text,
	"materiales_utilizados" text,
	"costo_estimado" numeric(10, 2),
	"costo_real" numeric(10, 2),
	"fuente_financiamiento" text,
	"estatus_validacion" text DEFAULT 'pendiente',
	"supervisor_validador" text,
	"comentarios_supervision" text,
	"satisfaccion_usuario" integer,
	"seguimiento_post_resolucion" text,
	"frecuencia_incidente" text,
	"afectacion_usuarios" boolean DEFAULT false,
	"numero_personas_afectadas" integer,
	"afectacion_medioambiental" text,
	"participacion_voluntarios" boolean DEFAULT false,
	"numero_voluntarios" integer,
	"grupo_voluntarios" text,
	"reporte_comunidad" text
);
--> statement-breakpoint
CREATE TABLE "income_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"level" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "income_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "income_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"category_id" integer NOT NULL,
	"subcategory_id" integer,
	"description" text NOT NULL,
	"source" varchar(200),
	"reference_number" varchar(50),
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'MXN',
	"income_date" date NOT NULL,
	"payment_method" varchar(50),
	"bank_account" varchar(50),
	"receipt_number" varchar(50),
	"tax_rate" numeric(5, 2) DEFAULT '0.00',
	"tax_amount" numeric(12, 2) DEFAULT '0.00',
	"net_amount" numeric(12, 2),
	"park_id" integer,
	"project_id" integer,
	"notes" text,
	"attachments" json,
	"status" varchar(20) DEFAULT 'registrado' NOT NULL,
	"verified_by" integer,
	"verified_at" timestamp,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "income_records_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "instructor_application_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT false,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"max_applications" integer,
	"current_applications" integer DEFAULT 0,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "instructor_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"instructor_id" integer NOT NULL,
	"activity_id" integer NOT NULL,
	"park_id" integer NOT NULL,
	"assignment_date" date NOT NULL,
	"status" text DEFAULT 'assigned',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"instructor_id" integer NOT NULL,
	"evaluator_id" integer,
	"evaluator_name" varchar(255),
	"evaluator_email" varchar(255),
	"evaluator_city" varchar(100),
	"evaluator_ip" varchar(45),
	"overall_rating" integer NOT NULL,
	"knowledge_rating" integer NOT NULL,
	"patience_rating" integer NOT NULL,
	"clarity_rating" integer NOT NULL,
	"punctuality_rating" integer NOT NULL,
	"would_recommend" boolean,
	"comments" text,
	"attended_activity" varchar(255),
	"status" varchar(20) DEFAULT 'pending',
	"moderation_notes" text,
	"moderated_by" integer,
	"moderated_at" timestamp,
	"evaluation_date" date DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"invitation_token" varchar(255) NOT NULL,
	"invited_by" integer,
	"invited_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "instructor_invitations_email_unique" UNIQUE("email"),
	CONSTRAINT "instructor_invitations_invitation_token_unique" UNIQUE("invitation_token")
);
--> statement-breakpoint
CREATE TABLE "instructor_recognitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"instructor_id" integer NOT NULL,
	"recognition_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"issued_date" date NOT NULL,
	"issued_by_id" integer NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructors" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"phone" text,
	"age" integer,
	"gender" text,
	"address" text,
	"specialties" text[],
	"certifications" text[],
	"experience_years" integer DEFAULT 0,
	"available_days" text[],
	"available_hours" text,
	"preferred_park_id" integer,
	"status" text DEFAULT 'pending',
	"bio" text,
	"qualifications" text,
	"education" text,
	"profile_image_url" text,
	"curriculum_url" text,
	"hourly_rate" real DEFAULT 0,
	"rating" real DEFAULT 0,
	"activities_count" integer DEFAULT 0,
	"application_campaign_id" integer,
	"application_date" timestamp DEFAULT now(),
	"evaluated_by" integer,
	"evaluated_at" timestamp,
	"evaluation_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"consumable_id" integer NOT NULL,
	"stock_id" integer NOT NULL,
	"movement_type" "inventory_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"origin_type" varchar(50),
	"origin_id" integer,
	"destination_type" varchar(50),
	"destination_id" integer,
	"work_order_id" integer,
	"purchase_order_id" integer,
	"transfer_request_id" integer,
	"description" text NOT NULL,
	"reference" varchar(100),
	"performed_by_id" integer NOT NULL,
	"approved_by_id" integer,
	"batch_number" varchar(50),
	"expiration_date" date,
	"movement_date" timestamp DEFAULT now(),
	"status" varchar(20) DEFAULT 'completed',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"consumable_id" integer NOT NULL,
	"park_id" integer NOT NULL,
	"warehouse_location" varchar(100),
	"quantity" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0,
	"available_quantity" integer DEFAULT 0,
	"batch_number" varchar(50),
	"expiration_date" date,
	"zone" varchar(50),
	"shelf" varchar(50),
	"position" varchar(50),
	"last_count_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "municipalities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state" text NOT NULL,
	"logo_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "park_amenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"amenity_id" integer NOT NULL,
	"description" text,
	"module_name" text,
	"location_latitude" numeric(10, 8),
	"location_longitude" numeric(11, 8),
	"surface_area" numeric(10, 2),
	"status" text DEFAULT 'Activa',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "park_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"evaluator_name" varchar(255) NOT NULL,
	"evaluator_email" varchar(255),
	"evaluator_phone" varchar(20),
	"evaluator_city" varchar(100),
	"evaluator_age" integer,
	"is_frequent_visitor" boolean DEFAULT false,
	"cleanliness" integer NOT NULL,
	"safety" integer NOT NULL,
	"maintenance" integer NOT NULL,
	"accessibility" integer NOT NULL,
	"amenities" integer NOT NULL,
	"activities" integer NOT NULL,
	"staff" integer NOT NULL,
	"natural_beauty" integer NOT NULL,
	"overall_rating" integer NOT NULL,
	"comments" text,
	"suggestions" text,
	"would_recommend" boolean DEFAULT true,
	"visit_date" date,
	"visit_purpose" varchar(100),
	"visit_duration" integer,
	"status" varchar(20) DEFAULT 'pending',
	"moderated_by" integer,
	"moderated_at" timestamp,
	"moderation_notes" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "park_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"form_type" "form_type" NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"subject" varchar(500),
	"message" text NOT NULL,
	"category" varchar(100),
	"priority" varchar(20),
	"event_type" varchar(100),
	"suggested_date" date,
	"expected_attendance" integer,
	"social_media" varchar(255),
	"status" varchar(50) DEFAULT 'pending',
	"tags" json DEFAULT '[]'::json,
	"admin_notes" text,
	"assigned_to" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "park_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"caption" text,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "park_tree_species" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"species_id" integer NOT NULL,
	"recommended_quantity" integer,
	"current_quantity" integer DEFAULT 0,
	"planting_zone" text,
	"notes" text,
	"status" varchar(50) DEFAULT 'planificado',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "park_typology" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"min_area" text,
	"max_area" text,
	"code" varchar(50),
	"normative_reference" varchar(255),
	"country" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "park_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"video_url" text NOT NULL,
	"video_type" text DEFAULT 'file',
	"file_size" integer,
	"mime_type" text,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"municipality_id" integer,
	"municipality_text" text,
	"park_type" text NOT NULL,
	"typology_id" integer,
	"description" text,
	"address" text NOT NULL,
	"postal_code" text,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"area" numeric,
	"green_area" numeric,
	"foundation_year" integer,
	"administrator" text,
	"conservation_status" text,
	"regulation_url" text,
	"opening_hours" text,
	"contact_email" text,
	"contact_phone" text,
	"video_url" text,
	"certificaciones" text,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_refunds" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_id" integer NOT NULL,
	"stripe_refund_id" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"reason" varchar(100),
	"description" text,
	"status" varchar(50) DEFAULT 'pending',
	"requested_by" integer,
	"approved_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_refunds_stripe_refund_id_unique" UNIQUE("stripe_refund_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"stripe_customer_id" varchar(255),
	"service_type" "payment_service_type" NOT NULL,
	"service_id" integer NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"service_description" text,
	"customer_name" varchar(255) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"customer_phone" varchar(50),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'mxn',
	"application_fee_amount" numeric(10, 2) DEFAULT '0.00',
	"status" "stripe_payment_status" DEFAULT 'pending',
	"paid_at" timestamp,
	"failed_at" timestamp,
	"canceled_at" timestamp,
	"refunded_at" timestamp,
	"payment_method" varchar(50),
	"receipt_email" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"error_message" text,
	"last_error_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "payroll_concepts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"is_fixed" boolean DEFAULT false,
	"formula" text,
	"is_active" boolean DEFAULT true,
	"expense_category_id" integer,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payroll_concepts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payroll_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"period_id" integer,
	"payroll_period_id" integer,
	"employee_id" integer,
	"concept_id" integer,
	"amount" numeric(10, 2) NOT NULL,
	"quantity" numeric(8, 2) DEFAULT '1',
	"hours" numeric(8, 2),
	"rate" numeric(10, 2),
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"period" varchar(7) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'draft',
	"processed_at" timestamp,
	"total_amount" numeric(12, 2),
	"employees_count" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_receipt_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_id" integer NOT NULL,
	"concept_id" integer NOT NULL,
	"concept_code" varchar(20) NOT NULL,
	"concept_name" varchar(100) NOT NULL,
	"concept_type" varchar(20) NOT NULL,
	"concept_category" varchar(50) NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1.00',
	"rate" numeric(15, 2),
	"amount" numeric(15, 2) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"period_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"receipt_number" varchar(50) NOT NULL,
	"generated_date" timestamp DEFAULT now(),
	"pay_date" date NOT NULL,
	"employee_name" varchar(200) NOT NULL,
	"employee_position" varchar(100),
	"employee_department" varchar(100),
	"employee_rfc" varchar(20),
	"total_gross" numeric(15, 2) NOT NULL,
	"total_deductions" numeric(15, 2) NOT NULL,
	"total_net" numeric(15, 2) NOT NULL,
	"pdf_file_name" varchar(255),
	"pdf_path" text,
	"pdf_generated" boolean DEFAULT false,
	"status" "payroll_receipt_status" DEFAULT 'draft',
	"notes" text,
	"generated_by_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payroll_receipts_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "pending_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"firebase_uid" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"requested_at" timestamp DEFAULT now(),
	"approved_by" integer,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_role" text DEFAULT 'employee',
	"additional_info" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "pending_users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(200) NOT NULL,
	"business_name" varchar(200),
	"tax_id" varchar(20),
	"contact_person" varchar(100),
	"email" varchar(100),
	"phone" varchar(20),
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"postal_code" varchar(10),
	"country" varchar(50) DEFAULT 'México',
	"provider_type" varchar(50),
	"payment_terms" varchar(100),
	"bank_account" varchar(50),
	"bank" varchar(100),
	"website" varchar(200),
	"notes" text,
	"status" varchar(20) DEFAULT 'activo' NOT NULL,
	"rating" integer DEFAULT 5,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "providers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "requisition_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"requisition_id" integer NOT NULL,
	"consumable_id" integer NOT NULL,
	"requested_quantity" integer NOT NULL,
	"approved_quantity" integer,
	"delivered_quantity" integer DEFAULT 0,
	"estimated_unit_cost" numeric(10, 2),
	"actual_unit_cost" numeric(10, 2),
	"justification" text,
	"notes" text,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "requisitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"requisition_number" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"requested_by_id" integer NOT NULL,
	"department_id" integer,
	"park_id" integer,
	"priority" varchar(20) DEFAULT 'normal',
	"purpose" text NOT NULL,
	"work_order_id" integer,
	"project_id" integer,
	"request_date" timestamp DEFAULT now(),
	"required_date" date,
	"status" "requisition_status" DEFAULT 'draft',
	"reviewed_by_id" integer,
	"approved_by_id" integer,
	"rejection_reason" text,
	"review_date" timestamp,
	"approval_date" timestamp,
	"estimated_total" numeric(12, 2),
	"actual_total" numeric(12, 2),
	"notes" text,
	"attachments" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "requisitions_requisition_number_unique" UNIQUE("requisition_number")
);
--> statement-breakpoint
CREATE TABLE "reservable_spaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"space_type" varchar(100) NOT NULL,
	"capacity" integer,
	"hourly_rate" numeric(10, 2) DEFAULT '0.00',
	"minimum_hours" integer DEFAULT 1,
	"maximum_hours" integer DEFAULT 8,
	"amenities" text,
	"rules" text,
	"is_active" boolean DEFAULT true,
	"requires_approval" boolean DEFAULT false,
	"advance_booking_days" integer DEFAULT 30,
	"images" text,
	"coordinates" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"action" varchar(100) NOT NULL,
	"user_id" integer,
	"username" varchar(255),
	"from_role_id" varchar(50),
	"to_role_id" varchar(50),
	"permission" varchar(100),
	"module" varchar(100) NOT NULL,
	"performed_by" varchar(255) NOT NULL,
	"performed_by_id" integer,
	"description" text NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"ip_address" varchar(45),
	"result" varchar(50),
	"affected_users" integer,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"level" integer NOT NULL,
	"color" varchar(7) DEFAULT '#6366f1',
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name"),
	CONSTRAINT "roles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "saved_payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"stripe_payment_method_id" varchar(255) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"customer_name" varchar(255),
	"card_brand" varchar(50),
	"card_last_4" varchar(4),
	"card_exp_month" integer,
	"card_exp_year" integer,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_payment_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_type" "payment_service_type" NOT NULL,
	"service_id" integer NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'mxn',
	"discount_percentage" numeric(5, 2) DEFAULT '0.00',
	"discount_amount" numeric(10, 2) DEFAULT '0.00',
	"discount_valid_until" timestamp,
	"stripe_product_id" varchar(255),
	"stripe_price_id" varchar(255),
	"allow_installments" boolean DEFAULT false,
	"max_installments" integer DEFAULT 1,
	"requires_deposit" boolean DEFAULT false,
	"deposit_amount" numeric(10, 2) DEFAULT '0.00',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "space_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"space_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(8) NOT NULL,
	"end_time" varchar(8) NOT NULL,
	"is_available" boolean DEFAULT true,
	"exception_date" date,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "space_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"space_id" integer NOT NULL,
	"document_url" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_size" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "space_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"space_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"caption" text,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "space_reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"space_id" integer NOT NULL,
	"event_id" integer,
	"activity_id" integer,
	"reserved_by" integer NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"contact_phone" varchar(20),
	"contact_email" varchar(255),
	"reservation_date" date NOT NULL,
	"start_time" varchar(8) NOT NULL,
	"end_time" varchar(8) NOT NULL,
	"expected_attendees" integer,
	"purpose" text NOT NULL,
	"special_requests" text,
	"total_cost" numeric(10, 2) DEFAULT '0.00',
	"deposit_paid" numeric(10, 2) DEFAULT '0.00',
	"status" varchar(50) DEFAULT 'pending',
	"approved_by" integer,
	"approved_at" timestamp,
	"cancellation_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsor_event_benefits" (
	"id" serial PRIMARY KEY NOT NULL,
	"sponsor_event_id" integer NOT NULL,
	"benefit_type" varchar(50) NOT NULL,
	"benefit_description" text NOT NULL,
	"specifications" text,
	"status" varchar(50) DEFAULT 'planned',
	"delivery_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sector" varchar(100) NOT NULL,
	"logo_url" varchar(500),
	"status" varchar(50) DEFAULT 'Activo',
	"website_url" varchar(255),
	"representative" varchar(255),
	"contact_info" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsorship_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"asset_id" integer NOT NULL,
	"branding" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsorship_benefits" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "benefits_categories",
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsorship_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"budget" numeric(10, 2) NOT NULL,
	"sponsors_count" integer DEFAULT 0,
	"revenue" numeric(10, 2) DEFAULT '0.00',
	"status" varchar(50) DEFAULT 'planificacion',
	"events" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsorship_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" varchar(50) NOT NULL,
	"sponsor_id" integer NOT NULL,
	"type" "contract_type" NOT NULL,
	"package_id" integer,
	"amount" numeric(10, 2) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "contract_status" DEFAULT 'en_negociacion',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sponsorship_contracts_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "sponsorship_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"sponsor_id" integer NOT NULL,
	"event_id" integer,
	"overall_satisfaction" integer NOT NULL,
	"value_for_money" integer NOT NULL,
	"organization_quality" integer NOT NULL,
	"audience_quality" integer NOT NULL,
	"communication_rating" integer NOT NULL,
	"logistics_rating" integer NOT NULL,
	"recommendation_score" integer NOT NULL,
	"feedback" text,
	"improvements" text,
	"would_renew" boolean DEFAULT false,
	"evaluation_date" date NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsorship_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"sponsor_id" integer NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"event_date" date NOT NULL,
	"event_type" varchar(100),
	"participants_count" integer DEFAULT 0,
	"budget_allocated" numeric(10, 2) DEFAULT '0.00',
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsorship_events_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"visibility" varchar(255) DEFAULT 'public' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsorship_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"sponsor_id" integer NOT NULL,
	"event_id" integer,
	"impressions" integer DEFAULT 0,
	"reach" integer DEFAULT 0,
	"engagement" integer DEFAULT 0,
	"leads_generated" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"brand_mentions" integer DEFAULT 0,
	"social_media_reach" integer DEFAULT 0,
	"website_clicks" integer DEFAULT 0,
	"email_signups" integer DEFAULT 0,
	"measurement_period" varchar(50) DEFAULT 'monthly',
	"report_date" date NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsorship_package_benefits" (
	"id" serial PRIMARY KEY NOT NULL,
	"package_id" integer NOT NULL,
	"benefit_id" integer NOT NULL,
	"quantity" integer DEFAULT 1,
	"custom_value" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsorship_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsorship_renewals" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"reminder_sent_date" date,
	"response_date" date,
	"decision" varchar(50),
	"new_package_id" integer,
	"new_amount" numeric(10, 2),
	"new_start_date" date,
	"new_end_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stripe_webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripe_event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_data" jsonb NOT NULL,
	"processed" boolean DEFAULT false,
	"processed_at" timestamp,
	"error_message" text,
	"related_payment_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "stripe_webhook_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE TABLE "time_off_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"request_type" "request_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"requested_days" numeric(5, 2) NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"medical_certificate" text,
	"attachments" text[],
	"status" "request_status" DEFAULT 'pending',
	"approved_by" integer,
	"approved_at" timestamp,
	"rejection_reason" text,
	"submitted_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"record_type" time_record_type NOT NULL,
	"timestamp" timestamp NOT NULL,
	"date" date NOT NULL,
	"latitude" text,
	"longitude" text,
	"location" text,
	"notes" text,
	"is_manual_entry" boolean DEFAULT false,
	"manual_reason" text,
	"registered_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tree_environmental_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"tree_id" integer NOT NULL,
	"co2_capture_annual" numeric(10, 2),
	"co2_capture_lifetime" numeric(10, 2),
	"o2_production_annual" numeric(10, 2),
	"pollutant_removal_no2" numeric(10, 2),
	"pollutant_removal_so2" numeric(10, 2),
	"pollutant_removal_pm25" numeric(10, 2),
	"stormwater_interception" numeric(10, 2),
	"shade_area" numeric(10, 2),
	"temperature_reduction" numeric(5, 2),
	"economic_value_annual" numeric(10, 2),
	"calculation_date" date NOT NULL,
	"calculation_method" text,
	"notes" text,
	"calculated_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tree_interventions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tree_id" integer NOT NULL,
	"intervention_type" text NOT NULL,
	"intervention_date" date,
	"scheduled_date" date,
	"status" text DEFAULT 'scheduled',
	"priority" text DEFAULT 'medium',
	"description" text,
	"performed_by_id" integer,
	"cost" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tree_maintenances" (
	"id" serial PRIMARY KEY NOT NULL,
	"tree_id" integer,
	"maintenance_type" varchar NOT NULL,
	"maintenance_date" date NOT NULL,
	"description" text,
	"performed_by" varchar(255),
	"notes" text,
	"next_maintenance_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tree_risk_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tree_id" integer NOT NULL,
	"assessment_date" date NOT NULL,
	"risk_level" text NOT NULL,
	"methodology" text,
	"assessed_by_id" integer,
	"observations" text,
	"recommended_actions" text,
	"reassessment_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tree_species" (
	"id" serial PRIMARY KEY NOT NULL,
	"common_name" text NOT NULL,
	"scientific_name" text NOT NULL,
	"family" text,
	"origin" text,
	"climate_zone" text,
	"growth_rate" text,
	"height_mature" numeric(5, 2),
	"canopy_diameter" numeric(5, 2),
	"lifespan" integer,
	"image_url" text,
	"description" text,
	"maintenance_requirements" text,
	"water_requirements" text,
	"sun_requirements" text,
	"soil_requirements" text,
	"ecological_benefits" text,
	"ornamental_value" text,
	"common_uses" text,
	"is_endangered" boolean DEFAULT false,
	"icon_color" text DEFAULT '#4CAF50',
	"icon_type" text DEFAULT 'system',
	"custom_icon_url" text,
	"photo_url" text,
	"photo_caption" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trees" (
	"id" serial PRIMARY KEY NOT NULL,
	"species_id" integer,
	"park_id" integer,
	"code" varchar(20),
	"last_maintenance_date" date,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"latitude" numeric,
	"longitude" numeric,
	"height" numeric,
	"trunk_diameter" numeric,
	"age_estimate" integer,
	"canopy_coverage" numeric(5, 2),
	"planting_date" date,
	"location_description" varchar(255),
	"notes" text,
	"condition" varchar(50),
	"development_stage" varchar(50),
	"health_status" varchar(50),
	"has_hollows" boolean DEFAULT false,
	"has_exposed_roots" boolean DEFAULT false,
	"has_pests" boolean DEFAULT false,
	"is_protected" boolean DEFAULT false,
	"image_url" text,
	CONSTRAINT "trees_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "universal_evaluation_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"evaluation_id" integer NOT NULL,
	"criteria_id" integer NOT NULL,
	"rating_value" integer,
	"text_value" text,
	"boolean_value" boolean,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "universal_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" "evaluation_entity_type" NOT NULL,
	"entity_id" integer NOT NULL,
	"evaluator_name" varchar(255) NOT NULL,
	"evaluator_email" varchar(255),
	"evaluator_phone" varchar(20),
	"evaluator_city" varchar(100),
	"evaluator_age" integer,
	"evaluator_role" varchar(100),
	"contextual_info" jsonb,
	"overall_rating" integer NOT NULL,
	"comments" text,
	"suggestions" text,
	"would_recommend" boolean DEFAULT true,
	"experience_date" date,
	"experience_details" jsonb,
	"status" varchar(20) DEFAULT 'pending',
	"moderated_by" integer,
	"moderated_at" timestamp,
	"moderation_notes" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"source" varchar(50) DEFAULT 'web',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"is_primary" boolean DEFAULT false,
	"assigned_by" integer,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text,
	"email" text NOT NULL,
	"role_id" integer,
	"full_name" text NOT NULL,
	"municipality_id" integer,
	"phone" text,
	"gender" text,
	"birth_date" date,
	"bio" text,
	"profile_image_url" text,
	"firebase_uid" text,
	"needs_password_reset" boolean DEFAULT false,
	"notification_preferences" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"last_login" timestamp,
	"department" text,
	"position" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
CREATE TABLE "vacation_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"year" integer NOT NULL,
	"total_days" numeric(5, 2) NOT NULL,
	"used_days" numeric(5, 2) DEFAULT '0.00',
	"pending_days" numeric(5, 2) DEFAULT '0.00',
	"available_days" numeric(5, 2) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "visitor_counts" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_id" integer NOT NULL,
	"date" date NOT NULL,
	"adults" integer DEFAULT 0 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"seniors" integer DEFAULT 0 NOT NULL,
	"pets" integer DEFAULT 0 NOT NULL,
	"groups" integer DEFAULT 0 NOT NULL,
	"counting_method" varchar(50) NOT NULL,
	"day_type" varchar(20),
	"weather" varchar(20),
	"notes" text,
	"registered_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "volunteer_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"participation_id" integer,
	"volunteer_id" integer NOT NULL,
	"evaluator_id" integer NOT NULL,
	"punctuality" integer NOT NULL,
	"attitude" integer NOT NULL,
	"responsibility" integer NOT NULL,
	"overall_performance" integer NOT NULL,
	"comments" text,
	"follow_up_required" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteer_participations" (
	"id" serial PRIMARY KEY NOT NULL,
	"volunteer_id" integer NOT NULL,
	"activity_id" integer,
	"park_id" integer NOT NULL,
	"participation_date" date NOT NULL,
	"hours_served" numeric(4, 2) NOT NULL,
	"tasks" text NOT NULL,
	"feedback" text,
	"status" text DEFAULT 'completed',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteer_recognitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"volunteer_id" integer NOT NULL,
	"recognition_type" text NOT NULL,
	"level" text,
	"reason" text NOT NULL,
	"hours_completed" integer,
	"certificate_url" text,
	"issued_at" timestamp NOT NULL,
	"issued_by_id" integer NOT NULL,
	"additional_comments" text
);
--> statement-breakpoint
CREATE TABLE "volunteers" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"age" integer,
	"gender" text NOT NULL,
	"address" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relation" text,
	"preferred_park_id" integer,
	"previous_experience" text,
	"available_days" text[],
	"available_hours" text,
	"interest_areas" text[],
	"skills" text,
	"profile_image_url" text,
	"legal_consent" boolean DEFAULT false,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"monday" boolean DEFAULT true,
	"tuesday" boolean DEFAULT true,
	"wednesday" boolean DEFAULT true,
	"thursday" boolean DEFAULT true,
	"friday" boolean DEFAULT true,
	"saturday" boolean DEFAULT false,
	"sunday" boolean DEFAULT false,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"break_start_time" text,
	"break_end_time" text,
	"regular_hours_per_day" numeric(5, 2) DEFAULT '8.00',
	"tolerance_minutes" integer DEFAULT 15,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "active_concession_documents" ADD CONSTRAINT "active_concession_documents_concession_id_active_concessions_id_fk" FOREIGN KEY ("concession_id") REFERENCES "public"."active_concessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_concession_documents" ADD CONSTRAINT "active_concession_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_concession_images" ADD CONSTRAINT "active_concession_images_concession_id_active_concessions_id_fk" FOREIGN KEY ("concession_id") REFERENCES "public"."active_concessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_concession_images" ADD CONSTRAINT "active_concession_images_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_concessions" ADD CONSTRAINT "active_concessions_concession_type_id_concession_types_id_fk" FOREIGN KEY ("concession_type_id") REFERENCES "public"."concession_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_concessions" ADD CONSTRAINT "active_concessions_concessionaire_id_users_id_fk" FOREIGN KEY ("concessionaire_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_concessions" ADD CONSTRAINT "active_concessions_park_id_parks_id_fk" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_concessions" ADD CONSTRAINT "active_concessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_concessions" ADD CONSTRAINT "active_concessions_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_category_id_activity_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."activity_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_images" ADD CONSTRAINT "activity_images_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_registration_history" ADD CONSTRAINT "activity_registration_history_registration_id_activity_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."activity_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_registrations" ADD CONSTRAINT "activity_registrations_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actual_expenses" ADD CONSTRAINT "actual_expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actual_expenses" ADD CONSTRAINT "actual_expenses_payroll_period_id_payroll_periods_id_fk" FOREIGN KEY ("payroll_period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actual_incomes" ADD CONSTRAINT "actual_incomes_category_id_income_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."income_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concessionaire_documents" ADD CONSTRAINT "concessionaire_documents_concessionaire_profile_id_concessionaire_profiles_id_fk" FOREIGN KEY ("concessionaire_profile_id") REFERENCES "public"."concessionaire_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concessionaire_documents" ADD CONSTRAINT "concessionaire_documents_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_authorized_services" ADD CONSTRAINT "contract_authorized_services_contract_id_concession_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."concession_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_bonuses" ADD CONSTRAINT "contract_bonuses_contract_id_concession_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."concession_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_charges" ADD CONSTRAINT "contract_charges_payment_config_id_contract_payment_configs_id_fk" FOREIGN KEY ("payment_config_id") REFERENCES "public"."contract_payment_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_income_reports" ADD CONSTRAINT "contract_income_reports_contract_id_concession_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."concession_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_income_reports" ADD CONSTRAINT "contract_income_reports_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_investments" ADD CONSTRAINT "contract_investments_contract_id_concession_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."concession_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_monthly_payments" ADD CONSTRAINT "contract_monthly_payments_contract_id_concession_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."concession_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_monthly_payments" ADD CONSTRAINT "contract_monthly_payments_income_report_id_contract_income_reports_id_fk" FOREIGN KEY ("income_report_id") REFERENCES "public"."contract_income_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_monthly_payments" ADD CONSTRAINT "contract_monthly_payments_calculated_by_users_id_fk" FOREIGN KEY ("calculated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_payment_configs" ADD CONSTRAINT "contract_payment_configs_contract_id_concession_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."concession_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_time_sheets" ADD CONSTRAINT "daily_time_sheets_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_time_sheets" ADD CONSTRAINT "daily_time_sheets_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_queue_id_email_queue_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."email_queue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_criteria_assignments" ADD CONSTRAINT "evaluation_criteria_assignments_criteria_id_evaluation_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."evaluation_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_responses" ADD CONSTRAINT "evaluation_responses_evaluation_id_park_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."park_evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_responses" ADD CONSTRAINT "evaluation_responses_criteria_id_evaluation_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."evaluation_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_images" ADD CONSTRAINT "event_images_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_application_campaigns" ADD CONSTRAINT "instructor_application_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_evaluations" ADD CONSTRAINT "instructor_evaluations_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_evaluations" ADD CONSTRAINT "instructor_evaluations_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_evaluations" ADD CONSTRAINT "instructor_evaluations_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_invitations" ADD CONSTRAINT "instructor_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_application_campaign_id_instructor_application_campaigns_id_fk" FOREIGN KEY ("application_campaign_id") REFERENCES "public"."instructor_application_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_evaluated_by_users_id_fk" FOREIGN KEY ("evaluated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "park_evaluations" ADD CONSTRAINT "park_evaluations_park_id_parks_id_fk" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "park_evaluations" ADD CONSTRAINT "park_evaluations_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "park_feedback" ADD CONSTRAINT "park_feedback_park_id_parks_id_fk" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "park_feedback" ADD CONSTRAINT "park_feedback_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "park_tree_species" ADD CONSTRAINT "park_tree_species_park_id_parks_id_fk" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "park_tree_species" ADD CONSTRAINT "park_tree_species_species_id_tree_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."tree_species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parks" ADD CONSTRAINT "parks_typology_id_park_typology_id_fk" FOREIGN KEY ("typology_id") REFERENCES "public"."park_typology"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_concepts" ADD CONSTRAINT "payroll_concepts_expense_category_id_expense_categories_id_fk" FOREIGN KEY ("expense_category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_details" ADD CONSTRAINT "payroll_details_period_id_payroll_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_details" ADD CONSTRAINT "payroll_details_payroll_period_id_payroll_periods_id_fk" FOREIGN KEY ("payroll_period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_details" ADD CONSTRAINT "payroll_details_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_details" ADD CONSTRAINT "payroll_details_concept_id_payroll_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."payroll_concepts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_receipt_details" ADD CONSTRAINT "payroll_receipt_details_receipt_id_payroll_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."payroll_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_receipt_details" ADD CONSTRAINT "payroll_receipt_details_concept_id_payroll_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."payroll_concepts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_receipts" ADD CONSTRAINT "payroll_receipts_period_id_payroll_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_receipts" ADD CONSTRAINT "payroll_receipts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_receipts" ADD CONSTRAINT "payroll_receipts_generated_by_id_users_id_fk" FOREIGN KEY ("generated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_users" ADD CONSTRAINT "pending_users_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservable_spaces" ADD CONSTRAINT "reservable_spaces_park_id_parks_id_fk" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_availability" ADD CONSTRAINT "space_availability_space_id_reservable_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."reservable_spaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_documents" ADD CONSTRAINT "space_documents_space_id_reservable_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."reservable_spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_images" ADD CONSTRAINT "space_images_space_id_reservable_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."reservable_spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_reservations" ADD CONSTRAINT "space_reservations_space_id_reservable_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."reservable_spaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_reservations" ADD CONSTRAINT "space_reservations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_reservations" ADD CONSTRAINT "space_reservations_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_event_benefits" ADD CONSTRAINT "sponsor_event_benefits_sponsor_event_id_sponsorship_events_id_fk" FOREIGN KEY ("sponsor_event_id") REFERENCES "public"."sponsorship_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_assets" ADD CONSTRAINT "sponsorship_assets_contract_id_sponsorship_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."sponsorship_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_assets" ADD CONSTRAINT "sponsorship_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_contracts" ADD CONSTRAINT "sponsorship_contracts_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_contracts" ADD CONSTRAINT "sponsorship_contracts_package_id_sponsorship_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."sponsorship_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_evaluations" ADD CONSTRAINT "sponsorship_evaluations_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_evaluations" ADD CONSTRAINT "sponsorship_evaluations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_events" ADD CONSTRAINT "sponsorship_events_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_events_links" ADD CONSTRAINT "sponsorship_events_links_contract_id_sponsorship_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."sponsorship_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_events_links" ADD CONSTRAINT "sponsorship_events_links_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_metrics" ADD CONSTRAINT "sponsorship_metrics_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_metrics" ADD CONSTRAINT "sponsorship_metrics_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_package_benefits" ADD CONSTRAINT "sponsorship_package_benefits_package_id_sponsorship_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."sponsorship_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_package_benefits" ADD CONSTRAINT "sponsorship_package_benefits_benefit_id_sponsorship_benefits_id_fk" FOREIGN KEY ("benefit_id") REFERENCES "public"."sponsorship_benefits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_renewals" ADD CONSTRAINT "sponsorship_renewals_contract_id_sponsorship_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."sponsorship_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_renewals" ADD CONSTRAINT "sponsorship_renewals_new_package_id_sponsorship_packages_id_fk" FOREIGN KEY ("new_package_id") REFERENCES "public"."sponsorship_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_webhook_events" ADD CONSTRAINT "stripe_webhook_events_related_payment_id_payments_id_fk" FOREIGN KEY ("related_payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_records" ADD CONSTRAINT "time_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_records" ADD CONSTRAINT "time_records_registered_by_users_id_fk" FOREIGN KEY ("registered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_maintenances" ADD CONSTRAINT "tree_maintenances_tree_id_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."trees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trees" ADD CONSTRAINT "trees_species_id_tree_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."tree_species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trees" ADD CONSTRAINT "trees_park_id_parks_id_fk" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "universal_evaluation_responses" ADD CONSTRAINT "universal_evaluation_responses_evaluation_id_universal_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."universal_evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "universal_evaluation_responses" ADD CONSTRAINT "universal_evaluation_responses_criteria_id_evaluation_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."evaluation_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "universal_evaluations" ADD CONSTRAINT "universal_evaluations_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_balances" ADD CONSTRAINT "vacation_balances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_counts" ADD CONSTRAINT "visitor_counts_park_id_parks_id_fk" FOREIGN KEY ("park_id") REFERENCES "public"."parks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_counts" ADD CONSTRAINT "visitor_counts_registered_by_users_id_fk" FOREIGN KEY ("registered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;