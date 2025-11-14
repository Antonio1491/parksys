import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import type { 
  AdPlacement, 
  PlacementFormData,
  FrequencyType,
  DayOfWeek,
  PageType 
} from "@/types/advertising";
import { FREQUENCY_OPTIONS, DAYS_OF_WEEK } from "@/types/advertising";

// ============================================
// ESQUEMA DE VALIDACIÓN ZOD
// ============================================

const placementSchema = z.object({
  advertisementId: z.string().min(1, "Selecciona un anuncio"),
  adSpaceId: z.string().min(1, "Selecciona un espacio"),
  pageType: z.string().min(1, "Selecciona un tipo de página"),
  pageId: z.string().optional(),
  startDate: z.string().min(1, "Selecciona fecha de inicio"),
  endDate: z.string().min(1, "Selecciona fecha de fin"),
  priority: z.string().min(1, "Ingresa la prioridad"),
  isActive: z.boolean(),
  frequency: z.string(),
  scheduledDays: z.array(z.string()).optional(),
  scheduledHours: z.array(z.number()).optional(),
}).refine((data) => {
  // Validar que startDate < endDate
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
}, {
  message: "La fecha de inicio debe ser anterior a la fecha de fin",
  path: ["endDate"],
}).refine((data) => {
  // Si frequency es "custom", scheduledDays es requerido
  if (data.frequency === "custom") {
    return data.scheduledDays && data.scheduledDays.length > 0;
  }
  return true;
}, {
  message: "Selecciona al menos un día cuando la frecuencia es personalizada",
  path: ["scheduledDays"],
}).refine((data) => {
  // Si frequency es "custom", scheduledHours es requerido
  if (data.frequency === "custom") {
    return data.scheduledHours && data.scheduledHours.length > 0;
  }
  return true;
}, {
  message: "Selecciona al menos una hora cuando la frecuencia es personalizada",
  path: ["scheduledHours"],
});

// ============================================
// PAGE TYPE OPTIONS
// ============================================

const PAGE_TYPE_OPTIONS = [
  { value: "all", label: "Todas las páginas" },
  { value: "home", label: "Inicio" },
  { value: "parks", label: "Parques" },
  { value: "species", label: "Especies" },
  { value: "activities", label: "Actividades" },
  { value: "concessions", label: "Concesiones" },
] as const;

// ============================================
// COMPONENTE: SELECTOR DE HORAS
// ============================================

interface HourSelectorProps {
  selectedHours: number[];
  onChange: (hours: number[]) => void;
}

