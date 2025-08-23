import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/AdminLayout';
import { 
  Mail, 
  Send, 
  Clock, 
  Users, 
  FileText, 
  BarChart3,
  Plus,
  MessageSquare
} from 'lucide-react';

const CommunicationsPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header con fondo coloreado */}
        <div 
          className="py-8 px-4 -mx-4 -mt-6 flex items-center justify-between"
          style={{ backgroundColor: "#14b8a6" }}
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white font-poppins">Dashboard de Comunicaciones</h1>
              <p className="text-base font-normal text-white font-poppins">Panel de control para gestión de comunicaciones y campañas</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Mail className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">1,234</p>
                  <p className="text-xs text-gray-500">Emails Enviados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">45</p>
                  <p className="text-xs text-gray-500">En Cola</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-gray-500">Plantillas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">89%</p>
                  <p className="text-xs text-gray-500">Tasa de Entrega</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>
                Últimos emails enviados y programados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No hay actividad reciente</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button className="h-20 flex flex-col items-center justify-center gap-2">
                <Plus className="h-6 w-6" />
                <span className="text-sm">Nueva Plantilla</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Send className="h-6 w-6" />
                <span className="text-sm">Envío Masivo</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Nueva Campaña</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Ver Análisis</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CommunicationsPage;