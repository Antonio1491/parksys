import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { useExport } from '@/hooks/use-export';
import { ExportConfigForm } from './export-config-form';
import { ExportOptions } from '../../../../shared/exports/config';

interface ExportButtonProps {
  entity: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  disabled?: boolean;
  filters?: Record<string, any>;
  buttonVariant?: 'default' | 'primary' | 'secondary' | 'tertiary';
  customFields?: string[];
  onExportStart?: () => void;
  onExportComplete?: (filename: string) => void;
  onExportError?: (error: any) => void;
}

const formatIcons = {
  csv: FileText,
  xlsx: FileSpreadsheet,
  pdf: File,
  json: File
};

const formatLabels = {
  csv: 'CSV',
  xlsx: 'Excel',
  pdf: 'PDF',
  json: 'JSON'
};

export function ExportButton({
  entity,
  size = 'default',
  className = '',
  disabled = false,
  filters,
  buttonVariant = 'tertiary',
  customFields,
  onExportStart,
  onExportComplete,
  onExportError
}: ExportButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { exportData, isExporting, config, isReady, supportedFormats, defaultFormat } = useExport(entity, {
    onSuccess: (filename) => {
      onExportComplete?.(filename);
      setIsDialogOpen(false);
    },
    onError: onExportError
  });

  if (!isReady || !config) {
    return (
      <Button variant={buttonVariant} size={size} disabled className={className}>
        <Download className="mr-2 h-4 w-4" />
        Exportar
      </Button>
    );
  }

  // Exportación rápida sin configuración
  const handleQuickExport = async (format: string) => {
    onExportStart?.();
    
    const options: Omit<ExportOptions, 'entity'> = {
      format: format as any,
      template: 'corporate',
      fields: customFields,
      filters,
      branding: {
        includeLogo: true,
        includeHeader: true,
        includeFooter: true
      }
    };

    await exportData(options);
  };

  // Exportación con configuración avanzada
  const handleAdvancedExport = async (options: Omit<ExportOptions, 'entity'>) => {
    onExportStart?.();
    
    const finalOptions = {
      ...options,
      fields: options.fields || customFields,
      filters: options.filters || filters
    };

    await exportData(finalOptions);
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant={buttonVariant} size={size} disabled={disabled || isExporting} className={className}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full mx-4">
          <DialogHeader>
            <DialogTitle>Configurar Exportación</DialogTitle>
            <DialogDescription>
              Configurar opciones de exportación para {config.displayName}
            </DialogDescription>
          </DialogHeader>
          
          <ExportConfigForm
            config={config}
            defaultFormat={defaultFormat}
            isExporting={isExporting}
            initialFilters={filters}
            initialFields={customFields}
            onExport={handleAdvancedExport}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}