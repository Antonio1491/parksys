/**
 * GESTOR COMPLETO DE AMENIDADES PARA PARQUES - INTERFAZ DE DOS COLUMNAS
 * ====================================================================
 * 
 * Componente integral para gestión de amenidades y servicios de parques
 * con funcionalidades mejoradas de agregar, editar y eliminar amenidades
 * mediante una interfaz intuitiva de dos columnas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MapPin, Package } from 'lucide-react';
import AmenityIcon from './AmenityIcon';

/**
 * INTERFACES PARA TIPADO TYPESCRIPT
 * ================================
 */

interface ParkAmenity {
  id: number;
  parkId: number;
  amenityId: number;
  moduleName?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  surfaceArea?: string;
  status: string;
  description?: string;
  amenityName: string;
  amenityIcon: string;
  customIconUrl?: string;
}

interface Amenity {
  id: number;
  name: string;
  icon: string;
  category?: string;
}

interface ParkAmenitiesManagerProps {
  parkId: number;
}

const statusTranslations: Record<string, string> = {
  'activo': 'Activo',
  'inactivo': 'Inactivo',
  'mantenimiento': 'En Mantenimiento'
};

export default function ParkAmenitiesManager({ parkId }: ParkAmenitiesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para modales
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<ParkAmenity | null>(null);
  const [selectedAmenityId, setSelectedAmenityId] = useState<number | null>(null);
  const [moduleName, setModuleName] = useState('');
  const [surfaceArea, setSurfaceArea] = useState('');
  const [description, setDescription] = useState('');

  // Consulta para obtener amenidades del parque
  const { data: parkAmenities = [], isLoading: amenitiesLoading, error: amenitiesError } = useQuery<ParkAmenity[]>({
    queryKey: [`/api/parks/${parkId}/amenities`],
    queryFn: async () => {
      console.log('🔍 FRONTEND: Cargando amenidades para parque', parkId);
      const response = await fetch(`/api/parks/${parkId}/amenities`, {
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) throw new Error('Error cargando amenidades');
      const data = await response.json();
      console.log('✅ FRONTEND: Amenidades cargadas:', data);
      return data;
    },
    enabled: !!parkId
  });

  // Consulta para obtener todas las amenidades disponibles
  const { data: availableAmenities = [], isLoading: availableLoading } = useQuery<Amenity[]>({
    queryKey: ['/api/amenities'],
    queryFn: async () => {
      console.log('🔍 FRONTEND: Cargando amenidades disponibles...');
      const response = await fetch('/api/amenities', {
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) throw new Error('Error cargando amenidades disponibles');
      const data = await response.json();
      console.log('✅ FRONTEND: Amenidades disponibles cargadas:', data);
      return data;
    }
  });

  // Mutación para agregar amenidad
  const addAmenityMutation = useMutation({
    mutationFn: async (data: { amenityId: number; moduleName: string; surfaceArea: string | null; description: string | null }) => {
      const response = await fetch(`/api/parks/${parkId}/amenities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Error agregando amenidad');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/amenities`] });
      toast({
        title: "Amenidad agregada",
        description: "La amenidad se agregó correctamente al parque",
      });
      setSelectedAmenityId(null);
      setModuleName('');
      setSurfaceArea('');
      setDescription('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo agregar la amenidad",
        variant: "destructive",
      });
    }
  });

  // Mutación para actualizar amenidad
  const updateAmenityMutation = useMutation({
    mutationFn: async ({ parkAmenityId, data }: { parkAmenityId: number; data: any }) => {
      const response = await fetch(`/api/park-amenities/${parkAmenityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Error actualizando amenidad');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/amenities`] });
      setIsEditDialogOpen(false);
      setEditingAmenity(null);
      toast({
        title: "Amenidad actualizada",
        description: "La amenidad se actualizó correctamente",
      });
    }
  });

  // Mutación para eliminar amenidad
  const removeAmenityMutation = useMutation({
    mutationFn: async (parkAmenityId: number) => {
      const response = await fetch(`/api/parks/${parkId}/amenities/${parkAmenityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer direct-token-1750522117022',
          'X-User-Id': '1',
          'X-User-Role': 'super_admin'
        }
      });
      if (!response.ok) throw new Error('Error eliminando amenidad');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/amenities`] });
      toast({
        title: "Amenidad eliminada",
        description: "La amenidad se eliminó correctamente del parque",
      });
    }
  });

  const handleEditAmenity = (amenity: ParkAmenity) => {
    setEditingAmenity(amenity);
    setModuleName(amenity.moduleName || '');
    setSurfaceArea(amenity.surfaceArea || '');
    setDescription(amenity.description || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdateAmenity = () => {
    if (!editingAmenity) return;

    const updateData = {
      moduleName: moduleName || null,
      surfaceArea: surfaceArea || null,
      description: description || null
    };

    updateAmenityMutation.mutate({
      parkAmenityId: editingAmenity.id,
      data: updateData
    });
  };

  const handleRemoveAmenity = (parkAmenityId: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta amenidad del parque?')) {
      removeAmenityMutation.mutate(parkAmenityId);
    }
  };

  // Función para agregar amenidad rápidamente
  const handleQuickAddAmenity = (amenityId: number) => {
    const updateData = {
      amenityId,
      moduleName: '',
      surfaceArea: null,
      description: null
    };

    addAmenityMutation.mutate(updateData);
  };

  console.log('🔍 AMENITIES MANAGER - Renderizando con:', {
    parkId,
    amenitiesCount: parkAmenities.length,
    amenitiesLoading,
    amenitiesError: amenitiesError?.message || null,
    availableCount: availableAmenities.length
  });

  if (amenitiesLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Cargando amenidades...</p>
      </div>
    );
  }

  if (amenitiesError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error cargando amenidades: {amenitiesError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Layout de dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Columna izquierda: Amenidades disponibles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {availableAmenities
                .filter(amenity => !parkAmenities.some(pa => pa.amenityId === amenity.id))
                .map((amenity) => (
                  <div
                    key={amenity.id}
                    onClick={() => handleQuickAddAmenity(amenity.id)}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-100 hover:border-gray-100 cursor-pointer transition-colors"
                  >
                    <AmenityIcon 
                      name={amenity.name}
                      iconType={amenity.icon === 'custom' ? 'custom' : 'system'}
                      customIconUrl={amenity.icon === 'custom' ? `/uploads/amenity-icon-${amenity.id}.png` : undefined}
                      size={32}
                    />
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{amenity.name}</h5>
                      <p className="text-xs text-gray-500">Click para agregar</p>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              {availableAmenities.filter(amenity => !parkAmenities.some(pa => pa.amenityId === amenity.id)).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Todas las amenidades disponibles ya están asignadas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Columna derecha: Amenidades del parque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Asignadas ({parkAmenities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {parkAmenities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No hay amenidades asignadas</p>
                  <p className="text-xs mt-1">Agrega amenidades desde la lista de la izquierda</p>
                </div>
              ) : (
                parkAmenities.map((amenity, index) => (
                  <div
                    key={`${amenity.id}-${amenity.amenityId}-${index}`}
                    className="flex items-center gap-3 p-3 border rounded-lg border-green-200"
                  >
                    <AmenityIcon 
                      name={amenity.amenityName}
                      iconType={amenity.amenityIcon === 'custom' ? 'custom' : 'system'}
                      customIconUrl={amenity.customIconUrl}
                      size={32}
                    />
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{amenity.amenityName}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {statusTranslations[amenity.status as keyof typeof statusTranslations] || amenity.status}
                        </Badge>
                        {amenity.moduleName && (
                          <span className="text-xs text-gray-500">📍 {amenity.moduleName}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveAmenity(amenity.id)}
                        disabled={removeAmenityMutation.isPending}
                      >
                        <Trash2 className="h-4 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Amenidad</DialogTitle>
          </DialogHeader>
          {editingAmenity && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <AmenityIcon 
                  name={editingAmenity.amenityName}
                  iconType={editingAmenity.amenityIcon === 'custom' ? 'custom' : 'system'}
                  customIconUrl={editingAmenity.customIconUrl}
                  size={32}
                />
                <div>
                  <h5 className="font-medium">{editingAmenity.amenityName}</h5>
                  <p className="text-sm text-gray-600 capitalize">
                    General
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Módulo/Ubicación</label>
                <Input
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  placeholder="Ej: Zona Norte, Entrada Principal..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Superficie (m²)</label>
                <Input
                  value={surfaceArea}
                  onChange={(e) => setSurfaceArea(e.target.value)}
                  placeholder="Ej: 150.5"
                  type="number"
                  step="0.1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Descripción</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción adicional..."
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleUpdateAmenity}
                  disabled={updateAmenityMutation.isPending}
                  className="flex-1"
                >
                  {updateAmenityMutation.isPending ? 'Actualizando...' : 'Actualizar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}