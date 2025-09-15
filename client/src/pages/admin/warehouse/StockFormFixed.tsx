import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ChevronLeft, Package } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { z } from 'zod';

// Simplified form schema
const simpleStockSchema = z.object({
  consumableId: z.number().min(1, 'Selecciona un consumible'),
  parkId: z.number().min(1, 'Selecciona un parque'),
  quantity: z.number().min(0, 'La cantidad no puede ser negativa'),
  warehouseLocation: z.string().optional(),
  notes: z.string().optional(),
});

type SimpleStockFormValues = z.infer<typeof simpleStockSchema>;

export default function StockFormFixed() {
  console.log('🚀 [STOCK-FORM-FIXED] Component starting to render');
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Fetch parks data with direct query configuration
  const parksQuery = useQuery({
    queryKey: ['/api/parks'],
    staleTime: 0,
    gcTime: 0,
    retry: 1,
    refetchOnMount: true,
  });

  // Fetch consumables data  
  const consumablesQuery = useQuery({
    queryKey: ['/api/warehouse/consumables'],
    staleTime: 0,
    gcTime: 0,
    retry: 1,
    refetchOnMount: true,
  });

  // Extract data with proper defaults
  const parks = parksQuery.data?.data || parksQuery.data || [];
  const consumables = consumablesQuery.data?.data || consumablesQuery.data || [];

  console.log('🏞️ [STOCK-FORM-FIXED] Parks query result:', {
    raw: parksQuery.data,
    processed: parks,
    isLoading: parksQuery.isLoading,
    error: parksQuery.error,
    length: parks?.length,
    isArray: Array.isArray(parks)
  });

  console.log('🧪 [STOCK-FORM-FIXED] Consumables query result:', {
    raw: consumablesQuery.data,
    processed: consumables,
    isLoading: consumablesQuery.isLoading,
    error: consumablesQuery.error,
    length: consumables?.length,
    isArray: Array.isArray(consumables)
  });

  // Force query execution on mount
  useEffect(() => {
    console.log('⚡ [STOCK-FORM-FIXED] Component mounted, ensuring queries execute');
    queryClient.invalidateQueries({ queryKey: ['/api/parks'] });
    queryClient.invalidateQueries({ queryKey: ['/api/warehouse/consumables'] });
  }, []);

  // Form setup
  const form = useForm<SimpleStockFormValues>({
    resolver: zodResolver(simpleStockSchema),
    defaultValues: {
      quantity: 0,
      warehouseLocation: '',
      notes: '',
    },
  });

  // Submit mutation
  const createStockMutation = useMutation({
    mutationFn: (data: SimpleStockFormValues) => {
      console.log('📤 [STOCK-FORM-FIXED] Submitting data:', data);
      return apiRequest('/api/warehouse/stock', {
        method: 'POST',
        data: data
      });
    },
    onSuccess: () => {
      toast({
        title: '✅ Stock registrado',
        description: 'El stock se ha registrado correctamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock'] });
      setLocation('/admin/warehouse/stock');
    },
    onError: (error: any) => {
      console.error('❌ [STOCK-FORM-FIXED] Submit error:', error);
      toast({
        title: '❌ Error al registrar stock',
        description: error.message || 'Error al registrar el stock',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: SimpleStockFormValues) => {
    console.log('📝 [STOCK-FORM-FIXED] Form submit triggered:', data);
    await createStockMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    setLocation('/admin/warehouse/stock');
  };

  console.log('✅ [STOCK-FORM-FIXED] Rendering component UI');

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
              <h1 className="text-2xl font-bold text-gray-900">Registrar Nuevo Stock (Fixed)</h1>
              <p className="text-gray-600">Versión simplificada para debugging</p>
            </div>
          </div>

          {/* Debug Info */}
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold mb-2">Estado de las Queries:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Parks:</strong> Loading: {parksQuery.isLoading ? 'Sí' : 'No'}, 
                Error: {parksQuery.error ? 'Sí' : 'No'}, 
                Count: {parks?.length || 0}
              </div>
              <div>
                <strong>Consumables:</strong> Loading: {consumablesQuery.isLoading ? 'Sí' : 'No'}, 
                Error: {consumablesQuery.error ? 'Sí' : 'No'}, 
                Count: {consumables?.length || 0}
              </div>
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Parks Field */}
                <FormField
                  control={form.control}
                  name="parkId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parque *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-park">
                            <SelectValue placeholder={parksQuery.isLoading ? "Cargando..." : "Selecciona un parque"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {parksQuery.isLoading && (
                            <SelectItem value="loading" disabled>Cargando parques...</SelectItem>
                          )}
                          {parksQuery.error && (
                            <SelectItem value="error" disabled>Error: {parksQuery.error.message}</SelectItem>
                          )}
                          {!parksQuery.isLoading && !parksQuery.error && (!parks || parks.length === 0) && (
                            <SelectItem value="empty" disabled>No hay parques disponibles</SelectItem>
                          )}
                          {Array.isArray(parks) && parks.length > 0 && parks.map((park: any) => {
                            console.log('🏞️ [PARK-OPTION] Rendering park:', park);
                            return (
                              <SelectItem key={park.id} value={park.id.toString()} data-testid={`park-option-${park.id}`}>
                                {park.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Consumables Field */}
                <FormField
                  control={form.control}
                  name="consumableId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumible *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-consumable">
                            <SelectValue placeholder={consumablesQuery.isLoading ? "Cargando..." : "Selecciona un consumible"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {consumablesQuery.isLoading && (
                            <SelectItem value="loading" disabled>Cargando consumibles...</SelectItem>
                          )}
                          {consumablesQuery.error && (
                            <SelectItem value="error" disabled>Error: {consumablesQuery.error.message}</SelectItem>
                          )}
                          {!consumablesQuery.isLoading && !consumablesQuery.error && (!consumables || consumables.length === 0) && (
                            <SelectItem value="empty" disabled>No hay consumibles disponibles</SelectItem>
                          )}
                          {Array.isArray(consumables) && consumables.length > 0 && consumables.map((consumable: any) => (
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
              </div>

              {/* Quantity Field */}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        data-testid="input-quantity"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={createStockMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createStockMutation.isPending}
                  data-testid="button-save"
                >
                  {createStockMutation.isPending ? (
                    <Package className="h-4 w-4 animate-spin mr-2" />
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