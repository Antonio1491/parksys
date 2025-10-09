import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/ui/page-header';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { 
  UserCheck, Search, Filter, Download, Users, 
  Calendar, MapPin, Clock, CheckCircle, XCircle, 
  AlertCircle, Eye, Mail, Phone, Grid3X3, List,
  ChevronLeft, ChevronRight, BarChart3, DollarSign,
  TrendingUp, Target, Trash2, X
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActivityRegistration {
  id: number;
  activityId: number;
  participantName: string;
  participantEmail: string;
  participantPhone?: string;
  age?: number;
  emergencyContactName?: string;
  emergencyPhone?: string;
  medicalConditions?: string;
  dietaryRestrictions?: string;
  status: 'pending' | 'approved' | 'rejected';
  registrationDate: string;
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  acceptsTerms: boolean;
  createdAt: string;
  updatedAt: string;
  activity?: {
    id: number;
    title: string;
    startDate: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    location?: string;
    maxRegistrations?: number;
    currentRegistrations: number;
    park?: {
      name: string;
    };
  };
}

interface ActivitySummary {
  id: number;
  title: string;
  description?: string;
  category: string;
  parkName: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  location?: string;
  capacity: number;
  price: string;
  isFree: boolean;
  registrationStats: {
    totalRegistrations: number;
    approved: number;
    pending: number;
    rejected: number;
    availableSlots: number;
  };
  revenue: {
    totalRevenue: number;
    potentialRevenue: number;
  };
  registrationEnabled: boolean;
  maxRegistrations?: number;
  registrationDeadline?: string;
}

const ActivityRegistrationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedRegistration, setSelectedRegistration] = useState<ActivityRegistration | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [summaryViewMode, setSummaryViewMode] = useState<'cards' | 'table'>('cards');
  const [summaryCurrentPage, setSummaryCurrentPage] = useState(1);
  const [selectedRegistrations, setSelectedRegistrations] = useState<number[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<number | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  
  // Estados para filtros de fecha
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  
  const ITEMS_PER_PAGE = 10;
  const itemsPerPage = 10;

  // Obtener inscripciones
  const { data: registrationsData, isLoading } = useQuery({
    queryKey: ['/api/activity-registrations', currentPage, searchTerm, statusFilter, activityFilter, startDateFilter, endDateFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(activityFilter !== 'all' && { activity: activityFilter }),
        ...(startDateFilter && { startDate: startDateFilter }),
        ...(endDateFilter && { endDate: endDateFilter })
      });
      
      const response = await fetch(`/api/activity-registrations?${params}`);
      if (!response.ok) throw new Error('Error al cargar inscripciones');
      return response.json();
    }
  });

  // Obtener actividades para filtro
  const { data: activitiesData } = useQuery({
    queryKey: ['/api/activities'],
    queryFn: async () => {
      const response = await fetch('/api/activities');
      if (!response.ok) throw new Error('Error al cargar actividades');
      return response.json();
    }
  });

  // Obtener resumen de actividades con estadísticas de inscripciones
  const { data: activitiesSummaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['/api/activities-summary-data'],
    queryFn: async () => {
      const response = await fetch('/api/activities-summary-data');
      if (!response.ok) throw new Error('Error al cargar resumen de actividades');
      return response.json();
    }
  });

  const registrations = registrationsData?.registrations || [];
  const totalPages = registrationsData?.pagination?.totalPages || 1;
  const activities = Array.isArray(activitiesData) ? activitiesData : [];

  // Paginación para el resumen de actividades
  const totalSummaryActivities = activitiesSummaryData?.length || 0;
  const totalSummaryPages = Math.ceil(totalSummaryActivities / ITEMS_PER_PAGE);
  const startIndex = (summaryCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSummaryData = activitiesSummaryData?.slice(startIndex, endIndex) || [];

  // Mutación para aprobar/rechazar inscripciones
  const statusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: number; status: 'approved' | 'rejected'; reason?: string }) => {
      const response = await fetch(`/api/activity-registrations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      if (!response.ok) throw new Error('Error al actualizar estado');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Estado actualizado",
        description: "El estado de la inscripción ha sido actualizado exitosamente."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-registrations'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Hubo un problema al actualizar el estado de la inscripción.",
        variant: "destructive"
      });
    }
  });

  // Mutación para eliminar inscripción individual
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/activity-registrations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar inscripción');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Inscripción eliminada',
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-registrations'] });
      setRegistrationToDelete(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutación para eliminación en lote
  const bulkDeleteMutation = useMutation({
    mutationFn: async (registrationIds: number[]) => {
      const response = await fetch('/api/activity-registrations/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationIds })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar inscripciones');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Inscripciones eliminadas',
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-registrations'] });
      setSelectedRegistrations([]);
      setIsBulkDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  // Los filtros se manejan desde el backend, no necesitamos filtrar aquí
  
  // Función para resetear página cuando cambian los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [startDateFilter, endDateFilter, statusFilter, activityFilter, searchTerm]);
  const displayedRegistrations = registrations;

  const handleStatusChange = (id: number, status: 'approved' | 'rejected', reason?: string) => {
    statusMutation.mutate({ id, status, reason });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Actividad', 'Participante', 'Email', 'Teléfono', 'Estado', 'Fecha de Inscripción'],
      ...displayedRegistrations.map((reg: ActivityRegistration) => [
        reg.activity?.title || '',
        reg.participantName,
        reg.participantEmail,
        reg.participantPhone || '',
        reg.status,
        format(new Date(reg.registrationDate), 'dd/MM/yyyy', { locale: es })
      ])
    ].map(row => row.map((field: any) => `"${field}"`).join(',')).join('\n');

    // Add UTF-8 BOM for proper Excel encoding
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inscripciones_actividades_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  const viewRegistrationDetail = (registration: ActivityRegistration) => {
    setSelectedRegistration(registration);
    setIsDetailModalOpen(true);
  };

  // Funciones para manejo de selección múltiple
  const handleSelectRegistration = (registrationId: number, checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(prev => [...prev, registrationId]);
    } else {
      setSelectedRegistrations(prev => prev.filter(id => id !== registrationId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(displayedRegistrations.map((reg: ActivityRegistration) => reg.id));
    } else {
      setSelectedRegistrations([]);
    }
  };

  const isAllSelected = displayedRegistrations.length > 0 && selectedRegistrations.length === displayedRegistrations.length;
  const isIndeterminate = selectedRegistrations.length > 0 && selectedRegistrations.length < displayedRegistrations.length;

  // Funciones para eliminación
  const handleDeleteRegistration = (id: number) => {
    setRegistrationToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (registrationToDelete) {
      deleteMutation.mutate(registrationToDelete);
    }
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedRegistrations);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a587] mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando inscripciones...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Gestión de Inscripciones"
          subtitle="Administra las inscripciones ciudadanas a actividades públicas"
          icon={<UserCheck />}
        />

        {/* Resumen de Actividades */}
        <div className="space-y-6">
          {isLoadingSummary ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a587] mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando resumen de actividades...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Barra de búsqueda y controles */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Campo de búsqueda */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar actividad"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center gap-2">
                      {/* Toggle Grid/Lista */}
                      <div className="flex border rounded-lg p-1 bg-gray-100">
                        <Button
                          variant={summaryViewMode === 'cards' ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSummaryViewMode('cards')}
                          className={`flex items-center gap-1 ${summaryViewMode === 'cards' ? 'bg-[#00a587] text-white' : ''}`}
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={summaryViewMode === 'table' ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSummaryViewMode('table')}
                          className={`flex items-center gap-1 ${summaryViewMode === 'table' ? 'bg-[#00a587] text-white' : ''}`}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Botón Copiar */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                          toast({
                            title: "Función en desarrollo",
                            description: "La función de copiar estará disponible próximamente."
                          });
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {/* Botón Eliminar */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                          toast({
                            title: "Función en desarrollo",
                            description: "La función de eliminar estará disponible próximamente."
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contenido del resumen */}
              {activitiesSummaryData && activitiesSummaryData.length > 0 ? (
                <>
                  {/* Vista de Tarjetas */}
                  {/* Vista de Tarjetas */}
                  {summaryViewMode === 'cards' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {paginatedSummaryData.map((activity: ActivitySummary) => (
                        <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg line-clamp-2">{activity.title}</CardTitle>
                                <p className="text-sm text-gray-600 mt-1">{activity.category}</p>
                              </div>
                              <Badge variant={activity.registrationEnabled ? "default" : "secondary"}>
                                {activity.registrationEnabled ? "Activa" : "Cerrada"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Información básica */}
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{activity.parkName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(activity.startDate), 'dd/MM/yyyy', { locale: es })}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="h-3 w-3" />
                                <span>{activity.startTime}</span>
                              </div>
                            </div>

                            {/* Estadísticas de inscripciones */}
                            <div className="border-t pt-4">
                              <h4 className="font-medium text-sm mb-3">Estadísticas de Inscripciones</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="text-center p-2 bg-blue-50 rounded">
                                  <div className="text-lg font-bold text-blue-600">{activity.registrationStats.totalRegistrations}</div>
                                  <div className="text-xs text-gray-600">Total</div>
                                </div>
                                <div className="text-center p-2 bg-green-50 rounded">
                                  <div className="text-lg font-bold text-green-600">{activity.registrationStats.approved}</div>
                                  <div className="text-xs text-gray-600">Aprobadas</div>
                                </div>
                                <div className="text-center p-2 bg-orange-50 rounded">
                                  <div className="text-lg font-bold text-orange-600">{activity.registrationStats.pending}</div>
                                  <div className="text-xs text-gray-600">Pendientes</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 rounded">
                                  <div className="text-lg font-bold text-gray-600">{activity.registrationStats.availableSlots}</div>
                                  <div className="text-xs text-gray-600">Disponibles</div>
                                </div>
                              </div>
                            </div>

                            {/* Información de capacidad y ingresos */}
                            <div className="border-t pt-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Capacidad</span>
                                <span className="text-sm text-gray-600">
                                  {activity.registrationStats.totalRegistrations} / {activity.capacity || activity.maxRegistrations || 'Sin límite'}
                                </span>
                              </div>
                              {!activity.isFree && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">Ingresos</span>
                                  <div className="text-right">
                                    <div className="text-sm font-bold text-green-600">
                                      ${activity.revenue.totalRevenue.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Potencial: ${activity.revenue.potentialRevenue.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Precio */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Precio</span>
                              <Badge variant={activity.isFree ? "secondary" : "outline"}>
                                {activity.isFree ? 'Gratuita' : `$${parseFloat(activity.price).toLocaleString()}`}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Vista de Lista/Tabla */}
                  {summaryViewMode === 'table' && (
                    <Card>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="text-left p-4 font-medium text-gray-900">Actividad</th>
                                <th className="text-left p-4 font-medium text-gray-900">Parque</th>
                                <th className="text-center p-4 font-medium text-gray-900">Total</th>
                                <th className="text-center p-4 font-medium text-gray-900">Aprobadas</th>
                                <th className="text-center p-4 font-medium text-gray-900">Pendientes</th>
                                <th className="text-center p-4 font-medium text-gray-900">Disponibles</th>
                                <th className="text-right p-4 font-medium text-gray-900">Ingresos</th>
                                <th className="text-center p-4 font-medium text-gray-900">Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedSummaryData.map((activity: ActivitySummary, index: number) => (
                                <tr key={activity.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="p-4">
                                    <div>
                                      <div className="font-medium text-gray-900 line-clamp-1">{activity.title}</div>
                                      <div className="text-sm text-gray-600">{activity.category}</div>
                                      <div className="text-xs text-gray-500">
                                        {format(new Date(activity.startDate), 'dd/MM/yyyy', { locale: es })} - {activity.startTime}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 text-sm text-gray-600">{activity.parkName}</td>
                                  <td className="p-4 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                      {activity.registrationStats.totalRegistrations}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                      {activity.registrationStats.approved}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                                      {activity.registrationStats.pending}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                                      {activity.registrationStats.availableSlots}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    {activity.isFree ? (
                                      <span className="text-gray-500">Gratuita</span>
                                    ) : (
                                      <div>
                                        <div className="font-medium text-green-600">
                                          ${activity.revenue.totalRevenue.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Pot: ${activity.revenue.potentialRevenue.toLocaleString()}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-4 text-center">
                                    <Badge variant={activity.registrationEnabled ? "default" : "secondary"}>
                                      {activity.registrationEnabled ? "Activa" : "Cerrada"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Paginación del resumen */}
                  {totalSummaryPages > 1 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Mostrando {startIndex + 1}-{Math.min(endIndex, totalSummaryActivities)} de {totalSummaryActivities} actividades
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSummaryCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={summaryCurrentPage === 1}
                              className="flex items-center gap-1"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Anterior
                            </Button>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalSummaryPages }, (_, i) => i + 1)
                                .filter(page => {
                                  if (totalSummaryPages <= 7) return true;
                                  if (page === 1 || page === totalSummaryPages) return true;
                                  if (Math.abs(page - summaryCurrentPage) <= 1) return true;
                                  return false;
                                })
                                .map((page, index, array) => (
                                  <React.Fragment key={page}>
                                    {index > 0 && array[index - 1] !== page - 1 && (
                                      <span className="px-2 text-gray-400">...</span>
                                    )}
                                    <Button
                                      variant={summaryCurrentPage === page ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setSummaryCurrentPage(page)}
                                      className="w-8 h-8 p-0"
                                    >
                                      {page}
                                    </Button>
                                  </React.Fragment>
                                ))
                              }
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSummaryCurrentPage(prev => Math.min(prev + 1, totalSummaryPages))}
                              disabled={summaryCurrentPage === totalSummaryPages}
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
                </>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Actividades</h3>
                      <p className="text-gray-600">No hay actividades disponibles para mostrar estadísticas.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default ActivityRegistrationsPage;