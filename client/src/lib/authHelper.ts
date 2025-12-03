/**
 * AUTH HELPER - Utilidades centralizadas de autenticación Firebase
 * ================================================================
 * 
 * Este archivo proporciona funciones reutilizables para autenticación
 * en todos los componentes que necesiten hacer fetch autenticados.
 * 
 * Ubicación sugerida: client/src/lib/authHelper.ts
 * 
 * USO:
 *   import { getAuthHeaders, authenticatedFetch } from '@/lib/authHelper';
 *   
 *   // Para obtener solo headers:
 *   const headers = await getAuthHeaders();
 *   
 *   // Para hacer un fetch autenticado completo:
 *   const response = await authenticatedFetch('/api/parks/1/amenities', {
 *     method: 'POST',
 *     body: JSON.stringify({ amenityId: 5 })
 *   });
 */

import { auth } from '@/lib/firebase';

/**
 * Obtiene los headers de autenticación necesarios para llamadas API
 * Incluye:
 * - Token Firebase (Authorization: Bearer)
 * - X-User-Id (ID del usuario en sistema local)
 * - X-User-Role (Rol del usuario)
 * - x-firebase-uid (UID de Firebase para bypass temporal)
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  // 1. Obtener token de Firebase (método principal)
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const idToken = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    }
  } catch (error) {
    console.warn('[AUTH-HELPER] Error getting Firebase ID token:', error);
  }

  // 2. Obtener información de usuario almacenada en localStorage
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser);
      headers['X-User-Id'] = userObj.id?.toString() || '1';
      headers['X-User-Role'] = userObj.role || 'admin';

      // Firebase UID para bypass durante migración (temporal)
      if (userObj.firebaseUid) {
        headers['x-firebase-uid'] = userObj.firebaseUid;
      }
    } catch (e) {
      console.error('[AUTH-HELPER] Error parsing stored user:', e);
    }
  }

  return headers;
}

/**
 * Realiza un fetch autenticado con Firebase
 * 
 * @param url - URL del endpoint
 * @param options - Opciones de fetch (method, body, etc.)
 * @returns Promise<Response>
 * 
 * NOTA: No agrega Content-Type automáticamente si el body es FormData
 * (el browser lo maneja automáticamente con el boundary correcto)
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = await getAuthHeaders();

  // Construir headers finales
  const mergedHeaders: Record<string, string> = {
    ...authHeaders,
  };

  // Solo agregar Content-Type si NO es FormData
  // El browser agrega automáticamente el Content-Type con boundary para FormData
  if (options.body && !(options.body instanceof FormData)) {
    mergedHeaders['Content-Type'] = 'application/json';
  }

  // Agregar headers personalizados del usuario
  if (options.headers) {
    const customHeaders = options.headers as Record<string, string>;
    Object.keys(customHeaders).forEach(key => {
      // No sobrescribir Content-Type si viene de customHeaders
      if (key.toLowerCase() !== 'content-type' || !mergedHeaders['Content-Type']) {
        mergedHeaders[key] = customHeaders[key];
      }
    });
  }

  return fetch(url, {
    ...options,
    headers: mergedHeaders,
    credentials: 'include',
  });
}

/**
 * Realiza un fetch autenticado y parsea la respuesta JSON
 * Lanza error si la respuesta no es ok
 * 
 * @param url - URL del endpoint
 * @param options - Opciones de fetch
 * @returns Promise<T> - Respuesta parseada como JSON
 */
export async function authenticatedFetchJson<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await authenticatedFetch(url, options);

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Si no se puede parsear, usar mensaje genérico
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Verifica si el usuario actual está autenticado
 * @returns boolean
 */
export function isUserAuthenticated(): boolean {
  const currentUser = auth.currentUser;
  const storedUser = localStorage.getItem('user');

  return !!(currentUser || storedUser);
}

/**
 * Obtiene el ID del usuario actual
 * @returns number | null
 */
export function getCurrentUserId(): number | null {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser);
      return userObj.id || null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Obtiene el rol del usuario actual
 * @returns string | null
 */
export function getCurrentUserRole(): string | null {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser);
      return userObj.role || null;
    } catch {
      return null;
    }
  }
  return null;
}

export default {
  getAuthHeaders,
  authenticatedFetch,
  authenticatedFetchJson,
  isUserAuthenticated,
  getCurrentUserId,
  getCurrentUserRole,
};