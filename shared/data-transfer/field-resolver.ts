/**
 * Field Resolver - Combina información de Drizzle Schema con etiquetas humanas
 * 
 * Este módulo es el CORAZÓN del sistema de import/export.
 * Extrae la estructura de las tablas desde Drizzle y la combina con las etiquetas.
 */

import { getTableColumns, getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { 
  FieldDefinition, 
  FieldDataType, 
  EntityConfig,
  ImportConfig,
  ExportConfig 
} from './types';
import { 
  getFieldLabel, 
  isSystemField, 
  isExportOnlyField,
  isSensitiveField 
} from './field-labels';

// ============================================
// MAPEO DE TIPOS DRIZZLE → TIPOS INTERNOS
// ============================================

/**
 * Mapea el tipo de dato de Drizzle a nuestro tipo interno
 */
function mapDrizzleType(drizzleType: string): FieldDataType {
  const typeMap: Record<string, FieldDataType> = {
    // Strings
    'string': 'string',
    'text': 'string',
    'varchar': 'string',
    'char': 'string',
    
    // Números
    'number': 'number',
    'integer': 'integer',
    'serial': 'integer',
    'smallint': 'integer',
    'bigint': 'integer',
    'real': 'decimal',
    'float': 'decimal',
    'double': 'decimal',
    'decimal': 'decimal',
    'numeric': 'decimal',
    
    // Booleanos
    'boolean': 'boolean',
    
    // Fechas y tiempo
    'date': 'date',
    'timestamp': 'datetime',
    'timestamptz': 'datetime',
    'time': 'time',
    
    // JSON
    'json': 'json',
    'jsonb': 'json',
    
    // Arrays
    'array': 'array',
  };
  
  // Normalizar el tipo (puede venir como 'PgText', 'PgVarchar', etc.)
  const normalizedType = drizzleType
    .replace(/^Pg/, '')
    .replace(/^MySql/, '')
    .replace(/^SQLite/, '')
    .toLowerCase();
  
  return typeMap[normalizedType] || 'string';
}

/**
 * Extrae información de un campo de Drizzle
 */
function extractColumnInfo(columnName: string, column: any): Partial<FieldDefinition> {
  // Acceder a las propiedades internas de la columna de Drizzle
  const config = column.config || column;
  
  return {
    key: columnName,
    dbColumn: column.name || columnName,
    type: mapDrizzleType(column.dataType || column.columnType || 'string'),
    required: config.notNull === true && !config.hasDefault,
    hasDefault: config.hasDefault === true || config.default !== undefined,
    defaultValue: config.default,
    enumOptions: config.enumValues || undefined,
  };
}

// ============================================
// RESOLUCIÓN DE CAMPOS
// ============================================

/**
 * Obtiene todos los campos de una tabla Drizzle con sus definiciones completas
 * 
 * @param table Tabla de Drizzle (ej: parks, activities)
 * @param entityName Nombre de la entidad para buscar labels
 * @returns Array de definiciones de campos
 */
export function getFieldsFromTable(
  table: PgTable<any>, 
  entityName: string
): FieldDefinition[] {
  const columns = getTableColumns(table);
  
  return Object.entries(columns)
    .map(([columnName, column]) => {
      const columnInfo = extractColumnInfo(columnName, column);
      const isSystem = isSystemField(columnName);
      const isExportOnly = isExportOnlyField(columnName);
      const isSensitive = isSensitiveField(columnName);
      
      const field: FieldDefinition = {
        key: columnName,
        dbColumn: columnInfo.dbColumn || columnName,
        label: getFieldLabel(entityName, columnName),
        type: columnInfo.type || 'string',
        required: columnInfo.required || false,
        hasDefault: columnInfo.hasDefault || false,
        defaultValue: columnInfo.defaultValue,
        exportable: !isSystem && !isSensitive,
        importable: !isSystem && !isExportOnly && !isSensitive,
        enumOptions: columnInfo.enumOptions,
        validators: [],
      };
      
      // Agregar validadores automáticos según el tipo
      if (field.required) {
        field.validators?.push('required');
      }
      
      if (field.type === 'number' || field.type === 'integer' || field.type === 'decimal') {
        field.validators?.push('numeric');
      }
      
      if (field.type === 'date' || field.type === 'datetime') {
        field.validators?.push('date');
      }
      
      if (field.enumOptions && field.enumOptions.length > 0) {
        field.validators?.push(`enum:${field.enumOptions.join(',')}`);
      }
      
      return field;
    })
    .filter(field => !isSystemField(field.key)); // Excluir campos del sistema
}

/**
 * Obtiene solo los campos exportables de una tabla
 */
export function getExportableFields(
  table: PgTable<any>, 
  entityName: string
): FieldDefinition[] {
  return getFieldsFromTable(table, entityName).filter(f => f.exportable);
}

/**
 * Obtiene solo los campos importables de una tabla
 */
export function getImportableFields(
  table: PgTable<any>, 
  entityName: string
): FieldDefinition[] {
  return getFieldsFromTable(table, entityName).filter(f => f.importable);
}

/**
 * Obtiene los campos requeridos para importación
 */
export function getRequiredFields(
  table: PgTable<any>, 
  entityName: string
): FieldDefinition[] {
  return getImportableFields(table, entityName).filter(f => f.required);
}

// ============================================
// CONFIGURACIÓN DE ENTIDAD
// ============================================

/** Configuración por defecto para importación */
const DEFAULT_IMPORT_CONFIG: ImportConfig = {
  enabled: true,
  formats: ['csv', 'xlsx'],
  maxRecords: 5000,
  allowUpdate: false,
  uniqueFields: ['id'],
};

/** Configuración por defecto para exportación */
const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  enabled: true,
  formats: ['csv', 'xlsx'],
  defaultFormat: 'xlsx',
  maxRecords: 10000,
};

