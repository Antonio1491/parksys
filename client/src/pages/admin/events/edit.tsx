import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Calendar, MapPin, Users, Clock, FileText, Save, Plus, Image } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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
import { updateEventSchema } from '@shared/events-schema';
import { CostingSection } from '@/components/CostingSection';

// 🎯 Usar el esquema unificado de events-schema.ts
type EditEventForm = z.infer<typeof updateEventSchema>;

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
  isFree?: boolean;
  price?: string | number;
  // Campos de descuentos
  discountSeniors?: number;
  discountStudents?: number;
  discountFamilies?: number;
  discountDisability?: number;
  discountEarlyBird?: number;
  discountEarlyBirdDeadline?: string;
  // Campos de costeo
  costRecoveryPercentage?: number;
  costingNotes?: string;
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
    resolver: zodResolver(updateEventSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      parkIds: [],
      eventType: '',
      capacity: undefined,
      location: '',
      organizerName: '',
      organizerOrganization: '',
      organizerEmail: '',
      organizerPhone: '',
      geolocation: null,
      registrationType: 'free',
      isFree: true,
      price: undefined,
      targetAudience: 'all',
      status: 'draft',
      // Campos de descuentos
      discountSeniors: 0,
      discountStudents: 0,
      discountFamilies: 0,
      discountDisability: 0,
      discountEarlyBird: 0,
      discountEarlyBirdDeadline: undefined,
      // Campos de costeo
      costRecoveryPercentage: 30,
      costingNotes: ''
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

      // 🎯 Actualizar valores del formulario usando esquema unificado
      form.reset({
        title: event.title || '',
        description: event.description || '',
        startDate: formatDateForInput(event.startDate),
        endDate: formatDateForInput(event.endDate || ''),
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        parkIds: event.parks ? event.parks.map(p => p.id) : [],
        eventType: event.eventType || '',
        capacity: event.capacity || undefined,
        location: event.location || '',
        organizerName: event.organizerName || '',
        organizerOrganization: event.organizerOrganization || '',
        organizerEmail: event.organizerEmail || '',
        organizerPhone: event.organizerPhone || '',
        geolocation: event.geolocation || null,
        registrationType: event.registrationType || 'free',
        isFree: event.isFree !== undefined ? event.isFree : true,
        price: event.isFree ? undefined : (event.price ? Number(event.price) / 100 : undefined),
        targetAudience: event.targetAudience || 'all',
        status: event.status || 'draft',
        // Campos de descuentos con valores por defecto seguros
        discountSeniors: event.discountSeniors || 0,
        discountStudents: event.discountStudents || 0,
        discountFamilies: event.discountFamilies || 0,
        discountDisability: event.discountDisability || 0,
        discountEarlyBird: event.discountEarlyBird || 0,
        discountEarlyBirdDeadline: event.discountEarlyBirdDeadline || undefined,
        // Campos de costeo con valores por defecto seguros
        costRecoveryPercentage: event.costRecoveryPercentage || 30,
        costingNotes: event.costingNotes || ''
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

  // 🎯 Mutación para actualizar evento usando esquema unificado
  const updateEventMutation = useMutation({
    mutationFn: async (data: EditEventForm) => {
      const eventData = {
        title: data.title,
        description: data.description,
        eventType: data.eventType,
        startDate: data.startDate,
        endDate: data.endDate || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        capacity: data.capacity || null,
        location: data.location || null,
        organizerName: data.organizerName || null,
        organizerOrganization: data.organizerOrganization || null,
        organizerEmail: data.organizerEmail || null,
        organizerPhone: data.organizerPhone || null,
        geolocation: data.geolocation || null,
        registrationType: data.registrationType || 'free',
        status: data.status || 'published',
        targetAudience: data.targetAudience || 'all',
        isFree: data.isFree,
        price: data.isFree ? undefined : (data.price ? Math.round(Number(data.price) * 100) : undefined),
        featuredImageUrl: eventImage || null,
        // 🎯 Array de parques (múltiples parques soportados)
        parkIds: data.parkIds || [],
        // 🎯 Campos de descuentos unificados
        discountSeniors: data.discountSeniors || 0,
        discountStudents: data.discountStudents || 0,
        discountFamilies: data.discountFamilies || 0,
        discountDisability: data.discountDisability || 0,
        discountEarlyBird: data.discountEarlyBird || 0,
        discountEarlyBirdDeadline: data.discountEarlyBirdDeadline || undefined,
        // 🎯 Campos de costeo financiero
        costRecoveryPercentage: data.costRecoveryPercentage || 30,
        costingNotes: data.costingNotes || undefined
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
      
      // NO redirigir automáticamente - mantener al usuario en la página de edición
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
    updateEventMutation.mutate(data);
  };

  // 🎯 Función para manejar cambio de "Evento gratuito" con actualización inmediata
  const handleToggleFree = (checked: boolean) => {
    console.log('🎯 [TOGGLE] Cambiando evento gratuito a:', checked);
    
    // Actualizar el formulario inmediatamente
    form.setValue('isFree', checked);
    
    // Si se activa gratuito, limpiar el precio
    if (checked) {
      form.setValue('price', undefined);
    }
    
    // Obtener todos los datos actuales del formulario
    const currentData = form.getValues();
    
    // Actualizar con el nuevo valor de isFree
    const updatedData = {
      ...currentData,
      isFree: checked,
      price: checked ? undefined : currentData.price
    };
    
    console.log('🚀 [TOGGLE] Enviando actualización inmediata:', updatedData);
    
    // Ejecutar la mutación inmediatamente
    updateEventMutation.mutate(updatedData);
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
                      <Label htmlFor="parkIds">🎯 Parques asociados (múltiples) *</Label>
                      <Select
                        value={""}
                        onValueChange={(value) => {
                          const currentValues = form.watch('parkIds') || [];
                          const valueNumber = Number(value);
                          
                          if (currentValues.includes(valueNumber)) {
                            form.setValue('parkIds', currentValues.filter((val: number) => val !== valueNumber));
                          } else {
                            form.setValue('parkIds', [...currentValues, valueNumber]);
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccionar parques" />
                        </SelectTrigger>
                        <SelectContent>
                          {parks?.map((park: any) => (
                            <SelectItem key={park.id} value={park.id.toString()}>
                              {park.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-sm text-gray-600 mt-1">
                        Parques seleccionados: {(form.watch('parkIds') || []).length > 0 
                          ? parks?.filter((park: any) => (form.watch('parkIds') || []).includes(park.id))
                              .map((park: any) => park.name).join(', ')
                          : 'Ninguno'}
                      </div>
                      {form.formState.errors.parkIds && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.parkIds.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="eventType">🎯 Tipo de evento *</Label>
                      <Select
                        value={form.watch('eventType')}
                        onValueChange={(value) => form.setValue('eventType', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccionar tipo" />
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
                      {form.formState.errors.eventType && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.eventType.message}</p>
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
                      <Label htmlFor="startDate">🎯 Fecha de Inicio *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...form.register('startDate')}
                        className="mt-1"
                      />
                      {form.formState.errors.startDate && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.startDate.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="endDate">🎯 Fecha de Fin</Label>
                      <Input
                        id="endDate"
                        type="date"
                        {...form.register('endDate')}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">🎯 Hora de Inicio *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        {...form.register('startTime')}
                        className="mt-1"
                      />
                      {form.formState.errors.startTime && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.startTime.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="endTime">🎯 Hora de Fin</Label>
                      <Input
                        id="endTime"
                        type="time"
                        {...form.register('endTime')}
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
                  </div>

                  {/* Campos de precio y pago */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-3">💰 Configuración de Precio</h4>
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white">
                      <div className="space-y-0.5">
                        <Label className="text-base">Evento gratuito</Label>
                        <p className="text-sm text-gray-500">¿Este evento es completamente gratuito para los participantes?</p>
                      </div>
                      <Checkbox
                        checked={form.watch('isFree')}
                        onCheckedChange={(checked) => handleToggleFree(!!checked)}
                        data-testid="checkbox-evento-gratuito"
                      />
                    </div>
                  </div>

                  {!form.watch('isFree') && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div>
                        <Label className="text-green-800 font-semibold">💵 Precio por participante</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-2.5 text-gray-500 font-semibold">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-8 border-green-300 focus:border-green-500"
                            {...form.register('price')}
                          />
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Precio en pesos mexicanos por cada participante
                        </p>
                        {form.formState.errors.price && (
                          <p className="text-sm text-red-500 mt-1">{form.formState.errors.price.message}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* NUEVO: Campos de descuentos unificados */}
                  {!form.watch("isFree") && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-purple-800 mb-3">🎟️ Descuentos Disponibles</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs">🧓 Adultos mayores (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0"
                            className="h-8 text-sm mt-1"
                            {...form.register('discountSeniors')}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">🎓 Estudiantes (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0"
                            className="h-8 text-sm mt-1"
                            {...form.register('discountStudents')}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">👨‍👩‍👧‍👦 Familias (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0"
                            className="h-8 text-sm mt-1"
                            {...form.register('discountFamilies')}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">♿ Discapacidad (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0"
                            className="h-8 text-sm mt-1"
                            {...form.register('discountDisability')}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">⏰ Inscripción temprana (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0"
                            className="h-8 text-sm mt-1"
                            {...form.register('discountEarlyBird')}
                          />
                        </div>
                        {form.watch("discountEarlyBird") > 0 && (
                          <div>
                            <Label className="text-xs">Fecha límite</Label>
                            <Input
                              type="date"
                              className="h-8 text-sm mt-1"
                              {...form.register('discountEarlyBirdDeadline')}
                            />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-purple-700 mt-2">
                        Configure los porcentajes de descuento que estarán disponibles para los participantes durante el registro
                      </div>
                    </div>
                  )}

                  {/* NUEVO: Sección de costeo financiero unificado */}
                  <div>
                    <CostingSection
                      costRecoveryPercentage={form.watch("costRecoveryPercentage") || 30}
                      onCostRecoveryChange={(percentage) => form.setValue("costRecoveryPercentage", percentage)}
                      financialNotes={form.watch("costingNotes") || ""}
                      onFinancialNotesChange={(notes) => form.setValue("costingNotes", notes)}
                      showAdvancedFields={true}
                    />
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
                    <Label htmlFor="organizerName">🎯 Nombre del Organizador</Label>
                    <Input
                      id="organizerName"
                      {...form.register('organizerName')}
                      placeholder="Nombre del organizador"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="organizerOrganization">🎯 Empresa / Organización</Label>
                    <Input
                      id="organizerOrganization"
                      {...form.register('organizerOrganization')}
                      placeholder="Nombre de la empresa u organización"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="organizerEmail">🎯 Email de Contacto</Label>
                    <Input
                      id="organizerEmail"
                      type="email"
                      {...form.register('organizerEmail')}
                      placeholder="organizador@parques.gob.mx"
                      className="mt-1"
                    />
                    {form.formState.errors.organizerEmail && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.organizerEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="organizerPhone">🎯 Teléfono de Contacto</Label>
                    <Input
                      id="organizerPhone"
                      {...form.register('organizerPhone')}
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
                      onClick={() => {
                        form.handleSubmit(onSubmit)();
                      }}
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