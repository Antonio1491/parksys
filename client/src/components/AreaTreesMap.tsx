import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TreePine } from 'lucide-react';

// Fix para los iconos de Leaflet en React
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icono personalizado para árboles
const treeIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/685/685025.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface Tree {
  id: number;
  code?: string;
  speciesName?: string;
  scientificName?: string;
  latitude?: string | number;
  longitude?: string | number;
  condition?: string;
  healthStatus?: string;
  height?: number;
}

interface AreaTreesMapProps {
  trees: Tree[];
  areaName?: string;
  parkName?: string;
  className?: string;
  height?: string;
}

// Componente para ajustar el mapa a los bounds de los árboles
function FitBounds({ trees }: { trees: Tree[] }) {
  const map = useMap();

  useEffect(() => {
    const validTrees = trees.filter(tree => {
      const lat = typeof tree.latitude === 'string' ? parseFloat(tree.latitude) : tree.latitude;
      const lng = typeof tree.longitude === 'string' ? parseFloat(tree.longitude) : tree.longitude;
      return lat && lng && !isNaN(lat) && !isNaN(lng);
    });

    if (validTrees.length > 0) {
      const bounds = new LatLngBounds(
        validTrees.map(tree => {
          const lat = typeof tree.latitude === 'string' ? parseFloat(tree.latitude) : tree.latitude!;
          const lng = typeof tree.longitude === 'string' ? parseFloat(tree.longitude) : tree.longitude!;
          return [lat, lng] as [number, number];
        })
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, trees]);

  return null;
}

export function AreaTreesMap({ 
  trees, 
  areaName, 
  parkName, 
  className,
  height = "400px" 
}: AreaTreesMapProps) {
  // Filtrar árboles con coordenadas válidas
  const validTrees = trees.filter(tree => {
    const lat = typeof tree.latitude === 'string' ? parseFloat(tree.latitude) : tree.latitude;
    const lng = typeof tree.longitude === 'string' ? parseFloat(tree.longitude) : tree.longitude;
    return lat && lng && !isNaN(lat) && !isNaN(lng);
  });

  // Si no hay árboles con coordenadas, mostrar mensaje
  if (validTrees.length === 0) {
    return (
      <div 
        className={`bg-gray-100 rounded-lg border flex items-center justify-center ${className}`} 
        style={{ height }}
      >
        <div className="text-center text-gray-500 p-8">
          <TreePine className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium mb-2">Sin ubicaciones disponibles</p>
          <p className="text-sm">
            {trees.length === 0 
              ? 'Esta área aún no tiene árboles registrados'
              : 'Los árboles de esta área no tienen coordenadas GPS registradas'
            }
          </p>
        </div>
      </div>
    );
  }

  // Calcular centro inicial (primer árbol con coordenadas)
  const firstTree = validTrees[0];
  const centerLat = typeof firstTree.latitude === 'string' ? parseFloat(firstTree.latitude) : firstTree.latitude!;
  const centerLng = typeof firstTree.longitude === 'string' ? parseFloat(firstTree.longitude) : firstTree.longitude!;

  const getConditionColor = (condition?: string) => {
    switch (condition?.toLowerCase()) {
      case 'excelente':
      case 'bueno':
        return 'bg-green-100 text-green-800';
      case 'regular':
        return 'bg-yellow-100 text-yellow-800';
      case 'malo':
      case 'crítico':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`} style={{ height }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={17}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds trees={validTrees} />

        {validTrees.map((tree) => {
          const lat = typeof tree.latitude === 'string' ? parseFloat(tree.latitude) : tree.latitude!;
          const lng = typeof tree.longitude === 'string' ? parseFloat(tree.longitude) : tree.longitude!;

          return (
            <Marker 
              key={tree.id} 
              position={[lat, lng]}
              icon={treeIcon}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-semibold text-[#00444f] mb-1">
                    {tree.speciesName || 'Especie desconocida'}
                  </h3>
                  {tree.scientificName && (
                    <p className="text-xs text-gray-500 italic mb-2">{tree.scientificName}</p>
                  )}
                  <div className="space-y-1 text-sm">
                    {tree.code && (
                      <p><span className="font-medium">Código:</span> {tree.code}</p>
                    )}
                    {(tree.condition || tree.healthStatus) && (
                      <p>
                        <span className="font-medium">Estado:</span>{' '}
                        <span className={`px-2 py-0.5 rounded text-xs ${getConditionColor(tree.condition || tree.healthStatus)}`}>
                          {tree.condition || tree.healthStatus}
                        </span>
                      </p>
                    )}
                    {tree.height && (
                      <p><span className="font-medium">Altura:</span> {tree.height} m</p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 z-[1000]">
        <div className="flex items-center gap-2 text-sm">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/685/685025.png" 
            alt="Árbol" 
            className="w-5 h-5"
          />
          <span className="text-gray-700">{validTrees.length} árbol{validTrees.length !== 1 ? 'es' : ''}</span>
        </div>
      </div>
    </div>
  );
}

export default AreaTreesMap;