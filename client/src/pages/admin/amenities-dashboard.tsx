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
  Cell
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
          <GraphicCard 
            title="Distribución de Amenidades"
            description="Visualización de la distribución de tipos de amenidades"
          >
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.amenityDistribution || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {(data?.amenityDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </GraphicCard>

          {/* Top 5 amenidades más populares */}
          <GraphicCard 
            title="Top 5 Amenidades Más Populares"
            description="Amenidades con mayor presencia en parques"
          >
            <div className="space-y-3">
              {(data?.mostPopularAmenities || []).map((amenity: any, index: number) => (
                <div key={amenity.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <span className="font-medium">{amenity.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{amenity.parksCount}</div>
                    <div className="text-xs text-gray-500">{amenity.utilizationRate}% uso</div>
                  </div>
                </div>
              ))}
            </div>
          </GraphicCard>
        </div>

        {/* Utilización por parque y estado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Utilización por parque */}
          <GraphicCard 
            title="Amenidades por Parque"
            description="Distribución de amenidades en cada parque"
          >
            <div className="h-80 overflow-y-auto">
              <div className="space-y-3">
                {(data?.utilizationByPark || []).map((park: any, index: number) => {
                  const maxValue = Math.max(...(data?.utilizationByPark || []).map((p: any) => p.amenitiesCount));
                  const percentage = maxValue > 0 ? (park.amenitiesCount / maxValue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-32 text-sm font-medium text-right text-gray-700 truncate">
                        {park.parkName}
                      </div>
                      <div className="flex-1 flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div 
                            className="bg-teal-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          >
                            <span className="text-white text-xs font-medium">
                              {park.amenitiesCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {(data?.utilizationByPark || []).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No hay datos de parques disponibles
                </div>
              )}
            </div>
          </GraphicCard>

          {/* Estado de amenidades */}
          <GraphicCard 
            title="Estado de Amenidades"
            description="Distribución por estado operativo"
          >
            <div className="space-y-3">
              {(data?.statusDistribution || []).map((status: any) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <span className="font-medium">{status.status}</span>
                  </div>
                  <Badge variant="outline">{status.count}</Badge>
                </div>
              ))}
            </div>
          </GraphicCard>
        </div>
      </div>
    </DashboardLayout>
  );
};