import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Schema de validación para el formulario público
const publicEvaluationSchema = z.object({
  evaluatorName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  evaluatorEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  evaluatorCity: z.string().max(100).optional().or(z.literal("")),
  overallRating: z.number().min(1, "Calificación mínima: 1").max(5, "Calificación máxima: 5"),
  knowledgeRating: z.number().min(1).max(5),
  patienceRating: z.number().min(1).max(5),
  clarityRating: z.number().min(1).max(5),
  punctualityRating: z.number().min(1).max(5),
  wouldRecommend: z.boolean(),
  comments: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  attendedActivity: z.string().max(255).optional().or(z.literal("")),
});

type PublicEvaluationForm = z.infer<typeof publicEvaluationSchema>;

interface PublicInstructorEvaluationFormProps {
  instructorId: number;
  instructorName: string;
  onSuccess?: () => void;
}

// Componente para selección de estrellas
const StarRating = ({ 
  value, 
  onChange, 
  label 
}: { 
  value: number; 
  onChange: (rating: number) => void;
  label: string;
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1 rounded transition-colors hover:bg-gray-100"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onChange(star)}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hoverRating || value)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-500">
        {value > 0 ? `${value}/5 estrellas` : 'Selecciona una calificación'}
      </div>
    </div>
  );
};

export default function PublicInstructorEvaluationForm({ 
  instructorId, 
  instructorName, 
  onSuccess 
}: PublicInstructorEvaluationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<PublicEvaluationForm>({
    resolver: zodResolver(publicEvaluationSchema),
    defaultValues: {
      evaluatorName: '',
      evaluatorEmail: '',
      evaluatorCity: '',
      overallRating: 0,
      knowledgeRating: 0,
      patienceRating: 0,
      clarityRating: 0,
      punctualityRating: 0,
      wouldRecommend: false,
      comments: '',
      attendedActivity: '',
    },
  });

  const submitEvaluation = useMutation({
    mutationFn: async (data: PublicEvaluationForm) => {
      // Limpiar campos vacíos opcionales
      const cleanData = {
        ...data,
        evaluatorEmail: data.evaluatorEmail || undefined,
        evaluatorCity: data.evaluatorCity || undefined,
        comments: data.comments || undefined,
        attendedActivity: data.attendedActivity || undefined,
      };

      return apiRequest(`/api/public/instructors/${instructorId}/evaluations`, {
        method: 'POST',
        data: cleanData,
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      
      // Invalidar las queries de evaluaciones para actualizar las estadísticas
      queryClient.invalidateQueries({ 
        queryKey: [`/api/public/instructors/${instructorId}/evaluations`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/public/instructors/${instructorId}/evaluation-stats`] 
      });

      toast({
        title: "Evaluación enviada",
        description: "Tu evaluación será revisada antes de publicarse. ¡Gracias por tu participación!",
      });

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      console.error('Error al enviar evaluación:', error);
      toast({
        title: "Error al enviar evaluación",
        description: error.message || "Hubo un problema al enviar tu evaluación. Inténtalo nuevamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PublicEvaluationForm) => {
    submitEvaluation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              ¡Evaluación Enviada!
            </h3>
            <p className="text-green-700 mb-4">
              Tu evaluación de <strong>{instructorName}</strong> ha sido enviada exitosamente.
            </p>
            <p className="text-sm text-green-600">
              Será revisada por nuestro equipo antes de publicarse. 
              ¡Gracias por ayudar a mejorar nuestros servicios!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">
          Evalúa a {instructorName}
        </CardTitle>
        <CardDescription>
          Tu opinión nos ayuda a mejorar la calidad de nuestros instructores. 
          Todas las evaluaciones son revisadas antes de publicarse.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Información del evaluador */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Información personal</h4>
              
              <FormField
                control={form.control}
                name="evaluatorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Tu nombre completo" 
                        autoComplete="off"
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
                  name="evaluatorEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="tu@email.com" 
                          autoComplete="off"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="evaluatorCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Guadalajara" 
                          autoComplete="off"
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
                name="attendedActivity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actividad que tomaste (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Clase de yoga, Aqua aeróbicos, etc." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Calificaciones */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Calificaciones *</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="overallRating"
                  render={({ field }) => (
                    <FormItem>
                      <StarRating
                        label="Calificación general"
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="knowledgeRating"
                  render={({ field }) => (
                    <FormItem>
                      <StarRating
                        label="Conocimiento"
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="patienceRating"
                  render={({ field }) => (
                    <FormItem>
                      <StarRating
                        label="Paciencia"
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clarityRating"
                  render={({ field }) => (
                    <FormItem>
                      <StarRating
                        label="Claridad al explicar"
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="punctualityRating"
                  render={({ field }) => (
                    <FormItem>
                      <StarRating
                        label="Puntualidad"
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Recomendación */}
            <FormField
              control={form.control}
              name="wouldRecommend"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">
                      ¿Recomendarías este instructor a otros?
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Comentarios */}
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentarios adicionales (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cuéntanos sobre tu experiencia con este instructor..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-gray-500">
                    {field.value?.length || 0}/500 caracteres
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Aviso de moderación */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Moderación de contenido</p>
                  <p>
                    Todas las evaluaciones son revisadas por nuestro equipo antes de publicarse 
                    para garantizar un ambiente respetuoso y constructivo.
                  </p>
                </div>
              </div>
            </div>

            {/* Botón de envío */}
            <Button
              type="submit"
              disabled={submitEvaluation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {submitEvaluation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando evaluación...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar evaluación
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}