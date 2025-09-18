import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleBadge } from '@/components/RoleBadge';
import { 
  Grid, Shield, Save, RotateCcw, Eye, Filter, ChevronDown, ChevronRight,
  CheckCircle, AlertCircle, Info, FolderOpen, Folder, FileText,
  Settings, Star, CheckCheck, X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Tipos para la vista jerárquica
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
  description?: string;
  submodules?: PermissionSubmodule[];
}

interface PermissionSubmodule {
  id: number;
  name: string;
  slug: string;
  moduleId: number;
  pages?: PermissionPage[];
}

interface PermissionPage {
  id: number;
  name: string;
  slug: string;
  submoduleId: number;
  actions?: string[];
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

interface HierarchicalMatrixProps {
  editable?: boolean;
  currentUser?: {
    id?: number;
    roleId?: number;
    role?: string;
  };
  canEdit?: () => boolean;
  title?: string;
  description?: string;
  showFilters?: boolean;
  compact?: boolean;
}

export function HierarchicalPermissionsMatrix({
  editable = true,
  currentUser,
  canEdit,
  title = "Matriz Jerárquica de Permisos",
  description = "Vista de árbol organizada por módulos, submódulos y páginas con operaciones bulk.",
  showFilters = true,
  compact = false
}: HierarchicalMatrixProps) {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedSubmodule, setSelectedSubmodule] = useState<string>('all');
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedSubmodules, setExpandedSubmodules] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Determinar si puede editar
  const canEditPermissions = (): boolean => {
    if (canEdit) return canEdit();
    if (currentUser?.role === 'super-admin') return true;
    if (currentUser?.role === 'admin') return true;
    if (!currentUser && process.env.NODE_ENV === 'development') return true;
    return false;
  };

  // Queries para obtener datos
  const { data: roles = [] } = useQuery({
    queryKey: ['/api/roles'],
    refetchOnWindowFocus: false,
  });

  const { data: systemPermissions = [] } = useQuery({
    queryKey: ['/api/permissions/system'],
    refetchOnWindowFocus: false,
  });

  const { data: rolePermissions, isLoading } = useQuery({
    queryKey: ['/api/roles/permissions/matrix'],
    refetchOnWindowFocus: false,
  });

  // Mutation para guardar
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
        description: "Los cambios se guardaron correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles/permissions/matrix'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al guardar",
        description: error.message || "Error al actualizar permisos",
        variant: "destructive",
      });
    }
  });

  // Cargar permisos al inicializar
  useEffect(() => {
    if (rolePermissions) {
      setPermissions(rolePermissions as Record<string, string[]>);
    } else {
      const defaultPermissions: Record<string, string[]> = {};
      (roles as Role[]).forEach(role => {
        defaultPermissions[role.slug] = [];
      });
      setPermissions(defaultPermissions);
    }
  }, [rolePermissions, roles]);

  // Mapeo de nombres legibles para módulos y submódulos
  const moduleNames: Record<string, string> = {
    'gestion': 'Gestión',
    'operations': 'O & M', 
    'admin-finance': 'Admin & Finanzas',
    'mkt-comm': 'Mkt & Comm',
    'hr': 'Recursos Humanos',
    'config-security': 'Configuración',
  };

  const submoduleNames: Record<string, string> = {
    'parques': 'Parques',
    'actividades': 'Actividades',
    'amenidades': 'Amenidades',
    'arbolado': 'Arbolado',
    'fauna': 'Fauna',
    'visitantes': 'Visitantes',
    'eventos': 'Eventos',
    'reservas': 'Reservas',
    'evaluaciones': 'Evaluaciones',
    'activos': 'Activos',
    'incidencias': 'Incidencias',
    'almacen': 'Almacén',
    'voluntarios': 'Voluntarios',
    'finanzas': 'Finanzas',
    'contabilidad': 'Contabilidad',
    'concesiones': 'Concesiones',
    'patrocinadores': 'Patrocinadores',
    'contratos': 'Contratos',
    'activos-mkt': 'Activos',
    'campañas': 'Campañas',
    'empleados': 'Empleados',
    'nomina': 'Nómina',
    'vacaciones': 'Vacaciones',
    'usuarios': 'Usuarios',
    'roles': 'Roles',
    'permisos': 'Permisos',
    'auditoria': 'Auditoría',
    'respaldos': 'Respaldos',
    'actualizaciones': 'Actualizaciones',
  };

  const pageNames: Record<string, string> = {
    'list': 'Listado',
    'create': 'Crear',
    'edit': 'Editar',
    'dashboard': 'Dashboard',
    'management': 'Gestión',
    'calendar': 'Calendario',
    'categories': 'Categorías',
    'registrations': 'Inscripciones',
    'instructors': 'Instructores',
    'inventory': 'Inventario',
    'species': 'Especies',
    'maintenance': 'Mantenimiento',
    'count': 'Conteo',
    'feedback': 'Retroalimentación',
    'tabulador': 'Tabulador',
    'active': 'Activos',
    'spaces': 'Espacios',
    'new': 'Nuevo',
    'assignments': 'Asignaciones',
    'map': 'Mapa',
    'movements': 'Movimientos',
    'requisitions': 'Requisiciones',
    'consumables': 'Consumibles',
    'recognitions': 'Reconocimientos',
    'registry': 'Registro',
    'budgets': 'Presupuestos',
    'cash-flow': 'Flujo de Efectivo',
    'calculator': 'Calculadora',
    'payments': 'Pagos',
    'journal': 'Asientos',
    'balance': 'Balanza',
    'financials': 'Estados Financieros',
    'integration': 'Integración',
    'catalog': 'Catálogo',
    'locations': 'Ubicaciones',
    'finance': 'Finanzas',
    'assets': 'Activos',
    'campaigns': 'Campañas',
    'beneficios': 'Beneficios',
    'paquetes': 'Paquetes',
    'directory': 'Directorio',
    'payroll': 'Nómina',
    'requests': 'Solicitudes',
    'matrix': 'Matriz',
    'backups': 'Respaldos',
    'logs': 'Registros',
    'updates': 'Actualizaciones',
  };

  const actionNames: Record<string, string> = {
    'view': 'Ver',
    'create': 'Crear',
    'edit': 'Editar',
    'delete': 'Eliminar',
    'approve': 'Aprobar',
    'publish': 'Publicar',
    'export': 'Exportar',
    'manage': 'Gestionar',
    'process': 'Procesar',
  };

  // Organizar datos jerárquicamente
  const organizeHierarchically = () => {
    const hierarchy: Record<string, any> = {};
    
    (systemPermissions as SystemPermission[]).forEach(perm => {
      if (!perm.permissionKey || perm.permissionKey === 'all') return;
      
      const parts = perm.permissionKey.split(':');
      if (parts.length < 4) return;
      
      const [moduleSlug, submoduleSlug, pageSlug, actionSlug] = parts;
      
      if (!hierarchy[moduleSlug]) {
        hierarchy[moduleSlug] = {
          slug: moduleSlug,
          name: moduleNames[moduleSlug] || moduleSlug.charAt(0).toUpperCase() + moduleSlug.slice(1),
          submodules: {}
        };
      }
      
      if (!hierarchy[moduleSlug].submodules[submoduleSlug]) {
        hierarchy[moduleSlug].submodules[submoduleSlug] = {
          slug: submoduleSlug,
          name: submoduleNames[submoduleSlug] || submoduleSlug.charAt(0).toUpperCase() + submoduleSlug.slice(1),
          pages: {}
        };
      }
      
      if (!hierarchy[moduleSlug].submodules[submoduleSlug].pages[pageSlug]) {
        hierarchy[moduleSlug].submodules[submoduleSlug].pages[pageSlug] = {
          slug: pageSlug,
          name: pageNames[pageSlug] || pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1),
          actions: []
        };
      }
      
      hierarchy[moduleSlug].submodules[submoduleSlug].pages[pageSlug].actions.push({
        slug: actionSlug,
        name: actionNames[actionSlug] || actionSlug.charAt(0).toUpperCase() + actionSlug.slice(1),
        permissionKey: perm.permissionKey,
        description: perm.description
      });
    });
    
    return hierarchy;
  };

  const hierarchicalData = organizeHierarchically();

  // Filtros aplicados
  const filteredRoles = (roles as Role[]).filter((role: Role) => 
    selectedRole === 'all' || role.slug === selectedRole
  );

  const availableSubmodules = selectedModule === 'all' 
    ? Object.values(hierarchicalData).flatMap((module: any) => 
        Object.values(module.submodules).map((sub: any) => ({ 
          slug: sub.slug, 
          name: sub.name, 
          moduleSlug: module.slug 
        }))
      )
    : Object.values(hierarchicalData[selectedModule]?.submodules || {}).map((sub: any) => ({ 
        slug: sub.slug, 
        name: sub.name, 
        moduleSlug: selectedModule 
      }));

  // Funciones de utilidad
  const hasPermission = (roleSlug: string, permissionKey: string): boolean => {
    if (roleSlug === 'super-admin' && permissions[roleSlug]?.includes('all')) {
      return true;
    }
    return permissions[roleSlug]?.includes(permissionKey) || false;
  };

  const updatePermission = (roleSlug: string, permissionKey: string, checked: boolean) => {
    if (!canEditPermissions() || roleSlug === 'super-admin') return;

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

  // Operaciones bulk
  const bulkUpdateModule = (roleSlug: string, moduleSlug: string, checked: boolean) => {
    if (!canEditPermissions() || roleSlug === 'super-admin') return;

    const modulePermissions = (systemPermissions as SystemPermission[])
      .filter(perm => perm.permissionKey?.startsWith(`${moduleSlug}:`))
      .map(perm => perm.permissionKey);

    modulePermissions.forEach(permKey => {
      if (permKey) updatePermission(roleSlug, permKey, checked);
    });
  };

  const bulkUpdateSubmodule = (roleSlug: string, moduleSlug: string, submoduleSlug: string, checked: boolean) => {
    if (!canEditPermissions() || roleSlug === 'super-admin') return;

    const submodulePermissions = (systemPermissions as SystemPermission[])
      .filter(perm => perm.permissionKey?.startsWith(`${moduleSlug}:${submoduleSlug}:`))
      .map(perm => perm.permissionKey);

    submodulePermissions.forEach(permKey => {
      if (permKey) updatePermission(roleSlug, permKey, checked);
    });
  };

  const bulkUpdateAction = (roleSlug: string, actionSlug: string, checked: boolean) => {
    if (!canEditPermissions() || roleSlug === 'super-admin') return;

    const actionPermissions = (systemPermissions as SystemPermission[])
      .filter(perm => perm.permissionKey?.endsWith(`:${actionSlug}`))
      .map(perm => perm.permissionKey);

    actionPermissions.forEach(permKey => {
      if (permKey) updatePermission(roleSlug, permKey, checked);
    });
  };

  // Verificar si todos los permisos de un módulo están activados para un rol
  const isModuleFullyActive = (roleSlug: string, moduleSlug: string): boolean => {
    if (roleSlug === 'super-admin') return true;

    const modulePermissions = (systemPermissions as SystemPermission[])
      .filter(perm => perm.permissionKey?.startsWith(`${moduleSlug}:`))
      .map(perm => perm.permissionKey);

    return modulePermissions.length > 0 && modulePermissions.every(permKey => 
      permKey && hasPermission(roleSlug, permKey)
    );
  };

  // Verificar si todos los permisos de un submódulo están activados para un rol
  const isSubmoduleFullyActive = (roleSlug: string, moduleSlug: string, submoduleSlug: string): boolean => {
    if (roleSlug === 'super-admin') return true;

    const submodulePermissions = (systemPermissions as SystemPermission[])
      .filter(perm => perm.permissionKey?.startsWith(`${moduleSlug}:${submoduleSlug}:`))
      .map(perm => perm.permissionKey);

    return submodulePermissions.length > 0 && submodulePermissions.every(permKey => 
      permKey && hasPermission(roleSlug, permKey)
    );
  };

  // Verificar si todos los permisos de solo vista están activados para un rol
  const isViewOnlyActive = (roleSlug: string): boolean => {
    if (roleSlug === 'super-admin') return true;

    const viewPermissions = (systemPermissions as SystemPermission[])
      .filter(perm => perm.permissionKey?.endsWith(':view'))
      .map(perm => perm.permissionKey);

    return viewPermissions.length > 0 && viewPermissions.every(permKey => 
      permKey && hasPermission(roleSlug, permKey)
    );
  };

  // Verificar si algún permiso del módulo está activo
  const hasAnyModulePermission = (roleSlug: string, moduleSlug: string): boolean => {
    if (roleSlug === 'super-admin') return true;

    const modulePermissions = (systemPermissions as SystemPermission[])
      .filter(perm => perm.permissionKey?.startsWith(`${moduleSlug}:`))
      .map(perm => perm.permissionKey);

    return modulePermissions.some(permKey => 
      permKey && hasPermission(roleSlug, permKey)
    );
  };

  // Toggle expand/collapse
  const toggleModule = (moduleSlug: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleSlug)) {
        newSet.delete(moduleSlug);
      } else {
        newSet.add(moduleSlug);
      }
      return newSet;
    });
  };

  const toggleSubmodule = (submoduleSlug: string) => {
    setExpandedSubmodules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submoduleSlug)) {
        newSet.delete(submoduleSlug);
      } else {
        newSet.add(submoduleSlug);
      }
      return newSet;
    });
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
      {/* Filtros y controles */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center flex-wrap">
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
            
            <Select value={selectedModule} onValueChange={(val) => {
              setSelectedModule(val);
              setSelectedSubmodule('all');
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los módulos</SelectItem>
                {Object.keys(hierarchicalData).map(moduleSlug => (
                  <SelectItem key={moduleSlug} value={moduleSlug}>
                    {hierarchicalData[moduleSlug].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {availableSubmodules.length > 0 && (
              <Select value={selectedSubmodule} onValueChange={setSelectedSubmodule}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por submódulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los submódulos</SelectItem>
                  {availableSubmodules.map(sub => (
                    <SelectItem key={`${sub.moduleSlug}:${sub.slug}`} value={sub.slug}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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

      {/* Indicador de cambios */}
      {hasChanges && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Hay cambios sin guardar en la matriz de permisos
          </span>
        </div>
      )}

      {/* Vista jerárquica de árbol */}
      <div className="space-y-6">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-blue-800">Vista Jerárquica de Permisos</span>
          </div>
          <p className="text-sm text-blue-700">
            Navega por módulos → submódulos → páginas → acciones. Usa las operaciones bulk para gestionar múltiples permisos a la vez.
          </p>
        </div>

        {/* Encabezados de roles */}
        <div className="bg-gray-50 border border-gray-200 rounded-t-lg p-3 mb-2">
          <div className="grid grid-cols-[1fr,auto] gap-4">
            <div className="font-semibold text-gray-700">Estructura del Sistema</div>
            <div className="flex gap-4">
              {filteredRoles.map((role: Role) => (
                <div key={role.slug} className="min-w-[140px] text-center">
                  <RoleBadge roleId={role.slug} />
                  <div className="text-xs text-gray-500 mt-1">Nivel {role.level}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Árbol jerárquico */}
        <div className="space-y-2">
          {Object.entries(hierarchicalData)
            .filter(([moduleSlug]) => 
              selectedModule === 'all' || moduleSlug === selectedModule
            )
            .map(([moduleSlug, moduleData]: [string, any]) => (
              <div key={moduleSlug} className="border border-gray-200 rounded-lg">
                {/* Encabezado del módulo */}
                <div className="bg-gray-50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleModule(moduleSlug)}
                      className="h-6 w-6 p-0"
                    >
                      {expandedModules.has(moduleSlug) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </Button>
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-800">{moduleData.name}</span>
                    <Badge variant="outline">
                      {Object.keys(moduleData.submodules).length} submódulos
                    </Badge>
                  </div>
                  
                  {/* Bulk actions para módulo */}
                  <div className="flex gap-4">
                    {filteredRoles.map((role: Role) => (
                      <div key={role.slug} className="min-w-[140px] flex flex-col gap-1 items-center">
                        {role.slug === 'super-admin' ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs text-yellow-600">TODO</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <Button
                              variant={isModuleFullyActive(role.slug, moduleSlug) ? "default" : "outline"}
                              size="sm"
                              onClick={() => bulkUpdateModule(role.slug, moduleSlug, !isModuleFullyActive(role.slug, moduleSlug))}
                              className={`h-6 text-xs px-2 w-full ${isModuleFullyActive(role.slug, moduleSlug) ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                              disabled={!editable || !canEditPermissions()}
                              title={isModuleFullyActive(role.slug, moduleSlug) ? "Todos los permisos activos - Clic para desactivar" : "Activar todos los permisos de este módulo"}
                            >
                              <CheckCheck className={`h-3 w-3 mr-1 ${isModuleFullyActive(role.slug, moduleSlug) ? 'text-white' : ''}`} />
                              Todos {isModuleFullyActive(role.slug, moduleSlug) ? '✓' : ''}
                            </Button>
                            <div className="flex gap-1">
                              <Button
                                variant={isViewOnlyActive(role.slug) ? "default" : "outline"}
                                size="sm"
                                onClick={() => bulkUpdateAction(role.slug, 'view', !isViewOnlyActive(role.slug))}
                                className={`h-5 text-[10px] px-1 flex-1 ${isViewOnlyActive(role.slug) ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}`}
                                disabled={!editable || !canEditPermissions()}
                                title={isViewOnlyActive(role.slug) ? "Permisos de vista activos - Clic para desactivar" : "Activar solo permisos de vista"}
                              >
                                <Eye className={`h-3 w-3 ${isViewOnlyActive(role.slug) ? 'text-white' : ''}`} />
                                {isViewOnlyActive(role.slug) ? '✓' : ''}
                              </Button>
                              <Button
                                variant={!hasAnyModulePermission(role.slug, moduleSlug) ? "default" : "outline"}
                                size="sm"
                                onClick={() => bulkUpdateModule(role.slug, moduleSlug, false)}
                                className={`h-5 text-[10px] px-1 flex-1 ${!hasAnyModulePermission(role.slug, moduleSlug) ? 'bg-gray-500 hover:bg-gray-600 text-white' : ''}`}
                                disabled={!editable || !canEditPermissions()}
                                title={!hasAnyModulePermission(role.slug, moduleSlug) ? "Sin permisos activos" : "Desactivar todos los permisos"}
                              >
                                <X className={`h-3 w-3 ${!hasAnyModulePermission(role.slug, moduleSlug) ? 'text-white' : ''}`} />
                                {!hasAnyModulePermission(role.slug, moduleSlug) ? '✓' : ''}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contenido del módulo */}
                {expandedModules.has(moduleSlug) && (
                  <div className="p-4 space-y-3">
                    {Object.entries(moduleData.submodules)
                      .filter(([submoduleSlug]) => 
                        selectedSubmodule === 'all' || submoduleSlug === selectedSubmodule
                      )
                      .map(([submoduleSlug, submoduleData]: [string, any]) => (
                        <div key={submoduleSlug} className="border-l-2 border-gray-300 pl-4">
                          {/* Encabezado del submódulo */}
                          <div className="flex items-center justify-between bg-gray-25 p-3 rounded">
                            <div className="flex items-center gap-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSubmodule(`${moduleSlug}:${submoduleSlug}`)}
                                className="h-5 w-5 p-0"
                              >
                                {expandedSubmodules.has(`${moduleSlug}:${submoduleSlug}`) ? 
                                  <ChevronDown className="h-3 w-3" /> : 
                                  <ChevronRight className="h-3 w-3" />
                                }
                              </Button>
                              <Folder className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-gray-700">{submoduleData.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {Object.keys(submoduleData.pages).length} páginas
                              </Badge>
                            </div>

                            {/* Bulk actions para submódulo */}
                            <div className="flex gap-4">
                              {filteredRoles.map((role: Role) => (
                                <div key={role.slug} className="min-w-[140px] flex items-center justify-center">
                                  {role.slug === 'super-admin' ? (
                                    <Star className="h-3 w-3 text-yellow-500" />
                                  ) : (
                                    <div className="flex gap-1">
                                      <Button
                                        variant={isSubmoduleFullyActive(role.slug, moduleSlug, submoduleSlug) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => bulkUpdateSubmodule(role.slug, moduleSlug, submoduleSlug, !isSubmoduleFullyActive(role.slug, moduleSlug, submoduleSlug))}
                                        className={`h-5 text-xs px-2 ${isSubmoduleFullyActive(role.slug, moduleSlug, submoduleSlug) ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                        disabled={!editable || !canEditPermissions()}
                                        title={isSubmoduleFullyActive(role.slug, moduleSlug, submoduleSlug) ? "Todos activos - Clic para desactivar" : "Activar todos los permisos del submódulo"}
                                      >
                                        <CheckCheck className={`h-2 w-2 ${isSubmoduleFullyActive(role.slug, moduleSlug, submoduleSlug) ? 'text-white' : ''}`} />
                                        {isSubmoduleFullyActive(role.slug, moduleSlug, submoduleSlug) ? ' ✓' : ''}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => bulkUpdateSubmodule(role.slug, moduleSlug, submoduleSlug, false)}
                                        className="h-5 text-xs px-1"
                                        disabled={!editable || !canEditPermissions()}
                                        title="Desactivar todos"
                                      >
                                        <X className="h-2 w-2" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Páginas del submódulo */}
                          {expandedSubmodules.has(`${moduleSlug}:${submoduleSlug}`) && (
                            <div className="mt-3 space-y-2 pl-6">
                              {Object.entries(submoduleData.pages).map(([pageSlug, pageData]: [string, any]) => (
                                <div key={pageSlug} className="grid grid-cols-[1fr,auto] gap-4 p-3 bg-white rounded border">
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <div>
                                      <span className="text-sm font-medium">{pageData.name}</span>
                                      <div className="text-xs text-gray-400 font-mono">{pageSlug}</div>
                                    </div>
                                  </div>

                                  {/* Acciones de la página alineadas con los roles */}
                                  <div className="flex gap-4">
                                    {filteredRoles.map((role: Role) => (
                                      <div key={role.slug} className="min-w-[140px]">
                                        {role.slug === 'super-admin' ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Star className="h-3 w-3 text-yellow-500" />
                                            <span className="text-xs text-yellow-600">TODOS</span>
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-3 gap-1">
                                            {pageData.actions.map((action: any) => (
                                              <div key={action.slug} className="text-center">
                                                <Checkbox
                                                  checked={hasPermission(role.slug, action.permissionKey)}
                                                  onCheckedChange={(checked) => 
                                                    updatePermission(role.slug, action.permissionKey, !!checked)
                                                  }
                                                  disabled={!editable || !canEditPermissions()}
                                                  className="h-4 w-4"
                                                  title={`${action.name} - ${action.description}`}
                                                />
                                                <div className="text-[9px] text-gray-500 mt-1">
                                                  {action.slug.substring(0, 3).toUpperCase()}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando permisos...</p>
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

export default HierarchicalPermissionsMatrix;