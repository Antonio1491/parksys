import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminLayout from '@/components/AdminLayout';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Sprout, TreeDeciduous, ThermometerSun, Tag, AlertCircle, AlertOctagon, 
  AlertTriangle, CircleAlert, CircleCheck, Info, ArrowLeft, Edit, ExternalLink, 
  MapPin, Leaf, Calendar, Ruler, HelpCircle, Trash2, Plus, Scissors, 
  Shovel, Wrench, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function TreeDetailPage() {
  const [match, params] = useRoute('/admin/trees/inventory/:id');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const treeId = params?.id;
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState({
    maintenanceType: '',
    maintenanceDate: '',
    performedBy: '',
    notes: ''
  });

  // Estado para búsqueda de empleados
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  
  // Verificar que se obtiene el ID correctamente
  console.log("ID del árbol:", treeId);

  // Consultar información del árbol
  const {
    data: treeResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/trees/${treeId}`],
    queryFn: async () => {
      const response = await fetch(`/api/trees/${treeId}`);
      if (!response.ok) {
        throw new Error('Error al cargar la información del árbol');
      }
      const data = await response.json();
      console.log('Datos del árbol:', data);
      return data;
    },
    enabled: !!treeId,
  });

  const tree = treeResponse?.data;

  // Consultar empleados para el selector
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      if (!response.ok) return [];
      const data = await response.json();
      return data.employees || [];
    },
  });

  // Filtrar empleados basado en la búsqueda
  const filteredEmployees = employees.filter((emp: any) => 
    emp.firstName?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.lastName?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.email?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.position?.toLowerCase().includes(employeeSearch.toLowerCase())
  ).slice(0, 10); // Limitar a 10 resultados
  
  // Consultar mantenimientos del árbol
  const {
    data: maintenances,
    isLoading: isLoadingMaintenances,
    refetch: refetchMaintenances
  } = useQuery({
    queryKey: [`/api/trees/${treeId}/maintenances`],
    queryFn: async () => {
      const response = await fetch(`/api/trees/${treeId}/maintenances`);
      if (!response.ok) {
        throw new Error('Error al cargar los mantenimientos del árbol');
      }
      return response.json();
    },
    enabled: !!treeId,
  });

  // Consultar evaluaciones/inspecciones del árbol
  const {
    data: evaluations,
    isLoading: isLoadingEvaluations,
    refetch: refetchEvaluations
  } = useQuery({
    queryKey: [`/api/trees/${treeId}/evaluations`],
    queryFn: async () => {
      const response = await fetch(`/api/trees/${treeId}/evaluations`);
      if (!response.ok) {
        throw new Error('Error al cargar las evaluaciones del árbol');
      }
      return response.json();
    },
    enabled: !!treeId,
  });

  // Manejar la eliminación (marcado como removido) de un árbol
  const handleRemoveTree = async (reason: string) => {
    try {
      await apiRequest(`/api/trees/${treeId}`, {
        method: 'DELETE',
        data: { removalReason: reason },
      });

      toast({
        title: 'Árbol eliminado',
        description: 'El árbol ha sido marcado como removido correctamente.',
      });

      // Invalidar caché
      queryClient.invalidateQueries({ queryKey: ['/api/trees'] });
      
      // Redirigir al listado
      navigate('/admin/trees/inventory');
    } catch (error) {
      console.error('Error al eliminar el árbol:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el árbol. Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Formatear fecha
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No disponible';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  };
  
  // Agregar un nuevo mantenimiento
  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: typeof newMaintenance) => {
      return apiRequest(`/api/trees/${treeId}/maintenances`, {
        method: 'POST',
        data: {
          maintenance_type: data.maintenanceType,
          maintenance_date: data.maintenanceDate,
          performed_by: data.performedBy ? parseInt(data.performedBy) : null,
          notes: data.notes,
        },
      });
    },
    onSuccess: () => {
      // Cerrar el modal y limpiar el formulario
      setIsMaintenanceModalOpen(false);
      setNewMaintenance({
        maintenanceType: '',
        maintenanceDate: '',
        performedBy: '',
        notes: ''
      });
      setEmployeeSearch('');
      setSelectedEmployee(null);
      setShowEmployeeList(false);
      
      // Mostrar mensaje de éxito
      toast({
        title: 'Mantenimiento registrado',
        description: 'El mantenimiento ha sido registrado correctamente.',
      });
      
      // Actualizar los datos
      refetchMaintenances();
      queryClient.invalidateQueries({ queryKey: [`/api/trees/${treeId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/trees'] });
    },
    onError: (error) => {
      console.error('Error al registrar mantenimiento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar el mantenimiento. Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
    },
  });
  
  // Manejar el envío del formulario
  const handleSubmitMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaintenance.maintenanceType || !newMaintenance.maintenanceDate) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa el tipo de mantenimiento y la fecha.',
        variant: 'destructive',
      });
      return;
    }
    
    createMaintenanceMutation.mutate(newMaintenance);
  };
  
  // Obtener el icono para el tipo de mantenimiento
  const getMaintenanceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'poda':
        return <Scissors className="h-4 w-4" />;
      case 'plantación':
        return <Shovel className="h-4 w-4" />;
      case 'riego':
        return <Sprout className="h-4 w-4" />;
      case 'tratamiento fitosanitario':
        return <Leaf className="h-4 w-4" />;
      case 'reparación':
        return <Wrench className="h-4 w-4" />;
      default:
        return <CircleCheck className="h-4 w-4" />;
    }
  };

  // Obtener badge de estado de salud
  const getHealthStatusBadge = (status: string | null | undefined) => {
    if (!status) {
      return (
        <Badge variant="outline">
          No evaluado
        </Badge>
      );
    }
    
    switch (status.toLowerCase()) {
      case 'bueno':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
            <CircleCheck className="h-3 w-3 mr-1" /> Bueno
          </Badge>
        );
      case 'regular':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
            <Info className="h-3 w-3 mr-1" /> Regular
          </Badge>
        );
      case 'malo':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
            <AlertTriangle className="h-3 w-3 mr-1" /> Malo
          </Badge>
        );
      case 'crítico':
        return (
          <Badge variant="destructive">
            <CircleAlert className="h-3 w-3 mr-1" /> Crítico
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // Componente para mostrar foto de la especie
  const SpeciesPhotoDisplay = ({ tree }: { tree: any }) => {
    const [speciesData, setSpeciesData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (tree.speciesId) {
        setLoading(true);
        // Obtener datos de la especie incluyendo la foto
        fetch(`/api/tree-species/${tree.speciesId}`)
          .then(response => response.json())
          .then(data => {
            setSpeciesData(data);
            setLoading(false);
          })
          .catch(error => {
            console.error('Error cargando especie:', error);
            setLoading(false);
          });
      }
    }, [tree.speciesId]);

    if (loading) {
      return (
        <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center mb-4">
          <Sprout className="h-16 w-16 text-gray-300 animate-pulse" />
        </div>
      );
    }

    // Mostrar foto de la especie si está disponible
    if (speciesData && speciesData.photoUrl) {
      return (
        <div className="space-y-2 mb-4">
          <div className="aspect-square overflow-hidden rounded-md">
            <img 
              src={speciesData.photoUrl} 
              alt={`${speciesData.commonName} (${speciesData.scientificName})`}
              className="object-cover w-full h-full"
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Foto de la especie: {speciesData.commonName}
          </p>
        </div>
      );
    }

    // Fallback: icono genérico
    return (
      <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center mb-4">
        <TreeDeciduous className="h-16 w-16 text-gray-400" />
        <div className="absolute bottom-2 bg-white/90 px-2 py-1 rounded text-xs text-gray-600">
          Sin foto disponible
        </div>
      </div>
    );
  };

  // Si hay error al cargar
  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-6">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No se pudo cargar la información del árbol. Verifica que el ID sea correcto.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => navigate('/admin/trees/inventory')}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inventario
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>{isLoading ? 'Cargando detalles...' : `Árbol ${tree.code} | Inventario Arbóreo | ParquesMX`}</title>
        <meta name="description" content="Detalles del árbol en el inventario de parques municipales" />
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        {/* Encabezado */}
        <div className="flex items-start mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/trees/inventory')}
            className="mr-4 mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {isLoading ? (
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-green-800 flex items-center">
                  <Sprout className="mr-2 h-8 w-8" />
                  {`${tree.code} - ${tree.speciesName}`}
                </h1>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex items-center"
                    onClick={() => navigate(`/admin/trees/inventory/${treeId}/edit`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="flex items-center">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar eliminación</DialogTitle>
                        <DialogDescription>
                          ¿Estás seguro de que deseas marcar este árbol como removido? Esta acción no eliminará el registro, pero lo marcará como removido del inventario.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="text-sm font-medium mb-2">Motivo de la remoción:</p>
                        <select 
                          className="w-full p-2 border rounded-md"
                          id="removalReason"
                          defaultValue="Tala programada"
                        >
                          <option value="Tala programada">Tala programada</option>
                          <option value="Árbol enfermo">Árbol enfermo</option>
                          <option value="Árbol caído">Árbol caído</option>
                          <option value="Riesgo de caída">Riesgo de caída</option>
                          <option value="Reubicación">Reubicación</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button 
                          variant="destructive"
                          onClick={() => {
                            const reason = (document.getElementById('removalReason') as HTMLSelectElement).value;
                            handleRemoveTree(reason);
                          }}
                        >
                          Confirmar eliminación
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <p className="text-gray-600 mt-1 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {tree.parkName} • {tree.scientificName} 
                <span className="mx-2">•</span>
                {getHealthStatusBadge(tree.healthStatus)}
                {tree.isProtected && (
                  <Badge variant="secondary" className="ml-2">Protección Especial</Badge>
                )}
              </p>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-[300px] w-full rounded-lg" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
        ) : (
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="physical">Estado Físico</TabsTrigger>
              <TabsTrigger value="location">Ubicación</TabsTrigger>
              <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
            </TabsList>

            {/* Tab: Información General */}
            <TabsContent value="general">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Datos Generales</CardTitle>
                    <CardDescription>
                      Información general del árbol en el inventario
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Código Identificador</h3>
                        <p className="mt-1 text-gray-700">{tree.code}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Especie</h3>
                        <p className="mt-1 text-gray-700">{tree.speciesName}</p>
                        <p className="text-sm italic text-gray-500">{tree.scientificName}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Parque</h3>
                        <p className="mt-1 text-gray-700">{tree.parkName}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Estado de Salud</h3>
                        <p className="mt-1">{getHealthStatusBadge(tree.healthStatus)}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Etapa de Desarrollo</h3>
                        <p className="mt-1 text-gray-700">{tree.developmentStage || 'No especificado'}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Edad Estimada</h3>
                        <p className="mt-1 text-gray-700">{tree.ageEstimate ? `${tree.ageEstimate} años` : 'No especificado'}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Fecha de Plantación</h3>
                        <p className="mt-1 text-gray-700">{formatDate(tree.plantingDate)}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Última Inspección</h3>
                        <p className="mt-1 text-gray-700">{formatDate(tree.lastInspectionDate)}</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium text-gray-900">Dimensiones</h3>
                      <div className="mt-2 grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg flex flex-col items-center justify-center">
                          <Ruler className="h-5 w-5 text-green-600 mb-1" />
                          <span className="text-sm text-gray-500">Altura</span>
                          <span className="font-medium text-lg text-gray-800">{tree.height ? `${tree.height} m` : '-'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg flex flex-col items-center justify-center">
                          <span className="font-medium text-2xl text-green-600 mb-1">Ø</span>
                          <span className="text-sm text-gray-500">Diámetro (DAP)</span>
                          <span className="font-medium text-lg text-gray-800">{tree.diameter ? `${tree.diameter} cm` : '-'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg flex flex-col items-center justify-center">
                          <Sprout className="h-5 w-5 text-green-600 mb-1" />
                          <span className="text-sm text-gray-500">Cobertura Copa</span>
                          <span className="font-medium text-lg text-gray-800">{tree.canopyCoverage ? `${tree.canopyCoverage} m²` : '-'}</span>
                        </div>
                      </div>
                    </div>

                    {tree.observations && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="font-medium text-gray-900">Observaciones</h3>
                          <p className="mt-2 text-gray-700 whitespace-pre-wrap">{tree.observations}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Información Adicional</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <SpeciesPhotoDisplay tree={tree} />

                    <div>
                      <h3 className="text-sm font-medium">Creado</h3>
                      <p className="text-sm text-gray-500">{formatDate(tree.createdAt)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium">Última Actualización</h3>
                      <p className="text-sm text-gray-500">{formatDate(tree.updatedAt)}</p>
                    </div>

                    {tree.isProtected && (
                      <Alert className="bg-green-50 border-green-200">
                        <CircleCheck className="h-4 w-4 text-green-600" />
                        <AlertTitle>Árbol Protegido</AlertTitle>
                        <AlertDescription>
                          Este ejemplar cuenta con protección especial.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${tree.latitude},${tree.longitude}`, '_blank')}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Ver en Google Maps
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Estado Físico */}
            <TabsContent value="physical">
              <Card>
                <CardHeader>
                  <CardTitle>Estado Físico y Condiciones</CardTitle>
                  <CardDescription>
                    Información sobre el estado y condiciones del árbol
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Estado General</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">Estado de Salud</h4>
                            <p className="text-sm text-gray-500">Evaluación general del árbol</p>
                          </div>
                          <div>
                            {getHealthStatusBadge(tree.healthStatus)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">Etapa de Desarrollo</h4>
                            <p className="text-sm text-gray-500">Fase actual del ciclo de vida</p>
                          </div>
                          <div>
                            <Badge variant="outline">
                              {tree.developmentStage || 'No especificado'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">Última Inspección</h4>
                            <p className="text-sm text-gray-500">Fecha de la evaluación más reciente</p>
                          </div>
                          <div>
                            <Badge variant="secondary">
                              <Calendar className="mr-1 h-3 w-3" />
                              {formatDate(tree.lastInspectionDate)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Condiciones Específicas</h3>
                      <div className="space-y-4">
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                          <div className={`h-4 w-4 rounded-full mr-3 ${tree.hasHollows ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <h4 className="font-medium">Presencia de Huecos</h4>
                            <p className="text-sm text-gray-500">
                              {tree.hasHollows 
                                ? 'El árbol presenta huecos o cavidades' 
                                : 'No se han detectado huecos o cavidades'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                          <div className={`h-4 w-4 rounded-full mr-3 ${tree.hasExposedRoots ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <h4 className="font-medium">Raíces Expuestas</h4>
                            <p className="text-sm text-gray-500">
                              {tree.hasExposedRoots
                                ? 'El árbol tiene raíces expuestas en la superficie'
                                : 'No se observan raíces expuestas'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                          <div className={`h-4 w-4 rounded-full mr-3 ${tree.hasPests ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <h4 className="font-medium">Presencia de Plagas</h4>
                            <p className="text-sm text-gray-500">
                              {tree.hasPests
                                ? 'Se han detectado plagas o enfermedades'
                                : 'No se han detectado plagas o enfermedades'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {tree.physicalCondition && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Descripción de Condición Física</h3>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-700 whitespace-pre-wrap">{tree.physicalCondition}</p>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Evaluaciones</h3>
                    {isLoadingEvaluations ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                        <p className="text-gray-500 mt-2">Cargando evaluaciones...</p>
                      </div>
                    ) : (
                      <Table>
                        <TableCaption>
                          {evaluations?.data?.length > 0 
                            ? `${evaluations.data.length} registros de evaluaciones` 
                            : "No hay registros de evaluaciones anteriores"}
                        </TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Evaluador</TableHead>
                            <TableHead>Notas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {evaluations?.data && evaluations.data.length > 0 ? (
                            evaluations.data.map((evaluation: any, index: number) => (
                              <TableRow key={evaluation.id || index}>
                                <TableCell>
                                  {formatDate(evaluation.evaluationDate || evaluation.inspection_date || evaluation.date)}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      evaluation.healthStatus === 'Excelente' || evaluation.status === 'Excelente' ? 'default' :
                                      evaluation.healthStatus === 'Bueno' || evaluation.status === 'Bueno' ? 'secondary' :
                                      evaluation.healthStatus === 'Regular' || evaluation.status === 'Regular' ? 'outline' : 'destructive'
                                    }
                                  >
                                    {evaluation.healthStatus || evaluation.status || evaluation.overall_condition || 'Sin especificar'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {evaluation.evaluatorName || evaluation.inspector || evaluation.performed_by_name || 'No especificado'}
                                </TableCell>
                                <TableCell className="max-w-xs">
                                  <div className="truncate" title={evaluation.notes || evaluation.observations || evaluation.comments || ''}>
                                    {evaluation.notes || evaluation.observations || evaluation.comments || 'Sin notas'}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell className="text-muted-foreground text-center" colSpan={4}>
                                No hay datos disponibles
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Registrar Nueva Evaluación
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Tab: Ubicación */}
            <TabsContent value="maintenance">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Registro de Mantenimiento</h2>
                  <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Mantenimiento
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Registrar Nuevo Mantenimiento</DialogTitle>
                        <DialogDescription>
                          Ingresa los detalles del mantenimiento realizado al árbol.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmitMaintenance} className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="maintenanceType" className="text-sm font-medium">
                            Tipo de Mantenimiento *
                          </label>
                          <select 
                            id="maintenanceType"
                            className="w-full p-2 border rounded-md"
                            value={newMaintenance.maintenanceType}
                            onChange={(e) => setNewMaintenance({...newMaintenance, maintenanceType: e.target.value})}
                            required
                          >
                            <option value="">Seleccionar tipo</option>
                            <option value="Poda">Poda</option>
                            <option value="Plantación">Plantación</option>
                            <option value="Riego">Riego</option>
                            <option value="Tratamiento Fitosanitario">Tratamiento Fitosanitario</option>
                            <option value="Reparación">Reparación</option>
                            <option value="Inspección">Inspección</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="maintenanceDate" className="text-sm font-medium">
                            Fecha de Mantenimiento *
                          </label>
                          <input 
                            type="date"
                            id="maintenanceDate"
                            className="w-full p-2 border rounded-md"
                            value={newMaintenance.maintenanceDate}
                            onChange={(e) => setNewMaintenance({...newMaintenance, maintenanceDate: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="performedBy" className="text-sm font-medium">
                            Realizado por
                          </label>
                          <input 
                            type="text"
                            id="performedBy"
                            className="w-full p-2 border rounded-md"
                            value={newMaintenance.performedBy}
                            onChange={(e) => setNewMaintenance({...newMaintenance, performedBy: e.target.value})}
                            placeholder="Nombre de la persona o equipo"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="notes" className="text-sm font-medium">
                            Notas y observaciones
                          </label>
                          <textarea 
                            id="notes"
                            className="w-full p-2 border rounded-md h-24"
                            value={newMaintenance.notes}
                            onChange={(e) => setNewMaintenance({...newMaintenance, notes: e.target.value})}
                            placeholder="Detalles adicionales sobre el mantenimiento realizado"
                          />
                        </div>
                        
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsMaintenanceModalOpen(false)}>
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createMaintenanceMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {createMaintenanceMutation.isPending ? 'Guardando...' : 'Guardar Mantenimiento'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Mantenimientos</CardTitle>
                    <CardDescription>
                      Registro de todas las actividades de mantenimiento realizadas en este árbol
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMaintenances ? (
                      <div className="space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : maintenances?.data?.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Realizado por</TableHead>
                            <TableHead>Notas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {maintenances.data.map((maintenance: any) => (
                            <TableRow key={maintenance.id}>
                              <TableCell className="font-medium flex items-center">
                                <div className="mr-2 text-green-600">
                                  {getMaintenanceIcon(maintenance.maintenanceType)}
                                </div>
                                {maintenance.maintenanceType}
                              </TableCell>
                              <TableCell>{formatDate(maintenance.maintenanceDate)}</TableCell>
                              <TableCell>{maintenance.performedBy || '-'}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {maintenance.notes || 'Sin observaciones'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                          <Shovel className="h-12 w-12" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No hay mantenimientos registrados</h3>
                        <p className="text-gray-500 mb-4">
                          No se han registrado actividades de mantenimiento para este árbol todavía.
                        </p>
                        <Button
                          onClick={() => setIsMaintenanceModalOpen(true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Registrar el primer mantenimiento
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Información de Mantenimiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm text-gray-500 mb-1">Último mantenimiento</h3>
                        <p className="font-medium text-gray-900">
                          {tree.lastMaintenanceDate ? formatDate(tree.lastMaintenanceDate) : 'No registrado'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm text-gray-500 mb-1">Mantenimientos registrados</h3>
                        <p className="font-medium text-gray-900">
                          {maintenances?.data?.length || 0} en total
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm text-gray-500 mb-1">Próximo mantenimiento sugerido</h3>
                        <p className="font-medium text-gray-900">
                          {tree.lastMaintenanceDate ? 
                            formatDate(new Date(new Date(tree.lastMaintenanceDate).setMonth(
                              new Date(tree.lastMaintenanceDate).getMonth() + 3
                            ))) : 
                            'No aplica'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="location">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Datos de Ubicación</CardTitle>
                    <CardDescription>
                      Coordenadas y detalles de ubicación
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Parque</h3>
                      <p className="text-gray-700 font-medium mt-1">{tree.parkName}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium">Coordenadas</h3>
                      <p className="text-gray-700 mt-1">
                        Latitud: <span className="font-mono">{tree.latitude}</span>
                      </p>
                      <p className="text-gray-700">
                        Longitud: <span className="font-mono">{tree.longitude}</span>
                      </p>
                    </div>
                    
                    {tree.locationDescription && (
                      <div>
                        <h3 className="text-sm font-medium">Descripción de la Ubicación</h3>
                        <p className="text-gray-700 mt-1">{tree.locationDescription}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button
                      className="w-full"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${tree.latitude},${tree.longitude}`, '_blank')}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Ver en Google Maps
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Mapa</CardTitle>
                  </CardHeader>
                  <CardContent className="min-h-[400px]">
                    <div className="h-[400px] bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOVTAuHiigloWU&center=${tree.latitude},${tree.longitude}&zoom=18&maptype=satellite`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Ubicación del árbol"
                        onError={() => {
                          // Fallback si no se puede cargar el mapa
                          console.log('Error cargando mapa, mostrando alternativa');
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Modal para registrar mantenimiento */}
        <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Mantenimiento</DialogTitle>
              <DialogDescription>
                Ingresa los detalles del mantenimiento realizado al árbol.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitMaintenance} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="maintenanceType" className="text-sm font-medium">
                  Tipo de Mantenimiento *
                </label>
                <select 
                  id="maintenanceType"
                  className="w-full p-2 border rounded-md"
                  value={newMaintenance.maintenanceType}
                  onChange={(e) => setNewMaintenance({...newMaintenance, maintenanceType: e.target.value})}
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="Poda">Poda</option>
                  <option value="Plantación">Plantación</option>
                  <option value="Riego">Riego</option>
                  <option value="Tratamiento Fitosanitario">Tratamiento Fitosanitario</option>
                  <option value="Reparación">Reparación</option>
                  <option value="Inspección">Inspección</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="maintenanceDate" className="text-sm font-medium">
                  Fecha de Mantenimiento *
                </label>
                <input 
                  type="date"
                  id="maintenanceDate"
                  className="w-full p-2 border rounded-md"
                  value={newMaintenance.maintenanceDate}
                  onChange={(e) => setNewMaintenance({...newMaintenance, maintenanceDate: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="performedBy" className="text-sm font-medium">
                  Realizado por
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    id="employeeSearch"
                    className="w-full p-2 border rounded-md"
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                      setShowEmployeeList(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowEmployeeList(employeeSearch.length > 0)}
                    placeholder="Buscar empleado por nombre, email o puesto..."
                  />
                  
                  {showEmployeeList && filteredEmployees.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredEmployees.map((employee: any) => (
                        <div
                          key={employee.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setEmployeeSearch(`${employee.firstName} ${employee.lastName}`);
                            setNewMaintenance({...newMaintenance, performedBy: employee.id.toString()});
                            setShowEmployeeList(false);
                          }}
                        >
                          <div className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.position} • {employee.email}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {selectedEmployee && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                      <div className="text-sm text-green-800">
                        <strong>Empleado seleccionado:</strong><br />
                        {selectedEmployee.firstName} {selectedEmployee.lastName} (ID: {selectedEmployee.id})
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notas
                </label>
                <textarea 
                  id="notes"
                  className="w-full p-2 border rounded-md"
                  value={newMaintenance.notes}
                  onChange={(e) => setNewMaintenance({...newMaintenance, notes: e.target.value})}
                  placeholder="Detalles adicionales del mantenimiento..."
                  rows={3}
                />
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={createMaintenanceMutation.isPending}
                >
                  {createMaintenanceMutation.isPending ? 'Registrando...' : 'Registrar Mantenimiento'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default TreeDetailPage;