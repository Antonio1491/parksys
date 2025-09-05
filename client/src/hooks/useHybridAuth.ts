import { useAuth } from './useAuth';
import { useFirebaseAuth } from './useFirebaseAuth';

/**
 * Hook híbrido que combina autenticación tradicional con Firebase
 * Mantiene la funcionalidad existente del sistema y agrega Firebase como opción adicional
 */
export function useHybridAuth() {
  // Sistema de autenticación existente (principal)
  const { 
    user: localUser, 
    isLoading: localLoading, 
    isAuthenticated: localAuthenticated, 
    logout: localLogout 
  } = useAuth();

  // Sistema de Firebase (opcional)
  const { 
    firebaseUser, 
    isLoading: firebaseLoading, 
    error: firebaseError,
    loginWithFirebase,
    logoutFirebase,
    isFirebaseAuthenticated 
  } = useFirebaseAuth();

  // Determinar el estado principal basado en el sistema existente
  const isAuthenticated = localAuthenticated;
  const isLoading = localLoading || firebaseLoading;
  
  // El usuario principal es el del sistema existente
  const user = localUser;

  // Función de logout híbrida
  const logout = async () => {
    try {
      // Logout del sistema principal
      localLogout();
      
      // Si hay sesión de Firebase, también cerrarla
      if (isFirebaseAuthenticated) {
        await logoutFirebase();
      }
    } catch (error) {
      console.error('Error en logout híbrido:', error);
      // Aún así ejecutar logout local
      localLogout();
    }
  };

  // Función para login con Firebase (opcional)
  const loginFirebase = async () => {
    try {
      await loginWithFirebase();
    } catch (error) {
      console.error('Error en login Firebase:', error);
      throw error;
    }
  };

  return {
    // Estado principal (sistema existente)
    user,
    isAuthenticated,
    isLoading,
    logout,
    
    // Estado de Firebase (opcional)
    firebaseUser,
    isFirebaseAuthenticated,
    firebaseError,
    loginFirebase,
    
    // Estado combinado para debugging
    authSources: {
      local: localAuthenticated,
      firebase: isFirebaseAuthenticated,
    }
  };
}