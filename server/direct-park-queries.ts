// direct-park-queries.ts
import { pool } from './db';

// Función para obtener la lista de parques
export async function getParksDirectly(filters?: any) {
  try {
    // Construir la consulta SQL básica CON tipología
    let queryStr = `
      SELECT DISTINCT
        p.id, p.name, p.municipality_id as "municipalityId", 
        p.park_type as "parkType", p.description, p.address, 
        p.postal_code as "postalCode", p.latitude, p.longitude, 
        p.area, p.foundation_year as "foundationYear",
        p.administrator, p.conservation_status as "conservationStatus",
        p.regulation_url as "regulationUrl", p.opening_hours as "openingHours", 
        p.contact_email as "contactEmail", p.contact_phone as "contactPhone",
        p.video_url as "videoUrl", p.certificaciones, p.typology_id,
        pt.id as "typologyId", pt.name as "typologyName", pt.code as "typologyCode",
        pt.normative_reference as "typologyNormativeReference", pt.country as "typologyCountry",
        pt.min_area as "typologyMinArea", pt.max_area as "typologyMaxArea"
      FROM parks p
      LEFT JOIN park_typology pt ON p.typology_id = pt.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    // Añadir filtros si existen
    if (filters) {
      if (filters.municipalityId !== undefined) {
        queryStr += ` AND p.municipality_id = $${paramIndex++}`;
        params.push(filters.municipalityId);
      }
      
      if (filters.parkType) {
        queryStr += ` AND p.park_type = $${paramIndex++}`;
        params.push(filters.parkType);
      }
      
      if (filters.postalCode) {
        queryStr += ` AND p.postal_code = $${paramIndex++}`;
        params.push(filters.postalCode);
      }
      
      if (filters.search) {
        queryStr += ` AND (
          p.name ILIKE $${paramIndex} OR
          COALESCE(p.description, '') ILIKE $${paramIndex} OR
          p.address ILIKE $${paramIndex}
        )`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }
      
      // FILTRO DE AMENIDADES - Esta es la parte crítica que faltaba
      if (filters.amenities && Array.isArray(filters.amenities) && filters.amenities.length > 0) {
        // Si se especifican amenidades, solo mostrar parques que tengan TODAS las amenidades especificadas
        queryStr += ` AND p.id IN (
          SELECT pa.park_id 
          FROM park_amenities pa 
          WHERE pa.amenity_id = ANY($${paramIndex})
          GROUP BY pa.park_id 
          HAVING COUNT(DISTINCT pa.amenity_id) = $${paramIndex + 1}
        )`;
        params.push(filters.amenities);
        params.push(filters.amenities.length);
        paramIndex += 2;
      }
    }
    
    // Ordenar por nombre
    queryStr += ` ORDER BY p.name`;
    
    // Ejecutar la consulta
    const result = await pool.query(queryStr, params);
    
    // Crear array para almacenar los parques con sus imágenes
    const parksWithImages = [];
    
    // Procesar cada parque para añadir sus imágenes
    for (const park of result.rows) {
      // Buscar imágenes para este parque
      let primaryImage = null;
      
      try {
        // Verificar si la tabla park_images existe
        const tableExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'park_images'
          ) as exists
        `);
        
        if (tableExists.rows[0].exists) {
          // Consultamos los campos disponibles en la tabla
          const columnsResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'park_images'
          `);
          
          const columns = columnsResult.rows.map(row => row.column_name);
          console.log(`Columnas en park_images para park ${park.id}:`, columns.join(', '));
          
          // Verificamos qué nombre tiene la columna de imagen
          const imageUrlColumn = columns.includes('image_url') ? 'image_url' : 
                               columns.includes('url') ? 'url' : null;
                               
          // Verificamos qué nombre tiene la columna de imagen principal
          const isPrimaryColumn = columns.includes('is_primary') ? 'is_primary' : 
                               columns.includes('primary') ? 'primary' : null;
          
          if (!imageUrlColumn) {
            console.error("No se encontró una columna para la URL de imagen");
            return;
          }
          
          // Construir la consulta según los campos disponibles
          let imageQuery;
          if (isPrimaryColumn) {
            imageQuery = `
              SELECT ${imageUrlColumn} as image_url 
              FROM park_images 
              WHERE park_id = $1
              ORDER BY ${isPrimaryColumn} DESC
              LIMIT 1
            `;
          } else {
            imageQuery = `
              SELECT ${imageUrlColumn} as image_url
              FROM park_images 
              WHERE park_id = $1
              LIMIT 1
            `;
          }
          
          const imageResult = await pool.query(imageQuery, [park.id]);
          
          if (imageResult.rows.length > 0) {
            primaryImage = imageResult.rows[0].image_url;
            console.log(`Imagen principal para parque ${park.id}:`, primaryImage);
          }
        }
      } catch (err) {
        console.error(`Error al obtener imagen para parque ${park.id}:`, err);
      }
      
      // Obtener amenidades del parque
      let amenities = [];
      try {
        // Verificar si la tabla park_amenities existe
        const amenitiesTableExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'park_amenities'
          ) as exists
        `);
        
        if (amenitiesTableExists.rows[0].exists) {
          // Consultamos las amenidades relacionadas con este parque
          const amenitiesQuery = `
            SELECT a.id, a.name, a.icon, a.custom_icon_url as "customIconUrl",
                   pa.module_name as "moduleName", pa.location_latitude as "locationLatitude",
                   pa.location_longitude as "locationLongitude", pa.surface_area as "surfaceArea",
                   pa.status, pa.description
            FROM amenities a
            INNER JOIN park_amenities pa ON a.id = pa.amenity_id
            WHERE pa.park_id = $1
          `;
          
          const amenitiesResult = await pool.query(amenitiesQuery, [park.id]);
          amenities = amenitiesResult.rows || [];
        }
      } catch (err) {
        console.error(`Error al obtener amenidades para parque ${park.id}:`, err);
      }

      // Obtener actividades del parque
      let activities = [];
      try {
        // Verificar si la tabla activities existe
        const activitiesTableExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'activities'
          ) as exists
        `);
        
        if (activitiesTableExists.rows[0].exists) {
          // Consultamos las actividades relacionadas con este parque
          const activitiesQuery = `
            SELECT 
              a.id, 
              a.title, 
              a.description, 
              a.start_date as "startDate",
              a.end_date as "endDate",
              a.start_time as "startTime",
              a.end_time as "endTime",
              a.instructor_id as "instructorId",
              a.capacity as "maxParticipants",
              a.price,
              a.category_id as "categoryId",
              a.registration_enabled as "registrationEnabled",
              a.category,
              a.location
            FROM activities a
            WHERE a.park_id = $1 
            ORDER BY a.start_date ASC
          `;
          
          const activitiesResult = await pool.query(activitiesQuery, [park.id]);
          activities = activitiesResult.rows || [];
        }
      } catch (err) {
        console.error(`Error al obtener actividades para parque ${park.id}:`, err);
      }

      // Construir objeto tipology si existe
      const typology = park.typologyId ? {
        id: park.typologyId,
        name: park.typologyName,
        code: park.typologyCode,
        normativeReference: park.typologyNormativeReference,
        country: park.typologyCountry,
        minArea: park.typologyMinArea,
        maxArea: park.typologyMaxArea
      } : undefined;

      // Agregar el parque con su imagen, amenidades, actividades y tipología al array
      parksWithImages.push({
        ...park,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
        surfaceArea: park.area || null,
        closingHours: null,
        mainImageUrl: primaryImage,
        primaryImage: primaryImage,  // Este campo es el que usa ParkCard
        amenities: amenities,       // Añadimos las amenidades
        activities: activities,     // Añadimos las actividades
        typology: typology          // Añadimos la tipología
      });
    }
    
    return parksWithImages;
  } catch (error) {
    console.error("Error al obtener parques:", error);
    return [];
  }
}

// Función para obtener un parque específico con todos sus datos relacionados
export async function getParkByIdDirectly(parkId: number) {
  try {
    console.log("Consultando parque con ID:", parkId);

    // Verificación simple para asegurar que el ID es válido
    if (!parkId || isNaN(parkId)) {
      console.error("ID de parque inválido:", parkId);
      return null;
    }
    
    // Obtener datos básicos del parque - Usando try/catch individual para cada consulta
    let park;
    try {
      const parkResult = await pool.query(`
        SELECT 
          id, name, municipality_id as "municipalityId", 
          park_type as "parkType", description, address, 
          postal_code as "postalCode", latitude, longitude, 
          area, green_area as "greenArea", foundation_year as "foundationYear",
          administrator, conservation_status as "conservationStatus",
          regulation_url as "regulationUrl", opening_hours as "openingHours", 
          contact_email as "contactEmail", contact_phone as "contactPhone",
          video_url as "videoUrl", certificaciones
        FROM parks
        WHERE id = $1
      `, [parkId]);
      
      console.log("Resultados de la consulta de parque:", parkResult.rowCount);
      
      if (parkResult.rowCount === 0) {
        return null;
      }
      
      park = parkResult.rows[0];
      console.log("Datos básicos del parque obtenidos:", park.name);
    } catch (err) {
      console.error("Error al obtener datos básicos del parque:", err);
      // Si falla esta consulta esencial, retornamos null
      return null;
    }
    
    // Obtener información del municipio si existe municipalityId
    let municipality = null;
    if (park.municipalityId) {
      try {
        const municipalityResult = await pool.query(`
          SELECT id, name, state 
          FROM municipalities 
          WHERE id = $1
        `, [park.municipalityId]);
        
        if (municipalityResult.rowCount > 0) {
          municipality = municipalityResult.rows[0];
          console.log("Municipio encontrado:", municipality.name);
        }
      } catch (err) {
        console.error("Error al obtener municipio:", err);
      }
    }

    // Documentos - usar la tabla park_documents que existe
    let documents = [];
    try {
      const documentsResult = await pool.query(`
        SELECT 
          id, 
          park_id as "parkId", 
          title, 
          file_url as "fileUrl",
          file_type as "fileType",
          description,
          category,
          created_at as "createdAt"
        FROM park_documents 
        WHERE park_id = $1 
        ORDER BY created_at DESC
      `, [parkId]);
      
      documents = documentsResult.rows;
      console.log(`Documentos encontrados para parque ${parkId}:`, documents.length);
    } catch (e) {
      console.log("Error consultando documentos:", e);
    }

    // Inicializamos las propiedades que iremos rellenando
    const extendedPark = {
      ...park,
      municipality: municipality, // Agregamos el municipio completo
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true,
      surfaceArea: park.area || null,
      closingHours: null,
      mainImageUrl: null,
      amenities: [],
      images: [],
      documents: documents,
      activities: [],
      trees: {
        total: 0,
        byHealth: {
          'Bueno': 0,
          'Regular': 0,
          'Malo': 0,
          'Desconocido': 0
        },
        bySpecies: {}
      }
    };
    
    // Obtener amenidades del parque con detalles completos
    try {
      const amenitiesResult = await pool.query(`
        SELECT a.id, a.name, a.icon, a.category, a.icon_type as "iconType", a.custom_icon_url as "customIconUrl",
               pa.id as "parkAmenityId", pa.module_name as "moduleName", pa.location_latitude as "locationLatitude",
               pa.location_longitude as "locationLongitude", pa.surface_area as "surfaceArea",
               pa.status, pa.description
        FROM amenities a
        JOIN park_amenities pa ON a.id = pa.amenity_id
        WHERE pa.park_id = $1
      `, [parkId]);
      
      console.log("Amenidades encontradas:", amenitiesResult.rowCount);
      extendedPark.amenities = amenitiesResult.rows || [];
    } catch (err) {
      console.error("Error al obtener amenidades:", err);
      // Continuamos con el resto de consultas aunque esta falle
    }
    
    // Obtener los nombres de columnas de la tabla park_images para adaptar la consulta
    try {
      // Primero, verificamos qué columnas existen en la tabla park_images
      const imageColumns = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'park_images'
      `);
      
      console.log("Columnas disponibles en park_images:", imageColumns.rows.map(r => r.column_name).join(', '));
      
      // Construimos una consulta dinámica basada en las columnas disponibles
      const columnsArray = [];
      
      // Añadimos campos básicos que deben existir
      columnsArray.push('id');
      columnsArray.push('park_id as "parkId"');
      
      // Comprobamos campos opcionales
      if (imageColumns.rows.some(col => col.column_name === 'image_url')) {
        columnsArray.push('image_url as "imageUrl"');
      }
      if (imageColumns.rows.some(col => col.column_name === 'is_primary')) {
        columnsArray.push('is_primary as "isPrimary"');
      }
      if (imageColumns.rows.some(col => col.column_name === 'description')) {
        columnsArray.push('description');
      }
      if (imageColumns.rows.some(col => col.column_name === 'caption')) {
        columnsArray.push('caption');
      }
      
      // Ahora construimos y ejecutamos la consulta
      const query = `
        SELECT ${columnsArray.join(', ')}
        FROM park_images
        WHERE park_id = $1
        ${imageColumns.rows.some(col => col.column_name === 'is_primary') ? 'ORDER BY is_primary DESC' : ''}
      `;
      
      console.log("Consulta de imágenes generada:", query);
      const imagesResult = await pool.query(query, [parkId]);
      
      console.log("Imágenes encontradas:", imagesResult.rowCount);
      extendedPark.images = imagesResult.rows || [];
      
      // Encontrar la imagen principal, si existe
      const mainImage = extendedPark.images.find((img: any) => img.isPrimary);
      if (mainImage && mainImage.imageUrl) {
        extendedPark.mainImageUrl = mainImage.imageUrl;
      }
    } catch (err) {
      console.error("Error al obtener imágenes:", err);
      // Si hay error, dejamos el array vacío que ya se inicializó
    }

    
    // Verificamos las columnas disponibles en la tabla activities
    try {
      const activityColumns = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'activities'
      `);
      
      console.log("Columnas disponibles en activities:", activityColumns.rows.map(r => r.column_name).join(', '));
      
      // Construimos columnas para la consulta
      const columnsArray = [];
      
      // Añadimos campos básicos que deben existir
      columnsArray.push('a.id');
      columnsArray.push('a.park_id as "parkId"');
      columnsArray.push('a.title');
      
      // Comprobamos campos opcionales
      if (activityColumns.rows.some(col => col.column_name === 'description')) {
        columnsArray.push('a.description');
      }
      
      // Comprobamos si existe category (columna de texto)
      if (activityColumns.rows.some(col => col.column_name === 'category')) {
        columnsArray.push('a.category');
      }
      
      if (activityColumns.rows.some(col => col.column_name === 'start_date')) {
        columnsArray.push('a.start_date as "startDate"');
      }
      if (activityColumns.rows.some(col => col.column_name === 'end_date')) {
        columnsArray.push('a.end_date as "endDate"');
      }
      if (activityColumns.rows.some(col => col.column_name === 'capacity')) {
        columnsArray.push('a.capacity');
      }
      if (activityColumns.rows.some(col => col.column_name === 'instructor_id')) {
        columnsArray.push('a.instructor_id as "instructorId"');
      }
      if (activityColumns.rows.some(col => col.column_name === 'start_time')) {
        columnsArray.push('a.start_time as "startTime"');
      }
      if (activityColumns.rows.some(col => col.column_name === 'end_time')) {
        columnsArray.push('a.end_time as "endTime"');
      }
      if (activityColumns.rows.some(col => col.column_name === 'location')) {
        columnsArray.push('a.location');
      }
      if (activityColumns.rows.some(col => col.column_name === 'price')) {
        columnsArray.push('a.price');
      }
      if (activityColumns.rows.some(col => col.column_name === 'is_free')) {
        columnsArray.push('a.is_free as "isFree"');
      }
      if (activityColumns.rows.some(col => col.column_name === 'materials')) {
        columnsArray.push('a.materials');
      }
      if (activityColumns.rows.some(col => col.column_name === 'requirements')) {
        columnsArray.push('a.requirements');
      }
      // Agregar imagen de actividad desde activity_images
      columnsArray.push('ai.image_url as "imageUrl"');
      
      // Ahora construimos y ejecutamos la consulta con JOIN para incluir imágenes
      const query = `
        SELECT ${columnsArray.join(', ')}
        FROM activities a
        LEFT JOIN activity_images ai ON a.id = ai.activity_id AND ai.is_primary = true
        WHERE a.park_id = $1
        ${activityColumns.rows.some(col => col.column_name === 'start_date') ? 'ORDER BY a.start_date DESC' : ''}
      `;
      
      console.log("🎯 CONSULTA DE ACTIVIDADES GENERADA:", query);
      const activitiesResult = await pool.query(query, [parkId]);
      
      console.log("🎯 ACTIVIDADES ENCONTRADAS:", activitiesResult.rowCount);
      if (activitiesResult.rows.length > 0) {
        console.log("🎯 PRIMERA ACTIVIDAD:", JSON.stringify(activitiesResult.rows[0], null, 2));
      }
      extendedPark.activities = activitiesResult.rows || [];
    } catch (err) {
      console.error("Error al obtener actividades:", err);
      // Si hay error, dejamos el array vacío que ya se inicializó
    }
    
    // Contar árboles del parque - adaptado a la estructura real
    try {
      // Verificamos si la tabla trees existe
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'trees'
        ) as exists
      `);
      
      // Si la tabla no existe, usamos valores predeterminados
      if (!tableExists.rows[0].exists) {
        console.log("La tabla trees no existe, usando valores predeterminados");
        extendedPark.trees = {
          total: 0,
          byHealth: {
            'Bueno': 0, 
            'Regular': 0, 
            'Malo': 0, 
            'Desconocido': 0
          },
          bySpecies: {}
        };
        return;
      }
      
      // Consultamos los campos disponibles en la tabla trees
      const treeColumns = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'trees'
      `);
      
      console.log("Columnas disponibles en trees:", treeColumns.rows.map(r => r.column_name).join(', '));
      
      // Verificamos si existe la columna health_condition o estado
      const healthColumnName = treeColumns.rows.find(col => 
        col.column_name === 'health_condition' || 
        col.column_name === 'estado' || 
        col.column_name === 'health' || 
        col.column_name === 'condition'
      )?.column_name;
      
      // Construimos la consulta según los campos disponibles
      let treeQuery;
      if (healthColumnName) {
        treeQuery = `
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN ${healthColumnName} = 'Bueno' THEN 1 END) as good,
            COUNT(CASE WHEN ${healthColumnName} = 'Regular' THEN 1 END) as regular,
            COUNT(CASE WHEN ${healthColumnName} = 'Malo' THEN 1 END) as bad,
            COUNT(CASE WHEN ${healthColumnName} IS NULL OR ${healthColumnName} = '' THEN 1 END) as unknown
          FROM trees
          WHERE park_id = $1
        `;
      } else {
        // Si no existe la columna, simplemente contamos el total
        treeQuery = `
          SELECT 
            COUNT(*) as total
          FROM trees
          WHERE park_id = $1
        `;
      }
      
      console.log("Consulta de árboles generada:", treeQuery);
      const treeStatsResult = await pool.query(treeQuery, [parkId]);
      
      console.log("Estadísticas de árboles obtenidas:", treeStatsResult.rows[0]?.total || 0);
      
      if (treeStatsResult.rows && treeStatsResult.rows.length > 0) {
        extendedPark.trees = {
          total: parseInt(treeStatsResult.rows[0]?.total || '0'),
          byHealth: {
            'Bueno': parseInt(treeStatsResult.rows[0]?.good || '0'),
            'Regular': parseInt(treeStatsResult.rows[0]?.regular || '0'),
            'Malo': parseInt(treeStatsResult.rows[0]?.bad || '0'),
            'Desconocido': parseInt(treeStatsResult.rows[0]?.unknown || '0')
          },
          bySpecies: {}
        };
      }
    } catch (err) {
      console.error("Error al obtener estadísticas de árboles:", err);
    }
    
    // Obtener activos del parque
    try {
      // Verificamos si la tabla assets existe
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'assets'
        ) as exists
      `);
      
      if (tableExists.rows[0].exists) {
        console.log("Obteniendo activos del parque...");
        
        // Consultamos los activos con información de categoría y amenidad
        const assetsQuery = `
          SELECT 
            a.id,
            a.name,
            a.serial_number as "serialNumber",
            a.status,
            a.condition,
            a.location_description as "locationDescription",
            a.latitude,
            a.longitude,
            a.last_maintenance_date as "lastMaintenanceDate",
            a.next_maintenance_date as "nextMaintenanceDate",
            a.acquisition_date as "acquisitionDate",
            a.acquisition_cost as "acquisitionCost",
            a.current_value as "currentValue",
            a.manufacturer,
            a.model,
            a.notes,
            a.amenity_id as "amenityId",
            ac.name as "categoryName"
          FROM assets a
          LEFT JOIN asset_categories ac ON a.category_id = ac.id
          WHERE a.park_id = $1
          ORDER BY a.name
        `;
        
        const assetsResult = await pool.query(assetsQuery, [parkId]);
        console.log("Activos encontrados:", assetsResult.rowCount);
        
        extendedPark.assets = assetsResult.rows.map(asset => ({
          id: asset.id,
          name: asset.name,
          category: asset.categoryName || 'Sin categoría',
          condition: asset.condition || 'bueno',
          lastMaintenance: asset.lastMaintenanceDate,
          serialNumber: asset.serialNumber,
          status: asset.status,
          locationDescription: asset.locationDescription,
          latitude: asset.latitude,
          longitude: asset.longitude,
          manufacturer: asset.manufacturer,
          model: asset.model,
          notes: asset.notes,
          acquisitionDate: asset.acquisitionDate,
          acquisitionCost: asset.acquisitionCost,
          currentValue: asset.currentValue,
          nextMaintenanceDate: asset.nextMaintenanceDate,
          amenityId: asset.amenityId
        })) || [];
      } else {
        console.log("La tabla assets no existe, usando array vacío");
        extendedPark.assets = [];
      }
    } catch (err) {
      console.error("Error al obtener activos:", err);
      extendedPark.assets = [];
    }
    
    console.log("Preparando objeto de parque extendido");
    return extendedPark;
  } catch (error) {
    console.error("Error global al obtener parque:", error);
    throw error;
  }
}