import { pool } from "./db";

/**
 * Crear tabla de auditoría para el costeo financiero automatizado
 */
export async function createCostingAuditTable() {
  try {
    console.log('🔧 Creando tabla de auditoría de costeo...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS costing_audit_log (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('activity', 'event', 'space_reservation')),
        entity_id INTEGER NOT NULL,
        payment_intent_id VARCHAR(255) NOT NULL,
        original_amount DECIMAL(10,2) NOT NULL,
        final_amount DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        recovery_percentage_target DECIMAL(5,2) NOT NULL DEFAULT 30.00,
        recovery_achieved BOOLEAN NOT NULL DEFAULT false,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Crear índices para optimizar consultas
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_costing_audit_entity 
      ON costing_audit_log(entity_type, entity_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_costing_audit_payment 
      ON costing_audit_log(payment_intent_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_costing_audit_date 
      ON costing_audit_log(processed_at);
    `);

    console.log('✅ Tabla de auditoría de costeo creada exitosamente');

    // Verificar que la tabla existe
    const checkResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'costing_audit_log'
    `);

    if (parseInt(checkResult.rows[0].count) > 0) {
      console.log('✅ Verificación exitosa: tabla costing_audit_log disponible');
    } else {
      throw new Error('Error: tabla costing_audit_log no se creó correctamente');
    }

  } catch (error) {
    console.error('❌ Error creando tabla de auditoría de costeo:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente (ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  createCostingAuditTable()
    .then(() => {
      console.log('🎉 Tabla de auditoría de costeo inicializada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error inicializando tabla:', error);
      process.exit(1);
    });
}