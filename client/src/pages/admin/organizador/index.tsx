import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, Plus, Tag, Users, MapPin, Clock, Edit, Eye, BarChart3 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

// Página principal del módulo de Organizador
const OrganizadorPage: React.FC = () => {
  // Obtener actividades
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['/api/activities'],
    retry: 1,
  });

  // Obtener parques
  const { data: parksResponse, isLoading: isLoadingParks } = useQuery({
    queryKey: ['/api/parks'],
    retry: 1,
  });
  const parks = (parksResponse as any)?.data || [];

  // Obtener categorías de actividades
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/activity-categories'],
    retry: 1,
  });

  // Obtener instructores
  const { data: instructors = [], isLoading: isLoadingInstructors } = useQuery({
    queryKey: ['/api/instructors'],
    retry: 1,
  });

  // Obtener estadísticas de inscripciones globales
  const { data: registrationStats, isLoading: isLoadingRegistrationStats } = useQuery({
    queryKey: ['/api/activity-registrations/global-stats'],
    retry: 1,
  });

  // Crear mapeo de categorías por ID
  const categoriesMap = Array.isArray(categories) ? categories.reduce((acc: any, category: any) => {
    acc[category.id] = category;
    return acc;
  }, {}) : {};

  // Calcular estadísticas
  const totalActivities = Array.isArray(activities) ? activities.length : 0;
  const activeActivities = Array.isArray(activities) ? activities.filter((a: any) => new Date(a.startDate) >= new Date()).length : 0;
  
  // Calcular estadísticas por estado (valores reales de la base de datos)
  const activitiesInProgress = Array.isArray(activities) ? activities.filter((a: any) => a.status === 'activa').length : 0;
  const scheduledActivities = Array.isArray(activities) ? activities.filter((a: any) => a.status === 'programada').length : 0;
  const cancelledActivities = Array.isArray(activities) ? activities.filter((a: any) => a.status === 'cancelada').length : 0;

  // Calcular estadísticas de instructores
  const totalInstructors = Array.isArray(instructors) ? instructors.length : 0;
  const activeInstructors = Array.isArray(instructors) ? instructors.filter((i: any) => i.status === 'active').length : 0;
  
  // Crear mapeo inverso de categorías por string del category
  const categoryStringMap: any = {
    'deportivo': 'Deportivo',
    'artecultura': 'Arte y Cultura',
    'recreacionbienestar': 'Recreación y Bienestar',
    'temporada': 'Eventos de Temporada',
    'naturalezaciencia': 'Naturaleza y Ciencia',
    'comunidad': 'Comunidad',
    'fitness': 'Fitness y Ejercicio'
  };

  // Contar actividades por categoría usando tanto category_id como category string
  const categoryCounts = Array.isArray(activities) ? activities.reduce((acc: any, activity: any) => {
    let categoryName = null;
    
    // Primero intentar con category_id numérico
    const categoryId = activity.categoryId || activity.category_id;
    if (categoryId && categoriesMap[categoryId]) {
      categoryName = categoriesMap[categoryId].name;
    }
    // Si no, usar el campo category string
    else if (activity.category && categoryStringMap[activity.category]) {
      categoryName = categoryStringMap[activity.category];
    }
    
    if (categoryName) {
      acc[categoryName] = (acc[categoryName] || 0) + 1;
    }
    
    return acc;
  }, {}) : {};



  // Contar actividades por parque
  const parkCounts = Array.isArray(activities) ? activities.reduce((acc, activity) => {
    acc[activity.parkId] = (acc[activity.parkId] || 0) + 1;
    return acc;
  }, {}) : {};

  // Crear mapa de nombres de parques
  const parkNamesMap = Array.isArray(parks) ? parks.reduce((acc, park) => {
    acc[park.id] = park.name;
    return acc;
  }, {}) : {};

  // Obtener parques con más actividades
  const topParks = Object.entries(parkCounts)
    .map(([parkId, count]) => ({
      parkId: parseInt(parkId),
      name: parkNamesMap[parkId] || `Parque ${parkId}`,
      count
    }))
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 5);

  // Actividades próximas (próximas 5)
  const upcomingActivities = Array.isArray(activities) ? activities
    .filter(a => new Date(a.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5) : [];

  const maxParkCount = Math.max(...Object.values(parkCounts).map(Number), 1);
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con fondo coloreado */}
        <div 
          className="py-8 px-4 -mx-4 -mt-6 mb-6"
          style={{ backgroundColor: "#14b8a6" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-8 h-8 text-white" />
                <div>
                  <h1 className="text-3xl font-bold text-white font-poppins">Actividades</h1>
                  <p className="text-base font-normal text-white font-poppins">Estadísticas de las actividades en los parques</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/activities">
                <Button variant="outline" className="flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100">
                  <Calendar size={16} />
                  Ver Actividades
                </Button>
              </Link>
              <Link href="/admin/activities/categories">
                <Button variant="outline" className="flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100">
                  <Tag size={16} />
                  Gestionar Categorías
                </Button>
              </Link>
              <Link href="/admin/organizador/nueva-actividad">
                <Button className="flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100">
                  <Plus size={16} />
                  Nueva Actividad
                </Button>
              </Link>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          className="border-0 shadow-lg text-white rounded-3xl"
          style={{ backgroundColor: "#003D49" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-gray-100">
              Total de Actividades
            </CardTitle>
            <div
              className="rounded-full p-2"
              style={{ backgroundColor: "#14b8a6" }}
            >
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {isLoadingActivities ? '...' : totalActivities}
            </div>
            <p className="text-xs text-white mb-3">
              Actividades registradas en el sistema
            </p>
            
            {/* Actividades en funcionamiento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" style={{ color: "#14b8a6" }} />
                  <span className="text-xs text-gray-200">
                    En Funcionamiento
                  </span>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#14b8a6" }}
                >
                  {isLoadingActivities ? '...' : `${activeActivities} (${totalActivities > 0 ? Math.round((activeActivities / totalActivities) * 100) : 0}%)`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${totalActivities > 0 ? (activeActivities / totalActivities) * 100 : 0}%`,
                    backgroundColor: "#14b8a6"
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-lg text-white rounded-3xl"
          style={{ backgroundColor: "#003D49" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-gray-100">
              Estados de Actividades
            </CardTitle>
            <div
              className="rounded-full p-2"
              style={{ backgroundColor: "#14b8a6" }}
            >
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Actividades En Curso */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-sm text-gray-200">En Curso</span>
                </div>
                <span className="text-lg font-bold text-white">
                  {isLoadingActivities ? '...' : activitiesInProgress}
                </span>
              </div>

              {/* Actividades Programadas */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className="text-sm text-gray-200">Programadas</span>
                </div>
                <span className="text-lg font-bold text-white">
                  {isLoadingActivities ? '...' : scheduledActivities}
                </span>
              </div>

              {/* Actividades Canceladas */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <span className="text-sm text-gray-200">Canceladas</span>
                </div>
                <span className="text-lg font-bold text-white">
                  {isLoadingActivities ? '...' : cancelledActivities}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-lg text-white rounded-3xl"
          style={{ backgroundColor: "#003D49" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-gray-100">
              Instructores del Sistema
            </CardTitle>
            <div
              className="rounded-full p-2"
              style={{ backgroundColor: "#14b8a6" }}
            >
              <Tag className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {isLoadingInstructors ? '...' : totalInstructors}
            </div>
            <p className="text-xs text-white mb-3">
              Instructores registrados en total
            </p>
            
            {/* Instructores activos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" style={{ color: "#14b8a6" }} />
                  <span className="text-xs text-gray-200">
                    Instructores Activos
                  </span>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#14b8a6" }}
                >
                  {isLoadingInstructors ? '...' : `${activeInstructors} (${totalInstructors > 0 ? Math.round((activeInstructors / totalInstructors) * 100) : 0}%)`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${totalInstructors > 0 ? (activeInstructors / totalInstructors) * 100 : 0}%`,
                    backgroundColor: "#14b8a6"
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-lg text-white rounded-3xl"
          style={{ backgroundColor: "#003D49" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-gray-100">
              Inscripciones Semanales
            </CardTitle>
            <div
              className="rounded-full p-2"
              style={{ backgroundColor: "#14b8a6" }}
            >
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {isLoadingRegistrationStats ? '...' : (registrationStats?.weeklyRegistrations || 0)}
            </div>
            <p className="text-xs text-white mb-3">
              Nuevas inscripciones esta semana
            </p>
            
            {/* Capacidad disponible */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" style={{ color: "#14b8a6" }} />
                  <span className="text-xs text-gray-200">
                    Capacidad Disponible
                  </span>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#14b8a6" }}
                >
                  {isLoadingRegistrationStats ? '...' : `${registrationStats?.availableCapacity || 0} plazas`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${(registrationStats?.totalCapacity || 0) > 0 ? Math.max(10, 100 - (registrationStats?.occupancyPercentage || 0)) : 0}%`,
                    backgroundColor: "#14b8a6"
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-300 mt-1">
                Ocupación: {isLoadingRegistrationStats ? '...' : `${registrationStats?.occupancyPercentage || 0}%`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-4">Actividades Próximas</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Parque</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingActivities ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Cargando actividades...
                </TableCell>
              </TableRow>
            ) : upcomingActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No hay actividades próximas programadas
                </TableCell>
              </TableRow>
            ) : (
              upcomingActivities.map((activity: any) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {(() => {
                        const categoryId = activity.categoryId || activity.category_id;
                        if (categoryId && categoriesMap[categoryId]) {
                          return categoriesMap[categoryId].name;
                        }
                        else if (activity.category && categoryStringMap[activity.category]) {
                          return categoryStringMap[activity.category];
                        }
                        return 'Sin categoría';
                      })()}
                    </Badge>
                  </TableCell>
                  <TableCell>{parkNamesMap[activity.parkId] || `Parque ${activity.parkId}`}</TableCell>
                  <TableCell>
                    {new Date(activity.startDate).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>{activity.location || 'Sin especificar'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/admin/organizador/catalogo/${activity.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/organizador/catalogo/editar/${activity.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Categorías de Actividades</h2>
            <Link href="/admin/activities/categories">
              <Button variant="outline" size="sm">
                <Tag className="h-4 w-4 mr-2" />
                Gestionar Categorías
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {isLoadingActivities || isLoadingCategories ? (
              <div className="text-center py-4 text-gray-500">Cargando categorías...</div>
            ) : Object.keys(categoryCounts).length === 0 ? (
              <div className="text-center py-4 text-gray-500">No hay categorías disponibles</div>
            ) : (
              Object.entries(categoryCounts).map(([categoryName, count]: [string, any]) => (
                <div key={categoryName} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Badge className={`${
                      categoryName === 'Arte y Cultura' ? 'bg-green-100 text-green-800' :
                      categoryName === 'Recreación y Bienestar' ? 'bg-blue-100 text-blue-800' :
                      categoryName === 'Eventos de Temporada' ? 'bg-orange-100 text-orange-800' :
                      categoryName === 'Deportivo' ? 'bg-red-100 text-red-800' :
                      categoryName === 'Comunidad' ? 'bg-purple-100 text-purple-800' :
                      categoryName === 'Naturaleza y Ciencia' ? 'bg-teal-100 text-teal-800' :
                      categoryName === 'Fitness y Ejercicio' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-emerald-100 text-emerald-800'
                    } hover:${
                      categoryName === 'Arte y Cultura' ? 'bg-green-100' :
                      categoryName === 'Recreación y Bienestar' ? 'bg-blue-100' :
                      categoryName === 'Eventos de Temporada' ? 'bg-orange-100' :
                      categoryName === 'Deportivo' ? 'bg-red-100' :
                      categoryName === 'Comunidad' ? 'bg-purple-100' :
                      categoryName === 'Naturaleza y Ciencia' ? 'bg-teal-100' :
                      categoryName === 'Fitness y Ejercicio' ? 'bg-indigo-100' :
                      'bg-emerald-100'
                    }`}>
                      {categoryName}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">{count} actividades</span>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Parques con Más Actividades</h2>
          <div className="space-y-2">
            {isLoadingParks || isLoadingActivities ? (
              <div className="text-center py-4 text-gray-500">Cargando parques...</div>
            ) : topParks.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No hay parques con actividades</div>
            ) : (
              topParks.map((park: any) => (
                <div key={park.parkId} className="flex items-center p-3 bg-gray-50 rounded-md">
                  <div className="w-full">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{park.name}</span>
                      <span className="text-sm text-gray-500">{park.count} actividades</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${(park.count / maxParkCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
};

export default OrganizadorPage;