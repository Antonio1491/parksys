import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Clock, 
  Wrench, 
  History,
  Tag,
  AlertTriangle,
  Check,
  Camera
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { AssetHistoryEntry as BaseAssetHistoryEntry } from '@shared/asset-schema';

import AdminLayout from '@/components/AdminLayout';
import AssetImageManager from '@/components/AssetImageManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
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
} from "@/components/ui/alert-dialog";
import { ASSET_CONDITIONS, ASSET_STATUSES, MAINTENANCE_TYPES } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
// REMOVED: import { logAssetUpdate } from '@/utils/assetHistoryHelpers';
// 🔒 SECURITY: History logging is now handled automatically server-side

// Función para formatear fechas
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  
  try {
    // Manejar diferentes formatos de fecha
    let date: Date;
    
    if (dateString.includes('T') || dateString.includes(' ')) {
      // Ya incluye tiempo
      date = new Date(dateString);
    } else {
      // Solo fecha, agregar tiempo para evitar problemas de zona horaria
      date = new Date(dateString + 'T00:00:00');
    }
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

// Función para formatear moneda
const formatCurrency = (value: number | null) => {
  if (value === null) return 'N/A';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value);
};

// Función para traducir estados de inglés a español
const translateStatus = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'active': 'Activo',
    'maintenance': 'Mantenimiento',
    'retired': 'Retirado',
    'damaged': 'Dañado',
    'storage': 'Almacenado'
  };
  return statusMap[status] || status;
};

// Función para traducir condiciones de inglés a español
const translateCondition = (condition: string) => {
  const conditionMap: { [key: string]: string } = {
    'excellent': 'Excelente',
    'good': 'Bueno',
    'fair': 'Regular',
    'poor': 'Malo',
    'critical': 'Crítico'
  };
  return conditionMap[condition] || condition;
};

