import React, { Suspense } from 'react';
import { Redirect } from 'wouter';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import LoadingPage from '@/components/LoadingPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rutas administrativas
 * - Verifica autenticación
 * - Verifica permisos según routePermissions
 * - Muestra página de acceso denegado si no tiene permisos
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const { isAllowed, isLoading: permissionLoading, requiredPermission } = useRouteGuard();

  // Mostrar loading mientras se verifica
  if (authLoading || permissionLoading) {
    return <LoadingPage messageKey="loading.verificandoPermisos" />;
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Redirect to="/admin/login" />;
  }

  // Si no tiene permiso, mostrar página de acceso denegado
  if (!isAllowed) {
    return <AccessDeniedPage requiredPermission={requiredPermission} />;
  }

  // Si tiene permiso, renderizar el contenido
  return <>{children}</>;
}

/**
 * Página de acceso denegado
 */
function AccessDeniedPage({ requiredPermission }: { requiredPermission: string | null }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg 
            className="w-8 h-8 text-red-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V9m0 0V7m0 2h2m-2 0H9m10 10a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Acceso Denegado
        </h1>

        <p className="text-gray-600 mb-6">
          No tienes los permisos necesarios para acceder a esta sección.
        </p>

        {requiredPermission && (
          <p className="text-sm text-gray-500 mb-6 bg-gray-50 rounded p-2 font-mono">
            Permiso requerido: {requiredPermission}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/admin"
            className="inline-flex items-center justify-center px-4 py-2 bg-[#00a587] text-white rounded-lg hover:bg-[#008f74] transition-colors"
          >
            Ir al Dashboard
          </a>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProtectedRoute;