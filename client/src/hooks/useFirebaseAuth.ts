import { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
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
      
      // 1. Crear usuario en Firebase
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Actualizar el perfil con el nombre
      await result.user.updateProfile({ displayName });
      
      // 3. Crear registro en pending_users
      await apiRequest('/api/auth/request-approval', {
        method: 'POST',
        body: JSON.stringify({
          firebaseUid: result.user.uid,
          email: result.user.email,
          displayName: displayName
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return result.user;
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
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