// Interfaces para los datos
interface Asset {
  id: number;
  name: string;
  description: string | null;
  serialNumber: string | null;
  locationDescription: string | null;
  acquisitionDate: string | null;
  acquisitionCost: number | null;
  parkId: number;
  categoryId: number;
  status: string;
  condition: string;
  location: string | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  notes: string | null;
  responsiblePersonId: number | null;
  responsiblePerson?: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AssetMaintenance {
  id: number;
  assetId: number;
  date: string;
  maintenanceType: string;
  description: string;
  cost: number | null;
  performedBy: string | null;
  performerId: number | null;
  performer?: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  nextMaintenanceDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Using shared type from schema.ts with additional frontend fields
type ExtendedAssetHistoryEntry = BaseAssetHistoryEntry & {
  userName: string;
  userUsername: string;
};

// Obtener el color de la badge por estado
const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'activo':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'maintenance':
    case 'mantenimiento':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    case 'retired':
    case 'retirado':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    case 'storage':
    case 'almacenado':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
};

// Obtener el color de la badge por condición
const getConditionBadgeColor = (condition: string) => {
  switch (condition.toLowerCase()) {
    case 'excellent':
    case 'excelente':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'good':
    case 'bueno':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'fair':
    case 'regular':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    case 'poor':
    case 'malo':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
    case 'critical':
    case 'crítico':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
};

// Esquema de validación para actualizar activo
const assetUpdateSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  acquisitionDate: z.string().nullable().optional(),
  acquisitionCost: z.union([z.number().positive(), z.nan()]).transform(val => isNaN(val) ? null : val).nullable().optional(),
  parkId: z.number().min(1, 'El parque es obligatorio'),
  categoryId: z.number().min(1, 'La categoría es obligatoria'),
  status: z.string().min(1, 'El estado es obligatorio'),
  condition: z.string().min(1, 'La condición es obligatoria'),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// Esquema de validación para crear un mantenimiento
const maintenanceSchema = z.object({
  date: z.string().min(1, 'La fecha es obligatoria'),
  maintenanceType: z.string().min(1, 'El tipo de mantenimiento es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  cost: z.union([z.number().nonnegative(), z.nan()]).transform(val => isNaN(val) ? null : val).nullable().optional(),
  performedBy: z.string().nullable().optional(),
  nextMaintenanceDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  // Estado para almacenar los datos originales del activo antes de la edición
  const [originalAssetData, setOriginalAssetData] = useState<Asset | null>(null);
  
  // Consultar datos del activo
  const { data: asset, isLoading, isError } = useQuery<Asset>({
    queryKey: [`/api/assets/${id}`],
    enabled: !!id,
  });
  
  // Consultar categorías
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/asset-categories'],
  });
  
  // Consultar parques
  const { data: parks, isLoading: parksLoading } = useQuery({
    queryKey: ['/api/parks'],
  });
  
  // Consultar mantenimientos
  const { data: maintenances } = useQuery<AssetMaintenance[]>({
    queryKey: [`/api/assets/${id}/maintenances`],
    enabled: !!id,
  });
  
  // Consultar historial
  const { data: history } = useQuery<ExtendedAssetHistoryEntry[]>({
    queryKey: [`/api/assets/${id}/history`],
    enabled: !!id,
  });

  // Calcular fechas de mantenimiento basándose en los registros
  const lastMaintenanceDate = React.useMemo(() => {
    if (!maintenances || maintenances.length === 0) return null;
    
    const completedMaintenances = maintenances.filter(m => m.status === 'completed');
    if (completedMaintenances.length === 0) return null;
    
    const lastMaintenance = completedMaintenances
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    return lastMaintenance?.date || null;
  }, [maintenances]);

  const nextMaintenanceDate = React.useMemo(() => {
    if (!maintenances || maintenances.length === 0) return null;
    
    const maintenancesWithNext = maintenances.filter(m => m.nextMaintenanceDate);
    if (maintenancesWithNext.length === 0) return null;
    
    const nextMaintenance = maintenancesWithNext
      .sort((a, b) => new Date(a.nextMaintenanceDate!).getTime() - new Date(b.nextMaintenanceDate!).getTime())[0];
    
    return nextMaintenance?.nextMaintenanceDate || null;
  }, [maintenances]);

  // Calcular si el mantenimiento está vencido
  const isMaintenanceDue = nextMaintenanceDate 
    ? new Date(nextMaintenanceDate) < new Date() 
    : false;
  
  // Formulario para editar el activo
  const form = useForm<z.infer<typeof assetUpdateSchema>>({
    resolver: zodResolver(assetUpdateSchema),
    defaultValues: {
      name: '',
      description: '',
      serialNumber: '',
      acquisitionDate: '',
      acquisitionCost: null,
      parkId: 0,
      categoryId: 0,
      status: '',
      condition: '',
      location: '',
      notes: '',
    },
  });
  
  // Formulario para registrar mantenimiento
  const maintenanceForm = useForm<z.infer<typeof maintenanceSchema>>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      maintenanceType: '',
      description: '',
      cost: null,
      performedBy: '',
      nextMaintenanceDate: '',
      notes: '',
    },
  });
  
  // Mutación para actualizar activo
  const updateMutation = useMutation({
    mutationFn: (updatedAsset: z.infer<typeof assetUpdateSchema>) => {
      return apiRequest(`/api/assets/${id}`, 'PUT', updatedAsset);
    },
    onSuccess: async (response, updatedAssetData) => {
      // 🔒 SECURITY: History logging is now handled automatically server-side
      // Asset update history is automatically logged during server-side updates
      if (id) {
        // Invalidate history queries to refresh the history tab with new server-side entries
        queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}/history`] });
        console.log('✅ Asset updated with automatic server-side history logging');
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}`] });
      setIsEditDialogOpen(false);
      toast({
        title: "Activo actualizado",
        description: "El activo se ha actualizado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al actualizar el activo.",
        variant: "destructive",
      });
      console.error('Error al actualizar activo:', error);
    }
  });
  
  // Mutación para eliminar activo
  const deleteMutation = useMutation({
    mutationFn: () => {
      return apiRequest(`/api/assets/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: "Activo eliminado",
        description: "El activo se ha eliminado correctamente.",
      });
      setLocation('/admin/assets');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al eliminar el activo.",
        variant: "destructive",
      });
      console.error('Error al eliminar activo:', error);
    }
  });
  
  // Mutación para registrar mantenimiento
  const maintenanceMutation = useMutation({
    mutationFn: (maintenance: z.infer<typeof maintenanceSchema>) => {
      console.log('Enviando mantenimiento:', maintenance);
      return apiRequest(`/api/assets/${id}/maintenances`, { method: 'POST', data: maintenance });
    },
    onSuccess: (data) => {
      console.log('Mantenimiento creado exitosamente:', data);
      queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}/maintenances`] });
      queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}`] });
      setIsMaintenanceDialogOpen(false);
      maintenanceForm.reset({
        date: new Date().toISOString().split('T')[0],
        maintenanceType: '',
        description: '',
        cost: null,
        performedBy: '',
        nextMaintenanceDate: '',
        notes: '',
      });
      toast({
        title: "Mantenimiento registrado",
        description: "El mantenimiento se ha registrado correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error al registrar mantenimiento:', error);
      toast({
        title: "Error",
        description: `Ha ocurrido un error al registrar el mantenimiento: ${error.message || error}`,
        variant: "destructive",
      });
    }
  });
  
  // Función para volver a la lista de activos
  const handleBackToList = () => {
    setLocation('/admin/assets/inventory');
  };
  
  // Función para abrir el diálogo de edición
  const openEditDialog = () => {
    if (asset) {
      // Store original asset data for change detection
      setOriginalAssetData({ ...asset });
      
      form.reset({
        name: asset.name,
        description: asset.description,
        serialNumber: asset.serialNumber,
        acquisitionDate: asset.acquisitionDate,
        acquisitionCost: asset.acquisitionCost,
        parkId: asset.parkId,
        categoryId: asset.categoryId,
        status: asset.status,
        condition: asset.condition,
        location: asset.location,
        notes: asset.notes,
      });
      setIsEditDialogOpen(true);
    }
  };
  
  // Función para abrir el diálogo de mantenimiento
  const openMaintenanceDialog = () => {
    maintenanceForm.reset({
      date: new Date().toISOString().split('T')[0],
      maintenanceType: '',
      description: '',
      cost: null,
      performedBy: '',
      nextMaintenanceDate: '',
      notes: '',
    });
    setIsMaintenanceDialogOpen(true);
  };
  
  // Manejar envío del formulario de edición
  const handleEditSubmit = (values: z.infer<typeof assetUpdateSchema>) => {
    updateMutation.mutate(values);
  };
  
  // Manejar envío del formulario de mantenimiento
  const handleMaintenanceSubmit = (values: z.infer<typeof maintenanceSchema>) => {
    console.log('Datos del formulario de mantenimiento:', values);
    console.log('Estado del formulario:', maintenanceForm.formState.errors);
    maintenanceMutation.mutate(values);
  };
  

  
  // Obtener la categoría actual
  const currentCategory = React.useMemo(() => {
    if (!asset || !categories) return null;
    return categories.find((c: any) => c.id === asset.categoryId);
  }, [asset, categories]);
  
  // Obtener el parque actual
  const currentPark = React.useMemo(() => {
    if (!asset || !parks) return null;
    // Validación defensiva: verificar que parks sea un array
    const parksArray = Array.isArray(parks) ? parks : (parks?.data || []);
    return parksArray.find((p: any) => p.id === asset.parkId);
  }, [asset, parks]);
  
  return (
    <AdminLayout>
      <Helmet>
        <title>Detalle de Activo | Bosques Urbanos</title>
        <meta name="description" content="Información detallada y gestión del activo." />
      </Helmet>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleBackToList} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading ? <Skeleton className="h-9 w-64" /> : asset?.name || 'Detalle de Activo'}
            </h1>
            <div className="text-muted-foreground">
              {isLoading ? <Skeleton className="h-5 w-96 mt-1" /> : (
                <span>{`ID: ${asset?.id} • ${currentCategory?.name || 'Categoría sin especificar'}`}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={openMaintenanceDialog} variant="outline">
            <Wrench className="mr-2 h-4 w-4" />
            Registrar Mantenimiento
          </Button>
          <Button 
            onClick={() => window.location.href = `/admin/assets/${id}/edit-enhanced`} 
            variant="outline"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar este activo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El activo se eliminará permanentemente del sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteMutation.mutate()}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-center text-red-500 mb-4">
              <AlertTriangle className="h-16 w-16 mx-auto mb-2" />
              <h3 className="text-lg font-medium">Error al cargar los datos del activo</h3>
              <p>No se ha podido encontrar el activo o ha ocurrido un error en la carga.</p>
            </div>
            <Button onClick={handleBackToList}>
              Volver a la lista de activos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="maintenance">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Mantenimientos
                {maintenances && maintenances.length > 0 && (
                  <Badge className="ml-2">{maintenances.length}</Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="history">
              <div className="flex items-center">
                <History className="mr-2 h-4 w-4" />
                Historial
                {history && history.length > 0 && (
                  <Badge className="ml-2">{history.length}</Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="images">
              <div className="flex items-center">
                <Camera className="mr-2 h-4 w-4" />
                Imágenes
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <Skeleton key={index} className="h-6 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-500">Estado:</span>
                        <Badge className={getStatusBadgeColor(asset?.status || '')}>
                          {translateStatus(asset?.status || '')}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-500">Condición:</span>
                        <Badge className={getConditionBadgeColor(asset?.condition || '')}>
                          {translateCondition(asset?.condition || '')}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Categoría:</span>
                        <span>
                          {categoriesLoading ? (
                            <Skeleton className="h-4 w-32 inline-block" />
                          ) : (
                            currentCategory?.name || 'No especificada'
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Parque:</span>
                        <span>
                          {parksLoading ? (
                            <Skeleton className="h-4 w-32 inline-block" />
                          ) : (
                            currentPark?.name || 'No especificado'
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Responsable:</span>
                        <span>
                          {asset?.responsiblePerson ? 
                            `${asset.responsiblePerson.fullName} (${asset.responsiblePerson.role})` : 
                            'No asignado'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Ubicación:</span>
                        <span>{asset?.locationDescription || 'No especificada'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Número de Serie:</span>
                        <span>{asset?.serialNumber || 'No especificado'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Fecha de Adquisición:</span>
                        <span>{formatDate(asset?.acquisitionDate)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Costo de Adquisición:</span>
                        <span>{formatCurrency(asset?.acquisitionCost)}</span>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <span className="font-medium text-gray-500">Descripción:</span>
                        <p className="mt-1">{asset?.description || 'Sin descripción'}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-500">Notas:</span>
                        <p className="mt-1">{asset?.notes || 'Sin notas adicionales'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Estado de Mantenimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-6 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-500">Último Mantenimiento:</span>
                        <span>{formatDate(lastMaintenanceDate)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-500">Próximo Mantenimiento:</span>
                        <div className="flex items-center">
                          {isMaintenanceDue && (
                            <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                          )}
                          <span>{formatDate(nextMaintenanceDate)}</span>
                        </div>
                      </div>
                      
                      {isMaintenanceDue && (
                        <div className="bg-yellow-50 p-4 rounded-md text-yellow-800 mt-4">
                          <div className="flex">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            <div>
                              <h4 className="font-medium">Mantenimiento pendiente</h4>
                              <p className="text-sm">
                                Este activo tiene un mantenimiento programado que ya ha pasado la fecha prevista.
                              </p>
                              <Button 
                                className="mt-2" 
                                size="sm"
                                onClick={openMaintenanceDialog}
                              >
                                Registrar Mantenimiento
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!isMaintenanceDue && nextMaintenanceDate && (
                        <div className="bg-green-50 p-4 rounded-md text-green-800 mt-4">
                          <div className="flex">
                            <Check className="h-5 w-5 mr-2" />
                            <div>
                              <h4 className="font-medium">Mantenimiento al día</h4>
                              <p className="text-sm">
                                El próximo mantenimiento está programado para {formatDate(nextMaintenanceDate)}.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!lastMaintenanceDate && !nextMaintenanceDate && (
                        <div className="bg-blue-50 p-4 rounded-md text-blue-800 mt-4">
                          <div className="flex">
                            <Tag className="h-5 w-5 mr-2" />
                            <div>
                              <h4 className="font-medium">Sin historial de mantenimiento</h4>
                              <p className="text-sm">
                                Este activo no tiene registros de mantenimiento ni fechas programadas.
                              </p>
                              <Button 
                                className="mt-2" 
                                size="sm"
                                onClick={openMaintenanceDialog}
                              >
                                Programar Primer Mantenimiento
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="maintenance">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Historial de Mantenimientos</CardTitle>
                  <CardDescription>
                    Registro de todas las actividades de mantenimiento realizadas
                  </CardDescription>
                </div>
                <Button onClick={openMaintenanceDialog}>
                  Registrar Mantenimiento
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-24 w-full" />
                    ))}
                  </div>
                ) : !maintenances || maintenances.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>No hay registros de mantenimiento para este activo.</p>
                    <Button variant="outline" className="mt-4" onClick={openMaintenanceDialog}>
                      Registrar Primer Mantenimiento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {maintenances.map((maintenance) => (
                      <Card key={maintenance.id} className="mb-4 overflow-hidden">
                        <div className={`h-2 w-full ${
                          maintenance.maintenanceType === 'Preventivo' ? 'bg-blue-500' :
                          maintenance.maintenanceType === 'Correctivo' ? 'bg-yellow-500' :
                          maintenance.maintenanceType === 'Predictivo' ? 'bg-green-500' :
                          'bg-purple-500'
                        }`} />
                        <CardContent className="pt-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <h4 className="font-medium">{maintenance.maintenanceType}</h4>
                              <p className="text-muted-foreground text-sm">
                                Realizado el {formatDate(maintenance.date)}
                              </p>
                              {maintenance.performer ? (
                                <p className="text-muted-foreground text-sm flex items-center">
                                  Por: <span className="font-medium ml-1">{maintenance.performer.fullName}</span>
                                  <Badge className="ml-2" variant="outline" size="sm">
                                    {maintenance.performer.role}
                                  </Badge>
                                </p>
                              ) : maintenance.performedBy && (
                                <p className="text-muted-foreground text-sm">
                                  Por: {maintenance.performedBy}
                                </p>
                              )}
                            </div>
                            
                            <div className="md:col-span-2">
                              <p className="mb-3">{maintenance.description}</p>
                              
                              {maintenance.findings && (
                                <div className="mb-3">
                                  <span className="font-medium text-gray-700 block mb-1">Hallazgos:</span>
                                  <p className="text-gray-600 text-sm bg-gray-50 p-2 rounded">{maintenance.findings}</p>
                                </div>
                              )}
                              
                              {maintenance.actions && (
                                <div className="mb-3">
                                  <span className="font-medium text-gray-700 block mb-1">Acciones realizadas:</span>
                                  <p className="text-gray-600 text-sm bg-blue-50 p-2 rounded">{maintenance.actions}</p>
                                </div>
                              )}
                              
                              {maintenance.notes && (
                                <div className="mb-3">
                                  <span className="font-medium text-gray-700 block mb-1">Notas adicionales:</span>
                                  <p className="text-gray-600 text-sm bg-yellow-50 p-2 rounded">{maintenance.notes}</p>
                                </div>
                              )}
                              
                              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                                {maintenance.cost !== null && (
                                  <div className="flex items-center">
                                    <span className="font-medium text-gray-500">Costo:</span>
                                    <span className="ml-2 font-semibold text-green-600">{formatCurrency(maintenance.cost)}</span>
                                  </div>
                                )}
                                
                                {maintenance.status && (
                                  <div className="flex items-center">
                                    <span className="font-medium text-gray-500">Estado:</span>
                                    <Badge 
                                      className="ml-2" 
                                      variant={maintenance.status === 'completed' ? 'default' : maintenance.status === 'scheduled' ? 'secondary' : 'outline'}
                                    >
                                      {maintenance.status === 'completed' ? 'Completado' : 
                                       maintenance.status === 'scheduled' ? 'Programado' :
                                       maintenance.status === 'in_progress' ? 'En progreso' : maintenance.status}
                                    </Badge>
                                  </div>
                                )}
                                
                                {maintenance.nextMaintenanceDate && (
                                  <div className="flex items-center">
                                    <span className="font-medium text-gray-500">Próximo mantenimiento:</span>
                                    <span className="ml-2 font-medium text-blue-600">{formatDate(maintenance.nextMaintenanceDate)}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Información adicional de fechas */}
                              <div className="mt-4 pt-3 border-t text-xs text-gray-400 flex justify-between">
                                <span>Registrado: {formatDate(maintenance.createdAt)}</span>
                                {maintenance.createdAt !== maintenance.updatedAt && (
                                  <span>Actualizado: {formatDate(maintenance.updatedAt)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Cambios</CardTitle>
                <CardDescription>
                  Registro de todas las modificaciones y eventos relacionados con este activo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-32 w-full" />
                    ))}
                  </div>
                ) : !history || history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>No hay registros en el historial de este activo.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry) => {
                      const formatValue = (value: any) => {
                        if (value === null || value === undefined) return 'N/A';
                        if (typeof value === 'object') return JSON.stringify(value, null, 2);
                        return String(value);
                      };
                      
                      const getChangeTypeIcon = (changeType: string) => {
                        switch (changeType.toLowerCase()) {
                          case 'creation':
                          case 'acquisition':
                            return <Check className="h-4 w-4" />;
                          case 'updated':
                          case 'modification':
                            return <Edit className="h-4 w-4" />;
                          case 'maintenance':
                            return <Wrench className="h-4 w-4" />;
                          case 'retirement':
                          case 'deletion':
                            return <Trash2 className="h-4 w-4" />;
                          default:
                            return <History className="h-4 w-4" />;
                        }
                      };
                      
                      const getChangeTypeName = (changeType: string) => {
                        switch (changeType.toLowerCase()) {
                          case 'creation':
                            return 'Creación';
                          case 'acquisition':
                            return 'Adquisición';
                          case 'updated':
                            return 'Actualización';
                          case 'modification':
                            return 'Modificación';
                          case 'maintenance':
                            return 'Mantenimiento';
                          case 'retirement':
                            return 'Retiro';
                          case 'deletion':
                            return 'Eliminación';
                          default:
                            return changeType;
                        }
                      };
                      
                      const getChangeTypeColor = (changeType: string) => {
                        switch (changeType.toLowerCase()) {
                          case 'creation':
                          case 'acquisition':
                            return 'bg-green-500';
                          case 'updated':
                          case 'modification':
                            return 'bg-blue-500';
                          case 'maintenance':
                            return 'bg-yellow-500';
                          case 'retirement':
                          case 'deletion':
                            return 'bg-red-500';
                          default:
                            return 'bg-gray-500';
                        }
                      };

                      return (
                        <Card key={entry.id} className="overflow-hidden" data-testid={`history-entry-${entry.id}`}>
                          <div className={`h-2 w-full ${getChangeTypeColor(entry.changeType)}`} />
                          <CardContent className="pt-4">
                            <div className="space-y-4">
                              {/* Header with change type and timestamp */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className={`p-2 rounded-full ${
                                    entry.changeType.toLowerCase() === 'creation' || entry.changeType.toLowerCase() === 'acquisition' ? 'bg-green-100 text-green-600' :
                                    entry.changeType.toLowerCase() === 'updated' || entry.changeType.toLowerCase() === 'modification' ? 'bg-blue-100 text-blue-600' :
                                    entry.changeType.toLowerCase() === 'maintenance' ? 'bg-yellow-100 text-yellow-600' :
                                    entry.changeType.toLowerCase() === 'retirement' || entry.changeType.toLowerCase() === 'deletion' ? 'bg-red-100 text-red-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {getChangeTypeIcon(entry.changeType)}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-lg" data-testid={`change-type-${entry.id}`}>
                                      {getChangeTypeName(entry.changeType)}
                                    </h4>
                                    <p className="text-muted-foreground text-sm" data-testid={`timestamp-${entry.id}`}>
                                      {formatDate(entry.timestamp)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium" data-testid={`user-name-${entry.id}`}>
                                    {entry.userName}
                                  </p>
                                  <p className="text-xs text-muted-foreground" data-testid={`username-${entry.id}`}>
                                    @{entry.userUsername}
                                  </p>
                                </div>
                              </div>

                              {/* Description */}
                              <div>
                                <p className="text-gray-700" data-testid={`description-${entry.id}`}>
                                  {entry.description}
                                </p>
                              </div>

                              {/* Field changes */}
                              {entry.fieldName && (entry.previousValue !== null || entry.newValue !== null) && (
                                <div className="bg-slate-50 rounded-lg p-4" data-testid={`field-changes-${entry.id}`}>
                                  <h5 className="font-medium text-sm mb-3 text-slate-700">
                                    Campo modificado: <span className="font-semibold">{entry.fieldName}</span>
                                  </h5>
                                  
                                  <div className="grid gap-3 md:grid-cols-2">
                                    {entry.previousValue !== null && (
                                      <div>
                                        <span className="text-xs font-medium text-red-600 uppercase tracking-wide">
                                          Valor anterior
                                        </span>
                                        <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-sm">
                                          <pre className="whitespace-pre-wrap text-red-800" data-testid={`previous-value-${entry.id}`}>
                                            {formatValue(entry.previousValue)}
                                          </pre>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {entry.newValue !== null && (
                                      <div>
                                        <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                                          Valor nuevo
                                        </span>
                                        <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-sm">
                                          <pre className="whitespace-pre-wrap text-green-800" data-testid={`new-value-${entry.id}`}>
                                            {formatValue(entry.newValue)}
                                          </pre>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Notes */}
                              {entry.notes && (
                                <div className="bg-blue-50 rounded-lg p-3" data-testid={`notes-${entry.id}`}>
                                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                    Notas
                                  </span>
                                  <p className="mt-1 text-sm text-blue-800">{entry.notes}</p>
                                </div>
                              )}

                              {/* Entry ID for debugging */}
                              <div className="text-xs text-gray-400 pt-2 border-t">
                                ID del registro: {entry.id}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            {asset && (
              <AssetImageManager 
                assetId={asset.id} 
                assetName={asset.name}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Modal de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Activo</DialogTitle>
            <DialogDescription>
              Actualice la información del activo. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre*</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del activo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Serie</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Número de serie" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="parkId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parque*</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value?.toString()} 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un parque" />
                          </SelectTrigger>
                          <SelectContent>
                            {parks?.map((park: any) => (
                              <SelectItem key={park.id} value={park.id.toString()}>
                                {park.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría*</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value?.toString()} 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category: any) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado*</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {ASSET_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condición*</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una condición" />
                          </SelectTrigger>
                          <SelectContent>
                            {ASSET_CONDITIONS.map((condition) => (
                              <SelectItem key={condition} value={condition}>
                                {condition}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="acquisitionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Adquisición</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="acquisitionCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo de Adquisición</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Costo en pesos" 
                          {...field} 
                          value={field.value === null ? '' : field.value}
                          onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4 border p-4 rounded-md bg-slate-50">
                  <h3 className="font-medium text-sm">Ubicación y Geolocalización</h3>
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción de Ubicación</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: Cerca de la entrada principal" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe dónde se encuentra este activo dentro del parque
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitud</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: 19.432608" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Coordenada numérica (+ norte / - sur)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitud</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: -99.133209" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Coordenada numérica (+ este / - oeste)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descripción del activo" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notas adicionales" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Actualizando...' : 'Actualizar Activo'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Modal de mantenimiento */}
      <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Mantenimiento</DialogTitle>
            <DialogDescription>
              Complete el formulario para registrar un nuevo mantenimiento para este activo.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...maintenanceForm}>
            <form onSubmit={maintenanceForm.handleSubmit(handleMaintenanceSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={maintenanceForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={maintenanceForm.control}
                  name="maintenanceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Mantenimiento*</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {MAINTENANCE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={maintenanceForm.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Costo en pesos" 
                          {...field} 
                          value={field.value === null ? '' : field.value}
                          onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={maintenanceForm.control}
                  name="performedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Realizado por</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Persona o empresa" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={maintenanceForm.control}
                  name="nextMaintenanceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha del Próximo Mantenimiento</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={maintenanceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descripción del mantenimiento realizado" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={maintenanceForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Adicionales</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notas adicionales sobre el mantenimiento" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={maintenanceMutation.isPending}
                >
                  {maintenanceMutation.isPending ? 'Registrando...' : 'Registrar Mantenimiento'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AssetDetailPage;