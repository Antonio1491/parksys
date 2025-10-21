import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import ROUTES from '@/routes';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  MessageSquare,
  Paperclip,
  Send,
  UserPlus,
  PenTool,
  History,
  Settings,
  FileText,
  Users,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  Ban,
  Wrench
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';

// Interfaces para los tipos de datos
interface Incident {
  id: number;
  title: string;
  description: string;
  status: string;
  severity: string;
  priority?: string;
  category: string;
  location: string;
  reporterName: string;
  reporterEmail: string;
  parkName: string;
  parkId?: number;
  assetName?: string;
  assetId?: number;
  assignedToUserId?: number;
  estimatedHours?: number;
  actualHours?: number;
  costEstimate?: number;
  actualCost?: number;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

interface Comment {
  id: number;
  commentText: string;
  isInternal: boolean;
  isPublic: boolean;
  authorName: string;
  authorUsername: string;
  createdAt: string;
}

interface HistoryItem {
  id: number;
  actionType: string;
  oldValue?: string;
  newValue?: string;
  fieldName?: string;
  notes?: string;
  authorName: string;
  authorUsername: string;
  createdAt: string;
}

interface User {
  id: number;
  fullName: string;
  username: string;
  role: string;
}

// Función para obtener color del estado
const getStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    review: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

// Función para obtener etiqueta del estado
const getStatusLabel = (status: string) => {
  const labels = {
    pending: 'Pendiente',
    assigned: 'Asignada',
    in_progress: 'En Proceso',
    review: 'En Revisión',
    resolved: 'Resuelta',
    closed: 'Cerrada',
    rejected: 'Rechazada'
  };
  return labels[status as keyof typeof labels] || status;
};

// Función para obtener icono del estado
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return Clock;
    case 'assigned': return UserPlus;
    case 'in_progress': return Settings;
    case 'review': return ClipboardCheck;
    case 'resolved': return CheckCircle2;
    case 'closed': return CheckCircle;
    case 'rejected': return Ban;
    default: return AlertCircle;
  }
};

