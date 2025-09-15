import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
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
  type Consumable,
  type ConsumableCategory,
  type Park
} from '@shared/schema';
import { z } from 'zod';

// Schema del formulario (extendiendo el shared schema)
const stockFormSchema = insertInventoryStockSchema.extend({
  consumableId: z.number({ required_error: 'Selecciona un consumible' }).min(1, 'Consumible requerido'),
  parkId: z.number({ required_error: 'Selecciona un parque' }).min(1, 'Parque requerido'),
  quantity: z.number({ required_error: 'Cantidad requerida' }).min(0, 'La cantidad no puede ser negativa'),
  reservedQuantity: z.number().min(0, 'La cantidad reservada no puede ser negativa').optional().default(0),
});

type StockFormValues = z.infer<typeof stockFormSchema>;

export default function StockForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries para datos de referencia
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ConsumableCategory[]>({
    queryKey: ['/api/warehouse/categories'],
    queryFn: () => apiRequest('/api/warehouse/categories'),
  });
  
  const { data: consumables = [], isLoading: consumablesLoading } = useQuery<Consumable[]>({
    queryKey: ['/api/warehouse/consumables'],
    queryFn: () => apiRequest('/api/warehouse/consumables'),
  });
  
  const { data: parks = [], isLoading: parksLoading } = useQuery<Park[]>({
    queryKey: ['/api/parks'],
    queryFn: () => apiRequest('/api/parks'),
  });

  // Form setup
  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      quantity: 0,
      reservedQuantity: 0,
      warehouseLocation: '',
      notes: '',
    },
  });

  // Mutation para crear stock
  const createStockMutation = useMutation({
    mutationFn: (data: StockFormValues) => apiRequest('/api/warehouse/stock', {
      method: 'POST',
      data: data
    }),
    onSuccess: () => {
      toast({
        title: '✅ Stock registrado',
        description: 'El stock se ha registrado correctamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock'] });
      setLocation('/admin/warehouse/stock');
    },
    onError: (error: any) => {
      toast({
        title: '❌ Error al registrar stock',
        description: error.response?.data?.error || 'Error al registrar el stock',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: StockFormValues) => {
    setIsSubmitting(true);
    try {
      await createStockMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setLocation('/admin/warehouse/stock');
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto">
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
              <h1 className="text-2xl font-bold text-gray-900">Registrar Nuevo Stock</h1>
              <p className="text-gray-600">Agrega nuevo stock de un consumible a un parque</p>
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
                        Selecciona el consumible, ubicación y cantidades iniciales
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                                  {Array.isArray(consumables) && consumables.map((consumable) => (
                                    <SelectItem key={consumable.id} value={consumable.id.toString()} data-testid={`consumable-option-${consumable.id}`}>
                                      {consumable.name} {consumable.code && `(${consumable.code})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Selecciona el consumible para el cual registrarás stock
                              </FormDescription>
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
                                  {Array.isArray(parks) && parks.map((park) => (
                                    <SelectItem key={park.id} value={park.id.toString()} data-testid={`park-option-${park.id}`}>
                                      {park.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Ubicación donde se almacenará el stock
                              </FormDescription>
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
                              <FormLabel>Cantidad Inicial *</FormLabel>
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
                                Cantidad inicial de stock a registrar
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
                                Cantidad que estará reservada desde el inicio
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
                                placeholder="Notas adicionales sobre este stock inicial"
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
                        Información específica de ubicación física del stock
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
                              Ubicación general dentro del almacén del parque
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
                              <FormDescription>
                                Zona del almacén
                              </FormDescription>
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
                              <FormDescription>
                                Estante específico
                              </FormDescription>
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
                              <FormDescription>
                                Posición en el estante
                              </FormDescription>
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
                        Información opcional de lotes y fechas (para productos que lo requieran)
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
                                Identificador del lote de producción (opcional)
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
                                Solo para productos perecederos (opcional)
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
                            <FormLabel>Fecha de Conteo Inicial</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                data-testid="input-last-count-date"
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormDescription>
                              Fecha en que se realizó el conteo inicial de este stock
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
                  disabled={isSubmitting || createStockMutation.isPending}
                  data-testid="button-save"
                >
                  {isSubmitting || createStockMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Registrar Stock
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
}