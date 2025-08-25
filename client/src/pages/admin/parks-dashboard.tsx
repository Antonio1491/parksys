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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
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
              <div>
                <h1 className="text-3xl font-bold font-poppins">
                  <span style={{ color: "#00444f" }}>MÉTRICAS</span>{" "}
                  <span style={{ color: "#504378" }}>Parques</span>
                </h1>
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
                    style={{ backgroundColor: "#1E5AA6" }}
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
                    style={{ backgroundColor: "#B275B0" }}
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
                  style={{ backgroundColor: "#513C73" }}
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
            <div className="h-96 w-full">
              <MapContainer
                center={mexicoCenter}
                zoom={6}
                className="h-full w-full rounded-3xl"
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
          </Card>

          {/* Columna derecha: Disponible para contenido adicional */}
          <div className="space-y-4">
            {/* Espacio disponible para contenido adicional */}
          </div>

        </div>

        {/* Separador visual */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* Sección continua con el resto del dashboard */}
        <div className="space-y-6">
          {/* NUEVO: Gráfico de Evaluación Promedio por Parque - Columnas Verticales */}
          <Card className="border-0 shadow-lg max-w-6xl mx-auto rounded-3xl">
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
              <div className="w-full">
                {data.parkEvaluations?.length > 0 ? (
                  <div className="flex justify-center items-end gap-4 min-h-[400px] px-4 overflow-x-auto">
                    {data.parkEvaluations
                      .sort((a, b) => b.averageRating - a.averageRating)
                      .slice(0, 13) // Mostrar solo 13 columnas
                      .map((park, index) => {
                        const heightPercentage = (park.averageRating / 5) * 100;
                        const getRatingColor = (rating: number) => {
                          if (rating >= 4.0) return "#22C55E"; // Verde para calificaciones positivas
                          if (rating >= 2.5) return "#F59E0B"; // Amarillo/naranja para medias
                          return "#EF4444"; // Rojo para bajas
                        };

                        return (
                          <div key={park.parkId} className="flex flex-col items-center relative">
                            {/* Valor del promedio arriba con número de evaluaciones */}
                            <div className="mb-2 text-center">
                              <div className="text-sm font-poppins font-thin text-gray-700 flex items-center gap-1">
                                ⭐ {park.averageRating.toFixed(1)}/5
                              </div>
                              <div className="text-xs font-poppins font-thin text-gray-500">
                                ({park.evaluationCount} eval)
                              </div>
                            </div>

                            {/* Columna vertical */}
                            <div className="relative h-80 w-6 flex flex-col justify-end">
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

                            {/* Nombre del parque a la izquierda de la columna (alineado a la base) */}
                            <div className="absolute bottom-0 -left-2 transform -rotate-45 origin-bottom-left w-32">
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
                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500 font-poppins font-thin">
                    Mostrando {Math.min(data.parkEvaluations.length, 13)} de {data.parkEvaluations.length} parques
                    registrados en el sistema
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* NUEVO: Gráfico de Pastel de Evaluación Promedio por Parque */}
          <Card className="border-0 shadow-lg max-w-6xl mx-auto rounded-3xl">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="text-lg font-bold text-gray-800">
                Distribución de Evaluaciones por Parque
              </CardTitle>
              <CardDescription className="text-gray-600">
                Categorización de parques según su nivel de evaluación promedio
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="w-full">
                {data.parkEvaluations?.length > 0 ? (
                  (() => {
                    // Preparar datos para el gráfico de pastel por parque individual
                    const sortedParks = data.parkEvaluations
                      .sort((a, b) => b.averageRating - a.averageRating)
                      .slice(0, 10); // Mostrar solo los top 10 para mejor visualización

                    // Generar colores únicos para cada parque
                    const generateColors = (count: number) => {
                      const colors = [
                        "#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6",
                        "#06B6D4", "#F97316", "#84CC16", "#EC4899", "#6366F1",
                        "#14B8A6", "#F59E0B", "#10B981", "#8B5CF6", "#F97316"
                      ];
                      return colors.slice(0, count);
                    };

                    const colors = generateColors(sortedParks.length);
                    
                    const pieData = sortedParks.map((park, index) => ({
                      name: park.parkName,
                      value: park.averageRating,
                      evaluationCount: park.evaluationCount,
                      color: colors[index],
                      parkId: park.parkId
                    }));

                    const CustomTooltip = ({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const totalRating = pieData.reduce((sum, park) => sum + park.value, 0);
                        const percentage = ((data.value / totalRating) * 100).toFixed(1);
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-semibold text-gray-800">{data.name}</p>
                            <p className="text-sm text-gray-600">
                              ⭐ {data.value.toFixed(1)}/5.0
                            </p>
                            <p className="text-sm text-gray-600">
                              {data.evaluationCount} evaluaciones
                            </p>
                            <p className="text-xs text-gray-500">
                              {percentage}% del total de puntuación
                            </p>
                          </div>
                        );
                      }
                      return null;
                    };

                    return (
                      <div className="flex flex-col lg:flex-row items-center gap-8">
                        {/* Gráfico de pastel */}
                        <div className="w-full lg:w-1/2 h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                innerRadius={40}
                                paddingAngle={1}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Lista de parques */}
                        <div className="w-full lg:w-1/2 space-y-3">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4">
                            Top {pieData.length} Parques por Evaluación
                          </h4>
                          <div className="max-h-80 overflow-y-auto space-y-2">
                            {pieData.map((park, index) => (
                              <div 
                                key={park.parkId}
                                className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: park.color }}
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-gray-800 truncate max-w-32">
                                      {park.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {park.evaluationCount} evaluaciones
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold" style={{ color: park.color }}>
                                    ⭐ {park.value.toFixed(1)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    #{index + 1}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Resumen estadístico */}
                          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h5 className="text-sm font-semibold text-gray-800 mb-3">
                              Estadísticas del Top {pieData.length}
                            </h5>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Mejor evaluado:</span>
                                <div className="font-semibold text-green-600">
                                  {pieData[0]?.name} ({pieData[0]?.value.toFixed(1)} ⭐)
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Promedio del top:</span>
                                <div className="font-semibold text-blue-600">
                                  {(pieData.reduce((sum, park) => sum + park.value, 0) / pieData.length).toFixed(1)} ⭐
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Total evaluaciones:</span>
                                <div className="font-semibold text-gray-700">
                                  {pieData.reduce((sum, park) => sum + park.evaluationCount, 0)}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Rango de calificación:</span>
                                <div className="font-semibold text-gray-700">
                                  {Math.min(...pieData.map(p => p.value)).toFixed(1)} - {Math.max(...pieData.map(p => p.value)).toFixed(1)} ⭐
                                </div>
                              </div>
                            </div>
                          </div>

                          {data.parkEvaluations.length > 10 && (
                            <div className="text-center mt-4">
                              <p className="text-xs text-gray-500">
                                Mostrando los 10 parques mejor evaluados de {data.parkEvaluations.length} total
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
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
            </CardContent>
          </Card>

          {/* Gráfico de Porcentaje de Área Verde */}
          <Card className="border-0 shadow-lg max-w-4xl mx-auto rounded-3xl">
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
          <Card className="border-0 shadow-lg max-w-4xl mx-auto rounded-3xl">
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

        </div>
      </div>
    </AdminLayout>
  );
};

export default ParksDashboard;
