import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  /**
   * Clave de traducción para el mensaje
   * @example "loading.parkData"
   */
  messageKey?: string;
  
  /**
   * Mensaje directo (fallback si no se proporciona messageKey)
   * @example "Cargando parques..."
   */
  message?: string;
  
  /**
   * Namespace i18n (por defecto 'common')
   */
  namespace?: string;
  
  /**
   * Variante visual
   * - 'admin': Con logo ParkSys, estilo formal
   * - 'public': Estilo limpio y amigable
   * @default 'admin'
   */
  variant?: 'public' | 'admin';
  
  /**
   * Tamaño del componente
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  
  /**
   * Altura mínima del contenedor
   * @default '200px'
   */
  minHeight?: string;
}

/**
 * Componente para mostrar estado de carga de datos dentro de páginas/componentes
 * 
 * Diferencias con LoadingPage:
 * - LoadingPage: Para lazy loading de RUTAS (archivos .js) en App.tsx
 * - LoadingState: Para carga de DATOS de API dentro de componentes ya cargados
 * 
 * @example Uso admin (por defecto)
 * ```tsx
 * if (isLoading) {
 *   return <LoadingState messageKey="loading.trees" />;
 * }
 * ```
 * 
 * @example Uso público
 * ```tsx
 * if (isLoading) {
 *   return <LoadingState variant="public" message="Cargando parques..." />;
 * }
 * ```
 */
export default function LoadingState({ 
  messageKey,
  message,
  namespace = 'common',
  variant = 'admin',
  size = 'default',
  minHeight = '200px'
}: LoadingStateProps) {
  const { t } = useTranslation(namespace);
  
  // Determinar texto a mostrar
  const displayText = messageKey ? t(messageKey) : message || t('loading.default');
  
  // Configuración de tamaños
  const sizeConfig = {
    sm: {
      spinner: 'h-6 w-6',
      text: 'text-xs',
      spacing: 'space-y-2',
      logo: 'w-12 h-12',
    },
    default: {
      spinner: 'h-10 w-10',
      text: 'text-sm',
      spacing: 'space-y-3',
      logo: 'w-16 h-16',
    },
    lg: {
      spinner: 'h-12 w-12',
      text: 'text-base',
      spacing: 'space-y-4',
      logo: 'w-20 h-20',
    },
  };
  
  const config = sizeConfig[size];

  // ===== VARIANTE ADMIN =====
  if (variant === 'admin') {
    return (
      <div 
        className="flex items-center justify-center w-full"
        style={{ minHeight }}
      >
        <div className={`flex flex-col items-center ${config.spacing}`}>
          {/* Logo ParkSys */}
          <div className={`${config.logo} mb-2`}>
            {/* 
              TODO: Reemplazar con logo de ParkSys
              <img 
                src="/images/parksys-logo.svg" 
                alt="ParkSys" 
                className="h-full w-auto animate-pulse"
              />
            */}
            <div className="w-full h-full bg-gradient-to-br from-[#00a587]/30 to-[#00444f]/30 rounded-xl flex items-center justify-center animate-pulse">
              {/* Placeholder para logo - Reemplazar con imagen real */}
              <span className="text-[#00444f] font-bold text-xs">LOGO</span>
            </div>
          </div>
          
          {/* Spinner */}
          <Loader2 className={`${config.spinner} animate-spin text-[#00a587]`} />
          
          {/* Mensaje */}
          <p className={`${config.text} text-muted-foreground text-center max-w-md`}>
            {displayText}
          </p>
        </div>
      </div>
    );
  }

  // ===== VARIANTE PUBLIC =====
  return (
    <div 
      className="flex items-center justify-center w-full"
      style={{ minHeight }}
    >
      <div className={`flex flex-col items-center ${config.spacing}`}>
        {/* Spinner con estilo público */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
          <Loader2 className={`${config.spinner} animate-spin text-primary relative`} />
        </div>
        
        {/* Mensaje */}
        <p className={`${config.text} text-gray-500 text-center max-w-md`}>
          {displayText}
        </p>
      </div>
    </div>
  );
}

/**
 * Variante inline para usar junto a otro contenido
 * Útil para botones, cards, etc.
 * No tiene variantes public/admin - es neutral
 * 
 * @example
 * ```tsx
 * <Button disabled={isLoading}>
 *   {isLoading ? <LoadingStateInline messageKey="saving" /> : 'Guardar'}
 * </Button>
 * ```
 */
export function LoadingStateInline({ 
  messageKey,
  message,
  namespace = 'common'
}: Omit<LoadingStateProps, 'size' | 'minHeight' | 'variant'>) {
  const { t } = useTranslation(namespace);
  const displayText = messageKey ? t(messageKey) : message || t('loading.default');

  return (
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">{displayText}</span>
    </div>
  );
}
