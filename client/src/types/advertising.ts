// src/types/advertising.ts

/**
 * Tipos e interfaces para el módulo de Advertising
 * Basado en estructura simplificada (15 campos)
 */

// ============================================
// ENUMS Y TIPOS BASE
// ============================================

export type MediaType = "image" | "video" | "html";

export type AdType =
  | "banner"
  | "video"
  | "native"
  | "institutional"
  | "commercial"
  | "promotional";

export type SpaceType = "banner" | "sidebar" | "popup" | "native";

export type FrequencyType = "always" | "once_per_session" | "once_per_day" | "custom";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type CampaignStatus = "active" | "paused" | "completed" | "cancelled";

export type PageType = "parks" | "species" | "activities" | "concessions" | "home" | "all";

// ============================================
// INTERFACE: Advertisement (15 campos)
// ============================================

export interface Advertisement {
  // Identificación
  id: number;
  campaignId?: number | null;

  // Contenido
  title: string;
  description?: string | null;

  // Media unificada
  mediaUrl?: string | null;
  mediaType: MediaType;
  thumbnailUrl?: string | null;
  duration?: number | null; // Segundos (para videos)

  // Call to Action
  linkUrl?: string | null;
  buttonText?: string | null;

  // Configuración
  adType: AdType;
  priority: number; // 1-10

  // Estado
  isActive: boolean;

  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;

  // Relaciones (opcional)
  campaign?: {
    name: string;
    client: string;
  };
}

// ============================================
// INTERFACE: AdCampaign
// ============================================

export interface AdCampaign {
  id: number;
  name: string;
  client: string;
  description?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  status: CampaignStatus;
  budget?: number | null;
  priority: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ============================================
// INTERFACE: AdSpace
// ============================================

export interface AdSpace {
  id: number;
  name: string;
  description?: string | null;
  dimensions?: string | null; // "1200x90"
  position: string; // "header", "sidebar", "footer"
  pageType: string;
  isActive: boolean;
  maxFileSize?: number | null;
  allowedFormats?: string[] | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ============================================
// INTERFACE: AdPlacement (16 campos)
// ============================================

export interface AdPlacement {
  id: number;
  advertisementId: number;
  adSpaceId: number;
  
  // Targeting
  pageType: PageType;
  pageId?: number | null;
  
  // Fechas
  startDate: string | Date;
  endDate: string | Date;
  
  // Configuración
  priority: number;
  isActive: boolean;
  
  // Programación horaria
  frequency: FrequencyType;
  scheduledDays?: DayOfWeek[] | null;
  scheduledHours?: number[] | null;
  
  // Métricas
  impressions: number;
  clicks: number;
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;

