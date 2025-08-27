import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Map,
  MapPin,
  Trees,
  AlertTriangle,
  CheckCircle,
  Award,
  MessageSquare,
} from "lucide-react";
import DashboardLayout from "@/components/ui/dashboard-layout";
import MetricCard from "@/components/ui/metric-card";
import GraphicCard from "@/components/ui/graphic-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface ParksDashboardData {
  totalParks: number;
  totalSurface: number;
  totalGreenArea: number;
  activeParks: number;
  totalIncidents: number;
  resolvedIncidents: number;
  totalReports: number;
  resolvedReports: number;
  averageRating: number;
  bestEvaluatedPark: {
    parkId: number;
    parkName: string;
    averageRating: number;
    evaluationCount: number;
  } | null;
  greenFlagParks: number;
  greenFlagPercentage: number;
  parkWithMostActivities: {
    parkId: number;
    parkName: string;
    totalActivities: number;
    activeActivities: number;
  } | null;
  parkWithLeastActivities: {
    parkId: number;
    parkName: string;
    totalActivities: number;
    activeActivities: number;
  } | null;
  parkWithMostTrees: {
    parkId: number;
    parkName: string;
    totalTrees: number;
    healthyTrees: number;
  } | null;
  parkWithLeastTrees: {
    parkId: number;
    parkName: string;
    totalTrees: number;
    healthyTrees: number;
  } | null;
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
  parkEvaluations: Array<{
    parkId: number;
    parkName: string;
    averageRating: number;
    evaluationCount: number;
  }>;
  greenAreaPercentages?: Array<{
    parkId: number;
    parkName: string;
    totalArea: number;
    greenArea: number;
    greenPercentage: number;
  }>;
  incidentsByPark?: Array<{
    parkId: number;
    parkName: string;
    totalIncidents: number;
    incidentsThisMonth: number;
    openIncidents: number;
    resolvedIncidents: number;
  }>;
}

const ParksDashboard = () => {
  const { data, isLoading, error } = useQuery<ParksDashboardData>({
    queryKey: ["/api/parks/dashboard"],
  });

  if (isLoading) {
    return (
      <DashboardLayout 
        icon={Map} 
        title="Parques" 
        subtitle="Estadísticas de los parques del sistema"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout 
        icon={Map} 
        title="Parques" 
        subtitle="Estadísticas de los parques del sistema"
      >
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">
            Error al cargar los datos del dashboard
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout 
        icon={Map} 
        title="Parques" 
        subtitle="Estadísticas de los parques del sistema"
      >
        <div className="text-center py-8">
          <p className="text-gray-600">No hay datos disponibles</p>
        </div>
      </DashboardLayout>
    );
  }

  // Cálculo de los límites del mapa basado en las coordenadas de los parques
  const validCoordinates = data.parksWithCoordinates
  ?.filter(
    (park) =>
      park.latitude != null &&
      park.longitude != null &&
      !isNaN(park.latitude) &&
      !isNaN(park.longitude)
  )
  .map((park) => [park.latitude, park.longitude] as [number, number]);

  const parksBounds =
    validCoordinates.length > 0
      ? L.latLngBounds(validCoordinates).pad(0.1) // 10% de expansión
      : L.latLngBounds([[20.6767, -103.3476]]); // fallback: Guadalajara
  
  return (
    <DashboardLayout 
      icon={Map} 
      title="Parques" 
      subtitle="Estadísticas de los parques del sistema"
    >
      {/* Sección 1: Métricas Principales - Grid de 4 columnas con columna 3 dividida */}
      <div className="space-y-4">
        <div className="grid gap-6 lg:grid-cols-4">
          
          {/* Columna 1: Total de Parques + Green Flag Award */}
          <MetricCard
            title="Total de Parques"
            value={data.totalParks}
            subtitle={`${data.activeParks} activos`}
            icon={MapPin}
          >
            {/* Barra de certificación Green Flag Award */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3" style={{ color: "#14b8a6" }} />
                  <span className="text-xs text-gray-200">
                    Green Flag Award
                  </span>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#14b8a6" }}
                >
                  {data.greenFlagParks || 0}/{data.totalParks} (
                  {data.greenFlagPercentage?.toFixed(0) || 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${data.greenFlagPercentage || 0}%`,
                    backgroundColor: "#14b8a6"
                  }}
                ></div>
              </div>
            </div>
          </MetricCard>

          {/* Columna 2: Superficie Total + Área Verde */}
          <MetricCard
            title="Superficie Total"
            value={data.totalSurface ? `${(data.totalSurface / 10000).toFixed(1)} ha` : "N/A"}
            subtitle="Superficie total de parques"
            icon={Trees}
          >
            {/* Barra de porcentaje de área verde */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Trees className="h-3 w-3" style={{ color: "#14b8a6" }} />
                  <span className="text-xs text-gray-200">Área Verde</span>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#14b8a6" }}
                >
                  {data.totalGreenArea
                    ? `${(data.totalGreenArea / 10000).toFixed(1)} ha`
                    : "0 ha"}
                  (
                  {data.totalSurface && data.totalGreenArea
                    ? (
                        (data.totalGreenArea / data.totalSurface) *
                        100
                      ).toFixed(0)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${
                      data.totalSurface && data.totalGreenArea
                        ? (data.totalGreenArea / data.totalSurface) * 100
                        : 0
                    }%`,
                    backgroundColor: "#14b8a6"
                  }}
                ></div>
              </div>
            </div>
          </MetricCard>

          {/* Columna 3: Dividida en 2 mitades verticales - Reportes e Incidencias */}
          <div className="flex flex-row gap-3">
            
            {/* Columna 3a (mitad izquierda): Reportes Públicos */}
            <Card
              className="border-0 shadow-lg text-white flex-1 rounded-3xl"
              style={{ backgroundColor: "#003D49" }}
            >
              <CardContent className="pt-4 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-100">
                    Reportes Públicos
                  </span>
                  <div
                    className="rounded-full p-1.5"
                    style={{ backgroundColor: "#14b8a6" }}
                  >
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {data.totalReports || 0}
                </div>
                <p className="text-xs text-white">
                  {data.resolvedReports || 0} resueltos
                </p>
              </CardContent>
            </Card>

            {/* Columna 3b (mitad derecha): Incidencias */}
            <Card
              className="border-0 shadow-lg text-white flex-1 rounded-3xl"
              style={{ backgroundColor: "#003D49" }}
            >
              <CardContent className="pt-4 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-100">
                    Incidencias
                  </span>
                  <div
                    className="rounded-full p-1.5"
                    style={{ backgroundColor: "#14b8a6" }}
                  >
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {data.totalIncidents || 0}
                </div>
                <p className="text-xs text-white">
                  {data.resolvedIncidents || 0} atendidas
                </p>
              </CardContent>
            </Card>
            
          </div>

          {/* Columna 4: Calificación + Parque mejor evaluado */}
          <MetricCard
            title="Calificación Promedio"
            value={data.averageRating ? data.averageRating.toFixed(1) : "N/A"}
            subtitle="Promedio de evaluaciones"
            icon={CheckCircle}
          >
            {/* Parque mejor evaluado */}
            {data.bestEvaluatedPark && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs text-gray-200">
                      Mejor Evaluado
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-yellow-400">
                    {data.bestEvaluatedPark.averageRating.toFixed(1)} ⭐
                  </span>
                </div>
                <div className="text-xs text-gray-200 truncate">
                  {data.bestEvaluatedPark.parkName}
                </div>
              </div>
            )}
          </MetricCard>

        </div>
      </div>

      {/* Fila dividida en 2 columnas */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Columna izquierda: Mapa de parques */}
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden min-h-[28rem] h-full">
          <CardContent className="p-0 h-full">
            <div className="relative h-full min-h-[28rem] w-full">
              <MapContainer
                bounds={parksBounds}
                scrollWheelZoom={false}
                className="absolute inset-0 !h-full !w-full"
                style={{ height: "100%", width: "100%", background: "transparent" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {validCoordinates?.map(([lat, lng], index) => {
                  const park = data.parksWithCoordinates[index];
                  return (
                    <Marker key={park.id} position={[lat, lng]}>
                      <Popup>
                        <div className="space-y-2">
                          <h3 className="font-semibold">{park.name}</h3>
                          <p className="text-sm text-gray-600">{park.municipality}</p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">{park.type}</Badge>
                            {park.area && (
                              <Badge variant="secondary" className="text-xs">
                                {(park.area / 10000).toFixed(1)} ha
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* Columna derecha: Gráfico de Evaluación Promedio por Parque */}
        <GraphicCard
          title="⭐ Evaluación Promedio por Parque"
          description="Nivel de satisfacción promedio de visitantes por parque basado en evaluaciones"
          className="h-full"
        >
          <div className="w-full">
            {data.parkEvaluations?.length > 0 ? (
              <div className="flex justify-center items-end gap-2 min-h-[320px] px-4 overflow-x-auto">
                {data.parkEvaluations
                  .sort((a, b) => b.averageRating - a.averageRating)
                  .map((park) => {
                    const heightPercentage = (park.averageRating / 5) * 100;
                    const getRatingColor = (rating: number) => {
                      if (rating >= 4.0) return "#69c45c"; // Verde para calificaciones positivas
                      if (rating >= 2.5) return "#bcb57e"; // Amarillo/naranja para medias
                      return "#a86767"; // Rojo para bajas
                    };
                    return (
                      <div key={park.parkId} className="flex flex-col items-center relative">
                        {/* Valor del promedio arriba con número de evaluaciones */}
                        <div className="mb-2 text-center">
                          <div className="text-sm font-poppins font-thin text-gray-700 flex items-center gap-1">
                            {park.averageRating.toFixed(1)}/5
                          </div>
                          <div className="text-xs font-poppins font-thin text-gray-500">
                            ({park.evaluationCount} eval)
                          </div>
                        </div>

                        {/* Columna vertical */}
                        <div className="relative h-64 w-4 flex flex-col justify-end">
                          {/* Fondo de la columna */}
                          <div className="absolute bottom-0 w-full h-full bg-gray-200 rounded-t-3xl border border-gray-300"></div>
                          
                          {/* Relleno de la columna según promedio */}
                          <div
                            className="absolute bottom-0 w-full rounded-t-3xl transition-all duration-700 border border-opacity-20"
                            style={{
                              height: `${Math.max(heightPercentage, 5)}%`,
                              backgroundColor: getRatingColor(park.averageRating),
                              borderColor: getRatingColor(park.averageRating),
                            }}
                          ></div>
                        </div>

                        {/* Nombre del parque a la izquierda de la columna - VERTICAL */}
                        <div className="absolute bottom-32 -left-28 transform -rotate-90 origin-bottom-right w-32">
                          <div className="text-xs font-poppins font-thin text-gray-700 whitespace-nowrap">
                            {park.parkName}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="flex flex-col items-center space-y-2">
                  <CheckCircle className="h-12 w-12 text-gray-300" />
                  <p className="text-lg font-medium">
                    No hay evaluaciones disponibles
                  </p>
                  <p className="text-sm">
                    Los datos de evaluación aparecerán aquí una vez que los
                    visitantes evalúen los parques
                  </p>
                </div>
              </div>
            )}
          </div>
          {data.parkEvaluations?.length > 0 && (
            <div className="mt-2 text-center">
              <p className="text-sm text-gray-500 font-poppins font-thin">
                Mostrando todos los {data.parkEvaluations.length} parques
                registrados en el sistema
              </p>
            </div>
          )}
        </GraphicCard>

      </div>

      {/* Tercera fila: Gráfico de Área Verde y Tarjetas de Actividades/Árboles */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Columna izquierda: Gráfico de Porcentaje de Área Verde */}
        <GraphicCard
          title="🌿 Porcentaje de Área Verde por Parque"
          description="Distribución del área verde en cada parque municipal"
          className="h-full"
        >
          <div className="w-full">
            {data.greenAreaPercentages && data.greenAreaPercentages.length > 0 ? (
              <div className="flex justify-center items-end gap-2 min-h-[320px] px-4 overflow-x-auto">
                {data.greenAreaPercentages
                  .sort((a, b) => b.greenPercentage - a.greenPercentage)
                  .map((park) => {
                    const heightPercentage = park.greenPercentage;
                    const getGreenColor = (percentage: number) => {
                      if (percentage >= 70) return "#10b981"; // Verde intenso para alto porcentaje
                      if (percentage >= 40) return "#22c55e"; // Verde medio
                      if (percentage >= 20) return "#84cc16"; // Verde lima para bajo
                      return "#eab308"; // Amarillo para muy bajo
                    };
                    return (
                      <div key={park.parkId} className="flex flex-col items-center relative">
                        {/* Valor del porcentaje arriba */}
                        <div className="mb-2 text-center">
                          <div className="text-sm font-poppins font-thin text-gray-700 flex items-center gap-1">
                            {park.greenPercentage.toFixed(0)}%
                          </div>
                          <div className="text-xs font-poppins font-thin text-gray-500">
                            {(park.greenArea / 10000).toFixed(1)} ha
                          </div>
                        </div>

                        {/* Columna vertical */}
                        <div className="relative h-64 w-4 flex flex-col justify-end">
                          {/* Fondo de la columna */}
                          <div className="absolute bottom-0 w-full h-full bg-gray-200 rounded-t-3xl border border-gray-300"></div>
                          
                          {/* Relleno de la columna según porcentaje */}
                          <div
                            className="absolute bottom-0 w-full rounded-t-3xl transition-all duration-700 border border-opacity-20"
                            style={{
                              height: `${Math.max(heightPercentage, 5)}%`,
                              backgroundColor: getGreenColor(park.greenPercentage),
                              borderColor: getGreenColor(park.greenPercentage),
                            }}
                          ></div>
                        </div>

                        {/* Nombre del parque a la izquierda de la columna - VERTICAL */}
                        <div className="absolute bottom-32 -left-28 transform -rotate-90 origin-bottom-right w-32">
                          <div className="text-xs font-poppins font-thin text-gray-700 whitespace-nowrap">
                            {park.parkName}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="flex flex-col items-center space-y-2">
                  <Trees className="h-12 w-12 text-gray-300" />
                  <p className="text-lg font-medium">
                    No hay datos de área verde disponibles
                  </p>
                  <p className="text-sm">
                    Los datos aparecerán aquí una vez que se registren las
                    áreas verdes de los parques
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-500 font-poppins font-thin">
              Mostrando todos los {data.totalParks} parques
              registrados en el sistema
            </p>
          </div>
        </GraphicCard>

        {/* Columna derecha: Actividades y Árboles lado a lado */}
        <div className="grid gap-3 grid-cols-2">
          
          {/* Mitad izquierda: Actividades */}
          <MetricCard
            title="Actividades"
            value={data.parkWithMostActivities ? data.parkWithMostActivities.totalActivities : "N/A"}
            subtitle="Parque con más actividades"
            icon={MapPin}
            iconColor="#14b8a6"
            backgroundColor="#003D49"
            className="text-xs"
          >
            {/* Parque con más actividades */}
            {data.parkWithMostActivities && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-200">
                      {data.parkWithMostActivities.parkName}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-green-400">
                    {data.parkWithMostActivities.totalActivities}
                  </span>
                </div>
                
                {/* Parque con menos actividades */}
                {data.parkWithLeastActivities && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span className="text-xs text-gray-200">
                          Menos
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-orange-400">
                        {data.parkWithLeastActivities.totalActivities}
                      </span>
                    </div>
                    <div className="text-xs text-gray-200 truncate">
                      {data.parkWithLeastActivities.parkName}
                    </div>
                  </>
                )}
              </div>
            )}
          </MetricCard>

          {/* Mitad derecha: Árboles */}
          <MetricCard
            title="Árboles"
            value={data.parkWithMostTrees ? data.parkWithMostTrees.totalTrees : "N/A"}
            subtitle="Parque con más árboles"
            icon={Trees}
            iconColor="#10b981"
            backgroundColor="#003D49"
            className="text-xs"
          >
            {/* Parque con más árboles */}
            {data.parkWithMostTrees && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-xs text-gray-200">
                      Más
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-green-400">
                    {data.parkWithMostTrees.totalTrees}
                  </span>
                </div>
                <div className="text-xs text-gray-200 truncate">
                  {data.parkWithMostTrees.parkName}
                </div>
                
                {/* Parque con menos árboles */}
                {data.parkWithLeastTrees && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span className="text-xs text-gray-200">
                          Menos
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-orange-400">
                        {data.parkWithLeastTrees.totalTrees}
                      </span>
                    </div>
                    <div className="text-xs text-gray-200 truncate">
                      {data.parkWithLeastTrees.parkName}
                    </div>
                  </>
                )}
              </div>
            )}
          </MetricCard>
          
        </div>

      </div>

    </DashboardLayout>
  );
};

export default ParksDashboard;