/**
 * Sistema de Validación para Importación de Datos
 * 
 * Proporciona validadores reutilizables para diferentes tipos de datos.
 * Los validadores se aplican automáticamente según el tipo de campo.
 */

import { 
  FieldDefinition, 
  FieldValidationResult, 
  RecordValidationResult,
  FileValidationResult 
} from './types';

// ============================================
// TIPOS DE VALIDADORES
// ============================================

type ValidatorFn = (value: unknown, field: FieldDefinition, row?: Record<string, unknown>) => {
  valid: boolean;
  error?: string;
  warning?: string;
  transformedValue?: unknown;
};

// ============================================
// VALIDADORES BASE
// ============================================

const validators: Record<string, ValidatorFn> = {
  /**
   * Valida que el campo no esté vacío
   */
  required: (value, field) => {
    const isEmpty = value === null || 
                   value === undefined || 
                   (typeof value === 'string' && value.trim() === '');
    
    if (isEmpty && field.required) {
      return { 
        valid: false, 
        error: `El campo "${field.label}" es requerido` 
      };
    }
    return { valid: true };
  },

  /**
   * Valida que el valor sea numérico
   */
  numeric: (value, field) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true }; // Campos vacíos se validan con 'required'
    }
    
    const strValue = String(value).trim().replace(/,/g, ''); // Remover comas
    const num = Number(strValue);
    
    if (isNaN(num)) {
      return { 
        valid: false, 
        error: `El campo "${field.label}" debe ser un número` 
      };
    }
    
    return { valid: true, transformedValue: num };
  },

  /**
   * Valida que el valor sea un entero
   */
  integer: (value, field) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }
    
    const strValue = String(value).trim().replace(/,/g, '');
    const num = Number(strValue);
    
    if (isNaN(num) || !Number.isInteger(num)) {
      return { 
        valid: false, 
        error: `El campo "${field.label}" debe ser un número entero` 
      };
    }
    
    return { valid: true, transformedValue: Math.floor(num) };
  },

  /**
   * Valida que el valor sea positivo
   */
  positive: (value, field) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }
    
    const num = Number(value);
    if (!isNaN(num) && num < 0) {
      return { 
        valid: false, 
        error: `El campo "${field.label}" debe ser un número positivo` 
      };
    }
    
    return { valid: true };
  },

  /**
   * Valida formato de fecha
   */
  date: (value, field) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }
    
    const strValue = String(value).trim();
    
    // Intentar parsear varios formatos comunes
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/,          // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}$/,            // DD-MM-YYYY
      /^\d{2}\/\d{2}\/\d{2}$/,          // DD/MM/YY
    ];
    
    const matchesFormat = formats.some(f => f.test(strValue));
    
    if (!matchesFormat) {
      // Intentar parsear como fecha de Excel (número de días desde 1900)
      const num = Number(strValue);
      if (!isNaN(num) && num > 0 && num < 100000) {
        const excelDate = new Date((num - 25569) * 86400 * 1000);
        if (!isNaN(excelDate.getTime())) {
          return { 
            valid: true, 
            transformedValue: excelDate.toISOString().split('T')[0] 
          };
        }
      }
      
      return { 
        valid: false, 
        error: `El campo "${field.label}" no tiene un formato de fecha válido. Use YYYY-MM-DD o DD/MM/YYYY` 
      };
    }
    
    // Convertir a formato estándar YYYY-MM-DD
    let date: Date;
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
      date = new Date(strValue);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(strValue)) {
      const [day, month, year] = strValue.split('/');
      date = new Date(`${year}-${month}-${day}`);
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(strValue)) {
      const [day, month, year] = strValue.split('-');
      date = new Date(`${year}-${month}-${day}`);
    } else if (/^\d{2}\/\d{2}\/\d{2}$/.test(strValue)) {
      const [day, month, year] = strValue.split('/');
      const fullYear = Number(year) > 50 ? `19${year}` : `20${year}`;
      date = new Date(`${fullYear}-${month}-${day}`);
    } else {
      date = new Date(strValue);
    }
    
    if (isNaN(date.getTime())) {
      return { 
        valid: false, 
        error: `El campo "${field.label}" contiene una fecha inválida` 
      };
    }
    
    return { 
      valid: true, 
      transformedValue: date.toISOString().split('T')[0] 
    };
  },

  /**
   * Valida formato de email
   */
  email: (value, field) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }
    
    const strValue = String(value).trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(strValue)) {
      return { 
        valid: false, 
        error: `El campo "${field.label}" no es un email válido` 
      };
    }
    
    return { valid: true, transformedValue: strValue.toLowerCase() };
  },

  /**
   * Valida formato de teléfono
   */
  phone: (value, field) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }
    
    const strValue = String(value).trim();
    // Remover caracteres comunes de formato
    const cleanPhone = strValue.replace(/[\s\-\(\)\+\.]/g, '');
    
    if (!/^\d{7,15}$/.test(cleanPhone)) {
      return { 
        valid: false, 
        error: `El campo "${field.label}" no parece ser un número de teléfono válido` 
      };
    }
    
    return { valid: true, transformedValue: cleanPhone };
  },

  /**
   * Valida coordenada de latitud
   */
  latitude: (value, field) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }
    
    const num = Number(String(value).replace(',', '.'));
    
    if (isNaN(num) || num < -90 || num > 90) {
      return { 
        valid: false, 
        error: `El campo "${field.label}" debe ser una latitud válida (-90 a 90)` 
      };
    }
    
    return { valid: true, transformedValue: num };
  },

  /**
   * Valida coordenada de longitud
   */
  longitude: (value, field) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }
    
    const num = Number(String(value).replace(',', '.'));
    
    if (isNaN(num) || num < -180 || num > 180) {
      return { 
        valid: false, 
        error: `El campo "${field.label}" debe ser una longitud válida (-180 a 180)` 
      };
    }
    
    return { valid: true, transformedValue: num };
  },

  /**
   * Valida que el valor esté en una lista de opciones (enum)
   * Formato del validador: 'enum:opcion1,opcion2,opcion3'
   */
  enum: (value, field) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }
    
    const options = field.enumOptions || [];
    const strValue = String(value).trim().toLowerCase();
    
    const matchedOption = options.find(opt => 
      opt.toLowerCase() === strValue
    );
    
    if (!matchedOption) {
      return { 
        valid: false, 
        error: `El campo "${field.label}" debe ser uno de: ${options.join(', ')}` 
      };
    }
    
    return { valid: true, transformedValue: matchedOption };
  },

  /**
   * Valida longitud máxima de texto
   * Formato: 'maxLength:200'
   */
  maxLength: (value, field) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }
    
    const strValue = String(value);
    // El límite viene del validador string en formato 'maxLength:200'
    const maxLengthValidator = field.validators?.find(v => v.startsWith('maxLength:'));
    const maxLength = maxLengthValidator ? 
      parseInt(maxLengthValidator.split(':')[1]) : 
      10000;
    
    if (strValue.length > maxLength) {
      return { 
        valid: false, 
        error: `El campo "${field.label}" excede el máximo de ${maxLength} caracteres` 
      };
    }
    
    return { valid: true };
  },

  /**
   * Valida booleanos (acepta varios formatos)
   */
  boolean: (value, field) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }
    
    const strValue = String(value).trim().toLowerCase();
    const trueValues = ['true', '1', 'sí', 'si', 'yes', 'verdadero', 'v', 'y', 's'];
    const falseValues = ['false', '0', 'no', 'falso', 'f', 'n'];
    
    if (trueValues.includes(strValue)) {
      return { valid: true, transformedValue: true };
    }
    
    if (falseValues.includes(strValue)) {
      return { valid: true, transformedValue: false };
    }
    
    return { 
      valid: false, 
      error: `El campo "${field.label}" debe ser Sí/No o Verdadero/Falso` 
    };
  },

  /**
   * Valida URLs
   */
  url: (value, field) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }
    
    const strValue = String(value).trim();
    
    try {
      new URL(strValue);
      return { valid: true };
    } catch {
      // Intentar agregar https:// si no tiene protocolo
      if (!strValue.startsWith('http://') && !strValue.startsWith('https://')) {
        try {
          new URL(`https://${strValue}`);
          return { 
            valid: true, 
            transformedValue: `https://${strValue}`,
            warning: `Se agregó "https://" al campo "${field.label}"`
          };
        } catch {
          // Continuar con error
        }
      }
      
      return { 
        valid: false, 
        error: `El campo "${field.label}" no es una URL válida` 
      };
    }
  },

  /**
   * Valida JSON
   */
  json: (value, field) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }
    
    // Si ya es un objeto, está bien
    if (typeof value === 'object') {
      return { valid: true };
    }
    
    const strValue = String(value).trim();
    
    try {
      const parsed = JSON.parse(strValue);
      return { valid: true, transformedValue: parsed };
    } catch {
      return { 
        valid: false, 
        error: `El campo "${field.label}" no contiene JSON válido` 
      };
    }
  },
};

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Valida un valor individual contra un campo
 */
