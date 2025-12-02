import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { parkImageUpload, documentUpload, videoUpload, memoryUpload } from '../middleware/uploads';
import { insertParkSchema } from '@shared/schema';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { generateParkPrefix } from '../code-generator';
import { processImportFile } from '../api/parksImport';
import { replitObjectStorage } from '../objectStorage-replit';
import { sql } from 'drizzle-orm';
import { db } from '../db';

const router = Router();

// ============================================================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================================================

/**
 * GET /parks - Listar todos los parques (público)
 * Soporta variantes: list, card, full, legacy
 */
router.get('/', async (req: Request, res: Response) => {
  console.log('🚀 [PARKS] Endpoint llamado, query:', req.query);
  try {
    const { 
      getParksListVariant, 
      getParksCardVariant, 
      getParksFullVariant,
      getParksDirectly 
    } = await import('../direct-park-queries');

    const variant = String(req.query.variant || 'full').toLowerCase();
    console.log(`📊 [PARKS] Variante solicitada: ${variant}`);

    // Variante LIST - Para dropdowns
    if (variant === 'list') {
      const parks = await getParksListVariant();
      console.log(`📊 [PARKS-LIST] Devolviendo ${parks.length} parques`);
      return res.json(parks);
    }

    // Preparar filtros
    const filters: any = {};
    if (req.query.parkType) filters.parkType = String(req.query.parkType);
    if (req.query.postalCode) filters.postalCode = String(req.query.postalCode);
    if (req.query.municipality) filters.municipality = String(req.query.municipality);
    if (req.query.search) filters.search = String(req.query.search);

    // Filtro de amenidades
    if (req.query.amenities) {
      const amenityIds = String(req.query.amenities)
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));
      if (amenityIds.length > 0) filters.amenities = amenityIds;
    }

    // Variante CARD
    if (variant === 'card') {
      const parks = await getParksCardVariant(filters);
      return res.json({ data: parks });
    }

    // Variante FULL (default)
    if (variant === 'full' || variant === 'optimized') {
      const parks = await getParksFullVariant(filters);
      return res.json({ data: parks });
    }

    // Variante LEGACY
    if (variant === 'legacy') {
      const parks = await getParksDirectly(filters);
      if (req.query.simple === 'true') {
        return res.json(parks.map(p => ({ id: p.id, name: p.name, location: p.location })));
      }
      return res.json({ data: parks });
    }

    // Default: FULL
    const parks = await getParksFullVariant(filters);
    res.json({ data: parks });

  } catch (error) {
    console.error('Error al obtener parques:', error);
    res.status(500).json({ message: 'Error fetching parks' });
  }
});

/**
 * GET /parks/export/csv - Exportar parques a CSV
 */
