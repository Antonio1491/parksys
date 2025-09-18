import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useAdaptivePermissions } from '@/hooks/useAdaptivePermissions';

// Tipos para permisos de múltiples roles
interface UserPermissionsResponse {
  permissions?: Record<string, string[]>;
  combinedPermissions?: Record<string, string[]>;
  metadata?: {
    hasMultipleRoles?: boolean;
    primaryRole?: any;
  };
  role?: {
    level: number;
    slug: string;
    name: string;
  };
  roles?: Array<{
    level: number;
    slug: string;
    name: string;
  }>;
  primaryRole?: {
    level: number;
    slug: string;
    name: string;
  };
}

// Tipos para el sistema dinámico
export interface DynamicRole {
  id: number;
  name: string;
  slug: string;
  description?: string;
  level: number;
  color?: string;
  permissions: Record<string, any>;
  isActive: boolean;
}

export interface UserPermissions {
  permissions: Record<string, string[]>;
}

// Definición de módulos del sistema
export const SYSTEM_MODULES = [
  'Configuración',
  'Gestión', 
  'Operaciones',
  'Finanzas',
  'Marketing',
  'RH',
  'Seguridad'
] as const;

export type SystemModule = typeof SYSTEM_MODULES[number];
export type PermissionType = 'read' | 'write' | 'admin';

interface DynamicRoleGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredLevel?: number;
  requiredModule?: SystemModule;
  requiredPermission?: PermissionType;
  fallback?: React.ReactNode;
  userId?: number; // En producción vendría del contexto de auth
}

