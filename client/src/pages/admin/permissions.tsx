import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  Save, 
  RotateCcw, 
  Users, 
  Home, 
  MapPin, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Settings,
  Box,
  Activity,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Tag,
  Map,
  User,
  Check,
  Eye,
  Edit,
  Lock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

// Definición de todos los módulos y submenús del sistema
const SYSTEM_MODULES = {
  dashboard: {
    name: 'Dashboard',
    icon: Home,
    path: '/admin',
    children: {}
  },
  operations: {
    name: 'Operaciones',
    icon: MapPin,
    children: {
      parks: { name: 'Parques', icon: Map, path: '/admin/parks' },
      assets: { name: 'Activos', icon: Box, path: '/admin/assets' },
      incidents: { name: 'Incidentes', icon: AlertCircle, path: '/admin/incidents' }
    }
  },
  finance: {
    name: 'Finanzas',
    icon: DollarSign,
    children: {
      catalog: { name: 'Catálogo', icon: Tag, path: '/admin/finance/catalog' },
      incomes: { name: 'Ingresos', icon: TrendingUp, path: '/admin/finance/incomes' },
      expenses: { name: 'Egresos', icon: TrendingDown, path: '/admin/finance/expenses' }
    }
  },
  activities: {
    name: 'Actividades',
    icon: Calendar,
    children: {
      list: { name: 'Listado', icon: Activity, path: '/admin/activities' },
      calendar: { name: 'Calendario', icon: Calendar, path: '/admin/activities/calendar' },
      instructors: { name: 'Instructores', icon: GraduationCap, path: '/admin/activities/instructors' }
    }
  },
  users: {
    name: 'Personal',
    icon: Users,
    path: '/admin/users',
    children: {}
  },
  settings: {
    name: 'Configuración',
    icon: Settings,
    path: '/admin/settings',
    children: {}
  }
};

const ROLES = [
  { id: 'super_admin', name: 'Super Administrador', color: 'bg-red-100 text-red-800', icon: Shield },
  { id: 'admin', name: 'Administrador', color: 'bg-orange-100 text-orange-800', icon: Shield },
  { id: 'moderator', name: 'Moderador', color: 'bg-blue-100 text-blue-800', icon: Users },
  { id: 'operator', name: 'Operador', color: 'bg-green-100 text-green-800', icon: User }
];

const AdminPermissions = () => {
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedRole, setSelectedRole] = useState<string>('super_admin');
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current permissions
  const { data: currentPermissions, isLoading } = useQuery({
    queryKey: ['/api/role-permissions'],
    enabled: true
  });

  // Initialize permissions when data loads
  useEffect(() => {
    if (currentPermissions) {
      setPermissions(currentPermissions);
    }
  }, [currentPermissions]);

  // Save permissions mutation
  const savePermissionsMutation = useMutation({
    mutationFn: async (newPermissions: Record<string, Record<string, boolean>>) => {
      return apiRequest('/api/role-permissions', {
        method: 'PUT',
        data: newPermissions
      });
    },
    onSuccess: () => {
      toast({ title: 'Permisos guardados exitosamente' });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['/api/role-permissions'] });
    },
    onError: () => {
      toast({ 
        title: 'Error al guardar permisos', 
        variant: 'destructive' 
      });
    }
  });

  // Función para verificar si el rol actual está bloqueado (admin/super_admin)
  const isRoleBlocked = () => {
    return selectedRole === 'admin' || selectedRole === 'super_admin';
  };

  // Función para obtener todos los permisos para roles bloqueados
  const getAllPermissions = () => {
    const allPermissions: Record<string, boolean> = {};
    
    Object.entries(SYSTEM_MODULES).forEach(([moduleKey, module]) => {
      // Permisos del módulo principal
      allPermissions[`${moduleKey}.view`] = true;
      allPermissions[`${moduleKey}.edit`] = true;
      
      // Permisos de submódulos
      if (module.children) {
        Object.keys(module.children).forEach((subKey) => {
          allPermissions[`${moduleKey}.${subKey}.view`] = true;
          allPermissions[`${moduleKey}.${subKey}.edit`] = true;
        });
      }
    });
    
    return allPermissions;
  };

  const togglePermission = (module: string, level: 'view' | 'edit', submodule?: string) => {
    // No permitir cambios en roles bloqueados
    if (isRoleBlocked()) {
      toast({ 
        title: 'Permisos bloqueados', 
        description: `Los roles ${selectedRole === 'super_admin' ? 'Super Administrador' : 'Administrador'} tienen todos los permisos activos y no se pueden modificar.`,
        variant: 'destructive' 
      });
      return;
    }

    const permissionKey = submodule ? `${module}.${submodule}` : module;
    
    setPermissions(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [`${permissionKey}.${level}`]: !prev[selectedRole]?.[`${permissionKey}.${level}`]
      }
    }));
    setHasChanges(true);
  };

  const hasPermission = (module: string, level: 'view' | 'edit', submodule?: string) => {
    // Roles bloqueados siempre tienen todos los permisos
    if (isRoleBlocked()) {
      return true;
    }
    
    const permissionKey = submodule ? `${module}.${submodule}` : module;
    return permissions[selectedRole]?.[`${permissionKey}.${level}`] || false;
  };

  const hasAnyPermission = (module: string, submodule?: string) => {
    return hasPermission(module, 'view', submodule) || hasPermission(module, 'edit', submodule);
  };

  const resetPermissions = () => {
    if (currentPermissions) {
      setPermissions(currentPermissions);
      setHasChanges(false);
    }
  };

  const savePermissions = () => {
    if (isRoleBlocked()) {
      toast({ 
        title: 'Permisos bloqueados', 
        description: `Los permisos para ${selectedRole === 'super_admin' ? 'Super Administrador' : 'Administrador'} no se pueden modificar.`,
        variant: 'destructive' 
      });
      return;
    }
    savePermissionsMutation.mutate(permissions);
  };

  const getSelectedRoleInfo = () => {
    return ROLES.find(role => role.id === selectedRole);
  };

  const renderRoleSelector = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Seleccionar Rol</CardTitle>
        <CardDescription>
          Elige el rol del cual deseas configurar los permisos de acceso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {ROLES.map(role => {
            const IconComponent = role.icon;
            return (
              <Button
                key={role.id}
                variant={selectedRole === role.id ? "default" : "outline"}
                className={cn(
                  "h-auto p-4 flex flex-col items-center gap-2 transition-all",
                  selectedRole === role.id && "ring-2 ring-blue-500"
                )}
                onClick={() => setSelectedRole(role.id)}
              >
                <IconComponent className="w-6 h-6" />
                <span className="text-xs font-medium text-center">{role.name}</span>
                {selectedRole === role.id && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderPermissionsPanel = () => {
    const roleInfo = getSelectedRoleInfo();
    if (!roleInfo) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Badge className={roleInfo.color} variant="secondary">
              <roleInfo.icon className="w-4 h-4 mr-2" />
              {roleInfo.name}
            </Badge>
            <span className="text-lg">Configuración de Permisos</span>
          </CardTitle>
          <CardDescription>
            Configura qué secciones del dashboard puede acceder este rol
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRoleBlocked() && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800">
                    Rol Protegido
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    Este rol tiene todos los permisos activos de forma permanente y no se pueden modificar por razones de seguridad.
                  </p>
                </div>
              </div>
            </div>
          )}
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              {Object.entries(SYSTEM_MODULES).map(([moduleKey, module]) => {
                const IconComponent = module.icon;
                
                return (
                  <div key={moduleKey} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-lg">{module.name}</h3>
                          <p className="text-sm text-gray-600">
                            {module.path ? `Ruta: ${module.path}` : 'Módulo principal'}
                          </p>
                        </div>
                      </div>
                      {Object.keys(module.children || {}).length === 0 && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={hasPermission(moduleKey, 'view')}
                              onCheckedChange={() => togglePermission(moduleKey, 'view')}
                              disabled={isRoleBlocked()}
                              className={cn(
                                "h-4 w-4",
                                isRoleBlocked() && "opacity-60 cursor-not-allowed"
                              )}
                            />
                            <div className={cn(
                              "flex items-center gap-1 text-sm",
                              isRoleBlocked() ? "text-gray-600" : "text-gray-600"
                            )}>
                              <Eye className="w-3 h-3" />
                              <span>Ver</span>
                              {isRoleBlocked() && <Lock className="w-3 h-3 text-gray-500" />}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={hasPermission(moduleKey, 'edit')}
                              onCheckedChange={() => togglePermission(moduleKey, 'edit')}
                              disabled={isRoleBlocked()}
                              className={cn(
                                "h-4 w-4",
                                isRoleBlocked() && "opacity-60 cursor-not-allowed"
                              )}
                            />
                            <div className={cn(
                              "flex items-center gap-1 text-sm",
                              isRoleBlocked() ? "text-gray-600" : "text-gray-600"
                            )}>
                              <Edit className="w-3 h-3" />
                              <span>Editar</span>
                              {isRoleBlocked() && <Lock className="w-3 h-3 text-gray-500" />}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {Object.keys(module.children || {}).length > 0 && (
                      <div className="ml-6 space-y-3">
                        {Object.entries(module.children || {}).map(([subKey, subModule]: [string, any]) => {
                          const SubIconComponent = subModule.icon;
                          return (
                            <div key={subKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                              <div className="flex items-center gap-3">
                                <SubIconComponent className="w-5 h-5 text-gray-600" />
                                <div>
                                  <span className="font-medium">{subModule.name}</span>
                                  <p className="text-sm text-gray-500">{subModule.path}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={hasPermission(moduleKey, 'view', subKey)}
                                    onCheckedChange={() => togglePermission(moduleKey, 'view', subKey)}
                                    disabled={isRoleBlocked()}
                                    className={cn(
                                      "h-4 w-4",
                                      isRoleBlocked() && "opacity-60 cursor-not-allowed"
                                    )}
                                  />
                                  <div className={cn(
                                    "flex items-center gap-1 text-xs",
                                    isRoleBlocked() ? "text-gray-600" : "text-gray-600"
                                  )}>
                                    <Eye className="w-3 h-3" />
                                    <span>Ver</span>
                                    {isRoleBlocked() && <Lock className="w-3 h-3 text-gray-500" />}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={hasPermission(moduleKey, 'edit', subKey)}
                                    onCheckedChange={() => togglePermission(moduleKey, 'edit', subKey)}
                                    disabled={isRoleBlocked()}
                                    className={cn(
                                      "h-4 w-4",
                                      isRoleBlocked() && "opacity-60 cursor-not-allowed"
                                    )}
                                  />
                                  <div className={cn(
                                    "flex items-center gap-1 text-xs",
                                    isRoleBlocked() ? "text-gray-600" : "text-gray-600"
                                  )}>
                                    <Edit className="w-3 h-3" />
                                    <span>Editar</span>
                                    {isRoleBlocked() && <Lock className="w-3 h-3 text-gray-500" />}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">Cargando permisos...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con título */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-gray-900" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Permisos</h1>
                <p className="text-gray-600 mt-2">
                  Selecciona un rol y configura qué secciones del dashboard puede acceder
                </p>
              </div>
            </div>
            
            {hasChanges && !isRoleBlocked() && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={resetPermissions}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Revertir
                </Button>
                <Button 
                  onClick={savePermissions}
                  disabled={savePermissionsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {savePermissionsMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Barra horizontal de selección de roles */}
        {renderRoleSelector()}

        {/* Panel de configuración de permisos */}
        {renderPermissionsPanel()}

        {hasChanges && !isRoleBlocked() && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">
                    Hay cambios sin guardar en los permisos del rol {getSelectedRoleInfo()?.name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetPermissions}
                  >
                    Revertir
                  </Button>
                  <Button 
                    size="sm"
                    onClick={savePermissions}
                    disabled={savePermissionsMutation.isPending}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPermissions;