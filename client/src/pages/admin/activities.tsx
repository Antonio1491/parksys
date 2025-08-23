import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Pencil, Trash, Search, ChevronLeft, ChevronRight, Calendar, X, Image as ImageIcon, Grid, List, Clock, MapPin, Users, Badge, Download, Upload, FileText } from 'lucide-react';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const AdminActivities = () => {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPark, setFilterPark] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards'); // Vista por defecto: fichas
  
  // States for delete functionality
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // States for CSV import functionality
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  
  const activitiesPerPage = 9;
  const { toast } = useToast();

  // Fetch data
  const { data: activitiesData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/activities'],
  });

  // Fetch activities with images for card view
  const { data: activitiesWithImagesData } = useQuery({
    queryKey: ['/api/actividades-fotos'],
    enabled: viewMode === 'cards',
  });

  const { data: parksData } = useQuery({
    queryKey: ['/api/parks'],
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['/api/activity-categories'],
  });

  // Mutation for delete

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/activities/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Actividad eliminada",
        description: "La actividad se ha eliminado correctamente.",
      });
      setShowDeleteDialog(false);
      setSelectedActivity(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la actividad.",
        variant: "destructive",
      });
    },
  });

  // CSV Export function
  const handleExportCSV = () => {
    try {
      if (!Array.isArray(activitiesData) || activitiesData.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay actividades para exportar.",
          variant: "destructive"
        });
        return;
      }

      // Create CSV template based on form fields from "Nueva Actividad"
      const csvHeaders = [
        'título',
        'descripción',
        'parque',
        'categoría',
        'fechaInicio',
        'fechaFin',
        'horaInicio',
        'horaFin',
        'ubicación',
        'latitud',
        'longitud',
        'capacidad',
        'duración',
        'precio',
        'esGratis',
        'materiales',
        'requisitos',
        'esRecurrente',
        'díasRecurrentes',
        'mercadoObjetivo',
        'necesidadesEspeciales',
        'permiteRegistroPúblico',
        'máximoRegistros',
        'fechaLímiteRegistro',
        'instruccionesRegistro',
        'requiereAprobación',
        'restriccionesEdad',
        'requisitosSalud'
      ];

      // Map activities data to CSV format
      const csvData = activitiesData.map((activity: any) => {
        const park = parksData?.find((p: any) => p.id === activity.parkId);
        const category = categoriesData?.find((c: any) => c.id === activity.categoryId);
        
        return [
          activity.title || '',
          activity.description || '',
          park?.name || '',
          category?.name || '',
          activity.startDate || '',
          activity.endDate || '',
          activity.startTime || '',
          activity.endTime || '',
          activity.location || '',
          activity.latitude || '',
          activity.longitude || '',
          activity.capacity || '',
          activity.duration || '',
          activity.price || '',
          activity.isFree ? 'Sí' : 'No',
          activity.materials || '',
          activity.requirements || '',
          activity.isRecurring ? 'Sí' : 'No',
          Array.isArray(activity.recurringDays) ? activity.recurringDays.join(';') : '',
          Array.isArray(activity.targetMarket) ? activity.targetMarket.join(';') : '',
          Array.isArray(activity.specialNeeds) ? activity.specialNeeds.join(';') : '',
          activity.allowsPublicRegistration ? 'Sí' : 'No',
          activity.maxRegistrations || '',
          activity.registrationDeadline || '',
          activity.registrationInstructions || '',
          activity.requiresApproval ? 'Sí' : 'No',
          activity.ageRestrictions || '',
          activity.healthRequirements || ''
        ];
      });

      // Create CSV content with proper encoding for Spanish characters
      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Create and download file with UTF-8 BOM to handle Spanish accents
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `actividades_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportación exitosa",
        description: `Se han exportado ${activitiesData.length} actividades al archivo CSV.`,
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al exportar el archivo CSV.",
        variant: "destructive"
      });
    }
  };

  // Generate CSV template for import
  const handleDownloadTemplate = () => {
    try {
      const templateHeaders = [
        'título',
        'descripción',
        'parque',
        'categoría',
        'fechaInicio',
        'fechaFin',
        'horaInicio',
        'horaFin',
        'ubicación',
        'latitud',
        'longitud',
        'capacidad',
        'duración',
        'precio',
        'esGratis',
        'materiales',
        'requisitos',
        'esRecurrente',
        'díasRecurrentes',
        'mercadoObjetivo',
        'necesidadesEspeciales',
        'permiteRegistroPúblico',
        'máximoRegistros',
        'fechaLímiteRegistro',
        'instruccionesRegistro',
        'requiereAprobación',
        'restriccionesEdad',
        'requisitosSalud'
      ];

      // Add example row with proper Spanish format
      const exampleRow = [
        'Ejemplo: Yoga en el Parque',
        'Clase de yoga matutina para todas las edades',
        'Parque Central',
        'Bienestar',
        '2024-03-15',
        '2024-06-15',
        '08:00',
        '09:30',
        'Área de césped principal',
        '20.123456',
        '-103.654321',
        '30',
        '90',
        '50',
        'No',
        'Mat de yoga, toalla',
        'Ropa cómoda, agua',
        'Sí',
        'lunes;miércoles;viernes',
        'adultos;jóvenes',
        'principiantes',
        'Sí',
        '25',
        '2024-03-10',
        'Contactar por email para registro',
        'No',
        '16+',
        'Sin problemas cardíacos'
      ];

      const templateContent = [templateHeaders, exampleRow]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Create template with UTF-8 BOM for Spanish characters
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + templateContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'plantilla_actividades.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Plantilla descargada",
        description: "La plantilla CSV se ha descargado correctamente.",
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al descargar la plantilla.",
        variant: "destructive"
      });
    }
  };

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (csvData: any[]) => {
      return await apiRequest('/api/activities/import', {
        method: 'POST',
        body: JSON.stringify({ activities: csvData }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Importación exitosa",
        description: `Se han importado ${response.imported || 0} actividades correctamente.`,
      });
      setShowImportDialog(false);
      setImportFile(null);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error en importación",
        description: error.message || "Hubo un problema al importar las actividades.",
        variant: "destructive"
      });
    },
  });

  // Handle CSV import
  const handleImportCSV = () => {
    if (!importFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo CSV.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('El archivo debe contener al menos una fila de datos además del encabezado.');
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const dataRows = lines.slice(1);

        const csvData = dataRows.map((row, index) => {
          const values = row.split(',').map(v => v.replace(/"/g, '').trim());
          
          if (values.length !== headers.length) {
            throw new Error(`Fila ${index + 2}: número incorrecto de columnas.`);
          }

          const activityData: any = {};
          headers.forEach((header, i) => {
            const value = values[i];
            
            // Map CSV headers to database fields
            switch (header.toLowerCase()) {
              case 'título':
                activityData.title = value;
                break;
              case 'descripción':
                activityData.description = value;
                break;
              case 'parque':
                const park = parksData?.find((p: any) => 
                  p.name.toLowerCase() === value.toLowerCase()
                );
                if (park) {
                  activityData.parkId = park.id;
                } else if (value) {
                  throw new Error(`Parque no encontrado: ${value}`);
                }
                break;
              case 'categoría':
                const category = categoriesData?.find((c: any) => 
                  c.name.toLowerCase() === value.toLowerCase()
                );
                if (category) {
                  activityData.categoryId = category.id;
                } else if (value) {
                  throw new Error(`Categoría no encontrada: ${value}`);
                }
                break;
              case 'fechainicio':
                activityData.startDate = value || null;
                break;
              case 'fechafin':
                activityData.endDate = value || null;
                break;
              case 'horainicio':
                activityData.startTime = value || null;
                break;
              case 'horafin':
                activityData.endTime = value || null;
                break;
              case 'ubicación':
                activityData.location = value || null;
                break;
              case 'latitud':
                activityData.latitude = value ? parseFloat(value) : null;
                break;
              case 'longitud':
                activityData.longitude = value ? parseFloat(value) : null;
                break;
              case 'capacidad':
                activityData.capacity = value ? parseInt(value) : null;
                break;
              case 'duración':
                activityData.duration = value ? parseInt(value) : null;
                break;
              case 'precio':
                activityData.price = value ? parseFloat(value) : 0;
                break;
              case 'esgratis':
                activityData.isFree = value.toLowerCase() === 'sí' || value.toLowerCase() === 'si' || value === '1';
                break;
              case 'materiales':
                activityData.materials = value || '';
                break;
              case 'requisitos':
                activityData.requirements = value || '';
                break;
              case 'esrecurrente':
                activityData.isRecurring = value.toLowerCase() === 'sí' || value.toLowerCase() === 'si' || value === '1';
                break;
              case 'díasrecurrentes':
                activityData.recurringDays = value ? value.split(';').filter(d => d.trim()) : [];
                break;
              case 'mercadoobjetivo':
                activityData.targetMarket = value ? value.split(';').filter(t => t.trim()) : [];
                break;
              case 'necesidadesespeciales':
                activityData.specialNeeds = value ? value.split(';').filter(n => n.trim()) : [];
                break;
              case 'permiteregistropúblico':
                activityData.allowsPublicRegistration = value.toLowerCase() === 'sí' || value.toLowerCase() === 'si' || value === '1';
                break;
              case 'máximoregistros':
                activityData.maxRegistrations = value ? parseInt(value) : null;
                break;
              case 'fechalímiteregistro':
                activityData.registrationDeadline = value || null;
                break;
              case 'instruccionesregistro':
                activityData.registrationInstructions = value || '';
                break;
              case 'requiereaprobación':
                activityData.requiresApproval = value.toLowerCase() === 'sí' || value.toLowerCase() === 'si' || value === '1';
                break;
              case 'restriccionesedad':
                activityData.ageRestrictions = value || '';
                break;
              case 'requisitossalud':
                activityData.healthRequirements = value || '';
                break;
            }
          });

          return activityData;
        });

        importMutation.mutate(csvData);

      } catch (error: any) {
        toast({
          title: "Error al procesar archivo",
          description: error.message || "Formato de archivo inválido.",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(importFile, 'UTF-8');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return "Fecha inválida";
    }
  };

  // Función para obtener el color y emoji del estado
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'activa':
        return { emoji: '🟢', label: 'Activa', color: 'bg-green-100 text-green-800' };
      case 'programada':
        return { emoji: '🟡', label: 'Programada', color: 'bg-yellow-100 text-yellow-800' };
      case 'cancelada':
        return { emoji: '🔴', label: 'Cancelada', color: 'bg-red-100 text-red-800' };
      case 'finalizada':
        return { emoji: '⚫', label: 'Finalizada', color: 'bg-gray-100 text-gray-800' };
      case 'en_pausa':
        return { emoji: '🟠', label: 'En Pausa', color: 'bg-orange-100 text-orange-800' };
      default:
        return { emoji: '🟡', label: 'Programada', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  // Crear mapeo de categorías por ID y por string
  const categoriesMap = useMemo(() => {
    if (!Array.isArray(categoriesData)) return {};
    return categoriesData.reduce((acc: any, category: any) => {
      acc[category.id] = category;
      return acc;
    }, {});
  }, [categoriesData]);

  const categoryStringMap: any = {
    'deportivo': 'Deportivo',
    'artecultura': 'Arte y Cultura',
    'recreacionbienestar': 'Recreación y Bienestar',
    'temporada': 'Eventos de Temporada',
    'naturalezaciencia': 'Naturaleza y Ciencia',
    'comunidad': 'Comunidad',
    'fitness': 'Fitness y Ejercicio'
  };

  // Función para obtener el nombre de la categoría
  const getCategoryName = (activity: any) => {
    // Primero intentar con category_id numérico
    const categoryId = activity.categoryId || activity.category_id;
    if (categoryId && categoriesMap[categoryId]) {
      return categoriesMap[categoryId].name;
    }
    // Si no, usar el campo category string directo desde el servidor
    else if (activity.category) {
      return activity.category;
    }
    // Si ya viene categoryName desde el servidor, usarlo
    if (activity.categoryName) {
      return activity.categoryName;
    }
    return 'Sin categoría';
  };

  // Función para obtener los colores de las categorías (igual que en organizador)
  const getCategoryColors = (categoryName: string) => {
    switch (categoryName) {
      case 'Arte y Cultura':
        return 'bg-green-100 text-green-800';
      case 'Recreación y Bienestar':
        return 'bg-blue-100 text-blue-800';
      case 'Eventos de Temporada':
        return 'bg-orange-100 text-orange-800';
      case 'Deportivo':
        return 'bg-red-100 text-red-800';
      case 'Comunidad':
        return 'bg-purple-100 text-purple-800';
      case 'Naturaleza y Ciencia':
        return 'bg-teal-100 text-teal-800';
      case 'Fitness y Ejercicio':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const uniqueCategories = useMemo(() => {
    if (!Array.isArray(activitiesData)) return [];
    const categories = new Set();
    activitiesData.forEach((activity: any) => {
      if (activity.activityType) {
        categories.add(activity.activityType);
      }
    });
    return Array.from(categories);
  }, [activitiesData]);

  const filteredActivities = useMemo(() => {
    // Use activities with images for card view, regular activities for table view
    const sourceData = viewMode === 'cards' ? activitiesWithImagesData : activitiesData;
    if (!Array.isArray(sourceData)) return [];
    
    return sourceData.filter((activity: any) => {
      if (searchQuery && !activity.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterPark && filterPark !== "all" && activity.parkId.toString() !== filterPark) {
        return false;
      }
      if (filterCategory && filterCategory !== "all" && activity.categoryId?.toString() !== filterCategory) {
        return false;
      }
      return true;
    });
  }, [activitiesData, activitiesWithImagesData, searchQuery, filterPark, filterCategory, viewMode]);

  const totalActivities = filteredActivities.length;
  const totalPages = Math.ceil(totalActivities / activitiesPerPage);
  const startIndex = (currentPage - 1) * activitiesPerPage;
  const endIndex = startIndex + activitiesPerPage;
  const currentActivities = filteredActivities.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPark, filterCategory]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterPark('all');
    setFilterCategory('all');
  };

  // Handle edit functionality - redirigir al formulario completo del organizador
  const handleEdit = (activity: any) => {
    setLocation(`/admin/organizador/catalogo/editar/${activity.id}`);
  };

  // Handle delete functionality
  const handleDelete = (activity: any) => {
    setSelectedActivity(activity);
    setShowDeleteDialog(true);
  };



  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (!selectedActivity) return;
    deleteMutation.mutate(selectedActivity.id);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a587] mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando actividades...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-4">Error al cargar las actividades</p>
              <Button onClick={() => refetch()}>Reintentar</Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con fondo coloreado */}
        <div 
          className="py-8 px-4 -mx-4 -mt-6 flex items-center justify-between"
          style={{ backgroundColor: "#14b8a6" }}
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white font-poppins">Dashboard de Actividades</h1>
              <p className="text-base font-normal text-white font-poppins">Gestiona todas las actividades del sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle de vista */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className={`${viewMode === 'cards' ? 'bg-[#00a587] text-white' : 'text-gray-600'}`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={`${viewMode === 'table' ? 'bg-[#00a587] text-white' : 'text-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Botones CSV */}
            <Button 
              variant="outline"
              onClick={handleDownloadTemplate}
              className="border-[#00a587] text-[#00a587] hover:bg-[#00a587] hover:text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Plantilla CSV
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleExportCSV}
              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
            
            <Button 
              className="bg-[#00a587] hover:bg-[#067f5f]"
              onClick={() => {
                console.log('Botón Nueva Actividad clickeado - redirigiendo al organizador');
                setLocation('/admin/organizador/catalogo/crear');
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Actividad
            </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar actividades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterPark} onValueChange={setFilterPark}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por parque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los parques</SelectItem>
                {Array.isArray(parksData) && parksData.map((park: any) => (
                  <SelectItem key={park.id} value={park.id.toString()}>
                    {park.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {Array.isArray(categoriesData) && categoriesData.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </div>

        {/* Activities content */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredActivities.length === 0 ? (
            <div className="py-16 flex justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-2">No se encontraron actividades</p>
                {(searchQuery || filterPark || filterCategory) && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'table' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Parque</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentActivities.map((activity: any) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">#{activity.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            {activity.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {activity.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const statusInfo = getStatusDisplay(activity.status || 'programada');
                            return (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                <span className="mr-1">{statusInfo.emoji}</span>
                                {statusInfo.label}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColors(getCategoryName(activity))}`}>
                            {getCategoryName(activity)}
                          </span>
                        </TableCell>
                        <TableCell>{activity.parkName || `Parque ${activity.parkId}`}</TableCell>
                        <TableCell>{formatDate(activity.startDate)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700"
                              onClick={() => setLocation(`/admin/activities/${activity.id}/images`)}
                              title="Gestionar imágenes"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => handleEdit(activity)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(activity)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                // Vista de fichas
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentActivities.map((activity: any) => (
                      <div key={activity.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                        {/* Imagen de la actividad */}
                        <div className="relative h-48 bg-gray-100">
                          {activity.imageUrl ? (
                            <img 
                              src={activity.imageUrl} 
                              alt={activity.title}
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
                          {/* Badge de estado de imagen */}
                          <div className="absolute top-2 right-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              activity.imageUrl 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {activity.imageUrl ? 'Con imagen' : 'Sin imagen'}
                            </span>
                          </div>
                          {/* ID de la actividad */}
                          <div className="absolute top-2 left-2">
                            <span className="text-xs text-white bg-black/60 px-2 py-1 rounded">
                              #{activity.id}
                            </span>
                          </div>
                        </div>
                        
                        {/* Header de la ficha */}
                        <div className="p-4 border-b">
                          <div className="mb-2">
                            <h3 className="font-semibold text-gray-900 line-clamp-2">{activity.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColors(getCategoryName(activity))}`}>
                              {getCategoryName(activity)}
                            </span>
                            {(() => {
                              const statusInfo = getStatusDisplay(activity.status || 'programada');
                              return (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                  <span className="mr-1">{statusInfo.emoji}</span>
                                  {statusInfo.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        
                        {/* Contenido de la ficha */}
                        <div className="p-4">
                          {activity.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                              {activity.description}
                            </p>
                          )}
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{activity.parkName || `Parque ${activity.parkId}`}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{formatDate(activity.startDate)}</span>
                            </div>
                            {activity.capacity && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Users className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{activity.capacity} personas</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Botones de acción */}
                          <div className="flex justify-between items-center pt-3 border-t">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-green-600 hover:text-green-700"
                                onClick={() => setLocation(`/admin/activities/${activity.id}/images`)}
                                title="Gestionar imágenes"
                              >
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => handleEdit(activity)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(activity)}
                                title="Eliminar"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination - Siempre visible */}
        <div className="bg-white rounded-lg shadow-sm border mt-4 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <div>Mostrando {Math.min(startIndex + 1, totalActivities)}-{Math.min(endIndex, totalActivities)} de {totalActivities} actividades</div>
              <div className="text-xs text-blue-600 mt-1">
                Páginas calculadas: {totalPages} | Página actual: {currentPage} | Por página: {activitiesPerPage}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
                <span className="text-sm text-gray-600">Página</span>
                <span className="bg-[#00a587] text-white px-2 py-1 rounded text-sm font-medium">
                  {currentPage}
                </span>
                <span className="text-sm text-gray-600">de {totalPages}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className="flex items-center gap-1"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>



        {/* CSV Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Importar Actividades desde CSV</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Selecciona un archivo CSV con las actividades a importar. Usa la plantilla descargable para el formato correcto.
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImportFile(file);
                      }
                    }}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-900">
                      Haz clic para seleccionar archivo
                    </span>
                    <span className="text-xs text-gray-500">
                      Solo archivos .csv
                    </span>
                  </label>
                </div>
                {importFile && (
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-sm text-green-800">
                      📄 {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Formato requerido:</strong> Usa la plantilla CSV descargable que incluye todos los campos del formulario "Nueva Actividad" con soporte completo para caracteres acentuados.
                </p>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="border-[#00a587] text-[#00a587] hover:bg-[#00a587] hover:text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Descargar Plantilla
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleImportCSV}
                  disabled={!importFile || importMutation.isPending}
                  className="bg-[#00a587] hover:bg-[#067f5f]"
                >
                  {importMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la actividad
                "{selectedActivity?.title}" y todos sus datos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminActivities;