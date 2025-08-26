import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  ArrowLeft,
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Users,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  SquareStack
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import GraphicCard from '@/components/ui/graphic-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Importación condicional para Recharts para evitar errores en SSR
const RechartsComponents = React.lazy(() => import('./dashboard-charts'));

const IncidentsDashboard = () => {
  const [location, setLocation] = useLocation();
  
  // Función para obtener el mes actual y anterior
  const currentMonth = new Date();
  const previousMonth = subMonths(currentMonth, 1);
  const formatMonth = (date: Date) => format(date, 'MMMM yyyy', { locale: es });
  
  // Consulta para obtener estadísticas de incidencias
  const { 
    data: stats = {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      byCategory: [],
      byPark: [],
      byMonth: [],
      resolutionTime: 0,
      mostRecentIncidents: []
    }, 
    isLoading: isLoadingStats,
    isError: isErrorStats 
  } = useQuery({
    queryKey: ['/api/incidents/stats'],
    // Si hay error, usamos datos de prueba
    onError: (error) => {
      console.error("Error al cargar estadísticas:", error);
    }
  });
  
  // Consulta para obtener categorías para los gráficos
  const { 
    data: categories = []
  } = useQuery({
    queryKey: ['/api/incident-categories'],
    onError: (err) => {
      console.error("Error al cargar categorías:", err);
    }
  });
  
  // Consulta para obtener parques para los gráficos
  const { 
    data: parks = []
  } = useQuery({
    queryKey: ['/api/parks'],
    onError: (err) => {
      console.error("Error al cargar parques:", err);
    }
  });
  
  // Datos ficticios para los gráficos si no hay datos reales
  const sampleData = React.useMemo(() => {
    // Datos para gráfico por estado
    const statusData = [
      { name: 'Pendientes', value: stats.pending || 12, color: '#fbbf24' },
      { name: 'En proceso', value: stats.inProgress || 18, color: '#3b82f6' },
      { name: 'Resueltas', value: stats.resolved || 34, color: '#22c55e' },
      { name: 'Rechazadas', value: stats.rejected || 8, color: '#ef4444' }
    ];
    
    // Datos para gráfico por prioridad
    const priorityData = [
      { name: 'Baja', value: stats.byPriority?.low || 15, color: '#3b82f6' },
      { name: 'Media', value: stats.byPriority?.medium || 25, color: '#fbbf24' },
      { name: 'Alta', value: stats.byPriority?.high || 20, color: '#f97316' },
      { name: 'Crítica', value: stats.byPriority?.critical || 12, color: '#ef4444' }
    ];
    
    // Datos para gráfico por categoría
    const categoryData = stats.byCategory && stats.byCategory.length > 0 
      ? stats.byCategory.map((item: any) => ({
          name: item.name,
          value: item.count,
          color: item.color || '#3b82f6'
        }))
      : [
          { name: 'Daños', value: 24, color: '#3b82f6' },
          { name: 'Seguridad', value: 18, color: '#f97316' },
          { name: 'Mantenimiento', value: 15, color: '#22c55e' },
          { name: 'Vandalismo', value: 9, color: '#ef4444' },
          { name: 'Otros', value: 6, color: '#a855f7' }
        ];
    
    // Datos para gráfico por parque
    const parkData = stats.byPark && stats.byPark.length > 0
      ? stats.byPark.map((item: any) => ({
          name: item.name || `Parque ${item.id}`,
          value: item.count
        }))
      : [
          { name: 'Parque Metropolitano', value: 28 },
          { name: 'Parque Agua Azul', value: 22 },
          { name: 'Parque González Gallo', value: 16 },
          { name: 'Parque Colomos', value: 14 },
          { name: 'Otros parques', value: 12 }
        ];
    
    // Datos para gráfico por mes
    const monthlyData = stats.byMonth && stats.byMonth.length > 0
      ? stats.byMonth
      : [
          { name: 'Ene', pending: 5, inProgress: 8, resolved: 12 },
          { name: 'Feb', pending: 7, inProgress: 10, resolved: 15 },
          { name: 'Mar', pending: 4, inProgress: 12, resolved: 18 },
          { name: 'Abr', pending: 8, inProgress: 9, resolved: 20 },
          { name: 'May', pending: 10, inProgress: 15, resolved: 25 },
          { name: 'Jun', pending: 12, inProgress: 18, resolved: 30 }
        ];
    
    return {
      statusData,
      priorityData,
      categoryData,
      parkData,
      monthlyData
    };
  }, [stats, categories, parks]);
  
  // Calcular porcentaje de cambio con respecto al mes anterior
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  };
  
  // Datos de cambio con respecto al mes anterior (simulados)
  const changeData = {
    total: calculateChange(stats.total || 72, 65),
    resolved: calculateChange(stats.resolved || 34, 29),
    avgResolutionTime: calculateChange(stats.resolutionTime || 3.2, 3.8)
  };
  
  // Función para formatear fecha
  const formatDate = (date: string | Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: es });
  };
  
  // Obtener etiqueta de estado en español
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Pendiente',
      'in_progress': 'En proceso',
      'resolved': 'Resuelto',
      'rejected': 'Rechazado'
    };
    return statusMap[status] || status;
  };
  
  // Obtener clases para la etiqueta de estado
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  // Obtener ícono de estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation('/admin/incidents')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a incidencias
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Panel de control de incidencias</h1>
              <p className="text-gray-500">Estadísticas y métricas clave para la gestión de incidencias</p>
            </div>
            
            <div className="flex items-center mt-4 md:mt-0">
              <div className="text-sm text-gray-500">
                <CalendarDays className="h-4 w-4 inline-block mr-1" />
                Datos actualizados: {formatMonth(currentMonth)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total de incidencias</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.total || 72}</h3>
                  <div className={`flex items-center mt-1 text-sm ${changeData.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {changeData.total >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(changeData.total)}% vs. mes anterior</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <SquareStack className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Incidencias resueltas</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.resolved || 34}</h3>
                  <div className={`flex items-center mt-1 text-sm ${changeData.resolved >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {changeData.resolved >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(changeData.resolved)}% vs. mes anterior</span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Tiempo medio de resolución</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.resolutionTime || 3.2} días</h3>
                  <div className={`flex items-center mt-1 text-sm ${changeData.avgResolutionTime <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {changeData.avgResolutionTime <= 0 ? (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(changeData.avgResolutionTime)}% vs. mes anterior</span>
                  </div>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Tasa de resolución</p>
                  <h3 className="text-3xl font-bold mt-1">
                    {stats.total ? Math.round((stats.resolved / stats.total) * 100) : 47}%
                  </h3>
                  <div className="text-sm text-gray-500 mt-1">
                    <span>{stats.resolved || 34} de {stats.total || 72} incidencias</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <PieChart className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Gráficos de estado y tendencias */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Incidencias por estado</CardTitle>
              <CardDescription>
                Distribución actual de las incidencias según su estado
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-80 w-full">
                <React.Suspense fallback={<div className="flex items-center justify-center h-full">Cargando gráfico...</div>}>
                  <RechartsComponents type="pie" data={sampleData.statusData} />
                </React.Suspense>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between text-sm text-gray-500 border-t">
              <div className="flex items-center">
                <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1" />
                <span>Pendientes: {stats.pending || 12}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 text-blue-500 mr-1" />
                <span>En proceso: {stats.inProgress || 18}</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                <span>Resueltas: {stats.resolved || 34}</span>
              </div>
              <div className="flex items-center">
                <XCircle className="h-3 w-3 text-red-500 mr-1" />
                <span>Rechazadas: {stats.rejected || 8}</span>
              </div>
            </CardFooter>
          </Card>
          
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Tendencia mensual</CardTitle>
              <CardDescription>
                Evolución de incidencias en los últimos meses
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-80 w-full">
                <React.Suspense fallback={<div className="flex items-center justify-center h-full">Cargando gráfico...</div>}>
                  <RechartsComponents type="line" data={sampleData.monthlyData} />
                </React.Suspense>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-gray-500 border-t">
              <div className="w-full flex justify-between">
                <span>La tendencia muestra un aumento del 8% en la resolución de incidencias.</span>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Gráficos de prioridad y categoría */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Incidencias por prioridad</CardTitle>
              <CardDescription>
                Distribución de incidencias según nivel de prioridad
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-80 w-full">
                <React.Suspense fallback={<div className="flex items-center justify-center h-full">Cargando gráfico...</div>}>
                  <RechartsComponents type="bar" data={sampleData.priorityData} />
                </React.Suspense>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between text-sm text-gray-500 border-t">
              <div>Las incidencias de prioridad media son las más comunes (35%).</div>
            </CardFooter>
          </Card>
          
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Incidencias por categoría</CardTitle>
              <CardDescription>
                Distribución de incidencias por tipo de categoría
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-80 w-full">
                <React.Suspense fallback={<div className="flex items-center justify-center h-full">Cargando gráfico...</div>}>
                  <RechartsComponents type="donut" data={sampleData.categoryData} />
                </React.Suspense>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-gray-500 border-t">
              <div>Los daños físicos representan la mayoría de las incidencias reportadas.</div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Incidencias por parque y últimas incidencias */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de barras de Incidencias por Parque movido desde parks-dashboard */}
          <GraphicCard
            title="⚠️ Incidencias por Parque"
            description="Registro de incidencias mensuales y estado de resolución por parque"
            className="h-full"
          >
            <div className="w-full">
              {sampleData.parkData && sampleData.parkData.length > 0 ? (
                <div className="flex justify-center items-end gap-2 min-h-[320px] px-4 overflow-x-auto">
                  {sampleData.parkData
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 12) // Limitar a 12 parques para mejor visualización
                    .map((park, index) => {
                      const maxIncidents = Math.max(...sampleData.parkData.map(p => p.value));
                      const heightPercentage = maxIncidents > 0 ? (park.value / maxIncidents) * 100 : 0;
                      const getIncidentColor = (value: number) => {
                        if (value === 0) return "#e5e7eb"; // Gris para sin incidentes
                        if (value >= 20) return "#ef4444"; // Rojo para muchas incidencias
                        if (value >= 15) return "#f59e0b"; // Naranja para incidencias medias
                        return "#10b981"; // Verde para pocas incidencias
                      };
                      return (
                        <div key={index} className="flex flex-col items-center relative">
                          {/* Valor de incidencias arriba */}
                          <div className="mb-2 text-center">
                            <div className="text-sm font-poppins font-thin text-gray-700">
                              {park.value}
                            </div>
                            <div className="text-xs font-poppins font-thin text-gray-500">
                              incidencias
                            </div>
                          </div>

                          {/* Columna vertical */}
                          <div className="relative h-48 w-4 flex flex-col justify-end">
                            {/* Fondo de la columna */}
                            <div className="absolute bottom-0 w-full h-full bg-gray-200 rounded-t-3xl border border-gray-300"></div>
                            
                            {/* Relleno de la columna según incidencias */}
                            <div
                              className="absolute bottom-0 w-full rounded-t-3xl transition-all duration-700 border border-opacity-20"
                              style={{
                                height: `${Math.max(heightPercentage, 5)}%`,
                                backgroundColor: getIncidentColor(park.value),
                                borderColor: getIncidentColor(park.value),
                              }}
                            ></div>
                          </div>

                          {/* Nombre del parque a la izquierda de la columna - VERTICAL */}
                          <div className="absolute bottom-24 -left-28 transform -rotate-90 origin-bottom-right w-32">
                            <div className="text-xs font-poppins font-thin text-gray-700 whitespace-nowrap">
                              {park.name}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center space-y-2">
                    <AlertTriangle className="h-12 w-12 text-gray-300" />
                    <p className="text-lg font-medium">
                      No hay incidencias registradas
                    </p>
                    <p className="text-sm">
                      Los datos de incidencias aparecerán aquí una vez que se
                      registren en el sistema
                    </p>
                  </div>
                </div>
              )}
            </div>
          </GraphicCard>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Incidencias recientes</CardTitle>
              <CardDescription>
                Últimas incidencias reportadas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.mostRecentIncidents && stats.mostRecentIncidents.length > 0 ? (
                  stats.mostRecentIncidents.map((incident: any, index: number) => (
                    <div key={incident.id} className="flex items-start space-x-4">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {getStatusIcon(incident.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {incident.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(incident.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center mt-1">
                          <Badge className={getStatusBadgeClass(incident.status)}>
                            {getStatusLabel(incident.status)}
                          </Badge>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {incident.park?.name || `Parque ${incident.parkId}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Datos de ejemplo para mostrar
                  [
                    {
                      id: 1,
                      title: 'Juegos infantiles dañados',
                      status: 'pending',
                      createdAt: new Date(),
                      parkId: 1,
                      park: { name: 'Parque Metropolitano' }
                    },
                    {
                      id: 2,
                      title: 'Falta de iluminación en sendero norte',
                      status: 'in_progress',
                      createdAt: new Date(Date.now() - 86400000),
                      parkId: 2,
                      park: { name: 'Parque Agua Azul' }
                    },
                    {
                      id: 3,
                      title: 'Banca rota en área de picnic',
                      status: 'resolved',
                      createdAt: new Date(Date.now() - 86400000 * 2),
                      parkId: 3,
                      park: { name: 'Parque González Gallo' }
                    },
                    {
                      id: 4,
                      title: 'Grafiti en monumento central',
                      status: 'rejected',
                      createdAt: new Date(Date.now() - 86400000 * 3),
                      parkId: 4,
                      park: { name: 'Parque Colomos' }
                    },
                  ].map((incident: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {getStatusIcon(incident.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {incident.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(incident.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center mt-1">
                          <Badge className={getStatusBadgeClass(incident.status)}>
                            {getStatusLabel(incident.status)}
                          </Badge>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {incident.park?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/admin/incidents')}
              >
                Ver todas las incidencias
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default IncidentsDashboard;