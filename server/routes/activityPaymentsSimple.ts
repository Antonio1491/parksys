import type { Express } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { emailService } from "../email/emailService";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export function registerActivityPaymentRoutes(app: Express) {
  // Crear payment intent para pago de actividad
  app.post("/api/activities/:activityId/create-payment-intent", async (req, res) => {
    try {
      const activityId = req.params.activityId;
      const { customerData, baseAmount, selectedDiscount, customAmount } = req.body;

      console.log('🌟 GLOBAL POST-JSON:', req.method, req.url);
      console.log('🌟 Body parseado:', JSON.stringify(req.body, null, 2));
      console.log('💰 Descuento seleccionado:', selectedDiscount);

      // Obtener datos de la actividad
      const activities = await storage.getAllActivities();
      const foundActivity = activities.find((a: any) => a.id === parseInt(activityId));
      
      if (!foundActivity) {
        return res.status(404).json({ error: "Actividad no encontrada" });
      }

      console.log('💰 Actividad encontrada:', foundActivity.title);
      console.log('💰 Precio base de actividad:', foundActivity.price);
      console.log('💰 BaseAmount enviado desde frontend:', baseAmount);
      console.log('💰 CustomAmount:', customAmount);

      if (foundActivity.isFree) {
        return res.status(400).json({ error: "Esta actividad es gratuita" });
      }

      // SEGURIDAD: Solo usar customAmount si la actividad permite precios flexibles
      const originalPrice = foundActivity.isPriceRandom ? 
        Math.max(
          foundActivity.minPrice || 0, 
          Math.min(
            foundActivity.maxPrice || 999999, 
            parseFloat(customAmount) || parseFloat(foundActivity.price || "0")
          )
        ) : 
        parseFloat(foundActivity.price || "0");
      
      // Validar y aplicar descuento del lado del servidor
      let discountPercentage = 0;
      let appliedDiscount = null;
      
      if (selectedDiscount) {
        switch (selectedDiscount) {
          case 'seniors':
            if ((foundActivity.discountSeniors || 0) > 0) {
              discountPercentage = foundActivity.discountSeniors;
              appliedDiscount = {
                type: 'seniors',
                label: 'Adultos mayores (65+)',
                percentage: discountPercentage
              };
            }
            break;
          case 'students':
            if ((foundActivity.discountStudents || 0) > 0) {
              discountPercentage = foundActivity.discountStudents;
              appliedDiscount = {
                type: 'students', 
                label: 'Estudiantes',
                percentage: discountPercentage
              };
            }
            break;
          case 'families':
            if ((foundActivity.discountFamilies || 0) > 0) {
              discountPercentage = foundActivity.discountFamilies;
              appliedDiscount = {
                type: 'families',
                label: 'Familias (3+ hijos)',
                percentage: discountPercentage
              };
            }
            break;
          case 'disability':
            if ((foundActivity.discountDisability || 0) > 0) {
              discountPercentage = foundActivity.discountDisability;
              appliedDiscount = {
                type: 'disability',
                label: 'Personas con discapacidad',
                percentage: discountPercentage
              };
            }
            break;
          case 'early_bird':
            // Validar que el descuento early bird esté disponible y no haya expirado
            if ((foundActivity.discountEarlyBird || 0) > 0 && foundActivity.discountEarlyBirdDeadline) {
              const deadlineDate = new Date(foundActivity.discountEarlyBirdDeadline);
              const currentDate = new Date();
              
              if (currentDate <= deadlineDate) {
                discountPercentage = foundActivity.discountEarlyBird;
                appliedDiscount = {
                  type: 'early_bird',
                  label: 'Inscripción temprana',
                  percentage: discountPercentage,
                  deadline: deadlineDate.toISOString()
                };
              } else {
                return res.status(400).json({ 
                  error: "El descuento por inscripción temprana ha expirado" 
                });
              }
            }
            break;
          default:
            return res.status(400).json({ error: "Descuento no válido" });
        }
        
        if (!appliedDiscount) {
          return res.status(400).json({ error: "Descuento no disponible para esta actividad" });
        }
      }

      // Calcular precio final con descuento
      const discountAmount = originalPrice * (discountPercentage / 100);
      const finalPriceInPesos = originalPrice - discountAmount;
      const finalAmount = Math.round(finalPriceInPesos * 100); // Convertir a centavos
      
      console.log('💰 Precio original:', originalPrice);
      console.log('💰 Descuento aplicado:', discountPercentage + '%');
      console.log('💰 Monto de descuento:', discountAmount);
      console.log('💰 Precio final (pesos):', finalPriceInPesos);
      console.log('💰 Final amount (centavos):', finalAmount);
      
      console.log('💰 Final amount calculado (centavos):', finalAmount);
      console.log('💰 Final amount en pesos (para verificación):', finalAmount / 100);

      // Crear customer en Stripe si se proporcionan datos
      let customerId;
      if (customerData?.email) {
        try {
          const customer = await stripe.customers.create({
            email: customerData.email,
            name: customerData.fullName,
            metadata: {
              activityId: activityId,
            }
          });
          customerId = customer.id;
        } catch (error) {
          console.warn("Error creating Stripe customer:", error);
        }
      }

      // Crear payment intent con metadatos de auditoría (SEGURIDAD: Prevenir manipulación)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: finalAmount,
        currency: "mxn",
        customer: customerId,
        metadata: {
          activityId: activityId,
          activityTitle: foundActivity.title,
          // Metadatos de auditoría para prevenir manipulación del cliente
          discount_type: appliedDiscount?.type || 'none',
          discount_percentage: (discountPercentage || 0).toString(),
          original_price: originalPrice.toString(),
          final_price: finalPriceInPesos.toString(),
          discount_amount: discountAmount.toString()
        },
        description: `Pago por actividad: ${foundActivity.title}`,
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customerId: customerId,
        amount: finalAmount / 100,
        currency: 'mxn',
        // Información del descuento aplicado para auditoría
        appliedDiscount: appliedDiscount,
        priceBreakdown: {
          originalPrice: originalPrice,
          discountAmount: discountAmount,
          finalPrice: finalPriceInPesos
        }
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        error: "Error procesando el pago: " + error.message 
      });
    }
  });

  // Completar registro después de pago exitoso
  app.post("/api/activities/:activityId/complete-payment-registration", async (req, res) => {
    try {
      const { activityId } = req.params;
      const { paymentIntentId, customerData, baseAmount, selectedDiscount, finalAmount } = req.body;

      console.log('🎯 Completando registro después de pago exitoso');
      console.log('🎯 PaymentIntentId:', paymentIntentId);
      console.log('🎯 CustomerData:', customerData);
      console.log('🎯 Descuento aplicado:', selectedDiscount);

      // Verificar el payment intent con Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          error: "El pago no ha sido completado exitosamente" 
        });
      }

      // SEGURIDAD: Validar enlace entre PaymentIntent y actividad (prevenir reutilización cruzada)
      if (paymentIntent.currency !== 'mxn') {
        return res.status(400).json({ 
          error: "Moneda de pago inválida" 
        });
      }

      if (paymentIntent.metadata?.activityId !== activityId) {
        return res.status(400).json({ 
          error: "El pago no corresponde a esta actividad" 
        });
      }

      // Validar coherencia entre monto pagado y metadata (prevenir manipulación)
      if (paymentIntent.metadata?.final_price) {
        const expectedAmount = Math.round(parseFloat(paymentIntent.metadata.final_price) * 100);
        if (Math.abs(paymentIntent.amount - expectedAmount) > 1) { // Tolerancia de 1 centavo para redondeo
          console.error('💥 Mismatch entre amount y metadata:', {
            paymentAmount: paymentIntent.amount,
            expectedAmount: expectedAmount,
            metadata: paymentIntent.metadata.final_price
          });
          return res.status(400).json({ 
            error: "Inconsistencia en el monto del pago" 
          });
        }
      }

      // Obtener datos de la actividad
      const activities = await storage.getAllActivities();
      const foundActivity = activities.find((a: any) => a.id === parseInt(activityId));
      if (!foundActivity) {
        return res.status(404).json({ error: "Actividad no encontrada" });
      }

      // Crear el registro de inscripción
      const registrationData = {
        activityId: parseInt(activityId),
        participantName: customerData.fullName,
        participantEmail: customerData.email,
        participantPhone: customerData.phone,
        participantAge: customerData.age || '',
        emergencyContact: customerData.emergencyContact || '',
        emergencyPhone: customerData.emergencyPhone || '',
        medicalConditions: customerData.medicalConditions || '',
        additionalNotes: customerData.additionalNotes || '',
        status: foundActivity.requiresApproval ? 'pending' : 'approved',
        paymentStatus: 'paid',
        stripePaymentIntentId: paymentIntentId,
        stripeCustomerId: paymentIntent.customer as string || null,
        paidAmount: (paymentIntent.amount / 100).toString(),
        paymentDate: new Date(),
        registrationDate: new Date()
      };

      console.log('🎯 Creando registro de inscripción con pago:', registrationData);

      // Crear el registro usando Drizzle ORM
      const { db } = await import("../db");
      const { activityRegistrations } = await import("../../shared/schema");
      
      // Usar execute_sql_tool para insertar directamente
      const { sql } = await import("drizzle-orm");
      
      // SEGURIDAD: Leer metadatos de auditoría del PaymentIntent (no confiar en cliente)
      const discountInfo = paymentIntent.metadata ? {
        type: paymentIntent.metadata.discount_type || null,
        percentage: parseInt(paymentIntent.metadata.discount_percentage || '0'),
        originalAmount: paymentIntent.metadata.original_price || null,
        discountAmount: paymentIntent.metadata.discount_amount || null
      } : null;

      // SEGURIDAD: Verificar existencia de columnas de descuento antes de insertar
      let hasDiscountColumns = false;
      try {
        const columnCheck = await db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'activity_registrations' 
          AND column_name IN ('applied_discount_type', 'applied_discount_percentage', 'original_amount', 'discount_amount')
        `);
        hasDiscountColumns = columnCheck.rows && columnCheck.rows.length === 4;
      } catch (error) {
        console.warn('⚠️ No se pudieron verificar columnas de descuento:', error);
        hasDiscountColumns = false;
      }

      // Construir INSERT dinámicamente según columnas disponibles
      let insertResult;
      if (hasDiscountColumns) {
        // Insertar con campos de auditoría de descuentos
        insertResult = await db.execute(sql`
          INSERT INTO activity_registrations (
            activity_id, participant_name, participant_email, participant_phone, 
            age, emergency_contact_name, emergency_phone, medical_conditions, 
            notes, status, stripe_payment_intent_id, 
            stripe_customer_id, paid_amount, payment_date, accepts_terms, registration_date,
            applied_discount_type, applied_discount_percentage, original_amount, discount_amount
          ) 
          VALUES (
            ${registrationData.activityId}, 
            ${registrationData.participantName}, 
            ${registrationData.participantEmail}, 
            ${registrationData.participantPhone}, 
            ${customerData.age || null}, 
            ${registrationData.emergencyContact || null}, 
            ${registrationData.emergencyPhone || null}, 
            ${registrationData.medicalConditions || null}, 
            ${registrationData.additionalNotes || null}, 
            ${foundActivity.requiresApproval ? 'pending' : 'approved'}, 
            ${registrationData.stripePaymentIntentId}, 
            ${registrationData.stripeCustomerId}, 
            ${registrationData.paidAmount}, 
            ${registrationData.paymentDate}, 
            ${true}, 
            ${new Date()},
            ${discountInfo?.type || null},
            ${discountInfo?.percentage || null},
            ${discountInfo?.originalAmount || null},
            ${discountInfo?.discountAmount || null}
          )
          RETURNING id, participant_name, status
        `);
        console.log('✅ Registro creado con auditoría de descuentos');
      } else {
        // Insertar sin campos de descuento (hasta que se actualice el schema)
        insertResult = await db.execute(sql`
          INSERT INTO activity_registrations (
            activity_id, participant_name, participant_email, participant_phone, 
            age, emergency_contact_name, emergency_phone, medical_conditions, 
            notes, status, stripe_payment_intent_id, 
            stripe_customer_id, paid_amount, payment_date, accepts_terms, registration_date
          ) 
          VALUES (
            ${registrationData.activityId}, 
            ${registrationData.participantName}, 
            ${registrationData.participantEmail}, 
            ${registrationData.participantPhone}, 
            ${customerData.age || null}, 
            ${registrationData.emergencyContact || null}, 
            ${registrationData.emergencyPhone || null}, 
            ${registrationData.medicalConditions || null}, 
            ${registrationData.additionalNotes || null}, 
            ${foundActivity.requiresApproval ? 'pending' : 'approved'}, 
            ${registrationData.stripePaymentIntentId}, 
            ${registrationData.stripeCustomerId}, 
            ${registrationData.paidAmount}, 
            ${registrationData.paymentDate}, 
            ${true}, 
            ${new Date()}
          )
          RETURNING id, participant_name, status
        `);
        console.warn('⚠️ Registro creado sin campos de auditoría - actualizar schema para habilitar auditoría completa');
        console.log('🔒 Datos de auditoría preservados en PaymentIntent metadata:', discountInfo);
      }
      
      const newRegistration = insertResult.rows[0] || { id: 'generated' };

      console.log('✅ Registro creado con ID:', newRegistration.id);

      // Enviar email de confirmación de pago usando la plantilla #13
      try {
        // Importar el servicio de email de comunicaciones
        const emailModule = await import("../communications/emailQueueService");
        const service = emailModule.emailQueueService;
        
        const emailVariables = {
          participantName: registrationData.participantName,
          activityTitle: foundActivity.title,
          parkName: foundActivity.parkName || 'Parque Municipal',
          activityStartDate: new Date(foundActivity.startDate).toLocaleDateString('es-MX'),
          activityStartTime: foundActivity.startTime || '10:00',
          activityLocation: foundActivity.location || 'Por confirmar',
          paymentAmount: (paymentIntent.amount / 100).toFixed(2),
          stripePaymentId: paymentIntent.id,
          paymentMethod: 'Tarjeta de Crédito/Débito',
          paymentDate: new Date().toLocaleDateString('es-MX')
        };

        console.log('📧 Enviando email de confirmación de pago con plantilla #13:', emailVariables);
        
        await service.addToQueue({
          to: customerData.email,
          subject: 'Confirmación de Pago - Actividad',
          templateId: 13, // ID de la plantilla "Confirmación de Pago - Actividad"
          templateVariables: emailVariables
        });
        
        console.log('✅ Email de confirmación de pago enviado exitosamente');
      } catch (emailError) {
        console.error('❌ Error enviando email de confirmación de pago:', emailError);
        // No fallar la transacción por error de email
      }

      res.json({ 
        success: true, 
        registration: newRegistration,
        paymentAmount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        message: 'Registro completado exitosamente con pago confirmado'
      });

    } catch (error: any) {
      console.error("❌ Error completando registro con pago:", error);
      res.status(500).json({ 
        error: "Error completando el registro: " + error.message 
      });
    }
  });
}

// La función sendPaymentConfirmationEmail ha sido reemplazada por el sistema de plantillas
// Ahora se usa la plantilla #13 "Confirmación de Pago - Actividad" con sendTemplateEmail