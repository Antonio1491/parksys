import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Package, MapPin, Calendar, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  insertInventoryStockSchema, 
  type InsertInventoryStock,
  type InventoryStock,
  type Consumable,
  type ConsumableCategory,
  type Park
} from '@shared/schema';
import { z } from 'zod';

// Tipos extendidos
type StockWithRelations = InventoryStock & {
  consumable?: Consumable & {
    category?: ConsumableCategory;
  };
  park?: Park;
};

// Schema del formulario (extendiendo el shared schema)
const stockEditSchema = insertInventoryStockSchema.extend({
  consumableId: z.number({ required_error: 'Selecciona un consumible' }).min(1, 'Consumible requerido'),
  parkId: z.number({ required_error: 'Selecciona un parque' }).min(1, 'Parque requerido'),
  quantity: z.number({ required_error: 'Cantidad requerida' }).min(0, 'La cantidad no puede ser negativa'),
  reservedQuantity: z.number().min(0, 'La cantidad reservada no puede ser negativa').optional().default(0),
});

type StockEditData = z.infer<typeof stockEditSchema>;

export default function StockEdit() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/admin/warehouse/stock/:id/edit');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const stockId = match ? parseInt(params.id) : null;

  // Query para obtener el stock a editar
  const { data: stock, isLoading: stockLoading, error: stockError } = useQuery<StockWithRelations>({
    queryKey: ['/api/warehouse/stock', stockId],
    queryFn: () => apiRequest(`/api/warehouse/stock/${stockId}`),
    enabled: !!stockId
  });

  // Queries para datos de referencia
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ConsumableCategory[]>({
    queryKey: ['/api/warehouse/categories'],
  });
  
  const { data: consumables = [], isLoading: consumablesLoading } = useQuery<Consumable[]>({
    queryKey: ['/api/warehouse/consumables'],
  });
  
  const { data: parks = [], isLoading: parksLoading } = useQuery<Park[]>({
    queryKey: ['/api/parks'],
  });

  // Form setup
  const form = useForm<StockEditData>({
    resolver: zodResolver(stockEditSchema),
    defaultValues: {
      quantity: 0,
      reservedQuantity: 0,
      warehouseLocation: '',
      notes: '',
    },
  });

  // Reset form when stock data loads
  useEffect(() => {
    if (stock) {
      form.reset({
        consumableId: stock.consumableId,
        parkId: stock.parkId,
        quantity: stock.quantity,
        reservedQuantity: stock.reservedQuantity || 0,
        warehouseLocation: stock.warehouseLocation || '',
        zone: stock.zone || '',
        shelf: stock.shelf || '',
        position: stock.position || '',
        batchNumber: stock.batchNumber || '',
        expirationDate: stock.expirationDate || '',
        lastCountDate: stock.lastCountDate || '',
        notes: stock.notes || '',
      });
    }
  }, [stock, form]);

  // Mutation para actualizar stock
  const updateStockMutation = useMutation({
    mutationFn: (data: StockEditData) => apiRequest(`/api/warehouse/stock/${stockId}`, {
      method: 'PUT',
      data: data
    }),
    onSuccess: () => {
      toast({
        title: 'Stock actualizado',
        description: 'El stock se ha actualizado exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock'] });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock', stockId] });
      setLocation('/admin/warehouse/stock');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al actualizar el stock',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: StockEditData) => {
    setIsSubmitting(true);
    try {
      await updateStockMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setLocation('/admin/warehouse/stock');
  };

  // Loading states
  if (!match) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-8">
              <p className="text-red-600">ID de stock no válido</p>
              <Button onClick={handleCancel} className="mt-4">Volver a stock</Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (stockLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Cargando stock...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (stockError || !stock) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error al cargar el stock</p>
              <Button onClick={handleCancel}>Volver a stock</Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancel}
              data-testid="button-back"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Stock</h1>
              <p className="text-gray-600">Modificar stock de: {stock.consumable?.name || 'Consumible desconocido'}</p>
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic" className="flex items-center gap-2" data-testid="tab-basic">
                    <Package className="h-4 w-4" />
                    Información Básica
                  </TabsTrigger>
                  <TabsTrigger value="location" className="flex items-center gap-2" data-testid="tab-location">
                    <MapPin className="h-4 w-4" />
                    Ubicación
                  </TabsTrigger>
                  <TabsTrigger value="batch" className="flex items-center gap-2" data-testid="tab-batch">
                    <Calendar className="h-4 w-4" />
                    Control de Lotes
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Información Básica */}
                <TabsContent value="basic">
                  <Card>
                    <CardHeader>
                      <CardTitle>Información del Stock</CardTitle>
                      <CardDescription>
                        Cantidades y ubicación básica del stock
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Información del consumible (solo lectura) */}
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Consumible</h4>
                        <p className="font-semibold">{stock.consumable?.name || 'Consumible desconocido'}</p>
                        {stock.consumable?.code && (
                          <p className="text-sm text-muted-foreground">{stock.consumable.code}</p>
                        )}
                        {stock.consumable?.category && (
                          <p className="text-sm text-muted-foreground">Categoría: {stock.consumable.category.name}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="consumableId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Consumible *</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={consumablesLoading}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-consumable">
                                    <SelectValue placeholder="Selecciona un consumible" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {consumables.map((consumable) => (
                                    <SelectItem key={consumable.id} value={consumable.id.toString()} data-testid={`consumable-option-${consumable.id}`}>
                                      {consumable.name} {consumable.code && `(${consumable.code})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="parkId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parque *</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={parksLoading}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-park">
                                    <SelectValue placeholder="Selecciona un parque" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {parks.map((park) => (
                                    <SelectItem key={park.id} value={park.id.toString()} data-testid={`park-option-${park.id}`}>
                                      {park.name}
                                    </SelectItem>
                                  ))}
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
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cantidad Total *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  data-testid="input-quantity"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Cantidad total disponible en esta ubicación
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="reservedQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cantidad Reservada</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  data-testid="input-reserved-quantity"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Cantidad reservada para uso específico
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notas</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Notas adicionales sobre este stock"
                                data-testid="textarea-notes"
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Ubicación */}
                <TabsContent value="location">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ubicación en Almacén</CardTitle>
                      <CardDescription>
                        Información específica de ubicación física
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="warehouseLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ubicación en Almacén</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: Almacén A, Sector 1"
                                data-testid="input-warehouse-location"
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormDescription>
                              Ubicación general dentro del almacén
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="zone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zona</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej: A, B, C"
                                  data-testid="input-zone"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="shelf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estante</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej: E1, E2"
                                  data-testid="input-shelf"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Posición</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej: 1, 2, 3"
                                  data-testid="input-position"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Control de Lotes */}
                <TabsContent value="batch">
                  <Card>
                    <CardHeader>
                      <CardTitle>Control de Lotes y Vencimientos</CardTitle>
                      <CardDescription>
                        Información de lotes, fechas de vencimiento y control físico
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="batchNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Lote</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej: LOT-2023-001"
                                  data-testid="input-batch-number"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormDescription>
                                Identificador del lote de producción
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="expirationDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha de Vencimiento</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  data-testid="input-expiration-date"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormDescription>
                                Solo para productos perecederos
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="lastCountDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Última Fecha de Conteo Físico</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                data-testid="input-last-count-date"
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormDescription>
                              Última vez que se realizó conteo físico de este stock
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* BOTONES */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || updateStockMutation.isPending}
                  data-testid="button-save"
                >
                  {isSubmitting || updateStockMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Actualizar Stock
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
}