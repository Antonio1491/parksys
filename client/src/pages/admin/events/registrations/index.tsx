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
  TrendingUp, Target, Trash2, X, CalendarDays
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventRegistration {
  id: number;
  eventId: number;
  fullName: string;
  email?: string;
  phone?: string;
  registrationDate: string;
  status: 'registered' | 'confirmed' | 'cancelled' | 'attended';
  notes?: string;
  attendeeCount: number;
  paymentStatus?: string;
  paymentAmount?: number;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: number;
    title: string;
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    capacity?: number;
    currentRegistrations: number;
    price?: number;
    isFree?: boolean;
    parks?: Array<{
      name: string;
    }>;
  };
}

interface EventSummary {
  id: number;
  title: string;
  description?: string;
  eventType: string;
  location?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  capacity?: number;
  price?: number;
  isFree?: boolean;
  registrationStats: {
    totalRegistrations: number;
    confirmed: number;
    registered: number;
    cancelled: number;
    attended: number;
    availableSlots: number;
  };
  revenue: {
    totalRevenue: number;
    potentialRevenue: number;
  };
  registrationType: string;
  parks?: Array<{
    name: string;
  }>;
}

const EventRegistrationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);
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
    queryKey: ['/api/event-registrations', currentPage, searchTerm, statusFilter, eventFilter, startDateFilter, endDateFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(eventFilter !== 'all' && { event: eventFilter }),
        ...(startDateFilter && { startDate: startDateFilter }),
        ...(endDateFilter && { endDate: endDateFilter })
      });
      
      console.log('🌐 [QUERY] GET /api/event-registrations?' + params.toString());
      const response = await fetch(`/api/event-registrations?${params}`);
      if (!response.ok) {
        throw new Error('Error al cargar inscripciones');
      }
      const data = await response.json();
      console.log('📊 Datos de inscripciones recibidos:', data);
      return data;
    }
  });

  // Obtener resumen de eventos
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/events-summary'],
    queryFn: async () => {
      const response = await fetch('/api/events-summary');
      if (!response.ok) {
        throw new Error('Error al cargar resumen de eventos');
      }
      return response.json();
    }
  });

  // Obtener lista de eventos para filtro
  const { data: eventsData } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Error al cargar eventos');
      }
      return response.json();
    }
  });

  // Mutación para actualizar estado de inscripción
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/event-registrations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/event-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events-summary'] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la inscripción ha sido actualizado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la inscripción.",
        variant: "destructive",
      });
    }
  });

  // Mutación para eliminar inscripción
  const deleteRegistrationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/event-registrations/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Error al eliminar inscripción');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/event-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events-summary'] });
      toast({
        title: "Inscripción eliminada",
        description: "La inscripción ha sido eliminada correctamente.",
      });
      setIsDeleteDialogOpen(false);
      setRegistrationToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la inscripción.",
        variant: "destructive",
      });
    }
  });

  // Funciones auxiliares
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'registered': { label: 'Registrado', color: 'bg-blue-100 text-blue-800' },
      'confirmed': { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
      'attended': { label: 'Asistió', color: 'bg-purple-100 text-purple-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={`${config.color} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusConfig = {
      'pending': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      'paid': { label: 'Pagado', color: 'bg-green-100 text-green-800' },
      'failed': { label: 'Fallido', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={`${config.color} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const openDetailModal = (registration: EventRegistration) => {
    setSelectedRegistration(registration);
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDeleteRegistration = (id: number) => {
    setRegistrationToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (registrationToDelete) {
      deleteRegistrationMutation.mutate(registrationToDelete);
    }
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    // Implementar eliminación masiva
    setIsBulkDeleteDialogOpen(false);
    setSelectedRegistrations([]);
  };

  const registrations = registrationsData?.registrations || [];
  const totalRegistrations = registrationsData?.total || 0;
  const totalPages = Math.ceil(totalRegistrations / itemsPerPage);
  
  // Debug logging
  console.log('🔍 Registrations data:', { registrations, totalRegistrations, totalPages, isLoading });

  const summary = summaryData?.events || [];
  const totalSummary = summaryData?.total || 0;
  const totalSummaryPages = Math.ceil(totalSummary / itemsPerPage);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inscripciones de Eventos</h1>
            <p className="text-gray-600 mt-2">Gestiona las inscripciones a eventos y revisa estadísticas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Inscripciones ({totalRegistrations})
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resumen de Eventos ({totalSummary})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registrations" className="space-y-4">
            {/* Filtros para inscripciones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="registered">Registrado</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                      <SelectItem value="attended">Asistió</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={eventFilter} onValueChange={setEventFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los eventos</SelectItem>
                      {Array.isArray(eventsData) && eventsData.map((event: any) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'cards' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de inscripciones */}
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {registrations.map((registration: EventRegistration) => (
                  <Card key={registration.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{registration.fullName}</CardTitle>
                          <CardDescription className="text-sm">
                            {registration.event?.title}
                          </CardDescription>
                        </div>
                        {getStatusBadge(registration.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          {registration.event?.startDate && format(new Date(registration.event.startDate), 'PPP', { locale: es })}
                        </div>
                        {registration.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {registration.email}
                          </div>
                        )}
                        {registration.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {registration.phone}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          {registration.attendeeCount} persona(s)
                        </div>
                        {registration.paymentStatus && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            {getPaymentStatusBadge(registration.paymentStatus)}
                            {registration.paymentAmount && (
                              <span className="text-sm text-gray-600">
                                ${registration.paymentAmount}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailModal(registration)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <div className="flex gap-1">
                            <Select
                              value={registration.status}
                              onValueChange={(value) => handleStatusChange(registration.id, value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="registered">Registrado</SelectItem>
                                <SelectItem value="confirmed">Confirmado</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                                <SelectItem value="attended">Asistió</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRegistration(registration.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left p-4">Participante</th>
                          <th className="text-left p-4">Evento</th>
                          <th className="text-left p-4">Fecha del evento</th>
                          <th className="text-left p-4">Estado</th>
                          <th className="text-left p-4">Pago</th>
                          <th className="text-left p-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map((registration: EventRegistration) => (
                          <tr key={registration.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              <div>
                                <div className="font-medium">{registration.fullName}</div>
                                <div className="text-sm text-gray-600">{registration.email}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm">{registration.event?.title}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm">
                                {registration.event?.startDate && format(new Date(registration.event.startDate), 'PPP', { locale: es })}
                              </div>
                            </td>
                            <td className="p-4">
                              {getStatusBadge(registration.status)}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {registration.paymentStatus && getPaymentStatusBadge(registration.paymentStatus)}
                                {registration.paymentAmount && (
                                  <span className="text-sm text-gray-600">
                                    ${registration.paymentAmount}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDetailModal(registration)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteRegistration(registration.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalRegistrations)} de {totalRegistrations} inscripciones
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            {/* Estadísticas generales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="flex items-center p-6">
                  <CalendarDays className="h-8 w-8 text-blue-600 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{totalSummary}</p>
                    <p className="text-sm text-gray-600">Eventos Totales</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex items-center p-6">
                  <Users className="h-8 w-8 text-green-600 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.reduce((acc: number, event: EventSummary) => acc + event.registrationStats.totalRegistrations, 0)}
                    </p>
                    <p className="text-sm text-gray-600">Inscripciones Totales</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex items-center p-6">
                  <DollarSign className="h-8 w-8 text-purple-600 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${summary.reduce((acc: number, event: EventSummary) => acc + (event.revenue?.totalRevenue || 0), 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Ingresos Totales</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex items-center p-6">
                  <Target className="h-8 w-8 text-orange-600 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.reduce((acc: number, event: EventSummary) => acc + (event.registrationStats?.availableSlots || 0), 0)}
                    </p>
                    <p className="text-sm text-gray-600">Espacios Disponibles</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumen de eventos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.map((event: EventSummary) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>
                      {event.eventType} • {event.parks?.[0]?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        {event.startDate && format(new Date(event.startDate), 'PPP', { locale: es })}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">Inscripciones</p>
                          <p className="text-gray-600">{event.registrationStats.totalRegistrations}/{event.capacity || '∞'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Confirmados</p>
                          <p className="text-green-600">{event.registrationStats.confirmed}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Ingresos</p>
                          <p className="text-purple-600">${event.revenue?.totalRevenue?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Disponibles</p>
                          <p className="text-blue-600">{event.registrationStats.availableSlots}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          {event.registrationStats.registered} Registrados
                        </Badge>
                        {event.registrationStats.cancelled > 0 && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            {event.registrationStats.cancelled} Cancelados
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de detalles */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles de Inscripción</DialogTitle>
              <DialogDescription>
                Información completa de la inscripción
              </DialogDescription>
            </DialogHeader>
            {selectedRegistration && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Participante</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Estado</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedRegistration.status)}
                    </div>
                  </div>
                  {selectedRegistration.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedRegistration.email}</p>
                    </div>
                  )}
                  {selectedRegistration.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Teléfono</label>
                      <p className="text-sm text-gray-900">{selectedRegistration.phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Asistentes</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.attendeeCount} persona(s)</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Fecha de registro</label>
                    <p className="text-sm text-gray-900">
                      {format(new Date(selectedRegistration.registrationDate), 'PPpp', { locale: es })}
                    </p>
                  </div>
                </div>

                {selectedRegistration.event && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Información del Evento</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Evento</label>
                        <p className="text-sm text-gray-900">{selectedRegistration.event.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Fecha</label>
                        <p className="text-sm text-gray-900">
                          {format(new Date(selectedRegistration.event.startDate), 'PPP', { locale: es })}
                        </p>
                      </div>
                      {selectedRegistration.event.startTime && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Hora</label>
                          <p className="text-sm text-gray-900">{selectedRegistration.event.startTime}</p>
                        </div>
                      )}
                      {selectedRegistration.event.location && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Ubicación</label>
                          <p className="text-sm text-gray-900">{selectedRegistration.event.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedRegistration.paymentStatus && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Información de Pago</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Estado del pago</label>
                        <div className="mt-1">
                          {getPaymentStatusBadge(selectedRegistration.paymentStatus)}
                        </div>
                      </div>
                      {selectedRegistration.paymentAmount && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Monto</label>
                          <p className="text-sm text-gray-900">${selectedRegistration.paymentAmount}</p>
                        </div>
                      )}
                      {selectedRegistration.stripePaymentIntentId && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-700">ID de Pago (Stripe)</label>
                          <p className="text-sm text-gray-900 font-mono">{selectedRegistration.stripePaymentIntentId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedRegistration.notes && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-700">Notas</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedRegistration.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmación de eliminación */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La inscripción será eliminada permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default EventRegistrationsPage;