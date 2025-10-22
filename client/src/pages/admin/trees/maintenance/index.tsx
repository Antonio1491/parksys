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
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Estados para modales de acciones
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);
  
  // Estados para importar/exportar CSV
  const [importModal, setImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cargar datos de árboles para el selector
  const { data: treesResponse, isLoading: loadingTrees } = useQuery({
    queryKey: ['/api/trees'],
    retry: 1,
  });
  
  const trees = (treesResponse as any)?.data || [];

  // Cargar especies para filtros - solicitar todas las especies
  const { data: speciesResponse } = useQuery({
    queryKey: ['/api/tree-species'],
    queryFn: async () => {
      const response = await fetch('/api/tree-species?limit=100'); // Solicitar hasta 100 especies
      if (!response.ok) {
        throw new Error('Error al cargar las especies arbóreas');
      }
      return response.json();
    },
    retry: 1,
  });
  
  const species = speciesResponse?.data || [];

  // Cargar parques usando useQuery
  const { data: parksResponse, isLoading: loadingParks } = useQuery({
    queryKey: ['/api/parks'],
    queryFn: async () => {
      const response = await fetch('/api/parks');
      if (!response.ok) {
        throw new Error('Error al cargar los parques');
      }
      return response.json();
    },
    retry: 1,
  });

  // Manejar formato de respuesta variable (array directo o {data: array})
  const parks = Array.isArray(parksResponse) 
    ? parksResponse 
    : (parksResponse?.data || []);

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

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterPark]);

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
      // Convert string numbers to actual numbers for API
      estimatedCost: maintenanceData.estimatedCost ? parseFloat(maintenanceData.estimatedCost) : 0,
      workHours: maintenanceData.workHours ? parseFloat(maintenanceData.workHours) : 0
    };

    addMaintenanceMutation.mutate(newMaintenance);
  };

  // Funciones de paginación
  const paginatedMaintenances = useMemo(() => {
    if (!filteredMaintenances) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMaintenances.slice(startIndex, endIndex);
  }, [filteredMaintenances, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((filteredMaintenances?.length || 0) / itemsPerPage);

  // Guard against currentPage being greater than totalPages
  React.useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Funciones para acciones
  const handleView = (maintenance: any) => {
    setSelectedMaintenance(maintenance);
    setViewModal(true);
  };

  const handleEdit = (maintenance: any) => {
    setSelectedMaintenance(maintenance);
    setMaintenanceData({
      maintenanceType: maintenance.maintenanceType,
      notes: maintenance.notes,
      performedBy: maintenance.performedBy,
      urgency: 'normal',
      estimatedCost: '',
      nextMaintenanceDate: maintenance.nextMaintenanceDate || '',
      maintenanceDate: maintenance.maintenanceDate,
      materialsUsed: '',
      workHours: '',
      weatherConditions: '',
      beforeCondition: '',
      afterCondition: '',
      followUpRequired: false,
      recommendations: '',
    });
    setEditModal(true);
  };

  const handleDelete = (maintenance: any) => {
    setSelectedMaintenance(maintenance);
    setDeleteModal(true);
  };

  // Función para borrar mantenimiento
  const deleteMaintenanceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/trees/maintenances/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Error al eliminar el mantenimiento');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trees/maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trees/maintenances/stats'] });
      toast({
        title: "✅ Mantenimiento eliminado",
        description: "El registro de mantenimiento ha sido eliminado exitosamente.",
      });
      setDeleteModal(false);
      setSelectedMaintenance(null);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al eliminar",
        description: error.message || "No se pudo eliminar el mantenimiento.",
        variant: "destructive",
      });
    },
  });

  // Función para exportar CSV
  const exportToCSV = async () => {
    if (!filteredMaintenances || filteredMaintenances.length === 0) {
      toast({
        title: "⚠️ Sin datos",
        description: "No hay registros para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Remove headers since Papa.unparse with header: true will generate them automatically

    const csvData = filteredMaintenances.map(maintenance => ({
      codigo_arbol: maintenance.treeCode || '',
      parque: maintenance.parkName || '',
      especie: maintenance.speciesName || '',
      tipo_mantenimiento: maintenance.maintenanceType || '',
      fecha_mantenimiento: maintenance.maintenanceDate || '',
      realizado_por: maintenance.performedBy || '',
      notas: maintenance.notes || '',
      fecha_proximo_mantenimiento: maintenance.nextMaintenanceDate || ''
    }));

    // Use Papa.unparse for proper CSV generation with escaping
    const Papa = (await import('papaparse')).default;
    const csvContent = Papa.unparse(csvData, {
      delimiter: ',',
      header: true,
      quotes: true
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mantenimientos_arboles_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "📊 Exportación exitosa",
      description: `Se exportaron ${filteredMaintenances.length} registros a CSV.`,
    });
  };

  // Función para descargar plantilla CSV
  const downloadTemplate = async () => {
    const templateData = [{
      codigo_arbol: 'AHU-CHA-001',
      tipo_mantenimiento: 'Poda',
      fecha_mantenimiento: '2025-09-13',
      realizado_por: 'Juan Pérez',
      notas: 'Trabajo realizado correctamente',
      fecha_proximo_mantenimiento: '2025-12-13'
    }];

    // Use Papa.unparse for proper CSV template generation
    const Papa = (await import('papaparse')).default;
    const csvContent = Papa.unparse(templateData, {
      delimiter: ',',
      header: true,
      quotes: true
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_mantenimientos_arboles.csv';
    link.click();

    toast({
      title: "📄 Plantilla descargada",
      description: "Plantilla CSV descargada exitosamente.",
    });
  };

  // Función para importar CSV
  const handleImportCSV = async () => {
    if (!csvFile) {
      toast({
        title: "⚠️ Sin archivo",
        description: "Por favor selecciona un archivo CSV.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      const text = await csvFile.text();
      const Papa = (await import('papaparse')).default;
      
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (result.errors.length > 0) {
        throw new Error('Error al parsear el archivo CSV');
      }

      const validData = [];
      for (const row of result.data as any[]) {
        if (!row.codigo_arbol || !row.tipo_mantenimiento || !row.fecha_mantenimiento || !row.realizado_por) {
          continue;
        }

        // Buscar el árbol por código
        const tree = trees.find((t: any) => t.code === row.codigo_arbol);
        if (!tree) {
          toast({
            title: "⚠️ Árbol no encontrado",
            description: `No se encontró el árbol con código: ${row.codigo_arbol}`,
            variant: "destructive",
          });
          continue;
        }

        validData.push({
          treeId: tree.id,
          maintenanceType: row.tipo_mantenimiento,
          maintenanceDate: row.fecha_mantenimiento,
          performedBy: row.realizado_por,
          notes: row.notas || '',
          nextMaintenanceDate: row.fecha_proximo_mantenimiento || '',
        });
      }

      if (validData.length === 0) {
        throw new Error('No se encontraron datos válidos para importar');
      }

      // Importar los datos
      const response = await fetch('/api/trees/maintenances/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maintenances: validData }),
      });

      if (!response.ok) {
        throw new Error('Error al importar los datos');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/trees/maintenances'] });
      toast({
        title: "📥 Importación exitosa",
        description: `Se importaron ${validData.length} registros de mantenimiento.`,
      });

      setImportModal(false);
      setCsvFile(null);
    } catch (error: any) {
      toast({
        title: "❌ Error en importación",
        description: error.message || "Error al importar el archivo CSV.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <Card className="p-4 bg-gray-50 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Wrench className="w-8 h-8 text-gray-900" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mantenimiento</h1>
                <p className="text-gray-600 mt-2">
                  Gestiona y registra las actividades de mantenimiento realizadas en árboles
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setOpen(true)} 
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-register-maintenance"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Registrar Mantenimiento
            </Button>
          </div>
        </Card>


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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Registros de Mantenimiento</CardTitle>
                <CardDescription>
                  {filteredMaintenances?.length} {filteredMaintenances?.length === 1 ? 'registro' : 'registros'} de mantenimiento
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadTemplate}
                  data-testid="button-download-template"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Plantilla
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToCSV}
                  disabled={!filteredMaintenances || filteredMaintenances.length === 0}
                  data-testid="button-export-csv"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setImportModal(true)}
                  data-testid="button-import-csv"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar CSV
                </Button>
              </div>
            </div>
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
              <div className="space-y-4">
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
                        <TableHead className="w-[120px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMaintenances?.map((maintenance) => (
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
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(maintenance)}
                                className="h-8 w-8"
                                data-testid={`button-view-maintenance-${maintenance.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(maintenance)}
                                className="h-8 w-8"
                                data-testid={`button-edit-maintenance-${maintenance.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(maintenance)}
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                data-testid={`button-delete-maintenance-${maintenance.id}`}
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
                
                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredMaintenances?.length || 0)} de {filteredMaintenances?.length || 0} registros
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
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
                      onCheckedChange={(checked) => setMaintenanceData({...maintenanceData, followUpRequired: Boolean(checked)})}
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

      {/* Modal para Visualizar Mantenimiento */}
      <Dialog open={viewModal} onOpenChange={setViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Detalles del Mantenimiento
            </DialogTitle>
          </DialogHeader>
          
          {selectedMaintenance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Código del Árbol</Label>
                  <p className="text-sm font-medium">{selectedMaintenance.treeCode}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Parque</Label>
                  <p className="text-sm">{selectedMaintenance.parkName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Especie</Label>
                  <p className="text-sm">{selectedMaintenance.speciesName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tipo de Mantenimiento</Label>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {selectedMaintenance.maintenanceType}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha</Label>
                  <p className="text-sm">{format(new Date(selectedMaintenance.maintenanceDate), 'dd MMM yyyy', { locale: es })}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Realizado por</Label>
                  <p className="text-sm">{selectedMaintenance.performedByName || selectedMaintenance.performedBy}</p>
                </div>
              </div>
              
              {selectedMaintenance.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
                  <p className="text-sm mt-1">{selectedMaintenance.description}</p>
                </div>
              )}
              
              {selectedMaintenance.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notas</Label>
                  <p className="text-sm mt-1">{selectedMaintenance.notes}</p>
                </div>
              )}
              
              {selectedMaintenance.nextMaintenanceDate && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Próximo Mantenimiento</Label>
                  <p className="text-sm mt-1">{format(new Date(selectedMaintenance.nextMaintenanceDate), 'dd MMM yyyy', { locale: es })}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Mantenimiento */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Editar Mantenimiento
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipo de Mantenimiento</Label>
                <Select
                  value={maintenanceData.maintenanceType}
                  onValueChange={(value) => setMaintenanceData({...maintenanceData, maintenanceType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Poda">🌿 Poda</SelectItem>
                    <SelectItem value="Fertilización">🌱 Fertilización</SelectItem>
                    <SelectItem value="Riego">💧 Riego</SelectItem>
                    <SelectItem value="Fumigación">🚿 Fumigación</SelectItem>
                    <SelectItem value="Inspección">🔍 Inspección</SelectItem>
                    <SelectItem value="Limpieza">🧹 Limpieza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-date">Fecha de Mantenimiento</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={maintenanceData.maintenanceDate}
                  onChange={(e) => setMaintenanceData({...maintenanceData, maintenanceDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-performed-by">Realizado por</Label>
              <Input
                id="edit-performed-by"
                placeholder="Nombre de la persona que realizó el mantenimiento"
                value={maintenanceData.performedBy}
                onChange={(e) => setMaintenanceData({...maintenanceData, performedBy: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                placeholder="Detalles del mantenimiento realizado..."
                rows={3}
                value={maintenanceData.notes}
                onChange={(e) => setMaintenanceData({...maintenanceData, notes: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                // TODO: Implementar lógica de actualización
                setEditModal(false);
                toast({
                  title: "✅ Funcionalidad pendiente",
                  description: "La edición de mantenimientos se implementará en la siguiente fase.",
                });
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Confirmar Borrado */}
      <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este registro de mantenimiento? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMaintenance && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm"><span className="font-medium">Árbol:</span> {selectedMaintenance.treeCode}</p>
              <p className="text-sm"><span className="font-medium">Tipo:</span> {selectedMaintenance.maintenanceType}</p>
              <p className="text-sm"><span className="font-medium">Fecha:</span> {format(new Date(selectedMaintenance.maintenanceDate), 'dd MMM yyyy', { locale: es })}</p>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedMaintenance && deleteMaintenanceMutation.mutate(selectedMaintenance.id)}
              disabled={deleteMaintenanceMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMaintenanceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Importar CSV */}
      <Dialog open={importModal} onOpenChange={setImportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              Importar Registros de Mantenimiento
            </DialogTitle>
            <DialogDescription>
              Importa múltiples registros de mantenimiento desde un archivo CSV
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Instrucciones:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Descarga la plantilla CSV haciendo clic en el botón "Plantilla"</li>
                <li>2. Completa la plantilla con los datos de mantenimiento</li>
                <li>3. Asegúrate de que los códigos de árbol existan en el sistema</li>
                <li>4. Selecciona el archivo CSV completado y haz clic en "Importar"</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="csv-file">Archivo CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
            </div>
            
            {csvFile && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-medium">Archivo seleccionado:</span> {csvFile.name}
                </p>
                <p className="text-xs text-green-600">
                  Tamaño: {(csvFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setImportModal(false);
              setCsvFile(null);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImportCSV}
              disabled={!csvFile || importing}
              className="bg-green-600 hover:bg-green-700"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar CSV
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}