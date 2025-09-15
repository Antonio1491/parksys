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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Package, DollarSign, Settings, Archive } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  insertConsumableSchema, 
  type InsertConsumable,
  type Consumable,
  type ConsumableCategory
} from '@shared/schema';
import { z } from 'zod';

// Unidades de medida
const UNITS_OF_MEASURE = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramos' },
  { value: 'g', label: 'Gramos' },
  { value: 'l', label: 'Litros' },
  { value: 'ml', label: 'Mililitros' },
  { value: 'm', label: 'Metro' },
  { value: 'cm', label: 'Centímetro' },
  { value: 'm2', label: 'Metro cuadrado' },
  { value: 'm3', label: 'Metro cúbico' },
  { value: 'caja', label: 'Caja' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'bolsa', label: 'Bolsa' }
];

// Schema del formulario (extendiendo el shared schema)
const consumableFormSchema = insertConsumableSchema.extend({
  categoryId: z.number({ required_error: "La categoría es obligatoria" }),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  unitOfMeasure: z.string().min(1, "La unidad es obligatoria"),
});

type ConsumableFormValues = z.infer<typeof consumableFormSchema>;

export default function ConsumableForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query para obtener categorías
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ConsumableCategory[]>({
    queryKey: ['/api/warehouse/categories'],
  });

  // Form setup
  const form = useForm<ConsumableFormValues>({
    resolver: zodResolver(consumableFormSchema),
    defaultValues: {
      name: '',
      description: '',
      code: '',
      categoryId: undefined,
      unitOfMeasure: '',
      unitCost: undefined,
      lastPurchasePrice: undefined,
      minimumStock: 0,
      maximumStock: undefined,
      reorderPoint: undefined,
      brand: '',
      model: '',
      presentation: '',
      supplierCode: '',
      requiresExpiration: false,
      perishable: false,
      hazardous: false,
      storageRequirements: '',
      notes: '',
      isActive: true,
    },
  });

  // Mutation para crear consumible
  const createConsumableMutation = useMutation({
    mutationFn: (data: ConsumableFormValues) => apiRequest('/api/warehouse/consumables', {
      method: 'POST',
      data: data
    }),
    onSuccess: () => {
      toast({
        title: 'Consumible creado',
        description: 'El consumible se ha creado exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/consumables'] });
      setLocation('/admin/warehouse/consumables');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al crear el consumible',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: ConsumableFormValues) => {
    setIsSubmitting(true);
    try {
      await createConsumableMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setLocation('/admin/warehouse/consumables');
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
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Consumible</h1>
            <p className="text-gray-600">Agrega un nuevo consumible al inventario</p>
          </div>
          </div>

          {/* Form */}
          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-2" data-testid="tab-basic">
                  <Package className="h-4 w-4" />
                  Básico
                </TabsTrigger>
                <TabsTrigger value="inventory" className="flex items-center gap-2" data-testid="tab-inventory">
                  <Archive className="h-4 w-4" />
                  Inventario
                </TabsTrigger>
                <TabsTrigger value="costs" className="flex items-center gap-2" data-testid="tab-costs">
                  <DollarSign className="h-4 w-4" />
                  Costos
                </TabsTrigger>
                <TabsTrigger value="properties" className="flex items-center gap-2" data-testid="tab-properties">
                  <Settings className="h-4 w-4" />
                  Propiedades
                </TabsTrigger>
              </TabsList>

              {/* Tab: Información Básica */}
              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Básica</CardTitle>
                    <CardDescription>
                      Información general del consumible
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nombre del consumible"
                                data-testid="input-name"
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
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Código único"
                                data-testid="input-code"
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descripción detallada del consumible"
                              data-testid="textarea-description"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría *</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={categoriesLoading}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()} data-testid={`category-option-${category.id}`}>
                                    <span style={{ color: category.color || '#666666' }}>{category.name}</span>
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
                        name="unitOfMeasure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidad de Medida *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-unit">
                                  <SelectValue placeholder="Selecciona unidad" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {UNITS_OF_MEASURE.map((unit) => (
                                  <SelectItem key={unit.value} value={unit.value} data-testid={`unit-option-${unit.value}`}>
                                    {unit.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marca</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Marca del producto"
                                data-testid="input-brand"
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
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modelo</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Modelo"
                                data-testid="input-model"
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
                        name="presentation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Presentación</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Presentación del producto"
                                data-testid="input-presentation"
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

              {/* Tab: Inventario */}
              <TabsContent value="inventory">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestión de Inventario</CardTitle>
                    <CardDescription>
                      Configuración de stock y inventario
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="minimumStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Mínimo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                data-testid="input-minimum-stock"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="maximumStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Máximo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Opcional"
                                data-testid="input-max-stock"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="reorderPoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Punto de Reorden</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Opcional"
                                data-testid="input-reorder-point"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="supplierCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código de Proveedor</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Código del proveedor"
                              data-testid="input-supplier-code"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Código o referencia del proveedor para este consumible
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Costos */}
              <TabsContent value="costs">
                <Card>
                  <CardHeader>
                    <CardTitle>Información de Costos</CardTitle>
                    <CardDescription>
                      Precios y costos asociados al consumible
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                                placeholder="0.00"
                                data-testid="input-cost"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormDescription>
                              Costo de compra o adquisición por unidad
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastPurchasePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Último Precio de Compra</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                data-testid="input-price"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormDescription>
                              Último precio de compra registrado
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Propiedades */}
              <TabsContent value="properties">
                <Card>
                  <CardHeader>
                    <CardTitle>Propiedades Especiales</CardTitle>
                    <CardDescription>
                      Características adicionales y requisitos especiales
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Switches */}
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="requiresExpiration"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Requiere Fecha de Vencimiento</FormLabel>
                              <FormDescription>
                                El consumible tiene fecha de vencimiento
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                                data-testid="switch-requires-expiration"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="perishable"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Perecedero</FormLabel>
                              <FormDescription>
                                El producto es perecedero
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                                data-testid="switch-perishable"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hazardous"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Material Peligroso</FormLabel>
                              <FormDescription>
                                El producto requiere manejo especial
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                                data-testid="switch-hazardous"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Activo</FormLabel>
                              <FormDescription>
                                El consumible está activo en el sistema
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value ?? true}
                                onCheckedChange={field.onChange}
                                data-testid="switch-is-active"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Campos de texto adicionales */}
                    <FormField
                      control={form.control}
                      name="storageRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requisitos de Almacenamiento</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describir condiciones especiales de almacenamiento..."
                              className="resize-none"
                              data-testid="textarea-storage-requirements"
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
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas Adicionales</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Observaciones o notas importantes..."
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
            </Tabs>

            {/* Actions */}
            <div className="flex justify-end gap-2">
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
                disabled={isSubmitting}
                data-testid="button-save"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Consumible'}
              </Button>
            </div>
          </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
}