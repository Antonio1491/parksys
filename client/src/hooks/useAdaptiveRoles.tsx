import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import useAdaptiveModules from './useAdaptiveModules';
import { useToast } from '@/hooks/use-toast';

// Tipos para el sistema de roles híbrido
export interface AdaptiveRole {
  id: number;
  name: string;
  slug: string;
  description?: string;
  level: number;
  color?: string;
  permissions: Record<string, string[]>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleCreationData {
  name: string;
  slug: string;
  description?: string;
  level: number;
  color: string;
  permissions: Record<string, string[]>;
  isActive: boolean;
}

export interface RoleUpdateData extends Partial<RoleCreationData> {
  id: number;
}

// Hook principal para gestión de roles
export const useAdaptiveRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { modules, flatModules } = useAdaptiveModules();
  
  // Query para obtener todos los roles
  const { data: roles = [], isLoading, error, refetch } = useQuery<AdaptiveRole[]>({
    queryKey: ['/api/roles'],
  });

  // Mutation para crear rol
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: RoleCreationData) => {
      return apiRequest('/api/roles', {
        method: 'POST',
        data: roleData,
      });
    },
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      toast({
        title: "Rol creado",
        description: `El rol "${newRole.name}" se ha creado exitosamente`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear rol",
        description: error.message || "No se pudo crear el rol",
        variant: "destructive",
      });
    }
  });

  // Mutation para actualizar rol
  const updateRoleMutation = useMutation({
    mutationFn: async (roleData: RoleUpdateData) => {
      return apiRequest(`/api/roles/${roleData.id}`, {
        method: 'PUT',
        data: roleData,
      });
    },
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      toast({
        title: "Rol actualizado",
        description: `El rol "${updatedRole.name}" se ha actualizado exitosamente`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar rol",
        description: error.message || "No se pudo actualizar el rol",
        variant: "destructive",
      });
    }
  });

  // Mutation para eliminar rol
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      return apiRequest(`/api/roles/${roleId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      toast({
        title: "Rol eliminado",
        description: "El rol se ha eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar rol",
        description: error.message || "No se pudo eliminar el rol",
        variant: "destructive",
      });
    }
  });

  // Funciones utilitarias memoizadas
  const roleUtils = useMemo(() => {
    // Obtener rol por ID
    const getRoleById = (id: number): AdaptiveRole | undefined => {
      return roles.find(role => role.id === id);
    };

    // Obtener rol por slug
    const getRoleBySlug = (slug: string): AdaptiveRole | undefined => {
      return roles.find(role => role.slug === slug);
    };

    // Obtener roles por nivel
    const getRolesByLevel = (level: number): AdaptiveRole[] => {
      return roles.filter(role => role.level === level);
    };

    // Obtener roles activos
    const getActiveRoles = (): AdaptiveRole[] => {
      return roles.filter(role => role.isActive);
    };

    // Validar jerarquía de roles
    const canRoleAccessRole = (sourceRole: AdaptiveRole, targetRole: AdaptiveRole): boolean => {
      return sourceRole.level <= targetRole.level;
    };

    // Generar estadísticas de roles
    const getRoleStats = () => {
      const totalRoles = roles.length;
      const activeRoles = roles.filter(r => r.isActive).length;
      const inactiveRoles = totalRoles - activeRoles;
      
      const levelDistribution = roles.reduce((acc, role) => {
        acc[`level_${role.level}`] = (acc[`level_${role.level}`] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalRoles,
        activeRoles,
        inactiveRoles,
        levelDistribution,
        averagePermissions: totalRoles > 0 
          ? roles.reduce((sum, role) => sum + flatModules.filter(moduleId => 
              role.permissions[moduleId] && role.permissions[moduleId].length > 0
            ).length, 0) / totalRoles 
          : 0
      };
    };

    // Validar permisos de rol
    const validateRolePermissions = (permissions: Record<string, string[]>): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      Object.keys(permissions).forEach(moduleId => {
        // Verificar que el módulo exista
        if (!flatModules.includes(moduleId)) {
          errors.push(`Módulo no válido: ${moduleId}`);
        }
        
        // Verificar acciones válidas
        const validActions = ['create', 'read', 'update', 'delete', 'admin'];
        const invalidActions = permissions[moduleId].filter(action => !validActions.includes(action));
        if (invalidActions.length > 0) {
          errors.push(`Acciones no válidas para ${moduleId}: ${invalidActions.join(', ')}`);
        }
      });
      
      return {
        isValid: errors.length === 0,
        errors
      };
    };

    // Generar plantillas de permisos
    const generatePermissionTemplate = (template: 'super' | 'admin' | 'manager' | 'operator' | 'viewer'): Record<string, string[]> => {
      const permissions: Record<string, string[]> = {};
      
      switch (template) {
        case 'super':
          flatModules.forEach(moduleId => {
            permissions[moduleId] = ['admin'];
          });
          break;
          
        case 'admin':
          flatModules.forEach(moduleId => {
            if (moduleId.includes('config-seguridad')) {
              permissions[moduleId] = ['read', 'update']; // No admin para config
            } else {
              permissions[moduleId] = ['create', 'read', 'update', 'delete'];
            }
          });
          break;
          
        case 'manager':
          flatModules.forEach(moduleId => {
            if (moduleId.includes('gestion') || moduleId.includes('mkt-comm')) {
              permissions[moduleId] = ['create', 'read', 'update', 'delete'];
            } else if (moduleId.includes('admin-finanzas') || moduleId.includes('om')) {
              permissions[moduleId] = ['read', 'update'];
            } else {
              permissions[moduleId] = ['read'];
            }
          });
          break;
          
        case 'operator':
          flatModules.forEach(moduleId => {
            if (moduleId.includes('gestion.parques') || moduleId.includes('gestion.actividades')) {
              permissions[moduleId] = ['create', 'read', 'update'];
            } else if (moduleId.includes('om')) {
              permissions[moduleId] = ['read', 'update'];
            } else {
              permissions[moduleId] = ['read'];
            }
          });
          break;
          
        case 'viewer':
        default:
          flatModules.forEach(moduleId => {
            permissions[moduleId] = ['read'];
          });
          break;
      }
      
      return permissions;
    };

    return {
      getRoleById,
      getRoleBySlug,
      getRolesByLevel,
      getActiveRoles,
      canRoleAccessRole,
      getRoleStats,
      validateRolePermissions,
      generatePermissionTemplate
    };
  }, [roles, flatModules]);

  return {
    // Data
    roles,
    isLoading,
    error,
    
    // Actions
    createRole: createRoleMutation.mutate,
    updateRole: updateRoleMutation.mutate,
    deleteRole: deleteRoleMutation.mutate,
    refetchRoles: refetch,
    
    // Mutations
    createRoleMutation,
    updateRoleMutation,
    deleteRoleMutation,
    
    // Utilities
    ...roleUtils,
  };
};

// Hook para un rol específico
export const useAdaptiveRole = (roleId: number | string) => {
  const { roles, isLoading, error } = useAdaptiveRoles();
  
  return useMemo(() => {
    const role = typeof roleId === 'number' 
      ? roles.find(r => r.id === roleId)
      : roles.find(r => r.slug === roleId);
    
    return {
      role,
      isLoading,
      error,
      exists: !!role
    };
  }, [roles, roleId, isLoading, error]);
};

// Hook para comparación de roles
export const useRoleComparison = (roleIds: number[]) => {
  const { roles, isLoading, error } = useAdaptiveRoles();
  const { flatModules } = useAdaptiveModules();
  
  return useMemo(() => {
    const selectedRoles = roles.filter(role => roleIds.includes(role.id));
    
    if (selectedRoles.length === 0) {
      return { comparison: null, isLoading, error };
    }
    
    // Comparar permisos
    const comparisonMatrix: Record<string, Record<number, string[]>> = {};
    
    flatModules.forEach(moduleId => {
      comparisonMatrix[moduleId] = {};
      selectedRoles.forEach(role => {
        comparisonMatrix[moduleId][role.id] = role.permissions[moduleId] || [];
      });
    });
    
    // Encontrar permisos comunes y únicos
    const commonPermissions: Record<string, string[]> = {};
    const uniquePermissions: Record<number, Record<string, string[]>> = {};
    
    selectedRoles.forEach(role => {
      uniquePermissions[role.id] = {};
    });
    
    flatModules.forEach(moduleId => {
      const allPermissions = selectedRoles.map(role => role.permissions[moduleId] || []);
      const intersection = allPermissions.reduce((common, current) => 
        common.filter(perm => current.includes(perm))
      );
      
      commonPermissions[moduleId] = intersection;
      
      selectedRoles.forEach(role => {
        const rolePerms = role.permissions[moduleId] || [];
        const uniquePerms = rolePerms.filter(perm => !intersection.includes(perm));
        if (uniquePerms.length > 0) {
          uniquePermissions[role.id][moduleId] = uniquePerms;
        }
      });
    });
    
    return {
      comparison: {
        roles: selectedRoles,
        comparisonMatrix,
        commonPermissions,
        uniquePermissions,
        totalModules: flatModules.length,
        sharedModules: Object.keys(commonPermissions).filter(moduleId => 
          commonPermissions[moduleId].length > 0
        ).length
      },
      isLoading,
      error
    };
  }, [roles, roleIds, flatModules, isLoading, error]);
};

export default useAdaptiveRoles;