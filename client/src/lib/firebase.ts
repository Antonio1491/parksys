// Firebase Configuration for ParkSys
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";

// Firebase config - usar variables de entorno para consistencia
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAi-4UtEvI2hgEu9l7xrEsaDaXQ7uTNBxs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "parksys-c3d30.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "parksys-c3d30",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "parksys-c3d30.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "153625478063",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:153625478063:web:5d8c5f3a6b7c9d0e1f2345",
};

// Inicializar Firebase evitando duplicados
let app: any;
let auth: any;

try {
  // Verificar si ya existe una app inicializada
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  console.log('🔥 Firebase initialized successfully');
  
  // Forzar logout si hay sesiones del proyecto incorrecto
  if (auth?.currentUser) {
    console.log('🔄 Clearing old Firebase session for project migration');
    signOut(auth).then(() => {
      console.log('✅ Old session cleared - please login again');
    }).catch((error) => {
      console.log('⚠️ Error clearing session:', error);
    });
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // En caso de error, intentar usar una app existente
  try {
    app = getApp();
    auth = getAuth(app);
    console.log('🔥 Firebase recovered from existing app');
  } catch (recoveryError) {
    console.error('❌ Firebase recovery failed:', recoveryError);
    auth = null;
  }
}

// Provider de Google
const googleProvider = new GoogleAuthProvider();

// Función para login con Google
export function loginWithGoogle() {
  if (!auth) {
    console.error('Firebase not initialized');
    return Promise.reject(new Error('Firebase not configured'));
  }
  
  return signInWithRedirect(auth, googleProvider);
}

// Función para logout
export function logoutFromFirebase() {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}

// Función para escuchar cambios de estado de autenticación
export function onFirebaseAuthStateChanged(callback: (user: any) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  
  return onAuthStateChanged(auth, callback);
}

// Exportar auth para uso directo si es necesario
export { auth };