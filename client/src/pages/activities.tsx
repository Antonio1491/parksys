import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  ArrowLeft,
  Star,
  Heart,
  ExternalLink,
  Activity,
  Trees,
  User,
  DollarSign,
  Trophy,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List
} from 'lucide-react';
const heroImage = "/images/recorrido-nocturno-colomos-1024x683_1754846133930.jpg";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PublicLayout from '@/components/PublicLayout';
import AdSpace from '@/components/AdSpace';

interface ActivityData {
  id: number;
  title: string;
  description: string;
  category: string;
  categoryId?: number;
  parkId: number;
  parkName: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity: number;
  price: number;
  instructorId?: number;
  instructorName?: string;
  imageUrl?: string;
  imageCaption?: string;
  // Nuevos campos agregados
  targetMarket?: string[];
  specialNeeds?: string[];
  materials?: string;
  requirements?: string;
  isRecurring?: boolean;
  recurringDays?: string[];
  duration?: number;
  isFree?: boolean;
  status?: 'activa' | 'programada' | 'cancelada' | 'finalizada' | 'en_pausa';
}

const categoryColors = {
  'Arte y Cultura': 'bg-green-100 text-green-800 border-green-200',
  'Recreación y Bienestar': 'bg-blue-100 text-blue-800 border-blue-200',
  'Eventos de Temporada': 'bg-orange-100 text-orange-800 border-orange-200',
  'Deportivo': 'bg-red-100 text-red-800 border-red-200',
  'Comunidad': 'bg-purple-100 text-purple-800 border-purple-200',
  'Naturaleza y Ciencia': 'bg-teal-100 text-teal-800 border-teal-200',
  'Fitness y Ejercicio': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Actividades Familiares': 'bg-pink-100 text-pink-800 border-pink-200'
};

const statusColors = {
  'activa': 'bg-green-500 text-white border-green-600',
  'programada': 'bg-blue-500 text-white border-blue-600',
  'cancelada': 'bg-red-500 text-white border-red-600',
  'finalizada': 'bg-gray-500 text-white border-gray-600',
  'en_pausa': 'bg-yellow-500 text-white border-yellow-600'
};

const statusLabels = {
  'activa': 'Activa',
  'programada': 'Programada',
  'cancelada': 'Cancelada',
  'finalizada': 'Finalizada',
  'en_pausa': 'En Pausa'
};

