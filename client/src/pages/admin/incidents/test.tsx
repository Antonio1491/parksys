import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ClipboardList } from 'lucide-react';
import { Link } from 'wouter';

export default function IncidentsTest() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🔧 TEST: Nueva Sección Formulario</h1>
      
      {/* Sección Formulario */}
      <Card className="p-4 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Formulario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              asChild
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Link href="/admin/incidents/new">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Incidencia
              </Link>
            </Button>
            <Button 
              variant="outline"
              asChild
            >
              <Link href="/admin/incidents/categories">
                <ClipboardList className="h-4 w-4 mr-2" />
                Gestionar Categorías
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
        <p className="text-green-800">✅ Si puedes ver esto, el hot reloading funciona correctamente.</p>
      </div>
    </div>
  );
}