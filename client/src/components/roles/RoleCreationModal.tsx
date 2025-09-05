import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import useAdaptiveModules, { validatePermissionHierarchy } from '@/hooks/useAdaptiveModules';
import { 
  Shield, ShieldCheck, Crown, User, UserCog, Eye, Settings,
  Plus, X, Palette, Info, CheckCircle, AlertCircle, Star
} from 'lucide-react';

// Esquema de validación para crear rol
const createRoleSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres').regex(/^[a-z-]+$/, 'Solo letras minúsculas y guiones'),
  description: z.string().optional(),
  level: z.number().min(1).max(7),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Debe ser un color hexadecimal válido'),
  isActive: z.boolean().default(true)
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

// Niveles de rol predefinidos con sus características
const ROLE_LEVELS = [
  { level: 1, name: 'Super Administrador', description: 'Control total del sistema', icon: Crown, color: '#DC2626' },
  { level: 2, name: 'Administrador General', description: 'Gestión completa de módulos', icon: ShieldCheck, color: '#EA580C' },
  { level: 3, name: 'Coordinador de Parques', description: 'Gestión de parques y actividades', icon: Shield, color: '#CA8A04' },
  { level: 4, name: 'Supervisor de Operaciones', description: 'Supervisión operativa', icon: UserCog, color: '#059669' },
  { level: 5, name: 'Técnico Especialista', description: 'Especialización técnica', icon: Settings, color: '#0284C7' },
  { level: 6, name: 'Operador de Campo', description: 'Operaciones básicas', icon: User, color: '#7C3AED' },
  { level: 7, name: 'Consultor Auditor', description: 'Solo lectura y auditoría', icon: Eye, color: '#BE185D' }
];

// Colores predefinidos para roles
const PRESET_COLORS = [
  '#DC2626', '#EA580C', '#CA8A04', '#059669', '#0284C7', '#7C3AED', '#BE185D',
  '#7C2D12', '#166534', '#1E3A8A', '#581C87', '#831843'
];

// Plantillas de permisos predefinidas
const PERMISSION_TEMPLATES = {
  'super-admin': { name: 'Super Administrador', description: 'Todos los permisos', permissions: 'all' },
  'admin': { name: 'Administrador', description: 'Gestión completa sin configuración', permissions: 'admin-no-config' },
  'manager': { name: 'Gestor', description: 'Gestión de contenido', permissions: 'content-management' },
  'operator': { name: 'Operador', description: 'Operaciones básicas', permissions: 'basic-operations' },
  'viewer': { name: 'Solo Lectura', description: 'Solo visualización', permissions: 'read-only' }
};

interface RoleCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RoleCreationModal: React.FC<RoleCreationModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { modules, flatModules } = useAdaptiveModules();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  
  const form = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      level: 6,
      color: PRESET_COLORS[5],
      isActive: true
    }
  });

  // Mutación para crear rol
  const createRoleMutation = useMutation({
    mutationFn: async (data: CreateRoleFormData & { permissions: Record<string, string[]> }) => {
      return apiRequest('/api/roles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Rol creado",
        description: "El nuevo rol se ha creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      onOpenChange(false);
      form.reset();
      setPermissions({});
      setSelectedTemplate('');
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear rol",
        description: error.message || "No se pudo crear el rol",
        variant: "destructive",
      });
    }
  });

  // Auto-generar slug desde nombre
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    form.setValue('slug', slug);
  };

  // Aplicar plantilla de permisos
  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const newPermissions: Record<string, string[]> = {};
    
    switch (templateId) {
      case 'super-admin':
        flatModules.forEach(moduleId => {
          newPermissions[moduleId] = ['read', 'create', 'update', 'delete', 'admin'];
        });
        break;
      case 'admin':
        flatModules.forEach(moduleId => {
          if (!moduleId.startsWith('configuracion.')) {
            newPermissions[moduleId] = ['read', 'create', 'update', 'delete', 'admin'];
          } else {
            newPermissions[moduleId] = ['read'];
          }
        });
        break;
      case 'manager':
        flatModules.forEach(moduleId => {
          if (moduleId.startsWith('gestion.') || moduleId.startsWith('operaciones.')) {
            newPermissions[moduleId] = ['read', 'create', 'update'];
          } else {
            newPermissions[moduleId] = ['read'];
          }
        });
        break;
      case 'operator':
        flatModules.forEach(moduleId => {
          if (moduleId.startsWith('gestion.') || moduleId.startsWith('operaciones.')) {
            newPermissions[moduleId] = ['read', 'create'];
          } else {
            newPermissions[moduleId] = ['read'];
          }
        });
        break;
      case 'viewer':
        flatModules.forEach(moduleId => {
          newPermissions[moduleId] = ['read'];
        });
        break;
    }
    
    setPermissions(newPermissions);
  };

  // Toggle permiso individual
  const togglePermission = (moduleId: string, action: string) => {
    setPermissions(prev => {
      const current = prev[moduleId] || [];
      const updated = current.includes(action)
        ? current.filter(p => p !== action)
        : [...current, action];
      
      return {
        ...prev,
        [moduleId]: validatePermissionHierarchy(updated)
      };
    });
  };

  // Enviar formulario
  const onSubmit = (data: CreateRoleFormData) => {
    createRoleMutation.mutate({
      ...data,
      permissions
    });
  };

  const selectedLevelInfo = ROLE_LEVELS.find(rl => rl.level === form.watch('level'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Crear Nuevo Rol
          </DialogTitle>
          <DialogDescription>
            Configure un nuevo rol del sistema con permisos específicos para cada módulo
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Información Básica</TabsTrigger>
            <TabsTrigger value="permissions">Permisos</TabsTrigger>
            <TabsTrigger value="preview">Vista Previa</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            <TabsContent value="basic" className="space-y-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Información básica del rol */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Información General
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nombre del Rol</Label>
                        <Input
                          id="name"
                          {...form.register('name')}
                          onChange={(e) => {
                            form.setValue('name', e.target.value);
                            handleNameChange(e.target.value);
                          }}
                          placeholder="Ej: Coordinador de Parques"
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="slug">Identificador (Slug)</Label>
                        <Input
                          id="slug"
                          {...form.register('slug')}
                          placeholder="coordinador-parques"
                        />
                        {form.formState.errors.slug && (
                          <p className="text-sm text-red-500 mt-1">{form.formState.errors.slug.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        {...form.register('description')}
                        placeholder="Describe las responsabilidades y alcance de este rol..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Nivel jerárquico */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Nivel Jerárquico
                    </CardTitle>
                    <CardDescription>
                      Define la jerarquía del rol en el sistema (1 = máximo, 7 = mínimo)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={form.watch('level').toString()} onValueChange={(value) => form.setValue('level', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_LEVELS.map(roleLevel => {
                          const Icon = roleLevel.icon;
                          return (
                            <SelectItem key={roleLevel.level} value={roleLevel.level.toString()}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" style={{ color: roleLevel.color }} />
                                <span>Nivel {roleLevel.level}: {roleLevel.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    
                    {selectedLevelInfo && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <selectedLevelInfo.icon className="h-4 w-4" style={{ color: selectedLevelInfo.color }} />
                          <span className="font-medium">{selectedLevelInfo.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{selectedLevelInfo.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Color del rol */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Color del Rol
                    </CardTitle>
                    <CardDescription>
                      Selecciona un color para identificar visualmente este rol
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 flex-wrap mb-4">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 ${form.watch('color') === color ? 'border-primary' : 'border-muted'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => form.setValue('color', color)}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        {...form.register('color')}
                        className="w-12 h-8 p-0 border-0"
                      />
                      <Input
                        {...form.register('color')}
                        placeholder="#6366F1"
                        className="font-mono text-sm"
                      />
                      <Badge style={{ backgroundColor: form.watch('color'), color: 'white' }}>
                        Vista Previa
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-6">
              {/* Plantillas de permisos */}
              <Card>
                <CardHeader>
                  <CardTitle>Plantillas de Permisos</CardTitle>
                  <CardDescription>
                    Aplicar una configuración predefinida de permisos como punto de partida
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-3">
                    {Object.entries(PERMISSION_TEMPLATES).map(([templateId, template]) => (
                      <Button
                        key={templateId}
                        variant={selectedTemplate === templateId ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => applyTemplate(templateId)}
                        className="flex flex-col h-auto p-3 text-xs"
                      >
                        <span className="font-medium">{template.name}</span>
                        <span className="text-muted-foreground">{template.description}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Matriz de permisos por módulo */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Permisos Detallada</CardTitle>
                  <CardDescription>
                    Configure permisos específicos para cada módulo y submódulo del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {modules.map(module => (
                      <div key={module.id} className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: module.color }}
                          />
                          <h4 className="font-medium">{module.name}</h4>
                          <span className="text-sm text-muted-foreground">({module.subModules.length} submódulos)</span>
                        </div>
                        
                        <div className="grid gap-3">
                          {module.subModules.map(subModule => {
                            const fullModuleId = `${module.id}.${subModule.id}`;
                            const modulePermissions = permissions[fullModuleId] || [];
                            
                            return (
                              <div key={fullModuleId} className="flex items-center justify-between py-2 px-3 rounded-lg border bg-muted/30">
                                <div>
                                  <span className="font-medium text-sm">{subModule.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">({subModule.id})</span>
                                </div>
                                <div className="flex gap-2">
                                  {subModule.actions.map(action => (
                                    <Button
                                      key={action.id}
                                      variant={modulePermissions.includes(action.id) ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => togglePermission(fullModuleId, action.id)}
                                      className="h-7 px-2 text-xs"
                                    >
                                      {action.name}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Vista Previa del Rol
                  </CardTitle>
                  <CardDescription>
                    Revisa la configuración antes de crear el rol
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Información del rol */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Información General</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Nombre:</strong> {form.watch('name') || 'Sin nombre'}</div>
                        <div><strong>Slug:</strong> <code>{form.watch('slug') || 'sin-slug'}</code></div>
                        <div><strong>Nivel:</strong> {form.watch('level')} - {selectedLevelInfo?.name}</div>
                        <div className="flex items-center gap-2">
                          <strong>Color:</strong>
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: form.watch('color') }} />
                          <code>{form.watch('color')}</code>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Descripción</h4>
                      <p className="text-sm text-muted-foreground">
                        {form.watch('description') || 'Sin descripción'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Resumen de permisos */}
                  <div>
                    <h4 className="font-medium mb-3">Resumen de Permisos</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="font-medium text-green-800">Módulos con Acceso</div>
                        <div className="text-2xl font-bold text-green-600">
                          {Object.keys(permissions).filter(moduleId => permissions[moduleId].length > 0).length}
                        </div>
                        <div className="text-green-600">de {flatModules.length} total</div>
                      </div>
                      
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-blue-800">Permisos de Lectura</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {Object.values(permissions).filter(perms => perms.includes('read')).length}
                        </div>
                        <div className="text-blue-600">módulos</div>
                      </div>
                      
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="font-medium text-purple-800">Permisos Admin</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {Object.values(permissions).filter(perms => perms.includes('admin')).length}
                        </div>
                        <div className="text-purple-600">módulos</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={createRoleMutation.isPending}
            className="min-w-24"
          >
            {createRoleMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Crear Rol
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};