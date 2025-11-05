import { useState } from "react";
import { useLocation } from "wouter";
import ROUTES from "@/routes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock, Users, MapPin, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";
import { ReturnHeader } from "@/components/ui/return-header";
import { useArrayQuery } from "@/hooks/useArrayQuery";
import { apiRequest } from "@/lib/queryClient";

// Schema de validación
const volunteerActivitySchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  parkId: z.number({
    required_error: "Debe seleccionar un parque",
    invalid_type_error: "Debe seleccionar un parque válido",
  }),
  activityDate: z.date({
    required_error: "La fecha es obligatoria",
  }),
  activityTime: z.string().min(1, "La hora es obligatoria"),
  scheduledHours: z.number()
    .min(0.5, "Debe ser al menos 0.5 horas")
    .max(24, "No puede exceder 24 horas")
    .optional(),
  maxVolunteers: z.number()
    .min(1, "Debe permitir al menos 1 voluntario")
    .max(100, "El máximo es 100 voluntarios")
    .optional(),
  supervisorId: z.number().optional(),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).default("planned"),
  category: z.enum([
    "maintenance",
    "events",
    "education",
    "sports",
    "cultural",
    "nature",
    "other"
  ]).optional(),
  requirements: z.string().optional(),
});

type VolunteerActivityFormData = z.infer<typeof volunteerActivitySchema>;

