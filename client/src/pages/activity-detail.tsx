import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ActivityPaymentForm } from '@/components/ActivityPaymentForm';
import { apiRequest } from '@/lib/queryClient';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  ArrowLeft,
  Star,
  User,
  Activity,
  Tag,
  Info,
  Mail,
  Phone,
  Package,
  CheckCircle,
  AlertCircle,
  Award,
  MessageSquare,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DialogTrigger } from '@/components/ui/dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdSpaceIntelligent from '@/components/AdSpaceIntelligent';
import PublicLayout from '@/components/PublicLayout';
import PublicInstructorEvaluationForm from '@/components/PublicInstructorEvaluationForm';

// Configurar Stripe con opciones para México
const stripeOptions = {
  locale: 'es' as const,
};

// Configuraciones de colores para estados
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

interface ActivityData {
  id: number;
  title: string;
  description: string;
  category: string;
  categoryName?: string;
  categoryId?: number;
  parkId: number;
  parkName: string;
  location: string;
  latitude?: number;
  longitude?: number;
  startDate: string;
  endDate: string;
  capacity: number;
  price: number;
  instructorId?: number;
  instructorName?: string;
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
  // Campos de configuración de inscripciones
  registrationEnabled?: boolean;
  maxRegistrations?: number;
  registrationDeadline?: string;
  registrationInstructions?: string;
  requiresApproval?: boolean;
  ageRestrictions?: string;
  healthRequirements?: string;
  status?: 'activa' | 'programada' | 'cancelada' | 'finalizada' | 'en_pausa';
  // Campos de descuentos
  discountSeniors?: number;
  discountStudents?: number;
  discountFamilies?: number;
  discountDisability?: number;
  discountEarlyBird?: number;
  discountEarlyBirdDeadline?: string;
}

interface InstructorDetails {
  id: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  experienceYears?: number;
  rating?: number;
  bio?: string;
  profileImageUrl?: string;
  profile_image_url?: string;
  full_name?: string;
  experience_years?: number;
}

interface ActivityImage {
  id: number;
  activityId: number;
  imageUrl: string;
  isPrimary: boolean;
  caption?: string;
  fileSize?: number;
}


// Initialize Stripe with options for Mexico
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '', {
  locale: 'es',
});

// Schema for registration form
const registrationSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un email válido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos').optional(),
  additionalInfo: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

function ActivityDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const activityId = params.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para dialogo del instructor
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorDetails | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [evaluationInstructor, setEvaluationInstructor] = useState<InstructorDetails | null>(null);

  // Funciones auxiliares para instructor
  const openProfile = (instructor: InstructorDetails | null) => {
    setSelectedInstructor(instructor);
    setProfileDialogOpen(true);
  };

  const openEvaluation = (instructor: InstructorDetails | null) => {
    setEvaluationInstructor(instructor);
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const getSpecialtiesArray = (specialties: string | string[] | undefined) => {
    if (!specialties) return [];
    
    if (Array.isArray(specialties)) return specialties;
    
    if (typeof specialties === 'string') {
      if (specialties.startsWith('{') && specialties.endsWith('}')) {
        const cleanedString = specialties.slice(1, -1);
        return cleanedString
          .split(',')
          .map(s => s.trim().replace(/^"/, '').replace(/"$/, ''))
          .filter(s => s.length > 0);
      }
      
      try {
        const parsed = JSON.parse(specialties);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // Si falla el parsing JSON, usar split por comas
      }
      
      return specialties.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    
    return [];
  };

  // Estados para modales y flujo de pago
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationFormData | null>(null);
  const [registrationStep, setRegistrationStep] = useState<'form' | 'payment' | 'success'>('form');

  // Estado del formulario de inscripción (legacy)
  const [formData, setFormData] = useState({
    participantName: '',
    participantEmail: '',
    participantPhone: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario para inscripciones con React Hook Form
  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      additionalInfo: '',
    },
  });

  const { data: activity, isLoading, error } = useQuery<ActivityData>({
    queryKey: [`/api/activities/${activityId}`],
    enabled: !!activityId,
  });

  const { data: images = [] } = useQuery<ActivityImage[]>({
    queryKey: [`/api/activities/${activityId}/images`],
    enabled: !!activityId,
  });

  // Obtener estadísticas de inscripciones
  const { data: registrationStats, refetch: refetchStats } = useQuery({
    queryKey: [`/api/activity-registrations/stats/${activityId}`],
    enabled: !!activityId,
  });

  // Consultar información del instructor si existe
  const { data: instructorDetails } = useQuery({
    queryKey: [`/api/instructors/${activity?.instructorId}`],
    enabled: !!activity?.instructorId,
  });

  console.log('🧑‍🏫 Instructor Details:', instructorDetails);
  console.log('🧑‍🏫 Activity Instructor ID:', activity?.instructorId);

  // Mutación para inscripción con Stripe
  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      return await apiRequest(
        `/api/activities/${activityId}/register`,
        {
          method: 'POST',
          data: data,
        }
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}`] });
      
      if (activity && (activity as any).isFree) {
        // Actividad gratuita - mostrar éxito directamente
        setRegistrationStep('success');
        toast({
          title: "¡Registro exitoso!",
          description: activity && (activity as any).requiresApproval 
            ? "Tu registro está pendiente de aprobación. Recibirás una confirmación por email."
            : "Te has registrado exitosamente a la actividad.",
        });
      } else {
        // Actividad de pago - proceder al pago
        setRegistrationStep('payment');
        setShowPaymentDialog(true);
        setShowRegistrationDialog(false);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error al registrarse",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Mutación para enviar inscripción (legacy)
  const registrationMutation = useMutation({
    mutationFn: async (registrationData: any) => {
      const response = await fetch('/api/activity-registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al registrar inscripción');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Inscripción exitosa!",
        description: activity?.requiresApproval 
          ? "Tu solicitud ha sido enviada y será revisada. Recibirás una confirmación por correo."
          : "Te has inscrito exitosamente. Recibirás una confirmación por correo.",
      });
      // Limpiar formulario
      setFormData({
        participantName: '',
        participantEmail: '',
        participantPhone: '',
        notes: ''
      });
      // Actualizar estadísticas de inscripciones
      refetchStats();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al inscribirse",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Funciones de manejo (legacy - conservar por compatibilidad)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.participantName || !formData.participantEmail || !formData.participantPhone) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    // Preparar datos de registro
    const registrationFormData: RegistrationFormData = {
      fullName: formData.participantName,
      email: formData.participantEmail,
      phone: formData.participantPhone,
      additionalInfo: formData.notes || '',
    };

    setRegistrationData(registrationFormData);

    if (activity?.isFree || !activity?.price || activity.price === 0) {
      // Actividad gratuita - registrar directamente
      registerMutation.mutate(registrationFormData);
    } else {
      // Actividad de pago - ir directamente al pago
      setShowPaymentDialog(true);
    }
  };

  if (error || !activity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Actividad no encontrada</h1>
          <p className="text-gray-600 mb-6">La actividad que buscas no existe o ha sido eliminada.</p>
          <Button onClick={() => setLocation('/activities')} className="bg-green-600 hover:bg-green-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a actividades
          </Button>
        </div>
      </div>
    );
  }

  const startDate = activity?.startDate ? new Date(activity.startDate) : new Date();
  const endDate = activity?.endDate ? new Date(activity.endDate) : null;
  const isMultiDay = endDate && endDate.getTime() !== startDate.getTime();
  const primaryImage = images?.find((img: ActivityImage) => img.isPrimary) || images?.[0];

  return (
    <PublicLayout >
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/activities')}
              className="hover:bg-green-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <h1 className="text-xl font-semibold text-gray-900">Detalle de Actividad</h1>
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
                {primaryImage ? (
                  <img
                    src={primaryImage.imageUrl?.startsWith('/uploads/') 
                      ? `/api/storage/file/${encodeURIComponent(primaryImage.imageUrl.replace(/^\//, ''))}`
                      : primaryImage.imageUrl
                    }
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="h-16 w-16 text-green-600/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h1 className="text-3xl font-bold text-white mb-2">{activity?.title}</h1>
                  <div className="flex items-center gap-4 text-white/90">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{activity?.parkName}</span>
                    </div>
                    {activity?.categoryName && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        <Tag className="h-3 w-3 mr-1" />
                        {activity.categoryName}
                      </Badge>
                    )}
                    {activity?.status && (
                      <Badge className={`${statusColors[activity.status as keyof typeof statusColors]} font-semibold`}>
                        {statusLabels[activity.status as keyof typeof statusLabels]}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Descripción */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {activity?.description || 'No hay descripción disponible para esta actividad.'}
                </p>
              </CardContent>
            </Card>

            {/* Materiales Necesarios */}
            {activity?.materials && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    Materiales Necesarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      {activity.materials}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Requisitos para participantes */}
            {activity?.requirements && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Requisitos para participantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      {activity.requirements}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instrucciones para inscripción, Restricciones de edad y Requisitos de salud */}
            {(activity?.registrationInstructions || activity?.ageRestrictions || activity?.healthRequirements) && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    Información importante para la inscripción
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activity?.registrationInstructions && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Instrucciones para inscripción</h4>
                        <p className="text-blue-800 text-sm">
                          {activity.registrationInstructions}
                        </p>
                      </div>
                    )}
                    
                    {activity?.ageRestrictions && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 mb-2">Restricciones de edad</h4>
                        <p className="text-purple-800 text-sm">
                          {activity.ageRestrictions}
                        </p>
                      </div>
                    )}
                    
                    {activity?.healthRequirements && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-semibold text-red-900 mb-2">Requisitos de salud</h4>
                        <p className="text-red-800 text-sm">
                          {activity.healthRequirements}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formulario de Inscripción */}
            {activity?.registrationEnabled && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-green-600">¡Inscríbete a esta actividad!</CardTitle>
                  <p className="text-sm text-gray-600">
                    Completa el formulario para registrarte
                    {activity.requiresApproval && " (sujeto a aprobación)"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Información de inscripción */}
                  <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Plazas disponibles:</span>
                      <span className="font-medium text-green-600">
                        {activity.capacity ? `${activity.capacity} personas` : 'Sin límite'}
                      </span>
                    </div>
                    {activity.registrationDeadline && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Fecha límite:</span>
                        <span className="font-medium text-orange-600">
                          {format(new Date(activity.registrationDeadline), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Formulario simple de inscripción */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        name="participantName"
                        value={formData.participantName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correo electrónico *
                      </label>
                      <input
                        type="email"
                        name="participantEmail"
                        value={formData.participantEmail}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="tu@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        name="participantPhone"
                        value={formData.participantPhone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comentarios adicionales
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={3}
                        placeholder="¿Alguna pregunta o información adicional?"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={registrationMutation.isPending || registerMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {(registrationMutation.isPending || registerMutation.isPending) ? 'Procesando...' : 
                        (activity?.isFree || !activity?.price || activity.price === 0 
                          ? 'Inscribirse gratis'
                          : `Inscribirse - $${activity.price} MXN`
                        )
                      }
                    </Button>
                  </form>

                  <p className="text-xs text-gray-500 text-center">
                    {activity.requiresApproval 
                      ? "Tu solicitud será revisada y recibirás una confirmación por correo electrónico"
                      : "Recibirás una confirmación inmediata por correo electrónico"
                    }
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Galería de imágenes adicionales */}
            {images && images.length > 1 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-3">Más imágenes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {images.slice(0, 8).map((image: ActivityImage, index: number) => (
                    <div key={image.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={image.imageUrl?.startsWith('/uploads/') 
                          ? `/api/storage/file/${encodeURIComponent(image.imageUrl.replace(/^\//, ''))}`
                          : image.imageUrl
                        }
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Información de la actividad */}
          <div className="space-y-6">
            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-green-600" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fecha y Horario */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Fecha y Horario</p>
                    <p className="text-sm text-gray-600">
                      {isMultiDay 
                        ? `${format(startDate, 'dd MMM', { locale: es })} - ${format(endDate, 'dd MMM yyyy', { locale: es })}`
                        : format(startDate, 'dd MMM yyyy', { locale: es })
                      }
                    </p>
                  </div>
                </div>

                {/* Hora de Inicio y Finalización */}
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Horario</p>
                    <p className="text-sm text-gray-600">
                      {activity?.startTime && activity.startTime !== '00:00' ? `Inicio: ${activity.startTime}` : 'Inicio: 08:00'}
                      {activity?.endTime && activity.endTime !== '00:00' && ` • Fin: ${activity.endTime}`}
                    </p>
                  </div>
                </div>

                {/* Duración */}
                {activity?.duration && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Duración</p>
                      <p className="text-sm text-gray-600">
                        {Math.floor(activity.duration / 60)} horas{activity.duration % 60 > 0 && ` y ${activity.duration % 60} minutos`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Recurrencia */}
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-pink-600" />
                  <div>
                    <p className="font-medium">Recurrencia</p>
                    <p className="text-sm text-gray-600">
                      {activity?.isRecurring ? (
                        activity?.recurringDays && activity.recurringDays.length > 0 
                          ? `Se repite: ${activity.recurringDays.map(day => {
                              const dayTranslations: { [key: string]: string } = {
                                'lunes': 'Lunes',
                                'martes': 'Martes', 
                                'miércoles': 'Miércoles',
                                'miercoles': 'Miércoles',
                                'jueves': 'Jueves',
                                'viernes': 'Viernes',
                                'sábado': 'Sábado',
                                'sabado': 'Sábado',
                                'domingo': 'Domingo'
                              };
                              return dayTranslations[day.toLowerCase()] || day;
                            }).join(', ')}`
                          : 'Actividad recurrente'
                      ) : (
                        'Actividad única'
                      )}
                    </p>
                  </div>
                </div>

                {/* Capacidad */}
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Capacidad</p>
                    <p className="text-sm text-gray-600">
                      {activity?.capacity ? `${activity.capacity} personas` : 'Sin límite de capacidad'}
                    </p>
                  </div>
                </div>

                {/* Precio */}
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Precio</p>
                    <p className="text-sm text-gray-600">
                      {activity?.isFree || !activity?.price || activity.price === 0 
                        ? 'Gratuita' 
                        : `"$${activity.price} MXN"`
                      }
                    </p>
                  </div>
                </div>

                {/* Descuentos disponibles */}
                {activity && !activity.isFree && activity.price > 0 && (
                  (activity.discountSeniors || 0) > 0 || (activity.discountStudents || 0) > 0 || 
                  (activity.discountFamilies || 0) > 0 || (activity.discountDisability || 0) > 0 || 
                  ((activity.discountEarlyBird || 0) > 0 && activity.discountEarlyBirdDeadline)
                ) && (
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-green-600 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium">Descuentos disponibles</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        {(activity.discountSeniors || 0) > 0 && (
                          <div className="flex items-center justify-between">
                            <span>🧓 Adultos mayores (65+)</span>
                            <span className="font-medium text-green-600">{activity.discountSeniors}% descuento</span>
                          </div>
                        )}
                        {(activity.discountStudents || 0) > 0 && (
                          <div className="flex items-center justify-between">
                            <span>🎓 Estudiantes</span>
                            <span className="font-medium text-green-600">{activity.discountStudents}% descuento</span>
                          </div>
                        )}
                        {(activity.discountFamilies || 0) > 0 && (
                          <div className="flex items-center justify-between">
                            <span>👨‍👩‍👧‍👦 Familias (3+ hijos)</span>
                            <span className="font-medium text-green-600">{activity.discountFamilies}% descuento</span>
                          </div>
                        )}
                        {(activity.discountDisability || 0) > 0 && (
                          <div className="flex items-center justify-between">
                            <span>♿ Personas con discapacidad</span>
                            <span className="font-medium text-green-600">{activity.discountDisability}% descuento</span>
                          </div>
                        )}
                        {(activity.discountEarlyBird || 0) > 0 && activity.discountEarlyBirdDeadline && (
                          <div className="flex items-center justify-between">
                            <span>⏰ Inscripción temprana</span>
                            <span className="font-medium text-green-600">{activity.discountEarlyBird}% descuento</span>
                          </div>
                        )}
                        {(activity.discountEarlyBird || 0) > 0 && activity.discountEarlyBirdDeadline && (
                          <div className="text-xs text-amber-600 mt-2">
                            * Descuento por inscripción temprana válido hasta: {format(new Date(activity.discountEarlyBirdDeadline), "dd 'de' MMMM yyyy", { locale: es })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Público (Segmentación) */}
                {activity?.targetMarket && activity.targetMarket.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-teal-600" />
                    <div>
                      <p className="font-medium">Público</p>
                      <p className="text-sm text-gray-600">
                        {activity.targetMarket.map(target => 
                          target.charAt(0).toUpperCase() + target.slice(1)
                        ).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Accesibilidad */}
                {activity?.specialNeeds && activity.specialNeeds.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Accesibilidad</p>
                      <p className="text-sm text-gray-600">
                        {activity.specialNeeds.includes('fisica') && 'Discapacidad física, '}
                        {activity.specialNeeds.includes('visual') && 'Discapacidad visual, '}
                        {activity.specialNeeds.includes('auditiva') && 'Discapacidad auditiva, '}
                        {activity.specialNeeds.includes('intelectual') && 'Discapacidad intelectual, '}
                        {activity.specialNeeds.includes('temporal') && 'Situación temporal'}
                      </p>
                    </div>
                  </div>
                )}




              </CardContent>
            </Card>

            {/* Ubicación y Contacto - Similar a /parque/bosque-los-colomos-5 */}
            {(activity?.location || activity?.latitude || activity?.longitude) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-red-600" />
                    Ubicación y Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Información de ubicación */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            {activity.location}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-800">
                            {activity.parkName}
                          </span>
                        </div>

                        {/* Coordenadas si están disponibles */}
                        {(activity.latitude && activity.longitude) && (
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-blue-700">
                              {activity.latitude}, {activity.longitude}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción de ubicación */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                        onClick={() => {
                          const location = activity.latitude && activity.longitude 
                            ? `${activity.latitude},${activity.longitude}`
                            : encodeURIComponent(`${activity.location}, ${activity.parkName}, Guadalajara`);
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${location}`, '_blank');
                        }}
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Cómo llegar
                      </Button>
                      
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        onClick={() => {
                          const location = activity.latitude && activity.longitude 
                            ? `${activity.latitude},${activity.longitude}`
                            : encodeURIComponent(`${activity.location}, ${activity.parkName}, Guadalajara`);
                          window.open(`https://www.google.com/maps/search/?api=1&query=${location}`, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ver en Mapa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ficha del Instructor - Estilo similar a /instructors */}
            {(activity?.instructorName || instructorDetails) && (
              <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Instructor o Facilitador
                  </h3>
                </div>
                <CardHeader className="text-center pb-2">
                  <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-primary/10">
                    <AvatarImage 
                      src={(instructorDetails as any)?.profileImageUrl || undefined} 
                      alt={(instructorDetails as any)?.fullName || activity?.instructorName || 'Instructor'}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-600 text-white font-semibold text-lg">
                      {((instructorDetails as any)?.fullName || activity?.instructorName || 'IN').split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {(instructorDetails as any)?.fullName || activity?.instructorName || 'Instructor asignado'}
                  </CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1 text-primary">
                    <Award className="h-4 w-4" />
                    {(instructorDetails as any)?.experienceYears || 'N/A'} años de experiencia
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Especialidades */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {getSpecialtiesArray((instructorDetails as any)?.specialties).slice(0, 2).map((specialty: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-primary/10 text-primary">
                          {specialty}
                        </Badge>
                      ))}
                      {getSpecialtiesArray((instructorDetails as any)?.specialties).length > 2 && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          +{getSpecialtiesArray((instructorDetails as any)?.specialties).length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex justify-center mb-4">
                    {renderStars((instructorDetails as any)?.rating || null)}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/instructor/${activity?.instructorId}`, '_blank')}
                      className="flex-1 text-primary border-primary hover:bg-primary hover:text-white"
                    >
                      <User className="h-4 w-4 mr-1" />
                      Ver Perfil
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => openEvaluation(instructorDetails)}
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Evaluar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Evaluar a {instructorDetails?.fullName || activity?.instructorName}</DialogTitle>
                          <DialogDescription>
                            Comparte tu experiencia con este instructor
                          </DialogDescription>
                        </DialogHeader>
                        <PublicInstructorEvaluationForm 
                          instructorId={activity?.instructorId || 0} 
                          instructorName={instructorDetails?.fullName || activity?.instructorName || ''}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Espacio publicitario - Sidebar */}
            <AdSpaceIntelligent 
              pageType="activity-detail" 
              position="sidebar"
            />



            {/* Botón de contacto */}
            <Card>
              <CardContent className="pt-6">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Contactar para más información
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Te ayudaremos con cualquier pregunta sobre esta actividad
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>



      {/* Diálogo de pago con Stripe */}
      {showPaymentDialog && registrationData && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Realizar pago</DialogTitle>
              <DialogDescription>
                Completa tu pago para confirmar tu inscripción
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{activity?.title}</h4>
                <p className="text-sm text-gray-600">
                  Participante: {registrationData?.fullName}
                </p>
                <p className="text-lg font-bold text-green-600 mt-2">
                  ${activity?.price} MXN
                </p>
              </div>
              
              <Elements stripe={stripePromise} options={{
                locale: 'es',
              }}>
                <ActivityPaymentForm
                  activityId={activityId!}
                  activity={activity}
                  participantData={registrationData}
                  onSuccess={() => {
                    setShowPaymentDialog(false);
                    setRegistrationStep('success');
                    toast({
                      title: "¡Pago exitoso!",
                      description: "Tu inscripción ha sido confirmada. Recibirás un email de confirmación.",
                    });
                  }}
                  onError={(error) => {
                    setShowPaymentDialog(false);
                    toast({
                      title: "Error en el pago",
                      description: error,
                      variant: "destructive",
                    });
                  }}
                />
              </Elements>
            </div>
          </DialogContent>
        </Dialog>
      )}

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

export default ActivityDetailPage;