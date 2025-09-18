import React from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ArrowLeft,
  Camera, 
  MapPin, 
  Share2, 
  Download, 
  FileText, 
  AlertCircle,
  MessageSquare,
  Trees,
  Globe,
  Calendar,
  Clock,
  Phone,
  Mail,
  Store,
  User,
  ExternalLink,
  Users,
  Heart,
  GraduationCap,
  Star
} from 'lucide-react';
import { ExtendedPark } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AmenityIcon from '@/components/ui/amenity-icon';
import TreeSpeciesIcon from '@/components/ui/tree-species-icon';
import TreePhotoViewer from '@/components/TreePhotoViewer';
import PublicInstructorEvaluationForm from '@/components/PublicInstructorEvaluationForm';
import ParkEvaluationsSectionSimple from '@/components/ParkEvaluationsSectionSimple';
import PublicLayout from '@/components/PublicLayout';

const greenFlagLogo = "/images/green-flag-logo.jpg";

function ParkLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [selectedInstructor, setSelectedInstructor] = React.useState<any>(null);
  const [selectedVolunteer, setSelectedVolunteer] = React.useState<any>(null);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = React.useState(false);
  const [selectedSpeciesData, setSelectedSpeciesData] = React.useState<any>(null);
  const [selectedActivityData, setSelectedActivityData] = React.useState<any>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = React.useState(false);
  
  // Estados para los formularios de acciones
  const [isShareDialogOpen, setIsShareDialogOpen] = React.useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = React.useState(false);
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = React.useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = React.useState(false);
  
  // Estados para los formularios
  const [reportForm, setReportForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    issueType: '',
    description: '',
    urgency: 'media'
  });
  
  const [suggestionForm, setSuggestionForm] = React.useState({
    name: '',
    email: '',
    suggestion: '',
    category: ''
  });
  
  const [eventForm, setEventForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    eventName: '',
    eventType: '',
    expectedAttendees: '',
    eventDate: '',
    description: ''
  });
  
  // Extraer ID del slug (formato: nombre-parque-id)
  const parkId = slug?.split('-').pop();

  const { data: park, isLoading, error } = useQuery<ExtendedPark>({
    queryKey: [`/api/parks/${parkId}/extended`],
    suspense: false,
    retry: 1,
    enabled: !!parkId,
  });

  // Functions for image modal
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setIsImageModalOpen(false);
    setSelectedSpeciesData(null);
  };

  const goToPreviousImage = () => {
    if (!selectedImage || !park) return;
    const primaryImageExists = park?.images?.some(img => img.isPrimary) || false;
    const mainImage = park.primaryImage || 
      (park.images && park.images.length > 0 ? park.images[0].imageUrl : '') ||
      (park.images && park.images.length > 0 ? park.images[0].url : '');
    
    const additionalImages = park?.images?.filter((img, index) => {
      if (primaryImageExists) {
        return !img.isPrimary;
      } else {
        return index !== 0;
      }
    }) || [];
    
    const allImages = [
      ...(mainImage ? [{ imageUrl: mainImage, caption: `Vista principal de ${park.name}` }] : []),
      ...additionalImages
    ];
    
    const currentIndex = allImages.findIndex(img => img.imageUrl === selectedImage);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : allImages.length - 1;
    setSelectedImage(allImages[previousIndex].imageUrl);
  };

  const goToNextImage = () => {
    if (!selectedImage || !park) return;
    const primaryImageExists = park?.images?.some(img => img.isPrimary) || false;
    const mainImage = park.primaryImage || 
      (park.images && park.images.length > 0 ? park.images[0].imageUrl : '') ||
      (park.images && park.images.length > 0 ? park.images[0].url : '');
    
    const additionalImages = park?.images?.filter((img, index) => {
      if (primaryImageExists) {
        return !img.isPrimary;
      } else {
        return index !== 0;
      }
    }) || [];
    
    const allImages = [
      ...(mainImage ? [{ imageUrl: mainImage, caption: `Vista principal de ${park.name}` }] : []),
      ...additionalImages
    ];
    
    const currentIndex = allImages.findIndex(img => img.imageUrl === selectedImage);
    const nextIndex = currentIndex < allImages.length - 1 ? currentIndex + 1 : 0;
    setSelectedImage(allImages[nextIndex].imageUrl);
  };

  // Keyboard navigation - Always call this hook
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isImageModalOpen) return;
      
      switch (e.key) {
        case 'Escape':
          closeImageModal();
          break;
        case 'ArrowLeft':
          goToPreviousImage();
          break;
        case 'ArrowRight':
          goToNextImage();
          break;
      }
    };

    if (isImageModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isImageModalOpen, selectedImage]);

  // Funciones para manejar las acciones de los botones
  const handleSharePark = async () => {
    const parkUrl = window.location.href;
    
    // First perform the sharing action
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${park?.name} - ParkSys`,
          text: `¡Descubre ${park?.name}! Un hermoso parque en ${park?.location}`,
          url: parkUrl,
        });
      } catch (error) {
        // User cancelled sharing
        return;
      }
    } else {
      navigator.clipboard.writeText(parkUrl);
      toast({
        title: "Enlace copiado",
        description: "El enlace del parque se ha copiado al portapapeles",
      });
    }
    
    setIsShareDialogOpen(false);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parkId: parseInt(parkId),
          formType: 'report_problem',
          fullName: reportForm.name,
          email: reportForm.email,
          phone: reportForm.phone || undefined,
          subject: `Reporte de problema: ${reportForm.issueType}`,
          message: reportForm.description,
          category: reportForm.issueType,
          priority: reportForm.urgency
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar el reporte');
      }
      
      toast({
        title: "Reporte enviado",
        description: "Tu reporte ha sido enviado exitosamente. Nos pondremos en contacto contigo pronto.",
      });
      
      // Limpiar formulario
      setReportForm({
        name: '',
        email: '',
        phone: '',
        issueType: '',
        description: '',
        urgency: 'media'
      });
      setIsReportDialogOpen(false);
    } catch (error) {
      console.error('Error al enviar reporte:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu reporte. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parkId: parseInt(parkId),
          formType: 'suggest_improvement',
          fullName: suggestionForm.name,
          email: suggestionForm.email,
          subject: `Sugerencia de mejora para ${park?.name}`,
          message: suggestionForm.suggestion,
          category: suggestionForm.category
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar la sugerencia');
      }
      
      toast({
        title: "Sugerencia enviada",
        description: "Tu sugerencia ha sido enviada exitosamente. ¡Gracias por ayudarnos a mejorar!",
      });
      
      // Limpiar formulario
      setSuggestionForm({
        name: '',
        email: '',
        suggestion: '',
        category: ''
      });
      setIsSuggestionDialogOpen(false);
    } catch (error) {
      console.error('Error al enviar sugerencia:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu sugerencia. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parkId: parseInt(parkId),
          formType: 'propose_event',
          fullName: eventForm.name,
          email: eventForm.email,
          phone: eventForm.phone || undefined,
          subject: `Propuesta de evento: ${eventForm.eventName}`,
          message: eventForm.description,
          eventType: eventForm.eventType,
          suggestedDate: eventForm.eventDate,
          expectedAttendance: eventForm.expectedAttendees ? parseInt(eventForm.expectedAttendees) : undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar la propuesta');
      }
      
      toast({
        title: "Propuesta enviada",
        description: "Tu propuesta de evento ha sido enviada exitosamente. Te contactaremos para coordinar los detalles.",
      });
      
      // Limpiar formulario
      setEventForm({
        name: '',
        email: '',
        phone: '',
        eventName: '',
        eventType: '',
        expectedAttendees: '',
        eventDate: '',
        description: ''
      });
      setIsEventDialogOpen(false);
    } catch (error) {
      console.error('Error al enviar propuesta de evento:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu propuesta. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del parque...</p>
        </div>
      </div>
    );
  }

  if (error || !park) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <FileText className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Parque no encontrado</h1>
          <p className="text-gray-600 mb-6">No pudimos encontrar la información de este parque.</p>
          <Link href="/parks">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a parques
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get main image - prioritize primary image or first available image
  const primaryImageExists = park?.images?.some(img => img.isPrimary) || false;
  const mainImage = park ? (park.primaryImage || 
    (park.images && park.images.length > 0 ? park.images[0].imageUrl : '') ||
    (park.images && park.images.length > 0 ? park.images[0].url : '')) : '';
  
  // Si hay imagen primaria marcada, excluirla de adicionales
  // Si NO hay imagen primaria, excluir la primera imagen que se usa como main
  const additionalImages = park?.images?.filter((img, index) => {
    if (primaryImageExists) {
      return !img.isPrimary; // Excluir solo las marcadas como primarias
    } else {
      return index !== 0; // Excluir la primera imagen (que se usa como main)
    }
  }) || [];
  
  // All images for gallery - sin duplicación
  const allImages = [
    ...(mainImage ? [{ imageUrl: mainImage, caption: `Vista principal de ${park?.name || 'Parque'}` }] : []),
    ...additionalImages
  ];

  // Format dates
  const formatDate = (date: string | Date) => {
    if (!date) return 'Fecha por confirmar';
    return format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy • h:mm a", { locale: es });
  };

  // Get park type label
  const getParkTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'metropolitano': 'Metropolitano',
      'barrial': 'Barrial', 
      'vecinal': 'Vecinal',
      'lineal': 'Lineal',
      'ecologico': 'Ecológico',
      'botanico': 'Botánico',
      'deportivo': 'Deportivo',
      'urbano': 'Urbano',
      'natural': 'Natural',
      'temático': 'Temático'
    };
    return typeMap[type] || type;
  };

  // Check if park should show Green Flag Award logo
  const shouldShowGreenFlag = (park: ExtendedPark) => {
    // Verificar si el parque tiene la certificación Green Flag Award
    return park.certificaciones?.includes('Green Flag Award') || false;
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50">
      {/* Hero Image Section con Header Navigation Superpuesto */}
      <div className="relative h-[600px] overflow-hidden">
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={park.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
            <Trees className="h-24 w-24 text-white opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Navigation Link - Top Left */}
        <div className="absolute top-6 left-6 z-20">
          <Link href="/parks" className="flex items-center gap-2 text-white hover:text-white/80 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a parques</span>
          </Link>
        </div>

        {/* Main Header Info - Center */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex flex-col items-center gap-6">
              {/* Park Name and Certification */}
              <div className="text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 drop-shadow-lg">
                  {park.name}
                </h1>
                
                {/* Green Flag Award Logo - Solo para parques certificados */}
                {shouldShowGreenFlag(park) && (
                  <div className="flex justify-center">
                    <img 
                      src={greenFlagLogo} 
                      alt="Green Flag Award" 
                      className="h-24 w-36 object-contain bg-white/95 rounded-lg p-3 shadow-2xl border-2 border-green-500"
                      title="Green Flag Award - Parque Certificado"
                    />
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </div>

        {/* Location - Above Statistics */}
        <div className="absolute bottom-20 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 text-white/90 text-lg mb-4">
              <MapPin className="h-5 w-5" />
              <span>{park.municipalityText || ''}</span>
            </div>
          </div>
        </div>

        {/* Bottom Statistics - Activities Style */}
        <div className="absolute bottom-8 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center gap-4 text-green-100">
              <div className="flex items-center gap-2">
                <Trees className="h-5 w-5" />
                <span>{getParkTypeLabel(park.parkType || 'urbano')}</span>
              </div>
              {park.area && (
                <>
                  <Separator orientation="vertical" className="h-6 bg-green-300" />
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>
                      {Number(park.area) >= 10000 
                        ? `${(Number(park.area) / 10000).toFixed(1)} hectáreas` 
                        : `${park.area} m²`}
                    </span>
                  </div>
                </>
              )}
              {park.foundationYear && (
                <>
                  <Separator orientation="vertical" className="h-6 bg-green-300" />
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>Est. {park.foundationYear}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Galería de Imágenes con Información Integrada - Full Width Section debajo del Hero */}
      {additionalImages.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
              <p className="text-xl font-bold text-gray-800">
                Descubre el bosque, sus espacios y actividades
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allImages.slice(0, 12).map((image, idx) => (
                <div 
                  key={idx} 
                  className="relative group overflow-hidden rounded-xl hover:shadow-xl transition-all duration-300 cursor-pointer bg-white border border-gray-200"
                  onClick={() => openImageModal(image.imageUrl)}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img 
                      src={image.imageUrl} 
                      alt={image.caption || `Vista del parque ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                          <Camera className="w-5 h-5 text-gray-800" />
                        </div>
                        {image.caption && (
                          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1">
                            <p className="text-white text-sm font-medium truncate max-w-48">
                              {image.caption}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {allImages.length > 12 && (
                <div 
                  className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-600 hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-all"
                  onClick={() => {
                    // Abrir modal con todas las imágenes restantes
                    if (allImages.length > 12) {
                      openImageModal(allImages[12].imageUrl);
                    }
                  }}
                >
                  <Camera className="h-8 w-8 mb-2" />
                  <p className="font-semibold text-lg">+{allImages.length - 12}</p>
                  <p className="text-sm">fotos más</p>
                </div>
              )}
            </div>

            {/* Información General integrada continuamente en la galería */}
            <div className="mt-12">
              <p className="text-gray-700 leading-relaxed text-lg mb-8 text-center max-w-4xl mx-auto font-bold">
                {park.description || 'Espacio verde público destinado al esparcimiento y recreación de la comunidad.'}
              </p>
              
              {/* Stats Cards Grid - estilo similar a volunteers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Tipo</p>
                  <p className="font-bold text-gray-900">{getParkTypeLabel(park.parkType || 'urbano')}</p>
                </div>
                
                {park.area && (
                  <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Trees className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Superficie</p>
                    <p className="font-bold text-gray-900">
                      {Number(park.area) >= 10000 
                        ? `${(Number(park.area) / 10000).toFixed(1)} ha` 
                        : `${park.area} m²`}
                    </p>
                  </div>
                )}
                
                {park.foundationYear && (
                  <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Fundado</p>
                    <p className="font-bold text-gray-900">{park.foundationYear}</p>
                  </div>
                )}
                
                <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Horario</p>
                  <p className="font-bold text-gray-900">7:00 - 19:30</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Amenidades del Parque - Sección completa */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trees className="h-6 w-6 text-green-600" />
                Amenidades del Parque
              </CardTitle>
            </CardHeader>
            <CardContent>
              {park.amenities && park.amenities.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {park.amenities.map((amenity) => (
                    <div key={amenity.id} className="flex flex-col items-center p-4 bg-white rounded-lg border text-center hover:shadow-md transition-all duration-300">
                      <div className="w-16 h-16 flex items-center justify-center mb-3">
                        {amenity.iconType === 'custom' && amenity.customIconUrl ? (
                          <img 
                            src={amenity.customIconUrl} 
                            alt={amenity.name}
                            className="w-16 h-16 object-contain"
                            onError={(e) => {
                              console.error('Error cargando icono:', amenity.customIconUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <Trees className="h-8 w-8 text-green-600" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-center">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trees className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay amenidades registradas para este parque.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actividades del Parque - Sección después de amenidades */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-6 w-6 text-orange-600" />
                Actividades del Parque
              </CardTitle>
            </CardHeader>
            <CardContent>
              {park.activities && park.activities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {park.activities.slice(0, 6).map((activity) => (
                    <div 
                      key={activity.id} 
                      className="group cursor-pointer bg-white rounded-lg border border-orange-200 hover:border-orange-400 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md"
                      onClick={() => {
                        setSelectedActivityData(activity);
                        setIsActivityModalOpen(true);
                      }}
                    >
                      <div className="aspect-[4/3] relative overflow-hidden">
                        {activity.imageUrl ? (
                          <img 
                            src={activity.imageUrl}
                            alt={activity.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                            <Calendar className="h-16 w-16 text-orange-600 opacity-70" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                        
                        {/* Badge de categoría */}
                        {activity.category && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="text-xs bg-white/90 text-orange-700 border-orange-300">
                              {activity.category}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Precio si no es gratuita */}
                        {!activity.isFree && activity.price && (
                          <div className="absolute bottom-2 left-2">
                            <Badge className="text-xs bg-green-600 text-white">
                              ${activity.price}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-orange-800 text-sm line-clamp-2 mb-2">
                          {activity.title}
                        </h4>
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(activity.startDate)}
                        </div>
                        {activity.location && (
                          <div className="flex items-center text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">{activity.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay actividades programadas</h3>
                  <p className="text-gray-500 mb-4">Próximamente se publicarán nuevos eventos y actividades</p>
                  <Link href="/activities">
                    <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                      <Calendar className="h-4 w-4 mr-2" />
                      Explorar todas las actividades
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Enlace para ver todas las actividades */}
              {park.activities && park.activities.length > 0 && (
                <div className="text-center pt-6 border-t mt-6">
                  <Link href="/activities">
                    <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                      <Calendar className="h-4 w-4 mr-2" />
                      Ver todas las actividades ({park.activities.length})
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Instructores y Voluntarios - Nueva sección 2/2 */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Instructores - Columna izquierda */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Instructores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {park.instructors && park.instructors.length > 0 ? (
                  <div className="space-y-3">
                    {park.instructors.slice(0, 3).map((instructor) => (
                      <div key={instructor.id} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-purple-200">
                        {instructor.profileImageUrl ? (
                          <img 
                            src={instructor.profileImageUrl} 
                            alt={instructor.fullName}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="h-6 w-6 text-purple-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-purple-900 text-sm line-clamp-2">{instructor.fullName}</h4>
                              {instructor.specialties && (
                                <div className="mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {(() => {
                                      let specialtiesList: string[] = [];
                                      const specialties = instructor.specialties;
                                      
                                      if (specialties.startsWith('{') && specialties.endsWith('}')) {
                                        const arrayContent = specialties.slice(1, -1);
                                        specialtiesList = arrayContent
                                          .split(',')
                                          .map(s => {
                                            let cleaned = s.trim();
                                            cleaned = cleaned.replace(/^"+/, '').replace(/"+$/, '');
                                            cleaned = cleaned.replace(/^'+/, '').replace(/'+$/, '');
                                            cleaned = cleaned.replace(/^\[+/, '').replace(/\]+$/, '');
                                            return cleaned;
                                          })
                                          .filter(s => s && s !== 'null' && s !== '');
                                      } else {
                                        try {
                                          const parsed = JSON.parse(specialties);
                                          if (Array.isArray(parsed)) {
                                            specialtiesList = parsed.filter(s => s && s !== 'null');
                                          }
                                        } catch {
                                          specialtiesList = [specialties];
                                        }
                                      }
                                      
                                      return specialtiesList.slice(0, 2).map((specialty, index) => (
                                        <Badge 
                                          key={index} 
                                          variant="outline" 
                                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                        >
                                          {specialty}
                                        </Badge>
                                      ));
                                    })()}
                                  </div>
                                </div>
                              )}
                              {instructor.email && (
                                <div className="flex items-center mt-2 text-xs text-purple-600">
                                  <Mail className="h-3 w-3 mr-1" />
                                  <span className="truncate">{instructor.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No hay instructores asignados</p>
                  </div>
                )}

                {/* Enlace a página de instructores */}
                <div className="mt-6 text-center">
                  <Link 
                    href="/instructors"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Conoce a nuestros instructores
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Voluntarios - Columna derecha */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  Voluntarios Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {park.volunteers && park.volunteers.length > 0 ? (
                  <div className="space-y-3">
                    {park.volunteers.slice(0, 1).map((volunteer) => (
                      <div key={volunteer.id} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-pink-200">
                        {volunteer.profileImageUrl ? (
                          <img 
                            src={volunteer.profileImageUrl} 
                            alt={volunteer.fullName}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://i.pravatar.cc/150?img=11'; // Volunteer placeholder
                              target.onerror = null; // Evitar loop infinito
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <Heart className="h-6 w-6 text-pink-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-pink-900 text-sm line-clamp-2">{volunteer.fullName}</h4>
                              {volunteer.interests && (
                                <div className="mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {(() => {
                                      let interestsList: string[] = [];
                                      const interests = volunteer.interests;
                                      
                                      if (interests.startsWith('{') && interests.endsWith('}')) {
                                        const arrayContent = interests.slice(1, -1);
                                        interestsList = arrayContent
                                          .split(',')
                                          .map(s => {
                                            let cleaned = s.trim();
                                            cleaned = cleaned.replace(/^"+/, '').replace(/"+$/, '');
                                            cleaned = cleaned.replace(/^'+/, '').replace(/'+$/, '');
                                            cleaned = cleaned.replace(/^\[+/, '').replace(/\]+$/, '');
                                            return cleaned;
                                          })
                                          .filter(s => s && s !== 'null' && s !== '');
                                      } else {
                                        try {
                                          const parsed = JSON.parse(interests);
                                          if (Array.isArray(parsed)) {
                                            interestsList = parsed.filter(s => s && s !== 'null');
                                          }
                                        } catch {
                                          interestsList = [interests];
                                        }
                                      }
                                      
                                      return interestsList.slice(0, 2).map((interest, index) => (
                                        <Badge 
                                          key={index} 
                                          variant="outline" 
                                          className="text-xs bg-pink-50 text-pink-700 border-pink-200"
                                        >
                                          {interest}
                                        </Badge>
                                      ));
                                    })()}
                                  </div>
                                </div>
                              )}
                              {volunteer.email && (
                                <div className="flex items-center mt-2 text-xs text-pink-600">
                                  <Mail className="h-3 w-3 mr-1" />
                                  <span className="truncate">{volunteer.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No hay voluntarios activos</p>
                  </div>
                )}

                {/* Enlace a página de voluntarios */}
                <div className="mt-6 text-center">
                  <Link 
                    href="/volunteers"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white font-medium rounded-lg hover:from-pink-700 hover:to-pink-800 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    Conoce a nuestros voluntarios
                  </Link>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Especies Arbóreas - Sección después de actividades */}
      <div className="bg-green-50/50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trees className="h-6 w-6 text-green-600" />
                Especies Arbóreas del Parque
              </CardTitle>
            </CardHeader>
            <CardContent>
              {park.treeSpecies && park.treeSpecies.length > 0 ? (
                <div className="space-y-6">
                  {/* Solo mostrar las primeras 4 especies en una fila */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {park.treeSpecies.slice(0, 4).map((species: any) => (
                      <div 
                        key={species.id} 
                        className="group cursor-pointer bg-white rounded-lg border border-green-200 hover:border-green-400 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                        onClick={() => {
                          // Crear modal con información técnica detallada
                          const speciesImageUrl = species.photoUrl || species.customPhotoUrl;
                          if (speciesImageUrl) {
                            openImageModal(speciesImageUrl);
                            // Guardar información técnica para mostrar en el modal
                            setSelectedSpeciesData(species);
                          }
                        }}
                      >
                        <div className="aspect-square relative overflow-hidden">
                          {species.photoUrl || species.customPhotoUrl ? (
                            <img 
                              src={species.photoUrl || species.customPhotoUrl}
                              alt={species.commonName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                              <TreeSpeciesIcon 
                                iconType={species.iconType}
                                customIconUrl={species.customIconUrl}
                                size={64}
                              />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                        </div>
                        <div className="p-4 text-center">
                          <h4 className="font-semibold text-green-800 text-sm line-clamp-2 mb-1">
                            {species.commonName}
                          </h4>
                          {species.scientificName && (
                            <p className="text-xs text-gray-500 italic line-clamp-1">
                              {species.scientificName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Botón Ver todas las especies */}
                  <div className="text-center pt-6 border-t">
                    <Link href="/tree-species">
                      <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                        <Trees className="h-4 w-4 mr-2" />
                        Ver todas las especies ({park.treeSpecies.length})
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                  <Trees className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay especies arbóreas registradas</h3>
                  <p className="text-gray-500 mb-4">Este parque aún no tiene especies arbóreas asignadas en el plan de arbolado urbano</p>
                  <Link href="/tree-species">
                    <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                      <Trees className="h-4 w-4 mr-2" />
                      Explorar catálogo de especies
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Concesiones y Servicios - Sección después de actividades */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Store className="h-6 w-6 text-blue-600" />
                Concesiones y Servicios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {park.concessions && park.concessions.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {park.concessions.map((concession, index) => (
                      <Link key={`concession-${concession.id}-${index}`} href={`/concession/${concession.id}`}>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-300 group">
                          {/* Imagen de la concesión */}
                          <div className="relative h-48 overflow-hidden">
                            {concession.primaryImage ? (
                              <img 
                                src={concession.primaryImage} 
                                alt={concession.vendorName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <Store className="h-16 w-16 text-white opacity-80" />
                              </div>
                            )}
                            
                            {/* Badge del tipo de concesión */}
                            {concession.concessionType && (
                              <div className="absolute top-3 right-3">
                                <Badge variant="secondary" className="text-xs bg-white/95 text-blue-700 border-blue-300 font-medium">
                                  {concession.concessionType}
                                </Badge>
                              </div>
                            )}

                            {/* Estado de la concesión */}
                            <div className="absolute top-3 left-3">
                              <Badge className="text-xs bg-green-600 text-white">
                                Activa
                              </Badge>
                            </div>
                          </div>

                          {/* Contenido de la tarjeta */}
                          <div className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <Store className="h-5 w-5 text-blue-600" />
                              <h3 className="font-bold text-gray-900 text-base">{concession.vendorName}</h3>
                            </div>
                            
                            {concession.typeDescription && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">{concession.typeDescription}</p>
                            )}
                            
                            <div className="space-y-2">
                              {concession.location && (
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                  <MapPin className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{concession.location}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                <span>Desde {concession.startDate ? format(new Date(concession.startDate), 'MMM yyyy', { locale: es }) : 'Fecha no disponible'}</span>
                              </div>

                              {concession.vendorPhone && (
                                <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                                  <Phone className="h-4 w-4 flex-shrink-0" />
                                  <span>{concession.vendorPhone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  <div className="text-center pt-6 border-t">
                    <Link href="/concessions">
                      <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                        <Store className="h-4 w-4 mr-2" />
                        Ver todas las concesiones ({park.concessions.length})
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                  <Store className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay concesiones activas</h3>
                  <p className="text-gray-500 mb-4">Este parque no tiene concesiones comerciales disponibles actualmente</p>
                  <Link href="/concessions">
                    <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                      <Store className="h-4 w-4 mr-2" />
                      Explorar todas las concesiones
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Realiza tu evento y Evaluaciones Ciudadanas - Grid 2 columnas */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Realiza tu evento - Lado izquierdo */}
            <div>
              <Card className="bg-white border-2 border-green-500 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Calendar className="h-5 w-5" />
                    ¡Realiza tu evento aquí!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-700 mb-8">
                    Organiza tu evento en este parque. Tenemos opciones para eventos de bajo y alto impacto.
                  </p>
                  <div className="space-y-6">
                    <Link href="/admin/eventos-ambu/solicitud-bajo-impacto">
                      <Button 
                        variant="outline" 
                        className="w-full bg-white hover:bg-green-50 text-green-700 border-green-300 hover:border-green-400"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Solicitud de evento de bajo impacto
                      </Button>
                    </Link>
                    <Link href="/admin/eventos-ambu/solicitud-alto-impacto">
                      <Button 
                        variant="outline" 
                        className="w-full bg-white hover:bg-green-50 text-green-700 border-green-300 hover:border-green-400"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Solicitud de evento de alto impacto
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Evaluaciones Ciudadanas - Lado derecho */}
            <div>
              <ParkEvaluationsSectionSimple parkId={park.id} parkSlug={slug || ''} />
            </div>
            
          </div>
        </div>
      </div>

      {/* Sección de Ubicación con Información de Contacto */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-6 w-6 text-blue-600" />
                Ubicación y Contacto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Mapa y Información de Ubicación - 3/4 */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Información de Ubicación */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="font-medium">{park.address || 'No especificada'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Municipio</p>
                      <p className="font-medium">{park.municipalityText || ''}</p>
                    </div>
                  </div>

                  {/* Mapa */}
                  <div className="rounded-lg overflow-hidden h-64 bg-gray-200 border">
                    <iframe
                      title={`Mapa de ${park.name}`}
                      className="w-full h-full"
                      src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${park.latitude},${park.longitude}`}
                      allowFullScreen
                    ></iframe>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex flex-col sm:flex-row gap-2">
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
                      <MapPin className="h-4 w-4 mr-2" />
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
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver en Maps
                    </Button>
                  </div>
                </div>
                
                {/* Información de Contacto - 1/4 con altura coincidente al mapa */}
                <div className="lg:col-span-1 flex flex-col">
                  {/* Spacer superior para alinear con el mapa */}
                  <div className="mb-16"></div>
                  
                  {(park.administrator || park.contactPhone || park.contactEmail) && (
                    <div className="bg-gray-50 rounded-lg p-6 flex-1 h-64 flex flex-col justify-center">
                      <h4 className="font-semibold mb-4 text-gray-900 text-center">Información de Contacto</h4>
                      <div className="space-y-4">
                        {park.administrator && (
                          <div className="flex items-start">
                            <User className="h-4 w-4 mr-3 text-gray-500 mt-1" />
                            <div>
                              <p className="text-sm text-gray-500">Administrador</p>
                              <p className="font-medium text-sm">{park.administrator}</p>
                            </div>
                          </div>
                        )}
                        
                        {park.contactPhone && (
                          <div className="flex items-start">
                            <Phone className="h-4 w-4 mr-3 text-gray-500 mt-1" />
                            <div>
                              <p className="text-sm text-gray-500">Teléfono</p>
                              <p className="font-medium text-sm">{park.contactPhone}</p>
                            </div>
                          </div>
                        )}
                        
                        {park.contactEmail && (
                          <div className="flex items-start">
                            <Mail className="h-4 w-4 mr-3 text-gray-500 mt-1" />
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="font-medium text-sm break-all">{park.contactEmail}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Documentos y Reglamentos + Acciones */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Documentos y Reglamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-6 w-6 text-gray-600" />
                  Documentos y Reglamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {park.documents && park.documents.length > 0 ? (
                  <div className="space-y-3">
                    {park.documents.map((doc) => (
                      <a 
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-4 border rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                      >
                        <FileText className={`h-8 w-8 mr-4 ${
                          doc.fileType?.includes('pdf') ? 'text-red-500' : 'text-blue-500'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{doc.title}</h4>
                          <p className="text-sm text-gray-500">{doc.type}</p>
                          {doc.fileSize && (
                            <p className="text-xs text-gray-400 mt-1">{doc.fileSize}</p>
                          )}
                        </div>
                        <Download className="h-5 w-5 text-gray-400" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No hay documentos disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Share2 className="h-6 w-6 text-blue-600" />
                  Acciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="default">
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartir este parque
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Compartir {park?.name}</DialogTitle>
                      <DialogDescription>
                        Comparte este parque con tus amigos y familiares
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        URL del parque: {window.location.href}
                      </p>
                      <Button onClick={handleSharePark} className="w-full">
                        {navigator.share ? 'Compartir' : 'Copiar enlace'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Reportar un problema
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Reportar un problema</DialogTitle>
                      <DialogDescription>
                        Cuéntanos qué problema has encontrado en {park?.name}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReportSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="report-name">Nombre completo</Label>
                        <Input
                          id="report-name"
                          value={reportForm.name}
                          onChange={(e) => setReportForm({...reportForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="report-email">Correo electrónico</Label>
                        <Input
                          id="report-email"
                          type="email"
                          value={reportForm.email}
                          onChange={(e) => setReportForm({...reportForm, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="report-phone">Teléfono (opcional)</Label>
                        <Input
                          id="report-phone"
                          value={reportForm.phone}
                          onChange={(e) => setReportForm({...reportForm, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="issue-type">Tipo de problema</Label>
                        <Select value={reportForm.issueType} onValueChange={(value) => setReportForm({...reportForm, issueType: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo de problema" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="infraestructura">Infraestructura dañada</SelectItem>
                            <SelectItem value="limpieza">Problema de limpieza</SelectItem>
                            <SelectItem value="seguridad">Seguridad</SelectItem>
                            <SelectItem value="iluminacion">Iluminación</SelectItem>
                            <SelectItem value="vandalismo">Vandalismo</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="urgency">Urgencia</Label>
                        <Select value={reportForm.urgency} onValueChange={(value) => setReportForm({...reportForm, urgency: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="description">Descripción del problema</Label>
                        <Textarea
                          id="description"
                          value={reportForm.description}
                          onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                          placeholder="Describe detalladamente el problema..."
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsReportDialogOpen(false)} className="flex-1">
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                          Enviar reporte
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isSuggestionDialogOpen} onOpenChange={setIsSuggestionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Sugerir mejoras
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Sugerir mejoras</DialogTitle>
                      <DialogDescription>
                        Comparte tus ideas para mejorar {park?.name}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="suggestion-name">Nombre completo</Label>
                        <Input
                          id="suggestion-name"
                          value={suggestionForm.name}
                          onChange={(e) => setSuggestionForm({...suggestionForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="suggestion-email">Correo electrónico</Label>
                        <Input
                          id="suggestion-email"
                          type="email"
                          value={suggestionForm.email}
                          onChange={(e) => setSuggestionForm({...suggestionForm, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="suggestion-category">Categoría</Label>
                        <Select value={suggestionForm.category} onValueChange={(value) => setSuggestionForm({...suggestionForm, category: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="amenidades">Nuevas amenidades</SelectItem>
                            <SelectItem value="actividades">Actividades y eventos</SelectItem>
                            <SelectItem value="accesibilidad">Accesibilidad</SelectItem>
                            <SelectItem value="paisajismo">Paisajismo y jardinería</SelectItem>
                            <SelectItem value="deportes">Instalaciones deportivas</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="suggestion-text">Tu sugerencia</Label>
                        <Textarea
                          id="suggestion-text"
                          value={suggestionForm.suggestion}
                          onChange={(e) => setSuggestionForm({...suggestionForm, suggestion: e.target.value})}
                          placeholder="Describe tu idea para mejorar este parque..."
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsSuggestionDialogOpen(false)} className="flex-1">
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                          Enviar sugerencia
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Proponer evento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Proponer un evento</DialogTitle>
                      <DialogDescription>
                        Propón un evento para realizarse en {park?.name}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEventSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="event-name">Nombre completo</Label>
                        <Input
                          id="event-name"
                          value={eventForm.name}
                          onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-email">Correo electrónico</Label>
                        <Input
                          id="event-email"
                          type="email"
                          value={eventForm.email}
                          onChange={(e) => setEventForm({...eventForm, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-phone">Teléfono</Label>
                        <Input
                          id="event-phone"
                          value={eventForm.phone}
                          onChange={(e) => setEventForm({...eventForm, phone: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-event-name">Nombre del evento</Label>
                        <Input
                          id="event-event-name"
                          value={eventForm.eventName}
                          onChange={(e) => setEventForm({...eventForm, eventName: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-type">Tipo de evento</Label>
                        <Select value={eventForm.eventType} onValueChange={(value) => setEventForm({...eventForm, eventType: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo de evento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cultural">Cultural</SelectItem>
                            <SelectItem value="deportivo">Deportivo</SelectItem>
                            <SelectItem value="educativo">Educativo</SelectItem>
                            <SelectItem value="ambiental">Ambiental</SelectItem>
                            <SelectItem value="social">Social</SelectItem>
                            <SelectItem value="comunitario">Comunitario</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="expected-attendees">Asistentes esperados</Label>
                        <Input
                          id="expected-attendees"
                          type="number"
                          value={eventForm.expectedAttendees}
                          onChange={(e) => setEventForm({...eventForm, expectedAttendees: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-date">Fecha propuesta</Label>
                        <Input
                          id="event-date"
                          type="date"
                          value={eventForm.eventDate}
                          onChange={(e) => setEventForm({...eventForm, eventDate: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-description">Descripción del evento</Label>
                        <Textarea
                          id="event-description"
                          value={eventForm.description}
                          onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                          placeholder="Describe tu evento..."
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsEventDialogOpen(false)} className="flex-1">
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                          Enviar propuesta
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div 
            className="relative max-w-7xl max-h-full flex"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Navigation buttons */}
            {allImages.length > 1 && !selectedSpeciesData && (
              <>
                <button 
                  onClick={goToPreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={goToNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Image */}
            <div className="flex-1">
              <img 
                src={selectedImage} 
                alt={selectedSpeciesData ? selectedSpeciesData.commonName : "Vista ampliada del parque"}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            
            {/* Species Technical Information Panel */}
            {selectedSpeciesData && (
              <div className="w-80 bg-white p-6 ml-4 overflow-y-auto max-h-full rounded-lg shadow-xl">
                <h3 className="text-lg font-semibold text-green-800 mb-4">{selectedSpeciesData.commonName}</h3>
                <p className="text-sm text-gray-600 italic mb-3">{selectedSpeciesData.scientificName}</p>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Familia:</span>
                    <span className="ml-2 text-gray-600">{selectedSpeciesData.family}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tipo:</span>
                    <span className="ml-2 text-gray-600">{selectedSpeciesData.type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Altura máxima:</span>
                    <span className="ml-2 text-gray-600">{selectedSpeciesData.maxHeight}m</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Diámetro de copa:</span>
                    <span className="ml-2 text-gray-600">{selectedSpeciesData.crownDiameter}m</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Floración:</span>
                    <span className="ml-2 text-gray-600">{selectedSpeciesData.floweringSeason}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Fructificación:</span>
                    <span className="ml-2 text-gray-600">{selectedSpeciesData.fruitingSeason}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Origen:</span>
                    <span className="ml-2 text-gray-600">{selectedSpeciesData.origin}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Distribución:</span>
                    <span className="ml-2 text-gray-600">{selectedSpeciesData.distribution}</span>
                  </div>
                  {selectedSpeciesData.habitat && (
                    <div>
                      <span className="font-medium text-gray-700">Hábitat:</span>
                      <span className="ml-2 text-gray-600">{selectedSpeciesData.habitat}</span>
                    </div>
                  )}
                  {selectedSpeciesData.conservationStatus && (
                    <div>
                      <span className="font-medium text-gray-700">Estado de conservación:</span>
                      <span className="ml-2 text-gray-600">{selectedSpeciesData.conservationStatus}</span>
                    </div>
                  )}
                  {selectedSpeciesData.uses && (
                    <div>
                      <span className="font-medium text-gray-700">Usos:</span>
                      <span className="ml-2 text-gray-600">{selectedSpeciesData.uses}</span>
                    </div>
                  )}
                  {selectedSpeciesData.observations && (
                    <div>
                      <span className="font-medium text-gray-700">Observaciones:</span>
                      <p className="mt-1 text-gray-600">{selectedSpeciesData.observations}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </PublicLayout>
  );
}

export default ParkLandingPage;
