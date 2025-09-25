import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Calendar, Users, TrendingUp, MapPin, Clock, Activity, Filter, AlertTriangle, BarChart3 } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdminLayout } from '@/components/AdminLayout';

interface VisitorCount {
  id: number;
  parkId: number;
  parkName: string;
  date: string;
  adults: number;
  children: number;
  seniors: number;
  pets: number;
  groups: number;
  totalVisitors: number;
  countingMethod: string;
  dayType: string;
  weather: string;
  notes: string;
  createdAt: string;
}

interface ParkSummary {
  parkId: number;
  parkName: string;
  totalVisitors: number;
  totalRecords: number;
  avgDailyVisitors: number;
  lastCountDate: string;
}

const COLORS = ['#00a587', '#067f5f', '#bcd256', '#8498a5', '#4CAF50', '#FF6B6B', '#4ECDC4', '#45B7D1'];

const methodLabels = {
  'estimation': 'Estimación',
  'manual_counter': 'Contador Manual',
  'event_based': 'Basado en Eventos',
  'entrance_control': 'Control de Acceso'
};

const weatherLabels = {
  'sunny': 'Soleado',
  'cloudy': 'Nublado',
  'rainy': 'Lluvioso',
  'other': 'Otro'
};

const dayTypeLabels = {
  'weekday': 'Día Laboral',
  'weekend': 'Fin de Semana',
  'holiday': 'Día Festivo'
};