export function validateFieldValue(
  value: unknown,
  field: FieldDefinition,
  row?: Record<string, unknown>
): FieldValidationResult {
  const result: FieldValidationResult = {
    field: field.key,
    valid: true,
    value,
    errors: [],
    warnings: [],
  };

  // Obtener validadores a aplicar
  const validatorNames = getValidatorsForField(field);
  
  let currentValue = value;

  for (const validatorName of validatorNames) {
    // Extraer nombre base del validador (ej: 'maxLength:200' -> 'maxLength')
    const baseName = validatorName.split(':')[0];
    const validator = validators[baseName];
    
    if (!validator) {
      console.warn(`Validador "${baseName}" no encontrado`);
      continue;
    }
    
    const validationResult = validator(currentValue, field, row);
    
    if (!validationResult.valid) {
      result.valid = false;
      if (validationResult.error) {
        result.errors.push(validationResult.error);
      }
    }
    
    if (validationResult.warning) {
      result.warnings.push(validationResult.warning);
    }
    
    // Aplicar transformación si existe
    if (validationResult.transformedValue !== undefined) {
      currentValue = validationResult.transformedValue;
      result.transformedValue = currentValue;
    }
  }
  
  // Si no hubo transformación, el valor transformado es el original
  if (result.transformedValue === undefined) {
    result.transformedValue = value;
  }
  
  return result;
}

