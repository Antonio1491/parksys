import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Calendar, MapPin, Users, Clock, FileText, Save, Plus, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { apiRequest } from '@/lib/queryClient';
import EventImageUploader from '@/components/EventImageUploader';

// Schema de validación para evento (corregido)
const editEventSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(255, 'El título es muy largo'),
  description: z.string().min(1, 'La descripción es requerida'),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
  end_date: z.string().optional(),
  start_time: z.string().optional(), // ✅ HORA OPCIONAL
  end_time: z.string().optional(),
  park_id: z.string().min(1, 'Debe seleccionar un parque'),
  category: z.string().min(1, 'Debe seleccionar una categoría'),
  capacity: z.string().optional(),
  location: z.string().optional(),
  organizer_name: z.string().optional(),
  organizer_organization: z.string().optional(),
  contact_email: z.string().email('Email inválido').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  registration_required: z.boolean().default(false),
  price: z.string().optional(),
  notes: z.string().optional()
});

type EditEventForm = z.infer<typeof editEventSchema>;

interface EventData {
  id: number;
  title: string;
  description: string;
  eventType: string;
  targetAudience: string;
  status: string;
  featuredImageUrl?: string; // Usar featuredImageUrl que es el campo real del backend
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  capacity?: number;
  registrationType: string;
  organizerName?: string;
  organizerOrganization?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  geolocation?: { lat: number; lng: number };
  parks: Array<{ id: number; name: string; address: string }>;
}

