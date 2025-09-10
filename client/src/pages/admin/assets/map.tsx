import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  List, 
  AlertTriangle, 
  Layers
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { googleMapsService } from '@/services/GoogleMapsService';

// Error Boundary para Google Maps
class GoogleMapsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    // Solo captura errores específicos de Google Maps y DOM
    if (error.message.includes('removeChild') || 
        error.message.includes('Google Maps') ||
        error.message.includes('appendChild')) {
      return { hasError: true, errorMessage: error.message };
    }
    throw error; // Re-lanza otros errores
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Solo log para errores de Google Maps, no mostrar overlay
    if (error.message.includes('removeChild') || 
        error.message.includes('Google Maps') ||
        error.message.includes('appendChild')) {
      console.warn('Google Maps DOM error (no crítico):', error.message);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          width: '100%', 
          height: '600px', 
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          border: '1px solid #e9ecef',
          borderRadius: '8px'
        }}>
          <p style={{ color: '#666', marginBottom: '12px' }}>Cargando mapa de activos...</p>
          <p style={{ color: '#999', fontSize: '14px' }}>Si el mapa no carga, usa la tabla de inventario</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Constantes de estado y condición para activos
const ASSET_STATUSES = [
  { value: 'activo', label: 'Activo', color: '#10B981' },
  { value: 'mantenimiento', label: 'En Mantenimiento', color: '#F59E0B' },
  { value: 'retirado', label: 'Retirado', color: '#EF4444' },
  { value: 'almacen', label: 'En Almacén', color: '#6B7280' }
];

const ASSET_CONDITIONS = [
  { value: 'excelente', label: 'Excelente', color: '#10B981' },
  { value: 'bueno', label: 'Bueno', color: '#3B82F6' },
  { value: 'regular', label: 'Regular', color: '#F59E0B' },
  { value: 'malo', label: 'Malo', color: '#EF4444' },
  { value: 'critico', label: 'Crítico', color: '#DC2626' }
];

// Interfaces de tipos
interface Asset {
  id: number;
  name: string;
  description: string | null;
  status: string;
  condition: string;
  parkId: number;
  categoryId: number;
  latitude: string | null;
  longitude: string | null;
  locationDescription: string | null;
}

interface Park {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
}

interface AssetCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
}

// Componente del mapa con Google Maps
const GoogleMapComponent: React.FC<{
  assets: Asset[];
  categories: AssetCategory[];
  parks: Park[];
}> = ({ assets, categories, parks }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    let map: google.maps.Map | null = null;
    let markers: google.maps.Marker[] = [];

    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        // Limpiar completamente el contenedor
        const container = mapRef.current;
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        
        // Cargar Google Maps
        await googleMapsService.loadGoogleMaps();
        
        if (!mounted) return;

        if (!googleMapsService.isGoogleMapsLoaded()) {
          console.error('Google Maps no pudo cargarse');
          return;
        }

        // Crear el mapa
        map = await googleMapsService.createMap(mapRef.current, {
          center: { lat: 20.676667, lng: -103.347222 }, // Guadalajara
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        // Crear marcadores para activos
        const validAssets = assets.filter(asset => asset.latitude && asset.longitude);
        
        for (const asset of validAssets) {
          try {
            const marker = await googleMapsService.createMarker(map, {
              position: {
                lat: parseFloat(asset.latitude!),
                lng: parseFloat(asset.longitude!)
              },
              title: asset.name,
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(32, 32)
              }
            });

            // InfoWindow básico
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 8px;">
                  <h3 style="margin: 0 0 8px 0; font-weight: bold;">${asset.name}</h3>
                  <p style="margin: 4px 0;">ID: ${asset.id}</p>
                  <p style="margin: 4px 0;">Estado: ${asset.status}</p>
                  <p style="margin: 4px 0;">Condición: ${asset.condition}</p>
                  ${asset.description ? `<p style="margin: 4px 0;">${asset.description}</p>` : ''}
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            markers.push(marker);
          } catch (error) {
            console.error('Error creando marcador:', error);
          }
        }

        // Ajustar vista si hay múltiples activos
        if (validAssets.length > 1) {
          const bounds = new google.maps.LatLngBounds();
          validAssets.forEach(asset => {
            bounds.extend({
              lat: parseFloat(asset.latitude!),
              lng: parseFloat(asset.longitude!)
            });
          });
          map.fitBounds(bounds);
        }

        setMapLoaded(true);

      } catch (error) {
        console.error('Error inicializando Google Maps:', error);
      }
    };

    initMap();

    return () => {
      mounted = false;
      
      // Limpiar marcadores
      markers.forEach(marker => {
        try {
          marker.setMap(null);
        } catch (error) {
          console.warn('Error limpiando marcador:', error);
        }
      });
      
      // Limpiar mapa y contenedor
      try {
        if (map) {
          google.maps.event.clearInstanceListeners(map);
        }
        if (mapRef.current) {
          const container = mapRef.current;
          // Solo limpiar si el contenedor aún existe en el DOM
          if (container.parentNode) {
            container.innerHTML = '';
          }
        }
      } catch (error) {
        console.warn('Error limpiando mapa:', error);
      }
    };
  }, [assets, categories, parks]);

  return (
    <GoogleMapsErrorBoundary>
      <div 
        ref={mapRef} 
        style={{ width: '100%', height: '600px', backgroundColor: '#f0f0f0' }}
      >
        {!mapLoaded && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            fontSize: '16px',
            color: '#666'
          }}>
            Cargando Google Maps...
          </div>
        )}
      </div>
    </GoogleMapsErrorBoundary>
  );
};

