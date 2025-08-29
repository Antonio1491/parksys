import { useState, useCallback } from 'react';
import { ExportOptions, ExportConfig } from '../../../shared/exports/config';
import { EXPORT_REGISTRY } from '../../../shared/exports/registry';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UseExportOptions {
  onSuccess?: (filename: string) => void;
  onError?: (error: any) => void;
}

export function useExport(entity: string, options?: UseExportOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [config, setConfig] = useState<ExportConfig | null>(null);
  const { toast } = useToast();

  // Obtener configuración de la entidad
  const loadConfig = useCallback(async () => {
    if (config) return config;
    
    setIsLoadingConfig(true);
    try {
      const response = await apiRequest(`/api/exports/${entity}/config`);
      if (response.success) {
        setConfig(response.config);
        return response.config;
      } else {
        throw new Error(response.error || 'Error al cargar configuración');
      }
    } catch (error) {
      console.error('Error loading export config:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración de exportación",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoadingConfig(false);
    }
  }, [entity, config, toast]);

  // Función principal de exportación
  const exportData = useCallback(async (exportOptions: Omit<ExportOptions, 'entity'>) => {
    setIsExporting(true);
    
    try {
      const fullOptions: ExportOptions = {
        ...exportOptions,
        entity
      };

      console.log(`[EXPORT] Iniciando exportación de ${entity}:`, fullOptions);

      // Realizar solicitud de exportación
      const response = await fetch(`/api/exports/${entity}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(fullOptions),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      // Obtener información del archivo
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : fullOptions.filename || `${entity}_export.${fullOptions.format}`;

      // Descargar archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`[EXPORT] Exportación completada: ${filename}`);

      // Notificar éxito
      toast({
        title: "Exportación exitosa",
        description: `El archivo ${filename} ha sido descargado`,
      });

      // Callback de éxito
      options?.onSuccess?.(filename);

      return { success: true, filename };

    } catch (error) {
      console.error(`[EXPORT] Error en exportación:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      toast({
        title: "Error en exportación",
        description: errorMessage,
        variant: "destructive",
      });

      // Callback de error
      options?.onError?.(error);

      return { success: false, error: errorMessage };
    } finally {
      setIsExporting(false);
    }
  }, [entity, toast, options]);

  // Obtener vista previa de datos
  const getPreview = useCallback(async (previewOptions: Omit<ExportOptions, 'entity'>) => {
    try {
      const response = await apiRequest(`/api/exports/${entity}/preview`, {
        method: 'POST',
        data: previewOptions
      });

      if (response.success) {
        return response.preview;
      } else {
        throw new Error(response.error || 'Error al obtener vista previa');
      }
    } catch (error) {
      console.error('Error getting preview:', error);
      toast({
        title: "Error",
        description: "No se pudo obtener la vista previa",
        variant: "destructive",
      });
      throw error;
    }
  }, [entity, toast]);

  // Obtener configuración local (del registry)
  const getLocalConfig = useCallback(() => {
    return EXPORT_REGISTRY[entity] || null;
  }, [entity]);

  return {
    exportData,
    getPreview,
    loadConfig,
    getLocalConfig,
    isExporting,
    isLoadingConfig,
    config: config || getLocalConfig(),
    // Estados derivados
    isReady: !isLoadingConfig && !!getLocalConfig(),
    supportedFormats: getLocalConfig()?.supportedFormats || [],
    defaultFormat: getLocalConfig()?.defaultFormat || 'xlsx',
    availableFields: getLocalConfig()?.fields || []
  };
}

// Hook simplificado para exportación rápida
export function useQuickExport(entity: string) {
  const { exportData, isExporting, getLocalConfig } = useExport(entity);

  const quickExport = useCallback(async (format: 'csv' | 'xlsx' | 'pdf' = 'xlsx') => {
    const config = getLocalConfig();
    if (!config) {
      throw new Error(`Configuración no encontrada para: ${entity}`);
    }

    return await exportData({
      format,
      template: 'corporate'
    });
  }, [exportData, entity, getLocalConfig]);

  return {
    quickExport,
    isExporting,
    config: getLocalConfig()
  };
}