// Seeder para el sistema de permisos jerárquico
// Estructura: module:submodule:page:action

export interface PermissionModule {
  id: number;
  name: string;
  slug: string;
  description?: string;
  order: number;
}

export interface PermissionSubmodule {
  id: number;
  moduleId: number;
  name: string;
  slug: string;
  description?: string;
  order: number;
}

export interface PermissionPage {
  id: number;
  submoduleId: number;
  name: string;
  slug: string;
  description?: string;
  order: number;
}

export interface PermissionAction {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Permission {
  id: number;
  key: string;
  moduleId: number;
  submoduleId?: number;
  pageId?: number;
  actionId?: number;
  description?: string;
}

// Datos iniciales del sistema
export const PERMISSION_MODULES: PermissionModule[] = [
  { id: 1, name: 'Parques', slug: 'parks', description: 'Gestión de parques y espacios públicos', order: 1 },
  { id: 2, name: 'Actividades', slug: 'activities', description: 'Gestión de actividades y eventos', order: 2 },
  { id: 3, name: 'Recursos Humanos', slug: 'hr', description: 'Gestión de personal y nómina', order: 3 },
  { id: 4, name: 'Finanzas', slug: 'finance', description: 'Gestión financiera y contabilidad', order: 4 },
  { id: 5, name: 'Marketing', slug: 'marketing', description: 'Marketing y comunicación', order: 5 },
  { id: 6, name: 'Configuración', slug: 'config', description: 'Configuración del sistema', order: 6 },
  { id: 7, name: 'Seguridad', slug: 'security', description: 'Seguridad y auditoría', order: 7 }
];

export const PERMISSION_SUBMODULES: PermissionSubmodule[] = [
  // Parques
  { id: 1, moduleId: 1, name: 'Administración', slug: 'admin', order: 1 },
  { id: 2, moduleId: 1, name: 'Amenidades', slug: 'amenities', order: 2 },
  { id: 3, moduleId: 1, name: 'Visitantes', slug: 'visitors', order: 3 },
  { id: 4, moduleId: 1, name: 'Árboles', slug: 'trees', order: 4 },
  
  // Actividades
  { id: 5, moduleId: 2, name: 'Catálogo', slug: 'catalog', order: 1 },
  { id: 6, moduleId: 2, name: 'Inscripciones', slug: 'registrations', order: 2 },
  { id: 7, moduleId: 2, name: 'Instructores', slug: 'instructors', order: 3 },
  { id: 8, moduleId: 2, name: 'Eventos', slug: 'events', order: 4 },
  
  // Recursos Humanos
  { id: 9, moduleId: 3, name: 'Empleados', slug: 'employees', order: 1 },
  { id: 10, moduleId: 3, name: 'Nómina', slug: 'payroll', order: 2 },
  { id: 11, moduleId: 3, name: 'Vacaciones', slug: 'vacations', order: 3 },
  { id: 12, moduleId: 3, name: 'Organigrama', slug: 'organigram', order: 4 },
  
  // Finanzas
  { id: 13, moduleId: 4, name: 'Ingresos', slug: 'income', order: 1 },
  { id: 14, moduleId: 4, name: 'Egresos', slug: 'expenses', order: 2 },
  { id: 15, moduleId: 4, name: 'Presupuestos', slug: 'budgets', order: 3 },
  { id: 16, moduleId: 4, name: 'Reportes', slug: 'reports', order: 4 },
  
  // Marketing
  { id: 17, moduleId: 5, name: 'Patrocinadores', slug: 'sponsors', order: 1 },
  { id: 18, moduleId: 5, name: 'Contratos', slug: 'contracts', order: 2 },
  { id: 19, moduleId: 5, name: 'Activos', slug: 'assets', order: 3 },
  { id: 20, moduleId: 5, name: 'Campañas', slug: 'campaigns', order: 4 },
  
  // Configuración
  { id: 21, moduleId: 6, name: 'Sistema', slug: 'system', order: 1 },
  { id: 22, moduleId: 6, name: 'Usuarios', slug: 'users', order: 2 },
  { id: 23, moduleId: 6, name: 'Roles', slug: 'roles', order: 3 },
  { id: 24, moduleId: 6, name: 'Permisos', slug: 'permissions', order: 4 },
  
  // Seguridad
  { id: 25, moduleId: 7, name: 'Auditoría', slug: 'audit', order: 1 },
  { id: 26, moduleId: 7, name: 'Respaldos', slug: 'backups', order: 2 },
  { id: 27, moduleId: 7, name: 'Logs', slug: 'logs', order: 3 }
];

export const PERMISSION_PAGES: PermissionPage[] = [
  // Parques - Administración
  { id: 1, submoduleId: 1, name: 'Lista de Parques', slug: 'list', order: 1 },
  { id: 2, submoduleId: 1, name: 'Crear Parque', slug: 'create', order: 2 },
  { id: 3, submoduleId: 1, name: 'Editar Parque', slug: 'edit', order: 3 },
  { id: 4, submoduleId: 1, name: 'Detalles del Parque', slug: 'details', order: 4 },
  
  // Parques - Amenidades
  { id: 5, submoduleId: 2, name: 'Lista de Amenidades', slug: 'list', order: 1 },
  { id: 6, submoduleId: 2, name: 'Gestionar Amenidades', slug: 'manage', order: 2 },
  
  // Actividades - Catálogo
  { id: 7, submoduleId: 5, name: 'Lista de Actividades', slug: 'list', order: 1 },
  { id: 8, submoduleId: 5, name: 'Crear Actividad', slug: 'create', order: 2 },
  { id: 9, submoduleId: 5, name: 'Editar Actividad', slug: 'edit', order: 3 },
  
  // Empleados
  { id: 10, submoduleId: 9, name: 'Directorio', slug: 'directory', order: 1 },
  { id: 11, submoduleId: 9, name: 'Agregar Empleado', slug: 'create', order: 2 },
  { id: 12, submoduleId: 9, name: 'Editar Empleado', slug: 'edit', order: 3 },
  
  // Usuarios
  { id: 13, submoduleId: 22, name: 'Lista de Usuarios', slug: 'list', order: 1 },
  { id: 14, submoduleId: 22, name: 'Crear Usuario', slug: 'create', order: 2 },
  { id: 15, submoduleId: 22, name: 'Editar Usuario', slug: 'edit', order: 3 },
  
  // Roles
  { id: 16, submoduleId: 23, name: 'Lista de Roles', slug: 'list', order: 1 },
  { id: 17, submoduleId: 23, name: 'Crear Rol', slug: 'create', order: 2 },
  { id: 18, submoduleId: 23, name: 'Editar Rol', slug: 'edit', order: 3 },
  { id: 19, submoduleId: 23, name: 'Asignar Permisos', slug: 'assign', order: 4 }
];

export const PERMISSION_ACTIONS: PermissionAction[] = [
  { id: 1, name: 'Ver', slug: 'view', description: 'Permite visualizar información' },
  { id: 2, name: 'Crear', slug: 'create', description: 'Permite crear nuevos registros' },
  { id: 3, name: 'Editar', slug: 'edit', description: 'Permite modificar registros existentes' },
  { id: 4, name: 'Eliminar', slug: 'delete', description: 'Permite eliminar registros' },
  { id: 5, name: 'Aprobar', slug: 'approve', description: 'Permite aprobar solicitudes o cambios' },
  { id: 6, name: 'Publicar', slug: 'publish', description: 'Permite publicar contenido' },
  { id: 7, name: 'Exportar', slug: 'export', description: 'Permite exportar datos' },
  { id: 8, name: 'Importar', slug: 'import', description: 'Permite importar datos' }
];

// Generar permisos completos
export function generatePermissions(): Permission[] {
  const permissions: Permission[] = [];
  let permissionId = 1;

  // Generar permisos para cada combinación válida
  for (const module of PERMISSION_MODULES) {
    // Permiso a nivel de módulo (acceso general)
    permissions.push({
      id: permissionId++,
      key: module.slug,
      moduleId: module.id,
      description: `Acceso general al módulo ${module.name}`
    });

    const submodules = PERMISSION_SUBMODULES.filter(s => s.moduleId === module.id);
    
    for (const submodule of submodules) {
      // Permiso a nivel de submódulo
      permissions.push({
        id: permissionId++,
        key: `${module.slug}:${submodule.slug}`,
        moduleId: module.id,
        submoduleId: submodule.id,
        description: `Acceso al submódulo ${submodule.name}`
      });

      const pages = PERMISSION_PAGES.filter(p => p.submoduleId === submodule.id);
      
      for (const page of pages) {
        // Permiso a nivel de página
        permissions.push({
          id: permissionId++,
          key: `${module.slug}:${submodule.slug}:${page.slug}`,
          moduleId: module.id,
          submoduleId: submodule.id,
          pageId: page.id,
          description: `Acceso a la página ${page.name}`
        });

        // Permisos con acciones específicas
        for (const action of PERMISSION_ACTIONS) {
          permissions.push({
            id: permissionId++,
            key: `${module.slug}:${submodule.slug}:${page.slug}:${action.slug}`,
            moduleId: module.id,
            submoduleId: submodule.id,
            pageId: page.id,
            actionId: action.id,
            description: `${action.name} en ${page.name}`
          });
        }
      }
    }
  }

  return permissions;
}

// Asignación de permisos por rol (ejemplos)
export interface RolePermission {
  roleId: number;
  permissionId: number;
  allow: boolean;
}

export function generateRolePermissions(): RolePermission[] {
  const rolePermissions: RolePermission[] = [];
  const allPermissions = generatePermissions();

  // Super Admin (rol 1) - Todos los permisos
  for (const permission of allPermissions) {
    rolePermissions.push({
      roleId: 1,
      permissionId: permission.id,
      allow: true
    });
  }

  // Admin de Parque (rol 2) - Permisos de parques y actividades
  const parkAdminModules = ['parks', 'activities'];
  for (const permission of allPermissions) {
    if (parkAdminModules.some(m => permission.key.startsWith(m))) {
      rolePermissions.push({
        roleId: 2,
        permissionId: permission.id,
        allow: true
      });
    }
  }

  // Coordinador (rol 3) - Permisos limitados de actividades
  for (const permission of allPermissions) {
    if (permission.key.startsWith('activities:') && 
        (permission.key.includes(':view') || permission.key.includes(':create'))) {
      rolePermissions.push({
        roleId: 3,
        permissionId: permission.id,
        allow: true
      });
    }
  }

  // Voluntario (rol 4) - Solo visualización de actividades
  for (const permission of allPermissions) {
    if (permission.key.startsWith('activities:') && permission.key.includes(':view')) {
      rolePermissions.push({
        roleId: 4,
        permissionId: permission.id,
        allow: true
      });
    }
  }

  return rolePermissions;
}

// Exportar datos completos para inicialización
export const PERMISSIONS_SEED_DATA = {
  modules: PERMISSION_MODULES,
  submodules: PERMISSION_SUBMODULES,
  pages: PERMISSION_PAGES,
  actions: PERMISSION_ACTIONS,
  permissions: generatePermissions(),
  rolePermissions: generateRolePermissions()
};