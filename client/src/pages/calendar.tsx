import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addMonths, subMonths, getDay, isSameDay, parseISO, isValid, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock, Users, Tag, BookOpen, User, X, Filter, Activity, Trees, Phone, Mail } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
const heroImage = "/jardin-japones.jpg";

// Tipo para las actividades
interface Activity {
  id: number;
  title: string;
  description: string;
  category: string;
  categoryId?: number;
  startDate: string;
  endDate?: string;
  location?: string;
  parkId: number;
  parkName: string;
  capacity?: number;
  price?: number;
  instructorId?: number;
  instructorName?: string;
  instructorAvatar?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  materials?: string;
  requirements?: string;
  isFree?: boolean;
  isRecurring?: boolean;
  recurringDays?: string[];
  targetMarket?: string[];
  specialNeeds?: string[];
}

// Tipo para los eventos
interface Event {
  id: number;
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  capacity?: number;
  registrationType?: string;
  targetAudience?: string;
  status: string;
  organizerName?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  featuredImageUrl?: string;
  isRecurring?: boolean;
  parks?: Array<{ id: number; name: string; }>;
  parkNames?: string;
}

// Tipo unificado para el calendario
interface CalendarItem {
  id: number;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  capacity?: number;
  price?: number;
  parkName: string;
  type: 'activity' | 'event';
  isFree?: boolean;
  instructorName?: string;
  organizerName?: string;
  targetAudience?: string;
  status?: string;
}

const CalendarPage: React.FC = () => {
  // Estado para el mes actual y filtros
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filtros principales
  const [typeFilter, setTypeFilter] = useState('all'); // all, activities, events
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [parkFilter, setParkFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  
  // Consultar actividades, eventos y categorías desde las APIs
  const { data: activities = [], isLoading: loadingActivities } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });
  
  const { data: events = [], isLoading: loadingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  // Obtener las categorías reales desde la API
  const { data: activityCategoriesData = [] } = useQuery({
    queryKey: ['/api/activity-categories'],
  });
  
  // Procesar datos de eventos para el formato unificado
  const processedEvents: CalendarItem[] = events
    .filter(event => event.status === 'published')
    .map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      capacity: event.capacity,
      price: undefined,
      parkName: event.parks?.[0]?.name || 'Sin parque',
      type: 'event' as const,
      isFree: event.registrationType === 'free',
      organizerName: event.organizerName,
      targetAudience: event.targetAudience,
      status: event.status
    }));
  
  // Procesar datos de actividades para el formato unificado
  const processedActivities: CalendarItem[] = activities.map(activity => {
    // Mapear categoryId a nombre de categoría
    const categoryName = activity.categoryId 
      ? activityCategoriesData.find((cat: any) => cat.id === activity.categoryId)?.name || 'Sin categoría'
      : activity.category || 'Sin categoría';
    
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      category: categoryName,
      startDate: activity.startDate,
      endDate: activity.endDate,
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: activity.location,
      capacity: activity.capacity,
      price: activity.price,
      parkName: activity.parkName,
      type: 'activity' as const,
      isFree: activity.isFree,
      instructorName: activity.instructorName,
      targetAudience: activity.targetMarket?.join(', ') || ''
    };
  });
  
  // Combinar actividades y eventos
  const allItems = [...processedActivities, ...processedEvents];
  
  // Usar las categorías reales de la API de actividades
  const activityCategories = activityCategoriesData.map((cat: any) => cat.name);
  const eventCategories = Array.from(new Set(events.map(e => e.eventType || 'Sin categoría')));
  const allParks = Array.from(new Set([
    ...activities.map(a => a.parkName || 'Sin parque'),
    ...events.flatMap(e => e.parks?.map(p => p.name) || ['Sin parque'])
  ]));
  
  // Categorías dinámicas según el filtro de tipo
  const getAvailableCategories = () => {
    if (typeFilter === 'activities') return activityCategories;
    if (typeFilter === 'events') return eventCategories;
    return Array.from(new Set([...activityCategories, ...eventCategories]));
  };
  
  // Colores por categoría (actividades y eventos)
  const getCategoryColor = (category: string, type: 'activity' | 'event') => {
    const activityColors: Record<string, string> = {
      'Deportivo': 'bg-blue-500',
      'Arte y Cultura': 'bg-purple-500',
      'Naturaleza y Ciencia': 'bg-green-500',
      'Recreación y Bienestar': 'bg-orange-500',
      'Comunidad': 'bg-indigo-500',
      'Eventos de Temporada': 'bg-pink-500'
    };
    
    const eventColors: Record<string, string> = {
      'Deportivos': 'bg-cyan-500',
      'Culturales': 'bg-violet-500',
      'Ambientales': 'bg-emerald-500',
      'Sociales': 'bg-amber-500',
      'Educativos': 'bg-blue-600',
      'Benéficos': 'bg-rose-500',
      'Celebraciones': 'bg-yellow-500',
      'default': 'bg-gray-500'
    };
    
    if (type === 'activity') {
      return activityColors[category] || 'bg-teal-500';
    } else {
      return eventColors[category] || eventColors.default;
    }
  };

  // Filtrar elementos del calendario
  const filteredItems = allItems.filter(item => {
    // Filtrar por tipo (actividades, eventos o todos)
    if (typeFilter === 'activities' && item.type !== 'activity') return false;
    if (typeFilter === 'events' && item.type !== 'event') return false;
    
    // Filtrar por categoría
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    
    // Filtrar por parque
    if (parkFilter !== 'all' && item.parkName !== parkFilter) return false;
    
    // Filtrar por precio (solo aplica a actividades)
    if (priceFilter === 'free' && !item.isFree) return false;
    if (priceFilter === 'paid' && item.isFree) return false;
    
    return true;
  });

  // Obtener elementos del calendario por fecha
  const getItemsForDate = (date: Date) => {
    return filteredItems.filter(item => {
      if (!item.startDate || !isValid(parseISO(item.startDate))) return false;
      const itemDate = parseISO(item.startDate);
      return isSameDay(date, itemDate);
    });
  };

  // Funciones de navegación del calendario
  const goToPrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Función para manejar la selección de un elemento
  const handleItemClick = (item: CalendarItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  // Función para resetear filtros
  const resetFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setParkFilter('all');
    setPriceFilter('all');
  };

  // Configurar fechas del calendario
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - getDay(monthStart));
  
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - getDay(monthEnd)));
  
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  // Calcular estadísticas para el hero
  const totalActivities = activities.length;
  const uniqueParks = new Set(activities.map(a => a.parkName)).size;
  const activitiesThisMonth = activities.filter(activity => {
    if (!activity.startDate || !isValid(parseISO(activity.startDate))) return false;
    const activityDate = parseISO(activity.startDate);
    return activityDate >= startOfMonth(currentMonth) && activityDate <= endOfMonth(currentMonth);
  }).length;

  if (loadingActivities || loadingEvents) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando calendario...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-gray-50">
        {/* === HERO SECTION === */}
        <section 
          className="relative text-white"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl mb-6">
                <div className="flex items-center justify-center gap-3">
                  <CalendarIcon className="h-12 w-12 md:h-16 md:w-16 text-white" />
                  <span className="font-light text-white" style={{ fontFamily: 'Guttery, sans-serif' }}>Nuestro</span>
                </div>
                <span className="font-bold text-white">Calendario de Actividades</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                Descubre eventos y actividades programadas en todos nuestros parques durante el mes
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-blue-100 mt-8">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <span>{activitiesThisMonth} actividades este mes</span>
              </div>
              <Separator orientation="vertical" className="h-6 bg-blue-300" />
              <div className="flex items-center gap-2">
                <Trees className="h-5 w-5" />
                <span>{uniqueParks} parques activos</span>
              </div>
              <Separator orientation="vertical" className="h-6 bg-blue-300" />
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                <span>{getAvailableCategories().length} categorías</span>
              </div>
            </div>
          </div>
        </section>

        {/* === SECCIÓN DEL PANEL DE FILTROS === */}
        <section className="py-6" style={{backgroundColor: '#19633c'}}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl shadow-sm p-6" style={{backgroundColor: '#19633c'}}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro de tipo */}
                <Select value={typeFilter} onValueChange={(value) => {
                  setTypeFilter(value);
                  setCategoryFilter('all'); // Reset category when changing type
                }}>
                  <SelectTrigger className="border-gray-200 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Actividades y Eventos</SelectItem>
                    <SelectItem value="activities">Solo Actividades</SelectItem>
                    <SelectItem value="events">Solo Eventos</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro de categoría - dinámico según el tipo */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {getAvailableCategories().map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={parkFilter} onValueChange={setParkFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Parque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los parques</SelectItem>
                    {allParks.map((park) => (
                      <SelectItem key={park} value={park}>{park}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Precio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los precios</SelectItem>
                    <SelectItem value="free">Gratuitas</SelectItem>
                    <SelectItem value="paid">De pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-white">
                  Mostrando {filteredItems.length} de {allItems.length} elementos
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="bg-white text-gray-900 border-white hover:bg-gray-100"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* === CONTENEDOR DEL CALENDARIO === */}
        <section className="bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* === NAVEGACIÓN DEL CALENDARIO === */}
            <div className="py-8">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={goToPrevMonth}
                  className="flex items-center gap-2 border-[#51a19f] text-[#51a19f] hover:bg-[#51a19f] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <h2 className="text-3xl font-bold capitalize" style={{color: '#51a19f'}}>
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                
                <Button
                  variant="outline"
                  onClick={goToNextMonth}
                  className="flex items-center gap-2 border-[#51a19f] text-[#51a19f] hover:bg-[#51a19f] hover:text-white"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* === CALENDARIO PRINCIPAL === */}
            <div className="pb-12">
            {/* Encabezados de días */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Días del calendario */}
            <div className="grid grid-cols-7 gap-2">
              {dateRange.map((date, index) => {
                const dayItems = getItemsForDate(date);
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isToday = isSameDay(date, new Date());

                return (
                  <div
                    key={index}
                    className={`min-h-32 p-2 border rounded-lg ${
                      isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                    } ${isToday ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${isToday ? 'text-primary font-bold' : ''}`}>
                      {format(date, 'd')}
                    </div>
                    
                    <div className="space-y-1">
                      {dayItems.slice(0, 3).map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          onClick={() => handleItemClick(item)}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${getCategoryColor(item.category, item.type)} text-white relative`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium truncate">{item.title}</div>
                            {item.type === 'event' && (
                              <span className="text-[10px] opacity-75 ml-1">E</span>
                            )}
                          </div>
                          {item.startTime && (
                            <div className="text-xs opacity-90">{item.startTime}</div>
                          )}
                        </div>
                      ))}
                      
                      {dayItems.length > 3 && (
                        <div className="text-xs text-gray-500 font-medium">
                          +{dayItems.length - 3} más...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </section>

        {/* === SECCIÓN ¿NECESITAS MÁS INFORMACIÓN? === */}
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Necesitas más información?</h2>
              <p className="text-lg text-gray-600">Nuestro equipo está aquí para ayudarte</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#51a19f'}}>
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Teléfono</h3>
                <p className="text-gray-600 mb-2">(33) 1234-5678</p>
                <p className="text-sm text-gray-500">Lun-Vie 8:00-16:00</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#51a19f'}}>
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Correo</h3>
                <p className="text-gray-600 mb-2">actividades@parques.gdl.gob.mx</p>
                <p className="text-sm text-gray-500">Respuesta en 24 horas</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#51a19f'}}>
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ubicación</h3>
                <p className="text-gray-600 mb-2">Av. Hidalgo 400, Centro</p>
                <p className="text-sm text-gray-500">Guadalajara, Jalisco</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 px-8 py-3">
                <Mail className="h-5 w-5 mr-2" />
                Enviar mensaje
              </Button>
            </div>
          </div>
        </section>

        {/* Dialog de detalles de elemento */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            {selectedItem && (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${getCategoryColor(selectedItem.category, selectedItem.type)} flex items-center justify-center flex-shrink-0`}>
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-xl font-bold text-gray-900 leading-tight">
                        {selectedItem.title}
                      </DialogTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className={`${getCategoryColor(selectedItem.category, selectedItem.type)} text-white`}>
                          {selectedItem.category}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={selectedItem.type === 'activity' ? 'text-blue-600 border-blue-600' : 'text-purple-600 border-purple-600'}
                        >
                          {selectedItem.type === 'activity' ? 'Actividad' : 'Evento'}
                        </Badge>
                        {selectedItem.isFree && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Gratuito
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">{selectedItem.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">{selectedItem.parkName}</span>
                    </div>
                    
                    {selectedItem.startDate && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                        <span className="font-medium">
                          {format(parseISO(selectedItem.startDate), 'PPP', { locale: es })}
                        </span>
                      </div>
                    )}
                    
                    {selectedItem.startTime && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-medium">
                          {selectedItem.startTime}
                          {selectedItem.endTime && ` - ${selectedItem.endTime}`}
                        </span>
                      </div>
                    )}
                    
                    {selectedItem.capacity && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-medium">{selectedItem.capacity} personas max.</span>
                      </div>
                    )}
                    
                    {/* Mostrar instructor para actividades */}
                    {selectedItem.type === 'activity' && selectedItem.instructorName && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4 text-primary" />
                        <span className="font-medium">Instructor: {selectedItem.instructorName}</span>
                      </div>
                    )}
                    
                    {/* Mostrar organizador para eventos */}
                    {selectedItem.type === 'event' && selectedItem.organizerName && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4 text-primary" />
                        <span className="font-medium">Organizador: {selectedItem.organizerName}</span>
                      </div>
                    )}
                    
                    {/* Mostrar precio solo para actividades de pago */}
                    {selectedItem.type === 'activity' && !selectedItem.isFree && selectedItem.price && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="font-medium">${selectedItem.price}</span>
                      </div>
                    )}
                  </div>

                  {/* Mostrar información adicional solo para actividades */}
                  {selectedItem.type === 'activity' && selectedItem.targetAudience && (
                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Público Objetivo</h4>
                        <p className="text-sm text-gray-600">{selectedItem.targetAudience}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Mostrar información adicional para eventos */}
                  {selectedItem.type === 'event' && selectedItem.targetAudience && (
                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Audiencia Objetivo</h4>
                        <p className="text-sm text-gray-600 capitalize">{selectedItem.targetAudience}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={() => {
                      const route = selectedItem.type === 'activity' ? 'activity' : 'events';
                      window.open(`/${route}/${selectedItem.id}`, '_blank');
                    }}
                  >
                    Más Información
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    className="text-primary border-primary hover:bg-primary hover:text-white"
                  >
                    Cerrar
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PublicLayout>
  );
};

export default CalendarPage;