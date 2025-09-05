import { useMemo } from 'react';

// Tipos para el sistema dinámico de módulos
export interface ModuleAction {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface SubModule {
  id: string;
  name: string;
  icon?: string;
  path?: string;
  actions: ModuleAction[];
}

export interface SystemModule {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  subModules: SubModule[];
}

export interface AdaptiveModulesStructure {
  modules: SystemModule[];
  flatModules: string[]; // ['gestion.parques', 'gestion.actividades', ...]
  moduleMap: Record<string, SystemModule>;
  subModuleMap: Record<string, SubModule>;
}

// Definición de acciones CRUD estándar
export const CRUD_ACTIONS: ModuleAction[] = [
  { id: 'read', name: 'Ver/Leer', icon: 'Eye', description: 'Visualizar información y listados' },
  { id: 'create', name: 'Crear', icon: 'Plus', description: 'Crear nuevos elementos' },
  { id: 'update', name: 'Editar', icon: 'Edit', description: 'Modificar elementos existentes' },
  { id: 'delete', name: 'Eliminar', icon: 'Trash', description: 'Eliminar elementos' },
  { id: 'admin', name: 'Administrar', icon: 'Settings', description: 'Control total del módulo' }
];

// Configuración dinámica basada en CollapsibleSubmenu de AdminSidebarComplete.tsx
const SYSTEM_SUBMENU_CONFIG: SubModule[] = [
  // GESTIÓN
  { id: 'parques', name: 'Parques', icon: 'MapPin', path: '/admin/parks', actions: CRUD_ACTIONS },
  { id: 'actividades', name: 'Actividades', icon: 'Calendar', path: '/admin/activities', actions: CRUD_ACTIONS },
  { id: 'amenidades', name: 'Amenidades', icon: 'Package', path: '/admin/amenities', actions: CRUD_ACTIONS },
  { id: 'arbolado', name: 'Arbolado', icon: 'TreePine', path: '/admin/trees', actions: CRUD_ACTIONS },
  { id: 'fauna', name: 'Fauna', icon: 'Heart', path: '/admin/fauna', actions: CRUD_ACTIONS },
  { id: 'visitantes', name: 'Visitantes', icon: 'Users', path: '/admin/visitors', actions: CRUD_ACTIONS },
  { id: 'eventos', name: 'Eventos', icon: 'CalendarDays', path: '/admin/events', actions: CRUD_ACTIONS },
  { id: 'reservas', name: 'Reservas', icon: 'CalendarClock', path: '/admin/space-reservations', actions: CRUD_ACTIONS },
  { id: 'evaluaciones', name: 'Evaluaciones', icon: 'Star', path: '/admin/evaluaciones', actions: CRUD_ACTIONS },
  
  // OPERACIONES Y MANTENIMIENTO
  { id: 'activos', name: 'Activos', icon: 'Package', path: '/admin/assets', actions: CRUD_ACTIONS },
  { id: 'incidencias', name: 'Incidencias', icon: 'AlertTriangle', path: '/admin/incidents', actions: CRUD_ACTIONS },
  { id: 'voluntarios', name: 'Voluntarios', icon: 'HandHeart', path: '/admin/volunteers', actions: CRUD_ACTIONS },
  
  // FINANZAS 
  { id: 'finanzas', name: 'Finanzas', icon: 'DollarSign', path: '/admin/finance', actions: CRUD_ACTIONS },
  { id: 'contabilidad', name: 'Contabilidad', icon: 'Calculator', path: '/admin/accounting', actions: CRUD_ACTIONS },
  { id: 'concesiones', name: 'Concesiones', icon: 'Store', path: '/admin/concessions', actions: CRUD_ACTIONS },
  
  // MARKETING Y COMUNICACIONES
  { id: 'marketing', name: 'Marketing', icon: 'Megaphone', path: '/admin/communications/marketing', actions: CRUD_ACTIONS },
  { id: 'advertising', name: 'Publicidad', icon: 'Image', path: '/admin/communications/advertising', actions: CRUD_ACTIONS },
  { id: 'communications', name: 'Comunicaciones', icon: 'Mail', path: '/admin/communications', actions: CRUD_ACTIONS },
  
  // RECURSOS HUMANOS
  { id: 'empleados', name: 'Empleados', icon: 'Users', path: '/admin/hr/employees', actions: CRUD_ACTIONS },
  { id: 'nomina', name: 'Nómina', icon: 'CreditCard', path: '/admin/hr/payroll', actions: CRUD_ACTIONS },
  { id: 'vacaciones', name: 'Vacaciones', icon: 'Calendar', path: '/admin/hr/vacations', actions: CRUD_ACTIONS },
  
  // CONFIGURACIÓN Y SEGURIDAD
  { id: 'control-acceso', name: 'Control Acceso', icon: 'Shield', path: '/admin/configuracion-seguridad/access', actions: CRUD_ACTIONS },
  { id: 'politicas', name: 'Políticas', icon: 'FileText', path: '/admin/configuracion-seguridad/policies', actions: CRUD_ACTIONS },
  { id: 'notificaciones', name: 'Notificaciones', icon: 'Bell', path: '/admin/configuracion-seguridad/notifications', actions: CRUD_ACTIONS },
  { id: 'auditoria', name: 'Auditoría', icon: 'History', path: '/admin/configuracion-seguridad/audit', actions: CRUD_ACTIONS },
  { id: 'mantenimiento-sistema', name: 'Mantenimiento', icon: 'Settings', path: '/admin/configuracion-seguridad/maintenance', actions: CRUD_ACTIONS },
  { id: 'exportaciones', name: 'Exportaciones', icon: 'Download', path: '/admin/configuracion-seguridad/exports', actions: CRUD_ACTIONS },
];

// Configuración agrupada por módulos principales
const SYSTEM_MODULES_CONFIG: SystemModule[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'Home',
    color: '#61B1A0',
    description: 'Panel de control principal',
    subModules: [
      { id: 'dashboard', name: 'Dashboard', icon: 'BarChart3', path: '/admin', actions: CRUD_ACTIONS.filter(a => ['read'].includes(a.id)) }
    ]
  },
  {
    id: 'gestion',
    name: 'Gestión',
    icon: 'Building',
    color: '#513C73',
    description: 'Gestión de parques, actividades y eventos',
    subModules: [
      {
        id: 'parques',
        name: 'Parques',
        icon: 'MapPin',
        path: '/admin/parks',
        actions: CRUD_ACTIONS
      },
      {
        id: 'actividades',
        name: 'Actividades',
        icon: 'Calendar',
        path: '/admin/activities',
        actions: CRUD_ACTIONS
      },
      {
        id: 'eventos',
        name: 'Eventos',
        icon: 'CalendarDays',
        path: '/admin/events',
        actions: CRUD_ACTIONS
      },
      {
        id: 'reservas',
        name: 'Reservas',
        icon: 'CalendarClock',
        path: '/admin/space-reservations',
        actions: CRUD_ACTIONS
      },
      {
        id: 'evaluaciones',
        name: 'Evaluaciones',
        icon: 'Star',
        path: '/admin/evaluaciones',
        actions: CRUD_ACTIONS
      }
    ]
  },
  {
    id: 'operaciones',
    name: 'O & M',
    icon: 'Wrench',
    color: '#F59E0B',
    description: 'Operaciones y Mantenimiento',
    subModules: [
      {
        id: 'activos',
        name: 'Activos',
        icon: 'Package',
        path: '/admin/assets',
        actions: CRUD_ACTIONS
      },
      {
        id: 'incidencias',
        name: 'Incidencias',
        icon: 'AlertTriangle',
        path: '/admin/incidents',
        actions: CRUD_ACTIONS
      },
      {
        id: 'voluntarios',
        name: 'Voluntarios',
        icon: 'HandHeart',
        path: '/admin/volunteers',
        actions: CRUD_ACTIONS
      },
      {
        id: 'arbolado',
        name: 'Arbolado',
        icon: 'TreePine',
        path: '/admin/trees',
        actions: CRUD_ACTIONS
      },
      {
        id: 'fauna',
        name: 'Fauna',
        icon: 'Bird',
        path: '/admin/fauna',
        actions: CRUD_ACTIONS
      }
    ]
  },
  {
    id: 'finanzas',
    name: 'Admin/Finanzas',
    icon: 'DollarSign',
    color: '#059669',
    description: 'Administración financiera y recursos humanos',
    subModules: [
      {
        id: 'finanzas-core',
        name: 'Finanzas',
        icon: 'CircleDollarSign',
        path: '/admin/finance',
        actions: CRUD_ACTIONS
      },
      {
        id: 'recursos-humanos',
        name: 'Recursos Humanos',
        icon: 'Users',
        path: '/admin/hr',
        actions: CRUD_ACTIONS
      },
      {
        id: 'contabilidad',
        name: 'Contabilidad',
        icon: 'Calculator',
        path: '/admin/accounting',
        actions: CRUD_ACTIONS
      },
      {
        id: 'concesiones',
        name: 'Concesiones',
        icon: 'Store',
        path: '/admin/concessions',
        actions: CRUD_ACTIONS
      }
    ]
  },
  {
    id: 'comunicaciones',
    name: 'Mkt & Comm',
    icon: 'Megaphone',
    color: '#DC2626',
    description: 'Marketing y Comunicaciones',
    subModules: [
      {
        id: 'publicidad',
        name: 'Publicidad',
        icon: 'Target',
        path: '/admin/advertising',
        actions: CRUD_ACTIONS
      },
      {
        id: 'comunicaciones',
        name: 'Comunicaciones',
        icon: 'Mail',
        path: '/admin/communications',
        actions: CRUD_ACTIONS
      },
      {
        id: 'patrocinadores',
        name: 'Patrocinadores',
        icon: 'Handshake',
        path: '/admin/sponsors',
        actions: CRUD_ACTIONS
      }
    ]
  },
  {
    id: 'configuracion',
    name: 'Config & Security',
    icon: 'Settings',
    color: '#7C3AED',
    description: 'Configuración y Seguridad del Sistema',
    subModules: [
      {
        id: 'roles',
        name: 'Roles y Permisos',
        icon: 'Shield',
        path: '/admin/roles',
        actions: CRUD_ACTIONS
      },
      {
        id: 'usuarios',
        name: 'Usuarios',
        icon: 'UserCog',
        path: '/admin/users',
        actions: CRUD_ACTIONS
      },
      {
        id: 'configuracion',
        name: 'Configuración',
        icon: 'Settings',
        path: '/admin/configuracion-seguridad',
        actions: CRUD_ACTIONS.filter(a => ['read', 'update'].includes(a.id))
      },
      {
        id: 'auditoria',
        name: 'Auditoría',
        icon: 'History',
        path: '/admin/audit',
        actions: CRUD_ACTIONS.filter(a => ['read'].includes(a.id))
      }
    ]
  }
];

/**
 * Hook para gestión adaptativa de módulos del sistema
 * Auto-detecta la estructura de módulos y submódulos desde la configuración
 * y proporciona utilidades para trabajar con permisos granulares
 */
export const useAdaptiveModules = (): AdaptiveModulesStructure => {
  const adaptiveStructure = useMemo(() => {
    // Crear mapa directo de submódulos granulares
    const flatModules: string[] = [];
    const moduleMap: Record<string, SystemModule> = {};
    const subModuleMap: Record<string, SubModule> = {};

    // Procesar submódulos directamente desde la configuración real
    SYSTEM_SUBMENU_CONFIG.forEach(subModule => {
      flatModules.push(subModule.id);
      subModuleMap[subModule.id] = subModule;
    });

    // Mantener compatibilidad con módulos agrupados
    SYSTEM_MODULES_CONFIG.forEach(module => {
      moduleMap[module.id] = module;
    });

    return {
      modules: SYSTEM_MODULES_CONFIG,
      flatModules,
      moduleMap,
      subModuleMap
    };
  }, []);

  return adaptiveStructure;
};

/**
 * Hook para obtener información específica de un submódulo
 */
export const useSubModuleInfo = (fullModuleId: string) => {
  const { subModuleMap, moduleMap } = useAdaptiveModules();
  
  const subModule = subModuleMap[fullModuleId];
  const [moduleId] = fullModuleId.split('.');
  const parentModule = moduleMap[moduleId];
  
  return {
    subModule,
    parentModule,
    exists: !!subModule
  };
};

