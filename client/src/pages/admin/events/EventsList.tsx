import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import { useLocation } from 'wouter';
import ROUTES from '@/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui/page-header';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Search, 
  Grid, 
  List, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Upload,
  Download,
  Brush,
  CopyCheck,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  ImageIcon
} from 'lucide-react';

// Interfaces
interface Event {
  id: number;
  title: string;
  description?: string;
  eventType?: string;
  category?: string;
  categoryId?: number;
  targetAudience?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  capacity?: number;
  registeredCount?: number;
  organizerName?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  organizerOrganization?: string;
  price?: number;
  registrationType?: string;
  imageUrl?: string;
  featuredImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  organizer?: string;
  parkName?: string;
  parks?: Array<{ id: number; name: string; address?: string }>;
  parkIds?: number[];
  requiresApproval?: boolean;
  isFree?: boolean;
  notes?: string;
  latitude?: number;
  longitude?: number;
  geolocation?: any;
}

interface EventFormData {
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity?: number;
  registrationType: string;
  status: string;
  date?: string;
  time?: string;
}

const EventsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [parkFilter, setParkFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
    
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 9;
  
  // Estados para selección múltiple
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
  
  // Estados para dialogs de bulk delete e import
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Obtener eventos desde el backend
  const { data: eventsData = [], isLoading } = useQuery({
    queryKey: ['/api/events'],
    retry: 1
  });

  // Obtener parques para el filtro
  const { data: parksData = [] } = useQuery({
    queryKey: ['/api/parks'],
    retry: 1
  });

  // Obtener categorías de eventos
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['/api/event-categories'],
    retry: 1
  });

  // Mutación para eliminar evento
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) => apiRequest(`/api/events/${eventId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Evento eliminado",
        description: "El evento ha sido eliminado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento.",
        variant: "destructive",
      });
    }
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (eventIds: number[]) => {
      return await apiRequest('/api/events/bulk-delete', {
        method: 'POST',
        data: { eventIds },
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Eventos eliminados",
        description: `Se eliminaron ${selectedEvents.size} eventos exitosamente.`,
      });
      setShowBulkDeleteDialog(false);
      setSelectedEvents(new Set());
      setSelectionMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudieron eliminar los eventos seleccionados.",
        variant: "destructive",
      });
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (csvData: any[]) => {
      return await apiRequest('/api/events/import', {
        method: 'POST',
        data: { events: csvData },
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Importación exitosa",
        description: `Se han importado ${response.imported || 0} eventos correctamente.`,
      });
      setShowImportDialog(false);
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error en importación",
        description: error.message || "Hubo un problema al importar los eventos.",
        variant: "destructive"
      });
    },
  });

  // Selection handlers
  const handleSelectEvent = (eventId: number, checked: boolean) => {
    const newSelected = new Set(selectedEvents);
    if (checked) {
      newSelected.add(eventId);
    } else {
      newSelected.delete(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleSelectAllEvents = () => {
    const allEventIds = new Set(currentEvents.map(event => event.id));
    setSelectedEvents(allEventIds);
  };

  const handleDeselectAllEvents = () => {
    setSelectedEvents(new Set());
  };

  const handleBulkDeleteClick = () => {
    if (selectedEvents.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const handleBulkDeleteConfirm = () => {
    const eventIds = Array.from(selectedEvents);
    bulkDeleteMutation.mutate(eventIds);
  };

  // Funciones para manejar las acciones
  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowViewDialog(true);
  };

  const handleEditEvent = (event: Event) => {
    // Navegación usando wouter 
    setLocation(ROUTES.admin.events.edit.build(event.id));
  };

  const handleDeleteEvent = (eventId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      deleteEventMutation.mutate(eventId);
    }
  };

  // CSV Export function
  const handleExportCSV = () => {
    try {
      if (!Array.isArray(events) || events.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay eventos para exportar.",
          variant: "destructive"
        });
        return;
      }

      // Create CSV template based on actual Event fields
      const csvHeaders = [
        'título',
        'descripción',
        'tipoEvento',
        'categoría',
        'públicoObjetivo',
        'fechaInicio',
        'fechaFin',
        'horaInicio',
        'horaFin',
        'ubicación',
        'parquesAsociados',
        'capacidad',
        'tipoRegistro',
        'nombreOrganizador',
        'organizaciónOrganizador',
        'emailOrganizador',
        'telefonoOrganizador',
        'precio',
        'esGratis',
        'requiereAprobación',
        'notas',
        'latitud',
        'longitud',
        'estado'
      ];

      // Map events data to CSV format using real Event fields
      const csvData = events.map((event: Event) => {        
        return [
          event.title || '',
          event.description || '',
          event.eventType || '',
          event.category || '',
          event.targetAudience || '',
          event.startDate || '',
          event.endDate || '',
          event.startTime || '',
          event.endTime || '',
          event.location || '',
          event.parks ? event.parks.map(p => p.name).join('; ') : event.parkName || '',
          event.capacity || '',
          event.registrationType || '',
          event.organizerName || '',
          event.organizerOrganization || '',
          event.organizerEmail || '',
          event.organizerPhone || '',
          event.price || '',
          event.isFree ? 'Sí' : 'No',
          event.requiresApproval ? 'Sí' : 'No',
          event.notes || '',
          event.latitude || '',
          event.longitude || '',
          event.status || ''
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
      link.setAttribute('download', `eventos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportación exitosa",
        description: `Se han exportado ${events.length} eventos al archivo CSV.`,
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
        'tipoEvento',
        'categoría',
        'públicoObjetivo',
        'fechaInicio',
        'fechaFin',
        'horaInicio',
        'horaFin',
        'ubicación',
        'parquesAsociados',
        'capacidad',
        'tipoRegistro',
        'nombreOrganizador',
        'organizaciónOrganizador',
        'emailOrganizador',
        'telefonoOrganizador',
        'precio',
        'esGratis',
        'requiereAprobación',
        'notas',
        'latitud',
        'longitud',
        'estado'
      ];

      // Add example row with proper Spanish format matching Event interface
      const exampleRow = [
        'Festival de Primavera',
        'Celebración de la llegada de la primavera con actividades familiares.',
        'cultural',
        'Cultural',
        'all',
        '2025-03-15',
        '2025-03-15',
        '10:00:00',
        '18:00:00',
        'Plaza Central',
        'Parque Central; Parque Norte',
        '200',
        'free',
        'María González',
        'Departamento de Eventos',
        'maria@parques.gob.mx',
        '3312345678',
        '0',
        'Sí',
        'No',
        'Evento familiar con actividades para todas las edades',
        '20.6597',
        '-103.3496',
        'published'
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
      link.setAttribute('download', 'plantilla_eventos.csv');
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

  const events: Event[] = Array.isArray(eventsData?.data) ? eventsData.data : Array.isArray(eventsData) ? eventsData : [];
  const parks: any[] = Array.isArray(parksData?.data) ? parksData.data : Array.isArray(parksData) ? parksData : [];
  const categories: any[] = Array.isArray(categoriesData?.data) ? categoriesData.data : Array.isArray(categoriesData) ? categoriesData : [];

  // Mapeo de event_type a nombres de categorías
  const categoryMapping: Record<string, string> = {
    'cultural': 'Culturales',
    'sports': 'Deportivos', 
    'recreativo': 'Recreativos',
    'comunitarios': 'Comunitarios',
    'educational': 'Educativos',
    'environmental': 'Ambientales',
    'social': 'Sociales'
  };

  // Función para obtener el color de una categoría por event_type
  const getCategoryColor = (eventType: string) => {
    const categoryName = categoryMapping[eventType] || eventType;
    const category = categories?.find((cat: any) => cat.name === categoryName);
    return category?.color || '#6b7280';
  };

  // Función para obtener el nombre en español de una categoría
  const getCategoryDisplayName = (eventType: string) => {
    return categoryMapping[eventType] || eventType;
  };

  // Función para obtener el estilo del badge de categoría
  const getCategoryBadgeStyle = (categoryName: string) => {
    const color = getCategoryColor(categoryName);
    return {
      borderColor: color,
      color: color,
      backgroundColor: `${color}20`
    };
  };

  // Mapeo de estados a colores y etiquetas
  const statusColors = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-800',
    upcoming: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800'
  } as const;

  const statusLabels = {
    published: 'Publicado',
    draft: 'Borrador',
    upcoming: 'Próximo',
    ongoing: 'En curso',
    completed: 'Completado',
    cancelled: 'Cancelado'
  } as const;


  // Estilos de estado
  const eventStatusColors = {
    upcoming: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    published: 'bg-emerald-100 text-emerald-800',
    draft: 'bg-yellow-100 text-yellow-800'
  };

  const filteredEvents = events.filter((event: Event) => {
    const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || 
                        event.eventType === categoryFilter ||
                        (event.categoryId && event.categoryId.toString() === categoryFilter) ||
                        (categories.find(cat => cat.id?.toString() === categoryFilter)?.name === event.eventType);
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesPark = parkFilter === 'all' || 
                        event.location === parkFilter || 
                        event.parkName === parkFilter ||
                        event.parks?.some(p => p.name === parkFilter || p.id?.toString() === parkFilter);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPark;
  });

  // Pagination calculations
  const totalEvents = filteredEvents.length;
  const totalPages = Math.ceil(totalEvents / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, parkFilter]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      return time.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return timeString;
    }
  };

  const formatEventDateTime = (event: Event) => {
    const startDate = event.startDate ? formatDate(event.startDate) : '';
    const startTime = event.startTime ? formatTime(event.startTime) : '';
    
    if (event.startDate && event.endDate && event.startDate !== event.endDate) {
      const endDate = formatDate(event.endDate);
      return `${startDate} - ${endDate}`;
    }
    
    return `${startDate} ${startTime}`.trim();
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return 'Gratis';
    if (price === 0) return 'Gratis';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a587] mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando eventos...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Listado de eventos"
          subtitle="Eventos registrados en el sistema"
          icon={<List />}
          actions={[
            <Button
              key="new-event"
              onClick={() => setLocation(ROUTES.admin.events.create)}
              className="bg-[#a0cc4d] hover:bg-[#00a587] text-white"
              data-testid="button-new-event"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo
            </Button>,
            <Button
              key="importar"
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              className="border-[#f4f5f7v] text-[#00444f] hover:bg-[#00a587] hover:text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>,
            <Button
              key="exportar"
              variant="outline"
              onClick={handleExportCSV}
              className="bg-[#00444f] text-[#ffffff] hover:bg-[#00a587] hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          ]}
        />

        {/* Filtros y controles */}
        <div className="bg-white p-4 rounded-lg">
          <div className="flex flex-wrap items-start justify-start gap-3">
            <div className="relative flex-1 min-w-[280px] max-w-lg">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
                data-testid="input-search-events"
              />
            </div>
            <div className="min-w-[160px]">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[160px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="upcoming">Próximos</SelectItem>
                  <SelectItem value="ongoing">En curso</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[160px]">
              <Select value={parkFilter} onValueChange={setParkFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por parque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los parques</SelectItem>
                  {parks.map((park: any) => (
                    <SelectItem key={park.id} value={park.name}>{park.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botón limpiar filtros */}
            <div className="flex rounded-lg items-center border-gray-300 border">
              <Button 
                variant="outline" 
                size="default"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setParkFilter('all');
                }} 
                className="h-9 w-10 p-0 flex items-center justify-center"
                data-testid="button-clear-filters"
                title="Limpiar filtros"
              >
                <Brush className="h-4 w-4" />
              </Button>
            </div>

            {/* Toggle de vista */}
            <div className="ml-auto">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className={`${viewMode === 'cards' ? 'bg-[#00a587] text-white' : 'text-gray-600'}`}
                  data-testid="button-view-cards"
                >
                  <Grid className="h-6 w-6" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={`${viewMode === 'table' ? 'bg-[#00a587] text-white' : 'text-gray-600'}`}
                  data-testid="button-view-table"
                >
                  <List className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Botón de selección con menú desplegable */}
            <div className="relative group">
              <Button
                variant={selectionMode ? 'default' : 'outline'}
                size="sm"
                className={`flex items-center h-11 w-11 ${selectionMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[#ededed] hover:bg-gray-200'}`}
                data-testid="button-selection-toggle"
              >
                <CopyCheck className="h-4 w-4" />
              </Button>

              {/* Dropdown menu con CSS hover */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                    data-testid="menu-enable-selection"
                  >
                    <CopyCheck className="h-4 w-4 mr-2" />
                    Selección múltiple
                  </button>
                  <button
                    onClick={() => {
                      if (!selectionMode) {
                        setSelectionMode(true);
                      }
                      handleSelectAllEvents();
                    }}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                    data-testid="menu-select-all"
                  >
                    <CheckSquare className="h-5 w-5 mr-2" />
                    Seleccionar todo
                  </button>
                  <button
                    onClick={() => {
                      handleDeselectAllEvents();
                      setSelectionMode(false);
                    }}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
                    data-testid="menu-deselect-all"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Deseleccionar
                  </button>
                </div>
              </div>
            </div>

            {/* Botón para eliminar elementos independiente */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteClick}
              className="flex items-center"
              disabled={selectedEvents.size === 0}
              data-testid="button-delete-selected"
            >
              <Trash2 className="h-4 w-4" />
              {selectedEvents.size > 0 ? ` (${selectedEvents.size})` : ''}
            </Button>
          </div>
        </div>

        {/* Lista de eventos */}
        <div className="rounded-xl overflow-hidden">
          {filteredEvents.length === 0 ? (
            <div className="py-16 flex justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-2">No se encontraron eventos</p>
                {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || parkFilter !== 'all') && (
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setParkFilter('all');
                  }}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'table' ? (
                <div className="p-0">
                  <div className="grid grid-cols-1 gap-4">
                    {currentEvents.map((event: Event) => (
                      <div key={event.id} className="bg-white border rounded-2xl hover:shadow-md hover:border-[#00444f] transition-shadow duration-200 overflow-hidden">
                        {/* Modo lista horizontal */}
                        <div className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              {selectionMode && (
                                <div className="float-right ml-4">
                                  <Checkbox
                                    checked={selectedEvents.has(event.id)}
                                    onCheckedChange={(checked) => handleSelectEvent(event.id, checked as boolean)}
                                    className="bg-white/80 data-[state=checked]:bg-blue-600"
                                    data-testid={`checkbox-event-table-${event.id}`}
                                  />
                                </div>
                              )}
                              <div className="flex items-center gap-4 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {event.title}
                                </h3>
                                <Badge className={statusColors[event.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                                  {statusLabels[event.status as keyof typeof statusLabels] || event.status}
                                </Badge>
                                {event.eventType && (
                                  <span 
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                                    style={getCategoryBadgeStyle(event.eventType)}
                                  >
                                    <div 
                                      className="w-2 h-2 rounded-full mr-1" 
                                      style={{ backgroundColor: getCategoryColor(event.eventType) }}
                                    />
                                    {getCategoryDisplayName(event.eventType)}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatEventDateTime(event)}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  <div className="flex flex-col">
                                    <span>{event.location || 'Ubicación no especificada'}</span>
                                    {event.parks && event.parks.length > 0 && (
                                      <span className="text-xs text-blue-600 mt-1">
                                        {event.parks.length === 1 
                                          ? event.parks[0].name 
                                          : `${event.parks[0].name} +${event.parks.length - 1} más`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  {event.registeredCount || 0}/{event.capacity || 0}
                                </div>
                                {event.price !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-green-600">
                                      {formatPrice(event.price)}
                                    </span>
                                    {event.isFree && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Gratis
                                      </span>
                                    )}
                                    {event.requiresApproval && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        Requiere aprobación
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Campos adicionales en vista lista */}
                              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                {event.targetAudience && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                                    {event.targetAudience === 'all' ? 'Todo público' :
                                     event.targetAudience === 'children' ? 'Niños' :
                                     event.targetAudience === 'youth' ? 'Jóvenes' :
                                     event.targetAudience === 'adults' ? 'Adultos' :
                                     event.targetAudience === 'seniors' ? 'Adultos mayores' :
                                     event.targetAudience === 'families' ? 'Familias' :
                                     event.targetAudience}
                                  </span>
                                )}
                                {event.organizerOrganization && (
                                  <span className="text-gray-600">
                                    📋 {event.organizerOrganization}
                                  </span>
                                )}
                                {event.notes && (
                                  <span className="text-gray-600 truncate max-w-32" title={event.notes}>
                                    📝 {event.notes.substring(0, 30)}{event.notes.length > 30 ? '...' : ''}
                                  </span>
                                )}
                                {event.latitude && event.longitude && (
                                  <span className="text-gray-600">
                                    📍 GPS
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewEvent(event)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditEvent(event)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteEvent(event.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {currentEvents.map((event: Event) => (
                      <div key={event.id} className="bg-white border rounded-2xl hover:shadow-md hover:border-[#00444f] transition-shadow duration-200 overflow-hidden">
                        {/* Imagen de la actividad */}
                        <div className="relative h-48 bg-gray-100">
                          {selectionMode && (
                            <div className="absolute top-2 right-2 z-10">
                              <Checkbox
                                checked={selectedEvents.has(event.id)}
                                onCheckedChange={(checked) => handleSelectEvent(event.id, checked as boolean)}
                                className="bg-white/80 data-[state=checked]:bg-blue-600"
                                data-testid={`checkbox-event-card-${event.id}`}
                              />
                            </div>
                          )}
                          {(event.imageUrl || event.featuredImageUrl) ? (
                            <img 
                              src={event.imageUrl || event.featuredImageUrl}
                              alt={event.title}
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
                          {/* Badge de estado arriba a la izquierda */}
                          <div className="absolute top-2 left-2">
                            <Badge className={statusColors[event.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                              {statusLabels[event.status as keyof typeof statusLabels] || event.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Header de la ficha */}
                        <div className="p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <h3 className="font-poppins font-bold text-gray-900 line-clamp-2 flex-1 mr-2">{event.title}</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                              #{event.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {event.eventType && (
                              <span 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-poppins font-medium"
                                style={{ backgroundColor: getCategoryColor(event.eventType) + '20', color: getCategoryColor(event.eventType), borderColor: getCategoryColor(event.eventType) }}
                              >
                                {getCategoryDisplayName(event.eventType)}
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-poppins font-medium ${statusColors[event.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                              <span className="mr-1"></span>
                              {statusLabels[event.status as keyof typeof statusLabels] || event.status}
                            </span>
                          </div>
                        </div>
                        
                        {/* Contenido de la ficha */}
                        <div className="p-4">
                          
                          {event.description && (
                            <p className="text-sm text-gray-800 font-poppins mb-3">
                              {event.description}
                            </p>
                          )}
                          
                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{formatEventDateTime(event)}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              <div className="flex flex-col">
                                <span>{event.location || 'Ubicación no especificada'}</span>
                                {event.parks && event.parks.length > 0 && (
                                  <span className="text-xs text-blue-600 mt-1">
                                    {event.parks.length === 1 
                                      ? event.parks[0].name 
                                      : `${event.parks[0].name} +${event.parks.length - 1} más`}
                                  </span>
                                )}
                              </div>
                            </div>
                            {event.capacity && (
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{event.registeredCount || 0} / {event.capacity} participantes</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Campos adicionales en vista grid */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                            {event.targetAudience && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                                {event.targetAudience === 'all' ? 'Todo público' :
                                 event.targetAudience === 'children' ? 'Niños' :
                                 event.targetAudience === 'youth' ? 'Jóvenes' :
                                 event.targetAudience === 'adults' ? 'Adultos' :
                                 event.targetAudience === 'seniors' ? 'Adultos mayores' :
                                 event.targetAudience === 'families' ? 'Familias' :
                                 event.targetAudience}
                              </span>
                            )}
                            {event.isFree && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 text-green-700">
                                Gratis
                              </span>
                            )}
                            {event.requiresApproval && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                                Requiere aprobación
                              </span>
                            )}
                            {event.organizerOrganization && (
                              <span className="text-gray-600 truncate">
                                📋 {event.organizerOrganization}
                              </span>
                            )}
                            {event.notes && (
                              <span className="text-gray-600 truncate" title={event.notes}>
                                📝 {event.notes.substring(0, 20)}...
                              </span>
                            )}
                            {event.latitude && event.longitude && (
                              <span className="text-gray-600">
                                📍 GPS
                              </span>
                            )}
                          </div>
                          
                          {/* Botones de acción */}
                          <div className="flex justify-between items-center pt-3 border-t">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                              onClick={() => handleEditEvent(event)}
                              data-testid={`button-edit-${event.id}`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                              onClick={() => handleDeleteEvent(event.id)}
                              data-testid={`button-delete-${event.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>
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

        {/* Pagination - Always visible */}
        <div className="bg-white rounded-lg shadow-sm border mt-4 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <div>Mostrando {Math.min(startIndex + 1, totalEvents)}-{Math.min(endIndex, totalEvents)} de {totalEvents} eventos</div>
              <div className="text-xs text-blue-600 mt-1">
                Páginas calculadas: {totalPages} | Página actual: {currentPage} | Por página: {eventsPerPage}
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

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Importar Eventos desde CSV</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Selecciona un archivo CSV con los datos de los eventos para importar.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Plantilla
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="csv-file" className="text-sm font-medium">
                  Archivo CSV
                </label>
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setImportFile(file || null);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportFile(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!importFile || importMutation.isPending}
                onClick={() => {
                  if (!importFile) return;
                  
                  Papa.parse(importFile, {
                    header: true,
                    skipEmptyLines: true,
                    encoding: "UTF-8",
                    complete: (results) => {
                      if (results.errors.length > 0) {
                        toast({
                          title: "Error en archivo CSV",
                          description: "El archivo CSV tiene errores de formato.",
                          variant: "destructive"
                        });
                        return;
                      }

                      // Map CSV data to Event interface
                      const events = results.data.map((row: any) => ({
                        title: row['título'] || '',
                        description: row['descripción'] || '',
                        eventType: row['tipoEvento'] || '',
                        category: row['categoría'] || '',
                        targetAudience: row['públicoObjetivo'] || 'all',
                        startDate: row['fechaInicio'] || null,
                        endDate: row['fechaFin'] || null,
                        startTime: row['horaInicio'] || null,
                        endTime: row['horaFin'] || null,
                        location: row['ubicación'] || '',
                        parkNames: row['parquesAsociados'] || '', // Will be processed into park IDs
                        capacity: row['capacidad'] ? parseInt(row['capacidad']) : null,
                        registrationType: row['tipoRegistro'] || 'free',
                        organizerName: row['nombreOrganizador'] || '',
                        organizerOrganization: row['organizaciónOrganizador'] || '',
                        organizerEmail: row['emailOrganizador'] || '',
                        organizerPhone: row['telefonoOrganizador'] || '',
                        price: row['precio'] ? parseFloat(row['precio']) : 0,
                        isFree: row['esGratis'] === 'Sí' || row['esGratis'] === 'true',
                        requiresApproval: row['requiereAprobación'] === 'Sí' || row['requiereAprobación'] === 'true',
                        notes: row['notas'] || '',
                        latitude: row['latitud'] ? parseFloat(row['latitud']) : null,
                        longitude: row['longitud'] ? parseFloat(row['longitud']) : null,
                        status: row['estado'] || 'draft'
                      })).filter((event: any) => event.title.trim() !== ''); // Filter out empty rows

                      if (events.length === 0) {
                        toast({
                          title: "Archivo vacío",
                          description: "No se encontraron eventos válidos en el archivo.",
                          variant: "destructive"
                        });
                        return;
                      }

                      importMutation.mutate(events);
                    },
                    error: (error) => {
                      toast({
                        title: "Error al procesar archivo",
                        description: "No se pudo leer el archivo CSV. Verifique el formato.",
                        variant: "destructive"
                      });
                    }
                  });
                }}
              >
                {importMutation.isPending ? 'Importando...' : 'Importar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar eventos seleccionados?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminarán {selectedEvents.size} eventos de forma permanente. 
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? 'Eliminando...' : 'Eliminar eventos'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Event Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-5 w-5 text-[#00a587]" />
                Detalles del Evento
              </DialogTitle>
            </DialogHeader>
            
            {selectedEvent && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Imagen */}
                  <div className="lg:col-span-1">
                    <div className="relative h-64 lg:h-80 rounded-lg overflow-hidden bg-gray-100">
                      {(selectedEvent.imageUrl || selectedEvent.featuredImageUrl) ? (
                        <img 
                          src={selectedEvent.imageUrl || selectedEvent.featuredImageUrl}
                          alt={selectedEvent.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Sin imagen</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Badge de estado en la imagen */}
                      <div className="absolute top-3 right-3">
                        <Badge className={statusColors[selectedEvent.status as keyof typeof statusColors]}>
                          {statusLabels[selectedEvent.status]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Información básica */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Título y categoría */}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedEvent.title}
                      </h2>
                      <div className="flex items-center gap-3">
                        {selectedEvent.eventType && (
                          <span 
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                            style={getCategoryBadgeStyle(selectedEvent.eventType)}
                          >
                            <div 
                              className="w-2 h-2 rounded-full mr-2" 
                              style={{ backgroundColor: getCategoryColor(selectedEvent.eventType) }}
                            />
                            {getCategoryDisplayName(selectedEvent.eventType)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Información clave */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">Fechas y Horarios</h3>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {formatEventDateTime(selectedEvent)}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">Ubicación</h3>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {selectedEvent.location || 'Ubicación no especificada'}
                          </div>
                        </div>
                        
                        {selectedEvent.organizerName && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">Organizador</h3>
                            <div className="text-sm text-gray-600">
                              <p>{selectedEvent.organizerName}</p>
                              {selectedEvent.organizerOrganization && (
                                <p className="text-gray-500">{selectedEvent.organizerOrganization}</p>
                              )}
                              {selectedEvent.organizerEmail && (
                                <p className="text-blue-600">{selectedEvent.organizerEmail}</p>
                              )}
                              {selectedEvent.organizerPhone && (
                                <p>{selectedEvent.organizerPhone}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedEvent.targetAudience && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">Público objetivo</h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {selectedEvent.targetAudience === 'all' ? 'Todo público' :
                               selectedEvent.targetAudience === 'children' ? 'Niños' :
                               selectedEvent.targetAudience === 'youth' ? 'Jóvenes' :
                               selectedEvent.targetAudience === 'adults' ? 'Adultos' :
                               selectedEvent.targetAudience === 'seniors' ? 'Adultos mayores' :
                               selectedEvent.targetAudience === 'families' ? 'Familias' :
                               selectedEvent.targetAudience}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {selectedEvent.capacity && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">Capacidad</h3>
                            <div className="flex items-center text-sm text-gray-600">
                              <Users className="h-4 w-4 mr-2 text-gray-400" />
                              {selectedEvent.registeredCount || 0} / {selectedEvent.capacity} participantes
                            </div>
                          </div>
                        )}
                        
                        {selectedEvent.price !== undefined && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">Precio</h3>
                            <div className="space-y-1">
                              <span className="text-sm font-medium text-green-600">
                                {formatPrice(selectedEvent.price)}
                              </span>
                              {selectedEvent.isFree && (
                                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Evento gratuito
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedEvent.requiresApproval && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">Registro</h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Requiere aprobación
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección adicional: Parques asociados y información extra */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información adicional</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Parques asociados */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Parques asociados</h4>
                      {selectedEvent.parks && selectedEvent.parks.length > 0 ? (
                        <div className="space-y-2">
                          {selectedEvent.parks.map((park) => (
                            <div key={park.id} className="bg-white p-3 rounded-lg border">
                              <div className="font-medium text-sm text-gray-900">{park.name}</div>
                              {park.address && (
                                <div className="text-xs text-gray-500 mt-1">{park.address}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 bg-white p-3 rounded-lg border">
                          {selectedEvent.parkName || 'No hay parques asociados a este evento'}
                        </div>
                      )}
                    </div>

                    {/* Información adicional */}
                    <div className="space-y-4">
                      {selectedEvent.notes && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Notas</h4>
                          <div className="bg-white p-3 rounded-lg border text-sm text-gray-700">
                            {selectedEvent.notes}
                          </div>
                        </div>
                      )}
                      
                      {(selectedEvent.latitude && selectedEvent.longitude) && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Coordenadas GPS</h4>
                          <div className="bg-white p-3 rounded-lg border text-sm text-gray-700">
                            <div className="space-y-1">
                              <div>Latitud: {selectedEvent.latitude}</div>
                              <div>Longitud: {selectedEvent.longitude}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Descripción completa */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
                
                {/* Botones de acción */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={() => handleEditEvent(selectedEvent)}
                    className="bg-[#00a587] hover:bg-[#067f5f] text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Evento
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowViewDialog(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default EventsList;