import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';

// ====================================
// INTERFACES Y TIPOS
// ====================================

interface AdSpaceIntelligentProps {
  pageType: string;
  position: string;
  layoutConfig?: LayoutConfig;
  className?: string;
  enableAnalytics?: boolean;
  autoRefresh?: boolean;
}

interface LayoutConfig {
  responsive: boolean;
  aspectRatio?: string;
  maxWidth?: string;
  minHeight?: string;
  customStyles?: Record<string, string>;
}

interface SpaceMapping {
  id: number;
  pageType: string;
  position: string;
  spaceId: number;
  isActive: boolean;
  priority: number;
  fallbackBehavior: 'hide' | 'placeholder' | 'alternative';
  createdAt: string;
  updatedAt: string;
}

interface AdPlacement {
  id: number;
  spaceId: number;
  advertisementId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  frequency: string;
  advertisement: {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    targetUrl: string;
    altText: string;
    buttonText?: string;
    mediaType: 'image' | 'video' | 'gif';
    duration?: number;
    isActive: boolean;
    updatedAt: string;
  };
}

interface CacheEntry {
  data: AdPlacement[];
  timestamp: number;
  pageType: string;
  position: string;
}

// ====================================
// CACHE MANAGER
// ====================================

class AdCacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number = 30000; // 30 segundos

  getCacheKey(pageType: string, position: string): string {
    return `${pageType}:${position}`;
  }

  get(pageType: string, position: string): AdPlacement[] | null {
    const key = this.getCacheKey(pageType, position);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(pageType: string, position: string, data: AdPlacement[]): void {
    const key = this.getCacheKey(pageType, position);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      pageType,
      position
    });
  }

  invalidate(pageType?: string, position?: string): void {
    if (pageType && position) {
      const key = this.getCacheKey(pageType, position);
      this.cache.delete(key);
    } else if (pageType) {
      // Invalidar todas las entradas de un pageType
      const entries = Array.from(this.cache.entries());
      for (const [key, entry] of entries) {
        if (entry.pageType === pageType) {
          this.cache.delete(key);
        }
      }
    } else {
      // Limpiar toda la cache
      this.cache.clear();
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Instancia global del cache manager
const cacheManager = new AdCacheManager();

// ====================================
// HOOKS PERSONALIZADOS
// ====================================

const useSpaceMapping = (pageType: string, position: string) => {
  return useQuery({
    queryKey: ['space-mapping', pageType, position],
    queryFn: async () => {
      const response = await fetch(`/api/advertising-management/space-mapping?pageType=${pageType}&position=${position}`);
      if (!response.ok) throw new Error('Error al obtener mapeo de espacios');
      const data = await response.json();
      return data.success ? data.data : [];
    },
    staleTime: 60000, // 1 minuto
    gcTime: 300000,   // 5 minutos
  });
};

const useAdPlacements = (spaceId: number, pageType: string, position: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['ad-placements', spaceId, pageType, position],
    queryFn: async () => {
      // Verificar cache primero
      const cached = cacheManager.get(pageType, position);
      if (cached) {
        // Cache hit silencioso
        return cached;
      }

      const response = await fetch(`/api/advertising-management/placements?spaceId=${spaceId}&pageType=${pageType}&active=true`);
      if (!response.ok) throw new Error('Error al cargar asignaciones');
      
      const result = await response.json();
      const placements = result.success ? result.data : [];
      
      // Guardar en cache
      cacheManager.set(pageType, position, placements);
      // Datos guardados en caché silenciosamente
      
      return placements;
    },
    enabled,
    staleTime: 30000,  // 30 segundos
    gcTime: 120000,    // 2 minutos
    refetchOnWindowFocus: false,
  });
};

// ====================================
// COMPONENTE PRINCIPAL
// ====================================

