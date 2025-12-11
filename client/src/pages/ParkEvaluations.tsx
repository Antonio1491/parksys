import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { safeApiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, MapPin, Users, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface Evaluation {
  id: number;
  evaluator_name: string;
  evaluator_city: string | null;
  overall_rating: number;
  cleanliness: number;
  safety: number;
  maintenance: number;
  accessibility: number;
  amenities: number;
  activities: number;
  staff: number;
  natural_beauty: number;
  comments: string | null;
  suggestions: string | null;
  would_recommend: boolean;
  visit_date: string | null;
  visit_purpose: string | null;
  created_at: string;
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

const EvaluationCard = ({ evaluation }: { evaluation: Evaluation }) => {
  const criteriaLabels = {
    cleanliness: 'Limpieza',
    safety: 'Seguridad',
    maintenance: 'Mantenimiento',
    accessibility: 'Accesibilidad',
    amenities: 'Amenidades',
    activities: 'Actividades',
    staff: 'Personal',
    natural_beauty: 'Belleza Natural'
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold text-lg">{evaluation.evaluator_name}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-3 w-3" />
              <span>{evaluation.evaluator_city}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <StarRating rating={evaluation.overall_rating} />
              <span className="text-sm font-medium">{evaluation.overall_rating}/5</span>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(evaluation.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Calificaciones detalladas */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Object.entries(criteriaLabels).map(([key, label]) => (
            <div key={key} className="text-center">
              <div className="text-xs text-gray-600 mb-1">{label}</div>
              <div className="flex justify-center">
                <StarRating rating={evaluation[key as keyof Evaluation] as number} />
              </div>
            </div>
          ))}
        </div>

        {/* Comentarios */}
        {evaluation.comments && (
          <div className="mb-3">
            <p className="text-sm text-gray-700 italic">"{evaluation.comments}"</p>
          </div>
        )}

        {/* Sugerencias */}
        {evaluation.suggestions && (
          <div className="mb-3">
            <p className="text-sm text-gray-600"><strong>Sugerencias:</strong> {evaluation.suggestions}</p>
          </div>
        )}

        {/* Información adicional */}
        <div className="flex items-center gap-4 text-xs text-gray-600">
          {evaluation.visit_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(evaluation.visit_date).toLocaleDateString()}
            </span>
          )}
          {evaluation.visit_purpose && (
            <span>Propósito: {evaluation.visit_purpose}</span>
          )}
          {evaluation.would_recommend && (
            <Badge variant="secondary" className="text-xs">
              Recomendado
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function ParkEvaluations() {
  const { id } = useParams<{ id: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const evaluationsPerPage = 10;

  // Extraer el ID del parque del slug
  const parkId = parseInt(id);

  // Obtener estadísticas de evaluaciones
  const { data: stats } = useQuery<EvaluationStats>({
    queryKey: ['/api/parks', parkId, 'evaluation-stats'],
    queryFn: () => safeApiRequest(`/api/parks/${parkId}/evaluation-stats`),
    enabled: !!parkId,
  });

  // Obtener todas las evaluaciones paginadas
  const { data: evaluationsData } = useQuery({
    queryKey: ['/api/parks', parkId, 'evaluations', currentPage],
    queryFn: () => safeApiRequest(`/api/parks/${parkId}/evaluations?page=${currentPage}&limit=${evaluationsPerPage}`),
    enabled: !!parkId,
  });

  // Obtener información del parque
  const { data: parkData } = useQuery({
    queryKey: ['/api/parks', parkId],
    queryFn: () => safeApiRequest(`/api/parks/${parkId}`),
    enabled: !!parkId,
  });

  const evaluations = evaluationsData?.evaluations || [];
  const totalPages = Math.ceil((evaluationsData?.pagination?.total || 0) / evaluationsPerPage);

  if (!parkId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Parque no encontrado</h1>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Evaluaciones de {parkData?.name || 'Parque'}
                </h1>
                <p className="text-sm text-gray-600">
                  Todas las evaluaciones ciudadanas del parque
                </p>
              </div>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => window.open(ROUTES.public.parkEvaluate.build(parkId), '_blank')}
            >
              <Star className="h-4 w-4 mr-2" />
              Evaluar este parque
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Estadísticas */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  Estadísticas Generales
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {stats.average_rating?.toFixed(1) || '0.0'}
                      </div>
                      <div className="flex justify-center mb-2">
                        <StarRating rating={Math.round(stats.average_rating || 0)} />
                      </div>
                      <div className="text-sm text-gray-600">
                        Basado en {Number(stats.total_evaluations) || 0} evaluaciones
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>5 estrellas</span>
                        <span>{stats.five_star_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>4 estrellas</span>
                        <span>{stats.four_star_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>3 estrellas</span>
                        <span>{stats.three_star_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>2 estrellas</span>
                        <span>{stats.two_star_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>1 estrella</span>
                        <span>{stats.one_star_count || 0}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-600 mb-2">Promedio por criterio:</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Limpieza</span>
                          <span>{stats.avg_cleanliness?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Seguridad</span>
                          <span>{stats.avg_safety?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Mantenimiento</span>
                          <span>{stats.avg_maintenance?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Accesibilidad</span>
                          <span>{stats.avg_accessibility?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Amenidades</span>
                          <span>{stats.avg_amenities?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Actividades</span>
                          <span>{stats.avg_activities?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Personal</span>
                          <span>{stats.avg_staff?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Belleza Natural</span>
                          <span>{stats.avg_natural_beauty?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Evaluaciones */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Evaluaciones ({evaluationsData?.pagination?.total || 0})
              </h2>
            </div>

            {evaluations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay evaluaciones aún
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Sé el primero en evaluar este parque
                  </p>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => window.open(ROUTES.public.parkEvaluate.build(parkId), '_blank')}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Evaluar parque
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {evaluations.map((evaluation: Evaluation) => (
                    <EvaluationCard key={evaluation.id} evaluation={evaluation} />
                  ))}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}