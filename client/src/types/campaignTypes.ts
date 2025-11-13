import { z } from "zod";
import type { AdCampaign, CampaignFormData, CampaignStatus } from "@/types/advertising";
import { getTodayInputValue, getRelativeDateInputValue } from "@/lib/utils";

// ============================================
// SCHEMA DE VALIDACIÓN ZOD
// ============================================

export const campaignFormSchema = z.object({
  name: z.string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),

  client: z.string()
    .min(3, "El cliente debe tener al menos 3 caracteres")
    .max(100, "El cliente no puede exceder 100 caracteres"),

  description: z.string().optional(),

  startDate: z.string()
    .min(1, "La fecha de inicio es requerida")
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, "Fecha de inicio inválida"),

  endDate: z.string()
    .min(1, "La fecha de fin es requerida")
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, "Fecha de fin inválida"),

  status: z.enum(["active", "paused", "completed", "cancelled"]),

  budget: z.string()
    .refine((val) => {
      if (!val) return true; // Budget es opcional
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, "El presupuesto debe ser un número positivo"),

  priority: z.enum(["low", "medium", "high"], {
    errorMap: () => ({ message: "Selecciona una prioridad válida" })
  }),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["endDate"],
});

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

// ============================================
// FUNCIONES DE TRANSFORMACIÓN
// ============================================

/**
 * Convierte datos del formulario a formato API (snake_case)
 */
export function transformToApiFormat(data: CampaignFormData): Record<string, any> {
  return {
    name: data.name,
    client: data.client,
    description: data.description || null,
    start_date: data.startDate,
    end_date: data.endDate,
    status: data.status,
    budget: data.budget ? parseFloat(data.budget) : null,
    priority: parseInt(data.priority),
  };
}

/**
 * Convierte datos de API (snake_case) a formato de formulario (camelCase)
 */
export function transformToFormFormat(campaign: AdCampaign): CampaignFormData {
  return {
    name: campaign.name,
    client: campaign.client,
    description: campaign.description || "",
    startDate: formatDateForInput(campaign.startDate),
    endDate: formatDateForInput(campaign.endDate),
    status: campaign.status,
    budget: campaign.budget?.toString() || "",
    priority: campaign.priority.toString(),
  };
}

/**
 * Formatea fecha para input type="date"
 */
function formatDateForInput(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// ============================================
// HELPERS PARA UI
// ============================================

/**
 * Retorna clases de badge según el estado
 */
export function getStatusBadgeClass(status: CampaignStatus): string {
  const classes: Record<CampaignStatus, string> = {
    active: "bg-green-100 text-green-800 border-green-200",
    paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };
  return classes[status];
}

/**
 * Retorna texto traducido del estado
 */
export function getStatusLabel(status: CampaignStatus): string {
  const labels: Record<CampaignStatus, string> = {
    active: "Activa",
    paused: "Pausada",
    completed: "Completada",
    cancelled: "Cancelada",
  };
  return labels[status];
}

/**
 * Formatea cantidad como moneda MXN
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

/**
 * Formatea fecha para display
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Calcula días restantes de una campaña
 */
export function getDaysRemaining(endDate: string | Date): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Determina si una campaña está activa según fechas
 */
export function isCampaignActive(campaign: AdCampaign): boolean {
  const now = new Date();
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);
  return now >= start && now <= end && campaign.status === "active";
}

// ============================================
// CONSTANTES
// ============================================

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
] as const;

// ============================================
// VALORES POR DEFECTO
// ============================================

export const defaultFormValues: CampaignFormValues = {
  name: "",
  client: "",
  description: "",
  startDate: getTodayInputValue(),
  endDate: getRelativeDateInputValue(30),
  status: "active",
  budget: "",
  priority: "medium",
};