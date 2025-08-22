import { Router } from 'express';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { emailService } from '../email/emailService';
import { emailQueueService } from '../communications/emailQueueService';

const router = Router();
const sql = neon(process.env.DATABASE_URL!);

// Schema de validación para inscripción
const registrationSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

// Función auxiliar para enviar correo de confirmación de inscripción a eventos
async function sendEventRegistrationConfirmationEmail(registration: any, event: any) {
  try {
    console.log('📧 Enviando correo de confirmación de inscripción a evento...');
    console.log('📧 Email destinatario:', registration.participant_email);
    console.log('📧 Nombre participante:', registration.participant_name);
    console.log('📧 Evento:', event.title);
    
    const subject = `✅ Confirmación de Inscripción - ${event.title}`;
    
    const htmlContent = `
      <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;'>
        <div style='background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>
          <div style='text-align: center; margin-bottom: 30px;'>
            <h1 style='color: #16a34a; margin: 0; font-size: 28px;'>🎯 ParkSys</h1>
          </div>
          
          <h2 style='color: #333; text-align: center; margin-bottom: 30px;'>¡Inscripción al Evento Recibida!</h2>
          
          <div style='background-color: #f0f9ff; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;'>
            <p style='margin: 0; color: #333; font-size: 16px;'>
              <strong>Hola ${registration.participant_name},</strong>
            </p>
            <p style='margin: 10px 0 0 0; color: #666;'>
              Hemos recibido tu inscripción para el evento <strong>${event.title}</strong> 
              ${event.requires_approval ? ' y está siendo revisada por nuestro equipo' : ' y ha sido confirmada'}.
            </p>
          </div>
          
          <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
            <h3 style='color: #16a34a; margin-top: 0;'>Detalles del Evento:</h3>
            <ul style='list-style: none; padding: 0; margin: 0;'>
              <li style='padding: 8px 0; border-bottom: 1px solid #e2e8f0;'><strong>🎯 Evento:</strong> ${event.title}</li>
              <li style='padding: 8px 0; border-bottom: 1px solid #e2e8f0;'><strong>🏛️ Ubicación:</strong> ${event.location || 'Por confirmar'}</li>
              <li style='padding: 8px 0; border-bottom: 1px solid #e2e8f0;'><strong>📅 Fecha:</strong> ${format(new Date(event.start_date), 'dd/MM/yyyy', { locale: es })}</li>
              <li style='padding: 8px 0; border-bottom: 1px solid #e2e8f0;'><strong>⏰ Hora:</strong> ${event.start_time || 'Por confirmar'}</li>
              <li style='padding: 8px 0; border-bottom: 1px solid #e2e8f0;'><strong>👤 Organizador:</strong> ${event.organizer_name || 'Por confirmar'}</li>
              <li style='padding: 8px 0;'><strong>📧 Contacto:</strong> ${event.organizer_email || 'Por confirmar'}</li>
            </ul>
          </div>
          
          <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
            <h3 style='color: #16a34a; margin-top: 0;'>Tus Datos:</h3>
            <ul style='list-style: none; padding: 0; margin: 0;'>
              <li style='padding: 8px 0; border-bottom: 1px solid #e2e8f0;'><strong>👤 Nombre:</strong> ${registration.participant_name}</li>
              <li style='padding: 8px 0; border-bottom: 1px solid #e2e8f0;'><strong>📧 Email:</strong> ${registration.participant_email}</li>
              <li style='padding: 8px 0;'><strong>📱 Teléfono:</strong> ${registration.participant_phone || 'No proporcionado'}</li>
            </ul>
          </div>
          
          ${event.requires_approval ? `
          <div style='background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;'>
            <p style='margin: 0; color: #92400e; font-size: 14px;'>
              <strong>ℹ️ Pendiente de Aprobación:</strong> Tu inscripción será revisada y recibirás otro correo con la confirmación final.
            </p>
          </div>
          ` : `
          <div style='background-color: #dcfce7; border: 1px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0;'>
            <p style='margin: 0; color: #166534; font-size: 14px;'>
              <strong>✅ Inscripción Confirmada:</strong> ¡Ya estás registrado para este evento!
            </p>
          </div>
          `}
          
          <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;'>
            <p style='color: #666; font-size: 14px; margin: 0;'>
              Sistema de Gestión de Parques Urbanos<br>
              Fecha de inscripción: ${format(new Date(registration.registration_date), 'dd/MM/yyyy HH:mm', { locale: es })}
            </p>
          </div>
        </div>
      </div>
    `;
    
    // Agregar email a la cola
    const emailData = {
      to: registration.participant_email,
      subject: subject,
      htmlContent: htmlContent,
      textContent: `Hola ${registration.participant_name}, hemos recibido tu inscripción para ${event.title}. ${event.requires_approval ? 'Está siendo revisada.' : 'Ha sido confirmada.'}`,
      templateId: 15225, // Usar el mismo template que actividades
      priority: 'normal' as const,
      metadata: {
        module: 'Eventos',
        participant_name: registration.participant_name,
        event_title: event.title,
        event_date: format(new Date(event.start_date), 'dd/MM/yyyy', { locale: es }),
        start_time: event.start_time,
        location: event.location,
        organizer_name: event.organizer_name,
        requires_approval: event.requires_approval
      }
    };

    const result = await emailQueueService.addToQueue(emailData);
    if (result) {
      console.log('✅ Correo de confirmación de evento agregado a la cola exitosamente para:', registration.participant_email);
    } else {
      console.error('❌ Fallo al agregar correo de confirmación de evento a la cola para:', registration.participant_email);
    }
    return result;
  } catch (error) {
    console.error('❌ Error enviando correo de confirmación de evento:', error);
    return false;
  }
}