/**
 * Genera la configuración completa de una entidad a partir de su tabla Drizzle
 * 
 * @param table Tabla de Drizzle
 * @param entityName Nombre de la entidad (ej: 'parks')
 * @param labelSingular Etiqueta singular (ej: 'Parque')
 * @param labelPlural Etiqueta plural (ej: 'Parques')
 * @param overrides Configuración adicional para sobrescribir defaults
 */
export function createEntityConfig(
  table: PgTable<any>,
  entityName: string,
  labelSingular: string,
  labelPlural: string,
  overrides?: {
    import?: Partial<ImportConfig>;
    export?: Partial<ExportConfig>;
  }
): EntityConfig {
  const tableName = getTableName(table);
  const fields = getFieldsFromTable(table, entityName);
  
  return {
    entity: entityName,
    tableName,
    labelSingular,
    labelPlural,
    import: {
      ...DEFAULT_IMPORT_CONFIG,
      ...overrides?.import,
    },
    export: {
      ...DEFAULT_EXPORT_CONFIG,
      ...overrides?.export,
    },
    fields,
  };
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Busca un campo por su key o dbColumn
 */
export function findField(
  fields: FieldDefinition[], 
  nameOrColumn: string
): FieldDefinition | undefined {
  return fields.find(f => 
    f.key === nameOrColumn || 
    f.dbColumn === nameOrColumn ||
    f.key.toLowerCase() === nameOrColumn.toLowerCase() ||
    f.dbColumn.toLowerCase() === nameOrColumn.toLowerCase()
  );
}

/**
 * Crea un mapeo de columnas CSV/Excel a campos internos
 * Útil para cuando los headers del archivo no coinciden exactamente
 */
export function createColumnMapping(
  fields: FieldDefinition[],
  fileHeaders: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  for (const header of fileHeaders) {
    const normalizedHeader = header.toLowerCase().trim();
    
    // Buscar coincidencia por key
    const byKey = fields.find(f => f.key.toLowerCase() === normalizedHeader);
    if (byKey) {
      mapping[header] = byKey.key;
      continue;
    }
    
    // Buscar coincidencia por dbColumn
    const byColumn = fields.find(f => f.dbColumn.toLowerCase() === normalizedHeader);
    if (byColumn) {
      mapping[header] = byColumn.key;
      continue;
    }
    
    // Buscar coincidencia por label
    const byLabel = fields.find(f => f.label.toLowerCase() === normalizedHeader);
    if (byLabel) {
      mapping[header] = byLabel.key;
      continue;
    }
    
    // No se encontró mapeo - dejar vacío
    mapping[header] = '';
  }
  
  return mapping;
}

/**
 * Valida que un archivo tenga los campos requeridos
 */
export function validateRequiredColumns(
  fields: FieldDefinition[],
  fileHeaders: string[],
  mapping: Record<string, string>
): { valid: boolean; missingFields: string[] } {
  const requiredFields = fields.filter(f => f.required && f.importable);
  const mappedFields = Object.values(mapping).filter(Boolean);
  
  const missingFields = requiredFields
    .filter(f => !mappedFields.includes(f.key))
    .map(f => f.label);
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
