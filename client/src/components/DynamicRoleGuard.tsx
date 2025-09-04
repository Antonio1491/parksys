import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

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

// Hook para obtener permisos de usuario
export const useUserPermissions = (userId?: number) => {
  return useQuery<UserPermissions>({
    queryKey: [`/api/users/${userId}/permissions`],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
  });
};

// Hook para verificar permiso específico de módulo
export const useModulePermission = (
  userId?: number, 
  module?: string, 
  permission?: string
) => {
  return useQuery<{ hasPermission: boolean }>({
    queryKey: [`/api/users/${userId}/module-permission/${module}/${permission}`],
    enabled: !!(userId && module && permission),
    staleTime: 2 * 60 * 1000,
  });
};

export const DynamicRoleGuard: React.FC<DynamicRoleGuardProps> = ({
  children,
  requiredRole,
  requiredLevel,
  requiredModule,
  requiredPermission = 'read',
  fallback = null,
  userId = 1 // Default para desarrollo - en producción vendría del contexto de auth
}) => {
  const { data: roles, isLoading: rolesLoading } = useDynamicRoles();
  const { data: userPermissions, isLoading: permissionsLoading } = useUserPermissions(userId);
  const { data: modulePermission, isLoading: modulePermissionLoading } = useModulePermission(
    requiredModule ? userId : undefined,
    requiredModule,
    requiredModule ? requiredPermission : undefined
  );

  // Mostrar loading mientras se cargan los datos
  if (rolesLoading || permissionsLoading || (requiredModule && modulePermissionLoading)) {
    return <div className="animate-pulse bg-gray-200 rounded h-4 w-16"></div>;
  }

  // Si no se pudieron cargar los datos, denegar acceso
  if (!roles || !userPermissions) {
    console.warn('[DynamicRoleGuard] No se pudieron cargar roles o permisos del usuario');
    return <>{fallback}</>;
  }

  // Obtener el rol del usuario (simulado por ahora - en producción vendría del contexto)
  // Por ahora asumimos que el usuario tiene el rol de Super Admin
  const userRole = roles.find(r => r.level === 1); // Super Admin por defecto para desarrollo

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

  // Verificar permisos de módulo usando la API
  if (requiredModule && modulePermission && !modulePermission.hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Hook mejorado para verificar permisos con datos dinámicos (ACTUALIZADO para múltiples roles)
export const useDynamicPermissions = (userId: number = 1) => {
  const { data: roles } = useDynamicRoles();
  
  // Obtener permisos comprehensivos del usuario (múltiples roles)
  const { data: userPermissions } = useQuery<UserPermissionsResponse>({
    queryKey: ['/api/users/permissions', userId],
    enabled: !!userId
  });

  const hasPermission = (module: SystemModule, permission: PermissionType): boolean => {
    if (!userPermissions) return false;
    
    // Para múltiples roles, usar combinedPermissions
    const permissions = userPermissions.combinedPermissions || userPermissions.permissions || {};
    
    // Si tiene permisos totales
    if ((permissions as any).all === true) return true;
    
    const modulePermissions = permissions[module];
    return modulePermissions ? modulePermissions.includes(permission) : false;
  };

  const hasModuleAccess = (module: SystemModule): boolean => {
    if (!userPermissions) return false;
    
    // Para múltiples roles, usar combinedPermissions
    const permissions = userPermissions.combinedPermissions || userPermissions.permissions || {};
    
    // Si tiene permisos totales
    if ((permissions as any).all === true) return true;
    
    const modulePermissions = permissions[module];
    return modulePermissions && modulePermissions.length > 0;
  };

  const canRead = (module: SystemModule) => hasPermission(module, 'read');
  const canWrite = (module: SystemModule) => hasPermission(module, 'write');
  const canAdmin = (module: SystemModule) => hasPermission(module, 'admin');

  const getUserRoleLevel = (): number | null => {
    if (!userPermissions) return null;
    
    // Para múltiples roles, devolver el nivel más alto (menor número)
    if (userPermissions.metadata?.hasMultipleRoles && userPermissions.roles?.length) {
      return Math.min(...userPermissions.roles.map((role: any) => role.level));
    }
    
    // Para rol único, devolver el nivel del rol
    return userPermissions.role?.level || null;
  };

  const getUserRoles = () => {
    if (!userPermissions) return [];
    
    // Para múltiples roles
    if (userPermissions.metadata?.hasMultipleRoles && userPermissions.roles?.length) {
      return userPermissions.roles;
    }
    
    // Para rol único
    return userPermissions.role ? [userPermissions.role] : [];
  };

  const getPrimaryRole = () => {
    if (!userPermissions) return null;
    
    // Para múltiples roles, devolver el rol primario
    if (userPermissions.metadata?.hasMultipleRoles && userPermissions.primaryRole) {
      return userPermissions.primaryRole;
    }
    
    // Para rol único
    return userPermissions.role || null;
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
    hasMultipleRoles: userPermissions?.metadata?.hasMultipleRoles || false,
    userRole: getPrimaryRole(), // Compatibilidad con código existente
    roleLevel: getUserRoleLevel() || 0,
    roles,
    userPermissions,
    isLoading: !roles || !userPermissions
  };
};

export default DynamicRoleGuard;