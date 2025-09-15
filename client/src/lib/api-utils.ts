/**
 * Utilidades para normalización de respuestas de API
 */

/**
 * Normaliza respuestas de API que pueden venir como array directo o como { data: T[] }
 * @param response - La respuesta de la API
 * @returns Array normalizado
 */
export const normalizeListResponse = <T>(response: any): T[] => {
  if (Array.isArray(response)) {
    return response;
  }
  if (response && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
};

/**
 * Obtiene iniciales de un nombre completo
 * @param fullName - Nombre completo
 * @returns Iniciales (máximo 2 caracteres)
 */
export const getInitials = (fullName: string): string => {
  if (!fullName) return '??';
  
  const parts = fullName.split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};