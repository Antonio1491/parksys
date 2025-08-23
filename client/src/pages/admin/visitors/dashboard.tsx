import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Star,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Activity,
  Target,
  Award,
  UserCheck,
  BarChart3,
  Filter,
  RefreshCw
} from 'lucide-react';

interface DashboardMetrics {
  visitors: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    avgDaily: number;
    uniqueParks: number;
    totalRecords: number;
  };
  evaluations: {
    total: number;
    averageRating: number;
    thisMonth: number;
    lastMonth: number;
    recommendationRate: number;
    categoryAverages: {
      cleanliness: number;
      safety: number;
      maintenance: number;
      accessibility: number;
      amenities: number;
      activities: number;
      staff: number;
      naturalBeauty: number;
    };
  };
  feedback: {
    total: number;
    pending: number;
    resolved: number;
    thisMonth: number;
    lastMonth: number;
    byType: {
      share: number;
      report_problem: number;
      suggest_improvement: number;
      propose_event: number;
    };
    resolutionRate: number;
  };
}

interface ParkData {
  parkId: number;
  parkName: string;
  visitors: number;
  evaluations: number;
  avgRating: number;
  feedback: number;
  pendingFeedback: number;
}

interface TrendData {
  date: string;
  visitors: number;
  evaluations: number;
  feedback: number;
}

const COLORS = ['#00a587', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

export default function VisitorsDashboard() {
  const [selectedPark, setSelectedPark] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch parks data
  const { data: parksData } = useQuery({
    queryKey: ['/api/parks'],
    retry: 1
  });

  // Fetch dashboard metrics
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['/api/visitors/dashboard-metrics', { park: selectedPark, dateRange }],
    retry: 1
  });

  // Fetch parks performance data
  const { data: parksPerformance, isLoading: isParksLoading } = useQuery({
    queryKey: ['/api/visitors/parks-performance', { park: selectedPark, dateRange }],
    retry: 1
  });

  // Fetch trend data
  const { data: trendData, isLoading: isTrendLoading } = useQuery({
    queryKey: ['/api/visitors/trends', { park: selectedPark, dateRange }],
    retry: 1
  });

  const parks = (parksData as any)?.data || [];
  const metrics: DashboardMetrics = (dashboardData as any)?.metrics || {
    visitors: { total: 0, thisMonth: 0, lastMonth: 0, avgDaily: 0, uniqueParks: 0, totalRecords: 0 },
    evaluations: { total: 0, averageRating: 0, thisMonth: 0, lastMonth: 0, recommendationRate: 0, categoryAverages: {} },
    feedback: { total: 0, pending: 0, resolved: 0, thisMonth: 0, lastMonth: 0, byType: {}, resolutionRate: 0 }
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/visitors/dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['/api/visitors/parks-performance'] });
    queryClient.invalidateQueries({ queryKey: ['/api/visitors/trends'] });
    toast({
      title: "Datos actualizados",
      description: "El dashboard se ha actualizado con los datos más recientes"
    });
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('es-ES');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con fondo coloreado */}
        <div 
          className="py-8 px-4 -mx-4 -mt-6"
          style={{ backgroundColor: "#14b8a6" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white font-poppins">Dashboard de Visitantes</h1>
              <p className="text-base font-normal text-white font-poppins">Vista integral de datos de visitantes y retroalimentación</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-white" />
              <Select value={selectedPark} onValueChange={setSelectedPark}>
                <SelectTrigger className="w-48 bg-white text-gray-900">
                  <SelectValue placeholder="Seleccionar parque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los parques</SelectItem>
                  {parks.map((park: any) => (
                    <SelectItem key={park.id} value={park.id.toString()}>
                      {park.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40 bg-white text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                    <SelectItem value="90">Últimos 3 meses</SelectItem>
                    <SelectItem value="365">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={refreshData} size="sm" className="bg-[#00a587] hover:bg-[#067f5f]">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Visitantes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visitantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics.visitors.total)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getChangePercentage(metrics.visitors.thisMonth, metrics.visitors.lastMonth) >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                {Math.abs(getChangePercentage(metrics.visitors.thisMonth, metrics.visitors.lastMonth))}% vs mes anterior
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Promedio diario: {formatNumber(metrics.visitors.avgDaily)}
              </p>
            </CardContent>
          </Card>

          {/* Evaluaciones */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evaluaciones</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics.evaluations.total)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Star className="h-3 w-3 text-yellow-500 mr-1" />
                {metrics.evaluations.averageRating.toFixed(1)}/5.0 promedio
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.evaluations.recommendationRate.toFixed(1)}% recomendación
              </p>
            </CardContent>
          </Card>

          {/* Retroalimentación */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retroalimentación</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics.feedback.total)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 text-orange-500 mr-1" />
                {formatNumber(metrics.feedback.pending)} pendientes
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.feedback.resolutionRate.toFixed(1)}% resueltos
              </p>
            </CardContent>
          </Card>

          {/* Satisfacción General */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((metrics.evaluations.averageRating / 5) * 100).toFixed(0)}%
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Target className="h-3 w-3 text-blue-500 mr-1" />
                Índice de satisfacción
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Basado en {formatNumber(metrics.evaluations.total)} evaluaciones
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficas y análisis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendencias temporales */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencias Temporales</CardTitle>
            </CardHeader>
            <CardContent>
              {isTrendLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a587]"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={(trendData as any)?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="#00a587" 
                      name="Visitantes"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="evaluations" 
                      stroke="#3b82f6" 
                      name="Evaluaciones"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="feedback" 
                      stroke="#f59e0b" 
                      name="Retroalimentación"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Distribución de retroalimentación por tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Retroalimentación</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Experiencias', value: metrics.feedback.byType.share || 0 },
                      { name: 'Problemas', value: metrics.feedback.byType.report_problem || 0 },
                      { name: 'Mejoras', value: metrics.feedback.byType.suggest_improvement || 0 },
                      { name: 'Eventos', value: metrics.feedback.byType.propose_event || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Evaluaciones por categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluación por Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={[
                { category: 'Limpieza', rating: metrics.evaluations.categoryAverages.cleanliness || 0 },
                { category: 'Seguridad', rating: metrics.evaluations.categoryAverages.safety || 0 },
                { category: 'Mantenimiento', rating: metrics.evaluations.categoryAverages.maintenance || 0 },
                { category: 'Accesibilidad', rating: metrics.evaluations.categoryAverages.accessibility || 0 },
                { category: 'Amenidades', rating: metrics.evaluations.categoryAverages.amenities || 0 },
                { category: 'Actividades', rating: metrics.evaluations.categoryAverages.activities || 0 },
                { category: 'Personal', rating: metrics.evaluations.categoryAverages.staff || 0 },
                { category: 'Belleza Natural', rating: metrics.evaluations.categoryAverages.naturalBeauty || 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="rating" fill="#00a587" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rendimiento por parques */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Parques</CardTitle>
          </CardHeader>
          <CardContent>
            {isParksLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a587]"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {(parksPerformance as any)?.parks?.map((park: ParkData) => (
                  <div key={park.parkId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{park.parkName}</h3>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{park.avgRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Visitantes:</span>
                        <div className="font-medium">{formatNumber(park.visitors)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Evaluaciones:</span>
                        <div className="font-medium">{formatNumber(park.evaluations)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Retroalimentación:</span>
                        <div className="font-medium">{formatNumber(park.feedback)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pendientes:</span>
                        <div className="font-medium text-orange-600">{formatNumber(park.pendingFeedback)}</div>
                      </div>
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