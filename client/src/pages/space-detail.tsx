import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, isBefore, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import AdSpaceIntelligent from '@/components/AdSpaceIntelligent';

// Configurar Stripe con opciones para México
const stripeOptions = {
  locale: 'es' as const,
};

import { apiRequest } from '@/lib/queryClient';

interface ReservableSpace {
  id: number;
  name: string;
  description: string;
  spaceType: string;
  capacity: number;
  hourlyRate: string;
  minimumHours: number;
  maximumHours: number;
  amenities: string;
  rules: string;
  isActive: boolean;
  requiresApproval: boolean;
  advanceBookingDays: number;
  images: string;
  coordinates: string;
  parkId: number;
  parkName: string;
  createdAt: string;
  updatedAt: string;
}

interface SpaceReservation {
  id: number;
  space_id: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  ArrowLeft,
  Star,
  User,
  Building,
  Tag,
  Info,
  Mail,
  Phone,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  Ban,
  Shield,
  Camera,
  Navigation,
  Heart,
  Share2,
  BookOpen,
  Utensils,
  Coffee,
  Trophy,
  Trees
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import PublicLayout from '@/components/PublicLayout';

// Schema para el formulario de reserva
const reservationSchema = z.object({
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  customerEmail: z.string().email('Email inválido'),
  customerPhone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  reservationDate: z.string().min(1, 'Selecciona una fecha'),
  startTime: z.string().min(1, 'Selecciona hora de inicio'),
  endTime: z.string().min(1, 'Selecciona hora de fin'),
  specialRequests: z.string().optional(),
  acceptsTerms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones'
  })
});

type ReservationFormData = z.infer<typeof reservationSchema>;

const spaceTypeLabels = {
  'playground': 'Área de Juegos',
  'kiosk': 'Kiosco',
  'open_area': 'Área Abierta',
  'pavilion': 'Pabellón',
  'amphitheater': 'Anfiteatro',
  'sports_court': 'Cancha Deportiva',
  'garden': 'Jardín',
  'picnic_area': 'Zona de Picnic'
};

const spaceTypeIcons = {
  'playground': Trophy,
  'kiosk': Coffee,
  'open_area': Trees,
  'pavilion': Building,
  'amphitheater': Users,
  'sports_court': Trophy,
  'garden': Trees,
  'picnic_area': Utensils
};

