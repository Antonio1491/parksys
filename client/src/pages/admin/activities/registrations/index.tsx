import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import ROUTES from '@/routes';
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
  TrendingUp, Target, Trash2, X, CopyCheck, CheckSquare, Square
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';

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
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [parkFilter, setParkFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedRegistration, setSelectedRegistration] = useState<ActivityRegistration | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [summaryViewMode, setSummaryViewMode] = useState<'cards' | 'table'>('cards');
  const [summaryCurrentPage, setSummaryCurrentPage] = useState(1);
  const [selectedRegistrations, setSelectedRegistrations] = useState<number[]>([]);
  // Estados para selección múltiple
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Set<number>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
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

  // Obtener parques para filtro
  const { data: parksData = [] } = useQuery({
    queryKey: ['/api/parks/filter'],
    queryFn: async () => {
      const response = await fetch('/api/parks/filter');
      if (!response.ok) throw new Error('Error al cargar parques');
      return response.json();
    }
  });

  // Obtener categorías para filtro
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['/api/activity-categories'],
    queryFn: async () => {
      const response = await fetch('/api/activity-categories');
      if (!response.ok) throw new Error('Error al cargar categorías');
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
  
  // Filtrar actividades por búsqueda, parque y categoría
  const filteredSummaryData = activitiesSummaryData?.filter((activity: ActivitySummary) => {
    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        activity.title.toLowerCase().includes(searchLower) ||
        activity.category.toLowerCase().includes(searchLower) ||
        activity.parkName.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Filtro de parque
    if (parkFilter && parkFilter !== 'all') {
      if (activity.parkName !== parkFilter) return false;
    }

    // Filtro de categoría
    if (categoryFilter && categoryFilter !== 'all') {
      if (activity.category !== categoryFilter) return false;
    }

    return true;
  }) || [];

  const totalSummaryActivities = filteredSummaryData.length;
  const totalSummaryPages = Math.ceil(totalSummaryActivities / ITEMS_PER_PAGE);
  const startIndex = (summaryCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSummaryData = filteredSummaryData.slice(startIndex, endIndex);

  // Calcular métricas globales
  const metrics = React.useMemo(() => {
    if (!activitiesSummaryData || activitiesSummaryData.length === 0) {
      return {
        totalActivities: 0,
        freeActivities: 0,
        totalRegistrations: 0,
        totalRevenue: 0
      };
    }

    return {
      totalActivities: activitiesSummaryData.length,
      freeActivities: activitiesSummaryData.filter((a: ActivitySummary) => a.isFree).length,
      totalRegistrations: activitiesSummaryData.reduce((sum: number, a: ActivitySummary) => 
        sum + (a.registrationStats?.totalRegistrations || 0), 0
      ),
      totalRevenue: activitiesSummaryData.reduce((sum: number, a: ActivitySummary) => {
        if (a.isFree) return sum;
        const registrations = a.registrationStats?.totalRegistrations || 0;
        const price = parseFloat(a.price || '0');
        return sum + (registrations * price);
      }, 0)
    };
  }, [activitiesSummaryData]);
  
  // Resetear página cuando cambian los filtros
  React.useEffect(() => {
    setSummaryCurrentPage(1);
  }, [searchTerm, parkFilter, categoryFilter]);

  // Función para navegar al detalle de inscripciones
  const handleActivityClick = (activityId: number) => {
    if (selectionMode) return; // No navegar si está en modo selección
    setLocation(ROUTES.admin.activities.registrationDetail.build(activityId));
  };
  
  // Funciones para manejo de selección múltiple de actividades
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
    const allActivityIds = new Set(paginatedSummaryData.map((activity: ActivitySummary) => activity.id));
    setSelectedActivities(allActivityIds);
  };

  const handleDeselectAllActivities = () => {
    setSelectedActivities(new Set());
    setSelectionMode(false);
  };

  const handleBulkDeleteActivities = () => {
    if (selectedActivities.size === 0) return;
    setShowBulkDeleteDialog(true);
  };
  
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
            {/* Cards de métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total de actividades */}
              <Card className="bg-[#ceefea] text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#00444f] text-sm font-medium mb-1">Total de actividades</p>
                      <p className="text-3xl text-[#00444f] font-bold">{metrics.totalActivities}</p>
                    </div>
                    <div className="bg-[#00444f] p-3 rounded-full">
                      <Calendar className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actividades gratuitas */}
              <Card className="bg-[#ceefea] text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#00444f] text-sm font-medium mb-1">Actividades gratuitas</p>
                      <p className="text-3xl text-[#00444f] font-bold">{metrics.freeActivities}</p>
                    </div>
                    <div className="bg-[#00444f] p-3 rounded-full">
                      <Target className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inscripciones registradas */}
              <Card className="bg-[#ceefea] text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#00444f] text-sm font-medium mb-1">Inscripciones registradas</p>
                      <p className="text-3xl text-[#00444f] font-bold">{metrics.totalRegistrations}</p>
                    </div>
                    <div className="bg-[#00444f] p-3 rounded-full">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ingreso actual */}
              <Card className="bg-[#ceefea] text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#00444f] text-sm font-medium mb-1">Ingreso actual</p>
                      <p className="text-3xl text-[#00444f] font-bold">${metrics.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#00444f] p-3 rounded-full">
                      <DollarSign className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                          <div className="flex items-center gap-3 flex-wrap">
                            {/* Campo de búsqueda */}
                            <div className="relative flex-1 min-w-[250px] max-w-md">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                placeholder="Buscar actividad"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                              />
                            </div>

                            {/* Filtro de Parque */}
                            <div className="min-w-[180px]">
                              <Select value={parkFilter} onValueChange={setParkFilter}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Filtrar por parque" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Todos los parques</SelectItem>
                                  {Array.isArray(parksData) && parksData.map((park: any) => (
                                    <SelectItem key={park.id} value={park.name}>
                                      {park.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Filtro de Categoría */}
                            <div className="min-w-[180px]">
                              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Filtrar por categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Todas las categorías</SelectItem>
                                  {Array.isArray(categoriesData) && categoriesData.map((category: any) => (
                                    <SelectItem key={category.id} value={category.name}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                      {/* Botones de acción - ahora con ml-auto para empujar a la derecha */}
                      <div className="flex items-center gap-2 ml-auto">
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

                      {/* Botón de selección con menú desplegable */}
                      <div className="relative group">
                        <Button
                          variant={selectionMode ? 'default' : 'outline'}
                          size="sm"
                          className={`flex items-center h-11 w-11 ${selectionMode ? 'bg-gray-100' : 'bg-gray-100 hover:bg-[#00a587]'}`}
                        >
                          <CopyCheck className={`h-5 w-5 ${selectionMode ? 'text-[#00a587]' : 'text-[#4b5b65]'}`} />
                        </Button>

                        {/* Dropdown menu con CSS hover */}
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <div className="py-1">
                            <button
                              onClick={() => setSelectionMode(true)}
                              className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                            >
                              <CopyCheck className="h-4 w-4 mr-2" />
                              Selección múltiple
                            </button>
                            <button
                              onClick={() => {
                                if (!selectionMode) {
                                  setSelectionMode(true);
                                }
                                handleSelectAllActivities();
                              }}
                              className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                            >
                              <CheckSquare className="h-5 w-5 mr-2" />
                              Seleccionar todo
                            </button>
                            <button
                              onClick={handleDeselectAllActivities}
                              className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                            >
                              <Square className="h-4 w-4 mr-2" />
                              Deseleccionar
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Botón para eliminar elementos independiente */}
                      <Button

                        size="sm"
                        onClick={handleBulkDeleteActivities}
                        className="flex items-center h-11 w-11 bg-gray-100 border border-gray-200 hover:bg-red-100 text-red"
                        disabled={selectedActivities.size === 0}
                      >
                        <Trash2 className="h-5 w-5 text-red-400" />
                        {selectedActivities.size > 0 && (
                          <span className="ml-1 text-xs">({selectedActivities.size})</span>
                        )}
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
                                <Card 
                                  key={activity.id} 
                                  className={`hover:shadow-lg transition-all relative ${
                                    !selectionMode ? 'cursor-pointer hover:scale-[1.02]' : ''
                                  }`}
                                  onClick={() => handleActivityClick(activity.id)}
                                >
                          {/* Checkbox de selección en la esquina superior derecha */}
                                  {selectionMode && (
                                    <div 
                                      className="absolute top-3 right-3 z-10"
                                      onClick={(e) => e.stopPropagation()} // ← AGREGAR ESTO
                                    >
                                      <Checkbox
                                        checked={selectedActivities.has(activity.id)}
                                        onCheckedChange={(checked) => handleSelectActivity(activity.id, checked as boolean)}
                                        className="bg-white/80 data-[state=checked]:bg-[#00a587]"
                                      />
                                    </div>
                                  )}

                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg line-clamp-2">{activity.title}</CardTitle>
                                <p className="text-sm text-gray-600 mt-1">{activity.category}</p>
                              </div>
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
                              <h4 className="font-medium text-sm mb-3">Inscripciones</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="text-center p-3 bg-blue-50 rounded">
                                  <div className="text-2xl font-bold text-blue-600">{activity.registrationStats.totalRegistrations}</div>
                                  <div className="text-xs text-gray-600 mt-1">Inscritos</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded">
                                  <div className="text-2xl font-bold text-gray-600">{activity.registrationStats.availableSlots}</div>
                                  <div className="text-xs text-gray-600 mt-1">Disponibles</div>
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
                                {selectionMode && (
                                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={selectedActivities.has(activity.id)}
                                      onCheckedChange={(checked) => handleSelectActivity(activity.id, checked as boolean)}
                                    />
                                  </td>
                                )}
                                <th className="text-left p-4 font-medium text-gray-900">Actividad</th>
                                <th className="text-left p-4 font-medium text-gray-900">Parque</th>
                                <th className="text-center p-4 font-medium text-gray-900">Capacidad</th>
                                <th className="text-center p-4 font-medium text-gray-900">Inscritos</th>
                                <th className="text-center p-4 font-medium text-gray-900">Disponibles</th>
                                <th className="text-right p-4 font-medium text-gray-900">Ingreso Actual</th>
                                <th className="text-right p-4 font-medium text-gray-900">Ingreso Proyectado</th>
                              </tr>
                            </thead>
                                  <tbody>
                                    {paginatedSummaryData.map((activity: ActivitySummary, index: number) => (
                                      <tr 
                                        key={activity.id} 
                                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                                          !selectionMode ? 'cursor-pointer hover:bg-blue-50' : ''
                                        } transition-colors`}
                                        onClick={() => handleActivityClick(activity.id)}
                                      >
                                  {selectionMode && (
                                    <td className="p-4">
                                      <Checkbox
                                        checked={selectedActivities.has(activity.id)}
                                        onCheckedChange={(checked) => handleSelectActivity(activity.id, checked as boolean)}
                                      />
                                    </td>
                                  )}
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
                                    <span className="text-sm font-bold text-gray-900">
                                      {activity.capacity || activity.maxRegistrations || '-'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                      {activity.registrationStats.totalRegistrations}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-800 rounded-full text-sm font-bold">
                                      {activity.registrationStats.availableSlots}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    {activity.isFree ? (
                                      <span className="text-gray-500">-</span>
                                    ) : (
                                      <span className="text-sm font-bold text-green-600">
                                        ${(activity.registrationStats.totalRegistrations * parseFloat(activity.price)).toLocaleString()}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-right">
                                    {activity.isFree ? (
                                      <span className="text-gray-500">-</span>
                                    ) : (
                                      <span className="text-sm font-bold text-blue-600">
                                        ${((activity.capacity || activity.maxRegistrations || 0) * parseFloat(activity.price)).toLocaleString()}
                                      </span>
                                    )}
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

        {/* Diálogo de confirmación de eliminación masiva */}
        <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar actividades seleccionadas?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente {selectedActivities.size} actividad{selectedActivities.size !== 1 ? 'es' : ''} seleccionada{selectedActivities.size !== 1 ? 's' : ''}. 
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toast({
                    title: "Función en desarrollo",
                    description: `Se eliminarían ${selectedActivities.size} actividades.`
                  });
                  setShowBulkDeleteDialog(false);
                  setSelectedActivities(new Set());
                  setSelectionMode(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AdminLayout>
  );
};

export default ActivityRegistrationsPage;