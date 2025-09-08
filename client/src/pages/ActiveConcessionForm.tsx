import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Save, Loader2, Building2, Users, MapPin, Calendar, DollarSign, Phone, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';

// Schema de validación
const activeConcessionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  concessionTypeId: z.number().min(1, 'Selecciona un tipo de concesión'),
  concessionaireId: z.number().min(1, 'Selecciona un concesionario'),
  parkId: z.number().min(1, 'Selecciona un parque'),
  specificLocation: z.string().min(1, 'La ubicación específica es requerida'),
  coordinates: z.string().optional(),
  area: z.number().min(0, 'El área debe ser mayor a 0').optional(),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().min(1, 'La fecha de fin es requerida'),
  operatingHours: z.string().optional(),
  operatingDays: z.string().optional(),
  status: z.string().default('activa'),
  priority: z.string().default('normal'),
  specificTerms: z.string().optional(),
  specialRequirements: z.string().optional(),
  contractNumber: z.string().optional(),
  monthlyPayment: z.number().min(0, 'El pago mensual debe ser mayor a 0').optional(),
  revenuePercentage: z.number().min(0).max(100, 'El porcentaje no puede ser mayor a 100').optional(),
  deposit: z.number().min(0, 'El depósito debe ser mayor a 0').optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional()
});

type ActiveConcessionFormData = z.infer<typeof activeConcessionSchema>;

