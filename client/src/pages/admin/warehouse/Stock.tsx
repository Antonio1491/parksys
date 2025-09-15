import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
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
  const [selectedPark, setSelectedPark] = useState<string>('');  // '' matches select option
  const [showLowStock, setShowLowStock] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all'); // all, low, out, normal
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, available, reserved
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // ===== NAVEGACIÓN =====
  const handleNew = () => {
    setLocation('/admin/warehouse/stock/new');
  };

  const handleEdit = (stock: StockWithRelations) => {
    setLocation(`/admin/warehouse/stock/${stock.id}/edit`);
  };

  const handleView = (stock: StockWithRelations) => {
    setLocation(`/admin/warehouse/stock/${stock.id}`);
  };

  // ===== QUERIES =====
  const { data: parks = [], isLoading: parksLoading } = useQuery<Park[]>({
    queryKey: ['/api/parks'],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ConsumableCategory[]>({
    queryKey: ['/api/warehouse/categories'],
  });

  const { data: stock = [], isLoading: stockLoading } = useQuery<StockWithRelations[]>({
    queryKey: ['/api/warehouse/stock', { 
      parkId: selectedPark || undefined, 
      search: searchTerm || undefined, 
      lowStock: showLowStock || undefined 
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedPark) params.append('parkId', selectedPark);
      if (searchTerm) params.append('search', searchTerm);
      if (showLowStock) params.append('lowStock', 'true');
      return apiRequest(`/api/warehouse/stock?${params}`);
    }
  });

  // ===== FUNCIONES UTILITARIAS =====
  const hasActiveFilters = Boolean(searchTerm || selectedPark || showLowStock);
  
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
  
  // ===== PAGINACIÓN (TEMPORAL) =====
  const renderPagination = () => null;

  return (
    <AdminLayout title="Inventario de Stock" subtitle="Consulta y monitorea el stock disponible en cada parque">
      <div className="space-y-6" data-testid="stock-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">Control de stock por ubicación</p>
        </div>
        <Button onClick={handleNew} data-testid="button-add-stock">
          <Package className="h-4 w-4 mr-2" />
          Registrar Stock
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por consumible..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-stock"
          />
        </div>
        
        <select
          value={selectedPark}
          onChange={(e) => setSelectedPark(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
          data-testid="select-park-filter"
        >
          <option value="">Todos los parques</option>
          {Array.isArray(parks) ? parks.map((park: Park) => (
            <option key={park.id} value={park.id}>
              {park.name}
            </option>
          )) : []}
        </select>

        <Button
          variant={showLowStock ? "default" : "outline"}
          onClick={() => setShowLowStock(!showLowStock)}
          data-testid="button-toggle-low-stock"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Stock Bajo
        </Button>
      </div>

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
                    <Card key={item.id} className="hover:shadow-lg transition-all duration-200">
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
                              {item.reservedQuantity > 0 && (
                                <p className="text-xs text-orange-600">
                                  -{item.reservedQuantity} reservado
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Límites de stock */}
                          {(item.consumable?.minimumStock || item.consumable?.maximumStock) && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {item.consumable?.minimumStock && (
                                <div>
                                  <span className="text-muted-foreground text-xs">Mínimo:</span>
                                  <p className="font-medium">{item.consumable.minimumStock}</p>
                                </div>
                              )}
                              {item.consumable?.maximumStock && (
                                <div>
                                  <span className="text-muted-foreground text-xs">Máximo:</span>
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
                                  {item.reservedQuantity > 0 && (
                                    <>
                                      <br />
                                      <span className="text-xs text-orange-600">
                                        -{item.reservedQuantity} res.
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
    </div>
  );
}