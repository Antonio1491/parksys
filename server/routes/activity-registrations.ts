import { Router } from 'express';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { emailService } from '../email/emailService';
import { emailQueueService } from '../communications/emailQueueService';

const router = Router();
const sql = neon(process.env.DATABASE_URL!);

// Función auxiliar para enviar correo de confirmación de inscripción
async function sendRegistrationConfirmationEmail(registration: any, activity: any) {
  try {
    console.log('📧 Enviando correo de confirmación de inscripción...');
    console.log('📧 Email destinatario:', registration.participant_email);
    console.log('📧 Nombre participante:', registration.participant_name);
    console.log('📧 Actividad:', activity.title);
    
    const subject = `✅ Confirmación de Inscripción - ${activity.title}`;
    
    const htmlContent = `
      <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;'>
        <div style='background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>
          <div style='text-align: center; margin-bottom: 30px;'>
            <h1 style='color: #16a34a; margin: 0; font-size: 28px;'>🎯 ParkSys</h1>
          </div>
          
          <h2 style='color: #333; text-align: center; margin-bottom: 30px;'>¡Inscripción Recibida!</h2>
          
          <div style='background-color: #f0f9ff; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;'>
            <p style='margin: 0; color: #333; font-size: 16px;'>
              <strong>Hola ${registration.participant_name},</strong>
            </p>
            <p style='margin: 10px 0 0 0; color: #666;'>
              Hemos recibido tu inscripción para la actividad <strong>${activity.title}</strong> 
              ${activity.requires_approval ? ' y está siendo revisada por nuestro equipo' : ' y ha sido confirmada'}.
            </p>
          </div>
          
          <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
            <h3 style='color: #16a34a; margin-top: 0;'>Detalles de la Actividad:</h3>
            <ul style='list-style: none; padding: 0; margin: 0;'>
              <li style='padding: 8px 0; border-bottom: 1px solid #e2e8f0;'><strong>📍 Actividad:</strong> ${activity.title}</li>
              <li style='padding: 8px 0; border-bottom: 1px solid #e2e8f0;'><strong>🏛️ Parque:</strong> ${activity.park_name || 'Por confirmar'}</li>
              <li style='padding: 8px 0; border-bottom: 1px solid #e2e8f0;'><strong>📅 Fecha:</strong> ${format(new Date(activity.start_date), 'dd/MM/yyyy', { locale: es })}</li>
              <li style='padding: 8px 0; border-bottom: 1px solid #e2e8f0;'><strong>⏰ Hora:</strong> ${activity.start_time || 'Por confirmar'}</li>
              <li style='padding: 8px 0;'><strong>📍 Ubicación:</strong> ${activity.location || 'Por confirmar'}</li>
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
          
          ${activity.requires_approval ? `
          <div style='background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;'>
            <p style='margin: 0; color: #92400e; font-size: 14px;'>
              <strong>ℹ️ Pendiente de Aprobación:</strong> Tu inscripción será revisada y recibirás otro correo con la confirmación final.
            </p>
          </div>
          ` : `
          <div style='background-color: #dcfce7; border: 1px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0;'>
            <p style='margin: 0; color: #166534; font-size: 14px;'>
              <strong>✅ Inscripción Confirmada:</strong> ¡Ya estás registrado para esta actividad!
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
    
    // Agregar email a la cola en lugar de envío directo
    const emailData = {
      to: registration.participant_email,
      subject: subject,
      htmlContent: htmlContent,
      textContent: `Hola ${registration.participant_name}, hemos recibido tu inscripción para ${activity.title}. ${activity.requires_approval ? 'Está siendo revisada.' : 'Ha sido confirmada.'}`,
      templateId: 15225, // ID de la plantilla "Confirmación de Inscripción - Actividad"
      priority: 'normal' as const,
      metadata: {
        module: 'Actividades',
        participant_name: registration.participant_name,
        activity_title: activity.title,
        activity_date: format(new Date(activity.start_date), 'dd/MM/yyyy', { locale: es }),
        start_time: activity.start_time,
        park_name: activity.park_name,
        location: activity.location,
        requires_approval: activity.requires_approval
      }
    };

    const result = await emailQueueService.addToQueue(emailData);
    if (result) {
      console.log('✅ Correo de confirmación agregado a la cola exitosamente para:', registration.participant_email);
    } else {
      console.error('❌ Fallo al agregar correo de confirmación a la cola para:', registration.participant_email);
    }
    return result;
  } catch (error) {
    console.error('❌ Error enviando correo de confirmación:', error);
    return false;
  }
}

// Función auxiliar para enviar correo de aprobación de inscripción
async function sendRegistrationApprovalEmail(registration: any, activity: any) {
  try {
    console.log('📧 Enviando correo de aprobación de inscripción...');
    
    const subject = `🎉 ¡Inscripción Aprobada! - ${activity.title}`;
    
    const htmlContent = `
      <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;'>
        <div style='background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>
          <div style='text-align: center; margin-bottom: 30px;'>
            <h1 style='color: #16a34a; margin: 0; font-size: 28px;'>🎯 ParkSys</h1>
          </div>
          
          <div style='text-align: center; margin-bottom: 30px;'>
            <div style='font-size: 48px; margin-bottom: 15px;'>🎉</div>
            <h2 style='color: #16a34a; margin: 0; font-size: 24px;'>¡Tu Inscripción Ha Sido Aprobada!</h2>
          </div>
          
          <div style='background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;'>
            <p style='margin: 0; color: #333; font-size: 16px;'>
              <strong>¡Excelente noticia, ${registration.participant_name}!</strong>
            </p>
            <p style='margin: 10px 0 0 0; color: #666;'>
              Tu inscripción para <strong>${activity.title}</strong> ha sido aprobada oficialmente. 
              ¡Ya tienes tu lugar reservado!
            </p>
          </div>
          
          <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
            <h3 style='color: #16a34a; margin-top: 0;'>📋 Detalles de tu Actividad:</h3>
            <ul style='list-style: none; padding: 0; margin: 0;'>
              <li style='padding: 10px 0; border-bottom: 1px solid #e2e8f0;'><strong>🎯 Actividad:</strong> ${activity.title}</li>
              <li style='padding: 10px 0; border-bottom: 1px solid #e2e8f0;'><strong>🏛️ Parque:</strong> ${activity.park_name || 'Por confirmar'}</li>
              <li style='padding: 10px 0; border-bottom: 1px solid #e2e8f0;'><strong>📅 Fecha:</strong> ${format(new Date(activity.start_date), 'dd/MM/yyyy', { locale: es })}</li>
              <li style='padding: 10px 0; border-bottom: 1px solid #e2e8f0;'><strong>⏰ Hora:</strong> ${activity.start_time || 'Por confirmar'}</li>
              <li style='padding: 10px 0;'><strong>📍 Ubicación:</strong> ${activity.location || 'Por confirmar'}</li>
            </ul>
          </div>
          
          <div style='background-color: #dbeafe; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;'>
            <h3 style='color: #1d4ed8; margin-top: 0;'>📝 Instrucciones Importantes:</h3>
            <ul style='color: #1e40af; margin: 0; padding-left: 20px;'>
              <li style='margin-bottom: 8px;'>Llega <strong>15 minutos antes</strong> de la hora programada</li>
              <li style='margin-bottom: 8px;'>Trae ropa cómoda y adecuada para la actividad</li>
              <li style='margin-bottom: 8px;'>Si tienes alguna condición médica, avísanos al llegar</li>
              <li>En caso de cancelación, avísanos con <strong>24 horas de anticipación</strong></li>
            </ul>
          </div>
          
          <div style='background-color: #dcfce7; border: 1px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;'>
            <p style='margin: 0; color: #166534; font-size: 16px;'>
              <strong>✅ Estado: CONFIRMADO</strong><br>
              <span style='font-size: 14px;'>Aprobado el ${format(new Date(registration.approved_at || new Date()), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
            </p>
          </div>
          
          <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;'>
            <p style='color: #666; font-size: 14px; margin: 0;'>
              ¡Nos vemos pronto!<br>
              Sistema de Gestión de Parques Urbanos
            </p>
          </div>
        </div>
      </div>
    `;
    
    // Agregar email a la cola en lugar de envío directo
    const emailData = {
      to: registration.participant_email,
      subject: subject,
      htmlContent: htmlContent,
      textContent: `¡Hola ${registration.participant_name}! Tu inscripción para ${activity.title} ha sido aprobada. Nos vemos el ${format(new Date(activity.start_date), 'dd/MM/yyyy', { locale: es })} a las ${activity.start_time || 'hora por confirmar'}.`,
      templateId: 15226, // ID de la plantilla "Aprobación de Inscripción - Actividad"
      priority: 'high' as const,
      metadata: {
        module: 'Actividades',
        participant_name: registration.participant_name,
        activity_title: activity.title,
        activity_date: format(new Date(activity.start_date), 'dd/MM/yyyy', { locale: es }),
        start_time: activity.start_time,
        park_name: activity.park_name,
        location: activity.location,
        approved_at: registration.approved_at
      }
    };

    const result = await emailQueueService.addToQueue(emailData);
    console.log('✅ Correo de aprobación agregado a la cola exitosamente');
    return result;
  } catch (error) {
    console.error('❌ Error enviando correo de aprobación:', error);
    return false;
  }
}

