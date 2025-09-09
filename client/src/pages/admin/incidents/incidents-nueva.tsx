import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ClipboardList } from 'lucide-react';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';

export default function IncidentsNueva() {
  const [, setLocation] = useLocation();

  const handleNewIncident = () => {
    setLocation('/admin/incidents/new');
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* BANNER CRÍTICO PARA VERIFICAR CACHE */}
        <div className="bg-red-600 text-white p-8 mb-6 rounded-lg text-center">
          <h1 className="text-3xl font-bold">🚨 PÁGINA NUEVA - ESTO DEBE VERSE</h1>
          <p className="text-xl mt-2">Si ves esto, significa que funciona el sistema de archivos</p>
        </div>

        {/* Sección Formulario */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">📝 Formulario de Incidencias</h2>
          </div>
          <div className="space-y-4">
            <p className="text-gray-600">
              Desde aquí puedes crear nuevas incidencias y gestionar las categorías.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleNewIncident}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                ✨ Nueva Incidencia
              </Button>
              <Button 
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                <ClipboardList className="h-5 w-5 mr-2" />
                📂 Gestionar Categorías
              </Button>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">ℹ️ Información</h3>
          <p className="text-blue-700 text-sm">
            Esta es la nueva sección "Formulario" que fue añadida al módulo de incidencias.
            Aquí encontrarás las herramientas para crear y gestionar incidencias.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}