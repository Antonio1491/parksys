import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Map,
  MapPin,
  Trees,
  TreePine,
  Calendar,
  Users,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Wrench,
  UserCheck,
  AlertCircle,
  Package,
  Award,
  MessageSquare,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
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
  totalVisitors: number;
  activeParks: number;
  maintenanceAreas: number;
  totalActivities: number;
  totalVolunteers: number;
  totalTrees: number;
  totalAmenities: number;
  totalInstructors: number;
  totalIncidents: number;
  resolvedIncidents: number;
  totalReports: number;
  resolvedReports: number;
  totalAssets: number;
  averageRating: number;
  bestEvaluatedPark: {
    parkId: number;
    parkName: string;
    averageRating: number;
    evaluationCount: number;
  } | null;
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
      <AdminLayout>
        <div className="space-y-6">
          <div className="mb-8">
            <div className="flex items-center gap-4">
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
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">
            Error al cargar los datos del dashboard
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="mb-8">
          <div className="flex items-center gap-4">
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
      <div className="space-y-6">
        {/* Main Header con fondo coloreado */}
        <div 
          className="mb-4 py-8 px-4 -mx-4 -mt-6 flex items-center justify-between"
          style={{ backgroundColor: "#14b8a6" }}
        >
          <div className="flex items-center gap-3">
            <Map className="h-6 w-6 text-white" />
            <h1 className="text-3xl font-bold text-white font-poppins">
              Parques
            </h1>
          </div>
          <p className="text-base font-normal text-white font-poppins">
            Métricas / Módulo de Gestión
          </p>
        </div>

        {/* Sección 1: Métricas Principales - Grid de 4 columnas con columna 3 dividida */}
        <div className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-4">
            
            {/* Columna 1: Total de Parques + Green Flag Award */}
            <Card
              className="border-0 shadow-lg text-white rounded-3xl"
              style={{ backgroundColor: "#003D49" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-gray-100">
                  Total de Parques
                </CardTitle>
                <div
                  className="rounded-full p-2"
                  style={{ backgroundColor: "#14b8a6" }}
                >
                  <MapPin className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {data.totalParks}
                </div>
                <p className="text-xs text-white mb-3">
                  {data.activeParks} activos
                </p>

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
              </CardContent>
            </Card>

            {/* Columna 2: Superficie Total + Área Verde */}
            <Card
              className="border-0 shadow-lg text-white rounded-3xl"
              style={{ backgroundColor: "#003D49" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-gray-100">
                  Superficie Total
                </CardTitle>
                <div
                  className="rounded-full p-2"
                  style={{ backgroundColor: "#14b8a6" }}
                >
                  <Trees className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {data.totalSurface
                    ? `${(data.totalSurface / 10000).toFixed(1)} ha`
                    : "N/A"}
                </div>
                <p className="text-xs text-white mb-3">
                  Superficie total de parques
                </p>

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
              </CardContent>
            </Card>

            {/* Columna 3: Dividida en 2 mitades verticales - Reportes e Incidencias */}
            <div className="flex flex-row gap-3">
              
              {/* Columna 3a (mitad izquierda): Reportes Públicos */}
              <Card
                className="border-0 shadow-lg text-white flex-1 rounded-3xl"
                style={{ backgroundColor: "#003D49" }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium text-gray-100">
                    Reportes Públicos
                  </CardTitle>
                  <div
                    className="rounded-full p-1.5"
                    style={{ backgroundColor: "#14b8a6" }}
                  >
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="py-2">
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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium text-gray-100">
                    Incidencias
                  </CardTitle>
                  <div
                    className="rounded-full p-1.5"
                    style={{ backgroundColor: "#14b8a6" }}
                  >
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="py-2">
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
            <Card
              className="border-0 shadow-lg text-white rounded-3xl"
              style={{ backgroundColor: "#003D49" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-gray-100">
                  Calificación Promedio
                </CardTitle>
                <div
                  className="rounded-full p-2"
                  style={{ backgroundColor: "#14b8a6" }}
                >
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {data.averageRating ? data.averageRating.toFixed(1) : "N/A"}
                </div>
                <p className="text-xs text-white mb-3">
                  Promedio de evaluaciones
                </p>
                
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
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Fila dividida en 2 columnas */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* Columna izquierda: Mapa de parques */}
          <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-0"> {/* <- sin padding */}
              <div className="relative h-[30rem] w-full">
                <MapContainer
                  center={mexicoCenter}
                  zoom={6}
                  className="absolute inset-0 !h-full !w-full"
                  style={{ height: "100%", width: "100%", background: "transparent" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {data.parksWithCoordinates
                    ?.filter(
                      (park) =>
                        park.latitude != null &&
                        park.longitude != null &&
                        !isNaN(park.latitude) &&
                        !isNaN(park.longitude),
                    )
                    .map((park) => (
                      <Marker key={park.id} position={[park.latitude, park.longitude]}>
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

          {/* Columna derecha: Gráfico de Evaluación Promedio por Parque */}
          <div>
            <Card className="border-0 shadow-lg rounded-3xl h-full">
              <CardHeader className="bg-white rounded-t-lg">
                <CardTitle className="text-lg font-bold text-gray-800">
                  ⭐ Evaluación Promedio por Parque
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Nivel de satisfacción promedio de visitantes por parque basado
                  en evaluaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="w-full">
                  {data.parkEvaluations?.length > 0 ? (
                    <div className="flex justify-center items-end gap-2 min-h-[320px] px-4 overflow-x-auto">
                      {data.parkEvaluations
                        .sort((a, b) => b.averageRating - a.averageRating)
                        .map((park, index) => {
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
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Tercera fila: Grid de 2 columnas con gráficos */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* Columna izquierda: Gráfico de Porcentaje de Área Verde */}
          <Card className="border-0 shadow-lg rounded-3xl">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="text-lg font-bold text-gray-800">
                🌿 Porcentaje de Área Verde
              </CardTitle>
              <CardDescription className="text-gray-600">
                Proporción de área verde respecto al área total de cada parque
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="w-full">
                {data.greenAreaPercentages?.length > 0 ? (
                  <div className="flex justify-center items-end gap-2 min-h-[320px] px-4 overflow-x-auto">
                    {data.greenAreaPercentages
                      .sort((a, b) => b.greenPercentage - a.greenPercentage)
                      .map((park, index) => {
                        const getPercentageColor = (percentage: number) => {
                          if (percentage >= 80) return "#69c45c"; // Verde excelente
                          if (percentage >= 60) return "#9cb767"; // Verde bueno
                          if (percentage >= 40) return "#bcb57e"; // Amarillo regular
                          if (percentage >= 20) return "#a58567"; // Naranja bajo
                          return "#a86767"; // Rojo muy bajo
                        };

                        const heightPercentage = park.greenPercentage;

                        return (
                          <div key={park.parkId} className="flex flex-col items-center relative">
                            {/* Valor del porcentaje arriba con área en hectáreas */}
                            <div className="mb-2 text-center">
                              <div className="text-sm font-poppins font-thin text-gray-700 flex items-center gap-1">
                                {park.greenPercentage.toFixed(1)}%
                              </div>
                              <div className="text-xs font-poppins font-thin text-gray-500">
                                ({(park.greenArea / 10000).toFixed(1)} ha)
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
                                  backgroundColor: getPercentageColor(park.greenPercentage),
                                  borderColor: getPercentageColor(park.greenPercentage),
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
                        No hay datos de área verde disponibles
                      </p>
                      <p className="text-sm">
                        Los datos aparecerán cuando se registren en los parques
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {data.greenAreaPercentages?.length > 0 && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-500 font-poppins font-thin">
                    Mostrando todos los {data.greenAreaPercentages.length} parques
                    registrados en el sistema
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Columna derecha: Gráfico de Incidencias por Parque */}
          <Card className="border-0 shadow-lg rounded-3xl">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="text-lg font-bold text-gray-800">
                🚨 Incidencias por Parque
              </CardTitle>
              <CardDescription className="text-gray-600">
                Barra gris: Total histórico | Barra verde: % del total del
                sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="w-full">
                {data.incidentsByPark?.length > 0 ? (
                  <div className="flex justify-center items-end gap-2 min-h-[320px] px-4 overflow-x-auto">
                    {data.incidentsByPark
                      .sort((a, b) => b.totalIncidents - a.totalIncidents)
                      .map((park, index) => {
                        const getIncidentColor = (incidents: number) => {
                          if (incidents >= 20) return "#EF4444"; // Rojo crítico
                          if (incidents >= 15) return "#F97316"; // Naranja alto
                          if (incidents >= 10) return "#EAB308"; // Amarillo medio
                          if (incidents >= 5) return "#84CC16"; // Verde bajo
                          return "#22C55E"; // Verde muy bajo
                        };

                        const maxIncidents = Math.max(
                          ...data.incidentsByPark.map((p) => p.totalIncidents),
                        );
                        const heightPercentage = maxIncidents > 0 ? (park.totalIncidents / maxIncidents) * 100 : 0;

                        return (
                          <div key={park.parkId} className="flex flex-col items-center relative">
                            {/* Valor del total arriba con información adicional */}
                            <div className="mb-2 text-center">
                              <div className="text-sm font-poppins font-thin text-gray-700 flex items-center gap-1">
                                {park.totalIncidents}
                              </div>
                              <div className="text-xs font-poppins font-thin text-gray-500">
                                (total)
                              </div>
                            </div>

                            {/* Columna vertical */}
                            <div className="relative h-64 w-4 flex flex-col justify-end">
                              {/* Fondo de la columna */}
                              <div className="absolute bottom-0 w-full h-full bg-gray-200 rounded-t-3xl border border-gray-300"></div>
                              
                              {/* Relleno de la columna según incidencias */}
                              <div
                                className="absolute bottom-0 w-full rounded-t-3xl transition-all duration-700 border border-opacity-20"
                                style={{
                                  height: `${Math.max(heightPercentage, 5)}%`,
                                  backgroundColor: getIncidentColor(park.totalIncidents),
                                  borderColor: getIncidentColor(park.totalIncidents),
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
                        No hay incidencias registradas
                      </p>
                      <p className="text-sm">
                        Los datos aparecerán cuando se registren incidencias en los parques
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {data.incidentsByPark?.length > 0 && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-500 font-poppins font-thin">
                    Mostrando todos los {data.incidentsByPark.length} parques
                    registrados en el sistema
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </AdminLayout>
  );
};

export default ParksDashboard;
