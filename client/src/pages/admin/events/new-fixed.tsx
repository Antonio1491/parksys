import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
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
import LoadingSpinner from "@/components/LoadingSpinner";
import EventImageUploader from "@/components/EventImageUploader";

// Esquema para validar el formulario
const eventFormSchema = z.object({
  title: z
    .string()
    .min(3, { message: "El título debe tener al menos 3 caracteres" })
    .max(255, { message: "El título no puede exceder los 255 caracteres" }),
  description: z.string().optional().nullable(),
  eventType: z.string({
    required_error: "Selecciona un tipo de evento",
  }),
  targetAudience: z.string().default("all"),
  status: z.string().default("draft"),
  startDate: z.date({
    required_error: "La fecha de inicio es requerida",
  }),
  endDate: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
  capacity: z.coerce
    .number()
    .min(0, { message: "La capacidad no puede ser negativa" })
    .optional()
    .nullable(),
  registrationType: z.string().default("open"),
  parkIds: z.array(z.coerce.number()).optional().default([]),
  organizer_name: z.string().optional().nullable(),
  organizer_organization: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  geolocation: z.any().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

// Tipos
type EventFormValues = z.infer<typeof eventFormSchema>;

// Arreglo de tipos de eventos
const eventTypes = [
  { value: "cultural", label: "Cultural" },
  { value: "sports", label: "Deportivo" },
  { value: "environmental", label: "Ambiental" },
  { value: "social", label: "Social" },
  { value: "educational", label: "Educativo" },
  { value: "recreational", label: "Recreativo" },
  { value: "other", label: "Otro" },
];

// Arreglo de públicos objetivo
const targetAudiences = [
  { value: "all", label: "Todo público" },
  { value: "children", label: "Niños" },
  { value: "youth", label: "Jóvenes" },
  { value: "adults", label: "Adultos" },
  { value: "seniors", label: "Adultos mayores" },
  { value: "families", label: "Familias" },
];

// Arreglo de estados de eventos
const eventStatuses = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "postponed", label: "Pospuesto" },
  { value: "completed", label: "Completado" },
];

// Arreglo de tipos de registro
const registrationTypes = [
  { value: "open", label: "Abierto" },
  { value: "invitation", label: "Por invitación" },
  { value: "closed", label: "Cerrado" },
];

const NewEventPageFixed: React.FC = () => {
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
      endDate: null,
      location: "",
      capacity: null,
      registrationType: "open",
      parkIds: [],
      organizer_name: "",
      organizer_organization: "",
      contact_email: "",
      contact_phone: "",
      notes: "",
      geolocation: null,
      imageUrl: null,
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
    console.log("DATOS DEL FORMULARIO:", data);
    createEventMutation.mutate(data);
  };

  if (parksLoading || categoriesLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Card className="p-4">
            <div>Cargando formulario...</div>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <Plus className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Evento</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Crear un nuevo evento
          </p>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Información básica */}
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
                          <SelectItem value="draft">Borrador</SelectItem>
                          <SelectItem value="published">Publicado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
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
              </div>
            </div>

            {/* Fecha y hora */}
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

            {/* Ubicación */}
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
                              currentValues.filter((val) => val !== valueNumber)
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
                          {(parks?.data || parks || []).map((park: any) => (
                            <SelectItem key={park.id} value={park.id.toString()}>
                              {park.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Parques seleccionados:{" "}
                        {field.value?.length
                          ? (parks?.data || parks || [])
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

            {/* Participantes */}
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">
                <Users className="w-5 h-5 inline-block mr-2" />
                Participantes
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
                          {registrationTypes.map((type) => (
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
              </div>
            </div>

            {/* Imagen del evento */}
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">
                📷 Imagen del evento
              </h3>
              <EventImageUploader
                onImageUpload={(imageUrl) => form.setValue('imageUrl', imageUrl)}
                currentImage={form.watch('imageUrl') || undefined}
                onRemoveImage={() => form.setValue('imageUrl', null)}
              />
            </div>

            {/* Información de Contacto */}
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">
                📞 Información de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="organizer_name"
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
                  name="organizer_organization"
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
                  name="contact_email"
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
                  name="contact_phone"
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Adicionales</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Información adicional sobre el evento..."
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

export default NewEventPageFixed;