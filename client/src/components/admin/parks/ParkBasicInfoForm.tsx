import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader } from 'lucide-react';

// ============================================================================
// SCHEMA DE VALIDACIÓN
// ============================================================================

const parkSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  municipality: z.string().min(1, 'El municipio es requerido'),
  address: z.string().min(1, 'La dirección es requerida'),
  description: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  area: z.string().optional(),
  foundationYear: z.coerce.number().nullable().optional(),
  dailySchedule: z.record(z.string(), z.object({
    enabled: z.boolean(),
    openingTime: z.string().nullable().optional(),
    closingTime: z.string().nullable().optional()
  })).optional(),
  administrator: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  certificaciones: z.string().optional(),
  status: z.enum([
    "en_funcionamiento",
    "operando_parcialmente", 
    "en_mantenimiento",
    "cerrado_temporalmente",
    "cerrado_indefinidamente",
    "reapertura_proxima",
    "en_proyecto_construccion",
    "uso_restringido"
  ]).optional(),
});

type ParkFormValues = z.infer<typeof parkSchema>;

// ============================================================================
// INTERFACES
// ============================================================================

interface Park {
  id: number;
  name: string;
  municipality?: string | { id: number; name: string };
  municipalityText?: string;
  address: string;
  description?: string;
  postalCode?: string;
  latitude?: string;
  longitude?: string;
  area?: string;
  foundationYear?: number | null;
  openingHours?: string; // JSON string
  administrator?: string;
  contactPhone?: string;
  contactEmail?: string;
  certificaciones?: string;
  status?: string;
}

export interface ParkBasicInfoFormProps {
  /** ID del parque a editar (undefined = modo creación) */
  parkId?: number;

  /** 
   * Callback ejecutado después de guardado exitoso
   * @param parkId - ID del parque creado/actualizado
   */
  onSuccess?: (parkId: number) => void;

  /** Mostrar botón de cancelar */
  showCancelButton?: boolean;

  /** Ruta a la que redirigir al cancelar (usar ROUTES centralizadas) */
  cancelRoute?: string;

  /** Clase CSS adicional para el contenedor */
  className?: string;

  /** ID del formulario (para submit externo desde park-manage) */
  formId?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ParkBasicInfoForm: React.FC<ParkBasicInfoFormProps> = ({
  parkId,
  onSuccess,
  showCancelButton = true,
  cancelRoute,
  className = '',
  formId = 'park-basic-info-form',
}) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEdit = !!parkId;

  // ========== FORM SETUP ==========
  const form = useForm<ParkFormValues>({
    resolver: zodResolver(parkSchema),
    defaultValues: {
      name: '',
      municipality: '',
      address: '',
      description: '',
      postalCode: '',
      latitude: '',
      longitude: '',
      area: '',
      foundationYear: null,
      dailySchedule: {
        Lunes: { enabled: false, openingTime: null, closingTime: null },
        Martes: { enabled: false, openingTime: null, closingTime: null },
        Miércoles: { enabled: false, openingTime: null, closingTime: null },
        Jueves: { enabled: false, openingTime: null, closingTime: null },
        Viernes: { enabled: false, openingTime: null, closingTime: null },
        Sábado: { enabled: false, openingTime: null, closingTime: null },
        Domingo: { enabled: false, openingTime: null, closingTime: null },
      },
      administrator: '',
      contactPhone: '',
      contactEmail: '',
      certificaciones: '',
      status: 'en_funcionamiento',
    },
  });

  // ========== QUERY PARA CARGAR DATOS (SOLO EN EDICIÓN) ==========
  const { data: park, isLoading: isLoadingPark } = useQuery<Park>({
    queryKey: [`/api/parks/${parkId}`],
    enabled: isEdit,
  });

  // ========== CARGAR VALORES AL FORMULARIO ==========
  useEffect(() => {
    if (park && isEdit) {
      // Parsear horarios desde DB
      let dailyScheduleFromDB = {
        Lunes: { enabled: false, openingTime: null, closingTime: null },
        Martes: { enabled: false, openingTime: null, closingTime: null },
        Miércoles: { enabled: false, openingTime: null, closingTime: null },
        Jueves: { enabled: false, openingTime: null, closingTime: null },
        Viernes: { enabled: false, openingTime: null, closingTime: null },
        Sábado: { enabled: false, openingTime: null, closingTime: null },
        Domingo: { enabled: false, openingTime: null, closingTime: null },
      };

      try {
        if (park.openingHours) {
          const parsed = JSON.parse(park.openingHours);
          dailyScheduleFromDB = { ...dailyScheduleFromDB, ...parsed };
        }
      } catch (error) {
        console.error("Error parseando horarios por defecto:", error);
      }

      const formValues = {
        name: park.name || '',
        municipality: park.municipalityText || park.municipality?.name || park.municipality || '',
        address: park.address || '',
        description: park.description || '',
        postalCode: park.postalCode || '',
        latitude: park.latitude || '',
        longitude: park.longitude || '',
        area: park.area || '',
        foundationYear: park.foundationYear || null,
        dailySchedule: dailyScheduleFromDB,
        administrator: park.administrator || '',
        contactPhone: park.contactPhone || '',
        contactEmail: park.contactEmail || '',
        certificaciones: park.certificaciones || '',
        status: park.status || 'en_funcionamiento',
      };

      form.reset(formValues);
    }
  }, [park, isEdit, form]);

  // ========== SUBMIT HANDLER ==========
  const onSubmit = (values: ParkFormValues) => {
    // Limpiar valores nulos/vacíos para el backend
    const cleanedValues = {
      ...values,
      latitude: values.latitude ? values.latitude.trim().replace(/,$/, '') : undefined,
      longitude: values.longitude ? values.longitude.trim().replace(/,$/, '') : undefined,
      area: values.area ? values.area.replace(/,/g, '') : undefined,
      foundationYear: values.foundationYear || undefined,
      administrator: values.administrator || undefined,
      contactPhone: values.contactPhone || undefined,
      contactEmail: values.contactEmail || undefined,
      openingHours: values.dailySchedule && Object.values(values.dailySchedule).some(schedule => schedule.enabled)
        ? JSON.stringify(values.dailySchedule)
        : undefined,
      certificaciones: values.certificaciones || undefined,
      status: values.status || 'en_funcionamiento',
    };

    mutation.mutate(cleanedValues);
  };

  // ========== MUTATION ==========
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const endpoint = isEdit ? `/api/parks/${parkId}` : '/api/parks';
      const method = isEdit ? 'PUT' : 'POST';

      return await apiRequest(endpoint, {
        method: method,
        data: values,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/parks'] });
      if (parkId) {
        queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}`] });
      }

      toast({
        title: isEdit ? 'Parque actualizado' : 'Parque creado',
        description: `El parque ha sido ${isEdit ? 'actualizado' : 'creado'} exitosamente.`,
      });

      // Callback onSuccess con el ID del parque
      if (onSuccess) {
        onSuccess(data.id || parkId!);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Ocurrió un error al ${isEdit ? 'actualizar' : 'crear'} el parque: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // ========== LOADING STATE ==========
  if (isEdit && isLoadingPark) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ========== RENDER ==========
  return (
    <Form {...form}>
      <form 
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)} 
        className={`space-y-6 ${className}`}
      >
        {/* ========== SECCIÓN 1: IDENTIFICACIÓN ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre del parque */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-red-600">Nombre del parque *</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del parque" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Municipio */}
          <FormField
            control={form.control}
            name="municipality"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-red-600">Municipio *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ingrese el municipio"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descripción general del parque..." 
                  className="min-h-32" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ========== SECCIÓN 2: UBICACIÓN ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dirección */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-red-600">Dirección *</FormLabel>
                <FormControl>
                  <Input placeholder="Dirección completa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Código postal */}
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Postal</FormLabel>
                <FormControl>
                  <Input placeholder="Código postal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Latitud */}
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitud</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: 20.6736" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Longitud */}
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitud</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: -103.3440" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ========== SECCIÓN 3: CARACTERÍSTICAS ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Área */}
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área (m²)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Área en metros cuadrados" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Año de Fundación */}
          <FormField
            control={form.control}
            name="foundationYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Año de Fundación</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Ej: 1995" 
                    {...field} 
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? null : parseInt(value));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ========== SECCIÓN 4: HORARIOS ========== */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Horarios de Apertura</h3>
          <p className="text-sm text-gray-600">
            Selecciona los días en que el parque está abierto y define los horarios
          </p>

          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
            <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              {/* Checkbox */}
              <FormField
                control={form.control}
                name={`dailySchedule.${day}.enabled`}
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Nombre del día */}
              <span className="w-full sm:w-24 font-medium text-gray-700">{day}</span>

              {/* Horario de apertura */}
              <FormField
                control={form.control}
                name={`dailySchedule.${day}.openingTime`}
                render={({ field }) => (
                  <FormItem className="w-full sm:flex-1">
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        value={field.value || ''}
                        disabled={!form.watch(`dailySchedule.${day}.enabled`)}
                        className="w-full"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <span className="hidden sm:inline text-gray-500">-</span>

              {/* Horario de cierre */}
              <FormField
                control={form.control}
                name={`dailySchedule.${day}.closingTime`}
                render={({ field }) => (
                  <FormItem className="w-full sm:flex-1">
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        value={field.value || ''}
                        disabled={!form.watch(`dailySchedule.${day}.enabled`)}
                        className="w-full"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        {/* ========== SECCIÓN 5: ADMINISTRACIÓN ========== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Administrador */}
          <FormField
            control={form.control}
            name="administrator"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Administrador</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del administrador" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Teléfono de Contacto */}
          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono de Contacto</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: +52 33 1234 5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email de Contacto */}
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email de Contacto</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="contacto@parque.com" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ========== SECCIÓN 6: CERTIFICACIONES ========== */}
        <FormField
          control={form.control}
          name="certificaciones"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Certificaciones</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Certificaciones del parque (separadas por comas)..." 
                  className="min-h-20" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ========== SECCIÓN 7: ESTADO ========== */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado del Parque</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="en_funcionamiento">En Funcionamiento</SelectItem>
                  <SelectItem value="operando_parcialmente">Operando Parcialmente</SelectItem>
                  <SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem>
                  <SelectItem value="cerrado_temporalmente">Cerrado Temporalmente</SelectItem>
                  <SelectItem value="cerrado_indefinidamente">Cerrado Indefinidamente</SelectItem>
                  <SelectItem value="reapertura_proxima">Reapertura Próxima</SelectItem>
                  <SelectItem value="en_proyecto_construccion">En Proyecto/Construcción</SelectItem>
                  <SelectItem value="uso_restringido">Uso Restringido</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ========== BOTONES ========== */}
        {showCancelButton && (
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => cancelRoute && setLocation(cancelRoute)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={mutation.isPending}
              className="w-full sm:w-auto bg-[#00444f] hover:bg-[#00a884]"
            >
              {mutation.isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Actualizar' : 'Crear'} Parque
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};

export default ParkBasicInfoForm;