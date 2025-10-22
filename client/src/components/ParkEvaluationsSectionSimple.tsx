import { useQuery } from '@tanstack/react-query';
import { safeApiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Users } from 'lucide-react';
import ROUTES from '@/routes';

interface EvaluationStats {
  total_evaluations: number;
  average_rating: number;
  recommendation_rate: number;
  avg_cleanliness: number;
  avg_safety: number;
  avg_maintenance: number;
  avg_accessibility: number;
  avg_amenities: number;
  avg_activities: number;
  avg_staff: number;
  avg_natural_beauty: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
}

interface ParkEvaluationsProps {
  parkId: string;
  parkSlug: string;
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

export default function ParkEvaluationsSectionSimple({ parkId }: ParkEvaluationsProps) {
  // Obtener estadísticas de evaluaciones
  const { data: stats } = useQuery<EvaluationStats>({
    queryKey: ['/api/parks', parkId, 'evaluation-stats'],
    queryFn: () => safeApiRequest(`/api/parks/${parkId}/evaluation-stats`),
  });

  const hasEvaluations = stats && stats.average_rating && Number(stats.total_evaluations) > 0;
  const avgRating = Number(stats?.average_rating) || 0;
  const recommendationRate = Number(stats?.recommendation_rate) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">
          Evaluaciones Ciudadanas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Estadísticas principales */}
          {hasEvaluations && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calificación promedio */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {avgRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  <StarRating rating={Math.round(avgRating)} />
                </div>
                <div className="text-sm text-gray-600">
                  Basado en {Number(stats.total_evaluations) || 0} evaluaciones
                </div>
              </div>

              {/* Tasa de recomendación */}
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600 mb-1">
                  {recommendationRate.toFixed(0)}% Recomendado
                </div>
                <div className="text-sm text-gray-600">
                  De los visitantes que lo evaluaron
                </div>
              </div>
            </div>
          )}

          {/* Mensaje para parques sin evaluaciones */}
          {!hasEvaluations && (
            <div className="text-center py-8">
              <div className="text-gray-600 mb-4">
                Sé el primero en evaluar este parque y ayuda a otros visitantes con tu experiencia.
              </div>
            </div>
          )}

          {/* Acciones principales */}
          <div className="flex flex-col gap-3 justify-center items-center">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 w-full max-w-md"
              onClick={() => window.open(ROUTES.public.parkEvaluate.build(parkId), '_blank')}
            >
              <Star className="h-4 w-4 mr-2" />
              Evalúa este parque
            </Button>
            
            {hasEvaluations && (
              <Button
                variant="outline"
                size="lg"
                className="w-full max-w-md"
                onClick={() => window.open(ROUTES.public.parkEvaluations.build(parkId), '_blank')}
              >
                <Users className="h-4 w-4 mr-2" />
                Ver evaluaciones ({Number(stats.total_evaluations) || 0})
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}