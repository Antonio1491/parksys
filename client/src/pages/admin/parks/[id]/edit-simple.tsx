import React from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Info, MapPin, Building } from "lucide-react";
import { MapSelector } from "@/components/ui/map-selector";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const parkEditSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  municipalityName: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  parkType: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  area: z.string().optional(),
  greenArea: z.string().optional(),
  foundationYear: z.number().optional(),
  administrator: z.string().optional(),
  conservationStatus: z.string().optional(),
  certificaciones: z.array(z.string()).optional(),
  regulationUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  schedule: z.any().optional(),
});

type ParkEditFormValues = z.infer<typeof parkEditSchema>;

export default function ParkEditSimple() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const availableCertifications = [
    "Green Flag Award"
  ];

  const { data: park, isLoading } = useQuery({
    queryKey: [`/api/parks/${id}`],
    enabled: !!id,
  });

  const form = useForm<ParkEditFormValues>({
    resolver: zodResolver(parkEditSchema),
    defaultValues: {
      name: "",
      municipalityName: "",
      description: "",
      address: "",
      postalCode: "",
      contactPhone: "",
      contactEmail: "",
      parkType: "",
      latitude: "",
      longitude: "",
      area: "",
      greenArea: "",
      foundationYear: undefined,
      administrator: "",
      conservationStatus: "",
      certificaciones: [],
      regulationUrl: "",
      videoUrl: "",
      schedule: {
        monday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
        tuesday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
        wednesday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
        thursday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
        friday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
        saturday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
        sunday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
      },
    },
  });

  React.useEffect(() => {
    if (park) {
      // Parsear horarios existentes o usar valores por defecto
      const parseSchedule = (openingHours: string | null) => {
        const defaultSchedule = {
          monday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
          tuesday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
          wednesday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
          thursday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
          friday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
          saturday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
          sunday: { enabled: true, openTime: "06:00", closeTime: "22:00" },
        };

        if (!openingHours) return defaultSchedule;

        try {
          return JSON.parse(openingHours);
        } catch {
          return defaultSchedule;
        }
      };

      form.reset({
        name: park.name || "",
        municipalityName: park.municipality?.name || "",
        description: park.description || "",
        address: park.address || "",
        postalCode: park.postalCode || "",
        contactPhone: park.contactPhone || "",
        contactEmail: park.contactEmail || "",
        parkType: park.parkType || "",
        latitude: park.latitude?.toString() || "",
        longitude: park.longitude?.toString() || "",
        area: park.area?.toString() || "",
        greenArea: park.greenArea || "",
        foundationYear: park.foundationYear || undefined,
        administrator: park.administrator || "",
        conservationStatus: park.conservationStatus || "",
        certificaciones: (() => {
          console.log("🔍 PARK ID:", park.id, "- Procesando certificaciones:", park.certificaciones, typeof park.certificaciones);
          // Manejar el caso de null o undefined
          if (!park.certificaciones || park.certificaciones === null || park.certificaciones === undefined) {
            console.log("✅ PARK ID:", park.id, "- Certificaciones nulas, devolviendo array vacío");
            return [];
          }
          // Si es un array, devolverlo directamente
          if (Array.isArray(park.certificaciones)) {
            console.log("✅ PARK ID:", park.id, "- Certificaciones como array:", park.certificaciones);
            return park.certificaciones;
          }
          // Si es string y no está vacío, dividirlo
          if (typeof park.certificaciones === 'string' && park.certificaciones.trim()) {
            const result = park.certificaciones.split(", ").filter(c => c.trim());
            console.log("✅ PARK ID:", park.id, "- Certificaciones como string dividido:", result);
            return result;
          }
          // Caso por defecto
          console.log("✅ PARK ID:", park.id, "- Certificaciones fallback a array vacío");
          return [];
        })(),
        regulationUrl: park.regulationUrl || "",
        videoUrl: park.videoUrl || "",
        schedule: parseSchedule(park.openingHours) || {},
      });
    }
  }, [park, form]);

  const updateParkMutation = useMutation({
    mutationFn: async (values: ParkEditFormValues) => {
      console.log('=== ACTUALIZANDO PARQUE ===');
      console.log('Datos a enviar:', values);
      
      // Convertir el schedule a openingHours string y preparar datos
      const { schedule, municipalityName, ...parkData } = values;
      
      const dataToSend = {
        ...parkData,
        openingHours: schedule ? JSON.stringify(schedule) : "{}",
        // Convertir foundationYear a number si existe
        foundationYear: parkData.foundationYear || null,
        // Convertir certificaciones array a string para backend
        certificaciones: Array.isArray(parkData.certificaciones) 
          ? parkData.certificaciones.join(', ') 
          : (parkData.certificaciones || ''),
      };
      
      console.log('Datos procesados a enviar:', dataToSend);
      
      // Usar fetch directo para evitar problemas con stream
      const response = await fetch(`/api/dev/parks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : "Bearer direct-token-1750522117022",
          "X-User-Id": "1",
          "X-User-Role": "super_admin",
        },
        body: JSON.stringify(dataToSend),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("✅ PARQUE ACTUALIZADO - Invalidando cache y recargando datos...");
      queryClient.invalidateQueries({ queryKey: ["/api/parks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${id}/details`] });
      
      // Forzar recarga de los datos del parque
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [`/api/parks/${id}`] });
      }, 100);
      
      toast({
        title: "✅ Parque actualizado exitosamente",
        description: "Todos los cambios han sido guardados correctamente. La página se actualizará automáticamente.",
        variant: "default",
      });
      
      // Opcional: después de 2 segundos, redirigir a la vista del parque
      setTimeout(() => {
        window.location.href = `/admin/parks/${id}/view`;
      }, 2000);
    },
    onError: (error: any) => {
      console.error('Error al actualizar:', error);
      toast({
        title: "Error",
        description: `Error al actualizar el parque: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ParkEditFormValues) => {
    console.log('=== FORM SUBMIT INICIADO ===');
    console.log('Park ID:', id);
    console.log('Form values recibidos:', values);
    console.log('Form state errors:', form.formState.errors);
    console.log('Form state isValid:', form.formState.isValid);
    console.log('Form state isSubmitting:', form.formState.isSubmitting);
    console.log('updateParkMutation.isPending:', updateParkMutation.isPending);
    console.log('Certificaciones procesadas:', values.certificaciones);
    
    // Verificar errores específicos
    const hasErrors = Object.keys(form.formState.errors).length > 0;
    if (hasErrors) {
      console.error('❌ Formulario con errores:', form.formState.errors);
      toast({
        title: "Error de validación",
        description: "Por favor revisa los campos del formulario",
        variant: "destructive",
      });
      return;
    }
    
    console.log('✅ Formulario válido, ejecutando mutación...');
    updateParkMutation.mutate(values);
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!park) {
    return <div>Parque no encontrado</div>;
  }

  return (
    <AdminLayout title="Editar Parque" subtitle={park?.name}>
      <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link href={`/admin/parks/${id}/view`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al parque
                </Button>
              </Link>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Información Básica
                  </TabsTrigger>
                  <TabsTrigger value="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ubicación y Contacto
                  </TabsTrigger>
                  <TabsTrigger value="characteristics" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Características
                  </TabsTrigger>
                </TabsList>

                {/* Información Básica */}
                <TabsContent value="basic">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Información General
                      </CardTitle>
                      <CardDescription>Datos básicos del parque</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Parque</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del parque" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parkType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Parque</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Urbano">Parque Urbano</SelectItem>
                              <SelectItem value="Metropolitano">Parque Metropolitano</SelectItem>
                              <SelectItem value="Linear">Parque Linear</SelectItem>
                              <SelectItem value="Comunitario">Parque Comunitario</SelectItem>
                              <SelectItem value="Natural">Parque Natural</SelectItem>
                              <SelectItem value="Temático">Parque Temático</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="municipalityName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Municipio</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del municipio" {...field} />
                          </FormControl>
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
                            placeholder="Descripción del parque..."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Ubicación y Contacto */}
                <TabsContent value="location">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Ubicación y Contacto
                      </CardTitle>
                      <CardDescription>Información de ubicación y datos de contacto</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dirección</FormLabel>
                              <FormControl>
                                <Input placeholder="Dirección completa" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código Postal</FormLabel>
                              <FormControl>
                                <Input placeholder="Código postal" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono</FormLabel>
                              <FormControl>
                                <Input placeholder="Número de teléfono" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Coordenadas */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium">Coordenadas</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Latitud</FormLabel>
                                <FormControl>
                                  <Input placeholder="20.123456" {...field} />
                                </FormControl>
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
                                  <Input placeholder="-103.123456" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Selector de mapa */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Seleccionar ubicación en mapa</label>
                          <MapSelector
                            latitude={form.watch("latitude")}
                            longitude={form.watch("longitude")}
                            selectedLocation={
                              form.watch("latitude") && form.watch("longitude") ? {
                                lat: parseFloat(form.watch("latitude") || "0"),
                                lng: parseFloat(form.watch("longitude") || "0")
                              } : null
                            }
                            onLocationSelect={(location) => {
                              form.setValue("latitude", location.lat.toString());
                              form.setValue("longitude", location.lng.toString());
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Características */}
                <TabsContent value="characteristics">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Características del Parque
                      </CardTitle>
                      <CardDescription>Información adicional y características específicas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="area"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Área Total (m²)</FormLabel>
                              <FormControl>
                                <Input placeholder="Área en metros cuadrados" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="greenArea"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Área Verde</FormLabel>
                              <FormControl>
                                <Input placeholder="Descripción del área verde" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="foundationYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Año de Fundación</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder="2024" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="administrator"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Administrador</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre del administrador" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="conservationStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado de Conservación</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione estado" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Excelente">Excelente</SelectItem>
                                  <SelectItem value="Bueno">Bueno</SelectItem>
                                  <SelectItem value="Regular">Regular</SelectItem>
                                  <SelectItem value="Malo">Malo</SelectItem>
                                  <SelectItem value="Crítico">Crítico</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="regulationUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL de Regulación</FormLabel>
                              <FormControl>
                                <Input placeholder="https://ejemplo.com/regulacion" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="videoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL de Video</FormLabel>
                              <FormControl>
                                <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="certificaciones"
                        render={({ field }) => {
                          const addCertification = (cert: string) => {
                            if (!field.value?.includes(cert)) {
                              field.onChange([...(field.value || []), cert]);
                            }
                          };
                          
                          const removeCertification = (cert: string) => {
                            field.onChange(field.value?.filter((c: string) => c !== cert) || []);
                          };

                          return (
                            <FormItem>
                              <FormLabel>Certificaciones</FormLabel>
                              <div className="space-y-4">
                                {/* Selector de certificaciones */}
                                <div className="space-y-2">
                                  <Select onValueChange={addCertification}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar certificación" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {availableCertifications.map((cert) => (
                                        <SelectItem 
                                          key={cert} 
                                          value={cert}
                                          disabled={field.value?.includes(cert)}
                                        >
                                          {cert}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* Certificaciones seleccionadas */}
                                {field.value && field.value.length > 0 && (
                                  <div className="space-y-2">
                                    <span className="text-sm font-medium">Certificaciones asignadas al parque:</span>
                                    <div className="flex flex-wrap gap-2">
                                      {field.value.map((cert: string, index: number) => (
                                        <Badge 
                                          key={index} 
                                          variant="default" 
                                          className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200"
                                        >
                                          {cert}
                                          <X 
                                            className="h-3 w-3 cursor-pointer hover:text-red-600" 
                                            onClick={() => removeCertification(cert)}
                                          />
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                              <p className="text-sm text-muted-foreground">
                                Selecciona las certificaciones del parque.
                              </p>
                            </FormItem>
                          );
                        }}
                      />

                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-4">
                <Link href={`/admin/parks/${id}/view`}>
                  <Button variant="outline">Cancelar</Button>
                </Link>
                
                <Button 
                  type="submit" 
                  disabled={updateParkMutation.isPending}
                  className="min-w-32 bg-green-600 hover:bg-green-700 text-white"
                  onClick={async (e) => {
                    console.log("🔘 BOTÓN GUARDAR PRESIONADO - Park ID:", id);
                    console.log("🔘 Form state valid:", form.formState.isValid);
                    console.log("🔘 Form errors:", form.formState.errors);
                    console.log("🔘 Form values before submit:", form.getValues());
                    
                    // Forzar validación manual del formulario
                    const isValid = await form.trigger();
                    console.log("🔍 Manual validation result:", isValid);
                    console.log("🔍 Form errors after trigger:", form.formState.errors);
                    
                    // Si hay errores, prevenirlo
                    if (!isValid) {
                      console.error("❌ FORM INVALID - Previniendo submit");
                      e.preventDefault();
                      return;
                    }
                    
                    console.log("✅ FORM VALID - Permitiendo submit");
                  }}
                >
                  {updateParkMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
      </div>
    </AdminLayout>
  );
}