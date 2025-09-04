import { Request, Response } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import path from 'path';
import fs from 'fs';
import { insertParkSchema } from '@shared/schema';
import { storage } from '../storage';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Configurar multer para almacenar archivos temporalmente
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tempDir = path.join(__dirname, '../../temp');
      // Crear directorio temp si no existe
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'parks-import-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no válido. Sólo se permiten archivos Excel (.xls, .xlsx) o CSV (.csv)'));
    }
  }
});

// Manejador de errores para multer
export const handleMulterErrors = (err: any, req: Request, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    // Error de multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'El archivo es demasiado grande. El tamaño máximo permitido es 5MB.'
      });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    // Otro tipo de error
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Middleware para subir un único archivo
export const uploadParkFile = upload.single('file');

// Genera una plantilla Excel para importación de parques
export const generateImportTemplate = (req: Request, res: Response) => {
  try {
    // Crear un libro de trabajo nuevo
    const wb = XLSX.utils.book_new();
    
    // Crear una hoja de datos con encabezados actualizados según formulario
    const headers = [
      'nombre',
      'municipio',
      'direccion',
      'descripcion',
      'codigo_postal',
      'latitud',
      'longitud',
      'area',
      'ano_fundacion',
      'horario_lunes',
      'horario_martes',
      'horario_miercoles',
      'horario_jueves',
      'horario_viernes',
      'horario_sabado',
      'horario_domingo',
      'administrador',
      'telefono_contacto',
      'email_contacto',
      'certificaciones'
    ];
    
    // Datos de ejemplo actualizados
    const exampleData = [
      {
        nombre: 'Parque Ejemplo',
        municipio: 'Guadalajara',
        direccion: 'Av. Ejemplo 123, Col. Centro',
        descripcion: 'Descripción detallada del parque ejemplo',
        codigo_postal: '44100',
        latitud: '20.659698',
        longitud: '-103.349609',
        area: '12000',
        ano_fundacion: '1995',
        horario_lunes: '06:00-22:00',
        horario_martes: '06:00-22:00',
        horario_miercoles: '06:00-22:00',
        horario_jueves: '06:00-22:00',
        horario_viernes: '06:00-22:00',
        horario_sabado: '08:00-20:00',
        horario_domingo: '08:00-18:00',
        administrador: 'María González',
        telefono_contacto: '3331234567',
        email_contacto: 'parque@ejemplo.com',
        certificaciones: 'Green Flag Award 2024, ISO 14001'
      },
      {
        nombre: 'Parque Modelo',
        municipio: 'Zapopan',
        direccion: 'Calle Modelo 456, Col. Moderna',
        descripcion: 'Parque lineal con ciclovía y áreas verdes',
        codigo_postal: '44190',
        latitud: '20.670000',
        longitud: '-103.350000',
        area: '5000',
        ano_fundacion: '2010',
        horario_lunes: '',
        horario_martes: '',
        horario_miercoles: '',
        horario_jueves: '',
        horario_viernes: '',
        horario_sabado: '',
        horario_domingo: '',
        administrador: '',
        telefono_contacto: '',
        email_contacto: '',
        certificaciones: ''
      }
    ];
    
    // Crear estructura de worksheet
    const ws_data = [headers];
    
    // Agregar datos de ejemplo
    exampleData.forEach(example => {
      const row = headers.map(header => {
        // Mapeo actualizado de campos según formulario
        const fieldMapping: { [key: string]: string } = {
          'nombre': 'name',
          'municipio': 'municipalityText',
          'direccion': 'address',
          'descripcion': 'description',
          'codigo_postal': 'postalCode',
          'latitud': 'latitude',
          'longitud': 'longitude',
          'area': 'area',
          'ano_fundacion': 'foundationYear',
          'horario_lunes': 'mondayHours',
          'horario_martes': 'tuesdayHours',
          'horario_miercoles': 'wednesdayHours',
          'horario_jueves': 'thursdayHours',
          'horario_viernes': 'fridayHours',
          'horario_sabado': 'saturdayHours',
          'horario_domingo': 'sundayHours',
          'administrador': 'administrator',
          'telefono_contacto': 'contactPhone',
          'email_contacto': 'contactEmail',
          'certificaciones': 'certificaciones'
        };
        
        const fieldName = fieldMapping[header] || header;
        return example[header as keyof typeof example] || '';
      });
      ws_data.push(row);
    });
    
    // Información sobre municipios válidos (AMG)
    const municipalityInfo = [
      [''],
      ['Municipios válidos (AMG):'],
      ['Guadalajara'],
      ['Zapopan'],
      ['San Pedro Tlaquepaque'],
      ['Tonalá'],
      ['Tlajomulco de Zúñiga'],
      ['El Salto'],
      ['Ixtlahuacán de los Membrillos'],
      ['Juanacatlán'],
      ['Zapotlanejo']
    ];
    
    // Información sobre campos obligatorios
    const requiredFieldsInfo = [
      [''],
      ['Campos obligatorios:'],
      ['nombre'],
      ['municipio'],
      ['direccion']
    ];
    
    // Información sobre formato de horarios
    const scheduleInfo = [
      [''],
      ['Formato de horarios:'],
      ['HH:MM-HH:MM (ej: 06:00-22:00)'],
      ['Vacío si no aplica'],
      [''],
      ['Formato certificaciones:'],
      ['Separadas por comas'],
      ['Ej: Green Flag Award 2024, ISO 14001']
    ];
    
    // Crear worksheet con los datos
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Agregar información adicional en columnas separadas
    XLSX.utils.sheet_add_aoa(ws, municipalityInfo, { origin: { r: 0, c: headers.length + 2 } });
    XLSX.utils.sheet_add_aoa(ws, requiredFieldsInfo, { origin: { r: 0, c: headers.length + 4 } });
    XLSX.utils.sheet_add_aoa(ws, scheduleInfo, { origin: { r: 0, c: headers.length + 6 } });
    
    // Agregar el worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Parques');
    
    // Generar el archivo Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Enviar respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_importacion_parques.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error al generar plantilla:', error);
    res.status(500).json({ message: 'Error al generar la plantilla de importación' });
  }
};

