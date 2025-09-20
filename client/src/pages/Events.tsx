import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, MapPin, Clock, Users, Search, Filter, Grid, List, Star, Eye, Phone, Mail, CheckCircle, Tag, Trees } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdSpace from '@/components/AdSpace';
import PublicLayout from '@/components/PublicLayout';
const heroImage = "/image-transformer.webp";

interface Event {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  location: string;
  capacity: number;
  registeredCount?: number;
  eventType: string;
  status: 'draft' | 'published' | 'cancelled';
  featuredImageUrl?: string;
  organizerName: string;
  organizerEmail: string;
  parks?: Array<{ id: number; name: string; address: string }>;
}

const Events: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [parkFilter, setParkFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Obtener eventos desde el backend
  const { data: eventsData = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/events'],
    retry: 1
  });

  // Obtener lista de parques para el filtro
  const { data: parksData = [] } = useQuery({
    queryKey: ['/api/parks'],
    retry: 1
  });

  // Procesar datos del backend
  const events = Array.isArray((eventsData as any)?.data) ? (eventsData as any).data : Array.isArray(eventsData) ? eventsData : [];
  const parks = Array.isArray((parksData as any)?.data) ? (parksData as any).data : Array.isArray(parksData) ? parksData : [];
  
  // Obtener categorías únicas de los eventos
  const categories: string[] = Array.from(new Set(events.map((event: Event) => event.eventType)));

  const filteredEvents = events.filter((event: Event) => {
    const parkName = event.parks && event.parks.length > 0 ? event.parks[0].name : event.location;
    
    const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         parkName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || event.eventType === categoryFilter;
    const matchesPark = parkFilter === 'all' || parkName === parkFilter;
    
    return matchesSearch && matchesCategory && matchesPark;
  });



  // Mapeo de colores para categorías de eventos (usando valores originales de la base de datos)
  const eventTypeColors = {
    'Benéficos': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Culturales': 'bg-purple-100 text-purple-800 border-purple-200',
    'Deportivos': 'bg-green-100 text-green-800 border-green-200',
    'Empresariales': 'bg-blue-100 text-blue-800 border-blue-200',
    'Gubernamentales': 'bg-red-100 text-red-800 border-red-200',
    'Sociales': 'bg-pink-100 text-pink-800 border-pink-200',
    'Comunitarios': 'bg-orange-100 text-orange-800 border-orange-200',
    'Recreativos': 'bg-indigo-100 text-indigo-800 border-indigo-200'
  };

  // Función para obtener color de categoría con fallback
  const getCategoryColor = (eventType: string) => {
    return eventTypeColors[eventType as keyof typeof eventTypeColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Fecha no disponible';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return format(date, 'dd MMM yyyy', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Todo el día';
    return timeString;
  };

  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative text-white overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-black opacity-50"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Eye className="h-8 w-8 md:h-10 md:w-10 text-white drop-shadow-lg" />
                <h2 className="text-4xl md:text-5xl font-guttery font-light drop-shadow-lg">
                  Conoce
                </h2>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
                Eventos
              </h1>
              <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto drop-shadow-md">
                Descubre los eventos más emocionantes en los parques urbanos de Guadalajara. 
                Cultura, deporte, naturaleza y diversión para toda la familia.
              </p>
              
              {/* Estadísticas de eventos */}
              <div className="flex items-center justify-center gap-4 text-green-100">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{events.length} eventos</span>
                </div>
                <div className="h-6 w-px bg-green-300"></div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>{events.filter((e: Event) => e.status === 'published').length} activos</span>
                </div>
                <div className="h-6 w-px bg-green-300"></div>
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  <span>{categories.length} categorías</span>
                </div>
                <div className="h-6 w-px bg-green-300"></div>
                <div className="flex items-center gap-2">
                  <Trees className="h-5 w-5" />
                  <span>{parks.length} parques</span>
                </div>
              </div>
            </div>
          </div>
        </div>



      {/* Sección completa de filtros con fondo verde */}
      <div className="w-full py-8" style={{ backgroundColor: '#19633c' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filtros y controles */}
          <div className="rounded-lg shadow-sm p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category: string) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lista de eventos */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron eventos</h3>
            <p className="text-gray-600">
              {events.length === 0 
                ? "No hay eventos disponibles en este momento. ¡Vuelve pronto para descubrir nuevas actividades!"
                : "Intenta ajustar los filtros o buscar con otros términos."
              }
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredEvents.map((event: Event) => (
              <Link key={event.id} href={`/event/${event.id}`}>
                <Card className={viewMode === 'list' 
                  ? "hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500" 
                  : "group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-200"}>
                {viewMode === 'grid' ? (
                  <>
                    {/* Imagen principal - altura fija para evitar cortes */}
                    <div className="h-48 relative overflow-hidden">
                      {event.featuredImageUrl ? (
                        <img 
                          src={event.featuredImageUrl?.startsWith('/uploads/') 
                            ? `/api/storage/file/${encodeURIComponent(event.featuredImageUrl.replace(/^\//, ''))}`
                            : event.featuredImageUrl
                          } 
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            console.error('Error loading image:', event.featuredImageUrl);
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.setAttribute('style', 'display: flex');
                          }}
                        />
                      ) : (
                        <>
                          <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-full h-full flex items-center justify-center">
                            <Calendar className="h-16 w-16 text-blue-600/50" />
                          </div>
                          <div className="absolute inset-0 bg-black/10"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Calendar className="h-16 w-16 text-white/70" />
                          </div>
                        </>
                      )}
                      
                      {/* Badge de categoría */}
                      <div className="absolute top-4 left-4">
                        <Badge className={`${getCategoryColor(event.eventType)} border shadow-sm`}>
                          {event.eventType}
                        </Badge>
                      </div>

                      {/* Badge de estado */}
                      {event.status && (
                        <div className="absolute top-4 right-4">
                          <Badge className={`${event.status === 'published' ? 'bg-green-500 text-white border-green-600' : 'bg-gray-500 text-white border-gray-600'} border shadow-sm font-semibold`}>
                            {event.status === 'published' ? 'Activo' : 'Borrador'}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Encabezado con título */}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </CardTitle>
                    </CardHeader>
                    
                    {/* Contenido con información */}
                    <CardContent className="pt-0">
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="truncate">{event.parks && event.parks.length > 0 ? event.parks[0].name : event.location}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-xs">
                            {formatDate(event.startDate)}
                          </span>
                        </div>
                        
                        {event.startTime && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4 text-purple-600 flex-shrink-0" />
                            <span className="text-xs">{formatTime(event.startTime)}</span>
                          </div>
                        )}
                        
                        {event.capacity && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="h-4 w-4 text-orange-600 flex-shrink-0" />
                            <span className="text-xs">{event.registeredCount || 0}/{event.capacity} personas</span>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white" 
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(`/event/${event.id}`, '_blank');
                        }}
                      >
                        Ver detalle
                        <Eye className="h-3 w-3 ml-2" />
                      </Button>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">{event.title}</h3>
                          <Badge className={`${getCategoryColor(event.eventType)} border text-xs`}>
                            {event.eventType}
                          </Badge>
                          <Badge 
                            className="border text-xs font-semibold"
                            style={{ 
                              backgroundColor: event.status === 'published' ? '#10B981' : '#6B7280',
                              color: 'white',
                              borderColor: event.status === 'published' ? '#059669' : '#4B5563'
                            }}
                          >
                            {event.status === 'published' ? 'Activo' : 'Borrador'}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span>{event.parks && event.parks.length > 0 ? event.parks[0].name : event.location}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <span>
                              {formatDate(event.startDate)}
                            </span>
                          </div>
                          
                          {event.startTime && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-4 w-4 text-purple-600" />
                              <span>{formatTime(event.startTime)}</span>
                            </div>
                          )}
                          
                          {event.capacity && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="h-4 w-4 text-orange-600" />
                              <span>{event.registeredCount || 0}/{event.capacity} personas</span>
                            </div>
                          )}
                        </div>
                        
                        {event.organizerName && (
                          <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                            <Star className="h-4 w-4 text-yellow-600" />
                            <span>Organiza: {event.organizerName}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(`/event/${event.id}`, '_blank');
                          }}
                        >
                          Ver detalle
                        </Button>
                        {event.status === 'published' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs self-start">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Banner publicitario customizado */}
        <div className="my-8">
          <div className="relative w-full h-32 bg-cover bg-center bg-no-repeat rounded-xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow duration-300" 
               style={{ 
                 backgroundImage: `url(https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)`
               }}>
            {/* Overlay para mejorar legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/30"></div>
            
            {/* Contenido */}
            <div className="relative h-full flex items-center justify-between px-8">
              {/* Título a la izquierda */}
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-1 drop-shadow-lg">Parks for Life</h3>
                <p className="text-green-200 text-sm drop-shadow-md">Green Spaces Alliance</p>
              </div>
              
              {/* Logo a la derecha */}
              <div className="flex-shrink-0">
                <div className="w-24 h-20 bg-white/95 rounded-lg flex items-center justify-center shadow-lg group-hover:bg-white transition-colors p-2">
                  <img 
                    src="/attached_assets/image_1755011394402.png" 
                    alt="Parks for Life Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de información de contacto */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Necesitas más información?</h2>
            <p className="text-lg text-gray-600">Nuestro equipo está aquí para ayudarte con cualquier evento</p>
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
              <p className="text-gray-600 mb-2">eventos@parques.gdl.gob.mx</p>
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

      </div>
    </PublicLayout>
  );
};

export default Events;