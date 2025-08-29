import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/ui/dashboard-layout';
import MetricCard from '@/components/ui/metric-card';
import GraphicCard from '@/components/ui/graphic-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TreePine, 
  Leaf, 
  Scissors, 
  TrendingUp, 
  MapPin, 
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  RefreshCw
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TreeData {
  id: number;
  code: string;
  speciesName: string;
  parkName: string;
  plantingDate: string;
  height: number;
  healthStatus: string;
  lastMaintenanceDate: string;
  createdAt: string;
}

interface MaintenanceData {
  id: number;
  maintenanceType: string;
  urgency: string;
  status: string;
  date: string;
  estimatedCost: number;
}

interface SpeciesData {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  origin: string;
  conservationStatus: string;
}

const TreesDashboard: React.FC = () => {
  // Consultas para obtener datos
  const { data: treesResponse, isLoading: treesLoading, refetch: refetchTrees } = useQuery({
    queryKey: ['/api/trees'],
    suspense: false,
    retry: 1
  });

  const { data: maintenancesResponse, isLoading: maintenancesLoading, refetch: refetchMaintenances } = useQuery({
    queryKey: ['/api/trees/maintenances'],
    suspense: false,
    retry: 1
  });

  const { data: speciesResponse, isLoading: speciesLoading, refetch: refetchSpecies } = useQuery({
    queryKey: ['/api/tree-species'],
    suspense: false,
    retry: 1
  });

  // Extraer datos con manejo defensivo para diferentes formatos de respuesta
  const trees = Array.isArray(treesResponse) ? treesResponse : (treesResponse?.data || []);
  const maintenances = Array.isArray(maintenancesResponse) ? maintenancesResponse : (maintenancesResponse?.data || []);
  const species = Array.isArray(speciesResponse) ? speciesResponse : (speciesResponse?.data || []);

  const handleRefresh = async () => {
    await Promise.all([refetchTrees(), refetchMaintenances(), refetchSpecies()]);
  };

  if (treesLoading || maintenancesLoading || speciesLoading) {
    return (
      <DashboardLayout
        icon={TreePine}
        title="Arbolado"
        subtitle="Análisis y estadísticas del arbolado urbano"
        backgroundColor="#22c55e"
      >
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Cargando datos del arbolado...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Cálculos de estadísticas con validación defensiva
  const totalTrees = trees?.length || 0;
  const totalSpecies = species?.length || 0;
  const totalMaintenances = maintenances?.length || 0;

  // Estadísticas de salud de árboles
  const healthStats = trees?.reduce((acc, tree) => {
    const status = tree?.healthStatus || 'Desconocido';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Estadísticas de mantenimiento por urgencia
  const urgencyStats = maintenances?.reduce((acc, maintenance) => {
    const urgency = maintenance?.urgency || 'media';
    acc[urgency] = (acc[urgency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Estadísticas de mantenimiento por tipo
  const maintenanceTypeStats = maintenances?.reduce((acc, maintenance) => {
    const type = maintenance?.maintenanceType || 'General';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Árboles por parque
  const treesByPark = trees?.reduce((acc, tree) => {
    const parkName = tree?.parkName || 'Sin parque';
    acc[parkName] = (acc[parkName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Top 3 parques con más árboles
  const topParks = Object.entries(treesByPark)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  // Especies más comunes
  const speciesCount = trees?.reduce((acc, tree) => {
    const speciesName = tree?.speciesName || 'Especie desconocida';
    acc[speciesName] = (acc[speciesName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const topSpecies = Object.entries(speciesCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Datos para el gráfico de árboles por parque (formato similar al de evaluaciones)
  const treesByParkData = Object.entries(treesByPark)
    .filter(([parkName]) => parkName !== 'Sin parque')
    .map(([parkName, count], index) => ({
      parkId: index + 1,
      parkName,
      treeCount: count
    }));

  // Datos para gráficas
  const healthChartData = Object.entries(healthStats).map(([status, count]) => ({
    name: status,
    value: count,
    color: status === 'Excelente' ? '#22c55e' : 
           status === 'Bueno' ? '#84cc16' : 
           status === 'Regular' ? '#eab308' : 
           status === 'Malo' ? '#f97316' : '#ef4444'
  }));

  const speciesChartData = topSpecies.map(([species, count]) => ({
    species: species.length > 15 ? species.substring(0, 15) + '...' : species,
    count
  }));

  // Datos para gráfica de tipos de mantenimiento
  const maintenanceTypeChartData = Object.entries(maintenanceTypeStats).map(([type, count]) => ({
    type: type,
    count: count,
    color: type === 'Poda' ? '#22c55e' : 
           type === 'Riego' ? '#3b82f6' : 
           type === 'Fertilización' ? '#f59e0b' : 
           type === 'Tratamiento fitosanitario' ? '#ef4444' : 
           type === 'Replantación' ? '#8b5cf6' : '#6b7280'
  }));

  // Cálculo del porcentaje de árboles saludables
  const healthyTrees = (healthStats['Excelente'] || 0) + (healthStats['Bueno'] || 0);
  const healthPercentage = totalTrees > 0 ? Math.round((healthyTrees / totalTrees) * 100) : 0;

  // Mantenimientos pendientes con validación defensiva
  const pendingMaintenances = maintenances?.filter(m => m?.status === 'pending')?.length || 0;
  const urgentMaintenances = maintenances?.filter(m => m?.urgency === 'alta')?.length || 0;

  // Cálculo del progreso de mantenimientos
  // Árboles únicos que han recibido mantenimiento (basado en lastMaintenanceDate)
  const treesWithMaintenance = trees?.filter(tree => tree?.lastMaintenanceDate && tree.lastMaintenanceDate !== '')?.length || 0;
  const maintenanceProgress = totalTrees > 0 ? Math.round((treesWithMaintenance / totalTrees) * 100) : 0;

  return (
    <DashboardLayout
      icon={TreePine}
      title="Arbolado"
      subtitle="Análisis y estadísticas del arbolado urbano"
      backgroundColor="#14b8a6"
    >
      <div className="space-y-6">

        {/* Métricas principales */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Global"
            value={
              <div className="text-2xl font-bold text-white mb-2">
                {totalTrees}
              </div>
            }
            subtitle="Inventario activo"
            icon={TreePine}
            iconColor="#14b8a6"
            backgroundColor="#003D49"
          />

          <MetricCard
            title="Especies Registradas"
            value={
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  {totalSpecies}
                </div>
                {topSpecies.length > 0 && (
                  <div className="text-xs text-green-300">
                    Más común: {topSpecies[0][0]} ({topSpecies[0][1]} ejemplares)
                  </div>
                )}
              </div>
            }
            subtitle="Biodiversidad"
            icon={Leaf}
            iconColor="#14b8a6"
            backgroundColor="#003D49"
          />

          <MetricCard
            title="Salud General"
            value={
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  {healthPercentage}%
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${healthPercentage}%` }}
                  ></div>
                </div>
              </div>
            }
            subtitle="Árboles en buen estado"
            icon={CheckCircle}
            iconColor="#14b8a6"
            backgroundColor="#003D49"
          />

          <MetricCard
            title="Mantenimientos"
            value={
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  {totalMaintenances}
                </div>
                <div className="text-xs text-green-300">
                  {maintenanceProgress}% árboles atendidos
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${maintenanceProgress}%` }}
                  ></div>
                </div>
              </div>
            }
            subtitle="Total global"
            icon={Scissors}
            iconColor="#14b8a6"
            backgroundColor="#003D49"
          />
        </div>

        {/* Alertas importantes */}
        {urgentMaintenances > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>Atención:</strong> Hay {urgentMaintenances} mantenimientos urgentes que requieren atención inmediata.
            </AlertDescription>
          </Alert>
        )}

        {/* Gráficas y estadísticas */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Estado de salud de árboles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Estado de Salud de Árboles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={healthChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {healthChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Especies más comunes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Especies Más Comunes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={speciesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="species" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tipos de Mantenimiento */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Tipos de Mantenimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={maintenanceTypeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="type" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} mantenimientos`, 'Cantidad']} />
                  <Bar dataKey="count" fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Árboles por Parque */}
        <div className="grid gap-6 md:grid-cols-1">
          <GraphicCard
            title="🌳 Árboles Registrados por Parque"
            description="Cantidad de árboles inventariados en cada parque municipal"
            className="h-full"
          >
            <div className="w-full">
              {treesByParkData?.length > 0 ? (
                <div className="flex justify-center items-end gap-2 min-h-[320px] px-4 overflow-x-auto">
                  {treesByParkData
                    .sort((a, b) => b.treeCount - a.treeCount)
                    .map((park) => {
                      const maxTrees = Math.max(...treesByParkData.map(p => p.treeCount));
                      const heightPercentage = (park.treeCount / maxTrees) * 100;
                      const getTreeColor = (count: number) => {
                        if (count >= maxTrees * 0.8) return "#22c55e"; // Verde intenso para mayor cantidad
                        if (count >= maxTrees * 0.5) return "#10b981"; // Verde medio
                        if (count >= maxTrees * 0.3) return "#14b8a6"; // Verde teal
                        return "#6b7280"; // Gris para menor cantidad
                      };
                      return (
                        <div key={park.parkId} className="flex flex-col items-center relative">
                          {/* Valor de árboles arriba */}
                          <div className="mb-2 text-center">
                            <div className="text-sm font-poppins font-thin text-gray-700 flex items-center gap-1">
                              {park.treeCount}
                            </div>
                            <div className="text-xs font-poppins font-thin text-gray-500">
                              árboles
                            </div>
                          </div>

                          {/* Columna vertical */}
                          <div className="relative h-64 w-4 flex flex-col justify-end">
                            {/* Fondo de la columna */}
                            <div className="absolute bottom-0 w-full h-full bg-gray-200 rounded-t-3xl border border-gray-300"></div>
                            
                            {/* Relleno de la columna según cantidad */}
                            <div
                              className="absolute bottom-0 w-full rounded-t-3xl transition-all duration-700 border border-opacity-20"
                              style={{
                                height: `${Math.max(heightPercentage, 5)}%`,
                                backgroundColor: getTreeColor(park.treeCount),
                                borderColor: getTreeColor(park.treeCount),
                              }}
                            ></div>
                          </div>

                          {/* Nombre del parque a la izquierda de la columna - VERTICAL */}
                          <div className="absolute bottom-32 -left-28 transform -rotate-90 origin-bottom-right w-32">
                            <div className="text-xs font-poppins font-thin text-gray-700 whitespace-nowrap">
                              {park.parkName}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center space-y-2">
                    <TreePine className="h-12 w-12 text-gray-300" />
                    <p className="text-lg font-medium">
                      No hay datos de árboles por parque disponibles
                    </p>
                    <p className="text-sm">
                      Los datos aparecerán aquí una vez que se registren árboles en los parques
                    </p>
                  </div>
                </div>
              )}
            </div>
            {treesByParkData?.length > 0 && (
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-500 font-poppins font-thin">
                  Mostrando {treesByParkData.length} parques con árboles registrados
                </p>
              </div>
            )}
          </GraphicCard>
        </div>

        {/* Información adicional */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top parques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Parques con Más Árboles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topParks.map(([park, count], index) => (
                <div key={park} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <span className="font-medium">{park}</span>
                  </div>
                  <Badge variant="outline">{count} árboles</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Resumen de mantenimientos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Resumen de Mantenimientos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalMaintenances}</div>
                  <div className="text-sm text-gray-600">Total registrados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{pendingMaintenances}</div>
                  <div className="text-sm text-gray-600">Pendientes</div>
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(urgencyStats).map(([urgency, count]) => (
                  <div key={urgency} className="flex justify-between items-center">
                    <span className="capitalize">{urgency}</span>
                    <Badge 
                      variant={urgency === 'alta' ? 'destructive' : urgency === 'media' ? 'default' : 'secondary'}
                    >
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TreesDashboard;