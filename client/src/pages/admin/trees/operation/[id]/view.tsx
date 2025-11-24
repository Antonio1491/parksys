import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';
import ROUTES from '@/routes';

// Components
import AdminLayout from '@/components/AdminLayout';
import { ReturnHeader } from '@/components/ui/return-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Icons
import {
  TreePine,
  MapPin,
  Wrench,
  Edit,
  Trees,
  Ruler,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Hash,
  Clock,
  Download,
  Map as MapIcon,
} from 'lucide-react';

// Types
interface ParkArea {
  id: number;
  parkId: number;
  name: string;
  code: string;
  areaCode?: string;
  codePrefix?: string;
  description?: string;
  dimensions?: string;
  imageUrl?: string;
  polygon?: any;
  useGpsMatching?: boolean;
  useCodeMatching?: boolean;
  status?: string;
  responsiblePerson?: string;
  createdAt?: string;
  updatedAt?: string;
  parkName?: string;
  treeCount?: number;
}

interface Tree {
  id: number;
  code?: string;
  treeCode?: string;
  species_id?: number;
  speciesName?: string;
  commonName?: string;
  scientificName?: string;
  health_status?: string;
  height?: number;
  diameter?: number;
  park_id?: number;
  area_id?: number;
}

export default function AreaDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [treesPage, setTreesPage] = useState(1);
  const treesPerPage = 10;

  // Fetch area details
  const { data: area, isLoading: isLoadingArea } = useQuery<ParkArea>({
    queryKey: ['/api/trees/areas', id],
    queryFn: () => apiRequest(`/api/trees/areas/${id}`),
    enabled: !!id,
  });

  // Fetch trees in this area
  const { data: treesData, isLoading: isLoadingTrees } = useQuery<{ trees: Tree[]; total: number }>({
    queryKey: ['/api/trees/areas', id, 'trees', treesPage],
    queryFn: async () => {
      const response = await apiRequest(`/api/trees/areas/${id}/trees?page=${treesPage}&limit=${treesPerPage}`);
      if (Array.isArray(response)) {
        return { trees: response, total: response.length };
      }
      return response;
    },
    enabled: !!id,
  });

  const trees = treesData?.trees || [];
  const totalTrees = treesData?.total || area?.treeCount || 0;
  const totalPages = Math.ceil(totalTrees / treesPerPage);

  // Loading state
  if (isLoadingArea) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Not found state
  if (!area) {
    return (
      <AdminLayout>
        <ReturnHeader to={ROUTES.admin.trees.operation} label="Volver a Operación" />
        <div className="p-6">
          <div className="text-center py-12">
            <TreePine className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Área no encontrada
            </h2>
            <p className="text-gray-600 mb-4">
              No se pudo cargar la información del área.
            </p>
            <Link href={ROUTES.admin.trees.operation}>
              <Button variant="outline">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver a Operación
              </Button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Return Header */}
      <ReturnHeader to={ROUTES.admin.trees.operation} label="Volver a Operación" />

      <div className="space-y-4">
        {/* Header Principal */}
        <div className="bg-white p-8 -mx-6 relative">
          {/* Botones de acción */}
          <div className="absolute top-12 right-12 z-10">
            <div className="flex gap-2">
              <Link href={`/admin/trees/operation/${area.id}/edit`}>
                <Button className="bg-[#a0cc4d] hover:bg-[#00a884] text-white hover:text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
              <Button
                onClick={() => console.log('Exportar área')}
                className="bg-[#00444f] hover:bg-[#00a587] text-white hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-10">
            {/* Imagen del área */}
            <div className="w-80 aspect-[16/10] rounded-lg bg-gradient-to-br from-[#ceefea] to-[#00a587] flex-shrink-0 overflow-hidden flex items-center justify-center">
              {area.imageUrl ? (
                <img
                  src={area.imageUrl}
                  alt={`Imagen de ${area.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <MapPin className="h-20 w-20 text-white/50" />
              )}
            </div>

            {/* Info principal */}
            <div>
              <h1 className="text-3xl font-bold text-[#00444f] mt-4">
                {area.name}
              </h1>

              {/* Datos clave en fila */}
              <div className="flex items-start gap-14 mt-8">
                {/* Parque */}
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-[#00444f] rounded-full">
                    <MapPin className="h-5 w-5 text-[#00444f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">
                      Parque
                    </p>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {area.parkName || 'No asignado'}
                    </p>
                  </div>
                </div>

                {/* Código */}
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-[#00444f] rounded-full">
                    <Hash className="h-5 w-5 text-[#00444f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">
                      Código
                    </p>
                    <p className="text-sm text-gray-900 font-medium mt-1 font-mono">
                      {area.code || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Dimensiones */}
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-[#00444f] rounded-full">
                    <Ruler className="h-5 w-5 text-[#00444f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">
                      Dimensiones
                    </p>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {area.dimensions ? `${area.dimensions} ha` : 'No especificadas'}
                    </p>
                  </div>
                </div>

                {/* Responsable */}
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-[#00444f] rounded-full">
                    <User className="h-5 w-5 text-[#00444f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">
                      Responsable
                    </p>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {area.responsiblePerson || 'No asignado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {area.description && (
                <div className="mt-6">
                  <p className="text-gray-700 leading-relaxed">
                    {area.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Árboles */}
          <Card className="bg-[#ceefea] border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00444f] rounded-full">
                  <Trees className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Árboles</p>
                  <p className="text-3xl font-bold text-[#00444f]">
                    {area.treeCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mantenimientos */}
          <Card className="bg-[#ceefea] border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00444f] rounded-full">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Mantenimientos</p>
                  <p className="text-3xl font-bold text-[#00444f]">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado */}
          <Card className="bg-[#ceefea] border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00444f] rounded-full">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Estado</p>
                  <Badge 
                    className={`mt-1 ${
                      area.status === 'activa' 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-gray-500 hover:bg-gray-600'
                    }`}
                  >
                    {area.status === 'activa' ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Última Actualización */}
          <Card className="bg-[#ceefea] border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00444f] rounded-full">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Actualización</p>
                  <p className="text-lg font-bold text-[#00444f]">
                    {area.updatedAt 
                      ? new Date(area.updatedAt).toLocaleDateString('es-MX', { 
                          day: '2-digit', 
                          month: 'short' 
                        })
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="trees">Árboles ({totalTrees})</TabsTrigger>
            <TabsTrigger value="map">Mapa</TabsTrigger>
            <TabsTrigger value="maintenance">Mantenimientos (0)</TabsTrigger>
          </TabsList>

          {/* Tab: Información */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Datos detallados del área</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columna izquierda */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Nombre del Área</p>
                      <p className="font-medium">{area.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Código</p>
                      <p className="font-mono font-medium">{area.code}</p>
                    </div>
                    {area.codePrefix && (
                      <div>
                        <p className="text-sm text-gray-500">Prefijo de Código</p>
                        <p className="font-mono">{area.codePrefix}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Descripción</p>
                      <p>{area.description || 'Sin descripción'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dimensiones</p>
                      <p>{area.dimensions ? `${area.dimensions} hectáreas` : 'No especificadas'}</p>
                    </div>
                  </div>

                  {/* Columna derecha */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Vinculación por GPS</p>
                      <Badge variant={area.useGpsMatching ? 'default' : 'secondary'}>
                        {area.useGpsMatching ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vinculación por Código</p>
                      <Badge variant={area.useCodeMatching ? 'default' : 'secondary'}>
                        {area.useCodeMatching ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Creación</p>
                      <p>{area.createdAt ? new Date(area.createdAt).toLocaleDateString('es-MX') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Última Actualización</p>
                      <p>{area.updatedAt ? new Date(area.updatedAt).toLocaleDateString('es-MX') : '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Árboles */}
          <TabsContent value="trees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventario de Árboles ({totalTrees})</CardTitle>
                <CardDescription>Árboles asignados a esta área</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTrees ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : trees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TreePine className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p>No hay árboles asignados a esta área</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Especie</TableHead>
                          <TableHead>Estado de Salud</TableHead>
                          <TableHead>Altura</TableHead>
                          <TableHead>Diámetro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trees.map((tree) => (
                          <TableRow 
                            key={tree.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => window.location.href = ROUTES.admin.trees.view.build(tree.id)}
                          >
                            <TableCell className="font-mono">
                              {tree.treeCode || tree.code || `#${tree.id}`}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{tree.commonName || tree.speciesName || 'Sin especie'}</p>
                                {tree.scientificName && (
                                  <p className="text-xs text-gray-500 italic">{tree.scientificName}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                tree.health_status === 'bueno' ? 'default' :
                                tree.health_status === 'regular' ? 'secondary' :
                                'destructive'
                              }>
                                {tree.health_status || 'No evaluado'}
                              </Badge>
                            </TableCell>
                            <TableCell>{tree.height ? `${tree.height}m` : '-'}</TableCell>
                            <TableCell>{tree.diameter ? `${tree.diameter}cm` : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-500">
                          Página {treesPage} de {totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={treesPage === 1}
                            onClick={() => setTreesPage(p => p - 1)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={treesPage === totalPages}
                            onClick={() => setTreesPage(p => p + 1)}
                          >
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Mapa */}
          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mapa del Área</CardTitle>
                <CardDescription>Visualización geográfica del área y sus árboles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="font-medium">Mapa en desarrollo</p>
                    <p className="text-sm">Próximamente podrás visualizar el área y sus árboles en el mapa</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Mantenimientos */}
          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calendario de Mantenimientos</CardTitle>
                <CardDescription>Programación de mantenimientos del área</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Wrench className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="font-medium">Mantenimientos en desarrollo</p>
                    <p className="text-sm">Próximamente podrás gestionar los calendarios de mantenimiento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
