import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Star, StarIcon, MapPin, Clock, User, MessageCircle, Send, CheckCircle, ArrowLeft } from 'lucide-react';

const evaluationSchema = z.object({
  parkId: z.number(),
  evaluatorName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  evaluatorEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  evaluatorPhone: z.string().optional(),
  evaluatorCity: z.string().optional(),
  evaluatorAge: z.number().min(13, "Edad mínima: 13 años").max(120, "Edad máxima: 120 años").optional(),
  isFrequentVisitor: z.boolean().optional(),
  
  // Criterios de evaluación (0-5, donde 0 = sin calificar)
  cleanliness: z.number().min(0).max(5),
  safety: z.number().min(0).max(5),
  maintenance: z.number().min(0).max(5),
  accessibility: z.number().min(0).max(5),
  amenities: z.number().min(0).max(5),
  activities: z.number().min(0).max(5),
  staff: z.number().min(0).max(5),
  naturalBeauty: z.number().min(0).max(5),
  overallRating: z.number().min(0).max(5),
  
  // Información adicional
  comments: z.string().optional(),
  suggestions: z.string().optional(),
  wouldRecommend: z.boolean().optional(),
  visitDate: z.string().optional(),
  visitPurpose: z.string().optional(),
  visitDuration: z.number().min(1).optional(),
});

type EvaluationFormData = z.infer<typeof evaluationSchema>;

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

const StarRating = ({ value, onChange, label }: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1 transition-colors hover:bg-gray-100 rounded"
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange(star)}
          >
            <Star
              className={`h-6 w-6 ${
                star <= (hoverValue || value) 
                  ? 'text-yellow-500 fill-yellow-500' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="text-sm text-gray-600 ml-2">
          {value > 0 ? `${value}/5` : 'Sin calificar'}
        </span>
      </div>
    </div>
  );
};

export default function ParkEvaluationForm() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Extraer parkId
  const parkId = id;

  // Obtener información del parque
  const { data: parkData, isLoading: parkLoading } = useQuery({
    queryKey: ['/api/parks', parkId, 'extended'],
    queryFn: () => apiRequest(`/api/parks/${parkId}/extended`),
    enabled: !!parkId,
  });

  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      parkId: parkId ? parseInt(parkId) : 0,
      evaluatorName: "",
      evaluatorEmail: "",
      evaluatorPhone: "",
      evaluatorCity: "",
      isFrequentVisitor: false,
      cleanliness: 0,
      safety: 0,
      maintenance: 0,
      accessibility: 0,
      amenities: 0,
      activities: 0,
      staff: 0,
      naturalBeauty: 0,
      overallRating: 0,
      comments: "",
      suggestions: "",
      wouldRecommend: true,
      visitDate: "",
      visitPurpose: "",
    },
  });

  const createEvaluation = useMutation({
    mutationFn: async (evaluationData: EvaluationFormData) => {
      console.log('🚀 MUTATION: Iniciando envío de evaluación');
      console.log('🚀 MUTATION: Datos recibidos:', JSON.stringify(evaluationData, null, 2));

      const response = await apiRequest('/api/park-evaluations', {
        method: 'POST',
        data: evaluationData,
      });

      // Si la respuesta es HTML (error del servidor), lanza excepción
      if (typeof response === 'string' && response.startsWith('<!DOCTYPE')) {
        throw new Error('Respuesta HTML inesperada del servidor');
      }

      // Si la respuesta es vacía (204), también lanza excepción
      if (!response || (typeof response === 'object' && Object.keys(response).length === 0)) {
        throw new Error('Respuesta vacía del servidor');
      }

      return response;
    },
    onSuccess: (data) => {
      console.log('✅ MUTATION SUCCESS:', data);
      setIsSubmitted(true);
      toast({
        title: "¡Evaluación enviada!",
        description: "Tu evaluación ha sido enviada exitosamente. Será revisada antes de publicarse.",
      });
    },
    onError: (error) => {
      console.error('❌ MUTATION ERROR:', error);
      toast({
        title: "Error al enviar evaluación",
        description: "Hubo un problema al enviar tu evaluación. Inténtalo nuevamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EvaluationFormData) => {
    // Validar que al menos una calificación esté dada
    const allRatings = [
      data.cleanliness, data.safety, data.maintenance, data.accessibility,
      data.amenities, data.activities, data.staff, data.naturalBeauty, data.overallRating
    ];
    
    // Verificar que al menos una calificación esté completa (>0)
    if (allRatings.every(rating => rating === 0)) {
      toast({
        title: "Calificación requerida",
        description: "Por favor, califica al menos un aspecto del parque.",
        variant: "destructive",
      });
      return;
    }

    // Procesar datos - solo incluir campos con valores válidos
    const processedData: any = {
      parkId: data.parkId,
      evaluatorName: data.evaluatorName,
      isFrequentVisitor: data.isFrequentVisitor || false,
      wouldRecommend: data.wouldRecommend !== undefined ? data.wouldRecommend : true,
    };

    // Solo incluir calificaciones que no sean 0
    const ratingsData = {
      cleanliness: data.cleanliness,
      safety: data.safety,
      maintenance: data.maintenance,
      accessibility: data.accessibility,
      amenities: data.amenities,
      activities: data.activities,
      staff: data.staff,
      naturalBeauty: data.naturalBeauty,
      overallRating: data.overallRating,
    };

    // Filtrar y agregar solo calificaciones válidas (>0)
    Object.entries(ratingsData).forEach(([key, value]) => {
      if (value > 0) {
        processedData[key] = value;
      }
    });

    // Solo incluir campos opcionales si tienen valores válidos
    if (data.evaluatorEmail && data.evaluatorEmail.trim() !== '') {
      processedData.evaluatorEmail = data.evaluatorEmail;
    }
    if (data.evaluatorPhone && data.evaluatorPhone.trim() !== '') {
      processedData.evaluatorPhone = data.evaluatorPhone;
    }
    if (data.evaluatorCity && data.evaluatorCity.trim() !== '') {
      processedData.evaluatorCity = data.evaluatorCity;
    }
    if (data.evaluatorAge && data.evaluatorAge > 0) {
      processedData.evaluatorAge = data.evaluatorAge;
    }
    if (data.comments && data.comments.trim() !== '') {
      processedData.comments = data.comments;
    }
    if (data.suggestions && data.suggestions.trim() !== '') {
      processedData.suggestions = data.suggestions;
    }
    if (data.visitDate && data.visitDate.trim() !== '') {
      processedData.visitDate = data.visitDate;
    }
    if (data.visitPurpose && data.visitPurpose.trim() !== '') {
      processedData.visitPurpose = data.visitPurpose;
    }
    if (data.visitDuration && data.visitDuration > 0) {
      processedData.visitDuration = data.visitDuration;
    }

    console.log('📝 Datos procesados a enviar:', JSON.stringify(processedData, null, 2));
    
    // Validación adicional antes del envío
    if (!processedData.parkId || !processedData.evaluatorName) {
      console.error('❌ Datos insuficientes para enviar evaluación:', processedData);
      toast({
        title: "Error en los datos",
        description: "Faltan datos requeridos para enviar la evaluación.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('✅ Enviando evaluación con datos válidos...');
    createEvaluation.mutate(processedData);
  };

  if (parkLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del parque...</p>
        </div>
      </div>
    );
  }

  if (!parkData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Parque no encontrado</h2>
            <p className="text-gray-600 mb-4">
              No se pudo encontrar el parque especificado.
            </p>
            <Button onClick={() => navigate('/parks')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a parques
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">¡Evaluación enviada!</h2>
            <p className="text-gray-600 mb-4">
              Gracias por tu opinión sobre {parkData.name}. Tu evaluación será revisada y publicada pronto.
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate(`/parque/${parkId}`)}>
                Regresar a parque
              </Button>
              <Button variant="outline" onClick={() => navigate('/parks')}>
                Otros parques
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/parque/${parkId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al parque
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Evalúa {parkData.name}
            </h1>
            <p className="text-gray-600">
              Tu opinión es importante para mejorar nuestros parques. Califica tu experiencia.
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Información personal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="evaluatorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu nombre completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="evaluatorEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (opcional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="tu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="evaluatorPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="333-123-4567" {...field} />
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
                          <Input placeholder="Guadalajara" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="evaluatorAge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Edad (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="13"
                            max="120"
                            placeholder="25"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="isFrequentVisitor"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Soy visitante frecuente de este parque</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Información de la visita */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Información de tu Visita
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="visitDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de visita (opcional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="visitPurpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Propósito de la visita (opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="recreation">Recreación</SelectItem>
                            <SelectItem value="exercise">Ejercicio</SelectItem>
                            <SelectItem value="family">Actividad familiar</SelectItem>
                            <SelectItem value="work">Trabajo</SelectItem>
                            <SelectItem value="events">Eventos</SelectItem>
                            <SelectItem value="other">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="visitDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (minutos, opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="60"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Calificaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Calificaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="cleanliness"
                    render={({ field }) => (
                      <FormItem>
                        <StarRating
                          value={field.value}
                          onChange={field.onChange}
                          label="Limpieza"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="safety"
                    render={({ field }) => (
                      <FormItem>
                        <StarRating
                          value={field.value}
                          onChange={field.onChange}
                          label="Seguridad"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maintenance"
                    render={({ field }) => (
                      <FormItem>
                        <StarRating
                          value={field.value}
                          onChange={field.onChange}
                          label="Mantenimiento"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accessibility"
                    render={({ field }) => (
                      <FormItem>
                        <StarRating
                          value={field.value}
                          onChange={field.onChange}
                          label="Accesibilidad"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="amenities"
                    render={({ field }) => (
                      <FormItem>
                        <StarRating
                          value={field.value}
                          onChange={field.onChange}
                          label="Amenidades"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="activities"
                    render={({ field }) => (
                      <FormItem>
                        <StarRating
                          value={field.value}
                          onChange={field.onChange}
                          label="Actividades"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="staff"
                    render={({ field }) => (
                      <FormItem>
                        <StarRating
                          value={field.value}
                          onChange={field.onChange}
                          label="Personal"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="naturalBeauty"
                    render={({ field }) => (
                      <FormItem>
                        <StarRating
                          value={field.value}
                          onChange={field.onChange}
                          label="Belleza Natural"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <FormField
                    control={form.control}
                    name="overallRating"
                    render={({ field }) => (
                      <FormItem>
                        <StarRating
                          value={field.value}
                          onChange={field.onChange}
                          label="Calificación General"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Comentarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comentarios y Sugerencias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comentarios sobre tu experiencia (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Cuéntanos sobre tu experiencia en el parque..."
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
                  name="suggestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sugerencias de mejora (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="¿Qué podríamos mejorar en el parque?"
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
                        <FormLabel>Recomendaría este parque a otros visitantes</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botón de envío */}
            <div className="flex justify-center">
              <Button
                type="submit"
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                disabled={createEvaluation.isPending}
              >
                {createEvaluation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Enviar Evaluación
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}