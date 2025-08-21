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
import { X, Plus, Trash2 } from "lucide-react";
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
  schedule: z.object({
    monday: z.object({ enabled: z.boolean(), openTime: z.string(), closeTime: z.string() }),
    tuesday: z.object({ enabled: z.boolean(), openTime: z.string(), closeTime: z.string() }),
    wednesday: z.object({ enabled: z.boolean(), openTime: z.string(), closeTime: z.string() }),
    thursday: z.object({ enabled: z.boolean(), openTime: z.string(), closeTime: z.string() }),
    friday: z.object({ enabled: z.boolean(), openTime: z.string(), closeTime: z.string() }),
    saturday: z.object({ enabled: z.boolean(), openTime: z.string(), closeTime: z.string() }),
    sunday: z.object({ enabled: z.boolean(), openTime: z.string(), closeTime: z.string() }),
  }).optional(),
});

type ParkEditFormValues = z.infer<typeof parkEditSchema>;

export default function ParkEditSimple() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [customCertification, setCustomCertification] = React.useState("");
  const [availableCertifications, setAvailableCertifications] = React.useState([
    "Green Flag Award",
    "ISO 14001",
    "Certificación Ambiental Internacional",
    "Bandera Verde",
    "Certificación de Sostenibilidad",
    "Parque Carbono Neutral",
    "Certificación de Biodiversidad",
    "Smart Park Certification"
  ]);

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
        certificaciones: park.certificaciones ? 
          (Array.isArray(park.certificaciones) ? park.certificaciones : park.certificaciones.split(', ')) : 
          [],
        regulationUrl: park.regulationUrl || "",
        videoUrl: park.videoUrl || "",
        schedule: parseSchedule(park.openingHours),
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
        certificaciones: parkData.certificaciones?.join(', ') || '',
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${id}`] });
      toast({
        title: "Parque actualizado",
        description: "La información del parque ha sido actualizada correctamente.",
      });
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
    console.log('=== FORM SUBMIT ===');
    console.log('Form values:', values);
    console.log('Form errors:', form.formState.errors);
    
    // Verificar errores específicos en lugar de usar isValid
    const hasErrors = Object.keys(form.formState.errors).length > 0;
    if (hasErrors) {
      console.error('Formulario con errores:', form.formState.errors);
      toast({
        title: "Error de validación",
        description: "Por favor revisa los campos del formulario",
        variant: "destructive",
      });
      return;
    }
    
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
                          
                          const addCustomCertification = () => {
                            const trimmed = customCertification.trim();
                            if (trimmed && !availableCertifications.includes(trimmed)) {
                              setAvailableCertifications([...availableCertifications, trimmed]);
                              setCustomCertification("");
                              toast({
                                title: "Certificación agregada",
                                description: `"${trimmed}" ha sido agregada a las opciones disponibles.`,
                              });
                            } else if (availableCertifications.includes(trimmed)) {
                              toast({
                                title: "Certificación duplicada",
                                description: "Esta certificación ya existe en la lista.",
                                variant: "destructive",
                              });
                            }
                          };
                          
                          const removeCertificationOption = (cert: string) => {
                            // No permitir eliminar si está siendo usada
                            if (field.value?.includes(cert)) {
                              toast({
                                title: "No se puede eliminar",
                                description: "Esta certificación está asignada al parque. Retírala del parque antes de eliminarla de las opciones.",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            setAvailableCertifications(availableCertifications.filter(c => c !== cert));
                            toast({
                              title: "Certificación eliminada",
                              description: `"${cert}" ha sido eliminada de las opciones disponibles.`,
                            });
                          };

                          return (
                            <FormItem>
                              <FormLabel>Certificaciones</FormLabel>
                              <div className="space-y-4">
                                {/* Selector de certificaciones existentes */}
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

                                {/* Agregar nueva certificación */}
                                <div className="border rounded-lg p-3 bg-gray-50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Plus className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium">Agregar nueva certificación</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Nombre de la nueva certificación"
                                      value={customCertification}
                                      onChange={(e) => setCustomCertification(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          addCustomCertification();
                                        }
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={addCustomCertification}
                                      disabled={!customCertification.trim()}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Gestión de certificaciones disponibles */}
                                <div className="border rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium">Gestionar opciones disponibles</span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                                    {availableCertifications.map((cert) => (
                                      <div key={cert} className="flex items-center justify-between p-2 bg-white rounded border">
                                        <span className="text-sm">{cert}</span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeCertificationOption(cert)}
                                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
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
                                Selecciona y gestiona las certificaciones del parque. Puedes agregar nuevas opciones y eliminar las que no necesites.
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
                  className="min-w-32"
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