function ActiveConcessionForm() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  // Obtener datos para formulario
  const { data: concessionTypesData } = useQuery({
    queryKey: ['/api/concession-types-active'],
  });

  const { data: concessionairesData } = useQuery({
    queryKey: ['/api/concessionaires'],
  });

  const { data: parksData } = useQuery({
    queryKey: ['/api/parks?simple=true'],
  });

  // Obtener datos existentes si es edición
  const { data: existingConcession, isLoading: loadingExisting } = useQuery({
    queryKey: [`/api/active-concessions/${id}`],
    enabled: isEdit,
    staleTime: 0 // Forzar nueva consulta
  });

  const form = useForm<ActiveConcessionFormData>({
    resolver: zodResolver(activeConcessionSchema),
    defaultValues: {
      name: '',
      description: '',
      concessionTypeId: 0,
      concessionaireId: 0,
      parkId: 0,
      specificLocation: '',
      coordinates: '',
      area: 0,
      startDate: '',
      endDate: '',
      operatingHours: '',
      operatingDays: '',
      status: 'activa',
      priority: 'normal',
      specificTerms: '',
      specialRequirements: '',
      contractNumber: '',
      monthlyPayment: 0,
      revenuePercentage: 0,
      deposit: 0,
      emergencyContact: '',
      emergencyPhone: '',
      notes: '',
      internalNotes: ''
    }
  });

  // Cargar datos existentes si es edición
  useEffect(() => {
    if (isEdit && existingConcession?.data) {
      const data = existingConcession.data;
      console.log('🔍 Datos JSON parseados:', data);
      form.reset({
        name: data.name || '',
        description: data.description || '',
        concessionTypeId: data.concession_type_id || 0,
        concessionaireId: data.concessionaire_id || 0,
        parkId: data.park_id || 0,
        specificLocation: data.specific_location || '',
        coordinates: data.coordinates || '',
        area: parseFloat(data.area) || 0,
        startDate: data.start_date ? data.start_date.split('T')[0] : '',
        endDate: data.end_date ? data.end_date.split('T')[0] : '',
        operatingHours: data.operating_hours || '',
        operatingDays: data.operating_days || '',
        status: data.status || 'activa',
        priority: data.priority || 'normal',
        specificTerms: data.specific_terms || '',
        specialRequirements: data.special_requirements || '',
        contractNumber: data.contract_number || '',
        monthlyPayment: parseFloat(data.monthly_payment) || 0,
        revenuePercentage: parseFloat(data.revenue_percentage) || 0,
        deposit: parseFloat(data.deposit) || 0,
        emergencyContact: data.emergency_contact || '',
        emergencyPhone: data.emergency_phone || '',
        notes: data.notes || '',
        internalNotes: data.internal_notes || ''
      });
    }
  }, [existingConcession, form, isEdit]);

  // Mutación para crear/actualizar
  const saveMutation = useMutation({
    mutationFn: async (mappedData: any) => {
      console.log('🔄 Enviando concesión:', mappedData);
      if (isEdit) {
        return apiRequest(`/api/active-concessions/${id}`, {
          method: 'PUT',
          data: mappedData
        });
      } else {
        return apiRequest('/api/active-concessions', {
          method: 'POST',
          data: mappedData
        });
      }
    },
    onSuccess: (response) => {
      setIsSubmitting(false); // Resetear estado de envío
      toast({
        title: isEdit ? 'Concesión actualizada' : 'Concesión creada',
        description: `La concesión ${isEdit ? 'se ha actualizado' : 'se ha creado'} exitosamente.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/active-concessions'] });
      
      if (!isEdit && response?.data?.id) {
        // Redirigir a gestión de imágenes después de crear
        navigate(`/admin/concessions/active/${response.data.id}/images`);
      } else {
        navigate('/admin/concessions/active');
      }
    },
    onError: (error: any) => {
      setIsSubmitting(false); // Resetear estado de envío en caso de error
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error al guardar la concesión.',
        variant: 'destructive'
      });
    }
  });

  // Estado para prevenir múltiples envíos con debouncing
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const onSubmit = (data: ActiveConcessionFormData) => {
    const now = Date.now();
    
    // Prevenir múltiples envíos con múltiples capas de protección
    if (saveMutation.isPending || isSubmitting) {
      console.log('⚠️ Operación ya en progreso, ignorando submit');
      return;
    }
    
    // Debouncing: prevenir envíos demasiado rápidos (menos de 2 segundos)
    if (now - lastSubmitTime < 2000) {
      console.log('⚠️ Envío demasiado rápido, ignorando submit');
      return;
    }

    setIsSubmitting(true);
    setLastSubmitTime(now);

    // Mapear los datos del frontend al formato esperado por el backend
    const mappedData = {
      name: data.name,
      description: data.description,
      concessionTypeId: data.concessionTypeId,
      concessionaireId: data.concessionaireId,
      parkId: data.parkId,
      specificLocation: data.specificLocation,
      coordinates: data.coordinates,
      area: data.area,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      priority: data.priority,
      operatingHours: data.operatingHours,
      operatingDays: data.operatingDays,
      specificTerms: data.specificTerms,
      specialRequirements: data.specialRequirements,
      contractNumber: data.contractNumber,
      monthlyPayment: data.monthlyPayment,
      revenuePercentage: data.revenuePercentage,
      deposit: data.deposit,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
      notes: data.notes,
      internalNotes: data.internalNotes
    };
    
    console.log('📤 Enviando concesión:', mappedData);
    saveMutation.mutate(mappedData);
  };

  if (isEdit && loadingExisting) {
    return (
      <AdminLayout title={isEdit ? "Editar Concesión Activa" : "Nueva Concesión Activa"}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </AdminLayout>
    );
  }

  const concessionTypes = concessionTypesData?.data || concessionTypesData || [];
  const concessionaires = concessionairesData || [];
  const parks = parksData?.data || parksData || [];

  // Verificar que todos los datos estén cargados
  const isDataLoading = !concessionTypesData || !concessionairesData || !parksData;
  
  if (isDataLoading) {
    return (
      <AdminLayout title={isEdit ? "Editar Concesión Activa" : "Nueva Concesión Activa"}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </AdminLayout>
    );
  }



  return (
    <AdminLayout title={isEdit ? "Editar Concesión Activa" : "Nueva Concesión Activa"}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/concessions/active">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Concesión Activa' : 'Nueva Concesión Activa'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Modifica los datos de la concesión' : 'Crea una nueva concesión operativa'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Concesión *</FormLabel>
                    <FormControl>
                      <Input placeholder="ej. Cafetería Central" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="concessionTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Concesión *</FormLabel>
                    <FormControl>
                      <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {concessionTypes.map((type: any) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe la concesión, sus servicios y características principales..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Responsables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Concesionario y Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="concessionaireId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Concesionario *</FormLabel>
                    <FormControl>
                      <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un concesionario" />
                        </SelectTrigger>
                        <SelectContent>
                          {concessionaires.map((concessionaire: any) => (
                            <SelectItem key={concessionaire.id} value={concessionaire.id.toString()}>
                              {concessionaire.fullName || concessionaire.name || concessionaire.username} ({concessionaire.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
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
                    <FormControl>
                      <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un parque" />
                        </SelectTrigger>
                        <SelectContent>
                          {parks.map((park: any) => (
                            <SelectItem key={park.id} value={park.id.toString()}>
                              {park.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specificLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación Específica *</FormLabel>
                    <FormControl>
                      <Input placeholder="ej. Entrada principal, Zona deportiva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (m²)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="coordinates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coordenadas GPS (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ej. 20.6767, -103.3475" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Vigencia y Operación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Vigencia y Operación
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Inicio *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Fin *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operatingHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horarios de Operación</FormLabel>
                    <FormControl>
                      <Input placeholder="ej. 8:00-18:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operatingDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días de Operación</FormLabel>
                    <FormControl>
                      <Input placeholder="ej. Lunes a Domingo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activa">Activa</SelectItem>
                          <SelectItem value="suspendida">Suspendida</SelectItem>
                          <SelectItem value="vencida">Vencida</SelectItem>
                          <SelectItem value="renovacion">En Renovación</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="baja">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Información Financiera */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Información Financiera
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="monthlyPayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pago Mensual (MXN)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="revenuePercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porcentaje de Ingresos (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depósito en Garantía (MXN)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-3">
                <FormField
                  control={form.control}
                  name="contractNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Contrato</FormLabel>
                      <FormControl>
                        <Input placeholder="ej. CON-2025-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contacto de Emergencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-red-600" />
                Contacto de Emergencia
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Contacto</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono de Emergencia</FormLabel>
                    <FormControl>
                      <Input placeholder="ej. +52 33 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Términos y Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Términos y Observaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="specificTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Términos Específicos</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Condiciones particulares de la concesión..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos Especiales</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Requisitos específicos que debe cumplir la concesión..."
                        rows={3}
                        {...field} 
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
                    <FormLabel>Notas Públicas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observaciones generales..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Internas (Solo Administradores)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observaciones internas del sistema..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Link href="/admin/concessions/active">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button 
              type="submit" 
              disabled={saveMutation.isPending || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {(saveMutation.isPending || isSubmitting) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? 'Actualizar Concesión' : 'Crear Concesión'}
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

export default ActiveConcessionForm;