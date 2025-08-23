import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  MapPin,
  GraduationCap,
  Heart,
  Calendar,
  Building2,
  Eye,
  Search,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function EvaluacionesDashboard() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Consulta para obtener estadísticas de evaluaciones
  const { 
    data: statsData, 
    isLoading: isStatsLoading, 
    isError: isStatsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['/api/evaluations/stats'],
  });

  // Consulta para obtener evaluaciones recientes
  const { 
    data: recentData, 
    isLoading: isRecentLoading, 
    isError: isRecentError,
    refetch: refetchRecent
  } = useQuery({
    queryKey: ['/api/evaluations/recent'],
  });
  
  const stats = statsData || {};
  const recentEvaluations = recentData || [];

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Filtrar evaluaciones recientes
  const filteredEvaluations = Array.isArray(recentEvaluations) 
    ? recentEvaluations.filter((evaluation: any) => {
        const matchesSearch = 
          evaluation.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          evaluation.evaluatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          evaluation.comments?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
      })
    : [];

  // Función para navegar a módulos específicos
  const navigateToModule = (moduleType: string) => {
    setLocation(`/admin/evaluaciones/${moduleType}`);
  };

  // Función para obtener el icono según el tipo de evaluación
  const getEvaluationTypeIcon = (type: string) => {
    switch(type) {
      case 'park':
        return <MapPin className="h-4 w-4" />;
      case 'instructor':
        return <GraduationCap className="h-4 w-4" />;
      case 'volunteer':
        return <Heart className="h-4 w-4" />;
      case 'activity':
        return <Calendar className="h-4 w-4" />;
      case 'concessionaire':
        return <Building2 className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Función para obtener el color del badge según el tipo
  const getEvaluationTypeColor = (type: string) => {
    switch(type) {
      case 'park':
        return 'bg-green-100 text-green-800';
      case 'instructor':
        return 'bg-blue-100 text-blue-800';
      case 'volunteer':
        return 'bg-purple-100 text-purple-800';
      case 'activity':
        return 'bg-orange-100 text-orange-800';
      case 'concessionaire':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para obtener el nombre en español del tipo
  const getEvaluationTypeName = (type: string) => {
    switch(type) {
      case 'park':
        return 'Parque';
      case 'instructor':
        return 'Instructor';
      case 'volunteer':
        return 'Voluntario';
      case 'activity':
        return 'Actividad';
      case 'concessionaire':
        return 'Concesionario';
      default:
        return type;
    }
  };

  if (isStatsLoading || isRecentLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Dashboard de Evaluaciones</h1>
            <p className="text-muted-foreground">
              Gestión centralizada del sistema de evaluaciones
            </p>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isStatsError || isRecentError) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <Card className="mt-6">
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-medium mb-2">Error al cargar estadísticas</h2>
                <p className="text-gray-500 mb-4">Ha ocurrido un error al intentar obtener los datos. Por favor, intenta nuevamente.</p>
                <Button onClick={() => { refetchStats(); refetchRecent(); }}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard de Evaluaciones</h1>
            <p className="text-muted-foreground">
              Gestión centralizada del sistema de evaluaciones
            </p>
          </div>
          <Button onClick={() => { refetchStats(); refetchRecent(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar datos
          </Button>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvaluations || 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                Promedio: {stats.averageOverallRating || '0.0'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Parques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.parks?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Promedio: {stats.parks?.averageRating?.toFixed(1) || '0.0'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Instructores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.instructors?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Promedio: {stats.instructors?.averageRating?.toFixed(1) || '0.0'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Voluntarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.volunteers?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Promedio: {stats.volunteers?.averageRating?.toFixed(1) || '0.0'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Módulos de evaluación */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Módulos de Evaluación</CardTitle>
            <CardDescription>
              Accede a los diferentes tipos de evaluaciones disponibles en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToModule('parques')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Parques</h3>
                      <p className="text-sm text-muted-foreground">{stats.parks?.total || 0} evaluaciones</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToModule('instructores')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Instructores</h3>
                      <p className="text-sm text-muted-foreground">{stats.instructors?.total || 0} evaluaciones</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToModule('voluntarios')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Heart className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Voluntarios</h3>
                      <p className="text-sm text-muted-foreground">{stats.volunteers?.total || 0} evaluaciones</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToModule('actividades')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Actividades</h3>
                      <p className="text-sm text-muted-foreground">{stats.activities?.total || 0} evaluaciones</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToModule('concesionarios')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Concesionarios</h3>
                      <p className="text-sm text-muted-foreground">{stats.concessionaires?.total || 0} evaluaciones</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToModule('eventos')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Eventos</h3>
                      <p className="text-sm text-muted-foreground">{stats.events?.total || 0} evaluaciones</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Evaluaciones recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluaciones Recientes</CardTitle>
            <CardDescription>
              Últimas evaluaciones registradas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar evaluaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Evaluador</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvaluations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No hay evaluaciones disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvaluations.map((evaluation: any) => (
                      <TableRow key={`${evaluation.type}-${evaluation.id}`}>
                        <TableCell>
                          <Badge className={getEvaluationTypeColor(evaluation.type)}>
                            {getEvaluationTypeIcon(evaluation.type)}
                            <span className="ml-1">{getEvaluationTypeName(evaluation.type)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {evaluation.entityName || 'Nombre no disponible'}
                        </TableCell>
                        <TableCell>
                          {evaluation.evaluatorName || 'Evaluador no disponible'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={evaluation.overallRating >= 4 ? "default" : evaluation.overallRating >= 3 ? "secondary" : "destructive"}>
                            {evaluation.overallRating}/5
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(evaluation.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToModule(evaluation.type === 'park' ? 'parques' : evaluation.type === 'instructor' ? 'instructores' : evaluation.type === 'volunteer' ? 'voluntarios' : evaluation.type === 'concessionaire' ? 'concesionarios' : 'eventos')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}