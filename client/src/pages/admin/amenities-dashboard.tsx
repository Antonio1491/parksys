import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/ui/dashboard-layout";
import MetricCard from "@/components/ui/metric-card";
import GraphicCard from "@/components/ui/graphic-card";
import VerticalBarChart from "@/components/ui/vertical-bar-chart";
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
  RefreshCw,
  Tag
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

        {/* KPIs principales - 4 columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

          <MetricCard
            title="Categorías"
            value={
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  {data?.totalCategories || 0}
                </div>
                {data?.categoryWithMostAmenities && (
                  <div className="text-xs text-gray-300">
                    Líder: {data.categoryWithMostAmenities.name} ({data.categoryWithMostAmenities.count})
                  </div>
                )}
              </div>
            }
            subtitle="Categorías registradas"
            icon={Tag}
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
              <h2 className="text-xl font-semibold">Categorías de Amenidades</h2>
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

          {/* Amenidades por parque - Movido de la tercera fila */}
          <GraphicCard 
            title="Amenidades por Parque"
            className="h-full"
          >
            <VerticalBarChart
              data={(data?.utilizationByPark || []).map((park: any) => ({
                label: park.parkName,
                value: park.amenitiesCount,
                id: park.parkName
              }))}
              emptyStateTitle="No hay datos de amenidades disponibles"
              emptyStateDescription="Los datos de amenidades por parque aparecerán aquí una vez que se asignen amenidades a los parques"
              footerText={
                (data?.utilizationByPark || []).length > 0 
                  ? `Mostrando todos los ${(data?.utilizationByPark || []).length} parques registrados en el sistema`
                  : undefined
              }
              sortDescending={true}
              showLabels={true}
            />
          </GraphicCard>
        </div>

        {/* Top 5 amenidades con más módulos - Movido de la segunda fila */}
        <div className="grid grid-cols-1 gap-6">
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
                    <div className="text-xs text-blue-600 mt-1">
                      {amenity.parksCount} {amenity.parksCount === 1 ? 'parque' : 'parques'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GraphicCard>
        </div>
      </div>
    </DashboardLayout>
  );
};