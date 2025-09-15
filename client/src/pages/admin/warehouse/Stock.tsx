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
  const [selectedPark, setSelectedPark] = useState<string>('all');
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

  const { data: stock, isLoading } = useQuery({
    queryKey: ['/api/warehouse/stock', { parkId: selectedPark, consumableId: search, lowStock: showLowStock }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedPark) params.append('parkId', selectedPark);
      if (search) params.append('consumableId', search);
      if (showLowStock) params.append('lowStock', 'true');
      
      const response = await fetch(`/api/warehouse/stock?${params}`);
      if (!response.ok) throw new Error('Error al cargar inventario');
      return response.json();
    }
  });

  const getStockStatus = (item: any) => {
    if (item.quantity <= 0) return { status: 'Sin Stock', variant: 'destructive' as const };
    if (item.consumable?.minimumStock && item.quantity <= item.consumable.minimumStock) {
      return { status: 'Stock Bajo', variant: 'secondary' as const };
    }
    return { status: 'En Stock', variant: 'default' as const };
  };

  return (
    <AdminLayout title="Inventario de Stock" subtitle="Consulta y monitorea el stock disponible en cada parque">
      <div className="space-y-6" data-testid="stock-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">Control de stock por ubicación</p>
        </div>
        <Button data-testid="button-add-stock">
          <Package className="h-4 w-4 mr-2" />
          Registrar Stock
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por consumible..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="stock-grid">
          {stock?.map((item: InventoryStock & { 
            consumable?: Consumable;
            park?: Park;
          }) => {
            const stockStatus = getStockStatus(item);
            
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {item.consumable?.name || 'Consumible desconocido'}
                      </CardTitle>
                      <CardDescription className="font-mono text-sm">
                        {item.consumable?.code}
                      </CardDescription>
                    </div>
                    <Badge variant={stockStatus.variant}>
                      {stockStatus.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {item.park && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {item.park.name}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Cantidad:</span>
                        <p className="text-2xl font-bold" data-testid={`stock-quantity-${item.id}`}>
                          {item.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.consumable?.unitOfMeasure || 'unidades'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Disponible:</span>
                        <p className="text-lg font-semibold text-green-600">
                          {item.availableQuantity || item.quantity}
                        </p>
                        {item.reservedQuantity > 0 && (
                          <p className="text-xs text-orange-600">
                            {item.reservedQuantity} reservado
                          </p>
                        )}
                      </div>
                    </div>

                    {item.consumable?.minimumStock && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Stock mínimo:</span>
                        <p className="font-medium">{item.consumable.minimumStock}</p>
                      </div>
                    )}

                    {item.warehouseLocation && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Ubicación:</span>
                        <p className="font-medium">{item.warehouseLocation}</p>
                        {(item.zone || item.shelf || item.position) && (
                          <p className="text-xs text-muted-foreground">
                            {[item.zone, item.shelf, item.position].filter(Boolean).join(' • ')}
                          </p>
                        )}
                      </div>
                    )}

                    {item.batchNumber && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Lote:</span>
                        <p className="font-medium font-mono">{item.batchNumber}</p>
                      </div>
                    )}

                    {item.expirationDate && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Vencimiento:</span>
                        <p className="font-medium">
                          {new Date(item.expirationDate).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && (!stock || stock.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay stock registrado</h3>
            <p className="text-muted-foreground mb-4">
              {search || selectedPark || showLowStock
                ? "No se encontró inventario con los filtros aplicados"
                : "Comienza registrando el primer stock en el almacén"
              }
            </p>
            <Button data-testid="button-add-first-stock">
              <Package className="h-4 w-4 mr-2" />
              Registrar Stock
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </AdminLayout>
  );
}