import React, { useState } from 'react';
import { useLocation } from 'wouter';
import ROUTES from '@/routes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

const ScheduleMaintenancePage = () => {
  const [location, setLocation] = useLocation();
  const assetIdFromUrl = new URLSearchParams(window.location.search).get('assetId');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [maintenanceType, setMaintenanceType] = useState('preventivo');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(assetIdFromUrl || '');
  const [submitting, setSubmitting] = useState(false);

  // Obtener lista de activos
  const { data: assets = [] } = useQuery({
    queryKey: ['/api/assets'],
    retry: false,
  });

  // Obtener lista de usuarios que pueden ser asignados a mantenimientos (administradores y técnicos)
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    retry: false,
  });

  // Lista filtrada de usuarios relevantes (admin y técnicos)
  const relevantUsers = users.filter((user: any) => 
    ['admin', 'tecnico', 'supervisor'].includes(user.role)
  );

  // Datos de muestra para activos en caso de que falle la conexión a la API
  const sampleAssets = [
    { id: 1, name: 'Banca Modelo Colonial', parkId: 1, parkName: 'Parque Central' },
    { id: 2, name: 'Juego Infantil Múltiple', parkId: 1, parkName: 'Parque Central' },
    { id: 3, name: 'Fuente Central', parkId: 2, parkName: 'Parque Metropolitano' },
    { id: 4, name: 'Señalización Informativa', parkId: 2, parkName: 'Parque Metropolitano' },
  ];

  // Datos de muestra para usuarios en caso de que falle la conexión a la API
  const sampleUsers = [
    { id: 1, fullName: 'Juan Pérez', role: 'admin' },
    { id: 2, fullName: 'María López', role: 'tecnico' },
    { id: 3, fullName: 'Carlos Gómez', role: 'supervisor' },
  ];

  // Determinar qué datos utilizar (API o muestra)
  const displayAssets = assets.length > 0 ? assets : sampleAssets;
  const displayUsers = relevantUsers.length > 0 ? relevantUsers : sampleUsers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una fecha para el mantenimiento',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedAssetId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un activo para el mantenimiento',
        variant: 'destructive',
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: 'Error',
        description: 'Debes ingresar una descripción del mantenimiento',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Preparar los datos para el envío
      const maintenanceData = {
        assetId: parseInt(selectedAssetId),
        date: format(selectedDate, 'yyyy-MM-dd'),
        maintenanceType,
        description,
        priority,
        notes: notes.trim() || null,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        assignedToId: assignedToId ? parseInt(assignedToId) : null,
        status: 'pendiente'
      };

      // Intentar enviar los datos a la API
      const response = await fetch('/api/maintenance/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(maintenanceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al programar el mantenimiento');
      }

      // Invalidar consultas relacionadas para actualizar los datos
      queryClient.invalidateQueries({
        queryKey: ['/api/assets/maintenance/upcoming'],
      });
      
      toast({
        title: 'Mantenimiento programado',
        description: 'El mantenimiento ha sido programado correctamente',
      });

      // Redirigir según el origen: si viene del inventario (con ID), volver al inventario
      if (assetIdFromUrl) {
        setLocation(ROUTES.admin.assets.list);
      } else {
        setLocation(ROUTES.admin.assets.maintenance.calendar);
      }
    } catch (error) {
      console.error('Error al programar mantenimiento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo programar el mantenimiento. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container py-6">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setLocation(ROUTES.admin.assets.maintenance.calendar)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Calendario
            </Button>
            {assetIdFromUrl && (
              <Button variant="outline" onClick={() => setLocation(ROUTES.admin.assets.list)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Inventario
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Programar Mantenimiento</h1>
              <p className="text-muted-foreground">
                Programa un nuevo mantenimiento para un activo
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="asset">Activo*</Label>
                  <Select value={selectedAssetId} onValueChange={setSelectedAssetId} required>
                    <SelectTrigger id="asset">
                      <SelectValue placeholder="Selecciona un activo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {displayAssets.map((asset: any) => (
                          <SelectItem key={asset.id} value={asset.id.toString()}>
                            {asset.name} ({asset.parkName || 'Sin parque asignado'})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenanceType">Tipo de Mantenimiento*</Label>
                  <Select value={maintenanceType} onValueChange={setMaintenanceType} required>
                    <SelectTrigger id="maintenanceType">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="correctivo">Correctivo</SelectItem>
                      <SelectItem value="predictivo">Predictivo</SelectItem>
                      <SelectItem value="inspeccion">Inspección</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad*</Label>
                  <Select value={priority} onValueChange={setPriority} required>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Selecciona la prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción*</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe el mantenimiento a realizar"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalles Adicionales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Fecha Programada*</Label>
                  <div className="border rounded-md p-3">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={es}
                      className="mx-auto"
                    />
                  </div>
                  {selectedDate && (
                    <p className="text-sm text-muted-foreground">
                      Fecha seleccionada: {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Asignar a</Label>
                  <Select value={assignedToId} onValueChange={setAssignedToId}>
                    <SelectTrigger id="assignedTo">
                      <SelectValue placeholder="Selecciona un responsable (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {displayUsers.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.fullName} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedCost">Costo Estimado (MXN)</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    placeholder="Ingresa el costo estimado"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    min={0}
                    step={0.01}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    placeholder="Información adicional relevante"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="outline" type="button" className="mr-2" onClick={() => setLocation(ROUTES.admin.assets.maintenance.calendar)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              <Save className="mr-2 h-4 w-4" />
              {submitting ? 'Guardando...' : 'Programar Mantenimiento'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ScheduleMaintenancePage;