// Procesa el archivo de importación
export const processImportFile = async (req: Request, res: Response) => {
  try {
    console.log('🚀 [IMPORT] Iniciando proceso de importación de parques');
    console.log('📁 [IMPORT] Archivo recibido:', req.file ? req.file.filename : 'No hay archivo');
    console.log('🔍 [IMPORT] Detalles del archivo:', {
      originalname: req.file?.originalname,
      filename: req.file?.filename,
      path: req.file?.path,
      mimetype: req.file?.mimetype,
      size: req.file?.size
    });
    
    if (!req.file) {
      console.log('❌ [IMPORT] No se recibió archivo');
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }
    
    // Verificar que el path existe, si no usar el buffer directamente
    let filePath = req.file.path;
    let fileContent: string = '';
    
    if (!filePath && req.file.buffer) {
      console.log('🔄 [IMPORT] Usando buffer del archivo en memoria');
      fileContent = req.file.buffer.toString('utf8');
    } else if (!filePath) {
      console.log('❌ [IMPORT] No se puede acceder al archivo');
      return res.status(400).json({ message: 'Error al procesar el archivo subido' });
    } else {
      console.log('✅ [IMPORT] Usando archivo desde:', filePath);
      // Inicializar fileContent cuando usamos filePath
      fileContent = fs.readFileSync(filePath, 'utf8');
    }
    
    // Determinar el tipo de archivo y procesarlo
    let rawData: any[] = [];
    let fileExtension: string;
    
    // Obtener extensión del archivo
    if (filePath) {
      fileExtension = path.extname(filePath).toLowerCase();
    } else {
      // Usar el nombre original si no hay path
      fileExtension = path.extname(req.file.originalname || '').toLowerCase();
    }
    
    console.log('🔍 [IMPORT] Procesando archivo:', fileExtension);
    
    if (fileExtension === '.csv') {
      // Procesar archivo CSV
      let csvContent: string;
      
      if (filePath) {
        csvContent = fs.readFileSync(filePath, 'utf8');
      } else {
        csvContent = fileContent as string;
      }
      
      console.log('📄 [IMPORT] Contenido CSV (primeras 200 chars):', csvContent.substring(0, 200));
      
      rawData = parse(csvContent, {
        columns: true, // Usar la primera fila como headers
        skip_empty_lines: true,
        delimiter: ',',
        quote: '"',
        escape: '"',
        cast: false // Forzar que todos los valores se mantengan como strings
      });
      console.log('✅ [IMPORT] CSV procesado, filas:', rawData.length);
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Procesar archivo Excel
      try {
        let workbook;
        
        if (filePath) {
          workbook = XLSX.readFile(filePath);
        } else {
          workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rawData = XLSX.utils.sheet_to_json(worksheet, { raw: true }) as any[];
        console.log('✅ [IMPORT] Excel procesado, filas:', rawData.length);
      } catch (xlsxError) {
        console.error('❌ [IMPORT] Error con XLSX:', xlsxError);
        // Fallback: intentar leer como CSV
        let csvContent: string;
        
        if (filePath) {
          csvContent = fs.readFileSync(filePath, 'utf8');
        } else {
          csvContent = fileContent as string;
        }
        
        rawData = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          delimiter: ',',
          cast: false // Forzar que todos los valores se mantengan como strings
        });
        console.log('🔄 [IMPORT] Fallback CSV exitoso, filas:', rawData.length);
      }
    } else {
      throw new Error(`Tipo de archivo no soportado: ${fileExtension}`);
    }
    
    if (rawData.length === 0) {
      return res.status(400).json({ message: 'El archivo está vacío o no contiene datos válidos' });
    }
    
    // Mapeo ACTUALIZADO de nombres de columnas según nueva plantilla
    const fieldMappings: { [key: string]: string } = {
      'nombre': 'name',
      'municipio': 'municipalityText',
      'municipio_id': 'municipalityText',  // ✅ Agregar mapeo para municipio_id
      'direccion': 'address',
      'descripcion': 'description',
      'codigo_postal': 'postalCode',
      'latitud': 'latitude',
      'longitud': 'longitude',
      'area': 'area',
      'ano_fundacion': 'foundationYear',
      'horario_lunes': 'mondayHours',
      'horario_martes': 'tuesdayHours',
      'horario_miercoles': 'wednesdayHours',
      'horario_jueves': 'thursdayHours',
      'horario_viernes': 'fridayHours',
      'horario_sabado': 'saturdayHours',
      'horario_domingo': 'sundayHours',
      'administrador': 'administrator',
      'telefono_contacto': 'contactPhone',
      'email_contacto': 'contactEmail',
      'certificaciones': 'certificaciones'
    };

    // Función para convertir strings a números cuando sea necesario
    const convertToNumber = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null;
      
      // Limpiar el valor: remover comas, espacios y otros caracteres no numéricos excepto punto y guión
      const cleanValue = String(value)
        .replace(/,/g, '')  // Remover comas (separadores de miles)
        .replace(/\s/g, '') // Remover espacios
        .trim();
      
      if (cleanValue === '') return null;
      
      const num = Number(cleanValue);
      return isNaN(num) ? null : num;
    };

    // Función para limpiar strings
    const cleanString = (value: any): string | null => {
      if (value === null || value === undefined) return null;
      const str = String(value).trim();
      return str === '' ? null : str;
    };

    // Función para limpiar strings requeridos (no permite null)
    const cleanRequiredString = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value).trim();
      return str === '' ? 'Sin especificar' : str;
    };
    
    // Mapear tipos de parque en español a inglés
    const parkTypeMappings: { [key: string]: string } = {
      'Urbano': 'Urban',
      'Lineal': 'Linear',
      'Bosque Urbano': 'Urban Forest',
      'Jardín': 'Garden',
      'Unidad Deportiva': 'Sports Unit',
      'Otro': 'Other'
    };
    
    // Transformar datos
    const parksData = rawData.map((row, index) => {
      const transformedData: any = {};
      
      // Mapear campos según los nombres en español
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().trim();
        let englishKey = fieldMappings[normalizedKey];
        
        if (englishKey) {
          let value = row[key];
          
          // Convertir números específicos (incluyendo area)
          if (['foundationYear', 'area'].includes(englishKey)) {
            const numValue = convertToNumber(value);
            value = numValue;
          }
          
          // Limpiar campos requeridos (name, address)
          if (['name', 'address'].includes(englishKey)) {
            value = cleanRequiredString(value);
          }
          
          // Limpiar y mantener como strings opcionales (excluyendo area, name, address que ya se procesaron)
          if (['description', 'postalCode', 'administrator', 'contactPhone', 'contactEmail', 'latitude', 'longitude', 'municipalityText'].includes(englishKey)) {
            value = cleanString(value);
            // Para coordenadas, asegurar que no sean null
            if ((englishKey === 'latitude' || englishKey === 'longitude') && value === null) {
              value = '0.0'; // Valor por defecto para coordenadas
            }
          }
          
          // Convertir 'estacionamiento' a booleano
          if (englishKey === 'hasParking') {
            if (typeof value === 'string') {
              value = value.toLowerCase() === 'sí' || value.toLowerCase() === 'si' || value.toLowerCase() === 'yes' || value === '1' || value === 'true';
            } else if (typeof value === 'number') {
              value = value === 1;
            }
          }
          
          // Mapear tipo de parque
          if (englishKey === 'parkType' && typeof value === 'string') {
            value = parkTypeMappings[value] || value;
          }
          
          transformedData[englishKey] = value;
        }
      });
      
      // Agregar campos requeridos que faltan con valores por defecto
      if (!transformedData.parkType) {
        transformedData.parkType = 'urbano'; // Tipo por defecto
      }
      
      if (!transformedData.status) {
        transformedData.status = 'active'; // Estado por defecto
      }
      
      return transformedData;
    });
    
    // SIMPLIFICADO: Mantener municipio como texto libre
    console.log('🏙️ [IMPORT] Manteniendo municipios como texto libre en municipalityText');
    
    // Limpiar y procesar municipalityText (mantenerlo como está, no convertir a ID)
    parksData.forEach(park => {
      if (park.municipalityText) {
        park.municipalityText = park.municipalityText.trim();
        console.log(`📝 [IMPORT] Municipio texto: "${park.municipalityText}"`);
      }
    });

    // VALIDACIÓN DE DUPLICADOS: Obtener parques existentes
    const existingParks = await storage.getParks();
    console.log(`🔍 [IMPORT] Parques existentes en BD: ${existingParks.length}`);
    
    // Filtrar parques duplicados por nombre (case-insensitive)
    const filteredParks = parksData.filter(parkData => {
      const existingPark = existingParks.find(existing => 
        existing.name.toLowerCase().trim() === parkData.name?.toLowerCase().trim()
      );
      
      if (existingPark) {
        console.log(`⚠️ [IMPORT] Parque duplicado omitido: "${parkData.name}" (ya existe con ID ${existingPark.id})`);
        return false;
      }
      return true;
    });
    
    console.log(`🔄 [IMPORT] Parques después de filtrar duplicados: ${filteredParks.length} de ${parksData.length}`);

    // Validar y filtrar parques válidos
    const validParks: any[] = [];
    const errors: string[] = [];
    
    filteredParks.forEach((parkData, index) => {
      try {
        const validatedPark = insertParkSchema.parse(parkData);
        
        // CRÍTICO: Eliminar el campo id si existe para evitar conflictos con auto-generación
        const { id, ...parkDataWithoutId } = validatedPark as any;
        
        validParks.push(parkDataWithoutId);
      } catch (error) {
        if (error instanceof ZodError) {
          const rowNumber = index + 2; // +2 porque el índice empieza en 0 y hay un encabezado
          const validationError = fromZodError(error);
          errors.push(`Fila ${rowNumber}: ${validationError.message}`);
        } else {
          errors.push(`Error en la fila ${index + 2}: ${(error as Error).message}`);
        }
      }
    });
    
    // Si no hay parques válidos, retornar error
    if (validParks.length === 0) {
      return res.status(400).json({
        message: 'No se encontraron parques válidos para importar',
        errors
      });
    }
    
    // Crear parques en la base de datos
    let createdCount = 0;
    const importErrors: string[] = [];
    
    // Usar Promise.all para crear todos los parques en paralelo
    await Promise.all(
      validParks.map(async (parkData, index) => {
        try {
          await storage.createPark(parkData);
          createdCount++;
        } catch (error) {
          const rowNumber = index + 2;
          importErrors.push(`Error al importar parque en fila ${rowNumber}: ${(error as Error).message}`);
        }
      })
    );
    
    // Eliminar archivo temporal si existe
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Preparar respuesta
    const hasErrors = errors.length > 0 || importErrors.length > 0;
    const allErrors = [...errors, ...importErrors];
    
    return res.status(hasErrors && createdCount === 0 ? 400 : 200).json({
      success: createdCount > 0,
      parksImported: createdCount,
      message: createdCount > 0 
        ? `Se importaron ${createdCount} parques correctamente${hasErrors ? ', con algunos errores' : ''}.`
        : 'No se pudo importar ningún parque.',
      errors: allErrors,
      totalErrors: allErrors.length,
      totalProcessed: parksData.length
    });
    
  } catch (error) {
    // Si hay algún error en el proceso, eliminar el archivo temporal
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error al procesar archivo de importación:', error);
    return res.status(500).json({ 
      message: 'Error al procesar el archivo de importación',
      error: (error as Error).message
    });
  }
};