function SpaceDetailPage() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Obtener detalles del espacio
  const { data: space, isLoading: spaceLoading } = useQuery<ReservableSpace>({
    queryKey: [`/api/reservable-spaces/${id}`],
    enabled: !!id,
  });

  // Obtener reservas existentes para verificar disponibilidad
  const { data: existingReservations = [] } = useQuery<SpaceReservation[]>({
    queryKey: [`/api/space-reservations/space/${id}`],
    enabled: !!id,
  });

  // Obtener estadísticas de reservas
  const { data: reservationStats } = useQuery({
    queryKey: [`/api/space-reservations/stats/${id}`],
    enabled: !!id,
  });

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      reservationDate: '',
      startTime: '',
      endTime: '',
      specialRequests: '',
      acceptsTerms: false,
    },
  });

  // Mutación para crear reserva
  const createReservation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const response = await apiRequest('POST', `/api/space-reservations/spaces/${id}/reserve`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reserva creada exitosamente",
        description: "Revisa tu email para más detalles sobre el proceso de confirmación.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/space-reservations/space/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/space-reservations/stats/${id}`] });
      setShowReservationForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear la reserva",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    },
  });

  if (!space) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Espacio no encontrado</h2>
            <p className="text-gray-600 mb-6">El espacio que buscas no existe o no está disponible.</p>
            <Button onClick={() => setLocation('/reservations')}>
              Volver a espacios
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Función para procesar URLs de imágenes
  const processImageUrl = (url: string): string => {
    if (!url) return '';
    
    // Las URLs de Object Storage (/objects/uploads/) ya están configuradas 
    // para servirse correctamente desde el servidor
    return url;
  };

  const rawImages = space.images ? space.images.split(',').filter(Boolean) : [];
  const images = rawImages.map(processImageUrl);
  const hourlyRate = parseFloat(space.hourlyRate);
  const SpaceIcon = spaceTypeIcons[space.spaceType as keyof typeof spaceTypeIcons] || Building;
  const spaceTypeLabel = spaceTypeLabels[space.spaceType as keyof typeof spaceTypeLabels] || space.spaceType;

  // Generar horas disponibles (8:00 - 20:00)
  const availableHours = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Verificar si una fecha/hora está disponible
  const isTimeSlotAvailable = (date: string, startTime: string, endTime: string): boolean => {
    return !existingReservations.some(reservation => 
      reservation.reservation_date === date &&
      reservation.status !== 'cancelled' &&
      (
        (startTime >= reservation.start_time && startTime < reservation.end_time) ||
        (endTime > reservation.start_time && endTime <= reservation.end_time) ||
        (startTime <= reservation.start_time && endTime >= reservation.end_time)
      )
    );
  };

  const onSubmit = (data: ReservationFormData) => {
    // Validar que la fecha sea futura
    const selectedDate = new Date(data.reservationDate);
    const today = startOfDay(new Date());
    
    if (isBefore(selectedDate, today)) {
      toast({
        title: "Fecha inválida",
        description: "No puedes reservar en fechas pasadas.",
        variant: "destructive",
      });
      return;
    }

    // Validar días de anticipación
    const maxAdvanceDate = addDays(today, space.advanceBookingDays);
    if (isAfter(selectedDate, maxAdvanceDate)) {
      toast({
        title: "Fecha muy lejana",
        description: `Solo puedes reservar con máximo ${space.advanceBookingDays} días de anticipación.`,
        variant: "destructive",
      });
      return;
    }

    // Validar disponibilidad del horario
    if (!isTimeSlotAvailable(data.reservationDate, data.startTime, data.endTime)) {
      toast({
        title: "Horario no disponible",
        description: "El horario seleccionado ya está reservado.",
        variant: "destructive",
      });
      return;
    }

    // Calcular horas y validar límites
    const startHour = parseInt(data.startTime.split(':')[0]);
    const endHour = parseInt(data.endTime.split(':')[0]);
    const totalHours = endHour - startHour;

    if (totalHours < space.minimumHours) {
      toast({
        title: "Duración insuficiente",
        description: `La reserva mínima es de ${space.minimumHours} horas.`,
        variant: "destructive",
      });
      return;
    }

    if (totalHours > space.maximumHours) {
      toast({
        title: "Duración excesiva",
        description: `La reserva máxima es de ${space.maximumHours} horas.`,
        variant: "destructive",
      });
      return;
    }

    createReservation.mutate(data);
  };

  return (
    <PublicLayout>
      <div className="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
        {/* Botón de regreso */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/reservations')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a espacios
            </Button>
          </div>
        </div>

        {/* Galería de imágenes */}
        {images.length > 0 && (
          <section className="bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={images[selectedImageIndex]}
                  alt={space.name}
                  className="w-full h-full object-contain bg-gray-100"
                />
                <div className="absolute inset-0 bg-black/20"></div>
                
                {/* Navegación de imágenes */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex gap-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index === selectedImageIndex 
                              ? 'bg-white' 
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Información superpuesta */}
                <div className="absolute bottom-8 left-8">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{space.name}</h1>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{space.parkName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información básica */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{space.name}</CardTitle>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="border">
                          <SpaceIcon className="h-3 w-3 mr-1" />
                          {spaceTypeLabel}
                        </Badge>
                        {space.requiresApproval && (
                          <Badge variant="outline" className="border-orange-200 text-orange-700">
                            <Shield className="h-3 w-3 mr-1" />
                            Requiere Aprobación
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {hourlyRate > 0 ? `$${hourlyRate.toLocaleString('es-MX')}` : 'Gratis'}
                      </div>
                      {hourlyRate > 0 && <div className="text-sm text-gray-500">por hora</div>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-6">{space.description}</p>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="font-medium">Capacidad</div>
                        <div>{space.capacity} personas</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">Duración</div>
                        <div>{space.minimumHours}-{space.maximumHours} horas</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">Anticipación</div>
                        <div>Hasta {space.advanceBookingDays} días</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <div>
                        <div className="font-medium">Ubicación</div>
                        <div>{space.parkName}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Amenidades */}
              {space.amenities && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Amenidades incluidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{space.amenities}</p>
                  </CardContent>
                </Card>
              )}

              {/* Reglas */}
              {space.rules && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Reglas y políticas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{space.rules}</p>
                  </CardContent>
                </Card>
              )}

              {/* Estadísticas */}
              {reservationStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-600" />
                      Estadísticas del espacio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {reservationStats.totalReservations || 0}
                        </div>
                        <div className="text-sm text-gray-500">Reservas totales</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {reservationStats.confirmedReservations || 0}
                        </div>
                        <div className="text-sm text-gray-500">Confirmadas</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {reservationStats.pendingReservations || 0}
                        </div>
                        <div className="text-sm text-gray-500">Pendientes</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {reservationStats.averageRating || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">Calificación</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar de reserva */}
            <div className="space-y-6">
              {/* Card de reserva */}
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Reservar este espacio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {hourlyRate > 0 ? `$${hourlyRate.toLocaleString('es-MX')}` : 'Gratis'}
                      </div>
                      {hourlyRate > 0 && <div className="text-sm text-gray-600">por hora</div>}
                    </div>

                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setShowReservationForm(true)}
                      disabled={!space.isActive}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {space.isActive ? 'Reservar ahora' : 'No disponible'}
                    </Button>

                    {space.requiresApproval && (
                      <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Esta reserva requiere aprobación administrativa
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modal de reserva */}
        <Dialog open={showReservationForm} onOpenChange={setShowReservationForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reservar {space.name}</DialogTitle>
              <DialogDescription>
                Completa la información para reservar este espacio
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Información personal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu nombre completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="tu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="3312345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha y horarios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="reservationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de reserva</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            min={format(new Date(), 'yyyy-MM-dd')}
                            max={format(addDays(new Date(), space.advanceBookingDays), 'yyyy-MM-dd')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de inicio</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona hora" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableHours.map((hour) => (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de fin</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona hora" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableHours.slice(1).map((hour) => (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="specialRequests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solicitudes especiales (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe cualquier solicitud especial para tu evento..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptsTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Acepto los términos y condiciones de reserva
                        </FormLabel>
                        <FormDescription>
                          Al reservar este espacio, acepto cumplir con las reglas establecidas.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReservationForm(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={createReservation.isPending}
                  >
                    {createReservation.isPending ? 'Procesando...' : 'Confirmar reserva'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PublicLayout>
  );
}

export default SpaceDetailPage;