router.get('/export/csv', async (req: Request, res: Response) => {
  try {
    const { getParksDirectly } = await import('../direct-park-queries');
    const parks = await getParksDirectly();

    if (!parks || parks.length === 0) {
      return res.status(404).json({ message: 'No parks found to export' });
    }

    const csvData = parks.map(park => ({
      'ID': park.id,
      'Nombre': park.name,
      'Tipo de Parque': park.parkType || 'N/A',
      'Descripción': park.description || 'N/A',
      'Dirección': park.address || 'N/A',
      'Código Postal': park.postalCode || 'N/A',
      'Área (m²)': park.area || 'N/A',
      'Año de Fundación': park.foundationYear || 'N/A',
      'Administrador': park.administrator || 'N/A',
      'Estado de Conservación': park.conservationStatus || 'N/A',
      'Email de Contacto': park.contactEmail || 'N/A',
      'Teléfono de Contacto': park.contactPhone || 'N/A',
      'Latitud': park.latitude || 'N/A',
      'Longitud': park.longitude || 'N/A',
      'Certificaciones': park.certificaciones || 'N/A'
    }));

    const headers = Object.keys(csvData[0]);
    const csvRows = [headers.join(',')];

    csvData.forEach(row => {
      const values = headers.map(header => {
        const value = (row as any)[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=parques.csv');
    res.send('\uFEFF' + csvContent);

  } catch (error) {
    console.error('Error exporting parks to CSV:', error);
    res.status(500).json({ message: 'Error exporting parks' });
  }
});

/**
 * GET /parks/export/xlsx - Exportar parques a Excel
 */
router.get('/export/xlsx', async (req: Request, res: Response) => {
  try {
    const XLSX = await import('xlsx');
    const { getParksDirectly } = await import('../direct-park-queries');
    const parks = await getParksDirectly();

    if (!parks || parks.length === 0) {
      return res.status(404).json({ message: 'No parks found to export' });
    }

    const exportData = parks.map(park => ({
      'ID': park.id,
      'Nombre': park.name,
      'Tipo': park.parkType || '',
      'Descripción': park.description || '',
      'Dirección': park.address || '',
      'Código Postal': park.postalCode || '',
      'Área (m²)': park.area || '',
      'Año Fundación': park.foundationYear || '',
      'Administrador': park.administrator || '',
      'Email': park.contactEmail || '',
      'Teléfono': park.contactPhone || '',
      'Latitud': park.latitude || '',
      'Longitud': park.longitude || '',
      'Certificaciones': park.certificaciones || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Parques');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=parques.xlsx');
    res.send(buffer);

  } catch (error) {
    console.error('Error exporting parks to Excel:', error);
    res.status(500).json({ message: 'Error exporting parks' });
  }
});

/**
 * GET /parks/dashboard - Dashboard de parques
 */
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const { getParksDirectly } = await import('../direct-park-queries');
    const parks = await getParksDirectly();

    const dashboard = {
      totalParks: parks.length,
      parksByType: {} as Record<string, number>,
      parksByStatus: {} as Record<string, number>,
      totalArea: 0,
      averageArea: 0
    };

    parks.forEach(park => {
      // Por tipo
      const type = park.parkType || 'Sin tipo';
      dashboard.parksByType[type] = (dashboard.parksByType[type] || 0) + 1;

      // Por estado
      const status = park.status || 'Sin estado';
      dashboard.parksByStatus[status] = (dashboard.parksByStatus[status] || 0) + 1;

      // Área
      if (park.area) dashboard.totalArea += Number(park.area);
    });

    dashboard.averageArea = parks.length > 0 ? dashboard.totalArea / parks.length : 0;

    res.json(dashboard);
  } catch (error) {
    console.error('Error getting park dashboard:', error);
    res.status(500).json({ message: 'Error fetching dashboard' });
  }
});

/**
 * GET /parks/:id - Obtener un parque por ID (público)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);
    const { getParkByIdDirectly } = await import('../direct-park-queries');
    const park = await getParkByIdDirectly(parkId);

    if (!park) {
      return res.status(404).json({ message: 'Park not found' });
    }

    res.json(park);
  } catch (error) {
    console.error('Error al obtener parque:', error);
    res.status(500).json({ message: 'Error fetching park' });
  }
});

/**
 * GET /parks/:id/extended - Datos extendidos del parque
 */
router.get('/:id/extended', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);

    if (isNaN(parkId) || parkId <= 0) {
      return res.status(400).json({ message: 'Invalid park ID' });
    }

    // Datos básicos
    const parkResult = await pool.query(`
      SELECT 
        p.id, p.name, p.park_type as "parkType", p.description, p.address, 
        p.postal_code as "postalCode", p.latitude, p.longitude, 
        p.area, p.foundation_year as "foundationYear",
        p.administrator, p.status,
        p.regulation_url as "regulationUrl", p.opening_hours as "openingHours", 
        p.contact_email as "contactEmail", p.contact_phone as "contactPhone",
        p.video_url as "videoUrl", p.municipality_text as "municipalityText"
      FROM parks p
      WHERE p.id = $1
    `, [parkId]);

    if (parkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Park not found' });
    }

    const park = parkResult.rows[0];

    // Amenidades
    const amenitiesResult = await pool.query(`
      SELECT a.id, a.name, a.icon, a.category, 
             a.icon_type as "iconType", a.custom_icon_url as "customIconUrl",
             pa.module_name as "moduleName", pa.surface_area as "surfaceArea"
      FROM amenities a
      JOIN park_amenities pa ON a.id = pa.amenity_id
      WHERE pa.park_id = $1 AND pa.status = 'activo'
      ORDER BY a.category, a.name
    `, [parkId]);

    // Imágenes
    const imagesResult = await pool.query(`
      SELECT id, image_url as "imageUrl", caption, is_primary as "isPrimary"
      FROM park_images
      WHERE park_id = $1
      ORDER BY is_primary DESC, created_at DESC
    `, [parkId]);

    res.json({
      ...park,
      amenities: amenitiesResult.rows,
      images: imagesResult.rows
    });

  } catch (error) {
    console.error('Error getting extended park data:', error);
    res.status(500).json({ message: 'Error fetching park data' });
  }
});

/**
 * GET /parks/:id/amenities - Obtener amenidades de un parque
 */
router.get('/:id/amenities', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);
    const amenities = await storage.getParkAmenities(parkId);
    res.json(amenities);
  } catch (error) {
    console.error('Error fetching park amenities:', error);
    res.status(500).json({ message: 'Error fetching park amenities' });
  }
});

/**
 * GET /parks/:id/images - Obtener imágenes de un parque
 */
router.get('/:id/images', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);
    const images = await storage.getParkImages(parkId);

    const mappedImages = images.map(img => ({
      id: img.id,
      parkId: img.parkId,
      imageUrl: img.imageUrl,
      caption: img.caption,
      isPrimary: img.isPrimary,
      createdAt: img.createdAt
    }));

    res.json(mappedImages);
  } catch (error) {
    console.error('Error fetching park images:', error);
    res.status(500).json({ message: 'Error fetching park images' });
  }
});

/**
 * GET /parks/:id/evaluations - Obtener evaluaciones de un parque
 */
router.get('/:id/evaluations', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);

    const result = await pool.query(`
      SELECT 
        pe.id, pe.park_id as "parkId", pe.user_id as "userId",
        pe.rating, pe.cleanliness, pe.safety, pe.amenities as amenities_rating,
        pe.accessibility, pe.overall_experience as "overallExperience",
        pe.comment, pe.visit_date as "visitDate", pe.created_at as "createdAt",
        u.full_name as "userName"
      FROM park_evaluations pe
      LEFT JOIN users u ON pe.user_id = u.id
      WHERE pe.park_id = $1
      ORDER BY pe.created_at DESC
    `, [parkId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching park evaluations:', error);
    res.status(500).json({ message: 'Error fetching evaluations' });
  }
});

// ============================================================================
// RUTAS PROTEGIDAS (requieren autenticación y permisos)
// ============================================================================

/**
 * POST /parks - Crear un nuevo parque
 */
router.post('/',
  isAuthenticated,
  requirePermission('management:parks:parks:create'),
  async (req: Request, res: Response) => {
    try {
      console.log('🚀 Recibiendo petición de creación de parque:', req.body);

      const dataToValidate = {
        name: req.body.name,
        municipalityText: req.body.municipality || req.body.municipalityText,
        parkType: req.body.parkType || 'urbano',
        description: req.body.description,
        address: req.body.address,
        postalCode: req.body.postalCode,
        latitude: req.body.latitude,
        longitude: req.body.longitude?.trim(),
        area: req.body.area,
        foundationYear: req.body.foundationYear,
        administrator: req.body.administrator,
        contactPhone: req.body.contactPhone,
        contactEmail: req.body.contactEmail,
        certificaciones: req.body.certificaciones,
      };

      const parkData = insertParkSchema.parse(dataToValidate);
      const codePrefix = await generateParkPrefix(parkData.name);

      const newPark = await storage.createPark({
        ...parkData,
        code_prefix: codePrefix
      });

      console.log(`🏞️ Parque creado: ${newPark.name} (ID: ${newPark.id})`);
      res.status(201).json(newPark);

    } catch (error: any) {
      console.error('❌ Error creando parque:', error);

      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: 'Datos de entrada inválidos: ' + validationError.message,
          details: error.issues 
        });
      }

      res.status(500).json({ 
        message: 'Error creating park',
        details: error?.message || 'Unknown error'
      });
    }
  }
);

/**
 * POST /parks/import - Importar parques desde Excel/CSV
 */
router.post('/import',
  isAuthenticated,
  requirePermission('management:parks:parks:create'),
  memoryUpload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Debe seleccionar un archivo para importar'
        });
      }
      return await processImportFile(req, res);
    } catch (error) {
      console.error('Error en importación de parques:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante la importación'
      });
    }
  }
);

/**
 * POST /parks/bulk-delete - Eliminar múltiples parques
 */
router.post('/bulk-delete',
  isAuthenticated,
  requirePermission('management:parks:parks:delete'),
  async (req: Request, res: Response) => {
    try {
      const { parkIds } = req.body;

      if (!parkIds || !Array.isArray(parkIds) || parkIds.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de IDs de parques' });
      }

      console.log(`🗑️ [BULK DELETE] Eliminando ${parkIds.length} parques`);

      const deletedParks = [];
      const errors = [];

      for (const parkId of parkIds) {
        try {
          const numParkId = Number(parkId);
          if (isNaN(numParkId)) {
            errors.push({ parkId, error: 'ID de parque inválido' });
            continue;
          }

          await pool.query('BEGIN');

          // Eliminar dependencias
          await pool.query('DELETE FROM park_amenities WHERE park_id = $1', [numParkId]);
          await pool.query('DELETE FROM park_images WHERE park_id = $1', [numParkId]);
          await pool.query('DELETE FROM activities WHERE park_id = $1', [numParkId]);
          await pool.query('DELETE FROM incidents WHERE park_id = $1', [numParkId]);

          const deleteResult = await pool.query(
            'DELETE FROM parks WHERE id = $1 RETURNING name', 
            [numParkId]
          );

          if (deleteResult.rows.length > 0) {
            await pool.query('COMMIT');
            deletedParks.push({ id: numParkId, name: deleteResult.rows[0].name });
          } else {
            await pool.query('ROLLBACK');
            errors.push({ parkId: numParkId, error: 'Parque no encontrado' });
          }
        } catch (error: any) {
          await pool.query('ROLLBACK');
          errors.push({ parkId, error: error.message });
        }
      }

      res.json({
        success: true,
        deleted: deletedParks,
        errors: errors.length > 0 ? errors : undefined,
        message: `${deletedParks.length} parques eliminados`
      });

    } catch (error) {
      console.error('Error in bulk delete:', error);
      res.status(500).json({ error: 'Error eliminando parques' });
    }
  }
);

/**
 * PUT /parks/:id - Actualizar un parque
 */
router.put('/:id',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const parkData = { ...req.body };

      if (parkData.municipality && typeof parkData.municipality === 'string') {
        parkData.municipalityText = parkData.municipality;
        delete parkData.municipality;
      }

      const updatedPark = await storage.updatePark(parkId, parkData);

      if (!updatedPark) {
        return res.status(404).json({ message: 'Park not found' });
      }

      res.json(updatedPark);
    } catch (error) {
      console.error('Error updating park:', error);
      res.status(500).json({ message: 'Error updating park' });
    }
  }
);

/**
 * DELETE /parks/:id - Eliminar un parque
 */
router.delete('/:id',
  isAuthenticated,
  requirePermission('management:parks:parks:delete'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      console.log(`Solicitud de eliminación para parque ${parkId}`);

      // Eliminar dependencias en orden
      await db.execute(sql`DELETE FROM tree_maintenances WHERE tree_id IN (SELECT id FROM trees WHERE park_id = ${parkId})`);
      await db.execute(sql`DELETE FROM trees WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM park_amenities WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM park_images WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM activities WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM incidents WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM comments WHERE park_id = ${parkId}`);
      await db.execute(sql`DELETE FROM parks WHERE id = ${parkId}`);

      res.status(200).json({ message: 'Park deleted successfully' });
    } catch (error) {
      console.error('Error al eliminar parque:', error);
      res.status(500).json({ message: 'Error deleting park' });
    }
  }
);

/**
 * GET /parks/:id/dependencies - Obtener dependencias antes de eliminar
 */
router.get('/:id/dependencies',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const dependencies = await storage.getParkDependencies(parkId);
      res.json(dependencies);
    } catch (error) {
      console.error('Error fetching park dependencies:', error);
      res.status(500).json({ message: 'Error fetching park dependencies' });
    }
  }
);

// ============================================================================
// AMENIDADES
// ============================================================================

/**
 * POST /parks/:parkId/amenities - Agregar amenidad a un parque
 */
router.post('/:parkId/amenities',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      const { amenityId, moduleName, surfaceArea, status, description } = req.body;

      if (!amenityId) {
        return res.status(400).json({ message: 'amenityId es requerido' });
      }

      // Verificar si ya existe
      const existingCheck = await pool.query(`
        SELECT id FROM park_amenities 
        WHERE park_id = $1 AND amenity_id = $2
      `, [parkId, amenityId]);

      if (existingCheck.rows.length > 0) {
        return res.status(400).json({ 
          message: 'Esta amenidad ya está asignada a este parque'
        });
      }

      const result = await pool.query(`
        INSERT INTO park_amenities (park_id, amenity_id, module_name, surface_area, status, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [parkId, amenityId, moduleName || null, surfaceArea || null, status || 'activo', description || null]);

      res.json({
        message: 'Amenidad asignada correctamente',
        parkAmenity: result.rows[0]
      });
    } catch (error) {
      console.error('Error asignando amenidad:', error);
      res.status(500).json({ message: 'Error al asignar amenidad al parque' });
    }
  }
);

/**
 * PUT /parks/:parkId/amenities/:amenityId - Actualizar amenidad
 */
router.put('/:parkId/amenities/:amenityId',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      const amenityId = Number(req.params.amenityId);
      const { moduleName, surfaceArea, status, locationLatitude, locationLongitude, description } = req.body;

      const result = await pool.query(`
        UPDATE park_amenities 
        SET module_name = $3, surface_area = $4, status = $5,
            location_latitude = $6, location_longitude = $7, description = $8,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND park_id = $2
        RETURNING *
      `, [amenityId, parkId, moduleName, surfaceArea, status, locationLatitude, locationLongitude, description]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Amenidad no encontrada' });
      }

      res.json({ message: 'Amenidad actualizada', updatedAmenity: result.rows[0] });
    } catch (error) {
      console.error('Error actualizando amenidad:', error);
      res.status(500).json({ message: 'Error al actualizar amenidad' });
    }
  }
);

/**
 * DELETE /parks/:parkId/amenities/:amenityId - Eliminar amenidad
 */
router.delete('/:parkId/amenities/:amenityId',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      const amenityId = Number(req.params.amenityId);

      const result = await pool.query(`
        DELETE FROM park_amenities 
        WHERE id = $1 AND park_id = $2
        RETURNING *
      `, [amenityId, parkId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Amenidad no encontrada' });
      }

      res.json({ message: 'Amenidad eliminada', deletedAmenity: result.rows[0] });
    } catch (error) {
      console.error('Error eliminando amenidad:', error);
      res.status(500).json({ message: 'Error al eliminar amenidad' });
    }
  }
);

// ============================================================================
// IMÁGENES
// ============================================================================

/**
 * POST /parks/:id/images - Subir imagen de parque
 */
router.post('/:id/images',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  parkImageUpload.single('image'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);

      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó imagen' });
      }

      // Subir a Object Storage
      const filename = `park-images/${parkId}/${Date.now()}-${req.file.originalname}`;
      const imageUrl = await replitObjectStorage.uploadFile(req.file.buffer, filename, req.file.mimetype);

      // Guardar en BD
      const result = await pool.query(`
        INSERT INTO park_images (park_id, image_url, caption, is_primary)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [parkId, imageUrl, req.body.caption || null, req.body.isPrimary === 'true']);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error uploading park image:', error);
      res.status(500).json({ message: 'Error uploading image' });
    }
  }
);

/**
 * DELETE /parks/:parkId/images/:imageId - Eliminar imagen
 */
router.delete('/:parkId/images/:imageId',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      const imageId = Number(req.params.imageId);

      const result = await pool.query(`
        DELETE FROM park_images 
        WHERE id = $1 AND park_id = $2
        RETURNING *
      `, [imageId, parkId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Imagen no encontrada' });
      }

      res.json({ message: 'Imagen eliminada' });
    } catch (error) {
      console.error('Error deleting park image:', error);
      res.status(500).json({ message: 'Error deleting image' });
    }
  }
);

