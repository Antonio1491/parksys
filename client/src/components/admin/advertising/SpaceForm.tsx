import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import type { AdSpace, SpaceFormData } from "@/types/advertising";
import {
  PAGE_TYPE_OPTIONS,
  POSITION_OPTIONS,
  ALLOWED_FORMATS_OPTIONS,
} from "@/types/advertising";

// Schema de validación
const spaceFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  dimensions: z
    .string()
    .regex(/^\d+x\d+$/, "Formato inválido. Usa: 1200x90")
    .optional()
    .or(z.literal("")),
  position: z.string().min(1, "La posición es requerida"),
  pageType: z.string().min(1, "El tipo de página es requerido"),
  maxFileSize: z
    .string()
    .regex(/^\d+$/, "Debe ser un número")
    .optional()
    .or(z.literal("")),
  allowedFormats: z.array(z.string()).min(1, "Selecciona al menos un formato"),
  isActive: z.boolean(),
});

interface SpaceFormProps {
  space?: AdSpace | null;
  onSubmit: (data: SpaceFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function SpaceForm({
  space,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SpaceFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<SpaceFormData>({
    resolver: zodResolver(spaceFormSchema),
    defaultValues: {
      name: space?.name || "",
      description: space?.description || "",
      dimensions: space?.dimensions || "",
      position: space?.position || "",
      pageType: space?.pageType || "",
      maxFileSize: space?.maxFileSize?.toString() || "5242880", // 5MB default
      allowedFormats: space?.allowedFormats || ["image/jpeg", "image/png"],
      isActive: space?.isActive ?? true,
    },
  });

  const watchedDimensions = watch("dimensions");
  const watchedPageType = watch("pageType");
  const watchedPosition = watch("position");
  const watchedIsActive = watch("isActive");
  const watchedAllowedFormats = watch("allowedFormats");

  // Calcular preview de dimensiones
  const getPreviewDimensions = () => {
    if (!watchedDimensions) return null;
    const match = watchedDimensions.match(/^(\d+)x(\d+)$/);
    if (!match) return null;
    const [, width, height] = match;
    return {
      width: Math.min(parseInt(width), 400),
      height: Math.min(parseInt(height), 200),
      original: { width: parseInt(width), height: parseInt(height) },
    };
  };

  const previewDimensions = getPreviewDimensions();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nombre */}
          <div>
            <Label htmlFor="name">
              Nombre del Espacio <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ej: Sidebar Principal - Parques"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe el propósito y ubicación de este espacio..."
              rows={3}
            />
            <p className="text-xs text-gray-600 mt-1">
              Opcional: Ayuda a identificar el espacio fácilmente
            </p>
          </div>

          {/* Estado activo */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="isActive" className="font-medium">
                Espacio Activo
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Los espacios activos pueden recibir anuncios
              </p>
            </div>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ubicación */}
      <Card>
        <CardHeader>
          <CardTitle>Ubicación del Espacio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de página */}
            <div>
              <Label htmlFor="pageType">
                Tipo de Página <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="pageType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      className={errors.pageType ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Seleccionar página" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_TYPE_OPTIONS.filter((opt) => opt.value !== "all").map(
                        (option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.pageType && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.pageType.message}
                </p>
              )}
            </div>

            {/* Posición */}
            <div>
              <Label htmlFor="position">
                Posición <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="position"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      className={errors.position ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Seleccionar posición" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.position && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.position.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Especificaciones técnicas */}
      <Card>
        <CardHeader>
          <CardTitle>Especificaciones Técnicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dimensiones */}
            <div>
              <Label htmlFor="dimensions">Dimensiones (píxeles)</Label>
              <Input
                id="dimensions"
                {...register("dimensions")}
                placeholder="Ej: 1200x90"
                className={errors.dimensions ? "border-red-500" : ""}
              />
              {errors.dimensions && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.dimensions.message}
                </p>
              )}
              <p className="text-xs text-gray-600 mt-1">
                Formato: ancho x alto (ej: 1200x90)
              </p>
            </div>

            {/* Tamaño máximo de archivo */}
            <div>
              <Label htmlFor="maxFileSize">Tamaño Máximo (bytes)</Label>
              <Input
                id="maxFileSize"
                {...register("maxFileSize")}
                placeholder="5242880"
                type="number"
                className={errors.maxFileSize ? "border-red-500" : ""}
              />
              {errors.maxFileSize && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.maxFileSize.message}
                </p>
              )}
              <p className="text-xs text-gray-600 mt-1">
                Por defecto: 5MB (5242880 bytes)
              </p>
            </div>
          </div>

          {/* Formatos permitidos */}
          <div>
            <Label>
              Formatos Permitidos <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {ALLOWED_FORMATS_OPTIONS.map((format) => (
                <Controller
                  key={format.value}
                  name="allowedFormats"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={format.value}
                        checked={field.value.includes(format.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...field.value, format.value]);
                          } else {
                            field.onChange(
                              field.value.filter((v) => v !== format.value)
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={format.value}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {format.label}
                      </Label>
                    </div>
                  )}
                />
              ))}
            </div>
            {errors.allowedFormats && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.allowedFormats.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vista previa */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa del Espacio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Badges informativos */}
            <div className="flex flex-wrap gap-2">
              {watchedPageType && (
                <Badge variant="outline">
                  {PAGE_TYPE_OPTIONS.find((p) => p.value === watchedPageType)
                    ?.label || watchedPageType}
                </Badge>
              )}
              {watchedPosition && (
                <Badge variant="secondary">
                  {POSITION_OPTIONS.find((p) => p.value === watchedPosition)
                    ?.label || watchedPosition}
                </Badge>
              )}
              <Badge
                variant={watchedIsActive ? "default" : "secondary"}
                className={
                  watchedIsActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {watchedIsActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>

            {/* Información técnica */}
            <div className="text-sm space-y-1 text-gray-600">
              <p>
                <strong>Dimensiones:</strong>{" "}
                {watchedDimensions || "No especificadas"}
              </p>
              <p>
                <strong>Formatos:</strong>{" "}
                {watchedAllowedFormats.length > 0
                  ? watchedAllowedFormats
                      .map((f) => f.split("/")[1]?.toUpperCase())
                      .join(", ")
                  : "Ninguno"}
              </p>
            </div>

            {/* Preview visual */}
            {previewDimensions && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">
                  Simulación del espacio (escala ajustada para visualización):
                </p>
                <div className="flex items-center justify-center">
                  <div
                    className="border-2 border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 text-sm"
                    style={{
                      width: `${previewDimensions.width}px`,
                      height: `${previewDimensions.height}px`,
                    }}
                  >
                    <div className="text-center">
                      <p className="font-medium">Espacio Publicitario</p>
                      <p className="text-xs">
                        {previewDimensions.original.width} x{" "}
                        {previewDimensions.original.height} px
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-[#00a587] hover:bg-[#008c72]"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Guardando..."
            : space
            ? "Actualizar Espacio"
            : "Crear Espacio"}
        </Button>
      </div>
    </form>
  );
}