// Componente para tarjeta horizontal de actividad
function HorizontalActivityCard({ 
  activity, 
  allActivities, 
  currentIndex 
}: { 
  activity: ActivityData;
  allActivities: ActivityData[];
  currentIndex: number;
}) {
  const handleActivityClick = () => {
    window.location.href = `/activity/${activity.id}`;
  };

  const categoryColor = categoryColors[activity.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  const statusColor = statusColors[activity.status as keyof typeof statusColors] || 'bg-gray-500 text-white border-gray-600';
  const statusLabel = statusLabels[activity.status as keyof typeof statusLabels] || 'Sin estado';
  
  // Calcular el conteo de actividades del parque
  const parkActivitiesCount = allActivities.filter(a => a.parkId === activity.parkId).length;
  const currentActivityInPark = allActivities
    .filter(a => a.parkId === activity.parkId)
    .findIndex(a => a.id === activity.id) + 1;

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200"
      onClick={handleActivityClick}
    >
      <div className="flex h-32">
        {/* Imagen con información superpuesta - 3/4 de la tarjeta */}
        <div className="w-3/4 relative">
          {activity.imageUrl ? (
            <img 
              src={activity.imageUrl} 
              alt={activity.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          )}
          
          {/* Badge de categoría - esquina superior izquierda */}
          {activity.category && (
            <Badge className={`${categoryColor} border text-xs absolute top-2 left-2 shadow-md z-10`}>
              {activity.category}
            </Badge>
          )}

          {/* Badge de estado - esquina superior derecha */}
          {activity.status && (
            <Badge className={`${statusColor} border text-xs absolute top-2 right-2 shadow-md z-10 font-semibold`}>
              {statusLabel}
            </Badge>
          )}
          
          {/* Información superpuesta sobre la foto */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-between p-3">
            {/* Precio en la parte superior derecha */}
            {activity.price !== undefined && (
              <div className="flex justify-end">
                <div className="flex items-center gap-1 text-white text-sm drop-shadow-lg bg-black bg-opacity-30 px-2 py-1 rounded">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">
                    {activity.price > 0 ? `$${Number(activity.price).toLocaleString('es-MX')}` : 'Gratis'}
                  </span>
                </div>
              </div>
            )}
            
            {/* Nombre en la parte inferior izquierda */}
            <div className="flex justify-start">
              <h3 className="font-semibold text-2xl text-white line-clamp-2 drop-shadow-lg">
                {activity.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Información del parque - 1/4 restante */}
        <div className="w-1/4 p-3 bg-gray-50 flex flex-col justify-center">
          <div className="text-right">
            <MapPin className="h-6 w-6 text-green-600 ml-auto mb-2" />
            <p className="text-base font-medium text-gray-900 leading-tight">
              {activity.parkName || 'Parque no especificado'}
            </p>
            <p className="text-sm text-gray-500 mt-1 leading-tight italic">
              {currentActivityInPark} de {parkActivitiesCount} actividades
            </p>
            {activity.location && (
              <p className="text-xs text-gray-400 mt-1 leading-tight">
                {activity.location}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Tarjeta simplificada para carrusel
function CarouselActivityCard({ activity, isCenter = false }: { activity: ActivityData; isCenter?: boolean }) {
  const categoryColor = categoryColors[activity.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  const statusColor = statusColors[activity.status as keyof typeof statusColors] || 'bg-gray-500 text-white border-gray-600';
  const statusLabel = statusLabels[activity.status as keyof typeof statusLabels] || 'Sin estado';
  const parksResponse = useQuery({ queryKey: ['/api/parks'] });
  const parksData = parksResponse.data || [];
  
  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border-0 shadow-sm h-full ${isCenter ? 'scale-105 shadow-md' : ''}`}>
      {/* Imagen con contenido superpuesto */}
      <div className={`${isCenter ? 'aspect-[3/2]' : 'aspect-[4/3]'} relative overflow-hidden`}>
        {activity.images && activity.images.length > 0 ? (
          <>
            <img 
              src={activity.images[0].imageUrl} 
              alt={activity.images[0].altText || activity.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/20"></div>
          </>
        ) : activity.imageUrl ? (
          <>
            <img 
              src={activity.imageUrl} 
              alt={activity.imageCaption || activity.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/20"></div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-green-100 to-blue-100 w-full h-full flex items-center justify-center">
              <Activity className="h-16 w-16 text-green-600/50" />
            </div>
          </>
        )}
        
        {/* Badge de categoría */}
        <div className="absolute top-3 left-3">
          <Badge className={`${categoryColor} border shadow-sm text-xs`}>
            {activity.category}
          </Badge>
        </div>

        {/* Badge de estado */}
        {activity.status && (
          <div className="absolute top-3 right-3">
            <Badge className={`${statusColor} border shadow-sm text-xs font-semibold`}>
              {statusLabel}
            </Badge>
          </div>
        )}
        
        {/* Contenido superpuesto con fondo semitransparente */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-4 space-y-2">
          {/* Título de la actividad */}
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
            {activity.title}
          </h3>
          
          {/* Parque */}
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="h-3 w-3 text-green-600 flex-shrink-0" />
            <span className="text-xs truncate">
              {parksData.find(p => p.id === activity.parkId)?.name || 'Parque'}
            </span>
          </div>
          
          {/* Botón Ver detalle más pequeño */}
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white h-7 text-xs px-3" 
            onClick={() => window.open(`/activity/${activity.id}`, '_blank')}
          >
            Ver detalle
            <ExternalLink className="h-2 w-2 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ActivityCard({ activity, viewMode }: { activity: ActivityData; viewMode: 'grid' | 'list' }) {
  const categoryColor = categoryColors[activity.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  const statusColor = statusColors[activity.status as keyof typeof statusColors] || 'bg-gray-500 text-white border-gray-600';
  const statusLabel = statusLabels[activity.status as keyof typeof statusLabels] || 'Sin estado';
  
  const startDate = new Date(activity.startDate);
  const endDate = new Date(activity.endDate);
  const isMultiDay = startDate.toDateString() !== endDate.toDateString();
  
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-green-500">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg text-gray-900">{activity.title}</h3>
                <Badge className={`${categoryColor} border`}>
                  {activity.category}
                </Badge>
                {activity.status && (
                  <Badge className={`${statusColor} border font-semibold`}>
                    {statusLabel}
                  </Badge>
                )}
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-2">{activity.description}</p>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span>{activity.parkName}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>
                    {isMultiDay 
                      ? `${format(startDate, 'dd MMM', { locale: es })} - ${format(endDate, 'dd MMM yyyy', { locale: es })}`
                      : format(startDate, 'dd MMM yyyy', { locale: es })
                    }
                  </span>
                </div>
                
                {activity.capacity > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span>{activity.capacity} personas</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                  <span>{activity.price > 0 ? `$${Number(activity.price).toLocaleString('es-MX')}` : 'Gratis'}</span>
                </div>
              </div>
              
              {activity.instructorName && (
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                  <User className="h-4 w-4 text-green-600" />
                  <span>Instructor: {activity.instructorName}</span>
                </div>
              )}
              
              {/* Información adicional */}
              <div className="mt-3 space-y-2">
                {activity.targetMarket && activity.targetMarket.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Trophy className="h-4 w-4 text-orange-600" />
                    <span>Dirigido a: {activity.targetMarket.map(market => {
                      const marketLabels: {[key: string]: string} = {
                        'preescolar': 'Preescolar',
                        'ninos': 'Niños',
                        'adolescentes': 'Adolescentes', 
                        'adultos': 'Adultos',
                        'adultos_mayores': 'Adultos mayores',
                        'familias': 'Familias'
                      };
                      return marketLabels[market] || market;
                    }).join(', ')}</span>
                  </div>
                )}
                
                {activity.duration && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>{(activity.duration / 60).toFixed(1)} horas</span>
                  </div>
                )}
                
                {activity.isRecurring && activity.recurringDays && activity.recurringDays.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span>Días: {activity.recurringDays.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="ml-4 flex flex-col gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => window.open(`/activity/${activity.id}`, '_blank')}
              >
                Ver detalle
              </Button>
              {activity.price === 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  <Heart className="h-3 w-3 mr-1" />
                  Gratis
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border-0 shadow-sm">
      <div className="aspect-video relative overflow-hidden">
        {activity.imageUrl ? (
          <>
            <img 
              src={activity.imageUrl} 
              alt={activity.imageCaption || activity.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20"></div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-green-100 to-blue-100 w-full h-full"></div>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="h-16 w-16 text-white/70" />
            </div>
          </>
        )}
        <div className="absolute top-4 left-4">
          <Badge className={`${categoryColor} border shadow-sm`}>
            {activity.category}
          </Badge>
        </div>
        
        {/* Badge de estado - prioridad en esquina superior derecha */}
        {activity.status && (
          <div className="absolute top-4 right-4">
            <Badge className={`${statusColor} border shadow-sm font-semibold`}>
              {statusLabel}
            </Badge>
          </div>
        )}
        
        {/* Badge de gratis - se muestra debajo del estado si ambos existen */}
        {activity.price === 0 && (
          <div className={`absolute ${activity.status ? 'top-12' : 'top-4'} right-4`}>
            <Badge className="bg-green-500 text-white border-0 shadow-sm">
              <Heart className="h-3 w-3 mr-1" />
              Gratis
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-xl group-hover:text-green-600 transition-colors">
          {activity.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{activity.description}</p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="truncate">{activity.parkName}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="text-xs">
              {isMultiDay 
                ? `${format(startDate, 'dd MMM', { locale: es })} - ${format(endDate, 'dd MMM', { locale: es })}`
                : format(startDate, 'dd MMM yyyy', { locale: es })
              }
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            {/* Mostrar hora en lugar de participantes */}
            {activity.duration && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs">{(activity.duration / 60).toFixed(1)} hrs</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium">{activity.price > 0 ? `$${Number(activity.price).toLocaleString('es-MX')}` : 'Gratis'}</span>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white" 
          size="sm"
          onClick={() => window.open(`/activity/${activity.id}`, '_blank')}
        >
          Ver detalle
          <ExternalLink className="h-3 w-3 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPark, setFilterPark] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [displayedActivities, setDisplayedActivities] = useState(6); // Para paginación de grid

  // Obtener todas las actividades con imágenes
  const { data: activitiesData = [], isLoading } = useQuery<ActivityData[]>({
    queryKey: ['/api/actividades-fotos'],
  });

  // Obtener parques para filtros
  const { data: parksResponse } = useQuery<any[]>({
    queryKey: ['/api/parks'],
  });
  const parksData = parksResponse || [];

  const filteredActivities = useMemo(() => {
    if (!Array.isArray(activitiesData)) return [];
    
    return activitiesData.filter((activity) => {
      if (searchQuery && !activity.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !activity.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterPark !== 'all' && activity.parkId.toString() !== filterPark) {
        return false;
      }
      if (filterCategory !== 'all' && activity.category !== filterCategory) {
        return false;
      }
      return true;
    });
  }, [activitiesData, searchQuery, filterPark, filterCategory]);

  // Effect para resetear paginación cuando los filtros cambien
  React.useEffect(() => {
    setDisplayedActivities(6);
    setShowAllActivities(false);
  }, [searchQuery, filterPark, filterCategory]);

  // Determinar si hay filtros activos
  const hasActiveFilters = searchQuery || filterPark !== 'all' || filterCategory !== 'all';
  
  // Si hay filtros activos, mostrar TODAS las actividades que coincidan
  // Si no hay filtros, mostrar TODAS las actividades en el carrusel
  const currentActivities = filteredActivities;

  const uniqueCategories = Array.from(new Set(activitiesData.map(activity => activity.category).filter(Boolean)));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando actividades...</p>
        </div>
      </div>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-gray-50">
      {/* Hero Section */}
      <section 
        className="relative py-24 px-4 text-center text-white"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Activity className="h-10 w-10" />
              <h1 className="font-guttery text-4xl md:text-5xl font-normal">
                Descubre
              </h1>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">
              Actividades en el Parque
            </h2>
          </div>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Descubre todas las actividades disponibles en los parques de Guadalajara. 
            Desde deportes hasta arte y cultura, hay algo para todos.
          </p>
          <div className="flex items-center justify-center gap-4 text-green-100">
            <div className="flex items-center gap-2">
              <Trees className="h-5 w-5" />
              <span>{parksData.length} parques</span>
            </div>
            <Separator orientation="vertical" className="h-6 bg-green-300" />
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{activitiesData.length} actividades</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="sticky top-0 z-10 border-b border-gray-200 shadow-sm" style={{backgroundColor: '#19633c'}}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="rounded-lg shadow-sm p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                  <Input
                    placeholder="Buscar actividades..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/90 focus:border-green-400 focus:ring-green-400 placeholder-gray-600"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Select value={filterPark} onValueChange={setFilterPark}>
                  <SelectTrigger className="w-48 bg-white/90 text-gray-800">
                    <Filter className="h-4 w-4 mr-2 text-green-600" />
                    <SelectValue placeholder="Todos los parques" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los parques</SelectItem>
                    {parksData.map((park: any) => (
                      <SelectItem key={park.id} value={park.id.toString()}>
                        {park.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48 bg-white/90  text-gray-800">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Botones de vista - mismo diseño que Events.tsx */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setViewMode('grid');
                      setDisplayedActivities(6); // Reset pagination
                    }}
                    className="bg-[#00a587] hover:bg-[#067f5f] text-white"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setViewMode('list');
                      setShowAllActivities(false); // Reset list view
                    }}
                    className="bg-[#00a587] hover:bg-[#067f5f] text-white"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Actividades */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div>
{currentActivities.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron actividades</h3>
              <p className="text-gray-500 mb-6">Intenta ajustar tus filtros de búsqueda</p>
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setFilterPark('all');
                  setFilterCategory('all');
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Limpiar filtros
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Vista en Grid (Cards) */
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentActivities.slice(0, displayedActivities).map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} viewMode="grid" />
                ))}
              </div>
              
              {/* Botón Ver más para grid */}
              {displayedActivities < currentActivities.length && (
                <div className="text-center pt-8">
                  <Button 
                    onClick={() => setDisplayedActivities(prev => prev + 9)}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                  >
                    Ver más ({Math.min(9, currentActivities.length - displayedActivities)} actividades más)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Vista en Lista (tarjetas horizontales) */
            <div className="space-y-4">
              {(showAllActivities ? currentActivities : currentActivities.slice(0, 5)).map((activity, index) => (
                <HorizontalActivityCard 
                  key={activity.id} 
                  activity={activity} 
                  allActivities={activitiesData}
                  currentIndex={index}
                />
              ))}
              
              {/* Botón Ver más para lista */}
              {!showAllActivities && currentActivities.length > 5 && (
                <div className="text-center pt-6">
                  <Button 
                    onClick={() => setShowAllActivities(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                  >
                    Ver más ({currentActivities.length - 5} actividades restantes)
                  </Button>
                </div>
              )}
              
              {/* Botón Ver menos para lista */}
              {showAllActivities && (
                <div className="text-center pt-6">
                  <Button 
                    onClick={() => setShowAllActivities(false)}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3"
                  >
                    Ver menos
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Conoce nuestros instructores */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-2xl p-8" style={{backgroundColor: '#51a19f'}}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20">
                <User className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Conoce nuestros instructores</h2>
            </div>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              Descubre a los profesionales capacitados que imparten nuestras actividades. 
              Cada instructor cuenta con experiencia y certificaciones para brindarte la mejor experiencia.
            </p>
            <Button 
              onClick={() => window.open('/instructors', '_blank')}
              className="bg-white text-gray-800 hover:bg-gray-100 px-8 py-3 text-lg rounded-lg transition-all duration-300 hover:shadow-lg"
            >
              <User className="h-5 w-5 mr-2" />
              Ver todos los instructores
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            <div className="mt-4 text-sm text-white/80">
              Más de 15+ instructores especializados disponibles
            </div>
          </div>
        </div>
      </section>

      {/* Ad Space - ID 6 */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <AdSpace 
          spaceId="6" 
          position="banner" 
          pageType="activities" 
          className=""
        />
      </section>

      {/* Sección de Contacto */}
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
      </div>
    </PublicLayout>
  );
}

export default ActivitiesPage;