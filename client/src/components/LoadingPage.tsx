import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface LoadingPageProps {
  messageKey?: string;
  namespace?: string;
}

/**
 * Componente de carga reutilizable para fallbacks de Suspense
 * Usado en rutas públicas y administrativas con soporte i18n
 * 
 * @param messageKey - Clave de traducción (ej: 'loading.parks')
 * @param namespace - Namespace i18n (por defecto 'common')
 */
export default function LoadingPage({ 
  messageKey = 'loading.default', 
  namespace = 'common' 
}: LoadingPageProps) {
  const { t } = useTranslation(namespace);

  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-green-600 mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">{t(messageKey)}</p>
      </div>
    </div>
  );
}

/**
 * Variante compacta para uso en modales o secciones pequeñas
 */
export function LoadingPageCompact({ 
  messageKey = 'loading.default', 
  namespace = 'common' 
}: LoadingPageProps) {
  const { t } = useTranslation(namespace);

  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">{t(messageKey)}</p>
      </div>
    </div>
  );
}