/**
 * Determina qué validadores aplicar a un campo
 */
function getValidatorsForField(field: FieldDefinition): string[] {
  const validatorList: string[] = [];
  
  // Validador de requerido siempre primero
  if (field.required) {
    validatorList.push('required');
  }
  
  // Validadores según tipo de dato
  switch (field.type) {
    case 'number':
    case 'decimal':
      validatorList.push('numeric');
      break;
    case 'integer':
      validatorList.push('integer');
      break;
    case 'boolean':
      validatorList.push('boolean');
      break;
    case 'date':
    case 'datetime':
      validatorList.push('date');
      break;
    case 'json':
      validatorList.push('json');
      break;
  }
  
  // Validadores de enum
  if (field.enumOptions && field.enumOptions.length > 0) {
    validatorList.push('enum');
  }
  
  // Validadores personalizados del campo
  if (field.validators) {
    for (const v of field.validators) {
      if (!validatorList.includes(v)) {
        validatorList.push(v);
      }
    }
  }
  
  // Validadores especiales por nombre de campo
  const fieldNameLower = field.key.toLowerCase();
  
  if (fieldNameLower.includes('email')) {
    validatorList.push('email');
  }
  
  if (fieldNameLower.includes('phone') || fieldNameLower.includes('telefono')) {
    validatorList.push('phone');
  }
  
  if (fieldNameLower === 'latitude' || fieldNameLower === 'lat') {
    validatorList.push('latitude');
  }
  
  if (fieldNameLower === 'longitude' || fieldNameLower === 'lng' || fieldNameLower === 'lon') {
    validatorList.push('longitude');
  }
  
  if (fieldNameLower.includes('url')) {
    validatorList.push('url');
  }
  
  return validatorList;
}

/**
 * Valida un registro completo
 */
export function validateRecord(
  record: Record<string, unknown>,
  fields: FieldDefinition[],
  rowIndex: number
): RecordValidationResult {
  const result: RecordValidationResult = {
    rowIndex,
    valid: true,
    fields: [],
    errors: [],
    warnings: [],
  };
  
  for (const field of fields) {
    if (!field.importable) continue;
    
    const value = record[field.key];
    const fieldResult = validateFieldValue(value, field, record);
    
    result.fields.push(fieldResult);
    
    if (!fieldResult.valid) {
      result.valid = false;
      result.errors.push(...fieldResult.errors);
    }
    
    result.warnings.push(...fieldResult.warnings);
  }
  
  return result;
}

/**
 * Valida un archivo completo de importación
 */
export function validateFile(
  records: Record<string, unknown>[],
  fields: FieldDefinition[]
): FileValidationResult {
  const result: FileValidationResult = {
    valid: true,
    totalRecords: records.length,
    validRecords: 0,
    invalidRecords: 0,
    records: [],
    globalErrors: [],
    globalWarnings: [],
  };
  
  // Validar cada registro
  for (let i = 0; i < records.length; i++) {
    const recordResult = validateRecord(records[i], fields, i + 1);
    result.records.push(recordResult);
    
    if (recordResult.valid) {
      result.validRecords++;
    } else {
      result.invalidRecords++;
      result.valid = false;
    }
  }
  
  // Agregar advertencias globales si hay muchos errores
  if (result.invalidRecords > result.totalRecords * 0.5) {
    result.globalWarnings.push(
      `Más del 50% de los registros tienen errores. Revise el formato del archivo.`
    );
  }
  
  if (result.totalRecords === 0) {
    result.globalErrors.push('El archivo no contiene registros para importar');
    result.valid = false;
  }
  
  return result;
}

/**
 * Aplica las transformaciones de validación a los datos
 * Retorna los datos transformados
 */
export function applyTransformations(
  records: Record<string, unknown>[],
  validationResult: FileValidationResult
): Record<string, unknown>[] {
  return records.map((record, index) => {
    const recordValidation = validationResult.records[index];
    if (!recordValidation) return record;
    
    const transformed = { ...record };
    
    for (const fieldResult of recordValidation.fields) {
      if (fieldResult.transformedValue !== undefined) {
        transformed[fieldResult.field] = fieldResult.transformedValue;
      }
    }
    
    return transformed;
  });
}

// Exportar validadores individuales para uso directo
export { validators };
