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
  const [activeTab, setActiveTab] = useState('registrations');
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
    },
    enabled: activeTab === 'summary'
  });

  const registrations = registrationsData?.registrations || [];
  const totalPages = registrationsData?.pagination?.totalPages || 1;
  const activities = activitiesData || [];

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
        {/* Header con patrón Card estandarizado */}
        <Card className="p-4 bg-gray-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserCheck className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Inscripciones</h1>
            </div>
            <p className="text-gray-600 mt-2">Administra las inscripciones ciudadanas a actividades públicas</p>
          </CardContent>
        </Card>

        {/* Sistema de Pestañas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Inscripciones
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resumen de Actividades
            </TabsTrigger>
          </TabsList>

          {/* Pestaña de Inscripciones */}
          <TabsContent value="registrations" className="space-y-6">

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Inscripciones</p>
                  <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {registrations.filter((r: ActivityRegistration) => r.status === 'pending').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {registrations.filter((r: ActivityRegistration) => r.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {registrations.filter((r: ActivityRegistration) => r.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y controles */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre, email o actividad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="approved">Aprobadas</SelectItem>
                    <SelectItem value="rejected">Rechazadas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Actividad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las actividades</SelectItem>
                    {activities.map((activity: any) => (
                      <SelectItem key={activity.id} value={activity.id.toString()}>
                        {activity.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtros de fecha */}
              <div className="flex flex-col md:flex-row gap-4 w-full border-t pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filtrar por rango de fechas:</span>
                </div>
                
                <div className="flex gap-2 items-center">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Desde</label>
                    <Input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Hasta</label>
                    <Input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDateFilter('');
                    setEndDateFilter('');
                    setCurrentPage(1); // Reset page when clearing filters
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpiar Fechas
                </Button>
              </div>

              <div className="flex gap-2">
                {/* Toggle de vista */}
                <div className="flex border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'cards' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="flex items-center gap-1"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="flex items-center gap-1"
                  >
                    <List className="h-4 w-4" />
                    Lista
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={exportToCSV}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de inscripciones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <CardTitle>Inscripciones de Actividades</CardTitle>
                  <CardDescription>
                    Gestiona las solicitudes de inscripción de los ciudadanos ({registrations.length} total)
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Seleccionar todo */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) (el as any).indeterminate = isIndeterminate;
                    }}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Seleccionar todo
                  </label>
                </div>
                
                {/* Botón de eliminación en lote */}
                {selectedRegistrations.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar ({selectedRegistrations.length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {displayedRegistrations.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay inscripciones</h3>
                <p className="text-gray-600">No se encontraron inscripciones con los filtros aplicados.</p>
              </div>
            ) : (
              <>
                {/* Vista Grid */}
                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedRegistrations.map((registration: ActivityRegistration) => (
                      <Card key={registration.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <Checkbox
                                checked={selectedRegistrations.includes(registration.id)}
                                onCheckedChange={(checked) => handleSelectRegistration(registration.id, checked as boolean)}
                              />
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{registration.participantName}</h3>
                                <p className="text-sm text-gray-600">{registration.participantEmail}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewRegistrationDetail(registration)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRegistration(registration.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span className="font-medium truncate">{registration.activity?.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(new Date(registration.registrationDate), 'dd/MM/yyyy', { locale: es })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {getStatusBadge(registration.status)}
                            
                            {registration.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleStatusChange(registration.id, 'approved')}
                                  disabled={statusMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700 h-8 px-2"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    const reason = prompt('Motivo del rechazo (opcional):');
                                    handleStatusChange(registration.id, 'rejected', reason || undefined);
                                  }}
                                  disabled={statusMutation.isPending}
                                  className="h-8 px-2"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Vista Tabla */}
                {viewMode === 'table' && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-medium">Participante</th>
                          <th className="text-left p-3 font-medium">Actividad</th>
                          <th className="text-left p-3 font-medium">Email</th>
                          <th className="text-left p-3 font-medium">Estado</th>
                          <th className="text-left p-3 font-medium">Fecha</th>
                          <th className="text-center p-3 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedRegistrations.map((registration: ActivityRegistration) => (
                          <tr key={registration.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div>
                                <div className="font-semibold">{registration.participantName}</div>
                                {registration.participantPhone && (
                                  <div className="text-sm text-gray-600">{registration.participantPhone}</div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{registration.activity?.title}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">{registration.participantEmail}</div>
                            </td>
                            <td className="p-3">
                              {getStatusBadge(registration.status)}
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                {format(new Date(registration.registrationDate), 'dd/MM/yyyy', { locale: es })}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => viewRegistrationDetail(registration)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                {registration.status === 'pending' && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleStatusChange(registration.id, 'approved')}
                                      disabled={statusMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700 h-8 px-2"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      onClick={() => {
                                        const reason = prompt('Motivo del rechazo (opcional):');
                                        handleStatusChange(registration.id, 'rejected', reason || undefined);
                                      }}
                                      disabled={statusMutation.isPending}
                                      className="h-8 px-2"
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Paginación mejorada */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages} • Mostrando {displayedRegistrations.length} de {registrations.length} inscripciones
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else {
                        const start = Math.max(1, currentPage - 2);
                        pageNumber = start + i;
                      }
                      
                      if (pageNumber > totalPages) return null;
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className={currentPage === pageNumber ? "bg-[#00a587] hover:bg-[#067f5f]" : ""}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
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

        {/* Modal de detalles */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de la Inscripción</DialogTitle>
              <DialogDescription>
                Ver información completa del participante y la actividad
              </DialogDescription>
            </DialogHeader>
            
            {selectedRegistration && (
              <div className="space-y-6">
                {/* Información del participante */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Información del Participante</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nombre completo</label>
                      <p className="text-lg font-semibold">{selectedRegistration.participantName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-sm">{selectedRegistration.participantEmail}</p>
                    </div>
                    {selectedRegistration.participantPhone && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Teléfono</label>
                        <p className="text-sm">{selectedRegistration.participantPhone}</p>
                      </div>
                    )}
                    {selectedRegistration.age && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Edad</label>
                        <p className="text-sm">{selectedRegistration.age} años</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información de la actividad */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Información de la Actividad</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Actividad</label>
                      <p className="text-lg font-semibold">{selectedRegistration.activity?.title}</p>
                    </div>
                    {selectedRegistration.activity?.startDate && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Fecha de inicio</label>
                          <p className="text-sm">
                            {format(new Date(selectedRegistration.activity.startDate), 'dd/MM/yyyy', { locale: es })}
                            {selectedRegistration.activity.startTime && ` a las ${selectedRegistration.activity.startTime}`}
                          </p>
                        </div>
                        {selectedRegistration.activity.endDate && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Fecha de fin</label>
                            <p className="text-sm">
                              {format(new Date(selectedRegistration.activity.endDate), 'dd/MM/yyyy', { locale: es })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contacto de emergencia */}
                {(selectedRegistration.emergencyContactName || selectedRegistration.emergencyPhone) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Contacto de Emergencia</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRegistration.emergencyContactName && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Nombre</label>
                          <p className="text-sm">{selectedRegistration.emergencyContactName}</p>
                        </div>
                      )}
                      {selectedRegistration.emergencyPhone && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Teléfono</label>
                          <p className="text-sm">{selectedRegistration.emergencyPhone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Información médica */}
                {(selectedRegistration.medicalConditions || selectedRegistration.dietaryRestrictions) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Información Médica</h3>
                    {selectedRegistration.medicalConditions && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <label className="text-sm font-medium text-yellow-800">Condiciones médicas</label>
                        <p className="text-sm text-yellow-700 mt-1">{selectedRegistration.medicalConditions}</p>
                      </div>
                    )}
                    {selectedRegistration.dietaryRestrictions && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <label className="text-sm font-medium text-blue-800">Restricciones alimentarias</label>
                        <p className="text-sm text-blue-700 mt-1">{selectedRegistration.dietaryRestrictions}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Estado e información administrativa */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Estado de la Inscripción</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-600">Estado actual:</label>
                      {getStatusBadge(selectedRegistration.status)}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fecha de inscripción</label>
                      <p className="text-sm">
                        {format(new Date(selectedRegistration.registrationDate), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                    {selectedRegistration.rejectionReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <label className="text-sm font-medium text-red-800">Motivo de rechazo</label>
                        <p className="text-sm text-red-700 mt-1">{selectedRegistration.rejectionReason}</p>
                      </div>
                    )}
                    {selectedRegistration.notes && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <label className="text-sm font-medium text-gray-800">Notas adicionales</label>
                        <p className="text-sm text-gray-700 mt-1">{selectedRegistration.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Acciones del modal */}
                  {selectedRegistration.status === 'pending' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        onClick={() => {
                          handleStatusChange(selectedRegistration.id, 'approved');
                          setIsDetailModalOpen(false);
                        }}
                        disabled={statusMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprobar Inscripción
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          const reason = prompt('Motivo del rechazo (opcional):');
                          handleStatusChange(selectedRegistration.id, 'rejected', reason || undefined);
                          setIsDetailModalOpen(false);
                        }}
                        disabled={statusMutation.isPending}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar Inscripción
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
          </TabsContent>

          {/* Pestaña de Resumen de Actividades */}
          <TabsContent value="summary" className="space-y-6">
            {isLoadingSummary ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a587] mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando resumen de actividades...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Controles de vista para resumen */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Resumen de Actividades</h3>
                        <p className="text-gray-600">
                          Estadísticas detalladas de inscripciones por actividad ({totalSummaryActivities} total)
                        </p>
                      </div>
                      <div className="flex border rounded-lg p-1">
                        <Button
                          variant={summaryViewMode === 'cards' ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSummaryViewMode('cards')}
                          className="flex items-center gap-1"
                        >
                          <Grid3X3 className="h-4 w-4" />
                          Tarjetas
                        </Button>
                        <Button
                          variant={summaryViewMode === 'table' ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSummaryViewMode('table')}
                          className="flex items-center gap-1"
                        >
                          <List className="h-4 w-4" />
                          Lista
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contenido del resumen */}
                {activitiesSummaryData && activitiesSummaryData.length > 0 ? (
                  <>
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
          </TabsContent>
        </Tabs>

        {/* Modal de confirmación para eliminación individual */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar inscripción?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente la inscripción seleccionada. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de confirmación para eliminación en lote */}
        <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar {selectedRegistrations.length} inscripciones?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente las {selectedRegistrations.length} inscripciones seleccionadas. 
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {bulkDeleteMutation.isPending ? 'Eliminando...' : `Eliminar ${selectedRegistrations.length} inscripciones`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AdminLayout>
  );
};

export default ActivityRegistrationsPage;