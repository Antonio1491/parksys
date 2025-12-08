import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import ROUTES from '@/routes';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

/**
 * Componente que verifica permisos para rutas admin
 */
export function AdminRouteGuard() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const { isAllowed, isLoading: permissionLoading, requiredPermission, checkComplete } = useRouteGuard();

  const isAdminRoute = location.startsWith(ROUTES.dashboards.main) && 
                       location !== (ROUTES.auth.login) && 
                       location !== (ROUTES.auth.accessDenied);

  useEffect(() => {
    // Solo actuar cuando todo esté listo
    if (!isAdminRoute) return;
    if (authLoading || permissionLoading || !checkComplete) return;

    console.log(`[AdminRouteGuard] 🚦 Evaluando acceso:`, { 
      location, 
      isAuthenticated, 
      isAllowed, 
      requiredPermission 
    });

    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
      console.log(`[AdminRouteGuard] 🔒 Redirigiendo a login`);
      setLocation(ROUTES.auth.login);
      return;
    }

    // Si no tiene permiso, redirigir a acceso denegado
    if (!isAllowed) {
      console.log(`[AdminRouteGuard] ⛔ Acceso denegado, redirigiendo`);
      sessionStorage.setItem('accessDenied', JSON.stringify({
        attemptedRoute: location,
        requiredPermission,
        timestamp: Date.now()
      }));
      setLocation(ROUTES.auth.accessDenied);
    }
  }, [isAdminRoute, isAuthenticated, isAllowed, authLoading, permissionLoading, checkComplete, location, setLocation, requiredPermission]);

  return null;
}

/**
 * Componente de Loading - Solo muestra mientras auth está cargando inicialmente
 */
export function AdminLoadingGuard() {
  const [location] = useLocation();
  const { isLoading: authLoading } = useUnifiedAuth();
  const { isLoading: permissionLoading, checkComplete } = useRouteGuard();

  const isAdminRoute = location.startsWith(ROUTES.dashboards.main) && 
                       location !== (ROUTES.auth.login) && 
                       location !== (ROUTES.auth.accessDenied);

  // Solo mostrar loading en la carga inicial, no en cada cambio de estado
  const showLoading = isAdminRoute && authLoading && !checkComplete;

  if (showLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a587] mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Página de Acceso Denegado
 */
export function AccessDeniedPage() {
  const [, setLocation] = useLocation();

  const accessDeniedData = React.useMemo(() => {
    try {
      const data = sessionStorage.getItem('accessDenied');
      if (data) {
        const parsed = JSON.parse(data);
        sessionStorage.removeItem('accessDenied');
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing accessDenied data:', e);
    }
    return null;
  }, []);

  const requiredPermission = accessDeniedData?.requiredPermission;
  const permissionParts = requiredPermission?.split(':') || [];
  const [module, submodule, page, action] = permissionParts;

  const moduleLabels: Record<string, string> = {
    'management': 'Gestión',
    'operations': 'Operaciones',
    'admin-finance': 'Admin & Finanzas',
    'mkt-comm': 'Marketing & Comunicaciones',
    'hr': 'Recursos Humanos',
    'config-security': 'Configuración & Seguridad',
  };

  const actionLabels: Record<string, string> = {
    'view': 'ver',
    'create': 'crear',
    'edit': 'editar',
    'delete': 'eliminar',
    'admin': 'administrar',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">No tienes los permisos necesarios para acceder a esta sección.</p>

        {requiredPermission && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-2">Permiso requerido:</p>
            <div className="flex flex-wrap gap-2">
              {module && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {moduleLabels[module] || module}
                </span>
              )}
              {submodule && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {submodule}
                </span>
              )}
              {page && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {page}
                </span>
              )}
              {action && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {actionLabels[action] || action}
                </span>
              )}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-6">
          Si crees que deberías tener acceso, contacta a tu administrador.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setLocation(ROUTES.dashboards.main)}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-[#00a587] text-white rounded-lg hover:bg-[#008f74] transition-colors font-medium"
          >
            Ir al Dashboard
          </button>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminRouteGuard;