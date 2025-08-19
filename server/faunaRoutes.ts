import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';
import { db } from './db';
import { faunaSpecies, insertFaunaSpeciesSchema } from '../shared/schema';
import { eq, like, desc, asc, count } from 'drizzle-orm';

const router = Router();

// ENDPOINT PRINCIPAL: Obtener todas las especies de fauna (para búsqueda global)
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Main fauna endpoint for search:', req.query);
    
    const species = await db
      .select({
        id: faunaSpecies.id,
        common_name: faunaSpecies.commonName,
        scientific_name: faunaSpecies.scientificName,
        habitat: faunaSpecies.habitat,
        image_url: faunaSpecies.imageUrl,
        category: faunaSpecies.category
      })
      .from(faunaSpecies)
      .orderBy(asc(faunaSpecies.commonName))
      .limit(100); // Límite razonable para búsqueda

    console.log(`✅ Found ${species.length} fauna species for search`);
    
    res.json({
      success: true,
      data: species
    });

  } catch (error) {
    console.error('❌ Error fetching fauna for search:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener las especies de fauna',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'fauna');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `fauna-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Configuración de multer específica para archivos CSV
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'temp');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `csv-import-${uniqueSuffix}.csv`);
  }
});

const uploadCSV = multer({ 
  storage: csvStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'));
    }
  }
});

// ENDPOINT PÚBLICO: Obtener todas las especies de fauna para la página pública /fauna
router.get('/public/species', async (req, res) => {
  try {
    console.log('🌍 Public fauna species request params:', req.query);
    
    const { 
      page = '1', 
      limit = '12', 
      search = '', 
      category = '',
      conservation_status = '',
      sort_by = 'commonName',
      sort_order = 'asc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Construir filtros dinámicamente
    const filters: any[] = [];
    
    if (search) {
      filters.push(like(faunaSpecies.commonName, `%${search}%`));
    }
    
    if (category && category !== 'all') {
      filters.push(eq(faunaSpecies.category, category as any));
    }
    
    if (conservation_status && conservation_status !== 'all') {
      filters.push(eq(faunaSpecies.conservationStatus, conservation_status as any));
    }

    // Determinar orden
    const orderBy = sort_order === 'desc' 
      ? desc(faunaSpecies[sort_by as keyof typeof faunaSpecies] as any)
      : asc(faunaSpecies[sort_by as keyof typeof faunaSpecies] as any);

    // Obtener datos con filtros
    const speciesQuery = db
      .select()
      .from(faunaSpecies)
      .limit(limitNum)
      .offset(offset)
      .orderBy(orderBy);

    // Aplicar filtros si existen
    const species = filters.length > 0 
      ? await speciesQuery.where(filters.length === 1 ? filters[0] : filters.reduce((acc, filter) => acc && filter))
      : await speciesQuery;

    // Obtener total para paginación
    const totalQuery = filters.length > 0 
      ? await db.select({ count: count() }).from(faunaSpecies).where(filters.length === 1 ? filters[0] : filters.reduce((acc, filter) => acc && filter))
      : await db.select({ count: count() }).from(faunaSpecies);

    const total = totalQuery[0].count as number;
    const totalPages = Math.ceil(total / limitNum);

    console.log('🌍 Public fauna pagination:', { page: pageNum, limit: limitNum, total, pages: totalPages });

    res.json({
      species,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Error fetching public fauna species:', error);
    res.status(500).json({ 
      error: 'Error al obtener las especies de fauna',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ENDPOINT PÚBLICO: Obtener una especie específica por ID para página de detalle
router.get('/public/species/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🌍 Public fauna species detail request for ID:', id);
    
    const [species] = await db
      .select()
      .from(faunaSpecies)
      .where(eq(faunaSpecies.id, parseInt(id)))
      .limit(1);

    if (!species) {
      return res.status(404).json({ error: 'Especie no encontrada' });
    }

    console.log('✅ Public fauna species found:', species.commonName);
    res.json(species);

  } catch (error) {
    console.error('❌ Error fetching public fauna species by ID:', error);
    res.status(500).json({ 
      error: 'Error al obtener la especie',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ENDPOINT ADMINISTRATIVO: Obtener todas las especies de fauna con paginación y filtros
router.get('/species', async (req, res) => {
  try {
    console.log('📋 Fauna species request params:', req.query);
    
    const { 
      page = '1', 
      limit = '9', 
      search = '', 
      category = '',
      conservation_status = '',
      sort_by = 'commonName',
      sort_order = 'asc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Construir filtros dinámicamente
    const filters: any[] = [];
    
    if (search) {
      filters.push(like(faunaSpecies.commonName, `%${search}%`));
    }
    
    if (category && category !== 'all') {
      filters.push(eq(faunaSpecies.category, category as any));
    }
    
    if (conservation_status && conservation_status !== 'all') {
      filters.push(eq(faunaSpecies.conservationStatus, conservation_status as any));
    }

    // Determinar orden
    const orderBy = sort_order === 'desc' 
      ? desc(faunaSpecies[sort_by as keyof typeof faunaSpecies] as any)
      : asc(faunaSpecies[sort_by as keyof typeof faunaSpecies] as any);

    // Obtener datos con filtros
    const speciesQuery = db
      .select()
      .from(faunaSpecies)
      .limit(limitNum)
      .offset(offset)
      .orderBy(orderBy);

    // Aplicar filtros si existen
    const species = filters.length > 0 
      ? await speciesQuery.where(filters.length === 1 ? filters[0] : filters.reduce((acc, filter) => acc && filter))
      : await speciesQuery;

    // Obtener total para paginación
    const totalQuery = filters.length > 0 
      ? await db.select({ count: count() }).from(faunaSpecies).where(filters.length === 1 ? filters[0] : filters.reduce((acc, filter) => acc && filter))
      : await db.select({ count: count() }).from(faunaSpecies);

    const total = totalQuery[0]?.count || 0;
    
    console.log(`📊 Fauna pagination: page ${pageNum}, limit ${limitNum}, total ${total}, pages ${Math.ceil(Number(total) / limitNum)}`);

    res.json({
      success: true,
      data: species,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching fauna species:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener especies de fauna' 
    });
  }
});

// Obtener una especie específica por ID
router.get('/species/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const species = await db
      .select()
      .from(faunaSpecies)
      .where(eq(faunaSpecies.id, id))
      .limit(1);

    if (species.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Especie no encontrada' 
      });
    }

    res.json({
      success: true,
      data: species[0]
    });
  } catch (error) {
    console.error('Error fetching fauna species:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener la especie' 
    });
  }
});

// Crear nueva especie
router.post('/species', async (req, res) => {
  try {
    console.log('Datos recibidos en backend:', JSON.stringify(req.body, null, 2));
    console.log('Tipo de content-type:', req.get('Content-Type'));
    console.log('Datos req.body directos:', req.body);
    
    // Intentar validar los datos
    try {
      const validatedData = insertFaunaSpeciesSchema.parse(req.body);
      console.log('✅ Validación exitosa, datos válidos:', validatedData);
      
      const newSpecies = await db
        .insert(faunaSpecies)
        .values(validatedData)
        .returning();

      res.status(201).json({
        success: true,
        data: newSpecies[0]
      });
    } catch (validationError) {
      console.error('❌ Error de validación Zod:', validationError);
      if (validationError instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          error: 'Datos inválidos',
          details: validationError.errors,
          receivedData: req.body
        });
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Error general creating fauna species:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al crear la especie' 
    });
  }
});

// Actualizar especie
router.put('/species/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🔄 PUT request recibido para especie ID: ${id}`);
    console.log('📋 Datos recibidos para actualización:', JSON.stringify(req.body, null, 2));
    
    const validatedData = insertFaunaSpeciesSchema.parse(req.body);
    console.log('✅ Datos validados correctamente:', validatedData);
    
    const updatedSpecies = await db
      .update(faunaSpecies)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(faunaSpecies.id, id))
      .returning();

    if (updatedSpecies.length === 0) {
      console.log(`❌ Especie con ID ${id} no encontrada`);
      return res.status(404).json({ 
        success: false, 
        error: 'Especie no encontrada' 
      });
    }

    console.log('✅ Especie actualizada exitosamente:', updatedSpecies[0]);
    res.json({
      success: true,
      data: updatedSpecies[0]
    });
  } catch (error) {
    console.error('❌ Error updating fauna species:', error);
    if (error instanceof z.ZodError) {
      console.log('❌ Error de validación Zod:', error.errors);
      return res.status(400).json({ 
        success: false, 
        error: 'Datos inválidos',
        details: error.errors 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Error al actualizar la especie' 
    });
  }
});

