import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, ArrowLeft, Loader2, UserPlus, Calendar as CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Schema de validación para crear participaciones
const createParticipationSchema = z.object({
  volunteerId: z.coerce.number().min(1, 'Debe seleccionar un voluntario'),
  volunteerActivityId: z.coerce.number().min(1, 'Debe seleccionar una actividad'),
  attendanceStatus: z.enum(['registered', 'confirmed', 'attended']).default('registered'),
  hoursContributed: z.coerce.number().min(0).max(24).optional().nullable(),
  volunteerNotes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof createParticipationSchema>;

const ParticipationCreate: React.FC = () => {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openVolunteer, setOpenVolunteer] = useState(false);
  const [openActivity, setOpenActivity] = useState(false);

  // Fetch volunteers (usuarios con rol voluntario)
  const { data: volunteers = [], isLoading: isLoadingVolunteers } = useQuery({
    queryKey: ['/api/volunteers'],
  });

  // Fetch volunteer activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['/api/volunteer-activities'],
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(createParticipationSchema),
    defaultValues: {
      volunteerId: 0,
      volunteerActivityId: 0,
      attendanceStatus: 'registered',
      hoursContributed: null,
      volunteerNotes: '',
    },
  });

  // Create participation mutation
  const createParticipation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest({
        method: 'POST',
        url: `/api/volunteers/${data.volunteerId}/participations`,
        data: {
          volunteerActivityId: data.volunteerActivityId,
          attendanceStatus: data.attendanceStatus,
          hoursContributed: data.hoursContributed,
          volunteerNotes: data.volunteerNotes,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Participación registrada',
        description: 'La participación se ha registrado correctamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/participations/all'] });
      setLocation('/admin/volunteers/participations');
    },
    onError: (error) => {
      console.error('Error al crear participación:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar la participación. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await createParticipation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected volunteer info
  const selectedVolunteer = volunteers.find((v: any) => v.id === form.watch('volunteerId'));

  // Get selected activity info
  const selectedActivity = activities.find((a: any) => a.id === form.watch('volunteerActivityId'));

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Registrar Nueva Participación</h1>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/admin/volunteers/participations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Datos de la Participación
            </CardTitle>
            <CardDescription>
              Registre la participación de un voluntario en una actividad de voluntariado.
            </CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Seleccionar Voluntario */}
              <div className="space-y-2">
                <Label htmlFor="volunteerId">Voluntario *</Label>
                <Popover open={openVolunteer} onOpenChange={setOpenVolunteer}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openVolunteer}
                      className="w-full justify-between"
                    >
                      {selectedVolunteer
                        ? `${selectedVolunteer.fullName || selectedVolunteer.full_name} (${selectedVolunteer.email})`
                        : "Seleccionar voluntario..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar voluntario..." />
                      <CommandEmpty>
                        {isLoadingVolunteers ? "Cargando..." : "No se encontraron voluntarios."}
                      </CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {volunteers.map((volunteer: any) => (
                          <CommandItem
                            key={volunteer.id}
                            value={`${volunteer.fullName || volunteer.full_name} ${volunteer.email}`}
                            onSelect={() => {
                              form.setValue('volunteerId', volunteer.id, { shouldValidate: true });
                              setOpenVolunteer(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.watch('volunteerId') === volunteer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{volunteer.fullName || volunteer.full_name}</span>
                              <span className="text-xs text-gray-500">{volunteer.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {form.formState.errors.volunteerId && (
                  <p className="text-sm text-red-500">{form.formState.errors.volunteerId.message}</p>
                )}
              </div>

              {/* Seleccionar Actividad de Voluntariado */}
              <div className="space-y-2">
                <Label htmlFor="volunteerActivityId">Actividad de Voluntariado *</Label>
                <Popover open={openActivity} onOpenChange={setOpenActivity}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openActivity}
                      className="w-full justify-between"
                    >
                      {selectedActivity
                        ? `${selectedActivity.name} - ${selectedActivity.parkName || 'Sin parque'}`
                        : "Seleccionar actividad..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar actividad..." />
                      <CommandEmpty>
                        {isLoadingActivities ? "Cargando..." : "No se encontraron actividades."}
                      </CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {activities.map((activity: any) => (
                          <CommandItem
                            key={activity.id}
                            value={`${activity.name} ${activity.parkName}`}
                            onSelect={() => {
                              form.setValue('volunteerActivityId', activity.id, { shouldValidate: true });
                              setOpenActivity(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.watch('volunteerActivityId') === activity.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{activity.name}</span>
                              <span className="text-xs text-gray-500">
                                {activity.parkName} - {activity.activityDate ? format(new Date(activity.activityDate), 'PPP', { locale: es }) : 'Sin fecha'}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {form.formState.errors.volunteerActivityId && (
                  <p className="text-sm text-red-500">{form.formState.errors.volunteerActivityId.message}</p>
                )}
              </div>

              {/* Información de la actividad seleccionada */}
              {selectedActivity && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-green-800">Información de la Actividad</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-green-700">
                        {selectedActivity.activityDate 
                          ? format(new Date(selectedActivity.activityDate), 'PPPp', { locale: es })
                          : 'Fecha no definida'}
                      </span>
                    </div>
                    {selectedActivity.description && (
                      <p className="text-xs text-green-600 mt-2">{selectedActivity.description}</p>
                    )}
                    {selectedActivity.maxVolunteers && (
                      <p className="text-xs text-green-600">
                        Cupo máximo: {selectedActivity.maxVolunteers} voluntarios
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Estado de asistencia */}
              <div className="space-y-2">
                <Label htmlFor="attendanceStatus">Estado Inicial *</Label>
                <Select
                  value={form.watch('attendanceStatus')}
                  onValueChange={(value) => form.setValue('attendanceStatus', value as any, {
                    shouldValidate: true
                  })}
                >
                  <SelectTrigger id="attendanceStatus">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registered">Registrado</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="attended">Asistió (si ya ocurrió)</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.attendanceStatus && (
                  <p className="text-sm text-red-500">{form.formState.errors.attendanceStatus.message}</p>
                )}
              </div>

              {/* Horas contribuidas (opcional) */}
              <div className="space-y-2">
                <Label htmlFor="hoursContributed">Horas Contribuidas (opcional)</Label>
                <Input 
                  id="hoursContributed"
                  type="number" 
                  step="0.5"
                  min="0"
                  max="24"
                  placeholder="0.0" 
                  {...form.register('hoursContributed', { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500">
                  Puede registrar las horas ahora o actualizarlas después
                </p>
                {form.formState.errors.hoursContributed && (
                  <p className="text-sm text-red-500">{form.formState.errors.hoursContributed.message}</p>
                )}
              </div>

              {/* Notas del voluntario */}
              <div className="space-y-2">
                <Label htmlFor="volunteerNotes">Notas Iniciales (opcional)</Label>
                <Textarea 
                  id="volunteerNotes"
                  placeholder="Comentarios o notas sobre esta participación..." 
                  rows={3}
                  {...form.register('volunteerNotes')}
                />
                {form.formState.errors.volunteerNotes && (
                  <p className="text-sm text-red-500">{form.formState.errors.volunteerNotes.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation('/admin/volunteers/participations')}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || createParticipation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {(isSubmitting || createParticipation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!isSubmitting && !createParticipation.isPending && (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Registrar Participación
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ParticipationCreate;