import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TreePine, ArrowLeft, Save, Leaf, Upload, Image, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Definir el esquema de validación para el formulario
const treeSpeciesSchema = z.object({
  commonName: z.string().min(2, {
    message: 'El nombre común debe tener al menos 2 caracteres.',
  }),
  scientificName: z.string().min(2, {
    message: 'El nombre científico debe tener al menos 2 caracteres.',
  }),
  family: z.string().min(2, {
    message: 'La familia debe tener al menos 2 caracteres.',
  }),
  origin: z.string({
    required_error: 'Selecciona el origen de la especie.',
  }),
  growthRate: z.string({
    required_error: 'Selecciona la tasa de crecimiento.',
  }),
  imageUrl: z.string().optional(),
  isEndangered: z.boolean().default(false),
  description: z.string().min(10, {
    message: 'La descripción debe tener al menos 10 caracteres.',
  }).max(1000, {
    message: 'La descripción no debe exceder los 1000 caracteres.'
  }),
  ecologicalBenefits: z.string().optional(),
  maintenanceRequirements: z.string().optional(),
  lifespan: z.string().optional(),
  climateZone: z.string().optional(),
  soilRequirements: z.string().optional(),
  waterRequirements: z.string().optional(),
  sunRequirements: z.string().optional(),
  ornamentalValue: z.string().optional(),
  commonUses: z.string().optional(),
});

type TreeSpeciesFormValues = z.infer<typeof treeSpeciesSchema>;

