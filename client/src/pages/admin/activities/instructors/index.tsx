import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Edit2, 
  Edit,
  Trash2, 
  Eye, 
  Star, 
  User, 
  Mail, 
  Phone,
  Award,
  Calendar,
  MapPin,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Download,
  FileEdit,
  ChevronDown,
  ArrowUpDown,
  Users,
  UserCheck,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Instructor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialties: string[];
  experience: string;
  experienceYears: number;
  bio?: string;
  profileImageUrl?: string;
  hourlyRate?: number;
  availability?: string;
  qualifications?: string;
  preferredParkId?: number;
  preferredParkName?: string;
  createdAt: string;
  userId?: number;
  rating?: number;
  activitiesCount?: number;
}

export default function InstructorsManagementPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState<Instructor | null>(null);
  
  // Estados para filtros
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Estados para eliminación masiva
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleteInstructorId, setDeleteInstructorId] = useState<number | null>(null);

  // Obtener lista de instructores
  const { data: instructors = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/instructors'],
    retry: 1,
    enabled: true,
  });

  // Mutación para eliminar instructor individual
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
      queryClient.invalidateQueries({ queryKey: ['/public-api/instructors/public'] });
      setShowDeleteDialog(false);
      setInstructorToDelete(null);
    },
    onError: (error) => {
      console.error("Error al eliminar instructor:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el instructor. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
      setShowDeleteDialog(false);
      setInstructorToDelete(null);
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

  // Obtener especialidades únicas para el filtro
  const uniqueSpecialties = Array.from(
    new Set(
      (instructors as Instructor[]).flatMap(instructor => 
        Array.isArray(instructor.specialties) ? instructor.specialties : []
      )
    )
  ).sort();

  // Aplicar todos los filtros
  const filteredInstructors = React.useMemo(() => {
    if (!Array.isArray(instructors)) return [];
    
    return instructors.filter((instructor: Instructor) => {
      // Filtro de búsqueda
      const matchesSearch = searchQuery === '' || 
        `${instructor.firstName} ${instructor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(instructor.specialties) ? instructor.specialties : []).some(specialty => 
          specialty.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Filtro por estado
      const matchesStatus = statusFilter === 'all' || !instructor.status || instructor.status === statusFilter;

      // Filtro por especialidad
      const matchesSpecialty = specialtyFilter === 'all' || specialtyFilter === '' || 
        (Array.isArray(instructor.specialties) ? instructor.specialties : []).includes(specialtyFilter);

      // Filtro por calificación
      const matchesRating = ratingFilter === 'all' || ratingFilter === '' || 
        (instructor.rating && instructor.rating >= parseFloat(ratingFilter));

      // Filtro por experiencia
      const matchesExperience = experienceFilter === 'all' || experienceFilter === '' || 
        (experienceFilter === '0-2' && instructor.experienceYears <= 2) ||
        (experienceFilter === '3-5' && instructor.experienceYears >= 3 && instructor.experienceYears <= 5) ||
        (experienceFilter === '6-10' && instructor.experienceYears >= 6 && instructor.experienceYears <= 10) ||
        (experienceFilter === '10+' && instructor.experienceYears > 10);

      return matchesSearch && matchesStatus && matchesSpecialty && matchesRating && matchesExperience;
    });
  }, [instructors, searchQuery, statusFilter, specialtyFilter, ratingFilter, experienceFilter]);

  // Calcular instructores paginados
  const paginatedInstructors = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInstructors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInstructors, currentPage, itemsPerPage]);

  // Total de páginas
  const totalPages = Math.ceil(filteredInstructors.length / itemsPerPage);

  // Reset página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, specialtyFilter, ratingFilter, experienceFilter]);

  const confirmDelete = () => {
    if (instructorToDelete) {
      deleteInstructorMutation.mutate(instructorToDelete.id);
    }
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
    const instructor = instructors.find(i => i.id === instructorId);
    setInstructorToDelete(instructor);
    setDeleteInstructorId(instructorId); // opcional si usas ambos
    setShowDeleteDialog(true);
  };
  
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
  
  // Cambiar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatSpecialties = (specialties: string[] | null | undefined) => {
    if (!specialties || !Array.isArray(specialties) || specialties.length === 0) {
      return <span className="text-gray-400 italic">No especificado</span>;
    }
    
    if (specialties.length <= 2) {
      return specialties.map((specialty, index) => (
        <Badge key={index} variant="outline" className="mr-1 mb-1">{specialty}</Badge>
      ));
    } else {
      return (
        <>
          <Badge variant="outline" className="mr-1 mb-1">{specialties[0]}</Badge>
          <Badge variant="outline" className="mr-1 mb-1">+{specialties.length - 1} más</Badge>
        </>
      );
    }
  };
  
  // Lista de especialidades únicas para el filtro
  const specialties = React.useMemo(() => {
    if (!Array.isArray(instructors) || instructors.length === 0) return [];
    
    const allSpecialties = new Set<string>();
    instructors.forEach((instructor: Instructor) => {
      if (instructor.specialties && Array.isArray(instructor.specialties)) {
        instructor.specialties.forEach((specialty: string) => {
          allSpecialties.add(specialty.trim());
        });
      } else if (instructor.specialties && typeof instructor.specialties === 'string') {
        // Fallback para datos legacy que puedan estar como string
        const specialtiesList = instructor.specialties.split(',');
        specialtiesList.forEach((specialty: string) => {
          allSpecialties.add(specialty.trim());
        });
      }
    });
    
    return Array.from(allSpecialties);
  }, [instructors]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <AdminLayout title="Gestión de Instructores">
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
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Instructores</p>
                  <p className="text-2xl font-bold text-[#00a587]">{instructors.length}</p>
                </div>
                <User className="h-8 w-8 text-[#00a587]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Especialidades</p>
                  <p className="text-2xl font-bold text-[#067f5f]">
                    {new Set(instructors.flatMap((i: Instructor) => i.specialties)).size}
                  </p>
                </div>
                <Award className="h-8 w-8 text-[#067f5f]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Promedio Experiencia</p>
                  <p className="text-2xl font-bold text-[#8498a5]">
                    {instructors.length > 0 
                      ? Math.round(instructors.reduce((acc: number, i: Instructor) => acc + i.experienceYears, 0) / instructors.length)
                      : 0} años
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-[#8498a5]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Calificación Promedio</p>
                  <p className="text-2xl font-bold text-[#bcd256]">
                    {instructors.length > 0 
                      ? (instructors.reduce((acc: number, i: Instructor) => acc + (i.rating || 0), 0) / instructors.length).toFixed(1)
                      : '0.0'}
                  </p>
                </div>
                <Star className="h-8 w-8 text-[#bcd256]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header con título y acciones */}
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
              <Button onClick={() => setLocation('/admin/activities/instructors/new')} className="bg-[#00a587] hover:bg-[#067f5f]">
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
              <Button variant="outline" onClick={handleDeleteAllClick}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Todos
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Barra de búsqueda */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar instructores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/5">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          
          <div className="w-full md:w-1/5">
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
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
          
          <div className="w-full md:w-1/5">
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Calificación mínima" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las calificaciones</SelectItem>
                <SelectItem value="4.5">4.5+ estrellas</SelectItem>
                <SelectItem value="4.0">4.0+ estrellas</SelectItem>
                <SelectItem value="3.5">3.5+ estrellas</SelectItem>
                <SelectItem value="3.0">3.0+ estrellas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/5">
            <Select value={experienceFilter} onValueChange={setExperienceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Experiencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda la experiencia</SelectItem>
                <SelectItem value="0-2">0-2 años</SelectItem>
                <SelectItem value="3-5">3-5 años</SelectItem>
                <SelectItem value="6-10">6-10 años</SelectItem>
                <SelectItem value="10+">Más de 10 años</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" className="w-full md:w-auto" onClick={() => {
            setSearchQuery('');
            setStatusFilter('all');
            setSpecialtyFilter('all');
            setRatingFilter('all');
            setExperienceFilter('all');
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
                    <TableHead>Calificación</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInstructors.map((instructor: Instructor) => (
                    <TableRow key={instructor.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={instructor.profileImageUrl} />
                            <AvatarFallback>
                              {instructor.firstName?.[0] || 'I'}{instructor.lastName?.[0] || 'N'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {instructor.firstName} {instructor.lastName}
                            <div className="text-sm text-gray-500">
                              {instructor.activitiesCount || 0} actividades
                            </div>
                          </div>
                        </div>
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
                        {formatSpecialties(instructor.specialties)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{instructor.experienceYears} {instructor.experienceYears === 1 ? 'año' : 'años'}</div>
                          {instructor.hourlyRate && (
                            <div className="text-sm text-gray-600">
                              ${instructor.hourlyRate}/hr
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {instructor.rating ? renderStars(instructor.rating) : (
                          <span className="text-gray-400 text-sm">Sin calificar</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(instructor.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLocation(`/admin/activities/instructors/detail/${instructor.id}`)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLocation(`/admin/activities/instructors/edit/${instructor.id}`)}
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
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredInstructors.length)} de {filteredInstructors.length} instructores
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Dialog de visualización de instructor */}
      {selectedInstructor && (
        <Dialog open={true} onOpenChange={() => setSelectedInstructor(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedInstructor.profileImageUrl} />
                  <AvatarFallback>
                    {selectedInstructor.firstName[0]}{selectedInstructor.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xl font-bold">
                    {selectedInstructor.firstName} {selectedInstructor.lastName}
                  </div>
                  <div className="text-sm text-gray-600">
                    Instructor - {selectedInstructor.experienceYears} años de experiencia
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Información de Contacto</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-gray-400" />
                      <span>{selectedInstructor.email}</span>
                    </div>
                    {selectedInstructor.phone && (
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />
                        <span>{selectedInstructor.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Especialidades</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedInstructor.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="bg-[#00a587]/10 text-[#00a587]">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedInstructor.preferredParkName && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Parque Preferido</h4>
                    <div className="flex items-center text-sm">
                      <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                      <span>{selectedInstructor.preferredParkName}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Información Profesional</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Experiencia:</span> {selectedInstructor.experienceYears} años
                    </div>
                    {selectedInstructor.hourlyRate && (
                      <div>
                        <span className="font-medium">Tarifa:</span> ${selectedInstructor.hourlyRate}/hora
                      </div>
                    )}
                    {selectedInstructor.availability && (
                      <div>
                        <span className="font-medium">Disponibilidad:</span> {selectedInstructor.availability}
                      </div>
                    )}
                    {selectedInstructor.rating && (
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Calificación:</span>
                        {renderStars(selectedInstructor.rating)}
                      </div>
                    )}
                  </div>
                </div>

                {selectedInstructor.activitiesCount !== undefined && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Estadísticas</h4>
                    <div className="text-sm">
                      <span className="font-medium">Actividades impartidas:</span> {selectedInstructor.activitiesCount}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedInstructor.bio && (
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Biografía</h4>
                <p className="text-sm text-gray-700">{selectedInstructor.bio}</p>
              </div>
            )}

            {selectedInstructor.experience && (
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Experiencia y Certificaciones</h4>
                <p className="text-sm text-gray-700">{selectedInstructor.experience}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar instructor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el instructor "{instructorToDelete?.firstName} {instructorToDelete?.lastName}" 
              y su usuario asociado del sistema. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteInstructorMutation.isPending}
            >
              {deleteInstructorMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}