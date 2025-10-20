import React, { useState } from 'react';
import { useLocation } from 'wouter';
import ROUTES from '@/routes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Helmet } from 'react-helmet';
import AdminLayout from '@/components/AdminLayout';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MapPin, Ruler, ArrowLeft, Sprout, TreeDeciduous } from 'lucide-react';

// Esquema de validación para el formulario
const treeSchema = z.object({
  code: z.string().optional(), // Código opcional - se genera automáticamente
  speciesId: z.string().min(1, { message: 'Debe seleccionar una especie' }),
  parkId: z.string().min(1, { message: 'Debe seleccionar un parque' }),
  latitude: z.string().min(1, { message: 'La latitud es obligatoria' }),
  longitude: z.string().min(1, { message: 'La longitud es obligatoria' }),
  plantingDate: z.date().nullable(),
  developmentStage: z.string().nullable(),
  ageEstimate: z.coerce.number().int().nullable(),
  height: z.coerce.number().positive().nullable(),
  diameter: z.coerce.number().positive().nullable(),
  canopyCoverage: z.coerce.number().positive().nullable(),
  healthStatus: z.string(),
  physicalCondition: z.string().nullable(),
  hasHollows: z.boolean().default(false),
  hasExposedRoots: z.boolean().default(false),
  hasPests: z.boolean().default(false),
  observations: z.string().nullable(),
  lastInspectionDate: z.date().nullable(),
  isProtected: z.boolean().default(false),
  locationDescription: z.string().nullable(),
  imageUrl: z.string().nullable(),
});

// Tipos para TypeScript
type TreeFormValues = z.infer<typeof treeSchema>;

