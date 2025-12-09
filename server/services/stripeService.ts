import Stripe from 'stripe';
import { z } from 'zod';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' as any })
  : null;

if (!stripe) {
  console.warn('⚠️ STRIPE_SECRET_KEY not configured - stripe service will not be available');
}

// Schema para crear un payment intent
export const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('mxn'),
  serviceType: z.enum([
    'activity',
    'event', 
    'space_reservation',
    'concession_fee',
    'sponsorship',
    'permit',
    'maintenance_service',
    'other'
  ]),
  serviceId: z.number(),
  serviceName: z.string(),
  serviceDescription: z.string().optional(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreatePaymentIntentData = z.infer<typeof createPaymentIntentSchema>;

// Función para crear un Payment Intent
export async function createPaymentIntent(data: CreatePaymentIntentData) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convertir a centavos
      currency: data.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: data.customerEmail,
      metadata: {
        service_type: data.serviceType,
        service_id: data.serviceId.toString(),
        service_name: data.serviceName,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone || '',
        ...data.metadata,
      },
      description: `${data.serviceName} - ${data.customerName}`,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Función para confirmar un pago
export async function confirmPayment(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      charges: paymentIntent.charges,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw new Error(`Failed to confirm payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Función para crear un reembolso
export async function createRefund(paymentIntentId: string, amount?: number, reason?: string) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Reembolso parcial o total
      reason: reason as Stripe.RefundCreateParams.Reason,
    });

    return {
      id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
    };
  } catch (error) {
    console.error('Error creating refund:', error);
    throw new Error(`Failed to create refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Función para obtener detalles de un cliente
export async function getCustomer(customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Error retrieving customer:', error);
    throw new Error(`Failed to retrieve customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Función para crear un cliente
export async function createCustomer(data: {
  name: string;
  email: string;
  phone?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const customer = await stripe.customers.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      metadata: data.metadata,
    });

    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Función para procesar webhook de Stripe
export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  endpointSecret: string
) {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    return event;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    throw new Error(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export { stripe };