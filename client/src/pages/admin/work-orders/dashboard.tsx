import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Users,
  DollarSign,
  Calendar
} from 'lucide-react';

const COLORS = {
  pendiente: '#f59e0b',
  asignada: '#3b82f6',
  en_proceso: '#8b5cf6',
  completada: '#10b981',
  cancelada: '#ef4444'
};

const TYPE_COLORS = {
  correctivo: '#ef4444',
  preventivo: '#3b82f6',
  mejora: '#10b981',
  emergencia: '#f59e0b'
};

const PRIORITY_COLORS = {
  baja: '#10b981',
  media: '#f59e0b',
  alta: '#ef4444',
  critica: '#dc2626'
};

interface DashboardStats {
  summary: {
    total: number;
    pendientes: number;
    en_proceso: number;
    completadas: number;
    canceladas: number;
  };
  byStatus: Array<{ estado: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  costs: {
    totalEstimado: number;
    totalReal: number;
    promedioEstimado: number;
    promedioReal: number;
  };
  topEmployees: Array<{
    employeeId: number;
    employeeName: string;
    completedCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    total: number;
    completadas: number;
  }>;
  avgResolutionDays: number;
}

export default function WorkOrdersDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/work-orders/stats/dashboard']
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      pendiente: 'Pendiente',
      asignada: 'Asignada',
      en_proceso: 'En Proceso',
      completada: 'Completada',
      cancelada: 'Cancelada'
    };
    return translations[status] || status;
  };

  const translateType = (type: string) => {
    const translations: Record<string, string> = {
      correctivo: 'Correctivo',
      preventivo: 'Preventivo',
      mejora: 'Mejora',
      emergencia: 'Emergencia'
    };
    return translations[type] || type;
  };

  const translatePriority = (priority: string) => {
    const translations: Record<string, string> = {
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta',
      critica: 'Crítica'
    };
    return translations[priority] || priority;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Órdenes de Trabajo</h1>
            <p className="text-gray-600 dark:text-gray-400">Analíticas y métricas del sistema</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </AdminLayout>
    );
  }

  const statusData = stats.byStatus.map(item => ({
    name: translateStatus(item.estado),
    value: item.count,
    color: COLORS[item.estado as keyof typeof COLORS]
  }));

  const typeData = stats.byType.map(item => ({
    name: translateType(item.type),
    value: item.count
  }));

  const priorityData = stats.byPriority.map(item => ({
    name: translatePriority(item.priority),
    value: item.count
  }));

  const monthlyData = stats.monthlyTrends.map(item => ({
    month: item.month,
    Total: item.total,
    Completadas: item.completadas
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard de Órdenes de Trabajo</h1>
          <p className="text-gray-600 dark:text-gray-400">Analíticas y métricas del sistema de mantenimiento</p>
        </div>

        {/* Tarjetas de métricas clave */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Órdenes</CardTitle>
              <Wrench className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.summary.total}</div>
              <p className="text-xs text-gray-500 mt-1">En el sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Completadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.summary.completadas}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.summary.total > 0 
                  ? `${((stats.summary.completadas / stats.summary.total) * 100).toFixed(1)}% del total`
                  : 'Sin datos'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">En Proceso</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.summary.en_proceso}</div>
              <p className="text-xs text-gray-500 mt-1">
                + {stats.summary.pendientes} pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiempo Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.avgResolutionDays > 0 ? stats.avgResolutionDays.toFixed(1) : '0'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Días de resolución</p>
            </CardContent>
          </Card>
        </div>

        {/* Tarjetas de costos */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Costo Total Estimado</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.costs.totalEstimado)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Promedio: {formatCurrency(stats.costs.promedioEstimado)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Costo Total Real</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.costs.totalReal)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Promedio: {formatCurrency(stats.costs.promedioReal)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficas */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Distribución por estado */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
              <CardDescription>Órdenes agrupadas por estado actual</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribución por tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo</CardTitle>
              <CardDescription>Órdenes clasificadas por tipo de mantenimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6">
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TYPE_COLORS[stats.byType[index].type as keyof typeof TYPE_COLORS]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribución por prioridad */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Prioridad</CardTitle>
              <CardDescription>Órdenes clasificadas por nivel de urgencia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b">
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[stats.byPriority[index].priority as keyof typeof PRIORITY_COLORS]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tendencias mensuales */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencias Mensuales</CardTitle>
              <CardDescription>Últimos 6 meses de actividad</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Completadas" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top empleados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Empleados - Órdenes Completadas
            </CardTitle>
            <CardDescription>Empleados más productivos del equipo</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topEmployees.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay datos de empleados disponibles</p>
            ) : (
              <div className="space-y-4">
                {stats.topEmployees.map((employee, index) => (
                  <div key={employee.employeeId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                        index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{employee.employeeName}</p>
                        <p className="text-sm text-gray-500">ID: {employee.employeeId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{employee.completedCount}</p>
                      <p className="text-xs text-gray-500">completadas</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
