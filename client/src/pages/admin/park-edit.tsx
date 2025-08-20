import React, { useEffect, useState } from 'react';
import { useParams, useLocation as useWouterLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronLeft,
  Loader,
  MapPin,
  Image,
  FileText,
  Tag,
  Calendar,
  BadgeCheck,
  Building,
  Upload,
  Star,
  Trash,
  Download
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import ScheduleConfiguration from '@/components/ScheduleConfiguration';

// Define el esquema de validación para el formulario
const parkSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  municipalityId: z.coerce.number().refine(val => val > 0, 'Seleccione un municipio'),
  parkType: z.string().min(1, 'Seleccione un tipo de parque'),
  address: z.string().min(1, 'La dirección es requerida'),
  description: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  foundationYear: z.coerce.number().nullable().optional(),

  openingHours: z.string().nullable().optional(),
  administrator: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  certificaciones: z.string().nullable().optional(),
});

type ParkFormValues = z.infer<typeof parkSchema>;

// Municipios del área metropolitana de Guadalajara
const GUADALAJARA_MUNICIPALITIES = [
  { id: 1, name: 'Guadalajara' },
  { id: 2, name: 'Zapopan' },
  { id: 3, name: 'San Pedro Tlaquepaque' },
  { id: 4, name: 'Tonalá' },
  { id: 5, name: 'Tlajomulco de Zúñiga' },
  { id: 6, name: 'El Salto' },
  { id: 7, name: 'Ixtlahuacán de los Membrillos' },
  { id: 8, name: 'Juanacatlán' },
  { id: 9, name: 'Zapotlanejo' }
];

const AdminParkEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useWouterLocation();
  const isEdit = !!id;
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();
  

  
  // Consulta los datos del parque si estamos editando
  const { data: park, isLoading } = useQuery({
    queryKey: [`/api/parks/${id}`],
    enabled: isEdit,
    gcTime: 0,
    staleTime: 0
  });
  
  // Usar la lista estática de municipios del área metropolitana de Guadalajara
  const municipalities = GUADALAJARA_MUNICIPALITIES;
  
  // Definir el formulario con react-hook-form
  const form = useForm<ParkFormValues>({
    resolver: zodResolver(parkSchema),
    defaultValues: {
      name: '',
      municipalityId: 0,
      parkType: '',
      address: '',
      description: '',
      postalCode: '',
      latitude: '',
      longitude: '',
      area: '',
      foundationYear: null,

      openingHours: '',
      administrator: '',
      contactPhone: '',
      contactEmail: '',
      certificaciones: '',
    },
  });
  
  // Cargar los datos del parque en el formulario cuando estén disponibles
  useEffect(() => {
    if (park && isEdit) {
      console.log("Datos del parque cargados:", park);
      
      // Crear un objeto con los valores por defecto en caso de que falten propiedades
      const formValues = {
        name: park.name || '',
        municipalityId: park.municipalityId || 0,
        parkType: park.parkType || '',
        address: park.address || '',
        description: park.description || '',
        postalCode: park.postalCode || '',
        latitude: park.latitude || '',
        longitude: park.longitude || '',
        area: park.area || '',
        foundationYear: park.foundationYear || undefined,
        hasAccessibility: !!park.hasAccessibility,
        hasSportsAreas: !!park.hasSportsAreas,
        hasPlayground: !!park.hasPlayground,
        hasRestrooms: !!park.hasRestrooms,
        openingHours: park.openingHours || '',
        administrator: park.administrator || '',
        contactPhone: park.contactPhone || '',
        contactEmail: park.contactEmail || '',
        certificaciones: park.certificaciones || '',
      };
      
      form.reset(formValues);
      

    }
  }, [park, isEdit, form, id]);
  
  const onSubmit = (values: ParkFormValues) => {
    console.log('Formulario enviado con valores:', values);
    console.log('Estado del formulario:', form.formState);
    console.log('Errores del formulario:', form.formState.errors);
    
    // Limpiar valores nulos/vacíos para el backend
    const cleanedValues = {
      ...values,
      latitude: values.latitude ? values.latitude.trim().replace(/,$/, '') : undefined,
      longitude: values.longitude ? values.longitude.trim().replace(/,$/, '') : undefined,
      area: values.area || undefined,
      foundationYear: values.foundationYear || undefined,
      administrator: values.administrator || undefined,
      contactPhone: values.contactPhone || undefined,
      contactEmail: values.contactEmail || undefined,
      openingHours: values.openingHours || undefined,
      certificaciones: values.certificaciones || undefined
    };
    
    console.log('Valores limpiados para enviar:', cleanedValues);
    mutation.mutate(cleanedValues);
  };
  
  // Mutación para crear o actualizar el parque
  const mutation = useMutation({
    mutationFn: async (values: ParkFormValues) => {
      const endpoint = isEdit ? `/api/parks/${id}` : '/api/parks';
      const method = isEdit ? 'PUT' : 'POST';
      
      console.log('Iniciando mutación:', { endpoint, method, values });
      
      const result = await apiRequest(endpoint, {
        method: method,
        data: values,
      });
      
      console.log('Respuesta de la API:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Mutación exitosa:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/parks'] });
      toast({
        title: isEdit ? 'Parque actualizado' : 'Parque creado',
        description: `El parque ha sido ${isEdit ? 'actualizado' : 'creado'} correctamente.`,
      });
      setLocation('/admin/parks');
    },
    onError: (error: any) => {
      console.error('Error en onError:', error);
      toast({
        title: 'Error',
        description: `Ocurrió un error al ${isEdit ? 'actualizar' : 'crear'} el parque: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  if (isLoading && isEdit) {
    return (
      <AdminLayout title="Cargando parque...">
        <div className="flex items-center justify-center h-full">
          <Loader className="h-12 w-12 text-primary animate-spin" />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout
      title={isEdit ? `Editar parque: ${park?.name || ''}` : 'Nuevo parque'}
      subtitle={isEdit ? "Actualiza la información del parque" : "Ingresa la información para crear un nuevo parque"}
    >
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin/parks')}
              className="mb-2"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver a la lista
            </Button>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 park-edit-container">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="basic">Información Básica</TabsTrigger>
                </TabsList>
            
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Información general sobre el parque
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre del parque */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-red-600">Nombre del parque *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del parque" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Municipio */}
                    <FormField
                      control={form.control}
                      name="municipalityId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-red-600">Municipio *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value ? field.value.toString() : ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un municipio" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {municipalities?.map((municipality: any) => (
                                <SelectItem 
                                  key={municipality.id} 
                                  value={municipality.id.toString()}
                                >
                                  {municipality.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Tipo de parque */}
                  <FormField
                    control={form.control}
                    name="parkType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-red-600">Tipo de Parque *</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un tipo de parque" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Urbano">Parque Urbano</SelectItem>
                            <SelectItem value="Metropolitano">Parque Metropolitano</SelectItem>
                            <SelectItem value="Lineal">Parque Lineal</SelectItem>
                            <SelectItem value="Comunitario">Parque Comunitario</SelectItem>
                            <SelectItem value="Natural">Parque Natural</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Descripción */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descripción general del parque..." 
                            className="min-h-32" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dirección */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-red-600">Dirección *</FormLabel>
                          <FormControl>
                            <Input placeholder="Dirección completa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Código postal */}
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
                    {/* Latitud */}
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitud</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: 19.432608" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Longitud */}
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitud</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: -99.133209" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Área */}
                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Área (m²)</FormLabel>
                          <FormControl>
                            <Input placeholder="Superficie en metros cuadrados" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Año de fundación */}
                    <FormField
                      control={form.control}
                      name="foundationYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Año de fundación</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Año de fundación"
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                              value={field.value === null ? '' : field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  

                  
                  {/* Horario de apertura configurado */}
                  <div>
                    <FormField
                      control={form.control}
                      name="openingHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horarios de apertura</FormLabel>
                          <FormControl>
                            <ScheduleConfiguration
                              value={field.value || ''}
                              onChange={field.onChange}
                              className="mt-2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Administrador */}
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
                    
                    {/* Teléfono de contacto */}
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono de contacto</FormLabel>
                          <FormControl>
                            <Input placeholder="Teléfono de contacto" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Correo electrónico */}
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo electrónico de contacto</FormLabel>
                        <FormControl>
                          <Input placeholder="Correo electrónico" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Certificaciones */}
                  <FormField
                    control={form.control}
                    name="certificaciones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certificaciones</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Green Flag Award, ISO 14001, Certificación Ambiental (separadas por comas)" 
                            className="min-h-[80px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">
                          Ingresa las certificaciones del parque separadas por comas. Ejemplo: Green Flag Award 2024, ISO 14001, Bandera Verde
                        </p>
                      </FormItem>
                    )}
                  />

                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                    {isEdit ? 'Guardar Cambios' : 'Crear Parque'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminParkEdit;
