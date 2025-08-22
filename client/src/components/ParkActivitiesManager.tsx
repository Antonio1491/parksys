import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Eye, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';

interface ParkActivity {
  id: number;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate?: string;
  capacity?: number;
  duration?: number;
  instructorName?: string;
  instructorId?: number;
  location?: string;
  startTime?: string;
  isRecurring?: boolean;
  recurringDays?: string[];
  isFree?: boolean;
  price?: number;
  createdAt: string;
}

interface ParkActivitiesManagerProps {
  parkId: number;
}

// Mapeo de categorías a colores
const CATEGORIAS_COLORES = {
  "Arte y Cultura": "bg-pink-100 text-pink-800",
  "Recreación y Bienestar": "bg-green-100 text-green-800", 
  "Eventos de Temporada": "bg-amber-100 text-amber-800",
  "Deportivo": "bg-red-100 text-red-800",
  "Comunidad": "bg-purple-100 text-purple-800",
  "Naturaleza y Ciencia": "bg-blue-100 text-blue-800",
  "Fitness y Ejercicio": "bg-indigo-100 text-indigo-800",
  "Actividades Familiares": "bg-teal-100 text-teal-800"
};

export default function ParkActivitiesManager({ parkId }: ParkActivitiesManagerProps) {
  const [, setLocation] = useLocation();

  // Obtener actividades del parque
  const { data: activities, isLoading, error } = useQuery({
    queryKey: [`/api/parks/${parkId}/activities`],
    queryFn: async () => {
      const response = await fetch(`/api/parks/${parkId}/activities`);
      if (!response.ok) throw new Error('Error cargando actividades');
      return response.json();
    }
  });

  const handleViewActivity = (activityId: number) => {
    setLocation(`/admin/organizador/catalogo/${activityId}`);
  };

  const goToActivitiesModule = () => {
    setLocation('/admin/activities/management');
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Cargando actividades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error cargando actividades del parque</p>
      </div>
    );
  }

  const activitiesList = Array.isArray(activities) ? activities : [];

  return (
    <div className="space-y-4">
      {/* Header de visualización */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Actividades del Parque</h3>
          <p className="text-sm text-gray-600">
            {activitiesList.length} actividad{activitiesList.length !== 1 ? 'es' : ''} programada{activitiesList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={goToActivitiesModule} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
          <ExternalLink className="h-4 w-4 mr-2" />
          Gestionar en Actividades
        </Button>
      </div>

      {activitiesList.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay actividades programadas</h3>
              <p className="text-gray-500 mb-4">
                Comienza agregando la primera actividad para este parque.
              </p>
              <Button onClick={goToActivitiesModule} className="bg-green-600 hover:bg-green-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ir al Módulo de Actividades
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {activitiesList.map((activity: ParkActivity) => {
            const categoriaColor = CATEGORIAS_COLORES[activity.category as keyof typeof CATEGORIAS_COLORES] || "bg-gray-100 text-gray-800";
            
            return (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{activity.title}</CardTitle>
                        <Badge className={categoriaColor}>
                          {activity.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {activity.description}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewActivity(activity.id)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver detalle
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {/* Fecha */}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Inicio</p>
                        <p className="text-gray-600">
                          {activity.startDate ? 
                            format(new Date(activity.startDate), "dd/MM/yyyy", { locale: es }) : 
                            'Sin fecha'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Horario */}
                    {activity.startTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Horario</p>
                          <p className="text-gray-600">{activity.startTime}</p>
                        </div>
                      </div>
                    )}

                    {/* Capacidad */}
                    {activity.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Capacidad</p>
                          <p className="text-gray-600">{activity.capacity} personas</p>
                        </div>
                      </div>
                    )}

                    {/* Instructor */}
                    {activity.instructorName && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Instructor</p>
                          <p className="text-gray-600">{activity.instructorName}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Información adicional */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activity.isFree && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Gratuita
                      </Badge>
                    )}
                    {activity.price && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        ${activity.price} MXN
                      </Badge>
                    )}
                    {activity.isRecurring && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Recurrente
                      </Badge>
                    )}
                    {activity.duration && (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        {activity.duration} min
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}