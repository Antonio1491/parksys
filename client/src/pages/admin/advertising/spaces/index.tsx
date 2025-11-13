import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, Edit, Trash2, Eye, AlertCircle, LayoutGrid, LayoutPanelLeft, CheckCircle, XCircle, Globe } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getAuth } from "firebase/auth";
import type { AdSpace } from "@/types/advertising";
import {
  PAGE_TYPE_OPTIONS,
  POSITION_OPTIONS,
} from "@/types/advertising";
import ROUTES from "@/routes";

export default function SpacesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [pageTypeFilter, setPageTypeFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Estados de modales
  const [selectedSpace, setSelectedSpace] = useState<AdSpace | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<AdSpace | null>(null);

  // Query para obtener espacios
  const { data: spacesData, isLoading } = useQuery<{ success: boolean; data: AdSpace[] }>({
    queryKey: ["/api/advertising/spaces"],
  });

  const spaces = spacesData?.data || [];

  // Mutation para eliminar espacio
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      const response = await fetch(`/api/advertising/spaces/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar espacio");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/spaces"] });
      toast({
        title: "Espacio eliminado",
        description: "El espacio publicitario ha sido eliminado exitosamente.",
      });
      setIsDeleteDialogOpen(false);
      setSpaceToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtrado de espacios
  const filteredSpaces = spaces.filter((space) => {
    const matchesSearch =
      searchTerm === "" ||
      space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPageType =
      pageTypeFilter === "all" || space.pageType === pageTypeFilter;

    const matchesPosition =
      positionFilter === "all" || space.position === positionFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && space.isActive) ||
      (statusFilter === "inactive" && !space.isActive);

    return matchesSearch && matchesPageType && matchesPosition && matchesStatus;
  });

  // Handlers
  const handleView = (space: AdSpace) => {
    setSelectedSpace(space);
    setIsViewModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setLocation(ROUTES.admin.advertising.spaces.edit.build(id));
  };

  const handleDeleteClick = (space: AdSpace) => {
    setSpaceToDelete(space);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (spaceToDelete) {
      deleteMutation.mutate(spaceToDelete.id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* PageHeader */}
        <PageHeader
          title="Espacios Publicitarios"
          subtitle="Gestiona los espacios disponibles para publicidad en el sitio"
          icon={<LayoutGrid />}
          actions={[
            <Button
              key="new"
              variant="primary"
              onClick={() => setLocation(ROUTES.admin.advertising.spaces.create)}
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{t('actions.add')}</span>
            </Button>,
          ]}
        />

        {/* Estadísticas rápidas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#00444f]">Total de Espacios</p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">{spaces.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#00a587] flex items-center justify-center">
                  <LayoutPanelLeft className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#00444f]">Activos</p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">
                    {spaces.filter((s) => s.isActive).length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#00a587] flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#00444f]">Inactivos</p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">
                    {spaces.filter((s) => !s.isActive).length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#00a587] flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#00444f]">Tipos de Página</p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">
                    {new Set(spaces.map((s) => s.pageType)).size}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#00a587] flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filtros */}
        <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por tipo de página */}
            <Select value={pageTypeFilter} onValueChange={setPageTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las páginas</SelectItem>
                {PAGE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por posición */}
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Posición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las posiciones</SelectItem>
                {POSITION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por estado */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de espacios */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Cargando espacios...</p>
            </div>
          ) : filteredSpaces.length === 0 ? (
            <div className="text-center py-8">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron espacios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Página</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead>Dimensiones</TableHead>
                    <TableHead>Formatos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSpaces.map((space) => (
                    <TableRow key={space.id}>
                      <TableCell className="font-medium">
                        {space.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PAGE_TYPE_OPTIONS.find((p) => p.value === space.pageType)?.label || space.pageType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {POSITION_OPTIONS.find((p) => p.value === space.position)?.label || space.position}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {space.dimensions || "No especificado"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-wrap gap-1">
                          {space.allowedFormats?.slice(0, 2).map((format) => (
                            <Badge key={format} variant="outline" className="text-xs">
                              {format.split("/")[1]?.toUpperCase()}
                            </Badge>
                          ))}
                          {(space.allowedFormats?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(space.allowedFormats?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={space.isActive ? "default" : "secondary"}
                          className={
                            space.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {space.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(space)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(space.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(space)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de vista detallada */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Espacio</DialogTitle>
            <DialogDescription>
              Información completa del espacio publicitario
            </DialogDescription>
          </DialogHeader>

          {selectedSpace && (
            <div className="space-y-4">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nombre</p>
                  <p className="text-base">{selectedSpace.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  <Badge
                    variant={selectedSpace.isActive ? "default" : "secondary"}
                    className={
                      selectedSpace.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {selectedSpace.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>

              {/* Descripción */}
              {selectedSpace.description && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Descripción
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedSpace.description}
                  </p>
                </div>
              )}

              {/* Ubicación */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Tipo de Página
                  </p>
                  <Badge variant="outline">
                    {PAGE_TYPE_OPTIONS.find((p) => p.value === selectedSpace.pageType)?.label || selectedSpace.pageType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Posición</p>
                  <Badge variant="secondary">
                    {POSITION_OPTIONS.find((p) => p.value === selectedSpace.position)?.label || selectedSpace.position}
                  </Badge>
                </div>
              </div>

              {/* Especificaciones técnicas */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium">Especificaciones Técnicas</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Dimensiones
                    </p>
                    <p className="text-sm">{selectedSpace.dimensions || "No especificado"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Tamaño Máximo
                    </p>
                    <p className="text-sm">
                      {selectedSpace.maxFileSize
                        ? `${(selectedSpace.maxFileSize / 1024 / 1024).toFixed(2)} MB`
                        : "No especificado"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Formatos Permitidos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpace.allowedFormats?.map((format) => (
                      <Badge key={format} variant="outline">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vista previa de dimensiones */}
              {selectedSpace.dimensions && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Vista Previa</h4>
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center">
                    <div
                      className="border-2 border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 text-sm"
                      style={{
                        width: `${Math.min(parseInt(selectedSpace.dimensions.split("x")[0]) || 300, 400)}px`,
                        height: `${Math.min(parseInt(selectedSpace.dimensions.split("x")[1]) || 250, 200)}px`,
                      }}
                    >
                      {selectedSpace.dimensions}
                    </div>
                  </div>
                </div>
              )}

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4 text-xs text-gray-600">
                <div>
                  <p className="font-medium">Creado</p>
                  <p>{new Date(selectedSpace.createdAt).toLocaleDateString("es-MX")}</p>
                </div>
                <div>
                  <p className="font-medium">Actualizado</p>
                  <p>{new Date(selectedSpace.updatedAt).toLocaleDateString("es-MX")}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
            >
              Cerrar
            </Button>
            {selectedSpace && (
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEdit(selectedSpace.id);
                }}
                className="bg-[#00a587] hover:bg-[#008c72]"
              >
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              ¿Eliminar espacio publicitario?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              espacio <strong>{spaceToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
}