import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, FileText, Calendar, Star, DollarSign, Target, Award, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { safeApiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminLayout from '@/components/AdminLayout';

const SponsorshipDashboard = () => {
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/sponsorship-dashboard'],
    queryFn: () => safeApiRequest('/api/sponsorship-dashboard', {})
  });

  const { data: sponsors } = useQuery({
    queryKey: ['/api/sponsors'],
    queryFn: () => safeApiRequest('/api/sponsors', {})
  });

  const { data: contracts } = useQuery({
    queryKey: ['/api/sponsorship-contracts'],
    queryFn: () => safeApiRequest('/api/sponsorship-contracts', {})
  });

  const { data: campaigns } = useQuery({
    queryKey: ['/api/sponsorship-campaigns'],
    queryFn: () => safeApiRequest('/api/sponsorship-campaigns', {})
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planificacion': return 'bg-blue-100 text-blue-800';
      case 'completada': return 'bg-purple-100 text-purple-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'planificacion': return 'Planificación';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const topSponsors = sponsors?.slice(0, 5).map((sponsor: any) => ({
    ...sponsor,
    value: parseFloat(sponsor.contractValue || '0')
  })).sort((a: any, b: any) => b.value - a.value) || [];

  const upcomingRenewals = contracts?.filter((contract: any) => {
    const endDate = new Date(contract.endDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return endDate <= threeMonthsFromNow && contract.status === 'active';
  }) || [];

  if (dashboardLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header con fondo coloreado */}
      <div 
        className="py-8 px-4 -mx-4 -mt-6 flex items-center justify-between"
        style={{ backgroundColor: "#14b8a6" }}
      >
        <div>
          <div className="flex items-center gap-2">
            <BarChart className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white font-poppins">Dashboard</h1>
          </div>
          <p className="text-base font-normal text-white font-poppins mt-2">Resumen general del sistema de patrocinios</p>
        </div>
        <div className="text-sm text-white">
          Última actualización: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patrocinadores</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData?.totalSponsors || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contratos Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData?.activeContracts || 0}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${(dashboardData?.totalRevenue || 0).toLocaleString('es-MX')}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Satisfacción Promedio</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {dashboardData?.avgSatisfaction || 0}/10
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sponsors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Patrocinadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSponsors.map((sponsor: any, index: number) => (
                <div key={sponsor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{sponsor.name}</p>
                      <p className="text-sm text-gray-600 capitalize">{sponsor.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      ${sponsor.value.toLocaleString('es-MX')}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {sponsor.level}
                    </Badge>
                  </div>
                </div>
              ))}
              {topSponsors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay patrocinadores disponibles
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Renewals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Próximas Renovaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingRenewals.map((contract: any) => {
                const sponsor = sponsors?.find((s: any) => s.id === contract.sponsorId);
                const daysUntilExpiry = Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={contract.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div>
                      <p className="font-semibold text-gray-900">{sponsor?.name || 'Patrocinador Desconocido'}</p>
                      <p className="text-sm text-gray-600">
                        Vence el {format(new Date(contract.endDate), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">
                        {daysUntilExpiry} días
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {contract.autoRenewal ? 'Auto-renovación' : 'Manual'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {upcomingRenewals.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay renovaciones próximas
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Campañas Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns?.map((campaign: any) => (
              <div key={campaign.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
                  <Badge className={getStatusColor(campaign.status)}>
                    {getStatusText(campaign.status)}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Presupuesto:</span>
                    <span className="font-medium">${parseFloat(campaign.budget || '0').toLocaleString('es-MX')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patrocinadores:</span>
                    <span className="font-medium">{campaign.sponsorsCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ingresos:</span>
                    <span className="font-medium text-green-600">${parseFloat(campaign.revenue || '0').toLocaleString('es-MX')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Periodo:</span>
                    <span className="font-medium">
                      {format(new Date(campaign.startDate), 'dd/MM', { locale: es })} - {format(new Date(campaign.endDate), 'dd/MM', { locale: es })}
                    </span>
                  </div>
                </div>
              </div>
            )) || []}
          </div>
          {(!campaigns || campaigns.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No hay campañas registradas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
              <Users className="w-6 h-6" />
              <span className="text-sm">Nuevo Patrocinador</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
              <FileText className="w-6 h-6" />
              <span className="text-sm">Crear Contrato</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
              <Calendar className="w-6 h-6" />
              <span className="text-sm">Nuevo Evento</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
              <TrendingUp className="w-6 h-6" />
              <span className="text-sm">Ver Métricas</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
};

export default SponsorshipDashboard;