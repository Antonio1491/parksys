import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { auth } from "@/lib/firebase";
import AdminLayout from "@/components/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  LayoutGrid,
  CheckCircle,
  XCircle,
  TrendingUp,
  Filter,
  Search,
  MapPin,
} from "lucide-react";
import type { AdPlacement } from "@/types/advertising";
import { PlacementDialog } from "@/components/admin/advertising/PlacementDialog";
import { formatDate } from "@/lib/utils";
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

export default function PlacementsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [placementToDelete, setPlacementToDelete] = useState<number | null>(null);

  // Estados
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<AdPlacement | undefined>();
  const [filterActive, setFilterActive] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch placements
  const { data: placementsData, isLoading } = useQuery({
    queryKey: ["/api/advertising/placements", filterActive],
    queryFn: async () => {
      let url = "/api/advertising/placements";

      if (filterActive !== "all") {
        url += `?isActive=${filterActive === "active"}`;
      }

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error cargando placements");
      }

      return response.json();
    },
  });

  const placements = placementsData?.data || [];

  // Filtrar por búsqueda
  const filteredPlacements = placements.filter((placement: AdPlacement) => {
    if (!searchTerm) return true;

    const search = searchTerm.toLowerCase();
    const adTitle = placement.advertisement?.title?.toLowerCase() || "";
    const spaceName = placement.space?.name?.toLowerCase() || "";

    return adTitle.includes(search) || spaceName.includes(search);
  });

  // Calcular estadísticas
  const stats = {
    total: placements.length,
    active: placements.filter((p: AdPlacement) => p.isActive).length,
    inactive: placements.filter((p: AdPlacement) => !p.isActive).length,
    ctr: placements.length > 0
      ? (placements.reduce((acc: number, p: AdPlacement) => acc + (p.clicks || 0), 0) /
         Math.max(placements.reduce((acc: number, p: AdPlacement) => acc + (p.impressions || 0), 0), 1) * 100).toFixed(2)
      : "0.00",
  };

  // Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Obtener token de Firebase
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const token = await user.getIdToken();

      const response = await fetch(`/api/advertising/placements/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error eliminando placement");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/placements"] });
      toast({
        title: "Placement eliminado",
        description: "El placement se ha eliminado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleCreate = () => {
    setSelectedPlacement(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (placement: AdPlacement) => {
    setSelectedPlacement(placement);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setPlacementToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (placementToDelete) {
      deleteMutation.mutate(placementToDelete);
    }
    setDeleteDialogOpen(false);
    setPlacementToDelete(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Colocaciones de Anuncios"
          subtitle="Gestión de asignaciones de anuncios a espacios publicitarios"
          icon={<MapPin className="h-6 w-6" />}
          actions={[
            <Button
              onClick={handleCreate}
              variant="primary"              >
              <Plus className="md:mr-2 h-4 w-4" />
              <span className="hidden md:inline">{t('actions.add')}</span>
            </Button>,
          ]}
        />


        {/* Tarjetas de estadísticas - Responsive Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#00444f]">
                    Total de Placements
                  </p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">
                    {stats.total}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#00a587] flex items-center justify-center">
                  <LayoutGrid className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#00444f]">
                    Placements Activos
                  </p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">
                    {stats.active}
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
                  <p className="text-sm font-medium text-[#00444f]">
                    Placements Inactivos
                  </p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">
                    {stats.inactive}
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
                  <p className="text-sm font-medium text-[#00444f]">
                    CTR Promedio
                  </p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">
                    {stats.ctr}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#00a587] flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda - Responsive */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por anuncio o espacio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro de estado */}
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Tabla - Responsive con scroll horizontal en móvil */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Anuncio</TableHead>
                  <TableHead className="min-w-[150px]">Espacio</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo Página</TableHead>
                  <TableHead className="hidden lg:table-cell">Inicio</TableHead>
                  <TableHead className="hidden lg:table-cell">Fin</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">Prioridad</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="hidden xl:table-cell text-center">Impresiones</TableHead>
                  <TableHead className="hidden xl:table-cell text-center">Clicks</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Cargando placements...
                    </TableCell>
                  </TableRow>
                ) : filteredPlacements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No se encontraron placements
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlacements.map((placement: AdPlacement) => (
                    <TableRow key={placement.id}>
                      <TableCell className="font-medium">
                        {placement.advertisement?.title || "Sin título"}
                      </TableCell>
                      <TableCell>
                        {placement.space?.name || "Sin espacio"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{placement.pageType}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDate(placement.startDate)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDate(placement.endDate)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        <Badge variant="secondary">{placement.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={placement.isActive ? "default" : "secondary"}
                        >
                          {placement.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-center">
                        {placement.impressions || 0}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-center">
                        {placement.clicks || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(placement)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(placement.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* AlertDialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El placement será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlacementToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Modal de crear/editar */}
      <PlacementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        placement={selectedPlacement}
      />
    </AdminLayout>
  );
}