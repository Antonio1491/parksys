import { Express } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { spaceReservations, reservableSpaces, parks } from "../../shared/schema";
import { calculateUnifiedDiscounts } from "./unified-discounts";

// Configurar Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export function registerSpacePaymentRoutes(app: Express) {
  
  // Crear Payment Intent para una reserva de espacio
  app.post("/api/space-reservations/:id/create-payment-intent", async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, originalAmount, appliedDiscounts } = req.body;

      console.log(`🎪 Creando payment intent para reserva ${id} por $${amount}`);

      // Validar que la reserva existe y obtener sus descuentos configurados
      const reservationData = await db
        .select({
          id: spaceReservations.id,
          spaceId: spaceReservations.spaceId,
          contactName: spaceReservations.contactName,
          contactEmail: spaceReservations.contactEmail,
          totalCost: spaceReservations.totalCost,
          discountSeniors: spaceReservations.discountSeniors,
          discountStudents: spaceReservations.discountStudents,
          discountFamilies: spaceReservations.discountFamilies,
          discountDisability: spaceReservations.discountDisability,
          discountEarlyBird: spaceReservations.discountEarlyBird,
          discountEarlyBirdDeadline: spaceReservations.discountEarlyBirdDeadline,
        })
        .from(spaceReservations)
        .where(eq(spaceReservations.id, parseInt(id)))
        .limit(1);

      if (reservationData.length === 0) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      const reservation = reservationData[0];

      // Obtener información del espacio y parque
      const spaceInfo = await db
        .select({
          spaceName: reservableSpaces.name,
          parkName: parks.name,
          hourlyRate: reservableSpaces.hourlyRate
        })
        .from(reservableSpaces)
        .leftJoin(parks, eq(reservableSpaces.parkId, parks.id))
        .where(eq(reservableSpaces.id, reservation.spaceId))
        .limit(1);

      // Validar descuentos server-side usando los descuentos configurados de la reserva
      const baseCost = parseFloat(reservation.totalCost || "0");
      const serverDiscountCalculation = calculateUnifiedDiscounts(
        baseCost,
        {
          discountSeniors: Math.min(appliedDiscounts?.discountSeniors || 0, reservation.discountSeniors || 0),
          discountStudents: Math.min(appliedDiscounts?.discountStudents || 0, reservation.discountStudents || 0),
          discountFamilies: Math.min(appliedDiscounts?.discountFamilies || 0, reservation.discountFamilies || 0),
          discountDisability: Math.min(appliedDiscounts?.discountDisability || 0, reservation.discountDisability || 0),
          discountEarlyBird: Math.min(appliedDiscounts?.discountEarlyBird || 0, reservation.discountEarlyBird || 0),
        },
        reservation.discountEarlyBirdDeadline
      );

      // Verificar que el monto enviado por el cliente coincide con el cálculo server-side
      const expectedAmount = serverDiscountCalculation.finalAmount;
      if (Math.abs(amount - expectedAmount) > 0.01) { // tolerancia de 1 centavo
        return res.status(400).json({
          error: `Monto inválido. Esperado: $${expectedAmount.toFixed(2)}, recibido: $${amount.toFixed(2)}`
        });
      }

      const spaceName = spaceInfo[0]?.spaceName || 'Espacio';
      const parkName = spaceInfo[0]?.parkName || 'Parque';

      // Usar el monto validado server-side
      const validatedFinalAmount = serverDiscountCalculation.finalAmount;
      const validatedOriginalAmount = serverDiscountCalculation.originalAmount;
      const amountInCentavos = Math.round(validatedFinalAmount * 100);
      
      console.log(`💰 Conversion: ${amount} pesos → ${amountInCentavos} centavos`);

      // Crear el Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCentavos,
        currency: "mxn",
        payment_method_types: ["card", "oxxo"],
        metadata: {
          reservationId: id,
          reservationType: 'space',
          spaceName: spaceName,
          parkName: parkName,
          customerName: reservation.contactName,
          customerEmail: reservation.contactEmail,
          original_amount: validatedOriginalAmount.toString(),
          final_amount: validatedFinalAmount.toString(),
          discounts_applied: JSON.stringify(serverDiscountCalculation.discountBreakdown),
          discount_percentage: serverDiscountCalculation.totalDiscountPercentage.toString(),
        },
        description: `Reserva de ${spaceName} en ${parkName}`,
        receipt_email: reservation.contactEmail
      });

      console.log(`✅ Payment intent creado: ${paymentIntent.id} por ${amountInCentavos} centavos`);

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: validatedFinalAmount,
        originalAmount: validatedOriginalAmount,
        discountBreakdown: serverDiscountCalculation.discountBreakdown,
        totalDiscountPercentage: serverDiscountCalculation.totalDiscountPercentage,
      });

    } catch (error: any) {
      console.error("❌ Error creando payment intent:", error);
      res.status(500).json({ 
        error: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Confirmar pago de reserva de espacio
  app.post("/api/space-reservations/:id/payment-confirm", async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentIntentId } = req.body;

      console.log(`✅ Confirmando pago para reserva ${id}`);

      // Actualizar estado de la reserva
      const updatedReservation = await db
        .update(spaceReservations)
        .set({
          status: 'confirmed',
          depositPaid: db.select({ totalCost: spaceReservations.totalCost }).from(spaceReservations).where(eq(spaceReservations.id, parseInt(id))),
          updatedAt: new Date()
        })
        .where(eq(spaceReservations.id, parseInt(id)))
        .returning();

      if (updatedReservation.length === 0) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      console.log(`💳 Pago confirmado para reserva ${id}`);

      // TODO: Enviar email de confirmación de pago
      // await sendSpacePaymentConfirmationEmail(updatedReservation[0]);

      res.json({
        success: true,
        message: "Pago confirmado exitosamente",
        reservation: updatedReservation[0]
      });

    } catch (error: any) {
      console.error("❌ Error confirmando pago:", error);
      res.status(500).json({ 
        error: "Error confirming payment: " + error.message 
      });
    }
  });

  // Webhook de Stripe para manejar eventos de pago
  app.post("/api/webhooks/stripe/spaces", async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`🔔 Stripe webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          const reservationId = paymentIntent.metadata.reservationId;
          
          if (reservationId && paymentIntent.metadata.reservationType === 'space') {
            // Confirmar el pago en la base de datos
            await db
              .update(spaceReservations)
              .set({
                status: 'confirmed',
                depositPaid: (paymentIntent.amount / 100).toString(),
                updatedAt: new Date()
              })
              .where(eq(spaceReservations.id, parseInt(reservationId)));

            console.log(`✅ Pago webhook procesado para reserva ${reservationId}`);
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          const failedReservationId = failedPayment.metadata.reservationId;
          
          if (failedReservationId && failedPayment.metadata.reservationType === 'space') {
            console.log(`❌ Pago fallido para reserva ${failedReservationId}`);
            // TODO: Manejar pago fallido - notificar al usuario
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      res.status(500).json({ error: 'Error processing webhook' });
    }
  });
}