// Componente principal
const AssetMapPage: React.FC = () => {
  const [_, setLocation] = useLocation();
  const [selectedPark, setSelectedPark] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string | 'all'>('all');
  const [selectedCondition, setSelectedCondition] = useState<string | 'all'>('all');

  // Consultar datos
  const { data: apiAssets, isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
    staleTime: 60000,
    suspense: false,
    retry: 1
  });
  
  const { data: apiParks, isLoading: parksLoading } = useQuery({
    queryKey: ['/api/parks'],
    staleTime: 60000,
    suspense: false,
    retry: 1
  });
  
  const { data: apiCategories, isLoading: categoriesLoading } = useQuery<AssetCategory[]>({
    queryKey: ['/api/asset-categories'],
    staleTime: 60000,
    suspense: false,
    retry: 1
  });

  const assets = apiAssets || [];
  const parks = Array.isArray(apiParks?.data) ? apiParks.data : (Array.isArray(apiParks) ? apiParks : []);
  const categories = apiCategories || [];

  // Filtrar activos
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (!asset.latitude || !asset.longitude) return false;
      
      const matchesPark = selectedPark === 'all' || asset.parkId === selectedPark;
      const matchesCategory = selectedCategory === 'all' || asset.categoryId === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;
      const matchesCondition = selectedCondition === 'all' || asset.condition === selectedCondition;
      
      return matchesPark && matchesCategory && matchesStatus && matchesCondition;
    });
  }, [assets, selectedPark, selectedCategory, selectedStatus, selectedCondition]);

  const unlocatedAssets = assets.filter(asset => !asset.latitude || !asset.longitude);
  const isLoading = assetsLoading || parksLoading || categoriesLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card className="p-4 bg-gray-50 mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">Mapa de Activos</h1>
            </div>
            <p className="text-gray-600 mt-2">
              Vista geográfica de todos los activos en los parques
            </p>
          </Card>
          <Skeleton className="h-[600px] w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <Card className="p-4 bg-gray-50 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-8 h-8 text-gray-900" />
                <h1 className="text-3xl font-bold text-gray-900">Mapa de Activos</h1>
              </div>
              <p className="text-gray-600 mt-2">
                Vista geográfica con Google Maps de todos los activos en los parques
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setLocation('/admin/assets/inventory')}>
                <List className="mr-2 h-4 w-4" />
                Ver Inventario
              </Button>
              <Button onClick={() => setLocation('/admin/assets/new')}>
                <Layers className="mr-2 h-4 w-4" />
                Nuevo Activo
              </Button>
            </div>
          </div>
        </Card>

        {/* Información sobre activos mostrados */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredAssets.length} activos con ubicación definida.
            {unlocatedAssets.length > 0 && ` (${unlocatedAssets.length} activos sin geolocalización)`}
          </p>
        </div>

        {/* Alerta para activos sin geolocalización */}
        {unlocatedAssets.length > 0 && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <AlertDescription className="text-amber-800">
              Hay {unlocatedAssets.length} activos sin coordenadas de geolocalización. 
              Estos activos no aparecerán en el mapa.
            </AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Select value={selectedPark.toString()} onValueChange={(value) => setSelectedPark(value === 'all' ? 'all' : parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los parques" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los parques</SelectItem>
              {parks?.map((park) => (
                <SelectItem key={park.id} value={park.id.toString()}>
                  {park.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory.toString()} onValueChange={(value) => setSelectedCategory(value === 'all' ? 'all' : parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {ASSET_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCondition} onValueChange={(value) => setSelectedCondition(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las condiciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las condiciones</SelectItem>
              {ASSET_CONDITIONS.map((condition) => (
                <SelectItem key={condition.value} value={condition.value}>
                  {condition.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mapa con Google Maps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mapa Interactivo de Activos (Google Maps)</span>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{filteredAssets.length} activos mostrados</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] w-full rounded-lg overflow-hidden border">
              <GoogleMapComponent
                assets={filteredAssets}
                categories={categories}
                parks={parks}
              />
            </div>
          </CardContent>
        </Card>

        {/* Leyenda del mapa */}
        <Card>
          <CardHeader>
            <CardTitle>Leyenda del Mapa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Estados de Activos</h4>
                <div className="space-y-2">
                  {ASSET_STATUSES.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full border-2"
                        style={{ 
                          backgroundColor: '#f3f4f6',
                          borderColor: status.color
                        }}
                      />
                      <span className="text-sm">{status.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Condiciones de Activos</h4>
                <div className="space-y-2">
                  {ASSET_CONDITIONS.map((condition) => (
                    <div key={condition.value} className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: condition.color }}
                      />
                      <span className="text-sm">{condition.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Funcionalidad:</strong> Mapa interactivo usando Google Maps. 
                Haga clic en cualquier marcador rojo para ver detalles del activo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AssetMapPage;