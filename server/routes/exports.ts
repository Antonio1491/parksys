import { Router } from 'express';
import { ExportEngine } from '../exports/ExportEngine';
import { ExportOptions } from '../../shared/exports/config';
import { getExportConfig } from '../../shared/exports/registry';

const router = Router();
const exportEngine = new ExportEngine();

// Obtener configuración de exportación para una entidad
router.get('/api/exports/:entity/config', async (req, res) => {
  try {
    const { entity } = req.params;
    const config = getExportConfig(entity);
    
    if (!config) {
      return res.status(404).json({ 
        error: `Configuración de exportación no encontrada para: ${entity}` 
      });
    }

    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('[EXPORT CONFIG] Error:', error);
    res.status(500).json({ 
      error: 'Error al obtener configuración de exportación' 
    });
  }
});

// Exportar datos
router.post('/api/exports/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const exportOptions: ExportOptions = {
      entity,
      format: req.body.format || 'xlsx',
      fields: req.body.fields,
      filters: req.body.filters,
      filename: req.body.filename,
      template: req.body.template || 'corporate',
      branding: req.body.branding,
      sorting: req.body.sorting,
      limit: req.body.limit,
      offset: req.body.offset
    };

    console.log(`[EXPORT] Iniciando exportación para ${entity}:`, exportOptions);

    // Obtener userId desde sesión (placeholder - adaptar según sistema de auth)
    const userId = (req as any).session?.user?.id;

    // Ejecutar exportación
    const result = await exportEngine.export(exportOptions, userId);

    console.log(`[EXPORT] Exportación completada: ${result.filename}, ${result.recordCount} registros`);

    // Configurar headers para descarga
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.size.toString());

    // Enviar archivo
    res.send(result.data);

  } catch (error) {
    console.error('[EXPORT] Error:', error);
    
    if (error.name === 'ExportError') {
      return res.status(400).json({
        error: error.message,
        code: error.code,
        details: error.details
      });
    }

    res.status(500).json({ 
      error: 'Error interno durante la exportación' 
    });
  }
});

// Vista previa de datos (para mostrar muestra antes de exportar)
router.post('/api/exports/:entity/preview', async (req, res) => {
  try {
    const { entity } = req.params;
    const config = getExportConfig(entity);
    
    if (!config) {
      return res.status(404).json({ 
        error: `Entidad no encontrada: ${entity}` 
      });
    }

    // Crear opciones de exportación con límite para preview
    const previewOptions: ExportOptions = {
      ...req.body,
      entity,
      limit: 10, // Limitar a 10 registros para preview
      offset: 0
    };

    // Usar el engine para obtener datos procesados
    const result = await exportEngine.export(previewOptions);

    res.json({
      success: true,
      preview: {
        sampleData: JSON.parse(result.data.toString()), // Solo para preview
        totalFields: config.fields.length,
        selectedFields: previewOptions.fields || config.fields.map(f => f.key),
        estimatedRecords: result.recordCount
      }
    });

  } catch (error) {
    console.error('[EXPORT PREVIEW] Error:', error);
    res.status(500).json({ 
      error: 'Error al generar vista previa' 
    });
  }
});

export default router;