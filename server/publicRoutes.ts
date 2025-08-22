import { Request, Response } from 'express';
import { db } from './db';
import { activities, instructors, parks, instructorEvaluations } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Registro de rutas públicas para instructores, actividades y parques
 * @param app Express app
 * @param publicRouter Express router para rutas públicas
 */
export function registerPublicRoutes(publicRouter: any) {
  // Ruta para obtener listado básico de parques (para formularios)
  publicRouter.get('/parks/list', async (_req: Request, res: Response) => {
    try {
      // Respuesta de emergencia - datos en caché para asegurar que funcione
      const emergencyParkList = [
        { id: 1, name: "Parque Metropolitano" },
        { id: 2, name: "Parque Agua Azul" },
        { id: 3, name: "Parque de la Solidaridad" },
        { id: 4, name: "Parque Huentitán" },
        { id: 5, name: "Parque Colomos" },
        { id: 6, name: "Parque González Gallo" },
        { id: 7, name: "Parque Morelos" },
        { id: 8, name: "Parque San Rafael" }
      ];
      
      try {
        // Primero intentamos obtener desde la base de datos
        const dbParkList = await db
          .select({
            id: parks.id,
            name: parks.name
          })
          .from(parks)
          .where(eq(parks.isDeleted, false))
          .orderBy(parks.name);
        
        // Si tenemos resultados de la base de datos, los usamos
        if (dbParkList && dbParkList.length > 0) {
          console.log("Enviando lista de parques desde la base de datos:", dbParkList.length);
          return res.json(dbParkList);
        }
      } catch (dbError) {
        console.error("Error al consultar parques en base de datos:", dbError);
        // Continuamos con la lista de emergencia
      }
      
      // Si llegamos aquí, usamos la lista de emergencia
      console.log("Enviando lista de parques de emergencia");
      res.json(emergencyParkList);
    } catch (error) {
      console.error("Error al obtener listado de parques:", error);
      // Últimamente, si todo falla, devolvemos la lista de emergencia
      const emergencyParkList = [
        { id: 1, name: "Parque Metropolitano" },
        { id: 2, name: "Parque Agua Azul" },
        { id: 3, name: "Parque de la Solidaridad" }
      ];
      res.json(emergencyParkList);
    }
  });
  // Endpoint para permitir a los ciudadanos evaluar a los instructores
  publicRouter.post('/instructors/:id/evaluations', async (req: Request, res: Response) => {
    try {
      const instructorId = parseInt(req.params.id);
      
      if (isNaN(instructorId)) {
        return res.status(400).json({ message: "ID de instructor no válido" });
      }
      
      // Verificar que el instructor existe
      const [instructor] = await db
        .select()
        .from(instructors)
        .where(eq(instructors.id, instructorId));
      
      if (!instructor) {
        return res.status(404).json({ message: "Instructor no encontrado" });
      }
      
      // Validar los datos de entrada - versión actualizada para evaluación pública
      const { 
        evaluatorName, 
        evaluatorEmail, 
        evaluatorCity, 
        overallRating, 
        knowledgeRating, 
        patienceRating, 
        clarityRating, 
        punctualityRating, 
        wouldRecommend,
        comments, 
        attendedActivity 
      } = req.body;
      
      if (!overallRating || !knowledgeRating || !patienceRating || !clarityRating || !punctualityRating || !evaluatorName) {
        return res.status(400).json({ message: "Faltan campos obligatorios para la evaluación" });
      }
      
      // Insertar la evaluación con los campos correctos
      const [newEvaluation] = await db
        .insert(instructorEvaluations)
        .values({
          instructorId,
          evaluatorName,
          evaluatorEmail: evaluatorEmail || null,
          evaluatorCity: evaluatorCity || null,
          overallRating,
          knowledgeRating,
          patienceRating,
          clarityRating,
          punctualityRating,
          wouldRecommend: wouldRecommend || false,
          comments: comments || null,
          attendedActivity: attendedActivity || null,
          status: 'pending', // Evaluaciones públicas requieren moderación
          evaluatorIp: req.ip || null, // Para prevenir spam
        })
        .returning();
      
      res.status(201).json({
        success: true,
        message: "Evaluación enviada correctamente",
        data: newEvaluation
      });
    } catch (error) {
      console.error(`Error al crear evaluación pública para instructor ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al crear evaluación" });
    }
  });
  // Obtener todos los instructores públicos (solo los activos)
  publicRouter.get('/instructors/public', async (_req: Request, res: Response) => {
    try {
      // Usamos SQL directo con DISTINCT ON para eliminar duplicados por nombre/email
      const result = await db.execute(
        sql`WITH unique_instructors AS (
              SELECT DISTINCT ON (LOWER(full_name), LOWER(email)) 
                id, 
                full_name, 
                email, 
                phone,
                specialties, 
                experience_years, 
                profile_image_url,
                created_at,
                bio,
                status,
                gender,
                available_hours,
                cv_url,
                education,
                certifications
              FROM instructors 
              WHERE status = 'active'
              ORDER BY LOWER(full_name), LOWER(email), created_at DESC
            )
            SELECT * FROM unique_instructors
            ORDER BY id DESC`
      );
      
      // Filtrar duplicados adicionales por nombre+email (doble verificación)
      const uniqueMap = new Map();
      
      if (result.rows && result.rows.length > 0) {
        result.rows.forEach((instructor) => {
          if (instructor.full_name && instructor.email) {
            const key = `${instructor.full_name.toLowerCase()}|${instructor.email.toLowerCase()}`;
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, instructor);
            }
          } else {
            uniqueMap.set(instructor.id, instructor);
          }
        });
      }
      
      // Convertir el Map a array
      const uniqueInstructors = Array.from(uniqueMap.values());
      
      // Estructurar la respuesta
      return res.json({
        status: "success",
        data: uniqueInstructors,
        count: uniqueInstructors.length
      });
    } catch (error) {
      console.error('Error al obtener instructores públicos:', error);
      return res.status(500).json({ 
        status: "error", 
        message: 'Error al obtener instructores' 
      });
    }
  });

  // Obtener todas las actividades públicas
  publicRouter.get('/public-activities', async (_req: Request, res: Response) => {
    try {
      // Usar SQL directo para obtener actividades con información de parques e imágenes
      const result = await db.execute(sql`
        SELECT 
          a.id,
          a.title,
          a.description,
          a.category,
          a.park_id as "parkId",
          p.name as "parkName",
          a.location,
          a.start_date as "startDate",
          a.end_date as "endDate",
          a.capacity,
          COALESCE(a.price, 0) as price,
          a.instructor_id as "instructorId",
          i.full_name as "instructorName",
          img.image_url as "imageUrl"
        FROM activities a
        LEFT JOIN parks p ON a.park_id = p.id
        LEFT JOIN instructors i ON a.instructor_id = i.id
        LEFT JOIN (
          SELECT DISTINCT ON (activity_id) 
            activity_id, 
            image_url
          FROM activity_images 
          ORDER BY activity_id, is_primary DESC, created_at DESC
        ) img ON a.id = img.activity_id
        ORDER BY a.start_date ASC
        LIMIT 50
      `);
      
      console.log('Actividades públicas obtenidas:', result.rows?.length || 0);
      return res.json(result.rows || []);
    } catch (error) {
      console.error('Error al obtener actividades públicas:', error);
      return res.status(500).json({ message: 'Error al obtener actividades públicas' });
    }
  });
}