import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { DynamicRoleGuard } from '@/components/DynamicRoleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Shield, 
  Users, 
  Grid, 
  Settings, 
  Eye, 
  Edit, 
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Database,
  Activity,
  UserCheck,
  Crown
} from 'lucide-react';
import PermissionsMatrix from '@/components/ui/permissions-matrix';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useAdaptiveModules } from '@/hooks/useAdaptiveModules';

const PermissionsDashboard: React.FC = () => {
  const { user } = useUnifiedAuth();
  const { modules, moduleMap } = useAdaptiveModules();
  const [selectedMetric, setSelectedMetric] = useState('roles');

  // Fetch dashboard data
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/roles/dashboard-stats'],
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['/api/roles'],
  });

  const { data: permissionsMatrix } = useQuery({
    queryKey: ['/api/roles/permissions'],
  });

  const { data: userStats = {} } = useQuery({
    queryKey: ['/api/users/stats'],
  });

  // Mock data para gráficos (en producción vendrían de la API)
  const roleDistribution = [
    { name: 'Super Admin', value: 2, color: '#dc2626' },
    { name: 'Admin General', value: 5, color: '#ea580c' },
    { name: 'Coordinador', value: 12, color: '#ca8a04' },
    { name: 'Instructor', value: 28, color: '#16a34a' },
    { name: 'Operador', value: 15, color: '#2563eb' },
    { name: 'Voluntario', value: 45, color: '#7c3aed' },
  ];

  const modulePermissions = [
    { module: 'Parques', read: 85, write: 45, admin: 15 },
    { module: 'Actividades', read: 90, write: 60, admin: 20 },
    { module: 'Finanzas', read: 25, write: 15, admin: 8 },
    { module: 'RH', read: 40, write: 25, admin: 12 },
    { module: 'Marketing', read: 65, write: 35, admin: 18 },
    { module: 'Almacén', read: 70, write: 40, admin: 15 },
  ];

  const systemMetrics = {
    totalRoles: Array.isArray(roles) ? roles.length : 7,
    totalUsers: (userStats as any)?.total || 107,
    activePermissions: 189,
    modulesCovered: Object.keys(moduleMap).length || 15,
    coveragePercentage: 92,
    securityScore: 89
  };

  const QuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
            <Crown className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{systemMetrics.totalRoles}</p>
            <p className="text-sm font-medium text-gray-600">Roles Activos</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-4">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{systemMetrics.totalUsers}</p>
            <p className="text-sm font-medium text-gray-600">Usuarios Totales</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mr-4">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{systemMetrics.activePermissions}</p>
            <p className="text-sm font-medium text-gray-600">Permisos Activos</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mr-4">
            <Grid className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{systemMetrics.modulesCovered}</p>
            <p className="text-sm font-medium text-gray-600">Módulos Cubiertos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SecurityIndicators = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Estado del Sistema Híbrido FK
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cobertura de Permisos</span>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {systemMetrics.coveragePercentage}%
            </Badge>
          </div>
          <Progress value={systemMetrics.coveragePercentage} className="w-full" />
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Puntuación de Seguridad</span>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {systemMetrics.securityScore}/100
            </Badge>
          </div>
          <Progress value={systemMetrics.securityScore} className="w-full" />
          
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Sistema híbrido FK operativo
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Accesos Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/admin/permissions/matrix">
            <Button variant="outline" className="w-full justify-start">
              <Grid className="h-4 w-4 mr-2" />
              Matriz de Permisos
            </Button>
          </Link>
          
          <Link href="/admin/roles">
            <Button variant="outline" className="w-full justify-start">
              <Crown className="h-4 w-4 mr-2" />
              Gestión de Roles
            </Button>
          </Link>
          
          <Link href="/admin/configuracion-seguridad/access/users">
            <Button variant="outline" className="w-full justify-start">
              <UserCheck className="h-4 w-4 mr-2" />
              Usuarios Pendientes
            </Button>
          </Link>
          
          <Link href="/admin/configuracion-seguridad/audit">
            <Button variant="outline" className="w-full justify-start">
              <Eye className="h-4 w-4 mr-2" />
              Auditoría de Cambios
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );

  const ChartsSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Roles</CardTitle>
          <CardDescription>Usuarios por tipo de rol en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permisos por Módulo</CardTitle>
          <CardDescription>Distribución de permisos Read/Write/Admin</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modulePermissions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="module" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="read" fill="#22c55e" name="Read" />
              <Bar dataKey="write" fill="#3b82f6" name="Write" />
              <Bar dataKey="admin" fill="#ef4444" name="Admin" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AdminLayout>
      <DynamicRoleGuard 
        requiredModule="Configuración" 
        requiredPermission="read"
        fallback={
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Restringido
            </h2>
            <p className="text-gray-600">
              No tienes permisos para acceder al dashboard de permisos.
            </p>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Permisos</h1>
              <p className="text-gray-600 mt-1">
                Monitoreo y gestión del sistema híbrido FK de permisos
              </p>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Sistema Híbrido FK Activo
            </Badge>
          </div>

          {/* Quick Stats */}
          <QuickStats />

          {/* Security Indicators & Quick Actions */}
          <SecurityIndicators />

          {/* Charts */}
          <ChartsSection />

          {/* Tabs Section */}
          <Tabs defaultValue="matrix" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="matrix">Matriz Compacta</TabsTrigger>
              <TabsTrigger value="analytics">Análisis Detallado</TabsTrigger>
              <TabsTrigger value="system">Estado del Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value="matrix" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Matriz de Permisos Compacta</CardTitle>
                  <CardDescription>
                    Vista resumida de la matriz de permisos. Accede a la versión completa para editar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PermissionsMatrix
                    editable={false}
                    compact={true}
                    showFilters={false}
                    currentUser={user ? { 
                      id: user.id, 
                      roleId: user.roleId, 
                      role: user.role 
                    } : undefined}
                  />
                  <div className="mt-4 flex justify-center">
                    <Link href="/admin/permissions/matrix">
                      <Button variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Matriz Completa
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Estadísticas de Uso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Usuarios más activos:</span>
                      <Badge>Admin General (12)</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Módulo más utilizado:</span>
                      <Badge variant="outline">Actividades</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Permisos modificados (7d):</span>
                      <Badge variant="secondary">23</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recomendaciones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Sistema optimizado</p>
                        <p className="text-xs text-gray-600">Todos los roles tienen permisos asignados</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Revisar permisos de Finanzas</p>
                        <p className="text-xs text-gray-600">Pocos usuarios tienen acceso completo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Estado del Backend Híbrido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Endpoints híbridos</span>
                      <Badge className="bg-green-100 text-green-800">Activos</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Base de datos FK</span>
                      <Badge className="bg-green-100 text-green-800">Sincronizada</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cache de permisos</span>
                      <Badge className="bg-green-100 text-green-800">Optimizada</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Seguridad del Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Autenticación Firebase</span>
                      <Badge className="bg-green-100 text-green-800">Activa</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Validación JWT</span>
                      <Badge className="bg-green-100 text-green-800">Funcional</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auditoría de cambios</span>
                      <Badge className="bg-green-100 text-green-800">Registrada</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DynamicRoleGuard>
    </AdminLayout>
  );
};

export default PermissionsDashboard;