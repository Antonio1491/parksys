import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Download, Printer, Calendar, Search, Filter, Scale } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';

export default function TrialBalance() {
  const [period, setPeriod] = useState(new Date().toISOString().split('T')[0].substring(0, 7)); // YYYY-MM format
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [natureFilter, setNatureFilter] = useState<string>('all');

  const { data: trialBalance, isLoading } = useQuery({
    queryKey: ['/api/accounting/trial-balance', period],
    enabled: true
  });



  const handleExport = () => {
    // Implementar exportación
    console.log('Exportando balanza...');
  };

  const handlePrint = () => {
    window.print();
  };

  // Datos simulados para mostrar la estructura
  const mockTrialBalance = [
    {
      id: 1,
      code: '1.1.001',
      name: 'Caja General',
      level: 3,
      nature: 'Deudor',
      previousBalance: 50000.00,
      debits: 125000.00,
      credits: 75000.00,
      currentBalance: 100000.00,
      balanceType: 'debit'
    },
    {
      id: 2,
      code: '1.1.002',
      name: 'Banco Santander',
      level: 3,
      nature: 'Deudor',
      previousBalance: 80000.00,
      debits: 200000.00,
      credits: 150000.00,
      currentBalance: 130000.00,
      balanceType: 'debit'
    },
    {
      id: 3,
      code: '1.2.001',
      name: 'Cuentas por Cobrar',
      level: 3,
      nature: 'Deudor',
      previousBalance: 25000.00,
      debits: 45000.00,
      credits: 30000.00,
      currentBalance: 40000.00,
      balanceType: 'debit'
    },
    {
      id: 4,
      code: '1.3.001',
      name: 'Inventario',
      level: 3,
      nature: 'Deudor',
      previousBalance: 60000.00,
      debits: 85000.00,
      credits: 70000.00,
      currentBalance: 75000.00,
      balanceType: 'debit'
    },
    {
      id: 5,
      code: '2.1.001',
      name: 'Cuentas por Pagar',
      level: 3,
      nature: 'Acreedor',
      previousBalance: 35000.00,
      debits: 25000.00,
      credits: 50000.00,
      currentBalance: 60000.00,
      balanceType: 'credit'
    },
    {
      id: 6,
      code: '2.2.001',
      name: 'Impuestos por Pagar',
      level: 3,
      nature: 'Acreedor',
      previousBalance: 15000.00,
      debits: 10000.00,
      credits: 20000.00,
      currentBalance: 25000.00,
      balanceType: 'credit'
    },
    {
      id: 7,
      code: '3.1.001',
      name: 'Capital Social',
      level: 3,
      nature: 'Acreedor',
      previousBalance: 200000.00,
      debits: 0.00,
      credits: 0.00,
      currentBalance: 200000.00,
      balanceType: 'credit'
    },
    {
      id: 8,
      code: '4.1.001',
      name: 'Ingresos por Servicios',
      level: 3,
      nature: 'Acreedor',
      previousBalance: 0.00,
      debits: 20000.00,
      credits: 95000.00,
      currentBalance: 75000.00,
      balanceType: 'credit'
    },
    {
      id: 9,
      code: '5.1.001',
      name: 'Gastos de Administración',
      level: 3,
      nature: 'Deudor',
      previousBalance: 0.00,
      debits: 45000.00,
      credits: 5000.00,
      currentBalance: 40000.00,
      balanceType: 'debit'
    },
    {
      id: 10,
      code: '5.2.001',
      name: 'Gastos de Venta',
      level: 3,
      nature: 'Deudor',
      previousBalance: 0.00,
      debits: 30000.00,
      credits: 3000.00,
      currentBalance: 27000.00,
      balanceType: 'debit'
    }
  ];

  // Calcular totales
  const totals = {
    previousBalance: {
      debit: mockTrialBalance.filter(item => item.balanceType === 'debit').reduce((sum, item) => sum + item.previousBalance, 0),
      credit: mockTrialBalance.filter(item => item.balanceType === 'credit').reduce((sum, item) => sum + item.previousBalance, 0)
    },
    movements: {
      debit: mockTrialBalance.reduce((sum, item) => sum + item.debits, 0),
      credit: mockTrialBalance.reduce((sum, item) => sum + item.credits, 0)
    },
    currentBalance: {
      debit: mockTrialBalance.filter(item => item.balanceType === 'debit').reduce((sum, item) => sum + item.currentBalance, 0),
      credit: mockTrialBalance.filter(item => item.balanceType === 'credit').reduce((sum, item) => sum + item.currentBalance, 0)
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getRowColor = (nature: string) => {
    return nature === 'Deudor' ? 'bg-blue-50' : 'bg-green-50';
  };

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
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
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
              <Scale className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">Balanza</h1>
            </div>
            <p className="text-gray-600 mt-2">Estado de saldos y movimientos contables</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handlePrint} className="flex items-center space-x-2">
              <Printer className="h-4 w-4" />
              <span>Imprimir</span>
            </Button>
            <Button variant="outline" onClick={handleExport} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
          </div>
        </div>

        {/* Controles de Período y Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Parámetros y Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Período</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="month"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Buscar Cuenta</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por código o nombre..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Nivel</label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los niveles</SelectItem>
                    <SelectItem value="1">Nivel 1</SelectItem>
                    <SelectItem value="2">Nivel 2</SelectItem>
                    <SelectItem value="3">Nivel 3</SelectItem>
                    <SelectItem value="4">Nivel 4</SelectItem>
                    <SelectItem value="5">Nivel 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Naturaleza</label>
                <Select value={natureFilter} onValueChange={setNatureFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las naturalezas</SelectItem>
                    <SelectItem value="Deudor">Deudor</SelectItem>
                    <SelectItem value="Acreedor">Acreedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Período */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <strong>Período seleccionado:</strong> {new Date(period + '-01').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
              </div>
              <div>
                <strong>Fecha de generación:</strong> {new Date().toLocaleDateString('es-MX')}
              </div>
              <div>
                <strong>Total de cuentas:</strong> {mockTrialBalance.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balanza de Comprobación */}
        <Card>
          <CardHeader>
            <CardTitle>Balanza de Comprobación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left p-3 font-semibold">Código</th>
                    <th className="text-left p-3 font-semibold">Nombre de la Cuenta</th>
                    <th className="text-center p-3 font-semibold">Naturaleza</th>
                    <th className="text-center p-3 font-semibold">Saldo Anterior</th>
                    <th className="text-center p-3 font-semibold">Movimientos</th>
                    <th className="text-center p-3 font-semibold"></th>
                    <th className="text-center p-3 font-semibold">Saldo Actual</th>
                    <th className="text-center p-3 font-semibold"></th>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <th className="p-2"></th>
                    <th className="p-2"></th>
                    <th className="p-2"></th>
                    <th className="p-2"></th>
                    <th className="text-center p-2 text-xs font-medium">Debe</th>
                    <th className="text-center p-2 text-xs font-medium">Haber</th>
                    <th className="text-center p-2 text-xs font-medium">Deudor</th>
                    <th className="text-center p-2 text-xs font-medium">Acreedor</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTrialBalance.map((account) => (
                    <tr key={account.id} className={`border-b hover:bg-gray-50 ${getRowColor(account.nature)}`}>
                      <td className="p-3 font-mono text-sm">{account.code}</td>
                      <td className="p-3 font-medium">{account.name}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          account.nature === 'Deudor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {account.nature}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">
                        {account.previousBalance > 0 ? formatCurrency(account.previousBalance) : '-'}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {account.debits > 0 ? formatCurrency(account.debits) : '-'}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {account.credits > 0 ? formatCurrency(account.credits) : '-'}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {account.balanceType === 'debit' ? formatCurrency(account.currentBalance) : '-'}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {account.balanceType === 'credit' ? formatCurrency(account.currentBalance) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-400 bg-gray-100 font-bold">
                    <td className="p-3" colSpan={3}>TOTALES</td>
                    <td className="p-3 text-right font-mono">
                      {formatCurrency(totals.previousBalance.debit + totals.previousBalance.credit)}
                    </td>
                    <td className="p-3 text-right font-mono text-blue-600">
                      {formatCurrency(totals.movements.debit)}
                    </td>
                    <td className="p-3 text-right font-mono text-green-600">
                      {formatCurrency(totals.movements.credit)}
                    </td>
                    <td className="p-3 text-right font-mono text-blue-600">
                      {formatCurrency(totals.currentBalance.debit)}
                    </td>
                    <td className="p-3 text-right font-mono text-green-600">
                      {formatCurrency(totals.currentBalance.credit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Validación */}
        <Card>
          <CardHeader>
            <CardTitle>Validación de Balanza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Equilibrio de Movimientos</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Total Debe:</span>
                    <span className="font-mono">{formatCurrency(totals.movements.debit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Haber:</span>
                    <span className="font-mono">{formatCurrency(totals.movements.credit)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span>Diferencia:</span>
                    <span className={`font-mono ${totals.movements.debit === totals.movements.credit ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(totals.movements.debit - totals.movements.credit))}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Equilibrio de Saldos</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Saldos Deudores:</span>
                    <span className="font-mono">{formatCurrency(totals.currentBalance.debit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saldos Acreedores:</span>
                    <span className="font-mono">{formatCurrency(totals.currentBalance.credit)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span>Diferencia:</span>
                    <span className={`font-mono ${totals.currentBalance.debit === totals.currentBalance.credit ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(totals.currentBalance.debit - totals.currentBalance.credit))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-green-800 font-medium">
                  {totals.movements.debit === totals.movements.credit ? 
                    'Balanza cuadrada correctamente' : 
                    'Advertencia: La balanza no cuadra - Revisar asientos contables'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}