export default function NewVolunteerActivity() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>();

  const form = useForm<VolunteerActivityFormData>({
    resolver: zodResolver(volunteerActivitySchema),
    defaultValues: {
      status: "planned",
      maxVolunteers: 10,
      scheduledHours: 4,
    },
  });

  // Obtener lista de parques - la API retorna { data: [...] }
  const { data: parks = [], isLoading: isLoadingParks } = useArrayQuery(
    "/api/parks",
    "data" // El array está en la propiedad "data"
  );

  // Obtener lista de usuarios - la API puede retornar 304 o diferentes estructuras
  const { data: users = [], isLoading: isLoadingUsers } = useArrayQuery(
    "/api/users",
    "data" // Intentará buscar en "data" primero, luego en otras propiedades comunes
  );

  // Mutación para crear actividad
  const createActivity = useMutation({
    mutationFn: async (data: VolunteerActivityFormData) => {
      // Combinar fecha y hora
      const [hours, minutes] = data.activityTime.split(':');
      const activityDateTime = new Date(data.activityDate);
      activityDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const payload = {
        ...data,
        activityDate: activityDateTime.toISOString(),
      };

      // Usar apiRequest del queryClient existente
      return await apiRequest("/api/volunteer-activities", {
        method: "POST",
        data: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/volunteer-activities"] });
      toast({
        title: "✅ Actividad creada",
        description: "La actividad de voluntariado se ha creado exitosamente.",
      });
      setLocation(ROUTES.admin.volunteers.activities.list);
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VolunteerActivityFormData) => {
    createActivity.mutate(data);
  };

  const categoryOptions = [
    { value: "maintenance", label: "Mantenimiento" },
    { value: "events", label: "Eventos" },
    { value: "education", label: "Educación" },
    { value: "sports", label: "Deportes" },
    { value: "cultural", label: "Cultural" },
    { value: "nature", label: "Naturaleza" },
    { value: "other", label: "Otro" },
  ];

  return (
    <AdminLayout>
      <div className="mx-auto">
        {/* Header con navegación */}
        <ReturnHeader />

        {/* Título */}
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Nueva Actividad de Voluntariado
          </h1>
          <p className="text-gray-600 mt-2">
            Crea una nueva actividad a la que los voluntarios podrán inscribirse
          </p>
        </div>

        {/* Alerta informativa */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Una vez creada la actividad, los voluntarios podrán inscribirse y verás la lista de 
            participantes en el detalle de la actividad.
          </AlertDescription>
        </Alert>

        {/* Formulario */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información Básica
              </CardTitle>
              <CardDescription>
                Datos principales de la actividad de voluntariado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Actividad *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Limpieza de áreas verdes del Parque Central"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Describe en qué consiste la actividad, qué harán los voluntarios, materiales necesarios, etc."
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(value) =>
                    form.setValue("category", value as any)
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ubicación y Fecha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Ubicación y Horario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Parque */}
              <div className="space-y-2">
                <Label htmlFor="parkId">Parque *</Label>
                <Select
                  value={form.watch("parkId")?.toString()}
                  onValueChange={(value) =>
                    form.setValue("parkId", parseInt(value), { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="parkId">
                    <SelectValue placeholder="Seleccionar parque" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingParks ? (
                      <SelectItem value="loading" disabled>
                        Cargando parques...
                      </SelectItem>
                    ) : (
                      parks.map((park: any) => (
                        <SelectItem key={park.id} value={park.id.toString()}>
                          {park.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.parkId && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.parkId.message}
                  </p>
                )}
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-4">
                {/* Fecha */}
                <div className="space-y-2">
                  <Label>Fecha de la Actividad *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("activityDate") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("activityDate") ? (
                          format(form.watch("activityDate"), "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch("activityDate")}
                        onSelect={(date) => {
                          if (date) {
                            form.setValue("activityDate", date, { shouldValidate: true });
                            setSelectedDate(date);
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.activityDate && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.activityDate.message}
                    </p>
                  )}
                </div>

                {/* Hora */}
                <div className="space-y-2">
                  <Label htmlFor="activityTime">Hora de Inicio *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="activityTime"
                      type="time"
                      className="pl-10"
                      {...form.register("activityTime")}
                    />
                  </div>
                  {form.formState.errors.activityTime && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.activityTime.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gestión de Voluntarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Voluntarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Horas Programadas */}
              <div className="space-y-2">
                <Label htmlFor="scheduledHours">Horas Estimadas</Label>
                <Input
                  id="scheduledHours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  placeholder="4.0"
                  {...form.register("scheduledHours", { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500">
                  Duración aproximada de la actividad en horas
                </p>
                {form.formState.errors.scheduledHours && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.scheduledHours.message}
                  </p>
                )}
              </div>

              {/* Cupo Máximo */}
              <div className="space-y-2">
                <Label htmlFor="maxVolunteers">Cupo Máximo de Voluntarios</Label>
                <Input
                  id="maxVolunteers"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="10"
                  {...form.register("maxVolunteers", { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500">
                    Número máximo de voluntarios que pueden inscribirse
                </p>
                {form.formState.errors.maxVolunteers && (
                    <p className="text-sm text-red-500">
                    {form.formState.errors.maxVolunteers.message}
                  </p>
                )}
              </div>
  
              {/* Supervisor */}
              <div className="space-y-2">
                <Label htmlFor="supervisorId">Supervisor Asignado</Label>
                <Select
                  value={form.watch("supervisorId")?.toString()}
                    onValueChange={(value) =>
                    form.setValue("supervisorId", parseInt(value))
                  }
                >
                  <SelectTrigger id="supervisorId">
                    <SelectValue placeholder="Sin supervisor asignado" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingUsers ? (
                      <SelectItem value="loading" disabled>
                        Cargando usuarios...
                      </SelectItem>
                    ) : (
                      users
                        .filter((user: any) => user.role === "admin" || user.role === "supervisor")
                        .map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.fullName || user.full_name || user.username}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Requisitos */}
              <div className="space-y-2">
                <Label htmlFor="requirements">Requisitos Especiales</Label>
                <Textarea
                  id="requirements"
                  rows={3}
                  placeholder="Ej: Traer guantes, ropa cómoda, protector solar. Mayor de 16 años."
                  {...form.register("requirements")}
                />
                <p className="text-xs text-gray-500">
                  Indicaciones especiales para los voluntarios interesados
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(ROUTES.admin.volunteers.activities.list)}
              disabled={createActivity.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createActivity.isPending}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              {createActivity.isPending ? "Creando..." : "Crear Actividad"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}