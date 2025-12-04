/**
 * ============================================================================
 * HOOK GENÉRICO: useResourceManager
 * ============================================================================
 * 
 * Hook reutilizable para gestionar recursos asignados/disponibles en parques
 * Aplica el patrón establecido en ParkAmenitiesManager a cualquier recurso
 * 
 * CASOS DE USO:
 * - Amenidades (ParkAmenitiesManager) ✅
 * - Especies de árboles (ParkTreeSpeciesManager)
 * - Voluntarios (ParkVolunteersManager)
 * - Activos (ParkAssetsManager)
 * - Instructores (ParkInstructorsManager)
 * 
 * @author ParkSys Team
 * @version 1.0
 */

import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Configuración de endpoints para el resource manager
 */
interface ResourceManagerEndpoints {
  /** Endpoint para listar recursos asignados: `/api/parks/:id/resources` */
  assigned: string;

  /** Endpoint para listar recursos disponibles: `/api/resources` */
  available: string;

  /** Endpoint para crear asignación: `/api/parks/:id/resources` */
  create: string;

  /** Endpoint para actualizar asignación: `/api/park-resources/:id` */
  update: string;

  /** Endpoint para eliminar asignación: `/api/parks/:parkId/resources/:id` */
  delete: string;
}

/**
 * Mensajes personalizables para toasts
 */
interface ResourceManagerMessages {
  addSuccess?: string;
  addError?: string;
  updateSuccess?: string;
  updateError?: string;
  deleteSuccess?: string;
  deleteError?: string;
  loadingError?: string;
}

/**
 * Configuración del resource manager
 */
interface ResourceManagerConfig<TAssigned, TAvailable> {
  /** ID del parque (parent resource) */
  parentId: number;

  /** Configuración de endpoints */
  endpoints: ResourceManagerEndpoints;

  /** Mensajes personalizables (opcional) */
  messages?: ResourceManagerMessages;

  /** Función para extraer el ID del recurso desde item asignado */
  getResourceId: (assigned: TAssigned) => number;

  /** Función para obtener el ID del item disponible */
  getAvailableId: (available: TAvailable) => number;

  /** Query key para invalidación personalizada (opcional) */
  customQueryKeys?: QueryKey[];
}

/**
 * Resultado del hook useResourceManager
 */
interface UseResourceManagerResult<TAssigned, TAvailable, TCreateData, TUpdateData> {
  // Data
  assigned: TAssigned[];
  available: TAvailable[];
  unassigned: TAvailable[];

  // Loading states
  isLoading: boolean;
  isLoadingAssigned: boolean;
  isLoadingAvailable: boolean;

  // Error states
  error: Error | null;

  // Mutations
  add: (data: TCreateData) => void;
  update: (id: number, data: TUpdateData) => void;
  remove: (id: number) => void;

  // Mutation states
  isAdding: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
}

// ============================================================================
// MENSAJES POR DEFECTO
// ============================================================================

