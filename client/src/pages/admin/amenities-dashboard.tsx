import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
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
  averageAmenitiesPerPark: number;
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
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando estadísticas...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
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
      </AdminLayout>
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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con fondo coloreado */}
        <div 
          className="p-4 -mx-4 flex items-center justify-between"
          style={{ backgroundColor: "#14b8a6" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white font-poppins">Dashboard de Amenidades</h1>
            </div>
            <p className="text-white mt-2">Análisis y estadísticas de amenidades en parques</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="bg-white text-gray-900 hover:bg-gray-100">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amenidades</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalAmenities || 0}</div>
              <p className="text-xs text-muted-foreground">
                Amenidades registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Parques</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalParks || 0}</div>
              <p className="text-xs text-muted-foreground">
                Parques en el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Parque</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.averageAmenitiesPerPark.toFixed(1) || '0'}</div>
              <p className="text-xs text-muted-foreground">
                Amenidades por parque
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Activo</div>
              <p className="text-xs text-muted-foreground">
                Sistema operativo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución de amenidades */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Amenidades</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Top 5 amenidades más populares */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Amenidades Más Populares</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Utilización por parque y estado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Utilización por parque */}
          <Card>
            <CardHeader>
              <CardTitle>Amenidades por Parque</CardTitle>
            </CardHeader>
            <CardContent>
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
                              className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
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
            </CardContent>
          </Card>

          {/* Estado de amenidades */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Amenidades</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Insights automáticos */}
        {insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Insights Automáticos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <p className="text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};