// Obtener todas las inscripciones con paginación y filtros
router.get('/', async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      search = '', 
      status = '', 
      activity = '',
      year = '',
      month = '',
      startDate = '',
      endDate = ''
    } = req.query;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereConditions = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Filtro de búsqueda
    if (search) {
      whereConditions.push(`(
        ar.participant_name ILIKE $${paramIndex} OR 
        ar.participant_email ILIKE $${paramIndex} OR
        a.title ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro de estado
    if (status) {
      whereConditions.push(`ar.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Filtro de actividad
    if (activity) {
      whereConditions.push(`ar.activity_id = $${paramIndex}`);
      queryParams.push(parseInt(activity as string));
      paramIndex++;
    }

    // Filtros de fechas
    if (year) {
      whereConditions.push(`EXTRACT(YEAR FROM ar.registration_date) = $${paramIndex}`);
      queryParams.push(parseInt(year as string));
      paramIndex++;
    }

    if (month && year) {
      whereConditions.push(`EXTRACT(MONTH FROM ar.registration_date) = $${paramIndex}`);
      queryParams.push(parseInt(month as string));
      paramIndex++;
    }

    // Filtro de rango de fechas personalizado
    if (startDate) {
      whereConditions.push(`ar.registration_date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`ar.registration_date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Consulta principal con JOIN a activities y parks
    const registrationsQuery = `
      SELECT 
        ar.*,
        a.title as activity_title,
        a.start_date as activity_start_date,
        a.end_date as activity_end_date,
        a.start_time as activity_start_time,
        a.end_time as activity_end_time,
        a.location as activity_location,
        a.max_registrations as activity_max_registrations,
        p.name as park_name
      FROM activity_registrations ar
      LEFT JOIN activities a ON ar.activity_id = a.id
      LEFT JOIN parks p ON a.park_id = p.id
      WHERE ${whereClause}
      ORDER BY ar.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Consulta de conteo total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activity_registrations ar
      LEFT JOIN activities a ON ar.activity_id = a.id
      WHERE ${whereClause}
    `;

    const [registrations, totalResult] = await Promise.all([
      sql(registrationsQuery, [...queryParams, parseInt(limit as string), offset]),
      sql(countQuery, queryParams)
    ]);

    const total = parseInt(totalResult[0].total);
    const totalPages = Math.ceil(total / parseInt(limit as string));

    // Formatear los datos de respuesta
    const formattedRegistrations = registrations.map((reg: any) => ({
      id: reg.id,
      activityId: reg.activity_id,
      participantName: reg.participant_name,
      participantEmail: reg.participant_email,
      participantPhone: reg.participant_phone,
      age: reg.age,
      emergencyContactName: reg.emergency_contact_name,
      emergencyPhone: reg.emergency_phone,
      medicalConditions: reg.medical_conditions,
      dietaryRestrictions: reg.dietary_restrictions,
      status: reg.status,
      registrationDate: reg.registration_date,
      approvedBy: reg.approved_by,
      approvedAt: reg.approved_at,
      rejectionReason: reg.rejection_reason,
      notes: reg.notes,
      acceptsTerms: reg.accepts_terms,
      createdAt: reg.created_at,
      updatedAt: reg.updated_at,
      activity: {
        id: reg.activity_id,
        title: reg.activity_title,
        startDate: reg.activity_start_date,
        endDate: reg.activity_end_date,
        startTime: reg.activity_start_time,
        endTime: reg.activity_end_time,
        location: reg.activity_location,
        maxRegistrations: reg.activity_max_registrations,
        park: reg.park_name ? { name: reg.park_name } : null
      }
    }));

    res.json({
      registrations: formattedRegistrations,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error al obtener inscripciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nueva inscripción
router.post('/', async (req, res) => {
  try {
    const {
      activityId,
      participantName,
      participantEmail,
      participantPhone,
      age,
      emergencyContactName,
      emergencyPhone,
      medicalConditions,
      dietaryRestrictions,
      notes,
      acceptsTerms
    } = req.body;

    // Validaciones básicas
    if (!activityId || !participantName || !participantEmail) {
      return res.status(400).json({ 
        error: 'Los campos activityId, participantName y participantEmail son obligatorios' 
      });
    }

    if (!acceptsTerms) {
      return res.status(400).json({ 
        error: 'Debe aceptar los términos y condiciones' 
      });
    }

    // Verificar si la actividad existe y permite inscripciones
    const activityCheck = await sql(`
      SELECT id, registration_enabled, max_registrations, registration_deadline
      FROM activities 
      WHERE id = $1 AND registration_enabled = true
    `, [activityId]);

    if (activityCheck.length === 0) {
      return res.status(404).json({ 
        error: 'La actividad no existe o no permite inscripciones públicas' 
      });
    }

    const activity = activityCheck[0];

    // Verificar fecha límite de inscripción
    if (activity.registration_deadline) {
      const deadlineDate = new Date(activity.registration_deadline);
      const now = new Date();
      if (now > deadlineDate) {
        return res.status(400).json({ 
          error: 'La fecha límite de inscripción ha expirado' 
        });
      }
    }

    // Verificar capacidad máxima
    if (activity.max_registrations) {
      const currentRegistrations = await sql(`
        SELECT COUNT(*) as count 
        FROM activity_registrations 
        WHERE activity_id = $1 AND status IN ('pending', 'approved')
      `, [activityId]);

      if (parseInt(currentRegistrations[0].count) >= activity.max_registrations) {
        return res.status(400).json({ 
          error: 'La actividad ha alcanzado su capacidad máxima' 
        });
      }
    }

    // Verificar si el email ya está registrado para esta actividad
    const existingRegistration = await sql(`
      SELECT id FROM activity_registrations 
      WHERE activity_id = $1 AND participant_email = $2
    `, [activityId, participantEmail]);

    if (existingRegistration.length > 0) {
      return res.status(400).json({ 
        error: 'Este email ya está registrado para esta actividad' 
      });
    }

    // Crear la inscripción
    const result = await sql(`
      INSERT INTO activity_registrations (
        activity_id, participant_name, participant_email, participant_phone,
        age, emergency_contact_name, emergency_phone, medical_conditions,
        dietary_restrictions, notes, accepts_terms, status, registration_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      activityId, participantName, participantEmail, participantPhone,
      age, emergencyContactName, emergencyPhone, medicalConditions,
      dietaryRestrictions, notes, acceptsTerms
    ]);

    const newRegistration = result[0];

    // Obtener datos completos de la actividad para el correo
    const activityData = await sql(`
      SELECT a.*, p.name as park_name
      FROM activities a
      LEFT JOIN parks p ON a.park_id = p.id
      WHERE a.id = $1
    `, [activityId]);

    // Enviar correo de confirmación automáticamente
    if (activityData.length > 0) {
      try {
        await sendRegistrationConfirmationEmail(newRegistration, activityData[0]);
      } catch (emailError) {
        console.error('❌ Error enviando email de confirmación:', emailError);
        // No falla la operación si el email falla
      }
    }

    res.status(201).json({
      message: 'Inscripción creada exitosamente. Se enviará un correo de confirmación a su email.',
      registration: newRegistration
    });
  } catch (error) {
    console.error('Error al crear inscripción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar estado de inscripción (aprobar/rechazar)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Estado debe ser "approved" o "rejected"' 
      });
    }

    // Verificar que la inscripción existe
    const existingRegistration = await sql(`
      SELECT * FROM activity_registrations WHERE id = $1
    `, [id]);

    if (existingRegistration.length === 0) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    // Actualizar el estado
    let updateQuery = `
      UPDATE activity_registrations 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
    `;
    let queryParams = [status];

    if (status === 'approved') {
      updateQuery += `, approved_at = CURRENT_TIMESTAMP, approved_by = $2`;
      queryParams.push(1); // TODO: usar ID del usuario autenticado
    } else if (status === 'rejected' && rejectionReason) {
      updateQuery += `, rejection_reason = $2`;
      queryParams.push(rejectionReason);
    }

    updateQuery += ` WHERE id = $${queryParams.length + 1} RETURNING *`;
    queryParams.push(id);

    const result = await sql(updateQuery, queryParams);
    const updatedRegistration = result[0];

    // Si la inscripción fue aprobada, enviar correo de aprobación
    if (status === 'approved') {
      // Obtener dados completos de la actividad para el correo
      const activityData = await sql(`
        SELECT a.*, p.name as park_name
        FROM activities a
        LEFT JOIN parks p ON a.park_id = p.id
        WHERE a.id = $1
      `, [updatedRegistration.activity_id]);

      if (activityData.length > 0) {
        setTimeout(async () => {
          await sendRegistrationApprovalEmail(updatedRegistration, activityData[0]);
        }, 1000);
      }
    }

    res.json({
      message: `Inscripción ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente${status === 'approved' ? '. Se enviará un correo de confirmación al participante.' : ''}`,
      registration: updatedRegistration
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de inscripciones para una actividad
router.get('/stats/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;

    const stats = await sql(`
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN status IN ('approved', 'pending') THEN 1 END) as total_active
      FROM activity_registrations 
      WHERE activity_id = $1
    `, [activityId]);

    const result = stats[0] || {
      total_registrations: 0,
      approved_count: 0,
      pending_count: 0,
      rejected_count: 0,
      total_active: 0
    };

    res.json({
      totalRegistrations: parseInt(result.total_registrations),
      approvedCount: parseInt(result.approved_count),
      pendingCount: parseInt(result.pending_count),
      rejectedCount: parseInt(result.rejected_count),
      totalActive: parseInt(result.total_active)
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Obtener detalles de una inscripción específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql(`
      SELECT 
        ar.*,
        a.title as activity_title,
        a.start_date as activity_start_date,
        a.end_date as activity_end_date,
        a.start_time as activity_start_time,
        a.end_time as activity_end_time,
        a.location as activity_location,
        p.name as park_name
      FROM activity_registrations ar
      LEFT JOIN activities a ON ar.activity_id = a.id
      LEFT JOIN parks p ON a.park_id = p.id
      WHERE ar.id = $1
    `, [id]);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    const registration = result[0];
    const formattedRegistration = {
      id: registration.id,
      activityId: registration.activity_id,
      participantName: registration.participant_name,
      participantEmail: registration.participant_email,
      participantPhone: registration.participant_phone,
      age: registration.age,
      emergencyContactName: registration.emergency_contact_name,
      emergencyPhone: registration.emergency_phone,
      medicalConditions: registration.medical_conditions,
      dietaryRestrictions: registration.dietary_restrictions,
      status: registration.status,
      registrationDate: registration.registration_date,
      approvedBy: registration.approved_by,
      approvedAt: registration.approved_at,
      rejectionReason: registration.rejection_reason,
      notes: registration.notes,
      acceptsTerms: registration.accepts_terms,
      createdAt: registration.created_at,
      updatedAt: registration.updated_at,
      activity: {
        id: registration.activity_id,
        title: registration.activity_title,
        startDate: registration.activity_start_date,
        endDate: registration.activity_end_date,
        startTime: registration.activity_start_time,
        endTime: registration.activity_end_time,
        location: registration.activity_location,
        park: registration.park_name ? { name: registration.park_name } : null
      }
    };

    res.json(formattedRegistration);
  } catch (error) {
    console.error('Error al obtener inscripción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar inscripción individual
router.delete('/:id', async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id);
    
    if (!registrationId) {
      return res.status(400).json({ error: 'ID de inscripción requerido' });
    }

    // Verificar que la inscripción existe y obtener detalles
    const existingRegistration = await sql`
      SELECT ar.*, a.title as activity_title 
      FROM activity_registrations ar
      LEFT JOIN activities a ON ar.activity_id = a.id
      WHERE ar.id = ${registrationId}
    `;

    if (existingRegistration.length === 0) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    const registration = existingRegistration[0];

    // Eliminar la inscripción
    await sql`DELETE FROM activity_registrations WHERE id = ${registrationId}`;

    console.log(`🗑️ Inscripción eliminada: ID ${registrationId} - ${registration.participant_name} (${registration.activity_title})`);
    
    res.json({ 
      success: true, 
      message: 'Inscripción eliminada exitosamente',
      deletedRegistration: {
        id: registration.id,
        participantName: registration.participant_name,
        participantEmail: registration.participant_email,
        activityTitle: registration.activity_title
      }
    });
  } catch (error) {
    console.error('Error eliminando inscripción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar inscripciones en lote
router.post('/bulk-delete', async (req, res) => {
  try {
    const { registrationIds } = req.body;
    
    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return res.status(400).json({ error: 'Lista de IDs de inscripciones requerida' });
    }

    // Convertir IDs a enteros y filtrar valores inválidos
    const validIds = registrationIds
      .map(id => parseInt(id))
      .filter(id => !isNaN(id) && id > 0);

    if (validIds.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron IDs válidos' });
    }

    // Verificar que todas las inscripciones existen y obtener detalles
    const existingRegistrations = await sql`
      SELECT ar.id, ar.participant_name, ar.participant_email, a.title as activity_title
      FROM activity_registrations ar
      LEFT JOIN activities a ON ar.activity_id = a.id
      WHERE ar.id = ANY(${validIds})
    `;

    if (existingRegistrations.length === 0) {
      return res.status(404).json({ error: 'No se encontraron inscripciones con los IDs proporcionados' });
    }

    if (existingRegistrations.length !== validIds.length) {
      const foundIds = existingRegistrations.map(r => r.id);
      const notFoundIds = validIds.filter(id => !foundIds.includes(id));
      console.log(`⚠️ Algunas inscripciones no fueron encontradas: ${notFoundIds.join(', ')}`);
    }

    // Eliminar las inscripciones encontradas
    const foundIds = existingRegistrations.map(r => r.id);
    const deleteResult = await sql`
      DELETE FROM activity_registrations 
      WHERE id = ANY(${foundIds})
      RETURNING id, participant_name
    `;

    console.log(`🗑️ Eliminación en lote completada: ${deleteResult.length} inscripciones eliminadas`);
    console.log('📋 Inscripciones eliminadas:', existingRegistrations.map(r => `${r.participant_name} (${r.activity_title})`).join(', '));
    
    res.json({ 
      success: true, 
      message: `${deleteResult.length} inscripciones eliminadas exitosamente`,
      deletedCount: deleteResult.length,
      requestedCount: validIds.length,
      deletedRegistrations: existingRegistrations.map(r => ({
        id: r.id,
        participantName: r.participant_name,
        participantEmail: r.participant_email,
        activityTitle: r.activity_title
      }))
    });
  } catch (error) {
    console.error('Error en eliminación en lote:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;