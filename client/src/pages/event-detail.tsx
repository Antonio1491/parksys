import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PublicLayout from "@/components/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  User,
  ArrowLeft,
  Share2,
  Heart
} from "lucide-react";
import { Link } from "wouter";
import { EventRegistrationForm } from '@/components/EventRegistrationForm';

interface Event {
  id: number;
  title: string;
  description: string;
  eventType: string;
  targetAudience: string;
  status: string;
  featuredImageUrl?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isRecurring: boolean;
  recurrencePattern?: any;
  location: string;
  capacity?: number;
  registrationType: string;
  organizerName: string;
  organizerOrganization?: string;
  organizerEmail: string;
  organizerPhone?: string;
  geolocation?: any;
  price?: number;
  isFree?: boolean;
  requiresApproval?: boolean;
  registrationDeadline?: string;
  registrations?: any[];
  parks?: Array<{
    id: number;
    name: string;
  }>;
}

const eventTypeLabels = {
  cultural: "Cultural",
  sports: "Deportivo", 
  educational: "Educativo",
  environmental: "Ambiental",
  recreational: "Recreativo",
  community: "Comunitario",
  artistic: "Artístico",
  gastronomy: "Gastronómico"
};

const EventDetail = () => {
  const { id } = useParams();

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/${id}`],
    enabled: !!id,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.slice(0, 5);
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded mb-6"></div>
              <div className="h-64 bg-gray-300 rounded-lg mb-6"></div>
              <div className="h-4 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-4 w-2/3"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !event) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Evento no encontrado</h1>
            <p className="text-gray-600 mb-6">El evento que buscas no existe o ha sido eliminado.</p>
            <Button asChild>
              <Link href="/events">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a eventos
              </Link>
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Colores dinámicos para categorías como en actividades
  const eventTypeColors = {
    'Benéficos': '#06B6D4',
    'Culturales': '#8B5CF6', 
    'Deportivos': '#10B981',
    'Empresariales': '#3B82F6',
    'Gubernamentales': '#EF4444',
    'Sociales': '#EC4899'
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" asChild className="hover:bg-green-50">
                <Link href="/events">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a eventos
                </Link>
              </Button>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Imagen principal */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 relative">
                  {event.featuredImageUrl ? (
                    <img
                      src={event.featuredImageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Calendar className="h-16 w-16 text-green-600/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
                    <div className="flex items-center gap-4 text-white/90">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.parks && event.parks.length > 0 ? event.parks[0].name : event.location}</span>
                      </div>
                      <Badge 
                        className="text-xs border shadow-sm font-medium text-white"
                        style={{ 
                          backgroundColor: eventTypeColors[event.eventType as keyof typeof eventTypeColors] || '#3B82F6',
                          borderColor: 'rgba(255,255,255,0.3)'
                        }}
                      >
                        {event.eventType}
                      </Badge>
                      <Badge 
                        className="text-xs border shadow-sm font-semibold"
                        style={{ 
                          backgroundColor: event.status === 'published' ? '#10B981' : '#6B7280',
                          color: 'white',
                          borderColor: 'white'
                        }}
                      >
                        {event.status === 'published' ? 'Activo' : 'Borrador'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Descripción */}
              <Card className="mt-4">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción</h2>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {event.description}
                  </p>
                </CardContent>
              </Card>

              {/* Formulario de Inscripción */}
              <EventRegistrationForm event={event} />

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Detalles del evento - Card principal */}
              <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    Detalles del Evento
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Fecha</p>
                        <p className="text-gray-600 text-sm">
                          {formatDate(event.startDate)}
                          {event.endDate !== event.startDate && ` - ${formatDate(event.endDate)}`}
                        </p>
                      </div>
                    </div>
                    
                    {event.startTime && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                        <Clock className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Horario</p>
                          <p className="text-gray-600 text-sm">
                            {formatTime(event.startTime)}
                            {event.endTime && ` - ${formatTime(event.endTime)}`}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <MapPin className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Ubicación</p>
                        <p className="text-gray-600 text-sm">{event.location}</p>
                      </div>
                    </div>
                    
                    {event.capacity && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                        <Users className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Capacidad</p>
                          <p className="text-gray-600 text-sm">{event.capacity} personas</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ubicación con mapa */}
              {event.geolocation && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-red-600" />
                      Cómo llegar
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <a
                          href={`https://www.google.com/maps?q=${event.geolocation.lat},${event.geolocation.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <MapPin className="h-4 w-4" />
                          Abrir en Google Maps
                        </a>
                        
                        <a
                          href={`https://waze.com/ul?ll=${event.geolocation.lat},${event.geolocation.lng}&navigate=yes`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <MapPin className="h-4 w-4" />
                          Abrir en Waze
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Información del organizador */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-600" />
                    Información de Contacto
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 text-lg">{event.organizerName}</p>
                      {event.organizerOrganization && (
                        <p className="text-sm text-gray-600 mt-1">{event.organizerOrganization}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <a 
                        href={`mailto:${event.organizerEmail}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                      >
                        {event.organizerEmail}
                      </a>
                    </div>
                    
                    {event.organizerPhone && (
                      <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-4 w-4 text-gray-600" />
                        <a 
                          href={`tel:${event.organizerPhone}`}
                          className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                        >
                          {event.organizerPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Información adicional */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Información Adicional</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Audiencia:</span>
                      <span className="font-medium">
                        {event.targetAudience === 'all' ? 'Público general' : 
                         event.targetAudience === 'adults' ? 'Adultos' :
                         event.targetAudience === 'children' ? 'Niños' :
                         event.targetAudience === 'seniors' ? 'Adultos mayores' :
                         event.targetAudience}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Registro:</span>
                      <span className="font-medium">
                        {event.registrationType === 'registration' ? 'Requerido' : 
                         event.registrationType === 'free' ? 'Libre acceso' : 
                         'No especificado'}
                      </span>
                    </div>
                    
                    {event.isRecurring && (
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">Recurrente:</span>
                        <span className="font-medium">Sí</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Acción principal */}
              {event.registrationType === 'registration' && event.status === 'published' && (
                <Card className="bg-gradient-to-r from-green-500 to-green-600">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-bold text-white mb-2">¿Te interesa?</h3>
                    <p className="text-green-100 mb-4 text-sm">
                      Regístrate para participar en este evento.
                    </p>
                    <Button className="w-full bg-white text-green-600 hover:bg-green-50" size="lg">
                      Registrarse
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default EventDetail;