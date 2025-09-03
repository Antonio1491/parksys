import React from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Helmet } from 'react-helmet';
import { useMutation } from '@tanstack/react-query';
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
import { TreePine, ArrowLeft, Save, Leaf, Upload, Image } from 'lucide-react';
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

function NewTreeSpecies() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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

  // Mutation para crear una nueva especie arbórea
  const createTreeSpeciesMutation = useMutation({
    mutationFn: async (data: TreeSpeciesFormValues) => {
      const response = await fetch('/api/tree-species', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la especie arbórea');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tree-species'] });
      toast({
        title: "Especie arbórea creada",
        description: "La especie ha sido registrada exitosamente en el catálogo.",
      });
      setLocation('/admin/trees/catalog');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al crear la especie arbórea.",
        variant: "destructive",
      });
    },
  });

  // Manejar el envío del formulario
  function onSubmit(data: TreeSpeciesFormValues) {
    console.log('Datos del formulario:', data);
    console.log('Errores del formulario:', form.formState.errors);
    createTreeSpeciesMutation.mutate(data);
  }

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
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/tree-species/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la foto');
      }

      const result = await response.json();
      
      // Actualizar el campo imageUrl del formulario con la URL de la foto subida
      form.setValue('imageUrl', result.photoUrl);
      setUploadedPhoto(result.photoUrl);

      toast({
        title: "Foto subida exitosamente",
        description: "La foto se ha guardado y se usará como imagen de la especie.",
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

  // Manejar el regreso al catálogo
  const handleBack = () => {
    setLocation('/admin/trees/catalog');
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Nueva Especie Arbórea | ParquesMX</title>
        <meta name="description" content="Formulario para agregar una nueva especie arbórea al catálogo" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800 flex items-center">
              <TreePine className="mr-2 h-8 w-8" />
              Nueva Especie Arbórea
            </h1>
            <p className="text-gray-600 mt-1">
              Añade una nueva especie al catálogo de árboles
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Catálogo
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
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona tasa de crecimiento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Lento">Lento</SelectItem>
                                <SelectItem value="Medio">Medio</SelectItem>
                                <SelectItem value="Rapido">Rápido</SelectItem>
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
                            <FormLabel>Esperanza de Vida</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. 500-1500 años" {...field} />
                            </FormControl>
                            <FormDescription>
                              Tiempo de vida promedio de la especie.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-4">
                        <FormLabel>Imagen de la Especie</FormLabel>
                        
                        {/* Vista previa de la imagen subida */}
                        {uploadedPhoto && (
                          <div className="flex items-center space-x-4 p-4 border rounded-lg bg-green-50">
                            <div className="flex-shrink-0">
                              <img
                                src={uploadedPhoto}
                                alt="Vista previa"
                                className="h-16 w-16 object-cover rounded-lg border"
                              />
                            </div>
                            <div className="flex-grow">
                              <p className="text-sm font-medium text-green-800">
                                Foto subida exitosamente
                              </p>
                              <p className="text-xs text-green-600">
                                Esta imagen se usará como icono en las amenidades
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Opción 1: Subir archivo directo */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Opción 1: Subir archivo directo</label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="file"
                              accept="image/jpeg,image/png,image/svg+xml"
                              onChange={handlePhotoUpload}
                              disabled={isUploading}
                              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                            />
                            {isUploading && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Upload className="animate-spin h-4 w-4 mr-1" />
                                Subiendo...
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Formatos: JPEG, PNG, SVG | Tamaño máximo: 5MB
                          </p>
                        </div>
                        
                        {/* Separador */}
                        <div className="flex items-center">
                          <div className="flex-grow border-t border-gray-300"></div>
                          <span className="px-3 text-sm text-gray-500">o</span>
                          <div className="flex-grow border-t border-gray-300"></div>
                        </div>
                        
                        {/* Opción 2: URL externa */}
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
                      </div>
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
                              Especie en Peligro de Extinción
                            </FormLabel>
                            <FormDescription>
                              Marca esta opción si la especie está amenazada o en peligro de extinción.
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
                      Información descriptiva y beneficios de la especie
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descripción general de la especie..."
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Descripción general de la especie, incluyendo características distintivas.
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
                          <FormLabel>Beneficios</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Beneficios ecológicos, culturales o para la salud..."
                              className="min-h-[120px]"
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Beneficios ecológicos, culturales o para la salud que ofrece esta especie.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="climateZone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zona Climática</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Tropical, Templada, Seca..." {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                              Zona climática donde mejor se desarrolla.
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
                            <FormLabel>Notas Adicionales</FormLabel>
                            <FormControl>
                              <Input placeholder="Información adicional relevante..." {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                              Cualquier otra información relevante sobre la especie.
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
                      Condiciones óptimas para el crecimiento y mantenimiento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="careRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requisitos de Cuidado</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Requisitos generales de cuidado y mantenimiento..."
                              className="min-h-[120px]"
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Requisitos generales de cuidado y mantenimiento.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="soilPreference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferencia de Suelo</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Arcilloso, arenoso, bien drenado..." {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                              Tipo de suelo preferido por esta especie.
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
                            <FormLabel>Requerimientos de Agua</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Bajo, moderado, alto..." {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                              Necesidades de riego o humedad.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sunExposure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exposición al Sol</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Sol pleno, sombra parcial..." {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                              Preferencia de exposición a la luz solar.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="pestDiseaseResistance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resistencia a Plagas/Enfermedades</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Alta, media, baja..." {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                              Nivel de resistencia a plagas y enfermedades comunes.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700"
                disabled={createTreeSpeciesMutation.isPending}
              >
                {createTreeSpeciesMutation.isPending ? (
                  <>Guardando...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Guardar Especie
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

export default NewTreeSpecies;