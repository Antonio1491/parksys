import ExcelJS from 'exceljs';
import { ExportFormatter } from '../ExportEngine';
import { ExportOptions, ExportConfig } from '../../../shared/exports/config';
import { BrandingConfig } from '../../../shared/exports/branding';
import moment from 'moment';

export class XLSXFormatter implements ExportFormatter {
  format = 'xlsx';
  mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  extension = 'xlsx';

  async process(
    data: any[], 
    config: ExportConfig, 
    branding: BrandingConfig, 
    options: ExportOptions
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Configurar propiedades del documento
    workbook.creator = branding.organization.name;
    workbook.created = new Date();
    workbook.company = branding.organization.name;
    workbook.subject = `Reporte ${config.displayName}`;

    const worksheet = workbook.addWorksheet(config.displayName, {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      }
    });

    let currentRow = 1;
    const selectedFields = options.fields || config.fields.map(f => f.key);
    const fieldConfigs = config.fields.filter(f => selectedFields.includes(f.key));

    // Agregar header corporativo si está habilitado
    if (options.template !== 'minimal' && options.branding?.includeHeader !== false) {
      currentRow = await this.addHeader(worksheet, branding, config, options, currentRow);
      currentRow += 2; // Espacio después del header
    }

    // Agregar encabezados de tabla
    currentRow = this.addTableHeaders(worksheet, fieldConfigs, branding, currentRow);

    // Agregar datos
    currentRow = this.addTableData(worksheet, data, fieldConfigs, branding, currentRow);

    // Agregar footer si está habilitado
    if (options.template !== 'minimal' && options.branding?.includeFooter !== false) {
      currentRow += 2; // Espacio antes del footer
      this.addFooter(worksheet, branding, data.length, fieldConfigs.length, currentRow);
    }

    // Aplicar estilos y ajustar columnas
    this.styleWorksheet(worksheet, fieldConfigs, branding);

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  private async addHeader(
    worksheet: ExcelJS.Worksheet, 
    branding: BrandingConfig, 
    config: ExportConfig,
    options: ExportOptions,
    startRow: number
  ): Promise<number> {
    let currentRow = startRow;

    // Logo (placeholder - en implementación real cargar imagen)
    if (branding.templates.header.showLogo && branding.organization.logo && options.branding?.includeLogo !== false) {
      // Reservar espacio para logo
      currentRow += 3;
    }

    // Título principal
    if (branding.templates.header.showTitle) {
      const titleText = options.branding?.customTitle || `Reporte: ${config.displayName}`;
      const titleCell = worksheet.getCell(`A${currentRow}`);
      titleCell.value = titleText;
      titleCell.font = {
        name: branding.fonts.title,
        size: branding.fonts.size.title,
        bold: true,
        color: { argb: branding.colors.primary.replace('#', '') }
      };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Fusionar celdas para el título
      const lastColumn = this.getColumnLetter(config.fields.length);
      worksheet.mergeCells(`A${currentRow}:${lastColumn}${currentRow}`);
      currentRow++;
    }

    // Información contextual
    if (branding.templates.header.showOrganization) {
      const orgCell = worksheet.getCell(`A${currentRow}`);
      orgCell.value = branding.organization.name;
      orgCell.font = { 
        name: branding.fonts.body, 
        size: branding.fonts.size.subtitle, 
        bold: true 
      };
      currentRow++;
    }

    if (branding.organization.department) {
      const deptCell = worksheet.getCell(`A${currentRow}`);
      deptCell.value = branding.organization.department;
      deptCell.font = { 
        name: branding.fonts.body, 
        size: branding.fonts.size.body 
      };
      currentRow++;
    }

    if (branding.templates.header.showDate) {
      const dateCell = worksheet.getCell(`A${currentRow}`);
      dateCell.value = `Generado: ${moment().format('DD/MM/YYYY HH:mm')}`;
      dateCell.font = { 
        name: branding.fonts.body, 
        size: branding.fonts.size.body 
      };
      currentRow++;
    }

    return currentRow;
  }

  private addTableHeaders(
    worksheet: ExcelJS.Worksheet,
    fieldConfigs: any[],
    branding: BrandingConfig,
    startRow: number
  ): number {
    const headerRow = worksheet.getRow(startRow);
    
    fieldConfigs.forEach((field, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = field.label;
      
      // Estilo del encabezado
      cell.font = {
        name: branding.fonts.body,
        size: branding.fonts.size.subtitle,
        bold: true,
        color: { argb: 'FFFFFF' }
      };
      
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: branding.colors.tableHeader.replace('#', '') }
      };
      
      cell.border = this.getBorderStyle();
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle',
        wrapText: true 
      };
    });

    return startRow + 1;
  }

  private addTableData(
    worksheet: ExcelJS.Worksheet,
    data: any[],
    fieldConfigs: any[],
    branding: BrandingConfig,
    startRow: number
  ): number {
    data.forEach((row, rowIndex) => {
      const worksheetRow = worksheet.getRow(startRow + rowIndex);
      const isEvenRow = rowIndex % 2 === 0;
      
      fieldConfigs.forEach((field, colIndex) => {
        const cell = worksheetRow.getCell(colIndex + 1);
        const value = this.formatCellValue(row[field.key], field.type, branding);
        
        cell.value = value;
        
        // Aplicar tipo de dato específico
        if (field.type === 'date' && value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        } else if (field.type === 'currency') {
          cell.numFmt = '"$"#,##0.00';
        } else if (field.type === 'number') {
          cell.numFmt = '#,##0';
        }
        
        // Estilo alternado de filas
        if (branding.templates.table.alternateRows && !isEvenRow) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: branding.colors.tableAlternate.replace('#', '') }
          };
        }
        
        cell.border = this.getBorderStyle();
        cell.alignment = this.getCellAlignment(field.type);
        cell.font = { 
          name: branding.fonts.body, 
          size: branding.templates.table.fontSize 
        };
      });
    });

    return startRow + data.length;
  }

  private addFooter(
    worksheet: ExcelJS.Worksheet,
    branding: BrandingConfig,
    recordCount: number,
    columnCount: number,
    startRow: number
  ): void {
    if (branding.templates.footer.showTimestamp) {
      const timestampCell = worksheet.getCell(`A${startRow}`);
      timestampCell.value = `Total de registros: ${recordCount}`;
      timestampCell.font = { 
        name: branding.fonts.body, 
        size: branding.fonts.size.footer, 
        italic: true 
      };
    }

    if (branding.templates.footer.showContact && branding.organization.website) {
      const contactRow = startRow + 1;
      const contactCell = worksheet.getCell(`A${contactRow}`);
      const contactInfo = [
        branding.organization.name,
        branding.organization.website,
        branding.organization.phone
      ].filter(Boolean).join(' | ');
      
      contactCell.value = contactInfo;
      contactCell.font = { 
        name: branding.fonts.body, 
        size: branding.fonts.size.footer, 
        italic: true 
      };
      
      // Fusionar celdas para el footer
      const lastColumn = this.getColumnLetter(columnCount);
      worksheet.mergeCells(`A${contactRow}:${lastColumn}${contactRow}`);
    }
  }

  private styleWorksheet(
    worksheet: ExcelJS.Worksheet,
    fieldConfigs: any[],
    branding: BrandingConfig
  ): void {
    // Auto-ajustar ancho de columnas
    if (branding.templates.table.columnAutoFit) {
      fieldConfigs.forEach((field, index) => {
        const column = worksheet.getColumn(index + 1);
        
        // Usar ancho específico del campo o calcular automáticamente
        if (field.width) {
          column.width = field.width;
        } else {
          // Calcular ancho basado en el contenido
          let maxLength = field.label.length;
          worksheet.eachRow((row) => {
            const cell = row.getCell(index + 1);
            const cellLength = cell.value?.toString().length || 0;
            maxLength = Math.max(maxLength, cellLength);
          });
          
          column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        }
      });
    }

    // Configurar impresión
    worksheet.pageSetup = {
      ...worksheet.pageSetup,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      }
    };
  }

  private formatCellValue(value: any, type: string, branding: BrandingConfig): any {
    if (value === null || value === undefined) return '';

    switch (type) {
      case 'date':
        if (value instanceof Date) return value;
        return moment(value).toDate();
      
      case 'currency':
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      
      case 'boolean':
        return value ? 'Sí' : 'No';
      
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value?.toString() || '';
      
      default:
        return value?.toString() || '';
    }
  }

  private getCellAlignment(type: string): Partial<ExcelJS.Alignment> {
    switch (type) {
      case 'number':
      case 'currency':
        return { horizontal: 'right', vertical: 'middle' };
      case 'date':
        return { horizontal: 'center', vertical: 'middle' };
      case 'boolean':
        return { horizontal: 'center', vertical: 'middle' };
      default:
        return { horizontal: 'left', vertical: 'middle' };
    }
  }

  private getBorderStyle(): Partial<ExcelJS.Borders> {
    return {
      top: { style: 'thin', color: { argb: 'CCCCCC' } },
      left: { style: 'thin', color: { argb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
      right: { style: 'thin', color: { argb: 'CCCCCC' } }
    };
  }

  private getColumnLetter(columnNumber: number): string {
    let result = '';
    while (columnNumber > 0) {
      columnNumber--;
      result = String.fromCharCode(65 + (columnNumber % 26)) + result;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
  }
}