// src/pages/admin/advertising/campaigns/components/CampaignForm.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { CAMPAIGN_STATUS_OPTIONS } from "@/types/advertising";
import type { AdCampaign, CampaignFormData } from "@/types/advertising";
import {
  campaignFormSchema,
  defaultFormValues,
  PRIORITY_OPTIONS,
  type CampaignFormValues,
} from "@/types/campaignTypes";
import { formatDateForInput } from "@/lib/utils";

interface CampaignFormProps {
  campaign?: AdCampaign;
  onSubmit: (data: CampaignFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function CampaignForm({
  campaign,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CampaignFormProps) {

  // Transformar datos de campaign a formato de formulario
  const defaultValues: CampaignFormValues = campaign
    ? {
        name: campaign.name,
        client: campaign.client,
        description: campaign.description || "",
        startDate: formatDateForInput(campaign.startDate),
        endDate: formatDateForInput(campaign.endDate),
        status: campaign.status,
        budget: campaign.budget?.toString() || "",
        priority: campaign.priority as "low" | "medium" | "high",
      }
    : defaultFormValues;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues,
  });

  const statusValue = watch("status");
  const priorityValue = watch("priority");

  const handleFormSubmit = (data: CampaignFormValues) => {
    onSubmit(data as CampaignFormData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Información básica */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#00444f]">Información Básica</h3>

        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nombre de la Campaña <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Ej: Campaña Verano 2025"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Cliente */}
        <div className="space-y-2">
          <Label htmlFor="client">
            Cliente <span className="text-red-500">*</span>
          </Label>
          <Input
            id="client"
            {...register("client")}
            placeholder="Ej: Coca-Cola México"
            className={errors.client ? "border-red-500" : ""}
          />
          {errors.client && (
            <p className="text-sm text-red-500">{errors.client.message}</p>
          )}
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Describe el objetivo y alcance de la campaña..."
            rows={3}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Fechas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#00444f]">Periodo de Vigencia</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fecha de inicio */}
          <div className="space-y-2">
            <Label htmlFor="startDate">
              Fecha de Inicio <span className="text-red-500">*</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              {...register("startDate")}
              className={errors.startDate ? "border-red-500" : ""}
            />
            {errors.startDate && (
              <p className="text-sm text-red-500">{errors.startDate.message}</p>
            )}
          </div>

          {/* Fecha de fin */}
          <div className="space-y-2">
            <Label htmlFor="endDate">
              Fecha de Fin <span className="text-red-500">*</span>
            </Label>
            <Input
              id="endDate"
              type="date"
              {...register("endDate")}
              className={errors.endDate ? "border-red-500" : ""}
            />
            {errors.endDate && (
              <p className="text-sm text-red-500">{errors.endDate.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Configuración */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#00444f]">Configuración</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Estado <span className="text-red-500">*</span>
            </Label>
            <Select
              value={statusValue}
              onValueChange={(value) => setValue("status", value as any)}
            >
              <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona estado" />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGN_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
          </div>

          {/* Prioridad */}
          <div className="space-y-2">
            <Label htmlFor="priority">
              Prioridad <span className="text-red-500">*</span>
            </Label>
            <Select
              value={priorityValue}
              onValueChange={(value) => setValue("priority", value as any)}
            >
              <SelectTrigger className={errors.priority ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona prioridad" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-sm text-red-500">{errors.priority.message}</p>
            )}
          </div>

          {/* Presupuesto */}
          <div className="space-y-2">
            <Label htmlFor="budget">Presupuesto (MXN)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              {...register("budget")}
              placeholder="0.00"
              className={errors.budget ? "border-red-500" : ""}
            />
            {errors.budget && (
              <p className="text-sm text-red-500">{errors.budget.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#00a587] hover:bg-[#00a587]/90"
        >
          {isSubmitting ? "Guardando..." : campaign ? "Actualizar Campaña" : "Crear Campaña"}
        </Button>
      </div>
    </form>
  );
}