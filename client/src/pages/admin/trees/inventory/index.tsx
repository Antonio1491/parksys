import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import ROUTES from '@/routes';
import { Helmet } from 'react-helmet';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Filter, 
  MapPin, 
  Eye, 
  TreeDeciduous, 
  CircleCheck, 
  CircleAlert, 
  Info,
  Brush,
  Trash2,
  Loader2,
  Download,
  Upload,
  FileSpreadsheet,
  CopyCheck,
  CheckSquare,
  Square
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

// Tipos para los árboles del inventario
interface TreeInventory {
  id: number;
  code: string;
  speciesId: number;
  speciesName: string;
  scientificName: string;
  parkId: number;
  parkName: string;
  latitude: string;
  longitude: string;
  plantingDate: string | null;
  developmentStage: string | null;
  ageEstimate: number | null;
  height: number | null;
  diameter: number | null;
  canopyCoverage: number | null;
  healthStatus: string;
  imageUrl: string | null;
  lastInspectionDate: string | null;
}

function TreeInventoryPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [parkFilter, setParkFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTrees, setSelectedTrees] = useState<Set<number>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Consultar los parques para el filtro
  const { data: parksResponse, isLoading: isLoadingParks } = useQuery({
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
  
  const parks = parksResponse?.data || [];

  // Consultar las especies para el filtro - solicitar todas las especies sin paginación
  const { data: speciesResponse, isLoading: isLoadingSpecies } = useQuery({
    queryKey: ['/api/tree-species'],
    queryFn: async () => {
      const response = await fetch('/api/tree-species?limit=100'); // Solicitar hasta 100 especies para cubrir todas
      if (!response.ok) {
        throw new Error('Error al cargar las especies arbóreas');
      }
      return response.json();
    },
    retry: 1,
  });
  
  const species = speciesResponse?.data || [];

  // Consultar el inventario de árboles con paginación de 10 registros por página
  const {
    data: treeInventory,
    isLoading: isLoadingTrees,
    error,
  } = useQuery({
    queryKey: ['/api/trees', page, searchTerm, parkFilter, healthFilter, speciesFilter],
    queryFn: async () => {
      let url = `/api/trees?page=${page}&limit=10`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (parkFilter !== 'all') {
        url += `&parkId=${parkFilter}`;
      }
      
      if (healthFilter !== 'all') {
        url += `&healthStatus=${healthFilter}`;
      }
      
      if (speciesFilter !== 'all') {
        url += `&speciesId=${speciesFilter}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al cargar el inventario de árboles');
      }
      
      return response.json();
    },
    retry: 1,
  });

  // Usamos useEffect para evitar re-renders infinitos al mostrar el toast
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el inventario de árboles. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleAddTree = () => {
    setLocation(ROUTES.admin.trees.create);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setParkFilter('all');
    setHealthFilter('all');
    setSpeciesFilter('all');
  };

  // Mutación para limpiar el inventario de árboles
  const clearInventoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/trees/delete-all', {
        method: 'DELETE',
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Inventario limpiado",
        description: response.message || "Todos los árboles han sido eliminados del inventario",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trees'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al limpiar inventario",
        description: error.message || "No se pudieron eliminar todos los árboles",
        variant: "destructive",
      });
    },
  });

  // Manejar limpiado del inventario
  const handleClearInventory = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar TODOS los árboles del inventario?\n\nEsta acción eliminará todos los registros de árboles y sus mantenimientos asociados.\n\nEsta acción no se puede deshacer.')) {
      clearInventoryMutation.mutate();
    }
  };

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (treeIds: number[]) => {
      return apiRequest('/api/trees/bulk-delete', {
        method: 'POST',
        data: { treeIds },
      });
    },
    onSuccess: () => {
      toast({
        title: "Árboles eliminados",
        description: `Se eliminaron ${selectedTrees.size} árbol(es) exitosamente.`,
      });
      setShowBulkDeleteDialog(false);
      setSelectedTrees(new Set());
      setSelectionMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/trees'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron eliminar los árboles seleccionados.",
        variant: "destructive",
      });
    },
  });

  // Selection handlers
  const handleSelectTree = (treeId: number, checked: boolean) => {
    const newSelected = new Set(selectedTrees);
    if (checked) {
      newSelected.add(treeId);
    } else {
      newSelected.delete(treeId);
    }
    setSelectedTrees(newSelected);
  };

  const handleSelectAllTrees = () => {
    if (treeInventory && treeInventory.data) {
      const allTreeIds = new Set(treeInventory.data.map((tree: TreeInventory) => tree.id));
      setSelectedTrees(allTreeIds);
    }
  };

  const handleDeselectAllTrees = () => {
    setSelectedTrees(new Set());
  };

  const handleBulkDeleteClick = () => {
    if (selectedTrees.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const handleBulkDeleteConfirm = () => {
    const treeIds = Array.from(selectedTrees);
    bulkDeleteMutation.mutate(treeIds);
  };

  // Función para exportar CSV
  const handleExportCsv = async () => {
    try {
      // Construir URL con filtros actuales
      let url = '/api/trees/export-csv?';
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (parkFilter !== 'all') params.append('parkId', parkFilter);
      if (healthFilter !== 'all') params.append('healthStatus', healthFilter);
      if (speciesFilter !== 'all') params.append('speciesId', speciesFilter);
      
      url += params.toString();
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('directToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al exportar CSV');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const today = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      link.download = `inventario_arboles_${today}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Exportación exitosa",
        description: "El archivo CSV ha sido descargado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar el archivo CSV",
        variant: "destructive",
      });
    }
  };

  // Función para descargar plantilla CSV
  const handleDownloadTemplate = () => {
    const headers = [
      'codigo',
      'especie_id',
      'parque_id',
      'latitud',
      'longitud',
      'fecha_plantacion',
      'etapa_desarrollo',
      'edad_estimada',
      'altura',
      'diametro',
      'cobertura_copa',
      'estado_salud',
      'condicion',
      'tiene_huecos',
      'tiene_raices_expuestas',
      'tiene_plagas',
      'esta_protegido',
      'url_imagen',
      'descripcion_ubicacion',
      'observaciones'
    ];
    
    const examples = [
      [
        'AHU-CHA-001',
        '1',
        '90',
        '19.4200',
        '-99.1300',
        '2020-03-15',
        'Maduro',
        '25',
        '12.5',
        '65.8',
        '8.2',
        'Bueno',
        'Excelente',
        'no',
        'no',
        'no',
        '2024-11-15',
        'sí',
        'https://ejemplo.com/ahuehuete.jpg',
        'Entrada principal del Bosque de Chapultepec',
        'Árbol emblemático, patrimonio histórico nacional'
      ],
      [
        'JAC-PAR-002',
        '2',
        '91',
        '19.4210',
        '-99.1320',
        '2021-04-20',
        'Juvenil',
        '4',
        '5.8',
        '22.5',
        '4.1',
        'Regular',
        'Bueno',
        'no',
        'sí',
        'no',
        '2024-10-10',
        'no',
        'https://ejemplo.com/jacaranda.jpg',
        'Área recreativa, cerca de juegos infantiles',
        'Floración abundante en primavera, requiere poda menor'
      ]
    ];
    
    const csvContent = [
      headers.join(','),
      ...examples.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_inventario_arboles.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Función para procesar archivo CSV
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Error en el archivo",
          description: "El archivo CSV debe tener al menos una fila de datos",
          variant: "destructive",
        });
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const requiredHeaders = ['codigo', 'especie_id', 'parque_id', 'estado_salud'];
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        toast({
          title: "Error en formato CSV",
          description: `Faltan columnas requeridas: ${missingHeaders.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
      
      const data = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      
      setCsvPreview(data);
      setIsImportDialogOpen(true);
    };
    
    reader.readAsText(file);
  };

  // Mutación para importar CSV
  const importCsvMutation = useMutation({
    mutationFn: async (csvData: any[]) => {
      return apiRequest('/api/trees/import-csv', {
        method: 'POST',
        data: { trees: csvData },
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Importación exitosa",
        description: response.message || "Los árboles han sido importados correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trees'] });
      setIsImportDialogOpen(false);
      setCsvPreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error al importar",
        description: error.message || "No se pudieron importar los árboles",
        variant: "destructive",
      });
    },
  });

  // Confirmar importación
  const handleConfirmImport = () => {
    importCsvMutation.mutate(csvPreview);
  };

  const handleViewDetails = (id: number) => {
    setLocation(ROUTES.admin.trees.view.build(id));
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1); // Resetear a la primera página
  };

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, parkFilter, healthFilter, speciesFilter]);

  const getHealthStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'bueno':
        return (
          <Badge variant="outline" className="bg-[#75cc81] text-white">
            <CircleCheck className="h-3 w-3 mr-1" /> Bueno
          </Badge>
        );
      case 'regular':
        return (
          <Badge variant="outline" className="bg-[#e5b76e] text-white">
            <Info className="h-3 w-3 mr-1" /> Regular
          </Badge>
        );
      case 'malo':
        return (
          <Badge variant="outline" className="bg-[#e29696] text-white">
            <CircleAlert className="h-3 w-3 mr-1" /> Malo
          </Badge>
        );
      case 'crítico':
        return (
          <Badge variant="outline">
            <CircleAlert className="bg-[#af5252] text-white" /> Crítico
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

  // Formatear la fecha para mostrarla en español
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No disponible';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  // Determinar si hay datos para mostrar
  const hasData = treeInventory && treeInventory.data && treeInventory.data.length > 0;
  const totalPages = treeInventory?.pagination?.totalPages || 1;
  const totalRecords = treeInventory?.pagination?.total || 0;
  
  // Debugging: mostrar información en consola
  React.useEffect(() => {
    if (treeInventory) {
      console.log('Tree inventory response:', {
        hasData,
        dataLength: treeInventory.data?.length,
        totalPages,
        totalRecords,
        currentPage: page,
        pagination: treeInventory.pagination
      });
    }
  }, [treeInventory, hasData, totalPages, totalRecords, page]);

  return (
    <AdminLayout>
      <div className="space-y-6">
      <PageHeader
        title="Inventario de Árboles"
        subtitle="Gestión y seguimiento de árboles individuales en los parques"
        icon={<TreeDeciduous className="h-6 w-6 text-white" />}
        actions={[
          <Button 
            key="new"
            variant="primary"
            onClick={handleAddTree}
          >
            <Plus className="mr-2 h-4 w-4" /> Nuevo
          </Button>,

          <Dialog key="import" open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button
                key="import"
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" /> Importar
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Importar Árboles desde CSV</DialogTitle>
                <DialogDescription>
                  {csvPreview.length > 0 
                    ? "Vista previa de los primeros 5 registros. Confirma para importar todos los datos."
                    : "Selecciona un archivo CSV para importar árboles o descarga la plantilla para ver el formato requerido."
                  }
                </DialogDescription>
              </DialogHeader>

              {csvPreview.length === 0 && (
                <div className="flex flex-col space-y-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      ¿Primera vez importando árboles? Descarga la plantilla con ejemplos para ver el formato correcto.
                    </p>
                    <Button
                      onClick={handleDownloadTemplate}
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Download className="mr-2 h-4 w-4" /> Descargar Plantilla CSV
                    </Button>
                  </div>
                  <div className="text-center text-sm text-gray-500">
                    La plantilla incluye todas las columnas disponibles y dos ejemplos (Ahuehuete y Jacaranda)
                  </div>
                </div>
              )}

              {csvPreview.length > 0 && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Especie ID</TableHead>
                          <TableHead>Parque ID</TableHead>
                          <TableHead>Estado Salud</TableHead>
                          <TableHead>Altura</TableHead>
                          <TableHead>Ubicación</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvPreview.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.codigo || 'N/A'}</TableCell>
                            <TableCell>{row.especie_id || 'N/A'}</TableCell>
                            <TableCell>{row.parque_id || 'N/A'}</TableCell>
                            <TableCell>{row.estado_salud || 'N/A'}</TableCell>
                            <TableCell>{row.altura || 'N/A'}</TableCell>
                            <TableCell>{row.descripcion_ubicacion || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsImportDialogOpen(false);
                        setCsvPreview([]);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleConfirmImport}
                      disabled={importCsvMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {importCsvMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        'Confirmar Importación'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>,

          <Button
            key="export"
            onClick={handleExportCsv}
            variant="tertiary"
          >
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        ]}
        backgroundColor="bg-header-background"
      />

      {/* Input oculto FUERA del PageHeader */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
        
        <Card className="mb-6">
          <CardHeader className="pb-0"></CardHeader>
          <CardContent>
            <div className="flex items-start justify-start gap-3">
              
              {/* Buscador */}
              <div className="relative flex-1 min-w-[280px] max-w-lg">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                <Input
                  type="search"
                  placeholder="Buscar por código o descripción..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro de parque */}
              <div className="min-w-[160px]">
                <Select
                  value={parkFilter}
                  onValueChange={setParkFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por parque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los parques</SelectItem>
                    {!isLoadingParks && parks?.map((park: any) => (
                      <SelectItem key={park.id} value={park.id.toString()}>
                        {park.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de especie */}
              <div className="min-w-[160px]">
                <Select
                  value={speciesFilter}
                  onValueChange={setSpeciesFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por especie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las especies</SelectItem>
                    {!isLoadingSpecies && species?.map((speciesItem: any) => (
                      <SelectItem key={speciesItem.id} value={speciesItem.id.toString()}>
                        {speciesItem.commonName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de estado */}
              <div className="min-w-[160px]">
                <Select
                  value={healthFilter}
                  onValueChange={setHealthFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="Bueno">Bueno</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Malo">Malo</SelectItem>
                    <SelectItem value="Crítico">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botón limpiar filtros */}
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className='w-10 h-10 bg-gray-100' 
                  onClick={handleClearFilters}
                >
                  <Brush className="h-4 w-4 text-[#4b5b65]" />
                </Button>
              </div>

              {/* Espaciador para empujar botones a la derecha */}
              <div className="ml-auto flex items-center gap-2">
                {/* Botón de selección con menú desplegable */}
                <div className="relative group">
                  <Button
                    variant={selectionMode ? 'default' : 'outline'}
                    size="sm"
                    className={`flex items-center h-11 w-11 ${selectionMode ? 'bg-primary text-white hover:bg-[#00a587]' : 'bg-gray-100 hover:bg-[#00a587]'}`}
                  >
                    <CopyCheck className="h-5 w-5 text-[#4b5b65]" />
                  </Button>

                  {/* Dropdown menu con CSS hover */}
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => setSelectionMode(true)}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                      >
                        <CopyCheck className="h-4 w-4 mr-2" />
                        Selección múltiple
                      </button>
                      <button
                        onClick={() => {
                          if (!selectionMode) {
                            setSelectionMode(true);
                          }
                          handleSelectAllTrees();
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                      >
                        <CheckSquare className="h-5 w-5 mr-2" />
                        Seleccionar todo
                      </button>
                      <button
                        onClick={() => {
                          handleDeselectAllTrees();
                          setSelectionMode(false);
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Deseleccionar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botón para eliminar elementos seleccionados */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  className="flex items-center h-11 w-11 bg-[#ededed] text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={selectedTrees.size === 0}
                >
                  <Trash2 className="h-5 w-5" />
                  {selectedTrees.size > 0 && ` (${selectedTrees.size})`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <CardContent>
          {isLoadingTrees ? (

            // Estado de carga
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : hasData ? (

            // Tabla con datos
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectionMode && (
                      <TableHead className="w-12"></TableHead>
                    )}
                    <TableHead className="w-[120px]">Código</TableHead>
                    <TableHead>Especie</TableHead>
                    <TableHead>Parque</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Altura (m)</TableHead>
                    <TableHead>DAP (cm)</TableHead>
                    <TableHead>Última Inspección</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {treeInventory.data.map((tree: TreeInventory) => (
                      <TableRow key={tree.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewDetails(tree.id)}>
                        {selectionMode && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedTrees.has(tree.id)}
                              onCheckedChange={(checked) => handleSelectTree(tree.id, checked as boolean)}
                            />
                          </TableCell>
                        )}
                      <TableCell className="font-medium">{tree.code}</TableCell>
                      <TableCell>
                        <div className="font-medium">{tree.speciesName}</div>
                        <div className="text-sm text-gray-500 italic">{tree.scientificName}</div>
                      </TableCell>
                      <TableCell>{tree.parkName}</TableCell>
                      <TableCell>{getHealthStatusBadge(tree.healthStatus)}</TableCell>
                      <TableCell>{tree.height ? `${tree.height} m` : '-'}</TableCell>
                      <TableCell>{tree.diameter ? `${tree.diameter} cm` : '-'}</TableCell>
                      <TableCell>{formatDate(tree.lastInspectionDate)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(tree.id);
                            }}
                            className="bg-transparent text-gray-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Abrir mapa
                              window.open(`https://www.google.com/maps/search/?api=1&query=${tree.latitude},${tree.longitude}`, '_blank');
                            }}
                            className="bg-transparent text-gray-800 border border-gray-200 hover:bg-[#ceefea]"
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setPage(Math.max(1, page - 1))}
                          style={{ opacity: page === 1 ? 0.5 : 1, pointerEvents: page === 1 ? 'none' : 'auto' }}
                        />
                      </PaginationItem>

                      {/* Primera página */}
                      {page > 2 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => handlePageChange(1)}>
                            1
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Elipsis si hay muchas páginas */}
                      {page > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {/* Página anterior si no es la primera */}
                      {page > 1 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => handlePageChange(page - 1)}>
                            {page - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Página actual */}
                      <PaginationItem>
                        <PaginationLink isActive onClick={() => handlePageChange(page)}>
                          {page}
                        </PaginationLink>
                      </PaginationItem>

                      {/* Página siguiente si no es la última */}
                      {page < totalPages && (
                        <PaginationItem>
                          <PaginationLink onClick={() => handlePageChange(page + 1)}>
                            {page + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Elipsis si hay muchas páginas */}
                      {page < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {/* Última página */}
                      {page < totalPages - 1 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => handlePageChange(totalPages)}>
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          style={{ opacity: page === totalPages ? 0.5 : 1, pointerEvents: page === totalPages ? 'none' : 'auto' }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            // No hay datos
            <div className="text-center py-12">
              <TreeDeciduous className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron árboles</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                No hay árboles registrados que coincidan con los criterios de búsqueda. Prueba a cambiar los filtros o agrega un nuevo árbol al inventario.
              </p>
              <Button 
                onClick={handleAddTree}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Agregar Árbol
              </Button>
            </div>
          )}
        </CardContent>
      </div>
      
      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar árboles seleccionados?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente {selectedTrees.size} árbol(es) seleccionado(s) y sus registros de mantenimiento asociados. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

export default TreeInventoryPage;