/**
 * Utilidad para validar permisos en formato jerárquico
 * Admin > Update > Create > Read
 */
export const validatePermissionHierarchy = (permissions: string[]): string[] => {
  const hierarchy = ['read', 'create', 'update', 'delete', 'admin'];
  const validPermissions = [...permissions];
  
  // Si tiene admin, debe tener todos los demás
  if (validPermissions.includes('admin')) {
    hierarchy.forEach(perm => {
      if (!validPermissions.includes(perm)) {
        validPermissions.push(perm);
      }
    });
  }
  
  // Si tiene delete, debe tener update, create y read
  if (validPermissions.includes('delete') && !validPermissions.includes('admin')) {
    ['read', 'create', 'update'].forEach(perm => {
      if (!validPermissions.includes(perm)) {
        validPermissions.push(perm);
      }
    });
  }
  
  // Si tiene update, debe tener create y read
  if (validPermissions.includes('update')) {
    ['read', 'create'].forEach(perm => {
      if (!validPermissions.includes(perm)) {
        validPermissions.push(perm);
      }
    });
  }
  
  // Si tiene create, debe tener read
  if (validPermissions.includes('create') && !validPermissions.includes('read')) {
    validPermissions.push('read');
  }
  
  return validPermissions;
};

export default useAdaptiveModules;