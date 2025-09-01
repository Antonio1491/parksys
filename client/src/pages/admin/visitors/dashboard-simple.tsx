import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, MessageSquare, BarChart3, TrendingUp, CalendarDays } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import DashboardLayout from '@/components/ui/dashboard-layout';

// Dashboard integral de visitantes que combina datos de conteo, evaluaciones y feedback
export default function VisitorsDashboardSimple() {
  // Queries usando endpoints existentes
  const { data: visitorCounts = [], isLoading: loadingVisitors } = useQuery({
    queryKey: ['/api/visitor-counts'],
    retry: 1
  });

  const { data: parkFeedback = [], isLoading: loadingFeedback } = useQuery({
    queryKey: ['/api/feedback'],
    queryFn: async () => {
      const response = await fetch('/api/feedback?limit=1000');
      if (!response.ok) throw new Error('Failed to fetch feedback');
      return response.json();
    },
    retry: 1
  });

  // Query para datos mensuales por parque
  const { data: monthlyData, isLoading: loadingMonthly } = useQuery({
    queryKey: ['/api/visitors', 'monthly-by-park'],
    queryFn: async () => {
      const response = await fetch('/api/visitors/monthly-by-park?months=6');
      if (!response.ok) throw new Error('Failed to fetch monthly data');
      return response.json();
    },
    retry: 1
  });

  // Verificar si hay datos cargando
  const isLoading = loadingVisitors || loadingFeedback || loadingMonthly;

  // Acceso seguro a datos - corregir estructura de respuesta
  const visitorData = (visitorCounts as any)?.data || visitorCounts || [];
  const feedbackData = (parkFeedback as any)?.feedback || (parkFeedback as any)?.data || parkFeedback || [];



  // Cálculos de métricas principales
  const totalVisitors = Array.isArray(visitorData) 
    ? visitorData.reduce((sum, record) => sum + (record.adults || 0) + (record.children || 0) + (record.seniors || 0), 0)
    : 0;

  const totalFeedback = Array.isArray(feedbackData) ? feedbackData.length : 0;

  // Calcular grupo demográfico dominante
  const adults = Array.isArray(visitorData) ? visitorData.reduce((sum, record) => sum + (record.adults || 0), 0) : 0;
  const children = Array.isArray(visitorData) ? visitorData.reduce((sum, record) => sum + (record.children || 0), 0) : 0;
  const seniors = Array.isArray(visitorData) ? visitorData.reduce((sum, record) => sum + (record.seniors || 0), 0) : 0;
  
  const demographicGroups = [
    { name: 'Adultos', count: adults, color: '#00a587' },
    { name: 'Niños', count: children, color: '#00d4aa' },
    { name: 'Adultos Mayores', count: seniors, color: '#067f5f' }
  ];
  
  const dominantGroup = demographicGroups.reduce((max, group) => 
    group.count > max.count ? group : max, demographicGroups[0]);
  
  const dominantPercentage = totalVisitors > 0 ? (dominantGroup.count / totalVisitors) * 100 : 0;

  // Calcular visitantes de la semana actual (lunes a domingo)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que la semana empiece en lunes
    return new Date(d.setDate(diff));
  };
  
  const getWeekEnd = (date: Date) => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  };
  
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(today);
  
  const weeklyVisitors = Array.isArray(visitorData) ? visitorData.filter(record => {
    if (!record.date) return false;
    const recordDate = new Date(record.date);
    return recordDate >= weekStart && recordDate <= weekEnd;
  }).reduce((sum, record) => 
    sum + (record.adults || 0) + (record.children || 0) + (record.seniors || 0), 0) : 0;

  // Calcular el parque con más visitantes de la semana
  const weeklyParkVisitors = Array.isArray(visitorData) ? visitorData.filter(record => {
    if (!record.date) return false;
    const recordDate = new Date(record.date);
    return recordDate >= weekStart && recordDate <= weekEnd;
  }).reduce((acc, record) => {
    const parkName = record.parkName || 'Parque Desconocido';
    const visitors = (record.adults || 0) + (record.children || 0) + (record.seniors || 0);
    acc[parkName] = (acc[parkName] || 0) + visitors;
    return acc;
  }, {} as Record<string, number>) : {};

  const topWeeklyPark = Object.entries(weeklyParkVisitors).length > 0 
    ? Object.entries(weeklyParkVisitors).reduce((max, [parkName, visitors]) => 
        visitors > max.visitors ? { name: parkName, visitors } : max, 
        { name: '', visitors: 0 })
    : { name: 'Sin datos', visitors: 0 };

  // Datos para gráficas - Visitantes por método
  const methodData = Array.isArray(visitorData) ? visitorData.reduce((acc, record) => {
    const method = record.countingMethod || 'Directo';
    acc[method] = (acc[method] || 0) + ((record.adults || 0) + (record.children || 0) + (record.seniors || 0));
    return acc;
  }, {} as Record<string, number>) : {};

  const methodChartData = Object.entries(methodData).map(([method, count]) => ({
    method,
    count
  }));

  // Datos para gráficas - Distribución demográfica
  const demographicData = Array.isArray(visitorData) ? [{
    name: 'Adultos',
    value: visitorData.reduce((sum, record) => sum + (record.adults || 0), 0),
    color: '#00a587'
  }, {
    name: 'Niños',
    value: visitorData.reduce((sum, record) => sum + (record.children || 0), 0),
    color: '#00d4aa'
  }, {
    name: 'Adultos Mayores',
    value: visitorData.reduce((sum, record) => sum + (record.seniors || 0), 0),
    color: '#067f5f'
  }] : [];

  // Datos agregados por parque desde visitor data
  const parkVisitorsData = Array.isArray(visitorData) ? visitorData.reduce((acc: Record<string, number>, record: any) => {
    const parkName = record.parkName || `Parque ${record.parkId}`;
    if (!acc[parkName]) {
      acc[parkName] = 0;
    }
    acc[parkName] += (record.adults || 0) + (record.children || 0) + (record.seniors || 0);
    return acc;
  }, {}) : {};

  const parkVisitors = Object.entries(parkVisitorsData)
    .map(([name, visitors]) => ({ name, visitors }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 5);

  // Datos de tendencias (últimos 7 días)
  const last7Days = Array.isArray(visitorData) ? (() => {
    const today = new Date();
    const daysData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRecords = visitorData.filter(vc => vc.date === dateStr);
      const dayTotal = dayRecords.reduce((sum, record) => 
        sum + (record.adults || 0) + (record.children || 0) + (record.seniors || 0), 0);
      
      
      const dayFeedback = Array.isArray(feedbackData) ? feedbackData.filter((feedback: any) => {
        try {
          const fbDate = new Date(feedback.created_at || feedback.createdAt).toISOString().split('T')[0];
          return fbDate === dateStr;
        } catch (e) {
          return false;
        }
      }).length : 0;

      try {
        daysData.push({
          date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
          visitors: dayTotal,
          feedback: dayFeedback
        });
      } catch (e) {
        console.error('Error processing date:', date, e);
      }
    }
    
    return daysData;
  })() : [];

  if (isLoading) {
    return (
      <DashboardLayout 
        icon={BarChart3}
        title="Visitantes"
        subtitle="Vista consolidada de visitantes y retroalimentación"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos del dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      icon={BarChart3}
      title="Visitantes"
      subtitle="Vista consolidada de visitantes y retroalimentación"
    >
      <div className="space-y-6">
        {/* Tarjetas de métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Visitantes</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalVisitors.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Registros históricos</p>
              
              {/* Barra de progreso del grupo dominante */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Grupo dominante: {dominantGroup.name}</span>
                  <span className="font-medium" style={{ color: dominantGroup.color }}>
                    {dominantPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{ 
                      width: `${dominantPercentage}%`,
                      backgroundColor: dominantGroup.color 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Visitantes Semanales</CardTitle>
              <CalendarDays className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{weeklyVisitors.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                Semana actual ({weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})
              </p>
              {topWeeklyPark.visitors > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Parque líder:</span>
                    <span className="font-medium text-orange-700">
                      {topWeeklyPark.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {topWeeklyPark.visitors.toLocaleString()} visitantes
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Retroalimentación</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalFeedback}</div>
              <p className="text-xs text-gray-500 mt-1">Comentarios ciudadanos</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficas principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendencias de 7 días */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Tendencias (Últimos 7 días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={last7Days}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="visitors" stroke="#00a587" strokeWidth={2} name="Visitantes" />
                  <Line type="monotone" dataKey="feedback" stroke="#10b981" strokeWidth={2} name="Feedback" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribución demográfica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Distribución Demográfica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={demographicData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {demographicData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráfica mensual por parque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Registro Mensual de Visitantes por Parque
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Tendencias de visitantes en los últimos 6 meses por parque
            </p>
          </CardHeader>
          <CardContent>
            {loadingMonthly ? (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando datos mensuales...</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData?.chartData || []}>
                  <XAxis 
                    dataKey="monthName" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Visitantes', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                    formatter={(value: any, name: string) => {
                      const parkConfig = monthlyData?.parkConfig?.find((p: any) => p.dataKey === name);
                      const parkName = parkConfig?.name || name;
                      return [value && value !== 0 ? Number(value).toLocaleString() : '0', parkName];
                    }}
                  />
                  {monthlyData?.parkConfig?.map((park: any) => (
                    <Line
                      key={park.dataKey}
                      type="monotone"
                      dataKey={park.dataKey}
                      stroke={park.color}
                      strokeWidth={2}
                      name={park.name}
                      connectNulls={false}
                      dot={{ fill: park.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: park.color, strokeWidth: 2 }}
                    />
                  )) || []}
                </LineChart>
              </ResponsiveContainer>
            )}
            
            {/* Información resumida de la gráfica */}
            {monthlyData && !loadingMonthly && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-emerald-600">
                      {monthlyData?.totalParks || 0}
                    </div>
                    <div className="text-gray-600">Parques monitoreados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {monthlyData?.monthsShown || 0}
                    </div>
                    <div className="text-gray-600">Meses de historial</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {monthlyData?.chartData?.length || 0}
                    </div>
                    <div className="text-gray-600">Periodos de datos</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Secciones adicionales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top parques por visitantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Top Parques por Visitantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {parkVisitors.map((park: any, index: number) => (
                  <div key={park.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium">{park.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{park.visitors.toLocaleString()} visitantes</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visitantes por método */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                Métodos de Registro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={methodChartData}>
                  <XAxis dataKey="method" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00a587" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}