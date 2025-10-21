import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MapPin, Clock, Phone, Mail, ArrowLeft, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AmenityIcon from "@/components/ui/amenity-icon";
import type { ExtendedPark } from "@shared/schema";

export default function ParkPage() {
  const { slug } = useParams();
  const [, navigate] = useLocation();

  // Extract park ID from slug (format: park-name-123)
  const parkId = slug?.split('-').pop();

  const { data: park, isLoading, error } = useQuery<ExtendedPark>({
    queryKey: ['/public-api/parks', parkId],
    enabled: !!parkId,
    retry: false,
  });

  useEffect(() => {
    if (park) {
      document.title = `${park.name} | ParkSys`;
    }
  }, [park]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información del parque...</p>
        </div>
      </div>
    );
  }

  if (error || !park) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Parque no encontrado</h1>
            <p className="text-muted-foreground mb-6">
              No pudimos encontrar el parque que estás buscando. Es posible que haya sido eliminado o que la URL no sea correcta.
            </p>
            <Button onClick={() => navigate('/')} data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const primaryImage = park.primaryImage || park.images?.[0]?.imageUrl || '/placeholder-park.jpg';
  const additionalImages = park.images?.filter((img: any) => !img.isPrimary).slice(0, 3) || [];

  const getParkTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'metropolitano': 'Metropolitano',
      'barrial': 'Barrial',
      'vecinal': 'Vecinal',
      'lineal': 'Lineal',
      'ecologico': 'Ecológico',
      'botanico': 'Botánico',
      'deportivo': 'Deportivo',
      'de_bolsillo': 'De Bolsillo',
      'tematico': 'Temático'
    };
    return typeMap[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      'en_funcionamiento': { label: 'En funcionamiento', variant: 'default' },
      'operando_parcialmente': { label: 'Operando parcialmente', variant: 'secondary' },
      'en_mantenimiento': { label: 'En mantenimiento', variant: 'outline' },
      'cerrado_temporalmente': { label: 'Cerrado temporalmente', variant: 'destructive' },
      'cerrado_indefinidamente': { label: 'Cerrado indefinidamente', variant: 'destructive' },
      'reapertura_proxima': { label: 'Reapertura próxima', variant: 'outline' },
      'en_proyecto_construccion': { label: 'En construcción', variant: 'secondary' },
      'uso_restringido': { label: 'Uso restringido', variant: 'secondary' }
    };
    return statusMap[status] || { label: status, variant: 'default' };
  };

  const statusInfo = getStatusLabel(park.status || 'en_funcionamiento');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[400px] md:h-[500px] bg-gray-900">
        <img
          src={primaryImage}
          alt={park.name}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-6xl mx-auto">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20 mb-4"
              onClick={() => navigate('/')}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{park.name}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant={statusInfo.variant as any} className="text-sm">
                {statusInfo.label}
              </Badge>
              {park.parkType && (
                <Badge variant="secondary" className="text-sm">
                  {getParkTypeLabel(park.parkType)}
                </Badge>
              )}
              {park.area && (
                <Badge variant="outline" className="text-sm bg-white/10 text-white border-white/30">
                  {Number(park.area).toLocaleString()} m²
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {park.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Acerca de este parque</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {park.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Gallery */}
            {additionalImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Galería</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {additionalImages.map((img: any, index: number) => (
                      <div key={index} className="aspect-square overflow-hidden rounded-lg">
                        <img
                          src={img.imageUrl}
                          alt={img.caption || `Imagen ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {park.amenities && park.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Amenidades</CardTitle>
                  <CardDescription>Servicios e instalaciones disponibles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {park.amenities.map((amenity: any) => (
                      <div key={amenity.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
                        <AmenityIcon icon={amenity.icon} size="md" />
                        <span className="text-sm font-medium">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activities */}
            {park.activities && park.activities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Actividades programadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {park.activities.slice(0, 5).map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="flex-1">
                          <h4 className="font-medium">{activity.title}</h4>
                          {activity.startDate && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(activity.startDate).toLocaleDateString('es-MX', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Contact & Details */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Ubicación</p>
                    <p className="text-sm text-muted-foreground">{park.address}</p>
                    {park.municipalityText && (
                      <p className="text-sm text-muted-foreground">{park.municipalityText}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {park.openingHours && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Horario</p>
                      <p className="text-sm text-muted-foreground">{park.openingHours}</p>
                    </div>
                  </div>
                )}

                {park.contactPhone && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Teléfono</p>
                        <a href={`tel:${park.contactPhone}`} className="text-sm text-green-600 hover:underline">
                          {park.contactPhone}
                        </a>
                      </div>
                    </div>
                  </>
                )}

                {park.contactEmail && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Correo</p>
                        <a href={`mailto:${park.contactEmail}`} className="text-sm text-green-600 hover:underline">
                          {park.contactEmail}
                        </a>
                      </div>
                    </div>
                  </>
                )}

                {(park.latitude && park.longitude) && (
                  <>
                    <Separator />
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => window.open(`https://www.google.com/maps?q=${park.latitude},${park.longitude}`, '_blank')}
                      data-testid="button-open-maps"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Ver en Google Maps
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            {(park.administrator || park.foundationYear) && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalles adicionales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {park.administrator && (
                    <div>
                      <p className="text-sm text-muted-foreground">Administrador</p>
                      <p className="font-medium">{park.administrator}</p>
                    </div>
                  )}

                  {park.foundationYear && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground">Año de fundación</p>
                        <p className="font-medium">{park.foundationYear}</p>
                      </div>
                    </>
                  )}

                  {park.greenArea && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground">Área verde</p>
                        <p className="font-medium">{Number(park.greenArea).toLocaleString()} m²</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Video */}
            {park.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video">
                    <iframe
                      src={park.videoUrl.replace('watch?v=', 'embed/')}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
