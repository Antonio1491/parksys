import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
} from '@/components/ui/form';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Esquema de validación completo con todas las secciones
const incidentSchema = z.object({
  // === INFORMACIÓN DE LA INCIDENCIA ===
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  incidenciaId: z.string().optional(),
  fechaReporte: z.date().optional(),
  fechaOcurrencia: z.date().optional(),
  tipoAfectacion: z.string().min(1, 'El tipo de afectación es obligatorio'),
  nivelRiesgo: z.string().min(1, 'El nivel de riesgo es obligatorio'),
  descripcionDetallada: z.string().optional(),
  ubicacionGps: z.string().optional(),
  parkId: z.string().min(1, 'El parque es obligatorio'),
  activoId: z.string().optional(),
  
  // === SEGUIMIENTO OPERATIVO ===
  departamentoResponsable: z.string().optional(),
  responsableAsignado: z.string().optional(),
  fechaAsignacion: z.date().optional(),
  fechaInicioAtencion: z.date().optional(),
  fechaResolucion: z.date().optional(),
  accionesRealizadas: z.string().optional(),
  materialesUtilizados: z.string().optional(),
  costoEstimado: z.string().optional(),
  costoReal: z.string().optional(),
  fuenteFinanciamiento: z.string().optional(),
  
  // === CONTROL Y CALIDAD ===
  estatusValidacion: z.string().optional(),
  supervisorValidador: z.string().optional(),
  comentariosSupervision: z.string().optional(),
  satisfaccionUsuario: z.string().optional(),
  seguimientoPostResolucion: z.string().optional(),
  frecuenciaIncidente: z.string().optional(),
  
  // === DIMENSIÓN COMUNITARIA Y AMBIENTAL ===
  afectacionUsuarios: z.string().optional(),
  numeroPersonasAfectadas: z.string().optional(),
  afectacionMedioambiental: z.string().optional(),
  participacionVoluntarios: z.string().optional(),
  numeroVoluntarios: z.string().optional(),
  grupoVoluntarios: z.string().optional(),
  reporteComunidad: z.string().optional(),
  
  // Campos existentes que mantenemos
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  categoryId: z.string().min(1, 'La categoría es obligatoria'),
  assetId: z.string().optional(),
  location: z.string().optional(),
  reportedBy: z.string().min(1, 'El responsable del reporte es obligatorio'),
  contactInfo: z.string().optional(),
});

type IncidentFormData = z.infer<typeof incidentSchema>;

const NewIncidentPage = () => {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Obtener parámetros de la URL (assetId si viene del inventario)
  const urlParams = new URLSearchParams(window.location.search);
  const assetIdFromUrl = urlParams.get('assetId');

  // Configurar el formulario
  const form = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      // === INFORMACIÓN DE LA INCIDENCIA ===
      title: '',
      description: '',
      incidenciaId: '',
      fechaReporte: new Date(),
      fechaOcurrencia: undefined,
      tipoAfectacion: '',
      nivelRiesgo: '',
      descripcionDetallada: '',
      ubicacionGps: '',
      parkId: '',
      activoId: assetIdFromUrl || '',
      
      // === SEGUIMIENTO OPERATIVO ===
      departamentoResponsable: '',
      responsableAsignado: '',
      fechaAsignacion: undefined,
      fechaInicioAtencion: undefined,
      fechaResolucion: undefined,
      accionesRealizadas: '',
      materialesUtilizados: '',
      costoEstimado: '',
      costoReal: '',
      fuenteFinanciamiento: '',
      
      // === CONTROL Y CALIDAD ===
      estatusValidacion: 'pendiente',
      supervisorValidador: '',
      comentariosSupervision: '',
      satisfaccionUsuario: '',
      seguimientoPostResolucion: '',
      frecuenciaIncidente: '',
      
      // === DIMENSIÓN COMUNITARIA Y AMBIENTAL ===
      afectacionUsuarios: '',
      numeroPersonasAfectadas: '',
      afectacionMedioambiental: '',
      participacionVoluntarios: '',
      numeroVoluntarios: '',
      grupoVoluntarios: '',
      reporteComunidad: '',
      
      // Campos existentes
      priority: 'medium',
      categoryId: '',
      assetId: assetIdFromUrl || '',
      location: '',
      reportedBy: '',
      contactInfo: '',
    },
  });

  // Consultas para obtener datos
  const { data: parks = [] } = useQuery({
    queryKey: ['/api/parks'],
    retry: false,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['/api/assets'],
    retry: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/incident-categories'],
    retry: false,
  });

  // Mutación para crear incidencia
  const createMutation = useMutation({
    mutationFn: async (data: IncidentFormData) => {
      // Mapear campos del frontend a lo que espera el backend
      const incidentData = {
        title: data.title,
        description: data.description,
        assetId: data.assetId && data.assetId !== 'none' ? parseInt(data.assetId) : null,
        parkId: parseInt(data.parkId),
        categoryId: parseInt(data.categoryId),
        severity: data.priority, // priority -> severity
        location: data.location,
        reporterName: data.reportedBy, // reportedBy -> reporterName
        reporterEmail: data.contactInfo, // contactInfo -> reporterEmail
        status: 'pending' // El servidor espera 'pending', no 'reported'
      };
      
      console.log('📝 Datos del formulario a enviar:', data);
      console.log('📝 Datos procesados para envío:', incidentData);
      
      return apiRequest('/api/incidents', {
        method: 'POST',
        data: incidentData,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Incidencia creada',
        description: 'La incidencia ha sido reportada exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      setLocation('/admin/incidents');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la incidencia.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: IncidentFormData) => {
    createMutation.mutate(data);
  };

  // Datos de muestra para categorías si no cargan de la API
  const sampleCategories = [
    { id: 1, name: 'Mantenimiento', description: 'Problemas de mantenimiento general' },
    { id: 2, name: 'Seguridad', description: 'Incidentes de seguridad' },
    { id: 3, name: 'Limpieza', description: 'Problemas de limpieza' },
    { id: 4, name: 'Infraestructura', description: 'Daños en infraestructura' },
    { id: 5, name: 'Vandalismo', description: 'Actos de vandalismo' },
  ];

  // Filtros defensivos para datos con valores válidos
  const safeCategories = React.useMemo(() => {
    const categoriesToUse = categories.length > 0 ? categories : sampleCategories;
    return categoriesToUse.filter((category: any) => 
      category && 
      category.id && 
      category.name && 
      category.name.trim() !== '' &&
      category.id.toString().trim() !== ''
    );
  }, [categories]);

  const safeParks = React.useMemo(() => {
    if (!Array.isArray(parks)) return [];
    return parks.filter((park: any) => 
      park && 
      park.id && 
      park.name && 
      park.name.trim() !== '' &&
      park.id.toString().trim() !== ''
    );
  }, [parks]);

  const safeAssets = React.useMemo(() => {
    if (!Array.isArray(assets)) return [];
    return assets.filter((asset: any) => 
      asset && 
      asset.id && 
      asset.name && 
      asset.name.trim() !== '' &&
      asset.id.toString().trim() !== ''
    );
  }, [assets]);

  const displayCategories = safeCategories;

  // Preseleccionar el activo y cargar información automáticamente si viene de la URL
  useEffect(() => {
    if (assetIdFromUrl && safeAssets.length > 0) {
      const asset = safeAssets.find((a: any) => a.id === parseInt(assetIdFromUrl));
      if (asset) {
        // Cargar datos del activo automáticamente
        form.setValue('assetId', assetIdFromUrl);
        form.setValue('parkId', asset.parkId?.toString() || '');
        
        // Construir ubicación automática basada en la información del activo
        let locationDescription = '';
        
        // Incluir ubicación descriptiva si existe
        if (asset.locationDescription && asset.locationDescription.trim()) {
          locationDescription = asset.locationDescription.trim();
        }
        
        // Agregar coordenadas si existen
        if (asset.latitude && asset.longitude) {
          const coords = `${parseFloat(asset.latitude).toFixed(6)}, ${parseFloat(asset.longitude).toFixed(6)}`;
          locationDescription = locationDescription 
            ? `${locationDescription} (Coordenadas: ${coords})`
            : `Coordenadas: ${coords}`;
        }
        
        // Si no hay ubicación específica, usar información básica del activo
        if (!locationDescription) {
          locationDescription = `Área del activo: ${asset.name}`;
        }
        
        form.setValue('location', locationDescription);
        
        console.log('🎯 Datos del activo cargados automáticamente:', {
          assetId: asset.id,
          assetName: asset.name,
          parkId: asset.parkId,
          location: locationDescription,
          coordinates: asset.latitude && asset.longitude ? `${asset.latitude}, ${asset.longitude}` : 'No disponibles'
        });
      }
    }
  }, [assetIdFromUrl, safeAssets, form]);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/admin/incidents')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Incidencias
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Reportar Nueva Incidencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Banner informativo cuando viene de un activo */}
            {assetIdFromUrl && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-blue-100 rounded">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-1">
                      Formulario configurado automáticamente
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Los campos de activo, parque y ubicación se han completado automáticamente 
                      basándose en el activo seleccionado desde el inventario.
                    </p>
                    <div className="text-xs text-blue-600 space-y-1">
                      <div>• <strong>Activo:</strong> {safeAssets.find((a: any) => a.id === parseInt(assetIdFromUrl))?.name || 'Cargando...'}</div>
                      <div>• <strong>Parque:</strong> {safeParks.find((p: any) => p.id === parseInt(form.watch('parkId')))?.name || 'Cargando...'}</div>
                      <div>• <strong>Ubicación:</strong> Incluye coordenadas precisas del activo</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* SECCIÓN 1: INFORMACIÓN DE LA INCIDENCIA */}
                <Card className="border-blue-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-blue-800 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      1. Información de la Incidencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Título */}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título de la Incidencia *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Daño en resbaladilla" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* ID de Incidencia */}
                      <FormField
                        control={form.control}
                        name="incidenciaId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID de Incidencia (Opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="INC-2025-001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Tipo de Afectación */}
                      <FormField
                        control={form.control}
                        name="tipoAfectacion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Afectación *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="seguridad">Seguridad</SelectItem>
                                <SelectItem value="ambiental">Ambiental</SelectItem>
                                <SelectItem value="infraestructura">Infraestructura</SelectItem>
                                <SelectItem value="servicio">Servicio</SelectItem>
                                <SelectItem value="usuario">Usuario</SelectItem>
                                <SelectItem value="otro">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Nivel de Riesgo */}
                      <FormField
                        control={form.control}
                        name="nivelRiesgo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nivel de Riesgo *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar nivel" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bajo">Bajo</SelectItem>
                                <SelectItem value="medio">Medio</SelectItem>
                                <SelectItem value="alto">Alto</SelectItem>
                                <SelectItem value="critico">Crítico</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Parque */}
                      <FormField
                        control={form.control}
                        name="parkId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parque *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar parque" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
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

                      {/* Activo Relacionado */}
                      <FormField
                        control={form.control}
                        name="activoId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Activo Relacionado</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar activo (opcional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Sin activo específico</SelectItem>
                                {safeAssets.map((asset: any) => (
                                  <SelectItem key={asset.id} value={asset.id.toString()}>
                                    {asset.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Descripción Detallada */}
                    <FormField
                      control={form.control}
                      name="descripcionDetallada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción Detallada *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe la incidencia con el mayor detalle posible..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Ubicación GPS */}
                    <FormField
                      control={form.control}
                      name="ubicacionGps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coordenadas GPS</FormLabel>
                          <FormControl>
                            <Input placeholder="20.6596988, -103.3496092" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* SECCIÓN 2: SEGUIMIENTO OPERATIVO */}
                <Card className="border-green-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      2. Seguimiento Operativo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Departamento Responsable */}
                      <FormField
                        control={form.control}
                        name="departamentoResponsable"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departamento Responsable</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar departamento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                                <SelectItem value="seguridad">Seguridad</SelectItem>
                                <SelectItem value="jardineria">Jardinería</SelectItem>
                                <SelectItem value="concesiones">Concesiones</SelectItem>
                                <SelectItem value="limpieza">Limpieza</SelectItem>
                                <SelectItem value="administracion">Administración</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Responsable Asignado */}
                      <FormField
                        control={form.control}
                        name="responsableAsignado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsable Asignado</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre del responsable o cuadrilla" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Fuente de Financiamiento */}
                      <FormField
                        control={form.control}
                        name="fuenteFinanciamiento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fuente de Financiamiento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar fuente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="presupuesto_municipal">Presupuesto Municipal</SelectItem>
                                <SelectItem value="concesion">Concesión</SelectItem>
                                <SelectItem value="patrocinio">Patrocinio</SelectItem>
                                <SelectItem value="donativo">Donativo</SelectItem>
                                <SelectItem value="voluntariado">Voluntariado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Costo Estimado */}
                      <FormField
                        control={form.control}
                        name="costoEstimado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Costo Estimado (MXN)</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Acciones Realizadas */}
                    <FormField
                      control={form.control}
                      name="accionesRealizadas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Acciones Realizadas</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detalla las acciones que se han realizado o están pendientes..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Materiales Utilizados */}
                    <FormField
                      control={form.control}
                      name="materialesUtilizados"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Materiales Utilizados</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Lista de materiales e insumos utilizados..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* SECCIÓN 3: CONTROL Y CALIDAD */}
                <Card className="border-orange-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-orange-800 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      3. Control y Calidad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Estatus de Validación */}
                      <FormField
                        control={form.control}
                        name="estatusValidacion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estatus de Validación</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar estatus" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                <SelectItem value="validado">Validado</SelectItem>
                                <SelectItem value="rechazado">Rechazado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Supervisor Validador */}
                      <FormField
                        control={form.control}
                        name="supervisorValidador"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supervisor Validador</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre del supervisor" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Satisfacción del Usuario */}
                      <FormField
                        control={form.control}
                        name="satisfaccionUsuario"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Satisfacción del Usuario (1-5)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Calificar satisfacción" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1 - Muy insatisfecho</SelectItem>
                                <SelectItem value="2">2 - Insatisfecho</SelectItem>
                                <SelectItem value="3">3 - Neutral</SelectItem>
                                <SelectItem value="4">4 - Satisfecho</SelectItem>
                                <SelectItem value="5">5 - Muy satisfecho</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Frecuencia del Incidente */}
                      <FormField
                        control={form.control}
                        name="frecuenciaIncidente"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frecuencia del Incidente</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar frecuencia" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="unico">Único</SelectItem>
                                <SelectItem value="recurrente">Recurrente</SelectItem>
                                <SelectItem value="patron_detectado">Patrón detectado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Comentarios de Supervisión */}
                    <FormField
                      control={form.control}
                      name="comentariosSupervision"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comentarios de Supervisión</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Comentarios del supervisor sobre la resolución..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Seguimiento Post-Resolución */}
                    <FormField
                      control={form.control}
                      name="seguimientoPostResolucion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seguimiento Post-Resolución</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Notas sobre seguimiento, garantías o revisitas..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* SECCIÓN 4: DIMENSIÓN COMUNITARIA Y AMBIENTAL */}
                <Card className="border-purple-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-purple-800 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      4. Dimensión Comunitaria y Ambiental
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Afectación a Usuarios */}
                      <FormField
                        control={form.control}
                        name="afectacionUsuarios"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>¿Afecta a Usuarios?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="si">Sí</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Número de Personas Afectadas */}
                      <FormField
                        control={form.control}
                        name="numeroPersonasAfectadas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Personas Afectadas</FormLabel>
                            <FormControl>
                              <Input placeholder="Estimado de personas" type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Participación de Voluntarios */}
                      <FormField
                        control={form.control}
                        name="participacionVoluntarios"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>¿Participan Voluntarios?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="si">Sí</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Número de Voluntarios */}
                      <FormField
                        control={form.control}
                        name="numeroVoluntarios"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Voluntarios</FormLabel>
                            <FormControl>
                              <Input placeholder="Cantidad de voluntarios" type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Afectación Medioambiental */}
                    <FormField
                      control={form.control}
                      name="afectacionMedioambiental"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Afectación Medioambiental</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe la afectación al suelo, agua, flora, fauna..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Grupo de Voluntarios */}
                    <FormField
                      control={form.control}
                      name="grupoVoluntarios"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grupo de Voluntarios</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Grupo Ecológico, Asociación de Vecinos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Reporte de Comunidad */}
                    <FormField
                      control={form.control}
                      name="reporteComunidad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reporte de Comunidad</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Si fue reportado por un vecino, asociación o visitante, detalla la información..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* INFORMACIÓN ADICIONAL */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-gray-800 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Información Adicional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Categoría (campo existente) */}
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {displayCategories.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Prioridad (campo existente) */}
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prioridad *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar prioridad" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Baja</SelectItem>
                                <SelectItem value="medium">Media</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                                <SelectItem value="critical">Crítica</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Reportado por */}
                      <FormField
                        control={form.control}
                        name="reportedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reportado Por *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre del responsable" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Información de contacto */}
                      <FormField
                        control={form.control}
                        name="contactInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Información de Contacto</FormLabel>
                            <FormControl>
                              <Input placeholder="Email o teléfono" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Descripción (campo existente) */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción (Resumen) *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Resumen breve de la incidencia..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Botones */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/admin/incidents')}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createMutation.isPending ? 'Guardando...' : 'Crear Incidencia'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default NewIncidentPage;