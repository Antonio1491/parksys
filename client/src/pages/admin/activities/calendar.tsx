import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminLayout from '@/components/AdminLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  MapPin,
  Clock,
  User,
  CreditCard,
  Calendar as CalendarIconSimple,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// Tipo para las actividades
interface Activity {
  id: number;
  title: string;
  description?: string;
  parkId: number;
  parkName?: string;
  startDate: string;
  endDate?: string;
  category?: string;
  categoryName?: string;
  categoryId?: number;
  instructorId?: number;
  instructor?: {
    id: number;
    fullName: string;
  } | null;
  price?: number;
  location?: string;
}

// Tipo para las categorías
interface ActivityCategory {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

// Tipo para instructores
interface Instructor {
  id: number;
  fullName: string;
  email?: string;
}

// Función para obtener colores basados en el color de la categoría
const getCategoryColors = (categoryColor?: string): string => {
  if (!categoryColor) return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  
  // Convertir el color hex a clases de Tailwind
  switch (categoryColor) {
    case '#e74c3c': // Deportivo - rojo
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case '#2ecc71': // Recreación y Bienestar - verde
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case '#9b59b6': // Arte y Cultura - púrpura
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case '#27ae60': // Naturaleza y Ciencia - verde oscuro
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
    case '#3498db': // Comunidad - azul
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case '#f39c12': // Eventos de Temporada - naranja
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    case '#ffea00': // Categoria Prueba Luis - amarillo
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

export default function ActivitiesCalendarPage() {
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    parkId: 'all',
    instructorId: 'all',
    isFree: 'all',
  });

  // Obtener actividades
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['/api/activities'],
    retry: 1,
  });

  // Obtener categorías para filtro
  const { data: categories = [] } = useQuery<ActivityCategory[]>({
    queryKey: ['/api/activity-categories'],
    retry: 1,
  });

  // Obtener parques para filtro
  const { data: parks = [] } = useQuery({
    queryKey: ['/api/parks'],
    retry: 1,
  });

  // Obtener instructores para filtro
  const { data: instructors = [] } = useQuery<Instructor[]>({
    queryKey: ['/api/instructors'],
    retry: 1,
  });

  // Crear mapa de colores por categoría
  const categoryColorMap = React.useMemo(() => {
    const colorMap: Record<string, string> = {};
    if (Array.isArray(categories)) {
      categories.forEach((category) => {
        colorMap[category.name] = getCategoryColors(category.color);
      });
    }
    return colorMap;
  }, [categories]);

  // Función para filtrar actividades
  const filteredActivities = React.useMemo(() => {
    const activitiesArray = Array.isArray(activities) ? activities : [];
    
    return activitiesArray.filter((activity: Activity) => {
      // Filtro por categoría
      const matchesCategory = filters.category === 'all' || activity.categoryName === filters.category;
      
      // Filtro por parque
      const matchesPark = filters.parkId === 'all' || activity.parkId === parseInt(filters.parkId);
      
      // Filtro por instructor
      const matchesInstructor = filters.instructorId === 'all' || activity.instructorId === parseInt(filters.instructorId);
      
      // Filtro por precio (gratuita o de pago)
      const matchesFree = filters.isFree === 'all' || 
        (filters.isFree === 'free' && (!activity.price || activity.price === 0)) ||
        (filters.isFree === 'paid' && activity.price && activity.price > 0);
      
      return matchesCategory && matchesPark && matchesInstructor && matchesFree;
    });
  }, [activities, filters]);

  // Obtener días del mes actual
  const daysInMonth = React.useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInterval = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Calcular el día de la semana del primer día del mes (0-6, 0 es domingo)
    const startDay = getDay(monthStart);
    
    // Agregar días vacíos al principio para alinear correctamente
    const emptyDays = Array(startDay).fill(null);
    
    return [...emptyDays, ...daysInterval];
  }, [currentDate]);



  // Obtener actividades para un día específico
  const getActivitiesForDay = (day: Date | null) => {
    if (!day || !filteredActivities) return [];
    
    const dayString = format(day, 'yyyy-MM-dd');
    
    return filteredActivities.filter((activity: Activity) => {
      const activityStartDate = activity.startDate ? activity.startDate.substring(0, 10) : null;
      return activityStartDate === dayString;
    });
  };

  // Navegar al mes anterior
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  // Navegar al mes siguiente
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Navegar al mes actual
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Función para renderizar una celda del calendario
  const renderCalendarDay = (day: Date | null, index: number) => {
    if (!day) {
      return <div key={`empty-${index}`} className="h-28 bg-gray-50 border border-gray-200"></div>;
    }
    
    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    const dayActivities = getActivitiesForDay(day);
    
    return (
      <div 
        key={format(day, 'yyyy-MM-dd')}
        className={cn(
          "h-28 min-h-[7rem] border border-gray-200 p-1 overflow-hidden",
          isToday ? "bg-blue-50" : "bg-white",
          isSelected ? "ring-2 ring-blue-400 ring-inset" : ""
        )}
        onClick={() => setSelectedDate(day)}
      >
        <div className="flex justify-between">
          <span className={cn(
            "text-sm font-medium",
            isToday ? "text-blue-600" : ""
          )}>
            {format(day, 'd')}
          </span>
          <span className="text-xs text-gray-500">
            {format(day, 'EEE', { locale: es })}
          </span>
        </div>
        <div className="mt-1 space-y-1 overflow-y-auto max-h-20">
          {dayActivities.slice(0, 3).map((activity: Activity) => (
            <div 
              key={activity.id}
              className="text-xs truncate cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                // Abrir el diálogo con los detalles de la actividad
                setSelectedActivity(activity);
                setIsDialogOpen(true);
              }}
            >
              <Badge className={categoryColorMap[activity.categoryName || ''] || getCategoryColors()} variant="outline">
                {activity.title}
              </Badge>
            </div>
          ))}
          {dayActivities.length > 3 && (
            <div className="text-xs text-gray-500 text-center">
              +{dayActivities.length - 3} más
            </div>
          )}
        </div>
      </div>
    );
  };

  // Resetear los filtros
  const resetFilters = () => {
    setFilters({
      category: 'all',
      parkId: 'all',
      instructorId: 'all',
      isFree: 'all',
    });
  };

  return (
    <AdminLayout>
        <div className="container mx-auto p-6 space-y-6">

        {/* Nuevo encabezado con PageHeader */}
        <PageHeader
          icon={<CalendarIcon />}
          title="Calendario de Actividades"
          subtitle="Consulta las actividades programadas en el calendario mensual."
          actions={[
            <div className="flex items-center space-x-2" key="calendar-nav">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-lg font-medium min-w-[200px] text-center text-white">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </div>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Elegir mes
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => date && setCurrentDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>,
            <Button
              key="new-activity"
              onClick={() => setLocation('/admin/organizador/catalogo/crear')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Nueva Actividad
            </Button>
          ]}
        />

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtros</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            </div>
            <CardDescription>
              Filtra las actividades mostradas en el calendario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Categoría</label>
                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Parque</label>
                <Select value={filters.parkId} onValueChange={(value) => setFilters({...filters, parkId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los parques" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los parques</SelectItem>
                    {Array.isArray(parks) && parks.map((park: any) => (
                      <SelectItem key={park.id} value={park.id.toString()}>{park.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Instructor</label>
                <Select value={filters.instructorId} onValueChange={(value) => setFilters({...filters, instructorId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los instructores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los instructores</SelectItem>
                    {Array.isArray(instructors) && instructors.map((instructor: Instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id.toString()}>{instructor.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Precio</label>
                <Select value={filters.isFree} onValueChange={(value) => setFilters({...filters, isFree: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las actividades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las actividades</SelectItem>
                    <SelectItem value="free">Gratuitas</SelectItem>
                    <SelectItem value="paid">De pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendario */}
        <div className="bg-white rounded-lg border shadow">
          {/* Cabecera con nombres de los días */}
          <div className="grid grid-cols-7 gap-0">
            {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day) => (
              <div key={day} className="py-2 text-center font-medium text-gray-600 border-b">
                {day}
              </div>
            ))}
          </div>
          
          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-0">
            {isLoading ? (
              <div className="col-span-7 py-12 text-center text-gray-500">
                Cargando actividades...
              </div>
            ) : (
              daysInMonth.map((day, index) => renderCalendarDay(day, index))
            )}
          </div>
        </div>

        {/* Leyenda de categorías */}
        <div className="mt-6 flex flex-wrap gap-2">
          <div className="text-sm font-medium mr-2">Categorías:</div>
          {Array.isArray(categories) && categories.map((category) => (
            <Badge key={category.id} className={getCategoryColors(category.color)} variant="outline">
              {category.name}
            </Badge>
          ))}
        </div>

        {/* Diálogo de detalles de actividad */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            {selectedActivity ? (
              <>
                <DialogHeader>
                  <div className="flex justify-between items-center">
                    <DialogTitle className="text-2xl font-bold">{selectedActivity.title}</DialogTitle>
                    <Badge className={categoryColorMap[selectedActivity.categoryName || ''] || getCategoryColors()} variant="outline">
                      {selectedActivity.categoryName}
                    </Badge>
                  </div>
                  <DialogDescription>
                    <div className="mt-2 flex items-center text-gray-500">
                      <CalendarIconSimple className="h-4 w-4 mr-1" />
                      <span className="mr-3">
                        {selectedActivity.startDate
                          ? format(new Date(selectedActivity.startDate), 'dd/MM/yyyy HH:mm', { locale: es })
                          : 'Fecha no disponible'}
                      </span>
                      {selectedActivity.location && (
                        <>
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{selectedActivity.location}</span>
                        </>
                      )}
                    </div>
                    {selectedActivity.parkName && (
                      <div className="mt-1 text-gray-500">Parque: {selectedActivity.parkName}</div>
                    )}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Descripción</h3>
                    <p className="text-gray-700">{selectedActivity.description || 'Sin descripción disponible'}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {selectedActivity.price !== undefined && (
                      <div className="flex items-start">
                        <CreditCard className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Precio</h4>
                          <p>{selectedActivity.price > 0 ? `$${selectedActivity.price}` : 'Gratuita'}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedActivity.instructor?.fullName && (
                      <div className="flex items-start">
                        <User className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Instructor</h4>
                          <p>{selectedActivity.instructor.fullName}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedActivity.startDate && selectedActivity.endDate && (
                      <div className="flex items-start">
                        <Clock className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Duración</h4>
                          <p>
                            {format(new Date(selectedActivity.startDate), 'HH:mm', { locale: es })} - 
                            {format(new Date(selectedActivity.endDate), 'HH:mm', { locale: es })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cerrar
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setLocation(`/admin/activities`);
                    }}
                  >
                    Ver todas las actividades
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="p-6 text-center">
                <p>No se encontraron detalles de la actividad</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(false)}>
                  Cerrar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Panel de detalle para el día seleccionado */}
        {selectedDate && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                Actividades para el {format(selectedDate, 'd MMMM yyyy', { locale: es })}
              </CardTitle>
              <CardDescription>
                {getActivitiesForDay(selectedDate).length} actividades programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getActivitiesForDay(selectedDate).length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No hay actividades programadas para este día
                </div>
              ) : (
                <div className="space-y-3">
                  {getActivitiesForDay(selectedDate).map((activity: Activity) => (
                    <div key={activity.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" 
                      onClick={() => {
                        setSelectedActivity(activity);
                        setIsDialogOpen(true);
                      }}>
                      <div className="flex justify-between">
                        <h3 className="font-medium">{activity.title}</h3>
                        <Badge className={categoryColorMap[activity.category || ''] || getCategoryColors()} variant="outline">
                          {activity.category || 'Sin categoría'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {activity.description?.substring(0, 100)}{activity.description && activity.description.length > 100 ? '...' : ''}
                      </div>
                      <div className="flex justify-between mt-2 text-xs">
                        <div>
                          <span className="font-medium">Parque:</span> {activity.parkName || `Parque #${activity.parkId}`}
                        </div>
                        {activity.instructor && (
                          <div>
                            <span className="font-medium">Instructor:</span> {activity.instructor.fullName}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Precio:</span> {activity.price && activity.price > 0 ? `$${activity.price}` : 'Gratuita'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}