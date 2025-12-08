import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Upload, 
  Download, 
  List, 
  Calendar,
  CalendarRange,
  MapPin,
  Users,
  Clock,
  Edit,
  Trash2
} from 'lucide-react';

import AdminLayout from "@/components/AdminLayout";
import { PageHeader } from '@/components/ui/page-header';
import { Toolbar } from '@/components/ui/toolbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import ROUTES from '@/routes';
import { apiRequest } from '@/lib/queryClient';

// Tipos
interface ProgrammingItem {
  id: number;
  type: 'activity' | 'event';
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  price: string;
  isFree: boolean;
  isRecurring: boolean;
  duration: number;
  parkId: number;
  parkName: string;
  thematicAxisId: number;
  thematicAxisName: string;
  thematicAxisColor: string;
  instructorId: number;
  organizerName: string;
  imageUrl: string;
  category: string;
  subcategory: string;
  subcategoryLabel: string;
  createdAt: string;
}

interface ProgrammingStats {
  total: number;
  activities: number;
  events: number;
  thisMonth: number;
}

// Página principal del Catálogo de Programación
export default function ProgrammingCatalog() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('list');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtros
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('all');
  const [filterPrice, setFilterPrice] = useState<string>('all');

  // Selección múltiple
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Query para obtener la programación
  const { data: programmingData, isLoading } = useQuery({
    queryKey: ['/api/programming'],
    queryFn: () => apiRequest('/api/programming'),
  });

  // Query para obtener estadísticas
  const { data: statsData } = useQuery<ProgrammingStats>({
    queryKey: ['/api/programming/stats'],
    queryFn: () => apiRequest('/api/programming/stats'),
  });

  const programming: ProgrammingItem[] = programmingData?.data || [];
  const stats = statsData || { total: 0, activities: 0, events: 0, thisMonth: 0 };

  // Obtener subcategorías únicas
  const subcategories = [...new Set(programming.map(item => item.subcategory))];

  // Filtrar programación
  const filteredProgramming = programming.filter((item) => {
    // Filtro por búsqueda
    const matchesSearch = !searchQuery || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.parkName?.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtro por tipo
    const matchesType = filterType === 'all' || item.type === filterType;

    // Filtro por subcategoría
    const matchesSubcategory = filterSubcategory === 'all' || item.subcategory === filterSubcategory;

    // Filtro por precio
    const matchesPrice = filterPrice === 'all' || 
      (filterPrice === 'free' && item.isFree) ||
      (filterPrice === 'paid' && !item.isFree);

    return matchesSearch && matchesType && matchesSubcategory && matchesPrice;
  });

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Sin fecha';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Formatear precio
  const formatPrice = (price: string | number, isFree: boolean) => {
    if (isFree) return 'Gratis';
    if (!price || price === '0' || price === '0.00') return 'Gratis';
    return `$${parseFloat(String(price)).toFixed(2)}`;
  };

  // Handlers de selección
  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredProgramming.map(item => item.id));
    setSelectedItems(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDelete = () => {
    // TODO: Implementar eliminación masiva
    console.log('Eliminar items:', Array.from(selectedItems));
  };

  // Renderizar vista Grid
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredProgramming.map((item) => (
        <Card 
          key={`${item.type}-${item.id}`}
          className={`hover:shadow-lg hover:border-[#00444f] transition-all cursor-pointer overflow-hidden ${
            selectedItems.has(item.id) ? 'ring-2 ring-[#00a587]' : ''
          }`}
          onClick={() => {
            if (selectionMode) {
              handleSelectItem(item.id, !selectedItems.has(item.id));
            } else {
              setLocation(ROUTES.admin.programming.view.build(item.id));
            }
          }}
        >
          {/* Imagen */}
          <div className="relative h-40 bg-gray-100">
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ceefea] to-[#00a587]/20">
                <CalendarRange className="h-12 w-12 text-[#00444f]/30" />
              </div>
            )}
            {/* Checkbox de selección */}
            {selectionMode && (
              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectItem(item.id, e.target.checked);
                  }}
                  className="h-5 w-5 rounded border-gray-300 text-[#00a587] focus:ring-[#00a587]"
                />
              </div>
            )}
            {/* Badge de tipo */}
            <Badge 
              className={`absolute ${selectionMode ? 'top-2 left-10' : 'top-2 left-2'} ${
                item.type === 'activity' 
                  ? 'bg-[#00a587] text-white' 
                  : 'bg-[#00444f] text-white'
              }`}
            >
              {item.category}
            </Badge>
            {/* Badge de subcategoría */}
            <Badge 
              variant="secondary"
              className="absolute top-2 right-2 bg-white/90 text-[#00444f] text-xs"
            >
              {item.subcategoryLabel}
            </Badge>
          </div>

          <CardContent className="p-4">
            <h3 className="font-semibold text-[#00444f] line-clamp-1 mb-2">{item.title}</h3>

            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(item.startDate)}</span>
              </div>
              {item.parkName && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">{item.parkName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                <span>{item.capacity || 'Sin límite'} personas</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <Badge variant={item.isFree ? 'secondary' : 'default'} className={item.isFree ? 'bg-green-100 text-green-800' : 'bg-[#00444f]'}>
                {formatPrice(item.price, item.isFree)}
              </Badge>

              {!selectionMode && (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
                    onClick={() => setLocation(ROUTES.admin.programming.edit.build(item.id))}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Renderizar vista Lista/Tabla
  const renderListView = () => (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {selectionMode && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={filteredProgramming.length > 0 && selectedItems.size === filteredProgramming.length}
                  onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                  className="h-4 w-4 rounded border-gray-300 text-[#00a587] focus:ring-[#00a587]"
                />
              </TableHead>
            )}
            <TableHead>Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Capacidad</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProgramming.map((item) => (
            <TableRow 
              key={`${item.type}-${item.id}`}
              className={`cursor-pointer hover:bg-gray-50 ${selectedItems.has(item.id) ? 'bg-[#ceefea]/30' : ''}`}
              onClick={() => {
                if (selectionMode) {
                  handleSelectItem(item.id, !selectedItems.has(item.id));
                } else {
                  setLocation(ROUTES.admin.programming.view.build(item.id));
                }
              }}
            >
              {selectionMode && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#00a587] focus:ring-[#00a587]"
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <CalendarRange className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <span className="font-medium">{item.title}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge 
                    className={`w-fit ${
                      item.type === 'activity' 
                        ? 'bg-[#00a587] text-white' 
                        : 'bg-[#00444f] text-white'
                    }`}
                  >
                    {item.category}
                  </Badge>
                  <span className="text-xs text-gray-500">{item.subcategoryLabel}</span>
                </div>
              </TableCell>
              <TableCell>{formatDate(item.startDate)}</TableCell>
              <TableCell>
                <span className="line-clamp-1">{item.parkName || item.location || 'Sin ubicación'}</span>
              </TableCell>
              <TableCell>{item.capacity || '-'}</TableCell>
              <TableCell>
                <Badge variant={item.isFree ? 'secondary' : 'default'} className={item.isFree ? 'bg-green-100 text-green-800' : ''}>
                  {formatPrice(item.price, item.isFree)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {!selectionMode && (
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
                      onClick={() => setLocation(ROUTES.admin.programming.edit.build(item.id))}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con botones */}
        <PageHeader
          icon={<CalendarRange className="h-6 w-6" />}
          title={t('programming.catalog', 'Catálogo de Programación')}
          subtitle={t('programming.catalogDescription', 'Gestiona actividades y eventos de los parques')}
          actions={[
            <Button 
              key="add"
              variant="primary"
              onClick={() => setLocation(ROUTES.admin.programming.create)}
            >
              <Plus className="w-4 h-4 md:mr-2" />
              Nuevo
            </Button>,
            <Button 
              key="import"
              variant="secondary"
              onClick={() => {/* TODO: Implementar importación */}}
            >
              <Upload className="h-4 w-4 md:mr-2" />
              Importar
            </Button>,
            <Button 
              key="export"
              variant="tertiary"
              onClick={() => {/* TODO: Implementar exportación */}}
            >
              <Download className="h-4 w-4 md:mr-2" />
              Exportar
            </Button>,
          ]}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#00444f]">
                  <CalendarRange className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#00444f]">{stats.total}</p>
                  <p className="text-sm text-[#00444f]">{t('programming.total', 'Total Programación')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#00a587]">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#00444f]">{stats.activities}</p>
                  <p className="text-sm text-[#00444f]">{t('programming.activities', 'Actividades')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#00444f]">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#00444f]">{stats.events}</p>
                  <p className="text-sm text-[#00444f]">{t('programming.events', 'Eventos')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#ceefea] border-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#00444f]">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#00444f]">{stats.thisMonth}</p>
                  <p className="text-sm text-[#00444f]">{t('programming.thisMonth', 'Este Mes')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar - Arriba de los Tabs */}
        <Toolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Buscar programación..."
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          availableViewModes={['cards', 'table']}
          selectionMode={selectionMode}
          selectedCount={selectedItems.size}
          onToggleSelection={() => {
            setSelectionMode(!selectionMode);
            if (selectionMode) setSelectedItems(new Set());
          }}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkDelete={handleBulkDelete}
          filters={
            <div className="flex gap-2">
              {/* Filtro por tipo */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">Todos los tipos</option>
                <option value="activity">Actividades</option>
                <option value="event">Eventos</option>
              </select>

              {/* Filtro por subcategoría */}
              <select
                value={filterSubcategory}
                onChange={(e) => setFilterSubcategory(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">Todas las subcategorías</option>
                <option value="actividad_pequena">Actividad Pequeña</option>
                <option value="actividad_mediana">Actividad Mediana</option>
                <option value="actividad_grande">Actividad Grande</option>
                <option value="evento_mini">Evento Mini</option>
                <option value="evento_mediano">Evento Mediano</option>
                <option value="evento_masivo">Evento Masivo</option>
              </select>

              {/* Filtro por precio */}
              <select
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">Todos los precios</option>
                <option value="free">Gratis</option>
                <option value="paid">Con costo</option>
              </select>
            </div>
          }
        />

        {/* Tabs - Ancho completo */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="list" className="flex items-center justify-center gap-2">
              <List className="h-4 w-4" />
              {t('programming.listView', 'Lista')}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('programming.calendarView', 'Calendario')}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Vista Lista/Grid */}
          <TabsContent value="list" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00444f] mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando programación...</p>
              </div>
            ) : filteredProgramming.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CalendarRange className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">{t('programming.empty', 'No hay programación registrada')}</p>
                <p className="text-sm">{t('programming.emptyDescription', 'Comienza creando una nueva actividad o evento')}</p>
                <Button
                  className="mt-4 bg-[#007a5e] hover:bg-[#00664e] text-white"
                  onClick={() => setLocation(ROUTES.admin.programming.create)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('programming.new', 'Nueva Programación')}
                </Button>
              </div>
            ) : (
              viewMode === 'cards' ? renderGridView() : renderListView()
            )}
          </TabsContent>

          {/* Tab 2: Vista Calendario */}
          <TabsContent value="calendar" className="mt-6">
            <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">{t('programming.calendarPlaceholder', 'Calendario')}</p>
              <p className="text-sm">{t('programming.calendarDescription', 'Aquí se mostrará el calendario de programación')}</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}