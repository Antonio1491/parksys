import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorStateProps {
  /**
   * Error object de React Query o custom
   */
  error?: Error | unknown;
  
  /**
   * Título del error
   */
  title?: string;
  
  /**
   * Mensaje del error
   * Si no se proporciona, intenta usar error.message
   */
  message?: string;
  
  /**
   * Función para reintentar la operación
   */
  onRetry?: () => void;
  
  /**
   * Texto del botón de retry
   * @default "Reintentar"
   */
  retryText?: string;
  
  /**
   * Namespace i18n
   * @default 'common'
   */
  namespace?: string;
  
  /**
   * Variante visual
   * - 'admin': Con logo ParkSys, Alert formal, detalles técnicos
   * - 'public': Estilo amigable, mensaje esperanzador
   * @default 'admin'
   */
  variant?: 'public' | 'admin';
  
  /**
   * Mostrar detalles técnicos del error (solo en admin)
   * @default false
   */
  showDetails?: boolean;
  
  /**
   * Tamaño del componente
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  
  /**
   * Mensaje secundario esperanzador (usado en variante public)
   */
  secondaryText?: string;
}

/**
 * Componente para mostrar estados de error con opción de reintentar
 * 
 * @example Uso admin (por defecto)
 * ```tsx
 * if (error) {
 *   return (
 *     <ErrorState 
 *       error={error} 
 *       onRetry={refetch}
 *       title="Error al cargar árboles"
 *     />
 *   );
 * }
 * ```
 * 
 * @example Uso público
 * ```tsx
 * if (error) {
 *   return (
 *     <ErrorState 
 *       variant="public"
 *       title="No pudimos cargar los parques"
 *       message="Estamos trabajando para solucionarlo"
 *       secondaryText="Por favor, intenta de nuevo en unos minutos"
 *       onRetry={refetch}
 *     />
 *   );
 * }
 * ```
 */
export default function ErrorState({
  error,
  title,
  message,
  onRetry,
  retryText,
  namespace = 'common',
  variant = 'admin',
  showDetails = false,
  size = 'default',
  secondaryText
}: ErrorStateProps) {
  const { t } = useTranslation(namespace);
  
  // Extraer mensaje del error
  const errorMessage = message || 
    (error instanceof Error ? error.message : undefined) ||
    t('error.generic');
  
  const errorTitle = title || t('error.title');
  const buttonText = retryText || t('error.retry');
  
  // Configuración de tamaños
  const sizeConfig = {
    sm: {
      container: 'py-8 px-4',
      iconWrapper: 'w-12 h-12',
      icon: 'h-6 w-6',
      title: 'text-base',
      message: 'text-sm',
      logo: 'w-10 h-10',
    },
    default: {
      container: 'py-12 px-4',
      iconWrapper: 'w-16 h-16',
      icon: 'h-8 w-8',
      title: 'text-lg',
      message: 'text-sm',
      logo: 'w-14 h-14',
    },
    lg: {
      container: 'py-16 px-4',
      iconWrapper: 'w-20 h-20',
      icon: 'h-10 w-10',
      title: 'text-xl',
      message: 'text-base',
      logo: 'w-16 h-16',
    },
  };
  
  const config = sizeConfig[size];

  // ===== VARIANTE ADMIN =====
  if (variant === 'admin') {
    return (
      <div className={`flex items-center justify-center w-full ${config.container}`}>
        <div className="max-w-2xl w-full">
          {/* Logo ParkSys */}
          <div className="flex justify-center mb-4">
            <div className={`${config.logo}`}>
              {/* 
                TODO: Reemplazar con logo de ParkSys
                <img 
                  src="/images/parksys-logo.svg" 
                  alt="ParkSys" 
                  className="h-full w-auto opacity-50"
                />
              */}
              <div className="w-full h-full bg-gradient-to-br from-[#00a587]/20 to-[#00444f]/20 rounded-xl flex items-center justify-center opacity-60">
                {/* Placeholder para logo - Reemplazar con imagen real */}
                <span className="text-[#00444f] font-bold text-xs">LOGO</span>
              </div>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className={`${config.title} font-semibold mb-2`}>
              {errorTitle}
            </AlertTitle>
            <AlertDescription className="space-y-4">
              <p className={config.message}>{errorMessage}</p>
              
              {showDetails && error instanceof Error && error.stack && (
                <details className="text-xs bg-black/10 p-3 rounded-md">
                  <summary className="cursor-pointer font-medium mb-2">
                    Detalles técnicos
                  </summary>
                  <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </details>
              )}
              
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {buttonText}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // ===== VARIANTE PUBLIC =====
  return (
    <div className={`flex items-center justify-center w-full ${config.container}`}>
      <div className="flex flex-col items-center text-center max-w-md">
        {/* Icono con estilo amigable */}
        <div className={`${config.iconWrapper} bg-orange-100 rounded-full flex items-center justify-center mb-6`}>
          <AlertTriangle className={`${config.icon} text-orange-500`} />
        </div>
        
        {/* Título */}
        <h3 className={`${config.title} font-medium text-gray-700 mb-2`}>
          {errorTitle}
        </h3>
        
        {/* Mensaje principal */}
        <p className={`${config.message} text-gray-500 mb-2`}>
          {errorMessage}
        </p>
        
        {/* Mensaje secundario esperanzador */}
        {secondaryText && (
          <p className={`${config.message} text-gray-400`}>
            {secondaryText}
          </p>
        )}
        
        {/* Botón de retry (más sutil en público) */}
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="ghost"
            size="sm"
            className="gap-2 mt-6 text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Variante inline para usar dentro de secciones
 * Útil cuando el error es de una parte de la página, no toda
 * 
 * @example
 * ```tsx
 * <div className="grid grid-cols-2 gap-4">
 *   <ActivityCard data={activity} />
 *   {eventsError ? (
 *     <ErrorStateInline error={eventsError} onRetry={refetchEvents} />
 *   ) : (
 *     <EventsWidget data={events} />
 *   )}
 * </div>
 * ```
 */
export function ErrorStateInline({
  error,
  message,
  onRetry,
  retryText,
  namespace = 'common'
}: Omit<ErrorStateProps, 'variant' | 'size' | 'showDetails' | 'title' | 'secondaryText'>) {
  const { t } = useTranslation(namespace);
  
  const errorMessage = message || 
    (error instanceof Error ? error.message : undefined) ||
    t('error.generic');
  const buttonText = retryText || t('error.retry');

  return (
    <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
      <p className="text-sm text-muted-foreground flex-1">{errorMessage}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="ghost"
          size="sm"
          className="gap-1.5 flex-shrink-0 h-7"
        >
          <RefreshCw className="h-3 w-3" />
          <span className="text-xs">{buttonText}</span>
        </Button>
      )}
    </div>
  );
}

/**
 * Helper para usar con React Query
 * 
 * @example
 * ```tsx
 * const query = useQuery(['/api/parks']);
 * 
 * if (query.error) {
 *   return <ErrorStateQuery query={query} variant="public" />;
 * }
 * ```
 */
export function ErrorStateQuery({
  query,
  variant = 'admin',
  title,
  message,
  secondaryText
}: Omit<ErrorStateProps, 'error' | 'onRetry'> & {
  query: { error: unknown; refetch: () => void };
}) {
  return (
    <ErrorState
      error={query.error}
      onRetry={query.refetch}
      variant={variant}
      title={title}
      message={message}
      secondaryText={secondaryText}
    />
  );
}
