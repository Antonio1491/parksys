import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Grid3X3, 
  List, 
  Download, 
  Upload,
  Heart,
  Fish,
  Bug,
  Rabbit,
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileUp,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertFaunaSpeciesSchema, type FaunaSpecies } from '@shared/schema';
import { z } from 'zod';

// Para el formulario, usamos un esquema que NO valida - solo manejamos la limpieza en handleUpdate
const updateFaunaSpeciesSchema = z.any();
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { apiRequest } from '@/lib/queryClient';
import { ImageUploader } from '@/components/ImageUploader';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conservationFilter, setConservationFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<FaunaSpecies | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const itemsPerPage = 9;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset página cuando cambian los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, conservationFilter]);

  // Query para obtener especies de fauna
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
      
      if (!response.ok) {
        throw new Error('Error al cargar especies');
      }
      
      return response.json();
    }
  });

  // Query para estadísticas
  const { data: stats } = useQuery({
    queryKey: ['/api/fauna/stats']
  });

  // Formulario para crear/editar especies
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

  // Mutaciones
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/fauna/species', {
      method: 'POST',
      data: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fauna/species'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fauna/stats'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: 'Especie creada exitosamente' });
    },
    onError: (error) => {
      console.error('Error creating species:', error);
      toast({ title: 'Error al crear la especie', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/fauna/species/${id}`, {
        method: 'PUT',
        data: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fauna/species'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fauna/stats'] });
      setIsEditDialogOpen(false);
      form.reset();
      toast({ title: 'Especie actualizada exitosamente' });
    },
    onError: (error) => {
      console.error('Error updating species:', error);
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

  const species = speciesResponse?.data || [];
  const pagination = speciesResponse?.pagination;

  // Funciones de manejo
  const handleCreate = (data: any) => {
    console.log('Datos del formulario:', data);
    // Filtrar campos vacíos y enviar solo los que tienen valor
    const cleanData: any = {
      commonName: data.commonName,
      scientificName: data.scientificName,
      family: data.family,
      category: data.category,
      conservationStatus: data.conservationStatus || 'estable',
      isNocturnal: data.isNocturnal || false,
      isMigratory: data.isMigratory || false,
      isEndangered: data.isEndangered || false,
      commonLocations: data.commonLocations || [],
      iconColor: data.iconColor || '#16a085',
      iconType: data.iconType || 'system'
    };

    // Añadir campos opcionales solo si tienen valor
    if (data.habitat) cleanData.habitat = data.habitat;
    if (data.description) cleanData.description = data.description;
    if (data.behavior) cleanData.behavior = data.behavior;
    if (data.diet) cleanData.diet = data.diet;
    if (data.reproductionPeriod) cleanData.reproductionPeriod = data.reproductionPeriod;
    if (data.sizeCm) cleanData.sizeCm = data.sizeCm;
    if (data.weightGrams) cleanData.weightGrams = data.weightGrams;
    if (data.lifespan) cleanData.lifespan = data.lifespan;
    if (data.imageUrl) cleanData.imageUrl = data.imageUrl;
    if (data.photoUrl) cleanData.photoUrl = data.photoUrl;
    if (data.photoCaption) cleanData.photoCaption = data.photoCaption;
    if (data.ecologicalImportance) cleanData.ecologicalImportance = data.ecologicalImportance;
    if (data.threats) cleanData.threats = data.threats;
    if (data.protectionMeasures) cleanData.protectionMeasures = data.protectionMeasures;
    if (data.observationTips) cleanData.observationTips = data.observationTips;
    if (data.bestObservationTime) cleanData.bestObservationTime = data.bestObservationTime;
    console.log('Datos limpiados:', cleanData);
    createMutation.mutate(cleanData);
  };

  const handleEdit = (speciesData: FaunaSpecies) => {
    setSelectedSpecies(speciesData);
    form.reset(speciesData as any);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (data: any) => {
    console.log('🔄 HANDLE UPDATE EJECUTÁNDOSE - Datos recibidos:', data);
    console.log('🔍 Selected species:', selectedSpecies);
    
    if (!selectedSpecies) {
      console.error('❌ No hay especie seleccionada para actualizar');
      toast({
        title: 'Error',
        description: 'No hay especie seleccionada para actualizar',
        variant: 'destructive'
      });
      return;
    }

    console.log('✅ Especie seleccionada encontrada, procesando actualización...');
    
    // Validar campos requeridos manualmente
    if (!data.commonName || !data.scientificName || !data.family || !data.category) {
      toast({
        title: 'Error',
        description: 'Los campos Nombre Común, Nombre Científico, Familia y Categoría son requeridos',
        variant: 'destructive'
      });
      return;
    }
    
    // Remover campos que no deben ser enviados (como id, createdAt, updatedAt)
    const { id, createdAt, updatedAt, ...formData } = data;
    
    // Filtrar y limpiar datos similares a handleCreate
    const cleanData = {
      commonName: formData.commonName,
      scientificName: formData.scientificName,
      family: formData.family,
      category: formData.category,
      conservationStatus: formData.conservationStatus || 'estable',
      isNocturnal: Boolean(formData.isNocturnal),
      isMigratory: Boolean(formData.isMigratory),
      isEndangered: Boolean(formData.isEndangered),
      commonLocations: Array.isArray(formData.commonLocations) ? formData.commonLocations : [],
      iconColor: formData.iconColor || '#16a085',
      iconType: formData.iconType || 'system'
    };

    // Añadir campos opcionales solo si tienen valor
    if (formData.habitat) cleanData.habitat = formData.habitat;
    if (formData.description) cleanData.description = formData.description;
    if (formData.behavior) cleanData.behavior = formData.behavior;
    if (formData.diet) cleanData.diet = formData.diet;
    if (formData.reproductionPeriod) cleanData.reproductionPeriod = formData.reproductionPeriod;
    if (formData.sizeCm) cleanData.sizeCm = formData.sizeCm;
    if (formData.weightGrams) cleanData.weightGrams = formData.weightGrams;
    if (formData.lifespan) cleanData.lifespan = Number(formData.lifespan) || 0;
    if (formData.imageUrl) cleanData.imageUrl = formData.imageUrl;
    if (formData.photoUrl) cleanData.photoUrl = formData.photoUrl;
    if (formData.photoCaption) cleanData.photoCaption = formData.photoCaption;
    if (formData.ecologicalImportance) cleanData.ecologicalImportance = formData.ecologicalImportance;
    if (formData.threats) cleanData.threats = formData.threats;
    if (formData.protectionMeasures) cleanData.protectionMeasures = formData.protectionMeasures;
    if (formData.observationTips) cleanData.observationTips = formData.observationTips;
    if (formData.bestObservationTime) cleanData.bestObservationTime = formData.bestObservationTime;
    
    console.log('📋 Datos de actualización limpiados:', cleanData);
    console.log('🚀 Ejecutando mutación con ID:', selectedSpecies.id);
    updateMutation.mutate({ id: selectedSpecies.id, data: cleanData });
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta especie?')) {
      deleteMutation.mutate(id);
    }
  };

  // Funciones de importación CSV
  const handleImportCSV = async () => {
    if (!importFile) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un archivo CSV',
        variant: 'destructive'
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('csvFile', importFile);

      const response = await fetch('/api/fauna/import-csv', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Importación exitosa',
          description: result.message
        });
        
        // Refrescar datos
        queryClient.invalidateQueries({ queryKey: ['/api/fauna/species'] });
        queryClient.invalidateQueries({ queryKey: ['/api/fauna/stats'] });
        
        // Cerrar diálogo y limpiar
        setIsImportDialogOpen(false);
        setImportFile(null);
      } else {
        toast({
          title: 'Error en importación',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: 'Error',
        description: 'Error al importar el archivo CSV',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/fauna/csv-template', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'plantilla_fauna_especies.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Plantilla descargada',
          description: 'La plantilla CSV se ha descargado correctamente'
        });
      } else {
        throw new Error('Error al descargar plantilla');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: 'Error',
        description: 'Error al descargar la plantilla CSV',
        variant: 'destructive'
      });
    }
  };

  const handleView = (speciesData: FaunaSpecies) => {
    setSelectedSpecies(speciesData);
    setIsViewDialogOpen(true);
  };

  // Función para obtener el ícono de categoría
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'aves': return <Heart className="h-5 w-5 text-blue-600" />;
      case 'mamiferos': return <Rabbit className="h-5 w-5 text-green-600" />;
      case 'insectos': return <Bug className="h-5 w-5 text-yellow-600" />;
      case 'vida_acuatica': return <Fish className="h-5 w-5 text-teal-600" />;
      default: return <Heart className="h-5 w-5 text-gray-600" />;
    }
  };

  // Función para obtener el color del badge de estado de conservación
  const getConservationStatusColor = (status: string) => {
    switch (status) {
      case 'estable': return 'bg-green-100 text-green-800';
      case 'vulnerable': return 'bg-yellow-100 text-yellow-800';
      case 'en_peligro': return 'bg-orange-100 text-orange-800';
      case 'en_peligro_critico': return 'bg-red-100 text-red-800';
      case 'extinto_local': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
        {/* Header */}
        <PageHeader 
          title="Gestión de Fauna" 
          subtitle="Administra el catálogo de especies de fauna urbana." />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Fauna</h1>
            <p className="text-gray-600">Administra el catálogo de especies de fauna urbana</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
              <FileUp className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Especie
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Especie</DialogTitle>
                  <DialogDescription>
                    Agrega una nueva especie al catálogo de fauna
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => {
                    console.log('SUBMIT EJECUTADO', data);
                    handleCreate(data);
                  })} className="space-y-4">
                    {/* Subida de Imagen */}
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
                            <FormLabel>Nombre Común</FormLabel>
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
                            <FormLabel>Nombre Científico</FormLabel>
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
                            <FormLabel>Familia</FormLabel>
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
                            <FormLabel>Categoría</FormLabel>
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

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descripción de la especie" {...field} />
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
                            <Textarea placeholder="Comportamiento de la especie" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending}
                        onClick={() => console.log('BOTÓN CLICKEADO', form.formState.errors)}
                      >
                        {createMutation.isPending ? 'Creando...' : 'Crear Especie'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Especies</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.data.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aves</CardTitle>
                <Heart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.data.byCategory.find(c => c.category === 'aves')?.count || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mamíferos</CardTitle>
                <Rabbit className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.data.byCategory.find(c => c.category === 'mamiferos')?.count || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vida Acuática</CardTitle>
                <Fish className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.data.byCategory.find(c => c.category === 'vida_acuatica')?.count || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Insectos</CardTitle>
                <Bug className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.data.byCategory.find(c => c.category === 'insectos')?.count || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Peligro</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.data.endangered}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar especies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="aves">Aves</SelectItem>
                  <SelectItem value="mamiferos">Mamíferos</SelectItem>
                  <SelectItem value="insectos">Insectos</SelectItem>
                  <SelectItem value="vida_acuatica">Vida Acuática</SelectItem>
                </SelectContent>
              </Select>

              <Select value={conservationFilter} onValueChange={setConservationFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Estado Conservación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="estable">Estable</SelectItem>
                  <SelectItem value="vulnerable">Vulnerable</SelectItem>
                  <SelectItem value="en_peligro">En Peligro</SelectItem>
                  <SelectItem value="en_peligro_critico">Peligro Crítico</SelectItem>
                  <SelectItem value="extinto_local">Extinto Local</SelectItem>
                </SelectContent>
              </Select>

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
          </CardContent>
        </Card>

        {/* Lista de especies */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {species.map((sp) => (
            <Card key={sp.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(sp.category)}
                    <CardTitle className="text-lg">{sp.commonName}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleView(sp)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(sp)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(sp.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="italic">{sp.scientificName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {sp.category.replace('_', ' ')}
                    </Badge>
                    <Badge className={getConservationStatusColor(sp.conservationStatus)}>
                      {sp.conservationStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                  {sp.isEndangered && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      En Peligro
                    </Badge>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {sp.description || 'Sin descripción disponible'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Paginación */}
        {pagination && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} especies
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log(`🔄 Navegando a página anterior desde ${currentPage}`);
                  setCurrentPage(currentPage - 1);
                }}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                {currentPage} de {pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log(`🔄 Navegando a página siguiente desde ${currentPage}`);
                  setCurrentPage(currentPage + 1);
                }}
                disabled={currentPage >= pagination.totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Diálogo de Edición */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Especie</DialogTitle>
              <DialogDescription>
                Modifica los datos de la especie seleccionada
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={(e) => {
                console.log('🔄 Form onSubmit ejecutándose');
                console.log('📋 Form errors:', form.formState.errors);
                console.log('📋 Form values:', form.getValues());
                try {
                  form.handleSubmit(handleUpdate)(e);
                } catch (error) {
                  console.error('❌ Error en handleSubmit:', error);
                }
              }} className="space-y-4">
                {/* Subida de Imagen */}
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
                        <FormLabel>Nombre Común</FormLabel>
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
                        <FormLabel>Nombre Científico</FormLabel>
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
                        <FormLabel>Familia</FormLabel>
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
                        <FormLabel>Categoría</FormLabel>
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descripción de la especie" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Actualizando...' : 'Actualizar Especie'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Importación CSV */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Importar Especies desde CSV
              </DialogTitle>
              <DialogDescription>
                Sube un archivo CSV con la información de las especies de fauna para importación masiva
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Descarga de plantilla */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Descargar Plantilla</h3>
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
                  Descargar Plantilla CSV
                </Button>
              </div>

              {/* Selección de archivo */}
              <div className="space-y-3">
                <Label htmlFor="csv-file">Seleccionar archivo CSV</Label>
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
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Información Importante</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• El archivo debe estar en formato CSV con codificación UTF-8</li>
                  <li>• Los campos obligatorios son: nombre_común y nombre_científico</li>
                  <li>• Las categorías válidas son: aves, mamiferos, insectos, vida_acuatica</li>
                  <li>• Los valores booleanos se escriben como: true/false, sí/no, 1/0</li>
                  <li>• Si hay errores, se mostrará un reporte detallado</li>
                </ul>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-2">
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
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <FileUp className="h-4 w-4 mr-2" />
                      Importar Especies
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Visualización */}
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
                {/* Imagen */}
                <div className="space-y-4">
                  {selectedSpecies.photoUrl && (
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={selectedSpecies.photoUrl}
                        alt={selectedSpecies.commonName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {selectedSpecies.category.replace('_', ' ')}
                    </Badge>
                    <Badge className={getConservationStatusColor(selectedSpecies.conservationStatus)}>
                      {selectedSpecies.conservationStatus.replace('_', ' ')}
                    </Badge>
                    {selectedSpecies.isEndangered && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        En Peligro
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Información */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Información Básica</h3>
                    <div className="mt-2 space-y-2 text-sm">
                      <div><strong>Familia:</strong> {selectedSpecies.family}</div>
                      <div><strong>Hábitat:</strong> {selectedSpecies.habitat || 'No especificado'}</div>
                      {selectedSpecies.sizeCm && (
                        <div><strong>Tamaño:</strong> {selectedSpecies.sizeCm} cm</div>
                      )}
                      {selectedSpecies.weightGrams && (
                        <div><strong>Peso:</strong> {selectedSpecies.weightGrams} gramos</div>
                      )}
                      {selectedSpecies.lifespan && selectedSpecies.lifespan > 0 && (
                        <div><strong>Esperanza de vida:</strong> {selectedSpecies.lifespan} años</div>
                      )}
                    </div>
                  </div>

                  {selectedSpecies.description && (
                    <div>
                      <h3 className="font-semibold text-gray-900">Descripción</h3>
                      <p className="mt-2 text-sm text-gray-600">{selectedSpecies.description}</p>
                    </div>
                  )}

                  {selectedSpecies.behavior && (
                    <div>
                      <h3 className="font-semibold text-gray-900">Comportamiento</h3>
                      <p className="mt-2 text-sm text-gray-600">{selectedSpecies.behavior}</p>
                    </div>
                  )}

                  {selectedSpecies.diet && (
                    <div>
                      <h3 className="font-semibold text-gray-900">Dieta</h3>
                      <p className="mt-2 text-sm text-gray-600">{selectedSpecies.diet}</p>
                    </div>
                  )}

                  {selectedSpecies.ecologicalImportance && (
                    <div>
                      <h3 className="font-semibold text-gray-900">Importancia Ecológica</h3>
                      <p className="mt-2 text-sm text-gray-600">{selectedSpecies.ecologicalImportance}</p>
                    </div>
                  )}

                  {selectedSpecies.threats && (
                    <div>
                      <h3 className="font-semibold text-gray-900">Amenazas</h3>
                      <p className="mt-2 text-sm text-red-600">{selectedSpecies.threats}</p>
                    </div>
                  )}

                  {selectedSpecies.observationTips && (
                    <div>
                      <h3 className="font-semibold text-gray-900">Consejos de Observación</h3>
                      <p className="mt-2 text-sm text-gray-600">{selectedSpecies.observationTips}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-4">
                    {selectedSpecies.isNocturnal && (
                      <Badge variant="outline">Nocturno</Badge>
                    )}
                    {selectedSpecies.isMigratory && (
                      <Badge variant="outline">Migratorio</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
};

export default FaunaSpeciesAdmin;