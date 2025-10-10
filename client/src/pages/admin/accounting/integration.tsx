import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  Database, 
  Link, 
  Activity,
  BarChart3,
  Wallet,
  CreditCard
} from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';

export default function AccountingIntegration() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const { data: integrationStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/accounting/integration/stats'],
    refetchInterval: false, // DEPLOYMENT FIX: Disabled polling to prevent deployment hanging
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest('/api/accounting/integration/sync', {
      method: 'POST',
      body: JSON.stringify({})
    }),
    onSuccess: () => {
      toast({
        title: "Sincronización completada",
        description: "Todas las transacciones financieras han sido sincronizadas exitosamente"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/integration/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error en sincronización",
        description: error.message || "No se pudo completar la sincronización",
        variant: "destructive"
      });
    }
  });

  const categorySyncMutation = useMutation({
    mutationFn: () => apiRequest('/api/accounting/sync-financial-categories', {
      method: 'POST',
      body: JSON.stringify({})
    }),
    onSuccess: () => {
      toast({
        title: "Categorías sincronizadas",
        description: "Las categorías financieras se han actualizado con las categorías contables"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/integration/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error sincronizando categorías",
        description: error.message || "No se pudo sincronizar las categorías",
        variant: "destructive"
      });
    }
  });

  const stats = integrationStats?.stats || {
    incomes: { total: 0, synced: 0 },
    expenses: { total: 0, synced: 0 },
    entries: { total: 0 }
  };

  const totalTransactions = stats.incomes.total + stats.expenses.total;
  const totalSynced = stats.incomes.synced + stats.expenses.synced;
  const syncPercentage = totalTransactions > 0 ? (totalSynced / totalTransactions) * 100 : 0;

  const incomesSyncPercentage = stats.incomes.total > 0 ? (stats.incomes.synced / stats.incomes.total) * 100 : 0;
  const expensesSyncPercentage = stats.expenses.total > 0 ? (stats.expenses.synced / stats.expenses.total) * 100 : 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Integración Contable-Financiera</h1>
            <p className="text-gray-600">Sincronización automática entre módulos contables y financieros</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/accounting/integration/stats'] });
                toast({
                  title: "Estado actualizado",
                  description: "Verificando estado actual de la integración"
                });
              }}
              disabled={statsLoading}
              variant="outline"
            >
              <Activity className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
              {statsLoading ? 'Verificando...' : 'Verificar Estado'}
            </Button>
            <Button
              onClick={() => categorySyncMutation.mutate()}
              disabled={categorySyncMutation.isPending}
              variant="outline"
            >
              <Database className="h-4 w-4 mr-2" />
              {categorySyncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Categorías'}
            </Button>
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              variant="default"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Transacciones'}
            </Button>
          </div>
        </div>

        {/* Alerta de integración automática */}
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>🔄 Integración Automática Activa:</strong> Las transacciones contables se procesan automáticamente al crearse, 
            generando asientos contables y actualizando la matriz de flujo de efectivo en tiempo real.
          </AlertDescription>
        </Alert>

        {/* Estado de integración */}
        <Alert className={syncPercentage === 100 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                {syncPercentage === 100 
                  ? '✅ Todas las transacciones financieras están sincronizadas con contabilidad'
                  : `⚠️ ${totalTransactions - totalSynced} transacciones pendientes de sincronización`
                }
              </span>
              <Badge variant={syncPercentage === 100 ? 'default' : 'secondary'}>
                {syncPercentage.toFixed(1)}% sincronizado
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transacciones</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.incomes.total} ingresos • {stats.expenses.total} gastos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transacciones Sincronizadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalSynced}</div>
              <p className="text-xs text-muted-foreground">
                {stats.incomes.synced} ingresos • {stats.expenses.synced} gastos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asientos Contables</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.entries.total}</div>
              <p className="text-xs text-muted-foreground">
                Generados automáticamente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Porcentaje de Sincronización</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{syncPercentage.toFixed(1)}%</div>
              <Progress value={syncPercentage} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Detalles por módulo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ingresos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Módulo de Ingresos
              </CardTitle>
              <CardDescription>
                Estado de sincronización de ingresos financieros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Transacciones totales</span>
                <Badge variant="outline">{stats.incomes.total}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sincronizadas</span>
                <Badge variant="default">{stats.incomes.synced}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso de sincronización</span>
                  <span>{incomesSyncPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={incomesSyncPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Gastos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                Módulo de Gastos
              </CardTitle>
              <CardDescription>
                Estado de sincronización de gastos financieros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Transacciones totales</span>
                <Badge variant="outline">{stats.expenses.total}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sincronizadas</span>
                <Badge variant="default">{stats.expenses.synced}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso de sincronización</span>
                  <span>{expensesSyncPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={expensesSyncPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flujo de integración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Link className="h-5 w-5 mr-2" />
              Flujo de Integración
            </CardTitle>
            <CardDescription>
              Proceso automático de sincronización entre módulos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">Módulo Financiero</p>
                    <p className="text-sm text-gray-600">Transacciones de ingresos y gastos</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400" />
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">Módulo Contable</p>
                    <p className="text-sm text-gray-600">Asientos contables automáticos</p>
                  </div>
                </div>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Sincronización automática
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}