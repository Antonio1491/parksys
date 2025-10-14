import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import ROUTES from '@/routes'
import AdminLayout from '@/components/AdminLayout';
import { ReturnHeader } from '@/components/ui/return-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Search, 
  Download,
  Plus,
  Copy,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  Target,
  DollarSign,
  Percent,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

interface ActivityRegistration {
  id: number;
  activityId: number;
  participantName: string;
  participantEmail: string;
  participantPhone?: string;
  status: 'pending' | 'approved' | 'rejected';
  registrationDate: string;
}

interface Activity {
  id: number;
  title: string;
  description?: string;
  categoryName?: string;
  parkName?: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  capacity?: number;
  price?: string;
  isFree?: boolean;
  currentRegistrations?: number;
  maxRegistrations?: number;
  imageUrl?: string;
}

const ActivityRegistrationDetail = () => {
  const [, params] = useRoute('/admin/activities/registrations/:id');
  const [, setLocation] = useLocation();
  const activityId = params?.id ? parseInt(params.id) : null;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<number | null>(null);

  // Obtener datos de la actividad
  const { data: activity, isLoading: isLoadingActivity } = useQuery<Activity>({
    queryKey: [`/api/activities/${activityId}`],
    queryFn: async () => {
      const response = await fetch(`/api/activities/${activityId}`);
      if (!response.ok) throw new Error('Error al cargar actividad');
      return response.json();
    },
    enabled: !!activityId
  });

  // Obtener inscripciones de la actividad
  const { data: registrationsData, isLoading: isLoadingRegistrations } = useQuery({
    queryKey: [`/api/activity-registrations/activity/${activityId}`],
    queryFn: async () => {
      const response = await fetch(`/api/activity-registrations/activity/${activityId}`);
      if (!response.ok) throw new Error('Error al cargar inscripciones');
      return response.json();
    },
    enabled: !!activityId
  });

  const registrations = registrationsData?.registrations || [];

  React.useEffect(() => {
    if (activity) {
      console.log('🎯 Activity completa:', activity);
      console.log('📸 ImageURL específico:', activity.imageUrl);
      console.log('🔑 Todas las keys del objeto:', Object.keys(activity));
    }
  }, [activity]);
  
  // Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/activity-registrations/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Error al eliminar inscripción');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Inscripción eliminada',
        description: 'La inscripción ha sido eliminada correctamente.'
      });
      queryClient.invalidateQueries({ queryKey: [`/api/activity-registrations/activity/${activityId}`] });
      setIsDeleteDialogOpen(false);
      setRegistrationToDelete(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la inscripción.',
        variant: 'destructive'
      });
    }
  });

  // Mutación para cambiar estado
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'approved' | 'rejected' }) => {
      const response = await fetch(`/api/activity-registrations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Error al actualizar estado');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Estado actualizado",
        description: "El estado de la inscripción ha sido actualizado."
      });
      queryClient.invalidateQueries({ queryKey: [`/api/activity-registrations/activity/${activityId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Hubo un problema al actualizar el estado.",
        variant: "destructive"
      });
    }
  });
  
  // Filtrar inscripciones
  const filteredRegistrations = registrations.filter((reg: ActivityRegistration) => {
    const matchesSearch = searchTerm === '' || 
      reg.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.participantEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: number, status: 'approved' | 'rejected') => {
    statusMutation.mutate({ id, status });
  };

  const handleDelete = (id: number) => {
    setRegistrationToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    if (registrationToDelete) {
      deleteMutation.mutate(registrationToDelete);
    }
  };
  
  // Calcular estadísticas
  const stats = React.useMemo(() => {

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'approved':
          return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprobada</Badge>;
        case 'rejected':
          return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
        case 'pending':
        default:
          return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Pendiente</Badge>;
      }
    };
    const capacity = activity?.capacity || activity?.maxRegistrations || 0;
    const totalRegistrations = registrations.length;
    const availableSlots = Math.max(0, capacity - totalRegistrations);
    const price = parseFloat(activity?.price || '0');
    const isFree = activity?.isFree || price === 0;

    // Calcular ingresos
    const totalRevenue = isFree ? 0 : capacity * price;
    const currentRevenue = isFree ? 0 : totalRegistrations * price;
    const revenuePercentage = totalRevenue > 0 ? (currentRevenue / totalRevenue) * 100 : 0;

    return {
      capacity,
      totalRegistrations,
      availableSlots,
      registrationPercentage: capacity > 0 ? (totalRegistrations / capacity) * 100 : 0,
      totalRevenue,
      currentRevenue,
      revenuePercentage,
      price,
      isFree
    };
  }, [registrations, activity]);

  const exportToCSV = () => {
    const csvContent = [
      ['Participante', 'Email', 'Teléfono', 'Estado', 'Fecha de Inscripción'],
      ...registrations.map((reg: ActivityRegistration) => [
        reg.participantName,
        reg.participantEmail,
        reg.participantPhone || '',
        reg.status,
        format(new Date(reg.registrationDate), 'dd/MM/yyyy', { locale: es })
      ])
    ].map(row => row.map((field: any) => `"${field}"`).join(',')).join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inscripciones_${activity?.title}_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  if (isLoadingActivity || isLoadingRegistrations) {
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

  if (!activity) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Actividad no encontrada</p>
          <Button onClick={() => setLocation('/admin/activities/registrations')}>
            Volver a inscripciones
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-0">
        {/* Header con botón volver */}

        <div className="bg-header-background text-white justify-between px-2 py-1 -mx-4 -mt-4">
          <Button
            onClick={() => setLocation('/admin/activities/registrations')}
            className="text-white bg-header-background hover:bg-header-background hover:text-[] flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Gestión de Inscripciones
          </Button>
        </div>

        {/* Hero Section con imagen y título */}
        <div className="bg-white p-8 -mx-4">
          <div className="flex items-start gap-6">
            {/* Imagen placeholder */}
            <div className="w-80 aspect-[21/9] rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
              {activity.imageUrl ? (
                <img 
                  src={activity.imageUrl} 
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Información de la actividad */}
            <div className="flex-1 space-y-4 mt-6">
              <h1 className="text-3xl font-bold text-[#00444f]">{activity.title}</h1>

              <div className="flex flex-wrap gap-6 text-gray-700">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#00a587]" />
                  <span>{activity.parkName || 'Sin parque'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#00a587]" />
                  <span>{format(new Date(activity.startDate), 'dd/MM/yyyy', { locale: es })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#00a587]" />
                  <span>{activity.startTime}</span>
                </div>
              </div>

              {/* Botón exportar */}
              <div className="pt-4">
                <Button 
                  onClick={exportToCSV} 
                  className="bg-[#00444f] hover:bg-[#00a587] text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Capacidad Total */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-1">Capacidad total</p>
                  <p className="text-4xl font-bold text-gray-900">{stats.capacity}</p>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">Registros</p>
                    <div className="w-full bg-gray-300 rounded-full h-2 mt-1">
                      <div 
                        className="bg-[#00444f] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stats.registrationPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#00444f] p-3 rounded-full">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registros disponibles */}
          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-1">Registros disponibles</p>
                  <p className="text-4xl font-bold text-gray-900">{stats.availableSlots}</p>
                </div>
                <div className="bg-[#00a587] p-3 rounded-full">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingreso Total */}
          {!stats.isFree && (
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-1">Ingreso total</p>
                    <p className="text-4xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()}</p>
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        {stats.revenuePercentage.toFixed(0)}%
                      </p>
                      <div className="w-full bg-gray-300 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.revenuePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-600 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inscripción / Ingreso Actual */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-1">{stats.isFree ? 'Inscripción' : 'Ingreso actual'}</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {stats.isFree ? stats.totalRegistrations : stats.currentRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-600 p-3 rounded-full">
                  {stats.isFree ? (
                    <TrendingUp className="h-6 w-6 text-white" />
                  ) : (
                    <DollarSign className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de búsqueda y acciones */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="approved">Aprobadas</SelectItem>
                  <SelectItem value="rejected">Rechazadas</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" className="h-10 w-10 p-0">
                  <Plus className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="sm" className="h-10 w-10 p-0">
                  <Copy className="h-5 w-5" />
                </Button>
                <Button variant="destructive" size="sm" className="h-10 w-10 p-0">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Tabla de inscripciones */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Fecha de Inscripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No hay inscripciones que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((registration: ActivityRegistration) => (
                    <TableRow key={registration.id}>
                      <TableCell>
                        <div className="font-medium">{registration.participantName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {registration.participantEmail}
                          </div>
                          {registration.participantPhone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {registration.participantPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(registration.registrationDate), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>{getStatusBadge(registration.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {registration.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => handleStatusChange(registration.id, 'approved')}
                              >
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleStatusChange(registration.id, 'rejected')}
                              >
                                Rechazar
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(registration.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog de confirmación de eliminación */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar inscripción?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente la inscripción. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
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

export default ActivityRegistrationDetail;