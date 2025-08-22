import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Building, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Spinner } from '@/components/Spinner';

// Esquema de validación para el formulario
const evaluationFormSchema = z.object({
  overallRating: z.number().min(1).max(5),
  knowledgeRating: z.number().min(1).max(5),
  patienceRating: z.number().min(1).max(5),
  clarityRating: z.number().min(1).max(5),
  punctualityRating: z.number().min(1).max(5),
  comments: z.string().optional(),
});

type EvaluationFormValues = z.infer<typeof evaluationFormSchema>;

interface InstructorEvaluationFormProps {
  instructorId: number;
  assignmentId: number;
  evaluationType?: 'participant' | 'supervisor' | 'self';
  onClose: () => void;
  onSuccess: () => void;
}

export default function InstructorEvaluationForm({
  instructorId,
  assignmentId,
  evaluationType = 'supervisor',
  onClose,
  onSuccess,
}: InstructorEvaluationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Obtener información del instructor
  const { data: instructor, isLoading: isLoadingInstructor } = useQuery({
    queryKey: [`/api/instructors/${instructorId}`],
    enabled: !!instructorId,
  });
  
  // Obtener información de la asignación
  const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: [`/api/instructors/assignments/${assignmentId}`],
    enabled: !!assignmentId,
  });
  
  // Crear formulario
  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: {
      overallRating: 0,
      knowledgeRating: 0,
      patienceRating: 0,
      clarityRating: 0,
      punctualityRating: 0,
      comments: '',
    },
  });
  
  // Mutación para enviar la evaluación
  const mutation = useMutation({
    mutationFn: async (data: EvaluationFormValues) => {
      const response = await fetch(`/api/instructors/${instructorId}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-User-Id': localStorage.getItem('userId') || '',
          'X-User-Role': localStorage.getItem('userRole') || '',
        },
        body: JSON.stringify({
          ...data,
          assignmentId,
          evaluationType,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error al enviar la evaluación');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Evaluación enviada',
        description: 'La evaluación se ha enviado correctamente.',
        variant: 'default',
      });
      
      // Invalidar consultas relacionadas para refrescar datos
      queryClient.invalidateQueries({ queryKey: [`/api/instructors/${instructorId}/evaluations`] });
      queryClient.invalidateQueries({ queryKey: ['/api/instructors-evaluations'] });
      
      onSuccess();
    },
    onError: (error) => {
      console.error('Error al enviar evaluación:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la evaluación. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    },
  });
  
  const handleRatingChange = (field: keyof EvaluationFormValues, rating: number) => {
    form.setValue(field, rating);
  };
  
  const onSubmit = (data: EvaluationFormValues) => {
    mutation.mutate(data);
  };

  const isLoading = isLoadingInstructor || isLoadingAssignment;
  const instructorName = instructor?.full_name || instructor?.fullName || 'Instructor';
  const activityName = assignment?.activityTitle || assignment?.title || 'Actividad';

  // Renderizar estrellas para calificación
  const RatingStars = ({ value, onChange, name }: { value: number, onChange: (value: number) => void, name: string }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={`${name}-${star}`}
            type="button"
            className={`h-8 w-8 focus:outline-none ${
              star <= value
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-gray-400'
            }`}
            onClick={() => onChange(star)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-full h-full"
            >
              <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-gray-600">{value} de 5</span>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Evaluación de Instructor</CardTitle>
        <CardDescription>
          Evalúa el desempeño del instructor en la actividad
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Información de contexto */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={instructor?.profileImageUrl || instructor?.profile_image_url} alt={instructorName} />
                    <AvatarFallback>{instructorName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-lg">{instructorName}</h3>
                    <p className="text-sm text-gray-500">
                      {instructor?.specialties || instructor?.especialidades || 'Instructor'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {assignment?.startDate ? 
                        format(new Date(assignment.startDate), 'PPP', { locale: es }) : 
                        'Fecha no disponible'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {assignment?.startTime ? assignment.startTime : 'Hora no disponible'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {activityName}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {assignment?.parkName || 'Ubicación no disponible'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Criterios de evaluación */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="overallRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calificación general</FormLabel>
                      <FormControl>
                        <RatingStars 
                          value={field.value} 
                          onChange={(rating) => handleRatingChange('overallRating', rating)} 
                          name="overallRating"
                        />
                      </FormControl>
                      <FormDescription>
                        Evalúa la impresión general y efectividad del instructor.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="knowledgeRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conocimiento del tema</FormLabel>
                      <FormControl>
                        <RatingStars 
                          value={field.value} 
                          onChange={(rating) => handleRatingChange('knowledgeRating', rating)} 
                          name="knowledgeRating"
                        />
                      </FormControl>
                      <FormDescription>
                        Evalúa el dominio y profundidad de conocimiento mostrado sobre la materia.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="patienceRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paciencia</FormLabel>
                      <FormControl>
                        <RatingStars 
                          value={field.value} 
                          onChange={(rating) => handleRatingChange('patienceRating', rating)} 
                          name="patienceRating"
                        />
                      </FormControl>
                      <FormDescription>
                        Evalúa la paciencia y comprensión del instructor hacia los participantes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="clarityRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Claridad al explicar</FormLabel>
                      <FormControl>
                        <RatingStars 
                          value={field.value} 
                          onChange={(rating) => handleRatingChange('clarityRating', rating)} 
                          name="clarityRating"
                        />
                      </FormControl>
                      <FormDescription>
                        Evalúa la claridad y efectividad en las explicaciones del instructor.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="punctualityRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puntualidad</FormLabel>
                      <FormControl>
                        <RatingStars 
                          value={field.value} 
                          onChange={(rating) => handleRatingChange('punctualityRating', rating)} 
                          name="punctualityRating"
                        />
                      </FormControl>
                      <FormDescription>
                        Evalúa la puntualidad y el cumplimiento de horarios del instructor.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comentarios adicionales</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ingresa comentarios adicionales sobre el desempeño del instructor..."
                          className="resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Proporciona feedback específico, sugerencias o observaciones.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending || !form.formState.isValid}
                >
                  {mutation.isPending ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar evaluación'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}