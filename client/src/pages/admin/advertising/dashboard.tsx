import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/AdminLayout';
import { Monitor, Target, Image, MapPin, TrendingUp, BarChart3 } from 'lucide-react';

const AdvertisingDashboard = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header con fondo coloreado */}
        <div 
          className="py-8 px-4 -mx-4 -mt-6 mb-8"
          style={{ backgroundColor: "#14b8a6" }}
        >
          <div className="flex items-center gap-2">
            <Monitor className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white font-poppins">Dashboard de Publicidad Digital</h1>
          </div>
          <p className="text-base font-normal text-white font-poppins mt-2">Gestión completa de espacios publicitarios y campañas digitales</p>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Espacios Publicitarios</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">10</div>
              <p className="text-xs text-muted-foreground">Espacios configurados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campañas Activas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Campañas en ejecución</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anuncios</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Anuncios disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asignaciones</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Asignaciones activas</p>
            </CardContent>
          </Card>
        </div>

        {/* Información del sistema */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estado del Sistema
              </CardTitle>
              <CardDescription>
                Estado actual del sistema de publicidad digital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Backend</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Funcional</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Base de Datos</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Conectada</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Endpoints</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Operativos</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Espacios por Página
              </CardTitle>
              <CardDescription>
                Distribución de espacios publicitarios por tipo de página
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Parques</span>
                <Badge variant="outline">3 espacios</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Especies Arbóreas</span>
                <Badge variant="outline">2 espacios</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Actividades</span>
                <Badge variant="outline">2 espacios</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Concesiones</span>
                <Badge variant="outline">2 espacios</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Homepage</span>
                <Badge variant="outline">1 espacio</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdvertisingDashboard;