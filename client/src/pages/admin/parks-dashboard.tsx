import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Trees, Calendar, Users, TrendingUp, Activity, AlertTriangle, CheckCircle, Wrench, UserCheck, AlertCircle, Package, Award } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ParksDashboardData {
  totalParks: number;
  totalSurface: number;
  totalGreenArea: number;
  totalVisitors: number;
  activeParks: number;
  maintenanceAreas: number;
  totalActivities: number;
  totalVolunteers: number;
  totalTrees: number;
  totalAmenities: number;
  totalInstructors: number;
  totalIncidents: number;
  totalAssets: number;
  averageRating: number;
  greenFlagParks: number;
  greenFlagPercentage: number;
  parksByMunicipality: Array<{
    municipalityName: string;
    count: number;
  }>;
  parksByType: Array<{
    type: string;
    count: number;
  }>;
  recentActivities: Array<{
    id: number;
    title: string;
    parkName: string;
    date: string;
    participants: number;
  }>;
  parksWithCoordinates: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    municipality: string;
    type: string;
    area: number;
    status: string;
  }>;
  conservationStatus: Array<{
    status: string;
    count: number;
  }>;
  parkEvaluations: Array<{
    parkId: number;
    parkName: string;
    averageRating: number;
    evaluationCount: number;
  }>;
}

