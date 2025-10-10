import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CalendarIcon, DownloadIcon, FilterIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, BuildingIcon, MapPinIcon, UsersIcon, BarChart3 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface ReportData {
  totalConcessions: number;
  activeConcessions: number;
  monthlyRevenue: number;
  averagePayment: number;
  topPerformingPark: string;
  recentActivities: Array<{
    id: number;
    action: string;
    concession: string;
    date: string;
    amount?: number;
  }>;
}

export default function ConcessionsReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedPark, setSelectedPark] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Obtener datos de concesiones para reportes
  const { data: concessionsResponse, isLoading: loadingConcessions } = useQuery({
    queryKey: ['/api/active-concessions'],
    suspense: false,
    retry: 1,
  });

  // Obtener datos de parques para filtros
  const { data: parksResponse, isLoading: loadingParks } = useQuery({
    queryKey: ['/api/parks'],
    suspense: false,
    retry: 1,
  });

  const concessions = Array.isArray(concessionsResponse?.data) ? concessionsResponse.data : (Array.isArray(concessionsResponse) ? concessionsResponse : []);
  const parks = Array.isArray(parksResponse?.data) ? parksResponse.data : (Array.isArray(parksResponse) ? parksResponse : []);

  // Calcular métricas de reporte
  const totalConcessions = concessions.length;
  const activeConcessions = concessions.filter(c => c.status === 'active' || c.status === '').length;
  const monthlyRevenue = concessions.reduce((total, c) => total + (parseFloat(c.monthly_payment) || 0), 0);
  const averagePayment = totalConcessions > 0 ? monthlyRevenue / totalConcessions : 0;

  // Obtener el parque con más concesiones
  const parkConcessionCount = concessions.reduce((acc, c) => {
    acc[c.parkName] = (acc[c.parkName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topPerformingPark = Object.entries(parkConcessionCount).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0] || 'N/A';

  // Actividades recientes simuladas
  const recentActivities = [
    { id: 1, action: 'Nueva concesión registrada', concession: 'EcoBikes Tlaquepaque', date: '2025-01-22', amount: 1500 },
    { id: 2, action: 'Pago mensual recibido', concession: 'Eventos Culturales Quintanar', date: '2025-01-21', amount: 1167 },
    { id: 3, action: 'Contrato renovado', concession: 'Helados Artesanales Alcalde', date: '2025-01-20', amount: 500 },
    { id: 4, action: 'Evaluación completada', concession: 'Food Truck Asia Fusion', date: '2025-01-19' },
    { id: 5, action: 'Cambio de ubicación', concession: 'EcoBikes Tlaquepaque', date: '2025-01-18' },
  ];

  const handleExportReport = () => {
    const csvContent = [
      ['Concesión', 'Tipo', 'Parque', 'Estado', 'Pago Mensual', 'Fecha Inicio', 'Fecha Fin'],
      ...concessions.map(c => [
        c.name,
        c.concessionTypeName,
        c.parkName,
        c.status || 'Activa',
        c.monthly_payment,
        new Date(c.start_date).toLocaleDateString(),
        new Date(c.end_date).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_concesiones_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loadingConcessions || loadingParks) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <Card className="p-4 bg-gray-50 mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-gray-900" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Generando reportes...</p>
              </div>
            </div>
          </Card>
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        {/* Header con título */}
        <Card className="p-4 bg-gray-50 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-gray-900" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Análisis y reportes del sistema de concesiones</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleExportReport}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <DownloadIcon size={16} />
                Exportar Reporte
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
        {/* Filtros y Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5" />
              Filtros de Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="quarter">Último trimestre</SelectItem>
                  <SelectItem value="year">Último año</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedPark} onValueChange={setSelectedPark}>
                <SelectTrigger>
                  <SelectValue placeholder="Parque" />
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

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="suspended">Suspendidas</SelectItem>
                  <SelectItem value="expired">Vencidas</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleExportReport} className="bg-green-600 hover:bg-green-700">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Concesiones</p>
                  <p className="text-3xl font-bold text-gray-900">{totalConcessions}</p>
                </div>
                <BuildingIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2 flex items-center">
                <TrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+12% vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Concesiones Activas</p>
                  <p className="text-3xl font-bold text-gray-900">{activeConcessions}</p>
                </div>
                <UsersIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2 flex items-center">
                <TrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+8% vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                  <p className="text-3xl font-bold text-gray-900">${monthlyRevenue.toLocaleString()}</p>
                </div>
                <DollarSignIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="mt-2 flex items-center">
                <TrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+15% vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pago Promedio</p>
                  <p className="text-3xl font-bold text-gray-900">${averagePayment.toLocaleString()}</p>
                </div>
                <TrendingUpIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2 flex items-center">
                <TrendingDownIcon className="h-4 w-4 text-red-600 mr-1" />
                <span className="text-sm text-red-600">-3% vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información Adicional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Parque con Más Concesiones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5" />
                Parque Top Performer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <h3 className="text-xl font-bold text-gray-900">{topPerformingPark}</h3>
                <p className="text-gray-600">{parkConcessionCount[topPerformingPark] || 0} concesiones activas</p>
                <Badge className="mt-2 bg-green-100 text-green-800">Líder del periodo</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actividades Recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Actividades Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-600">{activity.concession}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{activity.date}</p>
                      {activity.amount && (
                        <p className="text-sm font-medium text-green-600">${activity.amount}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Concesiones */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Concesiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Concesión</th>
                    <th className="text-left py-3 px-4">Tipo</th>
                    <th className="text-left py-3 px-4">Parque</th>
                    <th className="text-left py-3 px-4">Estado</th>
                    <th className="text-left py-3 px-4">Pago Mensual</th>
                    <th className="text-left py-3 px-4">Vigencia</th>
                  </tr>
                </thead>
                <tbody>
                  {concessions.slice(0, 10).map((concession: any) => (
                    <tr key={concession.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{concession.name}</td>
                      <td className="py-3 px-4">{concession.concessionTypeName}</td>
                      <td className="py-3 px-4">{concession.parkName}</td>
                      <td className="py-3 px-4">
                        <Badge className={concession.status === 'active' || !concession.status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {concession.status === 'active' || !concession.status ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">${parseFloat(concession.monthly_payment || '0').toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {new Date(concession.start_date).toLocaleDateString()} - {new Date(concession.end_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {concessions.length > 10 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Mostrando 10 de {concessions.length} concesiones</p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </AdminLayout>
  );
}