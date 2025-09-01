import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  File, 
  Settings, 
  Palette, 
  Upload,
  Eye,
  Save,
  RefreshCw
} from 'lucide-react';
import { EXPORT_REGISTRY, getAvailableEntities } from '@shared/exports/registry';
import { DEFAULT_BRANDING } from '@shared/exports/branding';
import { ExportButton } from '@/components/ui/export-button';

export default function ExportacionesConfig() {
  const [brandingConfig, setBrandingConfig] = useState(DEFAULT_BRANDING);
  const [isUpdating, setIsUpdating] = useState(false);

  const entities = getAvailableEntities();

  const handleBrandingUpdate = async () => {
    setIsUpdating(true);
    try {
      // Placeholder para actualizar configuración de branding
      // En implementación real, enviar a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Configuración de branding actualizada:', brandingConfig);
    } catch (error) {
      console.error('Error actualizando branding:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setBrandingConfig(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  };

  const handleOrganizationChange = (field: string, value: string) => {
    setBrandingConfig(prev => ({
      ...prev,
      organization: {
        ...prev.organization,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Sistema de Exportaciones
          </CardTitle>
          <CardDescription>
            Configurar templates corporativos, branding y opciones de exportación para todos los módulos del sistema
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="entities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="entities" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Entidades
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Pruebas
          </TabsTrigger>
        </TabsList>

        {/* Tab de Entidades Disponibles */}
        <TabsContent value="entities">
          <Card>
            <CardHeader>
              <CardTitle>Entidades Configuradas para Exportación</CardTitle>
              <CardDescription>
                Módulos del sistema que tienen habilitada la funcionalidad de exportación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entities.map((entity) => {
                  const config = EXPORT_REGISTRY[entity];
                  return (
                    <Card key={entity} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{config.displayName}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {config.fields.length} campos
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {config.description || 'Sin descripción disponible'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">
                            Formatos Soportados
                          </Label>
                          <div className="flex gap-1 mt-1">
                            {config.supportedFormats.map((format) => (
                              <Badge key={format} variant="outline" className="text-xs">
                                {format.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">
                            Formato por Defecto
                          </Label>
                          <Badge className="ml-2 text-xs">
                            {config.defaultFormat.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="pt-2">
                          <ExportButton 
                            entity={entity} 
                            variant="dropdown" 
                            size="sm"
                            className="w-full"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Configuración de Branding */}
        <TabsContent value="branding">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Organizacional</CardTitle>
                <CardDescription>
                  Datos que aparecerán en todos los documentos exportados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="org-name">Nombre de la Organización</Label>
                    <Input
                      id="org-name"
                      value={brandingConfig.organization.name}
                      onChange={(e) => handleOrganizationChange('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-department">Departamento</Label>
                    <Input
                      id="org-department"
                      value={brandingConfig.organization.department || ''}
                      onChange={(e) => handleOrganizationChange('department', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-website">Sitio Web</Label>
                    <Input
                      id="org-website"
                      value={brandingConfig.organization.website || ''}
                      onChange={(e) => handleOrganizationChange('website', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-phone">Teléfono</Label>
                    <Input
                      id="org-phone"
                      value={brandingConfig.organization.phone || ''}
                      onChange={(e) => handleOrganizationChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="org-address">Dirección</Label>
                    <Input
                      id="org-address"
                      value={brandingConfig.organization.address || ''}
                      onChange={(e) => handleOrganizationChange('address', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Colores Corporativos</CardTitle>
                <CardDescription>
                  Define la paleta de colores para documentos exportados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(brandingConfig.colors).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <Input
                          value={value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de Templates</CardTitle>
                <CardDescription>
                  Opciones por defecto para la apariencia de documentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Encabezado</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="show-logo" 
                          checked={brandingConfig.templates.header.showLogo}
                          onCheckedChange={(checked) => setBrandingConfig(prev => ({
                            ...prev,
                            templates: {
                              ...prev.templates,
                              header: { ...prev.templates.header, showLogo: !!checked }
                            }
                          }))}
                        />
                        <Label htmlFor="show-logo">Mostrar logo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="show-org" 
                          checked={brandingConfig.templates.header.showOrganization}
                          onCheckedChange={(checked) => setBrandingConfig(prev => ({
                            ...prev,
                            templates: {
                              ...prev.templates,
                              header: { ...prev.templates.header, showOrganization: !!checked }
                            }
                          }))}
                        />
                        <Label htmlFor="show-org">Mostrar organización</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="show-date" 
                          checked={brandingConfig.templates.header.showDate}
                          onCheckedChange={(checked) => setBrandingConfig(prev => ({
                            ...prev,
                            templates: {
                              ...prev.templates,
                              header: { ...prev.templates.header, showDate: !!checked }
                            }
                          }))}
                        />
                        <Label htmlFor="show-date">Mostrar fecha de generación</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Pie de Página</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="show-contact" 
                          checked={brandingConfig.templates.footer.showContact}
                          onCheckedChange={(checked) => setBrandingConfig(prev => ({
                            ...prev,
                            templates: {
                              ...prev.templates,
                              footer: { ...prev.templates.footer, showContact: !!checked }
                            }
                          }))}
                        />
                        <Label htmlFor="show-contact">Mostrar información de contacto</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="show-disclaimer" 
                          checked={brandingConfig.templates.footer.showDisclaimer}
                          onCheckedChange={(checked) => setBrandingConfig(prev => ({
                            ...prev,
                            templates: {
                              ...prev.templates,
                              footer: { ...prev.templates.footer, showDisclaimer: !!checked }
                            }
                          }))}
                        />
                        <Label htmlFor="show-disclaimer">Mostrar aviso legal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="show-pages" 
                          checked={brandingConfig.templates.footer.showPageNumbers}
                          onCheckedChange={(checked) => setBrandingConfig(prev => ({
                            ...prev,
                            templates: {
                              ...prev.templates,
                              footer: { ...prev.templates.footer, showPageNumbers: !!checked }
                            }
                          }))}
                        />
                        <Label htmlFor="show-pages">Mostrar números de página</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleBrandingUpdate} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tab de Templates */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Documentos</CardTitle>
              <CardDescription>
                Gestión de plantillas corporativas para diferentes tipos de documentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Corporativo</CardTitle>
                    <CardDescription className="text-sm">
                      Plantilla oficial con logo, encabezado completo y pie de página
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge className="mb-3">Por defecto</Badge>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Logo corporativo</li>
                      <li>• Información organizacional</li>
                      <li>• Colores corporativos</li>
                      <li>• Pie de página con contacto</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Minimalista</CardTitle>
                    <CardDescription className="text-sm">
                      Solo datos sin elementos decorativos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Sin logo</li>
                      <li>• Sin encabezado</li>
                      <li>• Solo datos</li>
                      <li>• Máxima eficiencia</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Detallado</CardTitle>
                    <CardDescription className="text-sm">
                      Incluye estadísticas y metadatos adicionales
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Información completa</li>
                      <li>• Estadísticas</li>
                      <li>• Metadatos</li>
                      <li>• Resumen ejecutivo</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Pruebas */}
        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle>Pruebas del Sistema de Exportación</CardTitle>
              <CardDescription>
                Realizar pruebas de exportación con datos de ejemplo para verificar configuración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entities.slice(0, 6).map((entity) => {
                  const config = EXPORT_REGISTRY[entity];
                  return (
                    <Card key={entity}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{config.displayName}</CardTitle>
                        <CardDescription className="text-sm">
                          Probar exportación con datos de ejemplo
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ExportButton 
                          entity={entity} 
                          variant="dropdown" 
                          size="sm"
                          className="w-full"
                          filters={{ limit: 10 }} // Limitar para pruebas
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Estado del Sistema</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">{entities.length}</div>
                    <div className="text-sm text-green-600">Entidades Configuradas</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">3</div>
                    <div className="text-sm text-blue-600">Formatos Disponibles</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">3</div>
                    <div className="text-sm text-purple-600">Templates Activos</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-700">✓</div>
                    <div className="text-sm text-orange-600">Sistema Operativo</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}