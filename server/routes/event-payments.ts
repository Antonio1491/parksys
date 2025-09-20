import { Router } from 'express';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { calculateUnifiedDiscounts } from './unified-discounts';

const router = Router();
const sql = neon(process.env.DATABASE_URL!);

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Schema de validación para crear payment intent
const paymentIntentSchema = z.object({
  amount: z.number().min(0.5, 'El monto mínimo es $0.50'),
  originalAmount: z.number().optional(),
  customerData: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  // Unified discount fields
  appliedDiscounts: z.object({
    discountSeniors: z.number().min(0).max(100).default(0),
    discountStudents: z.number().min(0).max(100).default(0),
    discountFamilies: z.number().min(0).max(100).default(0),
    discountDisability: z.number().min(0).max(100).default(0),
    discountEarlyBird: z.number().min(0).max(100).default(0),
    totalDiscountPercentage: z.number().min(0).max(100).default(0),
  }).optional(),
});

// POST /api/events/:id/create-payment-intent - Crear intención de pago para evento
router.post('/:eventId/create-payment-intent', async (req, res) => {
  try {
    const { eventId } = req.params;
    const validatedData = paymentIntentSchema.parse(req.body);

    // Obtener información del evento incluyendo campos de descuentos
    const eventData = await sql`
      SELECT 
        id, title, price, is_free, 
        organizer_name, organizer_email, capacity,
        discount_seniors, discount_students, discount_families, 
        discount_disability, discount_early_bird, discount_early_bird_deadline
      FROM events 
      WHERE id = ${eventId}
    `;

    if (eventData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    const event = eventData[0];

    // Verificar que el evento requiere pago
    if (event.is_free || !event.price || event.price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Este evento es gratuito'
      });
    }

    // Validar descuentos server-side usando los descuentos configurados del evento
    const serverDiscountCalculation = calculateUnifiedDiscounts(
      event.price,
      {
        discountSeniors: Math.min(validatedData.appliedDiscounts?.discountSeniors || 0, event.discount_seniors || 0),
        discountStudents: Math.min(validatedData.appliedDiscounts?.discountStudents || 0, event.discount_students || 0),
        discountFamilies: Math.min(validatedData.appliedDiscounts?.discountFamilies || 0, event.discount_families || 0),
        discountDisability: Math.min(validatedData.appliedDiscounts?.discountDisability || 0, event.discount_disability || 0),
        discountEarlyBird: Math.min(validatedData.appliedDiscounts?.discountEarlyBird || 0, event.discount_early_bird || 0),
      },
      event.discount_early_bird_deadline
    );

    // Verificar que el monto enviado por el cliente coincide con el cálculo server-side
    const expectedAmount = serverDiscountCalculation.finalAmount;
    if (Math.abs(validatedData.amount - expectedAmount) > 0.01) { // tolerancia de 1 centavo
      return res.status(400).json({
        success: false,
        error: `Monto inválido. Esperado: $${expectedAmount.toFixed(2)}, recibido: $${validatedData.amount.toFixed(2)}`
      });
    }

    // Verificar capacidad disponible
    if (event.capacity) {
      const currentRegistrations = await sql`
        SELECT COUNT(*) as count 
        FROM event_registrations 
        WHERE event_id = ${eventId} AND status IN ('confirmed', 'pending')
      `;

      if (parseInt(currentRegistrations[0].count) >= event.capacity) {
        return res.status(400).json({
          success: false,
          error: 'El evento ha alcanzado su capacidad máxima'
        });
      }
    }

    // Verificar si el usuario ya está inscrito
    const existingRegistration = await sql`
      SELECT id FROM event_registrations 
      WHERE event_id = ${eventId} AND (email = ${validatedData.customerData.email} OR participant_email = ${validatedData.customerData.email})
    `;

    if (existingRegistration.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ya estás inscrito en este evento'
      });
    }

    // Crear customer en Stripe si no existe
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: validatedData.customerData.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: validatedData.customerData.email,
        name: validatedData.customerData.fullName,
        phone: validatedData.customerData.phone,
      });
    }

    // Usar el monto validado server-side
    const finalAmount = serverDiscountCalculation.finalAmount;
    const originalAmount = serverDiscountCalculation.originalAmount;
    
    // Crear PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // Convertir a centavos
      currency: 'mxn',
      customer: customer.id,
      metadata: {
        event_id: eventId,
        event_title: event.title,
        customer_name: validatedData.customerData.fullName,
        customer_email: validatedData.customerData.email,
        module: 'events',
        original_amount: originalAmount.toString(),
        final_amount: finalAmount.toString(),
        discounts_applied: JSON.stringify(serverDiscountCalculation.discountBreakdown),
        discount_percentage: serverDiscountCalculation.totalDiscountPercentage.toString(),
      },
      description: `Inscripción a evento: ${event.title}`,
    });

    console.log(`💳 PaymentIntent creado para evento ${eventId}: ${paymentIntent.id}`);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: finalAmount,
      originalAmount: originalAmount,
      discountBreakdown: serverDiscountCalculation.discountBreakdown,
      totalDiscountPercentage: serverDiscountCalculation.totalDiscountPercentage,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }

    console.error('Error creando PaymentIntent para evento:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/events/:id/confirm-payment - Confirmar pago y completar inscripción
router.post('/:eventId/confirm-payment', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { paymentIntentId, participantData } = req.body;

    // Verificar el pago en Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: 'El pago no ha sido completado'
      });
    }

    // Obtener información del evento
    const eventData = await sql`
      SELECT 
        id, title, start_date, end_date, start_time, end_time, 
        location, organizer_name, organizer_email, price
      FROM events 
      WHERE id = ${eventId}
    `;

    if (eventData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    const event = eventData[0];

    // Verificar si ya existe una inscripción para este pago
    const existingRegistration = await sql`
      SELECT id FROM event_registrations 
      WHERE event_id = ${eventId} 
      AND participant_email = ${participantData.email}
      AND stripe_payment_intent_id = ${paymentIntentId}
    `;

    if (existingRegistration.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una inscripción para este pago'
      });
    }

    // Crear inscripción con pago confirmado
    const registrationResult = await sql`
      INSERT INTO event_registrations (
        event_id, full_name, email, phone,
        notes, status, registration_date, payment_status, payment_amount,
        stripe_payment_intent_id, stripe_customer_id,
        participant_name, participant_email, participant_phone
      ) VALUES (
        ${eventId}, ${participantData.fullName}, ${participantData.email}, 
        ${participantData.phone || null}, ${participantData.additionalInfo || null}, 
        'confirmed', NOW(), 'paid', ${event.price},
        ${paymentIntentId}, ${paymentIntent.customer},
        ${participantData.fullName}, ${participantData.email}, ${participantData.phone || null}
      ) RETURNING *
    `;

    const registration = registrationResult[0];

    console.log(`✅ Inscripción confirmada para evento ${eventId}: ${registration.id}`);

    // Procesar costeo financiero automáticamente
    try {
      const originalAmount = parseFloat(paymentIntent.metadata.original_amount);
      const finalAmount = parseFloat(paymentIntent.metadata.final_amount);
      const discountPercentage = parseFloat(paymentIntent.metadata.discount_percentage || '0');
      const discountBreakdown = JSON.parse(paymentIntent.metadata.discounts_applied || '{}');

      // Llamar al módulo de costeo para procesar automáticamente
      const costingResponse = await fetch(`${process.env.BASE_URL || 'http://localhost:5000'}/api/costing/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': 'system',
        },
        body: JSON.stringify({
          entityType: 'event',
          entityId: parseInt(eventId),
          originalAmount: originalAmount,
          finalAmount: finalAmount,
          discountPercentage: discountPercentage,
          discountBreakdown: discountBreakdown,
          costRecoveryPercentage: 30.0, // valor por defecto
          paymentIntentId: paymentIntentId,
          customerEmail: participantData.email
        })
      });

      if (costingResponse.ok) {
        const costingResult = await costingResponse.json();
        console.log(`💰 Costeo procesado automáticamente para evento ${eventId}:`, costingResult.costingMetrics);
      } else {
        console.warn(`⚠️ No se pudo procesar costeo para evento ${eventId}:`, await costingResponse.text());
      }
    } catch (costingError) {
      console.error('❌ Error procesando costeo automático:', costingError);
      // No fallar la confirmación del pago por errores de costeo
    }

    res.json({
      success: true,
      data: registration,
      message: 'Pago confirmado e inscripción completada exitosamente'
    });

  } catch (error) {
    console.error('Error confirmando pago de evento:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/events/:id/payment-status/:paymentIntentId - Verificar estado del pago
router.get('/:eventId/payment-status/:paymentIntentId', async (req, res) => {
  try {
    const { eventId, paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verificar si ya existe una inscripción
    const registration = await sql`
      SELECT * FROM event_registrations 
      WHERE event_id = ${eventId} AND stripe_payment_intent_id = ${paymentIntentId}
    `;

    res.json({
      success: true,
      paymentStatus: paymentIntent.status,
      registrationExists: registration.length > 0,
      registration: registration[0] || null
    });

  } catch (error) {
    console.error('Error verificando estado del pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;