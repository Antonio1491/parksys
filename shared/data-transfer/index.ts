/**
 * Sistema Unificado de Importación/Exportación
 * 
 * Este módulo proporciona funcionalidad centralizada para:
 * - Importar datos desde CSV/XLSX
 * - Exportar datos a CSV/XLSX/PDF
 * - Generar plantillas de importación
 * - Validar datos antes de importar
 * 
 * ARQUITECTURA:
 * - types.ts: Tipos TypeScript
 * - field-labels.ts: Etiquetas humanas para campos
 * - field-resolver.ts: Combina schema Drizzle + etiquetas
 * - entity-registry.ts: Registro de entidades soportadas
 * - validators.ts: Validadores de datos
 * - template-generator.ts: Generador de plantillas
 * 
 * USO BÁSICO:
 * 
 * ```typescript
 * import { getEntityConfig, getExportableFields } from '@shared/data-transfer';
 * 
 * // Obtener configuración de una entidad
 * const parkConfig = getEntityConfig('parks');
 * 
 * // Obtener campos exportables
 * const fields = parkConfig.fields.filter(f => f.exportable);
 * ```
 */

// ============================================
// TIPOS
// ============================================
export type {
  FieldDataType,
  FieldDefinition,
  ImportConfig,
  ExportConfig,
  EntityConfig,
  RelationType,
  EntityRelation,
  FieldValidationResult,
  RecordValidationResult,
  FileValidationResult,
  ImportStatus,
  ImportOptions,
  ImportResult,
  ExportOptions,
  ExportResult,
  ImportTemplate,
} from './types';

// ============================================
// ETIQUETAS DE CAMPOS
// ============================================
export {
  FIELD_LABELS,
  SYSTEM_FIELDS,
  EXPORT_ONLY_FIELDS,
  SENSITIVE_FIELDS,
  getFieldLabel,
  humanizeFieldName,
  isSystemField,
  isExportOnlyField,
  isSensitiveField,
} from './field-labels';

// ============================================
// RESOLUCIÓN DE CAMPOS
// ============================================
export {
  getFieldsFromTable,
  getExportableFields,
  getImportableFields,
  getRequiredFields,
  createEntityConfig,
  findField,
  createColumnMapping,
  validateRequiredColumns,
} from './field-resolver';

// ============================================
// REGISTRO DE ENTIDADES
// ============================================
export {
  ENTITY_REGISTRY,
  registerEntity,
  getEntityConfig,
  isEntityRegistered,
  getAllEntities,
  getImportableEntities,
  getExportableEntities,
  initializeEntityRegistry,
  getEntitiesByModule,
} from './entity-registry';

// ============================================
// VALIDACIÓN
// ============================================
export {
  validateFieldValue,
  validateRecord,
  validateFile,
  applyTransformations,
  validators,
} from './validators';

// ============================================
// GENERACIÓN DE PLANTILLAS
// ============================================
export {
  generateImportTemplate,
  generateCSVContent,
  generateXLSXData,
  getExpectedColumns,
  downloadCSVTemplate,
} from './template-generator';
