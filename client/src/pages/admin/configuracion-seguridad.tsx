import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Settings, Users, Bell, FileText, Wrench, Download } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

// Importar componentes de las pestañas
import PanelDeControl from './configuracion-seguridad/PanelDeControl';
import ControlDeAcceso from './configuracion-seguridad/ControlDeAcceso';
import Politicas from './configuracion-seguridad/Politicas';
import NotificacionesAdmin from './configuracion-seguridad/NotificacionesAdmin';
import Auditoria from './configuracion-seguridad/Auditoria';
import Mantenimiento from './configuracion-seguridad/Mantenimiento';
import ExportacionesConfig from './configuracion-seguridad/ExportacionesConfig';

export default function ConfiguracionSeguridad() {
  const [activeTab, setActiveTab] = useState("panel");

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con título */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10 text-blue-700" />
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Configuración y Seguridad</h1>
              <p className="text-blue-700 mt-1">Centro unificado de administración del sistema</p>
            </div>
          </div>
        </Card>

        {/* Navegación por pestañas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 h-12">
            <TabsTrigger value="panel" className="flex flex-col items-center gap-1 h-full">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Panel de Control</span>
            </TabsTrigger>
            <TabsTrigger value="acceso" className="flex flex-col items-center gap-1 h-full">
              <Users className="h-4 w-4" />
              <span className="text-xs">Control de Acceso</span>
            </TabsTrigger>
            <TabsTrigger value="politicas" className="flex flex-col items-center gap-1 h-full">
              <Shield className="h-4 w-4" />
              <span className="text-xs">Políticas</span>
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="flex flex-col items-center gap-1 h-full">
              <Bell className="h-4 w-4" />
              <span className="text-xs">Notificaciones</span>
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="flex flex-col items-center gap-1 h-full">
              <FileText className="h-4 w-4" />
              <span className="text-xs">Auditoría</span>
            </TabsTrigger>
            <TabsTrigger value="mantenimiento" className="flex flex-col items-center gap-1 h-full">
              <Wrench className="h-4 w-4" />
              <span className="text-xs">Mantenimiento</span>
            </TabsTrigger>
            <TabsTrigger value="exportaciones" className="flex flex-col items-center gap-1 h-full">
              <Download className="h-4 w-4" />
              <span className="text-xs">Exportaciones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="panel">
            <PanelDeControl />
          </TabsContent>

          <TabsContent value="acceso">
            <ControlDeAcceso />
          </TabsContent>

          <TabsContent value="politicas">
            <Politicas />
          </TabsContent>

          <TabsContent value="notificaciones">
            <NotificacionesAdmin />
          </TabsContent>

          <TabsContent value="auditoria">
            <Auditoria />
          </TabsContent>

          <TabsContent value="mantenimiento">
            <Mantenimiento />
          </TabsContent>

          <TabsContent value="exportaciones">
            <ExportacionesConfig />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}