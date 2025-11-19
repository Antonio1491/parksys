import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SpaceMediaManager } from "@/components/SpaceMediaManager";
import { ArrowLeft, MapPin, Users, Clock, DollarSign, Camera, FileImage } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const newSpaceSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().min(1, "La descripción es obligatoria"),
  parkId: z.string().min(1, "Debe seleccionar un parque"),
  spaceType: z.string().min(1, "Debe seleccionar un tipo de espacio"),
  capacity: z.number().min(1, "La capacidad debe ser mayor a 0"),
  hourlyRate: z.number().min(0, "La tarifa debe ser mayor o igual a 0"),
  minimumHours: z.number().min(1, "Las horas mínimas deben ser mayor a 0"),
  maximumHours: z.number().min(1, "Las horas máximas deben ser mayor a 0"),
  amenities: z.string().optional(),
  rules: z.string().optional(),
  isActive: z.boolean(),
  requiresApproval: z.boolean(),
  advanceBookingDays: z.number().min(1, "Los días de anticipación deben ser mayor a 0"),
});

type NewSpaceFormData = z.infer<typeof newSpaceSchema>;

interface Park {
  id: number;
  name: string;
}

export default function NewSpacePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createdSpaceId, setCreatedSpaceId] = useState<number | null>(null);

  const form = useForm<NewSpaceFormData>({
    resolver: zodResolver(newSpaceSchema),
    defaultValues: {
      name: "",
      description: "",
      parkId: "",
      spaceType: "",
      capacity: 1,
      hourlyRate: 0,
      minimumHours: 1,
      maximumHours: 8,
      amenities: "",
      rules: "",
      isActive: true,
      requiresApproval: false,
      advanceBookingDays: 30,
    },
  });

  // Obtener lista de parques
  const { data: parksData = [], isLoading: parksLoading } = useQuery<Park[]>({
    queryKey: ["/api/parks-with-amenities"],
  });

  // Asegurar que parks es siempre un array
  const parks = Array.isArray(parksData) ? parksData : [];

  const createSpaceMutation = useMutation({
    mutationFn: async (data: NewSpaceFormData) => {
      return await apiRequest("/api/reservable-spaces", {
        method: "POST",
        data: {
          ...data,
          parkId: parseInt(data.parkId),
        }
      });
    },
    onSuccess: (data) => {
      if (data?.space?.id) {
        setCreatedSpaceId(data.space.id);
        toast({
          title: "Espacio creado exitosamente",
          description: "Ahora puedes agregar imágenes y documentos en la sección de multimedia que aparece a continuación.",
        });
        // Scroll hacia la sección de multimedia
        setTimeout(() => {
          document.querySelector('[data-section="multimedia"]')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      } else {
        toast({
          title: "Espacio creado",
          description: "El espacio reservable ha sido creado exitosamente.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/reservable-spaces"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el espacio",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NewSpaceFormData) => {
    // Validar que las horas máximas sean mayores que las mínimas
    if (data.maximumHours <= data.minimumHours) {
      toast({
        title: "Error de validación",
        description: "Las horas máximas deben ser mayores que las horas mínimas",
        variant: "destructive",
      });
      return;
    }

    createSpaceMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin/space-reservations/spaces")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Espacio Reservable</h1>
          <p className="text-gray-600">Crea un nuevo espacio que los ciudadanos pueden reservar para eventos</p>
          {!createdSpaceId && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Nota:</strong> Después de crear el espacio básico, podrás agregar imágenes y documentos en la sección de multimedia.
              </p>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Información del Espacio
            </CardTitle>
            <CardDescription>
              Define las características y reglas del nuevo espacio reservable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Información Básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Espacio</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Kiosco Principal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parkId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parque</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar parque" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {parksLoading ? (
                              <SelectItem value="loading" disabled>Cargando parques...</SelectItem>
                            ) : parks.length > 0 ? (
                              parks.map((park) => (
                                <SelectItem key={park.id} value={park.id.toString()}>
                                  {park.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-parks" disabled>No hay parques disponibles</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="spaceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Espacio</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo de espacio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kiosco">Kiosco</SelectItem>
                            <SelectItem value="area_juegos">Área de Juegos</SelectItem>
                            <SelectItem value="picnic">Área de Picnic</SelectItem>
                            <SelectItem value="jardin_eventos">Jardín de Eventos</SelectItem>
                            <SelectItem value="pabellon">Pabellón</SelectItem>
                            <SelectItem value="cancha_deportiva">Cancha Deportiva</SelectItem>
                            <SelectItem value="anfiteatro">Anfiteatro</SelectItem>
                            <SelectItem value="salon_usos_multiples">Salón de Usos Múltiples</SelectItem>
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
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe las características del espacio..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Capacidad y Tarifas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Capacidad Máxima
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="50" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Tarifa por Hora (MXN)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="250.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minimumHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Horas Mínimas de Reserva
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="2" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maximumHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Horas Máximas de Reserva
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="8" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="advanceBookingDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Días de Anticipación para Reserva</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="30" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Amenidades */}
                <FormField
                  control={form.control}
                  name="amenities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amenidades Incluidas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ej: Electricidad, agua potable, mesas, sillas, estacionamiento..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reglas */}
                <FormField
                  control={form.control}
                  name="rules"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reglas y Restricciones</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ej: Prohibido el consumo de alcohol, música hasta las 20:00 hrs..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Configuraciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Espacio Activo</FormLabel>
                          <div className="text-sm text-gray-600">
                            El espacio estará disponible para reservas públicas
                          </div>
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

                  <FormField
                    control={form.control}
                    name="requiresApproval"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Requiere Aprobación</FormLabel>
                          <div className="text-sm text-gray-600">
                            Las reservas deben ser aprobadas manualmente
                          </div>
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
                </div>

                {/* Botones de Acción */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/admin/space-reservations/spaces")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createSpaceMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createSpaceMutation.isPending ? "Creando..." : "Crear Espacio"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Gestión de Multimedia */}
        <Card data-section="multimedia">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Multimedia del Espacio
            </CardTitle>
            <CardDescription>
              {createdSpaceId 
                ? "Agrega imágenes y documentos al espacio reservable"
                : "Una vez creado el espacio, podrás agregar imágenes y documentos aquí"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {createdSpaceId ? (
              <>
                <SpaceMediaManager spaceId={createdSpaceId} isEditMode={true} />
                
                {/* Botones de navegación después de agregar multimedia */}
                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/admin/space-reservations/spaces")}
                  >
                    Finalizar y Volver a la Lista
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setLocation(`/admin/space-reservations/spaces/edit/${createdSpaceId}`)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continuar Editando
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Multimedia no disponible aún</h3>
                <p className="text-gray-600 mb-4">
                  Primero debes crear el espacio reservable para poder agregar imágenes y documentos.
                </p>
                <p className="text-sm text-gray-500">
                  Completa el formulario de arriba y haz clic en "Crear Espacio" para habilitar esta sección.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}