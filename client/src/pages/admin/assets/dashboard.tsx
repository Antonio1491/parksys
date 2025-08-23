import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckCircle, AlertTriangle, Wrench, Clock, Tag, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/AdminLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Definir tipos para los datos del dashboard
interface AssetStats {
  total: number;
  totalValue: number;
  byStatus: {
    [key: string]: number;
  };
  byCondition: {
    [key: string]: number;
  };
  categoryValues: {
    category: string;
    totalValue: number;
  }[];
}

// Interfaz para los datos de activos (copiada de inventory)
interface Asset {
  id: number;
  name: string;
  description: string | null;
  serialNumber: string | null;
  acquisitionDate: string | null;
  acquisitionCost: number | string | null;
  parkId: number;
  parkName?: string;
  categoryId: number;
  categoryName?: string;
  status: string;
  condition: string;
  locationDescription: string | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  createdAt: string;
  updatedAt: string;
}

const formatCurrency = (value: number | string | null) => {
  if (value === null || value === undefined) return 'N/A';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'N/A';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
};

const AssetsDashboard: React.FC = () => {
  const [_, setLocation] = useLocation();

  // Consultar datos de activos
  const { data: assets, isLoading, isError } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
  });

  // Consultar datos de parques
  const { data: parks } = useQuery({
    queryKey: ['/api/parks'],
  });

  if (isError) {
    return (
      <AdminLayout>
        <Alert>
          <AlertDescription>
            Error al cargar los datos de activos. Por favor, intenta de nuevo.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Cargando datos...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Calcular valores exactamente como en la página de inventario
  const totalAssets = assets?.length || 0;
  const totalValue = assets?.reduce((sum, asset) => {
    const cost = typeof asset.acquisitionCost === 'string' 
      ? parseFloat(asset.acquisitionCost) || 0
      : asset.acquisitionCost || 0;
    return sum + cost;
  }, 0) || 0;

  // Calcular estadísticas directamente desde los datos
  const activeAssets = assets?.filter(asset => asset.status === 'active').length || 0;
  const maintenanceAssets = assets?.filter(asset => asset.status === 'maintenance').length || 0;
  
  // Calcular activos por condición
  const assetsByCondition = assets?.reduce((acc: any, asset) => {
    acc[asset.condition] = (acc[asset.condition] || 0) + 1;
    return acc;
  }, {}) || {};
  
  // Calcular valores por categoría
  const assetsByCategory = assets?.reduce((acc: any, asset) => {
    const category = asset.categoryName || 'Sin categoría';
    const cost = typeof asset.acquisitionCost === 'string' 
      ? parseFloat(asset.acquisitionCost) || 0
      : asset.acquisitionCost || 0;
    
    if (!acc[category]) {
      acc[category] = { count: 0, totalValue: 0 };
    }
    acc[category].count += 1;
    acc[category].totalValue += cost;
    return acc;
  }, {}) || {};

  return (
    <AdminLayout>
      {/* Header con fondo coloreado */}
      <div 
        className="p-4 mb-6"
        style={{ backgroundColor: "#14b8a6" }}
      >
        <div className="flex items-center gap-2">
          <Tag className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white font-poppins">Dashboard de Activos</h1>
        </div>
        <p className="text-white mt-2">Panel de control y estadísticas de activos del parque</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
        <div className="flex space-x-2">
          <Button onClick={() => setLocation('/admin/assets/inventory')}>
            Ver Inventario
          </Button>
          <Button onClick={() => setLocation('/admin/assets/create')} variant="default">
            Agregar Activo
          </Button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Activos
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalAssets}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Activos Activos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : activeAssets}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalAssets > 0 ? `${Math.round((activeAssets / totalAssets) * 100)}% del total` : '0% del total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              En Mantenimiento
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : maintenanceAssets}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribución por condición */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Condición</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(assetsByCondition).map(([condition, count]) => (
                  <div key={condition} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{condition}</span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valor por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(assetsByCategory).map(([category, data]: [string, any]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category}</span>
                    <span className="font-medium">{formatCurrency(data.totalValue)}</span>
                  </div>
                ))}
                {Object.keys(assetsByCategory).length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AssetsDashboard;