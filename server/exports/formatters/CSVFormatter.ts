import { ExportFormatter } from '../ExportEngine';
import { ExportOptions, ExportConfig } from '../../../shared/exports/config';
import { BrandingConfig } from '../../../shared/exports/branding';
import moment from 'moment';

export class CSVFormatter implements ExportFormatter {
  format = 'csv';
  mimeType = 'text/csv; charset=utf-8';
  extension = 'csv';

  async process(
    data: any[], 
    config: ExportConfig, 
    branding: BrandingConfig, 
    options: ExportOptions
  ): Promise<string> {
    const selectedFields = options.fields || config.fields.map(f => f.key);
    const fieldConfigs = config.fields.filter(f => selectedFields.includes(f.key));

    let csvContent = '';

    // Agregar BOM para UTF-8
    csvContent += '\ufeff';

    // Encabezado corporativo si está habilitado
    if (options.template !== 'minimal' && options.branding?.includeHeader !== false) {
      csvContent += this.generateHeader(branding, config);
      csvContent += '\n';
    }

    // Encabezados de columnas
    const headers = fieldConfigs.map(field => this.escapeCSV(field.label));
    csvContent += headers.join(',') + '\n';

    // Datos
    data.forEach(row => {
      const values = fieldConfigs.map(field => {
        const value = row[field.key];
        return this.escapeCSV(this.formatValue(value, field.type, branding));
      });
      csvContent += values.join(',') + '\n';
    });

    // Pie de página si está habilitado
    if (options.template !== 'minimal' && options.branding?.includeFooter !== false) {
      csvContent += '\n';
      csvContent += this.generateFooter(branding, data.length);
    }

    return csvContent;
  }

  private generateHeader(branding: BrandingConfig, config: ExportConfig): string {
    let header = '';
    
    if (branding.templates.header.showOrganization) {
      header += `"Organización","${branding.organization.name}"\n`;
    }
    
    if (branding.templates.header.showTitle) {
      header += `"Reporte","${config.displayName}"\n`;
    }
    
    if (branding.templates.header.showDate) {
      const fecha = moment().format('DD/MM/YYYY HH:mm');
      header += `"Fecha de Generación","${fecha}"\n`;
    }

    if (branding.organization.department) {
      header += `"Departamento","${branding.organization.department}"\n`;
    }

    return header;
  }

  private generateFooter(branding: BrandingConfig, recordCount: number): string {
    let footer = '';
    
    footer += `"Total de Registros","${recordCount}"\n`;
    
    if (branding.templates.footer.showContact && branding.organization.website) {
      footer += `"Sitio Web","${branding.organization.website}"\n`;
    }
    
    if (branding.templates.footer.showDisclaimer && branding.templates.footer.disclaimer) {
      footer += `"Aviso","${branding.templates.footer.disclaimer}"\n`;
    }

    return footer;
  }

  private formatValue(value: any, type: string, branding: BrandingConfig): string {
    if (value === null || value === undefined) return '';

    switch (type) {
      case 'date':
        if (value instanceof Date) {
          return moment(value).format(branding.locale.dateFormat);
        }
        return moment(value).format(branding.locale.dateFormat);
      
      case 'currency':
        const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
        return numValue.toLocaleString('es-MX', { 
          style: 'currency', 
          currency: 'MXN' 
        });
      
      case 'number':
        const num = typeof value === 'number' ? value : parseFloat(value) || 0;
        return num.toLocaleString('es-MX');
      
      case 'boolean':
        return value ? 'Sí' : 'No';
      
      case 'array':
        return Array.isArray(value) ? value.join('; ') : value?.toString() || '';
      
      default:
        return value?.toString() || '';
    }
  }

  private escapeCSV(value: string): string {
    if (value === null || value === undefined) return '';
    
    const stringValue = value.toString();
    
    // Si contiene comas, comillas, o saltos de línea, envolver en comillas
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      // Escapar comillas dobles duplicándolas
      const escaped = stringValue.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    
    return stringValue;
  }
}