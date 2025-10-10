import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, Download } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';

export default function FinancialStatements() {
  const [cutoffDate, setCutoffDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { data: balanceSheet, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['/api/accounting/balance-sheet', cutoffDate],
    enabled: true
  });

  const { data: incomeStatement, isLoading: isLoadingIncome } = useQuery({
    queryKey: ['/api/accounting/income-statement', cutoffDate],
    enabled: true
  });



  const handleExportPDF = () => {
    console.log('Exportando estados financieros a PDF...');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Datos simulados para Balance General
  const mockBalanceSheet = {
    assets: {
      current: [
        { name: 'Caja General', balance: 150000.00 },
        { name: 'Banco Santander', balance: 280000.00 },
        { name: 'Cuentas por Cobrar', balance: 75000.00 },
        { name: 'Inventario', balance: 120000.00 }
      ],
      fixed: [
        { name: 'Edificios', balance: 1200000.00 },
        { name: 'Equipo de Oficina', balance: 85000.00 },
        { name: 'Vehículos', balance: 320000.00 },
        { name: 'Depreciación Acumulada', balance: -180000.00 }
      ]
    },
    liabilities: {
      current: [
        { name: 'Cuentas por Pagar', balance: 95000.00 },
        { name: 'Impuestos por Pagar', balance: 45000.00 },
        { name: 'Nómina por Pagar', balance: 65000.00 }
      ],
      longTerm: [
        { name: 'Préstamos Bancarios', balance: 450000.00 },
        { name: 'Obligaciones Laborales', balance: 85000.00 }
      ]
    },
    equity: [
      { name: 'Capital Social', balance: 800000.00 },
      { name: 'Utilidades Retenidas', balance: 225000.00 },
      { name: 'Utilidad del Ejercicio', balance: 85000.00 }
    ]
  };

  // Datos simulados para Estado de Resultados
  const mockIncomeStatement = {
    revenue: [
      { name: 'Ingresos por Servicios', amount: 650000.00 },
      { name: 'Ingresos por Concesiones', amount: 180000.00 },
      { name: 'Ingresos por Eventos', amount: 95000.00 }
    ],
    expenses: {
      operating: [
        { name: 'Sueldos y Salarios', amount: 350000.00 },
        { name: 'Servicios Públicos', amount: 65000.00 },
        { name: 'Mantenimiento', amount: 45000.00 },
        { name: 'Materiales y Suministros', amount: 85000.00 }
      ],
      administrative: [
        { name: 'Gastos de Oficina', amount: 25000.00 },
        { name: 'Seguros', amount: 18000.00 },
        { name: 'Depreciación', amount: 35000.00 }
      ]
    }
  };

  // Cálculos para Balance General
  const currentAssets = mockBalanceSheet.assets.current.reduce((sum, item) => sum + item.balance, 0);
  const fixedAssets = mockBalanceSheet.assets.fixed.reduce((sum, item) => sum + item.balance, 0);
  const totalAssets = currentAssets + fixedAssets;

  const currentLiabilities = mockBalanceSheet.liabilities.current.reduce((sum, item) => sum + item.balance, 0);
  const longTermLiabilities = mockBalanceSheet.liabilities.longTerm.reduce((sum, item) => sum + item.balance, 0);
  const totalLiabilities = currentLiabilities + longTermLiabilities;

  const totalEquity = mockBalanceSheet.equity.reduce((sum, item) => sum + item.balance, 0);

  // Cálculos para Estado de Resultados
  const totalRevenue = mockIncomeStatement.revenue.reduce((sum, item) => sum + item.amount, 0);
  const operatingExpenses = mockIncomeStatement.expenses.operating.reduce((sum, item) => sum + item.amount, 0);
  const administrativeExpenses = mockIncomeStatement.expenses.administrative.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = operatingExpenses + administrativeExpenses;
  const netIncome = totalRevenue - totalExpenses;

  if (isLoadingBalance || isLoadingIncome) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
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
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">Estados Financieros</h1>
            </div>
            <p className="text-gray-600 mt-2">Balance General y Estado de Resultados</p>
          </div>
          <Button onClick={handleExportPDF} className="flex items-center space-x-2 bg-[#00a587] hover:bg-[#067f5f]">
            <Download className="h-4 w-4" />
            <span>Exportar PDF</span>
          </Button>
        </div>

        {/* Configuración del Reporte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Configuración del Reporte
            </CardTitle>
            <p className="text-sm text-gray-600">Selecciona la fecha de corte para generar los estados financieros</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1 max-w-xs">
                <label className="text-sm font-medium mb-2 block">Fecha de Corte</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={cutoffDate}
                    onChange={(e) => setCutoffDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Estados Financieros */}
        <Tabs defaultValue="balance-sheet" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="balance-sheet">Balance General</TabsTrigger>
            <TabsTrigger value="income-statement">Estado de Resultados</TabsTrigger>
          </TabsList>

          {/* Balance General */}
          <TabsContent value="balance-sheet" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Balance General</CardTitle>
                <p className="text-sm text-gray-600">Al {new Date(cutoffDate).toLocaleDateString('es-MX')}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8">
                  {/* ACTIVOS */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#00a587] mb-4">ACTIVOS</h3>
                    
                    {/* Activos Circulantes */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Activos Circulantes</h4>
                      <div className="space-y-1">
                        {mockBalanceSheet.assets.current.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="pl-4">{item.name}</span>
                            <span className="font-mono">{formatCurrency(item.balance)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span>Total Activos Circulantes</span>
                          <span className="font-mono">{formatCurrency(currentAssets)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Activos Fijos */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Activos Fijos</h4>
                      <div className="space-y-1">
                        {mockBalanceSheet.assets.fixed.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="pl-4">{item.name}</span>
                            <span className="font-mono">{formatCurrency(item.balance)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span>Total Activos Fijos</span>
                          <span className="font-mono">{formatCurrency(fixedAssets)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between border-t-2 pt-2 font-bold text-lg">
                      <span>TOTAL ACTIVOS</span>
                      <span className="font-mono">{formatCurrency(totalAssets)}</span>
                    </div>
                  </div>

                  {/* PASIVOS Y PATRIMONIO */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#00a587] mb-4">PASIVOS Y PATRIMONIO</h3>
                    
                    {/* Pasivos */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Pasivos</h4>
                      
                      {/* Pasivos Circulantes */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium mb-1">Pasivos Circulantes</h5>
                        <div className="space-y-1">
                          {mockBalanceSheet.liabilities.current.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="pl-4">{item.name}</span>
                              <span className="font-mono">{formatCurrency(item.balance)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pasivos a Largo Plazo */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium mb-1">Pasivos a Largo Plazo</h5>
                        <div className="space-y-1">
                          {mockBalanceSheet.liabilities.longTerm.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="pl-4">{item.name}</span>
                              <span className="font-mono">{formatCurrency(item.balance)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between border-t pt-1 font-medium">
                        <span>Total Pasivos</span>
                        <span className="font-mono">{formatCurrency(totalLiabilities)}</span>
                      </div>
                    </div>

                    {/* Patrimonio */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Patrimonio</h4>
                      <div className="space-y-1">
                        {mockBalanceSheet.equity.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="pl-4">{item.name}</span>
                            <span className="font-mono">{formatCurrency(item.balance)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span>Total Patrimonio</span>
                          <span className="font-mono">{formatCurrency(totalEquity)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between border-t-2 pt-2 font-bold text-lg">
                      <span>TOTAL PASIVOS + PATRIMONIO</span>
                      <span className="font-mono">{formatCurrency(totalLiabilities + totalEquity)}</span>
                    </div>
                  </div>
                </div>

                {/* Validación de Equilibrio */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Validación de Equilibrio:</span>
                    <span className={`font-mono ${totalAssets === (totalLiabilities + totalEquity) ? 'text-green-600' : 'text-red-600'}`}>
                      {totalAssets === (totalLiabilities + totalEquity) ? 
                        'Balance cuadrado correctamente' : 
                        `Diferencia: ${formatCurrency(Math.abs(totalAssets - (totalLiabilities + totalEquity)))}`
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estado de Resultados */}
          <TabsContent value="income-statement" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Resultados</CardTitle>
                <p className="text-sm text-gray-600">Del 1 de enero al {new Date(cutoffDate).toLocaleDateString('es-MX')}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* INGRESOS */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#00a587] mb-4">INGRESOS</h3>
                    <div className="space-y-1">
                      {mockIncomeStatement.revenue.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="pl-4">{item.name}</span>
                          <span className="font-mono">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t pt-1 font-medium">
                        <span>Total Ingresos</span>
                        <span className="font-mono">{formatCurrency(totalRevenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* GASTOS */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#00a587] mb-4">GASTOS</h3>
                    
                    {/* Gastos Operativos */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Gastos Operativos</h4>
                      <div className="space-y-1">
                        {mockIncomeStatement.expenses.operating.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="pl-4">{item.name}</span>
                            <span className="font-mono">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span>Total Gastos Operativos</span>
                          <span className="font-mono">{formatCurrency(operatingExpenses)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Gastos Administrativos */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Gastos Administrativos</h4>
                      <div className="space-y-1">
                        {mockIncomeStatement.expenses.administrative.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="pl-4">{item.name}</span>
                            <span className="font-mono">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between border-t pt-1 font-medium">
                          <span>Total Gastos Administrativos</span>
                          <span className="font-mono">{formatCurrency(administrativeExpenses)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between border-t pt-1 font-medium">
                      <span>Total Gastos</span>
                      <span className="font-mono">{formatCurrency(totalExpenses)}</span>
                    </div>
                  </div>

                  {/* UTILIDAD NETA */}
                  <div className="border-t-2 pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>UTILIDAD NETA</span>
                      <span className={`font-mono ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(netIncome)}
                      </span>
                    </div>
                  </div>

                  {/* Análisis de Rentabilidad */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Análisis de Rentabilidad</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Margen Bruto:</span>
                        <div className="font-mono">{((totalRevenue - operatingExpenses) / totalRevenue * 100).toFixed(2)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Margen Operativo:</span>
                        <div className="font-mono">{((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(2)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Margen Neto:</span>
                        <div className="font-mono">{(netIncome / totalRevenue * 100).toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}