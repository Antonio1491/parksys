import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Mail, 
  Calendar, 
  CalendarClock, 
  Briefcase, 
  ArrowLeft, 
  FileEdit, 
  Trash, 
  BookOpen,
  AlertCircle,
  RefreshCw,
  Star,
  Download,
  FileText,
  Eye
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import InstructorActivitiesList from '@/components/InstructorActivitiesList';
import InstructorEvaluationDialog from '@/components/InstructorEvaluationDialog';
import InstructorEvaluationsList from '@/components/InstructorEvaluationsList';

export default function InstructorDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const instructorId = parseInt(params.id);
  
  // Estados del componente (todos juntos al inicio)
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  
  // Obtener datos del instructor
  const { 
    data: instructorData, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: [`/api/instructors/${instructorId}`],
    enabled: !isNaN(instructorId)
  });
  
  // Asegurarnos de que tenemos un objeto instructor con valores por defecto para evitar errores
  const instructor = instructorData || {
    id: 0,
    fullName: '',
    email: '',
    phone: '',
    specialties: [],
    experienceYears: 0,
    status: 'pending',
    profileImageUrl: '',
    curriculumUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    education: ''
  };

  // Obtener actividades del instructor
  const { 
    data: instructorActivities,
    isLoading: isLoadingActivities
  } = useQuery({
    queryKey: [`/api/activities?instructorId=${instructorId}`],
    enabled: !isNaN(instructorId)
  });

  // Obtener evaluaciones del instructor
  const { 
    data: evaluations,
    isLoading: isLoadingEvaluations
  } = useQuery({
    queryKey: [`/api/evaluations/instructors?instructorId=${instructorId}`],
    enabled: !isNaN(instructorId)
  });

  // Funciones para manejar el curriculum
  const handleDownloadCurriculum = () => {
    if (instructor.curriculumUrl) {
      const link = document.createElement('a');
      link.href = instructor.curriculumUrl;
      link.download = `CV_${instructor.fullName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewCurriculum = () => {
    if (instructor.curriculumUrl) {
      window.open(instructor.curriculumUrl, '_blank');
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Iniciales para avatar
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Renderizar estado del instructor
  const renderStatus = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Renderizar especialidades
  const renderSpecialties = (specialties?: string[]) => {
    if (!specialties || !Array.isArray(specialties) || specialties.length === 0) {
      return <span className="text-gray-400 italic">Sin especialidades registradas</span>;
    }
    
    return specialties.map((specialty, index) => (
      <Badge key={index} variant="outline" className="mr-1 mb-1">{specialty}</Badge>
    ));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/admin/instructors')}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold">Cargando instructor...</h1>
          </div>
          <div className="flex justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/admin/instructors')}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold">Error al cargar instructor</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-medium mb-2">No se pudo cargar la información del instructor</h2>
                <p className="text-gray-500 mb-4">Ha ocurrido un error al intentar obtener los datos. Por favor, intenta nuevamente.</p>
                <Button onClick={() => refetch()}>
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
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/admin/instructors')}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{instructor.fullName}</h1>
              <p className="text-muted-foreground">
                Instructor desde {formatDate(instructor.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna izquierda - Información de perfil */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>Información personal del instructor</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col items-center mb-6">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src={instructor.profileImageUrl} alt={instructor.fullName} />
                    <AvatarFallback className="text-2xl">
                      {getInitials(instructor.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">{instructor.fullName}</h2>
                  <div className="mt-2">
                    {renderStatus(instructor.status)}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{instructor.email}</span>
                    </div>
                  </div>
                  
                  {instructor.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Teléfono</p>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{instructor.phone}</span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Experiencia</p>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{instructor.experienceYears} {instructor.experienceYears === 1 ? 'año' : 'años'}</span>
                    </div>
                  </div>

                  {instructor.education && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Educación</p>
                      <div className="flex items-start">
                        <BookOpen className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                        <span className="text-sm">{instructor.education}</span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Fecha de registro</p>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{formatDate(instructor.createdAt)}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Especialidades</p>
                    <div className="flex flex-wrap">
                      {renderSpecialties(instructor.specialties)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-500 mb-1">Actividades</p>
                    <p className="text-2xl font-bold text-blue-600">{instructorActivities?.length || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-500 mb-1">Evaluaciones</p>
                    <p className="text-2xl font-bold text-green-600">{evaluations?.length || 0}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-500 mb-1">Años de exp.</p>
                    <p className="text-2xl font-bold text-purple-600">{instructor.experienceYears}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-500 mb-1">Calificación</p>
                    <p className="text-2xl font-bold text-orange-600">{instructor.rating?.toFixed(1) || '0.0'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Columna derecha - Tabs con información detallada */}
          <div className="md:col-span-2">
            <Tabs defaultValue="activities" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="activities">
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Actividades
                </TabsTrigger>
                <TabsTrigger value="evaluations">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Evaluaciones
                </TabsTrigger>
                <TabsTrigger value="curriculum">
                  <FileText className="h-4 w-4 mr-2" />
                  Currículum
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="activities">
                {isLoadingActivities ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-center py-4">
                        <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ) : !instructorActivities || instructorActivities.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-6">
                        <CalendarClock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No hay actividades asignadas a este instructor.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {instructorActivities.slice(0, 5).map((activity: any) => (
                      <Card key={activity.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{activity.title}</CardTitle>
                              <CardDescription>{activity.description}</CardDescription>
                            </div>
                            <Badge variant="outline">{activity.category}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Fecha:</p>
                              <p>{activity.startDate ? formatDate(activity.startDate) : 'No especificada'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Horario:</p>
                              <p>{activity.startTime ? `${activity.startTime} - ${activity.endTime}` : 'No especificado'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Capacidad:</p>
                              <p>{activity.capacity || 'Ilimitada'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Precio:</p>
                              <p>{activity.isFree ? 'Gratuita' : `$${activity.price || '0'}`}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="evaluations">
                {isLoadingEvaluations ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-center py-4">
                        <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ) : !evaluations || evaluations.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-6">
                        <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No hay evaluaciones disponibles para este instructor.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {evaluations.map((evaluation: any) => (
                      <Card key={evaluation.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Evaluación #{evaluation.id}</CardTitle>
                              <CardDescription>
                                Evaluado el {formatDate(evaluation.createdAt)}
                              </CardDescription>
                            </div>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span className="font-semibold">{evaluation.overallRating}/5</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Paciencia:</p>
                                <div className="flex items-center">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${
                                          star <= evaluation.patienceRating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="ml-2 text-sm">{evaluation.patienceRating}/5</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Claridad:</p>
                                <div className="flex items-center">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${
                                          star <= evaluation.clarityRating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="ml-2 text-sm">{evaluation.clarityRating}/5</span>
                                </div>
                              </div>
                            </div>
                            {evaluation.comments && (
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Comentarios:</p>
                                <p className="text-sm bg-gray-50 p-2 rounded">{evaluation.comments}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="curriculum">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Currículum Vitae
                    </CardTitle>
                    <CardDescription>
                      Documento de currículum del instructor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {instructor.curriculumUrl ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <FileText className="h-8 w-8 text-blue-500 mr-3" />
                            <div>
                              <p className="font-medium">CV_{instructor.fullName}.pdf</p>
                              <p className="text-sm text-gray-500">
                                Currículum vitae del instructor
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleViewCurriculum}
                            variant="default"
                            className="flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver currículum
                          </Button>
                          <Button 
                            onClick={handleDownloadCurriculum}
                            variant="outline"
                            className="flex items-center"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </Button>
                        </div>
                        
                        {instructor.bio && (
                          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Biografía</h4>
                            <p className="text-blue-800 text-sm">{instructor.bio}</p>
                          </div>
                        )}
                        
                        {instructor.qualifications && (
                          <div className="mt-4 p-4 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-2">Cualificaciones</h4>
                            <p className="text-green-800 text-sm">{instructor.qualifications}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No hay currículum disponible
                        </h3>
                        <p className="text-gray-500">
                          El instructor no ha subido su currículum vitae.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}