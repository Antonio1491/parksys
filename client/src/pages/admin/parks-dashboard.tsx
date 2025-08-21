import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Trees,
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
    queryKey: ["/api/parks/dashboard"],
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold font-poppins">
                  <span style={{ color: "#00444f" }}>MÉTRICAS</span>{" "}
                  <span style={{ color: "#504378" }}>Parques</span>
                </h1>
                <p className="mt-2" style={{ color: "#00444f" }}>
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
                <span style={{ color: "#00444f" }}>MÉTRICAS</span>{" "}
                <span style={{ color: "#504378" }}>Parques</span>
              </h1>
              <p className="mt-2" style={{ color: "#00444f" }}>
                Estadísticas generales del sistema de parques
              </p>
            </div>
          </div>
        </div>
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
            <div>
              <h1 className="text-3xl font-bold font-poppins">
                <span style={{ color: "#00444f" }}>MÉTRICAS</span>{" "}
                <span style={{ color: "#504378" }}>Parques</span>
              </h1>
              <p className="mt-2" style={{ color: "#00444f" }}>
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
                <span style={{ color: "#00444f" }}>MÉTRICAS</span>{" "}
                <span style={{ color: "#504378" }}>Parques</span>
              </h1>
              <p className="mt-2" style={{ color: "#00444f" }}>
                Estadísticas generales del sistema de parques
              </p>
            </div>
          </div>
        </div>

        {/* Sección 1: Métricas Principales */}
        <div className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card
              className="border-0 shadow-lg text-white"
              style={{ backgroundColor: "#003D49" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-gray-100">
                  Total de Parques
                </CardTitle>
                <div
                  className="rounded-full p-2"
                  style={{ backgroundColor: "#513C73" }}
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
                      <Award className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-gray-200">
                        Green Flag Award
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-green-400">
                      {data.greenFlagParks || 0}/{data.totalParks} (
                      {data.greenFlagPercentage?.toFixed(0) || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${data.greenFlagPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-0 shadow-lg text-white"
              style={{ backgroundColor: "#003D49" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-gray-100">
                  Superficie Total
                </CardTitle>
                <div
                  className="rounded-full p-2"
                  style={{ backgroundColor: "#513C73" }}
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
                      <Trees className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-gray-200">Área Verde</span>
                    </div>
                    <span className="text-xs font-semibold text-green-400">
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
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${
                          data.totalSurface && data.totalGreenArea
                            ? (data.totalGreenArea / data.totalSurface) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-0 shadow-lg text-white"
              style={{ backgroundColor: "#003D49" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-gray-100">
                  Calificación
                </CardTitle>
                <div
                  className="rounded-full p-2"
                  style={{ backgroundColor: "#513C73" }}
                >
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {data.averageRating ? data.averageRating.toFixed(1) : "N/A"}
                </div>
                <p className="text-xs text-white">Promedio de evaluaciones</p>
              </CardContent>
            </Card>

            <Card
              className="border-0 shadow-lg text-white"
              style={{ backgroundColor: "#003D49" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-gray-100">
                  Incidencias
                </CardTitle>
                <div
                  className="rounded-full p-2"
                  style={{ backgroundColor: "#B275B0" }}
                >
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {data.totalIncidents}
                </div>
                <p className="text-xs text-white">
                  Incidencias (últimos 30 días)
                </p>
              </CardContent>
            </Card>


          </div>

          {/* Fila adicional para Green Flag Award */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 mt-6">
            <Card
              className="border-0 shadow-lg text-white"
              style={{ backgroundColor: "#2E8B57" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-medium text-gray-100">
                  Green Flag Award
                </CardTitle>
                <div
                  className="rounded-full p-2"
                  style={{ backgroundColor: "#228B22" }}
                >
                  <Award className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-white">
                      {data.greenFlagParks || 0}
                    </div>
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
                      <span>
                        {data.greenFlagParks || 0} de {data.totalParks}
                      </span>
                    </div>
                    <div className="w-full bg-green-900 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(data.greenFlagPercentage || 0, 2)}%`,
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
                Nivel de satisfacción promedio de visitantes por parque basado
                en evaluaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {data.parkEvaluations?.length > 0 ? (
                  data.parkEvaluations
                    .sort((a, b) => b.averageRating - a.averageRating)
                    .map((park, index) => {
                      const percentage = (park.averageRating / 5) * 100;
                      const getRatingColor = (rating: number) => {
                        if (rating >= 4.5) return "#22C55E"; // Verde excelente
                        if (rating >= 4.0) return "#84CC16"; // Verde bueno
                        if (rating >= 3.5) return "#EAB308"; // Amarillo regular
                        if (rating >= 3.0) return "#F97316"; // Naranja bajo
                        return "#EF4444"; // Rojo muy bajo
                      };

                      return (
                        <div
                          key={park.parkId}
                          className="flex items-center space-x-3"
                        >
                          <div className="w-32 text-sm font-medium text-right text-gray-700 truncate">
                            {park.parkName}
                          </div>
                          <div className="flex-1 flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                              <div
                                className="h-6 rounded-full flex items-center justify-between px-3 transition-all duration-700 shadow-sm"
                                style={{
                                  width: `${Math.max(percentage, 10)}%`,
                                  backgroundColor: getRatingColor(
                                    park.averageRating,
                                  ),
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
                            <span
                              className="text-sm font-semibold"
                              style={{
                                color: getRatingColor(park.averageRating),
                              }}
                            >
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
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Mostrando todos los {data.parkEvaluations.length} parques
                    registrados en el sistema
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Porcentaje de Área Verde */}
          <Card className="border-0 shadow-lg max-w-4xl mx-auto">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="text-lg font-bold text-gray-800">
                Porcentaje de Área Verde
              </CardTitle>
              <CardDescription className="text-gray-600">
                Proporción de área verde respecto al área total de cada parque
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {data.greenAreaPercentages?.length > 0 ? (
                  data.greenAreaPercentages
                    .sort((a, b) => b.greenPercentage - a.greenPercentage)
                    .map((park, index) => {
                      const getPercentageColor = (percentage: number) => {
                        if (percentage >= 80) return "#22C55E"; // Verde excelente
                        if (percentage >= 60) return "#84CC16"; // Verde bueno
                        if (percentage >= 40) return "#EAB308"; // Amarillo regular
                        if (percentage >= 20) return "#F97316"; // Naranja bajo
                        return "#EF4444"; // Rojo muy bajo
                      };

                      const maxArea = Math.max(
                        ...data.greenAreaPercentages.map((p) => p.totalArea),
                      );
                      const totalAreaPercentage =
                        (park.totalArea / maxArea) * 100; // Ancho de la barra gris basado en el área total
                      const greenAreaWidth =
                        (park.greenPercentage / 100) * totalAreaPercentage; // Ancho de la barra verde basado en el porcentaje

                      return (
                        <div
                          key={park.parkId}
                          className="flex items-center space-x-2"
                        >
                          <div className="w-28 text-xs font-medium text-right text-gray-700 truncate">
                            {park.parkName}
                          </div>
                          <div className="flex-1 flex items-center">
                            <div className="flex-1 relative h-5">
                              {/* Barra gris proporcional al área total */}
                              <div
                                className="bg-gray-400 rounded-full h-5 relative transition-all duration-700 shadow-sm"
                                style={{
                                  width: `${Math.max(totalAreaPercentage, 8)}%`,
                                }}
                              >
                                {/* Área total en la barra gris */}
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                  <span className="text-white text-xs font-bold truncate px-1">
                                    {park.totalArea.toLocaleString("es-MX", {
                                      notation: "compact",
                                    })}{" "}
                                    m²
                                  </span>
                                </div>
                              </div>

                              {/* Barra verde superpuesta (área verde) */}
                              <div
                                className="absolute top-0 left-0 rounded-full h-5 flex items-center justify-end pr-1 transition-all duration-700 shadow-sm"
                                style={{
                                  width: `${Math.max(greenAreaWidth, 2)}%`,
                                  backgroundColor: getPercentageColor(
                                    park.greenPercentage,
                                  ),
                                }}
                              >
                                <span className="text-white text-xs font-bold">
                                  {park.greenPercentage.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="w-20 text-right">
                            <div className="text-xs text-gray-600">
                              {(park.greenArea / 10000).toLocaleString(
                                "es-MX",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}{" "}
                              ha
                            </div>
                            <div
                              className="text-xs font-semibold"
                              style={{
                                color: getPercentageColor(park.greenPercentage),
                              }}
                            >
                              {park.greenPercentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <CheckCircle className="h-10 w-10 text-gray-300" />
                      <p className="text-sm font-medium">
                        No hay datos de área verde disponibles
                      </p>
                      <p className="text-xs">
                        Los datos aparecerán cuando se registren en los parques
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {data.greenAreaPercentages?.length > 0 && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">
                    Mostrando todos los {data.greenAreaPercentages.length}{" "}
                    parques registrados en el sistema
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* NUEVO: Gráfico de Incidencias por Parque */}
          <Card className="border-0 shadow-lg max-w-4xl mx-auto">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="text-lg font-bold text-gray-800">
                Incidencias por Parque
              </CardTitle>
              <CardDescription className="text-gray-600">
                Barra gris: Total histórico | Barra verde: % del total del
                sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {data.incidentsByPark?.length > 0 ? (
                  data.incidentsByPark
                    .sort((a, b) => b.totalIncidents - a.totalIncidents)
                    .map((park, index) => {
                      const getIncidentColor = (incidents: number) => {
                        if (incidents >= 20) return "#EF4444"; // Rojo crítico
                        if (incidents >= 15) return "#F97316"; // Naranja alto
                        if (incidents >= 10) return "#EAB308"; // Amarillo medio
                        if (incidents >= 5) return "#84CC16"; // Verde bajo
                        return "#22C55E"; // Verde muy bajo
                      };

                      const totalSystemIncidents = data.incidentsByPark.reduce(
                        (sum, p) => sum + p.totalIncidents,
                        0,
                      );
                      const systemPercentage =
                        (park.totalIncidents / totalSystemIncidents) * 100;
                      const maxIncidents = Math.max(
                        ...data.incidentsByPark.map((p) => p.totalIncidents),
                      );
                      const totalIncidentsPercentage =
                        (park.totalIncidents / maxIncidents) * 80; // Escala máxima 80%
                      const systemPercentageWidth =
                        (systemPercentage / 100) * totalIncidentsPercentage;

                      return (
                        <div
                          key={park.parkId}
                          className="flex items-center space-x-2"
                        >
                          <div className="w-28 text-xs font-medium text-right text-gray-700 truncate">
                            {park.parkName}
                          </div>
                          <div className="flex-1 flex items-center">
                            <div className="flex-1 relative h-5">
                              {/* Barra gris para incidencias totales */}
                              <div
                                className="bg-gray-400 rounded-full h-5 relative transition-all duration-700 shadow-sm"
                                style={{
                                  width: `${Math.max(totalIncidentsPercentage, 8)}%`,
                                }}
                              >
                                {/* Total de incidencias */}
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                  <span className="text-white text-xs font-bold truncate px-1">
                                    {park.totalIncidents} total
                                  </span>
                                </div>
                              </div>

                              {/* Barra verde superpuesta (porcentaje del sistema total) */}
                              <div
                                className="absolute top-0 left-0 rounded-full h-5 flex items-center justify-end pr-1 transition-all duration-700 shadow-sm"
                                style={{
                                  width: `${Math.max(systemPercentageWidth, 2)}%`,
                                  backgroundColor: "#22C55E",
                                }}
                              >
                                <span className="text-white text-xs font-bold">
                                  {systemPercentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="w-24 text-right">
                            <div className="text-xs text-green-600 font-semibold">
                              {systemPercentage.toFixed(1)}% del sistema
                            </div>
                            <div className="text-xs text-gray-600">
                              Este mes: {park.incidentsThisMonth}
                            </div>
                            <div
                              className="text-xs font-semibold"
                              style={{
                                color: getIncidentColor(park.totalIncidents),
                              }}
                            >
                              {park.totalIncidents} total
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <CheckCircle className="h-10 w-10 text-gray-300" />
                      <p className="text-sm font-medium">
                        No hay incidencias registradas
                      </p>
                      <p className="text-xs">
                        Los datos aparecerán cuando se registren incidencias en
                        los parques
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {data.incidentsByPark?.length > 0 && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">
                    Mostrando los {data.incidentsByPark.length} parques con
                    incidencias registradas
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
                Mapa interactivo mostrando la ubicación de todos los parques en
                el sistema
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
                  {data.parksWithCoordinates
                    ?.filter(
                      (park) =>
                        park.latitude != null &&
                        park.longitude != null &&
                        !isNaN(park.latitude) &&
                        !isNaN(park.longitude),
                    )
                    .map((park) => (
                      <Marker
                        key={park.id}
                        position={[park.latitude, park.longitude]}
                      >
                        <Popup>
                          <div className="space-y-2">
                            <h3 className="font-semibold">{park.name}</h3>
                            <p className="text-sm text-gray-600">
                              {park.municipality}
                            </p>
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
