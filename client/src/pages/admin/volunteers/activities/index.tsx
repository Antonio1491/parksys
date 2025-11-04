import { useState } from "react";
import { useLocation } from "wouter";
import ROUTES from "@/routes";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Clock,
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Download,
  Upload,
  FileText,
  CheckSquare,
  Boxes,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import AdminLayout from "@/components/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { useArrayQuery } from "@/hooks/useArrayQuery";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function VolunteerActivitiesIndex() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [parkFilter, setParkFilter] = useState<string>("all");

  // Estados de paginación y vista
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const itemsPerPage = 9;

  // Estados de selección y eliminación
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Set<number>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<any>(null);

  // Estados de importación CSV
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Obtener actividades de voluntariado
  const { data: activities = [], isLoading, refetch } = useArrayQuery(
    "/api/volunteer-activities",
    "data"
  );

  // Obtener parques para filtros y mostrar nombres
  const { data: parks = [] } = useArrayQuery("/api/parks", "data");

  // Filtrar actividades
  const filteredActivities = activities.filter((activity: any) => {
    const matchesSearch =
      activity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || activity.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || activity.category === categoryFilter;

    const matchesPark =
      parkFilter === "all" || activity.parkId?.toString() === parkFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPark;
  });

  // Paginación
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

  // Función para obtener nombre del parque
  const getParkName = (parkId: number) => {
    const park = parks.find((p: any) => p.id === parkId);
    return park?.name || "Sin parque";
  };

  // Función para obtener badge de estado
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      planned: { label: "Planificada", className: "bg-blue-100 text-blue-800" },
      in_progress: { label: "En Curso", className: "bg-yellow-100 text-yellow-800" },
      completed: { label: "Completada", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelada", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Función para obtener label de categoría
  const getCategoryLabel = (category: string) => {
    const categoryLabels: Record<string, string> = {
      maintenance: "Mantenimiento",
      events: "Eventos",
      education: "Educación",
      sports: "Deportes",
      cultural: "Cultural",
      nature: "Naturaleza",
      other: "Otro",
    };
    return categoryLabels[category] || category;
  };

  // Handlers de selección
  const handleSelectActivity = (activityId: number, checked: boolean) => {
    const newSelected = new Set(selectedActivities);
    if (checked) {
      newSelected.add(activityId);
    } else {
      newSelected.delete(activityId);
    }
    setSelectedActivities(newSelected);
  };

  const handleSelectAllActivities = () => {
    const allActivityIds = new Set(paginatedActivities.map((activity: any) => activity.id));
    setSelectedActivities(allActivityIds);
  };

  const handleDeselectAllActivities = () => {
    setSelectedActivities(new Set());
  };

  // Mutación para eliminar una actividad
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/volunteer-activities/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Actividad eliminada",
        description: "La actividad se ha eliminado exitosamente.",
      });
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo eliminar la actividad",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminación masiva
  const bulkDeleteMutation = useMutation({
    mutationFn: async (activityIds: number[]) => {
      return await apiRequest("/api/volunteer-activities/bulk-delete", {
        method: "POST",
        data: { activityIds },
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Actividades eliminadas",
        description: `Se eliminaron ${selectedActivities.size} actividades exitosamente.`,
      });
      setShowBulkDeleteDialog(false);
      setSelectedActivities(new Set());
      setSelectionMode(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: "No se pudieron eliminar las actividades seleccionadas.",
        variant: "destructive",
      });
    },
  });

  // Mutación para importar CSV
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/volunteer-activities/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Error al importar actividades");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Importación exitosa",
        description: `Se importaron ${data.imported || 0} actividades correctamente.`,
      });
      setShowImportDialog(false);
      setImportFile(null);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error en importación",
        description: error.message || "No se pudieron importar las actividades",
        variant: "destructive",
      });
    },
  });

  // Handler para eliminar
  const handleDelete = (activity: any) => {
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (activityToDelete) {
      deleteMutation.mutate(activityToDelete.id);
    }
  };

  // Handler para eliminación masiva
  const handleBulkDeleteClick = () => {
    if (selectedActivities.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const handleBulkDeleteConfirm = () => {
    const activityIds = Array.from(selectedActivities);
    bulkDeleteMutation.mutate(activityIds);
  };

  // Handler para exportar CSV
  const handleExportCSV = () => {
    try {
      if (!Array.isArray(activities) || activities.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay actividades para exportar.",
          variant: "destructive",
        });
        return;
      }

      const csvHeaders = [
        "nombre",
        "descripción",
        "parque",
        "fecha",
        "horasEstimadas",
        "cupoMáximo",
        "categoría",
        "estado",
        "requisitos",
      ];

      const csvRows = activities.map((activity: any) => [
        activity.name || "",
        activity.description || "",
        getParkName(activity.parkId),
        activity.activityDate ? format(new Date(activity.activityDate), "dd/MM/yyyy HH:mm") : "",
        activity.scheduledHours || "",
        activity.maxVolunteers || "",
        getCategoryLabel(activity.category || ""),
        activity.status || "",
        activity.requirements || "",
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `actividades-voluntariado-${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "✅ Exportación exitosa",
        description: `Se exportaron ${activities.length} actividades.`,
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo exportar el archivo CSV.",
        variant: "destructive",
      });
    }
  };

  // Handler para descargar plantilla CSV
  const handleDownloadTemplate = () => {
    const templateHeaders = [
      "nombre",
      "descripción",
      "parqueId",
      "fecha",
      "horasEstimadas",
      "cupoMáximo",
      "categoría",
      "requisitos",
    ];

    const exampleRow = [
      "Limpieza de áreas verdes",
      "Jornada de limpieza en el parque",
      "1",
      "2025-11-01 09:00",
      "4.0",
      "15",
      "maintenance",
      "Traer guantes y ropa cómoda",
    ];

    const csvContent = [
      templateHeaders.join(","),
      exampleRow.map((cell) => `"${cell}"`).join(","),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla-actividades-voluntariado.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler para importar CSV
  const handleImportCSV = () => {
    if (!importFile) return;
    importMutation.mutate(importFile);
  };

  // Calcular estadísticas
  const stats = {
    total: activities.length,
    planned: activities.filter((a: any) => a.status === "planned").length,
    inProgress: activities.filter((a: any) => a.status === "in_progress").length,
    completed: activities.filter((a: any) => a.status === "completed").length,
  };

  return (
    <AdminLayout>
    <div className="mx-auto">
      {/* PageHeader con acciones */}
      <PageHeader
        title="Actividades de Voluntariado"
        subtitle="Gestiona las actividades en las que participan los voluntarios."
        icon={<Boxes />}
        actions={[
            <Button
              variant="tertiary"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>,
            <Button
              variant="secondary"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>,
            <Button
              variant="primary"
              onClick={() => setLocation(ROUTES.admin.volunteers.activities.create)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva
            </Button> 
        ]}
      />

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Planificadas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.planned}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Curso</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar actividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro de Parque */}
            <div className="space-y-2">
              <Label htmlFor="park">Parque</Label>
              <Select value={parkFilter} onValueChange={setParkFilter}>
                <SelectTrigger id="park">
                  <SelectValue placeholder="Todos los parques" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los parques</SelectItem>
                  {parks.map((park: any) => (
                    <SelectItem key={park.id} value={park.id.toString()}>
                      {park.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Estado */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="planned">Planificada</SelectItem>
                  <SelectItem value="in_progress">En Curso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Categoría */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="events">Eventos</SelectItem>
                  <SelectItem value="education">Educación</SelectItem>
                  <SelectItem value="sports">Deportes</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="nature">Naturaleza</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resultados */}
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {paginatedActivities.length} de {filteredActivities.length} actividades
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal - Vista de Tabla o Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a587] mx-auto mb-4"></div>
          Cargando actividades...
        </div>
      ) : paginatedActivities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p>No se encontraron actividades</p>
        </div>
      ) : viewMode === "table" ? (
        /* Vista de Tabla */
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectionMode && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedActivities.size === paginatedActivities.length &&
                            paginatedActivities.length > 0
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleSelectAllActivities();
                            } else {
                              handleDeselectAllActivities();
                            }
                          }}
                        />
                      </TableHead>
                    )}
                    <TableHead>Nombre</TableHead>
                    <TableHead>Parque</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cupo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedActivities.map((activity: any) => (
                    <TableRow
                      key={activity.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        if (!selectionMode) {
                          setLocation(ROUTES.admin.volunteers.activities.view.build(activity.id));
                        }
                      }}
                    >
                      {selectionMode && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedActivities.has(activity.id)}
                            onCheckedChange={(checked) =>
                              handleSelectActivity(activity.id, checked as boolean)
                            }
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{activity.name}</span>
                          {activity.description && (
                            <span className="text-xs text-gray-500 line-clamp-1">
                              {activity.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {getParkName(activity.parkId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {activity.activityDate
                            ? format(new Date(activity.activityDate), "dd/MM/yyyy HH:mm", {
                                locale: es,
                              })
                            : "Sin fecha"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.category && (
                          <Badge variant="outline">
                            {getCategoryLabel(activity.category)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(activity.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          {activity.maxVolunteers || "Sin límite"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setLocation(ROUTES.admin.volunteers.activities.view.build(activity.id))
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setLocation(ROUTES.admin.volunteers.activities.edit.build(activity.id))
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(activity)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Vista de Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedActivities.map((activity: any) => (
            <Card
              key={activity.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative"
              onClick={() => {
                if (!selectionMode) {
                  setLocation(ROUTES.admin.volunteers.activities.view.build(activity.id));
                }
              }}
            >
              {selectionMode && (
                <div
                  className="absolute top-3 left-3 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedActivities.has(activity.id)}
                    onCheckedChange={(checked) =>
                      handleSelectActivity(activity.id, checked as boolean)
                    }
                    className="bg-white border-2 border-gray-300"
                  />
                </div>
              )}

              {/* Imagen placeholder o categoría visual */}
              <div className="h-40 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm font-semibold">
                    {getCategoryLabel(activity.category || "other")}
                  </p>
                </div>
              </div>

              <CardContent className="p-4">
                {/* Header de la card */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg line-clamp-2">
                    {activity.name}
                  </h3>
                  {getStatusBadge(activity.status)}
                </div>

                {/* Descripción */}
                {activity.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {activity.description}
                  </p>
                )}

                {/* Información */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {getParkName(activity.parkId)}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {activity.activityDate
                      ? format(new Date(activity.activityDate), "dd/MM/yyyy", {
                          locale: es,
                        })
                      : "Sin fecha"}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    {activity.activityDate
                      ? format(new Date(activity.activityDate), "HH:mm", {
                          locale: es,
                        })
                      : "Sin hora"}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    Cupo: {activity.maxVolunteers || "Sin límite"}
                  </div>
                </div>

                {/* Acciones */}
                <div
                  className="flex justify-between items-center pt-3 border-t"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setLocation(ROUTES.admin.volunteers.activities.edit.build(activity.id))
                    }
                    className="border-gray-200"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(activity)}
                    className="border-gray-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <div>
                  Mostrando {Math.min(startIndex + 1, filteredActivities.length)}-
                  {Math.min(endIndex, filteredActivities.length)} de{" "}
                  {filteredActivities.length} actividades
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
                  <span className="text-sm text-gray-600">Página</span>
                  <span className="bg-[#00a587] text-white px-2 py-1 rounded text-sm font-medium">
                    {currentPage}
                  </span>
                  <span className="text-sm text-gray-600">de {totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className="flex items-center gap-1"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Importación CSV */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Actividades desde CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona un archivo CSV con las actividades a importar. Usa la plantilla
                descargable para el formato correcto.
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImportFile(file);
                    }
                  }}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">
                    Haz clic para seleccionar archivo
                  </span>
                  <span className="text-xs text-gray-500">Solo archivos .csv</span>
                </label>
              </div>
              {importFile && (
                <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                  <p className="text-sm text-green-800">
                    📄 {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Formato requerido:</strong> Usa la plantilla CSV descargable que
                incluye todos los campos necesarios.
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="border-[#00a587] text-[#00a587] hover:bg-[#00a587] hover:text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleImportCSV}
                disabled={!importFile || importMutation.isPending}
                className="bg-[#00a587] hover:bg-[#067f5f]"
              >
                {importMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Eliminación Masiva */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar actividades seleccionadas?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente {selectedActivities.size} actividad
              {selectedActivities.size !== 1 ? "es" : ""} seleccionada
              {selectedActivities.size !== 1 ? "s" : ""}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Eliminación Individual */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la actividad "
              {activityToDelete?.name}" y todas las participaciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </AdminLayout>
  );
}