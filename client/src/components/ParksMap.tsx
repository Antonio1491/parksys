import React, { useRef, useEffect, useState } from 'react';
import { Search, Plus, Minus, FileText, Loader } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { ExtendedPark } from '@shared/schema';
import googleMapsService from '@/services/GoogleMapsService';

interface ParksMapProps {
  parks: ExtendedPark[];
  selectedParkId?: number;
  onSelectPark?: (parkId: number) => void;
  isLoading?: boolean;
}

const ParksMap: React.FC<ParksMapProps> = ({ 
  parks, 
  selectedParkId, 
  onSelectPark,
  isLoading = false 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [, setLocation] = useLocation();

  // Load Google Maps usando el servicio centralizado
  useEffect(() => {
    const loadMaps = async () => {
      try {
        await googleMapsService.loadGoogleMaps();
        setMapLoaded(true);
      } catch (error) {
        console.error('Error cargando Google Maps:', error);
      }
    };

    if (!googleMapsService.isGoogleMapsLoaded()) {
      loadMaps();
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapLoaded && mapRef.current && !map) {
      const initMap = async () => {
        try {
          // Default center on Guadalajara, Mexico
          const defaultCenter = { lat: 20.6597, lng: -103.3496 };
          
          const newMap = await googleMapsService.createMap(mapRef.current!, {
            center: defaultCenter,
            zoom: 12,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: false,
      });
      
      setMap(newMap);
    }
  }, [mapLoaded, mapRef, map]);

  // Update markers when parks change
  useEffect(() => {
    if (map && parks.length > 0) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      
      // Create new markers for each park
      const newMarkers = parks.map(park => {
        const position = {
          lat: parseFloat(park.latitude),
          lng: parseFloat(park.longitude)
        };
        
        // Skip invalid coordinates
        if (isNaN(position.lat) || isNaN(position.lng)) {
          return null;
        }
        
        // Customize marker based on park type
        const markerIcon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#10B981', // Primary green color
          fillOpacity: 1,
          scale: 8,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        };
        
        const marker = new google.maps.Marker({
          position,
          map,
          title: park.name,
          icon: markerIcon,
          animation: selectedParkId === park.id 
            ? google.maps.Animation.BOUNCE 
            : undefined
        });
        
        // Add click handler
        marker.addListener('click', () => {
          if (onSelectPark) {
            onSelectPark(park.id);
          } else {
            setLocation(`/parks/${park.id}`);
          }
        });
        
        return marker;
      }).filter(Boolean) as google.maps.Marker[];
      
      setMarkers(newMarkers);
      
      // Fit bounds to show all markers if there are multiple parks
      if (newMarkers.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        newMarkers.forEach(marker => {
          bounds.extend(marker.getPosition()!);
        });
        map.fitBounds(bounds);
      } 
      // If only one park, center on it
      else if (newMarkers.length === 1) {
        map.setCenter(newMarkers[0].getPosition()!);
        map.setZoom(15);
      }
    }
  }, [map, parks, selectedParkId, onSelectPark, setLocation]);

  // Handle zoom in/out
  const handleZoomIn = () => {
    if (map) map.setZoom(map.getZoom()! + 1);
  };
  
  const handleZoomOut = () => {
    if (map) map.setZoom(map.getZoom()! - 1);
  };

  return (
    <div className="relative map-container w-full">
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
            <Loader className="h-5 w-5 text-primary animate-spin mr-2" />
            <span>Cargando mapa...</span>
          </div>
        </div>
      )}
      
      <div ref={mapRef} style={{height: '100%', minHeight: '300px'}} className="w-full bg-gray-200"></div>
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-white hover:bg-gray-50 h-10 w-10 rounded-md shadow-md"
          onClick={handleZoomIn}
        >
          <Plus className="h-5 w-5 text-gray-600" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-white hover:bg-gray-50 h-10 w-10 rounded-md shadow-md"
          onClick={handleZoomOut}
        >
          <Minus className="h-5 w-5 text-gray-600" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-white hover:bg-gray-50 h-10 w-10 rounded-md shadow-md"
        >
          <FileText className="h-5 w-5 text-gray-600" />
        </Button>
      </div>
      
      {/* Mobile toggle for list view */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 md:hidden">
        <Button 
          className="bg-white hover:bg-gray-50 text-gray-700 shadow-md px-4"
          variant="outline"
          onClick={() => {
            // Scroll to list on mobile
            const listElement = document.getElementById('parks-list');
            if (listElement) {
              listElement.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <Search className="h-4 w-4 mr-2" />
          Ver lista de parques
        </Button>
      </div>
    </div>
  );
};

export default ParksMap;
