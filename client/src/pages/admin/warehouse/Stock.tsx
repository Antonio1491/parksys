import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import ROUTES from '@/routes'
import {
  Package,
  Search,
  AlertTriangle,
  MapPin,
  Plus,
  Grid3X3,
  List,
  Filter,
  X,
  Download,
  Upload,
  BarChart3,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { AdminLayout } from '@/components/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type {
  InventoryStock,
  Consumable,
  Park,
  ConsumableCategory
} from '@shared/schema';

// Tipos extendidos para el componente
type StockWithRelations = InventoryStock & {
  consumable?: Consumable & {
    category?: ConsumableCategory;
  };
  park?: Park;
};

export default function StockPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ===== ESTADO DE FILTROS =====
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPark, setSelectedPark] = useState<string>('all');  // 'all' matches select option
  const [showLowStock, setShowLowStock] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all'); // all, low, out, normal
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, available, reserved
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // ===== NAVEGACIÓN =====
  const handleNew = () => {
    setLocation(ROUTES.admin.warehouse.stock.create);
  };

  const handleEdit = (stock: StockWithRelations) => {
    setLocation(ROUTES.admin.warehouse.stock.edit.build(stock.id));
  };

  const handleView = (stock: StockWithRelations) => {
    setLocation(ROUTES.admin.warehouse.stock.view.build(stock.id));
  };

  // ===== QUERIES =====
  const { data: parksResponse, isLoading: parksLoading } = useQuery<{data: Park[]}>({
    queryKey: ['/api/parks'],
    queryFn: () => apiRequest('/api/parks'),
  });
  
  const parks = parksResponse?.data || [];

  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery<{data: ConsumableCategory[]}>({
    queryKey: ['/api/warehouse/categories'],
    queryFn: () => apiRequest('/api/warehouse/categories'),
  });
  
  const categories = categoriesResponse?.data || [];

  const { data: stockResponse, isLoading: stockLoading } = useQuery<{
    data: StockWithRelations[];
    total: number;
    page: number;
    totalPages: number;
    stats: {
      totalItems: number;
      lowStock: number;
      outOfStock: number;
      totalValue: number;
    };
  }>({
    queryKey: ['/api/warehouse/stock', { 
      parkId: selectedPark !== 'all' ? selectedPark : undefined,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined, 
      search: searchTerm || undefined, 
      stockFilter: stockFilter !== 'all' ? stockFilter : undefined,
      statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
      lowStock: showLowStock || undefined,
      page: currentPage,
      limit: pageSize
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedPark !== 'all') params.append('parkId', selectedPark);
      if (selectedCategory !== 'all') params.append('categoryId', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      if (stockFilter !== 'all') params.append('stockFilter', stockFilter);
      if (statusFilter !== 'all') params.append('statusFilter', statusFilter);
      if (showLowStock) params.append('lowStock', 'true');
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      return apiRequest(`/api/warehouse/stock?${params}`);
    }
  });
  
  const stock = stockResponse?.data || [];
  const stats = stockResponse?.stats || {
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  };

  // ===== FUNCIONES UTILITARIAS =====
  const hasActiveFilters = Boolean(
    searchTerm || 
    selectedPark !== 'all' || 
    selectedCategory !== 'all' ||
    stockFilter !== 'all' ||
    statusFilter !== 'all' ||
    showLowStock
  );
  
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedPark('all');
    setSelectedCategory('all');
    setStockFilter('all');
    setStatusFilter('all');
    setShowLowStock(false);
    setCurrentPage(1);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };
  
  const getAvailableQuantity = (item: StockWithRelations) => {
    return Math.max(0, (item.quantity ?? 0) - (item.reservedQuantity ?? 0));
  };
  
  const getStockStatus = (item: StockWithRelations) => {
    if ((item.quantity ?? 0) <= 0) {
      return { status: 'Sin Stock', variant: 'destructive' as const };
    }
    const min = item.consumable?.minimumStock ?? 0;
    if (min > 0 && (item.quantity ?? 0) <= min) {
      return { status: 'Stock Bajo', variant: 'secondary' as const };
    }
    return { status: 'En Stock', variant: 'default' as const };
  };
  
  // ===== MUTACIONES =====
  const deleteStockMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/warehouse/stock/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock'] });
      toast({ title: 'Eliminado', description: 'Stock eliminado correctamente' });
    }
  });
  
  const handleDelete = (item: StockWithRelations) => {
    if (window.confirm(`¿Eliminar stock de "${item.consumable?.name ?? 'consumible'}"?`)) {
      deleteStockMutation.mutate(item.id);
    }
  };
  
  // ===== PAGINACIÓN =====
  const totalPages = stockResponse?.totalPages || 1;
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentPage(i)}
          data-testid={`pagination-${i}`}
        >
          {i}
        </Button>
      );
    }
    
    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          data-testid="pagination-prev"
        >
          Anterior
        </Button>
        {pages}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          data-testid="pagination-next"
        >
          Siguiente
        </Button>
      </div>
    );
  };

  return (
    <AdminLayout title="Inventario de Stock" subtitle="Gestiona y monitorea el stock disponible en cada ubicación">
      <div className="w-auto mx-auto" data-testid="stock-page">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              📦 Inventario de Stock
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Gestiona y monitorea el stock disponible en cada ubicación
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-export-csv">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={handleNew} data-testid="button-add-stock">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Stock
            </Button>
          </div>
        </div>
        
        {/* ESTADÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Items</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300" data-testid="stat-total-items">
                    {stats.totalItems.toLocaleString('es-MX')}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Stock Bajo</p>
                  <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300" data-testid="stat-low-stock">
                    {stats.lowStock.toLocaleString('es-MX')}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Sin Stock</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300" data-testid="stat-out-stock">
                    {stats.outOfStock.toLocaleString('es-MX')}
                  </p>
                </div>
                <Package className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Valor Total</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300" data-testid="stat-total-value">
                    {formatCurrency(stats.totalValue)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FILTROS Y CONTROLES */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Búsqueda */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por consumible, código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-stock"
                />
              </div>
              
              {/* Filtro de Parque */}
              <Select value={selectedPark} onValueChange={setSelectedPark}>
                <SelectTrigger className="w-full lg:w-[200px]" data-testid="select-park-filter">
                  <SelectValue placeholder="Seleccionar parque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los parques</SelectItem>
                  {Array.isArray(parks) && parks.map((park: Park) => (
                    <SelectItem key={park.id} value={park.id.toString()}>
                      {park.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Filtro de Categoría */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-[200px]" data-testid="select-category-filter">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {Array.isArray(categories) && categories.map((category: ConsumableCategory) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Filtro de Stock */}
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full lg:w-[180px]" data-testid="select-stock-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el stock</SelectItem>
                  <SelectItem value="normal">En stock</SelectItem>
                  <SelectItem value="low">Stock bajo</SelectItem>
                  <SelectItem value="out">Sin stock</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Filtro de Estado */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-[180px]" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="reserved">Con reservas</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Toggle Stock Bajo */}
              <Button
                variant={showLowStock ? "default" : "outline"}
                onClick={() => setShowLowStock(!showLowStock)}
                data-testid="button-toggle-low-stock"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Alertas
              </Button>
              
              {/* Reset Filters */}
              {hasActiveFilters && (
                <Button variant="outline" onClick={resetFilters} data-testid="button-reset-filters">
                  <X className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              )}
            </div>
            
            {/* Controles de Vista */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium">{stock.length}</span> de{' '}
                <span className="font-medium">{stockResponse?.total || 0}</span> elementos
              </div>
              
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'cards' | 'table')} className="w-auto">
                <TabsList>
                  <TabsTrigger value="cards" data-testid="view-cards">
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Tarjetas
                  </TabsTrigger>
                  <TabsTrigger value="table" data-testid="view-table">
                    <List className="h-4 w-4 mr-2" />
                    Tabla
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* CONTENIDO PRINCIPAL */}
        <Tabs value={viewMode} className="w-full">
          <TabsContent value="cards">
            {stockLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse"></div>
                        <div className="h-3 bg-muted rounded animate-pulse"></div>
                        <div className="h-8 bg-muted rounded animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stock.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron elementos</h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters ? 'No hay stock que coincida con los filtros aplicados.' : 'No hay stock registrado aún.'}
                </p>
                {!hasActiveFilters && (
                  <Button onClick={handleNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primer Stock
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="stock-grid">
                {stock.map((item: StockWithRelations) => {
                  const stockStatus = getStockStatus(item);
                  const availableQty = getAvailableQuantity(item);
                  
                  return (
                    <Card key={item.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 flex-1 mr-4">
                            <CardTitle className="text-lg line-clamp-2">
                              {item.consumable?.name || 'Consumible desconocido'}
                            </CardTitle>
                            <CardDescription className="font-mono text-sm">
                              {item.consumable?.code}
                            </CardDescription>
                            {item.consumable?.category && (
                              <Badge variant="outline" className="text-xs">
                                {item.consumable.category.name}
                              </Badge>
                            )}
                          </div>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Ubicación */}
                          {item.park && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{item.park.name}</span>
                              {item.warehouseLocation && (
                                <span className="text-xs">• {item.warehouseLocation}</span>
                              )}
                            </div>
                          )}

                          {/* Cantidades */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">Total</p>
                              <p className="text-2xl font-bold text-blue-600" data-testid={`stock-quantity-${item.id}`}>
                                {item.quantity.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.consumable?.unitOfMeasure || 'und'}
                              </p>
                            </div>
                            
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">Disponible</p>
                              <p className="text-2xl font-bold text-green-600" data-testid={`available-quantity-${item.id}`}>
                                {availableQty.toLocaleString()}
                              </p>
                              {(item.reservedQuantity ?? 0) > 0 && (
                                <p className="text-xs text-orange-600">
                                  -{item.reservedQuantity ?? 0} reservado
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Límites de stock */}
                          {(item.consumable?.minimumStock || item.consumable?.maximumStock) && (
                            <div className="grid grid-cols-2 gap-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {item.consumable?.minimumStock && (
                                <div className="text-center">
                                  <span className="text-muted-foreground text-xs block">Mínimo</span>
                                  <p className="font-medium">{item.consumable.minimumStock}</p>
                                </div>
                              )}
                              {item.consumable?.maximumStock && (
                                <div className="text-center">
                                  <span className="text-muted-foreground text-xs block">Máximo</span>
                                  <p className="font-medium">{item.consumable.maximumStock}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Acciones */}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleView(item)}
                              data-testid={`button-view-stock-${item.id}`}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleEdit(item)}
                              data-testid={`button-edit-stock-${item.id}`}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(item)}
                              disabled={deleteStockMutation.isPending}
                              data-testid={`button-delete-stock-${item.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            {renderPagination()}
          </TabsContent>
          
          {/* VISTA DE TABLA */}
          <TabsContent value="table">
            {stockLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="h-4 bg-muted rounded animate-pulse flex-1"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : stock.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron elementos</h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters ? 'No hay stock que coincida con los filtros aplicados.' : 'No hay stock registrado aún.'}
                </p>
                {!hasActiveFilters && (
                  <Button onClick={handleNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primer Stock
                  </Button>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="stock-table">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Consumible</th>
                          <th className="px-4 py-3 text-left font-medium">Código</th>
                          <th className="px-4 py-3 text-left font-medium">Categoría</th>
                          <th className="px-4 py-3 text-left font-medium">Ubicación</th>
                          <th className="px-4 py-3 text-right font-medium">Total</th>
                          <th className="px-4 py-3 text-right font-medium">Disponible</th>
                          <th className="px-4 py-3 text-center font-medium">Estado</th>
                          <th className="px-4 py-3 text-center font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stock.map((item: StockWithRelations, index) => {
                          const stockStatus = getStockStatus(item);
                          const availableQty = getAvailableQuantity(item);
                          
                          return (
                            <tr key={item.id} className={`border-b hover:bg-muted/30 transition-colors ${
                              index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
                            }`}>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium">
                                    {item.consumable?.name || 'Sin nombre'}
                                  </p>
                                  {item.warehouseLocation && (
                                    <p className="text-xs text-muted-foreground">
                                      Almacén: {item.warehouseLocation}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono text-sm">
                                {item.consumable?.code || '-'}
                              </td>
                              <td className="px-4 py-3">
                                {item.consumable?.category ? (
                                  <Badge variant="outline" className="text-xs">
                                    {item.consumable.category.name}
                                  </Badge>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">
                                    {item.park?.name || 'Sin ubicación'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div>
                                  <span className="font-bold">{item.quantity.toLocaleString()}</span>
                                  <br />
                                  <span className="text-xs text-muted-foreground">
                                    {item.consumable?.unitOfMeasure || 'und'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div>
                                  <span className="font-bold text-green-600">
                                    {availableQty.toLocaleString()}
                                  </span>
                                  {(item.reservedQuantity ?? 0) > 0 && (
                                    <>
                                      <br />
                                      <span className="text-xs text-orange-600">
                                        -{item.reservedQuantity ?? 0} res.
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant={stockStatus.variant}>
                                  {stockStatus.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleView(item)}
                                    data-testid={`button-view-stock-${item.id}`}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(item)}
                                    data-testid={`button-edit-stock-${item.id}`}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDelete(item)}
                                    disabled={deleteStockMutation.isPending}
                                    data-testid={`button-delete-stock-${item.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
            {renderPagination()}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}