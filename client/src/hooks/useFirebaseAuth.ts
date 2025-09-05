import { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

interface UserStatus {
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  localUser?: any;
  needsPasswordReset?: boolean;
}

export function useFirebaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  const [userStatus, setUserStatus] = useState<UserStatus>({
    isApproved: false,
    isPending: false,
    isRejected: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      if (firebaseUser) {
        try {
          // Verificar el estado del usuario en la base de datos local
          const status = await checkUserStatus(firebaseUser.uid);
          setUserStatus(status);
          
          if (status.isApproved && status.localUser) {
            // Usuario aprobado - establecer en localStorage para compatibilidad
            localStorage.setItem('user', JSON.stringify(status.localUser));
            localStorage.setItem('token', `firebase-${firebaseUser.uid}`);
          }
        } catch (error) {
          console.error('Error checking user status:', error);
        }
      } else {
        // Usuario no autenticado
        setUserStatus({
          isApproved: false,
          isPending: false,
          isRejected: false
        });
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }

      setAuthState({
        user: firebaseUser,
        loading: false,
        error: null
      });
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Lista de administradores autorizados
      const authorizedAdmins = [
        'admin@sistema.com',
        'luis@asociacionesprofesionales.org', 
        'joaquin@parquesdemexico.org'
      ];
      
      const isAuthorizedAdmin = authorizedAdmins.includes(email.toLowerCase());
      
      // Si es un administrador autorizado, intentar vinculación automática
      if (isAuthorizedAdmin && result.user) {
        try {
          await apiRequest('/api/auth/link-user', {
            method: 'POST',
            data: {
              email: result.user.email,
              firebaseUid: result.user.uid
            },
            headers: {
              'Content-Type': 'application/json'
            }
          });
          console.log('✅ Vinculación automática exitosa para admin:', email);
        } catch (linkError) {
          console.log('ℹ️ Vinculación automática para admin:', linkError);
          // No lanzar error, continuar con el login normal
        }
      }
      
      return result.user;
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Lista de administradores autorizados
      const authorizedAdmins = [
        'admin@sistema.com',
        'luis@asociacionesprofesionales.org', 
        'joaquin@parquesdemexico.org'
      ];
      
      const isAuthorizedAdmin = authorizedAdmins.includes(email.toLowerCase());
      
      try {
        // 1. Intentar crear usuario en Firebase
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. Actualizar el perfil con el nombre
        await updateProfile(result.user, { displayName });
        
        if (isAuthorizedAdmin) {
          // Para administradores autorizados, intentar vinculación directa
          try {
            await apiRequest('/api/auth/link-user', {
              method: 'POST',
              data: {
                email: result.user.email,
                firebaseUid: result.user.uid
              },
              headers: {
                'Content-Type': 'application/json'
              }
            });
          } catch (linkError) {
            console.log('Error en vinculación automática:', linkError);
          }
        } else {
          // 3. Para usuarios normales, crear registro en pending_users
          await apiRequest('/api/auth/request-approval', {
            method: 'POST',
            data: {
              firebaseUid: result.user.uid,
              email: result.user.email,
              displayName: displayName
            },
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }

        return result.user;
        
      } catch (firebaseError: any) {
        // Si el email ya existe en Firebase, intentar login automático para admins
        if (firebaseError.code === 'auth/email-already-in-use' && isAuthorizedAdmin) {
          setAuthState(prev => ({ ...prev, error: 'Este email ya tiene una cuenta. Usa "Iniciar Sesión" con tu contraseña.', loading: false }));
          throw new Error('Este email ya tiene una cuenta. Usa "Iniciar Sesión" con tu contraseña.');
        }
        
        // Para otros errores, propagar el error original
        throw firebaseError;
      }
      
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code) || error.message;
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      throw new Error(errorMessage);
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    userStatus,
    login,
    register,
    logout,
    resetPassword,
    isAuthenticated: !!authState.user && userStatus.isApproved
  };
}

// Función para verificar el estado del usuario en la base de datos local
async function checkUserStatus(firebaseUid: string): Promise<UserStatus> {
  try {
    const response = await apiRequest(`/api/auth/user-status/${firebaseUid}`);
    return response;
  } catch (error) {
    console.error('Error checking user status:', error);
    return {
      isApproved: false,
      isPending: false,
      isRejected: false
    };
  }
}

// Función para obtener mensajes de error user-friendly
function getFirebaseErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No existe una cuenta con este email';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este email';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres';
    case 'auth/invalid-email':
      return 'Email inválido';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta más tarde';
    default:
      return 'Error de autenticación. Intenta nuevamente';
  }
}