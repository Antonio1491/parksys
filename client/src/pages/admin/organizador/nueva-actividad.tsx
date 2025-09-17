import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Clock, MapPin, Users, X, Upload, Image as ImageIcon, Trash2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import LocationSelector from '@/components/LocationSelector';

// Las categorías se cargan dinámicamente desde la API

// Estados de actividad
const ESTADOS_ACTIVIDAD = [
  { id: 'activa', label: '🟢 Activa' },
  { id: 'programada', label: '🟡 Programada' },
  { id: 'cancelada', label: '🔴 Cancelada' },
  { id: 'finalizada', label: '⚫ Finalizada' },
  { id: 'en_pausa', label: '🟠 En Pausa' }
];

// Esquema de validación para nueva actividad
const nuevaActividadSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  descripcion: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  categoria: z.string({ required_error: "Selecciona una categoría" }),
  parqueId: z.number({ required_error: "Selecciona un parque" }),
  fechaInicio: z.date({ required_error: "Selecciona una fecha de inicio" }),
  fechaFin: z.date().optional(),
  horaInicio: z.string().min(1, "Selecciona una hora de inicio"),
  duracion: z.number().min(1, "La duración debe ser al menos 1 minuto"),
  capacidad: z.number().optional(),
  materiales: z.string().optional(),
  personalRequerido: z.number().optional(),
  esRecurrente: z.boolean().default(false),
  esGratuita: z.boolean().default(true),
  precio: z.number().optional(),
  ubicacion: z.string().optional(),
  ubicaciones: z.array(z.string()).optional(),
  diasRecurrentes: z.array(z.string()).optional(),
  requisitos: z.string().optional(),
  instructorId: z.number().optional(),
  status: z.string().default('programada'),
});

type NuevaActividadFormValues = z.infer<typeof nuevaActividadSchema>;

// Componente para gestión de imágenes
interface ImageUploadSectionProps {
  onImagesChange: (files: File[]) => void;
  selectedImages: File[];
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({ onImagesChange, selectedImages }) => {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);

  // Función para manejar la selección de archivos
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const newImages = [...selectedImages, ...imageFiles];
      onImagesChange(newImages);
      
      // Crear previews para las nuevas imágenes
      imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Función para eliminar una imagen
  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    onImagesChange(newImages);
    setImagePreviews(newPreviews);
    
    // Ajustar índice de imagen principal si es necesario
    if (primaryImageIndex >= newImages.length) {
      setPrimaryImageIndex(Math.max(0, newImages.length - 1));
    }
  };

  // Función para establecer imagen principal
  const setPrimaryImage = (index: number) => {
    setPrimaryImageIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* Botón de subida */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600">
            Haz clic para subir imágenes o arrastra archivos aquí
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PNG, JPG, GIF hasta 10MB cada una
          </p>
        </label>
      </div>

      {/* Preview de imágenes */}
      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Controles de la imagen */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant={primaryImageIndex === index ? "default" : "secondary"}
                  onClick={() => setPrimaryImage(index)}
                  className="text-xs"
                >
                  <Star className="w-3 h-3 mr-1" />
                  {primaryImageIndex === index ? "Principal" : "Hacer principal"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeImage(index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Indicador de imagen principal */}
              {primaryImageIndex === index && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  <Star className="w-3 h-3 inline mr-1" />
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedImages.length > 0 && (
        <p className="text-sm text-gray-600">
          {selectedImages.length} imagen{selectedImages.length !== 1 ? 'es' : ''} seleccionada{selectedImages.length !== 1 ? 's' : ''}
          {selectedImages.length > 0 && ` • Imagen principal: ${primaryImageIndex + 1}`}
        </p>
      )}
    </div>
  );
};