// Eliminar especie
router.delete('/species/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const deletedSpecies = await db
      .delete(faunaSpecies)
      .where(eq(faunaSpecies.id, id))
      .returning();

    if (deletedSpecies.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Especie no encontrada' 
      });
    }

    res.json({
      success: true,
      message: 'Especie eliminada correctamente'
    });
  } catch (error) {
    console.error('Error deleting fauna species:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al eliminar la especie' 
    });
  }
});

// Obtener estadísticas de fauna
router.get('/stats', async (req, res) => {
  try {
    // Total de especies
    const totalSpecies = await db
      .select({ count: count() })
      .from(faunaSpecies);

    // Especies por categoría
    const speciesByCategory = await db
      .select({ 
        category: faunaSpecies.category, 
        count: count() 
      })
      .from(faunaSpecies)
      .groupBy(faunaSpecies.category);

    // Especies en peligro
    const endangeredSpecies = await db
      .select({ count: count() })
      .from(faunaSpecies)
      .where(eq(faunaSpecies.isEndangered, true));

    // Especies por estado de conservación
    const speciesByConservationStatus = await db
      .select({ 
        status: faunaSpecies.conservationStatus, 
        count: count() 
      })
      .from(faunaSpecies)
      .groupBy(faunaSpecies.conservationStatus);

    res.json({
      success: true,
      data: {
        total: Number(totalSpecies[0]?.count || 0),
        byCategory: speciesByCategory.map(item => ({
          category: item.category,
          count: Number(item.count)
        })),
        endangered: Number(endangeredSpecies[0]?.count || 0),
        byConservationStatus: speciesByConservationStatus.map(item => ({
          status: item.status,
          count: Number(item.count)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching fauna stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener estadísticas de fauna' 
    });
  }
});

// Ruta para importar CSV de fauna
router.post('/import-csv', uploadCSV.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ningún archivo CSV'
      });
    }

    // Verificar que sea un archivo CSV
    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({
        success: false,
        error: 'El archivo debe ser de formato CSV'
      });
    }

    // fs y Papa ya están importados al inicio del archivo
    
    // Leer el archivo CSV
    const csvContent = fs.readFileSync(req.file.path, 'utf8');
    
    // Parsear CSV
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase()
    });

    if (parseResult.errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Error al procesar el archivo CSV',
        details: parseResult.errors
      });
    }

    const data = parseResult.data;
    const results = {
      success: 0,
      errors: [],
      total: data.length
    };

    // Procesar cada fila
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Mapear campos del CSV a la estructura de la base de datos
        const speciesData = {
          commonName: row['nombre_común'] || row['nombre_comun'] || row['common_name'] || '',
          scientificName: row['nombre_científico'] || row['nombre_cientifico'] || row['scientific_name'] || '',
          family: row['familia'] || row['family'] || '',
          category: mapCategory(row['categoría'] || row['categoria'] || row['category'] || ''),
          habitat: row['hábitat'] || row['habitat'] || '',
          description: row['descripción'] || row['descripcion'] || row['description'] || '',
          conservationStatus: mapConservationStatus(row['estado_conservación'] || row['estado_conservacion'] || row['conservation_status'] || ''),
          sizeCm: parseFloat(row['tamaño_cm'] || row['size_cm'] || '0') || null,
          weightGrams: parseFloat(row['peso_gramos'] || row['weight_grams'] || '0') || null,
          lifespan: parseInt(row['esperanza_vida'] || row['lifespan'] || '0') || null,
          diet: row['dieta'] || row['diet'] || '',
          behavior: row['comportamiento'] || row['behavior'] || '',
          ecologicalImportance: row['importancia_ecológica'] || row['importancia_ecologica'] || row['ecological_importance'] || '',
          threats: row['amenazas'] || row['threats'] || '',
          observationTips: row['consejos_observación'] || row['consejos_observacion'] || row['observation_tips'] || '',
          photoUrl: row['foto_url'] || row['photo_url'] || '',
          isEndangered: parseBooleanValue(row['en_peligro'] || row['is_endangered'] || 'false'),
          isNocturnal: parseBooleanValue(row['nocturno'] || row['is_nocturnal'] || 'false'),
          isMigratory: parseBooleanValue(row['migratorio'] || row['is_migratory'] || 'false'),
          iconType: 'default'
        };

        // Validar campos requeridos
        if (!speciesData.commonName || !speciesData.scientificName) {
          results.errors.push({
            row: i + 1,
            error: 'Nombre común y nombre científico son obligatorios',
            data: row
          });
          continue;
        }

        // Insertar en la base de datos
        await db.insert(faunaSpecies).values(speciesData);
        results.success++;

      } catch (error) {
        console.error(`Error procesando fila ${i + 1}:`, error);
        results.errors.push({
          row: i + 1,
          error: error.message || 'Error desconocido',
          data: row
        });
      }
    }

    // Limpiar archivo temporal
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error('Error eliminando archivo temporal:', cleanupError);
    }

    res.json({
      success: true,
      message: `Importación completada. ${results.success} especies importadas de ${results.total} registros.`,
      results
    });

  } catch (error) {
    console.error('Error en importación CSV:', error);
    
    // Intentar limpiar archivo temporal en caso de error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error eliminando archivo temporal tras fallo:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor durante la importación'
    });
  }
});

