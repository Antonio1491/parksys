import { useState, useEffect } from 'react';
import { onFirebaseAuthStateChanged, loginWithGoogle, logoutFromFirebase } from '@/lib/firebase';
import { getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Interface para usuario de Firebase
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export function useFirebaseAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Manejar el resultado del redirect al volver de Google
    const handleRedirectResult = async () => {
      if (!auth) return;
      
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // Usuario logueado exitosamente
          const credential = GoogleAuthProvider.credentialFromResult(result);
          console.log('🎉 Usuario logueado con Google:', result.user.email);
        }
      } catch (error: any) {
        console.error('❌ Error en redirect result:', error);
        setError(error.message);
      }
    };

    handleRedirectResult();

    // Escuchar cambios de estado de autenticación
    const unsubscribe = onFirebaseAuthStateChanged((user) => {
      setIsLoading(false);
      
      if (user) {
        setFirebaseUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        });
        setError(null);
      } else {
        setFirebaseUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithFirebase = async () => {
    try {
      setError(null);
      await loginWithGoogle();
    } catch (error: any) {
      console.error('❌ Error al hacer login:', error);
      setError(error.message);
    }
  };

  const logoutFirebase = async () => {
    try {
      setError(null);
      await logoutFromFirebase();
    } catch (error: any) {
      console.error('❌ Error al hacer logout:', error);
      setError(error.message);
    }
  };

  return {
    firebaseUser,
    isLoading,
    error,
    loginWithFirebase,
    logoutFirebase,
    isFirebaseAuthenticated: !!firebaseUser,
  };
}