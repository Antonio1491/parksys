import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import ROUTES from '@/routes';
import { Consumable, ConsumableCategory } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui/page-header';
import { 
  Plus, Edit2, Trash2, Search, Filter, X, ChevronLeft, ChevronRight,
  LayoutGrid, List, ChevronDown, Upload, FileText, Download,
  Package, AlertCircle, Eye, Zap, ShieldCheck, Clock
} from 'lucide-react';

// ===== TIPOS Y ESQUEMAS =====

// Using shared types from @shared/schema.ts
export type ConsumableWithCategory = Consumable & {
  category?: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
};

// ===== UTILIDADES =====
function getIconComponent(iconName: string) {
  const iconMap: { [key: string]: React.ElementType } = {
    package: Package,
    alertCircle: AlertCircle,
    eye: Eye,
    zap: Zap,
    shieldCheck: ShieldCheck,
    clock: Clock,
  };
  return iconMap[iconName] || Package;
}

const formatCurrency = (amount: number | null) => {
  if (!amount || amount === 0) return 'N/A';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

// ===== COMPONENTE PRINCIPAL =====
export default function ConsumablesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all'); // low, normal, high, all
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const itemsPerPage = 12;

  // ===== QUERIES =====
  const { data: categories = [] } = useQuery<ConsumableCategory[]>({
    queryKey: ['/api/warehouse/categories']
  });

  const { data: allConsumables = [], isLoading, refetch } = useQuery<ConsumableWithCategory[]>({
    queryKey: ['/api/warehouse/consumables', { search: searchTerm, categoryId: selectedCategory, active: statusFilter, stock: stockFilter, supplier: supplierFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('categoryId', selectedCategory);
      if (statusFilter && statusFilter !== 'all') params.append('active', statusFilter);
      if (stockFilter && stockFilter !== 'all') params.append('stock', stockFilter);
      if (supplierFilter) params.append('supplier', supplierFilter);
      
      return apiRequest(`/api/warehouse/consumables?${params}`);
    }
  });

  // ===== PAGINACIÓN =====
  const consumables = useMemo(() => {
    const filtered = (allConsumables || []) as ConsumableWithCategory[];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [allConsumables, currentPage]);

  const totalPages = Math.ceil(((allConsumables || []) as ConsumableWithCategory[]).length / itemsPerPage);

  // ===== MUTACIONES =====
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/warehouse/consumables/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['/api/warehouse/consumables'] });
      toast({ title: "Éxito", description: "Consumible eliminado correctamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al eliminar consumible",
        variant: "destructive" 
      });
    },
  });

  // ===== HANDLERS =====
  const handleEdit = (consumable: Consumable) => {
    setLocation(ROUTES.admin.warehouse.edit.build(consumable.id));
  };

  const handleNew = () => {
    setLocation(ROUTES.admin.warehouse.create);
  };

  const handleDelete = (consumable: Consumable) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el consumible "${consumable.name}"?`)) {
      deleteMutation.mutate(consumable.id);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setStatusFilter('all');
    setStockFilter('all');
    setSupplierFilter('');
    setCurrentPage(1);
  };

  // ===== ESTADÍSTICAS =====
  const stats = useMemo(() => {
    const consumablesArray = (allConsumables || []) as ConsumableWithCategory[];
    const total = consumablesArray.length;
    const active = consumablesArray.filter((c: ConsumableWithCategory) => c.isActive).length;
    const lowStock = consumablesArray.filter((c: ConsumableWithCategory) => 
      c.minimumStock && c.minimumStock > 0 // Simularíamos comparar con stock actual
    ).length;
    const categories = new Set(consumablesArray.map((c: ConsumableWithCategory) => c.categoryId).filter(Boolean)).size;
    
    return { total, active, lowStock, categories };
  }, [allConsumables]);

  // ===== RENDER =====
  return (
    <AdminLayout title="Gestión de Consumibles" subtitle="Administra los materiales y suministros del almacén">
      <div className="space-y-6" data-testid="consumables-page">

        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between">
          <PageHeader 
            title="Consumibles"
            subtitle="Gestión de productos y materiales consumibles"
          />
          <Button onClick={handleNew} data-testid="button-add-consumable">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Consumible
          </Button>
        </div>

        {/* ===== ESTADÍSTICAS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="stat-total">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Consumibles
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Consumibles Activos
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>

          <Card data-testid="stat-low-stock">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Stock Bajo
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowStock}</div>
            </CardContent>
          </Card>

          <Card data-testid="stat-categories">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Categorías
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categories}</div>
            </CardContent>
          </Card>
        </div>

        {/* ===== FILTROS ===== */}
        <Card data-testid="filters-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
              {(searchTerm || (selectedCategory && selectedCategory !== 'all') || (statusFilter && statusFilter !== 'all') || (stockFilter && stockFilter !== 'all') || supplierFilter) && (
                <Button variant="outline" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                  <X className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Nombre, código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="category-filter-all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()} data-testid={`category-filter-${category.id}`}>
                        <div className="flex items-center gap-2">
                          {category.icon && React.createElement(getIconComponent(category.icon), { className: "h-4 w-4" })}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="status-filter-all">Todos los estados</SelectItem>
                    <SelectItem value="true" data-testid="status-filter-active">Activos</SelectItem>
                    <SelectItem value="false" data-testid="status-filter-inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Stock</label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger data-testid="select-stock-filter">
                    <SelectValue placeholder="Todos los niveles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="stock-filter-all">Todos los niveles</SelectItem>
                    <SelectItem value="low" data-testid="stock-filter-low">Stock bajo</SelectItem>
                    <SelectItem value="normal" data-testid="stock-filter-normal">Stock normal</SelectItem>
                    <SelectItem value="high" data-testid="stock-filter-high">Stock alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Proveedor</label>
                <Input
                  placeholder="Proveedor..."
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  data-testid="input-supplier-filter"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== CONTROLES DE VISTA ===== */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
              data-testid="button-view-cards"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Tarjetas
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" data-testid="button-import">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" size="sm" data-testid="button-reports">
              <FileText className="h-4 w-4 mr-2" />
              Reportes
            </Button>
          </div>
        </div>

        {/* ===== CONTENIDO PRINCIPAL ===== */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" data-testid="loading-spinner"></div>
            </div>
          ) : (
            <>
              {/* Vista Tarjetas */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="consumables-grid">
                  {consumables.map((consumable: ConsumableWithCategory) => (
                    <Card key={consumable.id} className="hover:shadow-md transition-shadow" data-testid={`consumable-card-${consumable.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base line-clamp-2" data-testid={`consumable-name-${consumable.id}`}>
                              {consumable.name}
                            </CardTitle>
                            <CardDescription className="text-xs font-mono" data-testid={`consumable-code-${consumable.id}`}>
                              {consumable.code}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(consumable)}
                              data-testid={`card-edit-${consumable.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(consumable)}
                              data-testid={`card-delete-${consumable.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {consumable.category && (
                          <div className="flex items-center gap-2 mb-2" data-testid={`consumable-category-${consumable.id}`}>
                            {consumable.category.icon && 
                              React.createElement(getIconComponent(consumable.category.icon), { 
                                className: "h-4 w-4",
                                style: { color: consumable.category.color || '#6b7280' }
                              })
                            }
                            <span className="text-sm text-muted-foreground">{consumable.category.name}</span>
                          </div>
                        )}
                        {consumable.brand && (
                          <p className="text-sm font-medium mb-1" data-testid={`consumable-brand-${consumable.id}`}>
                            {consumable.brand} {consumable.model && `- ${consumable.model}`}
                          </p>
                        )}
                        {consumable.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`consumable-description-${consumable.id}`}>
                            {consumable.description}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="pt-3 border-t">
                        <div className="flex justify-between items-center w-full">
                          <div className="flex gap-2">
                            <Badge 
                              variant={consumable.isActive ? "default" : "secondary"}
                              data-testid={`consumable-status-${consumable.id}`}
                            >
                              {consumable.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                            {consumable.hazardous && (
                              <Badge variant="destructive" data-testid={`consumable-hazardous-${consumable.id}`}>
                                Peligroso
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm font-semibold" data-testid={`consumable-cost-${consumable.id}`}>
                            {formatCurrency(typeof consumable.unitCost === 'number' ? consumable.unitCost : null)}
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}

              {/* Vista Lista */}
              {viewMode === 'list' && (
                <Card data-testid="consumables-table">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-medium">Código</th>
                            <th className="text-left p-4 font-medium">Nombre</th>
                            <th className="text-left p-4 font-medium">Categoría</th>
                            <th className="text-left p-4 font-medium">Marca</th>
                            <th className="text-left p-4 font-medium">Costo</th>
                            <th className="text-left p-4 font-medium">Estado</th>
                            <th className="text-right p-4 font-medium">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {consumables.map((consumable: ConsumableWithCategory, index: number) => (
                            <tr key={consumable.id} className="border-b hover:bg-muted/50" data-testid={`consumable-row-${consumable.id}`}>
                              <td className="p-4 font-mono text-sm" data-testid={`table-code-${consumable.id}`}>
                                {consumable.code}
                              </td>
                              <td className="p-4">
                                <div>
                                  <div className="font-medium" data-testid={`table-name-${consumable.id}`}>
                                    {consumable.name}
                                  </div>
                                  {consumable.description && (
                                    <div className="text-sm text-muted-foreground line-clamp-1" data-testid={`table-description-${consumable.id}`}>
                                      {consumable.description}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4" data-testid={`table-category-${consumable.id}`}>
                                {consumable.category ? (
                                  <div className="flex items-center gap-2">
                                    {consumable.category.icon && 
                                      React.createElement(getIconComponent(consumable.category.icon), { 
                                        className: "h-4 w-4",
                                        style: { color: consumable.category.color || '#6b7280' }
                                      })
                                    }
                                    <span className="text-sm">{consumable.category.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Sin categoría</span>
                                )}
                              </td>
                              <td className="p-4 text-sm" data-testid={`table-brand-${consumable.id}`}>
                                {consumable.brand || '-'}
                              </td>
                              <td className="p-4 font-medium" data-testid={`table-cost-${consumable.id}`}>
                                {formatCurrency(typeof consumable.unitCost === 'number' ? consumable.unitCost : null)}
                              </td>
                              <td className="p-4" data-testid={`table-status-${consumable.id}`}>
                                <div className="flex gap-1">
                                  <Badge 
                                    variant={consumable.isActive ? "default" : "secondary"}
                                  >
                                    {consumable.isActive ? 'Activo' : 'Inactivo'}
                                  </Badge>
                                  {consumable.hazardous && (
                                    <Badge variant="destructive">
                                      Peligroso
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(consumable)}
                                    data-testid={`table-edit-${consumable.id}`}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(consumable)}
                                    data-testid={`table-delete-${consumable.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ===== PAGINACIÓN ===== */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2" data-testid="pagination-controls">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    data-testid="button-previous-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        data-testid={`button-page-${page}`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    data-testid="button-next-page"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}