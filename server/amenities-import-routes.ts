import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

// Configuración de multer para archivos temporales
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV, XLS o XLSX'));
    }
  }
});

interface ImportError {
  row: number;
  field?: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  processed: number;
  imported: number;
  errors: ImportError[];
}

// Validar campos obligatorios y formatos
function validateAmenityRow(row: any, rowIndex: number): ImportError[] {
  const errors: ImportError[] = [];
  const requiredFields = ['name', 'icon', 'category'];
  
  // Validar campos obligatorios
  for (const field of requiredFields) {
    if (!row[field] || row[field].toString().trim() === '') {
      errors.push({
        row: rowIndex,
        field,
        message: `El campo ${field} es obligatorio`
      });
    }
  }

  // Validar categorías válidas
  const validCategories = ['servicios', 'infraestructura', 'recreativo', 'deportivo', 'cultural', 'ambiental'];
  if (row.category && !validCategories.includes(row.category.toLowerCase().trim())) {
    errors.push({
      row: rowIndex,
      field: 'category',
      message: `Categoría inválida. Debe ser una de: ${validCategories.join(', ')}`
    });
  }

  // Validar icon_type si está presente
  if (row.icon_type && !['system', 'custom'].includes(row.icon_type.toLowerCase().trim())) {
    errors.push({
      row: rowIndex,
      field: 'icon_type',
      message: 'icon_type debe ser "system" o "custom"'
    });
  }

  // Validar iconos del sistema
  const validSystemIcons = ['playground', 'sports', 'bathroom', 'parking', 'restaurant', 'bench', 'fountain', 'wifi', 'security', 'garden', 'park'];
  if (row.icon_type === 'system' && row.icon && !validSystemIcons.includes(row.icon.toLowerCase().trim())) {
    errors.push({
      row: rowIndex,
      field: 'icon',
      message: `Icono del sistema inválido. Debe ser uno de: ${validSystemIcons.join(', ')}`
    });
  }

  // Validar URL del icono personalizado
  if (row.icon_type === 'custom' && (!row.custom_icon_url || row.custom_icon_url.toString().trim() === '')) {
    errors.push({
      row: rowIndex,
      field: 'custom_icon_url',
      message: 'custom_icon_url es obligatorio cuando icon_type es "custom"'
    });
  }

  return errors;
}

// Parsear archivo según su tipo
function parseFile(buffer: Buffer, mimetype: string): any[] {
  try {
    if (mimetype === 'text/csv') {
      return parse(buffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } else {
      // Excel files
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(worksheet);
    }
  } catch (error) {
    throw new Error(`Error al parsear archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Registra rutas para importación de amenidades
 */
export function registerAmenitiesImportRoutes(app: any, apiRouter: any, isAuthenticated: any) {
  
  // Generar plantilla para descarga
  apiRouter.get('/amenities/template', (req: Request, res: Response) => {
    try {
      const format = req.query.format as string || 'csv';
      
      const templateData = [
        {
          name: 'Juegos Infantiles',
          icon: 'playground',
          category: 'servicios',
          icon_type: 'system',
          custom_icon_url: ''
        },
        {
          name: 'Baños Públicos',
          icon: 'bathroom',
          category: 'infraestructura',
          icon_type: 'system',
          custom_icon_url: ''
        }
      ];

      if (format === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Amenidades');
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_amenidades.xlsx');
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);
      } else {
        // CSV format
        const csvHeaders = ['name', 'icon', 'category', 'icon_type', 'custom_icon_url'];
        const csvRows = templateData.map(row => 
          csvHeaders.map(header => row[header as keyof typeof row] || '').join(',')
        );
        const csv = [csvHeaders.join(','), ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_amenidades.csv');
        res.send(csv);
      }
    } catch (error) {
      console.error('Error generando plantilla:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar plantilla'
      });
    }
  });

  // Importar amenidades desde archivo
  apiRouter.post('/amenities/import', isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se recibió ningún archivo'
        });
      }

      const { pool } = await import('./db');
      
      // Parsear archivo
      const data = parseFile(req.file.buffer, req.file.mimetype);
      
      if (!data || data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El archivo está vacío o no tiene datos válidos'
        });
      }

      const result: ImportResult = {
        success: true,
        message: '',
        processed: data.length,
        imported: 0,
        errors: []
      };

      let importedCount = 0;

      // Procesar cada fila
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowIndex = i + 2; // +2 porque empieza en fila 2 (después del header)

        // Validar datos de la fila
        const validationErrors = validateAmenityRow(row, rowIndex);
        if (validationErrors.length > 0) {
          result.errors.push(...validationErrors);
          continue;
        }

        try {
          // Normalizar datos
          const amenityData = {
            name: row.name.toString().trim(),
            icon: row.icon.toString().trim(),
            category: row.category.toString().toLowerCase().trim(),
            icon_type: (row.icon_type || 'system').toString().toLowerCase().trim(),
            custom_icon_url: row.custom_icon_url ? row.custom_icon_url.toString().trim() : null
          };

          // Verificar si ya existe una amenidad con el mismo nombre
          const existingCheck = await pool.query(
            'SELECT id FROM amenities WHERE LOWER(name) = LOWER($1)',
            [amenityData.name]
          );

          if (existingCheck.rows.length > 0) {
            result.errors.push({
              row: rowIndex,
              message: `Ya existe una amenidad con el nombre "${amenityData.name}"`
            });
            continue;
          }

          // Insertar amenidad
          await pool.query(`
            INSERT INTO amenities (name, icon, category, icon_type, custom_icon_url)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            amenityData.name,
            amenityData.icon,
            amenityData.category,
            amenityData.icon_type,
            amenityData.custom_icon_url
          ]);

          importedCount++;

        } catch (dbError) {
          console.error(`Error insertando fila ${rowIndex}:`, dbError);
          result.errors.push({
            row: rowIndex,
            message: `Error de base de datos: ${dbError instanceof Error ? dbError.message : 'Error desconocido'}`
          });
        }
      }

      result.imported = importedCount;
      
      if (result.errors.length > 0) {
        result.success = false;
        result.message = `Se importaron ${importedCount} de ${data.length} registros. ${result.errors.length} errores encontrados.`;
      } else {
        result.message = `Se importaron exitosamente ${importedCount} amenidades.`;
      }

      res.json(result);

    } catch (error) {
      console.error('Error en importación de amenidades:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al procesar archivo'
      });
    }
  });
}