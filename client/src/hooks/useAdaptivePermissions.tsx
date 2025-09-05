import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAdaptiveModules from './useAdaptiveModules';

// Tipos para el sistema de permisos híbrido
export interface AdaptivePermissionState {
  permissions: Record<string, string[]>;
  hasPermission: (moduleId: string, action: 'create' | 'read' | 'update' | 'delete' | 'admin') => boolean;
  hasAnyPermission: (moduleId: string) => boolean;
  getModulePermissions: (moduleId: string) => string[];
  isLoading: boolean;
  error: Error | null;
}

export interface PermissionCheck {
  moduleId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'admin';
}

// Hook principal para permisos adaptativos
export const useAdaptivePermissions = (roleId?: number | string): AdaptivePermissionState => {
  const { flatModules } = useAdaptiveModules();
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  
  // Query para obtener permisos del rol
  const { data: rolePermissions, isLoading, error } = useQuery({
    queryKey: ['/api/roles/permissions', roleId],
    enabled: !!roleId,
  });

  // Actualizar permisos cuando cambien los datos
  useEffect(() => {
    if (rolePermissions && typeof rolePermissions === 'object') {
      setPermissions(rolePermissions as Record<string, string[]>);
    }
  }, [rolePermissions]);

  // Funciones memoizadas para verificación de permisos
  const permissionUtils = useMemo(() => {
    const hasPermission = (moduleId: string, action: 'create' | 'read' | 'update' | 'delete' | 'admin'): boolean => {
      const modulePermissions = permissions[moduleId] || [];
      
      // Admin permission grants all access
      if (modulePermissions.includes('admin')) return true;
      
      // Check specific permission
      if (modulePermissions.includes(action)) return true;
      
      // Hierarchy validation: admin > delete > update > create > read
      const hierarchy = ['read', 'create', 'update', 'delete', 'admin'];
      const requestedLevel = hierarchy.indexOf(action);
      const hasHigherLevel = modulePermissions.some(perm => {
        const permLevel = hierarchy.indexOf(perm);
        return permLevel > requestedLevel;
      });
      
      return hasHigherLevel;
    };

    const hasAnyPermission = (moduleId: string): boolean => {
      const modulePermissions = permissions[moduleId] || [];
      return modulePermissions.length > 0;
    };

    const getModulePermissions = (moduleId: string): string[] => {
      return permissions[moduleId] || [];
    };

    return {
      hasPermission,
      hasAnyPermission,
      getModulePermissions
    };
  }, [permissions]);

  return {
    permissions,
    ...permissionUtils,
    isLoading,
    error: error as Error | null
  };
};

// Hook para múltiples verificaciones de permisos
export const useBulkPermissionCheck = (checks: PermissionCheck[], roleId?: number | string) => {
  const { hasPermission, isLoading, error } = useAdaptivePermissions(roleId);
  
  return useMemo(() => {
    const results = checks.reduce((acc, check) => {
      acc[`${check.moduleId}_${check.action}`] = hasPermission(check.moduleId, check.action);
      return acc;
    }, {} as Record<string, boolean>);

    const hasAllPermissions = checks.every(check => hasPermission(check.moduleId, check.action));
    const hasAnyPermission = checks.some(check => hasPermission(check.moduleId, check.action));

    return {
      results,
      hasAllPermissions,
      hasAnyPermission,
      isLoading,
      error
    };
  }, [checks, hasPermission, isLoading, error]);
};

