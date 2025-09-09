import React, { useRef, useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import googleMapsService from '@/services/GoogleMapsService';

interface Park {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  municipality: string;
  type: string;
  area: number;
  status: string;
}

interface ParksDashboardMapProps {
  parks: Park[];
  className?: string;
}

const ParksDashboardMap: React.FC<ParksDashboardMapProps> = ({ parks, className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar Google Maps
  useEffect(() => {
    const loadMaps = async () => {
      try {
        await googleMapsService.loadGoogleMaps();
        setIsLoaded(true);
      } catch (error) {
        console.error('Error cargando Google Maps:', error);
      }
    };

    if (!googleMapsService.isGoogleMapsLoaded()) {
      loadMaps();
    } else {
      setIsLoaded(true);
    }
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const initMap = async () => {
      try {
        // Filtrar coordenadas válidas
        const validParks = parks.filter(
          park => 
            park.latitude != null &&
            park.longitude != null &&
            !isNaN(park.latitude) &&
            !isNaN(park.longitude)
        );

        // Calcular bounds o usar coordenadas por defecto
        let center = { lat: 20.6597, lng: -103.3496 }; // Guadalajara por defecto
        let zoom = 12;

        if (validParks.length > 0) {
          // Calcular el centro basado en las coordenadas
          const latitudes = validParks.map(park => park.latitude);
          const longitudes = validParks.map(park => park.longitude);
          
          const minLat = Math.min(...latitudes);
          const maxLat = Math.max(...latitudes);
          const minLng = Math.min(...longitudes);
          const maxLng = Math.max(...longitudes);
          
          center = {
            lat: (minLat + maxLat) / 2,
            lng: (minLng + maxLng) / 2
          };

          // Ajustar zoom basado en la extensión
          const latRange = maxLat - minLat;
          const lngRange = maxLng - minLng;
          const maxRange = Math.max(latRange, lngRange);
          
          if (maxRange < 0.01) zoom = 15;
          else if (maxRange < 0.05) zoom = 13;
          else if (maxRange < 0.1) zoom = 11;
          else if (maxRange < 0.5) zoom = 9;
          else zoom = 7;
        }

        const newMap = await googleMapsService.createMap(mapRef.current!, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        setMap(newMap);
      } catch (error) {
        console.error('Error inicializando mapa:', error);
      }
    };

    initMap();
  }, [isLoaded, parks, map]);

  // Actualizar marcadores cuando cambien los parques
  useEffect(() => {
    if (!map || !isLoaded) return;

    // Limpiar marcadores existentes
    markers.forEach(marker => marker.setMap(null));

    // Crear nuevos marcadores
    const newMarkers: google.maps.Marker[] = [];

    const validParks = parks.filter(
      park => 
        park.latitude != null &&
        park.longitude != null &&
        !isNaN(park.latitude) &&
        !isNaN(park.longitude)
    );

    const createMarkers = async () => {
      try {
        for (const park of validParks) {
          const marker = await googleMapsService.createMarker(map, {
            position: { lat: park.latitude, lng: park.longitude },
            title: park.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#10B981', // Verde primary
              fillOpacity: 1,
              scale: 8,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            }
          });

          // Crear contenido del popup
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 250px;">
                <h3 style="font-weight: 600; margin: 0 0 8px 0; color: #1f2937;">${park.name}</h3>
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${park.municipality}</p>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  <span style="
                    background: #f3f4f6; 
                    border: 1px solid #d1d5db; 
                    padding: 2px 8px; 
                    border-radius: 12px; 
                    font-size: 12px;
                    color: #374151;
                  ">${park.type}</span>
                  ${park.area ? `
                    <span style="
                      background: #e5e7eb; 
                      padding: 2px 8px; 
                      border-radius: 12px; 
                      font-size: 12px;
                      color: #374151;
                    ">${(park.area / 10000).toFixed(1)} ha</span>
                  ` : ''}
                </div>
              </div>
            `
          });

          // Agregar evento click
          marker.addListener('click', () => {
            // Cerrar otros info windows
            newMarkers.forEach(m => {
              if ((m as any).infoWindow) {
                (m as any).infoWindow.close();
              }
            });
            
            // Abrir este info window
            infoWindow.open(map, marker);
            (marker as any).infoWindow = infoWindow;
          });

          newMarkers.push(marker);
        }

        setMarkers(newMarkers);

        // Ajustar bounds si hay múltiples parques
        if (validParks.length > 1) {
          const bounds = new google.maps.LatLngBounds();
          validParks.forEach(park => {
            bounds.extend({ lat: park.latitude, lng: park.longitude });
          });
          map.fitBounds(bounds);
          
          // Asegurar que el zoom no sea demasiado alto
          const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
            if (map.getZoom()! > 15) map.setZoom(15);
            google.maps.event.removeListener(listener);
          });
        }
      } catch (error) {
        console.error('Error creando marcadores:', error);
      }
    };

    createMarkers();

    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
  }, [map, parks, isLoaded]);

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={className}
      style={{ 
        height: "100%", 
        width: "100%",
        minHeight: "450px"
      }}
    />
  );
};

export default ParksDashboardMap;