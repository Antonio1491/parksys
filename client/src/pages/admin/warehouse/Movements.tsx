import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Search, Filter, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import type { InventoryMovement, Consumable, User } from "@shared/schema";

export default function MovementsPage() {
  const [search, setSearch] = useState("");
  const [movementType, setMovementType] = useState<string>("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const { data: movements, isLoading } = useQuery({
    queryKey: ['/api/warehouse/movements', { 
      search, 
      movementType, 
      startDate: dateRange.start,
      endDate: dateRange.end
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (movementType) params.append('movementType', movementType);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      
      const response = await fetch(`/api/warehouse/movements?${params}`);
      if (!response.ok) throw new Error('Error al cargar movimientos');
      return response.json();
    }
  });

  const getMovementIcon = (type: string) => {
    const typeStr = type || '';
    if (typeStr.includes('entrada')) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (typeStr.includes('salida')) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <ArrowUpDown className="h-4 w-4 text-blue-600" />;
  };

  const getMovementVariant = (type: string) => {
    const typeStr = type || '';
    if (typeStr.includes('entrada')) return 'default' as const;
    if (typeStr.includes('salida')) return 'secondary' as const;
    return 'outline' as const;
  };

  const formatMovementType = (type: string) => {
    const types: Record<string, string> = {
      'entrada_compra': 'Entrada por Compra',
      'entrada_donacion': 'Entrada por Donación',
      'entrada_transferencia': 'Entrada por Transferencia',
      'entrada_devolucion': 'Entrada por Devolución',
      'salida_consumo': 'Salida por Consumo',
      'salida_transferencia': 'Salida por Transferencia',
      'salida_merma': 'Salida por Merma',
      'salida_robo': 'Salida por Robo',
      'ajuste_positivo': 'Ajuste Positivo',
      'ajuste_negativo': 'Ajuste Negativo',
      'conteo_fisico': 'Conteo Físico'
    };
    return types[type] || type;
  };

  return (
    <AdminLayout title="Movimientos de Inventario" subtitle="Historial de entradas y salidas del almacén">
      <div className="space-y-6" data-testid="movements-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimientos de Inventario</h1>
          <p className="text-muted-foreground">Historial de entradas, salidas y transferencias</p>
        </div>
        <Button data-testid="button-add-movement">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Registrar Movimiento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar consumible..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-movements"
          />
        </div>
        
        <select
          value={movementType}
          onChange={(e) => setMovementType(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
          data-testid="select-movement-type"
        >
          <option value="">Todos los tipos</option>
          <option value="entrada_compra">Entrada por Compra</option>
          <option value="entrada_donacion">Entrada por Donación</option>
          <option value="entrada_transferencia">Entrada por Transferencia</option>
          <option value="salida_consumo">Salida por Consumo</option>
          <option value="salida_transferencia">Salida por Transferencia</option>
          <option value="salida_merma">Salida por Merma</option>
          <option value="ajuste_positivo">Ajuste Positivo</option>
          <option value="ajuste_negativo">Ajuste Negativo</option>
        </select>

        <Input
          type="date"
          placeholder="Fecha inicio"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          data-testid="input-date-start"
        />

        <Input
          type="date"
          placeholder="Fecha fin"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          data-testid="input-date-end"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded animate-pulse"></div>
                  <div className="h-6 bg-muted rounded animate-pulse w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4" data-testid="movements-list">
          {movements?.map((movement: InventoryMovement & {
            consumable?: Consumable;
            performedBy?: User;
          }) => (
            <Card key={movement.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getMovementIcon(movement.movementType)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {movement.consumable?.name || 'Consumible desconocido'}
                        </h3>
                        <Badge variant={getMovementVariant(movement.movementType)}>
                          {formatMovementType(movement.movementType)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {movement.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Cantidad:</span>
                          <p className="font-medium" data-testid={`movement-quantity-${movement.id}`}>
                            {movement.quantity} {movement.consumable?.unitOfMeasure || ''}
                          </p>
                        </div>
                        
                        {movement.unitCost && (
                          <div>
                            <span className="text-muted-foreground">Costo unitario:</span>
                            <p className="font-medium">
                              ${movement.unitCost}
                            </p>
                          </div>
                        )}
                        
                        {movement.totalCost && (
                          <div>
                            <span className="text-muted-foreground">Costo total:</span>
                            <p className="font-medium">
                              ${movement.totalCost}
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <span className="text-muted-foreground">Fecha:</span>
                          <p className="font-medium">
                            {movement.movementDate ? new Date(movement.movementDate).toLocaleDateString('es-MX') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {movement.performedBy && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Realizado por:</span>
                          <p className="font-medium">{movement.performedBy.fullName}</p>
                        </div>
                      )}
                      
                      {movement.reference && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Referencia:</span>
                          <p className="font-medium font-mono">{movement.reference}</p>
                        </div>
                      )}
                      
                      {movement.batchNumber && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Lote:</span>
                          <p className="font-medium font-mono">{movement.batchNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-muted-foreground">
                    {movement.createdAt ? new Date(movement.createdAt).toLocaleString('es-MX') : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!movements || movements.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <ArrowUpDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay movimientos registrados</h3>
            <p className="text-muted-foreground mb-4">
              {search || movementType || dateRange.start || dateRange.end
                ? "No se encontraron movimientos con los filtros aplicados"
                : "Comienza registrando el primer movimiento de inventario"
              }
            </p>
            <Button data-testid="button-add-first-movement">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Registrar Movimiento
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </AdminLayout>
  );
}