// Hook para obtener roles dinámicos de la BD
export const useDynamicRoles = () => {
  return useQuery<DynamicRole[]>({
    queryKey: ['/api/roles'],
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
};

// Hook para obtener permisos de rol (usando sistema híbrido FK)
export const useRolePermissions = (roleId?: number) => {
  return useQuery<Record<string, string[]>>({
    queryKey: [`/api/roles/${roleId}/permissions`],
    enabled: !!roleId,
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
  });
};

// Hook que usa el sistema adaptativo para verificar permisos de módulo
export const useModulePermissionAdaptive = (
  roleId?: number, 
  module?: string, 
  permission?: string
) => {
  const adaptivePermissions = useAdaptivePermissions(roleId);
  
  return {
    data: {
      hasPermission: adaptivePermissions.hasPermission ? 
        adaptivePermissions.hasPermission(module || '', permission as any) : false
    },
    isLoading: adaptivePermissions.isLoading
  };
};

export const DynamicRoleGuard: React.FC<DynamicRoleGuardProps> = ({
  children,
  requiredRole,
  requiredLevel,
  requiredModule,
  requiredPermission = 'read',
  fallback = null,
  userId // Deprecated - se obtiene del contexto
}) => {
  // Usar auth unificado para obtener usuario real
  const { user: unifiedUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const { data: roles, isLoading: rolesLoading } = useDynamicRoles();
  const { data: rolePermissions, isLoading: permissionsLoading } = useRolePermissions(unifiedUser?.roleId);
  const modulePermissionCheck = useModulePermissionAdaptive(
    requiredModule ? unifiedUser?.roleId : undefined,
    requiredModule,
    requiredModule ? requiredPermission : undefined
  );

  // Mostrar loading mientras se cargan los datos
  if (authLoading || rolesLoading || permissionsLoading || (requiredModule && modulePermissionCheck.isLoading)) {
    return <div className="animate-pulse bg-gray-200 rounded h-4 w-16"></div>;
  }

  // Si no está autenticado, denegar acceso
  if (!isAuthenticated || !unifiedUser) {
    return <>{fallback}</>;
  }

  // Si no se pudieron cargar los datos, denegar acceso
  if (!roles) {
    console.warn('[DynamicRoleGuard] No se pudieron cargar roles');
    return <>{fallback}</>;
  }

  // Obtener el rol del usuario desde el contexto unificado
  const userRole = roles.find(r => r.id === unifiedUser.roleId) || roles.find(r => r.slug === unifiedUser.role);

  if (!userRole) {
    console.warn('[DynamicRoleGuard] No se encontró rol para el usuario');
    return <>{fallback}</>;
  }

  // Verificar rol específico
  if (requiredRole && userRole.slug !== requiredRole) {
    return <>{fallback}</>;
  }

  // Verificar nivel jerárquico (niveles más bajos tienen mayor autoridad)
  if (requiredLevel && userRole.level > requiredLevel) {
    return <>{fallback}</>;
  }

  // ✅ TEMPORARY FIX: Allow Super Admin access
  if (userRole.slug === 'super-admin') {
    return <>{children}</>;
  }
  
  // Verificar permisos de módulo usando sistema adaptativo
  if (requiredModule && modulePermissionCheck.data && !modulePermissionCheck.data.hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Hook mejorado para verificar permisos con datos dinámicos (integrado con sistema híbrido FK)
export const useDynamicPermissions = (roleId?: number) => {
  const { data: roles } = useDynamicRoles();
  const { user: unifiedUser } = useUnifiedAuth();
  
  // Usar roleId del parámetro o del usuario autenticado
  const effectiveRoleId = roleId || unifiedUser?.roleId;
  
  // Obtener permisos del rol usando sistema híbrido FK
  const adaptivePermissions = useAdaptivePermissions(effectiveRoleId);
  const { data: rolePermissions } = useRolePermissions(effectiveRoleId);

  const hasPermission = (module: SystemModule, permission: PermissionType): boolean => {
    // Usar sistema adaptativo como principal
    if (adaptivePermissions.hasPermission) {
      return adaptivePermissions.hasPermission(module, permission as any);
    }
    
    // Fallback usando permisos del rol
    if (!rolePermissions) return false;
    
    // Si tiene permisos totales (Super Admin)
    if ((rolePermissions as any).all === true) return true;
    
    const modulePermissions = rolePermissions[module];
    return modulePermissions ? modulePermissions.includes(permission) : false;
  };

  const hasModuleAccess = (module: SystemModule): boolean => {
    // Usar sistema adaptativo como principal
    if (adaptivePermissions.hasAnyPermission) {
      return adaptivePermissions.hasAnyPermission(module);
    }
    
    // Fallback usando permisos del rol
    if (!rolePermissions) return false;
    
    // Si tiene permisos totales (Super Admin)
    if ((rolePermissions as any).all === true) return true;
    
    const modulePermissions = rolePermissions[module];
    return modulePermissions && modulePermissions.length > 0;
  };

  const canRead = (module: SystemModule) => hasPermission(module, 'read');
  const canWrite = (module: SystemModule) => hasPermission(module, 'write');
  const canAdmin = (module: SystemModule) => hasPermission(module, 'admin');

  const getUserRoleLevel = (): number | null => {
    if (!unifiedUser || !roles) return null;
    
    const userRole = roles.find(r => r.id === unifiedUser.roleId);
    return userRole?.level || null;
  };

  const getUserRoles = () => {
    if (!unifiedUser || !roles) return [];
    
    const userRole = roles.find(r => r.id === unifiedUser.roleId);
    return userRole ? [userRole] : [];
  };

  const getPrimaryRole = () => {
    if (!unifiedUser || !roles) return null;
    
    return roles.find(r => r.id === unifiedUser.roleId) || null;
  };

  return {
    hasPermission,
    hasModuleAccess,
    canRead,
    canWrite,
    canAdmin,
    getUserRoleLevel,
    getUserRoles,
    getPrimaryRole,
    hasMultipleRoles: false, // Sistema actual usa rol único
    userRole: getPrimaryRole(), // Compatibilidad con código existente
    roleLevel: getUserRoleLevel() || 0,
    roles,
    rolePermissions,
    adaptivePermissions,
    unifiedUser,
    isLoading: !roles || adaptivePermissions.isLoading
  };
};

export default DynamicRoleGuard;