// Hook para permisos de submódulos específicos
export const useSubmodulePermissions = (parentModuleId: string, roleId?: number | string) => {
  const { modules } = useAdaptiveModules();
  const { hasPermission, permissions, isLoading, error } = useAdaptivePermissions(roleId);
  
  return useMemo(() => {
    const parentModule = modules.find(m => m.id === parentModuleId);
    if (!parentModule) {
      return { submodulePermissions: {}, hasParentAccess: false, isLoading, error };
    }

    const submodulePermissions = parentModule.subModules.reduce((acc: Record<string, any>, submodule: any) => {
      const fullSubmoduleId = `${parentModuleId}.${submodule.id}`;
      acc[submodule.id] = {
        create: hasPermission(fullSubmoduleId, 'create'),
        read: hasPermission(fullSubmoduleId, 'read'),
        update: hasPermission(fullSubmoduleId, 'update'),
        delete: hasPermission(fullSubmoduleId, 'delete'),
        admin: hasPermission(fullSubmoduleId, 'admin'),
        permissions: permissions[fullSubmoduleId] || []
      };
      return acc;
    }, {} as Record<string, any>);

    const hasParentAccess = hasPermission(parentModuleId, 'read');

    return {
      submodulePermissions,
      hasParentAccess,
      isLoading,
      error
    };
  }, [parentModuleId, modules, hasPermission, permissions, isLoading, error]);
};

// Hook para evaluación condicional de permisos
export const useConditionalPermissions = (
  condition: boolean,
  truePermissions: PermissionCheck[],
  falsePermissions: PermissionCheck[],
  roleId?: number | string
) => {
  const activeChecks = condition ? truePermissions : falsePermissions;
  return useBulkPermissionCheck(activeChecks, roleId);
};

// Hook para permisos de nivel jerárquico
export const useHierarchicalPermissions = (roleId?: number | string) => {
  const { hasPermission, isLoading, error } = useAdaptivePermissions(roleId);
  const { flatModules } = useAdaptiveModules();
  
  return useMemo(() => {
    // Calcular permisos por nivel jerárquico
    const adminModules = flatModules.filter(moduleId => hasPermission(moduleId, 'admin'));
    const writeModules = flatModules.filter(moduleId => hasPermission(moduleId, 'delete'));
    const editModules = flatModules.filter(moduleId => hasPermission(moduleId, 'update'));
    const createModules = flatModules.filter(moduleId => hasPermission(moduleId, 'create'));
    const readModules = flatModules.filter(moduleId => hasPermission(moduleId, 'read'));
    
    const calculateAccessLevel = (): 'super' | 'admin' | 'manager' | 'operator' | 'viewer' | 'none' => {
      if (adminModules.length >= flatModules.length * 0.8) return 'super';
      if (writeModules.length >= flatModules.length * 0.6) return 'admin';
      if (editModules.length >= flatModules.length * 0.4) return 'manager';
      if (createModules.length >= flatModules.length * 0.2) return 'operator';
      if (readModules.length > 0) return 'viewer';
      return 'none';
    };

    return {
      accessLevel: calculateAccessLevel(),
      adminModules,
      writeModules,
      editModules,
      createModules,
      readModules,
      totalModules: flatModules.length,
      isLoading,
      error
    };
  }, [hasPermission, flatModules, isLoading, error]);
};

// Hook utilitario para verificaciones rápidas de UI
export const useUIPermissions = (roleId?: number | string) => {
  const { hasPermission } = useAdaptivePermissions(roleId);
  
  return useMemo(() => ({
    canManageUsers: hasPermission('sistema.usuarios', 'update'),
    canManageRoles: hasPermission('sistema.roles', 'admin'),
    canManageParks: hasPermission('gestion.parques', 'update'),
    canManageActivities: hasPermission('gestion.actividades', 'create'),
    canViewFinances: hasPermission('admin-finanzas.contabilidad', 'read'),
    canManageAssets: hasPermission('om.activos', 'update'),
    canConfigureSystem: hasPermission('config-seguridad.configuracion', 'admin'),
    canManageMarketing: hasPermission('mkt-comm.campanas', 'create'),
    canViewReports: hasPermission('sistema.reportes', 'read'),
    canManageContent: hasPermission('mkt-comm.contenido', 'update')
  }), [hasPermission]);
};

export default useAdaptivePermissions;