  // Relaciones (opcional)
  advertisement?: Advertisement;
  space?: AdSpace;
}

// ============================================
// INTERFACES EXTENDIDAS (con relaciones)
// ============================================

export interface AdvertisementWithRelations extends Advertisement {
  placements?: AdPlacementWithSpace[];
  analytics?: AdAnalyticsSummary;
}

export interface AdPlacementWithSpace extends AdPlacement {
  advertisement?: Advertisement;
  space?: AdSpace;
}

export interface AdCampaignWithAds extends AdCampaign {
  advertisements?: Advertisement[];
}

export interface AdAnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  ctr: number; // Click-through rate (%)
  lastUpdated: string | Date;
}

// ============================================
// INTERFACES PARA API RESPONSES
// ============================================

export interface AdvertisementsResponse {
  data: Advertisement[];
  total: number;
  page?: number;
  limit?: number;
}

export interface AdvertisementResponse {
  data: Advertisement;
}

export interface CampaignsResponse {
  data: AdCampaign[];
  total: number;
}

export interface SpacesResponse {
  data: AdSpace[];
  total: number;
}

export interface PlacementsResponse {
  data: AdPlacement[];
  total: number;
}

// ============================================
// INTERFACES PARA FORMULARIOS
// ============================================

export interface AdvertisementFormData {
  campaignId: string; // String para select
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: MediaType;
  thumbnailUrl: string;
  duration: string; // String para input number
  linkUrl: string;
  buttonText: string;
  adType: AdType;
  priority: string; // String para input number
  isActive: boolean;
}

export interface CampaignFormData {
  name: string;
  client: string;
  description: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  budget: string;
  priority: string;
}

export interface SpaceFormData {
  name: string;
  description: string;
  dimensions: string;
  position: string;
  pageType: string;
  isActive: boolean;
  maxFileSize: string;
}

export interface PlacementFormData {
  advertisementId: string;
  adSpaceId: string;
  pageType: PageType;
  pageId: string;
  startDate: string;
  endDate: string;
  priority: string;
  isActive: boolean;
  frequency: FrequencyType;
  scheduledDays: DayOfWeek[];
  scheduledHours: number[];
}

// ============================================
// INTERFACES PARA FILTROS
// ============================================

export interface AdvertisementFilters {
  search?: string;
  campaignId?: number;
  adType?: AdType;
  mediaType?: MediaType;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "title" | "createdAt" | "priority";
  sortOrder?: "asc" | "desc";
}

export interface CampaignFilters {
  search?: string;
  status?: CampaignStatus;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface PlacementFilters {
  advertisementId?: number;
  adSpaceId?: number;
  campaignId?: number;
  pageType?: PageType;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

// ============================================
// CONSTANTES Y OPTIONS
// ============================================

export const MEDIA_TYPE_OPTIONS: { value: MediaType; label: string }[] = [
  { value: "image", label: "Imagen" },
  { value: "video", label: "Video" },
  { value: "html", label: "HTML" },
];

export const AD_TYPE_OPTIONS: { value: AdType; label: string }[] = [
  { value: "banner", label: "Banner" },
  { value: "video", label: "Video" },
  { value: "native", label: "Nativo" },
  { value: "institutional", label: "Institucional" },
  { value: "commercial", label: "Comercial" },
  { value: "promotional", label: "Promocional" },
];

export const SPACE_TYPE_OPTIONS: { value: SpaceType; label: string }[] = [
  { value: "banner", label: "Banner" },
  { value: "sidebar", label: "Barra Lateral" },
  { value: "popup", label: "Popup" },
  { value: "native", label: "Nativo" },
];

export const FREQUENCY_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: "always", label: "Siempre" },
  { value: "once_per_session", label: "Una vez por sesión" },
  { value: "once_per_day", label: "Una vez al día" },
  { value: "custom", label: "Personalizado" },
];

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Lunes" },
  { value: "tuesday", label: "Martes" },
  { value: "wednesday", label: "Miércoles" },
  { value: "thursday", label: "Jueves" },
  { value: "friday", label: "Viernes" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

export const CAMPAIGN_STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = [
  { value: "active", label: "Activa" },
  { value: "paused", label: "Pausada" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
];

export const PAGE_TYPE_OPTIONS: { value: PageType; label: string }[] = [
  { value: "all", label: "Todas las páginas" },
  { value: "home", label: "Inicio" },
  { value: "parks", label: "Parques" },
  { value: "species", label: "Especies" },
  { value: "activities", label: "Actividades" },
  { value: "concessions", label: "Concesiones" },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const isValidMediaType = (type: string): type is MediaType => {
  return ["image", "video", "html"].includes(type);
};

export const isValidAdType = (type: string): type is AdType => {
  return [
    "banner",
    "video",
    "native",
    "institutional",
    "commercial",
    "promotional",
  ].includes(type);
};

export const isValidFrequency = (freq: string): freq is FrequencyType => {
  return ["always", "once_per_session", "once_per_day", "custom"].includes(freq);
};

export const calculateCTR = (clicks: number, impressions: number): number => {
  if (impressions === 0) return 0;
  return Math.round((clicks / impressions) * 10000) / 100; // 2 decimales
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("es-MX").format(num);
};
