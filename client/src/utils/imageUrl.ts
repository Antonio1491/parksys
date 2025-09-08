/**
 * Utilitario para transformar URLs de imágenes al sistema unificado de almacenamiento
 * 
 * Convierte URLs del formato `/uploads/...` al sistema híbrido `/api/storage/file/...`
 * que funciona tanto con Replit Object Storage como con filesystem fallback.
 */
export function transformImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  
  // Si la URL ya está en el formato correcto, devolverla tal como está
  if (imageUrl.startsWith('/api/storage/') || imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
    return imageUrl;
  }
  
  // Transformar URLs que empiecen con /uploads/ al sistema unificado
  if (imageUrl.startsWith('/uploads/')) {
    return `/api/storage/file/${encodeURIComponent(imageUrl.replace(/^\//, ''))}`;
  }
  
  // Para cualquier otro formato, devolverla tal como está
  return imageUrl;
}

/**
 * Hook personalizado para usar con imágenes de eventos, actividades, etc.
 */
export function useImageUrl(imageUrl: string | null | undefined): string | null {
  return transformImageUrl(imageUrl);
}