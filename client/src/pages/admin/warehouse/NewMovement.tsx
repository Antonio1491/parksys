import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const movementFormSchema = z.object({
  consumableId: z.number().min(1, "Consumible es requerido"),
  stockId: z.number().min(1, "Ubicación de stock es requerida"),
  movementType: z.enum([
    "entrada_compra",
    "entrada_donacion", 
    "entrada_transferencia",
    "entrada_devolucion",
    "salida_consumo",
    "salida_transferencia",
    "salida_merma",
    "salida_robo",
    "ajuste_positivo",
    "ajuste_negativo",
    "conteo_fisico"
  ]),
  quantity: z.number().min(0.01, "Cantidad debe ser mayor a 0"),
  unitCost: z.number().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  movementDate: z.string().optional(),
  batchNumber: z.string().optional(),
  expirationDate: z.string().optional()
});

type MovementFormData = z.infer<typeof movementFormSchema>;

export default function NewMovementPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedConsumable, setSelectedConsumable] = useState<number | null>(null);

  const form = useForm<MovementFormData>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      movementType: 'entrada_compra',
      quantity: 1,
      movementDate: new Date().toISOString().split('T')[0],
    },
  });

  // Queries
  const { data: consumables = [] } = useQuery<any[]>({
    queryKey: ['/api/warehouse/consumables'],
    retry: false,
  });

  const { data: stockLocations = [] } = useQuery<any[]>({
    queryKey: ['/api/warehouse/stock', { consumableId: selectedConsumable }],
    enabled: !!selectedConsumable,
    retry: false,
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: async (data: MovementFormData) => {
      return await apiRequest('/api/warehouse/movements', {
        method: 'POST',
        data: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Movimiento registrado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/movements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock'] });
      navigate('/admin/warehouse/movements');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el movimiento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MovementFormData) => {
    const submitData = {
      ...data,
      totalCost: data.unitCost ? data.unitCost * data.quantity : undefined,
      performedById: undefined, // Se establece en el backend
      status: 'completed' as const
    };
    createMutation.mutate(submitData);
  };

  const movementType = form.watch('movementType');
  const isIncoming = movementType?.startsWith('entrada_') || movementType === 'ajuste_positivo';

  return (
    <AdminLayout title="Registrar Movimiento" subtitle="Registrar entrada, salida o ajuste de inventario">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Registrar Movimiento</h1>
            <p className="text-muted-foreground">Complete el formulario para registrar un movimiento de inventario</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/warehouse/movements')} data-testid="button-cancel">
            Cancelar
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tipo de Movimiento</CardTitle>
                <CardDescription>Seleccione el tipo de movimiento a registrar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="movementType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-movement-type">
                            <SelectValue placeholder="Seleccionar tipo de movimiento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entrada_compra">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              Entrada por Compra
                            </div>
                          </SelectItem>
                          <SelectItem value="entrada_donacion">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              Entrada por Donación
                            </div>
                          </SelectItem>
                          <SelectItem value="entrada_transferencia">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              Entrada por Transferencia
                            </div>
                          </SelectItem>
                          <SelectItem value="entrada_devolucion">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              Entrada por Devolución
                            </div>
                          </SelectItem>
                          <SelectItem value="salida_consumo">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              Salida por Consumo
                            </div>
                          </SelectItem>
                          <SelectItem value="salida_transferencia">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              Salida por Transferencia
                            </div>
                          </SelectItem>
                          <SelectItem value="salida_merma">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              Salida por Merma
                            </div>
                          </SelectItem>
                          <SelectItem value="salida_robo">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              Salida por Robo
                            </div>
                          </SelectItem>
                          <SelectItem value="ajuste_positivo">
                            <div className="flex items-center gap-2">
                              <ArrowUpDown className="h-4 w-4 text-blue-600" />
                              Ajuste Positivo
                            </div>
                          </SelectItem>
                          <SelectItem value="ajuste_negativo">
                            <div className="flex items-center gap-2">
                              <ArrowUpDown className="h-4 w-4 text-blue-600" />
                              Ajuste Negativo
                            </div>
                          </SelectItem>
                          <SelectItem value="conteo_fisico">
                            <div className="flex items-center gap-2">
                              <ArrowUpDown className="h-4 w-4 text-blue-600" />
                              Conteo Físico
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isIncoming && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      Este movimiento <strong>aumentará</strong> el stock del consumible seleccionado.
                    </p>
                  </div>
                )}
                {!isIncoming && movementType && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      Este movimiento <strong>disminuirá</strong> el stock del consumible seleccionado.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalles del Movimiento</CardTitle>
                <CardDescription>Información del consumible y ubicación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="consumableId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumible *</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          const numValue = parseInt(value);
                          field.onChange(numValue);
                          setSelectedConsumable(numValue);
                          form.setValue('stockId', 0); // Reset stock location
                        }}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-consumable">
                            <SelectValue placeholder="Seleccionar consumible" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {consumables.map((consumable: any) => (
                            <SelectItem key={consumable.id} value={consumable.id.toString()}>
                              {consumable.code ? `[${consumable.code}] ` : ''}{consumable.name}
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
                  name="stockId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación de Stock *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                        disabled={!selectedConsumable}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-stock-location">
                            <SelectValue placeholder={!selectedConsumable ? "Primero seleccione un consumible" : "Seleccionar ubicación"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stockLocations.map((stock: any) => (
                            <SelectItem key={stock.id} value={stock.id.toString()}>
                              {stock.park?.name || 'Sin parque'} - {stock.warehouseLocation || 'Ubicación general'}
                              {stock.zone && ` (Zona: ${stock.zone})`}
                              {stock.quantity !== undefined && ` - Stock actual: ${stock.quantity}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {selectedConsumable && stockLocations.length === 0 && 
                          "No hay ubicaciones de stock para este consumible. Debe crear una primero."
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="Ej: 10"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-quantity" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo Unitario</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="Ej: 25.50"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ''}
                            data-testid="input-unit-cost" 
                          />
                        </FormControl>
                        <FormDescription>Opcional. Se calculará el costo total automáticamente.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="movementDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha del Movimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-movement-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
                <CardDescription>Datos opcionales del movimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción detallada del movimiento" 
                          {...field} 
                          rows={3}
                          data-testid="input-description" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referencia</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: OC-2025-001" 
                            {...field} 
                            data-testid="input-reference" 
                          />
                        </FormControl>
                        <FormDescription>Orden de compra, folio, etc.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="batchNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Lote</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: LOTE-2025-A" 
                            {...field} 
                            data-testid="input-batch-number" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expirationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Expiración</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-expiration-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/admin/warehouse/movements')}
                data-testid="button-cancel-bottom"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? 'Registrando...' : 'Registrar Movimiento'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
