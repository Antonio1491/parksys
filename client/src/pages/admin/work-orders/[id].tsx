import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { 
  ArrowLeft,
  Clock,
  User,
  Calendar,
  DollarSign,
  FileText,
  Package,
  CheckSquare,
  Paperclip,
  History,
  Edit,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  AlertCircle,
  Trash2,
  Plus,
  ExternalLink
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Funciones de utilidad (copiadas de index.tsx)
const getStatusColor = (status: string) => {
  const colors = {
    pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    asignada: 'bg-blue-100 text-blue-800 border-blue-300',
    en_proceso: 'bg-purple-100 text-purple-800 border-purple-300',
    pausada: 'bg-orange-100 text-orange-800 border-orange-300',
    completada: 'bg-green-100 text-green-800 border-green-300',
    cancelada: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
};

const getStatusLabel = (status: string) => {
  const labels = {
    pendiente: 'Pendiente',
    asignada: 'Asignada',
    en_proceso: 'En Proceso',
    pausada: 'Pausada',
    completada: 'Completada',
    cancelada: 'Cancelada',
  };
  return labels[status as keyof typeof labels] || status;
};

const getTypeLabel = (type: string) => {
  const labels = {
    correctivo: 'Correctivo',
    preventivo: 'Preventivo',
    mejora: 'Mejora',
    emergencia: 'Emergencia',
  };
  return labels[type as keyof typeof labels] || type;
};

export default function WorkOrderDetailPage() {
  const [, params] = useRoute('/admin/work-orders/:id');
  const [, setLocation] = useLocation();
  const workOrderId = params?.id ? parseInt(params.id) : undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para diálogos
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showAddMaterialDialog, setShowAddMaterialDialog] = useState(false);
  const [showAddChecklistDialog, setShowAddChecklistDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Estados para formularios
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [materialStockId, setMaterialStockId] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState('');
  const [checklistTask, setChecklistTask] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  // Queries
  const { data: workOrder, isLoading } = useQuery({
    queryKey: [`/api/work-orders/${workOrderId}`],
    enabled: !!workOrderId
  });

  const { data: materials = [] } = useQuery({
    queryKey: [`/api/work-orders/${workOrderId}/materials`],
    enabled: !!workOrderId
  });

  const { data: checklist = [] } = useQuery({
    queryKey: [`/api/work-orders/${workOrderId}/checklist`],
    enabled: !!workOrderId
  });

  const { data: attachments = [] } = useQuery({
    queryKey: [`/api/work-orders/${workOrderId}/attachments`],
    enabled: !!workOrderId
  });

  const { data: history = [] } = useQuery({
    queryKey: [`/api/work-orders/${workOrderId}/history`],
    enabled: !!workOrderId
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/hr/employees'],
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ['/api/warehouse/stock'],
  });

  // Mutaciones
  const assignMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      return apiRequest(`/api/work-orders/${workOrderId}/assign`, {
        method: 'POST',
        data: { employeeId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}/history`] });
      setShowAssignDialog(false);
      toast({ title: 'Éxito', description: 'Orden asignada correctamente' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo asignar la orden', variant: 'destructive' });
    }
  });

  const addMaterialMutation = useMutation({
    mutationFn: async (data: { stockId: number; quantityUsed: number }) => {
      return apiRequest(`/api/work-orders/${workOrderId}/materials`, {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}/materials`] });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}`] });
      setShowAddMaterialDialog(false);
      setMaterialStockId('');
      setMaterialQuantity('');
      toast({ title: 'Éxito', description: 'Material agregado correctamente' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo agregar el material', variant: 'destructive' });
    }
  });

  const addChecklistMutation = useMutation({
    mutationFn: async (task: string) => {
      return apiRequest(`/api/work-orders/${workOrderId}/checklist`, {
        method: 'POST',
        data: { task }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}/checklist`] });
      setShowAddChecklistDialog(false);
      setChecklistTask('');
      toast({ title: 'Éxito', description: 'Tarea agregada al checklist' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo agregar la tarea', variant: 'destructive' });
    }
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: number; isCompleted: boolean }) => {
      return apiRequest(`/api/work-orders/${workOrderId}/checklist/${itemId}`, {
        method: 'PATCH',
        data: { isCompleted }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}/checklist`] });
    }
  });

  const completeMutation = useMutation({
    mutationFn: async (notes: string) => {
      return apiRequest(`/api/work-orders/${workOrderId}/complete`, {
        method: 'POST',
        data: { completionNotes: notes }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}/history`] });
      setShowCompleteDialog(false);
      toast({ title: 'Éxito', description: 'Orden completada correctamente' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo completar la orden', variant: 'destructive' });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (reason: string) => {
      return apiRequest(`/api/work-orders/${workOrderId}/cancel`, {
        method: 'POST',
        data: { cancelReason: reason }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}/history`] });
      setShowCancelDialog(false);
      toast({ title: 'Éxito', description: 'Orden cancelada' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo cancelar la orden', variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
      <AdminLayout title="Cargando...">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      </AdminLayout>
    );
  }

  if (!workOrder) {
    return (
      <AdminLayout title="No encontrada">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Orden de trabajo no encontrada</p>
          <Button onClick={() => setLocation('/admin/work-orders')} className="mt-4">
            Volver al listado
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const canAssign = workOrder.status === 'pendiente';
  const canComplete = workOrder.status === 'en_proceso' || workOrder.status === 'asignada';
  const canCancel = workOrder.status !== 'completada' && workOrder.status !== 'cancelada';

  return (
    <AdminLayout title={`Orden ${workOrder.folio}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setLocation('/admin/work-orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{workOrder.folio}</h1>
                <Badge className={getStatusColor(workOrder.status)}>
                  {getStatusLabel(workOrder.status)}
                </Badge>
              </div>
              <p className="text-gray-500 mt-1">{workOrder.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {canAssign && (
              <Button onClick={() => setShowAssignDialog(true)} variant="outline">
                <User className="w-4 h-4 mr-2" />
                Asignar
              </Button>
            )}
            {canComplete && (
              <Button onClick={() => setShowCompleteDialog(true)} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Completar
              </Button>
            )}
            {canCancel && (
              <Button onClick={() => setShowCancelDialog(true)} variant="destructive">
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Información general */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{getTypeLabel(workOrder.type)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Prioridad</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="text-sm">{workOrder.priority}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Costo Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                ${workOrder.actualCost?.toFixed(2) || '0.00'} MXN
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de contenido */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">
              <FileText className="w-4 h-4 mr-2" />
              Detalles
            </TabsTrigger>
            <TabsTrigger value="materials">
              <Package className="w-4 h-4 mr-2" />
              Materiales ({materials.length})
            </TabsTrigger>
            <TabsTrigger value="checklist">
              <CheckSquare className="w-4 h-4 mr-2" />
              Checklist ({checklist.length})
            </TabsTrigger>
            <TabsTrigger value="attachments">
              <Paperclip className="w-4 h-4 mr-2" />
              Adjuntos ({attachments.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* Tab: Detalles */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Orden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-600">Descripción</Label>
                  <p className="mt-1">{workOrder.description}</p>
                </div>
                {workOrder.notes && (
                  <div>
                    <Label className="text-gray-600">Notas</Label>
                    <p className="mt-1">{workOrder.notes}</p>
                  </div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Parque</Label>
                    {workOrder.parkId ? (
                      <Button
                        variant="link"
                        className="h-auto p-0 mt-1 text-blue-600 hover:text-blue-800"
                        onClick={() => setLocation(`/admin/parks/${workOrder.parkId}`)}
                      >
                        {workOrder.parkName}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    ) : (
                      <p className="mt-1">N/A</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-600">Activo</Label>
                    {workOrder.assetId ? (
                      <Button
                        variant="link"
                        className="h-auto p-0 mt-1 text-blue-600 hover:text-blue-800"
                        onClick={() => setLocation(`/admin/assets/${workOrder.assetId}`)}
                      >
                        {workOrder.assetName}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    ) : (
                      <p className="mt-1">N/A</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-600">Incidente Relacionado</Label>
                    {workOrder.incidentId ? (
                      <Button
                        variant="link"
                        className="h-auto p-0 mt-1 text-blue-600 hover:text-blue-800"
                        onClick={() => setLocation(`/admin/incidents/${workOrder.incidentId}`)}
                      >
                        {workOrder.incidentTitle}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    ) : (
                      <p className="mt-1">N/A</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-600">Asignado a</Label>
                    <p className="mt-1">{workOrder.assignedEmployeeName || 'Sin asignar'}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Fecha Programada Inicio</Label>
                    <p className="mt-1">
                      {workOrder.scheduledStartDate 
                        ? format(new Date(workOrder.scheduledStartDate), 'dd/MM/yyyy', { locale: es })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Fecha Programada Fin</Label>
                    <p className="mt-1">
                      {workOrder.scheduledEndDate 
                        ? format(new Date(workOrder.scheduledEndDate), 'dd/MM/yyyy', { locale: es })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Costo Estimado</Label>
                    <p className="mt-1">${workOrder.estimatedCost?.toFixed(2) || '0.00'} MXN</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Costo Actual</Label>
                    <p className="mt-1 font-semibold">${workOrder.actualCost?.toFixed(2) || '0.00'} MXN</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Materiales */}
          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Materiales Utilizados</CardTitle>
                  <Button size="sm" onClick={() => setShowAddMaterialDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Material
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {materials.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay materiales registrados</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Costo Unitario</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((material: any) => (
                        <TableRow key={material.id}>
                          <TableCell>{material.materialName || 'Material'}</TableCell>
                          <TableCell>{material.quantityUsed}</TableCell>
                          <TableCell>${material.unitCost?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell className="font-semibold">
                            ${((material.quantityUsed || 0) * (material.unitCost || 0)).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Checklist */}
          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Lista de Tareas</CardTitle>
                  <Button size="sm" onClick={() => setShowAddChecklistDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Tarea
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {checklist.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay tareas en el checklist</p>
                ) : (
                  <div className="space-y-2">
                    {checklist.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 border rounded">
                        <Checkbox
                          checked={item.isCompleted}
                          onCheckedChange={(checked) => 
                            toggleChecklistMutation.mutate({ 
                              itemId: item.id, 
                              isCompleted: !!checked 
                            })
                          }
                        />
                        <span className={item.isCompleted ? 'line-through text-gray-500' : ''}>
                          {item.task}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Adjuntos */}
          <TabsContent value="attachments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Archivos Adjuntos</CardTitle>
                <CardDescription>Evidencias fotográficas y documentos</CardDescription>
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay archivos adjuntos</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {attachments.map((attachment: any) => (
                      <div key={attachment.id} className="border rounded p-2">
                        <img 
                          src={attachment.fileUrl} 
                          alt={attachment.description || 'Adjunto'}
                          className="w-full h-32 object-cover rounded"
                        />
                        {attachment.description && (
                          <p className="text-sm text-gray-600 mt-2">{attachment.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Historial */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Cambios</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay historial disponible</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry: any) => (
                      <div key={entry.id} className="flex gap-3 p-3 border-l-2 border-emerald-600">
                        <div className="flex-1">
                          <p className="font-medium">{entry.action}</p>
                          <p className="text-sm text-gray-600">{entry.changedBy}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Diálogos */}
        {/* Dialog: Asignar */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Orden de Trabajo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Empleado</Label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(employees) && employees.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => assignMutation.mutate(parseInt(selectedEmployeeId))}
                disabled={!selectedEmployeeId || assignMutation.isPending}
              >
                Asignar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Agregar Material */}
        <Dialog open={showAddMaterialDialog} onOpenChange={setShowAddMaterialDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Material</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Material</Label>
                <Select value={materialStockId} onValueChange={setMaterialStockId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un material" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(stockItems) && stockItems.map((item: any) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} (Stock: {item.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input 
                  type="number" 
                  value={materialQuantity}
                  onChange={(e) => setMaterialQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddMaterialDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => addMaterialMutation.mutate({
                  stockId: parseInt(materialStockId),
                  quantityUsed: parseFloat(materialQuantity)
                })}
                disabled={!materialStockId || !materialQuantity || addMaterialMutation.isPending}
              >
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Agregar Checklist */}
        <Dialog open={showAddChecklistDialog} onOpenChange={setShowAddChecklistDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Tarea al Checklist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Descripción de la Tarea</Label>
                <Input 
                  value={checklistTask}
                  onChange={(e) => setChecklistTask(e.target.value)}
                  placeholder="Ej: Revisar estado de tornillos"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddChecklistDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => addChecklistMutation.mutate(checklistTask)}
                disabled={!checklistTask || addChecklistMutation.isPending}
              >
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Completar */}
        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Completar Orden de Trabajo</DialogTitle>
              <DialogDescription>
                Confirma que el trabajo ha sido completado satisfactoriamente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Notas de Finalización</Label>
                <Textarea 
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Describe el trabajo realizado y cualquier observación relevante..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => completeMutation.mutate(completionNotes)}
                disabled={completeMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                Completar Orden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Cancelar */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Orden de Trabajo</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Razón de Cancelación</Label>
                <Textarea 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Explica por qué se cancela esta orden..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Volver
              </Button>
              <Button 
                onClick={() => cancelMutation.mutate(cancelReason)}
                disabled={!cancelReason || cancelMutation.isPending}
                variant="destructive"
              >
                Cancelar Orden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
