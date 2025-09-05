// Firebase Configuration for ParkSys
import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";

// Firebase config - se carga desde variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase solo si hay configuración
let app: any;
let auth: any;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('🔥 Firebase initialized successfully');
  } else {
    console.log('⚠️ Firebase config incomplete - using fallback auth');
    auth = null;
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  auth = null;
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