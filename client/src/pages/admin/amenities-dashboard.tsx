import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/ui/dashboard-layout";
import MetricCard from "@/components/ui/metric-card";
import GraphicCard from "@/components/ui/graphic-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  MapPin, 
  TreePine, 
  Users, 
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  RefreshCw
} from "lucide-react";

interface AmenityStats {
  id: number;
  name: string;
  icon: string;
  description: string | null;
  parksCount: number;
  totalCapacity: number;
  utilizationRate: number;
  status: 'active' | 'maintenance' | 'inactive';
}

interface DashboardData {
  totalAmenities: number;
  totalParks: number;
  totalModules: number;
  amenityWithMostModules: { name: string; count: number } | null;
  averageAmenitiesPerPark: number;
  parkWithMostAmenities: { name: string; count: number } | null;
  mostPopularAmenities: AmenityStats[];
  amenityDistribution: { name: string; value: number; color: string }[];
  utilizationByPark: { parkName: string; amenitiesCount: number }[];
  statusDistribution: { status: string; count: number; color: string }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AmenitiesDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/amenities/dashboard', refreshKey],
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <DashboardLayout
        icon={Activity}
        title="Amenidades"
        subtitle="Análisis y estadísticas de amenidades en parques"
        backgroundColor="#14b8a6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando estadísticas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        icon={Activity}
        title="Amenidades"
        subtitle="Análisis y estadísticas de amenidades en parques"
        backgroundColor="#14b8a6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Error al cargar los datos del resumen operativo</p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Usar los datos directamente del backend
  const data = dashboardData as DashboardData;

  // Función para generar insights automáticos
  const generateInsights = () => {
    if (!data) return [];
    
    const insights = [];
    
    if (data.averageAmenitiesPerPark < 2) {
      insights.push("Los parques tienen pocas amenidades en promedio. Considere expandir la oferta.");
    }
    
    if (data.mostPopularAmenities.length > 0) {
      const topAmenity = data.mostPopularAmenities[0];
      insights.push(`"${topAmenity.name}" es la amenidad más popular con ${topAmenity.parksCount} parques.`);
    }
    
    if (data.totalAmenities > data.totalParks * 2) {
      insights.push("Hay una buena variedad de amenidades disponibles en el sistema.");
    }
    
    return insights;
  };

  const insights = generateInsights();

