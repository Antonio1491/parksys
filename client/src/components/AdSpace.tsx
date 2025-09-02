import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';

interface AdSpaceProps {
  spaceId: string | number;
  position: 'header' | 'sidebar' | 'footer' | 'hero' | 'profile' | 'banner' | 'sidebar-sports' | 'sidebar-events' | 'sidebar-nature' | 'sidebar-family' | 'card';
  pageType: 'homepage' | 'parks' | 'tree-species' | 'activities' | 'concessions' | 'activity-detail' | 'instructors' | 'instructor-profile' | 'volunteers' | 'park-landing' | 'fauna';
  className?: string;
}

interface AdPlacement {
  id: number;
  adSpaceId: number;
  advertisementId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  advertisement: {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    targetUrl: string;
    altText: string;
    buttonText?: string;
    isActive: boolean;
    updatedAt?: string;
    mediaType?: 'image' | 'video' | 'gif';
    duration?: number;
  };
}

const AdSpace: React.FC<AdSpaceProps> = ({ spaceId, position, pageType, className = '' }) => {
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  // Obtener el espacio publicitario y sus asignaciones activas
  const { data: placementsResponse, isLoading, refetch } = useQuery({
    queryKey: [`/api/advertising-management/placements`, spaceId, pageType],
    queryFn: async () => {
      const timestamp = Date.now();
      const response = await fetch(`/api/advertising-management/placements?spaceId=${spaceId}&_t=${timestamp}`);
      if (!response.ok) throw new Error('Error al cargar asignaciones');
      return response.json();
    },
    refetchInterval: 3 * 1000,
    staleTime: 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Obtener la asignación activa (si existe)
  const activePlacement = placementsResponse?.success && Array.isArray(placementsResponse.data) && placementsResponse.data.length > 0 
    ? placementsResponse.data[0] 
    : null;

  // Registrar impresión cuando el componente carga
  useEffect(() => {
    if (activePlacement && !hasTrackedImpression) {
      trackImpression(activePlacement.id);
      setHasTrackedImpression(true);
    }
  }, [activePlacement, hasTrackedImpression]);

  // Escuchar eventos globales de actualización de publicidad
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adForceUpdate') {
        refetch();
      }
    };

    const handleCustomUpdate = (e: CustomEvent) => {
      refetch();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adForceUpdate', handleCustomUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adForceUpdate', handleCustomUpdate as EventListener);
    };
  }, [refetch]);

  const trackImpression = async (placementId: number) => {
    try {
      await fetch('/api/advertising-management/track-impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placementId })
      });
    } catch (error) {
      // Error silencioso
    }
  };

  const trackClick = async (placementId: number) => {
    try {
      await fetch('/api/advertising-management/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placementId })
      });
    } catch (error) {
      // Error silencioso
    }
  };

  const handleAdClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (activePlacement) {
      trackClick(activePlacement.id);
      
      if (activePlacement.advertisement.targetUrl) {
        window.open(activePlacement.advertisement.targetUrl, '_blank');
      }
    }
  };

  // Si está cargando o no hay asignación activa, no mostrar nada
  if (isLoading || !activePlacement) {
    return null;
  }

  const { advertisement } = activePlacement;

  // Estilos base según la posición
  const baseStyles = {
    header: 'w-full tree-species-wide-container h-24 border border-gray-200 rounded-lg shadow-sm mb-6 relative overflow-hidden',
    hero: 'w-full max-w-4xl mx-auto h-20 bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg',
    sidebar: 'w-full h-64 bg-white border border-gray-200 rounded-lg shadow-sm mb-6',
    profile: 'bg-white rounded-lg border shadow-sm p-4',
    footer: 'w-full tree-species-wide-container h-20 bg-white border border-gray-200 rounded-lg shadow-sm mt-6',
    banner: 'w-full h-[120px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300',
    card: 'bg-white rounded-lg border shadow-sm p-4',
    'sidebar-sports': 'bg-white rounded-lg border shadow-sm p-4',
    'sidebar-events': 'bg-white rounded-lg border shadow-sm p-4',
    'sidebar-nature': 'bg-white rounded-lg border shadow-sm p-4',
    'sidebar-family': 'bg-white rounded-lg border shadow-sm p-4'
  };

  const containerStyle = baseStyles[position as keyof typeof baseStyles] || baseStyles.sidebar;

  return (
    <div 
      className={`${containerStyle} ${className} relative overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer`} 
      onClick={handleAdClick}
    >
      {/* Contenido del anuncio */}
      <div className="h-full relative z-10 flex items-center justify-between p-4">
        {advertisement.imageUrl && (
          <div className="flex-shrink-0 mr-4 rounded overflow-hidden">
            <img
              src={advertisement.imageUrl}
              alt={advertisement.altText || advertisement.title}
              className="h-full w-auto max-h-16 object-contain rounded"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZiI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmNGY0ZjQiLz48L2c+PC9zdmc+';
              }}
            />
          </div>
        )}

        {/* Contenido textual */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <h4 className="font-semibold text-gray-900 text-sm truncate">
              {advertisement.title}
            </h4>
            <ExternalLink className="h-3 w-3 text-gray-400 ml-1 flex-shrink-0" />
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">
            {advertisement.description}
          </p>
        </div>

        {/* Indicador de publicidad */}
        <div className="flex-shrink-0 ml-4">
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            Publicidad
          </span>
        </div>
      </div>

      {/* Overlay de hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#00a587]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
};

export default AdSpace;