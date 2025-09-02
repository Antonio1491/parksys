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
  Users,
  Calendar,
  ParkingCircle,
  Activity
} from "lucide-react";
import DashboardLayout from "@/components/ui/dashboard-layout";
import MetricCard from "@/components/ui/metric-card";
import GraphicCard from "@/components/ui/graphic-card";
import VerticalBarChart from "@/components/ui/vertical-bar-chart";
import ParkStarRatingChart from "@/components/ui/park-star-rating-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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
  parksByType?: Array<{
    type: string;
    count: number;
  }>;
  // NUEVAS MÉTRICAS:
  mostVisitedPark?: {
    parkId: number;
    parkName: string;
    weeklyVisitors: number;
    visitRecords: number;
  } | null;
  parkWithMostAmenities?: {
    parkId: number;
    parkName: string;
    amenityCount: number;
  } | null;
  parkWithLeastAmenities?: {
    parkId: number;
    parkName: string;
    amenityCount: number;
  } | null;
  mostRequestedPark?: {
    parkId: number;
    parkName: string;
    reservationRequests: number;
    approvedReservations: number;
    pendingReservations: number;
  } | null;
  parkWithMostAvailableSpaces?: {
    parkId: number;
    parkName: string;
    totalSpaces: number;
    availableSpaces: number;
  } | null;
  parkWithMostEvents?: {
    parkId: number;
    parkName: string;
    scheduledEvents: number;
    upcomingEvents: number;
    activeEvents: number;
  } | null;
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
            title="Evaluación Promedio"
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

        {/* Columna derecha: Gráfico de Clasificación de Parques por Tipo */}
        <GraphicCard
          title="🏛️ Clasificación de Parques por Tipo"
          description="Distribución de parques según su clasificación y escala en el sistema municipal"
          className="h-full"
        >
          <div className="w-full">
            {data.parksByType && data.parksByType.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                {/* Gráfico de pastel */}
                <div className="w-full lg:w-1/2 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.parksByType.map((item, index) => ({
                          ...item,
                          color: [
                            '#0088FE', // Azul
                            '#00C49F', // Verde turquesa
                            '#FFBB28', // Amarillo
                            '#FF8042', // Naranja
                            '#8884D8', // Morado
                            '#82CA9D', // Verde lima
                            '#FFC658', // Amarillo naranja
                            '#FF7C7C', // Rosa
                            '#8DD1E1', // Azul claro
                            '#D084D0'  // Morado claro
                          ][index % 10]
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="count"
                      >
                        {data.parksByType.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={[
                            '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
                            '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
                          ][index % 10]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `${value} parque${value !== 1 ? 's' : ''}`, 
                          name === 'count' ? 'Cantidad' : name
                        ]}
                        labelFormatter={(label) => `Tipo: ${label}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Leyenda personalizada */}
                <div className="w-full lg:w-1/2 space-y-3">
                  <h4 className="font-semibold text-gray-700 mb-4">Tipos de Parques</h4>
                  {data.parksByType.map((item, index) => {
                    const color = [
                      '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
                      '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
                    ][index % 10];
                    const percentage = ((item.count / data.totalParks) * 100).toFixed(1);
                    
                    // Formatear nombres de tipos de parques (tipología oficial)
                    const formatParkType = (type: string) => {
                      // Los nombres vienen de la tabla park_typology, ya están correctamente formateados
                      const typeMap: { [key: string]: string } = {
                        'Metropolitano': 'Metropolitano',
                        'Urbano': 'Urbano',
                        'Comunitario': 'Comunitario',
                        'Vecinal': 'Vecinal',
                        'Barrial': 'Barrial',
                        // Mantener compatibilidad con posibles valores legacy
                        'metropolitano': 'Metropolitano',
                        'urbano': 'Urbano',
                        'comunitario': 'Comunitario',
                        'vecinal': 'Vecinal',
                        'barrial': 'Barrial'
                      };
                      return typeMap[type] || type;
                    };

                    return (
                      <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium text-gray-700">
                            {formatParkType(item.type)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {item.count} parque{item.count !== 1 ? 's' : ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            {percentage}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="flex flex-col items-center space-y-2">
                  <Map className="h-12 w-12 text-gray-300" />
                  <p className="text-lg font-medium">
                    No hay clasificación de parques disponible
                  </p>
                  <p className="text-sm">
                    Los datos aparecerán aquí una vez que se clasifiquen los parques por tipo
                  </p>
                </div>
              </div>
            )}
          </div>
        </GraphicCard>

      </div>

      {/* Nueva fila: Métricas adicionales en 6 columnas */}
      <div className="grid gap-4 lg:grid-cols-6">
        
        {/* Actividades */}
        <MetricCard
          title="Actividades"
          value={data.parkWithMostActivities?.totalActivities.toString() || "0"}
          subtitle="Más activo"
          icon={Activity}
          backgroundColor="white"
          textColor="#00444f"
          borderColor="#00444f"
        >
          {data.parkWithMostActivities && (
            <div className="space-y-1">
              <div className="text-xs truncate" style={{ color: "#00444f" }}>
                {data.parkWithMostActivities.parkName}
              </div>
              <div className="text-xs" style={{ color: "#14b8a6" }}>
                {data.parkWithMostActivities.activeActivities} activas
              </div>
            </div>
          )}
        </MetricCard>

        {/* Árboles */}
        <MetricCard
          title="Árboles"
          value={data.parkWithMostTrees?.totalTrees.toString() || "0"}
          subtitle="Más arbolado"
          icon={Trees}
          backgroundColor="white"
          textColor="#00444f"
          borderColor="#00444f"
        >
          {data.parkWithMostTrees && (
            <div className="space-y-1">
              <div className="text-xs truncate" style={{ color: "#00444f" }}>
                {data.parkWithMostTrees.parkName}
              </div>
              <div className="text-xs" style={{ color: "#14b8a6" }}>
                {data.parkWithMostTrees.healthyTrees} saludables
              </div>
            </div>
          )}
        </MetricCard>

        {/* Visitantes */}
        <MetricCard
          title="Visitantes"
          value={data.mostVisitedPark?.weeklyVisitors.toString() || "0"}
          subtitle="Más visitado"
          icon={Users}
          backgroundColor="white"
          textColor="#00444f"
          borderColor="#00444f"
        >
          {data.mostVisitedPark && (
            <div className="space-y-1">
              <div className="text-xs truncate" style={{ color: "#00444f" }}>
                {data.mostVisitedPark.parkName}
              </div>
              <div className="text-xs" style={{ color: "#0088FE" }}>
                {data.mostVisitedPark.visitRecords} registros
              </div>
            </div>
          )}
        </MetricCard>

        {/* Amenidades */}
        <MetricCard
          title="Amenidades"
          value={data.parkWithMostAmenities?.amenityCount.toString() || "0"}
          subtitle="Mejor equipado"
          icon={ParkingCircle}
          backgroundColor="white"
          textColor="#00444f"
          borderColor="#00444f"
        >
          {data.parkWithMostAmenities && (
            <div className="space-y-1">
              <div className="text-xs truncate" style={{ color: "#00444f" }}>
                {data.parkWithMostAmenities.parkName}
              </div>
              <div className="text-xs" style={{ color: "#8884D8" }}>
                amenidades instaladas
              </div>
            </div>
          )}
        </MetricCard>

        {/* Reservas */}
        <MetricCard
          title="Reservas"
          value={data.mostRequestedPark?.reservationRequests.toString() || "0"}
          subtitle="Más solicitado"
          icon={Calendar}
          backgroundColor="white"
          textColor="#00444f"
          borderColor="#00444f"
        >
          {data.mostRequestedPark && (
            <div className="space-y-1">
              <div className="text-xs truncate" style={{ color: "#00444f" }}>
                {data.mostRequestedPark.parkName}
              </div>
              <div className="text-xs" style={{ color: "#FF8042" }}>
                {data.mostRequestedPark.approvedReservations} aprobadas
              </div>
            </div>
          )}
        </MetricCard>

        {/* Eventos */}
        <MetricCard
          title="Eventos"
          value={data.parkWithMostEvents?.scheduledEvents.toString() || "0"}
          subtitle="Más eventos"
          icon={Calendar}
          backgroundColor="white"
          textColor="#00444f"
          borderColor="#00444f"
        >
          {data.parkWithMostEvents && (
            <div className="space-y-1">
              <div className="text-xs truncate" style={{ color: "#00444f" }}>
                {data.parkWithMostEvents.parkName}
              </div>
              <div className="text-xs" style={{ color: "#00C49F" }}>
                {data.parkWithMostEvents.upcomingEvents} próximos
              </div>
            </div>
          )}
        </MetricCard>

      </div>

      {/* Tercera fila: Gráfico de Evaluación Promedio por Parque */}
      <div className="grid gap-6 lg:grid-cols-1">
        <GraphicCard
          title="⭐ Evaluación Promedio por Parque"
          description="Nivel de satisfacción promedio de visitantes por parque basado en evaluaciones"
          className="h-full"
        >
          <ParkStarRatingChart
            data={data.parkEvaluations || []}
            emptyStateTitle="No hay evaluaciones disponibles"
            emptyStateDescription="Los datos de evaluación aparecerán aquí una vez que los visitantes evalúen los parques"
            footerText={
              data.parkEvaluations?.length > 0 
                ? `Mostrando todos los ${data.parkEvaluations.length} parques registrados en el sistema`
                : undefined
            }
          />
        </GraphicCard>
      </div>

      {/* Cuarta fila: 2 columnas - Gráfico de Área Verde + Actividades y Árboles */}
      <div className="grid gap-4 lg:grid-cols-2">
        
        {/* Columna izquierda: Gráfico de Porcentaje de Área Verde */}
        <GraphicCard
          title="🌿 Porcentaje de Área Verde por Parque"
          description="Distribución del área verde en cada parque"
          className="h-full"
        >
          <VerticalBarChart
            data={(data.greenAreaPercentages || []).map((park) => ({
              label: park.parkName,
              value: park.greenPercentage,
              id: park.parkId
            }))}
            emptyStateTitle="No hay datos de área verde disponibles"
            emptyStateDescription="Los datos aparecerán aquí una vez que se registren las áreas verdes de los parques"
            footerText={
              data.greenAreaPercentages && data.greenAreaPercentages.length > 0
                ? `Mostrando todos los ${data.greenAreaPercentages.length} parques registrados en el sistema`
                : undefined
            }
            sortDescending={true}
            showLabels={true}
            formatValue={(value) => `${Math.round(value)}%`}
          />
        </GraphicCard>
        
      </div>


    </DashboardLayout>
  );
};

export default ParksDashboard;