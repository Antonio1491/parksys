import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation as useWouterLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Images, MapPin, Users, TreePine, FileText } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import AdminLayout from "@/components/AdminLayout";
import ParkMultimediaManager from "@/components/ParkMultimediaManager";
import ParkAmenitiesManager from "@/components/ParkAmenitiesManager";
import ParkTreeSpeciesManager from "@/components/ParkTreeSpeciesManager";
import ParkVolunteersManager from "@/components/ParkVolunteersManager";

// Schema de validación para el formulario
const parkSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  municipality: z.string().min(1, 'El municipio es requerido'),
  address: z.string().min(1, 'La dirección es requerida'),
  description: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  area: z.string().optional(),
  foundationYear: z.coerce.number().nullable().optional(),
  dailySchedule: z.record(z.string(), z.object({
    enabled: z.boolean(),
    openingTime: z.string().nullable().optional(),
    closingTime: z.string().nullable().optional()
  })).optional(),
  administrator: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  certificaciones: z.string().optional(),
  status: z.enum([
    "en_funcionamiento",
    "operando_parcialmente", 
    "en_mantenimiento",
    "cerrado_temporalmente",
    "cerrado_indefinidamente",
    "reapertura_proxima",
    "en_proyecto_construccion",
    "uso_restringido"
  ]).default("en_funcionamiento").optional(),
});

type ParkFormValues = z.infer<typeof parkSchema>;

// Componente del formulario de información básica
interface ParkBasicInfoFormProps {
  park: any;
  parkId: number;
}

