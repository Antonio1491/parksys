import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { getRoutePermission, isAdminRoute } from '@/config/routePermissions';

interface RouteGuardResult {
  isAllowed: boolean;
  isLoading: boolean;
  requiredPermission: string | null;
  checkComplete: boolean;
}

// Cache de permisos para evitar llamadas repetidas
let permissionsCache: { userId: number; permissions: any; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Hook que verifica si el usuario actual tiene permiso para acceder a la ruta actual
 * Sistema híbrido: submódulo (default) + página (override)
 */
export function useRouteGuard(): RouteGuardResult {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const [state, setState] = useState<RouteGuardResult>({
    isAllowed: true, // Default a true para evitar flash de "acceso denegado"
    isLoading: true,
    requiredPermission: null,
    checkComplete: false,
  });

  // Ref para evitar llamadas duplicadas
  const isCheckingRef = useRef(false);
  const lastCheckRef = useRef<string>('');

  const checkPermission = useCallback(async () => {
    const checkKey = `${location}-${user?.id}-${isAuthenticated}-${authLoading}`;

    // Evitar verificaciones duplicadas
    if (isCheckingRef.current || lastCheckRef.current === checkKey) {
      return;
    }

    console.log(`[useRouteGuard] 🔍 Iniciando verificación para: ${location}`);
    console.log(`[useRouteGuard] 📊 Estado auth:`, { isAuthenticated, authLoading, userId: user?.id, roleId: user?.roleId });

    // Si no es ruta admin, permitir sin más verificación
    if (!isAdminRoute(location)) {
      console.log(`[useRouteGuard] ✅ Ruta pública, permitiendo: ${location}`);
      setState({ isAllowed: true, isLoading: false, requiredPermission: null, checkComplete: true });
      lastCheckRef.current = checkKey;
      return;
    }

    // Si aún está cargando auth, esperar (pero no bloquear indefinidamente)
    if (authLoading) {
      console.log(`[useRouteGuard] ⏳ Auth cargando, esperando...`);
      return;
    }

    // Si no está autenticado, no tiene acceso
    if (!isAuthenticated || !user) {
      console.log(`[useRouteGuard] ❌ No autenticado, denegando acceso`);
      setState({ isAllowed: false, isLoading: false, requiredPermission: null, checkComplete: true });
      lastCheckRef.current = checkKey;
      return;
    }

    // Marcar que estamos verificando
    isCheckingRef.current = true;

    // Obtener configuración de permiso para esta ruta
    const routeConfig = getRoutePermission(location);
    console.log(`[useRouteGuard] 📋 Configuración de ruta:`, routeConfig);

    // Si la ruta no está en el mapeo, permitir acceso
    if (!routeConfig) {
      console.log(`[useRouteGuard] ⚠️ Ruta no mapeada, permitiendo por defecto: ${location}`);
      setState({ isAllowed: true, isLoading: false, requiredPermission: null, checkComplete: true });
      isCheckingRef.current = false;
      lastCheckRef.current = checkKey;
      return;
    }

    // Si la ruta no requiere permiso específico (permission: null)
    if (!routeConfig.permission) {
      console.log(`[useRouteGuard] ✅ Ruta sin permiso requerido, permitiendo`);
      setState({ isAllowed: true, isLoading: false, requiredPermission: null, checkComplete: true });
      isCheckingRef.current = false;
      lastCheckRef.current = checkKey;
      return;
    }

    // Super Admin (roleId === 1) siempre tiene acceso
    if (user.roleId === 1 || user.role === 'super-admin') {
      console.log(`[useRouteGuard] 👑 Super Admin detectado, permitiendo acceso total`);
      setState({ isAllowed: true, isLoading: false, requiredPermission: routeConfig.permission, checkComplete: true });
      isCheckingRef.current = false;
      lastCheckRef.current = checkKey;
      return;
    }

    console.log(`[useRouteGuard] 🔐 Verificando permiso: ${routeConfig.permission} para usuario ${user.id}`);

    // Verificar permiso específico consultando al backend (con cache)
    try {
      let permissions: any;

      // Usar cache si está disponible y válido
      if (
        permissionsCache && 
        permissionsCache.userId === user.id && 
        Date.now() - permissionsCache.timestamp < CACHE_TTL
      ) {
        console.log(`[useRouteGuard] 📦 Usando permisos del cache`);
        permissions = permissionsCache.permissions;
      } else {
        console.log(`[useRouteGuard] 🌐 Obteniendo permisos del servidor...`);
        const response = await fetch(`/api/users/${user.id}/permissions`);
        if (!response.ok) {
          console.error(`[useRouteGuard] ❌ Error obteniendo permisos: ${response.status}`);
          setState({ isAllowed: false, isLoading: false, requiredPermission: routeConfig.permission, checkComplete: true });
          isCheckingRef.current = false;
          lastCheckRef.current = checkKey;
          return;
        }

        const data = await response.json();
        permissions = data.permissions;
        console.log(`[useRouteGuard] 📥 Permisos recibidos:`, Object.keys(permissions));

        // Guardar en cache
        permissionsCache = {
          userId: user.id,
          permissions,
          timestamp: Date.now(),
        };
      }

      // Si tiene all: true (Super Admin via backend)
      if (permissions.all === true) {
        console.log(`[useRouteGuard] 👑 Permiso total (all:true), permitiendo`);
        setState({ isAllowed: true, isLoading: false, requiredPermission: routeConfig.permission, checkComplete: true });
        isCheckingRef.current = false;
        lastCheckRef.current = checkKey;
        return;
      }

      // Verificar permiso con sistema híbrido
      const hasPermission = checkUserHasPermission(permissions, routeConfig.permission);

      console.log(`[useRouteGuard] 🎯 Resultado final: ${hasPermission ? '✅ PERMITIDO' : '❌ DENEGADO'}`);

      setState({ 
        isAllowed: hasPermission, 
        isLoading: false, 
        requiredPermission: routeConfig.permission, 
        checkComplete: true 
      });
    } catch (error) {
      console.error('[useRouteGuard] 💥 Error verificando permisos:', error);
      setState({ isAllowed: false, isLoading: false, requiredPermission: routeConfig.permission, checkComplete: true });
    }

    isCheckingRef.current = false;
    lastCheckRef.current = checkKey;
  }, [location, user?.id, user?.roleId, user?.role, isAuthenticated, authLoading]);

  useEffect(() => {
    // Solo ejecutar si auth terminó de cargar
    if (!authLoading) {
      checkPermission();
    }
  }, [checkPermission, authLoading]);

  return state;
}

/**
 * Verifica si el usuario tiene el permiso requerido
 * Sistema híbrido: submódulo (default) + página (override)
 */
function checkUserHasPermission(userPermissions: Record<string, string[]>, requiredPermission: string): boolean {
  // Limpiar metadata y campos no relacionados con permisos
  const cleanPermissions = { ...userPermissions };
  delete cleanPermissions.metadata;
  delete cleanPermissions.source;
  delete cleanPermissions.userId;

  const parts = requiredPermission.split(':');
  if (parts.length !== 4) {
    console.warn(`[useRouteGuard] ⚠️ Formato de permiso inválido: ${requiredPermission}. Esperado: module:submodule:page:action`);
    return false;
  }

  const [module, submodule, page, action] = parts;

  console.log(`[useRouteGuard] 🔎 Verificando permiso:`, { module, submodule, page, action });

  // Jerarquía de acciones
  const actionHierarchy: Record<string, string[]> = {
    'view': ['view', 'create', 'edit', 'delete', 'admin', 'manage'],
    'create': ['create', 'edit', 'delete', 'admin', 'manage'],
    'edit': ['edit', 'delete', 'admin', 'manage'],
    'delete': ['delete', 'admin', 'manage'],
    'admin': ['admin', 'manage'],
    'manage': ['manage', 'admin'],
  };

  const allowedActions = actionHierarchy[action] || [action];

  // NIVEL 2 (Override): Buscar permiso específico de página
  const pagePermissionKey = `${module}.${submodule}.${page}`;
  const pageActions = cleanPermissions[pagePermissionKey];

  if (pageActions && Array.isArray(pageActions) && pageActions.length > 0) {
    const hasPagePermission = pageActions.some(userAction => allowedActions.includes(userAction));
    console.log(`[useRouteGuard] 📄 Permiso de página [${pagePermissionKey}]:`, { 
      userActions: pageActions, 
      requiredAction: action,
      allowedActions,
      result: hasPagePermission ? '✅' : '❌'
    });
    return hasPagePermission;
  }

  // NIVEL 1 (Default): Buscar permiso de submódulo
  const submodulePermissionKey = `${module}.${submodule}`;
  const submoduleActions = cleanPermissions[submodulePermissionKey];

  console.log(`[useRouteGuard] 📁 Buscando permiso de submódulo [${submodulePermissionKey}]:`, submoduleActions);

  if (!submoduleActions || !Array.isArray(submoduleActions)) {
    console.log(`[useRouteGuard] ❌ No se encontró permiso para: ${submodulePermissionKey}`);
    return false;
  }

  const hasSubmodulePermission = submoduleActions.some(userAction => allowedActions.includes(userAction));
  console.log(`[useRouteGuard] 📁 Permiso de submódulo [${submodulePermissionKey}]:`, { 
    userActions: submoduleActions, 
    requiredAction: action,
    allowedActions,
    result: hasSubmodulePermission ? '✅' : '❌'
  });

  return hasSubmodulePermission;
}

/**
 * Función para invalidar el cache de permisos
 */
export function invalidatePermissionsCache(): void {
  permissionsCache = null;
  console.log('[useRouteGuard] 🗑️ Cache de permisos invalidado');
}