import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useAdaptivePermissions } from '@/hooks/useAdaptivePermissions';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredLevel?: number;
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

interface UserRole {
  id: string;
  name: string;
  level: number;
  permissions: string[];
}

interface CurrentUser {
  id: number;
  roles: UserRole[];
}

// Componente para proteger rutas basado en roles y permisos (con sistema híbrido FK)
export function RoleGuard({ 
  children, 
  requiredRole, 
  requiredLevel, 
  requiredPermission,
  fallback 
}: RoleGuardProps) {
  // Usar auth unificado con sistema híbrido FK
  const { user: unifiedUser, isAuthenticated, isLoading } = useUnifiedAuth();
  const adaptivePermissions = useAdaptivePermissions(unifiedUser?.roleId);

  // Si está cargando, mostrar indicador
  if (isLoading || adaptivePermissions.isLoading) {
    return <div className="animate-pulse bg-gray-200 rounded h-4 w-16"></div>;
  }
  
  // Si no está autenticado, denegar acceso
  if (!isAuthenticated || !unifiedUser) {
    return <>{fallback}</>;
  }

  // Convertir usuario unificado a formato CurrentUser para compatibilidad
  const user: CurrentUser = {
    id: unifiedUser.id || 0,
    roles: [
      {
        id: unifiedUser.role || 'usuario',
        name: getRoleName(unifiedUser.role || 'usuario'),
        level: getRoleLevel(unifiedUser.roleId || 0),
        permissions: unifiedUser.role === 'super-admin' ? ['*'] : getPermissionsFromRole(unifiedUser.role || 'usuario')
      }
    ]
  };

  // Verificar si el usuario tiene el rol requerido
  const hasRequiredRole = (role: string): boolean => {
    return user.roles.some(userRole => userRole.name === role || userRole.id === role);
  };

  // Verificar si el usuario tiene el nivel requerido
  const hasRequiredLevel = (level: number): boolean => {
    return user.roles.some(userRole => userRole.level >= level);
  };

  // Verificar si el usuario tiene el permiso requerido usando sistema híbrido FK
  const hasRequiredPermission = (permission: string): boolean => {
    // Usar adaptive permissions si está disponible
    if (adaptivePermissions.hasPermission && permission.includes('.')) {
      const [moduleId, action] = permission.split('.');
      return adaptivePermissions.hasPermission(moduleId, action as 'create' | 'read' | 'update' | 'delete' | 'admin');
    }
    
    // Fallback para permisos legacy
    return user.roles.some(userRole => 
      userRole.permissions.includes('*') || 
      userRole.permissions.includes(permission)
    );
  };

  // Verificar acceso
  let hasAccess = true;

  if (requiredRole && !hasRequiredRole(requiredRole)) {
    hasAccess = false;
  }

  if (requiredLevel && !hasRequiredLevel(requiredLevel)) {
    hasAccess = false;
  }

  if (requiredPermission && !hasRequiredPermission(requiredPermission)) {
    hasAccess = false;
  }

  // Mostrar contenido o fallback
  if (!hasAccess) {
    return (
      <>
        {fallback || (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Acceso Restringido
              </h2>
              <p className="text-gray-600 mb-4">
                No tienes permisos suficientes para acceder a esta sección.
              </p>
              <div className="text-sm text-gray-500">
                {requiredRole && <p>Rol requerido: {requiredRole}</p>}
                {requiredLevel && <p>Nivel requerido: {requiredLevel}+</p>}
                {requiredPermission && <p>Permiso requerido: {requiredPermission}</p>}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}

// Hook para verificar permisos (integrado con sistema híbrido FK)
export function usePermissions() {
  const { user: unifiedUser, isAuthenticated } = useUnifiedAuth();
  const adaptivePermissions = useAdaptivePermissions(unifiedUser?.roleId);

  // Convertir usuario unificado para compatibilidad
  const user: CurrentUser = {
    id: unifiedUser?.id || 0,
    roles: unifiedUser ? [
      {
        id: unifiedUser.role || 'usuario',
        name: getRoleName(unifiedUser.role || 'usuario'),
        level: getRoleLevel(unifiedUser.roleId || 0),
        permissions: unifiedUser.role === 'super-admin' ? ['*'] : getPermissionsFromRole(unifiedUser.role || 'usuario')
      }
    ] : []
  };

  const hasRole = (role: string): boolean => {
    return user.roles.some(userRole => userRole.name === role || userRole.id === role);
  };

  const hasLevel = (level: number): boolean => {
    return user.roles.some(userRole => userRole.level >= level);
  };

  const hasPermission = (permission: string): boolean => {
    // Usar adaptive permissions para permisos modulares
    if (adaptivePermissions.hasPermission && permission.includes('.')) {
      const [moduleId, action] = permission.split('.');
      return adaptivePermissions.hasPermission(moduleId, action as 'create' | 'read' | 'update' | 'delete' | 'admin');
    }
    
    // Fallback para permisos legacy
    return user.roles.some(userRole => 
      userRole.permissions.includes('*') || 
      userRole.permissions.includes(permission)
    );
  };

  const getUserRoles = (): UserRole[] => {
    return user.roles;
  };

  const getHighestLevel = (): number => {
    return Math.max(...user.roles.map(role => role.level));
  };

  return {
    hasRole,
    hasLevel,
    hasPermission,
    getUserRoles,
    getHighestLevel,
    currentUser: user
  };
}

// Funciones auxiliares para mapeo de roles
function getRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    'super-admin': 'Super Administrador',
    'admin': 'Administrador General',
    'coordinador': 'Coordinador',
    'gerente': 'Gerente',
    'supervisor': 'Supervisor',
    'empleado': 'Empleado',
    'invitado': 'Invitado'
  };
  return roleNames[role] || 'Usuario';
}

function getRoleLevel(roleId: number): number {
  const roleLevels: Record<number, number> = {
    1: 10,  // Super Administrador - Mayor nivel
    2: 8,   // Administrador General
    3: 6,   // Coordinador
    4: 5,   // Gerente
    5: 4,   // Supervisor
    6: 2,   // Empleado
    7: 1    // Invitado
  };
  return roleLevels[roleId] || 0;
}

function getPermissionsFromRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    'super-admin': ['*'],
    'admin': ['read', 'create', 'update', 'admin'],
    'coordinador': ['read', 'create', 'update'],
    'gerente': ['read', 'create'],
    'supervisor': ['read'],
    'empleado': ['read'],
    'invitado': ['read']
  };
  return rolePermissions[role] || ['read'];
}