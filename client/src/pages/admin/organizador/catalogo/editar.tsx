import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';

import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Checkbox } from '@/components/ui/checkbox';
import LocationSelector from '@/components/LocationSelector';
import { Edit } from 'lucide-react';

// Días de la semana para actividades recurrentes
const DIAS_SEMANA = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" }
];

// Opciones de mercado meta para la segmentación
const MERCADO_META = [
  { id: "preescolar", label: "Preescolar - 0 a 5 años" },
  { id: "ninos", label: "Niños - 6 a 12 años" },
  { id: "adolescentes", label: "Adolescentes - 13 a 18 años" },
  { id: "adultos", label: "Adultos - 19 a 65 años" },
  { id: "adultosmayores", label: "Adultos Mayores - +65 años" }
];

// Opciones de capacidades diferentes
const CAPACIDADES_DIFERENTES = [
  { id: "fisica", label: "Física / Motriz" },
  { id: "visual", label: "Visual" },
  { id: "auditiva", label: "Auditiva" },
  { id: "intelectual", label: "Intelectual / Cognitiva" },
  { id: "psicosocial", label: "Psicosocial / Mental" },
  { id: "neurodivergencias", label: "Neurodivergencias" },
  { id: "multiple", label: "Múltiple / Combinada" },
  { id: "temporal", label: "Temporal" }
];

// Opciones de estado de actividad
const ESTADOS_ACTIVIDAD = [
  { id: "activa", label: "🟢 Activa", emoji: "🟢" },
  { id: "programada", label: "🟡 Programada", emoji: "🟡" },
  { id: "cancelada", label: "🔴 Cancelada", emoji: "🔴" },
  { id: "finalizada", label: "⚫ Finalizada", emoji: "⚫" },
  { id: "en_pausa", label: "🟠 En Pausa", emoji: "🟠" }
];

// Esquema de validación para el formulario - IDÉNTICO AL DE CREAR
const formSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  category: z.string().min(1, "Debes seleccionar una categoría"),
  parkId: z.string().min(1, "Debes seleccionar un parque"),
  startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
  endDate: z.string().optional(),
  
  // Nuevos campos para hora de inicio y finalización
  startTime: z.string().min(1, "La hora de inicio es obligatoria"),
  endTime: z.string().min(1, "La hora de finalización es obligatoria"),
  
  location: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  duration: z.coerce.number().int().positive().optional(),
  
  // Campos para precio
  price: z.coerce.number().min(0).optional(),
  isPriceRandom: z.boolean().default(false),
  isFree: z.boolean().default(false),
  
  materials: z.string().optional(),
  requirements: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringDays: z.array(z.string()).optional(),
  
  // Nuevos campos para segmentación
  targetMarket: z.array(z.string()).optional(),
  
  // Campos para capacidades diferentes
  specialNeeds: z.array(z.string()).optional(),
  
  // Campo para seleccionar al instructor por su ID
  instructorId: z.string().optional(),
  
  // Nuevos campos para registro ciudadano
  allowsPublicRegistration: z.boolean().default(false),
  maxRegistrations: z.coerce.number().int().positive().optional(),
  registrationDeadline: z.string().optional(),
  registrationInstructions: z.string().optional(),
  requiresApproval: z.boolean().default(false),
  ageRestrictions: z.string().optional(),
  healthRequirements: z.string().optional(),
  
  // Campo para el estado de la actividad
  status: z.string().default('programada'),
});

type FormValues = z.infer<typeof formSchema>;

// Función para combinar una fecha y una hora en un formato ISO
function combinarFechaYHora(fecha: string, hora: string): string {
  const [year, month, day] = fecha.split('-');
  const [hours, minutes] = hora.split(':');
  
  const fechaCompleta = new Date(
    parseInt(year), 
    parseInt(month) - 1, // El mes en JavaScript es 0-indexado
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  );
  
  return fechaCompleta.toISOString();
}

// Función para calcular la duración en minutos entre dos horas
function calcularDuracionEnMinutos(horaInicio: string, horaFin: string): number {
  if (!horaInicio || !horaFin) return 0;
  
  const [inicioHoras, inicioMinutos] = horaInicio.split(':').map(Number);
  const [finHoras, finMinutos] = horaFin.split(':').map(Number);
  
  const inicioTotal = inicioHoras * 60 + inicioMinutos;
  let finTotal = finHoras * 60 + finMinutos;
  
  // Si la hora de fin es menor que la de inicio, asumimos que es al día siguiente
  if (finTotal <= inicioTotal) {
    finTotal += 24 * 60; // Agregar 24 horas
  }
  
  return finTotal - inicioTotal;
}

const EditarActividadPage = () => {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const activityId = params?.id;

  // Consulta para obtener la lista de parques
  const { data: parques = [], isLoading: isLoadingParques } = useQuery({
    queryKey: ['/api/parks'],
  });

  // Consulta para obtener la lista de categorías
  const { data: categorias = [], isLoading: isLoadingCategorias } = useQuery({
    queryKey: ['/api/activity-categories'],
  });

  // Consulta para obtener la lista de instructores
  const { data: instructores = [], isLoading: isLoadingInstructores } = useQuery({
    queryKey: ['/api/instructors']
  });





  // Consulta para obtener los datos de la actividad actual
  const { data: actividad, isLoading: isLoadingActividad } = useQuery({
    queryKey: [`/api/activities/${activityId}`],
    enabled: !!activityId,
  });

  // Inicializar el formulario con valores por defecto idénticos al formulario de crear
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      parkId: "",
      startDate: "",
      endDate: "",
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      latitude: undefined,
      longitude: undefined,
      capacity: undefined,
      duration: 60,
      price: 0,
      isPriceRandom: false,
      isFree: false,
      materials: "",
      requirements: "",
      isRecurring: false,
      recurringDays: [],
      targetMarket: [],
      specialNeeds: [],
      instructorId: "",
      allowsPublicRegistration: false,
      maxRegistrations: undefined,
      registrationDeadline: "",
      registrationInstructions: "",
      requiresApproval: false,
      ageRestrictions: "",
      healthRequirements: "",
      status: "programada",
    }
  });

  // Llenar el formulario cuando se cargan los datos de la actividad
  useEffect(() => {
    if (actividad) {
      const data = actividad as any;
      // Extraer fecha y hora de inicio
      let startDate = '';
      let startTime = '09:00';
      
      if (data.startDate) {
        const dateStr = data.startDate.toString();
        if (dateStr.includes('T')) {
          // Si es una fecha ISO completa
          const date = new Date(dateStr);
          startDate = date.toISOString().split('T')[0];
          startTime = date.toTimeString().substring(0, 5);
        } else if (dateStr.includes(' ')) {
          // Si es formato "YYYY-MM-DD HH:MM:SS"
          const [datePart, timePart] = dateStr.split(' ');
          startDate = datePart;
          if (timePart) {
            startTime = timePart.substring(0, 5);
          }
        } else {
          // Si es solo fecha YYYY-MM-DD
          startDate = dateStr;
        }
      }
      
      // Si hay startTime separado, úsalo
      if (data.startTime) {
        startTime = data.startTime;
      }
      
      // Calcular endTime si no está disponible
      let endTime = data.endTime || '10:00';
      if (!data.endTime && data.duration) {
        const [h, m] = startTime.split(':').map(Number);
        const totalMinutos = h * 60 + m + (data.duration || 60);
        const endH = Math.floor(totalMinutos / 60) % 24;
        const endM = totalMinutos % 60;
        endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
      }

      // Procesar endDate
      let endDate = '';
      if (data.endDate) {
        const endDateStr = data.endDate.toString();
        if (endDateStr.includes('T')) {
          endDate = new Date(endDateStr).toISOString().split('T')[0];
        } else if (endDateStr.includes(' ')) {
          endDate = endDateStr.split(' ')[0];
        } else {
          endDate = endDateStr;
        }
      }

      // Procesar registrationDeadline
      let registrationDeadline = '';
      if (data.registrationDeadline) {
        const deadlineStr = data.registrationDeadline.toString();
        if (deadlineStr.includes('T')) {
          registrationDeadline = new Date(deadlineStr).toISOString().split('T')[0];
        } else if (deadlineStr.includes(' ')) {
          registrationDeadline = deadlineStr.split(' ')[0];
        } else {
          registrationDeadline = deadlineStr;
        }
      }

      // Preparar los valores para el formulario
      const formValues = {
        title: data.title || "",
        description: data.description || "",
        category: data.categoryId ? data.categoryId.toString() : (data.category_id ? data.category_id.toString() : ""),
        parkId: data.parkId ? data.parkId.toString() : (data.park_id ? data.park_id.toString() : ""),
        startDate: startDate,
        endDate: endDate,
        startTime: startTime,
        endTime: endTime,
        location: data.location || "",
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
        capacity: data.capacity || undefined,
        duration: data.duration || calcularDuracionEnMinutos(startTime, endTime),
        price: data.price ? parseFloat(data.price) : 0,
        isPriceRandom: data.isPriceRandom || data.is_price_random || false,
        isFree: data.isFree || data.is_free || (data.price === null || data.price === 0 || data.price === "0"),
        materials: data.materials || "",
        requirements: data.requirements || "",
        isRecurring: data.isRecurring || data.is_recurring || false,
        recurringDays: data.recurringDays || data.recurring_days || [],
        targetMarket: data.targetMarket || data.target_market || [],
        specialNeeds: data.specialNeeds || data.special_needs || [],
        instructorId: data.instructorId ? data.instructorId.toString() : (data.instructor_id ? data.instructor_id.toString() : ""),
        allowsPublicRegistration: data.allowsPublicRegistration || data.allows_public_registration || data.registrationEnabled || data.registration_enabled || false,
        maxRegistrations: data.maxRegistrations || data.max_registrations || undefined,
        registrationDeadline: registrationDeadline,
        registrationInstructions: data.registrationInstructions || data.registration_instructions || "",
        requiresApproval: data.requiresApproval || data.requires_approval || false,
        ageRestrictions: data.ageRestrictions || data.age_restrictions || "",
        healthRequirements: data.healthRequirements || data.health_requirements || "",
        status: data.status || "programada",
      };

      form.reset(formValues);
    }
  }, [actividad, form]);

  // Mutación para actualizar la actividad
  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      console.log('Enviando datos de edición:', values);
      console.log('🔍 STATUS ESPECÍFICO enviado:', {
        status: values.status,
        statusType: typeof values.status,
        statusLength: values.status?.length
      });

      // Buscamos el instructor seleccionado para obtener sus datos
      let instructorData = {};
      
      if (values.instructorId) {
        const selectedInstructor = instructores.find(
          (instructor: any) => instructor.id.toString() === values.instructorId
        );
        
        if (selectedInstructor) {
          instructorData = {
            instructorId: selectedInstructor.id,
            instructorName: `${selectedInstructor.fullName || selectedInstructor.username || ''}`.trim(),
            instructorContact: selectedInstructor.email || '',
          };
        }
      }

      // Preparar los datos para enviar
      const dataToSend = {
        title: values.title,
        description: values.description,
        categoryId: parseInt(values.category),
        parkId: parseInt(values.parkId),
        
        // Combinar fecha y hora para startDate
        startDate: combinarFechaYHora(values.startDate, values.startTime),
        endDate: values.endDate ? combinarFechaYHora(values.endDate, values.endTime) : null,
        
        // Guardar también los campos separados
        startTime: values.startTime,
        endTime: values.endTime,
        
        location: values.location,
        latitude: values.latitude,
        longitude: values.longitude,
        capacity: values.capacity,
        duration: values.duration,
        price: values.price,
        isPriceRandom: values.isPriceRandom,
        isFree: values.isFree,
        materials: values.materials,
        requirements: values.requirements,
        isRecurring: values.isRecurring,
        recurringDays: values.recurringDays,
        targetMarket: values.targetMarket,
        specialNeeds: values.specialNeeds,
        
        // Datos del instructor
        ...instructorData,
        
        // Campos de registro ciudadano
        allowsPublicRegistration: values.allowsPublicRegistration,
        maxRegistrations: values.maxRegistrations,
        registrationDeadline: values.registrationDeadline,
        registrationInstructions: values.registrationInstructions,
        requiresApproval: values.requiresApproval,
        ageRestrictions: values.ageRestrictions,
        healthRequirements: values.healthRequirements,
        
        // Estado de la actividad
        status: values.status,
      };

      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error ${response.status}: ${error}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Éxito!",
        description: "La actividad ha sido actualizada correctamente.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${activityId}`] });
      
      setLocation(`/admin/activities`);
    },
    onError: (error) => {
      console.error('Error al actualizar actividad:', error);
      toast({
        title: "Error",
        description: `No se pudo actualizar la actividad: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoadingActividad || isLoadingParques || isLoadingCategorias || isLoadingInstructores) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4">Cargando datos de la actividad...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!actividad) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600">No se encontró la actividad solicitada.</p>
              <Button 
                onClick={() => setLocation('/admin/organizador/catalogo/ver')} 
                className="mt-4"
              >
                Volver al catálogo
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Actividad
            </CardTitle>
            <CardDescription>
              Modifica los detalles de la actividad seleccionada
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Form {...form}>
              <form 
                key={actividad?.data?.id} 
                onSubmit={form.handleSubmit(onSubmit)} 
                className="space-y-6"
              >
                
                {/* Sección de Información Básica */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información Básica</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Título *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Yoga en el parque" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ESTADOS_ACTIVIDAD.map((estado) => (
                                <SelectItem key={estado.id} value={estado.id}>
                                  {estado.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => {
                        const selectedCategory = categorias.find((c: any) => c.id.toString() === field.value);
                        return (
                          <FormItem>
                            <FormLabel>Categoría *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categorias.map((categoria: any) => (
                                  <SelectItem key={categoria.id} value={categoria.id.toString()}>
                                    {categoria.name || categoria.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe la actividad, qué se hará, objetivos, etc."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sección de Ubicación */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Ubicación</h3>
                  
                  <FormField
                    control={form.control}
                    name="parkId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parque *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un parque" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {parques.map((parque: any) => (
                              <SelectItem key={parque.id} value={parque.id.toString()}>
                                {parque.nombre || parque.name}
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
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación específica</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: Área de juegos, Cancha de fútbol, Junto al lago" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Especifica dónde exactamente dentro del parque se realizará la actividad
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitud (GPS)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="any" 
                              placeholder="Ej: 20.676667" 
                              {...field}
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Coordenada de latitud para ubicación GPS precisa
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitud (GPS)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="any" 
                              placeholder="Ej: -103.342222" 
                              {...field}
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Coordenada de longitud para ubicación GPS precisa
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              form.setValue('latitude', position.coords.latitude);
                              form.setValue('longitude', position.coords.longitude);
                              toast({
                                title: "Ubicación obtenida",
                                description: "Las coordenadas GPS han sido establecidas automáticamente.",
                              });
                            },
                            (error) => {
                              toast({
                                title: "Error",
                                description: "No se pudo obtener la ubicación. Por favor ingresa las coordenadas manualmente.",
                                variant: "destructive"
                              });
                            }
                          );
                        } else {
                          toast({
                            title: "No soportado",
                            description: "Tu navegador no soporta la geolocalización.",
                            variant: "destructive"
                          });
                        }
                      }}
                      className="w-full"
                    >
                      📍 Obtener Ubicación Actual
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Haz clic para obtener automáticamente tu ubicación GPS actual
                    </p>
                  </div>
                </div>

                {/* Sección de Segmentación */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Segmentación</h3>
                  
                  <FormField
                    control={form.control}
                    name="targetMarket"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Mercado Meta</FormLabel>
                          <FormDescription>
                            Selecciona los grupos de edad a los que está dirigida esta actividad
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {MERCADO_META.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="targetMarket"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== item.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {item.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sección de Capacidades Diferentes */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Capacidades Diferentes</h3>
                  
                  <FormField
                    control={form.control}
                    name="specialNeeds"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Accesibilidad para personas con capacidades diferentes</FormLabel>
                          <FormDescription>
                            Selecciona los tipos de discapacidad para los que esta actividad está adaptada
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {CAPACIDADES_DIFERENTES.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="specialNeeds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== item.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {item.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sección de fecha y hora */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Fecha y Horario</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de inicio *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de finalización</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            Opcional para actividades de un solo día
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Nuevos campos para hora de inicio y finalización */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de inicio *</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e); // Actualizar el campo normalmente
                                
                                // Calcular la duración automáticamente
                                const endTime = form.getValues("endTime");
                                if (endTime) {
                                  const duracionCalculada = calcularDuracionEnMinutos(e.target.value, endTime);
                                  form.setValue("duration", duracionCalculada);
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Hora a la que comenzará la actividad
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de finalización *</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(e); // Actualizar el campo normalmente
                                
                                // Calcular la duración automáticamente
                                const startTime = form.getValues("startTime");
                                if (startTime) {
                                  const duracionCalculada = calcularDuracionEnMinutos(startTime, e.target.value);
                                  form.setValue("duration", duracionCalculada);
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Hora a la que terminará la actividad
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (minutos)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="Se calcula automáticamente" 
                            {...field} 
                            disabled={true} // Deshabilitamos el campo para que sea de solo lectura
                          />
                        </FormControl>
                        <FormDescription>
                          Se calcula automáticamente basado en la hora de inicio y finalización
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Actividad recurrente</FormLabel>
                          <FormDescription>
                            Marca esta opción si la actividad se repite en días específicos
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("isRecurring") && (
                    <FormField
                      control={form.control}
                      name="recurringDays"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel>Días de la semana</FormLabel>
                            <FormDescription>
                              Selecciona los días en que se repite la actividad
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {DIAS_SEMANA.map((item) => (
                              <FormField
                                key={item.id}
                                control={form.control}
                                name="recurringDays"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={item.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(item.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), item.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== item.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {item.label}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Sección de capacidad y materiales */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Capacidad y Materiales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacidad máxima</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="Ej: 20" 
                              {...field}
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Número máximo de participantes permitidos
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Precio (MXN)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                placeholder="Ej: 50.00" 
                                {...field} 
                                disabled={form.watch("isFree") || form.watch("isPriceRandom")}
                              />
                            </FormControl>
                            <FormDescription>
                              {form.watch("isFree") 
                                ? "Actividad gratuita" 
                                : form.watch("isPriceRandom") 
                                  ? "El precio será variable o por donativo" 
                                  : "Precio fijo por persona"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex flex-col gap-2 mt-2">
                        <FormField
                          control={form.control}
                          name="isFree"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    if (checked) {
                                      form.setValue("price", 0);
                                      form.setValue("isPriceRandom", false);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Actividad Gratuita
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="isPriceRandom"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    if (checked) {
                                      form.setValue("isFree", false);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-medium">
                                Precio Aleatorio (Donativo/Variable)
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="materials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Materiales necesarios</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Lista de materiales que se usarán o que deben traer los participantes"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requisitos para participantes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Requisitos especiales, rango de edad, condiciones físicas, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sección de Registro Ciudadano */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Configuración de Registro Ciudadano</h3>
                  <p className="text-sm text-gray-600">Configura si los ciudadanos pueden inscribirse a esta actividad desde el sitio público</p>
                  
                  <FormField
                    control={form.control}
                    name="allowsPublicRegistration"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Permitir inscripción pública
                          </FormLabel>
                          <FormDescription>
                            Los ciudadanos podrán inscribirse a esta actividad desde la página pública
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("allowsPublicRegistration") && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="maxRegistrations"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Capacidad máxima de inscripciones</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Ej: 25"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormDescription>
                                Número máximo de personas que se pueden inscribir. Se recomienda que coincida con el número máximo escrito en la sección de Capacidad y Materiales.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="registrationDeadline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha límite de inscripción</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                Fecha después de la cual no se aceptan inscripciones
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="registrationInstructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instrucciones para inscripción</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Instrucciones específicas para los participantes al inscribirse"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription>
                              Información adicional que verán los ciudadanos al inscribirse
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="requiresApproval"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Requiere aprobación administrativa
                              </FormLabel>
                              <FormDescription>
                                Las inscripciones deben ser aprobadas manualmente por un administrador
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="ageRestrictions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Restricciones de edad</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej: 18-65 años, Menores acompañados"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                Restricciones específicas de edad para participar
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="healthRequirements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Requisitos de salud</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej: Certificado médico, buena condición física"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                Requisitos médicos o de salud para participar
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sección de Instructor/Facilitador */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Datos del Instructor o Facilitador</h3>
                  
                  <FormField
                    control={form.control}
                    name="instructorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seleccionar Instructor</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un instructor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {instructores.length === 0 ? (
                              <SelectItem value="no-instructors" disabled>
                                No hay instructores disponibles
                              </SelectItem>
                            ) : (
                              instructores.map((instructor: any) => (
                                <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                  {instructor.firstName} {instructor.lastName} ({instructor.email})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Selecciona un instructor registrado en el sistema. Si el instructor que buscas no está en la lista, primero debes registrarlo en la sección de Usuarios.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {instructores.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 my-4">
                      <p className="text-amber-800">
                        No hay instructores registrados en el sistema. Dirígete a la sección de Instructores en este módulo de Actividades, para crear un Instructor primero.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation('/admin/organizador/catalogo/ver')}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? "Guardando..." : "Actualizar Actividad"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default EditarActividadPage;