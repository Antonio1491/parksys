import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";

/**
 * Hook personalizado que garantiza que el resultado de una query siempre sea un array.
 * Útil para evitar errores "X.map is not a function" cuando la API puede retornar
 * diferentes estructuras de datos.
 * 
 * Este hook usa el queryClient global del proyecto, por lo que no necesita 
 * configurar manualmente fetch, headers, etc.
 * 
 * @param endpoint - URL del endpoint
 * @param dataPath - Path opcional donde están los datos en la respuesta (ej: "data")
 * @param options - Opciones adicionales de React Query
 * 
 * @example
 * // API retorna: { data: [...] }
 * const { data: parks, isLoading } = useArrayQuery("/api/parks", "data");
 * 
 * @example
 * // API retorna: [...]
 * const { data: users, isLoading } = useArrayQuery("/api/users");
 */
export function useArrayQuery<T = any>(
  endpoint: string,
  dataPath?: string,
  options?: Omit<UseQueryOptions<T[]>, 'queryKey' | 'queryFn'>
): UseQueryResult<T[]> {
  return useQuery<T[]>({
    queryKey: [endpoint],
    // queryFn se hereda del queryClient global en queryClient.ts
    select: (data: any) => {
      // Manejar respuestas vacías (304, null, undefined)
      if (!data) {
        console.log(`📭 [useArrayQuery] ${endpoint} - Respuesta vacía (posible 304), retornando []`);
        return [];
      }

      // Si se especifica un path, navegar hasta ese path
      if (dataPath) {
        const pathParts = dataPath.split('.');
        let result = data;

        for (const part of pathParts) {
          result = result?.[part];
          if (result === undefined) {
            console.warn(`⚠️ [useArrayQuery] ${endpoint} - No se encontró path "${dataPath}"`);
            break;
          }
        }

        // Asegurar que el resultado es un array
        if (Array.isArray(result)) {
          console.log(`✅ [useArrayQuery] ${endpoint} - Array encontrado en "${dataPath}" con ${result.length} elementos`);
          return result;
        }
      }

      // Si no hay path, verificar si la respuesta directa es un array
      if (Array.isArray(data)) {
        console.log(`✅ [useArrayQuery] ${endpoint} - Array directo con ${data.length} elementos`);
        return data;
      }

      // Intentar encontrar arrays comunes en la respuesta
      const commonArrayPaths = ['data', 'items', 'results', 'records', 'parks', 'users'];
      for (const path of commonArrayPaths) {
        if (Array.isArray(data[path])) {
          console.log(`✅ [useArrayQuery] ${endpoint} - Array encontrado en "${path}" con ${data[path].length} elementos`);
          return data[path];
        }
      }

      // Si no encontramos un array, retornar array vacío
      console.warn(`⚠️ [useArrayQuery] ${endpoint} - No se encontró array, retornando []`);
      console.warn(`📦 [useArrayQuery] Estructura recibida:`, Object.keys(data || {}).join(', '));
      return [];
    },
    ...options,
  });
}

/**
 * Hook para obtener parques de forma segura
 */
export function useParks() {
  return useArrayQuery<{
    id: number;
    name: string;
    location?: string;
    [key: string]: any;
  }>("/api/parks", "parks");
}

/**
 * Hook para obtener usuarios de forma segura
 */
export function useUsers(role?: string) {
  const result = useArrayQuery<{
    id: number;
    username: string;
    fullName?: string;
    full_name?: string;
    role: string;
    [key: string]: any;
  }>("/api/users", "users");

  return {
    ...result,
    data: role 
      ? result.data?.filter(user => user.role === role) 
      : result.data,
  };
}

/**
 * Hook para obtener actividades de voluntariado de forma segura
 */
export function useVolunteerActivities() {
  return useArrayQuery<{
    id: number;
    name: string;
    activityDate: string;
    parkId: number;
    [key: string]: any;
  }>("/api/volunteer-activities");
}

/**
 * Hook para obtener voluntarios de forma segura
 */
export function useVolunteers() {
  return useArrayQuery<{
    id: number;
    fullName?: string;
    full_name?: string;
    email: string;
    [key: string]: any;
  }>("/api/users/volunteers");
}