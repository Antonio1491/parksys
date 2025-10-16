type SidebarSubmenus = Record<string, (string | ((id: string | number) => string))[]>;
type ModuleGrouping = Record<string, string[]>;

export const deriveSidebarModules = (
  submenus: SidebarSubmenus,
  moduleMap: Record<string, string[]>
): ModuleGrouping => {
  const modules: ModuleGrouping = {};
  for (const [moduleKey, submenuIds] of Object.entries(moduleMap)) {
    modules[moduleKey] = submenuIds.flatMap(submenuId => {
      const routes = submenus[submenuId] || [];
      return routes.filter(route => typeof route === 'string');
    });
  }
  return modules;
};

export const getActiveSubmenuFromLocation = (
  location: string,
  submenus: SidebarSubmenus
): string | null => {
  for (const [submenuId, routes] of Object.entries(submenus)) {
    for (const route of routes) {
      const path = typeof route === 'function' ? route(':id') : route;
      const normalized = path.replace(/:id|:slug|:uuid|:.*?/g, ''); // para rutas dinámicas
      if (location.startsWith(normalized)) {
        return submenuId;
      }
    }
  }
  return null;
};

export const getActiveModuleFromLocation = (
  location: string,
  modules: ModuleGrouping
): string | null => {
  for (const [moduleKey, routes] of Object.entries(modules)) {
    for (const route of routes) {
      if (location.startsWith(route)) {
        return moduleKey;
      }
    }
  }
  return null;
};