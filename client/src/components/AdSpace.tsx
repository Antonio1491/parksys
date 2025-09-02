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

interface AdSpace {
  id: number;
  pageType: string;
  position: string;
  dimensions: string;
  maxFileSize: number;
  allowedFormats: string[];
  isActive: boolean;
}

const AdSpace: React.FC<AdSpaceProps> = ({ spaceId, position, pageType, className = '' }) => {
  // Removido isVisible para usuarios públicos
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [forceRender, setForceRender] = useState(0);

  // Obtener el espacio publicitario y sus asignaciones activas
  const { data: placementsResponse, isLoading, refetch } = useQuery({
    queryKey: [`/api/advertising-management/placements`, spaceId, pageType], // Query key estable
    queryFn: async () => {
      const timestamp = Date.now();
      const response = await fetch(`/api/advertising-management/placements?spaceId=${spaceId}&_t=${timestamp}`);
      if (!response.ok) throw new Error('Error al cargar asignaciones');
      return response.json();
    },
    refetchInterval: 3 * 1000, // Refrescar cada 3 segundos
    staleTime: 1000, // Considerar datos válidos por 1 segundo
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Obtener la asignación activa (si existe)
  const activePlacement = placementsResponse?.success && Array.isArray(placementsResponse.data) && placementsResponse.data.length > 0 
    ? placementsResponse.data[0] 
    : null;

  // Debug logging (solo cuando hay datos relevantes)
  React.useEffect(() => {
    if (isLoading) {
      console.log(`⏳ AdSpace ${spaceId} está cargando...`);
    } else if (placementsResponse?.success && Array.isArray(placementsResponse.data)) {
      if (placementsResponse.data.length > 0) {
        console.log(`✅ AdSpace ${spaceId} tiene asignación activa:`, activePlacement);
      }
      // Solo registrar cuando no hay datos Y es la primera carga (evita spam de logs)
    }
  }, [spaceId, pageType, position, isLoading, placementsResponse, activePlacement]);





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
      console.error('Error tracking impression:', error);
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
      console.error('Error tracking click:', error);
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

  // Removido handleClose para usuarios públicos

  // Si está cargando o no hay asignación activa, no mostrar nada
  if (isLoading) {
    return null;
  }
  
  if (!activePlacement) {
    return null;
  }

  const { advertisement } = activePlacement;
  
  // Sistema simple de cache-busting
  const getMediaUrlWithCacheBuster = (mediaUrl: string) => {
    if (!mediaUrl) return '';
    
    const updatedAt = advertisement.updatedAt || new Date().toISOString();
    const timestamp = new Date(updatedAt).getTime();
    const separator = mediaUrl.includes('?') ? '&' : '?';
    
    return `${mediaUrl}${separator}v=${timestamp}`;
  };

  // Función helper para renderizar contenido multimedia
  const renderMedia = (className: string, autoplay: boolean = true) => {
    const mediaUrl = getMediaUrlWithCacheBuster(advertisement.imageUrl);
    const mediaType = advertisement.mediaType || 'image';
    
    if (mediaType === 'video') {
      return (
        <video
          src={mediaUrl}
          className={className}
          autoPlay={autoplay}
          muted
          loop
          playsInline
          controls={false}
          style={{ objectFit: 'cover' }}
          onError={(e) => {
            console.error('Error loading video:', e);
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    } else {
      return (
        <img
          src={mediaUrl}
          alt={advertisement.altText || advertisement.title}
          className={className}
          onLoad={() => {
            console.log(`🖼️ Imagen cargada exitosamente: ${mediaUrl}`);
          }}
          onError={(e) => {
            console.error(`❌ Error cargando imagen: ${mediaUrl}`);
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZiI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmNGY0ZjQiLz48L2c+PC9zdmc+';
          }}
        />
      );
    }
  };


  
  // Función para determinar si es un contenedor tipo tarjeta
  const isCardType = (pos: string) => {
    return pos.startsWith('sidebar-') || pos === 'card' || pos === 'profile';
  };

  // Función para obtener imagen de fondo temática basada en el contenido del anuncio
  const getThemeBackgroundImage = (title: string, description: string) => {
    const content = `${title} ${description}`.toLowerCase();
    
    if (content.includes('yoga') || content.includes('meditaci')) {
      return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60';
    } else if (content.includes('deporte') || content.includes('futbol') || content.includes('ejercicio')) {
      return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60';
    } else if (content.includes('parque') || content.includes('naturaleza') || content.includes('arbol') || content.includes('verde')) {
      return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60';
    } else if (content.includes('instructor') || content.includes('certificaci') || content.includes('profesional')) {
      return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60';
    } else if (content.includes('vivero') || content.includes('plantas') || content.includes('especie')) {
      return 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60';
    }
    
    // Imagen por defecto para actividades en parques
    return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60';
  };

  // Función para obtener colores de botón basados en posición o hash del spaceId
  const getButtonColor = (pos: string, spaceId: string | number) => {
    // Colores predefinidos para posiciones específicas
    const positionColors = {
      'sidebar-sports': 'bg-blue-600 hover:bg-blue-700',
      'sidebar-events': 'bg-purple-600 hover:bg-purple-700',
      'sidebar-nature': 'bg-green-600 hover:bg-green-700',
      'sidebar-family': 'bg-orange-600 hover:bg-orange-700'
    };

    if (positionColors[pos as keyof typeof positionColors]) {
      return positionColors[pos as keyof typeof positionColors];
    }

    // Para otros contenedores, usar un color basado en el spaceId
    const colors = [
      'bg-blue-600 hover:bg-blue-700',
      'bg-purple-600 hover:bg-purple-700', 
      'bg-green-600 hover:bg-green-700',
      'bg-orange-600 hover:bg-orange-700',
      'bg-red-600 hover:bg-red-700',
      'bg-indigo-600 hover:bg-indigo-700',
      'bg-pink-600 hover:bg-pink-700',
      'bg-teal-600 hover:bg-teal-700'
    ];
    
    const spaceIdNum = typeof spaceId === 'string' ? parseInt(spaceId) || 0 : spaceId;
    return colors[spaceIdNum % colors.length];
  };

  // Obtener imagen de fondo para el anuncio actual
  const backgroundImage = getThemeBackgroundImage(advertisement.title, advertisement.description);

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

  console.log(`🎨 AdSpace ${spaceId} Container style:`, containerStyle);
  console.log(`🎨 AdSpace ${spaceId} className adicional:`, className);

  return (
    <div 
      className={`${containerStyle} ${className} relative overflow-hidden hover:shadow-md transition-shadow duration-200 ${
        isCardType(position) ? '' : 'cursor-pointer'
      }`} 
      onClick={isCardType(position) ? undefined : handleAdClick}
      style={{ 
        minHeight: position === 'hero' ? '80px' : undefined,
        ...(position === 'header' ? {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        } : {})
      }}
    >
      {/* Overlay oscuro para header con imagen de fondo */}
      {position === 'header' && (
        <div className="absolute inset-0 bg-black/50"></div>
      )}

      {/* Contenido del anuncio */}
      <div className={`h-full relative z-10 ${position === 'sidebar' ? 'flex flex-col' : position === 'banner' ? 'flex items-center justify-center' : position === 'header' ? 'flex items-center justify-between text-white' : isCardType(position) ? 'text-center' : 'flex items-center justify-between'} ${position === 'banner' ? 'p-0' : isCardType(position) ? '' : 'p-4'}`}>
        {position === 'header' ? (
          // Layout específico para header con fondo de imagen y texto blanco
          <>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-lg mb-1">
                {advertisement.title}
              </h4>
              <p className="text-white/90 text-sm line-clamp-2">
                {advertisement.description}
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <ExternalLink className="h-5 w-5 text-white/80" />
            </div>
          </>
        ) : position === 'banner' ? (
          // Layout específico para banner - contenido multimedia con solo título
          <div className="w-full h-full relative">
            {advertisement.imageUrl && renderMedia("w-full h-full object-cover")}
            {/* Overlay con gradiente para mejor legibilidad del texto */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
            {/* Solo título superpuesto */}
            <div className="absolute inset-0 flex items-center justify-start p-6">
              <div className="text-white">
                <h3 className="text-2xl font-bold drop-shadow-lg">
                  {advertisement.title}
                </h3>
              </div>
            </div>
          </div>
        ) : isCardType(position) ? (
          // Layout especial para AdSpace 11 (activity-detail) con imagen de fondo
          spaceId === 11 || spaceId === "11" ? (
            <div className="w-full h-40 rounded-lg relative overflow-hidden">
              {/* Imagen de fondo */}
              {advertisement.imageUrl && (
                <div className="absolute inset-0">
                  {renderMedia("w-full h-full object-cover")}
                </div>
              )}
              {/* Overlay oscuro */}
              <div className="absolute inset-0 bg-black/50"></div>
              {/* Contenido superpuesto */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
                <h3 className="font-bold text-lg drop-shadow-lg">{advertisement.title}</h3>
                <div className="space-y-2">
                  {advertisement.description && (
                    <p className="text-sm text-white/90 line-clamp-2 drop-shadow-lg">
                      {advertisement.description}
                    </p>
                  )}
                  <button 
                    className="bg-white/20 backdrop-blur-sm text-white py-2 px-4 rounded-lg transition-all hover:bg-white/30 text-sm font-medium border border-white/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdClick(e);
                    }}
                  >
                    Ver Más
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Layout tipo tarjeta para otros espacios promocionales
            <div className="text-center">
              {advertisement.imageUrl && (
                <div className="w-full h-40 rounded-lg mb-3 overflow-hidden">
                  {renderMedia("w-full h-full object-cover rounded-lg")}
                </div>
              )}
              <h3 className="font-semibold text-gray-900 mb-2">{advertisement.title}</h3>
              {advertisement.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {advertisement.description}
                </p>
              )}
              <button 
                className={`w-full text-white py-2 px-4 rounded-lg transition-colors text-sm ${getButtonColor(position, spaceId)}`}
                onClick={(e) => {
                  e.stopPropagation(); // Evitar doble click
                  handleAdClick(e);
                }}
              >
                {advertisement.buttonText || 
                 (position === 'sidebar-sports' ? 'Inscríbete Ahora' :
                  position === 'sidebar-events' ? 'Ver Calendario' :
                  position === 'sidebar-nature' ? 'Más Información' :
                  position === 'sidebar-family' ? 'Explorar' :
                  'Ver Más')}
              </button>
            </div>
          )
        ) : position === 'sidebar' ? (
          // Layout vertical para sidebar
          <>
            {/* Contenido multimedia del anuncio */}
            {advertisement.imageUrl && (
              <div className="flex-shrink-0 mb-3 bg-gray-50 rounded overflow-hidden">
                {renderMedia("w-full h-32 object-contain rounded bg-gray-50")}
              </div>
            )}

            {/* Contenido textual */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm truncate">
                  {advertisement.title}
                </h4>
                <ExternalLink className="h-3 w-3 text-gray-400 ml-1 flex-shrink-0" />
              </div>
              <p className="text-xs text-gray-600 line-clamp-3 mb-3">
                {advertisement.description}
              </p>
              
              {/* Indicador de publicidad */}
              <div className="flex justify-center">
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  Publicidad
                </span>
              </div>
            </div>
          </>
        ) : (
          // Layout horizontal para otras posiciones
          <>
            {/* Contenido multimedia del anuncio */}
            {advertisement.imageUrl && (
              <div key={`horizontal-container-${advertisement.id}-${refreshKey}-${forceRender}`} className="flex-shrink-0 mr-4 rounded overflow-hidden">
                {renderMedia("h-full w-auto max-h-16 object-contain rounded", false)}
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
              {advertisement.altText && (
                <p className="text-xs text-gray-500 mt-1">
                  {advertisement.altText}
                </p>
              )}
            </div>

            {/* Indicador de publicidad */}
            <div className="flex-shrink-0 ml-4">
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                Publicidad
              </span>
            </div>
          </>
        )}
      </div>

      {/* Overlay de hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#00a587]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
};

export default AdSpace;