const ParksDashboard = () => {
  const { data, isLoading, error } = useQuery<ParksDashboardData>({
    queryKey: ['/api/parks/dashboard'],
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold font-poppins">
                  <span style={{ color: '#00444f' }}>MÉTRICAS</span>{' '}
                  <span style={{ color: '#504378' }}>Parques</span>
                </h1>
                <p className="mt-2" style={{ color: '#00444f' }}>
                  Estadísticas generales del sistema de parques
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-poppins">
                <span style={{ color: '#00444f' }}>MÉTRICAS</span>{' '}
                <span style={{ color: '#504378' }}>Parques</span>
              </h1>
              <p className="mt-2" style={{ color: '#00444f' }}>
                Estadísticas generales del sistema de parques
              </p>
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Error al cargar los datos del dashboard</p>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-poppins">
                <span style={{ color: '#00444f' }}>MÉTRICAS</span>{' '}
                <span style={{ color: '#504378' }}>Parques</span>
              </h1>
              <p className="mt-2" style={{ color: '#00444f' }}>
                Estadísticas generales del sistema de parques
              </p>
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">No hay datos disponibles</p>
        </div>
      </AdminLayout>
    );
  }

  // Centro del mapa basado en México
  const mexicoCenter: [number, number] = [19.4326, -99.1332]; // Ciudad de México

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Main Header sin Card */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-poppins">
                <span style={{ color: '#00444f' }}>MÉTRICAS</span>{' '}
                <span style={{ color: '#504378' }}>Parques</span>
              </h1>
              <p className="mt-2" style={{ color: '#00444f' }}>
                Estadísticas generales del sistema de parques
              </p>
            </div>
          </div>
        </div>
        
        {/* Sección 1: Métricas Principales */}
        <div className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-lg text-white" style={{backgroundColor: '#003D49'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-gray-100">Total de Parques</CardTitle>
              <div className="rounded-full p-2" style={{backgroundColor: '#513C73'}}>
                <MapPin className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.totalParks}</div>
              <p className="text-xs text-white">
                {data.activeParks} activos
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg text-white" style={{backgroundColor: '#003D49'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-gray-100">Superficie Total</CardTitle>
              <div className="rounded-full p-2" style={{backgroundColor: '#513C73'}}>
                <Trees className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {data.totalSurface ? `${(data.totalSurface / 10000).toFixed(1)} ha` : 'N/A'}
              </div>
              <p className="text-xs text-white">
                Superficie total de parques
              </p>
            </CardContent>
          </Card>



          <Card className="border-0 shadow-lg text-white" style={{backgroundColor: '#003D49'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-gray-100">Actividades</CardTitle>
              <div className="rounded-full p-2" style={{backgroundColor: '#513C73'}}>
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.totalActivities}</div>
              <p className="text-xs text-white">
                Eventos programados
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg text-white" style={{backgroundColor: '#003D49'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-gray-100">Voluntarios</CardTitle>
              <div className="rounded-full p-2" style={{backgroundColor: '#B275B0'}}>
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.totalVolunteers}</div>
              <p className="text-xs text-white">
                Activos en el sistema
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg text-white" style={{backgroundColor: '#003D49'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-gray-100">Árboles</CardTitle>
              <div className="rounded-full p-2" style={{backgroundColor: '#513C73'}}>
                <Trees className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.totalTrees}</div>
              <p className="text-xs text-white">
                En inventario
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg text-white" style={{backgroundColor: '#003D49'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-gray-100">Visitantes</CardTitle>
              <div className="rounded-full p-2" style={{backgroundColor: '#513C73'}}>
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {data.totalVisitors ? data.totalVisitors.toLocaleString() : 'N/A'}
              </div>
              <p className="text-xs text-white">
                Visitantes totales
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg text-white" style={{backgroundColor: '#003D49'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-gray-100">Calificación</CardTitle>
              <div className="rounded-full p-2" style={{backgroundColor: '#513C73'}}>
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {data.averageRating ? data.averageRating.toFixed(1) : 'N/A'}
              </div>
              <p className="text-xs text-white">
                Promedio de evaluaciones
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg text-white" style={{backgroundColor: '#003D49'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-gray-100">En Mantenimiento</CardTitle>
              <div className="rounded-full p-2" style={{backgroundColor: '#B275B0'}}>
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.maintenanceAreas}</div>
              <p className="text-xs text-white">
                Áreas en mantenimiento
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg text-white" style={{backgroundColor: '#003D49'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-gray-100">Amenidades</CardTitle>
              <div className="rounded-full p-2" style={{backgroundColor: '#513C73'}}>
                <Wrench className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.totalAmenities}</div>
              <p className="text-xs text-white">
                Amenidades disponibles
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg text-white" style={{backgroundColor: '#003D49'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-gray-100">Instructores</CardTitle>
              <div className="rounded-full p-2" style={{backgroundColor: '#513C73'}}>
                <UserCheck className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.totalInstructors}</div>
              <p className="text-xs text-white">
                Instructores activos
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg text-white" style={{backgroundColor: '#003D49'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-gray-100">Incidencias</CardTitle>
              <div className="rounded-full p-2" style={{backgroundColor: '#B275B0'}}>
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.totalIncidents}</div>
              <p className="text-xs text-white">
                Incidencias (últimos 30 días)
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg text-white" style={{backgroundColor: '#003D49'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-gray-100">Activos</CardTitle>
              <div className="rounded-full p-2" style={{backgroundColor: '#B275B0'}}>
                <Package className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.totalAssets}</div>
              <p className="text-xs text-white">
                Activos registrados
              </p>
            </CardContent>
          </Card>
          </div>
          
          {/* Fila adicional para Green Flag Award */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 mt-6">
            <Card className="border-0 shadow-lg text-white" style={{backgroundColor: '#2E8B57'}}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-medium text-gray-100">Green Flag Award</CardTitle>
                <div className="rounded-full p-2" style={{backgroundColor: '#228B22'}}>
                  <Award className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-white">{data.greenFlagParks || 0}</div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-100">
                        {(data.greenFlagPercentage || 0).toFixed(1)}%
                      </div>
                      <p className="text-xs text-gray-200">del total</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-200">
                      <span>Parques certificados</span>
                      <span>{data.greenFlagParks || 0} de {data.totalParks}</span>
                    </div>
                    <div className="w-full bg-green-900 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-700" 
                        style={{ 
                          width: `${Math.max((data.greenFlagPercentage || 0), 2)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Separador visual */}
        <div className="border-t border-gray-200 my-8"></div>
        
        {/* Sección continua con el resto del dashboard */}
        <div className="space-y-6">

          {/* NUEVO: Gráfico de Evaluación Promedio por Parque */}
          <Card className="border-0 shadow-lg max-w-4xl mx-auto">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="text-lg font-bold text-gray-800">
                Evaluación Promedio por Parque
              </CardTitle>
              <CardDescription className="text-gray-600">
                Nivel de satisfacción promedio de visitantes por parque basado en evaluaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {data.parkEvaluations?.length > 0 ? (
                  data.parkEvaluations
                    .sort((a, b) => b.averageRating - a.averageRating)
                    .slice(0, 10) // Mostrar top 10
                    .map((park, index) => {
                      const percentage = (park.averageRating / 5) * 100;
                      const getRatingColor = (rating: number) => {
                        if (rating >= 4.5) return '#22C55E'; // Verde excelente
                        if (rating >= 4.0) return '#84CC16'; // Verde bueno
                        if (rating >= 3.5) return '#EAB308'; // Amarillo regular
                        if (rating >= 3.0) return '#F97316'; // Naranja bajo
                        return '#EF4444'; // Rojo muy bajo
                      };
                      
                      return (
                        <div key={park.parkId} className="flex items-center space-x-3">
                          <div className="w-32 text-sm font-medium text-right text-gray-700 truncate">
                            {park.parkName}
                          </div>
                          <div className="flex-1 flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                              <div 
                                className="h-6 rounded-full flex items-center justify-between px-3 transition-all duration-700 shadow-sm"
                                style={{ 
                                  width: `${Math.max(percentage, 10)}%`,
                                  backgroundColor: getRatingColor(park.averageRating)
                                }}
                              >
                                <span className="text-white text-xs font-bold">
                                  {park.averageRating.toFixed(1)} ⭐
                                </span>
                                <span className="text-white text-xs">
                                  ({park.evaluationCount} eval.)
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="w-16 text-right">
                            <span className="text-sm font-semibold" style={{ color: getRatingColor(park.averageRating) }}>
                              {park.averageRating.toFixed(1)}/5
                            </span>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <CheckCircle className="h-12 w-12 text-gray-300" />
                      <p className="text-lg font-medium">No hay evaluaciones disponibles</p>
                      <p className="text-sm">Los datos de evaluación aparecerán aquí una vez que los visitantes evalúen los parques</p>
                    </div>
                  </div>
                )}
              </div>
              {data.parkEvaluations?.length > 10 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Mostrando los 10 parques mejor evaluados de {data.parkEvaluations.length} total
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Porcentaje de Área Verde - Barras Verticales */}
          <Card className="border-0 shadow-lg max-w-5xl mx-auto">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="text-lg font-bold text-gray-800">
                Porcentaje de Área Verde
              </CardTitle>
              <CardDescription className="text-gray-600">
                Proporción de área verde respecto al área total de cada parque
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-96 w-full">
                {data.greenAreaPercentages?.length > 0 ? (
                  <div className="h-full flex flex-col">
                    {/* Área del gráfico */}
                    <div className="flex-1 flex items-end justify-center space-x-2 px-4 pb-4 border-l-2 border-b-2 border-gray-300 relative">
                      {/* Eje Y - Etiquetas de área */}
                      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-600 pr-2">
                        <span>Max</span>
                        <span>75%</span>
                        <span>50%</span>
                        <span>25%</span>
                        <span>0 m²</span>
                      </div>
                      
                      {/* Barras de los parques */}
                      {data.greenAreaPercentages
                        .sort((a, b) => b.greenPercentage - a.greenPercentage)
                        .slice(0, 12) // Mostrar top 12 para que quepan bien
                        .map((park, index) => {
                          const maxArea = Math.max(...data.greenAreaPercentages.map(p => p.totalArea));
                          const totalBarHeight = (park.totalArea / maxArea) * 100; // Porcentaje de altura máxima
                          const greenBarHeight = (park.greenArea / maxArea) * 100; // Altura de la barra verde
                          
                          return (
                            <div key={park.parkId} className="flex flex-col items-center space-y-1" style={{ minWidth: '60px' }}>
                              {/* Barra del parque */}
                              <div className="relative h-64 w-8 flex flex-col justify-end">
                                {/* Barra gris (área total) */}
                                <div 
                                  className="w-full bg-gray-400 relative transition-all duration-700"
                                  style={{ height: `${totalBarHeight}%` }}
                                >
                                  {/* Barra verde (área verde) superpuesta */}
                                  <div 
                                    className="w-full bg-green-500 absolute bottom-0 left-0 transition-all duration-700"
                                    style={{ height: `${(greenBarHeight / totalBarHeight) * 100}%` }}
                                  >
                                    {/* Porcentaje en la punta de la barra verde */}
                                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-green-700 whitespace-nowrap">
                                      {park.greenPercentage.toFixed(1)}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Nombre del parque (rotado) */}
                              <div className="text-xs text-gray-700 transform -rotate-45 origin-top-left w-20 h-8 flex items-start">
                                <span className="truncate block" style={{ maxWidth: '80px' }}>
                                  {park.parkName}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    
                    {/* Leyenda */}
                    <div className="mt-6 flex justify-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-400"></div>
                        <span>Área Total</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500"></div>
                        <span>Área Verde</span>
                      </div>
                    </div>
                    
                    {/* Información adicional */}
                    <div className="mt-4 text-center text-sm text-gray-600">
                      <p>Eje vertical: Área en metros cuadrados (m²) • Eje horizontal: Parques ordenados por mayor % de área verde</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 h-full flex flex-col justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <CheckCircle className="h-12 w-12 text-gray-300" />
                      <p className="text-lg font-medium">No hay datos de área verde disponibles</p>
                      <p className="text-sm">Los datos de área verde aparecerán aquí una vez que se registren en los parques</p>
                    </div>
                  </div>
                )}
              </div>
              {data.greenAreaPercentages?.length > 12 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Mostrando los 12 parques con mayor porcentaje de área verde de {data.greenAreaPercentages.length} total
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mapa de parques */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="text-xl font-bold text-gray-800">
                Ubicación de Parques
              </CardTitle>
              <CardDescription className="text-gray-600">
                Mapa interactivo mostrando la ubicación de todos los parques en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full">
                <MapContainer
                  center={mexicoCenter}
                  zoom={6}
                  className="h-full w-full rounded-lg"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {data.parksWithCoordinates?.filter(park => 
                    park.latitude != null && park.longitude != null && 
                    !isNaN(park.latitude) && !isNaN(park.longitude)
                  ).map((park) => (
                    <Marker
                      key={park.id}
                      position={[park.latitude, park.longitude]}
                    >
                      <Popup>
                        <div className="space-y-2">
                          <h3 className="font-semibold">{park.name}</h3>
                          <p className="text-sm text-gray-600">{park.municipality}</p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              {park.type}
                            </Badge>
                            {park.area && (
                              <Badge variant="secondary" className="text-xs">
                                {(park.area / 10000).toFixed(1)} ha
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ParksDashboard;