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
import { GraphicCard } from '@/components/ui/graphic-card';
import MetricCard from '@/components/ui/metric-card';
import { Calendar, Plus, Tag, Users, MapPin, Clock, Edit, Eye, BarChart3, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import DashboardLayout from '@/components/ui/dashboard-layout';

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
  const parks = Array.isArray(parksResponse) ? parksResponse : (parksResponse as any)?.data || [];

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

  // Obtener estadísticas de especialidades de instructores
  const { data: specialtiesStats, isLoading: isLoadingSpecialtiesStats } = useQuery({
    queryKey: ['/api/instructor-specialties/stats'],
    retry: 1,
  });

  // Obtener actividades mejor evaluadas
  const { data: topRatedActivities = [], isLoading: isLoadingTopRated } = useQuery({
    queryKey: ['/api/activities/top-rated'],
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

  // Contar actividades activas por parque
  const activeParkCounts = Array.isArray(activities) ? activities.reduce((acc, activity) => {
    if (activity.status === 'activa') {
      acc[activity.parkId] = (acc[activity.parkId] || 0) + 1;
    }
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

  // Crear datos para el gráfico de actividades por parque (mostrar todos los 13 parques)
  const parkActivityData = Array.isArray(parks) ? parks.map(park => ({
    parkId: park.id,
    parkName: park.name,
    totalActivities: Number(parkCounts[park.id] || 0),
    activeActivities: Number(activeParkCounts[park.id] || 0)
  })).sort((a, b) => b.totalActivities - a.totalActivities) : [];

  // Datos para el gráfico de pastel de categorías
  const categoryPieData = Object.entries(categoryCounts).map(([categoryName, count]: [string, any]) => ({
    name: categoryName,
    value: Number(count),
    color: categoryName === 'Arte y Cultura' ? '#10b981' :
           categoryName === 'Recreación y Bienestar' ? '#3b82f6' :
           categoryName === 'Eventos de Temporada' ? '#f59e0b' :
           categoryName === 'Deportivo' ? '#ef4444' :
           categoryName === 'Comunidad' ? '#8b5cf6' :
           categoryName === 'Naturaleza y Ciencia' ? '#14b8a6' :
           categoryName === 'Fitness y Ejercicio' ? '#6366f1' :
           '#059669'
  }));

  // Actividades próximas (próximas 5)
  const upcomingActivities = Array.isArray(activities) ? activities
    .filter(a => new Date(a.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5) : [];

  // Calcular parque con más y menos actividades
  const parkWithMostActivities = parkActivityData.length > 0 ? 
    parkActivityData.reduce((max, park) => park.totalActivities > max.totalActivities ? park : max) : null;
  const parkWithLeastActivities = parkActivityData.length > 0 ? 
    parkActivityData.filter(p => p.totalActivities > 0).reduce((min, park) => park.totalActivities < min.totalActivities ? park : min) : null;

  // Calcular instructor con mejor y peor calificación
  const instructorsWithRating = Array.isArray(instructors) ? instructors.filter((i: any) => i.rating && i.rating > 0) : [];
  const instructorWithBestRating = instructorsWithRating.length > 0 ? 
    instructorsWithRating.reduce((max: any, instructor: any) => instructor.rating > max.rating ? instructor : max) : null;
  const instructorWithWorstRating = instructorsWithRating.length > 0 ? 
    instructorsWithRating.reduce((min: any, instructor: any) => instructor.rating < min.rating ? instructor : min) : null;

  const maxParkCount = Math.max(...Object.values(parkCounts).map(Number), 1);
  return (
    <DashboardLayout
      icon={Calendar}
      title="Actividades"
      subtitle="Estadísticas de las actividades en los parques"
      backgroundColor="#14b8a6"
    >
      {/* Sección 1: Métricas Principales */}
        {/* Columna 1 - Total de Actividades */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total de Actividades"
              value={isLoadingActivities ? '...' : totalActivities}
              subtitle="Actividades registradas en el sistema"
              icon={Calendar}
              iconColor="#14b8a6"
              backgroundColor="#003D49"
            >
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
            </MetricCard>

        {/* Columna 2: Dividida en 2 mitades verticales - Estados de Actividades y Especialidades */}
          <div className="flex flex-row gap-3">
          
            {/* Columna 2a (mitad izquierda): Estados de Actividades */}
             <Card
              className="border-0 shadow-lg text-white flex-1 rounded-3xl"
              style={{ backgroundColor: "#003D49" }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                 <CardTitle className="text-sm font-medium text-gray-100">
                    Estados de Actividades
                  </CardTitle>
                  <div
                    className="rounded-full p-1.5"
                    style={{ backgroundColor: "#14b8a6" }}
                  >
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="space-y-2">
                  {/* Actividades En Curso */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-xs text-gray-200">En Curso</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {isLoadingActivities ? '...' : activitiesInProgress}
                    </span>
                  </div>

                {/* Actividades Programadas */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-xs text-gray-200">Programadas</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {isLoadingActivities ? '...' : scheduledActivities}
                  </span>
                </div>

                {/* Actividades Canceladas */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <span className="text-xs text-gray-200">Canceladas</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {isLoadingActivities ? '...' : cancelledActivities}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Columna 2b (mitad derecha): Especialidades de Instructores */}
          <Card
            className="border-0 shadow-lg text-white flex-1 rounded-3xl"
            style={{ backgroundColor: "#003D49" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-gray-100">
                Especialidades de los instructores
              </CardTitle>
              <div
                className="rounded-full p-1.5"
                style={{ backgroundColor: "#14b8a6" }}
              >
                <Tag className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold text-white mb-1">
                {isLoadingSpecialtiesStats ? '...' : (specialtiesStats?.totalUniqueSpecialties || 0)}
              </div>
              <p className="text-xs text-white mb-2">
                Especialidades únicas registradas
              </p>
              
              {/* Top especialidad */}
              {specialtiesStats?.topSpecialties?.[0] && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#14b8a6" }}></div>
                      <span className="text-xs text-gray-200 truncate">
                        {specialtiesStats.topSpecialties[0].name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {specialtiesStats.topSpecialties[0].count}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Columna 3 - Instructores del Sistema */}
        <MetricCard
          title="Instructores del Sistema"
          value={isLoadingInstructors ? '...' : totalInstructors}
          subtitle="Instructores registrados en total"
          icon={Tag}
          iconColor="#14b8a6"
          backgroundColor="#003D49"
        >
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
        </MetricCard>

        {/* Columna 4 - Inscripciones Semanales */}    
        <MetricCard
          title="Inscripciones Semanales"
          value={isLoadingRegistrationStats ? '...' : (registrationStats?.weeklyRegistrations || 0)}
          subtitle="Nuevas inscripciones esta semana"
          icon={Users}
          iconColor="#14b8a6"
          backgroundColor="#003D49"
        >
          {/* Plazas ocupadas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" style={{ color: "#14b8a6" }} />
                <span className="text-xs text-gray-200">
                  Plazas Ocupadas
                </span>
              </div>
              <span
                className="text-xs font-semibold"
                style={{ color: "#14b8a6" }}
              >
                {isLoadingRegistrationStats ? '...' : `${registrationStats?.approvedRegistrations || 0} de ${registrationStats?.totalCapacity || 0}`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${registrationStats?.occupancyPercentage || 0}%`,
                  backgroundColor: "#14b8a6"
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              Ocupación: {isLoadingRegistrationStats ? '...' : `${registrationStats?.occupancyPercentage || 0}%`}
            </div>
          </div>
        </MetricCard>
      </div>

      {/* Sección 2 - Gráfico de Actividades por Parque y Actividades Próximas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Columna izquierda: Actividades Mejor Evaluadas */}
        <GraphicCard
          title="⭐ Actividades Mejor Evaluadas"
          description="Las 5 actividades con mejor calificación y el parque donde se realizan"
        >
          <div className="w-full min-h-[320px]">
            {isLoadingTopRated ? (
              <div className="flex items-center justify-center h-[320px] text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                  <p>Cargando actividades mejor evaluadas...</p>
                </div>
              </div>
            ) : Array.isArray(topRatedActivities) && topRatedActivities.length > 0 ? (
              <div className="space-y-4 p-4">
                {topRatedActivities.map((activity: any, index: number) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gradient-to-r from-teal-50 to-green-50 rounded-lg border-l-4 border-teal-500">
                    {/* Posición */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    
                    {/* Información de la actividad */}
                    <div className="flex-grow min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate" title={activity.title}>
                        {activity.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 truncate" title={activity.parkName}>
                          {activity.parkName}
                        </span>
                      </div>
                      {activity.categoryName && (
                        <div className="flex items-center space-x-2 mt-1">
                          <Tag className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {activity.categoryName}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Calificación y estadísticas */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="text-lg font-bold text-teal-700">
                          {activity.rating.toFixed(1)}
                        </span>
                        <span className="text-yellow-500">⭐</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {activity.registrationCount > 0 ? (
                          <span>{activity.registrationCount} inscripciones</span>
                        ) : (
                          <span>Sin inscripciones</span>
                        )}
                      </div>
                      {activity.isFree ? (
                        <div className="text-xs text-green-600 font-medium">Gratis</div>
                      ) : (
                        <div className="text-xs text-blue-600 font-medium">${activity.price}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-gray-500">
                <div className="text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No hay actividades evaluadas disponibles</p>
                </div>
              </div>
            )}
          </div>
        </GraphicCard>

        {/* Columna derecha: Actividades Próximas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Actividades Próximas</h2>
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Parque</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingActivities ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Cargando actividades...
                    </TableCell>
                  </TableRow>
                ) : upcomingActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
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
        </div>

      </div>

      {/* Nueva fila: Evaluaciones de Instructores */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        
        {/* Instructores con mejor y peor calificación */}
        <Card className="border-0 shadow-lg text-white rounded-3xl" style={{ backgroundColor: "#003D49" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-lg font-medium text-gray-100">
              Evaluaciones de Instructores
            </CardTitle>
            <div className="rounded-full p-2" style={{ backgroundColor: "#14b8a6" }}>
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-4">
              
              {/* Instructor con mejor calificación */}
              <div className="bg-gray-800/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-sm font-medium text-gray-200">Mejor Calificado</span>
                </div>
                {instructorWithBestRating ? (
                  <>
                    <div className="text-2xl font-bold text-white mb-1">
                      {instructorWithBestRating.rating.toFixed(1)} ⭐
                    </div>
                    <p className="text-sm text-gray-300 truncate">
                      {instructorWithBestRating.fullName || `${instructorWithBestRating.firstName} ${instructorWithBestRating.lastName}`}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#14b8a6" }}></div>
                      <span className="text-xs text-gray-400">
                        {instructorWithBestRating.activitiesCount || 0} actividades
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">Sin calificaciones</div>
                )}
              </div>

              {/* Instructor con peor calificación */}
              <div className="bg-gray-800/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <span className="text-sm font-medium text-gray-200">Menor Calificado</span>
                </div>
                {instructorWithWorstRating ? (
                  <>
                    <div className="text-2xl font-bold text-white mb-1">
                      {instructorWithWorstRating.rating.toFixed(1)} ⭐
                    </div>
                    <p className="text-sm text-gray-300 truncate">
                      {instructorWithWorstRating.fullName || `${instructorWithWorstRating.firstName} ${instructorWithWorstRating.lastName}`}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#14b8a6" }}></div>
                      <span className="text-xs text-gray-400">
                        {instructorWithWorstRating.activitiesCount || 0} actividades
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">Sin calificaciones</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
          <div className="h-80">
            {isLoadingActivities || isLoadingCategories ? (
              <div className="text-center py-4 text-gray-500">Cargando categorías...</div>
            ) : categoryPieData.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No hay categorías disponibles</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={30}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} actividades`, 'Cantidad']}
                    labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                  />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '12px'
                    }}
                    formatter={(value: string) => (
                      <span style={{ color: '#374151', fontSize: '12px' }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">🏆 Actividades Destacadas</h2>
          <div className="space-y-3">
            {isLoadingTopRated ? (
              <div className="text-center py-4 text-gray-500">Cargando actividades destacadas...</div>
            ) : Array.isArray(topRatedActivities) && topRatedActivities.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No hay actividades evaluadas</div>
            ) : (
              topRatedActivities.map((activity: any, index: number) => (
                <div key={activity.id} className="flex items-center p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                  {/* Posición */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white flex items-center justify-center font-bold text-sm mr-3">
                    {index + 1}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900 leading-tight">
                        {activity.title.length > 30 ? `${activity.title.substring(0, 30)}...` : activity.title}
                      </span>
                      <div className="flex items-center space-x-1 ml-2">
                        <span className="text-sm font-bold text-amber-700">
                          {activity.rating.toFixed(1)}
                        </span>
                        <span className="text-yellow-500">⭐</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[120px]" title={activity.parkName}>
                          {activity.parkName}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {activity.registrationCount > 0 && (
                          <span className="text-teal-600">
                            {activity.registrationCount} inscripciones
                          </span>
                        )}
                        {activity.isFree ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            Gratis
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                            ${activity.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>


    </DashboardLayout>
  );
};

export default OrganizadorPage;