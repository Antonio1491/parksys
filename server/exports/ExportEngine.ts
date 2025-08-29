import { ExportOptions, ExportResult, ExportError, ExportConfig } from '../../shared/exports/config';
import { BrandingConfig, DEFAULT_BRANDING } from '../../shared/exports/branding';
import { getExportConfig } from '../../shared/exports/registry';
import { storage } from '../storage';
import { CSVFormatter } from './formatters/CSVFormatter';
import { XLSXFormatter } from './formatters/XLSXFormatter';
import { PDFFormatter } from './formatters/PDFFormatter';

export interface ExportFormatter {
  format: string;
  mimeType: string;
  extension: string;
  process(data: any[], config: ExportConfig, branding: BrandingConfig, options: ExportOptions): Promise<Buffer | string>;
}

export class ExportEngine {
  private formatters: Map<string, ExportFormatter> = new Map();

  constructor() {
    this.registerFormatters();
  }

  private registerFormatters() {
    const csvFormatter = new CSVFormatter();
    const xlsxFormatter = new XLSXFormatter();
    const pdfFormatter = new PDFFormatter();

    this.formatters.set(csvFormatter.format, csvFormatter);
    this.formatters.set(xlsxFormatter.format, xlsxFormatter);
    this.formatters.set(pdfFormatter.format, pdfFormatter);
  }

  async export(options: ExportOptions, userId?: number): Promise<ExportResult> {
    try {
      // 1. Validar configuración
      const config = this.validateAndGetConfig(options);
      
      // 2. Validar permisos (placeholder - implementar según sistema de permisos)
      await this.validatePermissions(options.entity, userId);

      // 3. Obtener datos
      const rawData = await this.fetchData(options, config);
      
      // 4. Procesar datos
      const processedData = await this.processData(rawData, config, options);

      // 5. Aplicar formato
      const formatter = this.getFormatter(options.format);
      const branding = await this.getBrandingConfig();
      const formattedData = await formatter.process(processedData, config, branding, options);

      // 6. Generar resultado
      return {
        filename: this.generateFilename(options, config),
        data: formattedData instanceof Buffer ? formattedData : Buffer.from(formattedData),
        mimeType: formatter.mimeType,
        size: formattedData instanceof Buffer ? formattedData.length : Buffer.byteLength(formattedData),
        recordCount: processedData.length,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: userId?.toString() || 'system',
          entity: options.entity,
          format: options.format
        }
      };

    } catch (error) {
      console.error('Export error:', error);
      if (error instanceof ExportError) {
        throw error;
      }
      throw new ExportError('Error interno durante la exportación', 'DATA_ERROR', error);
    }
  }

  private validateAndGetConfig(options: ExportOptions): ExportConfig {
    const config = getExportConfig(options.entity);
    if (!config) {
      throw new ExportError(
        `Entidad '${options.entity}' no encontrada`,
        'ENTITY_NOT_FOUND'
      );
    }

    if (!config.supportedFormats.includes(options.format)) {
      throw new ExportError(
        `Formato '${options.format}' no soportado para la entidad '${options.entity}'`,
        'FORMAT_NOT_SUPPORTED'
      );
    }

    return config;
  }

  private async validatePermissions(entity: string, userId?: number): Promise<void> {
    // Implementar validación de permisos según el sistema de roles
    // Por ahora, permitir todos los accesos
    return Promise.resolve();
  }

  private async fetchData(options: ExportOptions, config: ExportConfig): Promise<any[]> {
    try {
      console.log(`[EXPORT] Fetching data for entity: ${options.entity}`);
      
      let data: any[] = [];
      
      // Usar métodos del storage según la entidad
      switch (options.entity) {
        case 'parks':
          data = await storage.getParks(options.filters);
          break;
        case 'assets':
          data = await storage.getAssets(options.filters);
          break;
        case 'users':
          data = await storage.getUsers();
          break;
        default:
          // Para otras entidades, usar un método genérico o mostrar mensaje
          console.warn(`[EXPORT] Entidad ${options.entity} no implementada aún en storage`);
          data = [];
      }

      console.log(`[EXPORT] Found ${data.length} records for ${options.entity}`);

      // Aplicar límites si están especificados
      if (options.limit) {
        const offset = options.offset || 0;
        data = data.slice(offset, offset + options.limit);
      }

      return data;

    } catch (error) {
      console.error(`[EXPORT] Database error for entity ${options.entity}:`, error);
      throw new ExportError(
        `Error al obtener datos de ${config.displayName}`,
        'DATA_ERROR',
        error
      );
    }
  }

  private async processData(rawData: any[], config: ExportConfig, options: ExportOptions): Promise<any[]> {
    const selectedFields = options.fields || config.fields.map(f => f.key);
    
    return rawData.map(row => {
      const processedRow: any = {};
      
      selectedFields.forEach(fieldKey => {
        const fieldConfig = config.fields.find(f => f.key === fieldKey);
        if (!fieldConfig) return;

        let value = row[fieldKey];

        // Aplicar transformaciones
        if (fieldConfig.transform) {
          value = fieldConfig.transform(value, row);
        }

        // Aplicar condiciones
        if (fieldConfig.condition && !fieldConfig.condition(row)) {
          return;
        }

        // Formatear según tipo
        value = this.formatValueByType(value, fieldConfig.type);

        processedRow[fieldKey] = value;
      });

      return processedRow;
    });
  }

  private formatValueByType(value: any, type: string): any {
    if (value === null || value === undefined) return '';

    switch (type) {
      case 'date':
        return value instanceof Date ? value : new Date(value);
      case 'boolean':
        return value ? 'Sí' : 'No';
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'currency':
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      default:
        return value?.toString() || '';
    }
  }

  private getFormatter(format: string): ExportFormatter {
    const formatter = this.formatters.get(format);
    if (!formatter) {
      throw new ExportError(
        `Formateador para '${format}' no disponible`,
        'FORMAT_NOT_SUPPORTED'
      );
    }
    return formatter;
  }

  private async getBrandingConfig(): Promise<BrandingConfig> {
    // En el futuro, obtener de base de datos o configuración
    return DEFAULT_BRANDING;
  }

  private generateFilename(options: ExportOptions, config: ExportConfig): string {
    if (options.filename) {
      return options.filename;
    }

    const entityName = config.entity.toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    const formatter = this.getFormatter(options.format);
    
    return `${entityName}_${timestamp}.${formatter.extension}`;
  }

  private getTableName(entity: string): string {
    // Mapeo de entidades a nombres de tabla
    const tableMap: Record<string, string> = {
      parks: 'parks',
      amenities: 'amenities',
      activities: 'activities',
      volunteers: 'volunteers',
      instructors: 'instructors',
      assets: 'assets'
    };

    return tableMap[entity] || entity;
  }
}