function EditTreeSpecies() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Validar que el ID sea un número válido
  const numericId = parseInt(id as string, 10);
  const isValidId = !isNaN(numericId) && id !== undefined;

  // Redirigir si el ID no es válido
  if (!isValidId) {
    setLocation('/admin/trees/catalog');
    return null;
  }
  const [uploadedPhoto, setUploadedPhoto] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  // Configuración del formulario con valores por defecto
  const form = useForm<TreeSpeciesFormValues>({
    resolver: zodResolver(treeSpeciesSchema),
    defaultValues: {
      commonName: '',
      scientificName: '',
      family: '',
      origin: 'Nativo',
      growthRate: 'Medio',
      imageUrl: '',
      isEndangered: false,
      description: '',
      ecologicalBenefits: '',
      maintenanceRequirements: '',
      lifespan: '',
      climateZone: '',
      soilRequirements: '',
      waterRequirements: '',
      sunRequirements: '',
      ornamentalValue: '',
      commonUses: '',
    },
  });

  // Consultar los datos de la especie para editar
  const { data: species, isLoading: isLoadingSpecies } = useQuery({
    queryKey: [`/api/tree-species/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/tree-species/${numericId}`);
      if (!response.ok) {
        throw new Error('Error al cargar los detalles de la especie arbórea');
      }
      return response.json();
    },
    enabled: isValidId, // Solo ejecutar la query si el ID es válido
  });

  // Mutation para actualizar la especie arbórea
  const updateTreeSpeciesMutation = useMutation({
    mutationFn: async (data: TreeSpeciesFormValues) => {
      const response = await fetch(`/api/tree-species/${numericId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la especie arbórea');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tree-species'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tree-species/${numericId}`] });
      toast({
        title: "Especie actualizada",
        description: "La especie ha sido actualizada exitosamente en el catálogo.",
      });
      setLocation(`/admin/trees/catalog/${numericId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al actualizar la especie arbórea.",
        variant: "destructive",
      });
    },
  });

  // Cargar los datos de la especie en el formulario cuando estén disponibles
  useEffect(() => {
    if (species) {
      form.reset({
        commonName: species.commonName || '',
        scientificName: species.scientificName || '',
        family: species.family || '',
        origin: species.origin || 'Nativo',
        growthRate: species.growthRate || 'Medio',
        imageUrl: species.imageUrl || species.photoUrl || '',
        isEndangered: species.isEndangered || false,
        description: species.description || '',
        ecologicalBenefits: species.ecologicalBenefits || '',
        maintenanceRequirements: species.maintenanceRequirements || '',
        lifespan: species.lifespan?.toString() || '',
        climateZone: species.climateZone || '',
        soilRequirements: species.soilRequirements || '',
        waterRequirements: species.waterRequirements || '',
        sunRequirements: species.sunRequirements || '',
        ornamentalValue: species.ornamentalValue || '',
        commonUses: species.commonUses || '',
      });
      
      // Si la especie tiene una foto, mostrarla como subida
      if (species.photoUrl) {
        setUploadedPhoto(species.photoUrl);
      }
    }
  }, [species, form]);

  // Manejar la subida de foto
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos JPEG, PNG o SVG.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El tamaño máximo permitido es 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // TODO: Implementar sistema simple para Trees (pendiente)
      console.warn('Upload de imágenes para Trees temporalmente deshabilitado');
      
      // Placeholder por ahora
      // const photoUrl = await uploadTreePhoto(species.id, file);
      // form.setValue('imageUrl', photoUrl);
      // setUploadedPhoto(photoUrl);

      toast({
        title: "Foto subida exitosamente",
        description: "La foto se ha guardado en Object Storage y se usará como imagen de la especie.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir la foto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Manejar el envío del formulario
  function onSubmit(data: TreeSpeciesFormValues) {
    updateTreeSpeciesMutation.mutate(data);
  }

  // Manejar el regreso a la página de detalles
  const handleBack = () => {
    setLocation(`/admin/trees/catalog/${id}`);
  };

  // Mostrar carga mientras se obtienen los datos
  if (isLoadingSpecies) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Cargando datos de la especie...</h3>
              <p className="text-gray-500 mt-2">Por favor espere un momento</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>Editar Especie Arbórea | ParquesMX</title>
        <meta name="description" content="Formulario para editar una especie arbórea del catálogo" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800 flex items-center">
              <TreePine className="mr-2 h-8 w-8" />
              Editar Especie Arbórea
            </h1>
            <p className="text-gray-600 mt-1">
              {species?.commonName} <span className="italic">({species?.scientificName})</span>
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Detalles
          </Button>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="informacion-basica" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="informacion-basica">Información Básica</TabsTrigger>
                <TabsTrigger value="descripcion-detalles">Descripción y Detalles</TabsTrigger>
                <TabsTrigger value="requisitos-cultivo">Requisitos de Cultivo</TabsTrigger>
              </TabsList>
              
              {/* Pestaña de Información Básica */}
              <TabsContent value="informacion-basica">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Básica</CardTitle>
                    <CardDescription>
                      Información principal de la especie arbórea
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="commonName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Común *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Ahuehuete" {...field} />
                            </FormControl>
                            <FormDescription>
                              Nombre por el que se conoce comúnmente a la especie.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="scientificName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Científico *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Taxodium mucronatum" className="italic" {...field} />
                            </FormControl>
                            <FormDescription>
                              Nombre científico de la especie en formato latinizado.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="family"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Familia *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Cupressaceae" {...field} />
                            </FormControl>
                            <FormDescription>
                              Familia taxonómica a la que pertenece la especie.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="origin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Origen *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona el origen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Nativo">Nativo</SelectItem>
                                <SelectItem value="Introducido">Introducido</SelectItem>
                                <SelectItem value="Híbrido">Híbrido</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Indica si es una especie nativa o introducida.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="growthRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tasa de Crecimiento *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona tasa de crecimiento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Lento">Lento</SelectItem>
                                <SelectItem value="Medio">Medio</SelectItem>
                                <SelectItem value="Rapido">Rapido</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Velocidad promedio de crecimiento de la especie.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lifespan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Esperanza de Vida (años)</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. 100" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                              Tiempo de vida promedio de la especie en años.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Sección de imagen/foto */}
                    <div className="grid grid-cols-1 gap-4">
                      <Card className="p-4 border-dashed">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center text-lg">
                            <Image className="mr-2 h-5 w-5" />
                            Fotografía de la Especie
                          </CardTitle>
                          <CardDescription>
                            Sube una foto que se usará como icono en la lista y en la página pública
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Vista previa de la imagen subida */}
                          {uploadedPhoto && (
                            <div className="mb-4">
                              <img 
                                src={uploadedPhoto} 
                                alt="Especie arbórea"
                                className="w-32 h-32 object-cover rounded-lg border-2 border-green-300"
                              />
                              <p className="text-sm text-green-600 mt-2 flex items-center">
                                <Image className="h-4 w-4 mr-1" />
                                Esta imagen se usará como icono en las especies de árboles
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <label htmlFor="photo-upload" className="block text-sm font-medium mb-2">
                              Opción 1: Subir fotografía desde tu dispositivo
                            </label>
                            <input
                              id="photo-upload"
                              type="file"
                              accept="image/jpeg,image/png,image/svg+xml"
                              onChange={handlePhotoUpload}
                              disabled={isUploading}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                            />
                            {isUploading && (
                              <p className="text-sm text-blue-600 mt-2 flex items-center">
                                <Upload className="animate-spin h-4 w-4 mr-1" />
                                Subiendo foto...
                              </p>
                            )}
                          </div>
                          
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">O</span>
                            </div>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Opción 2: URL de imagen externa</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="https://ejemplo.com/imagen.jpg" 
                                    {...field} 
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormDescription>
                                  URL de una imagen externa representativa de la especie.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="isEndangered"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Especie en peligro de extinción
                            </FormLabel>
                            <FormDescription>
                              Marca esta casilla si la especie está clasificada como amenazada o en peligro.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Pestaña de Descripción y Detalles */}
              <TabsContent value="descripcion-detalles">
                <Card>
                  <CardHeader>
                    <CardTitle>Descripción y Detalles</CardTitle>
                    <CardDescription>
                      Información detallada sobre la especie arbórea
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción General *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe las características principales de la especie..." 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Descripción detallada de la especie, incluyendo características físicas, hábitat y distribución.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ecologicalBenefits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beneficios Ecológicos</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Beneficios ambientales que proporciona la especie..." 
                              className="min-h-[80px]"
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Beneficios que la especie aporta al ecosistema, como purificación del aire, control de erosión, etc.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maintenanceRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requisitos de Mantenimiento</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Cuidados y mantenimiento que requiere la especie..." 
                              className="min-h-[80px]"
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Información sobre poda, fertilización, control de plagas y otros cuidados necesarios.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ornamentalValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Ornamental</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Alto - floración espectacular" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                              Valor decorativo de la especie.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="commonUses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usos Comunes</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Ornamental, sombra, madera" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                              Principales usos de la especie.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Pestaña de Requisitos de Cultivo */}
              <TabsContent value="requisitos-cultivo">
                <Card>
                  <CardHeader>
                    <CardTitle>Requisitos de Cultivo</CardTitle>
                    <CardDescription>
                      Condiciones ambientales ideales para el crecimiento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="climateZone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zona Climática</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Templado a subtropical" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            Tipo de clima donde mejor se desarrolla la especie.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="soilRequirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requisitos de Suelo</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Bien drenado, fértil" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                              Tipo de suelo preferido para la especie.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="waterRequirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requisitos de Agua</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Moderado, resistente a sequía" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                              Necesidades hídricas de la especie.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="sunRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requisitos de Luz Solar</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Pleno sol, sombra parcial" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            Cantidad de luz solar que necesita la especie.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Botones de acción */}
            <Card>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex items-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTreeSpeciesMutation.isPending}
                  className="flex items-center bg-green-600 hover:bg-green-700"
                >
                  {updateTreeSpeciesMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar Cambios
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}

export default EditTreeSpecies;