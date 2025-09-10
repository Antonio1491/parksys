import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { googleMapsService } from '@/services/GoogleMapsService';

import { 
  ArrowLeft, 
  Save,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Settings
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiRequest } from '@/lib/queryClient';

import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ASSET_CONDITIONS, ASSET_STATUSES, MAINTENANCE_FREQUENCIES } from '@shared/asset-schema';

// Esquema de validación para editar activo (similar al de crear)
const assetEditSchema = z.object({
  // IDENTIFICACIÓN
  name: z.string().min(1, 'El nombre es obligatorio'),
  serialNumber: z.string().nullable().optional(),
  categoryId: z.number().min(1, 'La categoría principal es obligatoria'),
  subcategoryId: z.number().nullable().optional(),
  customAssetId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  
  // UBICACIÓN
  parkId: z.number().min(1, 'El parque es obligatorio'),
  amenityId: z.number().nullable().optional(),
  locationDescription: z.string().nullable().optional(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  
  // ESPECIFICACIONES TÉCNICAS
  manufacturer: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  serialNumberTech: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  dimensionsCapacity: z.string().nullable().optional(),
  
  // CICLO DE VIDA
  installationDate: z.string().nullable().optional(),
  lastInspectionDate: z.string().nullable().optional(),
  estimatedUsefulLife: z.union([z.number().positive(), z.nan()]).transform(val => isNaN(val) ? null : val).nullable().optional(),
  status: z.string().min(1, 'El estado es obligatorio'),
  maintenanceHistory: z.array(z.string()).optional(),
  
  // COSTOS
  acquisitionCost: z.union([z.number().positive(), z.nan()]).transform(val => isNaN(val) ? null : val).nullable().optional(),
  currentValue: z.union([z.number().positive(), z.nan()]).transform(val => isNaN(val) ? null : val).nullable().optional(),
  financingSource: z.string().nullable().optional(),
  
  // CONTROL Y GESTIÓN
  responsiblePersonId: z.number().nullable().optional(),
  assignedArea: z.string().nullable().optional(),
  maintenanceManualUrl: z.string().nullable().optional(),
  usagePolicies: z.string().nullable().optional(),
  
  // NOTAS ADICIONALES
  notes: z.string().nullable().optional(),
  
  // CAMPOS HEREDADOS (compatibilidad)
  useId: z.number().nullable().optional(),
  acquisitionDate: z.string().nullable().optional(),
  condition: z.string().min(1, 'La condición es obligatoria'),
  maintenanceFrequency: z.string().nullable().optional(),
  lastMaintenanceDate: z.string().nullable().optional(),
  nextMaintenanceDate: z.string().nullable().optional(),
  expectedLifespan: z.union([z.number().positive(), z.nan()]).transform(val => isNaN(val) ? null : val).nullable().optional(),
  qrCode: z.string().nullable().optional(),
});

type AssetFormData = z.infer<typeof assetEditSchema>;

// Componente de mapa con Google Maps
interface GoogleMapComponentProps {
  position: [number, number] | null;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
}

function GoogleMapComponent({ position, onLocationSelect, height = '384px' }: GoogleMapComponentProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [mapError, setMapError] = React.useState<string | null>(null);
  const [mapInstance, setMapInstance] = React.useState<google.maps.Map | null>(null);
  const [marker, setMarker] = React.useState<google.maps.Marker | null>(null);
  const isMountedRef = React.useRef(true);
  const cleanupRef = React.useRef<(() => void) | null>(null);

  // Efecto de limpieza al desmontar
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Ejecutar limpieza si existe
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      
      // Limpiar el marker
      if (marker) {
        try {
          marker.setMap(null);
        } catch (e) {
          console.log('🗺️ [CLEANUP] Error limpiando marker:', e);
        }
      }
      
      // Limpiar referencias sin tocar el DOM directamente
      setMapInstance(null);
      setMarker(null);
    };
  }, []);

  React.useEffect(() => {
    const initMap = async () => {
      if (!containerRef.current || !isMountedRef.current) return;

      try {
        console.log('🗺️ [GOOGLE MAPS] Iniciando carga...');
        
        // Crear un div específico para el mapa que será gestionado por Google Maps
        const mapDiv = document.createElement('div');
        mapDiv.style.width = '100%';
        mapDiv.style.height = height;
        mapDiv.style.borderRadius = '8px';
        
        // Limpiar el contenedor y agregar el nuevo div
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(mapDiv);
          mapRef.current = mapDiv;
        }
        
        await googleMapsService.loadGoogleMaps();

        if (!isMountedRef.current || !mapRef.current) return;
        
        if (!googleMapsService.isGoogleMapsLoaded()) {
          console.error('🗺️ [GOOGLE MAPS ERROR] No pudo cargarse');
          if (isMountedRef.current) {
            setMapError('Error al cargar Google Maps API');
          }
          return;
        }

        console.log('🗺️ [GOOGLE MAPS] API cargada, creando mapa...');

        // Crear el mapa usando el servicio
        const map = await googleMapsService.createMap(mapRef.current, {
          center: position ? { lat: position[0], lng: position[1] } : { lat: 20.676667, lng: -103.347222 },
          zoom: 16
        });

        if (!isMountedRef.current) return;

        setMapInstance(map);

        // Agregar listener para clicks
        const clickListener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (!isMountedRef.current) return;
          const lat = event.latLng?.lat() || 0;
          const lng = event.latLng?.lng() || 0;
          onLocationSelect(lat, lng);
        });

        // Configurar función de limpieza
        cleanupRef.current = () => {
          try {
            if (clickListener) {
              clickListener.remove();
            }
          } catch (e) {
            console.log('🗺️ [CLEANUP] Error limpiando listeners:', e);
          }
        };

        console.log('🗺️ [GOOGLE MAPS] Mapa creado exitosamente');
        setMapLoaded(true);
        setMapError(null);
      } catch (error) {
        console.error('🗺️ [GOOGLE MAPS ERROR] Error inicializando:', error);
        if (isMountedRef.current) {
          setMapError(error instanceof Error ? error.message : 'Error desconocido');
        }
      }
    };

    initMap();
  }, [height]);

  // Actualizar posición del marcador
  React.useEffect(() => {
    if (mapInstance && position && isMountedRef.current) {
      const updateMarker = async () => {
        try {
          // Limpiar marcador anterior
          if (marker) {
            marker.setMap(null);
          }

          if (!isMountedRef.current) return;

          // Crear nuevo marcador usando el servicio
          const newMarker = await googleMapsService.createMarker(mapInstance, {
            position: { lat: position[0], lng: position[1] },
            title: 'Ubicación del activo'
          });

          if (!isMountedRef.current) return;

          // Centrar el mapa en la nueva posición
          mapInstance.setCenter({ lat: position[0], lng: position[1] });

          setMarker(newMarker);
        } catch (error) {
          console.error('🗺️ [GOOGLE MAPS ERROR] Error actualizando marcador:', error);
        }
      };

      updateMarker();
    }
  }, [mapInstance, position]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height, borderRadius: '8px' }}
      className="bg-gray-100 flex items-center justify-center overflow-hidden"
    >
      {mapError && (
        <div className="text-red-500 text-center p-4">
          <p>Error cargando el mapa: {mapError}</p>
        </div>
      )}
      {!mapLoaded && !mapError && (
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
          <span>Cargando mapa...</span>
        </div>
      )}
    </div>
  );
}

