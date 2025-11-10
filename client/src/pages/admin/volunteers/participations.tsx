import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar,
  Search, 
  Filter, 
  RefreshCw,
  Download,
  ArrowUpDown,
  Clock,
  Plus,
  Edit, 
  FileX, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2
} from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import PageHeader from '@/components/ui/page-header';
import { Link } from 'wouter';
import ROUTES from '@/routes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';

// Tipo actualizado para las participaciones
interface Participation {
  id: number;
  volunteerId: number;
  volunteerActivityId: number;
  volunteerName: string;
  volunteerEmail: string;
  volunteerProfileImage?: string;
  activityName: string;
  activityDate: string;
  activityCategory: string;
  parkId: number;
  parkName: string;
  registrationDate: string;
  attendanceStatus: string;
  hoursContributed: number | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  volunteerNotes: string | null;
  supervisorNotes: string | null;
  rating: number | null;
}

const ParticipationsList: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [parkFilter, setParkFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [participationToDelete, setParticipationToDelete] = useState<Participation | null>(null);
  const pageSize = 10;

  // Fetch all participations
  const { data: participations = [], isLoading, isError, refetch } = useQuery<Participation[]>({
    queryKey: ['/api/participations/all'],
  });

  // Fetch parks for filter
  const { data: parks = [] } = useQuery({
    queryKey: ['/api/parks'],
  });

  // Delete participation mutation
  const deleteMutation = useMutation({
    mutationFn: async (participationId: number) => {
      return await apiRequest(`/api/volunteer-participations/${participationId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: '✅ Participación eliminada',
        description: 'La participación se ha eliminado correctamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/participations/all'] });
      setDeleteDialogOpen(false);
      setParticipationToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: '❌ Error',
        description: error.message || 'No se pudo eliminar la participación',
        variant: 'destructive',
      });
    },
  });

  // Handle delete click
  const handleDeleteClick = (participation: Participation) => {
    setParticipationToDelete(participation);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (participationToDelete) {
      deleteMutation.mutate(participationToDelete.id);
    }
  };

  // Filter participations
  const filteredParticipations = participations.filter((participation: Participation) => {
    const matchesSearch = 
      searchTerm === '' || 
      participation.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participation.volunteerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPark = 
      parkFilter === 'all' || 
      participation.parkId.toString() === parkFilter;

    const matchesStatus = 
      statusFilter === 'all' || 
      participation.attendanceStatus === statusFilter;

    return matchesSearch && matchesPark && matchesStatus;
  });

  // Paginate participations
  const paginatedParticipations = filteredParticipations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredParticipations.length / pageSize);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Export participations data as CSV
  const exportCSV = () => {
    const headers = ['ID', 'Voluntario', 'Actividad', 'Fecha', 'Parque', 'Estado', 'Horas', 'Check-in', 'Check-out'];
    const csvRows = [
      headers.join(','),
      ...filteredParticipations.map((participation: Participation) => [
        participation.id,
        `"${participation.volunteerName}"`,
        `"${participation.activityName}"`,
        participation.activityDate,
        `"${participation.parkName}"`,
        participation.attendanceStatus,
        participation.hoursContributed || 0,
        participation.checkInTime || 'N/A',
        participation.checkOutTime || 'N/A'
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `participaciones_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      registered: { label: 'Registrado', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      confirmed: { label: 'Confirmado', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      attended: { label: 'Asistió', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      absent: { label: 'Ausente', color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.registered;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto">
        <PageHeader 
          title="Participaciones de Voluntarios"
          subtitle="Gestione las participaciones de voluntarios en actividades de voluntariado."
          icon={<Clock />}
          actions={[
            <Link href={ROUTES.admin.volunteers.participations.create} key="new">
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Nueva
              </Button>
            </Link>,
            <Button 
              key="export"
              variant="secondary" 
              onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>,
            <Button 
              key="refresh"
              variant="tertiary" 
              onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          ]}
        />

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Buscar por actividad o voluntario..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={parkFilter} onValueChange={setParkFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por parque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los parques</SelectItem>
                      {Array.isArray(parks) && parks.map((park: any) => (
                        <SelectItem key={park.id} value={park.id.toString()}>
                          {park.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="registered">Registrado</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="attended">Asistió</SelectItem>
                    <SelectItem value="absent">Ausente</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
          {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">Cargando participaciones...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-8">
                <FileX className="h-8 w-8 mx-auto text-red-500" />
                <p className="mt-2 text-red-500">Error al cargar las participaciones</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                  Reintentar
                </Button>
              </div>
            ) : paginatedParticipations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No se encontraron participaciones que coincidan con los criterios de búsqueda.</div>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Voluntario</TableHead>
                      <TableHead>Actividad</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Fecha
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Parque</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedParticipations.map((participation: Participation) => (
                      <TableRow key={participation.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {participation.volunteerProfileImage ? (
                              <img
                                src={participation.volunteerProfileImage}
                                alt={participation.volunteerName}
                                className="h-10 w-10 rounded-full object-cover border-2 border-blue-300"
                                onError={(e) => {
                                  // Fallback a inicial si la imagen falla
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div 
                              className={`h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold ${participation.volunteerProfileImage ? 'hidden' : ''}`}
                            >
                              {participation.volunteerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm text-gray-800">
                                {participation.volunteerName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {participation.volunteerEmail}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{participation.activityName}</span>
                            {participation.activityCategory && (
                              <span className="text-xs text-gray-500">{participation.activityCategory}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{formatDate(participation.activityDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {participation.parkName}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(participation.attendanceStatus)}
                        </TableCell>
                        <TableCell>
                          {participation.hoursContributed ? (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {participation.hoursContributed} hrs
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">Pendiente</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Link href={ROUTES.admin.volunteers.participations.edit.build(participation.id)}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-9 w-9"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-9 w-9 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClick(participation)}
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

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Confirmación de Eliminación */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar participación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la participación de{" "}
                <strong>{participationToDelete?.volunteerName}</strong> en la actividad{" "}
                <strong>{participationToDelete?.activityName}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default ParticipationsList;