const AdSpaceIntelligent: React.FC<AdSpaceIntelligentProps> = ({ 
  pageType, 
  position, 
  layoutConfig = { responsive: true },
  className = '',
  enableAnalytics = true,
  autoRefresh = false
}) => {
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Obtener mapeo de espacios para esta página/posición
  const { data: spaceMappings, isLoading: mappingLoading } = useSpaceMapping(pageType, position);
  
  // Obtener el espacio mapeado prioritario
  const primaryMapping = useMemo(() => {
    if (!spaceMappings || spaceMappings.length === 0) return null;
    return spaceMappings.find((mapping: SpaceMapping) => mapping.isActive) || spaceMappings[0];
  }, [spaceMappings]);

  // Obtener asignaciones para el espacio mapeado
  const { 
    data: placements = [], 
    isLoading: placementsLoading,
    refetch: refetchPlacements,
    error: placementsError
  } = useAdPlacements(
    primaryMapping?.spaceId || 0, 
    pageType, 
    position, 
    !!primaryMapping
  );

  // Filtrar asignaciones activas y válidas
  const activePlacements = useMemo(() => {
    const now = new Date();
    return placements.filter((placement: AdPlacement) => {
      if (!placement.isActive || !placement.advertisement.isActive) return false;
      
      const startDate = new Date(placement.startDate);
      const endDate = new Date(placement.endDate);
      
      return now >= startDate && now <= endDate;
    }).sort((a: AdPlacement, b: AdPlacement) => b.priority - a.priority);
  }, [placements]);

  // Anuncio actual a mostrar
  const currentPlacement = activePlacements[currentAdIndex] || null;

  // Intersection Observer para detectar visibilidad
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    const adElement = document.getElementById(`ad-space-${pageType}-${position}`);
    if (adElement) {
      observer.observe(adElement);
    }

    return () => observer.disconnect();
  }, [pageType, position]);

  // Tracking de impresiones
  useEffect(() => {
    if (currentPlacement && isVisible && !hasTrackedImpression && enableAnalytics) {
      trackImpression(currentPlacement.id);
      setHasTrackedImpression(true);
    }
  }, [currentPlacement, isVisible, hasTrackedImpression, enableAnalytics]);

  // Auto-refresh para asignaciones
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      cacheManager.invalidate(pageType, position);
      refetchPlacements();
    }, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, [autoRefresh, pageType, position, refetchPlacements]);

  // Rotación automática de anuncios
  useEffect(() => {
    if (activePlacements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % activePlacements.length);
      setHasTrackedImpression(false); // Reset para nueva impresión
    }, 15000); // Cambiar cada 15 segundos

    return () => clearInterval(interval);
  }, [activePlacements.length]);

  // Escuchar eventos de actualización global
  useEffect(() => {
    const handleGlobalUpdate = () => {
      cacheManager.invalidate();
      refetchPlacements();
    };

    window.addEventListener('adSystemUpdate', handleGlobalUpdate);
    return () => window.removeEventListener('adSystemUpdate', handleGlobalUpdate);
  }, [refetchPlacements]);

  // ====================================
  // FUNCIONES DE UTILIDAD
  // ====================================

  const trackImpression = async (placementId: number) => {
    try {
      await fetch('/api/advertising-management/track-impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          placementId,
          pageType,
          position,
          timestamp: new Date().toISOString()
        })
      });
      // Impresión registrada silenciosamente
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  const trackClick = async (placementId: number) => {
    try {
      await fetch('/api/advertising-management/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          placementId,
          pageType,
          position,
          timestamp: new Date().toISOString()
        })
      });
      // Click registrado silenciosamente
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const handleAdClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (currentPlacement && enableAnalytics) {
      trackClick(currentPlacement.id);
      
      if (currentPlacement.advertisement.targetUrl) {
        window.open(currentPlacement.advertisement.targetUrl, '_blank');
      }
    }
  };

  const getMediaUrlWithCacheBuster = (mediaUrl: string) => {
    if (!mediaUrl) return '';
    
    const updatedAt = currentPlacement?.advertisement.updatedAt || new Date().toISOString();
    const timestamp = new Date(updatedAt).getTime();
    const separator = mediaUrl.includes('?') ? '&' : '?';
    
    return `${mediaUrl}${separator}v=${timestamp}`;
  };

  // ====================================
  // RENDERIZADO CONDICIONAL
  // ====================================

  // Estados de carga
  if (mappingLoading || placementsLoading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded ${className}`} style={{ minHeight: '100px' }}>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Error en mapeo
  if (!primaryMapping) {
    console.warn(`⚠️ No space mapping found for ${pageType}:${position}`);
    return null;
  }

  // Error en asignaciones
  if (placementsError) {
    console.error(`❌ Error loading placements for ${pageType}:${position}:`, placementsError);
    return primaryMapping.fallbackBehavior === 'placeholder' ? (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded p-4 ${className}`}>
        <div className="flex items-center justify-center text-gray-500">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span className="text-sm">Espacio publicitario temporalmente no disponible</span>
        </div>
      </div>
    ) : null;
  }

  // Sin anuncios activos
  if (!currentPlacement) {
    return primaryMapping.fallbackBehavior === 'hide' ? null : (
      <div className={`bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded p-3 ${className}`}>
        <div className="text-center text-sm text-gray-600">
          Espacio disponible para publicidad
        </div>
      </div>
    );
  }

  // ====================================
  // RENDERIZADO DEL ANUNCIO
  // ====================================

  const { advertisement } = currentPlacement;
  const mediaUrl = getMediaUrlWithCacheBuster(advertisement.imageUrl);

  // Aplicar configuración de layout
  const layoutStyles: React.CSSProperties = {
    ...layoutConfig.customStyles,
    maxWidth: layoutConfig.maxWidth,
    minHeight: layoutConfig.minHeight,
    aspectRatio: layoutConfig.aspectRatio,
  };

  return (
    <div 
      id={`ad-space-${pageType}-${position}`}
      className={`relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
      style={layoutStyles}
      onClick={handleAdClick}
    >
      {/* Indicador de rotación múltiple */}
      {activePlacements.length > 1 && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {currentAdIndex + 1}/{activePlacements.length}
          </div>
        </div>
      )}

      {/* Contenido del anuncio */}
      <div className="cursor-pointer group">
        {advertisement.mediaType === 'video' ? (
          <video
            src={mediaUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={mediaUrl}
            alt={advertisement.altText || advertisement.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}
        
        {/* Overlay con información */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="font-semibold text-sm mb-1">{advertisement.title}</h3>
            {advertisement.description && (
              <p className="text-xs opacity-90 line-clamp-2">{advertisement.description}</p>
            )}
            {advertisement.buttonText && (
              <div className="mt-2 flex items-center text-xs">
                <span className="mr-1">{advertisement.buttonText}</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdSpaceIntelligent;
export { cacheManager };