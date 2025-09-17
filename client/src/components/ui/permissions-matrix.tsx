import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleBadge, RoleBadgeWithText } from '@/components/RoleBadge';
import { 
  Grid, Shield, Lock, Unlock, Save, RotateCcw, Eye, Edit, Settings,
  CheckCircle, AlertCircle, Info, Filter, Download, Upload, Star
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

interface PermissionModule {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface PermissionSubmodule {
  id: number;
  name: string;
  slug: string;
  moduleId: number;
  orderIndex: number;
}

interface PermissionPage {
  id: number;
  name: string;
  slug: string;
  submoduleId: number;
}

interface PermissionAction {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface SystemPermission {
  id: number;
  permissionKey: string;
  description: string;
  moduleId?: number;
  submoduleId?: number;
  pageId?: number;
  actionId?: number;
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
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [hasChanges, setHasChanges] = useState(false);
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

  // Cargar estructura de permisos granulares
  const { data: permissionModules = [] } = useQuery({
    queryKey: ['/api/permissions/modules'],
    refetchOnWindowFocus: false,
  });

  const { data: permissionActions = [] } = useQuery({
    queryKey: ['/api/permissions/actions'],
    refetchOnWindowFocus: false,
  });

  const { data: systemPermissions = [] } = useQuery({
    queryKey: ['/api/permissions/system'],
    refetchOnWindowFocus: false,
  });

  // Cargar permisos asignados por rol
  const { data: rolePermissions, isLoading } = useQuery({
    queryKey: ['/api/roles/permissions/matrix'],
    refetchOnWindowFocus: false,
  });

  // Mutation para guardar cambios
  const saveMutation = useMutation({
    mutationFn: (newPermissions: typeof permissions) => {
      return apiRequest('/api/permissions/roles/update', {
        method: 'POST',
        data: { permissions: newPermissions },
      });
    },
    onSuccess: () => {
      setHasChanges(false);
      toast({
        title: "Permisos actualizados",
        description: "Los cambios se guardaron correctamente en el sistema granular",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles/permissions/matrix'] });
    },
    onError: (error: any) => {
      console.error('Error al guardar permisos:', error);
      toast({
        title: "Error al guardar",
        description: error.message || "Error al actualizar permisos granulares",
        variant: "destructive",
      });
    }
  });

  // Cargar permisos al inicializar
  useEffect(() => {
    if (rolePermissions) {
      setPermissions(rolePermissions as Record<string, string[]>);
    } else {
      // Inicializar con estructura vacía
      const defaultPermissions: Record<string, string[]> = {};
      (roles as Role[]).forEach(role => {
        defaultPermissions[role.slug] = [];
      });
      setPermissions(defaultPermissions);
    }
  }, [rolePermissions, roles]);

  // Funciones de utilidad
  const hasPermission = (roleSlug: string, permissionKey: string): boolean => {
    if (roleSlug === 'super-admin' && permissions[roleSlug]?.includes('all')) {
      return true; // Super Admin tiene todos los permisos
    }
    return permissions[roleSlug]?.includes(permissionKey) || false;
  };

  const updatePermission = (roleSlug: string, permissionKey: string, checked: boolean) => {
    if (!canEditPermissions()) return;
    if (roleSlug === 'super-admin') return; // Super Admin no se puede modificar

    setPermissions(prev => {
      const newPermissions = { ...prev };
      if (!newPermissions[roleSlug]) newPermissions[roleSlug] = [];

      const currentPermissions = [...newPermissions[roleSlug]];
      
      if (checked) {
        if (!currentPermissions.includes(permissionKey)) {
          currentPermissions.push(permissionKey);
        }
      } else {
        const index = currentPermissions.indexOf(permissionKey);
        if (index > -1) {
          currentPermissions.splice(index, 1);
        }
      }

      newPermissions[roleSlug] = currentPermissions;
      return newPermissions;
    });
    
    setHasChanges(true);
  };

  const getPermissionCount = (roleSlug: string): number => {
    if (roleSlug === 'super-admin' && permissions[roleSlug]?.includes('all')) {
      return (systemPermissions as SystemPermission[]).length; // Todos los permisos
    }
    return permissions[roleSlug]?.length || 0;
  };

  // Filtros aplicados
  const filteredRoles = (roles as Role[]).filter((role: Role) => 
    selectedRole === 'all' || role.slug === selectedRole
  );

  const filteredModules = (permissionModules as PermissionModule[]).filter((module: PermissionModule) => 
    selectedModule === 'all' || module.slug === selectedModule
  );

  // ✅ NUEVA ESTRUCTURA: Agrupar permisos del sistema granularmente
  const getPermissionsForModule = (moduleSlug: string): SystemPermission[] => {
    return (systemPermissions as SystemPermission[]).filter((perm: SystemPermission) => 
      perm.permissionKey && (perm.permissionKey.startsWith(`${moduleSlug}:`) || perm.permissionKey === 'all')
    );
  };

  // ✅ NUEVA FUNCIÓN: Obtener páginas únicas del sistema (para filas)
  const getUniquePages = (): Array<{ key: string, label: string, module: string }> => {
    const pages = new Map<string, { key: string, label: string, module: string }>();
    
    (systemPermissions as SystemPermission[]).forEach((perm: SystemPermission) => {
      if (!perm.permissionKey || perm.permissionKey === 'all') return; // Skip special permission or undefined
      
      const parts = perm.permissionKey.split(':');
      if (parts.length >= 3) {
        const [module, submodule, page] = parts;
        const pageKey = `${module}:${submodule}:${page}`;
        
        if (!pages.has(pageKey)) {
          const moduleInfo = (permissionModules as PermissionModule[]).find(m => m.slug === module);
          pages.set(pageKey, {
            key: pageKey,
            label: `${moduleInfo?.name || module} › ${submodule} › ${page}`,
            module: module
          });
        }
      }
    });
    
    return Array.from(pages.values());
  };

  // ✅ NUEVA FUNCIÓN: Obtener acciones disponibles para una página específica  
  const getActionsForPage = (pageKey: string): SystemPermission[] => {
    return (systemPermissions as SystemPermission[]).filter((perm: SystemPermission) => 
      perm.permissionKey && perm.permissionKey.startsWith(`${pageKey}:`) && perm.permissionKey !== 'all'
    );
  };

  const handleSave = () => {
    if (hasChanges) {
      saveMutation.mutate(permissions);
    }
  };

  const handleReset = () => {
    if (rolePermissions) {
      setPermissions(rolePermissions as Record<string, string[]>);
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
                {(permissionModules as PermissionModule[]).map((module: PermissionModule) => (
                  <SelectItem key={module.slug} value={module.slug}>
                    {module.name}
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

      {/* ✅ NUEVA MATRIZ GRANULAR: Páginas como filas, acciones como columnas */}
      <div className="overflow-x-auto">
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-blue-800">Matriz Granular de Permisos</span>
          </div>
          <p className="text-sm text-blue-700">
            Sistema granular: <code>módulo:submódulo:página:acción</code>. 
            Cada página tiene 8 acciones específicas que pueden configurarse por rol.
          </p>
        </div>
        
        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3 border-b font-semibold">Página del Sistema</th>
              {filteredRoles.map((role: Role) => (
                <th key={role.slug} className="text-center p-3 border-b font-semibold min-w-40">
                  <div className="flex flex-col items-center gap-1">
                    <RoleBadge roleId={role.slug} />
                    <span className="text-xs text-gray-500">Nivel {role.level}</span>
                  </div>
                </th>
              ))}
              <th className="text-center p-3 border-b font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {getUniquePages()
              .filter(page => selectedModule === 'all' || page.module === selectedModule)
              .map((page) => {
                const pageActions = getActionsForPage(page.key);
                
                return (
                  <tr key={page.key} className="hover:bg-gray-50 border-b">
                    <td className="p-3">
                      <div className="text-sm font-medium">{page.label}</div>
                      <div className="text-xs text-gray-500 font-mono">{page.key}</div>
                    </td>
                    {filteredRoles.map((role: Role) => (
                      <td key={`${role.slug}-${page.key}`} className="p-3 text-center">
                        {role.slug === 'super-admin' ? (
                          <div className="flex items-center justify-center">
                            <Star className="h-5 w-5 text-yellow-500" />
                            <span className="text-xs ml-1 font-semibold text-yellow-600">ALL</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1 justify-center max-w-48">
                            {pageActions.map((action: SystemPermission) => (
                              <div key={action.permissionKey} className="flex flex-col items-center gap-1">
                                <Checkbox
                                  checked={hasPermission(role.slug, action.permissionKey)}
                                  onCheckedChange={(checked) => updatePermission(role.slug, action.permissionKey, !!checked)}
                                  disabled={!editable || !canEditPermissions()}
                                  className="h-3 w-3"
                                />
                                <span className="text-[10px] text-gray-500 truncate max-w-12" title={action.description}>
                                  {action.permissionKey.split(':').pop()?.toUpperCase()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="p-3 text-center">
                      <Badge variant="outline" className="text-xs">
                        {pageActions.length}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            
            {/* Fila de totales */}
            <tr className="bg-gray-50 font-semibold border-t-2">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Total de Permisos</span>
                </div>
              </td>
              {filteredRoles.map((role: Role) => (
                <td key={`total-${role.slug}`} className="p-3 text-center">
                  <Badge variant="outline" className="font-mono bg-white">
                    {getPermissionCount(role.slug)}
                  </Badge>
                </td>
              ))}
              <td className="p-3 text-center">
                <Badge variant="outline" className="bg-blue-100">
                  {(systemPermissions as SystemPermission[]).filter(p => p.permissionKey !== 'all').length}
                </Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ✅ NUEVA LEYENDA GRANULAR */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Sistema de Permisos Granulares:
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-semibold text-gray-700">📖 Acciones de Lectura:</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 text-xs">VIEW</Badge>
              <span>Ver contenido</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600 text-xs">EXPORT</Badge>
              <span>Exportar datos</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="font-semibold text-gray-700">✏️ Acciones de Escritura:</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-orange-600 text-xs">CREATE</Badge>
              <span>Crear nuevos</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-purple-600 text-xs">EDIT</Badge>
              <span>Editar existentes</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-red-600 text-xs">DELETE</Badge>
              <span>Eliminar</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="font-semibold text-gray-700">⚙️ Acciones Avanzadas:</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-indigo-600 text-xs">APPROVE</Badge>
              <span>Aprobar</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-pink-600 text-xs">PUBLISH</Badge>
              <span>Publicar</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-cyan-600 text-xs">IMPORT</Badge>
              <span>Importar</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold">Super Administrador:</span>
            <span className="text-gray-600">Tiene acceso completo a todas las acciones (ALL)</span>
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