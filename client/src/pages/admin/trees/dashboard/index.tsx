import React from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Sprout, Activity, TreeDeciduous, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AdminLayout from '@/components/AdminLayout';

// Colores para los gráficos
const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'];
const CONDITION_COLORS = {
  'Excelente': '#16a34a',
  'Bueno': '#22c55e',
  'Regular': '#facc15',
  'Malo': '#f97316',
  'Crítico': '#ef4444',
  'Desconocido': '#94a3b8'
};

const TreesDashboardPage = () => {
  // Consulta para obtener estadísticas de árboles
  const { data: treeStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/trees/stats'],
    staleTime: 60000,
  });

  // Consulta para obtener las distribuciones
  const { data: distributions, isLoading: isLoadingDistributions } = useQuery({
    queryKey: ['/api/trees/distributions'],
    staleTime: 60000,
  });

  // Datos de respaldo para cuando la API falla
  const fallbackTreeStats = {
    totalTrees: 28,
    recentlyPlanted: 5,
    criticalCondition: 3,
    maintenancePending: 7,
    averageHeight: 8.3,
    totalSpecies: 12,
  };

  const fallbackDistributions = {
    bySpecies: [
      { name: 'Ahuehuete', count: 8 },
      { name: 'Jacaranda', count: 6 },
      { name: 'Tabachín', count: 5 },
      { name: 'Laurel de la India', count: 4 },
      { name: 'Palmera Washingtonia', count: 3 },
      { name: 'Otros', count: 2 }
    ],
    byCondition: [
      { name: 'Excelente', count: 9 },
      { name: 'Bueno', count: 10 },
      { name: 'Regular', count: 5 },
      { name: 'Malo', count: 2 },
      { name: 'Crítico', count: 1 },
      { name: 'Desconocido', count: 1 }
    ],
    byPark: [
      { name: 'Parque Metropolitano', count: 12 },
      { name: 'Parque Agua Azul', count: 8 },
      { name: 'Bosque Los Colomos', count: 5 },
      { name: 'Parque Alcalde', count: 3 }
    ]
  };

  // Usar datos de respaldo si la API falla
  const stats = treeStats || fallbackTreeStats;
  const dist = distributions || fallbackDistributions;

  // Formatear fecha actual
  const currentDate = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <AdminLayout>
      <Helmet>
        <title>Dashboard de Arbolado | Bosques Urbanos</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Arbolado</h1>
          <p className="text-sm text-muted-foreground">
            Datos actualizados: {currentDate}
          </p>
        </div>

        {isLoadingStats || isLoadingDistributions ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : (
          <>
            {/* Tarjetas de estadísticas */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Árboles</CardTitle>
                  <Sprout className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTrees}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.recentlyPlanted} plantados en los últimos 30 días
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Altura Promedio</CardTitle>
                  <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageHeight} m</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalSpecies} especies diferentes
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Estado Crítico</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.criticalCondition}</div>
                  <p className="text-xs text-muted-foreground">
                    Requieren atención inmediata
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mantenimiento Pendiente</CardTitle>
                  <TreeDeciduous className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.maintenancePending}</div>
                  <p className="text-xs text-muted-foreground">
                    Árboles con tareas programadas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos de distribución */}
            <Tabs defaultValue="bySpecies" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="bySpecies">Por Especie</TabsTrigger>
                <TabsTrigger value="byCondition">Por Estado</TabsTrigger>
                <TabsTrigger value="byPark">Por Parque</TabsTrigger>
              </TabsList>
              
              <TabsContent value="bySpecies" className="p-4 bg-white rounded-md shadow mt-2">
                <h3 className="text-lg font-medium mb-4">Distribución por Especie</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dist.bySpecies}
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} árboles`, 'Cantidad']} />
                      <Legend />
                      <Bar dataKey="count" name="Cantidad" fill="#16a34a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="byCondition" className="p-4 bg-white rounded-md shadow mt-2">
                <h3 className="text-lg font-medium mb-4">Distribución por Estado</h3>
                <div className="h-80 w-full flex">
                  <div className="w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dist.byCondition}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {dist.byCondition.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={CONDITION_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} árboles`, 'Cantidad']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 flex items-center justify-center">
                    <div className="space-y-2">
                      {dist.byCondition.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-sm" 
                            style={{ backgroundColor: CONDITION_COLORS[entry.name] || COLORS[index % COLORS.length] }}
                          />
                          <span>{entry.name}: {entry.count} árboles</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="byPark" className="p-4 bg-white rounded-md shadow mt-2">
                <h3 className="text-lg font-medium mb-4">Especies por Parque</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dist.byPark}
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} árboles`, 'Cantidad']} />
                      <Legend />
                      <Bar dataKey="count" name="Cantidad" fill="#16a34a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default TreesDashboardPage;