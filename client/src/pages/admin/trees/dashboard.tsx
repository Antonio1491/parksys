import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
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
      <AdminLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Cargando datos del arbolado...</p>
          </div>
        </div>
      </AdminLayout>
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

  // Cálculo del porcentaje de árboles saludables
  const healthyTrees = (healthStats['Excelente'] || 0) + (healthStats['Bueno'] || 0);
  const healthPercentage = totalTrees > 0 ? Math.round((healthyTrees / totalTrees) * 100) : 0;

  // Mantenimientos pendientes con validación defensiva
  const pendingMaintenances = maintenances?.filter(m => m?.status === 'pending')?.length || 0;
  const urgentMaintenances = maintenances?.filter(m => m?.urgency === 'alta')?.length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con fondo coloreado */}
        <div 
          className="p-4 flex items-center justify-between"
          style={{ backgroundColor: "#14b8a6" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <TreePine className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white font-poppins">Dashboard de Arbolado</h1>
            </div>
            <p className="text-white mt-2">Análisis y estadísticas del arbolado urbano</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="bg-white text-gray-900 hover:bg-gray-100">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Métricas principales */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total de Árboles</CardTitle>
              <TreePine className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{totalTrees}</div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600 font-medium">Inventario activo</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Especies Registradas</CardTitle>
              <Leaf className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{totalSpecies}</div>
              <div className="flex items-center mt-2">
                <Activity className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-sm text-blue-600 font-medium">Biodiversidad</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">Salud General</CardTitle>
              <CheckCircle className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900">{healthPercentage}%</div>
              <div className="flex items-center mt-2">
                <Progress value={healthPercentage} className="w-full mt-2" />
              </div>
              <p className="text-xs text-amber-700 mt-1">Árboles en buen estado</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Mantenimientos</CardTitle>
              <Scissors className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">{pendingMaintenances}</div>
              <div className="flex items-center mt-2">
                <Clock className="h-4 w-4 text-red-600 mr-1" />
                <span className="text-sm text-red-600 font-medium">Pendientes</span>
              </div>
              {urgentMaintenances > 0 && (
                <Badge variant="destructive" className="mt-2">
                  {urgentMaintenances} urgentes
                </Badge>
              )}
            </CardContent>
          </Card>
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
    </AdminLayout>
  );
};

export default TreesDashboard;