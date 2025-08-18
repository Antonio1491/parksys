import { Request, Response, Router } from 'express';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db, pool } from './db';
import { instructorEvaluations, instructors, insertInstructorEvaluationSchema } from '../shared/schema';
import { z } from 'zod';

/**
 * Registra las rutas para evaluaciones públicas de instructores
 */
export function registerInstructorEvaluationRoutes(app: any, apiRouter: Router) {
  
  // ===== RUTAS PÚBLICAS (sin autenticación) =====
  
  // Obtener evaluaciones públicas aprobadas de un instructor
  apiRouter.get('/public/instructors/:id/evaluations', async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);

      if (isNaN(instructorId)) {
        return res.status(400).json({ message: 'ID de instructor inválido' });
      }

      // Obtener solo evaluaciones aprobadas para mostrar públicamente
      const result = await pool.query(`
        SELECT 
          ie.id,
          ie.overall_rating as "overallRating",
          ie.knowledge_rating as "knowledgeRating", 
          ie.patience_rating as "patienceRating",
          ie.clarity_rating as "clarityRating",
          ie.punctuality_rating as "punctualityRating",
          ie.would_recommend as "wouldRecommend",
          ie.comments,
          ie.attended_activity as "attendedActivity",
          ie.evaluator_name as "evaluatorName",
          ie.evaluator_city as "evaluatorCity",
          ie.created_at as "createdAt"
        FROM instructor_evaluations ie
        WHERE ie.instructor_id = $1 
          AND ie.status = 'approved'
        ORDER BY ie.created_at DESC
        LIMIT 50
      `, [instructorId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching public instructor evaluations:', error);
      res.status(500).json({ message: 'Error al obtener evaluaciones del instructor' });
    }
  });

  // Obtener estadísticas públicas de evaluaciones de un instructor
  apiRouter.get('/public/instructors/:id/evaluation-stats', async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);

      if (isNaN(instructorId)) {
        return res.status(400).json({ message: 'ID de instructor inválido' });
      }

      // Calcular estadísticas de evaluaciones aprobadas
      const result = await db.execute(`
        SELECT 
          COUNT(*) as "totalEvaluations",
          AVG(overall_rating)::numeric(3,2) as "averageRating",
          AVG(knowledge_rating)::numeric(3,2) as "averageKnowledge",
          AVG(patience_rating)::numeric(3,2) as "averagePatience", 
          AVG(clarity_rating)::numeric(3,2) as "averageClarity",
          AVG(punctuality_rating)::numeric(3,2) as "averagePunctuality",
          COUNT(CASE WHEN would_recommend = true THEN 1 END) as "recommendCount",
          COUNT(CASE WHEN would_recommend = false THEN 1 END) as "notRecommendCount"
        FROM instructor_evaluations 
        WHERE instructor_id = ${instructorId} 
          AND status = 'approved'
      `);

      const stats = result.rows[0];
      const totalEvals = parseInt(stats.totalEvaluations) || 0;
      
      // Calcular porcentaje de recomendación
      const recommendationRate = totalEvals > 0 
        ? Math.round((parseInt(stats.recommendCount) / totalEvals) * 100)
        : 0;

      res.json({
        totalEvaluations: totalEvals,
        averageRating: parseFloat(stats.averageRating) || 0,
        averageKnowledge: parseFloat(stats.averageKnowledge) || 0,
        averagePatience: parseFloat(stats.averagePatience) || 0,
        averageClarity: parseFloat(stats.averageClarity) || 0,
        averagePunctuality: parseFloat(stats.averagePunctuality) || 0,
        recommendationRate,
        recommendCount: parseInt(stats.recommendCount) || 0,
        notRecommendCount: parseInt(stats.notRecommendCount) || 0
      });
    } catch (error) {
      console.error('Error fetching instructor evaluation stats:', error);
      res.status(500).json({ message: 'Error al obtener estadísticas de evaluaciones' });
    }
  });

  // Crear nueva evaluación pública (sin autenticación)
  apiRouter.post('/public/instructors/:id/evaluations', async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);

      if (isNaN(instructorId)) {
        return res.status(400).json({ message: 'ID de instructor inválido' });
      }

      // Validar que el instructor existe
      const instructorExists = await db.execute(`
        SELECT id FROM instructors WHERE id = ${instructorId}
      `);

      if (instructorExists.rows.length === 0) {
        return res.status(404).json({ message: 'Instructor no encontrado' });
      }

      // Obtener IP del cliente para prevenir spam
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

      // Verificar si ya existe una evaluación reciente desde esta IP
      const recentEvaluation = await db.execute(`
        SELECT id FROM instructor_evaluations 
        WHERE instructor_id = ${instructorId} 
          AND evaluator_ip = '${clientIp}'
          AND created_at > NOW() - INTERVAL '24 hours'
      `);

      if (recentEvaluation.rows.length > 0) {
        return res.status(429).json({ 
          message: 'Ya has evaluado a este instructor recientemente. Intenta nuevamente en 24 horas.' 
        });
      }

      // Validar datos de entrada
      const validatedData = insertInstructorEvaluationSchema.parse(req.body);

      // Insertar nueva evaluación - corregir mapeos de campos
      const result = await db.execute(`
        INSERT INTO instructor_evaluations (
          instructor_id, 
          knowledge_rating, patience_rating, clarity_rating, punctuality_rating, overall_rating,
          evaluator_name, evaluator_email, evaluator_city, evaluator_ip,
          would_recommend, comments, attended_activity, status
        ) VALUES (
          ${instructorId}, 
          ${validatedData.knowledgeRating},
          ${validatedData.patienceRating},
          ${validatedData.clarityRating},
          ${validatedData.punctualityRating},
          ${validatedData.overallRating},
          '${validatedData.evaluatorName}',
          ${validatedData.evaluatorEmail ? `'${validatedData.evaluatorEmail}'` : 'NULL'},
          ${validatedData.evaluatorCity ? `'${validatedData.evaluatorCity}'` : 'NULL'},
          '${clientIp}',
          ${validatedData.wouldRecommend || false},
          ${validatedData.comments ? `'${validatedData.comments.replace(/'/g, "''")}'` : 'NULL'},
          ${validatedData.attendedActivity ? `'${validatedData.attendedActivity.replace(/'/g, "''")}'` : 'NULL'},
          'pending'
        ) RETURNING id
      `);

      const newEvaluationId = result.rows[0].id;

      console.log('✅ Nueva evaluación de instructor creada:', {
        id: newEvaluationId,
        instructorId,
        evaluator: validatedData.evaluatorName,
        rating: validatedData.overallRating
      });

      res.status(201).json({ 
        message: 'Evaluación enviada exitosamente. Será revisada antes de publicarse.',
        evaluationId: newEvaluationId
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Datos inválidos', 
          errors: error.errors 
        });
      }
      console.error('Error creating instructor evaluation:', error);
      res.status(500).json({ message: 'Error al enviar evaluación' });
    }
  });

  // ===== RUTAS ADMINISTRATIVAS =====

  // Obtener todas las evaluaciones para moderación (requiere autenticación)
  apiRouter.get('/admin/instructor-evaluations', async (req: Request, res: Response) => {
    try {
      const { status = 'pending', page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const result = await db.execute(`
        SELECT 
          ie.id,
          ie.instructor_id as "instructorId",
          i.first_name || ' ' || i.last_name as "instructorName",
          ie.evaluator_name as "evaluatorName",
          ie.evaluator_email as "evaluatorEmail", 
          ie.evaluator_city as "evaluatorCity",
          ie.overall_rating as "overallRating",
          ie.knowledge_rating as "knowledgeRating",
          ie.patience_rating as "patienceRating", 
          ie.clarity_rating as "clarityRating",
          ie.punctuality_rating as "punctualityRating",
          ie.would_recommend as "wouldRecommend",
          ie.comments,
          ie.attended_activity as "attendedActivity",
          ie.status,
          ie.moderation_notes as "moderationNotes",
          ie.created_at as "createdAt"
        FROM instructor_evaluations ie
        LEFT JOIN instructors i ON ie.instructor_id = i.id
        WHERE ie.status = '${status}'
        ORDER BY ie.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      // Contar total para paginación
      const countResult = await db.execute(`
        SELECT COUNT(*) as total 
        FROM instructor_evaluations 
        WHERE status = '${status}'
      `);

      res.json({
        evaluations: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit as string))
      });

    } catch (error) {
      console.error('Error fetching evaluations for moderation:', error);
      res.status(500).json({ message: 'Error al obtener evaluaciones' });
    }
  });

  // Moderar evaluación (aprobar/rechazar)
  apiRouter.patch('/admin/instructor-evaluations/:id/moderate', async (req: Request, res: Response) => {
    try {
      const evaluationId = parseInt(req.params.id);
      const { status, moderationNotes } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Estado inválido' });
      }

      await db.execute(`
        UPDATE instructor_evaluations 
        SET 
          status = '${status}',
          moderation_notes = ${moderationNotes ? `'${moderationNotes.replace(/'/g, "''")}'` : 'NULL'},
          moderated_at = NOW()
        WHERE id = ${evaluationId}
      `);

      console.log('✅ Evaluación moderada:', {
        evaluationId,
        status,
        moderationNotes
      });

      res.json({ message: `Evaluación ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente` });

    } catch (error) {
      console.error('Error moderating evaluation:', error);
      res.status(500).json({ message: 'Error al moderar evaluación' });
    }
  });

  // Obtener todas las evaluaciones para el panel de administración
  apiRouter.get('/evaluations/instructors', async (req: Request, res: Response) => {
    try {
      const result = await db.execute(`
        SELECT 
          ie.id,
          ie.instructor_id as "instructorId",
          COALESCE(i.full_name, i.first_name || ' ' || i.last_name, 'Sin nombre') as "instructorName",
          ie.evaluator_name as "evaluatorName",
          ie.evaluator_email as "evaluatorEmail",
          ie.overall_rating as "overallRating",
          ie.knowledge_rating as "knowledgeRating",
          ie.patience_rating as "patienceRating",
          ie.clarity_rating as "clarityRating",
          ie.punctuality_rating as "punctualityRating",
          ie.would_recommend as "wouldRecommend",
          ie.comments,
          ie.attended_activity as "attendedActivity",
          ie.status,
          ie.moderation_notes as "moderationNotes",
          ie.moderated_by as "moderatedBy",
          ie.moderated_at as "moderatedAt",
          ie.evaluation_date as "evaluationDate",
          ie.created_at as "createdAt"
        FROM instructor_evaluations ie
        LEFT JOIN instructors i ON ie.instructor_id = i.id
        ORDER BY ie.created_at DESC
      `);

      console.log('📊 Enviando', result.rows.length, 'evaluaciones de instructores');
      res.json(result.rows);

    } catch (error) {
      console.error('Error fetching instructor evaluations:', error);
      res.status(500).json({ message: 'Error al obtener evaluaciones de instructores' });
    }
  });

  // Actualizar evaluación (moderación)
  apiRouter.put('/evaluations/instructors/:id', async (req: Request, res: Response) => {
    try {
      const evaluationId = parseInt(req.params.id);
      const { status, moderationNotes } = req.body;

      if (!evaluationId || isNaN(evaluationId)) {
        return res.status(400).json({ message: 'ID de evaluación inválido' });
      }

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Estado inválido' });
      }

      await db.execute(`
        UPDATE instructor_evaluations 
        SET 
          status = '${status}',
          moderation_notes = ${moderationNotes ? `'${moderationNotes.replace(/'/g, "''")}'` : 'NULL'},
          moderated_by = 1,
          moderated_at = NOW()
        WHERE id = ${evaluationId}
      `);

      // Obtener la evaluación actualizada
      const result = await db.execute(`
        SELECT 
          ie.id,
          ie.instructor_id as "instructorId",
          ie.status,
          ie.moderation_notes as "moderationNotes",
          ie.moderated_by as "moderatedBy",
          ie.moderated_at as "moderatedAt"
        FROM instructor_evaluations ie
        WHERE ie.id = ${evaluationId}
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Evaluación no encontrada' });
      }

      console.log('✅ Evaluación de instructor actualizada:', {
        evaluationId,
        status,
        moderationNotes
      });

      res.json({ 
        message: 'Evaluación actualizada exitosamente',
        evaluation: result.rows[0]
      });

    } catch (error) {
      console.error('Error updating instructor evaluation:', error);
      res.status(500).json({ message: 'Error al actualizar evaluación' });
    }
  });

  // Eliminar evaluación
  apiRouter.delete('/evaluations/instructors/:id', async (req: Request, res: Response) => {
    try {
      const evaluationId = parseInt(req.params.id);

      if (!evaluationId || isNaN(evaluationId)) {
        return res.status(400).json({ message: 'ID de evaluación inválido' });
      }

      // Verificar que la evaluación existe
      const checkResult = await db.execute(sql`
        SELECT id FROM instructor_evaluations WHERE id = ${evaluationId}
      `);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Evaluación no encontrada' });
      }

      // Eliminar la evaluación
      await db.execute(sql`
        DELETE FROM instructor_evaluations WHERE id = ${evaluationId}
      `);

      console.log('🗑️ Evaluación de instructor eliminada:', evaluationId);

      res.json({ 
        message: 'Evaluación eliminada exitosamente',
        deletedId: evaluationId
      });

    } catch (error) {
      console.error('Error deleting instructor evaluation:', error);
      res.status(500).json({ message: 'Error al eliminar evaluación' });
    }
  });

  console.log('✅ Rutas de evaluaciones de instructores registradas correctamente');
}