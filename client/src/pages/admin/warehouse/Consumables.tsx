import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Consumable, ConsumableCategory, insertConsumableSchema, type InsertConsumable } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Extended schema with additional validation rules
const consumableFormSchema = insertConsumableSchema.extend({
  code: z.string().min(1, "Código es requerido"),
  name: z.string().min(1, "Nombre es requerido"),
  categoryId: z.number().min(1, "Categoría es requerida"),
  unitOfMeasure: z.string().min(1, "Unidad de medida es requerida"),
  minimumStock: z.number().min(0, "Stock mínimo no puede ser negativo").optional(),
  maximumStock: z.number().min(0, "Stock máximo no puede ser negativo").optional(),
  reorderPoint: z.number().min(0, "Punto de reorden no puede ser negativo").optional(),
  unitCost: z.number().min(0, "Costo unitario no puede ser negativo").optional(),
  lastPurchasePrice: z.number().min(0, "Último precio de compra no puede ser negativo").optional()
});

type ConsumableFormData = z.infer<typeof consumableFormSchema>;

// ===== UNIDADES DE MEDIDA =====
const UNITS_OF_MEASURE = [
  { value: 'pieza', label: 'Pieza(s)', icon: Package },
  { value: 'litro', label: 'Litro(s)', icon: Package },
  { value: 'kilogramo', label: 'Kilogramo(s)', icon: Package },
  { value: 'metro', label: 'Metro(s)', icon: Package },
  { value: 'caja', label: 'Caja(s)', icon: Package },
  { value: 'paquete', label: 'Paquete(s)', icon: Package },
  { value: 'botella', label: 'Botella(s)', icon: Package },
  { value: 'galón', label: 'Galón(es)', icon: Package },
];

// ===== COLORES DISPONIBLES =====
const AVAILABLE_COLORS = [
  { value: '#00a587', label: 'Verde Principal', bg: 'bg-green-600' },
  { value: '#0ea5e9', label: 'Azul', bg: 'bg-blue-500' },
  { value: '#f97316', label: 'Naranja', bg: 'bg-orange-500' },
  { value: '#8b5cf6', label: 'Púrpura', bg: 'bg-purple-500' },
  { value: '#06b6d4', label: 'Cian', bg: 'bg-cyan-500' },
  { value: '#84cc16', label: 'Lima', bg: 'bg-lime-500' },
  { value: '#f59e0b', label: 'Ámbar', bg: 'bg-amber-500' },
  { value: '#ef4444', label: 'Rojo', bg: 'bg-red-500' }
];

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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>(''); // low, normal, high
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConsumable, setEditingConsumable] = useState<Consumable | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const itemsPerPage = 12;

  const form = useForm<ConsumableFormData>({
    resolver: zodResolver(consumableFormSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      categoryId: undefined,
      brand: '',
      model: '',
      unitOfMeasure: 'pieza',
      presentation: '',
      minimumStock: 0,
      maximumStock: 100,
      reorderPoint: 10,
      unitCost: 0,
      lastPurchasePrice: 0,
      preferredSupplierId: undefined,
      supplierCode: '',
      requiresExpiration: false,
      perishable: false,
      hazardous: false,
      storageRequirements: '',
      tags: [],
      notes: '',
      isActive: true
    },
  });

  // ===== QUERIES =====
  const { data: categories = [] } = useQuery<ConsumableCategory[]>({
    queryKey: ['/api/warehouse/categories']
  });

  const { data: allConsumables = [], isLoading, refetch } = useQuery<ConsumableWithCategory[]>({
    queryKey: ['/api/warehouse/consumables', { search: searchTerm, categoryId: selectedCategory, active: statusFilter, stock: stockFilter, supplier: supplierFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (statusFilter) params.append('active', statusFilter);
      if (stockFilter) params.append('stock', stockFilter);
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
  const createMutation = useMutation({
    mutationFn: async (data: ConsumableFormData) => {
      return apiRequest('/api/warehouse/consumables', {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['/api/warehouse/consumables'] });
      toast({ title: "Éxito", description: "Consumible creado correctamente" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al crear consumible",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ConsumableFormData }) => {
      return apiRequest(`/api/warehouse/consumables/${id}`, {
        method: 'PUT',
        data,
      });
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['/api/warehouse/consumables'] });
      toast({ title: "Éxito", description: "Consumible actualizado correctamente" });
      setIsDialogOpen(false);
      setEditingConsumable(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al actualizar consumible",
        variant: "destructive" 
      });
    },
  });

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
  const handleSubmit = (data: ConsumableFormData) => {
    if (editingConsumable) {
      updateMutation.mutate({ id: editingConsumable.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (consumable: Consumable) => {
    setEditingConsumable(consumable);
    form.reset({
      code: consumable.code,
      name: consumable.name,
      description: consumable.description || '',
      categoryId: consumable.categoryId || undefined,
      brand: consumable.brand || '',
      model: consumable.model || '',
      unitOfMeasure: consumable.unitOfMeasure || 'pieza',
      presentation: consumable.presentation || '',
      minimumStock: consumable.minimumStock || 0,
      maximumStock: consumable.maximumStock || 100,
      reorderPoint: consumable.reorderPoint || 10,
      unitCost: typeof consumable.unitCost === 'number' ? consumable.unitCost : (typeof consumable.unitCost === 'string' ? parseFloat(consumable.unitCost) || 0 : 0),
      lastPurchasePrice: typeof consumable.lastPurchasePrice === 'number' ? consumable.lastPurchasePrice : (typeof consumable.lastPurchasePrice === 'string' ? parseFloat(consumable.lastPurchasePrice) || 0 : 0),
      preferredSupplierId: consumable.preferredSupplierId || undefined,
      supplierCode: consumable.supplierCode || '',
      requiresExpiration: consumable.requiresExpiration,
      perishable: consumable.perishable,
      hazardous: consumable.hazardous,
      storageRequirements: consumable.storageRequirements || '',
      tags: consumable.tags || [],
      notes: consumable.notes || '',
      isActive: consumable.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (consumable: Consumable) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el consumible "${consumable.name}"?`)) {
      deleteMutation.mutate(consumable.id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingConsumable(null);
    form.reset();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setStatusFilter('');
    setStockFilter('');
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-consumable">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Consumible
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-form-consumable">
              <DialogHeader>
                <DialogTitle data-testid="dialog-title">
                  {editingConsumable ? 'Editar Consumible' : 'Agregar Nuevo Consumible'}
                </DialogTitle>
                <DialogDescription>
                  {editingConsumable 
                    ? 'Actualiza la información del consumible seleccionado.'
                    : 'Complete los campos para agregar un nuevo consumible al catálogo.'
                  }
                </DialogDescription>
              </DialogHeader>

              {/* ===== FORMULARIO ===== */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="form-consumable">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="basic" data-testid="tab-basic">Información Básica</TabsTrigger>
                      <TabsTrigger value="inventory" data-testid="tab-inventory">Inventario</TabsTrigger>
                      <TabsTrigger value="costs" data-testid="tab-costs">Costos</TabsTrigger>
                      <TabsTrigger value="properties" data-testid="tab-properties">Propiedades</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ej: MAT-001" data-testid="input-code" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ej: Papel para impresora A4" data-testid="input-name" />
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
                              <Textarea {...field} value={field.value ?? ''} placeholder="Descripción detallada del consumible" data-testid="textarea-description" />
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
                              <FormLabel>Categoría</FormLabel>
                              <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-category">
                                    <SelectValue placeholder="Seleccionar categoría" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()} data-testid={`category-option-${category.id}`}>
                                      <div className="flex items-center gap-2">
                                        {category.icon && React.createElement(getIconComponent(category.icon), { className: "h-4 w-4" })}
                                        {category.name}
                                      </div>
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
                          name="brand"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marca</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ''} placeholder="Ej: HP, Canon, 3M" data-testid="input-brand" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="inventory" className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="unitOfMeasure"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unidad de Medida</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-unit">
                                    <SelectValue placeholder="Seleccionar unidad" />
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
                        <FormField
                          control={form.control}
                          name="presentation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Presentación</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ''} placeholder="Ej: Caja de 500 hojas" data-testid="input-presentation" />
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
                                <Input {...field} value={field.value ?? ''} placeholder="Ej: CF280A" data-testid="input-model" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="minimumStock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stock Mínimo</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0"
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                  data-testid="input-minimum-stock" 
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
                                  {...field} 
                                  type="number" 
                                  min="0"
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                  data-testid="input-maximum-stock" 
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
                                  {...field} 
                                  type="number" 
                                  min="0"
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                  data-testid="input-reorder-point" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="costs" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="unitCost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Costo Unitario</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  data-testid="input-unit-cost" 
                                />
                              </FormControl>
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
                                  {...field} 
                                  type="number" 
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  data-testid="input-last-purchase-price" 
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
                            <FormLabel>Código del Proveedor</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''} placeholder="Código en el sistema del proveedor" data-testid="input-supplier-code" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="properties" className="space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="requiresExpiration"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Requiere Fecha de Vencimiento</FormLabel>
                                  <FormDescription className="text-sm text-muted-foreground">
                                    El producto tiene fecha de caducidad
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
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Perecedero</FormLabel>
                                  <FormDescription className="text-sm text-muted-foreground">
                                    El producto se deteriora con el tiempo
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
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Peligroso</FormLabel>
                                  <FormDescription className="text-sm text-muted-foreground">
                                    Requiere manejo especial por seguridad
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
                        </div>

                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="storageRequirements"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Requisitos de Almacenamiento</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    value={field.value ?? ''}
                                    placeholder="Ej: Mantener en lugar fresco y seco, alejado de la luz solar directa"
                                    className="min-h-[100px]"
                                    data-testid="textarea-storage-requirements" 
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
                                    {...field} 
                                    value={field.value ?? ''}
                                    placeholder="Cualquier información adicional relevante"
                                    data-testid="textarea-notes" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Estado Activo</FormLabel>
                              <FormDescription className="text-sm text-muted-foreground">
                                Determina si el consumible está disponible en el catálogo
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
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleDialogClose}
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-consumable"
                    >
                      {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : (editingConsumable ? 'Actualizar' : 'Crear')}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* ===== ESTADÍSTICAS ===== */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="stats-total">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Consumibles</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="count-total">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} activos
              </p>
            </CardContent>
          </Card>
          <Card data-testid="stats-categories">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorías</CardTitle>
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="count-categories">{stats.categories}</div>
              <p className="text-xs text-muted-foreground">
                diferentes tipos
              </p>
            </CardContent>
          </Card>
          <Card data-testid="stats-low-stock">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="count-low-stock">{stats.lowStock}</div>
              <p className="text-xs text-muted-foreground">
                requieren restock
              </p>
            </CardContent>
          </Card>
          <Card data-testid="stats-value">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-value">
                {formatCurrency(
                  ((allConsumables || []) as ConsumableWithCategory[]).reduce((sum: number, c: ConsumableWithCategory) => sum + (typeof c.unitCost === 'number' ? c.unitCost : 0), 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                inventario actual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ===== FILTROS ===== */}
        <Card data-testid="filters-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, código, marca o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48" data-testid="select-category-filter">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" data-testid="category-filter-all">Todas las categorías</SelectItem>
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36" data-testid="select-status-filter">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" data-testid="status-filter-all">Todos</SelectItem>
                    <SelectItem value="true" data-testid="status-filter-active">Activos</SelectItem>
                    <SelectItem value="false" data-testid="status-filter-inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-40" data-testid="select-stock-filter">
                    <SelectValue placeholder="Nivel de stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" data-testid="stock-filter-all">Todos los niveles</SelectItem>
                    <SelectItem value="low" data-testid="stock-filter-low">Stock bajo</SelectItem>
                    <SelectItem value="normal" data-testid="stock-filter-normal">Stock normal</SelectItem>
                    <SelectItem value="high" data-testid="stock-filter-high">Stock alto</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="w-44" data-testid="select-supplier-filter">
                    <SelectValue placeholder="Proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" data-testid="supplier-filter-all">Todos los proveedores</SelectItem>
                    <SelectItem value="with-supplier" data-testid="supplier-filter-with">Con proveedor asignado</SelectItem>
                    <SelectItem value="without-supplier" data-testid="supplier-filter-without">Sin proveedor asignado</SelectItem>
                  </SelectContent>
                </Select>

                {(searchTerm || selectedCategory || statusFilter || stockFilter || supplierFilter) && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== CONTROLES DE VISTA ===== */}
        <div className="flex justify-between items-center" data-testid="view-controls">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Mostrando {consumables.length} de {allConsumables.length} consumibles
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
              data-testid="button-view-cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ===== CONTENIDO PRINCIPAL ===== */}
        <div data-testid="consumables-content">
          {isLoading ? (
            <div className="text-center py-8" data-testid="loading-state">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando consumibles...</p>
            </div>
          ) : consumables.length === 0 ? (
            <Card data-testid="empty-state">
              <CardContent className="text-center py-8">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron consumibles</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory || statusFilter || stockFilter || supplierFilter 
                    ? "No hay consumibles que coincidan con los filtros aplicados"
                    : "Comienza agregando tu primer consumible al catálogo"
                  }
                </p>
                {searchTerm || selectedCategory || statusFilter || stockFilter || supplierFilter ? (
                  <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters-empty">
                    Limpiar filtros
                  </Button>
                ) : (
                  <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-consumable">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Consumible
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Vista Cards */}
              {viewMode === 'cards' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="consumables-grid">
                  {consumables.map((consumable: ConsumableWithCategory) => (
                    <Card key={consumable.id} className="hover:shadow-md transition-shadow" data-testid={`consumable-card-${consumable.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base mb-1" data-testid={`consumable-name-${consumable.id}`}>
                              {consumable.name}
                            </CardTitle>
                            <CardDescription className="text-sm" data-testid={`consumable-code-${consumable.id}`}>
                              {consumable.code}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(consumable)}
                              data-testid={`button-edit-consumable-${consumable.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(consumable)}
                              data-testid={`button-delete-consumable-${consumable.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {consumable.category && (
                          <div className="flex items-center gap-2">
                            {consumable.category.icon && 
                              React.createElement(getIconComponent(consumable.category.icon), { 
                                className: "h-4 w-4",
                                style: { color: consumable.category.color || '#6b7280' }
                              })
                            }
                            <span className="text-sm font-medium" data-testid={`consumable-category-${consumable.id}`}>
                              {consumable.category.name}
                            </span>
                          </div>
                        )}
                        {consumable.brand && (
                          <p className="text-sm text-muted-foreground" data-testid={`consumable-brand-${consumable.id}`}>
                            Marca: {consumable.brand}
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