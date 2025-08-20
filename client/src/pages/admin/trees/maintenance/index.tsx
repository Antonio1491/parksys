import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  PlusCircle, 
  Download,
  Upload,
  FileSpreadsheet,
  Grid3X3,
  List,
  Eye,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Filter,
  Wrench,
  TreePine,
  Info,
  MapPin,
  Leaf,
  Settings
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface TreeMaintenance {
  id: number;
  treeId: number;
  treeCode: string;
  speciesName: string;
  parkName: string;
  maintenanceType: string;
  maintenanceDate: string;
  performedBy: string;
  notes: string;
  urgency: string;
  estimatedCost: number;
  workHours: number;
  materialsUsed: string;
  weatherConditions: string;
  beforeCondition: string;
  afterCondition: string;
  followUpRequired: boolean;
  recommendations: string;
  nextMaintenanceDate: string;
  createdAt: string;
}

interface TreeOption {
  id: number;
  code: string;
  speciesName: string;
  parkName: string;
  healthStatus: string;
  plantingDate: string;
}

export default function TreeMaintenancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPark, setFilterPark] = useState('all');
  const [selectedParkId, setSelectedParkId] = useState<string>('all');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('all');
  const [selectedHealthStatus, setSelectedHealthStatus] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [selectedTreeId, setSelectedTreeId] = useState<number | null>(null);
  const [selectedTree, setSelectedTree] = useState<TreeOption | null>(null);
  const [maintenanceData, setMaintenanceData] = useState({
    maintenanceType: '',
    notes: '',
    performedBy: '',
    urgency: 'normal',
    estimatedCost: '',
    nextMaintenanceDate: '',
    maintenanceDate: new Date().toISOString().split('T')[0],
    materialsUsed: '',
    workHours: '',
    weatherConditions: '',
    beforeCondition: '',
    afterCondition: '',
    followUpRequired: false,
    recommendations: '',
  });

  // Estado para el campo de código del árbol
  const [treeCode, setTreeCode] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cargar datos de árboles para el selector
  const { data: treesResponse, isLoading: loadingTrees } = useQuery({
    queryKey: ['/api/trees'],
    retry: 1,
  });
  
  const trees = (treesResponse as any)?.data || [];

  // Cargar especies para filtros
  const { data: speciesResponse } = useQuery({
    queryKey: ['/api/tree-species'],
    retry: 1,
  });
  
  const species = (speciesResponse as any)?.data || [];

  // Estado para parques
  const [parks, setParks] = React.useState([]);
  const [loadingParks, setLoadingParks] = React.useState(true);

  // Cargar parques directamente con fetch
  React.useEffect(() => {
    const loadParks = async () => {
      try {
        setLoadingParks(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/parks', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        
        // Manejar tanto array directo como objeto con data
        const parksArray = Array.isArray(data) ? data : (data?.data || []);
        setParks(parksArray);
      } catch (error) {
        console.error('Error loading parks:', error);
        setParks([]);
      } finally {
        setLoadingParks(false);
      }
    };

    loadParks();
  }, []);

  // Reset estados cuando cambian los filtros
  React.useEffect(() => {
    setSelectedSpeciesId('all');
    setSelectedTreeId(null);
  }, [selectedParkId]);

  React.useEffect(() => {
    setSelectedHealthStatus('all');
    setSelectedTreeId(null);
  }, [selectedParkId, selectedSpeciesId]);



  // Cargar todos los mantenimientos
  const { data: maintenances, isLoading: loadingMaintenances } = useQuery({
    queryKey: ['/api/trees/maintenances'],
    select: (data: any) => data.data,
  });

  // Cargar estadísticas de mantenimiento
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/trees/maintenances/stats'],
    select: (data: any) => data || { total: 0, recent: 0, byType: [], byMonth: [] },
  });

  // Filtrar árboles según criterios seleccionados (máximo 50 resultados)
  const filteredTrees = useMemo(() => {
    if (!trees) return [];
    
    let filtered = [...trees];
    
    // Filtrar por parque
    if (selectedParkId !== 'all') {
      filtered = filtered.filter(tree => tree.parkId === parseInt(selectedParkId));
    }
    
    // Filtrar por especie
    if (selectedSpeciesId !== 'all') {
      filtered = filtered.filter(tree => tree.speciesId === parseInt(selectedSpeciesId));
    }
    
    // Filtrar por estado de salud
    if (selectedHealthStatus !== 'all') {
      filtered = filtered.filter(tree => tree.healthStatus === selectedHealthStatus);
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tree => 
        tree.code?.toLowerCase().includes(term) ||
        tree.speciesName?.toLowerCase().includes(term) ||
        tree.parkName?.toLowerCase().includes(term)
      );
    }
    
    // Limitar a 50 resultados para mejor rendimiento
    return filtered.slice(0, 50);
  }, [trees, selectedParkId, selectedSpeciesId, selectedHealthStatus, searchTerm]);

  // Función para obtener especies filtradas por parque
  const getSpeciesForPark = useMemo(() => {
    if (!trees || !species) return [];
    
    if (selectedParkId === 'all') {
      return species;
    }
    
    // Convertir selectedParkId a número para la comparación
    const parkIdNum = parseInt(selectedParkId);
    const parkTrees = trees.filter(tree => tree.parkId === parkIdNum);
    
    // Si no hay árboles en el parque, retornar todas las especies
    if (parkTrees.length === 0) {
      return species;
    }
    
    const speciesInPark = new Set(parkTrees.map(tree => tree.speciesId));
    const filteredSpecies = species.filter(sp => speciesInPark.has(sp.id));
    
    return filteredSpecies.length > 0 ? filteredSpecies : species;
  }, [trees, species, selectedParkId]);

  // Función para obtener árboles específicos para el formulario
  const getTreesForSelection = useMemo(() => {
    if (!trees) return [];
    
    let filteredTrees = trees;
    
    if (selectedParkId !== 'all') {
      filteredTrees = filteredTrees.filter(tree => tree.parkId === parseInt(selectedParkId));
    }
    
    if (selectedSpeciesId !== 'all') {
      filteredTrees = filteredTrees.filter(tree => tree.speciesId === parseInt(selectedSpeciesId));
    }
    
    // Filtrar por término de búsqueda (código del árbol)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredTrees = filteredTrees.filter(tree => 
        tree.code?.toLowerCase().includes(term) ||
        tree.speciesName?.toLowerCase().includes(term) ||
        tree.parkName?.toLowerCase().includes(term)
      );
    }
    
    return filteredTrees.slice(0, 50);
  }, [trees, selectedParkId, selectedSpeciesId, searchTerm]);

  // Log para diagnosticar problemas
  React.useEffect(() => {
    console.log('🌳 Estado del selector de árboles:', {
      selectedParkId,
      selectedSpeciesId,
      selectedTreeId,
      totalTrees: trees?.length || 0,
      filteredTrees: getTreesForSelection?.length || 0,
      searchTerm,
      getTreesForSelection: getTreesForSelection?.slice(0, 3).map(t => ({
        id: t.id,
        code: t.code,
        speciesName: t.speciesName,
        parkName: t.parkName
      }))
    });
  }, [selectedParkId, selectedSpeciesId, selectedTreeId, trees, getTreesForSelection, searchTerm]);

  // Función para buscar árbol por código y auto-completar campos
  const handleTreeCodeSearch = React.useCallback((code: string) => {
    if (!code || !trees) return;
    
    const foundTree = trees.find(tree => 
      tree.code?.toLowerCase() === code.toLowerCase().trim()
    );
    
    if (foundTree) {
      // Auto-completar los campos del formulario
      setSelectedParkId(foundTree.parkId.toString());
      setSelectedSpeciesId(foundTree.speciesId.toString());
      setSelectedTreeId(foundTree.id);
      setSelectedTree({
        id: foundTree.id,
        code: foundTree.code || '',
        speciesName: foundTree.speciesName || '',
        parkName: foundTree.parkName || '',
        healthStatus: foundTree.healthStatus || '',
        plantingDate: foundTree.plantingDate || ''
      });
      
      console.log('🎯 Árbol encontrado por código:', {
        code: foundTree.code,
        tree: foundTree,
        parkId: foundTree.parkId,
        speciesId: foundTree.speciesId
      });
    } else {
      // Limpiar selección si no se encuentra el árbol
      setSelectedTreeId(null);
      setSelectedTree(null);
    }
  }, [trees]);

  // Efecto para buscar por código cuando cambie el valor
  React.useEffect(() => {
    if (treeCode.trim()) {
      handleTreeCodeSearch(treeCode);
    }
  }, [treeCode, handleTreeCodeSearch]);

  // Filtrar mantenimientos según búsqueda, tipo y parque
  const filteredMaintenances = React.useMemo(() => {
    if (!maintenances) return [];
    
    let allMaintenances = [...maintenances];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      allMaintenances = allMaintenances.filter(maint => 
        maint.treeCode?.toLowerCase().includes(term) ||
        maint.parkName?.toLowerCase().includes(term) ||
        maint.speciesName?.toLowerCase().includes(term) ||
        maint.performedBy?.toLowerCase().includes(term)
      );
    }
    
    // Filtrar por tipo de mantenimiento
    if (filterType !== 'all') {
      allMaintenances = allMaintenances.filter(maint => 
        maint.maintenanceType === filterType
      );
    }
    
    // Filtrar por parque
    if (filterPark !== 'all') {
      allMaintenances = allMaintenances.filter(maint => 
        maint.parkName === filterPark
      );
    }
    
    return allMaintenances;
  }, [maintenances, searchTerm, filterType, filterPark]);

  // Estadísticas mejoradas calculadas localmente
  const enhancedStats = useMemo(() => {
    if (!maintenances || !trees) return { total: 0, coverage: 0, recent: 0 };
    
    const total = maintenances.length;
    const uniqueTreesWithMaintenance = new Set(maintenances.map(m => m.treeId)).size;
    const coverage = trees.length > 0 ? Math.round((uniqueTreesWithMaintenance / trees.length) * 100) : 0;
    
    // Mantenimientos recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = maintenances.filter(m => 
      new Date(m.maintenanceDate) >= thirtyDaysAgo
    ).length;
    
    return { total, coverage, recent };
  }, [maintenances, trees]);

  // Mutación para agregar nuevo mantenimiento
  const addMaintenanceMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🌳 Enviando datos de mantenimiento:', data);
      console.log('🎯 selectedTreeId:', selectedTreeId);
      
      const payload = {
        ...data,
        treeId: selectedTreeId
      };
      
      console.log('📦 Payload completo:', payload);
      
      const response = await fetch('/api/trees/maintenances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error en respuesta del servidor:', errorData);
        throw new Error(`Error ${response.status}: ${errorData}`);
      }
      
      const result = await response.json();
      console.log('✅ Mantenimiento creado exitosamente:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trees/maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trees/maintenances/stats'] });
      queryClient.invalidateQueries({ queryKey: [`/api/trees/${selectedTreeId}/maintenances`] });
      
      toast({
        title: "Mantenimiento registrado",
        description: "El registro de mantenimiento se ha guardado correctamente"
      });
      
      setOpen(false);
      setMaintenanceData({
        maintenanceType: '',
        notes: '',
        performedBy: '',
        urgency: 'normal',
        estimatedCost: '',
        nextMaintenanceDate: '',
        maintenanceDate: new Date().toISOString().split('T')[0],
        materialsUsed: '',
        workHours: '',
        weatherConditions: '',
        beforeCondition: '',
        afterCondition: '',
        followUpRequired: false,
        recommendations: '',
      });
      setSelectedTreeId(null);
      setSelectedTree(null);
      setTreeCode('');
      setSelectedParkId('all');
      setSelectedSpeciesId('all');
      setSelectedHealthStatus('all');
      setSearchTerm('');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error al registrar el mantenimiento",
        variant: "destructive",
      });
    }
  });

  // Función para resetear el formulario
  const resetForm = () => {
    setMaintenanceData({
      maintenanceType: '',
      notes: '',
      performedBy: '',
      urgency: 'normal',
      estimatedCost: '',
      nextMaintenanceDate: '',
      maintenanceDate: new Date().toISOString().split('T')[0],
      materialsUsed: '',
      workHours: '',
      weatherConditions: '',
      beforeCondition: '',
      afterCondition: '',
      followUpRequired: false,
      recommendations: '',
    });
    setSelectedTreeId(null);
    setSelectedTree(null);
    setTreeCode('');
    setSelectedParkId('all');
    setSelectedSpeciesId('all');
    setSelectedHealthStatus('all');
    setSearchTerm('');
  };

  // Resetear formulario al cerrar el modal
  const handleModalClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    setOpen(isOpen);
  };

  const handleAddMaintenance = () => {
    if (!selectedTreeId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un árbol",
        variant: "destructive",
      });
      return;
    }

    if (!maintenanceData.maintenanceType) {
      toast({
        title: "Error",
        description: "Debes seleccionar un tipo de mantenimiento",
        variant: "destructive",
      });
      return;
    }

    const newMaintenance = {
      ...maintenanceData,
      treeId: selectedTreeId,
      maintenanceDate: maintenanceData.maintenanceDate || new Date().toISOString().split('T')[0],
    };

    addMaintenanceMutation.mutate(newMaintenance);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <Card className="p-4 bg-gray-50 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Wrench className="w-8 h-8 text-gray-900" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mantenimiento de Árboles</h1>
                <p className="text-gray-600 mt-2">
                  Gestiona y registra las actividades de mantenimiento realizadas en árboles
                </p>
              </div>
            </div>
            <Button onClick={() => setOpen(true)} className="bg-green-600 hover:bg-green-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Registrar Mantenimiento
            </Button>
          </div>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Mantenimientos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <div className="text-2xl font-bold">{enhancedStats?.total || 0}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Mantenimientos Recientes</CardTitle>
              <CardDescription>Últimos 30 días</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <div className="text-2xl font-bold">{enhancedStats?.recent || 0}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cobertura de Mantenimiento</CardTitle>
              <CardDescription>Árboles con mantenimiento</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <div className="text-2xl font-bold">{enhancedStats?.coverage || 0}%</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tipo Más Común</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-7 w-32" />
              ) : (
                <div>
                  {stats?.byType && stats.byType.length > 0 ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                      {stats.byType[0].type}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sin datos</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
              <CardDescription>Árboles mantenidos</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats || loadingTrees ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {trees && stats ? Math.round((stats.total / trees.length) * 100) : 0}%
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filtros Avanzados */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros Avanzados para Selección de Árboles
            </CardTitle>
            <CardDescription>
              Máximo 50 resultados - Filtra por parque, especie y estado para encontrar árboles específicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="park-filter">Parque</Label>
                <Select
                  value={selectedParkId}
                  onValueChange={setSelectedParkId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un parque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los parques</SelectItem>
                    {loadingParks ? (
                      <SelectItem value="loading" disabled>Cargando...</SelectItem>
                    ) : (
                      parks?.map((park) => (
                        <SelectItem key={park.id} value={park.id.toString()}>
                          {park.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="species-filter">Especie</Label>
                <Select
                  value={selectedSpeciesId}
                  onValueChange={setSelectedSpeciesId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una especie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las especies</SelectItem>
                    {species?.map((specie) => (
                      <SelectItem key={specie.id} value={specie.id.toString()}>
                        {specie.commonName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="health-filter">Estado de Salud</Label>
                <Select
                  value={selectedHealthStatus}
                  onValueChange={setSelectedHealthStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="Excelente">Excelente</SelectItem>
                    <SelectItem value="Bueno">Bueno</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Malo">Malo</SelectItem>
                    <SelectItem value="Crítico">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="search-trees">Búsqueda</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Código o nombre..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>
                {filteredTrees.length} árboles encontrados
                {filteredTrees.length === 50 && " (límite alcanzado)"}
              </span>
            </div>
          </CardContent>
        </Card>



        {/* Selección de Árbol */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TreePine className="h-5 w-5" />
              Selección de Árbol para Mantenimiento
            </CardTitle>
            <CardDescription>
              Selecciona un árbol de la lista filtrada para programar mantenimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTree ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-800">Árbol Seleccionado</h3>
                    <p className="text-green-700">
                      <span className="font-medium">{selectedTree.code}</span> - {selectedTree.speciesName}
                    </p>
                    <p className="text-sm text-green-600">
                      {selectedTree.parkName} | Estado: {selectedTree.healthStatus}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedTree(null);
                      setSelectedTreeId(null);
                    }}
                  >
                    Cambiar Árbol
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Selecciona un árbol:</Label>
                <Select
                  value={selectedTreeId?.toString() || ""}
                  onValueChange={(value) => {
                    const treeId = parseInt(value);
                    setSelectedTreeId(treeId);
                    const tree = filteredTrees.find(t => t.id === treeId);
                    if (tree) {
                      setSelectedTree({
                        id: tree.id,
                        code: tree.code,
                        speciesName: tree.speciesName,
                        parkName: tree.parkName,
                        healthStatus: tree.healthStatus,
                        plantingDate: tree.plantingDate
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un árbol para mantenimiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTrees?.map((tree) => (
                      <SelectItem key={tree.id} value={tree.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{tree.code}</span>
                          <span className="text-sm text-muted-foreground">
                            {tree.speciesName} - {tree.parkName}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabla de mantenimientos */}
        <Card>
          <CardHeader>
            <CardTitle>Registros de Mantenimiento</CardTitle>
            <CardDescription>
              {filteredMaintenances?.length} {filteredMaintenances?.length === 1 ? 'registro' : 'registros'} de mantenimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMaintenances ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredMaintenances?.length === 0 ? (
              <div className="text-center py-6">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium">No hay registros de mantenimiento</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterType !== 'all' || filterPark !== 'all'
                    ? 'No se encontraron registros con los filtros aplicados'
                    : 'Registra el primer mantenimiento haciendo clic en "Registrar Mantenimiento"'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Parque</TableHead>
                      <TableHead>Especie</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Realizado por</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaintenances?.map((maintenance) => (
                      <TableRow key={maintenance.id}>
                        <TableCell className="font-medium">{maintenance.treeCode}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {maintenance.parkName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Leaf className="h-3 w-3 text-green-600" />
                            {maintenance.speciesName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {maintenance.maintenanceType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(maintenance.maintenanceDate), 'dd MMM yyyy', { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>{maintenance.performedByName || 'Usuario ' + maintenance.performedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Agregar Mantenimiento - Versión Avanzada */}
      <Dialog open={open} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-green-600" />
              Registrar Nuevo Mantenimiento
            </DialogTitle>
            <DialogDescription>
              Formulario completo para documentar actividades de mantenimiento de árboles
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="selection" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="selection">1. Selección de Árbol</TabsTrigger>
              <TabsTrigger value="maintenance">2. Detalles del Mantenimiento</TabsTrigger>
              <TabsTrigger value="additional">3. Información Adicional</TabsTrigger>
            </TabsList>
            
            <TabsContent value="selection" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TreePine className="h-5 w-5 text-green-600" />
                    Selección de Árbol
                  </CardTitle>
                  <CardDescription>
                    Ingresa el código del árbol o busca por filtros jerárquicos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Campo de código del árbol - PRIMER CAMPO */}
                  <div className="space-y-2">
                    <Label htmlFor="tree-code-input" className="text-base font-medium">
                      Código del Árbol
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="tree-code-input"
                        placeholder="Ingresa el código del árbol (ej: FRE-BOS-631, MEZ-PAR-616)..."
                        value={treeCode}
                        onChange={(e) => setTreeCode(e.target.value)}
                        className="pl-10 h-12 text-base"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Al ingresar un código válido, los campos de parque, especie y árbol se completarán automáticamente.
                    </p>
                    
                    {/* Información del árbol encontrado */}
                    {selectedTree && treeCode && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800">Árbol encontrado</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Código:</span> {selectedTree.code}
                          </div>
                          <div>
                            <span className="font-medium">Especie:</span> {selectedTree.speciesName}
                          </div>
                          <div>
                            <span className="font-medium">Parque:</span> {selectedTree.parkName}
                          </div>
                          <div>
                            <span className="font-medium">Estado:</span> 
                            <Badge variant="outline" className="ml-1">
                              {selectedTree.healthStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Mensaje cuando no se encuentra el árbol */}
                    {treeCode && !selectedTree && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium text-yellow-800">
                            No se encontró un árbol con el código "{treeCode}"
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          Verifica que el código sea correcto o usa los filtros para buscar manualmente.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Separador */}
                  <div className="flex items-center gap-4 my-6">
                    <Separator className="flex-1" />
                    <span className="text-sm text-muted-foreground font-medium">O busca por filtros</span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="form-park">Parque</Label>
                      <Select 
                        value={selectedParkId} 
                        onValueChange={(value) => {
                          setSelectedParkId(value);
                          setSelectedSpeciesId('all');
                          setSelectedTreeId(null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un parque" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los parques</SelectItem>
                          {loadingParks ? (
                            <SelectItem value="loading" disabled>Cargando...</SelectItem>
                          ) : (
                            parks?.map((park) => (
                              <SelectItem key={park.id} value={park.id.toString()}>
                                {park.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="form-species">Especie</Label>
                      <Select 
                        value={selectedSpeciesId} 
                        onValueChange={(value) => {
                          setSelectedSpeciesId(value);
                          setSelectedTreeId(null);
                        }}
                        disabled={selectedParkId === 'all'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedParkId === 'all' ? 'Selecciona primero un parque' : 'Selecciona una especie'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las especies</SelectItem>
                          {getSpeciesForPark?.map((spec) => (
                            <SelectItem key={spec.id} value={spec.id.toString()}>
                              {spec.commonName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tree-search">Buscar por Código de Árbol</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="tree-search"
                            placeholder="Buscar por código (ej: BSK-001, PAR-025)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {searchTerm && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearchTerm('')}
                            className="shrink-0"
                          >
                            Limpiar
                          </Button>
                        )}
                      </div>
                      {searchTerm && getTreesForSelection.length > 0 && (
                        <div className="p-2 bg-blue-50 rounded-md text-sm text-blue-700">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            <span>
                              Encontrados {getTreesForSelection.length} árboles que coinciden con "{searchTerm}"
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="form-tree">Árbol Específico</Label>
                      <Select 
                        value={selectedTreeId?.toString() || ""} 
                        onValueChange={(value) => setSelectedTreeId(Number(value))}
                        disabled={selectedParkId === 'all'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedParkId === 'all' ? 'Selecciona primero un parque' : 'Selecciona un árbol'} />
                        </SelectTrigger>
                        <SelectContent>
                          {getTreesForSelection?.length > 0 ? (
                            getTreesForSelection.filter(tree => tree.id && tree.code).map((tree) => (
                              <SelectItem key={tree.id} value={tree.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    {tree.code}
                                  </Badge>
                                  <span className="font-medium">{tree.speciesName || 'Especie desconocida'}</span>
                                  <span className="text-muted-foreground">({tree.healthStatus || 'N/A'})</span>
                                  <span className="text-xs text-blue-600">{tree.parkName || 'Parque desconocido'}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-trees" disabled>
                              {selectedParkId === 'all' ? 'Selecciona un parque específico' : 'No hay árboles disponibles'}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {selectedTreeId && (
                    <div className="p-4 bg-green-50 rounded-md border border-green-200">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Árbol seleccionado correctamente</span>
                      </div>
                      {(() => {
                        const selectedTreeData = trees?.find(tree => tree.id === selectedTreeId);
                        return selectedTreeData ? (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><strong>Código:</strong> {selectedTreeData.code}</div>
                            <div><strong>Especie:</strong> {selectedTreeData.speciesName}</div>
                            <div><strong>Parque:</strong> {selectedTreeData.parkName}</div>
                            <div><strong>Estado:</strong> {selectedTreeData.healthStatus}</div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="maintenance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Detalles del Mantenimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceType">Tipo de Mantenimiento *</Label>
                      <Select 
                        value={maintenanceData.maintenanceType}
                        onValueChange={(value) => setMaintenanceData({...maintenanceData, maintenanceType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Poda">🌿 Poda</SelectItem>
                          <SelectItem value="Riego">💧 Riego</SelectItem>
                          <SelectItem value="Fertilización">🌱 Fertilización</SelectItem>
                          <SelectItem value="Control de plagas">🐛 Control de plagas</SelectItem>
                          <SelectItem value="Tratamiento de enfermedades">🏥 Tratamiento de enfermedades</SelectItem>
                          <SelectItem value="Inspección">🔍 Inspección</SelectItem>
                          <SelectItem value="Limpieza">🧹 Limpieza</SelectItem>
                          <SelectItem value="Transplante">🌳 Transplante</SelectItem>
                          <SelectItem value="Otro">⚙️ Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="urgency">Urgencia</Label>
                      <Select 
                        value={maintenanceData.urgency}
                        onValueChange={(value) => setMaintenanceData({...maintenanceData, urgency: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">🟢 Baja</SelectItem>
                          <SelectItem value="normal">🟡 Normal</SelectItem>
                          <SelectItem value="high">🟠 Alta</SelectItem>
                          <SelectItem value="critical">🔴 Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceDate">Fecha de Mantenimiento *</Label>
                      <Input
                        id="maintenanceDate"
                        type="date"
                        value={maintenanceData.maintenanceDate}
                        onChange={(e) => setMaintenanceData({...maintenanceData, maintenanceDate: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="performedBy">Realizado por *</Label>
                      <Input 
                        id="performedBy" 
                        placeholder="Nombre del responsable"
                        value={maintenanceData.performedBy}
                        onChange={(e) => setMaintenanceData({...maintenanceData, performedBy: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="workHours">Horas de Trabajo</Label>
                      <Input 
                        id="workHours" 
                        type="number"
                        placeholder="Ej: 2.5"
                        value={maintenanceData.workHours}
                        onChange={(e) => setMaintenanceData({...maintenanceData, workHours: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="estimatedCost">Costo Estimado ($)</Label>
                      <Input 
                        id="estimatedCost" 
                        type="number"
                        placeholder="Ej: 500"
                        value={maintenanceData.estimatedCost}
                        onChange={(e) => setMaintenanceData({...maintenanceData, estimatedCost: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Descripción del Trabajo Realizado *</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Describe detalladamente el mantenimiento realizado..."
                      rows={3}
                      value={maintenanceData.notes}
                      onChange={(e) => setMaintenanceData({...maintenanceData, notes: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="materialsUsed">Materiales Utilizados</Label>
                    <Textarea 
                      id="materialsUsed" 
                      placeholder="Lista de materiales, herramientas y productos utilizados..."
                      rows={2}
                      value={maintenanceData.materialsUsed}
                      onChange={(e) => setMaintenanceData({...maintenanceData, materialsUsed: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="additional" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5 text-purple-600" />
                    Información Adicional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weatherConditions">Condiciones Climáticas</Label>
                      <Select 
                        value={maintenanceData.weatherConditions}
                        onValueChange={(value) => setMaintenanceData({...maintenanceData, weatherConditions: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona condiciones" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soleado">☀️ Soleado</SelectItem>
                          <SelectItem value="nublado">☁️ Nublado</SelectItem>
                          <SelectItem value="lluvia">🌧️ Lluvia</SelectItem>
                          <SelectItem value="viento">💨 Viento</SelectItem>
                          <SelectItem value="calor">🌡️ Calor extremo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nextMaintenanceDate">Próximo Mantenimiento</Label>
                      <Input
                        id="nextMaintenanceDate"
                        type="date"
                        value={maintenanceData.nextMaintenanceDate}
                        onChange={(e) => setMaintenanceData({...maintenanceData, nextMaintenanceDate: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="beforeCondition">Condición Antes del Mantenimiento</Label>
                    <Textarea 
                      id="beforeCondition" 
                      placeholder="Describe el estado del árbol antes del mantenimiento..."
                      rows={2}
                      value={maintenanceData.beforeCondition}
                      onChange={(e) => setMaintenanceData({...maintenanceData, beforeCondition: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="afterCondition">Condición Después del Mantenimiento</Label>
                    <Textarea 
                      id="afterCondition" 
                      placeholder="Describe el estado del árbol después del mantenimiento..."
                      rows={2}
                      value={maintenanceData.afterCondition}
                      onChange={(e) => setMaintenanceData({...maintenanceData, afterCondition: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recommendations">Recomendaciones</Label>
                    <Textarea 
                      id="recommendations" 
                      placeholder="Recomendaciones para futuros mantenimientos..."
                      rows={2}
                      value={maintenanceData.recommendations}
                      onChange={(e) => setMaintenanceData({...maintenanceData, recommendations: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="followUpRequired"
                      checked={maintenanceData.followUpRequired}
                      onCheckedChange={(checked) => setMaintenanceData({...maintenanceData, followUpRequired: checked})}
                    />
                    <Label htmlFor="followUpRequired" className="text-sm">
                      Requiere seguimiento adicional
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <Separator />
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddMaintenance}
              disabled={addMaintenanceMutation.isPending || !selectedTreeId || !maintenanceData.maintenanceType || !maintenanceData.performedBy}
              className="bg-green-600 hover:bg-green-700"
            >
              {addMaintenanceMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Registrar Mantenimiento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}