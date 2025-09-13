/**
 * Rutas para el módulo de Arbolado
 */
import express, { Router, Request, Response } from "express";
import { db } from "./db";
import { 
  treeSpecies, 
  trees, 
  treeMaintenances, 
  parks,
  insertTreeSpeciesSchema,
  insertTreeSchema,
  insertTreeMaintenanceSchema
} from "@shared/schema";
import { eq, desc, and, like, or, gte, lte, isNull } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sql } from 'drizzle-orm';
import { getTreeInventory } from './tree_inventory_raw';
import { getTreeMaintenanceStats } from './tree_maintenance_stats';

/**
 * Registra las rutas relacionadas con el módulo de arbolado
 * @param app Aplicación Express
 * @param apiRouter Router de la API
 * @param isAuthenticated Middleware de autenticación
 */
export function registerTreeRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  // Rutas de evaluaciones por árbol
  apiRouter.get("/trees/:id/evaluations", async (req: Request, res: Response) => {
    try {
      const treeId = Number(req.params.id);
      
      if (isNaN(treeId)) {
        return res.status(400).json({ error: "ID de árbol inválido" });
      }
      
      // Verificar que el árbol existe
      const treeExists = await db.select({ id: trees.id }).from(trees).where(eq(trees.id, treeId));
      
      if (treeExists.length === 0) {
        return res.status(404).json({ error: "Árbol no encontrado" });
      }

      // Buscar evaluaciones del árbol usando diferentes posibles fuentes de datos
      let evaluationData: any[] = [];
      
      try {
        // Intentar desde la tabla park_evaluations si el árbol está vinculado a un parque
        const treeWithPark = await db.execute(sql`
          SELECT p.id as park_id FROM trees t 
          JOIN parks p ON t.park_id = p.id 
          WHERE t.id = ${treeId}
        `);
        
        if (treeWithPark.rows.length > 0) {
          const parkId = (treeWithPark.rows[0] as any).park_id;
          const parkEvaluations = await db.execute(sql`
            SELECT 
              id,
              evaluation_date,
              overall_score,
              notes,
              evaluated_by as evaluator_name,
              created_at
            FROM park_evaluations 
            WHERE park_id = ${parkId}
            AND notes LIKE '%árbol%' OR notes LIKE '%árbol ${treeId}%'
            ORDER BY evaluation_date DESC
            LIMIT 20
          `);
          evaluationData.push(...parkEvaluations.rows);
        }
      } catch (error) {
        console.log('No se encontraron evaluaciones de parque para este árbol');
      }

      // También intentar buscar en registros de mantenimiento que puedan tener información de evaluación
      try {
        const maintenanceEvaluations = await db.execute(sql`
          SELECT 
            id,
            maintenance_date as evaluation_date,
            maintenance_type as status,
            notes,
            performed_by,
            created_at
          FROM tree_maintenances 
          WHERE tree_id = ${treeId}
          AND (maintenance_type LIKE '%evalua%' OR maintenance_type LIKE '%inspec%')
          ORDER BY maintenance_date DESC
          LIMIT 10
        `);
        
        // Transformar datos de mantenimiento a formato de evaluación
        const transformedMaintenanceData = maintenanceEvaluations.rows.map((item: any) => ({
          ...item,
          healthStatus: item.status,
          evaluatorName: `Empleado ID: ${item.performed_by}`,
          observations: item.notes
        }));
        
        evaluationData.push(...transformedMaintenanceData);
      } catch (error) {
        console.log('No se encontraron mantenimientos tipo evaluación para este árbol');
      }

      res.json({
        success: true,
        data: evaluationData,
        total: evaluationData.length,
        message: evaluationData.length > 0 
          ? `Se encontraron ${evaluationData.length} registros de evaluaciones` 
          : 'No se encontraron evaluaciones para este árbol'
      });
      
    } catch (error) {
      console.error("❌ Error al obtener evaluaciones del árbol:", error);
      res.status(500).json({ 
        error: "Error interno del servidor al obtener las evaluaciones",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Rutas de mantenimiento por árbol
  apiRouter.get("/trees/:id/maintenances", async (req: Request, res: Response) => {
    try {
      const treeId = Number(req.params.id);
      
      if (isNaN(treeId)) {
        return res.status(400).json({ error: "ID de árbol inválido" });
      }
      
      // Verificar que el árbol existe
      const treeExists = await db.select({ id: trees.id }).from(trees).where(eq(trees.id, treeId));
      
      if (treeExists.length === 0) {
        return res.status(404).json({ error: "Árbol no encontrado" });
      }

      // Consulta directa SQL para evitar problemas de columnas
      const result = await db.execute(sql`
        SELECT 
          tm.id, 
          tm.tree_id, 
          tm.maintenance_type, 
          tm.maintenance_date, 
          tm.description,
          tm.performed_by, 
          tm.notes, 
          tm.next_maintenance_date,
          tm.created_at,
          u.username AS performed_by_username,
          u.full_name AS performed_by_name
        FROM 
          tree_maintenances tm
        LEFT JOIN 
          users u ON tm.performed_by = u.id
        WHERE 
          tm.tree_id = ${treeId}
        ORDER BY 
          tm.maintenance_date DESC
      `);
      
      // Procesar resultados
      const maintenances = result.rows.map(m => ({
        id: m.id,
        treeId: m.tree_id,
        maintenanceType: m.maintenance_type,
        maintenanceDate: m.maintenance_date,
        description: m.description,
        performedBy: m.performed_by,
        performedByName: m.performed_by_name || m.performed_by_username || 'No asignado',
        notes: m.notes || '',
        nextMaintenanceDate: m.next_maintenance_date,
        createdAt: m.created_at
      }));
      
      res.json({ data: maintenances });
    } catch (error) {
      console.error("Error al obtener registros de mantenimiento:", error);
      res.status(500).json({ error: "Error al obtener registros de mantenimiento" });
    }
  });
  
  // TEMPORALMENTE DESHABILITADO - Crear nuevo registro de mantenimiento para un árbol (ENDPOINT DUPLICADO)
  /*
  apiRouter.post("/trees/:id/maintenances", async (req: Request, res: Response) => {
    try {
      const treeId = Number(req.params.id);
      
      if (isNaN(treeId)) {
        return res.status(400).json({ error: "ID de árbol inválido" });
      }
      
      // Verificar que el árbol existe
      const treeExists = await db.select({ id: trees.id }).from(trees).where(eq(trees.id, treeId));
      
      if (treeExists.length === 0) {
        return res.status(404).json({ error: "Árbol no encontrado" });
      }
      
      // Obtener y convertir datos de entrada (acepta camelCase del frontend)
      const { maintenanceType, maintenanceDate, notes, description, performedBy, nextMaintenanceDate } = req.body;
      
      // Validar que los campos obligatorios estén presentes
      if (!maintenanceType || !maintenanceDate) {
        return res.status(400).json({ 
          error: "Datos de mantenimiento inválidos", 
          details: "Los campos maintenanceType y maintenanceDate son obligatorios" 
        });
      }
      
      // El performedBy puede ser un texto (nombre) o un ID numérico
      let performedByValue = performedBy || null;
      
      // Insertar usando SQL directo para evitar problemas de esquema
      const result = await db.execute(sql`
        INSERT INTO tree_maintenances (
          tree_id, 
          maintenance_type, 
          maintenance_date, 
          description,
          performed_by, 
          notes, 
          next_maintenance_date,
          created_at
        ) 
        VALUES (
          ${treeId}, 
          ${maintenanceType}, 
          ${maintenanceDate}, 
          ${description || null},
          ${performedByValue}, 
          ${notes || null}, 
          ${nextMaintenanceDate || null},
          NOW()
        )
        RETURNING *
      `);
      
      // Formatear el resultado
      const maintenance = result.rows[0];
      const formattedMaintenance = {
        id: maintenance.id,
        treeId: maintenance.tree_id,
        maintenanceType: maintenance.maintenance_type,
        maintenanceDate: maintenance.maintenance_date,
        description: maintenance.description,
        performedBy: maintenance.performed_by,
        notes: maintenance.notes,
        nextMaintenanceDate: maintenance.next_maintenance_date,
        createdAt: maintenance.created_at
      };
      
      res.status(201).json({ data: formattedMaintenance });
    } catch (error) {
      console.error("Error al crear registro de mantenimiento:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          error: "Datos de mantenimiento inválidos", 
          details: validationError.message 
        });
      }
      
      res.status(500).json({ error: "Error al crear registro de mantenimiento" });
    }
  });
  */
  // Endpoint para cargar árboles de muestra en el inventario
  apiRouter.post("/trees/seed", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      // Consultar los parques existentes
      const parks = await db.execute(sql`SELECT id, name FROM parks`);
      if (!parks || !parks.rows || parks.rows.length === 0) {
        return res.status(400).json({ message: "No hay parques disponibles para asignar árboles" });
      }
      
      // Consultar las especies existentes
      const species = await db.execute(sql`SELECT id, common_name FROM tree_species`);
      if (!species || !species.rows || species.rows.length === 0) {
        return res.status(400).json({ message: "No hay especies de árboles disponibles" });
      }
      
      console.log(`Encontrados ${parks.rows.length} parques y ${species.rows.length} especies para crear árboles`);
      
      // Valores posibles para condición y estado
      const healthStatuses = ['Bueno', 'Regular', 'Malo', 'Crítico'];
      const conditions = ['Excelente', 'Bueno', 'Regular', 'Deteriorado', 'Crítico'];
      
      // Contador de árboles insertados
      let insertedCount = 0;
      
      // Insertar 50 árboles
      for (let i = 0; i < 50; i++) {
        try {
          // Seleccionar un parque aleatorio
          const randomParkIndex = Math.floor(Math.random() * parks.rows.length);
          const park = parks.rows[randomParkIndex];
          
          // Seleccionar una especie aleatoria
          const randomSpeciesIndex = Math.floor(Math.random() * species.rows.length);
          const specie = species.rows[randomSpeciesIndex];
          
          // Generar coordenadas (latitud/longitud)
          const latitude = 20.65 + (Math.random() * 0.05);
          const longitude = -103.35 + (Math.random() * 0.05);
          
          // Generar altura y diámetro aleatorios
          const height = parseFloat((Math.random() * 15 + 1).toFixed(2)); // Entre 1 y 16 metros
          const trunkDiameter = parseFloat((Math.random() * 80 + 5).toFixed(2)); // Entre 5 y 85 cm
          
          // Seleccionar estado de salud y condición aleatorios
          const healthStatus = healthStatuses[Math.floor(Math.random() * healthStatuses.length)];
          const condition = conditions[Math.floor(Math.random() * conditions.length)];
          
          // Generar fecha de plantación aleatoria (entre 1 y 20 años atrás)
          const plantingDate = new Date();
          const yearsAgo = Math.floor(Math.random() * 20) + 1;
          plantingDate.setFullYear(plantingDate.getFullYear() - yearsAgo);
          
          // Descripción de ubicación
          const locations = [
            'Cerca de la entrada principal', 
            'En el área de juegos', 
            'Junto al lago', 
            'En el área de picnic', 
            'En el perímetro norte', 
            'En el perímetro sur', 
            'En el jardín central', 
            'Junto a la ciclovía',
            'Cerca del área deportiva',
            'En la zona de descanso'
          ];
          const locationDescription = locations[Math.floor(Math.random() * locations.length)];
          
          // Notas y observaciones
          const notesList = [
            'Árbol en buen estado general',
            'Presenta algunas ramas secas que requieren poda',
            'Ha sido tratado recientemente contra plagas',
            'Es un ejemplar notable por su tamaño',
            'Ha sobrevivido a condiciones climáticas extremas',
            'Requiere evaluación detallada próximamente',
            'Plantado durante campaña de reforestación municipal',
            'Provee sombra a un área de descanso',
            'Es parte de un grupo de árboles de la misma especie',
            'Es un árbol joven con buen desarrollo'
          ];
          const notes = notesList[Math.floor(Math.random() * notesList.length)];
          
          // Ejecutar la inserción directa en la base de datos
          await db.execute(sql`
            INSERT INTO trees (
              species_id, park_id, latitude, longitude, 
              height, trunk_diameter, planting_date, 
              location_description, notes, condition, health_status,
              created_at, updated_at
            ) 
            VALUES (
              ${specie.id}, ${park.id}, ${latitude}, ${longitude},
              ${height}, ${trunkDiameter}, ${plantingDate},
              ${locationDescription}, ${notes}, ${condition},
              ${healthStatus}, NOW(), NOW()
            )
          `);
          
          insertedCount++;
        } catch (error) {
          console.error(`Error al insertar árbol #${i+1}:`, error);
        }
      }
      
      console.log(`¡Carga completada! Se insertaron ${insertedCount} árboles en el inventario.`);
      return res.json({ 
        success: true, 
        message: `Se han agregado ${insertedCount} árboles al inventario.`,
        count: insertedCount
      });
      
    } catch (error) {
      console.error('Error en el proceso de carga de árboles:', error);
      return res.status(500).json({ 
        success: false, 
        message: "Error al cargar árboles de muestra" 
      });
    }
  });
  
  // ELIMINADO - RUTA CONFLICTIVA: apiRouter.get("/trees", getTreeInventory);
  // ESTA RUTA INTERFIERE CON /trees/inventory DEL tree_inventory_routes.ts
  
  // Endpoint para estadísticas de mantenimiento (usado en reportes)
  apiRouter.get("/trees/maintenances/stats", getTreeMaintenanceStats);
  
  // Endpoint para obtener los mantenimientos de un árbol específico
  apiRouter.get("/trees/:id/maintenances", async (req: Request, res: Response) => {
    try {
      const treeId = Number(req.params.id);
      
      if (isNaN(treeId)) {
        return res.status(400).json({ error: "ID de árbol no válido" });
      }
      
      // Verificar que el árbol existe
      const treeExists = await db.select({ id: trees.id }).from(trees).where(eq(trees.id, treeId));
      
      if (treeExists.length === 0) {
        return res.status(404).json({ error: "Árbol no encontrado" });
      }
      
      // Consulta directa SQL para evitar problemas de columnas
      const result = await db.execute(sql`
        SELECT 
          tm.id, 
          tm.tree_id, 
          tm.maintenance_type, 
          tm.maintenance_date, 
          tm.description,
          tm.performed_by, 
          tm.notes, 
          tm.next_maintenance_date,
          tm.created_at,
          u.username AS performed_by_username,
          u.full_name AS performed_by_name
        FROM 
          tree_maintenances tm
        LEFT JOIN 
          users u ON tm.performed_by = u.id
        WHERE 
          tm.tree_id = ${treeId}
        ORDER BY 
          tm.maintenance_date DESC
      `);
      
      // Procesar resultados
      const maintenances = result.rows.map(m => ({
        id: m.id,
        treeId: m.tree_id,
        maintenanceType: m.maintenance_type,
        maintenanceDate: m.maintenance_date,
        description: m.description,
        performedBy: m.performed_by,
        performedByName: m.performed_by_name || m.performed_by_username || 'No asignado',
        notes: m.notes || '',
        nextMaintenanceDate: m.next_maintenance_date,
        createdAt: m.created_at
      }));
      
      return res.status(200).json({ data: maintenances });
    } catch (error) {
      console.error("Error al obtener registros de mantenimiento:", error);
      return res.status(500).json({ error: "Error al obtener registros de mantenimiento" });
    }
  });
  
  // Endpoint para crear un nuevo mantenimiento
  apiRouter.post("/trees/:id/maintenances", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { maintenanceType, maintenanceDate, performedBy, notes } = req.body;
      
      if (!maintenanceType || !maintenanceDate) {
        return res.status(400).json({ error: "Tipo de mantenimiento y fecha son obligatorios" });
      }
      
      // Verificar que el árbol existe
      const treeResult = await db.execute(sql`
        SELECT * FROM trees WHERE id = ${Number(id)}
      `);
      
      if (!treeResult.rows || treeResult.rows.length === 0) {
        return res.status(404).json({ error: "Árbol no encontrado" });
      }
      
      // Insertar el nuevo mantenimiento
      const result = await db.execute(sql`
        INSERT INTO tree_maintenances (
          tree_id, 
          maintenance_type, 
          maintenance_date, 
          performed_by, 
          notes, 
          created_at
        ) 
        VALUES (
          ${Number(id)}, 
          ${maintenanceType}, 
          ${maintenanceDate}, 
          ${performedBy || null}, 
          ${notes || null}, 
          NOW()
        )
        RETURNING *
      `);
      
      // Actualizar la fecha del último mantenimiento en el árbol
      await db.execute(sql`
        UPDATE trees 
        SET last_maintenance_date = ${maintenanceDate}
        WHERE id = ${Number(id)}
      `);
      
      // Formatear el resultado
      const maintenance = result.rows[0];
      const formattedMaintenance = {
        id: maintenance.id,
        treeId: maintenance.tree_id,
        maintenanceType: maintenance.maintenance_type,
        maintenanceDate: maintenance.maintenance_date,
        performedBy: maintenance.performed_by,
        notes: maintenance.notes,
        createdAt: maintenance.created_at
      };
      
      res.status(201).json({ data: formattedMaintenance });
    } catch (error) {
      console.error("Error creating tree maintenance:", error);
      res.status(500).json({ error: "Error al crear mantenimiento del árbol" });
    }
  });
  
  // COMENTADO: Ruta conflictiva - ahora se usa tree_inventory_routes.ts que incluye TODOS los campos
  // Esta ruta está deshabilitada porque tree_inventory_routes.ts tiene un endpoint más completo
  // que incluye todos los campos nuevos: developmentStage, ageEstimate, canopyCoverage, 
  // hasHollows, hasExposedRoots, hasPests, isProtected, imageUrl
  
  // Desactivar la ruta en tree_inventory_routes.ts que causa conflicto
  // Ya estamos usando getTreeDetails que es una implementación compatible con la estructura real
  
  // Obtener todas las especies de árboles con paginación
  apiRouter.get("/tree-species", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search as string || '';
      const origin = req.query.origin as string || '';
      const sortBy = req.query.sortBy as string || 'common_name';
      const sortOrder = req.query.sortOrder as string || 'asc';

      // Construir condiciones WHERE
      let whereConditions = [];
      if (search) {
        whereConditions.push(`(common_name ILIKE '%${search}%' OR scientific_name ILIKE '%${search}%' OR family ILIKE '%${search}%')`);
      }
      if (origin && origin !== 'all') {
        whereConditions.push(`origin = '${origin}'`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      const orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

      // Obtener total de registros
      const countResult = await db.execute(sql.raw(`
        SELECT COUNT(*) as total FROM tree_species ${whereClause}
      `));
      const total = Number(countResult.rows[0]?.total || 0);

      // Obtener datos paginados
      const result = await db.execute(sql.raw(`
        SELECT * FROM tree_species 
        ${whereClause}
        ${orderClause}
        LIMIT ${limit} OFFSET ${offset}
      `));
      
      // Mapear campos de snake_case a camelCase
      const mappedData = result.rows.map((row: any) => ({
        id: row.id,
        commonName: row.common_name,
        scientificName: row.scientific_name,
        family: row.family,
        origin: row.origin,
        climateZone: row.climate_zone,
        growthRate: row.growth_rate,
        heightMature: row.height_mature,
        canopyDiameter: row.canopy_diameter,
        lifespan: row.lifespan,
        imageUrl: row.image_url,
        description: row.description,
        maintenanceRequirements: row.maintenance_requirements,
        waterRequirements: row.water_requirements,
        sunRequirements: row.sun_requirements,
        soilRequirements: row.soil_requirements,
        ecologicalBenefits: row.ecological_benefits,
        ornamentalValue: row.ornamental_value,
        commonUses: row.common_uses,
        isEndangered: row.is_endangered,
        iconColor: row.icon_color,
        iconType: row.icon_type,
        customIconUrl: row.custom_icon_url,
        photoUrl: row.photo_url,
        photoCaption: row.photo_caption,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      res.json({
        data: mappedData,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("Error al obtener especies de árboles:", error);
      res.status(500).json({ message: "Error al obtener especies de árboles" });
    }
  });

  // Exportar plantilla CSV con especies mexicanas reales
  apiRouter.get("/tree-species/export/csv", async (req: Request, res: Response) => {
    try {
      // Plantilla con especies mexicanas reales usando los campos exactos del formulario
      const mexicanSpeciesSample = [
        {
          nombre_comun: "Ahuehuete",
          nombre_cientifico: "Taxodium mucronatum",
          familia: "Cupressaceae",
          origen: "Nativo",
          ritmo_crecimiento: "Medio",
          url_imagen: "https://ejemplo.com/ahuehuete.jpg",
          amenazada: "no",
          descripcion: "Árbol sagrado de México, de gran longevidad y porte majestuoso. Se caracteriza por su tronco grueso y su corteza fibrosa. Es el árbol nacional de México.",
          beneficios_ecologicos: "Purifica el aire, proporciona sombra abundante, refugio para fauna, control de erosión, absorbe CO2",
          requisitos_mantenimiento: "Riego abundante los primeros años, poda de mantenimiento ocasional, fertilización anual",
          esperanza_vida: "500-1500 años",
          zona_climatica: "Templado húmedo a subtropical",
          requisitos_suelo: "Suelos húmedos, bien drenados, tolera encharcamiento temporal",
          requisitos_agua: "Abundante, tolera inundaciones estacionales",
          requisitos_sol: "Pleno sol a sombra parcial",
          valor_ornamental: "Alto - follaje denso, forma característica, corteza atractiva",
          usos_comunes: "Ornamental, sombra, conservación de suelos, valor histórico y cultural"
        },
        {
          nombre_comun: "Jacaranda",
          nombre_cientifico: "Jacaranda mimosifolia",
          familia: "Bignoniaceae",
          origen: "Introducido",
          ritmo_crecimiento: "Rapido",
          url_imagen: "https://ejemplo.com/jacaranda.jpg",
          amenazada: "no",
          descripcion: "Árbol ornamental famoso por su espectacular floración violeta. Originario de Argentina, ampliamente cultivado en México por su belleza.",
          beneficios_ecologicos: "Atrae polinizadores, proporciona sombra, mejora paisaje urbano",
          requisitos_mantenimiento: "Riego moderado, poda después de floración, fertilización en primavera",
          esperanza_vida: "50-100 años",
          zona_climatica: "Subtropical a templado",
          requisitos_suelo: "Bien drenados, tolera sequía una vez establecido",
          requisitos_agua: "Moderada, evitar encharcamiento",
          requisitos_sol: "Pleno sol",
          valor_ornamental: "Muy alto - floración espectacular, forma elegante",
          usos_comunes: "Ornamental, sombra urbana, alineaciones"
        },
        {
          nombre_comun: "Mezquite",
          nombre_cientifico: "Prosopis laevigata",
          familia: "Fabaceae",
          origen: "Nativo",
          ritmo_crecimiento: "Medio",
          url_imagen: "https://ejemplo.com/mezquite.jpg",
          amenazada: "no",
          descripcion: "Árbol leguminoso nativo del norte de México, extremadamente resistente a la sequía y de gran valor ecológico.",
          beneficios_ecologicos: "Fija nitrógeno al suelo, proporciona alimento a fauna, control de erosión",
          requisitos_mantenimiento: "Muy bajo mantenimiento, resistente a sequía",
          esperanza_vida: "100-200 años",
          zona_climatica: "Árido a semiárido",
          requisitos_suelo: "Tolera suelos pobres y salinos",
          requisitos_agua: "Muy baja, extremadamente resistente a sequía",
          requisitos_sol: "Pleno sol",
          valor_ornamental: "Medio - copa extendida, follaje fino",
          usos_comunes: "Reforestación, forraje, sombra, madera"
        },
        {
          nombre_comun: "Fresno",
          nombre_cientifico: "Fraxinus uhdei",
          familia: "Oleaceae",
          origen: "Nativo",
          ritmo_crecimiento: "Rapido",
          url_imagen: "https://ejemplo.com/fresno.jpg",
          amenazada: "no",
          descripcion: "Árbol de sombra muy popular en zonas urbanas de México, de crecimiento rápido y copa densa.",
          beneficios_ecologicos: "Purifica el aire, reduce temperatura urbana, refugio para aves",
          requisitos_mantenimiento: "Riego regular, poda de formación, fertilización ocasional",
          esperanza_vida: "80-120 años",
          zona_climatica: "Templado a subtropical",
          requisitos_suelo: "Bien drenados, fértiles",
          requisitos_agua: "Moderada a alta",
          requisitos_sol: "Pleno sol a sombra parcial",
          valor_ornamental: "Alto - copa densa, follaje verde brillante",
          usos_comunes: "Sombra urbana, ornamental, alineaciones"
        },
        {
          nombre_comun: "Primavera",
          nombre_cientifico: "Roseodendron donnell-smithii",
          familia: "Bignoniaceae",
          origen: "Nativo",
          ritmo_crecimiento: "Medio",
          url_imagen: "https://ejemplo.com/primavera.jpg",
          amenazada: "no",
          descripcion: "Árbol nativo con espectacular floración amarilla que marca el inicio de la primavera en México.",
          beneficios_ecologicos: "Néctar para abejas, madera dura, refugio para fauna",
          requisitos_mantenimiento: "Riego moderado en época seca, poda mínima",
          esperanza_vida: "60-100 años",
          zona_climatica: "Tropical a subtropical",
          requisitos_suelo: "Bien drenados, tolera diversos tipos",
          requisitos_agua: "Moderada, resistente a sequía",
          requisitos_sol: "Pleno sol",
          valor_ornamental: "Muy alto - floración amarilla espectacular",
          usos_comunes: "Ornamental, sombra, madera, apicultura"
        }
      ];

      const headers = ["nombre_comun", "nombre_cientifico", "familia", "origen", "ritmo_crecimiento", "url_imagen", "amenazada", "descripcion", "beneficios_ecologicos", "requisitos_mantenimiento", "esperanza_vida", "zona_climatica", "requisitos_suelo", "requisitos_agua", "requisitos_sol", "valor_ornamental", "usos_comunes"];
      const csvContent = [
        headers.join(','),
        ...mexicanSpeciesSample.map(species => 
          headers.map(header => {
            const value = (species as any)[header] || '';
            const escapedValue = String(value).replace(/"/g, '""');
            return escapedValue.includes(',') || escapedValue.includes('\n') ? `"${escapedValue}"` : escapedValue;
          }).join(',')
        )
      ].join('\n');

      // Crear el CSV con BOM UTF-8 usando Buffer para asegurar codificación correcta
      const bom = Buffer.from('\uFEFF', 'utf8');
      const csvBuffer = Buffer.from(csvContent, 'utf8');
      const finalBuffer = Buffer.concat([bom, csvBuffer]);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="especies_mexicanas_plantilla.csv"');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(finalBuffer);
    } catch (error) {
      console.error("Error al generar plantilla CSV:", error);
      res.status(500).json({ message: "Error al generar plantilla CSV" });
    }
  });

  // Importar especies de árboles desde CSV
  apiRouter.post("/tree-species/import/csv", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("=== IMPORTACIÓN CSV DEBUG ===");
      
      const { data } = req.body;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ message: "No se recibieron datos válidos" });
      }
      
      console.log(`📊 Procesando ${data.length} filas`);
      
      // Mapeo de familias mexicanas a nombres comunes reales
      const familyToCommonName = {
        'Cupressaceae': 'Ciprés',
        'Bignoniaceae': 'Jacaranda',
        'Fabaceae': 'Mezquite',
        'Oleaceae': 'Fresno',
        'Scrophulariaceae': 'Escrofularia',
        'Apocynaceae': 'Plumeria',
        'Casuarinaceae': 'Casuarina',
        'Asparagaceae': 'Yuca',
        'Moraceae': 'Higuera',
        'Burseraceae': 'Copal'
      };

      // Mapeo de familias a nombres científicos más específicos
      const familyToScientificName = {
        'Cupressaceae': 'Cupressus sempervirens',
        'Bignoniaceae': 'Jacaranda mimosifolia',
        'Fabaceae': 'Prosopis juliflora',
        'Oleaceae': 'Fraxinus uhdei',
        'Scrophulariaceae': 'Buddleja cordata',
        'Apocynaceae': 'Plumeria rubra',
        'Casuarinaceae': 'Casuarina equisetifolia',
        'Asparagaceae': 'Yucca filifera',
        'Moraceae': 'Ficus benjamina',
        'Burseraceae': 'Bursera simaruba'
      };
      
      // Función para corregir acentos mal codificados
      const fixEncoding = (text: string): string => {
        if (!text) return text;
        
        return text
          .replace(/Ã¡/g, 'á')
          .replace(/Ã©/g, 'é') 
          .replace(/Ã­/g, 'í')
          .replace(/Ã³/g, 'ó')
          .replace(/Ãº/g, 'ú')
          .replace(/Ã±/g, 'ñ')
          .replace(/Ã\u00D1/g, 'Ñ');
      };
      
      let imported = 0;
      const errors: string[] = [];
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          // Detectar formato: nuevo (nombre_comun) vs viejo (family)
          const isNewFormat = row.nombre_comun !== undefined;
          
          let insertData;
          if (isNewFormat) {
            // MAPEO CORREGIDO BASADO EN COLUMNAS REALES DEL CSV
            // Según análisis: descripción=H, beneficios=I, mantenimiento=J, vida=K, clima=L, suelo=M, agua=N, sol=O, usos=Q
            insertData = {
              common_name: fixEncoding(row.nombre_comun || 'Sin nombre'),
              scientific_name: fixEncoding(row.nombre_cientifico || 'Sin clasificar'),
              family: fixEncoding(row.familia || 'Sin familia'), 
              origin: fixEncoding(row.origen || 'Desconocido'),
              growth_rate: fixEncoding(row.ritmo_crecimiento || 'Medio'), // Columna E
              is_endangered: row.amenazada === 'si' || row.amenazada === 'sí',
              
              // CORRECCIÓN DEL MAPEO DESORDENADO
              description: fixEncoding(row.descripcion) || null, // Columna H - CORRECTO
              ecological_benefits: fixEncoding(row.beneficios_ecologicos) || null, // Columna I - CORRECTO  
              maintenance_requirements: fixEncoding(row.requisitos_mantenimiento) || null, // Columna J - CORRECTO
              lifespan: (() => {
                if (!row.esperanza_vida) return null;
                const lifespanStr = row.esperanza_vida.toString();
                const match = lifespanStr.match(/(\d+)/);
                return match ? parseInt(match[1]) : null;
              })(), // Columna K - CORRECTO
              climate_zone: fixEncoding(row.zona_climatica) || null, // Columna L - CORRECTO
              soil_requirements: fixEncoding(row.requisitos_suelo) || null, // Columna M - CORRECTO
              water_requirements: fixEncoding(row.requisitos_agua) || null, // Columna N - CORRECTO
              sun_requirements: fixEncoding(row.requisitos_sol) || null, // Columna O - CORRECTO
              common_uses: fixEncoding(row.usos_comunes) || null, // Columna Q - CORRECTO
              
              // URL de imagen sigue igual
              image_url: row.url_imagen || null,
              
              // Valor ornamental desde la columna correcta
              ornamental_value: fixEncoding(row.valor_ornamental) || null
            };
          } else {
            // Formato simple con nombres reales mexicanos
            const family = row.family || 'Sin familia';
            const origin = row.origin || 'Desconocido';
            
            insertData = {
              common_name: (familyToCommonName as any)[family] || `Árbol de ${family}`,
              scientific_name: (familyToScientificName as any)[family] || `${family} sp.`,
              family: family,
              origin: origin,
              growth_rate: 'Medio',
              is_endangered: row.isEndangered === true,
              description: `Especie de la familia ${family} originaria de ${origin}`,
              maintenance_requirements: 'Mantenimiento regular, poda anual',
              ecological_benefits: 'Purificación del aire, sombra natural, hábitat para fauna',
              image_url: null,
              life_expectancy: Math.floor(Math.random() * 50) + 30, // 30-80 años
              climate_zone: 'Templado a subtropical',
              soil_requirements: 'Suelo bien drenado',
              water_requirements: 'Riego moderado',
              sun_requirements: 'Sol directo a parcial',
              ornamental_value: 'Alto valor ornamental',
              common_uses: 'Ornamental, sombra urbana'
            };
          }

          const result = await db.execute(sql`
            INSERT INTO tree_species (
              common_name, scientific_name, family, origin, growth_rate,
              is_endangered, description, maintenance_requirements, ecological_benefits, 
              image_url, lifespan, climate_zone, soil_requirements, 
              water_requirements, sun_requirements, ornamental_value, common_uses
            ) VALUES (
              ${insertData.common_name}, ${insertData.scientific_name}, 
              ${insertData.family}, ${insertData.origin}, ${insertData.growth_rate},
              ${insertData.is_endangered}, ${insertData.description}, 
              ${insertData.maintenance_requirements}, ${insertData.ecological_benefits},
              ${insertData.image_url}, ${insertData.lifespan}, 
              ${insertData.climate_zone}, ${insertData.soil_requirements},
              ${insertData.water_requirements}, ${insertData.sun_requirements}, 
              ${insertData.ornamental_value}, ${insertData.common_uses}
            )
          `);

          imported++;
        } catch (error) {
          console.error(`❌ Error en fila ${i + 1}:`, error);
          console.error(`❌ Datos de la fila:`, row);
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          errors.push(`Fila ${i + 1}: ${errorMessage}`);
        }
      }

      res.json({
        message: `Importación completada: ${imported} especies importadas`,
        imported,
        errors
      });
    } catch (error) {
      res.status(500).json({ message: "Error al procesar importación", error: error instanceof Error ? error.message : 'Error desconocido' });
    }
  });

  // Obtener una especie de árbol por ID
  apiRouter.get("/tree-species/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await db.execute(sql`
        SELECT * FROM tree_species
        WHERE id = ${id}
      `);
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ message: "Especie de árbol no encontrada" });
      }
      
      // Mapear campos de snake_case a camelCase
      const row = result.rows[0] as any;
      const mappedData = {
        id: row.id,
        commonName: row.common_name,
        scientificName: row.scientific_name,
        family: row.family,
        origin: row.origin,
        climateZone: row.climate_zone,
        growthRate: row.growth_rate,
        heightMature: row.height_mature,
        canopyDiameter: row.canopy_diameter,
        lifespan: row.lifespan,
        imageUrl: row.image_url,
        description: row.description,
        maintenanceRequirements: row.maintenance_requirements,
        waterRequirements: row.water_requirements,
        sunRequirements: row.sun_requirements,
        soilRequirements: row.soil_requirements,
        ecologicalBenefits: row.ecological_benefits,
        ornamentalValue: row.ornamental_value,
        commonUses: row.common_uses,
        isEndangered: row.is_endangered,
        iconColor: row.icon_color,
        iconType: row.icon_type,
        customIconUrl: row.custom_icon_url,
        photoUrl: row.photo_url,
        photoCaption: row.photo_caption,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.json(mappedData);
    } catch (error) {
      console.error("Error al obtener especie de árbol:", error);
      res.status(500).json({ message: "Error al obtener especie de árbol" });
    }
  });

  // Obtener datos detallados de una especie con censo por parques
  apiRouter.get("/tree-species/:id/detail", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Obtener información de la especie
      const speciesResult = await db.execute(sql`
        SELECT * FROM tree_species
        WHERE id = ${id}
      `);
      
      if (!speciesResult.rows || speciesResult.rows.length === 0) {
        return res.status(404).json({ message: "Especie de árbol no encontrada" });
      }
      
      // Mapear datos de la especie
      const speciesRow = speciesResult.rows[0] as any;
      const species = {
        id: speciesRow.id,
        commonName: speciesRow.common_name,
        scientificName: speciesRow.scientific_name,
        family: speciesRow.family,
        origin: speciesRow.origin,
        climateZone: speciesRow.climate_zone,
        growthRate: speciesRow.growth_rate,
        heightMature: speciesRow.height_mature,
        canopyDiameter: speciesRow.canopy_diameter,
        lifespan: speciesRow.lifespan,
        imageUrl: speciesRow.image_url,
        description: speciesRow.description,
        maintenanceRequirements: speciesRow.maintenance_requirements,
        waterRequirements: speciesRow.water_requirements,
        sunRequirements: speciesRow.sun_requirements,
        soilRequirements: speciesRow.soil_requirements,
        ecologicalBenefits: speciesRow.ecological_benefits,
        ornamentalValue: speciesRow.ornamental_value,
        commonUses: speciesRow.common_uses,
        isEndangered: speciesRow.is_endangered,
        iconColor: speciesRow.icon_color,
        iconType: speciesRow.icon_type,
        customIconUrl: speciesRow.custom_icon_url,
        photoUrl: speciesRow.photo_url,
        photoCaption: speciesRow.photo_caption,
        createdAt: speciesRow.created_at,
        updatedAt: speciesRow.updated_at
      };
      
      // Obtener censo por parques
      const censusResult = await db.execute(sql`
        SELECT 
          p.id as park_id,
          p.name as park_name,
          COUNT(t.id) as tree_count,
          AVG(CASE WHEN t.height > 0 THEN t.height ELSE NULL END) as average_height,
          COUNT(CASE WHEN t.health_status = 'Saludable' THEN 1 END) as healthy_count,
          MAX(t.updated_at) as last_updated
        FROM parks p
        LEFT JOIN trees t ON p.id = t.park_id AND t.species_id = ${id}
        WHERE EXISTS (
          SELECT 1 FROM trees t2 WHERE t2.park_id = p.id AND t2.species_id = ${id}
        )
        GROUP BY p.id, p.name
        ORDER BY tree_count DESC
      `);
      
      const census = censusResult.rows.map((row: any) => ({
        parkId: row.park_id,
        parkName: row.park_name,
        treeCount: parseInt(row.tree_count) || 0,
        averageHeight: parseFloat(row.average_height) || 0,
        healthyCount: parseInt(row.healthy_count) || 0,
        totalTrees: parseInt(row.tree_count) || 0,
        lastUpdated: row.last_updated || new Date().toISOString()
      }));
      
      // Calcular totales
      const totalTrees = census.reduce((sum, park) => sum + park.treeCount, 0);
      const totalParks = census.length;
      
      res.json({
        species,
        census,
        totalTrees,
        totalParks
      });
    } catch (error) {
      console.error("Error al obtener datos detallados de especie:", error);
      res.status(500).json({ message: "Error al obtener datos detallados de especie" });
    }
  });

  // Crear nueva especie de árbol (requiere autenticación)
  apiRouter.post("/tree-species", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { 
        commonName, scientificName, family, origin, growthRate, imageUrl, 
        description, isEndangered, ecologicalBenefits, maintenanceRequirements, 
        lifespan, climateZone, soilRequirements, waterRequirements, 
        sunRequirements, ornamentalValue, commonUses 
      } = req.body;
      
      // Validación básica de datos
      if (!commonName || !scientificName) {
        return res.status(400).json({ 
          message: "El nombre común y científico son obligatorios" 
        });
      }
      
      // Insertar la nueva especie usando nombres de columnas correctos del esquema
      const result = await db.execute(sql`
        INSERT INTO tree_species (
          common_name, scientific_name, family, origin, growth_rate, 
          image_url, description, is_endangered, ecological_benefits, 
          maintenance_requirements, lifespan, climate_zone, 
          soil_requirements, water_requirements, sun_requirements, 
          ornamental_value, common_uses, created_at, updated_at
        ) 
        VALUES (
          ${commonName}, ${scientificName}, ${family || null}, ${origin || null}, 
          ${growthRate || null}, ${imageUrl || null}, ${description || null}, 
          ${isEndangered || false}, ${ecologicalBenefits || null}, 
          ${maintenanceRequirements || null}, ${lifespan || null}, ${climateZone || null},
          ${soilRequirements || null}, ${waterRequirements || null}, ${sunRequirements || null},
          ${ornamentalValue || null}, ${commonUses || null}, NOW(), NOW()
        )
        RETURNING *
      `);
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error al crear especie de árbol:", error);
      res.status(500).json({ message: "Error al crear especie de árbol" });
    }
  });

  // Actualizar especie de árbol (requiere autenticación)
  apiRouter.put("/tree-species/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { 
        commonName, 
        scientificName, 
        family, 
        origin, 
        growthRate,
        imageUrl, 
        isEndangered,
        description, 
        ecologicalBenefits,
        maintenanceRequirements,
        lifespan,
        climateZone,
        soilRequirements,
        waterRequirements,
        sunRequirements,
        ornamentalValue,
        commonUses
      } = req.body;
      
      // Validación básica de datos
      if (!commonName || !scientificName) {
        return res.status(400).json({ 
          message: "El nombre común y científico son obligatorios" 
        });
      }
      
      // Convertir lifespan a número si está presente
      const lifespanNum = lifespan && !isNaN(parseInt(lifespan)) ? parseInt(lifespan) : null;
      
      // Actualizar la especie con todos los campos del formulario completo
      const result = await db.execute(sql`
        UPDATE tree_species
        SET 
          common_name = ${commonName},
          scientific_name = ${scientificName},
          family = ${family || null},
          origin = ${origin || null},
          growth_rate = ${growthRate || null},
          image_url = ${imageUrl || null},
          photo_url = ${imageUrl || null},
          is_endangered = ${isEndangered || false},
          description = ${description || null},
          ecological_benefits = ${ecologicalBenefits || null},
          maintenance_requirements = ${maintenanceRequirements || null},
          lifespan = ${lifespanNum},
          climate_zone = ${climateZone || null},
          soil_requirements = ${soilRequirements || null},
          water_requirements = ${waterRequirements || null},
          sun_requirements = ${sunRequirements || null},
          ornamental_value = ${ornamentalValue || null},
          common_uses = ${commonUses || null},
          icon_type = ${imageUrl ? 'custom' : null},
          custom_icon_url = ${imageUrl || null},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ message: "Especie de árbol no encontrada" });
      }
      
      // Mapear campos de snake_case a camelCase para la respuesta
      const row = result.rows[0] as any;
      const mappedData = {
        id: row.id,
        commonName: row.common_name,
        scientificName: row.scientific_name,
        family: row.family,
        origin: row.origin,
        climateZone: row.climate_zone,
        growthRate: row.growth_rate,
        heightMature: row.height_mature,
        canopyDiameter: row.canopy_diameter,
        lifespan: row.lifespan,
        imageUrl: row.image_url,
        description: row.description,
        maintenanceRequirements: row.maintenance_requirements,
        waterRequirements: row.water_requirements,
        sunRequirements: row.sun_requirements,
        soilRequirements: row.soil_requirements,
        ecologicalBenefits: row.ecological_benefits,
        ornamentalValue: row.ornamental_value,
        commonUses: row.common_uses,
        isEndangered: row.is_endangered,
        iconColor: row.icon_color,
        iconType: row.icon_type,
        customIconUrl: row.custom_icon_url,
        photoUrl: row.photo_url,
        photoCaption: row.photo_caption,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.json(mappedData);
    } catch (error) {
      console.error("Error al actualizar especie de árbol:", error);
      res.status(500).json({ message: "Error al actualizar especie de árbol" });
    }
  });

  // Eliminar todas las especies de árboles (requiere autenticación) - DEBE IR ANTES DEL :id
  apiRouter.delete("/tree-species/delete-all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar si hay árboles registrados
      const treeCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM trees
      `);
      
      if (treeCount.rows && treeCount.rows[0] && (treeCount.rows[0] as any).count > 0) {
        return res.status(400).json({
          message: "No se pueden eliminar las especies porque hay árboles registrados en el sistema"
        });
      }
      
      // Contar especies antes de eliminar
      const speciesCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM tree_species
      `);
      
      // Eliminar todas las especies
      await db.execute(sql`
        DELETE FROM tree_species
      `);
      
      const deletedCount = speciesCount.rows?.[0] ? (speciesCount.rows[0] as any).count : 0;
      
      res.json({ 
        message: `Catálogo limpiado correctamente. ${deletedCount} especies eliminadas.`,
        deletedCount: deletedCount
      });
    } catch (error) {
      console.error("Error al limpiar catálogo:", error);
      res.status(500).json({ message: "Error al eliminar todas las especies" });
    }
  });

  // Eliminar especie de árbol individual (requiere autenticación)
  apiRouter.delete("/tree-species/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Validar que el ID sea un número válido
      if (isNaN(id)) {
        return res.status(400).json({ 
          message: "ID de especie inválido" 
        });
      }
      
      // Verificar si la especie tiene árboles asociados
      const treeCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM trees
        WHERE species_id = ${id}
      `);
      
      if ((treeCount.rows[0] as any)?.count > 0) {
        return res.status(400).json({ 
          message: "No se puede eliminar la especie porque tiene árboles asociados" 
        });
      }
      
      // Eliminar la especie
      const result = await db.execute(sql`
        DELETE FROM tree_species
        WHERE id = ${id}
        RETURNING *
      `);
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ message: "Especie de árbol no encontrada" });
      }
      
      res.json({ message: "Especie de árbol eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar especie de árbol:", error);
      res.status(500).json({ message: "Error al eliminar especie de árbol" });
    }
  });

  // Eliminar todos los árboles del inventario (requiere autenticación)
  apiRouter.delete("/trees/delete-all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Contar árboles antes de eliminar
      const treeCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM trees
      `);
      
      // Eliminar primero los mantenimientos asociados
      await db.execute(sql`
        DELETE FROM tree_maintenances
      `);
      
      // Eliminar todos los árboles
      await db.execute(sql`
        DELETE FROM trees
      `);
      
      const deletedCount = treeCount.rows?.[0] ? (treeCount.rows[0] as any).count : 0;
      
      res.json({ 
        message: `Inventario de árboles limpiado correctamente. ${deletedCount} árboles eliminados.`,
        deletedCount: deletedCount
      });
    } catch (error) {
      console.error("Error al limpiar inventario:", error);
      res.status(500).json({ message: "Error al eliminar todos los árboles del inventario" });
    }
  });

  // Obtener árboles por parque
  apiRouter.get("/parks/:id/trees", async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      
      // Verificar que el parque existe
      const parkResult = await db.execute(sql`
        SELECT * FROM parks WHERE id = ${parkId}
      `);
      
      if (!parkResult.rows || parkResult.rows.length === 0) {
        return res.status(404).json({ message: "Parque no encontrado" });
      }
      
      // Obtener árboles del parque con información de especies
      const result = await db.execute(sql`
        SELECT 
          t.*, 
          s.common_name, s.scientific_name, s.family, s.origin,
          s.image_url as species_image
        FROM 
          trees t
          LEFT JOIN tree_species s ON t.species_id = s.id
        WHERE 
          t.park_id = ${parkId}
        ORDER BY
          t.id DESC
      `);
      
      // Formatear los resultados
      const formattedTrees = result.rows.map(tree => ({
        id: tree.id,
        // Crear un código generado a partir del ID
        code: `ARB-${(tree.id as any).toString().padStart(5, '0')}`,
        speciesId: tree.species_id,
        parkId: tree.park_id,
        latitude: tree.latitude,
        longitude: tree.longitude,
        plantingDate: tree.planting_date,
        height: tree.height,
        diameter: tree.trunk_diameter,
        healthStatus: tree.health_status,
        condition: tree.condition,
        locationDescription: tree.location_description,
        lastMaintenanceDate: tree.last_maintenance_date,
        notes: tree.notes,
        createdAt: tree.created_at,
        updatedAt: tree.updated_at,
        species: {
          id: tree.species_id,
          commonName: tree.common_name,
          scientificName: tree.scientific_name,
          family: tree.family,
          origin: tree.origin,
          imageUrl: tree.species_image
        }
      }));
      
      res.json(formattedTrees);
    } catch (error) {
      console.error("Error al obtener árboles del parque:", error);
      res.status(500).json({ message: "Error al obtener árboles del parque" });
    }
  });

  // Obtener estadísticas para el dashboard
  apiRouter.get("/trees-stats", async (req: Request, res: Response) => {
    try {
      // Contar árboles por estado de salud
      const healthStats = await db.execute(sql`
        SELECT health_status, COUNT(*) as count
        FROM trees
        GROUP BY health_status
        ORDER BY count DESC
      `);
      
      // Contar árboles por especie
      const speciesStats = await db.execute(sql`
        SELECT s.common_name, COUNT(t.id) as count
        FROM trees t
        JOIN tree_species s ON t.species_id = s.id
        GROUP BY s.common_name
        ORDER BY count DESC
        LIMIT 10
      `);
      
      // Contar árboles por parque
      const parkStats = await db.execute(sql`
        SELECT p.name, COUNT(t.id) as count
        FROM trees t
        JOIN parks p ON t.park_id = p.id
        GROUP BY p.name
        ORDER BY count DESC
        LIMIT 10
      `);
      
      // Contar mantenimientos recientes (último mes)
      const recentMaintenances = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM tree_maintenances
        WHERE created_at >= NOW() - INTERVAL '1 month'
      `);
      
      // Contar árboles que necesitan mantenimiento
      const needMaintenance = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM trees
        WHERE 
          health_status IN ('Malo', 'Crítico')
          OR last_maintenance_date IS NULL
          OR last_maintenance_date < NOW() - INTERVAL '1 year'
      `);
      
      res.json({
        healthStatus: healthStats.rows,
        bySpecies: speciesStats.rows,
        byPark: parkStats.rows,
        recentMaintenances: recentMaintenances.rows[0]?.count || 0,
        needMaintenance: needMaintenance.rows[0]?.count || 0
      });
    } catch (error) {
      console.error("Error al obtener estadísticas de árboles:", error);
      res.status(500).json({ message: "Error al obtener estadísticas de árboles" });
    }
  });

  // ===== ENDPOINTS PARA ICONOS Y FOTOS DE ESPECIES DE ÁRBOLES =====

  // Subir icono personalizado para especies de árboles
  apiRouter.post("/tree-species/upload-icon", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar que el usuario sea administrador (role_id 1 = admin)
      if (!req.user || (req.user.roleId !== 1 && req.user.role_id !== 1)) {
        return res.status(403).json({ message: "Solo administradores pueden subir iconos" });
      }
      
      const { uploadTreeIcon, handleTreeIconUploadErrors, uploadTreeIconHandler } = await import('./api/treeIconUpload');
      
      // Usar el middleware de multer para procesar la carga
      uploadTreeIcon(req, res, (err: any) => {
        if (err) {
          return handleTreeIconUploadErrors(err, req, res, () => {});
        }
        // Si no hay errores, manejar la respuesta
        return uploadTreeIconHandler(req, res);
      });
    } catch (error) {
      console.error("Error al subir icono de especie de árbol:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Subir foto principal para especies de árboles
  apiRouter.post("/tree-species/upload-photo", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar que el usuario sea administrador (role_id 1 = admin)
      if (!req.user || (req.user.roleId !== 1 && req.user.role_id !== 1)) {
        return res.status(403).json({ message: "Solo administradores pueden subir fotos" });
      }
      
      const { uploadTreePhoto, handleTreePhotoUploadErrors, uploadTreePhotoHandler } = await import('./api/treeIconUpload');
      
      // Usar el middleware de multer para procesar la carga
      uploadTreePhoto(req, res, (err: any) => {
        if (err) {
          return handleTreePhotoUploadErrors(err, req, res, () => {});
        }
        // Si no hay errores, manejar la respuesta
        return uploadTreePhotoHandler(req, res);
      });
    } catch (error) {
      console.error("Error al subir foto de especie de árbol:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Subida masiva de iconos para especies de árboles
  apiRouter.post("/tree-species/bulk-upload-icons", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar que el usuario sea administrador (role_id 1 = admin)
      if (!req.user || (req.user.roleId !== 1 && req.user.role_id !== 1)) {
        return res.status(403).json({ message: "Solo administradores pueden realizar carga masiva" });
      }

      const { uploadMultipleTreeIcons } = await import('./api/treeIconUpload');
      
      uploadMultipleTreeIcons(req, res, async (err: any) => {
        if (err) {
          console.error("Error en carga masiva:", err);
          return res.status(400).json({ error: err.message });
        }

        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          return res.status(400).json({ error: "No se han seleccionado archivos" });
        }

        const { family = 'general' } = req.body;
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        const results = [];
        
        for (const file of files) {
          try {
            // Validar tipo de archivo
            if (!allowedTypes.includes(file.mimetype)) {
              results.push({
                filename: file.originalname,
                success: false,
                error: "Formato de archivo no válido"
              });
              continue;
            }

            // Validar tamaño de archivo (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
              results.push({
                filename: file.originalname,
                success: false,
                error: "Archivo demasiado grande (máximo 2MB)"
              });
              continue;
            }

            // Crear nombre de especie desde el nombre del archivo
            const speciesName = file.originalname
              .replace(/\.[^/.]+$/, "") // Remover extensión
              .replace(/[-_]/g, " ") // Reemplazar guiones y guiones bajos con espacios
              .replace(/\b\w/g, l => l.toUpperCase()); // Capitalizar primera letra de cada palabra

            const iconUrl = `/uploads/tree-icons/${file.filename}`;

            // Datos de la especie de árbol
            const speciesData = {
              commonName: speciesName,
              scientificName: speciesName, // Se puede actualizar manualmente después
              family: family,
              origin: 'No especificado',
              growthRate: 'Medio',
              iconType: 'custom',
              customIconUrl: iconUrl,
              description: `Especie de árbol: ${speciesName}`
            };

            // Verificar si ya existe
            const existingCheck = await db.select({ id: treeSpecies.id })
              .from(treeSpecies)
              .where(eq(treeSpecies.commonName, speciesData.commonName));
            
            if (existingCheck.length > 0) {
              // Ya existe, actualizar el icono
              await db.update(treeSpecies)
                .set({
                  iconType: speciesData.iconType,
                  customIconUrl: speciesData.customIconUrl,
                  family: speciesData.family
                })
                .where(eq(treeSpecies.id, existingCheck[0].id));
            } else {
              // No existe, crear nueva especie
              await db.insert(treeSpecies).values({
                commonName: speciesData.commonName,
                scientificName: speciesData.scientificName,
                family: speciesData.family,
                origin: speciesData.origin,
                growthRate: speciesData.growthRate,
                iconType: speciesData.iconType,
                customIconUrl: speciesData.customIconUrl,
                description: speciesData.description
              });
            }
            
            results.push({
              filename: file.originalname,
              speciesName: speciesName,
              iconUrl: iconUrl,
              success: true
            });

          } catch (error) {
            console.error(`Error procesando archivo ${file.originalname}:`, error);
            results.push({
              filename: file.originalname,
              success: false,
              error: "Error al procesar el archivo"
            });
          }
        }

        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        res.json({
          message: `Carga masiva completada: ${successCount} exitosos, ${failedCount} fallidos`,
          successCount,
          failedCount,
          results
        });
      });
    } catch (error) {
      console.error("Error en carga masiva de iconos de especies:", error);
      res.status(500).json({ error: "Error al procesar la carga masiva" });
    }
  });

  // ============== RUTAS PARA GESTIÓN DE ESPECIES ARBÓREAS EN PARQUES ==============

  // Obtener todas las asignaciones de especies a parques (para filtros)
  apiRouter.get("/park-tree-species", async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          pts.id,
          pts.park_id as "parkId",
          pts.species_id as "speciesId"
        FROM park_tree_species pts
        ORDER BY pts.park_id, pts.species_id
      `);
      
      res.json({ data: result.rows });
    } catch (error) {
      console.error("Error al obtener asignaciones de especies a parques:", error);
      res.status(500).json({ error: "Error al obtener asignaciones de especies a parques" });
    }
  });

  // Obtener especies asignadas a un parque
  apiRouter.get("/parks/:id/tree-species", async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.id);
      
      const result = await db.execute(sql`
        SELECT 
          pts.id,
          pts.park_id as "parkId",
          pts.species_id as "speciesId",
          pts.recommended_quantity as "recommendedQuantity",
          pts.current_quantity as "currentQuantity",
          pts.planting_zone as "plantingZone",
          pts.notes,
          pts.status,
          pts.created_at as "createdAt",
          pts.updated_at as "updatedAt",
          ts.common_name as "commonName",
          ts.scientific_name as "scientificName",
          ts.family,
          ts.origin,
          ts.is_endangered as "isEndangered",
          ts.icon_type as "iconType",
          ts.custom_icon_url as "customIconUrl"
        FROM park_tree_species pts
        JOIN tree_species ts ON pts.species_id = ts.id
        WHERE pts.park_id = ${parkId}
        ORDER BY ts.common_name
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener especies del parque:", error);
      res.status(500).json({ error: "Error al obtener especies del parque" });
    }
  });

  // Asignar especie a un parque
  apiRouter.post("/parks/:id/tree-species", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parkId = parseInt(req.params.id);
      const { speciesId, recommendedQuantity, currentQuantity, plantingZone, notes, status } = req.body;

      // Verificar que el parque existe
      const parkExists = await db.execute(sql`SELECT id FROM parks WHERE id = ${parkId}`);
      if (!parkExists.rows || parkExists.rows.length === 0) {
        return res.status(404).json({ error: "Parque no encontrado" });
      }

      // Verificar que la especie existe
      const speciesExists = await db.execute(sql`SELECT id FROM tree_species WHERE id = ${speciesId}`);
      if (!speciesExists.rows || speciesExists.rows.length === 0) {
        return res.status(404).json({ error: "Especie no encontrada" });
      }

      // Verificar que no esté ya asignada
      const existingAssignment = await db.execute(sql`
        SELECT id FROM park_tree_species 
        WHERE park_id = ${parkId} AND species_id = ${speciesId}
      `);
      if (existingAssignment.rows && existingAssignment.rows.length > 0) {
        return res.status(400).json({ error: "Esta especie ya está asignada al parque" });
      }

      // Crear la asignación
      const result = await db.execute(sql`
        INSERT INTO park_tree_species (
          park_id, species_id, recommended_quantity, current_quantity, 
          planting_zone, notes, status, created_at, updated_at
        ) VALUES (
          ${parkId}, ${speciesId}, ${recommendedQuantity || null}, ${currentQuantity || 0}, 
          ${plantingZone || null}, ${notes || null}, ${status || 'planificado'}, 
          NOW(), NOW()
        ) RETURNING id
      `);

      res.status(201).json({ 
        message: "Especie asignada al parque correctamente",
        id: result.rows[0]?.id 
      });
    } catch (error) {
      console.error("Error al asignar especie al parque:", error);
      res.status(500).json({ error: "Error al asignar especie al parque" });
    }
  });

  // Actualizar asignación de especie
  apiRouter.put("/park-tree-species/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const { recommendedQuantity, currentQuantity, plantingZone, notes, status } = req.body;

      // Verificar que la asignación existe
      const existingAssignment = await db.execute(sql`
        SELECT id FROM park_tree_species WHERE id = ${assignmentId}
      `);
      if (!existingAssignment.rows || existingAssignment.rows.length === 0) {
        return res.status(404).json({ error: "Asignación no encontrada" });
      }

      // Actualizar la asignación
      await db.execute(sql`
        UPDATE park_tree_species SET
          recommended_quantity = ${recommendedQuantity || null},
          current_quantity = ${currentQuantity || 0},
          planting_zone = ${plantingZone || null},
          notes = ${notes || null},
          status = ${status || 'planificado'},
          updated_at = NOW()
        WHERE id = ${assignmentId}
      `);

      res.json({ message: "Asignación actualizada correctamente" });
    } catch (error) {
      console.error("Error al actualizar asignación:", error);
      res.status(500).json({ error: "Error al actualizar asignación" });
    }
  });

  // Eliminar asignación de especie
  apiRouter.delete("/park-tree-species/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const assignmentId = parseInt(req.params.id);

      // Verificar que la asignación existe
      const existingAssignment = await db.execute(sql`
        SELECT id FROM park_tree_species WHERE id = ${assignmentId}
      `);
      if (!existingAssignment.rows || existingAssignment.rows.length === 0) {
        return res.status(404).json({ error: "Asignación no encontrada" });
      }

      // Eliminar la asignación
      await db.execute(sql`DELETE FROM park_tree_species WHERE id = ${assignmentId}`);

      res.json({ message: "Especie removida del parque correctamente" });
    } catch (error) {
      console.error("Error al remover asignación:", error);
      res.status(500).json({ error: "Error al remover asignación" });
    }
  });

  // ===== ENDPOINTS CSV IMPORT/EXPORT =====
  
  // Exportar árboles a CSV con filtros
  apiRouter.get("/trees/export-csv", async (req: Request, res: Response) => {
    try {
      // Construir consulta base con filtros
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // Filtro de búsqueda
      if (req.query.search && req.query.search !== '') {
        whereConditions.push(`(t.code ILIKE $${paramIndex} OR ts.common_name ILIKE $${paramIndex + 1})`);
        queryParams.push(`%${req.query.search}%`, `%${req.query.search}%`);
        paramIndex += 2;
      }

      // Filtro de parque
      if (req.query.parkId && req.query.parkId !== 'all') {
        whereConditions.push(`t.park_id = $${paramIndex}`);
        queryParams.push(req.query.parkId);
        paramIndex++;
      }

      // Filtro de estado de salud
      if (req.query.healthStatus && req.query.healthStatus !== 'all') {
        whereConditions.push(`t.health_status = $${paramIndex}`);
        queryParams.push(req.query.healthStatus);
        paramIndex++;
      }

      // Filtro de especie
      if (req.query.speciesId && req.query.speciesId !== 'all') {
        whereConditions.push(`t.species_id = $${paramIndex}`);
        queryParams.push(req.query.speciesId);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Construir query completa
      const query = `
        SELECT 
          t.code,
          ts.common_name as especie,
          ts.scientific_name as nombre_cientifico,
          p.name as parque,
          t.health_status as estado_salud,
          t.height as altura,
          t.trunk_diameter as diametro,
          t.canopy_coverage as cobertura_copa,
          t.development_stage as etapa_desarrollo,
          t.estimated_age as edad_estimada,
          t.planting_date as fecha_plantacion,
          t.latitude as latitud,
          t.longitude as longitud,
          t.location_description as descripcion_ubicacion,
          t.last_maintenance_date as ultima_inspeccion,
          t.notes as notas,
          t.created_at as fecha_registro
        FROM trees t
        LEFT JOIN tree_species ts ON t.species_id = ts.id
        LEFT JOIN parks p ON t.park_id = p.id
        ${whereClause}
        ORDER BY t.id DESC
      `;

      const result = await db.execute(sql.raw(query));

      // Crear contenido CSV
      const headers = [
        'Código',
        'Especie',
        'Nombre Científico',
        'Parque',
        'Estado de Salud',
        'Altura (m)',
        'Diámetro (cm)',
        'Cobertura Copa (m)',
        'Etapa Desarrollo',
        'Edad Estimada',
        'Fecha Plantación',
        'Latitud',
        'Longitud',
        'Descripción Ubicación',
        'Última Inspección',
        'Notas',
        'Fecha Registro'
      ];

      let csvContent = headers.join(',') + '\n';

      result.rows.forEach((row: any) => {
        const rowData = [
          row.code || '',
          row.especie || '',
          row.nombre_cientifico || '',
          row.parque || '',
          row.estado_salud || '',
          row.altura || '',
          row.diametro || '',
          row.cobertura_copa || '',
          row.etapa_desarrollo || '',
          row.edad_estimada || '',
          row.fecha_plantacion ? new Date(row.fecha_plantacion).toLocaleDateString('es-ES') : '',
          row.latitud || '',
          row.longitud || '',
          row.descripcion_ubicacion || '',
          row.ultima_inspeccion ? new Date(row.ultima_inspeccion).toLocaleDateString('es-ES') : '',
          row.notas || '',
          row.fecha_registro ? new Date(row.fecha_registro).toLocaleDateString('es-ES') : ''
        ];

        // Escapar campos que contienen comas o comillas
        const escapedData = rowData.map(field => {
          if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        });

        csvContent += escapedData.join(',') + '\n';
      });

      // Agregar BOM para UTF-8
      const csvWithBOM = '\uFEFF' + csvContent;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="inventario_arboles.csv"');
      res.send(csvWithBOM);

    } catch (error) {
      console.error("Error al exportar CSV:", error);
      res.status(500).json({ message: "Error al exportar CSV" });
    }
  });

  // Descargar plantilla CSV para importación
  apiRouter.get("/trees/template-csv", async (req: Request, res: Response) => {
    try {
      // Plantilla con ejemplos reales para México
      const templateData = [
        {
          codigo: "AHU-001",
          especie_id: "1",
          parque_id: "5",
          latitud: "20.6597",
          longitud: "-103.3496",
          fecha_plantacion: "2024-03-15",
          etapa_desarrollo: "Adulto",
          edad_estimada: "15",
          altura: "8.5",
          diametro: "45.2",
          cobertura_copa: "6.8",
          estado_salud: "Bueno",
          descripcion_ubicacion: "Entrada principal del parque",
          notas: "Árbol emblemático, requiere monitoreo especial"
        },
        {
          codigo: "JAC-002",
          especie_id: "2",
          parque_id: "5",
          latitud: "20.6598",
          longitud: "-103.3497",
          fecha_plantacion: "2023-11-20",
          etapa_desarrollo: "Joven",
          edad_estimada: "3",
          altura: "4.2",
          diametro: "18.5",
          cobertura_copa: "3.1",
          estado_salud: "Excelente",
          descripcion_ubicacion: "Área recreativa central",
          notas: "Floración abundante en primavera"
        }
      ];

      const headers = [
        'codigo',
        'especie_id',
        'parque_id',
        'latitud',
        'longitud',
        'fecha_plantacion',
        'etapa_desarrollo',
        'edad_estimada',
        'altura',
        'diametro',
        'cobertura_copa',
        'estado_salud',
        'descripcion_ubicacion',
        'notas'
      ];

      let csvContent = headers.join(',') + '\n';

      templateData.forEach(row => {
        const rowData = headers.map(header => row[header as keyof typeof row] || '');
        csvContent += rowData.join(',') + '\n';
      });

      // Crear el CSV con BOM UTF-8 usando Buffer para asegurar codificación correcta
      const bom = Buffer.from('\uFEFF', 'utf8');
      const csvBuffer = Buffer.from(csvContent, 'utf8');
      const finalBuffer = Buffer.concat([bom, csvBuffer]);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="plantilla_arboles.csv"');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(finalBuffer);

    } catch (error) {
      console.error("Error al generar plantilla CSV:", error);
      res.status(500).json({ message: "Error al generar plantilla CSV" });
    }
  });

  // Importar árboles desde CSV
  apiRouter.post("/trees/import-csv", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { trees: importTrees } = req.body;

      if (!importTrees || !Array.isArray(importTrees)) {
        return res.status(400).json({ message: "Datos de árboles inválidos" });
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const treeData of importTrees) {
        try {
          // Validar campos requeridos
          if (!treeData.codigo) {
            errors.push(`Árbol sin código válido`);
            errorCount++;
            continue;
          }

          // Verificar si ya existe un árbol con el mismo código
          const existingTree = await db.execute(sql`
            SELECT id FROM trees WHERE code = ${treeData.codigo}
          `);

          if (existingTree.rows.length > 0) {
            errors.push(`El árbol con código ${treeData.codigo} ya existe`);
            errorCount++;
            continue;
          }

          // Insertar árbol
          await db.execute(sql`
            INSERT INTO trees (
              code,
              species_id,
              park_id,
              latitude,
              longitude,
              planting_date,
              age_estimate,
              height,
              trunk_diameter,
              canopy_coverage,
              location_description,
              notes,
              created_at,
              updated_at
            ) VALUES (
              ${treeData.codigo},
              ${treeData.especie_id ? parseInt(treeData.especie_id) : null},
              ${treeData.parque_id ? parseInt(treeData.parque_id) : null},
              ${treeData.latitud ? parseFloat(treeData.latitud) : null},
              ${treeData.longitud ? parseFloat(treeData.longitud) : null},
              ${treeData.fecha_plantacion || null},
              ${treeData.edad_estimada ? parseInt(treeData.edad_estimada) : null},
              ${treeData.altura ? parseFloat(treeData.altura) : null},
              ${treeData.diametro ? parseFloat(treeData.diametro) : null},
              ${treeData.cobertura_copa ? parseFloat(treeData.cobertura_copa) : null},
              ${treeData.descripcion_ubicacion || null},
              ${treeData.observaciones || null},
              NOW(),
              NOW()
            )
          `);

          successCount++;
        } catch (error) {
          console.error(`Error importando árbol ${treeData.codigo}:`, error);
          errors.push(`Error importando árbol ${treeData.codigo}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          errorCount++;
        }
      }

      res.json({
        message: `Importación completada. ${successCount} árboles importados exitosamente, ${errorCount} errores.`,
        successCount,
        errorCount,
        errors: errors.slice(0, 10) // Limitar errores mostrados
      });

    } catch (error) {
      console.error("Error en importación CSV:", error);
      res.status(500).json({ message: "Error al importar CSV" });
    }
  });
}