const DEFAULT_MESSAGES: Required<ResourceManagerMessages> = {
  addSuccess: 'Recurso agregado correctamente',
  addError: 'No se pudo agregar el recurso',
  updateSuccess: 'Recurso actualizado correctamente',
  updateError: 'No se pudo actualizar el recurso',
  deleteSuccess: 'Recurso eliminado correctamente',
  deleteError: 'No se pudo eliminar el recurso',
  loadingError: 'Error al cargar recursos',
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook genérico para gestionar recursos asignados/disponibles
 * 
 * @example
 * // Para amenidades de parques:
 * const amenitiesManager = useResourceManager({
 *   parentId: parkId,
 *   endpoints: {
 *     assigned: `/api/parks/${parkId}/amenities`,
 *     available: '/api/amenities',
 *     create: `/api/parks/${parkId}/amenities`,
 *     update: '/api/park-amenities',
 *     delete: `/api/parks/${parkId}/amenities`,
 *   },
 *   messages: {
 *     addSuccess: 'Amenidad agregada',
 *     deleteSuccess: 'Amenidad eliminada',
 *   },
 *   getResourceId: (assigned) => assigned.amenityId,
 *   getAvailableId: (available) => available.id,
 * });
 */
export function useResourceManager<
  TAssigned = any,
  TAvailable = any,
  TCreateData = any,
  TUpdateData = any
>(
  config: ResourceManagerConfig<TAssigned, TAvailable>
): UseResourceManagerResult<TAssigned, TAvailable, TCreateData, TUpdateData> {

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    parentId,
    endpoints,
    messages = {},
    getResourceId,
    getAvailableId,
    customQueryKeys = [],
  } = config;

  // Merge con mensajes por defecto
  const msgs = { ...DEFAULT_MESSAGES, ...messages };

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Query: Recursos asignados
  const {
    data: assigned = [],
    isLoading: isLoadingAssigned,
    error: assignedError,
  } = useQuery<TAssigned[]>({
    queryKey: [endpoints.assigned],
    enabled: !!parentId,
  });

  // Query: Recursos disponibles
  const {
    data: available = [],
    isLoading: isLoadingAvailable,
  } = useQuery<TAvailable[]>({
    queryKey: [endpoints.available],
  });

  // Calcular recursos sin asignar (memoizado)
  const unassigned = useMemo(() => {
    const assignedResourceIds = new Set(assigned.map(getResourceId));
    return available.filter(item => !assignedResourceIds.has(getAvailableId(item)));
  }, [assigned, available, getResourceId, getAvailableId]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  // Mutation: Agregar recurso
  const addMutation = useMutation({
    mutationFn: async (data: TCreateData) => {
      return apiRequest(endpoints.create, {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      // Invalidar queries principales
      queryClient.invalidateQueries({ queryKey: [endpoints.assigned] });
      queryClient.invalidateQueries({ queryKey: [endpoints.available] });

      // Invalidar queries personalizadas
      customQueryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      toast({
        title: "Éxito",
        description: msgs.addSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || msgs.addError,
        variant: "destructive",
      });
    },
  });

  // Mutation: Actualizar recurso
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TUpdateData }) => {
      return apiRequest(`${endpoints.update}/${id}`, {
        method: 'PUT',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.assigned] });

      customQueryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      toast({
        title: "Éxito",
        description: msgs.updateSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || msgs.updateError,
        variant: "destructive",
      });
    },
  });

  // Mutation: Eliminar recurso
  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`${endpoints.delete}/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.assigned] });
      queryClient.invalidateQueries({ queryKey: [endpoints.available] });

      customQueryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      toast({
        title: "Éxito",
        description: msgs.deleteSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || msgs.deleteError,
        variant: "destructive",
      });
    },
  });

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Data
    assigned,
    available,
    unassigned,

    // Loading states
    isLoading: isLoadingAssigned || isLoadingAvailable,
    isLoadingAssigned,
    isLoadingAvailable,

    // Error states
    error: assignedError as Error | null,

    // Mutations
    add: addMutation.mutate,
    update: (id: number, data: TUpdateData) => updateMutation.mutate({ id, data }),
    remove: removeMutation.mutate,

    // Mutation states
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

// ============================================================================
// EJEMPLOS DE USO
// ============================================================================

/**
 * EJEMPLO 1: Amenidades de Parques
 */
export function useParkAmenitiesManager(parkId: number) {
  return useResourceManager<
    ParkAmenity,
    Amenity,
    CreateAmenityData,
    UpdateAmenityData
  >({
    parentId: parkId,
    endpoints: {
      assigned: `/api/parks/${parkId}/amenities`,
      available: '/api/amenities',
      create: `/api/parks/${parkId}/amenities`,
      update: '/api/park-amenities',
      delete: `/api/parks/${parkId}/amenities`,
    },
    messages: {
      addSuccess: 'Amenidad agregada al parque',
      deleteSuccess: 'Amenidad eliminada del parque',
    },
    getResourceId: (assigned) => assigned.amenityId,
    getAvailableId: (available) => available.id,
  });
}

// Types para el ejemplo
interface ParkAmenity {
  id: number;
  amenityId: number;
  parkId: number;
  amenityName: string;
}

interface Amenity {
  id: number;
  name: string;
}

interface CreateAmenityData {
  amenityId: number;
  moduleName?: string;
}

interface UpdateAmenityData {
  moduleName?: string;
  surfaceArea?: string;
}

/**
 * EJEMPLO 2: Especies de Árboles
 */
export function useParkTreeSpeciesManager(parkId: number) {
  return useResourceManager<
    ParkTreeSpecies,
    TreeSpecies,
    CreateTreeSpeciesData,
    UpdateTreeSpeciesData
  >({
    parentId: parkId,
    endpoints: {
      assigned: `/api/parks/${parkId}/tree-species`,
      available: '/api/tree-species',
      create: `/api/parks/${parkId}/tree-species`,
      update: '/api/park-tree-species',
      delete: `/api/parks/${parkId}/tree-species`,
    },
    messages: {
      addSuccess: 'Especie agregada al parque',
      updateSuccess: 'Especie actualizada',
      deleteSuccess: 'Especie eliminada del parque',
    },
    getResourceId: (assigned) => assigned.speciesId,
    getAvailableId: (available) => available.id,
  });
}

// Types para el ejemplo
interface ParkTreeSpecies {
  id: number;
  speciesId: number;
  parkId: number;
  commonName: string;
}

interface TreeSpecies {
  id: number;
  commonName: string;
  scientificName: string;
}

interface CreateTreeSpeciesData {
  speciesId: number;
  recommendedQuantity?: number;
}

interface UpdateTreeSpeciesData {
  currentQuantity?: number;
  notes?: string;
}

/**
 * EJEMPLO 3: Voluntarios de Parque
 */
export function useParkVolunteersManager(parkId: number) {
  return useResourceManager<
    ParkVolunteer,
    Volunteer,
    CreateVolunteerData,
    UpdateVolunteerData
  >({
    parentId: parkId,
    endpoints: {
      assigned: `/api/parks/${parkId}/volunteers`,
      available: '/api/volunteers',
      create: `/api/parks/${parkId}/volunteers`,
      update: '/api/park-volunteers',
      delete: `/api/parks/${parkId}/volunteers`,
    },
    messages: {
      addSuccess: 'Voluntario asignado al parque',
      deleteSuccess: 'Voluntario removido del parque',
    },
    getResourceId: (assigned) => assigned.volunteerId,
    getAvailableId: (available) => available.id,
  });
}

// Types para el ejemplo
interface ParkVolunteer {
  id: number;
  volunteerId: number;
  parkId: number;
  volunteerName: string;
}

interface Volunteer {
  id: number;
  name: string;
  email: string;
}

interface CreateVolunteerData {
  volunteerId: number;
  assignedRole?: string;
}

interface UpdateVolunteerData {
  assignedRole?: string;
  schedule?: string;
}

// ============================================================================
// EXPORT
// ============================================================================

export default useResourceManager;