export default function VisitorDashboard() {
  const [selectedPark, setSelectedPark] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Limpiar cache de consultas incorrectas al montar el componente
  useEffect(() => {
    // Invalidar cualquier cache que pueda tener la URL incorrecta
    queryClient.invalidateQueries({ queryKey: ['/api/parks/visitor-dashboard'] });
    queryClient.removeQueries({ queryKey: ['/api/parks/visitor-dashboard'] });
  }, [queryClient]);

  // Obtener datos del dashboard de visitantes
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/visitor-counts/dashboard', selectedPark, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedPark !== 'all') params.append('parkId', selectedPark);
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
        params.append('startDate', startDate);
      }
      params.append('limit', '1000');
      
      const response = await fetch(`/api/visitor-counts/dashboard?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('🌐 [FRONTEND] Datos recibidos del dashboard:', data);
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: false, // DEPLOYMENT FIX: Disabled to prevent deployment hanging
    staleTime: 0 // Siempre fetch fresh data
  });

  // Obtener lista de parques  
  const { data: parksResponse } = useQuery({
    queryKey: ['/api/parks']
  });
  
  const parks = Array.isArray(parksResponse) ? parksResponse : (parksResponse as any)?.data || [];

  // Datos procesados desde el dashboard
  const visitorData = (dashboardData as any)?.records || [];
  const metrics = (dashboardData as any)?.metrics || null;
  const parkSummaries = (dashboardData as any)?.parkSummaries || [];



  // Datos para gráficos
  const chartData = useMemo(() => {
    if (!visitorData || !Array.isArray(visitorData)) return { daily: [], parks: [], methods: [], weather: [] };

    // Datos diarios
    const dailyData = visitorData.reduce((acc: any[], record: any) => {
      const date = record.date;
      const existing = acc.find((item: any) => item.date === date);
      if (existing) {
        existing.visitors += record.totalVisitors;
        existing.adults += record.adults;
        existing.children += record.children;
        existing.seniors += record.seniors;
        existing.pets += record.pets;
      } else {
        acc.push({
          date,
          visitors: record.totalVisitors,
          adults: record.adults,
          children: record.children,
          seniors: record.seniors,
          pets: record.pets,
          formattedDate: format(parseISO(date), 'dd/MM', { locale: es })
        });
      }
      return acc;
    }, []).sort((a: any, b: any) => a.date.localeCompare(b.date));

    // Datos por parque - usar parkSummaries si está disponible, sino procesar records
    let parkData = [];
    
    if (parkSummaries && parkSummaries.length > 0) {
      // Usar datos de parkSummaries que vienen del backend
      parkData = parkSummaries.map((summary: any, index: number) => ({
        parkName: summary.parkName || 'Sin nombre',
        parkNumber: index + 1,
        visitors: parseInt(summary.totalVisitors) || 0,
        records: parseInt(summary.totalRecords) || 0
      })).sort((a: any, b: any) => b.visitors - a.visitors);
      
      // Reasignar números después del ordenamiento
      parkData = parkData.map((park: any, index: number) => ({
        ...park,
        parkNumber: index + 1
      }));
      
      console.log('🌐 [CHART DEBUG] Usando parkSummaries:', parkData);
    } else {
      // Fallback a procesar records directamente
      parkData = visitorData.reduce((acc: any[], record: any) => {
        const existing = acc.find((item: any) => item.parkName === record.parkName);
        if (existing) {
          existing.visitors += record.totalVisitors;
          existing.records += 1;
        } else {
          acc.push({
            parkName: record.parkName || 'Sin nombre',
            visitors: record.totalVisitors || 0,
            records: 1
          });
        }
        return acc;
      }, []).sort((a: any, b: any) => b.visitors - a.visitors);
      
      // Agregar números después del ordenamiento
      parkData = parkData.map((park: any, index: number) => ({
        ...park,
        parkNumber: index + 1
      }));
      
      console.log('🌐 [CHART DEBUG] Usando visitorData:', parkData);
    }

    // Datos por método
    const methodData = visitorData.reduce((acc: any[], record: any) => {
      const method = (methodLabels as any)[record.countingMethod] || record.countingMethod;
      const existing = acc.find((item: any) => item.method === method);
      if (existing) {
        existing.count += 1;
        existing.visitors += record.totalVisitors;
      } else {
        acc.push({
          method,
          count: 1,
          visitors: record.totalVisitors
        });
      }
      return acc;
    }, []);

    // Datos por clima
    const weatherData = visitorData.reduce((acc: any[], record: any) => {
      const weather = (weatherLabels as any)[record.weather] || record.weather;
      const existing = acc.find((item: any) => item.weather === weather);
      if (existing) {
        existing.count += 1;
        existing.visitors += record.totalVisitors;
      } else {
        acc.push({
          weather,
          count: 1,
          visitors: record.totalVisitors
        });
      }
      return acc;
    }, []);

    console.log('🌐 [CHART DEBUG] chartData generado:', {
      daily: dailyData.length,
      parks: parkData.length,
      methods: methodData.length,
      weather: weatherData.length,
      parksData: parkData
    });

    return {
      daily: dailyData,
      parks: parkData,
      methods: methodData,
      weather: weatherData
    };
  }, [visitorData]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <Card className="p-4 bg-gray-50">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header con título */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Análisis y estadísticas del conteo de visitantes</p>
            </div>
          </div>
        </Card>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parque</label>
                <Select value={selectedPark} onValueChange={setSelectedPark}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar parque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los parques</SelectItem>
                    {parks && Array.isArray(parks) && parks.map(park => (
                      <SelectItem key={park.id} value={park.id.toString()}>
                        {park.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 días</SelectItem>
                    <SelectItem value="30">Últimos 30 días</SelectItem>
                    <SelectItem value="90">Últimos 90 días</SelectItem>
                    <SelectItem value="all">Todo el tiempo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <Input
                  placeholder="Buscar en notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Visitantes</p>
                  <p className="text-2xl font-bold text-gray-900">{Number(metrics?.totalVisitors || 0).toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio Diario</p>
                  <p className="text-2xl font-bold text-gray-900">{Number(metrics?.avgDailyVisitors || 0).toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Registros</p>
                  <p className="text-2xl font-bold text-gray-900">{Number(metrics?.totalRecords || 0).toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Parques Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{Number(metrics?.uniqueParks || 0).toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desglose demográfico */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Adultos</p>
                <p className="text-xl font-bold text-gray-900">{Number(metrics?.totalAdults || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {metrics?.totalVisitors ? Math.round((metrics.totalAdults / metrics.totalVisitors) * 100) : 0}% del total
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Niños</p>
                <p className="text-xl font-bold text-gray-900">{Number(metrics?.totalChildren || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {metrics?.totalVisitors ? Math.round((metrics.totalChildren / metrics.totalVisitors) * 100) : 0}% del total
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Adultos Mayores</p>
                <p className="text-xl font-bold text-gray-900">{Number(metrics?.totalSeniors || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {metrics?.totalVisitors ? Math.round((metrics.totalSeniors / metrics.totalVisitors) * 100) : 0}% del total
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Mascotas</p>
                <p className="text-xl font-bold text-gray-900">{Number(metrics?.totalPets || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">Acompañantes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Tendencias</TabsTrigger>
            <TabsTrigger value="parks">Por Parques</TabsTrigger>
            <TabsTrigger value="methods">Métodos</TabsTrigger>
            <TabsTrigger value="summary">Resumen</TabsTrigger>
          </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Visitantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedDate" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [Number(value).toLocaleString(), 'Visitantes']} />
                    <Area type="monotone" dataKey="visitors" stackId="1" stroke="#00a587" fill="#00a587" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Desglose Demográfico por Día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedDate" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [Number(value).toLocaleString()]} />
                    <Bar dataKey="adults" stackId="a" fill="#00a587" name="Adultos" />
                    <Bar dataKey="children" stackId="a" fill="#bcd256" name="Niños" />
                    <Bar dataKey="seniors" stackId="a" fill="#8498a5" name="Adultos Mayores" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parks">
          <Card>
            <CardHeader>
              <CardTitle>Visitantes por Parque</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.parks && chartData.parks.length > 0 ? (
                <div className="space-y-6">
                  {/* Gráfica de barras vertical como alternativa */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={chartData.parks} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis 
                          dataKey="parkNumber" 
                          tick={{ fontSize: 14, fill: '#374151', fontWeight: 'bold' }}
                          height={40}
                          interval={0}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          axisLine={{ stroke: '#6b7280' }}
                          tickLine={{ stroke: '#6b7280' }}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${Number(value).toLocaleString()} visitantes`, 'Total']}
                          labelFormatter={(label: any) => {
                            const park = chartData.parks.find((p: any) => p.parkNumber === label);
                            return park ? `${label}. ${park.parkName}` : `Parque ${label}`;
                          }}
                          labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar 
                          dataKey="visitors" 
                          fill="#00a587" 
                          radius={[4, 4, 0, 0]}
                          strokeWidth={0}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Lista adicional con datos detallados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chartData.parks.map((park: any, index: number) => (
                      <div key={park.parkName} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-green-600">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{park.parkName}</p>
                              <p className="text-xs text-gray-500">{park.records} registro{park.records !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{park.visitors.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">visitantes</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 mb-2">
                      <BarChart3 className="mx-auto h-12 w-12" />
                    </div>
                    <p className="text-gray-500">No hay datos disponibles para mostrar</p>
                    <p className="text-sm text-gray-400 mt-1">Datos esperados: {chartData.parks?.length || 0} parques</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Métodos de Conteo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.methods}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ method, percent }) => `${method} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {chartData.methods.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any, props: any) => [
                        `${Number(value).toLocaleString()} registros`,
                        props.payload.method
                      ]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Condiciones Climáticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.weather}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ weather, percent }) => `${weather} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {chartData.weather.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any, props: any) => [
                        `${Number(value).toLocaleString()} registros`,
                        props.payload.weather
                      ]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Resumen por Parques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parkSummaries.map((summary: any, index: number) => (
                  <div key={summary.parkId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{summary.parkName}</p>
                        <p className="text-sm text-gray-500">
                          Último conteo: {format(parseISO(summary.lastCountDate), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{summary.totalVisitors.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        {Number(summary.avgDailyVisitors).toLocaleString()} promedio diario ({Number(summary.totalRecords).toLocaleString()} registros)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}