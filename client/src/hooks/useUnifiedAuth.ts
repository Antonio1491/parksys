import { useState, useEffect, useMemo } from 'react';
import { useFirebaseAuth } from './useFirebaseAuth';
import { useAuth, User } from './useAuth';
import { useAdaptivePermissions } from './useAdaptivePermissions';

// Tipos unificados para el sistema de autenticación
export interface UnifiedUser {
  // Datos de Firebase
  firebaseUid?: string;
  email?: string;
  displayName?: string;
  
  // Datos locales del sistema
  id?: number;
  username?: string;
  fullName?: string;
  role?: string;
  roleId?: number;
  
  // Campos adicionales
  profileImage?: string;
  phone?: string;
  department?: string;
  [key: string]: any;
}

export interface UnifiedAuthState {
  user: UnifiedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Métodos de autenticación
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, displayName: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // Verificaciones de permisos
  hasRole: (role: string) => boolean;
  hasPermission: (moduleId: string, action: 'create' | 'read' | 'update' | 'delete' | 'admin') => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

/**
 * Hook unificado que combina Firebase Authentication con el sistema de roles local.
 * Proporciona una interfaz consistente para toda la aplicación.
 */
export function useUnifiedAuth(): UnifiedAuthState {
  const firebaseAuth = useFirebaseAuth();
  const localAuth = useAuth();
  
  // Obtener roleId del usuario para permisos adaptativos
  const userRoleId = useMemo(() => {
    if (firebaseAuth.userStatus.localUser?.roleId) {
      return firebaseAuth.userStatus.localUser.roleId;
    }
    if (localAuth.user && typeof localAuth.user === 'object' && 'roleId' in localAuth.user) {
      return (localAuth.user as User).roleId;
    }
    return undefined;
  }, [firebaseAuth.userStatus.localUser, localAuth.user]);
  
  // Hook para permisos adaptativos híbridos FK
  const adaptivePermissions = useAdaptivePermissions(userRoleId);
  
  // Estado unificado del usuario
  const unifiedUser = useMemo((): UnifiedUser | null => {
    // Priorizar datos de Firebase si el usuario está autenticado y aprobado
    if (firebaseAuth.isAuthenticated && firebaseAuth.userStatus.localUser) {
      const localUser = firebaseAuth.userStatus.localUser;
      const firebaseUser = firebaseAuth.user;
      
      return {
        // Datos de Firebase
        firebaseUid: firebaseUser?.uid,
        email: firebaseUser?.email || localUser.email,
        displayName: firebaseUser?.displayName || localUser.fullName,
        
        // Datos locales del sistema ParkSys
        id: localUser.id,
        username: localUser.username,
        fullName: localUser.fullName || firebaseUser?.displayName,
        role: localUser.role || getRoleSlug(localUser.roleId),
        roleId: localUser.roleId,
        profileImage: localUser.profileImage,
        phone: localUser.phone,
        department: localUser.department,
        
        // Campos adicionales del usuario local
        ...localUser
      };
    }
    
    // Fallback al sistema local si Firebase no está disponible pero hay usuario local
    if (localAuth.user && typeof localAuth.user === 'object' && 'id' in localAuth.user) {
      const typedUser = localAuth.user as User;
      return {
        ...typedUser,
        // Asegurar campos estándar para compatibilidad
        email: typedUser.email || '',
        fullName: typedUser.fullName || typedUser.username
      };
    }
    
    return null;
  }, [firebaseAuth.user, firebaseAuth.userStatus.localUser, localAuth.user]);

  // Estado de autenticación
  const isAuthenticated = firebaseAuth.isAuthenticated || localAuth.isAuthenticated;
  const isLoading = firebaseAuth.loading || localAuth.isLoading;
  const error = firebaseAuth.error;

  // Métodos de autenticación (delegados a Firebase)
  const login = firebaseAuth.login;
  const register = firebaseAuth.register;
  const logout = async () => {
    await firebaseAuth.logout();
    localAuth.logout();
  };
  const resetPassword = firebaseAuth.resetPassword;

  // Métodos de verificación de permisos usando sistema híbrido FK
  const hasRole = (role: string): boolean => {
    return unifiedUser?.role === role;
  };

  const hasPermission = (moduleId: string, action: 'create' | 'read' | 'update' | 'delete' | 'admin'): boolean => {
    // Usar sistema híbrido FK para verificación de permisos
    if (adaptivePermissions.hasPermission) {
      return adaptivePermissions.hasPermission(moduleId, action);
    }
    
    // Fallback: Super Admin tiene todos los permisos
    if (unifiedUser?.role === 'super-admin') return true;
    
    // Admin General tiene permisos administrativos
    if (unifiedUser?.role === 'admin' && ['read', 'create', 'update', 'admin'].includes(action)) return true;
    
    return false;
  };

  const isAdmin = (): boolean => {
    return unifiedUser?.role === 'admin' || unifiedUser?.role === 'super-admin';
  };

  const isSuperAdmin = (): boolean => {
    return unifiedUser?.role === 'super-admin';
  };

  // Log para debugging (solo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 [UNIFIED AUTH] Estado:', {
        isAuthenticated,
        isLoading,
        user: unifiedUser,
        firebaseStatus: {
          authenticated: firebaseAuth.isAuthenticated,
          loading: firebaseAuth.loading,
          approved: firebaseAuth.userStatus.isApproved
        },
        localStatus: {
          authenticated: localAuth.isAuthenticated,
          loading: localAuth.isLoading
        }
      });
    }
  }, [isAuthenticated, isLoading, unifiedUser, firebaseAuth, localAuth]);

  return {
    user: unifiedUser,
    isAuthenticated,
    isLoading,
    error,
    
    // Métodos
    login,
    register,
    logout,
    resetPassword,
    
    // Verificaciones
    hasRole,
    hasPermission,
    isAdmin,
    isSuperAdmin
  };
}

// Función auxiliar para mapear roleId a slug del rol
function getRoleSlug(roleId: number | undefined): string {
  const roleMap: Record<number, string> = {
    1: 'super-admin',      // Super Administrador
    2: 'admin',            // Administrador General  
    3: 'coordinador',      // Coordinador
    4: 'gerente',          // Gerente
    5: 'supervisor',       // Supervisor
    6: 'empleado',         // Empleado
    7: 'invitado'          // Invitado
  };
  
  return roleMap[roleId || 0] || 'usuario';
}

export default useUnifiedAuth;