// Funciones auxiliares para mapeo de datos
function mapCategory(category) {
  const categoryMap = {
    'ave': 'aves',
    'aves': 'aves',
    'bird': 'aves',
    'birds': 'aves',
    'mamífero': 'mamiferos',
    'mamifero': 'mamiferos',
    'mamíferos': 'mamiferos',
    'mamiferos': 'mamiferos',
    'mammal': 'mamiferos',
    'mammals': 'mamiferos',
    'insecto': 'insectos',
    'insectos': 'insectos',
    'insect': 'insectos',
    'insects': 'insectos',
    'vida_acuática': 'vida_acuatica',
    'vida_acuatica': 'vida_acuatica',
    'acuática': 'vida_acuatica',
    'acuatica': 'vida_acuatica',
    'aquatic': 'vida_acuatica',
    'water_life': 'vida_acuatica'
  };
  return categoryMap[category.toLowerCase()] || 'aves';
}

function mapConservationStatus(status) {
  const statusMap = {
    'estable': 'estable',
    'stable': 'estable',
    'vulnerable': 'vulnerable',
    'en_peligro': 'en_peligro',
    'en peligro': 'en_peligro',
    'endangered': 'en_peligro',
    'en_peligro_crítico': 'en_peligro_critico',
    'en_peligro_critico': 'en_peligro_critico',
    'peligro_crítico': 'en_peligro_critico',
    'peligro_critico': 'en_peligro_critico',
    'critically_endangered': 'en_peligro_critico',
    'extinto_local': 'extinto_local',
    'extinto local': 'extinto_local',
    'locally_extinct': 'extinto_local'
  };
  return statusMap[status.toLowerCase()] || 'estable';
}

