import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  Package, 
  Gift, 
  Calendar,
  ImageIcon,
  BarChart3,
  TrendingUp,
  DollarSign,
  Star
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import PageHeader from '@/components/ui/page-header';

export default function MarketingDashboard() {
  const marketingModules = [
    {
      title: 'Patrocinadores',
      description: 'Gestiona empresas patrocinadoras y sus datos de contacto',
      icon: <Users className="h-6 w-6" />,
      href: '/admin/marketing/sponsors',
      color: 'bg-blue-500',
      stats: 'Gestión completa'
    },
    {
      title: 'Contratos',
      description: 'Administra contratos de patrocinio y acuerdos comerciales',
      icon: <FileText className="h-6 w-6" />,
      href: '/admin/marketing/contracts',
      color: 'bg-green-500',
      stats: 'Control total'
    },
    {
      title: 'Paquetes',
      description: 'Define paquetes de patrocinio y niveles de beneficios',
      icon: <Package className="h-6 w-6" />,
      href: '/admin/marketing/packages',
      color: 'bg-purple-500',
      stats: 'Personalizable'
    },
    {
      title: 'Beneficios',
      description: 'Configura beneficios y ventajas para patrocinadores',
      icon: <Gift className="h-6 w-6" />,
      href: '/admin/marketing/benefits',
      color: 'bg-yellow-500',
      stats: 'Flexibles'
    },
    {
      title: 'Eventos Patrocinados',
      description: 'Vincula eventos con contratos de patrocinio',
      icon: <Calendar className="h-6 w-6" />,
      href: '/admin/marketing/events',
      color: 'bg-red-500',
      stats: 'Integración completa'
    },
    {
      title: 'Assets Publicitarios',
      description: 'Gestiona materiales publicitarios y branding',
      icon: <ImageIcon className="h-6 w-6" />,
      href: '/admin/marketing/assets',
      color: 'bg-indigo-500',
      stats: 'Multimedia'
    }
  ];

  const quickStats = [
    {
      title: 'Patrocinadores Activos',
      value: '12',
      change: '+2',
      changeType: 'positive',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Contratos Vigentes',
      value: '8',
      change: '+1',
      changeType: 'positive',
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: 'Eventos Patrocinados',
      value: '24',
      change: '+6',
      changeType: 'positive',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      title: 'Ingresos por Patrocinios',
      value: '$425,000',
      change: '+15%',
      changeType: 'positive',
      icon: <DollarSign className="h-5 w-5" />
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Marketing y Patrocinios"
          subtitle="Gestión integral de patrocinadores, contratos y eventos comerciales"
          icon={<TrendingUp />}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      <Badge 
                        variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Marketing Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketingModules.map((module, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${module.color} text-white`}>
                    {module.icon}
                  </div>
                  <Badge variant="outline">{module.stats}</Badge>
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground mb-4">{module.description}</p>
                <Link href={module.href}>
                  <Button 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    variant="outline"
                    data-testid={`button-${module.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    Acceder
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Nuevo contrato firmado con Telmex</p>
                    <p className="text-sm text-muted-foreground">Hace 2 horas</p>
                  </div>
                </div>
                <Badge variant="default">Activo</Badge>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Evento "Festival de Primavera" vinculado</p>
                    <p className="text-sm text-muted-foreground">Hace 4 horas</p>
                  </div>
                </div>
                <Badge variant="secondary">Nuevo</Badge>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Nuevo patrocinador registrado</p>
                    <p className="text-sm text-muted-foreground">Hace 1 día</p>
                  </div>
                </div>
                <Badge variant="outline">Pendiente</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}