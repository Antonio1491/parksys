import { ExportFormatter } from '../ExportEngine';
import { ExportOptions, ExportConfig } from '../../../shared/exports/config';
import { BrandingConfig } from '../../../shared/exports/branding';
import moment from 'moment';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extender el tipo de jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export class PDFFormatter implements ExportFormatter {
  format = 'pdf';
  mimeType = 'application/pdf';
  extension = 'pdf';

  async process(
    data: any[], 
    config: ExportConfig, 
    branding: BrandingConfig, 
    options: ExportOptions
  ): Promise<Buffer> {
    const selectedFields = options.fields || config.fields.map(f => f.key);
    const fieldConfigs = config.fields.filter(f => selectedFields.includes(f.key));

    // Crear nuevo documento PDF
    const doc = new jsPDF({
      orientation: fieldConfigs.length > 6 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Header
    if (options.template !== 'minimal' && options.branding?.includeHeader !== false) {
      // Título de la organización
      if (branding.templates.header.showOrganization) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(branding.organization.name, margin, yPosition);
        yPosition += 8;
      }

      // Departamento
      if (branding.organization.department) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(branding.organization.department, margin, yPosition);
        yPosition += 8;
      }

      // Título del reporte
      if (branding.templates.header.showTitle) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Reporte: ${config.displayName}`, margin, yPosition);
        yPosition += 8;
      }

      // Fecha
      if (branding.templates.header.showDate) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generado: ${moment().format('DD/MM/YYYY HH:mm')}`, margin, yPosition);
        yPosition += 12;
      }

      // Línea separadora
      doc.setDrawColor(branding.colors.primary);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    }

    // Preparar datos para la tabla
    const tableColumns = fieldConfigs.map(field => ({
      header: field.label,
      dataKey: field.key,
      width: field.width ? field.width * 2 : 'auto' // Convertir ancho estimado
    }));

    const tableData = data.map(row => {
      const rowData: any = {};
      fieldConfigs.forEach(field => {
        const value = row[field.key];
        rowData[field.key] = this.formatValue(value, field.type, branding);
      });
      return rowData;
    });

    // Generar tabla con autoTable
    doc.autoTable({
      startY: yPosition,
      head: [tableColumns.map(col => col.header)],
      body: tableData.map(row => 
        tableColumns.map(col => row[col.dataKey])
      ),
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [31, 41, 55], // text color del branding
        fillColor: [255, 255, 255]
      },
      headStyles: {
        fillColor: this.hexToRgb(branding.colors.tableHeader),
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: this.hexToRgb(branding.colors.tableAlternate)
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
      columnStyles: {},
    });

    // Footer
    if (options.template !== 'minimal' && options.branding?.includeFooter !== false) {
      const finalY = (doc as any).lastAutoTable.finalY || yPosition + 100;
      const footerY = finalY + 15;

      // Total de registros
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de registros: ${data.length}`, margin, footerY);

      // Información de contacto
      if (branding.templates.footer.showContact && branding.organization.website) {
        doc.text(`Sitio web: ${branding.organization.website}`, margin, footerY + 6);
      }

      // Disclaimer
      if (branding.templates.footer.showDisclaimer && branding.templates.footer.disclaimer) {
        doc.setFontSize(8);
        doc.text(branding.templates.footer.disclaimer, margin, footerY + 12);
      }
    }

    // Generar Buffer del PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  }

  private formatValue(value: any, type: string, branding: BrandingConfig): string {
    if (value === null || value === undefined) return '';

    switch (type) {
      case 'date':
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
        return Array.isArray(value) ? value.join(', ') : value?.toString() || '';
      
      default:
        return value?.toString() || '';
    }
  }

  private hexToRgb(hex: string): [number, number, number] {
    // Remover el # si está presente
    hex = hex.replace('#', '');
    
    // Convertir hex a RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return [r, g, b];
  }
}