const NuevaActividadPage = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState('');
  const [ubicaciones, setUbicaciones] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
  
  // Obtener la lista de parques
  const { data: parques = [] } = useQuery<{ id: number, name: string }[]>({
    queryKey: ['/api/parks/filter'],
  });

  // Obtener las categorías de actividades desde la API
  const { data: categorias = [] } = useQuery<{ id: number, name: string }[]>({
    queryKey: ['/api/activity-categories'],
  });

  // Obtener la lista de instructores
  const { data: instructores = [] } = useQuery<any[]>({
    queryKey: ['/api/instructors'],
  });

  // Configuración del formulario
  const form = useForm<NuevaActividadFormValues>({
    resolver: zodResolver(nuevaActividadSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      categoria: '',
      fechaInicio: undefined,
      horaInicio: '',
      duracion: 60,
      capacidad: undefined,
      esRecurrente: false,
      esGratuita: true,
      precio: undefined,
      ubicacion: '',
      ubicaciones: [],
      diasRecurrentes: [],
      status: 'programada',
    }
  });

  // Valores actuales del formulario
  const watchEsRecurrente = form.watch('esRecurrente');
  const watchEsGratuita = form.watch('esGratuita');
  const watchParqueId = form.watch('parqueId');

  // Mutación para crear una nueva actividad
  const crearActividad = useMutation({
    mutationFn: async (data: NuevaActividadFormValues) => {
      return await apiRequest(`/api/activities`, { 
        method: 'POST',
        data
      });
    },
    onSuccess: async (result: any) => {
      console.log('🎯 Actividad creada exitosamente:', result);
      console.log('🎯 Imágenes seleccionadas:', selectedImages.length);
      console.log('🎯 ID de actividad recibido:', result.id);
      
      toast({
        title: 'Actividad creada',
        description: 'La actividad ha sido creada exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      
      // Subir imágenes si existen
      if (selectedImages.length > 0 && result.id) {
        console.log('🎯 Iniciando subida de imágenes...');
        await uploadImages(result.id);
      } else {
        console.log('🎯 No hay imágenes para subir, redirigiendo...');
        // Si no hay imágenes, redirigir al organizador
        setLocation('/admin/organizador');
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la actividad',
        variant: 'destructive',
      });
    }
  });

  // Función para subir imágenes después de crear la actividad
  const uploadImages = async (activityId: number) => {
    try {
      for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('isPrimary', (i === primaryImageIndex).toString());

        await fetch(`/api/activities/${activityId}/images`, {
          method: 'POST',
          body: formData,
        });
      }

      toast({
        title: 'Imágenes subidas',
        description: `Se subieron ${selectedImages.length} imágenes exitosamente.`,
      });
      
      // Redirigir al organizador después de subir las imágenes
      setLocation('/admin/organizador');
    } catch (error) {
      console.error('Error subiendo imágenes:', error);
      toast({
        title: 'Error al subir imágenes',
        description: 'La actividad se creó, pero hubo un problema al subir las imágenes.',
        variant: 'destructive',
      });
      setLocation('/admin/organizador');
    }
  };

  // Manejar el envío del formulario
  const onSubmit = (data: NuevaActividadFormValues) => {
    // Incluir las ubicaciones en los datos del formulario
    const formData = {
      ...data,
      ubicaciones: ubicaciones,
    };
    crearActividad.mutate(formData);
  };

  // Agregar una nueva ubicación
  const agregarUbicacion = () => {
    if (ubicacionSeleccionada.trim()) {
      setUbicaciones([...ubicaciones, ubicacionSeleccionada]);
      setUbicacionSeleccionada('');
    }
  };

  // Eliminar una ubicación
  const eliminarUbicacion = (index: number) => {
    setUbicaciones(ubicaciones.filter((_, i) => i !== index));
  };

  // Opciones de días de la semana para actividades recurrentes
  const diasSemana = [
    { id: "lunes", label: "Lunes" },
    { id: "martes", label: "Martes" },
    { id: "miercoles", label: "Miércoles" },
    { id: "jueves", label: "Jueves" },
    { id: "viernes", label: "Viernes" },
    { id: "sabado", label: "Sábado" },
    { id: "domingo", label: "Domingo" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => setLocation('/admin/organizador')}
        >
          ← Volver a Organizador
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Crear Nueva Actividad</h1>
        <p className="text-gray-500">
          Completa el formulario para crear una nueva actividad o evento
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información básica */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Información Básica</h2>
                
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la actividad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Taller de pintura" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe brevemente la actividad..."
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((categoria) => (
                            <SelectItem key={categoria.id} value={categoria.id.toString()}>
                              {categoria.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parqueId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parque</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un parque" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {parques.map((parque) => (
                            <SelectItem key={parque.id} value={parque.id.toString()}>
                              {parque.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado de la Actividad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ESTADOS_ACTIVIDAD.map((estado) => (
                            <SelectItem key={estado.id} value={estado.id}>
                              {estado.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor Asignado</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "0" ? undefined : Number(value))}
                        defaultValue={field.value?.toString() || "0"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un instructor (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Sin instructor asignado</SelectItem>
                          {instructores.map((instructor) => (
                            <SelectItem key={instructor.id} value={instructor.id.toString()}>
                              {instructor.firstName} {instructor.lastName}
                              {instructor.specialties && instructor.specialties.length > 0 && (
                                <span className="text-muted-foreground ml-2">
                                  ({instructor.specialties.slice(0, 2).join(', ')})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Asigna un instructor responsable de dirigir esta actividad
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ubicación con LocationSelector */}
                <FormField
                  control={form.control}
                  name="ubicacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <LocationSelector
                          parkId={watchParqueId}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Seleccionar ubicación"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Programación y detalles */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Programación y Detalles</h2>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fechaInicio"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de inicio</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
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
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fechaFin"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de fin (opcional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
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
                              initialFocus
                              locale={es}
                              disabled={(date) => {
                                const inicio = form.getValues('fechaInicio');
                                return inicio ? date < inicio : false;
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Dejar en blanco para actividades de un solo día
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="horaInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de inicio</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duracion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración (minutos)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad máxima (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          placeholder="Deja en blanco si no hay límite"
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? undefined : Number(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="esRecurrente"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Actividad recurrente</FormLabel>
                          <FormDescription>
                            Se repite semanalmente
                          </FormDescription>
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
                    name="esGratuita"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Actividad gratuita</FormLabel>
                          <FormDescription>
                            No tiene costo para los participantes
                          </FormDescription>
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

                {!watchEsGratuita && (
                  <FormField
                    control={form.control}
                    name="precio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio (MXN)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            step={0.01}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchEsRecurrente && (
                  <FormField
                    control={form.control}
                    name="diasRecurrentes"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">Días de la semana</FormLabel>
                          <FormDescription>
                            Selecciona los días en que se repite la actividad
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {diasSemana.map((dia) => (
                            <FormField
                              key={dia.id}
                              control={form.control}
                              name="diasRecurrentes"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={dia.id}
                                    className="flex flex-row items-start space-x-2 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(dia.id)}
                                        onCheckedChange={(checked) => {
                                          const currentValue = field.value || [];
                                          return checked
                                            ? field.onChange([...currentValue, dia.id])
                                            : field.onChange(
                                                currentValue.filter(
                                                  (value) => value !== dia.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {dia.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Detalles adicionales */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Detalles Adicionales</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="materiales"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Materiales necesarios (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Lista de materiales requeridos para la actividad..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requisitos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requisitos para participantes (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Requisitos o recomendaciones para los participantes..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="personalRequerido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal requerido (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        placeholder="Número de personas necesarias para organizar la actividad"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? undefined : Number(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sección de Imágenes */}
            <div className="space-y-4">
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Imágenes de la actividad</h3>
                <ImageUploadSection 
                  onImagesChange={setSelectedImages}
                  selectedImages={selectedImages}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/admin/organizador')}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={crearActividad.isPending}
              >
                {crearActividad.isPending ? 'Creando actividad...' : 'Crear Actividad'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
};

export default NuevaActividadPage;