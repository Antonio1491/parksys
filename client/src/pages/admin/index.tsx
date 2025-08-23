import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, 
  Users, 
  Calendar, 
  TreePine,
  Building,
  DollarSign,
  HeartHandshake,
  Briefcase,
  MessageSquare,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AdminLayout from '@/components/AdminLayout';

import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// Dashboard mejorado con gráficas e indicadores
const AdminDashboard: React.FC = () => {
  const { t } = useTranslation('common');
  
  // Consultas de datos reales
  const { data: parksResponse } = useQuery({ queryKey: ['/api/parks'] });
  const { data: activities = [] } = useQuery({ queryKey: ['/api/activities'] });
  const { data: users = [] } = useQuery({ queryKey: ['/api/users'] });
  const { data: employees = [] } = useQuery({ queryKey: ['/api/hr/employees'] });
  const { data: volunteers = [] } = useQuery({ queryKey: ['/api/volunteers'] });
  const { data: concessions = [] } = useQuery({ queryKey: ['/api/active-concessions'] });

  // Seguridad de tipos para arrays - corrigiendo acceso a datos de parques
  const parksArray = Array.isArray(parksResponse) ? parksResponse : [];
  const activitiesArray = Array.isArray(activities) ? activities : [];
  const usersArray = Array.isArray(users) ? users : [];
  const employeesArray = Array.isArray(employees) ? employees : [];
  const volunteersArray = Array.isArray(volunteers) ? volunteers : [];
  const concessionsArray = Array.isArray(concessions) ? concessions : [];

  // Datos para gráficas
  const monthlyData = [
    { name: t('dashboard.months.jan', 'Ene'), parques: 18, actividades: 45, voluntarios: 23 },
    { name: t('dashboard.months.feb', 'Feb'), parques: 19, actividades: 52, voluntarios: 28 },
    { name: t('dashboard.months.mar', 'Mar'), parques: 20, actividades: 48, voluntarios: 31 },
    { name: t('dashboard.months.apr', 'Abr'), parques: 21, actividades: 65, voluntarios: 35 },
    { name: t('dashboard.months.may', 'May'), parques: 22, actividades: 58, voluntarios: 42 },
    { name: t('dashboard.months.jun', 'Jun'), parques: 22, actividades: 71, voluntarios: 38 },
    { name: t('dashboard.months.jul', 'Jul'), parques: parksArray.length, actividades: activitiesArray.length, voluntarios: volunteersArray.length }
  ];

  const moduleUsageData = [
    { name: t('dashboard.modules.parks', 'Parques'), value: 95, color: '#513C73' },
    { name: t('dashboard.modules.hr', 'RH'), value: 88, color: '#B275B0' },
    { name: t('dashboard.modules.finance', 'Finanzas'), value: 92, color: '#B3C077' },
    { name: t('dashboard.modules.activities', 'Actividades'), value: 78, color: '#1E5AA6' },
    { name: t('dashboard.modules.volunteers', 'Voluntarios'), value: 65, color: '#198DCE' },
    { name: t('dashboard.modules.concessions', 'Concesiones'), value: 72, color: '#90D3EC' }
  ];

  const financialData = [
    { name: t('dashboard.months.jan', 'Ene'), ingresos: 125000, egresos: 98000 },
    { name: t('dashboard.months.feb', 'Feb'), ingresos: 132000, egresos: 105000 },
    { name: t('dashboard.months.mar', 'Mar'), ingresos: 145000, egresos: 112000 },
    { name: t('dashboard.months.apr', 'Abr'), ingresos: 158000, egresos: 118000 },
    { name: t('dashboard.months.may', 'May'), ingresos: 162000, egresos: 125000 },
    { name: t('dashboard.months.jun', 'Jun'), ingresos: 175000, egresos: 135000 },
    { name: t('dashboard.months.jul', 'Jul'), ingresos: 182000, egresos: 128000 }
  ];

  const parkTypeData = [
    { name: t('dashboard.parkCategories.urban', 'Urbanos'), value: 8, color: '#513C73' },
    { name: t('dashboard.parkCategories.metropolitan', 'Metropolitanos'), value: 5, color: '#B275B0' },
    { name: t('dashboard.parkCategories.neighborhood', 'Vecinales'), value: 4, color: '#1E5AA6' },
    { name: t('dashboard.parkCategories.linear', 'Lineales'), value: 3, color: '#198DCE' },
    { name: t('dashboard.parkCategories.natural', 'Naturales'), value: 2, color: '#90D3EC' }
  ];



  return (
    <AdminLayout 
      title={t('dashboard.title', 'Dashboard Ejecutivo')} 
      subtitle={t('dashboard.subtitle', 'Panel de control integral del sistema ParkSys')}
    >
      {/* Header con fondo coloreado */}
      <div 
        className="py-8 px-4 -mx-4 -mt-6 mb-8"
        style={{ backgroundColor: "#14b8a6" }}
      >
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-white" />
          <div>
            <h1 className="text-3xl font-bold text-white font-poppins">Panel de Control</h1>
            <p className="text-base font-normal text-white font-poppins">Resumen ejecutivo del sistema de gestión de parques</p>
          </div>
        </div>
      </div>

      {/* Fila 1: Métricas principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Parques */}
        <Card className="border-teal-600" style={{ backgroundColor: '#003D49' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-white">
              {t('dashboard.metrics.totalParks', 'Total de Parques')}
            </CardTitle>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#B3C077' }}>
              <MapPin className="h-7 w-7 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{parksArray.length}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 mr-1" style={{ color: '#B3C077' }} />
              <span className="text-sm font-medium" style={{ color: '#B3C077' }}>{t('dashboard.metrics.growthThisMonth', '+2 este mes')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="h-2 rounded-full" style={{ width: '85%', backgroundColor: '#B3C077' }}></div>
            </div>
            <p className="text-xs text-white mt-1">{t('dashboard.metrics.capacityTarget', '85% de capacidad objetivo')}</p>
          </CardContent>
        </Card>
        
        {/* Personal RH */}
        <Card className="border-teal-600" style={{ backgroundColor: '#003D49' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-white">
              {t('dashboard.metrics.activeStaff', 'Personal Activo')}
            </CardTitle>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#198DCE' }}>
              <Briefcase className="h-7 w-7 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{employeesArray.length}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 mr-1" style={{ color: '#198DCE' }} />
              <span className="text-sm font-medium" style={{ color: '#198DCE' }}>{t('dashboard.metrics.staffGrowthThisMonth', '+5 este mes')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="h-2 rounded-full" style={{ width: '92%', backgroundColor: '#198DCE' }}></div>
            </div>
            <p className="text-xs text-white mt-1">{t('dashboard.metrics.averageAttendance', '92% asistencia promedio')}</p>
          </CardContent>
        </Card>
        
        {/* Actividades */}
        <Card className="border-teal-600" style={{ backgroundColor: '#003D49' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-white">
              {t('dashboard.metrics.activeActivities', 'Actividades Activas')}
            </CardTitle>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#B275B0' }}>
              <Calendar className="h-7 w-7 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{activitiesArray.length}</div>
            <div className="flex items-center mt-2">
              <Activity className="h-4 w-4 mr-1" style={{ color: '#B275B0' }} />
              <span className="text-sm font-medium" style={{ color: '#B275B0' }}>{t('dashboard.metrics.activitiesThisWeek', '15 esta semana')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="h-2 rounded-full" style={{ width: '78%', backgroundColor: '#B275B0' }}></div>
            </div>
            <p className="text-xs text-white mt-1">{t('dashboard.metrics.averageParticipation', '78% participación promedio')}</p>
          </CardContent>
        </Card>
        
        {/* Finanzas */}
        <Card className="border-teal-600" style={{ backgroundColor: '#003D49' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-white">
              {t('dashboard.metrics.monthlyBalance', 'Balance Mensual')}
            </CardTitle>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#90D3EC' }}>
              <DollarSign className="h-7 w-7 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">$54K</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 mr-1" style={{ color: '#90D3EC' }} />
              <span className="text-sm font-medium" style={{ color: '#90D3EC' }}>{t('dashboard.metrics.vsLastMonth', '+18% vs mes anterior')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="h-2 rounded-full" style={{ width: '68%', backgroundColor: '#90D3EC' }}></div>
            </div>
            <p className="text-xs text-white mt-1">{t('dashboard.metrics.annualBudget', '68% del presupuesto anual')}</p>
          </CardContent>
        </Card>
      </div>



      {/* Fila 2: Tendencias principales */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Tendencias mensuales */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('dashboard.charts.growthTrends', 'Tendencias de Crecimiento')}</CardTitle>
            <CardDescription>{t('dashboard.charts.growthTrendsDescription', 'Evolución mensual de los principales indicadores')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="parques" stroke="#B3C077" strokeWidth={3} name={t('dashboard.modules.parks', 'Parques')} />
                <Line type="monotone" dataKey="actividades" stroke="#B275B0" strokeWidth={3} name={t('dashboard.modules.activities', 'Actividades')} />
                <Line type="monotone" dataKey="voluntarios" stroke="#198DCE" strokeWidth={3} name={t('dashboard.modules.volunteers', 'Voluntarios')} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Uso de módulos */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('dashboard.charts.moduleAdoption', 'Adopción de Módulos')}</CardTitle>
            <CardDescription>{t('dashboard.charts.moduleAdoptionDescription', 'Porcentaje de uso activo por módulo del sistema')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {moduleUsageData.map((module, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: module.color }}
                    ></div>
                    <span className="text-sm font-medium">{module.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-80 bg-gray-200 rounded-full h-8">
                      <div 
                        className="h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" 
                        style={{ 
                          width: `${module.value}%`, 
                          backgroundColor: module.color 
                        }}
                      >
                        {module.value}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Fila 3: Flujo Financiero y Tipos de Parques */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Flujo financiero */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('dashboard.charts.financialFlow', 'Flujo Financiero')}</CardTitle>
            <CardDescription>{t('dashboard.charts.financialFlowDescription', 'Ingresos vs Egresos (Miles de pesos)')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`$${(Number(value) / 1000).toFixed(0)}K`, '']} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="ingresos" 
                  stackId="1" 
                  stroke="#B3C077" 
                  fill="#B3C077" 
                  fillOpacity={1.0}
                  name={t('dashboard.charts.income', 'Ingresos')}
                />
                <Area 
                  type="monotone" 
                  dataKey="egresos" 
                  stackId="2" 
                  stroke="#B275B0" 
                  fill="#B275B0" 
                  fillOpacity={1.0}
                  name={t('dashboard.charts.expenses', 'Egresos')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución de parques */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('dashboard.charts.parkTypes', 'Tipos de Parques')}</CardTitle>
            <CardDescription>{t('dashboard.charts.parkTypesDescription', 'Distribución por categoría')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={parkTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {parkTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>





      {/* Fila 4: Indicadores Críticos y Estado del Sistema */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Indicadores críticos */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('dashboard.kpis.criticalIndicators', 'Indicadores Críticos')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('dashboard.kpis.pendingMaintenance', 'Mantenimiento Pendiente')}</span>
              <Badge style={{ backgroundColor: '#B3C077', color: 'white' }}>{t('dashboard.kpis.urgentItems', '3 urgentes')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('dashboard.kpis.availableBudget', 'Presupuesto Disponible')}</span>
              <Badge style={{ backgroundColor: '#1E5AA6', color: 'white' }}>{t('dashboard.kpis.remainingBudget', '32% restante')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('dashboard.kpis.upcomingEvents', 'Eventos Próximos')}</span>
              <Badge style={{ backgroundColor: '#198DCE', color: 'white' }}>{t('dashboard.kpis.thisWeekEvents', '8 esta semana')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('dashboard.kpis.expiringContracts', 'Contratos por Vencer')}</span>
              <Badge style={{ backgroundColor: '#90D3EC', color: 'white' }}>{t('dashboard.kpis.thisMonthContracts', '2 este mes')}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Estado del sistema */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('dashboard.kpis.systemStatus', 'Estado del Sistema')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('dashboard.kpis.activeUsers24h', 'Usuarios Activos (24h)')}</span>
              <Badge style={{ backgroundColor: '#B3C077', color: 'white' }}>{usersArray.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('dashboard.kpis.systemUptime', 'Uptime del Sistema')}</span>
              <Badge style={{ backgroundColor: '#1E5AA6', color: 'white' }}>99.8%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('dashboard.kpis.automaticBackup', 'Backup Automático')}</span>
              <Badge style={{ backgroundColor: '#198DCE', color: 'white' }}>{t('dashboard.kpis.updated', 'Actualizado')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('dashboard.kpis.security', 'Seguridad')}</span>
              <Badge style={{ backgroundColor: '#90D3EC', color: 'white' }}>{t('dashboard.kpis.optimal', 'Óptima')}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fila 5: Resumen de módulos principales */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card className="text-center">
          <CardContent className="pt-6">
            <HeartHandshake className="h-12 w-12 mx-auto mb-3" style={{ color: '#61B1A0' }} />
            <h3 className="font-semibold mb-1">{t('dashboard.moduleSummary.volunteers', 'Voluntarios')}</h3>
            <p className="text-2xl font-bold mb-2">{volunteersArray.length}</p>
            <p className="text-sm text-gray-600">{t('dashboard.moduleSummary.activeThisMonth', '38 activos este mes')}</p>
            <Link href="/admin/volunteers">
              <Button variant="outline" size="sm" className="mt-3" style={{ backgroundColor: '#61B1A0', color: 'white', borderColor: '#61B1A0' }}>
                {t('dashboard.moduleSummary.manage', 'Gestionar')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <Building className="h-12 w-12 mx-auto mb-3" style={{ color: '#513C73' }} />
            <h3 className="font-semibold mb-1">{t('dashboard.moduleSummary.concessions', 'Concesiones')}</h3>
            <p className="text-2xl font-bold mb-2">{concessionsArray.length}</p>
            <p className="text-sm text-gray-600">{t('dashboard.moduleSummary.activeContracts', '9 contratos activos')}</p>
            <Link href="/admin/concessions">
              <Button variant="outline" size="sm" className="mt-3" style={{ backgroundColor: '#513C73', color: 'white', borderColor: '#513C73' }}>
                {t('dashboard.moduleSummary.manage', 'Gestionar')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <TreePine className="h-12 w-12 mx-auto mb-3" style={{ color: '#B275B0' }} />
            <h3 className="font-semibold mb-1">{t('dashboard.moduleSummary.forestry', 'Arbolado')}</h3>
            <p className="text-2xl font-bold mb-2">50</p>
            <p className="text-sm text-gray-600">{t('dashboard.moduleSummary.catalogedSpecies', '14 especies catalogadas')}</p>
            <Link href="/admin/trees">
              <Button variant="outline" size="sm" className="mt-3" style={{ backgroundColor: '#B275B0', color: 'white', borderColor: '#B275B0' }}>
                {t('dashboard.moduleSummary.manage', 'Gestionar')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <MessageSquare className="h-12 w-12 mx-auto mb-3" style={{ color: '#B3C077' }} />
            <h3 className="font-semibold mb-1">{t('dashboard.moduleSummary.communication', 'Comunicación')}</h3>
            <p className="text-2xl font-bold mb-2">2,847</p>
            <p className="text-sm text-gray-600">{t('dashboard.moduleSummary.emailsSent', 'emails enviados')}</p>
            <Link href="/admin/communications">
              <Button variant="outline" size="sm" className="mt-3" style={{ backgroundColor: '#B3C077', color: 'white', borderColor: '#B3C077' }}>
                {t('dashboard.moduleSummary.manage', 'Gestionar')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;