import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleBadge, RoleBadgeWithText } from '@/components/RoleBadge';
import { useAdaptiveModules } from "@/hooks/useAdaptiveModules";
import { 
  Grid, Shield, Lock, Unlock, Save, RotateCcw, Eye, Edit, Settings,
  CheckCircle, AlertCircle, Info, Filter, Download, Upload
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Tipos para el componente unificado
interface Role {
  id: number;
  slug: string;
  name: string;
  level: number;
}

interface PermissionsMatrixProps {
  /** Si true, permite edición de permisos */
  editable?: boolean;
  /** Usuario actual para verificar permisos de edición */
  currentUser?: {
    id?: number;
    roleId?: number;
    role?: string;
  };
  /** Función personalizada para verificar si el usuario puede editar */
  canEdit?: () => boolean;
  /** Título personalizado */
  title?: string;
  /** Descripción personalizada */
  description?: string;
  /** Mostrar controles de filtro */
  showFilters?: boolean;
  /** Compacto (sin card wrapper) */
  compact?: boolean;
}

export function PermissionsMatrix({
  editable = true,
  currentUser,
  canEdit,
  title = "Matriz de Permisos Granulares",
  description = "Configura permisos específicos para cada rol y módulo del sistema. Los cambios se sincronizan automáticamente.",
  showFilters = true,
  compact = false
}: PermissionsMatrixProps) {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [permissions, setPermissions] = useState<Record<string, Record<string, string[]>>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const { modules, moduleMap, subModuleMap, flatModules } = useAdaptiveModules();
  const queryClient = useQueryClient();
  
  // ✅ DETERMINAR SI PUEDE EDITAR - Corrige el problema de checkboxes deshabilitados
  const canEditPermissions = (): boolean => {
    if (canEdit) return canEdit();
    
    // ✅ CRITICAL FIX: Super Admin siempre puede editar
    if (currentUser?.role === 'super-admin') return true;
    
    // ✅ CRITICAL FIX: Admin General puede editar
    if (currentUser?.role === 'admin') return true;
    
    // ✅ CRITICAL FIX: Si no hay usuario, permitir en modo desarrollo
    if (!currentUser && process.env.NODE_ENV === 'development') return true;
    
    return false;
  };

  // Cargar roles disponibles
  const { data: roles = [] } = useQuery({
    queryKey: ['/api/roles'],
    refetchOnWindowFocus: false,
  });

  // Cargar matriz de permisos desde API
  const { data: apiPermissions, isLoading } = useQuery({
    queryKey: ['/api/roles/permissions'],
    refetchOnWindowFocus: false,
  });

  // Mutation para guardar cambios
  const saveMutation = useMutation({
    mutationFn: (newPermissions: typeof permissions) => {
      return apiRequest('/api/roles/permissions/save-matrix', {
        method: 'POST',
        data: { rolePermissions: newPermissions },
      });
    },
    onSuccess: () => {
      setHasChanges(false);
      toast({
        title: "Permisos actualizados",
        description: "Los cambios se guardaron correctamente en la base de datos",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles/permissions'] });
    },
    onError: (error: any) => {
      console.error('Error al guardar permisos:', error);
      toast({
        title: "Error al guardar",
        description: error.message || "Error de conexión con el servidor. Verifica que la ruta existe.",
        variant: "destructive",
      });
    }
  });

  // Cargar permisos al inicializar
  useEffect(() => {
    if (apiPermissions) {
      setPermissions(apiPermissions as Record<string, Record<string, string[]>>);
    } else {
      // Configurar Super Admin por defecto si no hay datos
      const superAdminDefaults: Record<string, string[]> = {};
      flatModules.forEach(moduleId => {
        superAdminDefaults[moduleId] = ['read', 'create', 'update', 'delete', 'admin'];
      });

      const defaultPermissions: Record<string, Record<string, string[]>> = {
        'super-admin': superAdminDefaults,
        'admin': {},
        'coord': {},
        'supervisor': {},
        'especialista': {},
        'operador': {},
        'lector': {}
      };

      setPermissions(defaultPermissions);
    }
  }, [apiPermissions, flatModules]);

  // Funciones de utilidad
  const hasPermission = (roleSlug: string, moduleId: string, action: string): boolean => {
    return permissions[roleSlug]?.[moduleId]?.includes(action) || false;
  };

  const updatePermission = (roleSlug: string, moduleId: string, action: string, checked: boolean) => {
    if (!canEditPermissions()) return;

    setPermissions(prev => {
      const newPermissions = { ...prev };
      if (!newPermissions[roleSlug]) newPermissions[roleSlug] = {};
      if (!newPermissions[roleSlug][moduleId]) newPermissions[roleSlug][moduleId] = [];

      const currentPermissions = [...newPermissions[roleSlug][moduleId]];
      
      if (checked) {
        if (!currentPermissions.includes(action)) {
          currentPermissions.push(action);
        }
      } else {
        const index = currentPermissions.indexOf(action);
        if (index > -1) {
          currentPermissions.splice(index, 1);
        }
      }

      newPermissions[roleSlug][moduleId] = currentPermissions;
      return newPermissions;
    });
    
    setHasChanges(true);
  };

  const getPermissionCount = (roleSlug: string): number => {
    const rolePermissions = permissions[roleSlug] || {};
    return Object.values(rolePermissions).reduce((total, modulePerms) => total + modulePerms.length, 0);
  };

  // Filtros aplicados
  const filteredRoles = (roles as Role[]).filter((role: Role) => 
    selectedRole === 'all' || role.slug === selectedRole
  );

  const filteredModules = flatModules.filter(moduleId => 
    selectedModule === 'all' || moduleId === selectedModule
  );

  const handleSave = () => {
    if (hasChanges) {
      saveMutation.mutate(permissions);
    }
  };

  const handleReset = () => {
    if (apiPermissions) {
      setPermissions(apiPermissions as Record<string, Record<string, string[]>>);
      setHasChanges(false);
    }
  };

  const MatrixContent = () => (
    <div className="space-y-6">
      {/* Filtros */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {(roles as Role[]).map((role: Role) => (
                    <SelectItem key={role.slug} value={role.slug}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los módulos</SelectItem>
                {flatModules.map(moduleId => (
                  <SelectItem key={moduleId} value={moduleId}>
                    {subModuleMap[moduleId]?.name || moduleId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botones de acción */}
          {editable && canEditPermissions() && (
            <div className="flex gap-2">
              {hasChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={saveMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Descartar
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || saveMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Indicador de estado */}
      {hasChanges && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Hay cambios sin guardar en la matriz de permisos
          </span>
        </div>
      )}

      {/* Matriz de permisos */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 border-b font-semibold">Rol</th>
              {filteredModules.map(moduleId => (
                <th key={moduleId} className="text-center p-3 border-b font-semibold min-w-32">
                  {subModuleMap[moduleId]?.name || moduleId}
                </th>
              ))}
              <th className="text-center p-3 border-b font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((role: Role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="p-3 border-b">
                  <div className="flex items-center gap-3">
                    <RoleBadgeWithText roleId={role.slug} />
                    <div className="text-xs text-gray-500">
                      Nivel {role.level}
                    </div>
                  </div>
                </td>
                {filteredModules.map(module => (
                  <td key={`${role.slug}-${module}`} className="p-3 border-b text-center">
                    <div className="flex flex-col gap-2">
                      {/* Read Permission */}
                      <div className="flex items-center justify-center gap-1">
                        <Checkbox
                          checked={hasPermission(role.slug, module, 'read')}
                          onCheckedChange={(checked) => updatePermission(role.slug, module, 'read', !!checked)}
                          disabled={!editable || !canEditPermissions()}
                        />
                        <span className="text-xs text-gray-600">R</span>
                      </div>
                      
                      {/* Write Permission */}
                      <div className="flex items-center justify-center gap-1">
                        <Checkbox
                          checked={hasPermission(role.slug, module, 'write')}
                          onCheckedChange={(checked) => updatePermission(role.slug, module, 'write', !!checked)}
                          disabled={!editable || !canEditPermissions()}
                        />
                        <span className="text-xs text-gray-600">W</span>
                      </div>
                      
                      {/* Admin Permission */}
                      <div className="flex items-center justify-center gap-1">
                        <Checkbox
                          checked={hasPermission(role.slug, module, 'admin')}
                          onCheckedChange={(checked) => updatePermission(role.slug, module, 'admin', !!checked)}
                          disabled={!editable || !canEditPermissions()}
                        />
                        <span className="text-xs text-gray-600">A</span>
                      </div>
                    </div>
                  </td>
                ))}
                <td className="p-3 border-b text-center">
                  <Badge variant="outline" className="font-mono">
                    {getPermissionCount(role.slug)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Leyenda de Permisos:</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600">R</Badge>
            <span>Read - Solo lectura</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-600">W</Badge>
            <span>Write - Lectura y escritura</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-red-600">A</Badge>
            <span>Admin - Control total</span>
          </div>
        </div>
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando matriz de permisos...</p>
          </div>
        </div>
      )}
    </div>
  );

  if (compact) {
    return <MatrixContent />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Grid className="h-5 w-5 mr-2" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <MatrixContent />
      </CardContent>
    </Card>
  );
}

export default PermissionsMatrix;