import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Package } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const requisitionFormSchema = z.object({
  title: z.string().min(1, "Título es requerido"),
  description: z.string().optional(),
  parkId: z.number().min(1, "Parque es requerido"),
  priority: z.enum(["alta", "media", "baja"]).default("media"),
  requiredDate: z.string().optional(),
  items: z.array(z.object({
    consumableId: z.number().min(1, "Material es requerido"),
    requestedQuantity: z.number().min(1, "Cantidad debe ser mayor a 0"),
    notes: z.string().optional()
  })).min(1, "Debe agregar al menos un material")
});

type RequisitionFormData = z.infer<typeof requisitionFormSchema>;

export default function NewRequisitionPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [items, setItems] = useState<Array<{ consumableId: number; requestedQuantity: number; notes: string }>>([]);

  const form = useForm<RequisitionFormData>({
    resolver: zodResolver(requisitionFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'media',
      requiredDate: '',
      items: []
    },
  });

  // Queries
  const { data: parksResponse } = useQuery({
    queryKey: ['/api/parks'],
    retry: false,
  });
  const parks = parksResponse?.data || [];

  const { data: consumables = [] } = useQuery({
    queryKey: ['/api/warehouse/consumables'],
    retry: false,
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: async (data: RequisitionFormData) => {
      return await apiRequest('/api/warehouse/requisitions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Requisición creada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/requisitions'] });
      navigate('/admin/warehouse/requisitions');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la requisición",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    setItems([...items, { consumableId: 0, requestedQuantity: 1, notes: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const onSubmit = (data: RequisitionFormData) => {
    const validItems = items.filter(item => item.consumableId > 0 && item.requestedQuantity > 0);
    
    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un material válido",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...data,
      items: validItems
    };

    createMutation.mutate(submitData);
  };

  return (
    <AdminLayout title="Nueva Requisición" subtitle="Crear solicitud de materiales">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nueva Requisición</h1>
            <p className="text-muted-foreground">Complete el formulario para solicitar materiales</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/warehouse/requisitions')} data-testid="button-cancel">
            Cancelar
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Datos básicos de la requisición</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Materiales para mantenimiento de jardín" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción detallada de la requisición" 
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
                    name="parkId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parque de Destino *</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-park">
                              <SelectValue placeholder="Seleccionar parque" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {parks.map((park: any) => (
                              <SelectItem key={park.id} value={park.id.toString()}>
                                {park.name}
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
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Seleccionar prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requiredDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Requerida</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-required-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Materiales Solicitados</CardTitle>
                    <CardDescription>Agregue los materiales que necesita</CardDescription>
                  </div>
                  <Button type="button" onClick={addItem} variant="outline" size="sm" data-testid="button-add-item">
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Material
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay materiales agregados</p>
                    <p className="text-sm">Haga clic en "Agregar Material" para comenzar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <label className="text-sm font-medium">Material *</label>
                            <Select
                              value={item.consumableId.toString()}
                              onValueChange={(value) => updateItem(index, 'consumableId', parseInt(value))}
                            >
                              <SelectTrigger data-testid={`select-consumable-${index}`}>
                                <SelectValue placeholder="Seleccionar material" />
                              </SelectTrigger>
                              <SelectContent>
                                {consumables.map((consumable: any) => (
                                  <SelectItem key={consumable.id} value={consumable.id.toString()}>
                                    {consumable.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Cantidad *</label>
                            <Input
                              type="number"
                              min="1"
                              value={item.requestedQuantity}
                              onChange={(e) => updateItem(index, 'requestedQuantity', parseInt(e.target.value))}
                              data-testid={`input-quantity-${index}`}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Notas</label>
                            <Input
                              value={item.notes}
                              onChange={(e) => updateItem(index, 'notes', e.target.value)}
                              placeholder="Notas adicionales"
                              data-testid={`input-notes-${index}`}
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="mt-6"
                          data-testid={`button-remove-item-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/admin/warehouse/requisitions')}
                data-testid="button-cancel-bottom"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || items.length === 0}
                data-testid="button-submit"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear Requisición'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
