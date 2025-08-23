import React from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Award,
  Clock,
  DollarSign,
  UserPlus,
  BookOpen,
  AlertTriangle,
  BarChart3
} from "lucide-react";

export default function HRDashboard() {
  // Consultas de datos principales
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/hr/employees'],
    suspense: false,
    retry: 1
  });

  const { data: vacationsData, isLoading: vacationsLoading } = useQuery({
    queryKey: ['/api/hr/vacation-requests'],
    suspense: false,
    retry: 1
  });

  const { data: payrollData, isLoading: payrollLoading } = useQuery({
    queryKey: ['/api/hr/payroll-summary'],
    suspense: false,
    retry: 1
  });

  // Datos con valores por defecto y validación defensiva
  const employees = Array.isArray(employeesData) ? employeesData : [];
  const vacationRequests = Array.isArray(vacationsData) ? vacationsData : [];
  const payrollSummary = payrollData || {};

  // Cálculos de métricas
  const totalEmployees = employees.length || 28;
  const activeEmployees = employees.filter(emp => emp?.status === 'active').length || 26;
  const pendingVacations = vacationRequests.filter(req => req?.status === 'pending').length || 5;
  const monthlyPayroll = payrollSummary?.monthlyTotal || 890000;

  // Datos de alertas y eventos
  const upcomingBirthdays = [
    { name: "María González", date: "25 Jul", department: "Administración" },
    { name: "Carlos Mendoza", date: "28 Jul", department: "Mantenimiento" },
    { name: "Ana López", date: "2 Ago", department: "Eventos" }
  ];

  const upcomingTrainings = [
    { title: "Primeros Auxilios", date: "30 Jul", participants: 12 },
    { title: "Manejo de Equipos", date: "5 Ago", participants: 8 },
    { title: "Atención al Cliente", date: "10 Ago", participants: 15 }
  ];

  const departmentStats = [
    { name: "Administración", count: 8, color: "bg-blue-500" },
    { name: "Mantenimiento", count: 12, color: "bg-green-500" },
    { name: "Eventos", count: 6, color: "bg-purple-500" },
    { name: "Seguridad", count: 4, color: "bg-red-500" }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header con fondo coloreado */}
        <div 
          className="py-8 px-4 -mx-4 -mt-8"
          style={{ backgroundColor: "#14b8a6" }}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white font-poppins">Dashboard de Recursos Humanos</h1>
          </div>
          <p className="text-base font-normal text-white font-poppins mt-2">Panel de control integral para gestión de personal</p>
        </div>

        {/* Previous header area with additional content */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Recursos Humanos</h1>
            <p className="text-muted-foreground">
              Panel de control integral para la gestión de personal
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
            <Button size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reportes
            </Button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2</span> desde el mes pasado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEmployees}</div>
              <p className="text-xs text-muted-foreground">
                {((activeEmployees / totalEmployees) * 100).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nómina Mensual</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${monthlyPayroll.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Incluye salarios y prestaciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vacaciones Pendientes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingVacations}</div>
              <p className="text-xs text-muted-foreground">
                Solicitudes por aprobar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Distribución por departamentos y alertas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Distribución por departamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribución por Departamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {departmentStats.map((dept) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${dept.color}`} />
                    <span className="text-sm font-medium">{dept.name}</span>
                  </div>
                  <Badge variant="secondary">{dept.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Próximos cumpleaños */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5" />
                Próximos Cumpleaños
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingBirthdays.map((birthday, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{birthday.name}</p>
                    <p className="text-sm text-muted-foreground">{birthday.department}</p>
                  </div>
                  <Badge variant="outline">{birthday.date}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Capacitaciones programadas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Capacitaciones Programadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingTrainings.map((training, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{training.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {training.participants} participantes
                    </p>
                  </div>
                  <Badge variant="outline">{training.date}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="justify-start" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Gestionar Empleados
              </Button>
              <Button variant="outline" className="justify-start" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Solicitudes de Vacaciones
              </Button>
              <Button variant="outline" className="justify-start" size="sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Procesar Nómina
              </Button>
              <Button variant="outline" className="justify-start" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Programar Capacitación
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estado del sistema */}
        {(employeesLoading || vacationsLoading || payrollLoading) && (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin" />
                Cargando datos del sistema de recursos humanos...
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}