import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Eye, Plus, Grid3x3, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import AdminLayout from "@/components/AdminLayout";

// ============================================
// TIPOS E INTERFACES
// ============================================

interface Advertisement {
  id: number;
  title: string;
  imageUrl: string | null;
  campaign?: {
    name: string;
    client: string;
  };
}

interface AdSpace {
  id: number;
  spaceKey: string;
  name: string;
  locationType: string;
  dimensions: string | null;
}

interface Placement {
  id: number;
  adId: number;
  spaceId: number;
  pageType: string;
  pageId: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
  advertisement?: Advertisement;
  space?: AdSpace;
}

// ============================================
// ESQUEMAS DE VALIDACIÓN
// ============================================

const placementSchema = z.object({
  adId: z.number().min(1, "Debes seleccionar un anuncio"),
  spaceId: z.number().min(1, "Debes seleccionar un espacio"),
  pageType: z.string().min(1, "El tipo de página es requerido"),
  pageId: z.number().optional().nullable(),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida"),
  isActive: z.boolean().default(true),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["endDate"],
});

type PlacementFormData = z.infer<typeof placementSchema>;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Placements() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null);

  // React Query - Obtener asignaciones
  const { data: placementsResponse, isLoading } = useQuery({
    queryKey: ["/api/advertising/placements"],
  });

  const placements = placementsResponse?.data || [];

  // React Query - Obtener anuncios
  const { data: advertisementsResponse } = useQuery({
    queryKey: ["/api/advertising/advertisements"],
  });

  const advertisements = advertisementsResponse?.data || [];

  // React Query - Obtener espacios
  const { data: spacesResponse } = useQuery({
    queryKey: ["/api/advertising/spaces"],
  });

  const spaces = spacesResponse?.data || [];

  // Formulario de creación
  const createForm = useForm<PlacementFormData>({
    resolver: zodResolver(placementSchema),
    defaultValues: {
      adId: 0,
      spaceId: 0,
      pageType: "home",
      pageId: null,
      startDate: "",
      endDate: "",
      isActive: true,
    },
  });

  // Formulario de edición
  const editForm = useForm<PlacementFormData>({
    resolver: zodResolver(placementSchema),
  });

  // Mutación - Crear asignación
  const createMutation = useMutation({
    mutationFn: async (data: PlacementFormData) => {
      const response = await fetch("/api/advertising/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al crear la asignación");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/placements"] });
      setIsCreateModalOpen(false);
      createForm.reset();
      toast({
        title: "Éxito",
        description: "Asignación creada correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la asignación",
        variant: "destructive",
      });
    },
  });

  // Mutación - Actualizar asignación
  const updateMutation = useMutation({
    mutationFn: async (data: PlacementFormData & { id: number }) => {
      const response = await fetch(`/api/advertising/placements/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al actualizar la asignación");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/placements"] });
      setIsEditModalOpen(false);
      setSelectedPlacement(null);
      toast({
        title: "Éxito",
        description: "Asignación actualizada correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la asignación",
        variant: "destructive",
      });
    },
  });

  // Mutación - Eliminar asignación
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/advertising/placements/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar la asignación");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/placements"] });
      toast({
        title: "Éxito",
        description: "Asignación eliminada correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la asignación",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreate = (data: PlacementFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (placement: Placement) => {
    setSelectedPlacement(placement);
    editForm.reset({
      adId: placement.adId,
      spaceId: placement.spaceId,
      pageType: placement.pageType,
      pageId: placement.pageId,
      startDate: placement.startDate.split("T")[0],
      endDate: placement.endDate.split("T")[0],
      isActive: placement.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = (data: PlacementFormData) => {
    if (!selectedPlacement) return;
    updateMutation.mutate({ ...data, id: selectedPlacement.id });
  };

  const handleView = (placement: Placement) => {
    setSelectedPlacement(placement);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta asignación?")) {
      deleteMutation.mutate(id);
    }
  };

  // Función para calcular CTR (Click-Through Rate)
  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  };

  // Función auxiliar para obtener el badge según el tipo de página
  const getPageTypeBadge = (pageType: string) => {
    const pageConfig: Record<string, { label: string; variant: any }> = {
      home: { label: "Home", variant: "default" },
      parks: { label: "Parques", variant: "secondary" },
      species: { label: "Especies", variant: "outline" },
      activities: { label: "Actividades", variant: "default" },
      concessions: { label: "Concesiones", variant: "secondary" },
      all: { label: "Todas", variant: "outline" },
    };
    const config = pageConfig[pageType] || { label: pageType, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Asignaciones de Anuncios"
          description="Gestiona qué anuncios se muestran en cada espacio publicitario"
          action={{
            label: "Nueva Asignación",
            onClick: () => setIsCreateModalOpen(true),
            icon: Plus,
          }}
        />

        {/* Tabla de asignaciones */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anuncio</TableHead>
                <TableHead>Espacio</TableHead>
                <TableHead>Página</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Rendimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Cargando asignaciones...
                  </TableCell>
                </TableRow>
              ) : placements?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Grid3x3 className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No hay asignaciones registradas</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                placements?.map((placement) => (
                  <TableRow key={placement.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {placement.advertisement?.imageUrl && (
                          <img
                            src={placement.advertisement.imageUrl}
                            alt={placement.advertisement.title}
                            className="w-12 h-8 object-cover rounded border"
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {placement.advertisement?.title || `Anuncio #${placement.adId}`}
                          </p>
                          {placement.advertisement?.campaign && (
                            <p className="text-xs text-muted-foreground">
                              {placement.advertisement.campaign.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">
                          {placement.space?.name || `Espacio #${placement.spaceId}`}
                        </p>
                        {placement.space?.dimensions && (
                          <p className="text-xs text-muted-foreground">
                            {placement.space.dimensions}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPageTypeBadge(placement.pageType)}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col gap-1">
                        <span>{new Date(placement.startDate).toLocaleDateString()}</span>
                        <span className="text-muted-foreground">
                          {new Date(placement.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{(placement.impressions || 0).toLocaleString()}</span>
                          <span className="text-muted-foreground text-xs">vistas</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="font-medium">{placement.clicks || 0}</span>
                          <span className="text-muted-foreground text-xs">
                            clics ({calculateCTR(placement.clicks || 0, placement.impressions || 0)}% CTR)
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={placement.isActive ? "default" : "secondary"}>
                        {placement.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(placement)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

        {/* Modal de Creación */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Asignación de Anuncio</DialogTitle>
              <DialogDescription>
                Asigna un anuncio a un espacio publicitario específico
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="adId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anuncio *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar anuncio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {advertisements?.map((ad) => (
                            <SelectItem key={ad.id} value={ad.id.toString()}>
                              <div className="flex items-center gap-2">
                                {ad.imageUrl && (
                                  <img
                                    src={ad.imageUrl}
                                    alt={ad.title}
                                    className="w-8 h-5 object-cover rounded"
                                  />
                                )}
                                <span>{ad.title}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="spaceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Espacio Publicitario *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar espacio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {spaces?.map((space) => (
                            <SelectItem key={space.id} value={space.id.toString()}>
                              {space.name} {space.dimensions && `(${space.dimensions})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="pageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Página *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar página" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="parks">Parques</SelectItem>
                          <SelectItem value="species">Especies Arbóreas</SelectItem>
                          <SelectItem value="activities">Actividades</SelectItem>
                          <SelectItem value="concessions">Concesiones</SelectItem>
                          <SelectItem value="instructors">Instructores</SelectItem>
                          <SelectItem value="all">Todas las páginas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="pageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID de Página Específica (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Dejar vacío para todas las páginas del tipo"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Si se especifica, el anuncio solo aparecerá en esa página específica
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Fin *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "true")}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Activa</SelectItem>
                          <SelectItem value="false">Inactiva</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creando..." : "Crear Asignación"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Modal de Vista */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles de la Asignación</DialogTitle>
            </DialogHeader>
            {selectedPlacement && (
              <div className="space-y-4">
                {selectedPlacement.advertisement?.imageUrl && (
                  <div className="w-full">
                    <img
                      src={selectedPlacement.advertisement.imageUrl}
                      alt={selectedPlacement.advertisement.title}
                      className="w-full h-48 object-cover rounded border"
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Anuncio</p>
                  <p className="text-base font-medium">
                    {selectedPlacement.advertisement?.title || `Anuncio #${selectedPlacement.adId}`}
                  </p>
                  {selectedPlacement.advertisement?.campaign && (
                    <p className="text-sm text-muted-foreground">
                      Campaña: {selectedPlacement.advertisement.campaign.name} - {selectedPlacement.advertisement.campaign.client}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Espacio Publicitario</p>
                  <p className="text-base">
                    {selectedPlacement.space?.name || `Espacio #${selectedPlacement.spaceId}`}
                  </p>
                  {selectedPlacement.space?.dimensions && (
                    <p className="text-sm text-muted-foreground">
                      Dimensiones: {selectedPlacement.space.dimensions}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo de Página</p>
                    <div className="mt-1">{getPageTypeBadge(selectedPlacement.pageType)}</div>
                  </div>
                  {selectedPlacement.pageId && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ID de Página</p>
                      <p className="text-base">{selectedPlacement.pageId}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Inicio</p>
                    <p className="text-base">
                      {new Date(selectedPlacement.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Fin</p>
                    <p className="text-base">
                      {new Date(selectedPlacement.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-medium">Rendimiento</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Impresiones</p>
                      <p className="text-2xl font-bold">{(selectedPlacement.impressions || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Clics</p>
                      <p className="text-2xl font-bold">{selectedPlacement.clicks || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CTR</p>
                      <p className="text-2xl font-bold">
                        {calculateCTR(selectedPlacement.clicks || 0, selectedPlacement.impressions || 0)}%
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <div className="mt-1">
                    <Badge variant={selectedPlacement.isActive ? "default" : "secondary"}>
                      {selectedPlacement.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Edición */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Asignación</DialogTitle>
              <DialogDescription>
                Modifica los datos de la asignación de anuncio
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="adId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anuncio *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar anuncio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {advertisements?.map((ad) => (
                            <SelectItem key={ad.id} value={ad.id.toString()}>
                              {ad.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="spaceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Espacio Publicitario *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar espacio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {spaces?.map((space) => (
                            <SelectItem key={space.id} value={space.id.toString()}>
                              {space.name} {space.dimensions && `(${space.dimensions})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="pageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Página *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar página" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="parks">Parques</SelectItem>
                          <SelectItem value="species">Especies Arbóreas</SelectItem>
                          <SelectItem value="activities">Actividades</SelectItem>
                          <SelectItem value="concessions">Concesiones</SelectItem>
                          <SelectItem value="instructors">Instructores</SelectItem>
                          <SelectItem value="all">Todas las páginas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="pageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID de Página Específica (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Dejar vacío para todas las páginas del tipo"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Fin *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "true")}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Activa</SelectItem>
                          <SelectItem value="false">Inactiva</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}