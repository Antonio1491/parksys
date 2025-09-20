import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, FileText, Calculator, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/AdminLayout";

export default function TabuladorCostosAmbu() {
  // Obtener tabulador desde el backend
  const { data: tabulador, isLoading } = useQuery({
    queryKey: ["/api/eventos-ambu/tabulador"],
    queryFn: async () => {
      const response = await fetch("/api/eventos-ambu/tabulador");
      if (!response.ok) throw new Error("Error al cargar tabulador");
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando tabulador...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con patrón Card estandarizado */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">
              Tabulador de Costos
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Tarifas Oficiales
          </p>
        </Card>


      <Tabs defaultValue="fotografia" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fotografia">Fotografía/Video</TabsTrigger>
          <TabsTrigger value="deportivos">Eventos Deportivos</TabsTrigger>
          <TabsTrigger value="comerciales">Comerciales</TabsTrigger>
          <TabsTrigger value="instalaciones">Instalaciones</TabsTrigger>
        </TabsList>

        {/* Fotografía y Video */}
        <TabsContent value="fotografia">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fotografía y Video
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Fotografía Social */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Fotografía Social</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Parques Generales</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(220)}</p>
                      <p className="text-sm text-gray-600">Por sesión</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Jardín Japonés</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(850)}</p>
                      <p className="text-sm text-gray-600">Por sesión</p>
                    </div>
                  </div>
                </div>

                {/* Fotografía Comercial */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Fotografía Comercial</h3>

                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Producción 1-15 personas</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(10000)}</p>
                      <p className="text-sm text-gray-600">Por día</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Producción 15-50 personas</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(25000)}</p>
                      <p className="text-sm text-gray-600">Por día</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Producción 50+ personas</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(50000)}</p>
                      <p className="text-sm text-gray-600">Por día</p>
                    </div>
                  </div>
                </div>

                {/* Video para Redes Sociales */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Video para Redes Sociales</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Especial
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">Grabación de Video</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(1000)}</p>
                    <p className="text-sm text-gray-600">Por hora</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Eventos Deportivos */}
        <TabsContent value="deportivos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Eventos Deportivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Carreras Comerciales */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Carreras Comerciales</h3>

                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Por Participante</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(90)}</p>
                      <p className="text-sm text-gray-600">Cada corredor</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Permiso de Ruta</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(1000)}</p>
                      <p className="text-sm text-gray-600">Uso de ruta</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Presencia de Marca</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(1500)}</p>
                      <p className="text-sm text-gray-600">Patrocinadores</p>
                    </div>
                  </div>
                </div>

                {/* Carreras por Causa Social */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Carreras por Causa Social</h3>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Descuento 50%
                    </Badge>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Por Participante</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(45)}</p>
                      <p className="text-sm text-gray-600">Cada corredor</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Permiso de Ruta</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(1000)}</p>
                      <p className="text-sm text-gray-600">Uso de ruta</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Presencia de Marca</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(1500)}</p>
                      <p className="text-sm text-gray-600">Patrocinadores</p>
                    </div>
                  </div>
                </div>

                {/* Actividades Físicas */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Actividades Físicas Grupales</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Mensual
                    </Badge>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Actividades Físicas</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(1000)}</p>
                      <p className="text-sm text-gray-600">Por mes (máx. 15-20 personas, 8 hrs/semana)</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Entrenamiento Profesional</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(3000)}</p>
                      <p className="text-sm text-gray-600">Por mes</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Eventos Comerciales */}
        <TabsContent value="comerciales">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Eventos Comerciales y Corporativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Entrega de Paquetes */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Entrega de Paquetes</h3>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Comercial
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">Actividad Comercial</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(3000)}</p>
                    <p className="text-sm text-gray-600">Por día</p>
                  </div>
                </div>

                {/* Montaje y Desmontaje */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Montaje y Desmontaje</h3>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      Servicio
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">Instalación de Equipamiento</p>
                    <p className="text-2xl font-bold text-gray-600">{formatCurrency(1500)}</p>
                    <p className="text-sm text-gray-600">Por día</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instalaciones Deportivas */}
        <TabsContent value="instalaciones">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Instalaciones Deportivas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Canchas Quintanar */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Canchas Quintanar</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Instalación
                    </Badge>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Inscripción</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(800)}</p>
                      <p className="text-sm text-gray-600">Por equipo</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Uso de Cancha</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(500)}</p>
                      <p className="text-sm text-gray-600">Por partido</p>
                    </div>
                  </div>
                </div>

                {/* Domo Canchas */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Domo - Canchas</h3>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Variable
                    </Badge>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Lunes a Jueves</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(200)}</p>
                      <p className="text-sm text-gray-600">Por hora</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Viernes a Domingo</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(400)}</p>
                      <p className="text-sm text-gray-600">Por hora</p>
                    </div>
                  </div>
                </div>

                {/* Cancha de la Liberación */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Cancha de la Liberación</h3>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Premium
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">Uso de Instalación</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(800)}</p>
                    <p className="text-sm text-gray-600">Por evento</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notas Importantes */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">

            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Documentación Requerida</p>
                <p className="text-sm text-yellow-700">
                  Todos los precios están vigentes para 2025. Se requiere documentación completa según 
                  el tipo de evento. Consulte los formularios F-DIC-22 y F-DIC-23 para más detalles.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}