  return (
    <DashboardLayout
      icon={Activity}
      title="Amenidades"
      subtitle="Análisis y estadísticas de amenidades en parques"
      backgroundColor="#14b8a6"
    >
      <div className="space-y-6">

        {/* KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Amenidades"
            value={
              <div className="text-2xl font-bold text-white mb-2">
                {data?.totalAmenities || 0}
              </div>
            }
            subtitle="Amenidades registradas"
            icon={Activity}
            iconColor="#14b8a6"
            backgroundColor="#003D49"
          />

          <MetricCard
            title="Promedio por Parque"
            value={
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  {data?.averageAmenitiesPerPark.toFixed(1) || '0'}
                </div>
                {data?.parkWithMostAmenities && (
                  <div className="text-xs text-gray-300">
                    Máximo: {data.parkWithMostAmenities.name} ({data.parkWithMostAmenities.count})
                  </div>
                )}
              </div>
            }
            subtitle="Amenidades por parque"
            icon={TrendingUp}
            iconColor="#14b8a6"
            backgroundColor="#003D49"
          />

          <MetricCard
            title="Total Parques"
            value={
              <div className="text-2xl font-bold text-white mb-2">
                {data?.totalParks || 0}
              </div>
            }
            subtitle="Parques en el sistema"
            icon={MapPin}
            iconColor="#14b8a6"
            backgroundColor="#003D49"
          />

          <MetricCard
            title="Total Módulos"
            value={
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  {data?.totalModules || 0}
                </div>
                {data?.amenityWithMostModules && (
                  <div className="text-xs text-gray-300">
                    Líder: {data.amenityWithMostModules.name} ({data.amenityWithMostModules.count})
                  </div>
                )}
              </div>
            }
            subtitle="Módulos registrados"
            icon={Users}
            iconColor="#14b8a6"
            backgroundColor="#003D49"
          />
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución de amenidades */}
          {/* Distribución de amenidades - Estilo igual al de Categorías de Actividades */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Distribución de Amenidades</h2>
            </div>
            <div className="h-80">
              {!data?.amenityDistribution || data.amenityDistribution.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No hay categorías disponibles</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.amenityDistribution || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={30}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ value, percent }: any) => 
                        `${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {(data?.amenityDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${value} amenidades`, 'Cantidad']}
                      labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '12px'
                      }}
                      formatter={(value: string, entry: any) => {
                        const categoryData = (data?.amenityDistribution || []).find(item => item.name === value);
                        const count = categoryData ? categoryData.value : 0;
                        return (
                          <span style={{ color: '#374151', fontSize: '12px', fontWeight: '500' }}>
                            {value.charAt(0).toUpperCase() + value.slice(1)} ({count} amenidades)
                          </span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top 5 amenidades con más módulos */}
          <GraphicCard 
            title="Top 5 Amenidades con Más Módulos"
            description="Amenidades ordenadas por cantidad total de módulos"
          >
            <div className="space-y-3">
              {(data?.mostPopularAmenities || [])
                .sort((a, b) => b.totalModules - a.totalModules)
                .slice(0, 5)
                .map((amenity: any, index: number) => (
                <div key={amenity.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <span className="font-medium">{amenity.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{amenity.totalModules}</div>
                    <div className="text-xs text-gray-500">
                      {amenity.totalModules === 1 ? 'módulo' : 'módulos'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GraphicCard>
        </div>

        {/* Utilización por parque y estado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Amenidades por parque */}
          <GraphicCard 
            title="Amenidades por Parque"
            description="Distribución de amenidades en cada parque"
            className="h-full"
          >
            <div className="w-full">
              {(data?.utilizationByPark || []).length > 0 ? (
                <div className="flex justify-center items-end gap-2 min-h-[320px] px-4 overflow-x-auto">
                  {(data?.utilizationByPark || [])
                    .sort((a, b) => b.amenitiesCount - a.amenitiesCount)
                    .map((park: any, index: number) => {
                      const maxValue = Math.max(...(data?.utilizationByPark || []).map((p: any) => p.amenitiesCount));
                      const heightPercentage = maxValue > 0 ? (park.amenitiesCount / maxValue) * 100 : 0;
                      const getAmenityColor = (count: number) => {
                        if (count >= maxValue * 0.7) return "#14b8a6"; // Teal para muchas amenidades
                        if (count >= maxValue * 0.4) return "#3b82f6"; // Azul para cantidad media
                        return "#8b5cf6"; // Púrpura para pocas amenidades
                      };
                      
                      return (
                        <div key={index} className="flex flex-col items-center relative">
                          {/* Valor del conteo arriba */}
                          <div className="mb-2 text-center">
                            <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
                              {park.amenitiesCount}
                            </div>
                            <div className="text-xs text-gray-500">
                              amenidades
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
                                backgroundColor: getAmenityColor(park.amenitiesCount),
                                borderColor: getAmenityColor(park.amenitiesCount),
                              }}
                            ></div>
                          </div>

                          {/* Nombre del parque a la izquierda de la columna - VERTICAL */}
                          <div className="absolute bottom-32 -left-28 transform -rotate-90 origin-bottom-right w-32">
                            <div className="text-xs text-gray-700 whitespace-nowrap">
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
                    <Activity className="h-12 w-12 text-gray-300" />
                    <p className="text-lg font-medium">
                      No hay datos de amenidades disponibles
                    </p>
                    <p className="text-sm">
                      Los datos de amenidades por parque aparecerán aquí una vez que se asignen amenidades a los parques
                    </p>
                  </div>
                </div>
              )}
            </div>
            {(data?.utilizationByPark || []).length > 0 && (
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-500">
                  Mostrando todos los {(data?.utilizationByPark || []).length} parques
                  registrados en el sistema
                </p>
              </div>
            )}
          </GraphicCard>
        </div>
      </div>
    </DashboardLayout>
  );
};