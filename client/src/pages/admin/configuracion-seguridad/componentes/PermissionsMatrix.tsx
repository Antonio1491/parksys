import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Grid, 
  Shield, 
  Eye, 
  Edit3, 
  Settings,
  Save,
  RotateCcw,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { SYSTEM_ROLES } from '@/components/RoleBadge';
import { useAdaptiveModules, CRUD_ACTIONS, validatePermissionHierarchy } from '@/hooks/useAdaptiveModules';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Tipos híbridos para el sistema CRUD granular
type CRUDAction = 'create' | 'read' | 'update' | 'delete' | 'admin';
type RolePermissions = Record<string, Record<string, CRUDAction[]>>; // { roleId: { 'gestion.parques': ['read', 'create'] } }

export default function PermissionsMatrix() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { flatModules, modules, subModuleMap } = useAdaptiveModules();
  const [permissions, setPermissions] = useState<RolePermissions>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch permissions from API
  const { data: apiPermissions, isLoading, error } = useQuery({
    queryKey: ['/api/permissions/matrix'],
    refetchOnWindowFocus: false,
  });

  // Mutation for saving permissions
  const saveMutation = useMutation({
    mutationFn: (newPermissions: typeof permissions) => {
      return apiRequest('/api/permissions/matrix', {
        method: 'PUT',
        body: JSON.stringify(newPermissions),
      });
    },
    onSuccess: () => {
      setHasChanges(false);
      toast({
        title: "Permisos guardados",
        description: "Los cambios en la matriz de permisos se han guardado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/matrix'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudieron guardar los permisos",
        variant: "destructive",
      });
    }
  });

  // Update local state when API data is loaded
  useEffect(() => {
    if (apiPermissions && !hasChanges) {
      setPermissions(apiPermissions);
    }
  }, [apiPermissions, hasChanges]);

  const getPermissionIcon = (action: CRUDAction) => {
    switch (action) {
      case 'read': return <Eye className="h-3 w-3" />;
      case 'create': return <Plus className="h-3 w-3" />;
      case 'update': return <Edit className="h-3 w-3" />;
      case 'delete': return <Trash2 className="h-3 w-3" />;
      case 'admin': return <Settings className="h-3 w-3" />;
    }
  };

  const getPermissionColor = (action: CRUDAction) => {
    switch (action) {
      case 'read': return 'text-blue-600 bg-blue-50';
      case 'create': return 'text-green-600 bg-green-50';
      case 'update': return 'text-orange-600 bg-orange-50';
      case 'delete': return 'text-red-600 bg-red-50';
      case 'admin': return 'text-purple-600 bg-purple-50';
    }
  };

  const getPermissionName = (action: CRUDAction) => {
    switch (action) {
      case 'read': return 'Ver';
      case 'create': return 'Crear';
      case 'update': return 'Editar';
      case 'delete': return 'Eliminar';
      case 'admin': return 'Admin';
    }
  };

  const hasPermission = (roleId: string, moduleId: string, action: CRUDAction): boolean => {
    return permissions[roleId]?.[moduleId]?.includes(action) || false;
  };

  const togglePermission = (roleId: string, moduleId: string, action: CRUDAction) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      if (!newPermissions[roleId]) {
        newPermissions[roleId] = {};
      }
      if (!newPermissions[roleId][moduleId]) {
        newPermissions[roleId][moduleId] = [];
      }

      const currentActions = [...newPermissions[roleId][moduleId]];
      const hasCurrentAction = currentActions.includes(action);

      if (hasCurrentAction) {
        // Remover la acción y aplicar jerarquía descendente
        newPermissions[roleId][moduleId] = currentActions.filter(a => a !== action);
        
        // Si se remueve admin, remover todas las demás
        if (action === 'admin') {
          newPermissions[roleId][moduleId] = [];
        }
        // Si se remueve delete, también remover admin
        if (action === 'delete') {
          newPermissions[roleId][moduleId] = newPermissions[roleId][moduleId].filter(a => a !== 'admin');
        }
        // Si se remueve update, también remover delete y admin
        if (action === 'update') {
          newPermissions[roleId][moduleId] = newPermissions[roleId][moduleId].filter(a => !['delete', 'admin'].includes(a));
        }
        // Si se remueve create, también remover update, delete y admin
        if (action === 'create') {
          newPermissions[roleId][moduleId] = newPermissions[roleId][moduleId].filter(a => !['update', 'delete', 'admin'].includes(a));
        }
      } else {
        // Agregar la acción y aplicar jerarquía ascendente usando helper
        const newActionsSet = new Set([...currentActions, action]);
        newPermissions[roleId][moduleId] = validatePermissionHierarchy(Array.from(newActionsSet));
      }

      setHasChanges(true);
      return newPermissions;
    });
  };

  const resetPermissions = () => {
    if (apiPermissions) {
      setPermissions(apiPermissions);
      setHasChanges(false);
      toast({
        title: "Cambios descartados",
        description: "Se han restaurado los permisos desde el servidor",
      });
    } else {
      setPermissions({});
      setHasChanges(false);
      toast({
        title: "Permisos restablecidos",
        description: "Se han restaurado los permisos por defecto",
      });
    }
  };

  const savePermissions = () => {
    saveMutation.mutate(permissions);
  };

  const getModuleStats = (moduleId: string) => {
    const roles = Object.keys(permissions);
    const withAccess = roles.filter(roleId => 
      permissions[roleId][moduleId] && permissions[roleId][moduleId].length > 0
    ).length;
    
    return {
      total: roles.length,
      withAccess,
      percentage: roles.length > 0 ? Math.round((withAccess / roles.length) * 100) : 0
    };
  };

  const getRoleStats = (roleId: string) => {
    const modulePermissions = permissions[roleId] || {};
    const totalModules = flatModules.length;
    const accessibleModules = flatModules.filter(moduleId => 
      modulePermissions[moduleId] && modulePermissions[moduleId].length > 0
    ).length;
    
    return {
      total: totalModules,
      accessible: accessibleModules,
      percentage: totalModules > 0 ? Math.round((accessibleModules / totalModules) * 100) : 0
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Grid className="h-6 w-6 text-purple-600" />
                  Matriz de Permisos del Sistema
                </CardTitle>
                <CardDescription>
                  Cargando matriz de permisos...
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando permisos del sistema...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Grid className="h-6 w-6 text-purple-600" />
                  Matriz de Permisos del Sistema
                </CardTitle>
                <CardDescription>
                  Error al cargar la matriz de permisos
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/permissions/matrix'] })}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error al cargar permisos</h3>
            <p className="text-muted-foreground mb-4">
              No se pudo conectar con el servidor para obtener los permisos.
            </p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/permissions/matrix'] })}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reintentar Carga
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid className="h-6 w-6 text-purple-600" />
                Matriz de Permisos del Sistema
              </CardTitle>
              <CardDescription>
                Control granular de acceso a módulos por rol. Los cambios se aplican inmediatamente a todos los usuarios.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Cambios sin guardar
                </Badge>
              )}
              <Button variant="outline" onClick={resetPermissions}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restablecer
              </Button>
              <Button 
                onClick={savePermissions}
                disabled={!hasChanges || saveMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Leyenda de permisos */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            <h3 className="font-medium">Tipos de permisos:</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge className="text-blue-600 bg-blue-50">
                  <Eye className="h-3 w-3 mr-1" />
                  Lectura
                </Badge>
                <span className="text-sm text-muted-foreground">Ver información</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className="text-orange-600 bg-orange-50">
                  <Edit3 className="h-3 w-3 mr-1" />
                  Escritura
                </Badge>
                <span className="text-sm text-muted-foreground">Modificar datos</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className="text-red-600 bg-red-50">
                  <Settings className="h-3 w-3 mr-1" />
                  Administrar
                </Badge>
                <span className="text-sm text-muted-foreground">Control total</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matriz de permisos */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-48 font-semibold">Módulo del Sistema</TableHead>
                  {SYSTEM_ROLES.map((role) => (
                    <TableHead key={role.id} className="text-center min-w-32">
                      <div className="space-y-1">
                        <div className="font-medium text-xs">{role.name}</div>
                        <Badge variant="outline" className="text-xs">
                          Nivel {role.level}
                        </Badge>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-24 text-center">Estadísticas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SYSTEM_MODULES.map((module) => {
                  const stats = getModuleStats(module);
                  
                  return (
                    <TableRow key={module} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{module}</div>
                          <div className="text-xs text-muted-foreground">
                            {stats.withAccess}/{stats.total} roles con acceso
                          </div>
                        </div>
                      </TableCell>
                      
                      {SYSTEM_ROLES.map((role) => (
                        <TableCell key={role.id} className="text-center">
                          <div className="flex flex-col gap-1">
                            {(['read', 'write', 'admin'] as PermissionType[]).map((permission) => (
                              <div
                                key={permission}
                                className="flex items-center justify-center"
                                onClick={() => togglePermission(role.id, module, permission)}
                              >
                                <Badge
                                  className={`cursor-pointer transition-all text-xs px-2 py-1 ${
                                    hasPermission(role.id, module, permission)
                                      ? getPermissionColor(permission)
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                >
                                  {getPermissionIcon(permission)}
                                  <span className="ml-1">{getPermissionName(permission)}</span>
                                  {hasPermission(role.id, module, permission) && (
                                    <CheckCircle className="h-3 w-3 ml-1" />
                                  )}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      ))}
                      
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg font-bold">{stats.percentage}%</span>
                          <span className="text-xs text-muted-foreground">acceso</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resumen por roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Resumen de Acceso por Rol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SYSTEM_ROLES.slice(0, 4).map((role) => {
              const stats = getRoleStats(role.id);
              
              return (
                <div key={role.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {role.name}
                    </Badge>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.percentage}%</div>
                    <div className="text-sm text-muted-foreground">
                      {stats.accessible}/{stats.total} módulos
                    </div>
                  </div>
                  
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Consideraciones Importantes</h4>
              <div className="text-sm text-blue-700 mt-1 space-y-1">
                <p>• Los permisos son jerárquicos: Admin incluye Write y Read automáticamente</p>
                <p>• Los cambios se aplican inmediatamente a todos los usuarios con ese rol</p>
                <p>• Se recomienda seguir el principio de menor privilegio necesario</p>
                <p>• Todos los cambios quedan registrados en el log de auditoría</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}