const ParkBasicInfoForm: React.FC<ParkBasicInfoFormProps> = ({ park, parkId }) => {
  const [_, setLocation] = useWouterLocation();
  const { toast } = useToast();

  // Definir el formulario con react-hook-form
  const form = useForm<ParkFormValues>({
    resolver: zodResolver(parkSchema),
    defaultValues: {
      name: '',
      municipality: '',
      address: '',
      description: '',
      postalCode: '',
      latitude: '',
      longitude: '',
      area: '',
      foundationYear: null,
      dailySchedule: {
        'Lunes': { enabled: false, openingTime: '', closingTime: '' },
        'Martes': { enabled: false, openingTime: '', closingTime: '' },
        'Miércoles': { enabled: false, openingTime: '', closingTime: '' },
        'Jueves': { enabled: false, openingTime: '', closingTime: '' },
        'Viernes': { enabled: false, openingTime: '', closingTime: '' },
        'Sábado': { enabled: false, openingTime: '', closingTime: '' },
        'Domingo': { enabled: false, openingTime: '', closingTime: '' }
      },
      administrator: '',
      contactPhone: '',
      contactEmail: '',
      certificaciones: '',
      status: 'en_funcionamiento',
    },
  });

  // Cargar los datos del parque en el formulario cuando estén disponibles
  useEffect(() => {
    if (park) {
      // Procesar horarios desde la base de datos
      let dailyScheduleFromDB = {
        'Lunes': { enabled: false, openingTime: '', closingTime: '' },
        'Martes': { enabled: false, openingTime: '', closingTime: '' },
        'Miércoles': { enabled: false, openingTime: '', closingTime: '' },
        'Jueves': { enabled: false, openingTime: '', closingTime: '' },
        'Viernes': { enabled: false, openingTime: '', closingTime: '' },
        'Sábado': { enabled: false, openingTime: '', closingTime: '' },
        'Domingo': { enabled: false, openingTime: '', closingTime: '' }
      };

      try {
        if (park.openingHours && typeof park.openingHours === 'string') {
          const parsed = JSON.parse(park.openingHours);
          dailyScheduleFromDB = { ...dailyScheduleFromDB, ...parsed };
        }
      } catch (error) {
        console.log('⚠️ Error procesando horarios, usando valores por defecto:', error);
      }

      const formValues = {
        name: park.name || '',
        municipality: park.municipalityText || park.municipality?.name || park.municipality || '',
        address: park.address || '',
        description: park.description || '',
        postalCode: park.postalCode || '',
        latitude: park.latitude || '',
        longitude: park.longitude || '',
        area: park.area || '',
        foundationYear: park.foundationYear || null,
        dailySchedule: dailyScheduleFromDB,
        administrator: park.administrator || '',
        contactPhone: park.contactPhone || '',
        contactEmail: park.contactEmail || '',
        certificaciones: park.certificaciones || '',
        status: park.status || 'en_funcionamiento',
      };

      form.reset(formValues);
    }
  }, [park, form]);

  const onSubmit = (values: ParkFormValues) => {
    console.log("🔄 [FRONTEND] Datos del formulario antes de limpiar:", values);
    
    // Limpiar valores nulos/vacíos para el backend
    const cleanedValues = {
      ...values,
      latitude: values.latitude ? values.latitude.trim().replace(/,$/, '') : undefined,
      longitude: values.longitude ? values.longitude.trim().replace(/,$/, '') : undefined,
      area: values.area ? values.area.replace(/,/g, '') : undefined,
      foundationYear: values.foundationYear || undefined,
      administrator: values.administrator || undefined,
      contactPhone: values.contactPhone || undefined,
      contactEmail: values.contactEmail || undefined,
      openingHours: values.dailySchedule && Object.values(values.dailySchedule).some(schedule => schedule.enabled)
        ? JSON.stringify(values.dailySchedule)
        : undefined,
      certificaciones: values.certificaciones || undefined
    };

    console.log("🔄 [FRONTEND] Datos después de limpiar (enviando al backend):", cleanedValues);
    mutation.mutate(cleanedValues);
  };

  // Mutación para actualizar el parque
  const mutation = useMutation({
    mutationFn: async (values: ParkFormValues) => {
      const endpoint = `/api/parks/${parkId}`;
      const method = 'PUT';
      
      const result = await apiRequest(endpoint, {
        method: method,
        data: values,
      });
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/parks'] });
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
      toast({
        title: 'Parque actualizado',
        description: 'La información del parque ha sido actualizada correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Ocurrió un error al actualizar el parque: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            name="municipality"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-red-600">Municipio *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ingrese el municipio"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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
        
        {/* Configuración de horarios individuales por día */}
        <FormField
          control={form.control}
          name="dailySchedule"
          render={({ field }) => (
            <FormItem>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuración de Horarios</h3>
                
                {/* Encabezados */}
                <div className="grid grid-cols-4 gap-4 pb-2 border-b">
                  <div className="font-medium text-sm">Día</div>
                  <div className="font-medium text-sm text-center">Activo</div>
                  <div className="font-medium text-sm text-center">Apertura</div>
                  <div className="font-medium text-sm text-center">Cierre</div>
                </div>

                {/* Filas por cada día */}
                <div className="space-y-3">
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
                    <div key={day} className="grid grid-cols-4 gap-4 items-center">
                      {/* Nombre del día */}
                      <div className="font-medium text-sm">
                        {day}
                      </div>

                      {/* Checkbox de habilitado */}
                      <div className="flex justify-center">
                        <Checkbox
                          id={`${day}-enabled`}
                          checked={field.value?.[day]?.enabled || false}
                          onCheckedChange={(checked) => {
                            const currentSchedule = field.value || {};
                            const daySchedule = currentSchedule[day] || { enabled: false, openingTime: '', closingTime: '' };
                            field.onChange({
                              ...currentSchedule,
                              [day]: {
                                ...daySchedule,
                                enabled: checked as boolean
                              }
                            });
                          }}
                        />
                      </div>

                      {/* Hora de apertura */}
                      <div>
                        <Input
                          type="time"
                          value={field.value?.[day]?.openingTime || ''}
                          onChange={(e) => {
                            const currentSchedule = field.value || {};
                            const daySchedule = currentSchedule[day] || { enabled: false, openingTime: '', closingTime: '' };
                            field.onChange({
                              ...currentSchedule,
                              [day]: {
                                ...daySchedule,
                                openingTime: e.target.value
                              }
                            });
                          }}
                          disabled={!field.value?.[day]?.enabled}
                          className="text-center"
                        />
                      </div>

                      {/* Hora de cierre */}
                      <div>
                        <Input
                          type="time"
                          value={field.value?.[day]?.closingTime || ''}
                          onChange={(e) => {
                            const currentSchedule = field.value || {};
                            const daySchedule = currentSchedule[day] || { enabled: false, openingTime: '', closingTime: '' };
                            field.onChange({
                              ...currentSchedule,
                              [day]: {
                                ...daySchedule,
                                closingTime: e.target.value
                              }
                            });
                          }}
                          disabled={!field.value?.[day]?.enabled}
                          className="text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
                <Input placeholder="correo@ejemplo.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Estado del parque */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado del parque</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado del parque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_funcionamiento">En funcionamiento</SelectItem>
                    <SelectItem value="operando_parcialmente">Operando parcialmente</SelectItem>
                    <SelectItem value="en_mantenimiento">En mantenimiento</SelectItem>
                    <SelectItem value="cerrado_temporalmente">Cerrado temporalmente</SelectItem>
                    <SelectItem value="cerrado_indefinidamente">Cerrado indefinidamente</SelectItem>
                    <SelectItem value="reapertura_proxima">Reapertura próxima</SelectItem>
                    <SelectItem value="en_proyecto_construccion">En proyecto / construcción</SelectItem>
                    <SelectItem value="uso_restringido">Uso restringido</SelectItem>
                  </SelectContent>
                </Select>
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
                  placeholder="Ingrese las certificaciones del parque..."
                  className="min-h-24" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Botón de guardar */}
        <div className="flex justify-end pt-6">
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default function ParkManage() {
  const { id } = useParams();
  const [_, setLocation] = useWouterLocation();
  const { toast } = useToast();
  
  // Consulta para obtener datos del parque
  const { data: park, isLoading, error } = useQuery({
    queryKey: [`/api/parks/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/parks/${id}`, {
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) throw new Error('Error cargando parque');
      return response.json();
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando parque...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !park) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600">Error cargando el parque</p>
            <Link href="/admin/parks">
              <Button className="mt-4">Volver a parques</Button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/parks">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{park.name}</h1>
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{park.address}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Tabs de gestión */}
          <Tabs defaultValue="basica" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">              
              <TabsTrigger value="basica" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Información Básica
              </TabsTrigger>
              <TabsTrigger value="multimedia" className="flex items-center gap-2">
                <Images className="h-4 w-4" />
                Multimedia
              </TabsTrigger>
              <TabsTrigger value="amenidades" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Amenidades
              </TabsTrigger>
              <TabsTrigger value="arboles" className="flex items-center gap-2">
                <TreePine className="h-4 w-4" />
                Árboles
              </TabsTrigger>
              <TabsTrigger value="voluntarios" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Voluntarios
              </TabsTrigger>
            </TabsList>

            {/* PESTAÑA DE INFORMACIÓN BÁSICA */}
            <TabsContent value="basica" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-blue-600 flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    Información Básica del Parque
                  </CardTitle>
                  <CardDescription>
                    Administra la información general y detalles del parque.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ParkBasicInfoForm park={park} parkId={parseInt(id || '0')} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* PESTAÑA DE MULTIMEDIA - MODO EDICIÓN COMPLETO */}
            <TabsContent value="multimedia" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-blue-600 flex items-center gap-2">
                    <Images className="h-6 w-6" />
                    Gestión de Multimedia del Parque
                  </CardTitle>
                  <CardDescription>
                    Administra imágenes y documentos del parque. Puedes subir archivos o usar URLs externas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ParkMultimediaManager parkId={parseInt(id || '0')} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* PESTAÑA DE AMENIDADES - MODO EDICIÓN COMPLETO */}
            <TabsContent value="amenidades" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-green-600 flex items-center gap-2">
                    <MapPin className="h-6 w-6" />
                    Gestión de Amenidades del Parque
                  </CardTitle>
                  <CardDescription>
                    Administra las amenidades y servicios disponibles en el parque. Puedes agregar nuevas amenidades o editar las existentes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ParkAmenitiesManager parkId={parseInt(id!)} />
                </CardContent>
              </Card>
            </TabsContent>



            <TabsContent value="arboles" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-green-600 flex items-center gap-2">
                    <TreePine className="h-6 w-6" />
                    Gestión de Especies Arbóreas del Parque
                  </CardTitle>
                  <CardDescription>
                    Administra las especies arbóreas asignadas al parque. Puedes seleccionar especies del catálogo y configurar detalles de plantación.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ParkTreeSpeciesManager parkId={parseInt(id!)} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="voluntarios" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-green-600 flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    Gestión de Voluntarios del Parque
                  </CardTitle>
                  <CardDescription>
                    Administra los voluntarios asignados al parque. Selecciona voluntarios disponibles de la columna izquierda para asignarlos a este parque.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ParkVolunteersManager parkId={parseInt(id!)} />
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
        </div>
    </AdminLayout>
  );
}