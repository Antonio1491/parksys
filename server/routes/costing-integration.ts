import { Router } from 'express';
import { pool } from '../db';
import { generateAccountingEntry } from '../finance-accounting-integration';
import { isAuthenticated, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * MÓDULO DE INTEGRACIÓN DE COSTEO FINANCIERO
 * ==========================================
 * 
 * Automatiza la creación de asientos contables a partir de:
 * - Pagos de actividades con descuentos aplicados
 * - Pagos de eventos con descuentos aplicados  
 * - Pagos de reservas de espacios con descuentos aplicados
 * 
 * Calcula recuperación de costos y genera informes financieros
 */

interface PaymentCostingData {
  entityType: 'activity' | 'event' | 'space_reservation';
  entityId: number;
  originalAmount: number;
  finalAmount: number;
  discountPercentage: number;
  discountBreakdown: Record<string, number>;
  costRecoveryPercentage: number;
  paymentIntentId: string;
  customerEmail: string;
}

/**
 * POST /api/costing/process-payment
 * Procesa un pago completado y genera asientos contables automáticos
 * NOTA: Esta ruta se debe usar solo internamente por los endpoints de pago
 */
router.post('/process-payment', isAuthenticated, async (req, res) => {
  try {
    const costingData: PaymentCostingData = req.body;
    
    // 1. Validar datos de entrada
    if (!costingData.entityType || !costingData.entityId || !costingData.finalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Datos de costeo incompletos'
      });
    }

    // 2. Obtener información de la entidad (actividad, evento o reserva)
    let entityInfo;
    let tableName;
    
    switch (costingData.entityType) {
      case 'activity':
        tableName = 'activities';
        break;
      case 'event':
        tableName = 'events';
        break;
      case 'space_reservation':
        tableName = 'space_reservations';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Tipo de entidad inválido'
        });
    }

    const entityResult = await pool.query(`
      SELECT 
        id, title, cost_recovery_percentage
      FROM ${tableName} 
      WHERE id = $1
    `, [costingData.entityId]);

    if (entityResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entidad no encontrada'
      });
    }

    entityInfo = entityResult.rows[0];

    // 3. Calcular métricas de recuperación de costos
    const targetRecoveryPercentage = parseFloat(entityInfo.cost_recovery_percentage || '30.00');
    const actualRecoveredAmount = costingData.finalAmount;
    const discountAmount = costingData.originalAmount - costingData.finalAmount;
    
    // Calcular si se alcanzó el objetivo de recuperación
    const expectedMinimumRevenue = costingData.originalAmount * (targetRecoveryPercentage / 100);
    const recoveryAchieved = actualRecoveredAmount >= expectedMinimumRevenue;

    // 4. Crear asiento contable para el ingreso
    const accountingEntry = await generateAccountingEntry({
      amount: actualRecoveredAmount,
      description: `Ingreso por ${costingData.entityType} - ${entityInfo.title}`,
      reference: costingData.paymentIntentId,
      account_code: '4001', // Código para ingresos por servicios
      transaction_type: 'income',
      entity_type: costingData.entityType,
      entity_id: costingData.entityId,
      metadata: {
        original_amount: costingData.originalAmount,
        discount_amount: discountAmount,
        discount_percentage: costingData.discountPercentage,
        discount_breakdown: costingData.discountBreakdown,
        cost_recovery_target: targetRecoveryPercentage,
        cost_recovery_achieved: recoveryAchieved,
        customer_email: costingData.customerEmail
      }
    });

    // 5. Si hay descuentos significativos, crear asiento para descuentos otorgados
    if (discountAmount > 0) {
      await generateAccountingEntry({
        amount: discountAmount,
        description: `Descuentos otorgados - ${entityInfo.title}`,
        reference: costingData.paymentIntentId,
        account_code: '6001', // Código para gastos por descuentos
        transaction_type: 'expense',
        entity_type: costingData.entityType,
        entity_id: costingData.entityId,
        metadata: {
          discount_breakdown: costingData.discountBreakdown,
          applied_to_payment: costingData.paymentIntentId
        }
      });
    }

    // 6. Actualizar estadísticas de recuperación de costos en la entidad
    try {
      await pool.query(`
        UPDATE ${tableName}
        SET 
          reviewed_at = NOW(),
          costing_notes = $1
        WHERE id = $2
      `, [
        `Costeo procesado automáticamente. Recuperación: ${recoveryAchieved ? 'EXITOSA' : 'PARCIAL'} (${((actualRecoveredAmount/costingData.originalAmount)*100).toFixed(1)}% del precio base)`,
        costingData.entityId
      ]);
    } catch (updateError) {
      console.warn('⚠️ No se pudo actualizar costing_notes en la entidad (posible campo faltante):', updateError);
      // Continuar sin fallar - el costeo se registra en audit log de todas formas
    }

    // 7. Registrar entrada en log de costeo para auditoría
    await pool.query(`
      INSERT INTO costing_audit_log 
      (entity_type, entity_id, payment_intent_id, original_amount, final_amount, 
       discount_amount, recovery_percentage_target, recovery_achieved, processed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      costingData.entityType,
      costingData.entityId,
      costingData.paymentIntentId,
      costingData.originalAmount,
      actualRecoveredAmount,
      discountAmount,
      targetRecoveryPercentage,
      recoveryAchieved
    ]);

    console.log(`💰 Costeo procesado para ${costingData.entityType} ${costingData.entityId}: $${actualRecoveredAmount} (${recoveryAchieved ? 'Objetivo alcanzado' : 'Objetivo no alcanzado'})`);

    res.json({
      success: true,
      accountingEntryId: accountingEntry.id,
      costingMetrics: {
        originalAmount: costingData.originalAmount,
        finalAmount: actualRecoveredAmount,
        discountAmount: discountAmount,
        discountPercentage: costingData.discountPercentage,
        targetRecoveryPercentage: targetRecoveryPercentage,
        actualRecoveryPercentage: ((actualRecoveredAmount/costingData.originalAmount)*100),
        recoveryAchieved: recoveryAchieved
      }
    });

  } catch (error) {
    console.error('❌ Error procesando costeo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno procesando costeo financiero'
    });
  }
});

/**
 * GET /api/costing/report/:entityType/:entityId
 * Obtiene reporte de costeo para una entidad específica
 */
router.get('/report/:entityType/:entityId', isAuthenticated, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    // Validar entity type
    const validTypes = ['activity', 'event', 'space_reservation'];
    if (!validTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de entidad inválido'
      });
    }

    // Obtener todos los pagos y su costeo para esta entidad
    const auditResult = await pool.query(`
      SELECT 
        payment_intent_id,
        original_amount,
        final_amount,
        discount_amount,
        recovery_percentage_target,
        recovery_achieved,
        processed_at
      FROM costing_audit_log
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY processed_at DESC
    `, [entityType, entityId]);

    // Calcular estadísticas agregadas
    const payments = auditResult.rows;
    const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.final_amount), 0);
    const totalDiscounts = payments.reduce((sum, p) => sum + parseFloat(p.discount_amount), 0);
    const totalOriginalValue = payments.reduce((sum, p) => sum + parseFloat(p.original_amount), 0);
    const averageRecovery = totalOriginalValue > 0 ? (totalRevenue / totalOriginalValue) * 100 : 0;
    const successfulRecoveries = payments.filter(p => p.recovery_achieved).length;

    res.json({
      success: true,
      entityType,
      entityId: parseInt(entityId),
      summary: {
        totalPayments: payments.length,
        totalRevenue: totalRevenue,
        totalDiscounts: totalDiscounts,
        totalOriginalValue: totalOriginalValue,
        averageRecoveryPercentage: averageRecovery,
        successfulRecoveries: successfulRecoveries,
        recoverySuccessRate: payments.length > 0 ? (successfulRecoveries / payments.length) * 100 : 0
      },
      payments: payments.map(p => ({
        paymentIntentId: p.payment_intent_id,
        originalAmount: parseFloat(p.original_amount),
        finalAmount: parseFloat(p.final_amount),
        discountAmount: parseFloat(p.discount_amount),
        recoveryTarget: parseFloat(p.recovery_percentage_target),
        recoveryAchieved: p.recovery_achieved,
        processedAt: p.processed_at
      }))
    });

  } catch (error) {
    console.error('❌ Error obteniendo reporte de costeo:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo reporte de costeo'
    });
  }
});

/**
 * GET /api/costing/dashboard
 * Dashboard general de recuperación de costos
 */
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params: any[] = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE processed_at >= $1 AND processed_at <= $2';
      params.push(startDate, endDate);
    }

    // Métricas generales por tipo de entidad
    const metricsResult = await pool.query(`
      SELECT 
        entity_type,
        COUNT(*) as total_payments,
        SUM(original_amount) as total_original_value,
        SUM(final_amount) as total_revenue,
        SUM(discount_amount) as total_discounts,
        AVG(recovery_percentage_target) as avg_target_recovery,
        COUNT(CASE WHEN recovery_achieved THEN 1 END) as successful_recoveries,
        AVG(CASE WHEN original_amount > 0 THEN (final_amount / original_amount) * 100 ELSE 0 END) as avg_actual_recovery
      FROM costing_audit_log
      ${dateFilter}
      GROUP BY entity_type
      ORDER BY entity_type
    `, params);

    // Top entidades con mejor recuperación
    const topEntitiesResult = await pool.query(`
      SELECT 
        cal.entity_type,
        cal.entity_id,
        CASE 
          WHEN cal.entity_type = 'activity' THEN a.title
          WHEN cal.entity_type = 'event' THEN e.title  
          WHEN cal.entity_type = 'space_reservation' THEN CONCAT('Reserva #', cal.entity_id)
        END as entity_title,
        COUNT(*) as payment_count,
        SUM(cal.final_amount) as total_revenue,
        AVG(CASE WHEN cal.original_amount > 0 THEN (cal.final_amount / cal.original_amount) * 100 ELSE 0 END) as avg_recovery_percentage
      FROM costing_audit_log cal
      LEFT JOIN activities a ON cal.entity_type = 'activity' AND cal.entity_id = a.id
      LEFT JOIN events e ON cal.entity_type = 'event' AND cal.entity_id = e.id
      ${dateFilter}
      GROUP BY cal.entity_type, cal.entity_id, entity_title
      HAVING COUNT(*) >= 2
      ORDER BY avg_recovery_percentage DESC
      LIMIT 10
    `, params);

    res.json({
      success: true,
      period: {
        startDate: startDate || 'all',
        endDate: endDate || 'all'
      },
      metricsByType: metricsResult.rows.map(row => ({
        entityType: row.entity_type,
        totalPayments: parseInt(row.total_payments),
        totalOriginalValue: parseFloat(row.total_original_value),
        totalRevenue: parseFloat(row.total_revenue),
        totalDiscounts: parseFloat(row.total_discounts),
        avgTargetRecovery: parseFloat(row.avg_target_recovery),
        successfulRecoveries: parseInt(row.successful_recoveries),
        successRate: parseInt(row.total_payments) > 0 ? (parseInt(row.successful_recoveries) / parseInt(row.total_payments)) * 100 : 0,
        avgActualRecovery: parseFloat(row.avg_actual_recovery)
      })),
      topPerformers: topEntitiesResult.rows.map(row => ({
        entityType: row.entity_type,
        entityId: row.entity_id,
        title: row.entity_title,
        paymentCount: parseInt(row.payment_count),
        totalRevenue: parseFloat(row.total_revenue),
        avgRecoveryPercentage: parseFloat(row.avg_recovery_percentage)
      }))
    });

  } catch (error) {
    console.error('❌ Error obteniendo dashboard de costeo:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo dashboard de costeo'
    });
  }
});

export default router;