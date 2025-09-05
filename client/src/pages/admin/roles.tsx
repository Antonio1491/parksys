import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import RolesManagement from './configuracion-seguridad/componentes/RolesManagement';

export default function RolesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Roles y Permisos</h1>
            <p className="text-gray-600">Administra los roles del sistema y sus permisos asociados</p>
          </div>
        </div>

        {/* Componente de gestión de roles */}
        <RolesManagement />
      </div>
    </AdminLayout>
  );
}