import React, { useState } from 'react';
import { useLocation } from 'wouter';
import ROUTES from '@/routes';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftCircle, ArrowRightCircle, Plus, Calendar, ArrowLeft } from 'lucide-react';

const MaintenanceCalendarSimplePage = () => {
  const [_, setLocation] = useLocation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Datos de muestra para mantenimientos programados
  const sampleMaintenances = [
    {
      id: 1,
      assetId: 1,
      assetName: 'Banca Modelo Colonial',
      date: new Date(2023, 10, 15), // 15 de noviembre de 2023
      maintenanceType: 'Preventivo',
      description: 'Limpieza y aplicación de sellador',
      priority: 'medium'
    },
    {
      id: 2,
      assetId: 2,
      assetName: 'Juego Infantil Múltiple',
      date: new Date(2023, 10, 22), // 22 de noviembre de 2023
      maintenanceType: 'Correctivo',
      description: 'Reparación de tornillos sueltos',
      priority: 'high'
    },
    {
      id: 3,
      assetId: 3,
      assetName: 'Fuente Central',
      date: new Date(2023, 11, 5), // 5 de diciembre de 2023
      maintenanceType: 'Inspección',
      description: 'Revisión del sistema de bombeo',
      priority: 'low'
    },
    {
      id: 4,
      assetId: 1,
      assetName: 'Banca Modelo Colonial',
      date: new Date(2023, 11, 15), // 15 de diciembre de 2023
      maintenanceType: 'Preventivo',
      description: 'Aplicación de pintura',
      priority: 'medium'
    }
  ];
  
  // Navegar al mes anterior
  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Navegar al mes siguiente
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Navegar al mes actual
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };
  
  // Obtener días del mes actual
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });
  
  // Verificar si hay mantenimientos programados para una fecha
  const getMaintenancesForDay = (date: Date) => {
    return sampleMaintenances.filter(maintenance => 
      isSameDay(maintenance.date, date)
    );
  };
  
  // Manejar clic en un día
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    // Aquí podríamos abrir un diálogo para ver o programar mantenimientos
    console.log('Día seleccionado:', format(date, 'dd/MM/yyyy'));
    console.log('Mantenimientos:', getMaintenancesForDay(date));
  };
  
  // Determinar la clase CSS para un día en función de sus mantenimientos
  const getDayClass = (date: Date) => {
    const maintenances = getMaintenancesForDay(date);
    
    if (maintenances.length === 0) {
      return "bg-white hover:bg-blue-50";
    }
    
    // Verificar si hay mantenimientos de alta prioridad
    const hasHighPriority = maintenances.some(m => m.priority === 'high');
    
    if (hasHighPriority) {
      return "bg-red-50 hover:bg-red-100 border-red-200";
    }
    
    // Verificar si hay mantenimientos de prioridad media
    const hasMediumPriority = maintenances.some(m => m.priority === 'medium');
    
    if (hasMediumPriority) {
      return "bg-yellow-50 hover:bg-yellow-100 border-yellow-200";
    }
    
    // Si solo hay de prioridad baja
    return "bg-blue-50 hover:bg-blue-100 border-blue-200";
  };

  return (
    <AdminLayout>
      <div className="container py-6">
        {/* Header con patrón Card estandarizado */}
        <Card className="p-4 bg-gray-50 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-8 h-8 text-gray-900" />
                <h1 className="text-3xl font-bold text-gray-900">Calendario de Mantenimiento</h1>
              </div>
              <p className="text-gray-600 mt-2">
                Programa y visualiza el mantenimiento de activos por fechas
              </p>
            </div>
            <Button onClick={() => setLocation(ROUTES.admin.assets.maintenance.create)}>
              <Plus className="mr-2 h-4 w-4" />
              Programar Mantenimiento
            </Button>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de próximos mantenimientos */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Próximos Mantenimientos</CardTitle>
              <CardDescription>
                Mantenimientos pendientes ordenados por fecha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleMaintenances.length > 0 ? (
                  sampleMaintenances.slice(0, 5).map((maintenance, index) => (
                    <div key={index} className="border rounded-md p-3 bg-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{maintenance.assetName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(maintenance.date, 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <Badge className={
                          maintenance.priority === 'high' ? "bg-red-100 text-red-800" : 
                          maintenance.priority === 'medium' ? "bg-yellow-100 text-yellow-800" : 
                          "bg-blue-100 text-blue-800"
                        }>
                          {maintenance.priority === 'high' ? 'Alta' : 
                           maintenance.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm">{maintenance.maintenanceType}</p>
                        <p className="text-xs text-muted-foreground mt-1">{maintenance.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p>No hay mantenimientos programados próximamente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Calendario */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-lg">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ArrowLeftCircle className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
                  Hoy
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ArrowRightCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Cabecera de días de la semana */}
              <div className="grid grid-cols-7 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => (
                  <div key={index} className="text-center text-sm font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Rejilla del calendario */}
              <div className="grid grid-cols-7 gap-1">
                {/* Espacios en blanco para el primer día del mes */}
                {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square"></div>
                ))}
                
                {/* Días del mes */}
                {daysInMonth.map((day, index) => {
                  const maintenances = getMaintenancesForDay(day);
                  const dayClass = getDayClass(day);
                  
                  return (
                    <div
                      key={index}
                      className={`aspect-square border rounded-md relative p-1 cursor-pointer ${dayClass}`}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className="text-sm font-medium">
                        {format(day, 'd')}
                      </div>
                      
                      {/* Indicadores de mantenimientos */}
                      {maintenances.length > 0 && (
                        <div className="absolute bottom-1 right-1">
                          <Badge variant="outline" className="text-xs">
                            {maintenances.length}
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Leyenda */}
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-100 border border-red-200 mr-1"></div>
                  <span>Prioridad Alta</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200 mr-1"></div>
                  <span>Prioridad Media</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200 mr-1"></div>
                  <span>Prioridad Baja</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MaintenanceCalendarSimplePage;