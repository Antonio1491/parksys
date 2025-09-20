import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { insertEventSchema, EventTypes, TargetAudiences, EventStatuses, RegistrationTypes } from "@shared/events-schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/AdminLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock, Users, MapPin, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CostingSection } from "@/components/CostingSection";

// Esquema para el formulario con fechas como Date objects
const eventFormSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  eventType: z.string().min(2).max(50),
  targetAudience: z.string().max(100).optional(),
  status: z.enum(["draft", "published", "cancelled", "postponed"]).default("draft"),
  featuredImageUrl: z.string().optional(),
  startDate: z.date({
    required_error: "La fecha de inicio es requerida",
  }),
  endDate: z.date().optional().nullable(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  registrationType: z.enum(["free", "registration"]).default("free"),
  organizerName: z.string().max(100).optional(),
  organizerEmail: z.string().email().optional().or(z.literal('')),
  organizerPhone: z.string().max(20).optional(),
  organizerOrganization: z.string().optional(),
  location: z.string().optional(),
  // Campos de precio
  isFree: z.boolean().default(true),
  price: z.preprocess(v => v === '' || v == null ? undefined : v, z.coerce.number().int().positive().optional()),
  requiresApproval: z.boolean().default(false),
  // Campos de descuentos unificados
  discountSeniors: z.coerce.number().min(0).max(100).default(0),
  discountStudents: z.coerce.number().min(0).max(100).default(0),
  discountFamilies: z.coerce.number().min(0).max(100).default(0),
  discountDisability: z.coerce.number().min(0).max(100).default(0),
  discountEarlyBird: z.coerce.number().min(0).max(100).default(0),
  discountEarlyBirdDeadline: z.date().optional().nullable(),
  // Campos de costeo financiero
  costRecoveryPercentage: z.coerce.number().min(0).max(100).default(30),
  costingNotes: z.string().optional(),
  // Array de parques
  parkIds: z.array(z.number()).min(1, "Debe seleccionar al menos un parque")
}).refine((data) => {
  // Si el evento no es gratuito, debe tener precio
  if (!data.isFree && (!data.price || data.price <= 0)) {
    return false;
  }
  return true;
}, {
  message: "El precio es requerido para eventos de pago",
  path: ["price"]
})

// Tipos
type EventFormValues = z.infer<typeof eventFormSchema>;

// Usar arrays importados del schema unificado

const NewEventPage: React.FC = () => {
  const [, navigate] = useLocation();

  // Consultar parques para el select
  const { data: parks, isLoading: parksLoading, error: parksError } = useQuery({
    queryKey: ["/api/parks"],
  });

  // Consultar categorías de eventos
  const { data: eventCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/event-categories"],
  });

  // Formulario con validación zod
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "",
      targetAudience: "all",
      status: "draft",
      startDate: new Date(),
      endDate: undefined,
      location: "",
      capacity: undefined,
      registrationType: "free",
      parkIds: [],
      organizerName: "",
      organizerOrganization: "",
      organizerEmail: "",
      organizerPhone: "",
      // Campos de precio y pago
      isFree: true,
      price: undefined,
      requiresApproval: false,
      // Campos de descuentos unificados
      discountSeniors: 0,
      discountStudents: 0,
      discountFamilies: 0,
      discountDisability: 0,
      discountEarlyBird: 0,
      discountEarlyBirdDeadline: undefined,
      // Campos de costeo financiero unificados
      costRecoveryPercentage: 30,
      costingNotes: "",
    },
  });

  // Mutación para crear un evento
  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear el evento");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Evento creado",
        description: "El evento ha sido creado exitosamente",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/events"],
      });
      navigate(`/admin/events/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear el evento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Manejar envío del formulario
  const onSubmit = (data: EventFormValues) => {
    console.log("DATOS DEL FORMULARIO COMPLETOS:", data);
    
    // Normalizar payload para compatibilidad con insertEventSchema
    const normalizedPayload = {
      ...data,
      // Mantener fechas como Date objects (igual que en edit.tsx)
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      discountEarlyBirdDeadline: data.discountEarlyBirdDeadline || undefined,
      // Limpiar valores null/undefined opcionales
      capacity: data.capacity || undefined,
      price: data.price || undefined,
      organizerName: data.organizerName || undefined,
      organizerOrganization: data.organizerOrganization || undefined,
      organizerEmail: data.organizerEmail || undefined,
      organizerPhone: data.organizerPhone || undefined,
      location: data.location || undefined,
    };
    
    console.log("PAYLOAD NORMALIZADO:", normalizedPayload);
    createEventMutation.mutate(normalizedPayload);
  };

  // Estados de carga con DEBUG
  console.log("🔥 ESTADO LOADING:", { 
    parksLoading, 
    categoriesLoading, 
    parksData: Array.isArray(parks) ? parks.length : 0,
    categoriesData: Array.isArray(eventCategories) ? eventCategories.length : 0,
    parksError,
    timestamp: new Date().toISOString()
  });
  
  if (parksLoading || categoriesLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Card className="p-4">
            <div style={{padding: "20px", backgroundColor: "yellow", border: "3px solid black"}}>
              🔥 CARGANDO FORMULARIO - parksLoading: {String(parksLoading)}, categoriesLoading: {String(categoriesLoading)}
            </div>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // Debug limpiezado

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* DEBUG TEMPORAL: Elemento simple para confirmar renderizado */}
        <div style={{background: "orange", padding: "10px", border: "3px solid red"}}>
          🔥 RENDERIZADO OK - isFree: {String(form.watch("isFree"))}
        </div>
        {/* Header con patrón Card estandarizado */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <Plus className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Evento</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Crear un nuevo evento
          </p>
          {/* 🚨 DEBUG VISUAL */}
          <div className="mt-4 p-2 bg-red-100 border border-red-300 rounded">
            <p className="text-red-800 font-bold">🚨 DEBUG: isFree = {form.watch("isFree") ? "TRUE (Gratuito)" : "FALSE (Con Precio)"}</p>
            <p className="text-red-800">Secciones deberían aparecer cuando isFree = FALSE</p>
          </div>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">Información básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del evento</FormLabel>
                      <FormControl>
                        <Input placeholder="Título del evento" {...field} />
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EventStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción del evento"
                          className="min-h-24"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de evento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EventTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Público objetivo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || "all"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el público" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TargetAudiences.map((audience) => (
                            <SelectItem key={audience.value} value={audience.value}>
                              {audience.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>



            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <h3 className="text-lg font-medium mb-4 text-blue-800">
                🏢 Información del organizador
              </h3>
              <p className="text-sm text-blue-600 mb-4">
                CAMPOS AGREGADOS: Nombre del organizador y Empresa/Organización
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="organizerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800 font-semibold">Nombre del organizador *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Escribe el nombre del organizador" 
                          {...field} 
                          value={field.value || ""} 
                          className="bg-white border-2 border-blue-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizerOrganization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800 font-semibold">Empresa / Organización</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre de la empresa u organización" 
                          {...field} 
                          value={field.value || ""} 
                          className="bg-white border-2 border-blue-300"
                        />
                      </FormControl>
                      <FormDescription className="text-blue-600">
                        Opcional: entidad que organiza el evento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">Fecha y hora</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de inicio</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de fin (opcional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const startDate = form.getValues("startDate");
                              return startDate && date < startDate;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Opcional: si es un evento de varios días
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">
                <MapPin className="w-5 h-5 inline-block mr-2" />
                Ubicación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="parkIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parques asociados</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const currentValues = field.value || [];
                          const valueNumber = Number(value);
                          
                          if (currentValues.includes(valueNumber)) {
                            field.onChange(
                              currentValues.filter((val: number) => val !== valueNumber)
                            );
                          } else {
                            field.onChange([...currentValues, valueNumber]);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar parques" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(parks) ? parks.map((park: any) => (
                            <SelectItem key={park.id} value={park.id.toString()}>
                              {park.name}
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Parques seleccionados:{" "}
                        {field.value?.length && Array.isArray(parks)
                          ? parks
                              .filter((park: any) => field.value?.includes(park.id))
                              .map((park: any) => park.name)
                              .join(", ")
                          : "Ninguno"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación específica (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Área de picnic, Entrada principal..."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Especifica el punto exacto dentro del parque
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">
                <Users className="w-5 h-5 inline-block mr-2" />
                Participantes y Precio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad máxima (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Número de participantes"
                          {...field}
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? null : parseInt(value, 10));
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Deja en blanco si no hay límite
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de registro</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tipo de registro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RegistrationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Define cómo se registrarán los participantes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* NUEVO: Campos de precio y pago agregados */}
                <div className="md:col-span-2 bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-3">💰 Configuración de Precio</h4>
                  <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Evento gratuito</FormLabel>
                          <FormDescription>
                            ¿Este evento es completamente gratuito para los participantes?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {!form.watch("isFree") && (
                  <div className="md:col-span-2 bg-green-50 p-4 rounded-lg">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-green-800 font-semibold">💵 Precio por participante</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-gray-500 font-semibold">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-8 border-green-300 focus:border-green-500"
                                {...field}
                                value={field.value === null ? "" : field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === "" ? null : parseFloat(value));
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-green-700">
                            Precio en pesos mexicanos por cada participante
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                  <FormField
                    control={form.control}
                    name="requiresApproval"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-blue-800">🔒 Requiere aprobación manual</FormLabel>
                          <FormDescription className="text-blue-600">
                            Las inscripciones necesitan ser aprobadas manualmente antes de confirmar
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* NUEVO: Campos de descuentos unificados */}
                {!form.watch("isFree") && (
                  <div className="md:col-span-2 bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3">🎟️ Descuentos Disponibles</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="discountSeniors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">🧓 Adultos mayores (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0"
                                className="h-8 text-sm"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="discountStudents"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">🎓 Estudiantes (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0"
                                className="h-8 text-sm"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="discountFamilies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">👨‍👩‍👧‍👦 Familias (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0"
                                className="h-8 text-sm"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="discountDisability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">♿ Discapacidad (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0"
                                className="h-8 text-sm"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="discountEarlyBird"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">⏰ Inscripción temprana (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0"
                                className="h-8 text-sm"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("discountEarlyBird") > 0 && (
                        <FormField
                          control={form.control}
                          name="discountEarlyBirdDeadline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Fecha límite</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className="w-full h-8 text-xs justify-start text-left font-normal"
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP", { locale: es })
                                      ) : (
                                        <span>Seleccionar fecha</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value || undefined}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    <div className="text-xs text-purple-700 mt-2">
                      Configure los porcentajes de descuento que estarán disponibles para los participantes durante el registro
                    </div>
                  </div>
                  {/* NUEVO: Sección de costeo financiero unificado */}
                  <div className="md:col-span-2">
                    <CostingSection
                      costRecoveryPercentage={form.watch("costRecoveryPercentage") || 30}
                      onCostRecoveryChange={(percentage) => form.setValue("costRecoveryPercentage", percentage)}
                      financialNotes={form.watch("costingNotes") || ""}
                      onFinancialNotesChange={(notes) => form.setValue("costingNotes", notes)}
                      showAdvancedFields={true}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4 text-blue-600">
                📞 Información de Contacto ACTUALIZADA
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="organizerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Contacto</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Nombre completo del responsable"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizerOrganization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa / Organización</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Nombre de la empresa u organización"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Contacto</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Nombre completo del responsable"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizerOrganization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa / Organización</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Nombre de la empresa u organización"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de Contacto</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="evento@ejemplo.com"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono de Contacto</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(33) 1234-5678"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="mt-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Evento</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Información adicional sobre el evento o instrucciones especiales..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/events")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createEventMutation.isPending}
                className="min-w-24"
              >
                {createEventMutation.isPending ? "Guardando..." : "Guardar Evento"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
};

export default NewEventPage;