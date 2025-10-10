import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { 
  DollarSign, 
  Building, 
  BookOpen, 
  Scale, 
  FileText, 
  Settings, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Zap,
  ArrowLeft
} from 'lucide-react';

export default function AccountingDashboard() {
  const [, setLocation] = useLocation();
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/accounting/dashboard'],
    enabled: true
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-gray-900" />
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <p className="text-gray-600 mt-2">
          Sistema Contable Integral Automatizado
        </p>
      </div>

      {/* Módulos Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gestión de Efectivo */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestión de Efectivo</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Control centralizado de recursos financieros y transferencias entre centros
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/admin/accounting/cash-management')}
                  className="w-full"
                >
                  Acceder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activos Fijos */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Activos Fijos</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Registra y controla activos fijos con depreciación automática
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/admin/accounting/fixed-assets')}
                  className="w-full"
                >
                  Acceder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asientos Contables */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Asientos Contables</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Libro diario con débitos y créditos balanceados
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/admin/accounting/journal-entries')}
                  className="w-full"
                >
                  Acceder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance de Comprobación */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <Scale className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Balanza</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Balances por cuenta y período contable
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/admin/accounting/trial-balance')}
                  className="w-full"
                >
                  Acceder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estados Financieros */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Estados Financieros</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Balance General y Estado de Resultados con datos reales
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/admin/accounting/financial-statements')}
                  className="w-full"
                >
                  Acceder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración Contable */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración Contable</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Parámetros y configuraciones del sistema contable
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/admin/accounting/settings')}
                  className="w-full"
                >
                  Acceder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secciones Informativas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Beneficios del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-teal-700">
              <TrendingUp className="h-5 w-5 mr-2" />
              Beneficios del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Estados Financieros Reales</p>
                <p className="text-sm text-gray-600">Balance General y P&L con datos auténticos, no ficticios</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Automatización</p>
                <p className="text-sm text-gray-600">Las transacciones generan asientos contables automáticamente</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Cumplimiento</p>
                <p className="text-sm text-gray-600">Plan de cuentas estándar y balances siempre cuadrados</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Control de Activos</p>
                <p className="text-sm text-gray-600">Depreciación automática y valores actualizados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flujo de Datos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <BarChart3 className="h-5 w-5 mr-2" />
              Flujo de Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Se registra una transacción en el módulo financiero</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Sistema genera asiento contable automáticamente</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-green-600">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Saldos de cuentas se actualizan en tiempo real</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-orange-600">4</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Reportes financieros reflejan datos reales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminLayout>
  );
}