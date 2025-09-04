import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDynamicRoles, useDynamicPermissions, DynamicRoleGuard } from '@/components/DynamicRoleGuard';
import { RoleBadge } from '@/components/RoleBadge';
import { Shield, Database, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function RoleSystemTest() {
  const queryClient = useQueryClient();
  
  // Hooks para obtener datos dinámicos
  const { data: roles, isLoading: rolesLoading, error: rolesError } = useDynamicRoles();
  const { data: userPermissions, isLoading: permissionsLoading, error: permissionsError } = useQuery({
    queryKey: ['/api/users/1/permissions'],
    staleTime: 2 * 60 * 1000,
  });

  // Mutación para sincronizar roles
  const syncRolesMutation = useMutation({
    mutationFn: () => apiRequest('/api/roles/sync-system-roles', {
      method: 'POST',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
    },
  });

  const handleSyncRoles = () => {
    syncRolesMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-blue-600" />
            Sistema de Roles Dinámico - Prueba
          </h1>
          <p className="text-muted-foreground mt-1">
            Migración de sistema hardcodeado a base de datos completada
          </p>
        </div>
        
        <Button 
          onClick={handleSyncRoles}
          disabled={syncRolesMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Zap className="h-4 w-4 mr-2" />
          {syncRolesMutation.isPending ? 'Sincronizando...' : 'Sincronizar Roles'}
        </Button>
      </div>

      {/* Estado de la migración */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold">Sistema BD</p>
                <p className="text-sm text-muted-foreground">
                  {rolesLoading ? 'Cargando...' : rolesError ? 'Error' : 'Activo'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-semibold">Roles BD</p>
                <p className="text-sm text-muted-foreground">
                  {roles ? roles.length : '0'} roles
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-semibold">APIs Dinámicas</p>
                <p className="text-sm text-muted-foreground">
                  {permissionsLoading ? 'Cargando...' : permissionsError ? 'Error' : 'Activas'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold">Componentes</p>
                <p className="text-sm text-muted-foreground">Migrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles desde BD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Roles Dinámicos desde Base de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rolesLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : rolesError ? (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-red-800">Error cargando roles: {rolesError.message}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles?.map((role) => (
                <div key={role.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <RoleBadge roleId={role.id} useDynamic={true} />
                    <Badge variant="outline">Nivel {role.level}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  <div className="mt-2">
                    <p className="text-xs font-mono">Slug: {role.slug}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test de RoleGuard Dinámico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Prueba de DynamicRoleGuard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Acceso Total (Super Admin)</h4>
              <DynamicRoleGuard requiredLevel={1} fallback={
                <Badge variant="destructive">Sin acceso</Badge>
              }>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Acceso concedido
                </Badge>
              </DynamicRoleGuard>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Módulo Gestión - Lectura</h4>
              <DynamicRoleGuard 
                requiredModule="Gestión" 
                requiredPermission="read"
                fallback={<Badge variant="destructive">Sin acceso</Badge>}
              >
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Acceso concedido
                </Badge>
              </DynamicRoleGuard>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permisos del usuario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permisos Dinámicos del Usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          {permissionsLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : permissionsError ? (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-red-800">Error cargando permisos</p>
            </div>
          ) : (
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(userPermissions, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Estado de la sincronización */}
      {syncRolesMutation.isSuccess && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Roles sincronizados exitosamente con la base de datos</span>
            </div>
          </CardContent>
        </Card>
      )}

      {syncRolesMutation.isError && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error sincronizando roles: {syncRolesMutation.error?.message}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}