const HourSelector = ({ selectedHours, onChange }: HourSelectorProps) => {
  const toggleHour = (hour: number) => {
    if (selectedHours.includes(hour)) {
      onChange(selectedHours.filter(h => h !== hour));
    } else {
      onChange([...selectedHours, hour].sort((a, b) => a - b));
    }
  };

  const toggleAll = () => {
    if (selectedHours.length === 24) {
      onChange([]);
    } else {
      onChange(Array.from({ length: 24 }, (_, i) => i));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Horas del día</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleAll}
        >
          {selectedHours.length === 24 ? "Deseleccionar todas" : "Seleccionar todas"}
        </Button>
      </div>

      {/* Grid responsive de horas */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
          <Button
            key={hour}
            type="button"
            variant={selectedHours.includes(hour) ? "default" : "outline"}
            size="sm"
            className="h-9 text-xs"
            onClick={() => toggleHour(hour)}
          >
            {hour.toString().padStart(2, '0')}h
          </Button>
        ))}
      </div>

      {selectedHours.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedHours.length} hora{selectedHours.length !== 1 ? 's' : ''} seleccionada{selectedHours.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

// ============================================
// PROPS DEL FORMULARIO
// ============================================

interface PlacementFormProps {
  placement?: AdPlacement;
  onSubmit: (data: PlacementFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function PlacementForm({ 
  placement, 
  onSubmit, 
  onCancel,
  isLoading = false 
}: PlacementFormProps) {

  // Fetch advertisements para el select
  const { data: advertisementsData } = useQuery({
    queryKey: ["/api/advertising/advertisements"],
    queryFn: async () => {
      const response = await fetch("/api/advertising/advertisements");
      if (!response.ok) throw new Error("Error cargando anuncios");
      return response.json();
    },
  });

  // Fetch spaces para el select
  const { data: spacesData } = useQuery({
    queryKey: ["/api/advertising/spaces"],
    queryFn: async () => {
      const response = await fetch("/api/advertising/spaces");
      if (!response.ok) throw new Error("Error cargando espacios");
      return response.json();
    },
  });

  const advertisements = advertisementsData?.data || [];
  const spaces = spacesData?.data || [];

  // Configurar formulario con valores por defecto
  const form = useForm<PlacementFormData>({
    resolver: zodResolver(placementSchema),
    defaultValues: {
      advertisementId: placement?.advertisementId?.toString() || "",
      adSpaceId: placement?.adSpaceId?.toString() || "",
      pageType: placement?.pageType || "all",
      pageId: placement?.pageId?.toString() || "",
      startDate: placement?.startDate 
        ? new Date(placement.startDate).toISOString().split('T')[0] 
        : "",
      endDate: placement?.endDate 
        ? new Date(placement.endDate).toISOString().split('T')[0] 
        : "",
      priority: placement?.priority?.toString() || "5",
      isActive: placement?.isActive ?? true,
      frequency: placement?.frequency || "always",
      scheduledDays: placement?.scheduledDays || [],
      scheduledHours: placement?.scheduledHours || [],
    },
  });

  const frequency = form.watch("frequency");
  const scheduledDays = form.watch("scheduledDays") || [];
  const scheduledHours = form.watch("scheduledHours") || [];

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Sección 1: Selección de Anuncio y Espacio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Advertisement Select */}
        <div className="space-y-2">
          <Label htmlFor="advertisementId">
            Anuncio <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch("advertisementId")}
            onValueChange={(value) => form.setValue("advertisementId", value)}
          >
            <SelectTrigger id="advertisementId">
              <SelectValue placeholder="Selecciona un anuncio" />
            </SelectTrigger>
            <SelectContent>
              {advertisements.map((ad: any) => (
                <SelectItem key={ad.id} value={ad.id.toString()}>
                  {ad.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.advertisementId && (
            <p className="text-sm text-destructive">
              {form.formState.errors.advertisementId.message}
            </p>
          )}
        </div>

        {/* Space Select */}
        <div className="space-y-2">
          <Label htmlFor="adSpaceId">
            Espacio Publicitario <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch("adSpaceId")}
            onValueChange={(value) => form.setValue("adSpaceId", value)}
          >
            <SelectTrigger id="adSpaceId">
              <SelectValue placeholder="Selecciona un espacio" />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((space: any) => (
                <SelectItem key={space.id} value={space.id.toString()}>
                  {space.name} - {space.position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.adSpaceId && (
            <p className="text-sm text-destructive">
              {form.formState.errors.adSpaceId.message}
            </p>
          )}
        </div>
      </div>

      {/* Sección 2: Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Fecha de Inicio <span className="text-destructive">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            {...form.register("startDate")}
          />
          {form.formState.errors.startDate && (
            <p className="text-sm text-destructive">
              {form.formState.errors.startDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">
            Fecha de Fin <span className="text-destructive">*</span>
          </Label>
          <Input
            id="endDate"
            type="date"
            {...form.register("endDate")}
          />
          {form.formState.errors.endDate && (
            <p className="text-sm text-destructive">
              {form.formState.errors.endDate.message}
            </p>
          )}
        </div>
      </div>

      {/* Sección 3: Configuración */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Page Type */}
        <div className="space-y-2">
          <Label htmlFor="pageType">
            Tipo de Página <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch("pageType")}
            onValueChange={(value) => form.setValue("pageType", value)}
          >
            <SelectTrigger id="pageType">
              <SelectValue placeholder="Selecciona tipo" />
            </SelectTrigger>
            <SelectContent>
              {PAGE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.pageType && (
            <p className="text-sm text-destructive">
              {form.formState.errors.pageType.message}
            </p>
          )}
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label htmlFor="priority">
            Prioridad <span className="text-destructive">*</span>
          </Label>
          <Input
            id="priority"
            type="number"
            min="1"
            max="10"
            {...form.register("priority")}
          />
          {form.formState.errors.priority && (
            <p className="text-sm text-destructive">
              {form.formState.errors.priority.message}
            </p>
          )}
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <Label htmlFor="frequency">Frecuencia</Label>
          <Select
            value={form.watch("frequency")}
            onValueChange={(value) => form.setValue("frequency", value)}
          >
            <SelectTrigger id="frequency">
              <SelectValue placeholder="Selecciona frecuencia" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sección 4: Programación Personalizada (condicional) */}
      {frequency === "custom" && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-semibold">Programación Personalizada</h4>

          {/* Días de la semana */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Días de la semana <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={scheduledDays.includes(day.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        form.setValue("scheduledDays", [...scheduledDays, day.value]);
                      } else {
                        form.setValue(
                          "scheduledDays",
                          scheduledDays.filter((d) => d !== day.value)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`day-${day.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {day.label.slice(0, 3)}
                  </label>
                </div>
              ))}
            </div>
            {form.formState.errors.scheduledDays && (
              <p className="text-sm text-destructive">
                {form.formState.errors.scheduledDays.message}
              </p>
            )}
          </div>

          {/* Horas del día */}
          <div>
            <HourSelector
              selectedHours={scheduledHours}
              onChange={(hours) => form.setValue("scheduledHours", hours)}
            />
            {form.formState.errors.scheduledHours && (
              <p className="text-sm text-destructive mt-2">
                {form.formState.errors.scheduledHours.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sección 5: Estado Activo */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={form.watch("isActive")}
          onCheckedChange={(checked) => form.setValue("isActive", !!checked)}
        />
        <label
          htmlFor="isActive"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Placement activo
        </label>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? "Guardando..." : placement ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}