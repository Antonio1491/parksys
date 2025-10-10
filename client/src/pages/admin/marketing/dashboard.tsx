import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/ui/dashboard-layout';
import { safeApiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Mail, 
  Send, 
  Clock, 
  Users, 
  FileText, 
  BarChart3,
  Plus,
  MessageSquare,
  DollarSign,
  Star,
  Monitor,
  Target,
  Image,
  MapPin,
  Award,
  Calendar
} from 'lucide-react';

const CommunicationsPage: React.FC = () => {
  // Queries para datos de marketing/patrocinios
  const { data: dashboardData } = useQuery({
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

  // Utilidades para patrocinios
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

  const handleExportPDF = () => {
    console.log('Exportando dashboard de Marketing y Comunicación a PDF...');
  };

  return (
    <DashboardLayout 
      icon={MessageSquare}
      title="Marketing y Comunicación"
      subtitle="Panel integral de comunicaciones, patrocinios y publicidad digital"
      backgroundColor="#14b8a6"
      onExportPDF={handleExportPDF}
    >
      <div className="space-y-6">

        {/* Sección de Comunicaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Métricas de Comunicación
            </CardTitle>
            <CardDescription>
              Estado actual del sistema de comunicaciones y emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">1,234</p>
                    <p className="text-sm text-gray-600">Emails Enviados</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-orange-600">45</p>
                    <p className="text-sm text-gray-600">En Cola</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">12</p>
                    <p className="text-sm text-gray-600">Plantillas</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-600">89%</p>
                    <p className="text-sm text-gray-600">Tasa de Entrega</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Marketing/Patrocinios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Métricas de Marketing y Patrocinios
            </CardTitle>
            <CardDescription>
              Estado del sistema de patrocinios y campañas de marketing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Patrocinadores</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {dashboardData?.totalSponsors || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Contratos Activos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {dashboardData?.activeContracts || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${(dashboardData?.totalRevenue || 0).toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Star className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Satisfacción Promedio</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {dashboardData?.avgSatisfaction || 0}/10
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Publicidad Digital */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Métricas de Publicidad Digital
            </CardTitle>
            <CardDescription>
              Estado del sistema de espacios publicitarios y campañas digitales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Monitor className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Espacios Publicitarios</p>
                    <p className="text-2xl font-bold text-blue-600">10</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Campañas Activas</p>
                    <p className="text-2xl font-bold text-green-600">2</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Image className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Anuncios</p>
                    <p className="text-2xl font-bold text-purple-600">2</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Asignaciones</p>
                    <p className="text-2xl font-bold text-yellow-600">0</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenido del Dashboard Combinado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actividad de Comunicaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Actividad de Comunicaciones
              </CardTitle>
              <CardDescription>
                Últimos emails enviados y programados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No hay actividad reciente</p>
              </div>
            </CardContent>
          </Card>

          {/* Top Patrocinadores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Top Patrocinadores
              </CardTitle>
              <CardDescription>
                Patrocinadores con mayor valor de contrato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSponsors.slice(0, 3).map((sponsor: any, index: number) => (
                  <div key={sponsor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 'bg-amber-600'
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

          {/* Estado del Sistema de Publicidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estado del Sistema Publicitario
              </CardTitle>
              <CardDescription>
                Estado actual del sistema de publicidad digital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Backend</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Funcional</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Base de Datos</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Conectada</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Endpoints</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Operativos</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Próximas Renovaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Próximas Renovaciones
              </CardTitle>
              <CardDescription>
                Contratos que vencen en los próximos 3 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingRenewals.slice(0, 3).map((contract: any) => {
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

        {/* Acciones Rápidas Unificadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Acciones Rápidas
            </CardTitle>
            <CardDescription>
              Acciones principales para comunicaciones, marketing y publicidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Comunicaciones */}
              <Button className="h-20 flex flex-col items-center justify-center gap-2">
                <Plus className="h-6 w-6" />
                <span className="text-sm">Nueva Plantilla</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Send className="h-6 w-6" />
                <span className="text-sm">Envío Masivo</span>
              </Button>
              
              {/* Marketing/Patrocinios */}
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Nuevo Patrocinador</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm">Crear Contrato</span>
              </Button>
              
              {/* Publicidad */}
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Monitor className="h-6 w-6" />
                <span className="text-sm">Nuevo Espacio</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Ver Métricas</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CommunicationsPage;