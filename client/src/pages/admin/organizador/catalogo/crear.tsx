import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';

import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Checkbox } from '@/components/ui/checkbox';
import LocationSelector from '@/components/LocationSelector';
import { Plus } from 'lucide-react';

// Las categorías se cargan dinámicamente desde la API

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
  { id: "por_costear", label: "🔵 Por Costear", emoji: "🔵" },
  { id: "activa", label: "🟢 Activa", emoji: "🟢" },
  { id: "programada", label: "🟡 Programada", emoji: "🟡" },
  { id: "cancelada", label: "🔴 Cancelada", emoji: "🔴" },
  { id: "finalizada", label: "⚫ Finalizada", emoji: "⚫" },
  { id: "en_pausa", label: "🟠 En Pausa", emoji: "🟠" }
];

// Esquema de validación para el formulario
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
  isFree: z.boolean().default(false),
  
  // Campos para descuentos aplicables
  discountSeniors: z.coerce.number().min(0).max(100).optional(),
  discountStudents: z.coerce.number().min(0).max(100).optional(),
  discountFamilies: z.coerce.number().min(0).max(100).optional(),
  discountDisability: z.coerce.number().min(0).max(100).optional(),
  discountEarlyBird: z.coerce.number().min(0).max(100).optional(),
  discountEarlyBirdDeadline: z.string().optional(),
  
  materials: z.string().optional(),
  requirements: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringDays: z.array(z.string()).optional(),
  
  // Nuevos campos para segmentación
  targetMarket: z.array(z.string()).optional(),
  
  // Campos para capacidades diferentes
  specialNeeds: z.array(z.string()).optional(),
  
  // Campos de costeo financiero
  costRecoveryPercentage: z.coerce.number().min(0).max(100).default(30),
  costingNotes: z.string().optional(),
  
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
  status: z.string().default('por_costear'),
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
  
  try {
    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
    
    if (isNaN(horaInicioH) || isNaN(horaInicioM) || isNaN(horaFinH) || isNaN(horaFinM)) {
      console.error("Error en formato de horas:", { horaInicio, horaFin });
      return 0;
    }
    
    const inicioMinutos = horaInicioH * 60 + horaInicioM;
    const finMinutos = horaFinH * 60 + horaFinM;
    
    // Si la hora de fin es menor que la de inicio, asumimos que es al día siguiente
    if (finMinutos < inicioMinutos) {
      return (24 * 60 - inicioMinutos) + finMinutos;
    }
    
    return finMinutos - inicioMinutos;
  } catch (error) {
    console.error("Error al calcular duración:", error);
    return 0;
  }
}

const CrearActividadPage = () => {
  const [location, setLocation] = useLocation();

  // Consulta para obtener la lista de parques
  const { data: parquesResponse, isLoading: parquesLoading } = useQuery({
    queryKey: ['/api/parks/filter'],
  });
  
  const parques = Array.isArray(parquesResponse) ? parquesResponse : [];
  
  // Consulta para obtener las categorías de actividades
  const { data: categoriasResponse, isLoading: categoriasLoading } = useQuery({
    queryKey: ['/api/activity-categories'],
  });
  
  const categorias = Array.isArray(categoriasResponse) ? categoriasResponse : [];
  
  // Consulta para obtener la lista de instructores
  const { data: instructoresResponse, isLoading: instructoresLoading } = useQuery({
    queryKey: ['/api/instructors'],
  });
  
  const instructores = Array.isArray(instructoresResponse) ? instructoresResponse : [];

  // Logging para diagnosticar
  console.log('🔧 Datos de instructores cargados:', { 
    parques: parques.length, 
    categorias: categorias.length, 
    instructores: instructores.length,
    instructoresData: instructores.slice(0, 3) // Mostrar primeros 3 para debug
  });

  // Configuración del formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      parkId: "",
      startDate: "",
      endDate: "",
      startTime: "09:00", // Valor predeterminado para la hora de inicio
      endTime: "10:00",   // Valor predeterminado para la hora de finalización
      location: "",
      latitude: undefined,
      longitude: undefined,
      capacity: undefined,
      duration: undefined,
      price: 0,
      isFree: false,
      
      // Valores por defecto para descuentos
      discountSeniors: undefined,
      discountStudents: undefined,
      discountFamilies: undefined,
      discountDisability: undefined,
      discountEarlyBird: undefined,
      discountEarlyBirdDeadline: "",
      materials: "",
      requirements: "",
      isRecurring: false,
      recurringDays: [],
      targetMarket: [],
      specialNeeds: [],
      
      // Valores por defecto para costeo financiero
      costRecoveryPercentage: 30,
      costingNotes: "",
      
      instructorId: "",
      // Valores por defecto para registro ciudadano
      allowsPublicRegistration: false,
      maxRegistrations: undefined,
      registrationDeadline: "",
      registrationInstructions: "",
      requiresApproval: false,
      ageRestrictions: "",
      healthRequirements: "",
      status: "por_costear",
    },
  });

  // Mutación para crear una nueva actividad
  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const parkId = parseInt(values.parkId);
      
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
      
      // Solo incluimos los campos que existen en la base de datos real
      // Calcular duración
      let duracion = values.duration;
      if (values.startTime && values.endTime) {
        duracion = calcularDuracionEnMinutos(values.startTime, values.endTime);
      }
      
      // Formatear fechas para la API
      // La API espera fechas normales, no necesitamos combinar con hora porque puede causar problemas
      const data = {
        title: values.title,
        description: values.description,
        parkId,
        startDate: values.startDate,
        endDate: values.endDate || null,
        startTime: values.startTime,
        endTime: values.endTime,
        category_id: parseInt(values.category), // Convertir a number para la API
        location: values.location || null,
        latitude: values.latitude || null,
        longitude: values.longitude || null,
        capacity: values.capacity || null,
        duration: duracion || null,
        price: values.price || 0,
        isFree: values.isFree || false,
        
        // Campos de descuentos
        discountSeniors: values.discountSeniors || 0,
        discountStudents: values.discountStudents || 0,
        discountFamilies: values.discountFamilies || 0,
        discountDisability: values.discountDisability || 0,
        discountEarlyBird: values.discountEarlyBird || 0,
        discountEarlyBirdDeadline: values.discountEarlyBirdDeadline || null,
        materials: values.materials || "",
        requirements: values.requirements || "",
        isRecurring: values.isRecurring || false,
        recurringDays: values.recurringDays || [],
        targetMarket: values.targetMarket || [],
        specialNeeds: values.specialNeeds || [],
        
        // Campos de costeo financiero
        costRecoveryPercentage: values.costRecoveryPercentage || 30,
        costingNotes: values.costingNotes || "",
        
        // Campos para registro ciudadano
        allowsPublicRegistration: values.allowsPublicRegistration || false,
        maxRegistrations: values.maxRegistrations || null,
        registrationDeadline: values.registrationDeadline || null,
        registrationInstructions: values.registrationInstructions || "",
        requiresApproval: values.requiresApproval || false,
        ageRestrictions: values.ageRestrictions || "",
        healthRequirements: values.healthRequirements || "",
        registrationStatus: values.allowsPublicRegistration ? "open" : "closed",
        currentRegistrations: 0,
        
        // Estado de la actividad (siempre "por_costear" para nuevas actividades)
        status: "por_costear",
        ...instructorData
      };
      
      console.log("Enviando datos a la API:", data);
      return await apiRequest('/api/activities', {
        method: 'POST',
        data: data
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Actividad creada",
        description: "La actividad ha sido creada exitosamente. Ahora puedes agregar imágenes.",
        variant: "default"
      });
      
      // Invalidar consultas específicas relacionadas con actividades
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parks/filter'] });
      
      // Redirigir a la página de gestión de imágenes de la nueva actividad
      setTimeout(() => {
        setLocation(`/admin/activities/${data.id}/images`);
      }, 500);
    },
    onError: (error) => {
      console.error("Error al crear actividad:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al crear la actividad. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate(values);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con patrón Card estandarizado */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Plus className="w-8 h-8 text-gray-900" />
                <h1 className="text-3xl font-bold text-gray-900">Crear Nueva Actividad</h1>
              </div>
              <p className="text-gray-600 mt-2">Completa el formulario para crear una nueva actividad para el catálogo</p>
            </div>
            <Button variant="outline" onClick={() => setLocation('/admin/activities/management')}>
              Actividades Disponibles
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formulario de Actividad</CardTitle>
            <CardDescription>
              Ingresa la información completa de la actividad. Los campos marcados con * son obligatorios.
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  📋 <strong>Flujo de Aprobación:</strong> Todas las actividades nuevas se crean con estado "Por Costear" y requieren autorización financiera antes de activarse.
                </p>
              </div>
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Sección de información básica */}
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
                          <Input placeholder="Ej: Taller de Pintura" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categorias.map((categoria: any) => (
                              <SelectItem key={categoria.id} value={categoria.id.toString()}>
                                {categoria.name}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe la actividad en detalle"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Incluye detalles importantes sobre lo que los participantes harán y aprenderán.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parkId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parque *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un parque" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {parques.map((parque: any) => (
                            <SelectItem key={parque.id} value={parque.id.toString()}>
                              {parque.name}
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
                      <FormLabel>Ubicación dentro del parque</FormLabel>
                      <FormControl>
                        <LocationSelector
                          parkId={form.watch('parkId') ? Number(form.watch('parkId')) : undefined}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Seleccionar ubicación"
                        />
                      </FormControl>
                      <FormDescription>
                        Especifica dónde dentro del parque se realizará la actividad
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sección de Coordenadas GPS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 rounded-lg p-4">
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-900 mb-2">Coordenadas GPS Exactas</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Establece las coordenadas GPS específicas donde se llevará a cabo la actividad dentro del parque.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitud</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="any"
                            placeholder="20.123456"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Coordenada de latitud (ej: 20.123456)
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
                        <FormLabel>Longitud</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="any"
                            placeholder="-103.123456"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Coordenada de longitud (ej: -103.123456)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
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

              {/* Sección de costeo y precio */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Costeo y Precio</h3>
                
                {/* 1. Actividad Gratuita (primero) */}
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
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-medium text-base">
                        🎫 Actividad Gratuita
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 2. Precio (segundo) */}
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>💰 Precio (MXN)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="Ej: 50.00" 
                            {...field} 
                            disabled={form.watch("isFree")}
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch("isFree") 
                            ? "Actividad gratuita" 
                            : "Precio fijo por persona"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 3. Capacidad Máxima (tercero) */}
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>👥 Capacidad Máxima</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="Ej: 20" {...field} />
                        </FormControl>
                        <FormDescription>
                          Número máximo de participantes permitidos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sección de descuentos aplicables */}
                {!form.watch("isFree") && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <h4 className="text-md font-medium">🎫 Descuentos Aplicables</h4>
                      <span className="text-sm text-muted-foreground">(Opcional)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Configure descuentos especiales para diferentes grupos de beneficiarios
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Descuento para Adultos Mayores */}
                      <FormField
                        control={form.control}
                        name="discountSeniors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              👴 Adultos Mayores (65+)
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="100" 
                                  step="1"
                                  placeholder="" 
                                  {...field}
                                  className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">% de descuento</span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Descuento para Estudiantes */}
                      <FormField
                        control={form.control}
                        name="discountStudents"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              👨‍🎓 Estudiantes con Credencial
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="100" 
                                  step="1"
                                  placeholder="" 
                                  {...field}
                                  className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">% de descuento</span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Descuento para Familias Numerosas */}
                      <FormField
                        control={form.control}
                        name="discountFamilies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              👨‍👩‍👧‍👦 Familias Numerosas (3+ hijos)
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="100" 
                                  step="1"
                                  placeholder="" 
                                  {...field}
                                  className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">% de descuento</span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Descuento por Discapacidad */}
                      <FormField
                        control={form.control}
                        name="discountDisability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              ♿ Personas con Discapacidad
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="100" 
                                  step="1"
                                  placeholder="" 
                                  {...field}
                                  className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">% de descuento</span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Descuento por Inscripción Temprana */}
                    <div className="space-y-3 pt-2 border-t">
                      <FormField
                        control={form.control}
                        name="discountEarlyBird"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              🏅 Inscripciones Tempranas
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="100" 
                                  step="1"
                                  placeholder="" 
                                  {...field}
                                  className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">% de descuento</span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {form.watch("discountEarlyBird") && Number(form.watch("discountEarlyBird")) > 0 && (
                        <FormField
                          control={form.control}
                          name="discountEarlyBirdDeadline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha límite para inscripción temprana</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  min={new Date().toISOString().split('T')[0]}
                                />
                              </FormControl>
                              <FormDescription>
                                Hasta esta fecha aplicará el descuento por inscripción temprana
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Resumen de descuentos */}
                    {(form.watch("discountSeniors") || form.watch("discountStudents") || 
                      form.watch("discountFamilies") || form.watch("discountDisability") || 
                      form.watch("discountEarlyBird")) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-blue-800 mb-2">Descuentos Configurados:</h5>
                        <div className="text-xs text-blue-700 space-y-1">
                          {form.watch("discountSeniors") && Number(form.watch("discountSeniors")) > 0 && (
                            <p>• Adultos mayores: {form.watch("discountSeniors")}% de descuento</p>
                          )}
                          {form.watch("discountStudents") && Number(form.watch("discountStudents")) > 0 && (
                            <p>• Estudiantes: {form.watch("discountStudents")}% de descuento</p>
                          )}
                          {form.watch("discountFamilies") && Number(form.watch("discountFamilies")) > 0 && (
                            <p>• Familias numerosas: {form.watch("discountFamilies")}% de descuento</p>
                          )}
                          {form.watch("discountDisability") && Number(form.watch("discountDisability")) > 0 && (
                            <p>• Personas con discapacidad: {form.watch("discountDisability")}% de descuento</p>
                          )}
                          {form.watch("discountEarlyBird") && Number(form.watch("discountEarlyBird")) > 0 && (
                            <p>• Inscripción temprana: {form.watch("discountEarlyBird")}% de descuento
                              {form.watch("discountEarlyBirdDeadline") && ` (hasta ${form.watch("discountEarlyBirdDeadline")})`}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sección de Costeo Financiero */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <h4 className="text-md font-medium">💰 Costeo Financiero</h4>
                    <span className="text-sm text-muted-foreground">(Obligatorio)</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Configure el análisis de costeo para esta actividad que será revisado por el área de finanzas
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="costRecoveryPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>% Recuperación Objetivo</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="5"
                                placeholder="30" 
                                {...field}
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground">% de los costos</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Meta de recuperación de costos (default: 30%)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="costingNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observaciones de Costeo</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Consideraciones especiales para el análisis de costeo, justificación del porcentaje objetivo, etc."
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Información adicional para el área de finanzas (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                                placeholder="Ej: Mayores de 18 años"
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
                        defaultValue={field.value}
                        disabled={instructoresLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              instructoresLoading 
                                ? "Cargando instructores..." 
                                : "Selecciona un instructor"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {instructoresLoading ? (
                            <SelectItem value="loading" disabled>
                              Cargando instructores...
                            </SelectItem>
                          ) : instructores.length === 0 ? (
                            <SelectItem value="no-instructors" disabled>
                              No hay instructores disponibles
                            </SelectItem>
                          ) : (
                            instructores.map((instructor: any) => (
                              <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                {instructor.full_name || instructor.fullName || `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim()} 
                                {instructor.email && ` (${instructor.email})`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecciona un instructor registrado en el sistema. Si el instructor que buscas no está en la lista, primero debes registrarlo en la sección de Instructores.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {!instructoresLoading && instructores.length === 0 && (
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
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Guardando..." : "Guardar Actividad"}
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

export default CrearActividadPage;