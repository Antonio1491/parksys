import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, ClipboardList } from 'lucide-react';

import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Schema de validación
const workOrderSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  type: z.enum(['correctivo', 'preventivo', 'mejora', 'emergencia'], {
    required_error: 'El tipo es obligatorio'
  }),
  priority: z.enum(['baja', 'normal', 'alta', 'urgente'], {
    required_error: 'La prioridad es obligatoria'
  }),
  parkId: z.string().optional(),
  assetId: z.string().optional(),
  incidentId: z.string().optional(),
  requestedById: z.string().min(1, 'El solicitante es obligatorio'),
  assignedToEmployeeId: z.string().optional(),
  scheduledStartDate: z.string().optional(),
  scheduledEndDate: z.string().optional(),
  estimatedCost: z.string().optional(),
  notes: z.string().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

export default function NewWorkOrderPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Obtener parámetros de URL (si viene de un incidente o asset)
  const urlParams = new URLSearchParams(window.location.search);
  const incidentIdFromUrl = urlParams.get('incidentId');
  const assetIdFromUrl = urlParams.get('assetId');
  const parkIdFromUrl = urlParams.get('parkId');

  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'correctivo',
      priority: 'normal',
      parkId: parkIdFromUrl || '',
      assetId: assetIdFromUrl || '',
      incidentId: incidentIdFromUrl || '',
      requestedById: '',
      assignedToEmployeeId: '',
      scheduledStartDate: '',
      scheduledEndDate: '',
      estimatedCost: '',
      notes: '',
    },
  });

  // Queries para obtener datos
  const { data: parks = [] } = useQuery({
    queryKey: ['/api/parks'],
    retry: false,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['/api/assets'],
    retry: false,
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['/api/incidents'],
    retry: false,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/hr/employees'],
    retry: false,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    retry: false,
  });

  // Mutación para crear orden
  const createMutation = useMutation({
    mutationFn: async (data: WorkOrderFormData) => {
      const workOrderData = {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        parkId: data.parkId ? parseInt(data.parkId) : null,
        assetId: data.assetId ? parseInt(data.assetId) : null,
        incidentId: data.incidentId ? parseInt(data.incidentId) : null,
        requestedById: parseInt(data.requestedById),
        assignedToEmployeeId: data.assignedToEmployeeId ? parseInt(data.assignedToEmployeeId) : null,
        scheduledStartDate: data.scheduledStartDate || null,
        scheduledEndDate: data.scheduledEndDate || null,
        estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : null,
        notes: data.notes || null,
      };

      console.log('📝 Creando orden de trabajo:', workOrderData);
      return apiRequest('/api/work-orders', {
        method: 'POST',
        data: workOrderData,
      });
    },
    onSuccess: (response) => {
      toast({
        title: 'Orden de trabajo creada',
        description: `Folio: ${response.folio}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      setLocation('/admin/work-orders');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la orden de trabajo.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: WorkOrderFormData) => {
    createMutation.mutate(data);
  };

  // Filtrar arrays de forma segura
  const safeParks = Array.isArray(parks) ? parks.filter((p: any) => p?.id && p?.name) : [];
  const safeAssets = Array.isArray(assets) ? assets.filter((a: any) => a?.id && a?.name) : [];
  const safeIncidents = Array.isArray(incidents) ? incidents.filter((i: any) => i?.id && i?.title) : [];
  const safeEmployees = Array.isArray(employees) ? employees.filter((e: any) => e?.id && e?.fullName) : [];
  const safeUsers = Array.isArray(users) ? users.filter((u: any) => u?.id && u?.fullName) : [];

  return (
    <AdminLayout title="Nueva Orden de Trabajo">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation('/admin/work-orders')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nueva Orden de Trabajo</h1>
            <p className="text-gray-500 mt-1">
              Crea una nueva orden de mantenimiento o mejora
            </p>
          </div>
        </div>

        {/* Formulario */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Reparación de juegos infantiles" 
                          {...field}
                          data-testid="input-title"
                        />
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
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe en detalle el trabajo a realizar..."
                          rows={4}
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Orden *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="correctivo">Correctivo</SelectItem>
                            <SelectItem value="preventivo">Preventivo</SelectItem>
                            <SelectItem value="mejora">Mejora</SelectItem>
                            <SelectItem value="emergencia">Emergencia</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Tipo de mantenimiento a realizar
                        </FormDescription>
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
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ubicación y Referencias */}
            <Card>
              <CardHeader>
                <CardTitle>Ubicación y Referencias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="parkId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parque</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-park">
                            <SelectValue placeholder="Selecciona un parque" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Ninguno</SelectItem>
                          {safeParks.map((park: any) => (
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
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activo Relacionado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-asset">
                            <SelectValue placeholder="Selecciona un activo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Ninguno</SelectItem>
                          {safeAssets.map((asset: any) => (
                            <SelectItem key={asset.id} value={asset.id.toString()}>
                              {asset.name} - {asset.assetTag}
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
                  name="incidentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incidente Relacionado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-incident">
                            <SelectValue placeholder="Selecciona un incidente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Ninguno</SelectItem>
                          {safeIncidents.map((incident: any) => (
                            <SelectItem key={incident.id} value={incident.id.toString()}>
                              {incident.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Si esta orden surge de un incidente reportado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Asignación */}
            <Card>
              <CardHeader>
                <CardTitle>Asignación y Planificación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="requestedById"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solicitado por *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-requested-by">
                            <SelectValue placeholder="Selecciona un usuario" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {safeUsers.map((user: any) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.fullName || user.username}
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
                  name="assignedToEmployeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asignar a</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-assigned-to">
                            <SelectValue placeholder="Selecciona un empleado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sin asignar</SelectItem>
                          {safeEmployees.map((employee: any) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Empleado responsable de ejecutar el trabajo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduledStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Inicio Programada</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            data-testid="input-start-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Fin Programada</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            data-testid="input-end-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="estimatedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo Estimado</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-estimated-cost"
                        />
                      </FormControl>
                      <FormDescription>
                        Costo estimado en MXN
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Notas Adicionales */}
            <Card>
              <CardHeader>
                <CardTitle>Notas Adicionales</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Información adicional relevante..."
                          rows={3}
                          {...field}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/admin/work-orders')}
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Crear Orden
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
