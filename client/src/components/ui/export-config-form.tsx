import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExportConfig, ExportOptions, ExportField } from '../../../../shared/exports/config';
import { DEFAULT_BRANDING } from '../../../../shared/exports/branding';
import { FileText, FileSpreadsheet, File, Download, Settings, Eye, Palette } from 'lucide-react';

interface ExportConfigFormProps {
  config: ExportConfig;
  defaultFormat: string;
  isExporting: boolean;
  initialFilters?: Record<string, any>;
  initialFields?: string[];
  onExport: (options: Omit<ExportOptions, 'entity'>) => Promise<void>;
  onCancel: () => void;
}

const formatIcons = {
  csv: FileText,
  xlsx: FileSpreadsheet,
  pdf: File,
  json: File
};

const formatLabels = {
  csv: 'CSV (Comma-Separated Values)',
  xlsx: 'Excel (XLSX)',
  pdf: 'PDF (Portable Document Format)',
  json: 'JSON (JavaScript Object Notation)'
};

export function ExportConfigForm({
  config,
  defaultFormat,
  isExporting,
  initialFilters = {},
  initialFields = [],
  onExport,
  onCancel
}: ExportConfigFormProps) {
  // Estados del formulario
  const [format, setFormat] = useState(defaultFormat);
  const [selectedFields, setSelectedFields] = useState<string[]>(
    initialFields.length > 0 ? initialFields : config.fields.filter(f => f.required).map(f => f.key)
  );
  const [template, setTemplate] = useState<'corporate' | 'minimal' | 'detailed'>('corporate');
  const [filename, setFilename] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  
  // Estados de branding
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [customTitle, setCustomTitle] = useState('');

  // Estados de ordenamiento
  const [sortField, setSortField] = useState(config.sorting?.default?.field || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(config.sorting?.default?.direction || 'asc');

  // Estados de límites
  const [useLimit, setUseLimit] = useState(false);
  const [limit, setLimit] = useState(1000);

  // Generar nombre de archivo por defecto
  useEffect(() => {
    if (!filename) {
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format;
      setFilename(`${config.entity}_${timestamp}.${extension}`);
    }
  }, [format, config.entity, filename]);

  // Manejar selección de campos
  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, fieldKey]);
    } else {
      const field = config.fields.find(f => f.key === fieldKey);
      if (field?.required) return; // No permitir deseleccionar campos requeridos
      setSelectedFields(prev => prev.filter(key => key !== fieldKey));
    }
  };

  // Seleccionar/deseleccionar todos los campos
  const handleSelectAllFields = (checked: boolean) => {
    if (checked) {
      setSelectedFields(config.fields.map(f => f.key));
    } else {
      setSelectedFields(config.fields.filter(f => f.required).map(f => f.key));
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    const options: Omit<ExportOptions, 'entity'> = {
      format: format as any,
      fields: selectedFields,
      filters,
      filename,
      template,
      branding: {
        includeLogo,
        includeHeader,
        includeFooter,
        customTitle: customTitle || undefined
      },
      sorting: sortField ? { field: sortField, direction: sortDirection } : undefined,
      limit: useLimit ? limit : undefined
    };

    await onExport(options);
  };

  // Calcular estimado de registros
  const estimatedRecords = useLimit ? Math.min(limit, 1000) : 1000; // Placeholder

  return (
    <div className="space-y-6">
      <Tabs defaultValue="format" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="format" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Formato
          </TabsTrigger>
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Campos
          </TabsTrigger>
          <TabsTrigger value="style" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Estilo
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Avanzado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="format" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Formato</CardTitle>
              <CardDescription>
                Elige el formato de exportación que mejor se adapte a tus necesidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.supportedFormats.map((fmt) => {
                  const Icon = formatIcons[fmt as keyof typeof formatIcons];
                  const isSelected = format === fmt;
                  
                  return (
                    <Card
                      key={fmt}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-primary border-primary' : ''
                      }`}
                      onClick={() => setFormat(fmt)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Icon className={`h-8 w-8 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div>
                            <h4 className="font-medium">{fmt.toUpperCase()}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatLabels[fmt as keyof typeof formatLabels]}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-4">
                <Label htmlFor="filename">Nombre del archivo</Label>
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder={`${config.entity}_export.${format}`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Seleccionar Campos
                <Badge variant="secondary">
                  {selectedFields.length} de {config.fields.length} campos
                </Badge>
              </CardTitle>
              <CardDescription>
                Elige qué información incluir en la exportación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedFields.length === config.fields.length}
                    onCheckedChange={handleSelectAllFields}
                  />
                  <Label htmlFor="select-all" className="font-medium">
                    Seleccionar todos los campos
                  </Label>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {config.fields.map((field) => {
                    const isSelected = selectedFields.includes(field.key);
                    const isRequired = field.required;
                    
                    return (
                      <div key={field.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={field.key}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleFieldToggle(field.key, !!checked)}
                          disabled={isRequired}
                        />
                        <Label 
                          htmlFor={field.key} 
                          className={`flex-1 ${isRequired ? 'font-medium' : ''}`}
                        >
                          {field.label}
                          {isRequired && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Requerido
                            </Badge>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plantilla y Estilo</CardTitle>
              <CardDescription>
                Personaliza la apariencia de tu exportación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Plantilla de Diseño</Label>
                <RadioGroup value={template} onValueChange={(value: any) => setTemplate(value)} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="corporate" id="corporate" />
                    <Label htmlFor="corporate">
                      <strong>Corporativo</strong> - Logo, encabezado completo y pie de página
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minimal" id="minimal" />
                    <Label htmlFor="minimal">
                      <strong>Minimalista</strong> - Solo datos sin elementos decorativos
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="detailed" id="detailed" />
                    <Label htmlFor="detailed">
                      <strong>Detallado</strong> - Incluye estadísticas y metadatos adicionales
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {format !== 'csv' && template !== 'minimal' && (
                <>
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label>Opciones de Formato</Label>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-logo" 
                        checked={includeLogo} 
                        onCheckedChange={setIncludeLogo} 
                      />
                      <Label htmlFor="include-logo">Incluir logo corporativo</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-header" 
                        checked={includeHeader} 
                        onCheckedChange={setIncludeHeader} 
                      />
                      <Label htmlFor="include-header">Incluir encabezado informativo</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-footer" 
                        checked={includeFooter} 
                        onCheckedChange={setIncludeFooter} 
                      />
                      <Label htmlFor="include-footer">Incluir pie de página con contacto</Label>
                    </div>

                    <div>
                      <Label htmlFor="custom-title">Título personalizado (opcional)</Label>
                      <Input
                        id="custom-title"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder={`Reporte ${config.displayName}`}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Vista Previa de Colores</h4>
                <div className="flex gap-2">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: DEFAULT_BRANDING.colors.primary }}
                    title="Color Primario"
                  />
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: DEFAULT_BRANDING.colors.secondary }}
                    title="Color Secundario"
                  />
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: DEFAULT_BRANDING.colors.accent }}
                    title="Color de Acento"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Opciones Avanzadas</CardTitle>
              <CardDescription>
                Configuración avanzada de ordenamiento y límites
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.sorting && (
                <>
                  <div>
                    <Label>Ordenar por</Label>
                    <div className="flex gap-2 mt-2">
                      <Select value={sortField} onValueChange={setSortField}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccionar campo" />
                        </SelectTrigger>
                        <SelectContent>
                          {config.sorting.available.map((field) => {
                            const fieldConfig = config.fields.find(f => f.key === field);
                            return (
                              <SelectItem key={field} value={field}>
                                {fieldConfig?.label || field}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      
                      <Select value={sortDirection} onValueChange={(value: 'asc' | 'desc') => setSortDirection(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascendente</SelectItem>
                          <SelectItem value="desc">Descendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />
                </>
              )}

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="use-limit" 
                    checked={useLimit} 
                    onCheckedChange={setUseLimit} 
                  />
                  <Label htmlFor="use-limit">Limitar número de registros</Label>
                </div>
                
                {useLimit && (
                  <div>
                    <Label htmlFor="limit">Máximo de registros</Label>
                    <Input
                      id="limit"
                      type="number"
                      value={limit}
                      onChange={(e) => setLimit(parseInt(e.target.value) || 1000)}
                      min={1}
                      max={10000}
                      className="w-32"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Máximo recomendado: 10,000 registros
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Resumen de Exportación</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Formato:</strong> {format.toUpperCase()}</p>
                  <p><strong>Campos:</strong> {selectedFields.length}</p>
                  <p><strong>Plantilla:</strong> {template}</p>
                  {useLimit && <p><strong>Límite:</strong> {limit.toLocaleString()} registros</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isExporting}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isExporting || selectedFields.length === 0}
          className="min-w-[120px]"
        >
          {isExporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </div>
    </div>
  );
}