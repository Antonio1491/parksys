import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import ROUTES from '@/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Images, MapPin, Users, TreePine, FileText, Save, Trees } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import { ReturnHeader } from '@/components/ui/return-header';
import { ParkBasicInfoForm } from '@/components/admin/parks/ParkBasicInfoForm';
import ParkMultimediaManager from '@/components/ParkMultimediaManager';
import ParkAmenitiesManager from '@/components/ParkAmenitiesManager';
import ParkTreeSpeciesManager from '@/components/ParkTreeSpeciesManager';
import ParkVolunteersManager from '@/components/ParkVolunteersManager';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const AdminParkManage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const parkId = parseInt(id!);

  // ========== QUERY PARA CARGAR DATOS DEL PARQUE ==========
  const { data: park, isLoading } = useQuery({
    queryKey: [`/api/parks/${parkId}`],
    enabled: !!parkId,
  });

  // ========== HANDLER POST-GUARDADO ==========
  const handleSuccess = (parkId: number) => {
    // Recargar datos del parque
    queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });

    // Toast de confirmación
    toast({
      title: 'Parque actualizado',
      description: 'La información del parque se ha actualizado exitosamente.',
    });

    // NO redirige, se queda en park-manage
  };

  // ========== LOADING STATE ==========
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  // ========== ERROR STATE ==========
  if (!park) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-xl text-gray-600">Parque no encontrado</p>
          <Button onClick={() => setLocation(ROUTES.admin.parks.list)}>
            Volver al listado
          </Button>
        </div>
      </AdminLayout>
    );
  }

  // ========== RENDER ==========
  return (
    <AdminLayout>
      {/* Header con navegación de regreso */}
      <ReturnHeader />

      {/* Contenedor principal responsive */}
      <div className="space-y-4 px-4 sm:px-6">

        {/* Header con título y botón guardar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border shadow-sm">
          {/* Título con ícono */}
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-[#00444f] rounded-full">
              <Trees className="h-5 w-5 text-[#00444f]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#00444f]">{park.name}</h1>
              <p className="text-sm text-gray-600">ID: {park.id}</p>
            </div>
          </div>

          {/* Botón guardar - solo visible en pestaña "basica" */}
          <Button 
            type="submit"
            form="park-basic-form"
            className="w-full sm:w-auto bg-[#00444f] hover:bg-[#00a884] hover:text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>

        {/* Tabs de gestión */}
        <Tabs defaultValue="basica" className="space-y-4">

          {/* Lista de tabs - responsive */}
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto gap-1 bg-gray-100 p-1">
            <TabsTrigger value="basica" className="flex items-center gap-2 text-xs sm:text-sm py-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Información Básica</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="multimedia" className="flex items-center gap-2 text-xs sm:text-sm py-2">
              <Images className="h-4 w-4" />
              <span className="hidden sm:inline">Multimedia</span>
              <span className="sm:hidden">Media</span>
            </TabsTrigger>
            <TabsTrigger value="amenidades" className="flex items-center gap-2 text-xs sm:text-sm py-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Amenidades</span>
              <span className="sm:hidden">Amenid.</span>
            </TabsTrigger>
            <TabsTrigger value="arboles" className="flex items-center gap-2 text-xs sm:text-sm py-2">
              <TreePine className="h-4 w-4" />
              <span className="hidden sm:inline">Árboles</span>
              <span className="sm:hidden">Árboles</span>
            </TabsTrigger>
            <TabsTrigger value="voluntarios" className="flex items-center gap-2 text-xs sm:text-sm py-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Voluntarios</span>
              <span className="sm:hidden">Volunt.</span>
            </TabsTrigger>
          </TabsList>

          {/* ========== TAB 1: INFORMACIÓN BÁSICA ========== */}
          <TabsContent value="basica" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl text-gray-800 flex items-center gap-2">
                  <div className="p-2 border-2 border-gray-800 rounded-full">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  Información Básica del Parque
                </CardTitle>
                <CardDescription>
                  Administra la información general y detalles del parque.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ParkBasicInfoForm
                  parkId={parkId}
                  onSuccess={handleSuccess}
                  showCancelButton={false}
                  formId="park-basic-form"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== TAB 2: MULTIMEDIA ========== */}
          <TabsContent value="multimedia" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl text-gray-800 flex items-center gap-2">
                  <div className="p-2 border-2 border-gray-800 rounded-full">
                    <Images className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  Gestión de Multimedia del Parque
                </CardTitle>
                <CardDescription>
                  Administra imágenes y documentos del parque. Puedes subir archivos o usar URLs externas.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ParkMultimediaManager parkId={parkId} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== TAB 3: AMENIDADES ========== */}
          <TabsContent value="amenidades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl text-gray-800 flex items-center gap-2">
                  <div className="p-2 border-2 border-gray-800 rounded-full">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  Gestión de Amenidades del Parque
                </CardTitle>
                <CardDescription>
                  Administra las amenidades y servicios disponibles en el parque. Puedes agregar nuevas amenidades o editar las existentes.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ParkAmenitiesManager parkId={parkId} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== TAB 4: ÁRBOLES ========== */}
          <TabsContent value="arboles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl text-gray-800 flex items-center gap-2">
                  <div className="p-2 border-2 border-gray-800 rounded-full">
                    <TreePine className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  Gestión de Especies Arbóreas del Parque
                </CardTitle>
                <CardDescription>
                  Administra las especies arbóreas asignadas al parque. Puedes seleccionar especies del catálogo y configurar detalles de plantación.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ParkTreeSpeciesManager parkId={parkId} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== TAB 5: VOLUNTARIOS ========== */}
          <TabsContent value="voluntarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl text-gray-800 flex items-center gap-2">
                  <div className="p-2 border-2 border-gray-800 rounded-full">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  Gestión de Voluntarios del Parque
                </CardTitle>
                <CardDescription>
                  Administra los voluntarios asignados al parque. Selecciona voluntarios disponibles de la columna izquierda para asignarlos a este parque.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ParkVolunteersManager parkId={parkId} />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminParkManage;