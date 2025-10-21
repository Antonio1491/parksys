import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  ClipboardList,
  Search, 
  Filter,
  Plus,
  Eye,
  Calendar,
  User,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos
interface WorkOrder {
  id: number;
  folio: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  parkId?: number;
  parkName?: string;
  assetId?: number;
  assetName?: string;
  incidentId?: number;
  incidentTitle?: string;
  assignedToEmployeeId?: number;
  assignedEmployeeName?: string;
  requestedById?: number;
  requestedByName?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  createdAt: string;
  updatedAt: string;
}

// Funciones de utilidad para badges
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pendiente': return Clock;
    case 'asignada': return User;
    case 'en_proceso': return AlertCircle;
    case 'pausada': return Pause;
    case 'completada': return CheckCircle2;
    case 'cancelada': return XCircle;
    default: return AlertCircle;
  }
};

const getPriorityColor = (priority: string) => {
  const colors = {
    baja: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    alta: 'bg-orange-100 text-orange-800',
    urgente: 'bg-red-100 text-red-800',
  };
  return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

export default function WorkOrdersPage() {
  const [, setLocation] = useLocation();
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Query para obtener órdenes de trabajo
  const { data, isLoading } = useQuery({
    queryKey: ['/api/work-orders', { 
      search: searchTerm, 
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      page: currentPage,
      limit: itemsPerPage
    }],
  });

  const workOrders = data?.workOrders || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Estadísticas rápidas
  const stats = {
    total: totalCount,
    pendiente: workOrders.filter((wo: WorkOrder) => wo.status === 'pendiente').length,
    en_proceso: workOrders.filter((wo: WorkOrder) => wo.status === 'en_proceso').length,
    completada: workOrders.filter((wo: WorkOrder) => wo.status === 'completada').length,
  };

  return (
    <AdminLayout title="Órdenes de Trabajo">
      <div className="space-y-6">
        {/* Header con botón de nueva orden */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Órdenes de Trabajo</h1>
            <p className="text-gray-500 mt-1">
              Gestiona las órdenes de mantenimiento y mejoras
            </p>
          </div>
          <Button 
            onClick={() => setLocation('/admin/work-orders/new')}
            className="bg-emerald-600 hover:bg-emerald-700"
            data-testid="button-create-work-order"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Orden
          </Button>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendiente}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-600">
                En Proceso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.en_proceso}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">
                Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completada}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input
                  placeholder="Buscar por folio o título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  data-testid="input-search-work-orders"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="asignada">Asignada</SelectItem>
                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                    <SelectItem value="pausada">Pausada</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="select-type-filter">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="correctivo">Correctivo</SelectItem>
                    <SelectItem value="preventivo">Preventivo</SelectItem>
                    <SelectItem value="mejora">Mejora</SelectItem>
                    <SelectItem value="emergencia">Emergencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger data-testid="select-priority-filter">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de órdenes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Listado de Órdenes
            </CardTitle>
            <CardDescription>
              {totalCount} orden{totalCount !== 1 ? 'es' : ''} de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              </div>
            ) : workOrders.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron órdenes de trabajo</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Folio</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Prioridad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Asignado a</TableHead>
                        <TableHead>Fecha Creación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workOrders.map((workOrder: WorkOrder) => {
                        const StatusIcon = getStatusIcon(workOrder.status);
                        return (
                          <TableRow key={workOrder.id} data-testid={`row-work-order-${workOrder.id}`}>
                            <TableCell className="font-medium">
                              {workOrder.folio}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{workOrder.title}</div>
                                {workOrder.parkName && (
                                  <div className="text-sm text-gray-500">
                                    {workOrder.parkName}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getTypeLabel(workOrder.type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(workOrder.priority)}>
                                {workOrder.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(workOrder.status)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {getStatusLabel(workOrder.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {workOrder.assignedEmployeeName || (
                                <span className="text-gray-400 italic">Sin asignar</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {format(new Date(workOrder.createdAt), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLocation(`/admin/work-orders/${workOrder.id}`)}
                                data-testid={`button-view-${workOrder.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