export default function EditEventPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [eventImage, setEventImage] = useState<string>('');

  // Consultar el evento para editar (deshabilitar cache para debugging)
  const { data: event, isLoading } = useQuery<EventData>({
    queryKey: [`/api/events/${id}`],
    enabled: !!id,
    staleTime: 0, // Siempre considerar datos como obsoletos
    gcTime: 0, // No cachear los datos
  });

  // Función para convertir fecha ISO a formato de input date
  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      return dateString.split('T')[0];
    } catch {
      return '';
    }
  };

  // Función para extraer hora de datetime ISO
  const extractTime = (dateTimeString: string | null): string => {
    if (!dateTimeString) return '';
    try {
      const date = new Date(dateTimeString);
      return date.toTimeString().substring(0, 5); // HH:MM
    } catch {
      return '';
    }
  };

  const form = useForm<EditEventForm>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      park_id: '',
      category: '',
      capacity: '',
      location: '',
      organizer_name: '',
      organizer_organization: '',
      contact_email: '',
      contact_phone: '',
      latitude: '',
      longitude: '',
      registration_required: false,
      price: '',
      notes: ''
    }
  });

  // Actualizar el formulario cuando se cargue el evento
  useEffect(() => {
    if (event) {
      console.log('🔄 Cargando datos del evento:', event);
      
      // Establecer la imagen del evento (usar featuredImageUrl que viene del backend)
      if (event.featuredImageUrl) {
        setEventImage(event.featuredImageUrl);
      }

      // Actualizar valores del formulario
      form.reset({
        title: event.title || '',
        description: event.description || '',
        start_date: formatDateForInput(event.startDate),
        end_date: formatDateForInput(event.endDate || ''),
        start_time: event.startTime || '',
        end_time: event.endTime || '',
        park_id: event.parks && event.parks.length > 0 ? String(event.parks[0].id) : '',
        category: event.eventType || '',
        capacity: event.capacity ? String(event.capacity) : '',
        location: event.location || '',
        organizer_name: event.organizerName || '',
        organizer_organization: event.organizerOrganization || '',
        contact_email: event.organizerEmail || '',
        contact_phone: event.organizerPhone || '',
        latitude: event.geolocation?.lat ? String(event.geolocation.lat) : '',
        longitude: event.geolocation?.lng ? String(event.geolocation.lng) : '',
        registration_required: event.registrationType === 'registration',
        price: '',
        notes: ''
      });
    }
  }, [event, form]);

  // Obtener parques para el selector
  const { data: parksResponse } = useQuery({
    queryKey: ['/api/parks']
  });
  
  // Normalizar respuesta de parks (puede ser array directo o { data: Park[] })
  const parks = Array.isArray(parksResponse) ? parksResponse : ((parksResponse as any)?.data || []);

  // Obtener categorías de eventos
  const { data: eventCategories } = useQuery({
    queryKey: ['/api/event-categories']
  });

  // Mutación para actualizar evento
  const updateEventMutation = useMutation({
    mutationFn: async (data: EditEventForm) => {
      const eventData = {
        title: data.title,
        description: data.description,
        eventType: data.category, // Usar category del formulario como eventType
        startDate: data.start_date,
        endDate: data.end_date || null,
        startTime: data.start_time || null,
        endTime: data.end_time || null,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        location: data.location || null,
        organizerName: data.organizer_name || null,
        organizerOrganization: data.organizer_organization || null,
        organizerEmail: data.contact_email || null,
        organizerPhone: data.contact_phone || null,
        geolocation: data.latitude && data.longitude 
          ? { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) }
          : null,
        registrationType: data.registration_required ? 'registration' : 'free',
        status: 'published',
        targetAudience: 'general',
        featuredImageUrl: eventImage || null, // Usar featuredImageUrl que es lo que espera el backend
        // Campo requerido por el backend - array de IDs de parques
        parkIds: data.park_id ? [parseInt(data.park_id)] : []
      };

      console.log('🚀 Actualizando datos del evento:', eventData);
      return apiRequest(`/api/events/${id}`, {
        method: 'PUT',
        data: eventData
      });
    },
    onSuccess: (data) => {
      console.log('✅ [FRONTEND] Evento actualizado exitosamente:', data);
      toast({
        title: 'Evento actualizado',
        description: 'El evento ha sido actualizado exitosamente.'
      });
      
      // Invalidar múltiples queries relacionadas y refrescar inmediatamente
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/images`] });
      
      // Forzar refetch inmediato para actualizar la UI
      queryClient.refetchQueries({ queryKey: [`/api/events/${id}`] });
      
      // Pequeño delay antes de redirigir para que se vea el cambio
      setTimeout(() => {
        setLocation('/admin/events');
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el evento',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (data: EditEventForm) => {
    console.log('📝 Datos del formulario:', data);
    updateEventMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Cargando evento...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!event && !isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Evento no encontrado</h2>
          <Button onClick={() => setLocation('/admin/events')}>
            Volver a eventos
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/admin/events')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Evento</h1>
              <p className="text-gray-600">Modifica los detalles del evento</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna principal - Información básica */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Información Básica</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título del Evento *</Label>
                    <Input
                      id="title"
                      {...form.register('title')}
                      placeholder="Nombre del evento"
                      className="mt-1"
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción *</Label>
                    <Textarea
                      id="description"
                      {...form.register('description')}
                      placeholder="Describe el evento, sus objetivos y actividades"
                      rows={4}
                      className="mt-1"
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="park_id">Parque *</Label>
                      <Select
                        value={form.watch('park_id')}
                        onValueChange={(value) => form.setValue('park_id', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccionar parque" />
                        </SelectTrigger>
                        <SelectContent>
                          {parks?.map((park: any) => (
                            <SelectItem key={park.id} value={park.id.toString()}>
                              {park.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.park_id && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.park_id.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category">Categoría *</Label>
                      <Select
                        value={form.watch('category')}
                        onValueChange={(value) => form.setValue('category', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {(eventCategories as any[])?.map((category: any) => (
                            <SelectItem key={category.id} value={category.name}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.category && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.category.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fecha y hora */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Fecha y Hora</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Fecha de Inicio *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        {...form.register('start_date')}
                        className="mt-1"
                      />
                      {form.formState.errors.start_date && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.start_date.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="end_date">Fecha de Fin</Label>
                      <Input
                        id="end_date"
                        type="date"
                        {...form.register('end_date')}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Hora de Inicio *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        {...form.register('start_time')}
                        className="mt-1"
                      />
                      {form.formState.errors.start_time && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.start_time.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="end_time">Hora de Fin</Label>
                      <Input
                        id="end_time"
                        type="time"
                        {...form.register('end_time')}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detalles adicionales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Detalles Adicionales</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="capacity">Capacidad</Label>
                      <Input
                        id="capacity"
                        type="number"
                        {...form.register('capacity')}
                        placeholder="Número máximo de asistentes"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Precio</Label>
                      <Input
                        id="price"
                        {...form.register('price')}
                        placeholder="Ej: $100, Gratuito"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Ubicación Específica</Label>
                    <Input
                      id="location"
                      {...form.register('location')}
                      placeholder="Ej: Cancha de fútbol, Área de juegos"
                      className="mt-1"
                    />
                  </div>

                  {/* Coordenadas GPS */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Coordenadas GPS (opcional)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude">Latitud</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          {...form.register('latitude')}
                          placeholder="Ej: 20.6597"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude">Longitud</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="any"
                          {...form.register('longitude')}
                          placeholder="Ej: -103.3496"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Las coordenadas GPS permitirán a los usuarios encontrar la ubicación exacta del evento
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas Adicionales</Label>
                    <Textarea
                      id="notes"
                      {...form.register('notes')}
                      placeholder="Información adicional, requisitos, etc."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Columna lateral */}
            <div className="space-y-6">
              {/* Imagen del evento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Image className="h-5 w-5" />
                    <span>Imagen del Evento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EventImageUploader
                    onImageUpload={setEventImage}
                    currentImage={eventImage}
                    onRemoveImage={() => setEventImage('')}
                  />
                  {!eventImage && (
                    <div className="mt-2 text-sm text-gray-500">
                      Puedes cambiar la imagen del evento arrastrando una nueva imagen o haciendo clic para seleccionar
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contacto */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Información de Contacto</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="organizer_name">Nombre del Organizador</Label>
                    <Input
                      id="organizer_name"
                      {...form.register('organizer_name')}
                      placeholder="Nombre del organizador"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="organizer_organization">Empresa / Organización</Label>
                    <Input
                      id="organizer_organization"
                      {...form.register('organizer_organization')}
                      placeholder="Nombre de la empresa u organización"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_email">Email de Contacto</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      {...form.register('contact_email')}
                      placeholder="organizador@parques.gob.mx"
                      className="mt-1"
                    />
                    {form.formState.errors.contact_email && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.contact_email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contact_phone">Teléfono de Contacto</Label>
                    <Input
                      id="contact_phone"
                      {...form.register('contact_phone')}
                      placeholder="33 1234 5678"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="registration_required"
                      type="checkbox"
                      {...form.register('registration_required')}
                      className="rounded"
                    />
                    <Label htmlFor="registration_required" className="text-sm">
                      Requiere inscripción previa
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={updateEventMutation.isPending}
                    >
                      {updateEventMutation.isPending ? (
                        <>
                          <Clock className="h-4 w-4 animate-spin mr-2" />
                          Actualizando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Actualizar Evento
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation('/admin/events')}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}