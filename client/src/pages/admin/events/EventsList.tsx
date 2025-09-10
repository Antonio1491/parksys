import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, MapPin, Users, Clock, Edit, Trash2, Eye, Grid, List, ClipboardList, Building, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui/page-header';
import { apiRequest } from '@/lib/queryClient';

interface Event {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  location: string;
  parkName?: string;
  capacity: number;
  registeredCount?: number;
  categoryId?: number;
  category?: string;
  eventType: string;
  targetAudience?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'published' | 'draft';
  imageUrl?: string;
  featuredImageUrl?: string;
  price?: number;
  registrationType?: string;
  organizerName?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  geolocation?: any;
  createdAt: string;
  updatedAt: string;
  createdById?: number;
  parks?: Array<{ id: number; name: string; address?: string }>;
  resources?: any[];
  registrations?: any[];
  staff?: any[];
  evaluations?: any[];
  // Legacy fields for backward compatibility
  organizer?: string;
  date?: string;
  time?: string;
}

const EventsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [parkFilter, setParkFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener eventos desde el backend
  const { data: eventsData = [], isLoading } = useQuery({
    queryKey: ['/api/events'],
    retry: 1
  });

  // Obtener categorías de eventos
  const { data: eventCategories = [] } = useQuery({
    queryKey: ['/api/event-categories'],
  });

  // Obtener lista de parques para el filtro
  const { data: parksData = [] } = useQuery({
    queryKey: ['/api/parks'],
    retry: 1
  });

  // Obtener categorías de eventos
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['/api/event-categories'],
    retry: 1
  });

  // Mutación para eliminar evento
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) => apiRequest(`/api/events/${eventId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Evento eliminado",
        description: "El evento ha sido eliminado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento.",
        variant: "destructive",
      });
    }
  });

  // Funciones para manejar las acciones
  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowViewDialog(true);
  };

  const handleEditEvent = (event: Event) => {
    // Aquí podrías navegar a una página de edición o abrir un modal
    window.location.href = `/admin/events/edit/${event.id}`;
  };

  const handleDeleteEvent = (eventId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const events: Event[] = Array.isArray(eventsData?.data) ? eventsData.data : Array.isArray(eventsData) ? eventsData : [];
  const parks: any[] = Array.isArray(parksData?.data) ? parksData.data : Array.isArray(parksData) ? parksData : [];
  const categories: any[] = Array.isArray(categoriesData?.data) ? categoriesData.data : Array.isArray(categoriesData) ? categoriesData : [];

  // Función para obtener el color de una categoría por nombre
  const getCategoryColor = (categoryName: string) => {
    const category = eventCategories?.find((cat: any) => cat.name === categoryName);
    return category?.color || '#6b7280'; // Color gris por defecto
  };

  // Función para obtener el estilo de badge de categoría
  const getCategoryBadgeStyle = (categoryName: string) => {
    const bgColor = getCategoryColor(categoryName);
    return {
      backgroundColor: bgColor + '20', // 20% opacity for background
      color: bgColor,
      borderColor: bgColor + '40'
    };
  };

  const statusLabels = {
    upcoming: 'Próximo',
    ongoing: 'En curso',
    completed: 'Completado',
    cancelled: 'Cancelado',
    published: 'Publicado',
    draft: 'Borrador'
  };

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    published: 'bg-emerald-100 text-emerald-800',
    draft: 'bg-yellow-100 text-yellow-800'
  };

  const filteredEvents = events.filter((event: Event) => {
    const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesPark = parkFilter === 'all' || event.location === parkFilter || event.parkName === parkFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPark;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      // Crear fecha base
      const date = new Date(dateString);
      
      // Si hay hora específica, combinarla
      if (timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
      }
      
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatEventDateTime = (event: Event) => {
    if (event.startDate) {
      const startDateTime = formatDateTime(event.startDate, event.startTime);
      if (event.endDate && event.endDate !== event.startDate) {
        const endDateTime = formatDateTime(event.endDate, event.endTime);
        return `${startDateTime} - ${endDateTime}`;
      } else if (event.endTime && event.endTime !== event.startTime) {
        const endTime = event.endTime;
        return `${startDateTime} - ${endTime}`;
      }
      return startDateTime;
    } else if (event.date) {
      return `${formatDate(event.date)} ${event.time || ''}`.trim();
    }
    return 'Fecha no disponible';
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Gratuito' : `$${price?.toLocaleString()} MXN`;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Listado de eventos"
          subtitle="Eventos registrados en el sistema"
          icon={<List />}
          actions={[
            <Button 
              key="new-event"
              variant="primary"
              onClick={() => window.location.href = '/admin/events/new'}>
              <Plus className="mr-2 stroke-[4]" />
              Nuevo Evento
            </Button>
          ]}
        />

        {/* Filtros y controles */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="upcoming">Próximos</SelectItem>
                    <SelectItem value="ongoing">En curso</SelectItem>
                    <SelectItem value="completed">Completados</SelectItem>
                    <SelectItem value="cancelled">Cancelados</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={parkFilter} onValueChange={setParkFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Parque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los parques</SelectItem>
                    {parks.map((park: any) => (
                      <SelectItem key={park.id} value={park.name}>{park.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="bg-[#00a587] hover:bg-[#067f5f] text-white"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="bg-[#00a587] hover:bg-[#067f5f] text-white"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de eventos */}
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron eventos</h3>
              <p className="text-gray-600">
                {events.length === 0 
                  ? "No hay eventos creados aún. Crea tu primer evento desde 'Nuevo Evento'."
                  : "Intenta ajustar los filtros o buscar con otros términos."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredEvents.map((event: Event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {viewMode === 'grid' ? (
                  <>
                    {/* Imagen de cabecera */}
                    <div className="relative h-48 bg-gray-100">
                      {(event.imageUrl || event.featuredImageUrl) ? (
                        <img 
                          src={event.imageUrl || event.featuredImageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <div className="text-center">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Sin imagen</p>
                          </div>
                        </div>
                      )}
                      {/* Badge de evento */}
                      <div className="absolute top-2 right-2">
                        <Badge className={`${statusColors[event.status]}`}>
                          {statusLabels[event.status]}
                        </Badge>
                      </div>
                      {/* ID del evento */}
                      <div className="absolute top-2 left-2">
                        <span className="text-xs text-white bg-black/60 px-2 py-1 rounded">
                          #{event.id}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      {/* Header de la ficha */}
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {event.eventType && (
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                              style={getCategoryBadgeStyle(event.eventType)}
                            >
                              <div 
                                className="w-2 h-2 rounded-full mr-1.5" 
                                style={{ backgroundColor: getCategoryColor(event.eventType) }}
                              />
                              {event.eventType}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{formatEventDateTime(event)}</span>
                        </div>

                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{event.location || 'Ubicación no especificada'}</span>
                        </div>
                        {event.capacity && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{event.registeredCount || 0} / {event.capacity} participantes</span>
                          </div>
                        )}
                        {event.price !== undefined && (
                          <div className="flex items-center">
                            <span className="font-medium text-green-600">
                              {formatPrice(event.price)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleViewEvent(event)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {event.title}
                          </h3>
                          <Badge className={statusColors[event.status]}>
                            {statusLabels[event.status]}
                          </Badge>
                          {event.eventType && (
                            <span 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                              style={getCategoryBadgeStyle(event.eventType)}
                            >
                              <div 
                                className="w-2 h-2 rounded-full mr-1" 
                                style={{ backgroundColor: getCategoryColor(event.eventType) }}
                              />
                              {event.eventType}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatEventDateTime(event)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location || 'Ubicación no especificada'}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {event.registeredCount || 0}/{event.capacity || 0}
                          </div>
                          {event.price !== undefined && (
                            <span className="font-medium text-green-600">
                              {formatPrice(event.price)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewEvent(event)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
        
        {/* Estadísticas resumidas */}
        {events.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{events.length}</div>
                  <div className="text-sm text-gray-500">Total de eventos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {events.filter((e: Event) => e.status === 'upcoming').length}
                  </div>
                  <div className="text-sm text-gray-500">Próximos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {events.filter((e: Event) => e.status === 'ongoing').length}
                  </div>
                  <div className="text-sm text-gray-500">En curso</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {events.filter((e: Event) => e.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-500">Completados</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal para ver detalles del evento */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Detalles del Evento
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-6">
              {/* Imagen del evento si existe */}
              {(selectedEvent.imageUrl || selectedEvent.featuredImageUrl) && (
                <div className="w-full h-64 overflow-hidden rounded-lg">
                  <img 
                    src={selectedEvent.imageUrl || selectedEvent.featuredImageUrl}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Información principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Información General</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Título:</span>
                        <span className="text-sm text-gray-900">{selectedEvent.title}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Estado:</span>
                        <Badge className={statusColors[selectedEvent.status]}>
                          {statusLabels[selectedEvent.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Categoría:</span>
                        <span className="text-sm text-gray-900">{selectedEvent.category || 'No especificada'}</span>
                      </div>
                      {selectedEvent.eventType && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-500">Tipo de evento:</span>
                          <span className="text-sm text-gray-900">{selectedEvent.eventType}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Organizador:</span>
                        <span className="text-sm text-gray-900">{selectedEvent.organizerName || selectedEvent.organizer || 'No especificado'}</span>
                      </div>
                      {selectedEvent.organizerEmail && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-500">Email:</span>
                          <span className="text-sm text-gray-900">{selectedEvent.organizerEmail}</span>
                        </div>
                      )}
                      {selectedEvent.organizerPhone && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-500">Teléfono:</span>
                          <span className="text-sm text-gray-900">{selectedEvent.organizerPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Fecha y Ubicación</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-900">
                          {formatEventDateTime(selectedEvent)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-900">{selectedEvent.location || 'Ubicación no especificada'}</span>
                      </div>
                      {selectedEvent.parks && selectedEvent.parks.length > 0 && (
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-900">
                            Parques: {selectedEvent.parks.map(park => park.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Capacidad y Participantes</h3>
                    <div className="space-y-2">
                      {selectedEvent.capacity && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Capacidad total:</span>
                            <span className="text-sm text-gray-900">{selectedEvent.capacity} personas</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Registrados:</span>
                            <span className="text-sm text-gray-900">{selectedEvent.registeredCount || 0} personas</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Disponibles:</span>
                            <span className="text-sm text-gray-900">
                              {selectedEvent.capacity - (selectedEvent.registeredCount || 0)} personas
                            </span>
                          </div>
                        </>
                      )}
                      {selectedEvent.price !== undefined && selectedEvent.price !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-500">Precio:</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatPrice(selectedEvent.price)}
                          </span>
                        </div>
                      )}
                      {(!selectedEvent.capacity || selectedEvent.capacity === 0) && (
                        <div className="text-sm text-gray-500 italic">
                          Sin límite de capacidad especificado
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Fechas del Sistema</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Creado:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(selectedEvent.createdAt).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Actualizado:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(selectedEvent.updatedAt).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Descripción completa */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>
              
              {/* Botones de acción */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => handleEditEvent(selectedEvent)}
                  className="bg-[#00a587] hover:bg-[#067f5f] text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Evento
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowViewDialog(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default EventsList;