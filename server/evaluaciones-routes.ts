import express from 'express';
import { db } from './db';
import { 
  evaluationCriteria, 
  evaluationResponses,
  evaluationCriteriaAssignments,
  parkEvaluations,
  parks,
  instructorEvaluations,
  instructors,
  volunteerEvaluations,
  volunteers,
  activities,
  concessionaireProfiles,
  concessionEvaluations,
  events
} from '../shared/schema';
import { eq, desc, sql, count, and } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';

const router = express.Router();

// Estadísticas generales del sistema de evaluaciones
router.get('/api/evaluations/stats', async (req, res) => {
  try {
    // Obtener estadísticas de parques
    const parkStats = await db
      .select({
        total: count(),
        avgRating: sql`COALESCE(AVG(CAST(overall_rating AS DECIMAL)), 0)`
      })
      .from(parkEvaluations);

    // Obtener estadísticas de instructores
    const instructorStats = await db
      .select({
        total: count(),
        avgRating: sql`COALESCE(AVG(CAST(overall_rating AS DECIMAL)), 0)`
      })
      .from(instructorEvaluations);

    // Obtener estadísticas de voluntarios
    const volunteerStats = await db
      .select({
        total: count(),
        avgRating: sql`COALESCE(AVG(CAST(${volunteerEvaluations.overallPerformance} AS DECIMAL)), 0)`
      })
      .from(volunteerEvaluations);

    // Obtener estadísticas de concesionarios
    const concessionaireStats = await db
      .select({
        total: count(),
        avgRating: sql`COALESCE(AVG(CAST(${concessionEvaluations.overallPerformance} AS DECIMAL)), 0)`
      })
      .from(concessionEvaluations)
      .catch(() => [{ total: 0, avgRating: 0 }]);

    // Estadísticas de eventos - tabla aún por definir
    const eventStats = [{ total: 0, avgRating: 0 }];

    // Compilar estadísticas
    const stats = {
      parks: {
        total: parkStats[0]?.total || 0,
        averageRating: parseFloat(parkStats[0]?.avgRating?.toString() || '0')
      },
      instructors: {
        total: instructorStats[0]?.total || 0,
        averageRating: parseFloat(instructorStats[0]?.avgRating?.toString() || '0')
      },
      volunteers: {
        total: volunteerStats[0]?.total || 0,
        averageRating: parseFloat(volunteerStats[0]?.avgRating?.toString() || '0')
      },
      activities: {
        total: 0,
        averageRating: 0
      },
      concessionaires: {
        total: concessionaireStats[0]?.total || 0,
        averageRating: parseFloat(concessionaireStats[0]?.avgRating?.toString() || '0')
      },
      events: {
        total: eventStats[0]?.total || 0,
        averageRating: parseFloat(eventStats[0]?.avgRating?.toString() || '0')
      }
    };

    const totals = {
      totalEvaluations: stats.parks.total + stats.instructors.total + stats.volunteers.total + 
                       stats.activities.total + stats.concessionaires.total + stats.events.total,
      averageOverallRating: ((stats.parks.averageRating + stats.instructors.averageRating + 
                             stats.volunteers.averageRating + stats.activities.averageRating + 
                             stats.concessionaires.averageRating + stats.events.averageRating) / 6).toFixed(1)
    };

    res.json({
      ...stats,
      ...totals,
      categories: [
        { name: 'Parques', value: 'parks', count: stats.parks.total },
        { name: 'Instructores', value: 'instructors', count: stats.instructors.total },
        { name: 'Voluntarios', value: 'volunteers', count: stats.volunteers.total },
        { name: 'Actividades', value: 'activities', count: stats.activities.total },
        { name: 'Concesionarios', value: 'concessionaires', count: stats.concessionaires.total },
        { name: 'Eventos', value: 'events', count: stats.events.total }
      ]
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de evaluaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener evaluaciones de parques
router.get('/api/evaluations/parks', async (req, res) => {
  try {
    const evaluations = await db
      .select({
        id: parkEvaluations.id,
        parkId: parkEvaluations.parkId,
        parkName: parks.name,
        evaluatorName: parkEvaluations.evaluatorName,
        evaluatorEmail: parkEvaluations.evaluatorEmail,
        evaluatorPhone: parkEvaluations.evaluatorPhone,
        evaluatorCity: parkEvaluations.evaluatorCity,
        evaluatorAge: parkEvaluations.evaluatorAge,
        isFrequentVisitor: parkEvaluations.isFrequentVisitor,
        
        // Criterios de evaluación individuales
        cleanliness: parkEvaluations.cleanliness,
        safety: parkEvaluations.safety,
        maintenance: parkEvaluations.maintenance,
        accessibility: parkEvaluations.accessibility,
        amenities: parkEvaluations.amenities,
        activities: parkEvaluations.activities,
        staff: parkEvaluations.staff,
        naturalBeauty: parkEvaluations.naturalBeauty,
        
        overallRating: parkEvaluations.overallRating,
        comments: parkEvaluations.comments,
        suggestions: parkEvaluations.suggestions,
        wouldRecommend: parkEvaluations.wouldRecommend,
        
        visitDate: parkEvaluations.visitDate,
        visitPurpose: parkEvaluations.visitPurpose,
        visitDuration: parkEvaluations.visitDuration,
        
        status: parkEvaluations.status,
        moderatedBy: parkEvaluations.moderatedBy,
        moderatedAt: parkEvaluations.moderatedAt,
        moderationNotes: parkEvaluations.moderationNotes,
        
        ipAddress: parkEvaluations.ipAddress,
        userAgent: parkEvaluations.userAgent,
        
        createdAt: parkEvaluations.createdAt,
        updatedAt: parkEvaluations.updatedAt
      })
      .from(parkEvaluations)
      .leftJoin(parks, eq(parkEvaluations.parkId, parks.id))
      .orderBy(desc(parkEvaluations.createdAt));

    console.log(`📊 Enviando ${evaluations.length} evaluaciones de parques con datos completos`);
    res.json(evaluations);
  } catch (error) {
    console.error('Error al obtener evaluaciones de parques:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ENDPOINT MOVIDO A server/index.ts PARA MÁXIMA PRIORIDAD
// router.put('/api/evaluations/parks/:id', ...) - ELIMINADO PARA EVITAR CONFLICTOS CON ENDPOINT PRIORITARIO

// Obtener evaluaciones de instructores
router.get('/api/evaluations/instructors', async (req, res) => {
  try {
    const evaluations = await db
      .select({
        id: instructorEvaluations.id,
        instructorId: instructorEvaluations.instructorId,
        instructorName: sql`${instructors.firstName} || ' ' || ${instructors.lastName}`,
        evaluatorName: instructorEvaluations.evaluatorName,
        evaluatorEmail: instructorEvaluations.evaluatorEmail,
        evaluatorCity: instructorEvaluations.evaluatorCity,
        overallRating: instructorEvaluations.overallRating,
        knowledgeRating: instructorEvaluations.knowledgeRating,
        patienceRating: instructorEvaluations.patienceRating,
        clarityRating: instructorEvaluations.clarityRating,
        punctualityRating: instructorEvaluations.punctualityRating,
        wouldRecommend: instructorEvaluations.wouldRecommend,
        comments: instructorEvaluations.comments,
        attendedActivity: instructorEvaluations.attendedActivity,
        status: instructorEvaluations.status,
        moderationNotes: instructorEvaluations.moderationNotes,
        moderatedBy: instructorEvaluations.moderatedBy,
        moderatedAt: instructorEvaluations.moderatedAt,
        evaluationDate: instructorEvaluations.createdAt,
        createdAt: instructorEvaluations.createdAt
      })
      .from(instructorEvaluations)
      .leftJoin(instructors, eq(instructorEvaluations.instructorId, instructors.id))
      .orderBy(desc(instructorEvaluations.createdAt));

    console.log(`📊 Enviando ${evaluations.length} evaluaciones de instructores con datos completos`);
    res.json(evaluations);
  } catch (error) {
    console.error('Error al obtener evaluaciones de instructores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener evaluaciones de voluntarios
router.get('/api/evaluations/volunteers', async (req, res) => {
  try {
    // Usar tabla real de evaluaciones de voluntarios o retornar datos ejemplo
    const evaluations = await db
      .select({
        id: volunteerEvaluations.id,
        volunteerName: sql`COALESCE(${volunteers.firstName} || ' ' || ${volunteers.lastName}, 'Voluntario Desconocido')`,
        activityName: sql`COALESCE(${activities.title}, 'Actividad Desconocida')`,
        evaluatorName: sql`'Sistema de Evaluación'`,
        overallRating: sql`COALESCE(${volunteerEvaluations.overallPerformance}, 4)`,
        status: sql`'approved'`,
        comments: volunteerEvaluations.comments,
        createdAt: volunteerEvaluations.createdAt,
        hoursCompleted: sql`COALESCE(${volunteerEvaluations.hoursCompleted}, 0)`,
        criteria: sql`json_build_object(
          'commitment', COALESCE(${volunteerEvaluations.attitude}, 4),
          'teamwork', COALESCE(${volunteerEvaluations.responsibility}, 4),
          'initiative', COALESCE(${volunteerEvaluations.attitude}, 4),
          'responsibility', COALESCE(${volunteerEvaluations.responsibility}, 4),
          'attitude', COALESCE(${volunteerEvaluations.attitude}, 4)
        )`
      })
      .from(volunteerEvaluations)
      .leftJoin(volunteers, eq(volunteerEvaluations.volunteerId, volunteers.id))
      .leftJoin(activities, eq(volunteerEvaluations.volunteerId, activities.id))
      .orderBy(desc(volunteerEvaluations.createdAt))
      .catch(() => []);

    res.json(evaluations);
  } catch (error) {
    console.error('Error al obtener evaluaciones de voluntarios:', error);
    res.json([]);
  }
});

// Alias para compatibilidad con el endpoint anterior
router.get('/api/volunteers/evaluations/all', async (req, res) => {
  try {
    const evaluationsList = await db
      .select()
      .from(volunteerEvaluations)
      .orderBy(desc(volunteerEvaluations.createdAt));

    console.log("🌐 [QUERY] GET /api/volunteers/evaluations/all");
    console.log(`Se encontraron ${evaluationsList.length} evaluaciones`);
    
    res.json(evaluationsList);
  } catch (error) {
    console.error('Error fetching volunteer evaluations:', error);
    res.status(500).json({ error: 'Error al obtener evaluaciones de voluntarios' });
  }
});

// Obtener evaluaciones de actividades
router.get('/api/evaluations/activities', async (req, res) => {
  try {
    // Para ahora retornamos datos vacíos hasta que se configure correctamente
    res.json([]);
  } catch (error) {
    console.error('Error al obtener evaluaciones de actividades:', error);
    res.json([]);
  }
});

// Obtener evaluaciones de concesionarios
router.get('/api/evaluations/concessionaires', async (req, res) => {
  try {
    const evaluations = await db
      .select({
        id: concessionEvaluations.id,
        concessionaireName: sql`COALESCE(${concessionaireProfiles.businessName}, 'Concesionario Desconocido')`,
        businessType: sql`COALESCE(${concessionaireProfiles.businessType}, 'Comercio General')`,
        parkName: sql`COALESCE(${parks.name}, 'Parque Desconocido')`,
        evaluatorName: sql`'Sistema de Evaluación'`,
        overallRating: sql`COALESCE(${concessionEvaluations.overallPerformance}, 4)`,
        status: sql`'approved'`,
        comments: concessionEvaluations.comments,
        createdAt: concessionEvaluations.createdAt,
        monthlyRevenue: sql`COALESCE(${concessionEvaluations.monthlyRevenue}, 50000)`,
        criteria: sql`json_build_object(
          'serviceQuality', COALESCE(${concessionEvaluations.serviceQuality}, 4),
          'cleanliness', COALESCE(${concessionEvaluations.cleanliness}, 4),
          'compliance', COALESCE(${concessionEvaluations.compliance}, 4),
          'customerService', COALESCE(${concessionEvaluations.customerService}, 4),
          'maintenance', COALESCE(${concessionEvaluations.maintenance}, 4)
        )`
      })
      .from(concessionEvaluations)
      .leftJoin(concessionaireProfiles, eq(concessionEvaluations.concessionaireId, concessionaireProfiles.id))
      .leftJoin(parks, eq(concessionEvaluations.parkId, parks.id))
      .orderBy(desc(concessionEvaluations.createdAt))
      .catch(() => []);

    res.json(evaluations);
  } catch (error) {
    console.error('Error al obtener evaluaciones de concesionarios:', error);
    res.json([]);
  }
});

// Obtener evaluaciones de eventos
router.get('/api/evaluations/events', async (req, res) => {
  try {
    // Para eventos, retornamos datos vacíos por ahora ya que la tabla no está definida
    const evaluations = [];

    res.json(evaluations);
  } catch (error) {
    console.error('Error al obtener evaluaciones de eventos:', error);
    res.json([]);
  }
});

// Obtener criterios de evaluación - TODOS los criterios, no solo activos
router.get('/api/evaluations/criteria', async (req, res) => {
  try {
    const criteria = await db
      .select()
      .from(evaluationCriteria)
      .orderBy(evaluationCriteria.sortOrder, evaluationCriteria.name);

    res.json(criteria);
  } catch (error) {
    console.error('Error al obtener criterios de evaluación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener criterios por tipo de entidad
router.get('/api/evaluations/criteria/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    
    const criteria = await db
      .select({
        id: evaluationCriteria.id,
        name: evaluationCriteria.name,
        label: evaluationCriteria.label,
        description: evaluationCriteria.description,
        fieldType: evaluationCriteria.fieldType,
        minValue: evaluationCriteria.minValue,
        maxValue: evaluationCriteria.maxValue,
        isRequired: evaluationCriteriaAssignments.isRequired,
        sortOrder: evaluationCriteriaAssignments.sortOrder
      })
      .from(evaluationCriteria)
      .innerJoin(evaluationCriteriaAssignments, eq(evaluationCriteria.id, evaluationCriteriaAssignments.criteriaId))
      .where(
        and(
          eq(evaluationCriteriaAssignments.entityType, entityType),
          eq(evaluationCriteria.isActive, true),
          eq(evaluationCriteriaAssignments.isActive, true)
        )
      )
      .orderBy(evaluationCriteriaAssignments.sortOrder, evaluationCriteria.name);

    res.json(criteria);
  } catch (error) {
    console.error('Error al obtener criterios por tipo de entidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo criterio de evaluación
router.post('/api/evaluations/criteria', async (req, res) => {
  try {
    console.log('📊 [EVALUACIONES] Creando nuevo criterio de evaluación:', req.body);
    
    const { name, label, description, fieldType, minValue, maxValue, isRequired, isActive, sortOrder, icon, category } = req.body;
    
    // Validar datos requeridos
    if (!name || !label || !fieldType) {
      return res.status(400).json({ error: 'Nombre, etiqueta y tipo de campo son requeridos' });
    }
    
    const [newCriteria] = await db
      .insert(evaluationCriteria)
      .values({
        name,
        label,
        description,
        fieldType,
        minValue: minValue || 1,
        maxValue: maxValue || 5,
        isRequired: isRequired !== undefined ? isRequired : true,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        icon: icon || 'Star',
        category: category || 'experiencia'
      })
      .returning();
    
    console.log('✅ [EVALUACIONES] Criterio creado:', newCriteria);
    res.status(201).json(newCriteria);
  } catch (error) {
    console.error('❌ Error creando criterio de evaluación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar criterio de evaluación
router.put('/api/evaluations/criteria/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`📊 [EVALUACIONES] Actualizando criterio ${id}:`, req.body);
    
    // Validar que se recibieron datos
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('❌ [EVALUACIONES] No se recibieron datos para actualizar');
      return res.status(400).json({ error: 'No se recibieron datos para actualizar' });
    }
    
    const { name, label, description, fieldType, minValue, maxValue, isRequired, isActive, sortOrder, icon, category } = req.body;
    
    // Si solo se está actualizando el estado activo/inactivo
    if (Object.keys(req.body).length === 1 && req.body.hasOwnProperty('isActive')) {
      const [updatedCriteria] = await db
        .update(evaluationCriteria)
        .set({ 
          isActive,
          updatedAt: new Date()
        })
        .where(eq(evaluationCriteria.id, id))
        .returning();
      
      console.log('✅ [EVALUACIONES] Estado del criterio actualizado:', updatedCriteria);
      return res.json(updatedCriteria);
    }
    
    // Preparar los datos para actualizar, solo incluir campos que no sean undefined
    const updateData: any = { updatedAt: new Date() };
    
    if (name !== undefined) updateData.name = name;
    if (label !== undefined) updateData.label = label;
    if (description !== undefined) updateData.description = description;
    if (fieldType !== undefined) updateData.fieldType = fieldType;
    if (minValue !== undefined) updateData.minValue = minValue;
    if (maxValue !== undefined) updateData.maxValue = maxValue;
    if (isRequired !== undefined) updateData.isRequired = isRequired;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (icon !== undefined) updateData.icon = icon;
    if (category !== undefined) updateData.category = category;
    
    console.log('📊 [EVALUACIONES] Datos para actualizar:', updateData);
    
    const [updatedCriteria] = await db
      .update(evaluationCriteria)
      .set(updateData)
      .where(eq(evaluationCriteria.id, id))
      .returning();
    
    if (!updatedCriteria) {
      return res.status(404).json({ error: 'Criterio no encontrado' });
    }
    
    console.log('✅ [EVALUACIONES] Criterio actualizado:', updatedCriteria);
    res.json(updatedCriteria);
  } catch (error) {
    console.error('❌ Error actualizando criterio de evaluación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar criterio de evaluación
router.delete('/api/evaluations/criteria/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`📊 [EVALUACIONES] Eliminando criterio ${id}`);
    
    // Verificar si el criterio está siendo usado en asignaciones
    const assignments = await db
      .select()
      .from(evaluationCriteriaAssignments)
      .where(eq(evaluationCriteriaAssignments.criteriaId, id));
    
    if (assignments.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el criterio porque está siendo usado en formularios de evaluación' 
      });
    }
    
    const [deletedCriteria] = await db
      .delete(evaluationCriteria)
      .where(eq(evaluationCriteria.id, id))
      .returning();
    
    if (!deletedCriteria) {
      return res.status(404).json({ error: 'Criterio no encontrado' });
    }
    
    console.log('✅ [EVALUACIONES] Criterio eliminado:', deletedCriteria);
    res.json({ message: 'Criterio eliminado exitosamente' });
  } catch (error) {
    console.error('❌ Error eliminando criterio de evaluación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});



// Asignar criterios a un tipo de entidad (construir formulario)
router.post('/api/evaluations/criteria/assign/:entityType', async (req, res) => {
  try {
    const entityType = req.params.entityType;
    const { criteria } = req.body;
    
    console.log(`📊 [EVALUACIONES] Asignando criterios para ${entityType}:`, criteria);
    
    // Eliminar asignaciones existentes para este tipo de entidad
    await db
      .delete(evaluationCriteriaAssignments)
      .where(eq(evaluationCriteriaAssignments.entityType, entityType));
    
    // Crear nuevas asignaciones
    if (criteria && criteria.length > 0) {
      const assignments = criteria.map((c: any) => ({
        criteriaId: c.criteriaId,
        entityType,
        isRequired: c.isRequired,
        isActive: true,
        sortOrder: c.sortOrder
      }));
      
      await db
        .insert(evaluationCriteriaAssignments)
        .values(assignments);
    }
    
    console.log(`✅ [EVALUACIONES] Criterios asignados exitosamente para ${entityType}`);
    res.json({ message: 'Formulario configurado exitosamente', entityType, criteriaCount: criteria?.length || 0 });
  } catch (error) {
    console.error('❌ Error asignando criterios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener evaluaciones recientes
router.get('/api/evaluations/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Obtener evaluaciones recientes de parques
    const recentParkEvaluations = await db
      .select({
        id: parkEvaluations.id,
        type: sql`'park'`,
        entityName: sql`COALESCE(${parks.name}, 'Parque Desconocido')`,
        evaluatorName: sql`'Sistema de Evaluación'`,
        overallRating: parkEvaluations.overallRating,
        status: sql`'approved'`,
        comments: parkEvaluations.comments,
        createdAt: parkEvaluations.createdAt
      })
      .from(parkEvaluations)
      .leftJoin(parks, eq(parkEvaluations.parkId, parks.id))
      .orderBy(desc(parkEvaluations.createdAt))
      .limit(Math.floor(limit * 0.8))
      .catch(() => []);

    // Obtener evaluaciones recientes de instructores
    const recentInstructorEvaluations = await db
      .select({
        id: instructorEvaluations.id,
        type: sql`'instructor'`,
        entityName: sql`COALESCE(${instructors.fullName}, 'Instructor Desconocido')`,
        evaluatorName: sql`'Sistema de Evaluación'`,
        overallRating: instructorEvaluations.overallRating,
        status: sql`'approved'`,
        comments: instructorEvaluations.comments,
        createdAt: instructorEvaluations.createdAt
      })
      .from(instructorEvaluations)
      .leftJoin(instructors, eq(instructorEvaluations.instructorId, instructors.id))
      .orderBy(desc(instructorEvaluations.createdAt))
      .limit(Math.floor(limit * 0.1))
      .catch(() => []);

    // Obtener evaluaciones recientes de voluntarios
    const recentVolunteerEvaluations = await db
      .select({
        id: volunteerEvaluations.id,
        type: sql`'volunteer'`,
        entityName: sql`COALESCE(${volunteers.fullName}, 'Voluntario Desconocido')`,
        evaluatorName: sql`'Sistema de Evaluación'`,
        overallRating: volunteerEvaluations.overallPerformance,
        status: sql`'approved'`,
        comments: volunteerEvaluations.comments,
        createdAt: volunteerEvaluations.createdAt
      })
      .from(volunteerEvaluations)
      .leftJoin(volunteers, eq(volunteerEvaluations.volunteerId, volunteers.id))
      .orderBy(desc(volunteerEvaluations.createdAt))
      .limit(Math.floor(limit * 0.1))
      .catch(() => []);

    // Combinar y ordenar todas las evaluaciones por fecha
    const allEvaluations = [
      ...recentParkEvaluations,
      ...recentInstructorEvaluations,
      ...recentVolunteerEvaluations
    ];

    // Ordenar por fecha de creación descendente
    allEvaluations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Limitar al número solicitado
    const recentEvaluations = allEvaluations.slice(0, limit);

    res.json(recentEvaluations);
  } catch (error) {
    console.error('Error al obtener evaluaciones recientes:', error);
    res.status(500).json({ error: 'Error interno del servidor', recent: [] });
  }
});

export default router;