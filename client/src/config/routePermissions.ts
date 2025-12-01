/**
 * Mapeo de rutas administrativas a permisos requeridos
 * Formato: 'module:submodule:page:action'
 * 
 * Estructura de permission_key:
 * - module: management, operations, admin-finance, mkt-comm, hr, config-security
 * - submodule: parks, activities, assets, etc.
 * - page: página específica dentro del submódulo
 * - action: view, create, edit, delete
 */

import { ROUTES } from '@/routes';

export interface RoutePermissionConfig {
  permission: string | null;  // null = acceso libre para usuarios autenticados
  fallbackRoute?: string;     // ruta de redirección si no tiene permiso
}

// Permisos con estructura module:submodule:page:action
export const routePermissions: Record<string, RoutePermissionConfig> = {
  // ========== GESTIÓN (management) ==========

  // Parques (submódulo sin hijos - page = submodule name)
  [ROUTES.admin.parks.list]: { permission: 'management:parks:parks:view' },
  [ROUTES.admin.parks.create]: { permission: 'management:parks:parks:create' },
  [ROUTES.admin.parks.edit.path]: { permission: 'management:parks:parks:edit' },
  [ROUTES.admin.parks.view.path]: { permission: 'management:parks:parks:view' },

  // Actividades
  [ROUTES.admin.activities.list]: { permission: 'management:activities:catalog:view' },
  [ROUTES.admin.activities.create]: { permission: 'management:activities:catalog:create' },
  [ROUTES.admin.activities.edit.path]: { permission: 'management:activities:catalog:edit' },
  [ROUTES.admin.activities.view.path]: { permission: 'management:activities:catalog:view' },
  [ROUTES.admin.activities.calendar]: { permission: 'management:activities:calendar:view' },
  [ROUTES.admin.activities.categories.list]: { permission: 'management:activities:categories:view' },
  [ROUTES.admin.activities.registrations]: { permission: 'management:activities:registrations:view' },
  [ROUTES.admin.activities.instructors.list]: { permission: 'management:activities:instructors:view' },
  [ROUTES.admin.activities.instructors.create]: { permission: 'management:activities:instructors:create' },
  [ROUTES.admin.activities.instructors.view.path]: { permission: 'management:activities:instructors:view' },
  [ROUTES.admin.activities.instructors.edit.path]: { permission: 'management:activities:instructors:edit' },

  // Amenidades
  [ROUTES.admin.amenities.list]: { permission: 'management:amenities:amenities:view' },
  [ROUTES.admin.amenities.create]: { permission: 'management:amenities:amenities:create' },
  [ROUTES.admin.amenities.edit.path]: { permission: 'management:amenities:amenities:edit' },

  // Arbolado
  [ROUTES.admin.trees.species.list]: { permission: 'management:trees:species:view' },
  [ROUTES.admin.trees.species.create]: { permission: 'management:trees:species:create' },
  [ROUTES.admin.trees.species.edit.path]: { permission: 'management:trees:species:edit' },
  [ROUTES.admin.trees.list]: { permission: 'management:trees:inventory:view' },
  [ROUTES.admin.trees.create]: { permission: 'management:trees:inventory:create' },
  [ROUTES.admin.trees.operation]: { permission: 'management:trees:operation:view' },
  [ROUTES.admin.trees.operationDetail.path]: { permission: 'management:trees:operation:view' },
  [ROUTES.admin.trees.maintenance.list]: { permission: 'management:trees:maintenance:view' },
  [ROUTES.admin.trees.reports]: { permission: 'management:trees:reports:view' },

  // Fauna
  [ROUTES.admin.fauna.list]: { permission: 'management:fauna:species:view' },

  // Visitantes
  [ROUTES.admin.visitors.count]: { permission: 'management:visitors:count:view' },
  [ROUTES.admin.visitors.feedback]: { permission: 'management:visitors:feedback:view' },

  // Eventos
  [ROUTES.admin.events.list]: { permission: 'management:events:events:view' },
  [ROUTES.admin.events.create]: { permission: 'management:events:events:create' },
  [ROUTES.admin.events.edit.path]: { permission: 'management:events:events:edit' },
  [ROUTES.admin.events.calendar]: { permission: 'management:events:calendar:view' },
  [ROUTES.admin.events.categories.list]: { permission: 'management:events:categories:view' },
  [ROUTES.admin.events.registrations]: { permission: 'management:events:registrations:view' },

  // Reservaciones de espacios
  [ROUTES.admin.spaceReservations.list]: { permission: 'management:reservations:reservations:view' },
  [ROUTES.admin.spaceReservations.create]: { permission: 'management:reservations:reservations:create' },
  [ROUTES.admin.spaceReservations.edit.path]: { permission: 'management:reservations:reservations:edit' },
  [ROUTES.admin.spaceReservations.calendar]: { permission: 'management:reservations:calendar:view' },
  [ROUTES.admin.spaceReservations.spaces.list]: { permission: 'management:reservations:spaces:view' },
  [ROUTES.admin.spaceReservations.spaces.create]: { permission: 'management:reservations:spaces:create' },

  // Evaluaciones
  [ROUTES.admin.evaluations.criteria.list]: { permission: 'management:evaluations:criteria:view' },
  [ROUTES.admin.evaluations.parks]: { permission: 'management:evaluations:parks:view' },
  [ROUTES.admin.evaluations.activities]: { permission: 'management:evaluations:activities:view' },
  [ROUTES.admin.evaluations.instructors]: { permission: 'management:evaluations:instructors:view' },
  [ROUTES.admin.evaluations.events]: { permission: 'management:evaluations:events:view' },
  [ROUTES.admin.evaluations.volunteers]: { permission: 'management:evaluations:volunteers:view' },

  // ========== OPERACIONES (operations) ==========

  // Activos
  [ROUTES.admin.assets.list]: { permission: 'operations:assets:inventory:view' },
  [ROUTES.admin.assets.create]: { permission: 'operations:assets:inventory:create' },
  [ROUTES.admin.assets.edit.path]: { permission: 'operations:assets:inventory:edit' },
  [ROUTES.admin.assets.view.path]: { permission: 'operations:assets:inventory:view' },
  [ROUTES.admin.assets.maintenance.list]: { permission: 'operations:assets:maintenance:view' },
  [ROUTES.admin.assets.categories.list]: { permission: 'operations:assets:categories:view' },

  // Incidentes
  [ROUTES.admin.incidents.list]: { permission: 'operations:incidents:incidents:view' },
  [ROUTES.admin.incidents.create]: { permission: 'operations:incidents:incidents:create' },
  [ROUTES.admin.incidents.edit.path]: { permission: 'operations:incidents:incidents:edit' },
  [ROUTES.admin.incidents.view.path]: { permission: 'operations:incidents:incidents:view' },

  // Órdenes de trabajo
  [ROUTES.admin.workOrders.list]: { permission: 'operations:work-orders:orders:view' },
  [ROUTES.admin.workOrders.create]: { permission: 'operations:work-orders:orders:create' },
  [ROUTES.admin.workOrders.view.path]: { permission: 'operations:work-orders:orders:view' },

  // Almacén
  [ROUTES.admin.warehouse.list]: { permission: 'operations:warehouse:inventory:view' },
  [ROUTES.admin.warehouse.create]: { permission: 'operations:warehouse:inventory:create' },
  [ROUTES.admin.warehouse.movements.list]: { permission: 'operations:warehouse:movements:view' },
  [ROUTES.admin.warehouse.categories.list]: { permission: 'operations:warehouse:categories:view' },

  // Voluntarios
  [ROUTES.admin.volunteers.list]: { permission: 'operations:volunteers:volunteers:view' },
  [ROUTES.admin.volunteers.create]: { permission: 'operations:volunteers:volunteers:create' },
  [ROUTES.admin.volunteers.edit.path]: { permission: 'operations:volunteers:volunteers:edit' },
  [ROUTES.admin.volunteers.activities.list]: { permission: 'operations:volunteers:activities:view' },
  [ROUTES.admin.volunteers.activities.create]: { permission: 'operations:volunteers:activities:create' },
  [ROUTES.admin.volunteers.participations.list]: { permission: 'operations:volunteers:participations:view' },

  // ========== ADMIN & FINANZAS (admin-finance) ==========

  // Finanzas
  [ROUTES.admin.finance.catalog]: { permission: 'admin-finance:finance:catalog:view' },
  [ROUTES.admin.finance.payments]: { permission: 'admin-finance:finance:payments:view' },
  [ROUTES.admin.finance.pendingApproval]: { permission: 'admin-finance:finance:approval:view' },

  // Contabilidad
  [ROUTES.admin.accounting.categories]: { permission: 'admin-finance:accounting:categories:view' },
  [ROUTES.admin.accounting.transactions]: { permission: 'admin-finance:accounting:transactions:view' },
  [ROUTES.admin.accounting.journalEntries]: { permission: 'admin-finance:accounting:journal:view' },
  [ROUTES.admin.accounting.trialBalance]: { permission: 'admin-finance:accounting:balance:view' },

  // Concesiones
  [ROUTES.admin.concessions.concessionaires.list]: { permission: 'admin-finance:concessions:concessionaires:view' },
  [ROUTES.admin.concessions.concessionaires.create]: { permission: 'admin-finance:concessions:concessionaires:create' },
  [ROUTES.admin.concessions.contracts.list]: { permission: 'admin-finance:concessions:contracts:view' },
  [ROUTES.admin.concessions.contracts.create]: { permission: 'admin-finance:concessions:contracts:create' },
  [ROUTES.admin.concessions.active.list]: { permission: 'admin-finance:concessions:active:view' },

  // ========== MKT & COMM (mkt-comm) ==========

  // Marketing / Patrocinadores
  [ROUTES.admin.marketing.sponsors.list]: { permission: 'mkt-comm:marketing:sponsors:view' },
  [ROUTES.admin.marketing.sponsors.create]: { permission: 'mkt-comm:marketing:sponsors:create' },
  [ROUTES.admin.marketing.sponsors.edit.path]: { permission: 'mkt-comm:marketing:sponsors:edit' },
  [ROUTES.admin.marketing.contracts.list]: { permission: 'mkt-comm:marketing:contracts:view' },
  [ROUTES.admin.marketing.packages.list]: { permission: 'mkt-comm:marketing:packages:view' },
  [ROUTES.admin.marketing.benefits.list]: { permission: 'mkt-comm:marketing:benefits:view' },

  // Publicidad
  [ROUTES.admin.advertising.spaces.list]: { permission: 'mkt-comm:advertising:spaces:view' },
  [ROUTES.admin.advertising.spaces.create]: { permission: 'mkt-comm:advertising:spaces:create' },
  [ROUTES.admin.advertising.spaces.edit.path]: { permission: 'mkt-comm:advertising:spaces:edit' },
  [ROUTES.admin.advertising.advertisements.list]: { permission: 'mkt-comm:advertising:advertisements:view' },
  [ROUTES.admin.advertising.campaigns.list]: { permission: 'mkt-comm:advertising:campaigns:view' },
  [ROUTES.admin.advertising.campaigns.create]: { permission: 'mkt-comm:advertising:campaigns:create' },
  [ROUTES.admin.advertising.placements.list]: { permission: 'mkt-comm:advertising:placements:view' },

  // Comunicaciones
  [ROUTES.admin.communications.templates.list]: { permission: 'mkt-comm:communications:templates:view' },
  [ROUTES.admin.communications.templates.create]: { permission: 'mkt-comm:communications:templates:create' },
  [ROUTES.admin.communications.campaigns.list]: { permission: 'mkt-comm:communications:campaigns:view' },
  [ROUTES.admin.communications.campaigns.create]: { permission: 'mkt-comm:communications:campaigns:create' },
  [ROUTES.admin.communications.queue]: { permission: 'mkt-comm:communications:queue:view' },
  [ROUTES.admin.communications.bulk]: { permission: 'mkt-comm:communications:bulk:view' },

  // ========== RH (hr) ==========

  // Empleados
  [ROUTES.admin.hr.employees.list]: { permission: 'hr:employees:employees:view' },
  [ROUTES.admin.hr.employees.create]: { permission: 'hr:employees:employees:create' },
  [ROUTES.admin.hr.employees.edit.path]: { permission: 'hr:employees:employees:edit' },

  // Vacaciones / Time Off
  [ROUTES.admin.hr.timeOff.list]: { permission: 'hr:time-off:requests:view' },
  [ROUTES.admin.hr.timeOff.create]: { permission: 'hr:time-off:requests:create' },
  [ROUTES.admin.hr.timeOff.edit.path]: { permission: 'hr:time-off:requests:edit' },

  // Capacitación
  [ROUTES.admin.hr.training.list]: { permission: 'hr:training:courses:view' },
  [ROUTES.admin.hr.training.create]: { permission: 'hr:training:courses:create' },
  [ROUTES.admin.hr.training.edit.path]: { permission: 'hr:training:courses:edit' },

  // Nómina
  [ROUTES.admin.hr.payroll.list]: { permission: 'hr:payroll:payroll:view' },
  [ROUTES.admin.hr.payroll.create]: { permission: 'hr:payroll:payroll:create' },
  [ROUTES.admin.hr.receipts.list]: { permission: 'hr:payroll:receipts:view' },

  // Control de tiempo
  [ROUTES.admin.hr.timeTracking]: { permission: 'hr:time-tracking:tracking:view' },

  // Bienestar
  [ROUTES.admin.hr.wellness]: { permission: 'hr:wellness:wellness:view' },

  // ========== CONFIG & SEGURIDAD (config-security) ==========

  // Control de acceso
  [ROUTES.admin.settings.roles.list]: { permission: 'config-security:access-control:roles:view' },
  [ROUTES.admin.settings.roles.create]: { permission: 'config-security:access-control:roles:create' },
  [ROUTES.admin.settings.roles.edit.path]: { permission: 'config-security:access-control:roles:edit' },
  [ROUTES.admin.settings.permissions]: { permission: 'config-security:access-control:permissions:view' },
  [ROUTES.admin.settings.users.list]: { permission: 'config-security:access-control:users:view' },
  [ROUTES.admin.settings.users.create]: { permission: 'config-security:access-control:users:create' },
  [ROUTES.admin.settings.users.edit.path]: { permission: 'config-security:access-control:users:edit' },

  // Políticas
  [ROUTES.admin.settings.policies]: { permission: 'config-security:policies:policies:view' },

  // Notificaciones
  [ROUTES.admin.settings.notifications]: { permission: 'config-security:notifications:notifications:view' },

  // Auditoría
  [ROUTES.admin.settings.audit]: { permission: 'config-security:audit:logs:view' },

  // Mantenimiento del sistema
  [ROUTES.admin.settings.backup]: { permission: 'config-security:system-maintenance:backup:view' },

  // ========== DASHBOARDS ==========
  // Dashboard principal accesible para todos los autenticados
  [ROUTES.dashboards.main]: { permission: null },

  // Dashboards específicos heredan permiso de view del módulo principal
  [ROUTES.dashboards.parks]: { permission: 'management:parks:parks:view' },
  [ROUTES.dashboards.activities]: { permission: 'management:activities:catalog:view' },
  [ROUTES.dashboards.amenities]: { permission: 'management:amenities:amenities:view' },
  [ROUTES.dashboards.trees]: { permission: 'management:trees:species:view' },
  [ROUTES.dashboards.visitors]: { permission: 'management:visitors:count:view' },
  [ROUTES.dashboards.events]: { permission: 'management:events:events:view' },
  [ROUTES.dashboards.reservations]: { permission: 'management:reservations:reservations:view' },
  [ROUTES.dashboards.evaluations]: { permission: 'management:evaluations:criteria:view' },
  [ROUTES.dashboards.assets]: { permission: 'operations:assets:inventory:view' },
  [ROUTES.dashboards.incidents]: { permission: 'operations:incidents:incidents:view' },
  [ROUTES.dashboards.workOrders]: { permission: 'operations:work-orders:orders:view' },
  [ROUTES.dashboards.warehouse]: { permission: 'operations:warehouse:inventory:view' },
  [ROUTES.dashboards.volunteers]: { permission: 'operations:volunteers:volunteers:view' },
  [ROUTES.dashboards.finance]: { permission: 'admin-finance:finance:catalog:view' },
  [ROUTES.dashboards.hr]: { permission: 'hr:employees:employees:view' },
};

/**
 * Busca el permiso requerido para una ruta dada
 * Maneja rutas dinámicas como /admin/parks/edit/:id
 */
export function getRoutePermission(pathname: string): RoutePermissionConfig | null {
  // Primero buscar coincidencia exacta
  if (routePermissions[pathname]) {
    return routePermissions[pathname];
  }

  // Buscar coincidencia con rutas dinámicas (que contienen :id, :param, etc)
  for (const [route, config] of Object.entries(routePermissions)) {
    // Convertir la ruta con parámetros a regex
    // /admin/parks/edit/:id -> /admin/parks/edit/[^/]+
    const routeRegex = new RegExp(
      '^' + route.replace(/:[^/]+/g, '[^/]+') + '$'
    );

    if (routeRegex.test(pathname)) {
      return config;
    }
  }

  return null;
}

/**
 * Verifica si una ruta es administrativa (comienza con /admin)
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin') && pathname !== '/admin/login';
}