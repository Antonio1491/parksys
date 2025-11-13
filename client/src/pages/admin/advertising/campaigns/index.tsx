import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/components/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Megaphone, 
  CheckCircle, 
  PauseCircle, 
  DollarSign,
  Plus,
  Search,
  Pencil,
  Trash2,
  Filter,
} from "lucide-react";
import { CampaignDialog } from "@/components/admin/advertising/CampaignDialog";
import type { AdCampaign, CampaignFormData, CampaignStatus } from "@/types/advertising";
import { CAMPAIGN_STATUS_OPTIONS } from "@/types/advertising";
import { auth } from "@/lib/firebase";
import { formatDate } from "@/lib/utils";

export default function CampaignsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<AdCampaign | null>(null);

  // ============================================
  // QUERIES
  // ============================================

  const { data: campaigns = [], isLoading } = useQuery<AdCampaign[]>({
    queryKey: ["/api/advertising/campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/advertising/campaigns");
      if (!res.ok) throw new Error("Error al cargar campañas");
      const data = await res.json();
      return data.data || [];
    },
  });

  // ============================================
  // MUTATIONS
  // ============================================

  const createMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/advertising/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          client: data.client,
          description: data.description || null,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          budget: data.budget ? parseFloat(data.budget) : null,
          priority: data.priority,
        }),
      });
      if (!res.ok) throw new Error("Error al crear campaña");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/campaigns"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Campaña creada",
        description: "La campaña se ha creado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CampaignFormData }) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/advertising/campaigns/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          client: data.client,
          description: data.description || null,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          budget: data.budget ? parseFloat(data.budget) : null,
          priority: data.priority,
        }),
      });
      if (!res.ok) throw new Error("Error al actualizar campaña");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/campaigns"] });
      setIsEditDialogOpen(false);
      setSelectedCampaign(null);
      toast({
        title: "Campaña actualizada",
        description: "Los cambios se han guardado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/advertising/campaigns/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al eliminar campaña");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertising/campaigns"] });
      setCampaignToDelete(null);
      toast({
        title: "Campaña eliminada",
        description: "La campaña se ha eliminado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ============================================
  // HANDLERS
  // ============================================

  const handleCreate = (data: CampaignFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (campaign: AdCampaign) => {
    setSelectedCampaign(campaign);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (data: CampaignFormData) => {
    if (selectedCampaign) {
      updateMutation.mutate({ id: selectedCampaign.id, data });
    }
  };

  const handleDelete = (campaign: AdCampaign) => {
    setCampaignToDelete(campaign);
  };

  const confirmDelete = () => {
    if (campaignToDelete) {
      deleteMutation.mutate(campaignToDelete.id);
    }
  };

  // ============================================
  // FILTROS Y ESTADÍSTICAS
  // ============================================

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.client.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || campaign.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.status === "active").length;
    const paused = campaigns.filter((c) => c.status === "paused").length;
    const totalBudget = campaigns.reduce(
      (sum, c) => sum + (c.budget ? Number(c.budget) : 0),
      0
    );

    return { total, active, paused, totalBudget };
  }, [campaigns]);

  // ============================================
  // HELPERS
  // ============================================

  const getStatusBadgeClass = (status: CampaignStatus): string => {
    const classes: Record<CampaignStatus, string> = {
      active: "bg-green-100 text-green-800 border-green-200",
      paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return classes[status];
  };

  const getStatusLabel = (status: CampaignStatus): string => {
    const labels: Record<CampaignStatus, string> = {
      active: "Activa",
      paused: "Pausada",
      completed: "Completada",
      cancelled: "Cancelada",
    };
    return labels[status];
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const getPriorityLabel = (priority: string): string => {
    const labels: Record<string, string> = {
      low: "Baja",
      medium: "Media",
      high: "Alta",
    };
    return labels[priority] || priority;
  };

  const getPriorityBadgeClass = (priority: string): string => {
    const classes: Record<string, string> = {
      low: "bg-gray-100 text-gray-800 border-gray-200",
      medium: "bg-blue-100 text-blue-800 border-blue-200",
      high: "bg-red-100 text-red-800 border-red-200",
    };
    return classes[priority] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Campañas Publicitarias"
          subtitle="Gestiona las campañas publicitarias de Parques de México"
          icon={<Megaphone className="h-6 w-6"/>}
          actions={[
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              variant="primary"
            >
              <Plus className="md:mr-2 h-4 w-4" />
              <span className="hidden md:inline">{t('actions.add')}</span>
            </Button>,
          ]}
        />

        {/* Tarjetas de estadísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#00444f]">
                    Total de Campañas
                  </p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">
                    {stats.total}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#00a587] flex items-center justify-center">
                  <Megaphone className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#00444f]">
                    Campañas Activas
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
                    Campañas Pausadas
                  </p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">
                    {stats.paused}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#00a587] flex items-center justify-center">
                  <PauseCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#00444f]">
                    Presupuesto Total
                  </p>
                  <p className="text-3xl font-bold text-[#00444f] mt-2">
                    {formatCurrency(stats.totalBudget)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#00a587] flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {CAMPAIGN_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Cargando campañas...</p>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "No se encontraron campañas con los filtros aplicados"
                    : "No hay campañas registradas"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Presupuesto</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">
                          {campaign.name}
                        </TableCell>
                        <TableCell>{campaign.client}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusBadgeClass(campaign.status)}
                          >
                            {getStatusLabel(campaign.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{formatDate(campaign.startDate)}</div>
                          <div className="text-gray-500">
                            {formatDate(campaign.endDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(campaign.budget)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getPriorityBadgeClass(campaign.priority)}
                          >
                            {getPriorityLabel(campaign.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(campaign)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(campaign)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
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
      </div>

      {/* Dialog Crear */}
      <CampaignDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      {/* Dialog Editar */}
      <CampaignDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        campaign={selectedCampaign || undefined}
        onSubmit={handleUpdate}
        isSubmitting={updateMutation.isPending}
      />

      {/* Dialog Eliminar */}
      <AlertDialog
        open={!!campaignToDelete}
        onOpenChange={() => setCampaignToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar campaña?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la campaña{" "}
              <strong>{campaignToDelete?.name}</strong> y todos sus anuncios
              asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}