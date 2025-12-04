/**
 * ============================================================================
 * GESTOR DE AMENIDADES PARA PARQUES - VERSIÓN REFACTORIZADA
 * ============================================================================
 * 
 * Componente optimizado para gestión de amenidades de parques con:
 * - Autenticación centralizada vía apiRequest
 * - Arquitectura limpia y mantenible
 * - Interfaz de dos columnas intuitiva
 * - Sin código hardcodeado
 * 
 * CAMBIOS PRINCIPALES:
 * ✅ Eliminados 7 headers hardcodeados
 * ✅ Migrado de fetch directo a apiRequest
 * ✅ Hooks personalizados para lógica reutilizable
 * ✅ Mejor manejo de estados y errores
 * ✅ Optimización de re-renders
 * 
 * @author ParkSys Team
 * @version 2.0 - Refactored
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MapPin, Package, Loader2 } from 'lucide-react';
import AmenityIcon from './AmenityIcon';
import { apiRequest } from '@/lib/queryClient';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

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

interface AmenityFormData {
  moduleName: string;
  surfaceArea: string;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_TRANSLATIONS: Record<string, string> = {
  'activo': 'Activo',
  'inactivo': 'Inactivo',
  'mantenimiento': 'En Mantenimiento'
};

const EMPTY_FORM_DATA: AmenityFormData = {
  moduleName: '',
  surfaceArea: '',
  description: ''
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook para gestionar amenidades del parque
 * Centraliza queries y mutations relacionadas
 */
function useParkAmenities(parkId: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query: Amenidades del parque
  const {
    data: parkAmenities = [],
    isLoading: isLoadingPark,
    error: parkError
  } = useQuery<ParkAmenity[]>({
    queryKey: [`/api/parks/${parkId}/amenities`],
    enabled: !!parkId,
  });

  // Query: Amenidades disponibles
  const {
    data: availableAmenities = [],
    isLoading: isLoadingAvailable
  } = useQuery<Amenity[]>({
    queryKey: ['/api/amenities'],
  });

  // Mutation: Agregar amenidad
  const addAmenityMutation = useMutation({
    mutationFn: async (data: {
      amenityId: number;
      moduleName: string;
      surfaceArea: string | null;
      description: string | null;
    }) => {
      return apiRequest(`/api/parks/${parkId}/amenities`, {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/amenities`] });
      toast({
        title: "Amenidad agregada",
        description: "La amenidad se agregó correctamente al parque",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar la amenidad",
        variant: "destructive",
      });
    }
  });

  // Mutation: Actualizar amenidad
  const updateAmenityMutation = useMutation({
    mutationFn: async ({
      parkAmenityId,
      data
    }: {
      parkAmenityId: number;
      data: Partial<AmenityFormData>;
    }) => {
      return apiRequest(`/api/park-amenities/${parkAmenityId}`, {
        method: 'PUT',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/amenities`] });
      toast({
        title: "Amenidad actualizada",
        description: "La amenidad se actualizó correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la amenidad",
        variant: "destructive",
      });
    }
  });

  // Mutation: Eliminar amenidad
  const removeAmenityMutation = useMutation({
    mutationFn: async (parkAmenityId: number) => {
      return apiRequest(`/api/parks/${parkId}/amenities/${parkAmenityId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parks/${parkId}/amenities`] });
      toast({
        title: "Amenidad eliminada",
        description: "La amenidad se eliminó correctamente del parque",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la amenidad",
        variant: "destructive",
      });
    }
  });

  // Filtrar amenidades disponibles (que no estén asignadas)
  const unassignedAmenities = useMemo(() => {
    const assignedIds = new Set(parkAmenities.map(pa => pa.amenityId));
    return availableAmenities.filter(amenity => !assignedIds.has(amenity.id));
  }, [parkAmenities, availableAmenities]);

  return {
    parkAmenities,
    unassignedAmenities,
    isLoading: isLoadingPark || isLoadingAvailable,
    error: parkError,
    addAmenity: addAmenityMutation.mutate,
    updateAmenity: updateAmenityMutation.mutate,
    removeAmenity: removeAmenityMutation.mutate,
    isAdding: addAmenityMutation.isPending,
    isUpdating: updateAmenityMutation.isPending,
    isRemoving: removeAmenityMutation.isPending,
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Diálogo para editar detalles de amenidad
 */
interface EditAmenityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  amenity: ParkAmenity;
  onSave: (parkAmenityId: number, data: Partial<AmenityFormData>) => void;
  isSaving: boolean;
}

