import { useState } from "react";
import { auth } from "@/lib/firebase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Pencil, Trash2, Plus, Search, Target, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import AdminLayout from "@/components/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Advertisement, AdCampaign } from "@/types/advertising";
import { MEDIA_TYPE_OPTIONS, AD_TYPE_OPTIONS } from "@/types/advertising";
import ROUTES from "@/routes";

export default function AdvertisementsList() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCampaign, setFilterCampaign] = useState<string>("");
  const [filterAdType, setFilterAdType] = useState<string>("");
  const [filterMediaType, setFilterMediaType] = useState<string>("");

  // Estado para modal de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [advertisementToDelete, setAdvertisementToDelete] = useState<Advertisement | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [advertisementToView, setAdvertisementToView] = useState<Advertisement | null>(null);

  // Query para obtener anuncios
  const { data: advertisementsResponse, isLoading } = useQuery({
    queryKey: ["/api/advertising/advertisements", searchTerm, filterCampaign, filterAdType, filterMediaType],
  });

  const advertisements: Advertisement[] = advertisementsResponse?.data || [];

  // Query para obtener campañas (para filtros)
  const { data: campaignsResponse } = useQuery({
    queryKey: ["/api/advertising/campaigns"],
  });

  const campaigns: AdCampaign[] = campaignsResponse?.data || [];

  // Mutation para eliminar
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const token = await user.getIdToken();

      const response = await fetch(`/api/advertising/advertisements/${id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/advertisements"] });
      toast({
        title: "Éxito",
        description: "Anuncio eliminado correctamente",
      });
      setDeleteDialogOpen(false);
      setAdvertisementToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el anuncio",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreate = () => {
    setLocation(ROUTES.admin.advertising.advertisements.create);
  };

  const handleEdit = (id: number) => {
    setLocation(ROUTES.admin.advertising.advertisements.edit.build(id));
  };

  const handleDeleteClick = (advertisement: Advertisement) => {
    setAdvertisementToDelete(advertisement);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (advertisementToDelete) {
      deleteMutation.mutate(advertisementToDelete.id);
    }
  };

  const handleViewClick = (advertisement: Advertisement) => {
    setAdvertisementToView(advertisement);
    setViewDialogOpen(true);
  };

  // Filtrado local
  const filteredAdvertisements = advertisements.filter((ad) => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCampaign = !filterCampaign || filterCampaign === "all" || ad.campaignId?.toString() === filterCampaign;
    const matchesAdType = !filterAdType || filterAdType === "all" || ad.adType === filterAdType;
    const matchesMediaType = !filterMediaType || filterMediaType === "all" || ad.mediaType === filterMediaType;

    return matchesSearch && matchesCampaign && matchesAdType && matchesMediaType;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Anuncios"
          subtitle="Gestiona los anuncios publicitarios del sistema"
          icon={<Target className="h-6 w-6" />}
          actions={[
            <Button 
              key="create"
              variant="primary"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">{t('actions.add')}</span>
            </Button>,
          ]}
        />

        {/* Filtros y Búsqueda */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="w-full md:w-48">
            <label className="text-sm font-medium mb-2 block">Campaña</label>
            <Select value={filterCampaign} onValueChange={setFilterCampaign}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id.toString()}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48">
            <label className="text-sm font-medium mb-2 block">Tipo de Anuncio</label>
            <Select value={filterAdType} onValueChange={setFilterAdType}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {AD_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48">
            <label className="text-sm font-medium mb-2 block">Tipo de Media</label>
            <Select value={filterMediaType} onValueChange={setFilterMediaType}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {MEDIA_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Campaña</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredAdvertisements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron anuncios
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdvertisements.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell>
                      {ad.campaign ? (
                        <div className="text-sm">
                          <div className="font-medium">{ad.campaign.name}</div>
                          <div className="text-muted-foreground">{ad.campaign.client}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sin campaña</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {AD_TYPE_OPTIONS.find(opt => opt.value === ad.adType)?.label || ad.adType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {MEDIA_TYPE_OPTIONS.find(opt => opt.value === ad.mediaType)?.label || ad.mediaType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.priority >= 7 ? "default" : "outline"}>
                        {ad.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.isActive ? "default" : "secondary"}>
                        {ad.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewClick(ad)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(ad.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(ad)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Resultados */}
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredAdvertisements.length} de {advertisements.length} anuncios
        </div>
      </div>

      {/* Dialog de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar anuncio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El anuncio "{advertisementToDelete?.title}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Vista Detallada */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Detalle del Anuncio</DialogTitle>
          </DialogHeader>

          {advertisementToView && (
            <div className="space-y-6 overflow-x-hidden">
              {/* Preview del anuncio */}
              {advertisementToView.mediaUrl && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h3 className="font-semibold mb-3">Vista Previa</h3>
                  {advertisementToView.mediaType === "image" && (
                  <img
                    src={advertisementToView.mediaUrl}
                    alt={advertisementToView.title}
                    className="w-full h-auto max-h-64 md:max-h-96 object-contain rounded"
                  />
                  )}
                  {advertisementToView.mediaType === "video" && (
                  <video
                    src={advertisementToView.mediaUrl}
                    controls
                    className="w-full h-auto max-h-64 md:max-h-96 rounded"
                    poster={advertisementToView.thumbnailUrl || undefined}
                  />
                  )}
                  {advertisementToView.mediaType === "html" && (
                    <div className="text-sm text-muted-foreground">
                      Contenido HTML (no se puede previsualizar)
                    </div>
                  )}
                </div>
              )}

              {/* Información Básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Título</label>
                  <p className="text-base font-semibold">{advertisementToView.title}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Campaña</label>
                  <p className="text-base">
                    {advertisementToView.campaign ? (
                      <span>
                        {advertisementToView.campaign.name}
                        <span className="text-muted-foreground"> - {advertisementToView.campaign.client}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sin campaña</span>
                    )}
                  </p>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                  <p className="text-base break-words overflow-wrap-anywhere">{advertisementToView.description || "Sin descripción"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Anuncio</label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {AD_TYPE_OPTIONS.find(opt => opt.value === advertisementToView.adType)?.label || advertisementToView.adType}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Media</label>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {MEDIA_TYPE_OPTIONS.find(opt => opt.value === advertisementToView.mediaType)?.label || advertisementToView.mediaType}
                    </Badge>
                  </div>
                </div>

                {advertisementToView.mediaType === "video" && advertisementToView.duration && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Duración</label>
                    <p className="text-base">{advertisementToView.duration} segundos</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prioridad</label>
                  <div className="mt-1">
                    <Badge variant={advertisementToView.priority >= 7 ? "default" : "outline"}>
                      {advertisementToView.priority}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <div className="mt-1">
                    <Badge variant={advertisementToView.isActive ? "default" : "secondary"}>
                      {advertisementToView.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* URLs */}
              <div className="space-y-3 overflow-x-hidden">
                <h3 className="font-semibold">URLs y Enlaces</h3>

                {advertisementToView.mediaUrl && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">URL del Media</label>
                    <a
                      href={advertisementToView.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline block break-all overflow-hidden text-ellipsis"
                      style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
                    >
                      {advertisementToView.mediaUrl}
                    </a>
                  </div>
                )}

                {advertisementToView.thumbnailUrl && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">URL del Thumbnail</label>
                    <a
                      href={advertisementToView.thumbnailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline block break-all overflow-hidden text-ellipsis"
                      style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
                    >
                      {advertisementToView.thumbnailUrl}
                    </a>
                  </div>
                )}

                {advertisementToView.linkUrl && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">URL de Destino</label>
                    <a
                      href={advertisementToView.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline block break-all overflow-hidden text-ellipsis"
                      style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
                    >
                      {advertisementToView.linkUrl}
                    </a>
                  </div>
                )}

                {advertisementToView.buttonText && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Texto del Botón</label>
                    <p className="text-base">{advertisementToView.buttonText}</p>
                  </div>
                )}
              </div>

              {/* Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <label className="font-medium">Creado</label>
                  <p>{new Date(advertisementToView.createdAt).toLocaleString("es-MX")}</p>
                </div>
                <div>
                  <label className="font-medium">Actualizado</label>
                  <p>{new Date(advertisementToView.updatedAt).toLocaleString("es-MX")}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}