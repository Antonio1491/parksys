import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Nueva función que no lee el body hasta que sea necesario
export async function safeApiRequest(url: string, options: any = {}) {
  const { method = "GET", data, headers: customHeaders = {} } = options;
  
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  // Añadir token de autenticación
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  let userId = "1";
  let userRole = "super_admin";
  
  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser);
      userId = userObj.id.toString();
      userRole = userObj.role || "admin";
    } catch (e) {
      console.error("Error parsing stored user:", e);
    }
  }
  
  requestHeaders["Authorization"] = storedToken ? `Bearer ${storedToken}` : "Bearer direct-token-1754063087518";
  requestHeaders["X-User-Id"] = userId;
  requestHeaders["X-User-Role"] = userRole;

  console.log(`🌐 [SAFE API] ${method} ${url}`);
  
  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    // Clonar la respuesta para poder leerla sin problemas
    const resClone = res.clone();
    let errorMessage;
    try {
      const errorData = await resClone.json();
      errorMessage = errorData.message || JSON.stringify(errorData);
    } catch {
      try {
        const errorText = await res.text();
        errorMessage = errorText;
      } catch {
        errorMessage = `HTTP error! status: ${res.status}`;
      }
    }
    throw new Error(errorMessage);
  }
  
  return res.json();
}

export async function apiRequest(
  url: string, 
  options: {
    method?: string;
    data?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<any> {
  // Para la ruta de inicio de sesión no queremos enviar credenciales predeterminadas
  const isLoginRequest = url === '/api/login';
  const method = options.method || 'GET';
  const data = options.data;
  
  // Añadimos un token de autenticación para desarrollo excepto para login
  let headers: Record<string, string> = {
    ...options.headers
  };
  
  // Solo agregamos las cabeceras de autorización si no es una petición de login
  if (!isLoginRequest) {
    // Intentar usar el token almacenado, o usar el token directo como respaldo
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    let userId = "1";
    let userRole = "super_admin";
    
    // Si hay un usuario almacenado, usamos su información
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        userId = userObj.id.toString();
        userRole = userObj.role || "admin";
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
    
    headers["Authorization"] = storedToken ? `Bearer ${storedToken}` : `Bearer direct-token-${Date.now()}`;
    headers["X-User-Id"] = userId;
    headers["X-User-Role"] = userRole;
  }
  
  // Solo añadimos Content-Type JSON si no es FormData
  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Preparamos el cuerpo de la petición
  let body = undefined;
  if (data) {
    if (data instanceof FormData) {
      body = data;
    } else {
      body = JSON.stringify(data);
    }
  }

  console.log(`🌐 [API REQUEST] ${method} ${url}`);
  
  // Debug específico para evaluaciones
  if (url.includes('/api/park-evaluations') && method === 'POST') {
    console.log('📋 POST a /api/park-evaluations detectado');
    console.log('📋 Data enviada:', JSON.stringify(data, null, 2));
    console.log('📋 Headers:', JSON.stringify(headers, null, 2));
    console.log('📋 Body preparado:', body);
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  // Debug para evaluaciones - ver respuesta del servidor
  if (url.includes('/api/park-evaluations') && method === 'POST') {
    console.log('📋 Respuesta del servidor:', res.status, res.ok);
  }

  // Para peticiones que no son de login, verificar si hay errores
  if (!isLoginRequest && !res.ok) {
    const resClone = res.clone();
    let errorMessage;
    try {
      const errorData = await resClone.json();
      errorMessage = errorData.message || JSON.stringify(errorData);
    } catch {
      try {
        const errorText = await res.text();
        errorMessage = errorText;
      } catch {
        errorMessage = `HTTP error! status: ${res.status}`;
      }
    }
    
    // Debug específico para evaluaciones
    if (url.includes('/api/park-evaluations') && method === 'POST') {
      console.error('📋 ERROR en evaluaciones:', res.status, errorMessage);
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
  }
  
  // Debug para evaluaciones - ver datos de respuesta exitosa
  if (url.includes('/api/park-evaluations') && method === 'POST') {
    const responseData = await res.json();
    console.log('📋 Respuesta exitosa del servidor:', JSON.stringify(responseData, null, 2));
    return responseData;
  }
  
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Obtener información de autenticación almacenada
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    let userId = "1";
    let userRole = "super_admin";
    
    // Si hay un usuario almacenado, usamos su información
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        userId = userObj.id.toString();
        userRole = userObj.role || "admin";
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
    
    // Añadimos encabezados de autenticación
    const headers: Record<string, string> = {
      "Authorization": storedToken ? `Bearer ${storedToken}` : "Bearer direct-token-1750522117022",
      "X-User-Id": userId,
      "X-User-Role": userRole
    };

    try {
      // Construir la URL correctamente concatenando todos los elementos del queryKey
      let url: string;
      if (queryKey.length === 1) {
        url = queryKey[0] as string;
      } else {
        // Para queryKeys con múltiples elementos, concatenar para formar la URL final
        // Ejemplo: ['/api/sponsorship-packages', '1', 'benefits'] => '/api/sponsorship-packages/1/benefits'
        url = queryKey.filter(Boolean).join('/');
      }
      
      // Permitir todas las solicitudes de amenidades y municipios
      // (Bloqueo anterior removido para permitir funcionamiento normal)
      
      console.log(`🌐 [QUERY] GET ${url}`);
      
      const res = await fetch(url, {
        credentials: "include",
        headers,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      if (!res.ok) {
        const resClone = res.clone();
        let errorMessage;
        try {
          const errorData = await resClone.json();
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
          try {
            const errorText = await res.text();
            errorMessage = errorText;
          } catch {
            errorMessage = `HTTP error! status: ${res.status}`;
          }
        }
        throw new Error(errorMessage);
      }
      return await res.json();
    } catch (error: unknown) {
      console.error('Query failed for:', queryKey[0], error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network connectivity issue:', error);
        // Try a simple connectivity test
        try {
          await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
        } catch (healthError) {
          console.error('Health check also failed:', healthError);
        }
        throw new Error('Network error: Unable to connect to server. Please refresh the page.');
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timeout:', error);
        throw new Error('Request timeout: Server is taking too long to respond.');
      }
      
      // For other errors, provide more context
      if (error instanceof Error) {
        throw new Error(`API Error: ${error.message}`);
      }
      
      throw new Error(`Unknown error: ${String(error)}`);
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
