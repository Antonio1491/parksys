import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import ROUTES from '@/routes';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, Filter, RefreshCw, FileEdit, Eye, Edit, 
  Plus, AlertCircle, Download, Users, Book, BookOpen, 
  Calendar, Award, ArrowUpDown, ChevronDown, BookText,
  Briefcase, GraduationCap, UserCheck, Database, Trash2
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipo para los instructores
interface Instructor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialties?: string[] | string;
  experienceYears: number;
  status?: string;
  profileImageUrl?: string;
  createdAt: string;
  preferredParkName?: string;
  rating?: number;
  activitiesCount?: number;
}

// Helper para normalizar especialidades
function normalizeSpecialties(raw?: string[] | string): string[] {
  if (!raw) return [];

  const rawList = Array.isArray(raw) ? raw : [raw];

  return rawList
    .flatMap((entry) => entry.split(';'))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function InstructorsListPage() {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Estados para diálogos de confirmación
  const [deleteInstructorId, setDeleteInstructorId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Obtener datos de instructores
  const { data: instructors = [], isLoading, isError, refetch } = useQuery<Instructor[]>({
    queryKey: ['/api/instructors'],
    retry: 1,
    enabled: true,
  });

  // Mutación para eliminar un instructor individual
  const deleteInstructorMutation = useMutation({
    mutationFn: async (instructorId: number) => {
      return await apiRequest(`/api/instructors/${instructorId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: (data, instructorId) => {
      toast({
        title: "Instructor eliminado",
        description: "El instructor ha sido eliminado correctamente",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/instructors'] });
      setDeleteDialogOpen(false);
      setDeleteInstructorId(null);
    },
    onError: (error) => {
      console.error("Error al eliminar instructor:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el instructor. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setDeleteInstructorId(null);
    },
  });

  // Mutación para eliminar todos los instructores
  const deleteAllInstructorsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/instructors/batch/all', {
        method: 'DELETE'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Instructores inactivados",
        description: `${data.count} instructores han sido inactivados correctamente`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/instructors'] });
      setDeleteAllDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error al eliminar todos los instructores:", error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los instructores. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
      setDeleteAllDialogOpen(false);
    },
  });

  // Filtrar instructores según criterios de búsqueda
  const filteredInstructors = React.useMemo(() => {
    if (!Array.isArray(instructors)) return [];
    
    return instructors.filter((instructor: Instructor) => {
      // Filtro por término de búsqueda (nombre o email)
      const matchesSearch = searchTerm === '' || 
        `${instructor.firstName} ${instructor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por estado
      const matchesStatus = filterStatus === 'all' || instructor.status === filterStatus;
      
      // Filtro por especialidad
      const matchesSpecialty = filterSpecialty === 'all' || normalizeSpecialties(instructor.specialties)
      .some((s) => s.toLowerCase().includes(filterSpecialty.toLowerCase()));
      
      return matchesSearch && matchesStatus && matchesSpecialty;
    });
  }, [instructors, searchTerm, filterStatus, filterSpecialty]);

  // Calcular instructores paginados
  const paginatedInstructors = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInstructors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInstructors, currentPage, itemsPerPage]);

  // Total de páginas
  const totalPages = Math.ceil(filteredInstructors.length / itemsPerPage);

  // Cambiar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Manejar click en botón de eliminar todos
  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true);
  };

  // Manejar confirmación de eliminar todos
  const handleConfirmDeleteAll = () => {
    deleteAllInstructorsMutation.mutate();
  };

  // Manejar click en botón de eliminar instructor individual
  const handleDeleteClick = (instructorId: number) => {
    setDeleteInstructorId(instructorId);
    setDeleteDialogOpen(true);
  };

  // Manejar confirmación de eliminar instructor individual
  const handleConfirmDelete = () => {
    if (deleteInstructorId !== null) {
      deleteInstructorMutation.mutate(deleteInstructorId);
    }
  };

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterSpecialty]);

  // Lista de especialidades únicas para el filtro
  const specialties = React.useMemo(() => {
    if (!Array.isArray(instructors)) return [];

    const allSpecialties = new Set<string>();

    instructors.forEach((instructor) => {
      normalizeSpecialties(instructor.specialties).forEach((s) => {
        allSpecialties.add(s);
      });
    });

    return Array.from(allSpecialties);
  }, [instructors]);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha desconocida';
    
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Renderizar badge de estado
  const renderStatusBadge = (status?: string) => {
    if (!status) return <Badge>Sin estado</Badge>;
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Activo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Inactivo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pendiente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Renderizar columna de especialidades
  const renderSpecialties = (specialties?: string[] | string) => {
    const normalized = normalizeSpecialties(specialties);

    if (normalized.length === 0) {
      return <span className="text-gray-400 italic">No especificado</span>;
    }

    if (normalized.length <= 2) {
      return normalized.map((specialty, index) => (
        <Badge key={index} variant="outline" className="mr-1">{specialty}</Badge>
      ));
    }

    return (
      <>
        <Badge variant="outline" className="mr-1">{normalized[0]}</Badge>
        <Badge variant="outline" className="mr-1">+{normalized.length - 1} más</Badge>
      </>
    );
  };

  return (
    <AdminLayout>
      {/* Diálogo de confirmación para eliminar todos los instructores */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará a todos los instructores en el sistema y no se puede deshacer.
              Los instructores marcados como inactivos ya no aparecerán en las listas públicas ni podrán ser asignados a actividades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeleteAll}
              disabled={deleteAllInstructorsMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAllInstructorsMutation.isPending ? 'Procesando...' : 'Confirmar eliminación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para eliminar un instructor individual */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar instructor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al instructor seleccionado del sistema.
              Esta operación no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteInstructorId(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={deleteInstructorMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteInstructorMutation.isPending ? 'Eliminando...' : 'Eliminar instructor'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto p-6">
        {/* Header con título */}
        <Card className="p-4 bg-gray-50 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-8 h-8 text-gray-900" />
                <h1 className="text-3xl font-bold text-gray-900">Instructores</h1>
              </div>
              <p className="text-gray-600 mt-2">Gestiona la lista de instructores registrados en la plataforma</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setLocation(ROUTES.admin.activities.instructors.create)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Instructor
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Formato</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <FileEdit className="mr-2 h-4 w-4" />
                    Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileEdit className="mr-2 h-4 w-4" />
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileEdit className="mr-2 h-4 w-4" />
                    PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-2xl font-bold">
                  {instructors ? instructors.length : 0}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-2xl font-bold">
                  {instructors ? instructors.filter((i: Instructor) => i.status === 'active').length : 0}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Experiencia promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Briefcase className="h-5 w-5 text-amber-600 mr-2" />
                <span className="text-2xl font-bold">
                  {instructors && instructors.length > 0 
                    ? Math.round(instructors.reduce((sum: number, i: Instructor) => sum + (i.experienceYears || 0), 0) / instructors.length) 
                    : 0} años
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Especialidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <GraduationCap className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-2xl font-bold">
                  {specialties.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-full md:w-1/4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/4">
            <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por especialidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las especialidades</SelectItem>
                {specialties.map((specialty, index) => (
                  <SelectItem key={index} value={specialty}>{specialty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" className="w-full md:w-auto" onClick={() => {
            setSearchTerm('');
            setFilterStatus('all');
            setFilterSpecialty('all');
          }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Limpiar filtros
          </Button>
        </div>

        {/* Tabla de instructores */}

        <div className="bg-white rounded-md shadow">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Cargando instructores...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
              <p className="mt-2 text-red-500">Error al cargar los instructores</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : paginatedInstructors?.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {instructors ? "No se encontraron instructores que coincidan con los criterios de búsqueda." : "Haz clic en 'Cargar instructores' para ver los datos."}
              </div>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        Estado
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Especialidades</TableHead>
                    <TableHead>Experiencia</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInstructors?.map((instructor: Instructor) => (
                    <TableRow key={instructor.id}>
                      <TableCell className="font-medium">
                        {instructor.firstName} {instructor.lastName}
                      </TableCell>
                      <TableCell>
                        <div>{instructor.email}</div>
                        {instructor.phone && (
                          <div className="text-muted-foreground text-xs">{instructor.phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(instructor.status)}
                      </TableCell>
                      <TableCell>
                        {renderSpecialties(instructor.specialties)}
                      </TableCell>
                      <TableCell>
                        {instructor.experienceYears} {instructor.experienceYears === 1 ? 'año' : 'años'}
                      </TableCell>
                      <TableCell>{formatDate(instructor.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLocation(ROUTES.admin.activities.instructors.view.build(instructor.id))}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLocation(ROUTES.admin.activities.instructors.edit.build(instructor.id))}
                            title="Editar instructor"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(instructor.id)}
                            title="Eliminar instructor"
                            className="hover:bg-red-50 hover:text-red-600"
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

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}