export default function EditAssetPage() {
  const [, params] = useRoute('/admin/assets/:id/edit-enhanced');
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const id = params?.id;
  
  // Estado para el mapa
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  
  // Formulario para editar activo
  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetEditSchema),
    defaultValues: {
      // IDENTIFICACIÓN
      name: '',
      serialNumber: '',
      categoryId: 0,
      subcategoryId: null,
      customAssetId: '',
      description: '',
      
      // UBICACIÓN
      parkId: 0,
      amenityId: null,
      locationDescription: '',
      latitude: '',
      longitude: '',
      
      // ESPECIFICACIONES TÉCNICAS
      manufacturer: '',
      model: '',
      serialNumberTech: '',
      material: '',
      dimensionsCapacity: '',
      
      // CICLO DE VIDA
      installationDate: '',
      lastInspectionDate: '',
      estimatedUsefulLife: null,
      status: '',
      
      // COSTOS
      acquisitionCost: null,
      currentValue: null,
      financingSource: '',
      
      // CONTROL Y GESTIÓN
      responsiblePersonId: null,
      assignedArea: '',
      maintenanceManualUrl: '',
      usagePolicies: '',
      
      // NOTAS ADICIONALES
      notes: '',
      
      // CAMPOS HEREDADOS
      condition: '',
      acquisitionDate: '',
      maintenanceFrequency: '',
      lastMaintenanceDate: '',
      nextMaintenanceDate: '',
      expectedLifespan: null,
      qrCode: '',
    }
  });

  // Queries para obtener datos de selección
  const { data: parks, isLoading: loadingParks } = useQuery({
    queryKey: ['/api/parks'],
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['/api/asset-categories'],
  });

  const { data: amenities, isLoading: loadingAmenities } = useQuery({
    queryKey: ['/api/amenities'],
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });

  // Cargar datos del activo existente
  const { data: asset, isLoading: loadingAsset, error: assetError } = useQuery({
    queryKey: ['/api/assets', id],
    queryFn: () => fetch(`/api/assets/${id}`).then(res => {
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      return res.json();
    }),
    enabled: !!id,
    retry: 1,
  });

  // Poblar formulario cuando se cargan los datos del activo
  useEffect(() => {
    if (asset) {
      form.reset({
        name: asset.name || '',
        serialNumber: asset.serialNumber || '',
        categoryId: asset.categoryId || 0,
        subcategoryId: asset.subcategoryId || null,
        customAssetId: asset.customAssetId || '',
        description: asset.description || '',
        parkId: asset.parkId || 0,
        amenityId: asset.amenityId || null,
        locationDescription: asset.locationDescription || '',
        latitude: asset.latitude || '',
        longitude: asset.longitude || '',
        manufacturer: asset.manufacturer || '',
        model: asset.model || '',
        serialNumberTech: asset.serialNumberTech || '',
        material: asset.material || '',
        dimensionsCapacity: asset.dimensionsCapacity || '',
        installationDate: asset.installationDate || '',
        lastInspectionDate: asset.lastInspectionDate || '',
        estimatedUsefulLife: asset.estimatedUsefulLife || null,
        status: asset.status || '',
        acquisitionCost: asset.acquisitionCost || null,
        currentValue: asset.currentValue || null,
        financingSource: asset.financingSource || '',
        responsiblePersonId: asset.responsiblePersonId || null,
        assignedArea: asset.assignedArea || '',
        maintenanceManualUrl: asset.maintenanceManualUrl || '',
        usagePolicies: asset.usagePolicies || '',
        notes: asset.notes || '',
        condition: asset.condition || '',
        acquisitionDate: asset.acquisitionDate || '',
        maintenanceFrequency: asset.maintenanceFrequency || '',
        lastMaintenanceDate: asset.lastMaintenanceDate || '',
        nextMaintenanceDate: asset.nextMaintenanceDate || '',
        expectedLifespan: asset.expectedLifespan || null,
        qrCode: asset.qrCode || '',
      });

      // Configurar posición del mapa si hay coordenadas
      if (asset.latitude && asset.longitude) {
        const lat = parseFloat(asset.latitude);
        const lng = parseFloat(asset.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapPosition([lat, lng]);
          setSelectedLocation([lat, lng]);
        }
      }
    }
  }, [asset, form]);

  // Mutación para actualizar el activo
  const updateAssetMutation = useMutation({
    mutationFn: (data: AssetFormData) => 
      fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Activo actualizado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setLocation('/admin/assets/inventory');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el activo",
        variant: "destructive",
      });
    },
  });

  // Manejar envío del formulario
  const onSubmit = (data: AssetFormData) => {
    updateAssetMutation.mutate(data);
  };

  // Manejar selección de ubicación en el mapa
  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    form.setValue('latitude', lat.toString());
    form.setValue('longitude', lng.toString());
  };

  // Filtrar subcategorías según categoría seleccionada
  const selectedCategoryId = form.watch('categoryId');
  const selectedParkId = form.watch('parkId');
  
  const subcategories = Array.isArray(categories) ? categories.filter((cat: any) => 
    cat.parentId === selectedCategoryId
  ) : [];

  const amenitiesByPark = Array.isArray(amenities) ? amenities.filter((amenity: any) => 
    amenity.parkId === selectedParkId
  ) : [];

  const isLoading = loadingParks || loadingCategories || loadingAmenities || loadingUsers || loadingAsset;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">Cargando datos del activo...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!asset) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center text-red-600">No se encontró el activo especificado</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>Editar Activo - ParkSys</title>
      </Helmet>
      
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/admin/assets/inventory')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inventario
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Editar Activo</h1>
          <p className="text-gray-600 mt-2">
            Actualiza la información completa del activo
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* SECCIÓN 1: IDENTIFICACIÓN */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Identificación
                </CardTitle>
                <CardDescription>
                  Información básica de identificación del activo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Activo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Banco de madera" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Serie</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: BM-001-2024" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría Principal *</FormLabel>
                        <Select 
                          value={field.value ? field.value.toString() : ''} 
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            form.setValue('subcategoryId', null);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(categories) ? categories.filter((cat: any) => !cat.parentId).map((category: any) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            )) : null}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subcategoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategoría</FormLabel>
                        <Select 
                          value={field.value ? field.value.toString() : ''} 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                          disabled={!selectedCategoryId || subcategories.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una subcategoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subcategories.map((subcategory: any) => (
                              <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                                {subcategory.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="customAssetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Personalizado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: MOBUR-001" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>
                          Identificador personalizado del activo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe el activo, sus características y función..."
                          className="min-h-[100px]"
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* SECCIÓN 2: UBICACIÓN */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ubicación
                </CardTitle>
                <CardDescription>
                  Ubicación física del activo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="parkId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parque *</FormLabel>
                        <Select 
                          value={field.value ? field.value.toString() : ''} 
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            form.setValue('amenityId', null);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un parque" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(parks) ? parks.map((park: any) => (
                              <SelectItem key={park.id} value={park.id.toString()}>
                                {park.name}
                              </SelectItem>
                            )) : null}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amenityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amenidad/Área Específica</FormLabel>
                        <Select 
                          value={field.value ? field.value.toString() : ''} 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                          disabled={!selectedParkId || amenitiesByPark.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una amenidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {amenitiesByPark.map((amenity: any) => (
                              <SelectItem key={amenity.id} value={amenity.id.toString()}>
                                {amenity.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="locationDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción de Ubicación</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe la ubicación exacta dentro del parque..."
                          className="min-h-[80px]"
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitud</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="19.432608" 
                            {...field} 
                            value={field.value || ''}
                            onChange={(e) => {
                              field.onChange(e);
                              const lat = parseFloat(e.target.value);
                              const lng = parseFloat(form.getValues('longitude') || '0');
                              if (!isNaN(lat) && !isNaN(lng)) {
                                setSelectedLocation([lat, lng]);
                                setMapPosition([lat, lng]);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitud</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="-99.133209" 
                            {...field} 
                            value={field.value || ''}
                            onChange={(e) => {
                              field.onChange(e);
                              const lng = parseFloat(e.target.value);
                              const lat = parseFloat(form.getValues('latitude') || '0');
                              if (!isNaN(lat) && !isNaN(lng)) {
                                setSelectedLocation([lat, lng]);
                                setMapPosition([lat, lng]);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Mapa interactivo */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium">Seleccionar Ubicación en el Mapa</h4>
                    <p className="text-sm text-gray-600">Haz clic en el mapa para establecer las coordenadas</p>
                  </div>
                  <div className="h-96 w-full">
                    <GoogleMapComponent
                      position={selectedLocation}
                      onLocationSelect={handleLocationSelect}
                      height="384px"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECCIÓN 3: ESPECIFICACIONES TÉCNICAS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Especificaciones Técnicas
                </CardTitle>
                <CardDescription>
                  Detalles técnicos y de fabricación del activo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fabricante</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: MueblesPark SA" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Banco-Urban-2024" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="serialNumberTech"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Serie Técnico</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de serie del fabricante" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Madera tratada, metal galvanizado" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dimensionsCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimensiones/Capacidad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 180cm x 45cm x 80cm / Capacidad: 3 personas" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* SECCIÓN 4: CICLO DE VIDA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Ciclo de Vida
                </CardTitle>
                <CardDescription>
                  Información sobre el estado y mantenimiento del activo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ASSET_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condición *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona la condición" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ASSET_CONDITIONS.map((condition) => (
                              <SelectItem key={condition.value} value={condition.value}>
                                {condition.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="installationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Instalación</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastInspectionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Última Inspección</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="maintenanceFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frecuencia de Mantenimiento</FormLabel>
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona frecuencia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MAINTENANCE_FREQUENCIES.map((freq) => (
                              <SelectItem key={freq.value} value={freq.value}>
                                {freq.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastMaintenanceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Último Mantenimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nextMaintenanceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Próximo Mantenimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="estimatedUsefulLife"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vida Útil Estimada (años)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ej: 10" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* SECCIÓN 5: COSTOS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Costos
                </CardTitle>
                <CardDescription>
                  Información financiera del activo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="acquisitionCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo de Adquisición</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            step="0.01"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Actual</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            step="0.01"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acquisitionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Adquisición</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="financingSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuente de Financiamiento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Presupuesto municipal, Fondos federales..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* SECCIÓN 6: CONTROL Y GESTIÓN */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Control y Gestión
                </CardTitle>
                <CardDescription>
                  Asignación de responsabilidades y gestión del activo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="responsiblePersonId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Persona Responsable</FormLabel>
                        <Select 
                          value={field.value ? field.value.toString() : ''} 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un responsable" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(users) ? users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullName || user.username}
                              </SelectItem>
                            )) : null}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Área Asignada</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Mantenimiento, Jardinería..." {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="maintenanceManualUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manual de Mantenimiento (URL)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="qrCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código QR</FormLabel>
                        <FormControl>
                          <Input placeholder="Código QR del activo" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="usagePolicies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Políticas de Uso</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe las políticas y restricciones de uso..."
                          className="min-h-[100px]"
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* SECCIÓN 7: NOTAS ADICIONALES */}
            <Card>
              <CardHeader>
                <CardTitle>Notas Adicionales</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones y Notas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Información adicional relevante sobre el activo..."
                          className="min-h-[120px]"
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4 pb-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/admin/assets/inventory')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateAssetMutation.isPending}
              >
                {updateAssetMutation.isPending ? (
                  <>Actualizando...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Actualizar Activo
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}

