/**
 * Generador de Plantillas de Importación
 * 
 * Genera plantillas CSV/XLSX dinámicamente basadas en la configuración de entidades.
 * Las plantillas incluyen:
 * - Headers con los nombres de los campos
 * - Fila de ejemplo con valores de muestra
 * - Hoja de instrucciones (solo XLSX)
 */

import { FieldDefinition, EntityConfig, ImportTemplate } from './types';

// ============================================
// EJEMPLOS POR TIPO DE DATO
// ============================================

/**
 * Genera un valor de ejemplo para un campo según su tipo
 */
function generateExampleValue(field: FieldDefinition): string {
  // Si el campo tiene un ejemplo definido, usarlo
  if (field.example) {
    return field.example;
  }
  
  // Si es un enum, usar la primera opción
  if (field.enumOptions && field.enumOptions.length > 0) {
    return field.enumOptions[0];
  }
  
  // Generar ejemplo según el tipo
  switch (field.type) {
    case 'string':
      return getStringExample(field);
    case 'number':
    case 'decimal':
      return '123.45';
    case 'integer':
      return '100';
    case 'boolean':
      return 'Sí';
    case 'date':
      return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    case 'datetime':
      return new Date().toISOString();
    case 'time':
      return '09:00';
    case 'json':
      return '{}';
    case 'array':
      return '[]';
    default:
      return '';
  }
}

/**
 * Genera ejemplo para campos tipo string basado en el nombre del campo
 */
function getStringExample(field: FieldDefinition): string {
  const keyLower = field.key.toLowerCase();
  
  // Patrones comunes
  if (keyLower.includes('email')) return 'ejemplo@email.com';
  if (keyLower.includes('phone') || keyLower.includes('telefono')) return '5551234567';
  if (keyLower.includes('name') || keyLower.includes('nombre')) return 'Nombre de ejemplo';
  if (keyLower.includes('address') || keyLower.includes('direccion')) return 'Calle 123, Colonia Centro';
  if (keyLower.includes('description') || keyLower.includes('descripcion')) return 'Descripción del elemento';
  if (keyLower.includes('url')) return 'https://ejemplo.com';
  if (keyLower.includes('latitude') || keyLower === 'lat') return '20.9674';
  if (keyLower.includes('longitude') || keyLower === 'lng' || keyLower === 'lon') return '-89.6237';
  if (keyLower.includes('postal') || keyLower.includes('zip')) return '97000';
  if (keyLower.includes('code') || keyLower.includes('codigo')) return 'ABC-001';
  if (keyLower.includes('title') || keyLower.includes('titulo')) return 'Título de ejemplo';
  if (keyLower.includes('status') || keyLower.includes('estado')) return 'activo';
  
  return 'Texto de ejemplo';
}

// ============================================
// GENERACIÓN DE INSTRUCCIONES
// ============================================

/**
 * Genera instrucciones para la importación de una entidad
 */
function generateInstructions(config: EntityConfig): string[] {
  const instructions: string[] = [
    `=== INSTRUCCIONES DE IMPORTACIÓN: ${config.labelPlural.toUpperCase()} ===`,
    '',
    'FORMATO DEL ARCHIVO:',
    '- Use esta plantilla como base para su importación',
    '- La primera fila contiene los nombres de las columnas (NO la elimine)',
    '- La segunda fila es un ejemplo (puede eliminarla o reemplazarla)',
    '- Cada fila adicional representa un registro a importar',
    '',
    'CAMPOS REQUERIDOS (marcados con *):',
  ];
  
  // Listar campos requeridos
  const requiredFields = config.fields
    .filter(f => f.required && f.importable)
    .map(f => `  - ${f.label}`);
  
  if (requiredFields.length > 0) {
    instructions.push(...requiredFields);
  } else {
    instructions.push('  (Ningún campo es estrictamente requerido)');
  }
  
  instructions.push(
    '',
    'CAMPOS OPCIONALES:',
  );
  
  // Listar campos opcionales
  const optionalFields = config.fields
    .filter(f => !f.required && f.importable)
    .map(f => `  - ${f.label}`);
  
  if (optionalFields.length > 0) {
    instructions.push(...optionalFields.slice(0, 10)); // Máximo 10
    if (optionalFields.length > 10) {
      instructions.push(`  ... y ${optionalFields.length - 10} más`);
    }
  }
  
  instructions.push(
    '',
    'FORMATOS DE DATOS:',
    '- Fechas: YYYY-MM-DD (ej: 2024-01-15) o DD/MM/YYYY (ej: 15/01/2024)',
    '- Números: Use punto como separador decimal (ej: 123.45)',
    '- Booleanos: Sí/No, Verdadero/Falso, 1/0',
    '- Coordenadas: Formato decimal (ej: 20.9674, -89.6237)',
    '',
    'NOTAS IMPORTANTES:',
    `- Máximo ${config.import.maxRecords.toLocaleString()} registros por importación`,
  );
  
  if (config.import.uniqueFields && config.import.uniqueFields.length > 0) {
    const uniqueLabels = config.import.uniqueFields
      .map(key => {
        const field = config.fields.find(f => f.key === key);
        return field ? field.label : key;
      })
      .join(', ');
    
    instructions.push(
      `- Campos únicos para identificar duplicados: ${uniqueLabels}`,
    );
    
    if (config.import.allowUpdate) {
      instructions.push(
        '- Los registros existentes se actualizarán si coinciden los campos únicos',
      );
    } else {
      instructions.push(
        '- Los registros duplicados serán rechazados',
      );
    }
  }
  
  instructions.push(
    '',
    'SOPORTE:',
    '- Si tiene dudas, consulte la documentación del sistema',
    '- Los errores de validación se mostrarán antes de confirmar la importación',
  );
  
  return instructions;
}

// ============================================
// GENERACIÓN DE PLANTILLAS
// ============================================

/**
 * Genera una plantilla de importación para una entidad
 */
export function generateImportTemplate(
  config: EntityConfig,
  format: 'csv' | 'xlsx' = 'xlsx'
): ImportTemplate {
  // Filtrar solo campos importables
  const importableFields = config.fields.filter(f => f.importable);
  
  // Generar headers (con asterisco para requeridos)
  const headers = importableFields.map(f => 
    f.required ? `${f.label} *` : f.label
  );
  
  // Generar fila de ejemplo
  const exampleRow = importableFields.map(f => generateExampleValue(f));
  
  // Generar instrucciones
  const instructions = generateInstructions(config);
  
  // Nombre del archivo
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `plantilla_${config.entity}_${timestamp}.${format}`;
  
  return {
    entity: config.entity,
    format,
    filename,
    headers,
    exampleRow,
    instructions,
  };
}

/**
 * Genera el contenido CSV de una plantilla
 */
export function generateCSVContent(template: ImportTemplate): string {
  // Función para escapar valores CSV
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  
  const lines: string[] = [];
  
  // Agregar BOM para UTF-8 (ayuda con Excel y caracteres especiales)
  const BOM = '\uFEFF';
  
  // Header row
  lines.push(template.headers.map(escapeCSV).join(','));
  
  // Example row
  lines.push(template.exampleRow.map(escapeCSV).join(','));
  
  return BOM + lines.join('\n');
}

/**
 * Genera información para crear un archivo XLSX
 * Nota: La generación real del archivo XLSX se hace en el servidor con la librería xlsx
 */
export function generateXLSXData(template: ImportTemplate): {
  dataSheet: {
    name: string;
    data: string[][];
  };
  instructionsSheet: {
    name: string;
    data: string[][];
  };
} {
  return {
    dataSheet: {
      name: 'Datos',
      data: [
        template.headers,
        template.exampleRow,
      ],
    },
    instructionsSheet: {
      name: 'Instrucciones',
      data: template.instructions.map(line => [line]),
    },
  };
}

/**
 * Genera el mapeo de columnas esperado para una entidad
 * Útil para el frontend cuando necesita mostrar qué columnas se esperan
 */
export function getExpectedColumns(config: EntityConfig): Array<{
  key: string;
  label: string;
  required: boolean;
  type: string;
  description?: string;
  example?: string;
}> {
  return config.fields
    .filter(f => f.importable)
    .map(f => ({
      key: f.key,
      label: f.label,
      required: f.required,
      type: f.type,
      description: f.description,
      example: f.example || generateExampleValue(f),
    }));
}

// ============================================
// DESCARGA DE PLANTILLA (CLIENTE)
// ============================================

/**
 * Inicia la descarga de una plantilla CSV en el navegador
 * (Para uso en el cliente)
 */
export function downloadCSVTemplate(template: ImportTemplate): void {
  const content = generateCSVContent(template);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', template.filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
