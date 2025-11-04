import { useState } from "react";
import { useLocation, useParams } from "wouter";
import ROUTES from "@/routes";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Edit,
  Trash2,
  UserPlus,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  FileText,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";
import { ReturnHeader } from "@/components/ui/return-header";
import { useArrayQuery } from "@/hooks/useArrayQuery";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function VolunteerActivityView() {
  const params = useParams();
  const activityId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<any>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  // Obtener detalle de la actividad
  const { data: activity, isLoading: isLoadingActivity } = useQuery({
    queryKey: [`/api/volunteer-activities/${activityId}`],
    enabled: !!activityId,
  });

  // Obtener participaciones de la actividad
  const { data: participations = [], isLoading: isLoadingParticipations, refetch: refetchParticipations } = useArrayQuery(
    `/api/volunteer-activities/${activityId}/participations`,
    "data"
  );

  // Obtener información del parque
  const { data: park } = useQuery({
    queryKey: [`/api/parks/${activity?.parkId}`],
    enabled: !!activity?.parkId,
  });

  // Obtener información del supervisor
  const { data: supervisor } = useQuery({
    queryKey: [`/api/users/${activity?.supervisorId}`],
    enabled: !!activity?.supervisorId,
  });

  // Mutación para eliminar actividad
  const deleteActivityMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/volunteer-activities/${activityId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Actividad eliminada",
        description: "La actividad se ha eliminado exitosamente.",
      });
      setLocation(ROUTES.admin.volunteers.activities.list);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo eliminar la actividad",
        variant: "destructive",
      });
    },
  });

  // Mutación para remover participante
  const removeParticipantMutation = useMutation({
    mutationFn: async (participationId: number) => {
      return await apiRequest(`/api/volunteer-participations/${participationId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Participante removido",
        description: "El voluntario ha sido removido de la actividad.",
      });
      refetchParticipations();
      setRemoveDialogOpen(false);
      setParticipantToRemove(null);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo remover al participante",
        variant: "destructive",
      });
    },
  });

  // Función para obtener badge de estado
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      planned: { label: "Planificada", className: "bg-blue-100 text-blue-800" },
      in_progress: { label: "En Curso", className: "bg-yellow-100 text-yellow-800" },
      completed: { label: "Completada", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelada", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Función para obtener badge de asistencia
  const getAttendanceBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
      registered: { label: "Registrado", icon: AlertCircle, className: "bg-blue-100 text-blue-800" },
      confirmed: { label: "Confirmado", icon: CheckCircle, className: "bg-green-100 text-green-800" },
      attended: { label: "Asistió", icon: CheckCircle, className: "bg-green-600 text-white" },
      absent: { label: "Ausente", icon: XCircle, className: "bg-red-100 text-red-800" },
      cancelled: { label: "Canceló", icon: XCircle, className: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[status] || { label: status, icon: AlertCircle, className: "bg-gray-100 text-gray-800" };
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
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

  // Función para exportar lista de participantes
  const handleExportParticipants = () => {
    try {
      if (!Array.isArray(participations) || participations.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay participantes para exportar.",
          variant: "destructive",
        });
        return;
      }

      const csvHeaders = [
        "Voluntario",
        "Email",
        "Teléfono",
        "Estado",
        "Horas",
        "Check-in",
        "Check-out",
        "Calificación",
        "Notas",
      ];

      const csvRows = participations.map((participation: any) => [
        participation.volunteerName || "",
        participation.volunteerEmail || "",
        participation.volunteerPhone || "",
        participation.attendanceStatus || "",
        participation.hoursContributed || "0",
        participation.checkInTime ? format(new Date(participation.checkInTime), "dd/MM/yyyy HH:mm") : "",
        participation.checkOutTime ? format(new Date(participation.checkOutTime), "dd/MM/yyyy HH:mm") : "",
        participation.rating || "",
        participation.volunteerNotes || "",
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
        `participantes-${activity?.name || "actividad"}-${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "✅ Exportación exitosa",
        description: `Se exportaron ${participations.length} participantes.`,
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo exportar el archivo CSV.",
        variant: "destructive",
      });
    }
  };

  // Handler para remover participante
  const handleRemoveParticipant = (participation: any) => {
    setParticipantToRemove(participation);
    setRemoveDialogOpen(true);
  };

  const handleConfirmRemove = () => {
    if (participantToRemove) {
      removeParticipantMutation.mutate(participantToRemove.id);
    }
  };

  // Calcular estadísticas de participación
  const participationStats = {
    total: participations.length,
    registered: participations.filter((p: any) => p.attendanceStatus === "registered").length,
    confirmed: participations.filter((p: any) => p.attendanceStatus === "confirmed").length,
    attended: participations.filter((p: any) => p.attendanceStatus === "attended").length,
    absent: participations.filter((p: any) => p.attendanceStatus === "absent").length,
  };

  const availableSpots = activity?.maxVolunteers 
    ? activity.maxVolunteers - participations.length 
    : "Ilimitado";

  if (isLoadingActivity) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a587] mx-auto mb-4"></div>
          Cargando actividad...
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container mx-auto p-6">
        <ReturnHeader />
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Actividad no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <ReturnHeader />

      <div className="flex justify-between items-start mt-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {activity.name}
          </h1>
          <div className="flex items-center gap-3">
            {getStatusBadge(activity.status)}
            {activity.category && (
              <Badge variant="outline">
                {getCategoryLabel(activity.category)}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setLocation(ROUTES.admin.volunteers.activities.edit.build(activityId))}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalles de la Actividad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalles de la Actividad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activity.description && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-1">Descripción</h4>
                  <p className="text-gray-800">{activity.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Parque</p>
                    <p className="font-medium">{park?.name || "Sin parque"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Fecha</p>
                    <p className="font-medium">
                      {activity.activityDate
                        ? format(new Date(activity.activityDate), "PPPP", { locale: es })
                        : "Sin fecha"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Hora</p>
                    <p className="font-medium">
                      {activity.activityDate
                        ? format(new Date(activity.activityDate), "HH:mm", { locale: es })
                        : "Sin hora"}{" "}
                      hrs
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Duración Estimada</p>
                    <p className="font-medium">
                      {activity.scheduledHours || "No especificado"} horas
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Cupo Máximo</p>
                    <p className="font-medium">
                      {activity.maxVolunteers || "Sin límite"} voluntarios
                    </p>
                  </div>
                </div>

                {supervisor && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Supervisor</p>
                      <p className="font-medium">
                        {supervisor.fullName || supervisor.full_name || supervisor.username}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {activity.requirements && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">
                      Requisitos Especiales
                    </h4>
                    <p className="text-gray-800">{activity.requirements}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas de Participación */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Inscritos</span>
                <span className="text-2xl font-bold text-[#00a587]">
                  {participationStats.total}
                </span>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Registrados</span>
                  <Badge variant="outline" className="bg-blue-50">
                    {participationStats.registered}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Confirmados</span>
                  <Badge variant="outline" className="bg-green-50">
                    {participationStats.confirmed}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Asistieron</span>
                  <Badge variant="outline" className="bg-green-600 text-white">
                    {participationStats.attended}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Ausentes</span>
                  <Badge variant="outline" className="bg-red-50">
                    {participationStats.absent}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Espacios Disponibles</span>
                <span className="text-lg font-semibold">
                  {typeof availableSpots === "number" && availableSpots < 0 
                    ? "Sobrecupo" 
                    : availableSpots}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => setLocation(`${ROUTES.admin.volunteers.participations.create}?activityId=${activityId}`)}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Inscribir Voluntario
          </Button>
        </div>
      </div>

      {/* Lista de Participantes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Voluntarios Inscritos</CardTitle>
              <CardDescription>
                Lista de voluntarios participando en esta actividad
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleExportParticipants}
              disabled={participations.length === 0}
              className="border-[#00a587] text-[#00a587] hover:bg-[#00a587] hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Lista
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingParticipations ? (
            <div className="text-center py-8 text-gray-500">
              Cargando participantes...
            </div>
          ) : participations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay voluntarios inscritos en esta actividad</p>
              <Button
                onClick={() => setLocation(`${ROUTES.admin.volunteers.participations.create}?activityId=${activityId}`)}
                variant="outline"
                className="mt-4"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Inscribir Primer Voluntario
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voluntario</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participations.map((participation: any) => (
                    <TableRow key={participation.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                            {participation.volunteerName?.charAt(0) || "V"}
                          </div>
                          <div>
                            <p className="font-medium">
                              {participation.volunteerName || "Sin nombre"}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {participation.volunteerId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {participation.volunteerEmail && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              {participation.volunteerEmail}
                            </div>
                          )}
                          {participation.volunteerPhone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {participation.volunteerPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getAttendanceBadge(participation.attendanceStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {participation.hoursContributed || 0} hrs
                        </div>
                      </TableCell>
                      <TableCell>
                        {participation.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{participation.rating}/5</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin calificar</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setLocation(ROUTES.admin.volunteers.participations.view.build(participation.id))
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveParticipant(participation)}
                            className="text-red-600"
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

      {/* Dialog de Eliminación de Actividad */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la actividad "
              {activity.name}" y todas las {participations.length} participaciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteActivityMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteActivityMutation.isPending}
            >
              {deleteActivityMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Remover Participante */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover voluntario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se removerá a "{participantToRemove?.volunteerName}" de esta actividad. Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-red-600 hover:bg-red-700"
              disabled={removeParticipantMutation.isPending}
            >
              {removeParticipantMutation.isPending ? "Removiendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}