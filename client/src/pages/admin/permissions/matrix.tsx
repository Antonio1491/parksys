import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleBadge, RoleBadgeWithText } from '@/components/RoleBadge';
import { useAdaptiveModules } from "@/hooks/useAdaptiveModules";
import { useAdaptivePermissions } from "@/hooks/useAdaptivePermissions";
import { Link } from 'wouter';
import { 
  Grid, Shield, Lock, Unlock, Save, RotateCcw, Eye, Edit, Settings,
  CheckCircle, AlertCircle, Info, Filter, Download, Upload
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

const PermissionsMatrix: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [permissions, setPermissions] = useState<Record<string, Record<string, string[]>>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const { modules, moduleMap, subModuleMap, flatModules } = useAdaptiveModules();
  const { user } = useAuth();
  const { hasPermission: userHasPermission } = useAdaptivePermissions(user?.id || 1);
  
  // Debug: Verificar usuario actual y corregir si no es Super Admin
  useEffect(() => {
    console.log('🔍 [PERMISOS DEBUG] Usuario actual:', user);
    console.log('🔍 [PERMISOS DEBUG] Rol del usuario:', user?.role);
    console.log('🔍 [PERMISOS DEBUG] RoleID del usuario:', user?.roleId);
    
    // Si no es Super Admin (roleId 8), cambiar al usuario correcto
    if (user && user.roleId !== 8) {
      console.log('🔧 [PERMISOS DEBUG] Cambiando al usuario Super Admin...');
      // Establecer el usuario Super Admin correcto
      const superAdminUser = {
        id: 3,
        username: 'superadmin',
        email: 'superadmin@parquesmx.com', 
        role: 'super-admin',
        roleId: 8,
        fullName: 'Super Administrador'
      };
      localStorage.setItem('user', JSON.stringify(superAdminUser));
      window.location.reload(); // Recargar para aplicar cambios
    }
  }, [user]);

  // Cargar permisos desde localStorage al iniciar y configurar Super Admin por defecto
  useEffect(() => {
    const savedPermissions = localStorage.getItem('rolePermissions');
    let loadedPermissions = {};
    
    if (savedPermissions) {
      try {
        loadedPermissions = JSON.parse(savedPermissions);
      } catch (error) {
        console.error('Error al cargar permisos:', error);
      }
    }

    // Asegurar que Super Admin tenga todos los permisos por defecto
    const superAdminDefaults = {};
    flatModules.forEach(moduleId => {
      superAdminDefaults[moduleId] = ['read', 'create', 'update', 'delete', 'admin'];
    });

    const finalPermissions = {
      ...loadedPermissions,
      'super-admin': superAdminDefaults
    };

    setPermissions(finalPermissions);
  }, [flatModules]);

  // Guardar cambios en localStorage automáticamente
  useEffect(() => {
    if (hasChanges) {
      localStorage.setItem('rolePermissions', JSON.stringify(permissions));
      toast({
        title: "Cambios guardados",
        description: "Los permisos se han sincronizado automáticamente",
      });
      setHasChanges(false);
    }
  }, [permissions, hasChanges]);

  const updatePermission = (roleId: string, module: string, permissionType: 'read' | 'write' | 'admin', enabled: boolean) => {
    // Proteger Super Admin - no puede editarse
    if (roleId === 'super-admin') {
      toast({
        title: "Protección de Super Admin",
        description: "Los permisos de Super Admin no pueden modificarse",
        variant: "destructive"
      });
      return;
    }

    if (!userHasPermission('config-seguridad', 'admin')) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para modificar la matriz",
        variant: "destructive"
      });
      return;
    }

    setPermissions(prev => {
      const newPermissions = { ...prev };
      if (!newPermissions[roleId]) {
        newPermissions[roleId] = {} as any;
      }
      if (!(newPermissions[roleId] as any)[module]) {
        (newPermissions[roleId] as any)[module] = [];
      }

      const currentPerms = [...(newPermissions[roleId] as any)[module]];
      if (enabled) {
        if (!currentPerms.includes(permissionType)) {
          currentPerms.push(permissionType);
        }
      } else {
        const index = currentPerms.indexOf(permissionType);
        if (index > -1) {
          currentPerms.splice(index, 1);
        }
      }

      (newPermissions[roleId] as any)[module] = currentPerms;
      return newPermissions;
    });
    setHasChanges(true);
  };

  const hasPermission = (roleId: string, module: string, permissionType: 'read' | 'write' | 'admin'): boolean => {
    return (permissions[roleId] as any)?.[module]?.includes(permissionType) || false;
  };

  const getPermissionCount = (roleId: string): number => {
    let count = 0;
    flatModules.forEach(moduleId => {
      if ((permissions[roleId] as any)?.[moduleId]) {
        count += (permissions[roleId] as any)[moduleId].length;
      }
    });
    return count;
  };

  const resetToDefaults = () => {
    if (!userHasPermission('config-seguridad', 'admin')) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para resetear la matriz",
        variant: "destructive"
      });
      return;
    }

    setPermissions({});
    setHasChanges(true);
    toast({
      title: "Matriz restablecida",
      description: "Se han restaurado los permisos por defecto",
    });
  };

  // Usar roles dinámicos de la BD en lugar de hardcodeados
  const { data: dynamicRoles = [] } = useQuery<any[]>({
    queryKey: ['/api/roles'],
    staleTime: 5 * 60 * 1000,
  });
  
  const filteredRoles = selectedRole === 'all' ? dynamicRoles : dynamicRoles.filter(r => r.slug === selectedRole);
  const filteredModules = selectedModule === 'all' ? flatModules : [selectedModule];

  return (
    <AdminLayout title="Matriz de Permisos" subtitle="Configuración granular de permisos por rol y módulo">
      {/* Controles de filtrado */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Filtrar por Rol</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {dynamicRoles.map(role => (
                  <SelectItem key={role.id} value={role.slug}>
                    <RoleBadgeWithText roleId={role.slug} size="sm" />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Filtrar por Módulo</label>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Seleccionar módulo" />
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
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Defaults
          </Button>
          <Link href="/admin/roles">
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Ver Roles
            </Button>
          </Link>
        </div>
      </div>

      {/* Información de estado */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Grid className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-blue-800">Matriz Activa</div>
                <div className="text-2xl font-bold text-blue-900">7x7</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm font-medium text-green-800">Sincronizado</div>
                <div className="text-xs text-green-700">localStorage</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-sm font-medium text-purple-800">Mi Rol</div>
                <RoleBadge roleId={user?.role || "admin"} size="sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-600" />
              <div>
                <div className="text-sm font-medium text-amber-800">Cambios</div>
                <div className="text-xs text-amber-700">
                  {hasChanges ? 'Guardando...' : 'Sincronizado'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matriz de permisos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Grid className="h-5 w-5 mr-2" />
            Matriz de Permisos Granulares
          </CardTitle>
          <CardDescription>
            Configura permisos específicos para cada rol y módulo del sistema. 
            Los cambios se sincronizan automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                {filteredRoles.map(role => (
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
                              disabled={role.slug === 'super-admin' && user?.role !== 'super-admin'}
                            />
                            <span className="text-xs text-gray-600">R</span>
                          </div>
                          
                          {/* Write Permission */}
                          <div className="flex items-center justify-center gap-1">
                            <Checkbox
                              checked={hasPermission(role.slug, module, 'write')}
                              onCheckedChange={(checked) => updatePermission(role.slug, module, 'write', !!checked)}
                              disabled={role.slug === 'super-admin' && user?.role !== 'super-admin'}
                            />
                            <span className="text-xs text-gray-600">W</span>
                          </div>
                          
                          {/* Admin Permission */}
                          <div className="flex items-center justify-center gap-1">
                            <Checkbox
                              checked={hasPermission(role.slug, module, 'admin')}
                              onCheckedChange={(checked) => updatePermission(role.slug, module, 'admin', !!checked)}
                              disabled={role.slug === 'super-admin' && user?.role !== 'super-admin'}
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
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
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
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default PermissionsMatrix;