import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import ROUTES from '@/routes';
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
import { Save, ArrowLeft, Loader2, UserPlus, Calendar as CalendarIcon, Clock, MapPin, AlertTriangle, Info, CheckCircle2, User } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/AdminLayout';
import { ReturnHeader } from '@/components/ui/return-header';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useArrayQuery } from '@/hooks/useArrayQuery';
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

/**
 * Helper para convertir arrays de PostgreSQL (que vienen como strings) a arrays JavaScript
 * Ejemplo: "{lunes,martes,miércoles}" => ["lunes", "martes", "miércoles"]
 * También maneja: '["lunes","martes"]' (JSON) o 'lunes,martes' (CSV)
 */
const parsePostgresArray = (value: any): string[] => {
  // Si ya es un array, retornar tal cual
  if (Array.isArray(value)) {
    return value;
  }

  // Si es null o undefined, retornar array vacío
  if (value == null) {
    return [];
  }

  if (typeof value === 'string') {
    // Caso 1: String de PostgreSQL array (ej: "{lunes,martes}")
    if (value.startsWith('{') && value.endsWith('}')) {
      return value
        .slice(1, -1) // Remover { }
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }

    // Caso 2: String JSON array (ej: '["lunes","martes"]')
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item).trim());
        }
      } catch (e) {
        console.warn('Failed to parse JSON array:', value);
      }
    }

    // Caso 3: String simple separado por comas (ej: "lunes,martes")
    if (value.includes(',')) {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }

    // Caso 4: String único (ej: "lunes")
    if (value.length > 0) {
      return [value.trim()];
    }
  }

  return [];
};