const DetailedIncidentPage = () => {
  const [, params] = useRoute(ROUTES.admin.incidents.view.path);
  const [location, setLocation] = useLocation();
  const incidentId = params?.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados locales
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentDepartment, setAssignmentDepartment] = useState('');
  
  // Consultas para obtener datos
  const { 
    data: incident, 
    isLoading: isLoadingIncident,
    isError: isErrorIncident
  } = useQuery({
    queryKey: [`/api/incidents/${incidentId}`],
    enabled: !!incidentId
  });
  
  const { 
    data: comments = [], 
    isLoading: isLoadingComments
  } = useQuery({
    queryKey: [`/api/incidents/${incidentId}/comments`],
    enabled: !!incidentId
  });
  
  const { 
    data: history = [], 
    isLoading: isLoadingHistory
  } = useQuery({
    queryKey: [`/api/incidents/${incidentId}/history`],
    enabled: !!incidentId
  });
  
  const { 
    data: attachments = [], 
    isLoading: isLoadingAttachments
  } = useQuery({
    queryKey: [`/api/incidents/${incidentId}/attachments`],
    enabled: !!incidentId
  });
  
  const { 
    data: assignments = [], 
    isLoading: isLoadingAssignments
  } = useQuery({
    queryKey: [`/api/incidents/${incidentId}/assignments`],
    enabled: !!incidentId
  });
  
  const { data: parks = [] } = useQuery({
    queryKey: ['/api/parks']
  });
  
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users']
  });

  // Mutación para agregar comentario
  const addCommentMutation = useMutation({
    mutationFn: async (data: { commentText: string; isInternal: boolean }) => {
      return await apiRequest(`/api/incidents/${incidentId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${incidentId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${incidentId}/history`] });
      setNewComment('');
      toast({
        title: "Comentario agregado",
        description: "El comentario se ha guardado exitosamente."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario.",
        variant: "destructive"
      });
    }
  });

  // Mutación para cambiar estado
  const changeStatusMutation = useMutation({
    mutationFn: async (data: { status: string; notes?: string }) => {
      return await apiRequest(`/api/incidents/${incidentId}/status`, {
        method: 'PUT',
        data: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${incidentId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${incidentId}/history`] });
      setShowStatusDialog(false);
      setSelectedStatus('');
      setStatusNotes('');
      toast({
        title: "Estado actualizado",
        description: "El estado de la incidencia se ha actualizado."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
        variant: "destructive"
      });
    }
  });

  // Mutación para asignar incidencia
  const assignIncidentMutation = useMutation({
    mutationFn: async (data: { assignedToUserId?: number; notes?: string; dueDate?: string }) => {
      return await apiRequest(`/api/incidents/${incidentId}/assign`, {
        method: 'PUT',
        data: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${incidentId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${incidentId}/history`] });
      setShowAssignDialog(false);
      setSelectedUserId('');
      setAssignmentNotes('');
      setAssignmentDueDate('');
      toast({
        title: "Incidencia asignada",
        description: "La incidencia se ha asignado exitosamente."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo asignar la incidencia.",
        variant: "destructive"
      });
    }
  });

  // Mutación para crear nueva asignación
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: { assignedToUserId: number; department?: string; dueDate?: string; notes?: string }) => {
      return await apiRequest(`/api/incidents/${incidentId}/assignments`, {
        method: 'POST',
        data: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${incidentId}/assignments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${incidentId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${incidentId}/history`] });
      setShowAssignDialog(false);
      setSelectedUserId('');
      setAssignmentNotes('');
      setAssignmentDueDate('');
      setAssignmentDepartment('');
      toast({
        title: "Asignación creada",
        description: "La nueva asignación se ha creado correctamente."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la asignación.",
        variant: "destructive"
      });
    }
  });

  // Manejadores de eventos
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({
      commentText: newComment.trim(),
      isInternal: isInternalComment
    });
  };

  const handleChangeStatus = () => {
    if (!selectedStatus) return;
    
    changeStatusMutation.mutate({
      status: selectedStatus,
      notes: statusNotes || undefined
    });
  };

  const handleAssignIncident = () => {
    if (!selectedUserId) return;
    
    createAssignmentMutation.mutate({
      assignedToUserId: parseInt(selectedUserId),
      department: assignmentDepartment || 'General',
      notes: assignmentNotes || undefined,
      dueDate: assignmentDueDate || undefined
    });
  };

  const goBack = () => {
    setLocation(ROUTES.admin.incidents.list);
  };

  if (isLoadingIncident) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isErrorIncident || !incident) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error al cargar incidencia
            </h3>
            <p className="text-gray-500 mb-4">
              No se pudo cargar la información de la incidencia.
            </p>
            <Button onClick={goBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a incidencias
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const StatusIcon = getStatusIcon(incident.status);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={goBack} variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Incidencia #{incident.id}
                </h1>
                <p className="text-gray-500">{incident.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(incident.status)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {getStatusLabel(incident.status)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Detalles de la Incidencia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Detalles de la Incidencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Descripción</Label>
                    <p className="text-gray-900 mt-1">{incident.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Ubicación</Label>
                    <p className="text-gray-900 mt-1 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {incident.location}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Parque</Label>
                    <p className="text-gray-900 mt-1">{incident.parkName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Categoría</Label>
                    <p className="text-gray-900 mt-1">{incident.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Severidad</Label>
                    <Badge variant="outline">{incident.severity}</Badge>
                  </div>
                  {incident.priority && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Prioridad</Label>
                      <Badge variant="outline">{incident.priority}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs con información adicional */}
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="comments">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Comentarios
                </TabsTrigger>
                <TabsTrigger value="assignments">
                  <Users className="w-4 h-4 mr-2" />
                  Asignaciones
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="w-4 h-4 mr-2" />
                  Historial
                </TabsTrigger>
                <TabsTrigger value="attachments">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Archivos
                </TabsTrigger>
                <TabsTrigger value="workflow">
                  <Settings className="w-4 h-4 mr-2" />
                  Flujo
                </TabsTrigger>
              </TabsList>

              {/* Pestaña de Comentarios */}
              <TabsContent value="comments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Agregar Comentario</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Escribe tu comentario aquí..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="internal"
                            checked={isInternalComment}
                            onChange={(e) => setIsInternalComment(e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor="internal">Comentario interno</Label>
                        </div>
                        <Button 
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || addCommentMutation.isPending}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Enviar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de comentarios */}
                <div className="space-y-3">
                  {isLoadingComments ? (
                    <div className="text-center py-4">Cargando comentarios...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay comentarios aún
                    </div>
                  ) : (
                    comments.map((comment: Comment) => (
                      <Card key={comment.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {comment.authorName?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{comment.authorName}</span>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </span>
                                {comment.isInternal && (
                                  <Badge variant="secondary" className="text-xs">
                                    Interno
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-700 mt-1">{comment.commentText}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Pestaña de Asignaciones */}
              <TabsContent value="assignments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Nueva Asignación</CardTitle>
                    <CardDescription>
                      Crea una nueva asignación para esta incidencia
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Usuario</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar usuario" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(users) && users.map((user: User) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullName} ({user.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Departamento</Label>
                        <Select value={assignmentDepartment} onValueChange={setAssignmentDepartment}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                            <SelectItem value="Seguridad">Seguridad</SelectItem>
                            <SelectItem value="Jardinería">Jardinería</SelectItem>
                            <SelectItem value="Limpieza">Limpieza</SelectItem>
                            <SelectItem value="Infraestructura">Infraestructura</SelectItem>
                            <SelectItem value="Atención al Público">Atención al Público</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Fecha límite (opcional)</Label>
                        <Input
                          type="datetime-local"
                          value={assignmentDueDate}
                          onChange={(e) => setAssignmentDueDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Notas (opcional)</Label>
                        <Textarea
                          value={assignmentNotes}
                          onChange={(e) => setAssignmentNotes(e.target.value)}
                          placeholder="Instrucciones o notas para el usuario asignado..."
                        />
                      </div>
                      <Button 
                        onClick={handleAssignIncident}
                        disabled={!selectedUserId || createAssignmentMutation.isPending}
                        className="w-full"
                      >
                        {createAssignmentMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creando asignación...
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4 mr-2" />
                            Crear Asignación
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de asignaciones existentes */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Asignaciones Existentes</h3>
                  {isLoadingAssignments ? (
                    <div className="text-center py-4">Cargando asignaciones...</div>
                  ) : assignments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay asignaciones registradas
                    </div>
                  ) : (
                    assignments.map((assignment: any) => (
                      <Card key={assignment.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="font-medium">{assignment.assignedToName}</div>
                                <Badge variant="outline">{assignment.department}</Badge>
                                <Badge 
                                  variant={assignment.status === 'pending' ? 'secondary' : 
                                           assignment.status === 'in_progress' ? 'default' : 
                                           assignment.status === 'completed' ? 'success' : 'destructive'}
                                >
                                  {assignment.status === 'pending' ? 'Pendiente' : 
                                   assignment.status === 'in_progress' ? 'En Progreso' : 
                                   assignment.status === 'completed' ? 'Completado' : 'Cancelado'}
                                </Badge>
                              </div>
                              {assignment.dueDate && (
                                <div className="text-sm text-gray-600 mb-1">
                                  Fecha límite: {format(new Date(assignment.dueDate), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </div>
                              )}
                              {assignment.notes && (
                                <p className="text-sm text-gray-700">{assignment.notes}</p>
                              )}
                              <div className="text-xs text-gray-500 mt-2">
                                Creado: {format(new Date(assignment.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Pestaña de Historial */}
              <TabsContent value="history">
                <div className="space-y-3">
                  {isLoadingHistory ? (
                    <div className="text-center py-4">Cargando historial...</div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay historial disponible
                    </div>
                  ) : (
                    history.map((item: HistoryItem) => (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{item.authorName}</span>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </span>
                              </div>
                              <p className="text-gray-700 mt-1">
                                {item.actionType === 'status_change' && 
                                  `Cambió el estado de "${item.oldValue}" a "${item.newValue}"`}
                                {item.actionType === 'assignment' && 
                                  `Asignó la incidencia`}
                                {item.actionType === 'comment_added' && 
                                  `Agregó un comentario`}
                                {item.notes && ` - ${item.notes}`}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Pestaña de Archivos */}
              <TabsContent value="attachments">
                <div className="text-center py-8 text-gray-500">
                  Funcionalidad de archivos adjuntos próximamente
                </div>
              </TabsContent>

              {/* Pestaña de Flujo de Trabajo */}
              <TabsContent value="workflow">
                <div className="space-y-4">
                  {/* Acciones rápidas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-20">
                          <div className="text-center">
                            <PenTool className="w-6 h-6 mx-auto mb-2" />
                            <div>Cambiar Estado</div>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cambiar Estado de Incidencia</DialogTitle>
                          <DialogDescription>
                            Selecciona el nuevo estado para esta incidencia
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Nuevo Estado</Label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="assigned">Asignada</SelectItem>
                                <SelectItem value="in_progress">En Proceso</SelectItem>
                                <SelectItem value="review">En Revisión</SelectItem>
                                <SelectItem value="resolved">Resuelta</SelectItem>
                                <SelectItem value="closed">Cerrada</SelectItem>
                                <SelectItem value="rejected">Rechazada</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Notas (opcional)</Label>
                            <Textarea
                              value={statusNotes}
                              onChange={(e) => setStatusNotes(e.target.value)}
                              placeholder="Agregar notas sobre el cambio de estado..."
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleChangeStatus}
                            disabled={!selectedStatus || changeStatusMutation.isPending}
                          >
                            Cambiar Estado
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-20">
                          <div className="text-center">
                            <Users className="w-6 h-6 mx-auto mb-2" />
                            <div>Asignar Usuario</div>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Asignar Incidencia</DialogTitle>
                          <DialogDescription>
                            Asigna esta incidencia a un usuario específico
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Usuario</Label>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar usuario" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray(users) && users.map((user: User) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.fullName} ({user.username})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Departamento</Label>
                            <Select value={assignmentDepartment} onValueChange={setAssignmentDepartment}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar departamento" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                                <SelectItem value="Seguridad">Seguridad</SelectItem>
                                <SelectItem value="Jardinería">Jardinería</SelectItem>
                                <SelectItem value="Limpieza">Limpieza</SelectItem>
                                <SelectItem value="Infraestructura">Infraestructura</SelectItem>
                                <SelectItem value="Atención al Público">Atención al Público</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Fecha límite (opcional)</Label>
                            <Input
                              type="datetime-local"
                              value={assignmentDueDate}
                              onChange={(e) => setAssignmentDueDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Notas (opcional)</Label>
                            <Textarea
                              value={assignmentNotes}
                              onChange={(e) => setAssignmentNotes(e.target.value)}
                              placeholder="Instrucciones o notas para el usuario asignado..."
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleAssignIncident}
                            disabled={!selectedUserId || assignIncidentMutation.isPending}
                          >
                            Asignar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="outline" 
                      className="h-20"
                      onClick={() => {
                        const params = new URLSearchParams({
                          fromIncident: incident.id.toString(),
                          title: incident.title,
                          description: incident.description,
                          parkId: incident.parkId?.toString() || '',
                          assetId: incident.assetId?.toString() || ''
                        });
                        setLocation(`/admin/work-orders/new?${params.toString()}`);
                      }}
                      data-testid="button-create-work-order"
                    >
                      <div className="text-center">
                        <Wrench className="w-6 h-6 mx-auto mb-2" />
                        <div>Crear Orden de Trabajo</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Información del Reportante */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Reportante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm text-gray-500">Nombre</Label>
                    <p className="font-medium">{incident.reporterName}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Email</Label>
                    <p className="text-sm text-gray-600">{incident.reporterEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fechas Importantes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-500">Creada</Label>
                    <p className="text-sm">
                      {format(new Date(incident.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Actualizada</Label>
                    <p className="text-sm">
                      {format(new Date(incident.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                  {incident.dueDate && (
                    <div>
                      <Label className="text-sm text-gray-500">Fecha límite</Label>
                      <p className="text-sm">
                        {format(new Date(incident.dueDate), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Métricas */}
            {(incident.estimatedHours || incident.costEstimate) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClipboardCheck className="w-5 h-5 mr-2" />
                    Métricas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {incident.estimatedHours && (
                      <div>
                        <Label className="text-sm text-gray-500">Horas estimadas</Label>
                        <p className="text-sm">{incident.estimatedHours}h</p>
                      </div>
                    )}
                    {incident.actualHours && (
                      <div>
                        <Label className="text-sm text-gray-500">Horas reales</Label>
                        <p className="text-sm">{incident.actualHours}h</p>
                      </div>
                    )}
                    {incident.costEstimate && (
                      <div>
                        <Label className="text-sm text-gray-500">Costo estimado</Label>
                        <p className="text-sm">${incident.costEstimate.toLocaleString()}</p>
                      </div>
                    )}
                    {incident.actualCost && (
                      <div>
                        <Label className="text-sm text-gray-500">Costo real</Label>
                        <p className="text-sm">${incident.actualCost.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DetailedIncidentPage;