function parseBooleanValue(value) {
  const trueValues = ['true', '1', 'sí', 'si', 'yes', 'verdadero', 'cierto'];
  return trueValues.includes(value.toLowerCase());
}

// Ruta para descargar plantilla CSV
router.get('/csv-template', (req, res) => {
  try {
    const csvTemplate = `nombre_común,nombre_científico,familia,categoría,hábitat,descripción,estado_conservación,tamaño_cm,peso_gramos,esperanza_vida,dieta,comportamiento,importancia_ecológica,amenazas,consejos_observación,foto_url,en_peligro,nocturno,migratorio
Cardenal Rojo,Cardinalis cardinalis,Cardinalidae,aves,Bosques y jardines,Ave cantora de color rojo brillante,estable,21,45,4,Semillas e insectos,Territorial y social,Dispersor de semillas,Pérdida de hábitat,Observar en comederos al amanecer,,false,false,false
Ardilla Gris,Sciurus carolinensis,Sciuridae,mamiferos,Parques urbanos,Pequeño roedor arbóreo muy ágil,estable,25,500,6,Nueces y bellotas,Activo durante el día,Control de plagas,Tráfico vehicular,Buscar en árboles de roble,https://ejemplo.com/ardilla.jpg,false,false,false`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_fauna_especies.csv"');
    res.send('\uFEFF' + csvTemplate); // BOM para UTF-8
    
  } catch (error) {
    console.error('Error generando plantilla CSV:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar plantilla CSV'
    });
  }
});

// Ruta para subir imágenes de fauna
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ninguna imagen'
      });
    }

    const imageUrl = `/uploads/fauna/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        imageUrl,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: 'Error al subir la imagen'
    });
  }
});

export default router;