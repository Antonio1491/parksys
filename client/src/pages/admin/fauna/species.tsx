import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Toolbar } from '@/components/ui/toolbar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  AlertTriangle,
  PawPrint,
  Bird,
  Fish,
  Bug,
  Rabbit,
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileUp,
  ImageIcon
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type FaunaSpecies } from '@shared/schema';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { apiRequest } from '@/lib/queryClient';
import { ImageUploader } from '@/components/ImageUploader';

// Schema permisivo para formulario
const updateFaunaSpeciesSchema = z.any();

interface FaunaSpeciesWithPagination {
  data: FaunaSpecies[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const FaunaSpeciesAdmin: React.FC = () => {
  // ========== ESTADOS ==========
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conservationFilter, setConservationFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [currentPage, setCurrentPage] = useState(1);

  // Estados de dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<FaunaSpecies | null>(null);

  // Estados de importación
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Estados de selección múltiple
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const itemsPerPage = 9;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ========== FILTROS ==========
  const hasActiveFilters = categoryFilter !== 'all' || conservationFilter !== 'all';

  const handleClearFilters = () => {
    setCategoryFilter('all');
    setConservationFilter('all');
  };

  // Reset página cuando cambian los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, conservationFilter]);

  // ========== QUERIES ==========
  const { data: speciesResponse, isLoading } = useQuery<FaunaSpeciesWithPagination>({
    queryKey: ['/api/fauna/species', currentPage, itemsPerPage, searchTerm, categoryFilter, conservationFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        category: categoryFilter,
        conservation_status: conservationFilter
      });

      const response = await fetch(`/api/fauna/species?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar especies');
      return response.json();
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/fauna/stats']
  });

  const species = speciesResponse?.data || [];
  const pagination = speciesResponse?.pagination;

  // ========== FORMULARIO ==========
  const form = useForm({
    resolver: zodResolver(updateFaunaSpeciesSchema),
    defaultValues: {
      commonName: '',
      scientificName: '',
      family: '',
      category: 'aves' as const,
      habitat: '',
      description: '',
      behavior: '',
      diet: '',
      reproductionPeriod: '',
      conservationStatus: 'estable' as const,
      sizeCm: '',
      weightGrams: '',
      lifespan: 0,
      isNocturnal: false,
      isMigratory: false,
      isEndangered: false,
      imageUrl: '',
      photoUrl: '',
      photoCaption: '',
      ecologicalImportance: '',
      threats: '',
      protectionMeasures: '',
      observationTips: '',
      bestObservationTime: '',
      commonLocations: [],
      iconColor: '#16a085'
    }
  });

  // ========== MUTACIONES ==========
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/fauna/species', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fauna/species'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fauna/stats'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: 'Especie creada exitosamente' });
    },
    onError: () => {
      toast({ title: 'Error al crear la especie', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/fauna/species/${id}`, { method: 'PUT', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fauna/species'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fauna/stats'] });
      setIsEditDialogOpen(false);
      form.reset();
      toast({ title: 'Especie actualizada exitosamente' });
    },
    onError: () => {
      toast({ title: 'Error al actualizar la especie', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/fauna/species/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fauna/species'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fauna/stats'] });
      toast({ title: 'Especie eliminada exitosamente' });
    },
    onError: () => {
      toast({ title: 'Error al eliminar la especie', variant: 'destructive' });
    }
  });

  // ========== HANDLERS ==========
  const cleanFormData = (data: any) => {
    const cleanData: any = {
      commonName: data.commonName,
      scientificName: data.scientificName,
      family: data.family,
      category: data.category,
      conservationStatus: data.conservationStatus || 'estable',
      isNocturnal: Boolean(data.isNocturnal),
      isMigratory: Boolean(data.isMigratory),
      isEndangered: Boolean(data.isEndangered),
      commonLocations: Array.isArray(data.commonLocations) ? data.commonLocations : [],
      iconColor: data.iconColor || '#16a085',
      iconType: data.iconType || 'system'
    };

    // Campos opcionales
    const optionalFields = ['habitat', 'description', 'behavior', 'diet', 'reproductionPeriod', 
      'sizeCm', 'weightGrams', 'imageUrl', 'photoUrl', 'photoCaption', 'ecologicalImportance', 
      'threats', 'protectionMeasures', 'observationTips', 'bestObservationTime'];

    optionalFields.forEach(field => {
      if (data[field]) cleanData[field] = data[field];
    });

    if (data.lifespan) cleanData.lifespan = Number(data.lifespan) || 0;

    return cleanData;
  };

  const handleCreate = (data: any) => {
    createMutation.mutate(cleanFormData(data));
  };

  const handleEdit = (speciesData: FaunaSpecies) => {
    setSelectedSpecies(speciesData);
    form.reset(speciesData as any);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (data: any) => {
    if (!selectedSpecies) return;

    if (!data.commonName || !data.scientificName || !data.family || !data.category) {
      toast({
        title: 'Error',
        description: 'Los campos Nombre Común, Nombre Científico, Familia y Categoría son requeridos',
        variant: 'destructive'
      });
      return;
    }

    const { id, createdAt, updatedAt, ...formData } = data;
    updateMutation.mutate({ id: selectedSpecies.id, data: cleanFormData(formData) });
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta especie?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (speciesData: FaunaSpecies) => {
    setSelectedSpecies(speciesData);
    setIsViewDialogOpen(true);
  };

  // ========== SELECCIÓN MÚLTIPLE ==========
  const handleSelectAll = () => {
    const newSelected = new Set(species.map(sp => sp.id));
    setSelectedItems(newSelected);
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleToggleSelect = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;
    if (confirm(`¿Eliminar ${selectedItems.size} especie(s) seleccionada(s)?`)) {
      selectedItems.forEach(id => deleteMutation.mutate(id));
      setSelectedItems(new Set());
      setSelectionMode(false);
    }
  };

  // ========== IMPORTACIÓN CSV ==========
  const handleImportCSV = async () => {
    if (!importFile) {
      toast({ title: 'Error', description: 'Selecciona un archivo CSV', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('csvFile', importFile);

      const response = await fetch('/api/fauna/import-csv', {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const result = await response.json();

      if (result.success) {
        toast({ title: 'Importación exitosa', description: result.message });
        queryClient.invalidateQueries({ queryKey: ['/api/fauna/species'] });
        queryClient.invalidateQueries({ queryKey: ['/api/fauna/stats'] });
        setIsImportDialogOpen(false);
        setImportFile(null);
      } else {
        toast({ title: 'Error en importación', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al importar el archivo CSV', variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/fauna/csv-template', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_fauna_especies.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({ title: 'Plantilla descargada' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al descargar plantilla', variant: 'destructive' });
    }
  };

  // ========== HELPERS DE UI ==========
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'aves': <Bird className="h-4 w-4" />,
      'mamiferos': <Rabbit className="h-4 w-4" />,
      'insectos': <Bug className="h-4 w-4" />,
      'vida_acuatica': <Fish className="h-4 w-4" />
    };
    return icons[category] || <PawPrint className="h-4 w-4" />;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'aves': 'Aves',
      'mamiferos': 'Mamíferos',
      'insectos': 'Insectos',
      'vida_acuatica': 'Vida Acuática'
    };
    return labels[category] || category;
  };

  const getConservationBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      'estable': 'bg-green-100 text-green-800',
      'vulnerable': 'bg-yellow-100 text-yellow-800',
      'en_peligro': 'bg-orange-100 text-orange-800',
      'en_peligro_critico': 'bg-red-100 text-red-800',
      'extinto_local': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const getConservationLabel = (status: string) => {
    const labels: Record<string, string> = {
      'estable': 'Estable',
      'vulnerable': 'Vulnerable',
      'en_peligro': 'En Peligro',
      'en_peligro_critico': 'Peligro Crítico',
      'extinto_local': 'Extinto Local'
    };
    return labels[status] || status;
  };

  // ========== LOADING ==========
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ========== PAGE HEADER ========== */}
        <PageHeader
          title="Catálogo de Fauna"
          subtitle="Especies de fauna que habitan en los parques urbanos."
          icon={<Bird />}
          actions={[
            <Button
              key="nuevo"
              variant="primary"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo
            </Button>,
            <Button
              key="importar"
              variant="secondary"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>,
            <Button
              key="exportar"
              variant="tertiary"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          ]}
        />

        {/* ========== STATS CARDS ========== */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            {/* Total Especies - 1/4 */}
            <Card className="border-0 shadow-sm" style={{ backgroundColor: '#ceefea' }}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#00444f]">Total Especies</span>
                  <div className="rounded-full p-2" style={{ backgroundColor: '#00444f' }}>
                    <PawPrint className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#00444f]">{stats.data?.total || 0}</div>
              </CardContent>
            </Card>

            {/* En Peligro - 1/4 */}
            <Card className="border-0 shadow-sm" style={{ backgroundColor: '#ceefea' }}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#00444f]">En Peligro</span>
                  <div className="rounded-full p-2" style={{ backgroundColor: '#00444f' }}>
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#00444f]">{stats.data?.endangered || 0}</div>
              </CardContent>
            </Card>

            {/* Por Categoría - 2/4 */}
            <Card className="border-0 shadow-sm col-span-2" style={{ backgroundColor: '#ceefea' }}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#00444f]">Por Categoría</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {/* Aves */}
                  <div className="flex items-center gap-2">
                    <div className="rounded-full p-2" style={{ backgroundColor: '#00444f' }}>
                      <Bird className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-[#00444f]">
                        {stats.data?.byCategory?.find((c: any) => c.category === 'aves')?.count || 0}
                      </div>
                      <div className="text-xs text-[#00444f]/70">Aves</div>
                    </div>
                  </div>

                  {/* Mamíferos */}
                  <div className="flex items-center gap-2">
                    <div className="rounded-full p-2" style={{ backgroundColor: '#00444f' }}>
                      <Rabbit className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-[#00444f]">
                        {stats.data?.byCategory?.find((c: any) => c.category === 'mamiferos')?.count || 0}
                      </div>
                      <div className="text-xs text-[#00444f]/70">Mamíferos</div>
                    </div>
                  </div>

                  {/* Vida Acuática */}
                  <div className="flex items-center gap-2">
                    <div className="rounded-full p-2" style={{ backgroundColor: '#00444f' }}>
                      <Fish className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-[#00444f]">
                        {stats.data?.byCategory?.find((c: any) => c.category === 'vida_acuatica')?.count || 0}
                      </div>
                      <div className="text-xs text-[#00444f]/70">Acuática</div>
                    </div>
                  </div>

                  {/* Insectos */}
                  <div className="flex items-center gap-2">
                    <div className="rounded-full p-2" style={{ backgroundColor: '#00444f' }}>
                      <Bug className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-[#00444f]">
                        {stats.data?.byCategory?.find((c: any) => c.category === 'insectos')?.count || 0}
                      </div>
                      <div className="text-xs text-[#00444f]/70">Insectos</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========== TOOLBAR ========== */}
        <Toolbar
          // Búsqueda
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar especies..."

          // Vista
          viewMode={viewMode}
          onViewModeChange={(mode) => setViewMode(mode as 'cards' | 'table')}
          availableViewModes={['cards', 'table']}

          // Selección múltiple
          selectionMode={selectionMode}
          selectedCount={selectedItems.size}
          onToggleSelection={() => setSelectionMode(!selectionMode)}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}

          // Eliminación bulk
          onBulkDelete={handleBulkDelete}

          // Filtros
          filters={
            <>
              {/* Filtro por categoría */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="pointer-events-auto z-[999]">
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="aves">Aves</SelectItem>
                  <SelectItem value="mamiferos">Mamíferos</SelectItem>
                  <SelectItem value="insectos">Insectos</SelectItem>
                  <SelectItem value="vida_acuatica">Vida Acuática</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro por estado de conservación */}
              <Select value={conservationFilter} onValueChange={setConservationFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado Conservación" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="pointer-events-auto z-[999]">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="estable">Estable</SelectItem>
                  <SelectItem value="vulnerable">Vulnerable</SelectItem>
                  <SelectItem value="en_peligro">En Peligro</SelectItem>
                  <SelectItem value="en_peligro_critico">Peligro Crítico</SelectItem>
                  <SelectItem value="extinto_local">Extinto Local</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* ========== CONTENIDO ========== */}
        {species.length === 0 ? (
          <div className="py-16 flex justify-center">
            <div className="text-center">
              <PawPrint className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No se encontraron especies</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ===== VISTA CARDS ===== */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {species.map((sp) => (
                  <div 
                    key={sp.id} 
                    className="bg-white border rounded-2xl hover:shadow-md hover:border-[#00444f] transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
                    onClick={() => handleView(sp)}
                  >
                    {/* Imagen */}
                    <div className="relative h-48 bg-gray-100 flex-shrink-0">
                      {selectionMode && (
                        <div 
                          className="absolute top-2 right-2 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedItems.has(sp.id)}
                            onCheckedChange={() => handleToggleSelect(sp.id)}
                            className="bg-white/80 data-[state=checked]:bg-[#00a587]"
                          />
                        </div>
                      )}
                      {sp.photoUrl ? (
                        <img 
                          src={sp.photoUrl}
                          alt={sp.commonName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <div className="text-center">
                            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Sin imagen</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex flex-col flex-1">
                      <div className="p-4 pb-2">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex-1 mr-2">
                            <h3 className="font-poppins font-bold text-gray-900 line-clamp-1">
                              {sp.commonName}
                            </h3>
                            <p className="text-sm text-gray-500 italic line-clamp-1">
                              {sp.scientificName}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                            #{sp.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryLabel(sp.category)}
                          </Badge>
                          <Badge className={`text-xs ${getConservationBadgeClass(sp.conservationStatus)}`}>
                            {getConservationLabel(sp.conservationStatus)}
                          </Badge>
                          {sp.isEndangered && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Peligro
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-4 pt-2 flex-1">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {sp.description || 'Sin descripción disponible'}
                        </p>
                      </div>

                      {/* Botones de acción */}
                      <div className="p-4 pt-0 mt-auto">
                        <div className="flex justify-between items-center pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(sp);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(sp.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ===== VISTA TABLA ===== */}
            {viewMode === 'table' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectionMode && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={species.length > 0 && species.every(sp => selectedItems.has(sp.id))}
                          onCheckedChange={(checked) => {
                            if (checked) handleSelectAll();
                            else handleDeselectAll();
                          }}
                        />
                      </TableHead>
                    )}
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Familia</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {species.map((sp) => (
                    <TableRow 
                      key={sp.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleView(sp)}
                    >
                      {selectionMode && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedItems.has(sp.id)}
                            onCheckedChange={() => handleToggleSelect(sp.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">#{sp.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sp.commonName}</p>
                          <p className="text-sm text-gray-500 italic">{sp.scientificName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryLabel(sp.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getConservationBadgeClass(sp.conservationStatus)}`}>
                          {getConservationLabel(sp.conservationStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>{sp.family || '-'}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border bg-transparent text-gray-600 hover:text-gray-800 hover:bg-[#ceefea]"
                            onClick={() => handleEdit(sp)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border bg-transparent text-red-800 hover:text-red-800 hover:bg-[#ceefea]"
                            onClick={() => handleDelete(sp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
              </>
            )}

        {/* ========== PAGINACIÓN ========== */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} especies
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
                  <span className="text-sm text-gray-600">Página</span>
                  <span className="bg-[#00a587] text-white px-2 py-1 rounded text-sm font-medium">
                    {currentPage}
                  </span>
                  <span className="text-sm text-gray-600">de {pagination.totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ========== DIALOG CREAR ========== */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bird className="h-5 w-5 text-[#00444f]" />
                Crear Nueva Especie
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                {/* Imagen */}
                <div className="space-y-2">
                  <Label>Fotografía de la Especie</Label>
                  <ImageUploader
                    currentImageUrl={form.watch('photoUrl')}
                    onImageUploaded={(url) => form.setValue('photoUrl', url)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="commonName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Común *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Colibrí Cola de Oro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="scientificName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Científico *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Chrysuronia oenone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="family"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Familia *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Trochilidae" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="aves">Aves</SelectItem>
                            <SelectItem value="mamiferos">Mamíferos</SelectItem>
                            <SelectItem value="insectos">Insectos</SelectItem>
                            <SelectItem value="vida_acuatica">Vida Acuática</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="conservationStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado de Conservación</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="estable">Estable</SelectItem>
                            <SelectItem value="vulnerable">Vulnerable</SelectItem>
                            <SelectItem value="en_peligro">En Peligro</SelectItem>
                            <SelectItem value="en_peligro_critico">Peligro Crítico</SelectItem>
                            <SelectItem value="extinto_local">Extinto Local</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="habitat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hábitat</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Bosques tropicales" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción general de la especie..." 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="behavior"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comportamiento</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Comportamiento típico de la especie..." 
                          className="min-h-[60px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="bg-[#00a587] hover:bg-[#007a5e]"
                  >
                    {createMutation.isPending ? 'Creando...' : 'Crear Especie'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* ========== DIALOG EDITAR ========== */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bird className="border rounded-full h-5 w-5 text-[#00444f]" />
                Editar Especie
              </DialogTitle>
              <DialogDescription>
                Modifica los datos de la especie seleccionada
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                {/* Imagen */}
                <div className="space-y-2">
                  <Label>Fotografía de la Especie</Label>
                  <ImageUploader
                    currentImageUrl={form.watch('photoUrl')}
                    onImageUploaded={(url) => form.setValue('photoUrl', url)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="commonName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Común *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre común de la especie" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="scientificName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Científico *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre científico" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="family"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Familia *</FormLabel>
                        <FormControl>
                          <Input placeholder="Familia taxonómica" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="aves">Aves</SelectItem>
                            <SelectItem value="mamiferos">Mamíferos</SelectItem>
                            <SelectItem value="insectos">Insectos</SelectItem>
                            <SelectItem value="vida_acuatica">Vida Acuática</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="conservationStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado de Conservación</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="estable">Estable</SelectItem>
                            <SelectItem value="vulnerable">Vulnerable</SelectItem>
                            <SelectItem value="en_peligro">En Peligro</SelectItem>
                            <SelectItem value="en_peligro_critico">Peligro Crítico</SelectItem>
                            <SelectItem value="extinto_local">Extinto Local</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="habitat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hábitat</FormLabel>
                        <FormControl>
                          <Input placeholder="Hábitat natural" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción de la especie" 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="behavior"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comportamiento</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Comportamiento de la especie" 
                          className="min-h-[60px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                    className="bg-[#00a587] hover:bg-[#007a5e]"
                  >
                    {updateMutation.isPending ? 'Actualizando...' : 'Guardar Cambios'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* ========== DIALOG VER DETALLE ========== */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedSpecies && getCategoryIcon(selectedSpecies.category)}
                {selectedSpecies?.commonName}
              </DialogTitle>
              <DialogDescription className="italic">
                {selectedSpecies?.scientificName}
              </DialogDescription>
            </DialogHeader>

            {selectedSpecies && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna izquierda: Imagen y badges */}
                <div className="space-y-4">
                  {selectedSpecies.photoUrl ? (
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={selectedSpecies.photoUrl}
                        alt={selectedSpecies.commonName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Sin imagen</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">
                      {getCategoryLabel(selectedSpecies.category)}
                    </Badge>
                    <Badge className={getConservationBadgeClass(selectedSpecies.conservationStatus)}>
                      {getConservationLabel(selectedSpecies.conservationStatus)}
                    </Badge>
                    {selectedSpecies.isEndangered && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        En Peligro
                      </Badge>
                    )}
                    {selectedSpecies.isNocturnal && (
                      <Badge variant="outline">Nocturno</Badge>
                    )}
                    {selectedSpecies.isMigratory && (
                      <Badge variant="outline">Migratorio</Badge>
                    )}
                  </div>
                </div>

                {/* Columna derecha: Información */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Información Básica</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Familia:</span>
                        <span className="font-medium">{selectedSpecies.family || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Hábitat:</span>
                        <span className="font-medium">{selectedSpecies.habitat || '-'}</span>
                      </div>
                      {selectedSpecies.sizeCm && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tamaño:</span>
                          <span className="font-medium">{selectedSpecies.sizeCm} cm</span>
                        </div>
                      )}
                      {selectedSpecies.weightGrams && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Peso:</span>
                          <span className="font-medium">{selectedSpecies.weightGrams} g</span>
                        </div>
                      )}
                      {selectedSpecies.lifespan && Number(selectedSpecies.lifespan) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Esperanza de vida:</span>
                          <span className="font-medium">{selectedSpecies.lifespan} años</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedSpecies.description && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Descripción</h4>
                      <p className="text-sm text-gray-600">{selectedSpecies.description}</p>
                    </div>
                  )}

                  {selectedSpecies.behavior && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Comportamiento</h4>
                      <p className="text-sm text-gray-600">{selectedSpecies.behavior}</p>
                    </div>
                  )}

                  {selectedSpecies.diet && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Dieta</h4>
                      <p className="text-sm text-gray-600">{selectedSpecies.diet}</p>
                    </div>
                  )}

                  {selectedSpecies.ecologicalImportance && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Importancia Ecológica</h4>
                      <p className="text-sm text-gray-600">{selectedSpecies.ecologicalImportance}</p>
                    </div>
                  )}

                  {selectedSpecies.threats && (
                    <div>
                      <h4 className="font-semibold text-red-700 mb-2">Amenazas</h4>
                      <p className="text-sm text-red-600">{selectedSpecies.threats}</p>
                    </div>
                  )}

                  {selectedSpecies.observationTips && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Consejos de Observación</h4>
                      <p className="text-sm text-gray-600">{selectedSpecies.observationTips}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Cerrar
              </Button>
              <Button 
                onClick={() => {
                  setIsViewDialogOpen(false);
                  if (selectedSpecies) handleEdit(selectedSpecies);
                }}
                className="bg-[#00a587] hover:bg-[#007a5e]"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========== DIALOG IMPORTAR CSV ========== */}
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileUp className="h-5 w-5" />
                        Importar Especies desde CSV
                      </DialogTitle>
                      <DialogDescription>
                        Sube un archivo CSV con la información de las especies de fauna
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Descargar plantilla */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">📋 Descargar Plantilla</h4>
                        <p className="text-sm text-blue-800 mb-3">
                          Descarga la plantilla CSV con el formato correcto y ejemplos de datos.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleDownloadTemplate}
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Descargar Plantilla
                        </Button>
                      </div>

                      {/* Selección de archivo */}
                      <div className="space-y-3">
                        <Label>Seleccionar archivo CSV</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            id="csv-file"
                            type="file"
                            accept=".csv"
                            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />

                          {importFile ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-center text-green-600">
                                <FileUp className="h-8 w-8 mr-2" />
                                <span className="font-medium">{importFile.name}</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                Tamaño: {(importFile.size / 1024).toFixed(2)} KB
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('csv-file')?.click()}
                              >
                                Cambiar archivo
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-center text-gray-400">
                                <FileUp className="h-8 w-8 mr-2" />
                                <span>Arrastra tu archivo CSV aquí</span>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => document.getElementById('csv-file')?.click()}
                              >
                                Seleccionar archivo
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Información importante */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Información Importante</h4>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          <li>• El archivo debe estar en formato CSV con codificación UTF-8</li>
                          <li>• Los campos obligatorios son: nombre_común y nombre_científico</li>
                          <li>• Las categorías válidas son: aves, mamiferos, insectos, vida_acuatica</li>
                          <li>• Los valores booleanos se escriben como: true/false, sí/no, 1/0</li>
                        </ul>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsImportDialogOpen(false);
                          setImportFile(null);
                        }}
                        disabled={isImporting}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleImportCSV}
                        disabled={!importFile || isImporting}
                        className="bg-[#00a587] hover:bg-[#007a5e]"
                      >
                        {isImporting ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                            Importando...
                          </>
                        ) : (
                          <>
                            <FileUp className="h-4 w-4 mr-2" />
                            Importar Especies
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

              </div>
            </AdminLayout>
          );
        };

        export default FaunaSpeciesAdmin;