function EditAmenityDialog({
  isOpen,
  onClose,
  amenity,
  onSave,
  isSaving
}: EditAmenityDialogProps) {
  const [formData, setFormData] = useState<AmenityFormData>({
    moduleName: amenity.moduleName || '',
    surfaceArea: amenity.surfaceArea || '',
    description: amenity.description || ''
  });

  const handleSave = () => {
    const updateData = {
      moduleName: formData.moduleName || null,
      surfaceArea: formData.surfaceArea || null,
      description: formData.description || null
    };
    onSave(amenity.id, updateData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Amenidad</DialogTitle>
          <DialogDescription>
            Modifica los detalles de {amenity.amenityName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="moduleName">Nombre del Módulo</Label>
            <Input
              id="moduleName"
              value={formData.moduleName}
              onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
              placeholder="Ej: Módulo A, Sección Norte..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surfaceArea">Superficie (m²)</Label>
            <Input
              id="surfaceArea"
              value={formData.surfaceArea}
              onChange={(e) => setFormData({ ...formData, surfaceArea: e.target.value })}
              placeholder="Ej: 150m²"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalles adicionales..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Card de amenidad disponible (columna izquierda)
 */
interface AvailableAmenityCardProps {
  amenity: Amenity;
  onAdd: (amenityId: number) => void;
  isAdding: boolean;
}

function AvailableAmenityCard({ amenity, onAdd, isAdding }: AvailableAmenityCardProps) {
  return (
    <div
      onClick={() => !isAdding && onAdd(amenity.id)}
      className={`
        flex items-center gap-3 p-3 border rounded-lg 
        transition-all duration-200
        ${isAdding 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-gray-50 hover:border-[#00a587] cursor-pointer hover:shadow-sm'
        }
      `}
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
      {isAdding ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : (
        <Plus className="h-4 w-4 text-gray-400" />
      )}
    </div>
  );
}

/**
 * Card de amenidad asignada (columna derecha)
 */
interface AssignedAmenityCardProps {
  amenity: ParkAmenity;
  onEdit: (amenity: ParkAmenity) => void;
  onRemove: (parkAmenityId: number) => void;
  isRemoving: boolean;
}

function AssignedAmenityCard({ 
  amenity, 
  onEdit, 
  onRemove, 
  isRemoving 
}: AssignedAmenityCardProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que deseas eliminar esta amenidad del parque?')) {
      onRemove(amenity.id);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg border-[#ceefea] bg-[#ceefea]/20 hover:bg-[#ceefea]/30 transition-colors">
      <AmenityIcon
        name={amenity.amenityName}
        iconType={amenity.amenityIcon === 'custom' ? 'custom' : 'system'}
        customIconUrl={amenity.customIconUrl}
        size={32}
      />
      <div className="flex-1 min-w-0">
        <h5 className="font-medium text-gray-900">{amenity.amenityName}</h5>
        {amenity.moduleName && (
          <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />
            {amenity.moduleName}
          </p>
        )}
        {amenity.surfaceArea && (
          <p className="text-xs text-gray-500 mt-0.5">
            {amenity.surfaceArea}
          </p>
        )}
        <Badge variant="outline" className="mt-1 text-xs">
          {STATUS_TRANSLATIONS[amenity.status] || amenity.status}
        </Badge>
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(amenity)}
          disabled={isRemoving}
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRemove}
          disabled={isRemoving}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ParkAmenitiesManager({ parkId }: ParkAmenitiesManagerProps) {
  const [editingAmenity, setEditingAmenity] = useState<ParkAmenity | null>(null);

  const {
    parkAmenities,
    unassignedAmenities,
    isLoading,
    error,
    addAmenity,
    updateAmenity,
    removeAmenity,
    isAdding,
    isUpdating,
    isRemoving,
  } = useParkAmenities(parkId);

  // Handler optimizado con useCallback
  const handleQuickAddAmenity = useCallback((amenityId: number) => {
    addAmenity({
      amenityId,
      moduleName: '',
      surfaceArea: null,
      description: null
    });
  }, [addAmenity]);

  const handleEditAmenity = useCallback((amenity: ParkAmenity) => {
    setEditingAmenity(amenity);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setEditingAmenity(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#00a587] mx-auto" />
        <p className="mt-2 text-gray-600">Cargando amenidades...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-600 font-medium">Error cargando amenidades</p>
          <p className="text-red-500 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Layout de dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COLUMNA IZQUIERDA: Amenidades disponibles */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="bg-gray-50">
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <Package className="h-5 w-5" />
              Disponibles ({unassignedAmenities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {unassignedAmenities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Todas las amenidades asignadas</p>
                  <p className="text-sm mt-1">
                    No hay más amenidades disponibles para agregar
                  </p>
                </div>
              ) : (
                unassignedAmenities.map((amenity) => (
                  <AvailableAmenityCard
                    key={amenity.id}
                    amenity={amenity}
                    onAdd={handleQuickAddAmenity}
                    isAdding={isAdding}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* COLUMNA DERECHA: Amenidades asignadas */}
        <Card className="border-2 border-[#00a587]">
          <CardHeader className="bg-[#ceefea]">
            <CardTitle className="flex items-center gap-2 text-[#00444f]">
              <MapPin className="h-5 w-5" />
              Asignadas ({parkAmenities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {parkAmenities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Sin amenidades asignadas</p>
                  <p className="text-sm mt-1">
                    Selecciona amenidades de la lista de la izquierda
                  </p>
                </div>
              ) : (
                parkAmenities.map((amenity) => (
                  <AssignedAmenityCard
                    key={`${amenity.id}-${amenity.amenityId}`}
                    amenity={amenity}
                    onEdit={handleEditAmenity}
                    onRemove={removeAmenity}
                    isRemoving={isRemoving}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de edición */}
      {editingAmenity && (
        <EditAmenityDialog
          isOpen={!!editingAmenity}
          onClose={handleCloseEditDialog}
          amenity={editingAmenity}
          onSave={updateAmenity}
          isSaving={isUpdating}
        />
      )}
    </div>
  );
}