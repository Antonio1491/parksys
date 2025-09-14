import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package, TrendingUp, TrendingDown } from "lucide-react";

export default function WarehouseDashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/warehouse/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/warehouse/dashboard');
      if (!response.ok) throw new Error('Error al cargar dashboard del almacén');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard del Almacén</h1>
          <p className="text-muted-foreground">Vista general del inventario y movimientos</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const summary = dashboardData?.summary || {};

  return (
    <div className="space-y-6" data-testid="warehouse-dashboard">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard del Almacén</h1>
        <p className="text-muted-foreground">Vista general del inventario y movimientos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consumibles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-consumables">
              {summary.totalConsumables || 0}
            </div>
            <p className="text-xs text-muted-foreground">Productos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-categories">
              {summary.totalCategories || 0}
            </div>
            <p className="text-xs text-muted-foreground">Categorías activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="low-stock-count">
              {summary.lowStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requieren reabastecimiento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimientos Recientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="recent-movements">
              {summary.recentMovements || 0}
            </div>
            <p className="text-xs text-muted-foreground">Últimos 7 días</p>
          </CardContent>
        </Card>
      </div>

      {dashboardData?.lowStockItems?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alertas de Stock Bajo
            </CardTitle>
            <CardDescription>
              Productos que requieren reabastecimiento inmediato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2" data-testid="low-stock-alerts">
              {dashboardData.lowStockItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{item.consumableName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.parkName} • {item.consumableCode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      <span className="font-medium text-destructive">{item.currentStock}</span>
                      <span className="text-muted-foreground"> / {item.minimumStock} {item.unitOfMeasure}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}