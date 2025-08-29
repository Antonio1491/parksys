import React from 'react';
import { 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  Clock, 
  Tag, 
  BarChart3, 
  Layers,
  Package,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/ui/dashboard-layout';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Dashboard estático con datos de ejemplo
const AssetsDashboardStatic: React.FC = () => {
  const [_, setLocation] = useLocation();

  // Datos de ejemplo con formato fijo para la demostración
  const stats = {
    totalAssets: 156,
    activeAssets: 128,
    inactiveAssets: 18,
    maintenanceAssets: 10,
    activeAssetsPercentage: 82,
    maintenanceAssetsPercentage: 6.4,
    totalValue: 5827500,
    conditionDistribution: {
      "Excelente": 56,
      "Bueno": 72,
      "Regular": 18,
      "Malo": 10
    },
    statusDistribution: {
      "Activo": 128,
      "Mantenimiento": 10,
      "Inactivo": 18
    },
    needMaintenance: 8,
    needMaintenanceList: [
      {
        id: 1,
        name: "Mesa de Picnic en Parque Central",
        condition: "Regular",
        lastMaintenanceDate: "2025-03-15",
        nextMaintenanceDate: "2025-05-15"
      },
      {
        id: 2,
        name: "Fuente Decorativa Plaza Principal",
        condition: "Regular",
        lastMaintenanceDate: "2025-02-10",
        nextMaintenanceDate: "2025-05-10"
      },
      {
        id: 3,
        name: "Juego Infantil Resbaladilla",
        condition: "Malo",
        lastMaintenanceDate: "2025-01-20",
        nextMaintenanceDate: "2025-04-20"
      }
    ],
    categoryValues: [
      { category: "Juegos Infantiles", totalValue: 1250000 },
      { category: "Mobiliario Urbano", totalValue: 825000 },
      { category: "Infraestructura Deportiva", totalValue: 1875000 },
      { category: "Iluminación", totalValue: 950000 },
      { category: "Áreas Verdes", totalValue: 927500 }
    ]
  };

  const upcomingMaintenances = [
    {
      id: 1,
      assetId: 42,
      assetName: "Juego Infantil Resbaladilla",
      date: "2025-05-20",
      maintenanceType: "Preventivo",
      status: "Programado",
      performedBy: null
    },
    {
      id: 2,
      assetId: 53,
      assetName: "Fuente Decorativa Plaza Principal",
      date: "2025-05-10",
      maintenanceType: "Correctivo",
      status: "Programado",
      performedBy: null
    },
    {
      id: 3,
      assetId: 78,
      assetName: "Barandal Zona Norte",
      date: "2025-05-27",
      maintenanceType: "Preventivo",
      status: "Programado",
      performedBy: null
    }
  ];

  // Formatear valores monetarios
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <DashboardLayout
      icon={Package}
      title="Activos"
      subtitle="Gestión y monitoreo de activos del sistema"
    >
      <div className="flex items-center justify-end mb-6">
        <Button variant="outline" onClick={() => setLocation('/admin/assets')}>
          Ver Inventario
        </Button>
      </div>

      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800">
          Esta es una visualización con datos de ejemplo para mostrar las funcionalidades del dashboard.
        </AlertDescription>
      </Alert>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Layers className="mr-2 h-5 w-5 text-primary" />
                <div className="text-3xl font-bold">{stats.totalAssets}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {formatCurrency(stats.totalValue)} en valor total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Activos Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                <div className="text-3xl font-bold">{stats.activeAssets}</div>
              </div>
              <div className="mt-2">
                <Progress
                  value={stats.activeAssetsPercentage}
                  className="h-2 bg-gray-200"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeAssetsPercentage}% del total
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En Mantenimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Wrench className="mr-2 h-5 w-5 text-blue-500" />
                <div className="text-3xl font-bold">{stats.maintenanceAssets}</div>
              </div>
              <div className="mt-2">
                <Progress
                  value={stats.maintenanceAssetsPercentage}
                  className="h-2 bg-gray-200"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.maintenanceAssetsPercentage}% del total
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Activos Inactivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                <div className="text-3xl font-bold">{stats.inactiveAssets}</div>
              </div>
              <div className="mt-2">
                <Progress
                  value={(stats.inactiveAssets / stats.totalAssets) * 100}
                  className="h-2 bg-gray-200"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((stats.inactiveAssets / stats.totalAssets) * 100)}% del total
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos y Tablas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Condición</CardTitle>
              <CardDescription>
                Estado físico actual de los activos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.conditionDistribution).map(([condition, count]) => {
                  const percentage = (count / stats.totalAssets) * 100;
                  let color;
                  switch (condition) {
                    case 'Excelente':
                      color = 'bg-emerald-500';
                      break;
                    case 'Bueno':
                      color = 'bg-green-500';
                      break;
                    case 'Regular':
                      color = 'bg-amber-500';
                      break;
                    case 'Malo':
                      color = 'bg-red-500';
                      break;
                    default:
                      color = 'bg-gray-500';
                  }
                  return (
                    <div key={condition}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 ${color} rounded-full mr-2`}></div>
                          <span className="text-sm font-medium">{condition}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {count} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-2 bg-gray-200"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valor por Categoría</CardTitle>
              <CardDescription>
                Distribución del valor en pesos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simplificado sin un gráfico real */}
              <div className="space-y-4">
                {stats.categoryValues.map((item) => {
                  const percentage = (item.totalValue / stats.totalValue) * 100;
                  return (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                          <span className="text-sm font-medium">{item.category}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(item.totalValue)}
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-2 bg-gray-200"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mantenimientos Próximos */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mantenimientos Programados</CardTitle>
              <CardDescription>
                Próximos mantenimientos en los siguientes 30 días
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="ml-auto">
              <Calendar className="mr-2 h-4 w-4" />
              Ver Calendario
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingMaintenances.map((maintenance) => (
                  <TableRow key={maintenance.id}>
                    <TableCell className="font-medium">
                      {maintenance.assetName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={maintenance.maintenanceType === 'Preventivo' ? 'outline' : 'secondary'}>
                        {maintenance.maintenanceType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {format(new Date(maintenance.date), 'dd MMM yyyy', { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                        {maintenance.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Activos que Requieren Mantenimiento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Activos que Requieren Mantenimiento</CardTitle>
              <CardDescription>
                Basado en condición y última fecha de mantenimiento
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="ml-auto">
              <Wrench className="mr-2 h-4 w-4" />
              Programar
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activo</TableHead>
                  <TableHead>Condición</TableHead>
                  <TableHead>Último Mantenimiento</TableHead>
                  <TableHead>Siguiente Mantenimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.needMaintenanceList.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">
                      {asset.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={asset.condition === 'Malo' ? 'destructive' : asset.condition === 'Regular' ? 'outline' : 'default'}
                      >
                        {asset.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {asset.lastMaintenanceDate
                        ? format(new Date(asset.lastMaintenanceDate), 'dd MMM yyyy', { locale: es })
                        : 'No disponible'}
                    </TableCell>
                    <TableCell>
                      {asset.nextMaintenanceDate
                        ? format(new Date(asset.nextMaintenanceDate), 'dd MMM yyyy', { locale: es })
                        : 'No programado'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </DashboardLayout>
  );
};

export default AssetsDashboardStatic;