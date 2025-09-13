import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
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
import { Loader2, MapPin, Ruler, ArrowLeft, Leaf, AlertTriangle, TreeDeciduous } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Esquema de validación para el formulario
const treeSchema = z.object({
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
function EditTreePage() {
  const [match, params] = useRoute('/admin/trees/inventory/:id/edit');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('location');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const treeId = params?.id;

  // Formulario con React Hook Form y validación Zod
  const form = useForm<TreeFormValues>({
    resolver: zodResolver(treeSchema),
    defaultValues: {
      speciesId: '',
      parkId: '',
      latitude: '',
      longitude: '',
      plantingDate: null,
      developmentStage: '',
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

  // Consultar información del árbol
  const {
    data: treeResponse,
    isLoading: isLoadingTree,
    error: treeError,
  } = useQuery({
    queryKey: [`/api/trees/${treeId}`],
    queryFn: async () => {
      const response = await fetch(`/api/trees/${treeId}`);
      if (!response.ok) {
        throw new Error('Error al cargar la información del árbol');
      }
      return response.json();
    },
    enabled: !!treeId,
  });

  const tree = treeResponse?.data;

  // Cargar lista de especies - solicitar todas las especies
  const { data: speciesResponse, isLoading: isLoadingSpecies } = useQuery({
    queryKey: ['/api/tree-species'],
    queryFn: async () => {
      const response = await fetch('/api/tree-species?limit=100'); // Solicitar hasta 100 especies
      if (!response.ok) {
        throw new Error('Error al cargar las especies arbóreas');
      }
      return response.json();
    },
  });

  const species = speciesResponse?.data || [];

  // Cargar lista de parques
  const { data: parksResponse, isLoading: isLoadingParks } = useQuery({
    queryKey: ['/api/parks'],
    queryFn: async () => {
      const response = await fetch('/api/parks');
      if (!response.ok) {
        throw new Error('Error al cargar los parques');
      }
      return response.json();
    },
  });

  // Manejar formato de respuesta variable (array directo o {data: array})
  const parks = Array.isArray(parksResponse) 
    ? parksResponse 
    : (parksResponse?.data || []);

  // Llenar el formulario con los datos del árbol cuando se carguen
  useEffect(() => {
    if (tree) {
      console.log('Datos del árbol recibidos de la API:', tree);
      
      // Convertir fechas de string a objeto Date
      const plantingDate = tree.plantingDate ? new Date(tree.plantingDate) : null;
      const lastInspectionDate = null; // No disponible en datos actuales

      form.reset({
        speciesId: (tree.speciesId?.toString()) || '',
        parkId: (tree.parkId?.toString()) || '',
        latitude: tree.latitude || '',
        longitude: tree.longitude || '',
        plantingDate,
        developmentStage: tree.developmentStage || '',
        ageEstimate: tree.ageEstimate ? Number(tree.ageEstimate) : null,
        height: tree.height ? Number(tree.height) : null,
        diameter: tree.diameter ? Number(tree.diameter) : null,
        canopyCoverage: tree.canopyCoverage ? Number(tree.canopyCoverage) : null,
        healthStatus: tree.healthStatus || 'Bueno',
        physicalCondition: tree.condition || '',
        hasHollows: tree.hasHollows || false,
        hasExposedRoots: tree.hasExposedRoots || false,
        hasPests: tree.hasPests || false,
        observations: tree.notes || '',
        lastInspectionDate,
        isProtected: tree.isProtected || false,
        locationDescription: tree.locationDescription || '',
        imageUrl: tree.imageUrl || '',
      });
    }
  }, [tree, form]);

  // Manejar el envío del formulario
  const onSubmit = async (data: TreeFormValues) => {
    console.log('🌳 onSubmit LLAMADO - Iniciando proceso de guardado');
    console.log('🌳 Estado del formulario:', form.formState);
    console.log('🌳 Errores del formulario:', form.formState.errors);
    
    try {
      console.log('🌳 Datos del formulario antes de formatear:', data);
      
      // Convertir IDs a números para la API
      const formattedData = {
        ...data,
        speciesId: parseInt(data.speciesId),
        parkId: parseInt(data.parkId),
      };

      console.log('🌳 Datos formateados que se enviarán:', formattedData);

      console.log('🌳 Realizando petición PUT a:', `/api/trees/${treeId}`);
      
      await apiRequest(`/api/trees/${treeId}`, {
        method: 'PUT',
        data: formattedData,
      });

      toast({
        title: 'Árbol actualizado',
        description: 'Los cambios han sido guardados correctamente.',
        variant: 'success',
      });

      // Invalidar la caché para forzar una recarga de los datos
      queryClient.invalidateQueries({ queryKey: [`/api/trees/${treeId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/trees'] });
      
      // Redirigir a la vista de detalle
      navigate(`/admin/trees/inventory/${treeId}`);
    } catch (error) {
      console.error('Error al actualizar el árbol:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios. Por favor, intenta nuevamente.',
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
            variant: 'success',
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

  // Si hay error al cargar
  if (treeError) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-6">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No se pudo cargar la información del árbol. Verifica que el ID sea correcto.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => navigate('/admin/trees/inventory')}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inventario
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>{isLoadingTree ? 'Cargando...' : `Editar Árbol ${tree.code} | Inventario Arbóreo | ParquesMX`}</title>
        <meta name="description" content="Editar información del árbol en el inventario de parques municipales" />
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        {/* Encabezado */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin/trees/inventory/${treeId}`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            {isLoadingTree ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              <h1 className="text-3xl font-bold text-green-800 flex items-center">
                <TreeDeciduous className="mr-2 h-8 w-8" />
                Editar Árbol: {tree.code}
              </h1>
            )}
            <p className="text-gray-600 mt-1">
              Actualiza la información del árbol en el inventario
            </p>
          </div>
        </div>

        {isLoadingTree ? (
          <div className="space-y-6">
            <Skeleton className="h-[300px] w-full rounded-lg" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
        ) : (
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
                          name="parkId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parque*</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
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
                                value={field.value}
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
                                  selected={field.value}
                                  onSelect={field.onChange}
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
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/admin/trees/inventory/${treeId}`)}
                      >
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
                                value={field.value || ''}
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
                                value={field.value}
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
                                  selected={field.value}
                                  onSelect={field.onChange}
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
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => navigate(`/admin/trees/inventory/${treeId}`)}
                        >
                          Cancelar
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setActiveTab('characteristics')}>
                          Anterior
                        </Button>
                      </div>
                      <Button 
                        type="submit" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => console.log('🌳 BOTÓN GUARDAR CLICKEADO')}
                      >
                        Guardar Cambios
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        )}
      </div>
    </AdminLayout>
  );
}

export default EditTreePage;