// GET /api/events/:id/registrations - Obtener inscripciones de un evento
router.get('/:eventId/registrations', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.query;

    let query = `
      SELECT 
        er.*,
        e.title as event_title,
        e.start_date as event_start_date,
        e.location as event_location,
        e.organizer_name as event_organizer_name
      FROM event_registrations er
      LEFT JOIN events e ON er.event_id = e.id
      WHERE er.event_id = $1
    `;
    
    const params = [eventId];

    if (status) {
      query += ` AND er.status = $${params.length + 1}`;
      params.push(status as string);
    }

    query += ` ORDER BY er.registration_date DESC`;

    const registrations = await sql(query, params);

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    console.error('Error obteniendo inscripciones del evento:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/events/:id/register - Inscribirse a un evento
router.post('/:eventId/register', async (req, res) => {
  try {
    const { eventId } = req.params;
    const validatedData = registrationSchema.parse(req.body);

    // Obtener información del evento
    const eventData = await sql`
      SELECT 
        id, title, start_date, end_date, start_time, end_time, 
        location, capacity, registration_type, requires_approval,
        organizer_name, organizer_email, organizer_phone,
        price, is_free
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

    // Verificar si las inscripciones están habilitadas
    if (event.registration_type !== 'registration') {
      return res.status(400).json({
        success: false,
        error: 'Las inscripciones no están habilitadas para este evento'
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
      WHERE event_id = ${eventId} AND (email = ${validatedData.email} OR participant_email = ${validatedData.email})
    `;

    if (existingRegistration.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ya estás inscrito en este evento'
      });
    }

    // Determinar status inicial
    const initialStatus = event.requires_approval ? 'pending' : 'confirmed';

    // Insertar inscripción
    const registrationResult = await sql`
      INSERT INTO event_registrations (
        event_id, full_name, email, phone,
        notes, status, registration_date, payment_status,
        participant_name, participant_email, participant_phone
      ) VALUES (
        ${eventId}, ${validatedData.fullName}, ${validatedData.email}, 
        ${validatedData.phone || null}, ${validatedData.notes || null}, 
        ${initialStatus}, NOW(), 'pending',
        ${validatedData.fullName}, ${validatedData.email}, ${validatedData.phone || null}
      ) RETURNING *
    `;

    const registration = registrationResult[0];

    // Enviar correo de confirmación
    await sendEventRegistrationConfirmationEmail(registration, event);

    res.status(201).json({
      success: true,
      data: registration,
      message: event.requires_approval 
        ? 'Inscripción enviada. Recibirás una confirmación por correo cuando sea aprobada.'
        : 'Inscripción confirmada. Recibirás un correo de confirmación.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    
    console.error('Error en inscripción a evento:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/events/:id/registrations/:registrationId/status - Actualizar estado de inscripción
router.put('/:eventId/registrations/:registrationId/status', async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;
    const { status } = req.body;

    if (!['confirmed', 'cancelled', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }

    const result = await sql`
      UPDATE event_registrations 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${registrationId} AND event_id = ${eventId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inscripción no encontrada'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error actualizando estado de inscripción:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/events/:id/registrations/:registrationId - Cancelar inscripción
router.delete('/:eventId/registrations/:registrationId', async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;

    const result = await sql`
      DELETE FROM event_registrations 
      WHERE id = ${registrationId} AND event_id = ${eventId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inscripción no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Inscripción cancelada exitosamente'
    });

  } catch (error) {
    console.error('Error cancelando inscripción:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/events/:id/registrations/summary - Resumen de inscripciones
router.get('/:eventId/registrations/summary', async (req, res) => {
  try {
    const { eventId } = req.params;

    const summaryData = await sql`
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as payment_pending
      FROM event_registrations 
      WHERE event_id = ${eventId}
    `;

    const eventData = await sql`
      SELECT capacity FROM events WHERE id = ${eventId}
    `;

    const summary = summaryData[0];
    const event = eventData[0];

    res.json({
      success: true,
      data: {
        ...summary,
        capacity: event?.capacity || null,
        available_spots: event?.capacity ? event.capacity - parseInt(summary.confirmed) : null
      }
    });

  } catch (error) {
    console.error('Error obteniendo resumen de inscripciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;