// Componente principal
function NewTreePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('location');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  // Formulario con React Hook Form y validación Zod
  const form = useForm<TreeFormValues>({
    resolver: zodResolver(treeSchema),
    defaultValues: {
      code: '',
      speciesId: '',
      parkId: '',
      latitude: '',
      longitude: '',
      plantingDate: null,
      developmentStage: 'Juvenil',
      ageEstimate: null,
      height: null,
      diameter: null,
      canopyCoverage: null,
      healthStatus: 'Bueno',
      physicalCondition: '',
      hasHollows: false,
      hasExposedRoots: false,
      hasPests: false,
      observations: '',
      lastInspectionDate: null,
      isProtected: false,
      locationDescription: '',
      imageUrl: '',
    },
  });

  // Cargar lista de especies
  const { data: species, isLoading: isLoadingSpecies } = useQuery({
    queryKey: ['/api/tree-species'],
    queryFn: async () => {
      const response = await fetch('/api/tree-species');
      if (!response.ok) {
        throw new Error('Error al cargar las especies arbóreas');
      }
      return response.json();
    },
  });

  // Cargar lista de parques
  const { data: parks, isLoading: isLoadingParks } = useQuery({
    queryKey: ['/api/parks'],
    queryFn: async () => {
      const response = await fetch('/api/parks');
      if (!response.ok) {
        throw new Error('Error al cargar los parques');
      }
      return response.json();
    },
  });

  // Manejar el envío del formulario
  const onSubmit = async (data: TreeFormValues) => {
    try {
      // Convertir IDs a números para la API
      const formattedData = {
        ...data,
        speciesId: parseInt(data.speciesId),
        parkId: parseInt(data.parkId),
      };

      // Remover el campo code si está vacío para que el backend genere automáticamente
      if (!formattedData.code || formattedData.code.trim() === '') {
        delete formattedData.code;
      }

      await apiRequest('/api/trees', {
        method: 'POST',
        data: formattedData,
      });

      toast({
        title: 'Árbol registrado',
        description: 'El árbol ha sido agregado correctamente al inventario.',
      });

      // Invalidar la caché para forzar una recarga de los datos
      queryClient.invalidateQueries({ queryKey: ['/api/trees'] });
      
      // Redirigir al listado
      navigate(ROUTES.admin.trees.list);
    } catch (error) {
      console.error('Error al crear el árbol:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar el árbol. Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Manejar la obtención de la ubicación actual
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setUseCurrentLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude.toString());
          form.setValue('longitude', position.coords.longitude.toString());
          setUseCurrentLocation(false);
          toast({
            title: 'Ubicación obtenida',
            description: 'Las coordenadas de tu ubicación actual han sido capturadas.',
          });
        },
        (error) => {
          console.error('Error al obtener la ubicación:', error);
          setUseCurrentLocation(false);
          toast({
            title: 'Error de geolocalización',
            description: 'No se pudo obtener tu ubicación actual. Por favor, ingresa las coordenadas manualmente.',
            variant: 'destructive',
          });
        }
      );
    } else {
      toast({
        title: 'Geolocalización no soportada',
        description: 'Tu navegador no soporta la geolocalización. Por favor, ingresa las coordenadas manualmente.',
        variant: 'destructive',
      });
    }
  };

  // Opciones para el estado de desarrollo
  const developmentStageOptions = [
    { value: 'Juvenil', label: 'Juvenil' },
    { value: 'Maduro', label: 'Maduro' },
    { value: 'Senescente', label: 'Senescente' },
  ];

  // Opciones para el estado de salud
  const healthStatusOptions = [
    { value: 'Bueno', label: 'Bueno' },
    { value: 'Regular', label: 'Regular' },
    { value: 'Malo', label: 'Malo' },
    { value: 'Crítico', label: 'Crítico' },
  ];

  return (
    <AdminLayout>
      <Helmet>
        <title>Agregar Árbol | Inventario Arbóreo | ParquesMX</title>
        <meta name="description" content="Agregar un nuevo árbol al inventario de parques municipales" />
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(ROUTES.admin.trees.list)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-green-800 flex items-center">
              <TreeDeciduous className="mr-2 h-8 w-8" />
              Agregar Árbol al Inventario
            </h1>
            <p className="text-gray-600 mt-1">
              Registra un nuevo árbol en el sistema con todos sus detalles
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="location" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="location">Ubicación</TabsTrigger>
                <TabsTrigger value="characteristics">Características</TabsTrigger>
                <TabsTrigger value="health">Estado y Observaciones</TabsTrigger>
              </TabsList>

              {/* Tab: Ubicación */}
              <TabsContent value="location">
                <Card>
                  <CardHeader>
                    <CardTitle>Datos de Ubicación</CardTitle>
                    <CardDescription>
                      Información sobre la ubicación del árbol en el parque
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código Identificador</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Se genera automáticamente" 
                                {...field} 
                                disabled
                                className="bg-gray-50 text-gray-500"
                              />
                            </FormControl>
                            <FormDescription>
                              El código único se genera automáticamente usando el formato ESPECIE-PARQUE-NÚMERO
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
                            <FormLabel>Parque*</FormLabel>
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
                                {isLoadingParks ? (
                                  <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                                  </div>
                                ) : (
                                  parks?.map((park: any) => (
                                    <SelectItem key={park.id} value={park.id.toString()}>
                                      {park.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Parque donde se encuentra el árbol
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="speciesId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Especie*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una especie" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingSpecies ? (
                                  <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                                  </div>
                                ) : (
                                  species?.data?.map((speciesItem: any) => (
                                    <SelectItem key={speciesItem.id} value={speciesItem.id.toString()}>
                                      {speciesItem.commonName} ({speciesItem.scientificName})
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Especie a la que pertenece el árbol
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="plantingDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Plantación</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={field.value}
                                setDate={field.onChange}
                                placeholder="Selecciona una fecha"
                              />
                            </FormControl>
                            <FormDescription>
                              Fecha en que se plantó el árbol (si se conoce)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="text-lg font-medium flex items-center">
                              <MapPin className="h-5 w-5 mr-2 text-green-600" />
                              Geolocalización
                            </h3>
                            <p className="text-sm text-gray-500">
                              Coordenadas exactas donde se encuentra el árbol
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleGetCurrentLocation}
                            disabled={useCurrentLocation}
                          >
                            {useCurrentLocation ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Obteniendo...
                              </>
                            ) : (
                              <>
                                <MapPin className="h-4 w-4 mr-2" />
                                Usar mi ubicación
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Latitud*</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: 20.6736" {...field} />
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
                                <FormLabel>Longitud*</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: -103.3456" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="locationDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción de la Ubicación</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe la ubicación del árbol dentro del parque..." 
                                {...field} 
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormDescription>
                              Descripción que ayude a ubicar el árbol (ej: "Cerca de la entrada principal")
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => navigate('/admin/trees/inventory')}>
                      Cancelar
                    </Button>
                    <Button type="button" onClick={() => setActiveTab('characteristics')}>
                      Siguiente
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Tab: Características */}
              <TabsContent value="characteristics">
                <Card>
                  <CardHeader>
                    <CardTitle>Características Físicas</CardTitle>
                    <CardDescription>
                      Información sobre las características físicas y dimensiones del árbol
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="developmentStage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Etapa de Desarrollo</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || ''}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una etapa" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {developmentStageOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Etapa actual de desarrollo del árbol
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ageEstimate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Edad Estimada (años)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                placeholder="Ej: 15" 
                                {...field} 
                                value={field.value === null ? '' : field.value}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? null : parseInt(e.target.value);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Edad aproximada del árbol en años
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL de Imagen</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://ejemplo.com/imagen.jpg" 
                                {...field} 
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormDescription>
                              URL de una fotografía del árbol
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-medium flex items-center mb-4">
                        <Ruler className="h-5 w-5 mr-2 text-green-600" />
                        Dimensiones
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="height"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Altura (metros)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1"
                                  min="0"
                                  placeholder="Ej: 12.5" 
                                  {...field} 
                                  value={field.value === null ? '' : field.value}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? null : parseFloat(e.target.value);
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Altura aproximada en metros
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="diameter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Diámetro del Tronco (cm)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1"
                                  min="0"
                                  placeholder="Ej: 45.2" 
                                  {...field} 
                                  value={field.value === null ? '' : field.value}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? null : parseFloat(e.target.value);
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Diámetro a la altura del pecho (DAP)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="canopyCoverage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cobertura de Copa (m²)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1"
                                  min="0"
                                  placeholder="Ej: 28.3" 
                                  {...field} 
                                  value={field.value === null ? '' : field.value}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? null : parseFloat(e.target.value);
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Área que cubre la copa en metros cuadrados
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('location')}>
                      Anterior
                    </Button>
                    <Button type="button" onClick={() => setActiveTab('health')}>
                      Siguiente
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Tab: Estado y Observaciones */}
              <TabsContent value="health">
                <Card>
                  <CardHeader>
                    <CardTitle>Estado y Observaciones</CardTitle>
                    <CardDescription>
                      Información sobre el estado de salud del árbol y observaciones adicionales
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="healthStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado de Salud</FormLabel>
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
                                {healthStatusOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Evaluación general del estado del árbol
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastInspectionDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Última Inspección</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={field.value}
                                setDate={field.onChange}
                                placeholder="Selecciona una fecha"
                              />
                            </FormControl>
                            <FormDescription>
                              Fecha de la última inspección realizada
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="physicalCondition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condición Física</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe la condición física del árbol..." 
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Detalles sobre la condición física (inclinación, vigor, etc.)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-medium mb-4">Condiciones Específicas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="hasHollows"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Presencia de Huecos</FormLabel>
                                <FormDescription>
                                  El árbol tiene cavidades o huecos
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="hasExposedRoots"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Raíces Expuestas</FormLabel>
                                <FormDescription>
                                  El árbol tiene raíces visibles en superficie
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="hasPests"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Presencia de Plagas</FormLabel>
                                <FormDescription>
                                  El árbol tiene signos de plagas o enfermedades
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="observations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observaciones Adicionales</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Observaciones adicionales sobre el árbol..." 
                                className="min-h-[100px]"
                                {...field} 
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormDescription>
                              Cualquier información adicional relevante
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isProtected"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-green-200 bg-green-50 rounded-lg">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-green-800">Árbol con Protección Especial</FormLabel>
                              <FormDescription className="text-green-700">
                                Marcar si el árbol tiene alguna designación especial de protección
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex space-x-2">
                      <Button type="button" variant="outline" onClick={() => navigate('/admin/trees/inventory')}>
                        Cancelar
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setActiveTab('characteristics')}>
                        Anterior
                      </Button>
                    </div>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      Guardar Árbol
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}

export default NewTreePage;