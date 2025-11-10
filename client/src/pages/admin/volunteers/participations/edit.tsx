import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
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
import { Save, ArrowLeft, Loader2, Clock, CheckCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { ReturnHeader } from '@/components/ui/return-header';
import { queryClient, apiRequest } from '@/lib/queryClient';

// Schema de validación para edición de participaciones
const participationSchema = z.object({
  attendanceStatus: z.enum(['registered', 'confirmed', 'attended', 'absent', 'cancelled']),
  hoursContributed: z.coerce.number().min(0).max(24).optional().nullable(),
  checkInTime: z.string().optional().nullable(),
  checkOutTime: z.string().optional().nullable(),
  volunteerNotes: z.string().optional().nullable(),
  supervisorNotes: z.string().optional().nullable(),
  rating: z.coerce.number().min(1).max(5).optional().nullable(),
});

type FormValues = z.infer<typeof participationSchema>;

const ParticipationEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch participation data
  const { data: participation, isLoading: isLoadingParticipation } = useQuery({
    queryKey: [`/api/participations/${id}`],
    enabled: !!id,
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(participationSchema),
    defaultValues: {
      attendanceStatus: 'registered',
      hoursContributed: null,
      checkInTime: null,
      checkOutTime: null,
      volunteerNotes: '',
      supervisorNotes: '',
      rating: null,
    },
    values: participation ? {
      attendanceStatus: participation.attendanceStatus || 'registered',
      hoursContributed: participation.hoursContributed || null,
      // ✅ Extraer hora directamente del string sin conversión de zona horaria
      checkInTime: participation.checkInTime 
        ? participation.checkInTime.split('T')[1]?.substring(0, 5) 
        : null,
      checkOutTime: participation.checkOutTime 
        ? participation.checkOutTime.split('T')[1]?.substring(0, 5) 
        : null,
      volunteerNotes: participation.volunteerNotes || '',
      supervisorNotes: participation.supervisorNotes || '',
      rating: participation.rating || null,
    } : undefined,
  });

  // 🎯 NUEVO: Calcular horas automáticamente cuando cambien los tiempos
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Solo calcular si cambiaron checkInTime o checkOutTime
      if (name === 'checkInTime' || name === 'checkOutTime') {
        const checkIn = value.checkInTime;
        const checkOut = value.checkOutTime;

        // Verificar que ambos tiempos estén completos
        if (checkIn && checkOut && checkIn.length === 5 && checkOut.length === 5) {
          const [inHours, inMinutes] = checkIn.split(':').map(Number);
          const [outHours, outMinutes] = checkOut.split(':').map(Number);

          // Convertir a minutos totales
          const checkInMinutes = inHours * 60 + inMinutes;
          let checkOutMinutes = outHours * 60 + outMinutes;

          // Si checkout es menor que checkin, asumimos que cruzó medianoche
          if (checkOutMinutes < checkInMinutes) {
            checkOutMinutes += 24 * 60; // Agregar 24 horas en minutos
          }

          // Calcular diferencia en horas (con decimales)
          const diffMinutes = checkOutMinutes - checkInMinutes;
          const hours = diffMinutes / 60;

          // Redondear a 0.5 horas (ej: 2.3 → 2.5, 2.7 → 2.5, 2.8 → 3.0)
          const roundedHours = Math.round(hours * 2) / 2;

          // Solo actualizar si es un valor válido (positivo y máximo 24 horas)
          if (roundedHours > 0 && roundedHours <= 24) {
            form.setValue('hoursContributed', roundedHours, { shouldValidate: false });
            console.log(`⏱️ Horas calculadas: ${checkIn} - ${checkOut} = ${roundedHours} horas`);
          } else if (roundedHours > 24) {
            // Si es más de 24 horas, avisar al usuario
            toast({
              title: 'Advertencia',
              description: 'El tiempo calculado excede 24 horas. Por favor verifica los horarios.',
              variant: 'destructive',
            });
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, toast]);

  // Update participation mutation
  const updateParticipation = useMutation({
    mutationFn: (data: FormValues) => {
      // Convertir tiempos a timestamps SIN zona horaria (hora local)
      const payload = {
        ...data,
        checkInTime: data.checkInTime && participation?.activityDate 
          ? `${participation.activityDate.split('T')[0]}T${data.checkInTime}:00`
          : null,
        checkOutTime: data.checkOutTime && participation?.activityDate 
          ? `${participation.activityDate.split('T')[0]}T${data.checkOutTime}:00`
          : null,
      };

      return apiRequest(`/api/participations/${id}`, {
        method: 'PUT',
        data: payload,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Participación actualizada',
        description: 'Los datos se han guardado correctamente.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/participations/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/participations/all'] });
      queryClient.invalidateQueries({ queryKey: [`/api/volunteers/${participation?.volunteerId}/participations`] });
      setLocation(ROUTES.admin.volunteers.participations.list);
    },
    onError: (error) => {
      console.error('Error al actualizar participación:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la participación. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await updateParticipation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingParticipation) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-10 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">Cargando datos de la participación...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!participation) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-10 text-center">
          <p className="text-red-500">No se encontró la participación solicitada.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setLocation(ROUTES.admin.volunteers.participations.list)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al listado
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <ReturnHeader />
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Editar Participación</h1>
        </div>

        {/* Información contextual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-800">Voluntario</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-blue-900">{participation.volunteerName}</p>
              <p className="text-sm text-blue-700">{participation.volunteerEmail}</p>
              <p className="text-xs text-blue-600 mt-1">ID: {participation.volunteerId}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-800">Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-green-900">{participation.activityName}</p>
              <p className="text-sm text-green-700">{participation.parkName}</p>
              <p className="text-xs text-green-600 mt-1">
                {format(new Date(participation.activityDate), 'PPP', { locale: es })}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Datos de la Participación</CardTitle>
            <CardDescription>
              Edite los detalles de la participación del voluntario en esta actividad.
            </CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Estado de asistencia */}
              <div className="space-y-2">
                <Label htmlFor="attendanceStatus">Estado de Asistencia *</Label>
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
                    <SelectItem value="attended">Asistió</SelectItem>
                    <SelectItem value="absent">Ausente</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.attendanceStatus && (
                  <p className="text-sm text-red-500">{form.formState.errors.attendanceStatus.message}</p>
                )}
              </div>

              {/* Horas y tiempos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkInTime">Hora de Entrada</Label>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <Input 
                      id="checkInTime"
                      type="time" 
                      {...form.register('checkInTime')}
                    />
                  </div>
                  {form.formState.errors.checkInTime && (
                    <p className="text-sm text-red-500">{form.formState.errors.checkInTime.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkOutTime">Hora de Salida</Label>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <Input 
                      id="checkOutTime"
                      type="time" 
                      {...form.register('checkOutTime')}
                    />
                  </div>
                  {form.formState.errors.checkOutTime && (
                    <p className="text-sm text-red-500">{form.formState.errors.checkOutTime.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hoursContributed">Horas Contribuidas</Label>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-gray-500 mr-2" />
                    <Input 
                      id="hoursContributed"
                      type="number" 
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="0.0" 
                      {...form.register('hoursContributed', { valueAsNumber: true })}
                    />
                  </div>
                  {form.formState.errors.hoursContributed && (
                    <p className="text-sm text-red-500">{form.formState.errors.hoursContributed.message}</p>
                  )}
                </div>
              </div>

              {/* Calificación */}
              <div className="space-y-2">
                <Label htmlFor="rating">Calificación (1-5 estrellas)</Label>
                <Select
                  value={form.watch('rating')?.toString() || '0'}
                  onValueChange={(value) => {
                    const numValue = parseInt(value);
                    form.setValue('rating', numValue === 0 ? null : numValue, {
                      shouldValidate: true
                    });
                  }}
                >
                  <SelectTrigger id="rating">
                    <SelectValue placeholder="Seleccionar calificación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sin calificación</SelectItem>
                    <SelectItem value="1">⭐ 1 estrella</SelectItem>
                    <SelectItem value="2">⭐⭐ 2 estrellas</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ 3 estrellas</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ 4 estrellas</SelectItem>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ 5 estrellas</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.rating && (
                  <p className="text-sm text-red-500">{form.formState.errors.rating.message}</p>
                )}
              </div>

              {/* Notas del voluntario */}
              <div className="space-y-2">
                <Label htmlFor="volunteerNotes">Notas del Voluntario</Label>
                <Textarea 
                  id="volunteerNotes"
                  placeholder="Comentarios o reflexiones del voluntario sobre la actividad..." 
                  rows={3}
                  {...form.register('volunteerNotes')}
                />
                {form.formState.errors.volunteerNotes && (
                  <p className="text-sm text-red-500">{form.formState.errors.volunteerNotes.message}</p>
                )}
              </div>

              {/* Notas del supervisor */}
              <div className="space-y-2">
                <Label htmlFor="supervisorNotes">Notas del Supervisor</Label>
                <Textarea 
                  id="supervisorNotes"
                  placeholder="Observaciones del supervisor sobre el desempeño del voluntario..." 
                  rows={3}
                  {...form.register('supervisorNotes')}
                />
                {form.formState.errors.supervisorNotes && (
                  <p className="text-sm text-red-500">{form.formState.errors.supervisorNotes.message}</p>
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
                disabled={isSubmitting || updateParticipation.isPending}
              >
                {(isSubmitting || updateParticipation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!isSubmitting && !updateParticipation.isPending && (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Cambios
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ParticipationEdit;