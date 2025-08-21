import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
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
});

// Tipos
type EventFormValues = z.infer<typeof eventFormSchema>;

const NewEventPageFixed: React.FC = () => {
  const [, navigate] = useLocation();

  // Consultar parques
  const { data: parks, isLoading: parksLoading } = useQuery({
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

            {/* Información de Contacto */}
            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
              <h3 className="text-lg font-medium mb-4 text-green-800">
                📞 Información de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="organizer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-800 font-semibold">Nombre del Contacto</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Nombre completo del responsable"
                          {...field}
                          value={field.value || ""}
                          className="bg-white border-2 border-green-300"
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
                      <FormLabel className="text-green-800 font-semibold">Empresa / Organización</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Nombre de la empresa u organización"
                          {...field}
                          value={field.value || ""}
                          className="bg-white border-2 border-green-300"
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
                      <FormLabel className="text-green-800 font-semibold">Email de Contacto</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="evento@ejemplo.com"
                          {...field}
                          value={field.value || ""}
                          className="bg-white border-2 border-green-300"
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
                      <FormLabel className="text-green-800 font-semibold">Teléfono de Contacto</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(33) 1234-5678"
                          {...field}
                          value={field.value || ""}
                          className="bg-white border-2 border-green-300"
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
                      <FormLabel className="text-green-800 font-semibold">Notas Adicionales</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Información adicional sobre el evento..."
                          className="min-h-[100px] bg-white border-2 border-green-300"
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