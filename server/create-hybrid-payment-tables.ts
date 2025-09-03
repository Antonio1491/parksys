/**
 * Script para crear las tablas del sistema de cobro híbrido para concesiones
 */

import { db } from './db';
import { sql } from 'drizzle-orm';
import { 
  contractPaymentConfigs,
  contractCharges,
  contractInvestments,
  contractBonuses,
  contractAuthorizedServices,
  contractIncomeReports,
  contractMonthlyPayments
} from '../shared/schema';

export async function createHybridPaymentTables() {
  try {
    console.log("Iniciando creación de tablas del sistema de cobro híbrido...");

    // Crear enums necesarios
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE payment_frequency AS ENUM ('monthly', 'quarterly', 'biannual', 'annual');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE charge_type AS ENUM ('fixed', 'percentage', 'per_unit', 'per_m2', 'minimum_guarantee');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE bonus_type AS ENUM ('bonus', 'penalty');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE bonus_frequency AS ENUM ('once', 'monthly', 'annual');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Crear tabla de configuraciones de pago
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contract_payment_configs (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER NOT NULL REFERENCES concession_contracts(id),
        has_fixed_payment BOOLEAN DEFAULT FALSE,
        has_percentage_payment BOOLEAN DEFAULT FALSE,
        has_per_unit_payment BOOLEAN DEFAULT FALSE,
        has_space_payment BOOLEAN DEFAULT FALSE,
        has_minimum_guarantee BOOLEAN DEFAULT FALSE,
        minimum_guarantee_amount DECIMAL(10,2),
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Crear tabla de cargos específicos
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contract_charges (
        id SERIAL PRIMARY KEY,
        payment_config_id INTEGER NOT NULL REFERENCES contract_payment_configs(id),
        charge_type charge_type NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        fixed_amount DECIMAL(10,2),
        percentage DECIMAL(5,2),
        per_unit_amount DECIMAL(10,2),
        per_m2_amount DECIMAL(10,2),
        frequency payment_frequency NOT NULL,
        unit_type VARCHAR(50),
        space_m2 DECIMAL(8,2),
        is_active BOOLEAN DEFAULT TRUE,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Crear tabla de inversiones de contrato
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contract_investments (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER NOT NULL REFERENCES concession_contracts(id),
        description TEXT NOT NULL,
        estimated_value DECIMAL(12,2) NOT NULL,
        actual_value DECIMAL(12,2),
        deadline_date DATE NOT NULL,
        completed_date DATE,
        is_amortizable BOOLEAN DEFAULT FALSE,
        amortization_months INTEGER,
        monthly_amortization DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'pending',
        documentation TEXT,
        attachments JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Crear tabla de bonificaciones y penalizaciones
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contract_bonuses (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER NOT NULL REFERENCES concession_contracts(id),
        bonus_type bonus_type NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        frequency bonus_frequency NOT NULL,
        conditions TEXT,
        evaluation_criteria JSONB,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Crear tabla de servicios autorizados
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contract_authorized_services (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER NOT NULL REFERENCES concession_contracts(id),
        service_name VARCHAR(100) NOT NULL,
        service_description TEXT,
        service_category VARCHAR(50),
        can_charge_public BOOLEAN DEFAULT TRUE,
        max_public_rate DECIMAL(10,2),
        rate_description TEXT,
        restrictions TEXT,
        required_permits TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Crear tabla de reportes de ingresos
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contract_income_reports (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER NOT NULL REFERENCES concession_contracts(id),
        report_month INTEGER NOT NULL,
        report_year INTEGER NOT NULL,
        gross_income DECIMAL(12,2) NOT NULL,
        net_income DECIMAL(12,2),
        service_breakdown JSONB,
        units_sold JSONB,
        supporting_documents JSONB,
        notes TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        verified_by INTEGER REFERENCES users(id),
        verified_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'submitted',
        submitted_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(contract_id, report_month, report_year)
      );
    `);

    // Crear tabla de pagos mensuales calculados
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contract_monthly_payments (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER NOT NULL REFERENCES concession_contracts(id),
        income_report_id INTEGER REFERENCES contract_income_reports(id),
        payment_month INTEGER NOT NULL,
        payment_year INTEGER NOT NULL,
        fixed_amount DECIMAL(10,2) DEFAULT 0.00,
        percentage_amount DECIMAL(10,2) DEFAULT 0.00,
        per_unit_amount DECIMAL(10,2) DEFAULT 0.00,
        space_amount DECIMAL(10,2) DEFAULT 0.00,
        subtotal DECIMAL(10,2) NOT NULL,
        minimum_guarantee_applied BOOLEAN DEFAULT FALSE,
        minimum_guarantee_adjustment DECIMAL(10,2) DEFAULT 0.00,
        bonus_amount DECIMAL(10,2) DEFAULT 0.00,
        penalty_amount DECIMAL(10,2) DEFAULT 0.00,
        investment_amortization DECIMAL(10,2) DEFAULT 0.00,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending',
        paid_amount DECIMAL(10,2) DEFAULT 0.00,
        paid_date DATE,
        calculation_details JSONB,
        notes TEXT,
        calculated_by INTEGER REFERENCES users(id),
        calculated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(contract_id, payment_month, payment_year)
      );
    `);

    // Crear índices para optimizar consultas
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_contract_payment_configs_contract_id ON contract_payment_configs(contract_id);
      CREATE INDEX IF NOT EXISTS idx_contract_charges_payment_config_id ON contract_charges(payment_config_id);
      CREATE INDEX IF NOT EXISTS idx_contract_investments_contract_id ON contract_investments(contract_id);
      CREATE INDEX IF NOT EXISTS idx_contract_bonuses_contract_id ON contract_bonuses(contract_id);
      CREATE INDEX IF NOT EXISTS idx_contract_authorized_services_contract_id ON contract_authorized_services(contract_id);
      CREATE INDEX IF NOT EXISTS idx_contract_income_reports_contract_id ON contract_income_reports(contract_id);
      CREATE INDEX IF NOT EXISTS idx_contract_income_reports_period ON contract_income_reports(report_year, report_month);
      CREATE INDEX IF NOT EXISTS idx_contract_monthly_payments_contract_id ON contract_monthly_payments(contract_id);
      CREATE INDEX IF NOT EXISTS idx_contract_monthly_payments_period ON contract_monthly_payments(payment_year, payment_month);
    `);

    console.log("Tablas del sistema de cobro híbrido creadas exitosamente");

  } catch (error) {
    console.error("Error al crear tablas del sistema de cobro híbrido:", error);
    throw error;
  }
}

// COMMENTED OUT: Auto-execution was causing server startup failures in production
// Ejecutar el script si se ejecuta directamente
// if (import.meta.url === `file://${process.argv[1]}`) {
//   createHybridPaymentTables()
//     .then(() => {
//       console.log("Script de creación de tablas de cobro híbrido completado");
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error("Error en script de creación de tablas de cobro híbrido:", error);
//       process.exit(1);
//     });
// }