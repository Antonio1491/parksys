import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CalendarRange,
  Save,
  X,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  FileText,
  User
} from 'lucide-react';

import AdminLayout from "@/components/AdminLayout";
import { ReturnHeader } from '@/components/ui/return-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import ROUTES from '@/routes';
import { apiRequest } from '@/lib/queryClient';

// Schema de validación
const programmingSchema = z.object({
  type: z.enum(['activity', 'event']),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  parkId: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.string().optional(),
  capacity: z.string().optional(),
  thematicAxisId: z.string().optional(),
  targetAudience: z.string().optional(),
  isFree: z.boolean().default(true),
  price: z.string().optional(),
  instructorId: z.string().optional(),
  organizerName: z.string().optional(),
  organizerEmail: z.string().email().optional().or(z.literal('')),
  organizerPhone: z.string().optional(),
  materials: z.string().optional(),
  requirements: z.string().optional(),
  requiredStaff: z.string().optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'postponed', 'completed']).default('draft'),
  registrationType: z.enum(['none', 'required', 'optional']).default('none'),
  requiresApproval: z.boolean().default(false),
});

type ProgrammingFormData = z.infer<typeof programmingSchema>;

export default function NewProgramming() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries para selectores
  const { data: parks } = useQuery({
    queryKey: ['/api/programming/parks/list'],
    queryFn: () => apiRequest('/api/programming/parks/list'),
  });

  const { data: thematicAxes } = useQuery({
    queryKey: ['/api/programming/thematic-axes/list'],
    queryFn: () => apiRequest('/api/programming/thematic-axes/list'),
  });

  const { data: instructors } = useQuery({
    queryKey: ['/api/programming/instructors/list'],
    queryFn: () => apiRequest('/api/programming/instructors/list'),
  });

  // Form
  const form = useForm<ProgrammingFormData>({
    resolver: zodResolver(programmingSchema),
    defaultValues: {
      type: 'activity',
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      isRecurring: false,
      isFree: true,
      price: '0',
      status: 'draft',
      registrationType: 'none',
      requiresApproval: false,
    },
  });

  const watchType = form.watch('type');
  const watchIsFree = form.watch('isFree');

  // Mutation para crear
  const createMutation = useMutation({
    mutationFn: async (data: ProgrammingFormData) => {
      const payload = {
        ...data,
        parkId: data.parkId ? parseInt(data.parkId) : null,
        thematicAxisId: data.thematicAxisId ? parseInt(data.thematicAxisId) : null,
        instructorId: data.instructorId ? parseInt(data.instructorId) : null,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        duration: data.duration ? parseInt(data.duration) : null,
        requiredStaff: data.requiredStaff ? parseInt(data.requiredStaff) : null,
        price: data.isFree ? 0 : parseFloat(data.price || '0'),
      };
      return apiRequest('/api/programming', {
        method: 'POST',
        data: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/programming'] });
      toast({
        title: 'Programación creada',
        description: 'La programación se ha creado correctamente.',
      });
      setLocation(ROUTES.admin.programming.catalog);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la programación.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ProgrammingFormData) => {
    createMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <ReturnHeader />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ceefea]">
              <CalendarRange className="h-6 w-6 text-[#00444f]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#00444f]">Nueva Programación</h1>
              <p className="text-gray-600">Crea una nueva actividad o evento</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Tipo de programación */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarRange className="h-5 w-5 text-[#00a587]" />
                  Tipo de Programación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex gap-4">
                          <Button
                            type="button"
                            variant={field.value === 'activity' ? 'default' : 'outline'}
                            className={field.value === 'activity' ? 'bg-[#00a587] hover:bg-[#00a587]/90' : ''}
                            onClick={() => field.onChange('activity')}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Actividad
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'event' ? 'default' : 'outline'}
                            className={field.value === 'event' ? 'bg-[#00444f] hover:bg-[#00444f]/90' : ''}
                            onClick={() => field.onChange('event')}
                          >
                            <CalendarRange className="h-4 w-4 mr-2" />
                            Evento
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#00a587]" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la actividad o evento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe la actividad o evento..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="thematicAxisId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eje Temático</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un eje temático" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {thematicAxes?.map((axis: any) => (
                              <SelectItem key={axis.id} value={String(axis.id)}>
                                {axis.name}
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
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Público Objetivo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el público" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="ninos">Niños</SelectItem>
                            <SelectItem value="jovenes">Jóvenes</SelectItem>
                            <SelectItem value="adultos">Adultos</SelectItem>
                            <SelectItem value="adultos_mayores">Adultos Mayores</SelectItem>
                            <SelectItem value="familias">Familias</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Borrador</SelectItem>
                          <SelectItem value="published">Publicado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                          <SelectItem value="postponed">Pospuesto</SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#00a587]" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="parkId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parque</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un parque" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {parks?.map((park: any) => (
                            <SelectItem key={park.id} value={String(park.id)}>
                              {park.name}
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
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación específica</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Área de juegos, Kiosco principal..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Fecha y Hora */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#00a587]" />
                  Fecha y Hora
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de inicio *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de fin</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
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
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de fin</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (minutos)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="60" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">¿Es recurrente?</FormLabel>
                        <FormDescription>
                          Activa si se repite periódicamente
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
              </CardContent>
            </Card>

            {/* Capacidad e Inscripciones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#00a587]" />
                  Capacidad e Inscripciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidad máxima</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registrationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de inscripción</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sin inscripción</SelectItem>
                            <SelectItem value="optional">Opcional</SelectItem>
                            <SelectItem value="required">Requerida</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">¿Requiere aprobación?</FormLabel>
                        <FormDescription>
                          Las inscripciones deben ser aprobadas manualmente
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
              </CardContent>
            </Card>

            {/* Precio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#00a587]" />
                  Precio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isFree"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">¿Es gratuito?</FormLabel>
                        <FormDescription>
                          Desactiva para establecer un precio
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

                {!watchIsFree && (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Instructor u Organizador */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-[#00a587]" />
                  {watchType === 'activity' ? 'Instructor' : 'Organizador'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {watchType === 'activity' ? (
                  <FormField
                    control={form.control}
                    name="instructorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un instructor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {instructors?.map((instructor: any) => (
                              <SelectItem key={instructor.id} value={String(instructor.id)}>
                                {instructor.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="organizerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del organizador</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organizerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organizerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="(123) 456-7890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Materiales y Requisitos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#00a587]" />
                  Materiales y Requisitos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="materials"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Materiales necesarios</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Lista de materiales que se necesitan..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requisitos para participar</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Requisitos de edad, vestimenta, etc..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiredStaff"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal requerido</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation(ROUTES.admin.programming.catalog)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#007a5e] hover:bg-[#00664e]"
                disabled={createMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>

          </form>
        </Form>
      </div>
     </AdminLayout>
    );
  }