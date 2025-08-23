import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminLayout from "@/components/AdminLayout";
import { useState } from "react";

const FinanceDashboard = () => {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [viewMode, setViewMode] = useState('monthly');
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/financial-dashboard/3"],
  });

  const { data: cashFlowData } = useQuery({
    queryKey: ["/api/cash-flow/3", selectedYear],
  });

  const { data: incomes } = useQuery({
    queryKey: ["/api/actual-incomes"],
  });

  const { data: expenses } = useQuery({
    queryKey: ["/api/actual-expenses"],
  });

  const { data: incomeCategories } = useQuery({
    queryKey: ["/api/income-categories"],
  });

  const { data: expenseCategories } = useQuery({
    queryKey: ["/api/expense-categories"],
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando dashboard financiero...</p>
        </div>
      </AdminLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Mock data for demonstration
  const mockData = {
    totalIncome: 2450000,
    totalExpenses: 1890000,
    netBalance: 560000,
    budgetExecuted: 78.5
  };

  // KPIs data
  const kpiData = [
    {
      title: "Ingresos Totales",
      value: formatCurrency(mockData.totalIncome),
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Egresos Totales", 
      value: formatCurrency(mockData.totalExpenses),
      change: "+8.2%",
      trend: "up",
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100"
    },
    {
      title: "Balance Neto",
      value: formatCurrency(mockData.netBalance),
      change: "+18.7%",
      trend: "up", 
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Presupuesto Ejecutado",
      value: `${mockData.budgetExecuted}%`,
      change: "+5.2%",
      trend: "up",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    }
  ];

  // Monthly trend data
  const monthlyTrendData = [
    { month: 'Ene', ingresos: 145000, egresos: 98000, anterior: 120000 },
    { month: 'Feb', ingresos: 167000, egresos: 112000, anterior: 135000 },
    { month: 'Mar', ingresos: 189000, egresos: 125000, anterior: 155000 },
    { month: 'Abr', ingresos: 203000, egresos: 134000, anterior: 178000 },
    { month: 'May', ingresos: 225000, egresos: 145000, anterior: 195000 },
    { month: 'Jun', ingresos: 248000, egresos: 156000, anterior: 210000 },
  ];

  const incomeDistributionData = [
    { name: 'Cuotas', value: 35, amount: 857500 },
    { name: 'Eventos', value: 25, amount: 612500 },
    { name: 'Concesiones', value: 20, amount: 490000 },
    { name: 'Donaciones', value: 15, amount: 367500 },
    { name: 'Otros', value: 5, amount: 122500 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con fondo coloreado */}
        <div 
          className="p-4 -mx-4 flex items-center justify-between"
          style={{ backgroundColor: "#14b8a6" }}
        >
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white font-poppins">
                Dashboard Financiero
              </h1>
              <p className="text-white">
                Gestión integral de finanzas del parque
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32 bg-white text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => {
            const IconComponent = kpi.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                      <div className="flex items-center space-x-1">
                        {kpi.trend === 'up' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {kpi.change}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tendencia Mensual
              </CardTitle>
              <CardDescription>
                Comparación de ingresos vs egresos por mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      labelStyle={{ color: '#374151' }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ingresos" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      name="Ingresos"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="egresos" 
                      stroke="#EF4444" 
                      strokeWidth={3}
                      name="Egresos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Income Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribución de Ingresos
              </CardTitle>
              <CardDescription>
                Participación por categoría de ingresos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name, props: any) => [
                        `${value}% (${formatCurrency(props.payload.amount)})`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {incomeDistributionData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Funciones principales del módulo financiero
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">Gestionar Ingresos</p>
                    <p className="text-sm text-gray-600">Registrar nuevos ingresos</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-medium">Gestionar Egresos</p>
                    <p className="text-sm text-gray-600">Registrar nuevos gastos</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">Flujo de Efectivo</p>
                    <p className="text-sm text-gray-600">Ver análisis detallado</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default FinanceDashboard;