const ParticipationCreate: React.FC = () => {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openVolunteer, setOpenVolunteer] = useState(false);
  const [openActivity, setOpenActivity] = useState(false);

  // 🎯 NUEVO: Leer parámetro activityId de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedActivityId = urlParams.get('activityId');
  const preselectedVolunteerId = urlParams.get('volunteerId');
  
  // Fetch volunteers usando useArrayQuery
  const { data: volunteersData = [], isLoading: isLoadingVolunteers } = useArrayQuery(
    '/api/volunteers'
  );

  // Asegurar que siempre sea un array
  const volunteers = Array.isArray(volunteersData) ? volunteersData : [];

  // Fetch volunteer activities usando useArrayQuery
  const { data: activitiesData = [], isLoading: isLoadingActivities } = useArrayQuery(
    '/api/volunteer-activities',
    'data'
  );

  // Asegurar que siempre sea un array
  const activities = Array.isArray(activitiesData) ? activitiesData : [];

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

  // NUEVO: Preseleccionar voluntario si viene en la URL
  useEffect(() => {
    if (preselectedVolunteerId && volunteers.length > 0) {
      const volunteerId = parseInt(preselectedVolunteerId);
      const volunteerExists = volunteers.find((v: any) => v.id === volunteerId);

     if (volunteerExists) {
        console.log('✅ Precargando voluntario:', volunteerId);
        form.setValue('volunteerId', volunteerId, { shouldValidate: true });
        setOpenVolunteer(false); // Cerrar el popover si estaba abierto
     }
    }
  }, [preselectedVolunteerId, volunteers, form]);

  // Preseleccionar actividad si viene en la URL
  useEffect(() => {
    if (preselectedActivityId && activities.length > 0) {
      const activityId = parseInt(preselectedActivityId);
      const activityExists = activities.find((a: any) => a.id === activityId);

      if (activityExists) {
        console.log('✅ Precargando actividad:', activityId);
        form.setValue('volunteerActivityId', activityId, { shouldValidate: true });
        setOpenActivity(false); // Cerrar el popover si estaba abierto
      }
    }
  }, [preselectedActivityId, activities, form]);
  
  // Create participation mutation
  const createParticipation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest(`/api/volunteers/${data.volunteerId}/participations`, {
        method: 'POST',
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
      setLocation(ROUTES.admin.volunteers.participations.list);
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

  // Get selected volunteer info - USANDO EL HELPER PARA PARSEAR ARRAYS
  const selectedVolunteer = Array.isArray(volunteers) 
    ? volunteers.find((v: any) => v.id === form.watch('volunteerId'))
    : null;

  // Parsear los arrays del voluntario seleccionado
  const volunteerAvailableDays = selectedVolunteer ? parsePostgresArray(selectedVolunteer.available_days) : [];
  const volunteerInterestAreas = selectedVolunteer ? parsePostgresArray(selectedVolunteer.interest_areas) : [];

  // Get selected activity info
  const selectedActivity = Array.isArray(activities)
    ? activities.find((a: any) => a.id === form.watch('volunteerActivityId'))
    : null;

  // Fetch current participation count for selected activity
  const { data: activityParticipations = [] } = useArrayQuery(
    selectedActivity ? `/api/volunteer-activities/${selectedActivity.id}/participations` : null,
    'data'
  );

  // Calcular cupo disponible
  const currentParticipants = Array.isArray(activityParticipations) ? activityParticipations.length : 0;
  const maxVolunteers = selectedActivity?.maxVolunteers || 0;
  const availableSlots = maxVolunteers - currentParticipants;
  const isFull = maxVolunteers > 0 && currentParticipants >= maxVolunteers;

  // Helper: Obtener día de la semana en español
  const getDayName = (date: Date) => {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return days[date.getDay()];
  };

  // Helper: Traducir categorías
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      maintenance: 'Mantenimiento',
      events: 'Eventos',
      education: 'Educación',
      sports: 'Deportes',
      cultural: 'Cultural',
      nature: 'Naturaleza',
      other: 'Otro',
    };
    return labels[category] || category;
  };

  // Validar compatibilidad del voluntario con la actividad
  const validateCompatibility = () => {
    if (!selectedVolunteer || !selectedActivity) return null;

    const warnings: string[] = [];
    const infos: string[] = [];
    const errors: string[] = [];

    // VALIDACIÓN CRÍTICA: Verificar cupo disponible
    if (isFull) {
      errors.push(`Esta actividad ya alcanzó su cupo máximo (${maxVolunteers} voluntarios)`);
    } else if (maxVolunteers > 0) {
      infos.push(`✓ Cupo disponible: ${availableSlots} de ${maxVolunteers} lugares`);
    }

    // Verificar día disponible - USANDO LOS ARRAYS PARSEADOS
    if (selectedActivity.activityDate && volunteerAvailableDays.length > 0) {
      const activityDay = getDayName(new Date(selectedActivity.activityDate));

      console.log('🔍 Validando disponibilidad:', {
        activityDay,
        availableDays: volunteerAvailableDays,
        includes: volunteerAvailableDays.includes(activityDay)
      });

      if (!volunteerAvailableDays.includes(activityDay)) {
        warnings.push(`El voluntario no está disponible los ${activityDay}s`);
      } else {
        infos.push(`✓ Disponible los ${activityDay}s`);
      }
    }

    // Verificar área de interés - USANDO LOS ARRAYS PARSEADOS
    if (selectedActivity.category && volunteerInterestAreas.length > 0) {
      console.log('🔍 Validando área de interés:', {
        activityCategory: selectedActivity.category,
        interestAreas: volunteerInterestAreas,
        includes: volunteerInterestAreas.includes(selectedActivity.category)
      });

      if (!volunteerInterestAreas.includes(selectedActivity.category)) {
        warnings.push(`Esta actividad (${getCategoryLabel(selectedActivity.category)}) no está en sus áreas de interés`);
      } else {
        infos.push(`✓ Interesado en ${getCategoryLabel(selectedActivity.category)}`);
      }
    }

    return { warnings, infos, errors };
  };

  const compatibility = validateCompatibility();

  return (
    <AdminLayout>
      <div className="mx-auto">
        <ReturnHeader />
        <div className="flex justify-between items-center mt-2 mb-6">
          <h1 className="text-3xl font-bold">Registrar Nueva Participación</h1>
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
                        {Array.isArray(volunteers) && volunteers.map((volunteer: any) => (
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

              {/* Información del voluntario seleccionado */}
              {selectedVolunteer && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Información del Voluntario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Avatar y nombre */}
                    <div className="flex items-center gap-3">
                      {selectedVolunteer.profileImageUrl || selectedVolunteer.profile_image_url ? (
                        <img
                          src={selectedVolunteer.profileImageUrl || selectedVolunteer.profile_image_url}
                          alt={selectedVolunteer.fullName || selectedVolunteer.full_name}
                          className="h-12 w-12 rounded-full object-cover border-2 border-blue-300"
                          onError={(e) => {
                            // Fallback a inicial si la imagen falla
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div 
                        className={cn(
                          "h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg",
                          (selectedVolunteer.profileImageUrl || selectedVolunteer.profile_image_url) && "hidden"
                        )}
                      >
                        {(selectedVolunteer.fullName || selectedVolunteer.full_name || 'V').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">
                          {selectedVolunteer.fullName || selectedVolunteer.full_name}
                        </p>
                        <p className="text-xs text-blue-600">{selectedVolunteer.email}</p>
                      </div>
                    </div>

                    {/* Disponibilidad - USANDO ARRAYS PARSEADOS */}
                    {volunteerAvailableDays.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-blue-700">Días disponibles:</p>
                        <div className="flex flex-wrap gap-1">
                          {volunteerAvailableDays.map((day: string) => (
                            <Badge key={day} variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 capitalize">
                              {day}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Horarios */}
                    {selectedVolunteer.available_hours && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Horario disponible:
                        </p>
                        <p className="text-xs text-blue-600">{selectedVolunteer.available_hours}</p>
                      </div>
                    )}

                    {/* Áreas de interés - USANDO ARRAYS PARSEADOS */}
                    {volunteerInterestAreas.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-blue-700">Áreas de interés:</p>
                        <div className="flex flex-wrap gap-1">
                          {volunteerInterestAreas.map((area: string) => (
                            <Badge key={area} variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                              {getCategoryLabel(area)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experiencia previa */}
                    {selectedVolunteer.previous_experience && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-blue-700">Experiencia previa:</p>
                        <p className="text-xs text-blue-600">{selectedVolunteer.previous_experience}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

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
                        {Array.isArray(activities) && activities.map((activity: any) => (
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
                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-green-700">
                        {selectedActivity.activityDate 
                          ? format(new Date(selectedActivity.activityDate), 'PPPp', { locale: es })
                          : 'Fecha no definida'}
                      </span>
                    </div>

                    {/* Información de cupo */}
                    {maxVolunteers > 0 && (
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2 text-green-600" />
                        <span className={cn(
                          "font-semibold",
                          isFull ? "text-red-600" : "text-green-700"
                        )}>
                          {isFull 
                            ? `Cupo completo (${currentParticipants}/${maxVolunteers})`
                            : `Cupo disponible: ${availableSlots} de ${maxVolunteers}`
                          }
                        </span>
                      </div>
                    )}

                    {selectedActivity.description && (
                      <p className="text-xs text-green-600 mt-2">{selectedActivity.description}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Alertas de compatibilidad */}
              {compatibility && selectedVolunteer && selectedActivity && (
                <>
                  {/* ERRORES CRÍTICOS - BLOQUEAN EL REGISTRO */}
                  {compatibility.errors && compatibility.errors.length > 0 && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-800">No se puede registrar</AlertTitle>
                      <AlertDescription className="text-red-700">
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          {compatibility.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                        <p className="text-xs mt-2 font-semibold">No es posible continuar con el registro.</p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Advertencias - NO bloquean el registro */}
                  {compatibility.warnings.length > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Advertencias de Compatibilidad</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          {compatibility.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                        <p className="text-xs mt-2">Puedes continuar, pero considera estas incompatibilidades.</p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Información positiva */}
                  {compatibility.infos.length > 0 && compatibility.warnings.length === 0 && (!compatibility.errors || compatibility.errors.length === 0) && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Compatibilidad Verificada</AlertTitle>
                      <AlertDescription className="text-green-700">
                        <ul className="list-none space-y-1 mt-2">
                          {compatibility.infos.map((info, index) => (
                            <li key={index}>{info}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
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
                onClick={() => setLocation(ROUTES.admin.volunteers.participations.list)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                variant="default"
                disabled={
                  isSubmitting || 
                  createParticipation.isPending || 
                  (compatibility?.errors && compatibility.errors.length > 0)
                }
              >
                {(isSubmitting || createParticipation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!isSubmitting && !createParticipation.isPending && (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Registrar
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ParticipationCreate;