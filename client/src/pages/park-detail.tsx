import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { ExtendedPark } from '@shared/schema';
import { 
  ChevronLeft, 
  Loader, 
  MapPin, 
  AlertCircle,
  FileText,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { IncidentReportForm } from '@/components/IncidentReportForm';
import AmenityIcon from '@/components/AmenityIcon';
import ParkQuickActions from '@/components/ParkQuickActions';
import { ParkImageManager } from '@/components/ParkImageManager';
import { useAuth } from '@/hooks/useAuth';
import { formatScheduleForDisplay, getScheduleStatus } from '@/lib/schedule-utils';


const ParkDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // Fetch park details
  const { data: park, isLoading, error } = useQuery<ExtendedPark>({
    queryKey: [`/api/parks/${id}`],
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-gray-500">Cargando información del parque...</p>
        </div>
      </div>
    );
  }
  
  if (error || !park) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No se pudo cargar el parque</h2>
          <p className="text-gray-600 mb-4">Ocurrió un error al cargar la información. Por favor, intenta nuevamente más tarde.</p>
          <Button 
            variant="default"
            onClick={() => setLocation('/parks')}
          >
            Volver a la lista de parques
          </Button>
        </div>
      </div>
    );
  }
  
  const getParkTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'metropolitano': 'Metropolitano',
      'barrial': 'Barrial',
      'vecinal': 'Vecinal',
      'lineal': 'Lineal',
      'ecologico': 'Ecológico',
      'botanico': 'Botánico',
      'deportivo': 'Deportivo'
    };
    return typeMap[type] || type;
  };
  
  // Format dates
  const formatDate = (date: Date) => {
    return format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy • h:mm a", { locale: es });
  };
  
  // Get images - Fixed logic to properly display all park images
  const mainImage = park.images && park.images.length > 0 ? park.images[0].imageUrl : '';
  const additionalImages = park.images && park.images.length > 1 ? park.images.slice(1).map(img => img.imageUrl) : [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setLocation('/parks')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver a parques
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-heading">{park.name}</h1>
            <p className="text-gray-600">
              {park.municipalityText || ''}
            </p>
          </div>
          <div className="mt-2 md:mt-0">
            <Badge className="bg-primary-100 text-primary-800 font-medium">
              {getParkTypeLabel(park.parkType)}
            </Badge>
          </div>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Left column */}
          <div className="lg:col-span-2">
            {/* Hero image */}
            <div className="rounded-lg overflow-hidden mb-4">
              <img 
                src={mainImage || 'https://placehold.co/600x400/e2e8f0/64748b?text=Sin+Imagen'} 
                alt={park.name} 
                className="w-full h-80 object-cover"
              />
            </div>
            
            {/* Image gallery - Galería de miniaturas mejorada */}
            {additionalImages.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mb-6">
                {additionalImages.slice(0, 5).map((imageUrl, idx) => (
                  <div key={idx} className="relative group cursor-pointer">
                    <img 
                      src={imageUrl} 
                      alt={`Vista del parque ${idx + 1}`} 
                      className="w-full h-20 object-cover rounded transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-200 rounded"></div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Tabs */}
            <Tabs defaultValue="images" className="mt-6">
              <TabsList>
                <TabsTrigger value="images">Galería de Imágenes</TabsTrigger>
                <TabsTrigger value="info">Información General</TabsTrigger>
                <TabsTrigger value="amenities">Amenidades</TabsTrigger>
                <TabsTrigger value="activities">Actividades</TabsTrigger>
              </TabsList>
              
              <TabsContent value="images" className="mt-4">
                {isAuthenticated ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Gestión de Imágenes</h2>
                      <p className="text-sm text-gray-500">Administra las imágenes del parque</p>
                    </div>
                    <ParkImageManager parkId={Number(id)} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Galería de Imágenes</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {mainImage && (
                        <div className="col-span-full mb-4">
                          <img 
                            src={mainImage} 
                            alt={`Imagen principal de ${park.name}`}
                            className="w-full h-auto rounded-lg"
                          />
                        </div>
                      )}
                      {additionalImages && additionalImages.map((img, index) => (
                        <div key={index} className="aspect-square overflow-hidden rounded-lg">
                          <img
                            src={img}
                            alt={`Vista de ${park.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="info" className="mt-4">
                {park.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">Descripción</h2>
                    <p className="text-gray-700">{park.description}</p>
                  </div>
                )}
                
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Información general</h2>
                  <div className="space-y-2">
                    {park.area && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Superficie:</span>
                        <span className="font-medium">{park.area}</span>
                      </div>
                    )}
                    
                    {park.foundationYear && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Año de fundación:</span>
                        <span className="font-medium">{park.foundationYear}</span>
                      </div>
                    )}
                    
                    {park.openingHours && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Horario:</span>
                        <span className="font-medium">{formatScheduleForDisplay(park.openingHours)}</span>
                      </div>
                    )}
                    
                    {park.conservationStatus && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Estado de conservación:</span>
                        <span className={`font-medium px-2 py-1 rounded-full text-sm ${
                          park.conservationStatus.toLowerCase() === 'excelente' ? 'bg-green-100 text-green-800' :
                          park.conservationStatus.toLowerCase() === 'bueno' ? 'bg-blue-100 text-blue-800' :
                          park.conservationStatus.toLowerCase() === 'regular' ? 'bg-yellow-100 text-yellow-800' :
                          park.conservationStatus.toLowerCase() === 'malo' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {park.conservationStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Contacto</h2>
                  <div className="space-y-2">
                    {park.administrator && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Administrador:</span>
                        <span className="font-medium">{park.administrator}</span>
                      </div>
                    )}
                    
                    {park.contactPhone && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Teléfono:</span>
                        <span className="font-medium">{park.contactPhone}</span>
                      </div>
                    )}
                    
                    {park.contactEmail && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{park.contactEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="amenities" className="mt-4">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Servicios y comodidades</h2>
                  
                  {park.amenities && park.amenities.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {park.amenities.map(amenity => (
                        <div key={amenity.id} className="flex items-center p-3 border rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 mr-3 flex items-center justify-center">
                            <AmenityIcon 
                              name={amenity.icon || ''} 
                              customIconUrl={amenity.customIconUrl || null} 
                              iconType={amenity.customIconUrl ? 'custom' : 'system'}
                              className="w-6 h-6 text-primary"
                            />
                          </div>
                          <span>{amenity.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No hay servicios registrados para este parque.</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="activities" className="mt-4">
                {park.activities && park.activities.length > 0 ? (
                  <div className="space-y-4">
                    {park.activities.map(activity => (
                      <div key={activity.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{activity.title}</h3>
                          {activity.category && (
                            <Badge className="bg-secondary-100 text-secondary-800">
                              {activity.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatDate(activity.startDate)}
                        </p>
                        <p className="text-gray-700">{activity.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No hay actividades programadas actualmente.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right column - sidebar */}
          <div className="lg:col-span-1">
            {/* Map card */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-6">
              <div className="h-48">
                <iframe
                  title={`Mapa de ${park.name}`}
                  className="w-full h-full"
                  src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${park.latitude},${park.longitude}`}
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-2">Ubicación</h3>
                <p className="text-gray-600 text-sm mb-3">{park.address}</p>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      const coords = `${park.latitude},${park.longitude}`;
                      const destination = encodeURIComponent(`${park.name}, ${park.address}`);
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${coords}`, '_blank');
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Cómo llegar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      const coords = `${park.latitude},${park.longitude}`;
                      window.open(`https://www.google.com/maps/@${coords},17z`, '_blank');
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Ver en Google Maps
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Quick actions */}
            <ParkQuickActions 
              parkId={Number(id)}
              parkName={park.name}
              videoUrl={park.videoUrl}
              regulationUrl={park.regulationUrl}
              activities={park.activities}
            />
            
            {/* Report issues */}
            <div className="bg-primary-50 border border-primary-100 rounded-lg overflow-hidden mb-6">
              <div className="p-4">
                <h3 className="font-medium text-lg mb-2">¿Encontraste un problema?</h3>
                <p className="text-gray-600 text-sm mb-4">Ayúdanos a mejorar reportando incidentes o problemas en el parque.</p>
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={() => setIsReportDialogOpen(true)}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Reportar un problema
                </Button>
              </div>
            </div>

            {/* Documentos y Reglamentos */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
              <div className="p-4">
                <h3 className="font-medium text-lg mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Documentos y Reglamentos
                </h3>
                {park.documents && park.documents.length > 0 ? (
                  <div className="space-y-2">
                    {park.documents.map(document => (
                      <a 
                        key={document.id}
                        href={document.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FileText className={`h-6 w-6 mr-3 ${
                          document.fileType?.includes('pdf') ? 'text-red-500' : 'text-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{document.title}</p>
                          {document.fileSize && (
                            <p className="text-xs text-gray-500">{document.fileSize}</p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">No hay documentos disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Diálogo para reportar incidentes */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reportar un problema en {park.name}</DialogTitle>
            <DialogDescription>
              Cuéntanos qué problema has encontrado y lo revisaremos lo antes posible.
            </DialogDescription>
          </DialogHeader>
          <IncidentReportForm 
            parkId={Number(id)} 
            parkName={park.name}
            onSuccess={() => setIsReportDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      

    </div>
  );
};

export default ParkDetail;