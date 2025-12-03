import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';
import ROUTES from '@/routes';
import { useToast } from '@/hooks/use-toast';
import { AreaTreesMap } from '@/components/AreaTreesMap';

// Components
import AdminLayout from '@/components/AdminLayout';
import { ReturnHeader } from '@/components/ui/return-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  Trash2,
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
  latitude?: string | number;
  longitude?: string | number;
}

export default function AreaDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [treesPage, setTreesPage] = useState(1);
  const treesPerPage = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parkId: '',
    dimensions: '',
    status: 'activa',
    imageUrl: '', 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Cargar parques para el selector
  const { data: parks } = useQuery({
    queryKey: ['/api/parks-with-amenities'],
    queryFn: async () => {
      const response = await fetch('/api/parks-with-amenities');
      if (!response.ok) throw new Error('Error al cargar parques');
      return response.json();
    },
  });

  // Mutation para editar área
  const editAreaMutation = useMutation({
    mutationFn: async (data: any) => {
      // Si hay archivo, enviar como FormData
      if (imageFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('imageFile', imageFile);
        formDataToSend.append('name', data.name);
        formDataToSend.append('description', data.description || '');
        formDataToSend.append('parkId', data.parkId.toString());
        formDataToSend.append('dimensions', data.dimensions || '');
        formDataToSend.append('status', data.status);

        const response = await fetch(`/api/trees/areas/${id}`, {
          method: 'PUT',
          body: formDataToSend,
        });

        if (!response.ok) throw new Error('Error al actualizar el área');
        return response.json();
      }

      // Si no hay archivo, enviar como JSON
      return apiRequest(`/api/trees/areas/${id}`, {
        method: 'PUT',
        data: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trees/areas', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/trees/areas'] });
      toast({
        title: 'Área actualizada',
        description: 'Los cambios se guardaron exitosamente',
      });
      setIsEditDialogOpen(false);
      setImageFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el área',
        variant: 'destructive',
      });
    },
  });

  // Función para abrir el modal de edición
  const handleEdit = () => {
    if (area) {
      setFormData({
        name: area.name || '',
        description: area.description || '',
        parkId: area.parkId?.toString() || '',
        dimensions: area.dimensions || '',
        status: area.status || 'activa',
        imageUrl: area.imageUrl || '',
        });
      setImageFile(null);
      setIsEditDialogOpen(true);
    }
  };

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

  // Fetch maintenances for this area
  const { data: maintenancesData, isLoading: isLoadingMaintenances } = useQuery<{ data: any[]; total: number }>({
    queryKey: ['/api/trees/areas', id, 'maintenances'],
    queryFn: () => apiRequest(`/api/trees/areas/${id}/maintenances`),
    enabled: !!id,
  });

  const maintenances = maintenancesData?.data || [];
  const totalMaintenances = maintenancesData?.total || 0;

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
              <Button 
                onClick={handleEdit}
                className="bg-[#a0cc4d] hover:bg-[#00a884] text-white hover:text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
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
                      {area.code || area.areaCode || 'N/A'}
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

                {/* Estado */}
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-[#00444f] rounded-full">
                    <Calendar className="h-5 w-5 text-[#00444f]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">
                      Estado
                    </p>
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
                  <p className="text-3xl font-bold text-[#00444f]">{totalMaintenances}</p>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trees">Árboles ({totalTrees})</TabsTrigger>
            <TabsTrigger value="map">Mapa</TabsTrigger>
            <TabsTrigger value="maintenance">Mantenimientos ({totalMaintenances})</TabsTrigger>
          </TabsList>

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
                <CardDescription>
                  Ubicación geográfica de los {totalTrees} árboles en {area.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AreaTreesMap 
                  trees={trees} 
                  areaName={area.name}
                  height="450px"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Mantenimientos */}
          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Historial de Mantenimientos</CardTitle>
                    <CardDescription>
                      Mantenimientos realizados a los árboles de esta área
                    </CardDescription>
                  </div>
                  <Link href={ROUTES.admin.trees.maintenance.list}>
                    <Button variant="outline" size="sm">
                      <Wrench className="h-4 w-4 mr-2" />
                      Gestionar Mantenimientos
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingMaintenances ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : maintenances.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Wrench className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="font-medium">No hay mantenimientos registrados</p>
                    <p className="text-sm mt-1">
                      Los mantenimientos de los árboles de esta área aparecerán aquí
                    </p>
                    <Link href={ROUTES.admin.trees.maintenance.list}>
                      <Button variant="outline" className="mt-4">
                        <Wrench className="h-4 w-4 mr-2" />
                        Ir a Mantenimientos
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Árbol</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Realizado por</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenances.map((maint: any) => (
                        <TableRow key={maint.id}>
                          <TableCell>
                            <div>
                              <p className="font-mono text-sm">{maint.treeCode}</p>
                              <p className="text-xs text-gray-500">{maint.speciesName}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {maint.maintenanceType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {maint.maintenanceDate 
                              ? new Date(maint.maintenanceDate).toLocaleDateString('es-MX', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : '-'
                            }
                          </TableCell>
                          <TableCell>{maint.performedBy || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {maint.notes || maint.description || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Modal Editar Área */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Área</DialogTitle>
            <DialogDescription>
              Actualiza la información del área
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editAreaMutation.mutate({
                parkId: parseInt(formData.parkId),
                name: formData.name,
                description: formData.description,
                dimensions: formData.dimensions,
                status: formData.status,
                imageUrl: formData.imageUrl,
              });
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre del Área *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Zona Norte, Jardín Principal"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-parkId">Parque *</Label>
                <Select
                  value={formData.parkId}
                  onValueChange={(value) => setFormData({ ...formData, parkId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un parque" />
                  </SelectTrigger>
                  <SelectContent>
                    {parks && parks.map((park: any) => (
                      <SelectItem key={park.id} value={park.id.toString()}>
                        {park.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-dimensions">Dimensiones (hectáreas)</Label>
                <Input
                  id="edit-dimensions"
                  type="number"
                  step="0.01"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  placeholder="Ej: 2.5"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el área..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="inactiva">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Imagen del área */}
              <div className="grid gap-2">
                <Label>Imagen del Área</Label>

                {/* Vista previa */}
                {(formData.imageUrl || imageFile) && (
                  <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setFormData({ ...formData, imageUrl: '' });
                        setImageFile(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Subir archivo */}
                <div>
                  <Label className="text-sm text-gray-600">Subir archivo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setFormData({ ...formData, imageUrl: '' });
                      }
                    }}
                  />
                </div>

                <div className="text-center text-sm text-gray-500">- O -</div>

                {/* URL externa */}
                <div>
                  <Label className="text-sm text-gray-600">URL de imagen</Label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, imageUrl: e.target.value });
                      if (e.target.value) setImageFile(null);
                    }}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#00a587] hover:bg-[#00a587]/90"
                disabled={editAreaMutation.isPending}
              >
                {editAreaMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
