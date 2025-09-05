import React from 'react';
import { useParams } from 'wouter';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/AdminLayout';
import ActivityImageManagerSimple from '@/components/ActivityImageManagerSimple';

const ActivityImagesPage: React.FC = () => {
  const params = useParams();
  const [, setLocation] = useLocation();
  const activityId = parseInt(params.id as string);

  // Obtener información de la actividad
  const { data: activity, isLoading } = useQuery<any>({
    queryKey: [`/api/activities/${activityId}`],
    enabled: !!activityId && !isNaN(activityId)
  });

  if (isNaN(activityId)) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">ID de actividad inválido</h1>
            <Button onClick={() => setLocation('/admin/activities')}>
              Volver a Actividades
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/admin/activities')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Actividades
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Imágenes
              </h1>
              {isLoading ? (
                <div className="h-5 bg-gray-200 rounded animate-pulse w-48"></div>
              ) : activity ? (
                <p className="text-gray-600">
                  {activity.title} - ID: {activityId}
                </p>
              ) : (
                <p className="text-gray-600">Actividad #{activityId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Información de la actividad */}
        {activity && !isLoading && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Información de la Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Título</h4>
                  <p className="text-gray-900">{activity.title}</p>
                </div>
                {activity.description && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Descripción</h4>
                    <p className="text-gray-600 line-clamp-2">{activity.description}</p>
                  </div>
                )}
                {activity.parkName && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Parque</h4>
                    <p className="text-gray-900">{activity.parkName}</p>
                  </div>
                )}
                {activity.category && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Categoría</h4>
                    <p className="text-gray-900">{activity.category}</p>
                  </div>
                )}
                {activity.startDate && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Fecha de inicio</h4>
                    <p className="text-gray-900">
                      {new Date(activity.startDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {activity.capacity && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Capacidad</h4>
                    <p className="text-gray-900">{activity.capacity} personas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state para información de actividad */}
        {isLoading && (
          <Card className="mb-6">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mb-2"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gestor de imágenes */}
        <Card>
          <CardContent className="p-6">
            <ActivityImageManagerSimple
              activityId={activityId}
              currentImageUrl={activity?.imageUrl || null}
              onImageUpdated={(imageUrl) => {
                console.log('Imagen actualizada:', imageUrl);
              }}
            />
          </CardContent>
        </Card>

        {/* Botones de acción adicionales */}
        <div className="mt-6 flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => setLocation('/admin/activities')}
          >
            Finalizar y Volver a Actividades
          </Button>
          <Button
            onClick={() => setLocation('/admin/organizador/nueva-actividad')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            Crear Otra Actividad
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ActivityImagesPage;