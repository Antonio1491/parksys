import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  UserCheck, 
  Star, 
  Calendar, 
  Users, 
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Download,
  Grid3X3,
  List,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  FileX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface InstructorEvaluation {
  id: number;
  instructorId: number;
  instructorName: string;
  evaluatorName: string;
  evaluatorEmail: string;
  overallRating: number;
  knowledgeRating: number;
  patienceRating: number;
  clarityRating: number;
  punctualityRating: number;
  wouldRecommend: boolean;
  comments: string;
  attendedActivity: string;
  status: 'pending' | 'approved' | 'rejected';
  moderationNotes: string;
  moderatedBy: number;
  moderatedAt: string;
  evaluationDate: string;
  createdAt: string;
}

const RECORDS_PER_PAGE = 9;

const EvaluacionesInstructores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvaluation, setSelectedEvaluation] = useState<InstructorEvaluation | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener evaluaciones de instructores
  const { data: evaluations = [], isLoading, error } = useQuery<InstructorEvaluation[]>({
    queryKey: ['/api/evaluations/instructors'],
    retry: 3,
  });

  // Mutación para actualizar evaluación (moderación)
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; moderationNotes?: string }) => {
      console.log('Datos enviados a la API:', data);
      const response = await fetch(`/api/evaluations/instructors/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: data.status,
          moderationNotes: data.moderationNotes
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "La evaluación ha sido actualizada correctamente",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/evaluations/instructors'] });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Error actualizando evaluación:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la evaluación",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar evaluación
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/evaluations/instructors/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "La evaluación ha sido eliminada correctamente",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/evaluations/instructors'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la evaluación",
        variant: "destructive",
      });
    },
  });

  // Función para traducir propósito de visita
  const translateActivity = (activity: string) => {
    const translations = {
      'exercise': 'Ejercicio',
      'recreation': 'Recreación',
      'family': 'Familia',
      'work': 'Trabajo',
      'education': 'Educación',
      'sports': 'Deportes',
      'relaxation': 'Relajación',
      'social': 'Social',
      'other': 'Otro'
    };
    return translations[activity as keyof typeof translations] || activity;
  };

  // Filtrar evaluaciones
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((evaluation) => {
      const matchesSearch = 
        evaluation.instructorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.evaluatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.attendedActivity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.comments?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || evaluation.status === statusFilter;
      
      const matchesRating = ratingFilter === 'all' || 
        (ratingFilter === '5' && evaluation.overallRating === 5) ||
        (ratingFilter === '4' && evaluation.overallRating === 4) ||
        (ratingFilter === '3' && evaluation.overallRating === 3) ||
        (ratingFilter === '2' && evaluation.overallRating === 2) ||
        (ratingFilter === '1' && evaluation.overallRating === 1);
      
      const matchesDate = dateFilter === 'all' || 
        (dateFilter === 'week' && new Date(evaluation.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
        (dateFilter === 'month' && new Date(evaluation.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
        (dateFilter === 'year' && new Date(evaluation.createdAt) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
      
      return matchesSearch && matchesStatus && matchesRating && matchesDate;
    });
  }, [evaluations, searchTerm, statusFilter, ratingFilter, dateFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredEvaluations.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const currentEvaluations = filteredEvaluations.slice(startIndex, endIndex);

  // Estadísticas
  const stats = useMemo(() => {
    const total = evaluations.length;
    const approved = evaluations.filter(e => e.status === 'approved').length;
    const pending = evaluations.filter(e => e.status === 'pending').length;
    const rejected = evaluations.filter(e => e.status === 'rejected').length;
    const averageRating = total > 0 
      ? (evaluations.reduce((sum, e) => sum + e.overallRating, 0) / total).toFixed(1) 
      : '0.0';
    
    return { total, approved, pending, rejected, averageRating };
  }, [evaluations]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      default:
        return 'Pendiente';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const handleEdit = (evaluation: InstructorEvaluation) => {
    setSelectedEvaluation(evaluation);
    setEditingStatus(evaluation.status);
    setEditingNotes(evaluation.moderationNotes || '');
    setEditDialogOpen(true);
  };

  const handleView = (evaluation: InstructorEvaluation) => {
    setSelectedEvaluation(evaluation);
    setViewDialogOpen(true);
  };

  const handleUpdateEvaluation = () => {
    if (selectedEvaluation) {
      updateMutation.mutate({
        id: selectedEvaluation.id,
        status: editingStatus,
        moderationNotes: editingNotes
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  // Función para exportar CSV con soporte para acentos
  const exportToCSV = () => {
    const headers = [
      'ID',
      'Instructor',
      'Evaluador',
      'Email Evaluador',
      'Ciudad Evaluador',
      'Conocimiento',
      'Claridad',
      'Paciencia',
      'Puntualidad',
      'Calificación General',
      '¿Recomendaría?',
      'Comentarios',
      'Actividad Asistida',
      'Estado',
      'Notas de Moderación',
      'Fecha Evaluación',
      'Fecha Creación'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredEvaluations.map(evaluation => [
        evaluation.id,
        `"${evaluation.instructorName || ''}"`,
        `"${evaluation.evaluatorName || ''}"`,
        `"${evaluation.evaluatorEmail || ''}"`,
        `"${evaluation.evaluatorCity || ''}"`,
        evaluation.knowledgeRating || '',
        evaluation.clarityRating || '',
        evaluation.patienceRating || '',
        evaluation.punctualityRating || '',
        evaluation.overallRating || '',
        evaluation.wouldRecommend ? 'Sí' : 'No',
        `"${(evaluation.comments || '').replace(/"/g, '""')}"`,
        `"${translateActivity(evaluation.attendedActivity || '')}"`,
        getStatusLabel(evaluation.status),
        `"${(evaluation.moderationNotes || '').replace(/"/g, '""')}"`,
        evaluation.evaluationDate || '',
        new Date(evaluation.createdAt).toLocaleDateString('es-ES')
      ].join(','))
    ].join('\n');

    // Añadir BOM para UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `evaluaciones_instructores_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Éxito",
      description: `Se exportaron ${filteredEvaluations.length} evaluaciones a CSV`,
    });
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <FileX className="h-8 w-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold">Evaluaciones de Instructores</h1>
              <p className="text-muted-foreground">Error al cargar las evaluaciones</p>
            </div>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-red-500">Error al cargar los datos. Intente nuevamente.</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <Award className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Evaluaciones de Instructores</h1>
            <p className="text-muted-foreground">
              Gestión y moderación de evaluaciones ({stats.total} registros) - Sin filtros aplicados
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">evaluaciones</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? `${((stats.approved / stats.total) * 100).toFixed(1)}%` : '0%'} del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? `${((stats.pending / stats.total) * 100).toFixed(1)}%` : '0%'} del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? `${((stats.rejected / stats.total) * 100).toFixed(1)}%` : '0%'} del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.averageRating}</div>
              <p className="text-xs text-muted-foreground">calificación</p>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Búsqueda */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por instructor, evaluador, actividad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Controles del lado derecho */}
            <div className="flex items-center gap-2">
              {/* Filtros avanzados */}
              <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filtros Avanzados</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Estado</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="approved">Aprobada</SelectItem>
                          <SelectItem value="rejected">Rechazada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Calificación</Label>
                      <Select value={ratingFilter} onValueChange={setRatingFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las calificaciones</SelectItem>
                          <SelectItem value="5">5 estrellas</SelectItem>
                          <SelectItem value="4">4 estrellas</SelectItem>
                          <SelectItem value="3">3 estrellas</SelectItem>
                          <SelectItem value="2">2 estrellas</SelectItem>
                          <SelectItem value="1">1 estrella</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Fecha</Label>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las fechas</SelectItem>
                          <SelectItem value="week">Última semana</SelectItem>
                          <SelectItem value="month">Último mes</SelectItem>
                          <SelectItem value="year">Último año</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setStatusFilter('all');
                          setRatingFilter('all');
                          setDateFilter('all');
                        }}
                      >
                        Limpiar filtros
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => setFilterDialogOpen(false)}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Exportar CSV */}
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>

              {/* Selector de vista */}
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de evaluaciones */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No se encontraron evaluaciones con los filtros aplicados</p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentEvaluations.map((evaluation) => (
              <Card key={evaluation.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{evaluation.instructorName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Evaluado por: {evaluation.evaluatorName}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(evaluation.status)}>
                        {getStatusIcon(evaluation.status)}
                        <span className="ml-1">{getStatusLabel(evaluation.status)}</span>
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleView(evaluation)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(evaluation)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar evaluación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. La evaluación será eliminada permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(evaluation.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {renderStars(evaluation.overallRating || 0)}
                    </div>
                    <span className="text-sm font-medium">
                      {evaluation.overallRating ? `${evaluation.overallRating}/5` : 'Sin calificar'}
                    </span>
                  </div>
                  
                  {/* Calificaciones por criterio */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Conocimiento:</span>
                      <span className="font-medium">{evaluation.knowledgeRating || 'N/A'}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paciencia:</span>
                      <span className="font-medium">{evaluation.patienceRating || 'N/A'}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Claridad:</span>
                      <span className="font-medium">{evaluation.clarityRating || 'N/A'}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Puntualidad:</span>
                      <span className="font-medium">{evaluation.punctualityRating || 'N/A'}/5</span>
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Actividad: </span>
                    <span className="font-medium">
                      {evaluation.attendedActivity ? evaluation.attendedActivity : 'No especificada'}
                    </span>
                  </div>

                  {evaluation.comments && (
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">Comentarios:</p>
                      <p className="text-xs bg-gray-50 p-2 rounded">
                        {evaluation.comments.length > 100 
                          ? `${evaluation.comments.substring(0, 100)}...` 
                          : evaluation.comments
                        }
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>ID: {evaluation.id}</span>
                    <span>{new Date(evaluation.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Vista de lista */
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Instructor</th>
                      <th className="p-4 font-medium">Evaluador</th>
                      <th className="p-4 font-medium">Calificación</th>
                      <th className="p-4 font-medium">Actividad</th>
                      <th className="p-4 font-medium">Estado</th>
                      <th className="p-4 font-medium">Fecha</th>
                      <th className="p-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEvaluations.map((evaluation) => (
                      <tr key={evaluation.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{evaluation.instructorName}</div>
                            <div className="text-sm text-muted-foreground">ID: {evaluation.id}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{evaluation.evaluatorName}</div>
                            <div className="text-sm text-muted-foreground">{evaluation.evaluatorEmail}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex">
                              {renderStars(evaluation.overallRating || 0)}
                            </div>
                            <span className="text-sm font-medium">
                              {evaluation.overallRating ? `${evaluation.overallRating}/5` : 'Sin calificar'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">
                            {evaluation.attendedActivity ? evaluation.attendedActivity : 'No especificada'}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(evaluation.status)}>
                            {getStatusIcon(evaluation.status)}
                            <span className="ml-1">{getStatusLabel(evaluation.status)}</span>
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(evaluation.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(evaluation)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(evaluation)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar evaluación?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. La evaluación será eliminada permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(evaluation.id)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredEvaluations.length)} de {filteredEvaluations.length} evaluaciones
            </p>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(current => Math.max(1, current - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  )
                  .map((page, idx, array) => (
                    <React.Fragment key={page}>
                      {idx > 0 && array[idx - 1] < page - 1 && (
                        <span className="px-2">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(current => Math.min(totalPages, current + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog para ver detalles */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Evaluación</DialogTitle>
          </DialogHeader>
          {selectedEvaluation && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Instructor</Label>
                    <p className="font-medium">{selectedEvaluation.instructorName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(selectedEvaluation.status)}>
                        {getStatusIcon(selectedEvaluation.status)}
                        <span className="ml-1">{getStatusLabel(selectedEvaluation.status)}</span>
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Evaluador</Label>
                    <p className="font-medium">{selectedEvaluation.evaluatorName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p>{selectedEvaluation.evaluatorEmail || 'No proporcionado'}</p>
                  </div>
                </div>



                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Calificación General</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex">
                      {renderStars(selectedEvaluation.overallRating)}
                    </div>
                    <span className="text-sm font-medium">{selectedEvaluation.overallRating}/5</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Calificaciones Detalladas</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div className="flex justify-between">
                      <span>Conocimiento:</span>
                      <span className="font-medium">{selectedEvaluation.knowledgeRating}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paciencia:</span>
                      <span className="font-medium">{selectedEvaluation.patienceRating}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Claridad:</span>
                      <span className="font-medium">{selectedEvaluation.clarityRating}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Puntualidad:</span>
                      <span className="font-medium">{selectedEvaluation.punctualityRating}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>¿Recomendaría?:</span>
                      <span className="font-medium">{selectedEvaluation.wouldRecommend ? 'Sí' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {selectedEvaluation.attendedActivity && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Actividad Asistida</Label>
                    <p>{translateActivity(selectedEvaluation.attendedActivity)}</p>
                  </div>
                )}

                {selectedEvaluation.comments && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Comentarios</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedEvaluation.comments}</p>
                  </div>
                )}

                {selectedEvaluation.moderationNotes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Notas de Moderación</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedEvaluation.moderationNotes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Fecha de Evaluación</Label>
                    <p>{selectedEvaluation.evaluationDate ? new Date(selectedEvaluation.evaluationDate).toLocaleDateString('es-ES') : 'No especificada'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Fecha de Creación</Label>
                    <p>{new Date(selectedEvaluation.createdAt).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para editar evaluación */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Moderar Evaluación</DialogTitle>
          </DialogHeader>
          {selectedEvaluation && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Instructor: {selectedEvaluation.instructorName}</Label>
                <p className="text-sm text-muted-foreground">Evaluado por: {selectedEvaluation.evaluatorName}</p>
              </div>
              
              <div>
                <Label>Estado</Label>
                <Select value={editingStatus} onValueChange={setEditingStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="approved">Aprobada</SelectItem>
                    <SelectItem value="rejected">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notas de moderación</Label>
                <Textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Agregar notas sobre la moderación..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdateEvaluation}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default EvaluacionesInstructores;