type SidebarSubmenus = Record<string, (string | ((id: string | number) => string))[]>;
type ModuleGrouping = Record<string, string[]>;

/**
 * Deriva los módulos del sidebar a partir de los submenús
 * Convierte el mapa de módulo -> [submenús] en módulo -> [rutas]
 */
export const deriveSidebarModules = (
  submenus: SidebarSubmenus,
  moduleMap: Record<string, string[]>
): ModuleGrouping => {
  const modules: ModuleGrouping = {};

  for (const [moduleKey, submenuIds] of Object.entries(moduleMap)) {
    modules[moduleKey] = submenuIds.flatMap(submenuId => {
      const routes = submenus[submenuId] || [];
      // Solo incluir rutas tipo string, filtrar las funciones
      return routes.filter(route => typeof route === 'string') as string[];
    });
  }

  return modules;
};

/**
 * Determina qué submenu está activo basado en la ubicación actual
 * Compara la ruta actual con todas las rutas de cada submenu
 */
export const getActiveSubmenuFromLocation = (
  location: string,
  submenus: SidebarSubmenus
): string | null => {
  // Buscar la coincidencia más específica (ruta más larga)
  let bestMatch: { submenuId: string; matchLength: number } | null = null;

  for (const [submenuId, routes] of Object.entries(submenus)) {
    for (const route of routes) {
      // Convertir funciones a rutas con placeholder
      const path = typeof route === 'function' ? route(':id') : route;

      // Normalizar rutas dinámicas - remover parámetros
      const normalized = path.replace(/:id|:slug|:uuid|:[\w]+/g, '[^/]+');
      const regex = new RegExp(`^${normalized}`);

      // Si la ubicación coincide con esta ruta
      if (regex.test(location) || location.startsWith(path.split(':')[0])) {
        const matchLength = path.split(':')[0].length;

        // Guardar si es la mejor coincidencia hasta ahora
        if (!bestMatch || matchLength > bestMatch.matchLength) {
          bestMatch = { submenuId, matchLength };
        }
      }
    }
  }

  return bestMatch?.submenuId || null;
};

/**
 * Determina qué módulo está activo basado en la ubicación actual
 * Compara la ruta actual con todas las rutas de cada módulo
 */
export const getActiveModuleFromLocation = (
  location: string,
  modules: ModuleGrouping
): string | null => {
  // Buscar la coincidencia más específica
  let bestMatch: { moduleKey: string; matchLength: number } | null = null;

  for (const [moduleKey, routes] of Object.entries(modules)) {
    for (const route of routes) {
      if (location.startsWith(route)) {
        const matchLength = route.length;

        // Guardar si es la mejor coincidencia hasta ahora
        if (!bestMatch || matchLength > bestMatch.matchLength) {
          bestMatch = { moduleKey, matchLength };
        }
      }
    }
  }

  return bestMatch?.moduleKey || null;
};