/**
 * PUT /parks/:parkId/images/:imageId/set-primary - Establecer imagen principal
 */
router.put('/:parkId/images/:imageId/set-primary',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.parkId);
      const imageId = Number(req.params.imageId);

      // Quitar primary de todas las imágenes del parque
      await pool.query(`
        UPDATE park_images SET is_primary = false WHERE park_id = $1
      `, [parkId]);

      // Establecer la nueva imagen como primary
      const result = await pool.query(`
        UPDATE park_images SET is_primary = true 
        WHERE id = $1 AND park_id = $2
        RETURNING *
      `, [imageId, parkId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Imagen no encontrada' });
      }

      res.json({ message: 'Imagen establecida como principal', image: result.rows[0] });
    } catch (error) {
      console.error('Error setting primary image:', error);
      res.status(500).json({ message: 'Error setting primary image' });
    }
  }
);

// ============================================================================
// DOCUMENTOS
// ============================================================================

/**
 * GET /parks/:id/documents - Obtener documentos de un parque
 */
router.get('/:id/documents', async (req: Request, res: Response) => {
  try {
    const parkId = Number(req.params.id);
    const documents = await storage.getParkDocuments(parkId);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching park documents:', error);
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

/**
 * POST /parks/:id/documents - Subir documento
 */
router.post('/:id/documents',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  documentUpload.single('document'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);

      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó documento' });
      }

      const documentData = {
        parkId,
        name: req.body.name || req.file.originalname,
        documentUrl: `/uploads/documents/${req.file.filename}`,
        documentType: req.body.documentType || 'other',
        description: req.body.description
      };

      const newDocument = await storage.createDocument(documentData);
      res.status(201).json(newDocument);
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ message: 'Error uploading document' });
    }
  }
);

// ============================================================================
// VOLUNTARIOS
// ============================================================================

/**
 * GET /parks/:id/volunteers - Obtener voluntarios de un parque
 */
router.get('/:id/volunteers',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);

      const result = await pool.query(`
        SELECT v.*, u.full_name as "userName", u.email as "userEmail"
        FROM volunteers v
        LEFT JOIN users u ON v.user_id = u.id
        WHERE v.preferred_park_id = $1
        ORDER BY v.created_at DESC
      `, [parkId]);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching park volunteers:', error);
      res.status(500).json({ message: 'Error fetching volunteers' });
    }
  }
);

/**
 * POST /parks/:id/volunteers - Asignar voluntario a parque
 */
router.post('/:id/volunteers',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const { volunteerId } = req.body;

      const result = await pool.query(`
        UPDATE volunteers SET preferred_park_id = $1 WHERE id = $2 RETURNING *
      `, [parkId, volunteerId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Voluntario no encontrado' });
      }

      res.json({ message: 'Voluntario asignado', volunteer: result.rows[0] });
    } catch (error) {
      console.error('Error assigning volunteer:', error);
      res.status(500).json({ message: 'Error assigning volunteer' });
    }
  }
);

/**
 * DELETE /parks/:id/volunteers/:volunteerId - Remover voluntario
 */
router.delete('/:id/volunteers/:volunteerId',
  isAuthenticated,
  requirePermission('management:parks:parks:edit'),
  async (req: Request, res: Response) => {
    try {
      const parkId = Number(req.params.id);
      const volunteerId = Number(req.params.volunteerId);

      const result = await pool.query(`
        UPDATE volunteers SET preferred_park_id = NULL 
        WHERE id = $1 AND preferred_park_id = $2
        RETURNING *
      `, [volunteerId, parkId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Voluntario no encontrado en este parque' });
      }

      res.json({ message: 'Voluntario removido del parque' });
    } catch (error) {
      console.error('Error removing volunteer:', error);
      res.status(500).json({ message: 'Error removing volunteer' });
    }
  }
);

// ============================================================================
// EXPORT
// ============================================================================

export default router;

/**
 * Función para registrar las rutas en la aplicación Express
 */
export function registerParkRoutes(app: any) {
  app.use('/api/parks', router);
  console.log('✅ Rutas de Parks registradas');
}