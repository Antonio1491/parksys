import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type {
  Advertisement,
  AdCampaign,
  AdvertisementFormData,
} from "@/types/advertising";
import {
  MEDIA_TYPE_OPTIONS,
  AD_TYPE_OPTIONS,
} from "@/types/advertising";

// ============================================
// SCHEMA DE VALIDACIÓN
// ============================================

const advertisementSchema = z.object({
  campaignId: z.string().transform((val) => {
    if (val === "" || val === "none" || val === null || val === undefined) return null;
    return parseInt(val);
  }).nullable().optional(),

  title: z.string().min(1, "El título es requerido").max(255),

  description: z.string().optional(),

  mediaUrl: z.string().url("URL inválida").optional().or(z.literal("")),

  mediaType: z.enum(["image", "video", "html"]),

  thumbnailUrl: z.string().url("URL inválida").optional().or(z.literal("")),

  duration: z.string().transform((val) => {
    if (val === "" || val === null || val === undefined) return null;
    return parseInt(val);
  }).nullable().optional(),

  linkUrl: z.string().url("URL inválida").optional().or(z.literal("")),

  buttonText: z.string().max(100).optional(),

  adType: z.enum(["banner", "video", "native", "institutional", "commercial", "promotional"]),

  priority: z.string().transform((val) => {
    if (val === "" || val === null || val === undefined) return 5;
    return parseInt(val);
  }),

  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.mediaType === "video" && !data.mediaUrl) {
      return false;
    }
    return true;
  },
  {
    message: "Los anuncios de video requieren una URL de media",
    path: ["mediaUrl"],
  }
).refine(
  (data) => {
    if (data.mediaType === "video" && !data.thumbnailUrl) {
      return false;
    }
    return true;
  },
  {
    message: "Los anuncios de video requieren un thumbnail",
    path: ["thumbnailUrl"],
  }
);

// ============================================
// PROPS DEL COMPONENTE
// ============================================

interface AdvertisementFormProps {
  advertisement?: Advertisement;
  campaigns: AdCampaign[];
  onSubmit: (data: AdvertisementFormData) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AdvertisementForm({
  advertisement,
  campaigns,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AdvertisementFormProps) {
  const isEditing = !!advertisement;

  const form = useForm<AdvertisementFormData>({
    resolver: zodResolver(advertisementSchema),
    defaultValues: advertisement ? {
      campaignId: advertisement.campaignId?.toString() || "none",
      title: advertisement.title,
      description: advertisement.description || "",
      mediaUrl: advertisement.mediaUrl || "",
      mediaType: advertisement.mediaType,
      thumbnailUrl: advertisement.thumbnailUrl || "",
      duration: advertisement.duration?.toString() || "",
      linkUrl: advertisement.linkUrl || "",
      buttonText: advertisement.buttonText || "",
      adType: advertisement.adType,
      priority: advertisement.priority.toString(),
      isActive: advertisement.isActive,
    } : {
      campaignId: "none",
      title: "",
      description: "",
      mediaUrl: "",
      mediaType: "image",
      thumbnailUrl: "",
      duration: "",
      linkUrl: "",
      buttonText: "",
      adType: "banner",
      priority: "5",
      isActive: true,
    },
  });

  const watchMediaType = form.watch("mediaType");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Información Básica</h3>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Promoción de Verano 2025"
                      {...field}
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
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción detallada del anuncio"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Información adicional sobre el anuncio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="campaignId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaña (Opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar campaña" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin campaña</SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                          {campaign.name} - {campaign.client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Media del Anuncio */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Media del Anuncio</h3>

            <FormField
              control={form.control}
              name="mediaType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Media *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MEDIA_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
              name="mediaUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    URL del Media {watchMediaType === "video" && "*"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://ejemplo.com/imagen.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL del archivo de imagen, video o HTML
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchMediaType === "video" && (
              <>
                <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL del Thumbnail *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://ejemplo.com/thumbnail.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Imagen de vista previa para el video
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración (segundos)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Duración del video en segundos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Call to Action</h3>

            <FormField
              control={form.control}
              name="linkUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de Destino</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://ejemplo.com/promocion"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL a la que redirige el anuncio al hacer clic
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buttonText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto del Botón</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ver más"
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Texto que aparece en el botón de acción (máx. 100 caracteres)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Configuración</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="adType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Anuncio *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AD_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                    <FormLabel>Prioridad (1-10)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Mayor prioridad = mayor preferencia de visualización
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "true")}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Los anuncios inactivos no se mostrarán públicamente
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Guardando..."
              : isEditing
              ? "Actualizar Anuncio"
              : "Crear Anuncio"}
          </Button>
        </div>
      </form>
    </Form>
  );
}