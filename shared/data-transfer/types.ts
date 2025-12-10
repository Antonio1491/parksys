/**
 * Sistema Unificado de Importación/Exportación - Tipos Base
 * 
 * Este archivo define los tipos fundamentales que se usan en todo el sistema.
 * La estructura se deriva automáticamente de los schemas de Drizzle.
 */

// ============================================
// TIPOS DE CAMPOS
// ============================================

/** Tipos de datos soportados (mapeados desde Drizzle) */
export type FieldDataType = 
  | 'string'
  | 'number'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'json'
  | 'array'
  | 'enum';

/** Definición de un campo para import/export */
export interface FieldDefinition {
  /** Nombre del campo en el schema (camelCase) */
  key: string;
  
  /** Nombre de la columna en BD (snake_case) */
  dbColumn: string;
  
  /** Etiqueta para mostrar al usuario */
  label: string;
  
  /** Tipo de dato */
  type: FieldDataType;
  
  /** ¿Es requerido? */
  required: boolean;
  
  /** ¿Tiene valor por defecto? */
  hasDefault: boolean;
  
  /** Valor por defecto (si aplica) */
  defaultValue?: unknown;
  
  /** ¿Se puede exportar? */
  exportable: boolean;
  
  /** ¿Se puede importar? */
  importable: boolean;
  
  /** Opciones para campos tipo enum */
  enumOptions?: string[];
  
  /** Validadores adicionales */
  validators?: string[];
  
  /** Descripción/ayuda para el usuario */
  description?: string;
  
  /** Ejemplo de valor válido */
  example?: string;
}

// ============================================
// CONFIGURACIÓN DE ENTIDAD
// ============================================

/** Configuración de importación para una entidad */
export interface ImportConfig {
  /** ¿Está habilitada la importación? */
  enabled: boolean;
  
  /** Formatos soportados */
  formats: ('csv' | 'xlsx')[];
  
  /** Máximo de registros por importación */
  maxRecords: number;
  
  /** ¿Permitir actualizar registros existentes? */
  allowUpdate: boolean;
  
  /** Campo(s) para identificar registros existentes */
  uniqueFields?: string[];
}

/** Configuración de exportación para una entidad */
export interface ExportConfig {
  /** ¿Está habilitada la exportación? */
  enabled: boolean;
  
  /** Formatos soportados */
  formats: ('csv' | 'xlsx' | 'pdf' | 'json')[];
  
  /** Formato por defecto */
  defaultFormat: 'csv' | 'xlsx' | 'pdf' | 'json';
  
  /** Máximo de registros por exportación */
  maxRecords: number;
}

/** Configuración completa de una entidad */
export interface EntityConfig {
  /** Nombre técnico de la entidad (ej: 'parks') */
  entity: string;
  
  /** Nombre de la tabla en BD */
  tableName: string;
  
  /** Etiqueta singular (ej: 'Parque') */
  labelSingular: string;
  
  /** Etiqueta plural (ej: 'Parques') */
  labelPlural: string;
  
  /** Configuración de importación */
  import: ImportConfig;
  
  /** Configuración de exportación */
  export: ExportConfig;
  
  /** Campos de la entidad */
  fields: FieldDefinition[];
  
  /** Relaciones con otras entidades */
  relations?: EntityRelation[];
}

// ============================================
// RELACIONES
// ============================================

/** Tipo de relación entre entidades */
export type RelationType = 'lookup' | 'reference' | 'embed';

/** Definición de relación */
export interface EntityRelation {
  /** Campo en esta entidad */
  field: string;
  
  /** Tipo de relación */
  type: RelationType;
  
  /** Entidad relacionada */
  targetEntity: string;
  
  /** Campo en la entidad relacionada para hacer match */
  targetField: string;
  
  /** Campo para mostrar al usuario (ej: 'name') */
  displayField: string;
}

// ============================================
// VALIDACIÓN
// ============================================

/** Resultado de validación de un campo */
export interface FieldValidationResult {
  field: string;
  valid: boolean;
  value: unknown;
  transformedValue?: unknown;
  errors: string[];
  warnings: string[];
}

/** Resultado de validación de un registro */
export interface RecordValidationResult {
  rowIndex: number;
  valid: boolean;
  fields: FieldValidationResult[];
  errors: string[];
  warnings: string[];
}

/** Resultado de validación de un archivo completo */
export interface FileValidationResult {
  valid: boolean;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  records: RecordValidationResult[];
  globalErrors: string[];
  globalWarnings: string[];
}

// ============================================
// IMPORTACIÓN
// ============================================

/** Estado de importación */
export type ImportStatus = 
  | 'pending'
  | 'validating'
  | 'validated'
  | 'importing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** Opciones de importación */
export interface ImportOptions {
  /** Entidad a importar */
  entity: string;
  
  /** Formato del archivo */
  format: 'csv' | 'xlsx';
  
  /** ¿Actualizar registros existentes? */
  updateExisting: boolean;
  
  /** ¿Ignorar errores y continuar? */
  skipErrors: boolean;
  
  /** Campos a importar (vacío = todos) */
  fields?: string[];
  
  /** Mapeo de columnas personalizado */
  columnMapping?: Record<string, string>;
}

/** Resultado de importación */
export interface ImportResult {
  success: boolean;
  status: ImportStatus;
  totalRecords: number;
  importedRecords: number;
  updatedRecords: number;
  skippedRecords: number;
  failedRecords: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  duration: number; // en milisegundos
}

// ============================================
// EXPORTACIÓN
// ============================================

/** Opciones de exportación */
export interface ExportOptions {
  /** Entidad a exportar */
  entity: string;
  
  /** Formato de salida */
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  
  /** Campos a incluir (vacío = todos exportables) */
  fields?: string[];
  
  /** Filtros a aplicar */
  filters?: Record<string, unknown>;
  
  /** Ordenamiento */
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  
  /** Límite de registros */
  limit?: number;
  
  /** Nombre del archivo (sin extensión) */
  filename?: string;
  
  /** Plantilla de estilo */
  template?: 'minimal' | 'corporate' | 'detailed';
  
  /** Opciones de branding */
  branding?: {
    includeLogo?: boolean;
    includeHeader?: boolean;
    includeFooter?: boolean;
    customTitle?: string;
  };
}

/** Resultado de exportación */
export interface ExportResult {
  success: boolean;
  filename: string;
  mimeType: string;
  size: number;
  recordCount: number;
  data: Buffer;
}

// ============================================
// PLANTILLAS
// ============================================

/** Formato de plantilla de importación */
export interface ImportTemplate {
  entity: string;
  format: 'csv' | 'xlsx';
  filename: string;
  headers: string[];
  exampleRow: string[];
  instructions: string[];
}
