// Configuración base del sistema de exportaciones
export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';

export interface ExportField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'array' | 'email' | 'url';
  required?: boolean;
  transform?: (value: any, row?: any) => any;
  condition?: (row: any) => boolean;
  width?: number; // Para Excel
  format?: string; // Para formateo específico
}

export interface ExportConfig {
  entity: string;
  displayName: string;
  description?: string;
  fields: ExportField[];
  permissions: string[];
  defaultFormat: ExportFormat;
  supportedFormats: ExportFormat[];
  customTransforms?: Record<string, (value: any) => any>;
  filters?: {
    available: string[];
    default?: Record<string, any>;
  };
  sorting?: {
    default?: { field: string; direction: 'asc' | 'desc' };
    available: string[];
  };
}

export interface ExportOptions {
  entity: string;
  format: ExportFormat;
  fields?: string[];
  filters?: Record<string, any>;
  filename?: string;
  template?: 'corporate' | 'minimal' | 'detailed';
  branding?: {
    includeLogo?: boolean;
    includeHeader?: boolean;
    includeFooter?: boolean;
    customTitle?: string;
  };
  sorting?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}

export interface ExportResult {
  filename: string;
  data: Buffer | string;
  mimeType: string;
  size: number;
  recordCount: number;
  metadata?: {
    generatedAt: string;
    generatedBy: string;
    entity: string;
    format: ExportFormat;
  };
}

// Tipos de errores específicos del sistema de exportación
export class ExportError extends Error {
  constructor(
    message: string,
    public code: 'PERMISSION_DENIED' | 'ENTITY_NOT_FOUND' | 'FORMAT_NOT_SUPPORTED' | 'TEMPLATE_ERROR' | 'DATA_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ExportError';
  }
}