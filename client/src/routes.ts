// src/routes.ts

/**
 * Sistema centralizado de rutas de ParkSys
 * Crear y editar en páginas independientes, vista detallada en modal (excepto parques)
 * Los permisos se validan dinámicamente contra la base de datos
 * usando el formato: {module}:{submodule}:{page}:{action}
 */

// ============================================
// RUTAS PÚBLICAS mod
// ============================================

export const PUBLIC_ROUTES = {
  home: "/",
  parks: "/parks",
  parkDetail: {
    path: "/parks/:id",
    build: (id: string | number) => `/parks/${id}`,
  },
  parkBySlug: {
    path: "/parks/:slug",
    build: (slug: string) => `/parks/${slug}`, // ✅ Nuevo: nomenclatura en inglés
  },
  parkEvaluate: {
    path: "/parks/:id/evaluate",
    build: (id: string) => `/parks/${id}/evaluate`, // ✅ Actualizado
  },
  parkEvaluations: {
    path: "/parks/:id/evaluations",
    build: (id: string) => `/parks/${id}/evaluations`, // ✅ Actualizado
  },

  activities: "/activities",
  activityDetail: {
    path: "/activity/:id",
    build: (id: string | number) => `/activity/${id}`,
  },
  activityPayment: {
    path: "/activity/:id/payment",
    build: (id: string | number) => `/activity/${id}/payment`,
  },

  events: "/events",
  eventDetail: {
    path: "/event/:id",
    build: (id: string | number) => `/event/${id}`,
  },

  reservations: "/reservations",
  spaceDetail: {
    path: "/space/:id",
    build: (id: string | number) => `/space/${id}`,
  },

  calendar: "/calendar",

  concessions: "/concessions",
  concessionDetail: {
    path: "/concession/:id",
    build: (id: string | number) => `/concession/${id}`,
  },

  treeSpecies: "/tree-species",
  treeSpeciesDetail: {
    path: "/tree-species/:id",
    build: (id: string | number) => `/tree-species/${id}`,
  },

  fauna: "/fauna",
  faunaDetail: {
    path: "/fauna/:id",
    build: (id: string | number) => `/fauna/${id}`,
  },

  volunteers: "/volunteers",
  volunteerRegister: "/volunteers/register",

  instructors: "/instructors",
  instructorProfile: {
    path: "/instructor/:id",
    build: (id: string | number) => `/instructor/${id}`,
  },
  // Acceso a registro por invitación
  instructorRegister: "/instructors/register",

  // Páginas del footer
  about: "/about",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  faq: "/faq",
  help: "/help",
} as const;

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

export const AUTH_ROUTES = {
  login: "/login",

  // Duplicidad adminLogin: '/admin/login',
  // Obsolete resetPassword: '/admin/reset-password',
  // Obsoleta authResetPassword: '/auth/reset-password',
} as const;

// ============================================
// RUTAS DE VENTAS/LANDING - ELIMINAR
// ============================================

// export const SALES_ROUTES = {
//   landing: '/landing',
//   ventas: '/ventas',
//   basic: '/sales',
//   municipal: '/sales/municipal',
//   network: '/sales/network',
//   pro: '/sales/pro',
//   parksModule: '/parks-module',
// } as const;

// ============================================
// DASHBOARDS ADMINISTRATIVOS
// ============================================

// Iniciar la raíz con admin - dashboard
export const DASHBOARD_ROUTES = {
  main: "/admin",
  parks: "/admin/dashboard/parks",
  activities: "/admin/dashboard/activities",
  amenities: "/admin/dashboard/amenities",
  trees: "/admin/dashboard/trees",
  visitors: "/admin/dashboard/visitors",
  events: "/admin/dashboard/events",
  reservations: "/admin/dashboard/reservations",
  evaluations: "/admin/dashboard/evaluations",
  assets: "/admin/dashboard/assets",
  incidents: "/admin/dashboard/incidents",
  workOrders: "/admin/dashboard/work-orders",
  warehouse: "/admin/dashboard/warehouse",
  volunteers: "/admin/dashboard/volunteers",
  finance: "/admin/dashboard/finance",
  accounting: "/admin/dashboard/accounting",
  concessions: "/admin/dashboard/concessions",
  marketing: "/admin/dashboard/marketing",
  hr: "/admin/dashboard/hr",
} as const;

// ============================================
// MÓDULO: GESTIÓN DE PARQUES
// ============================================

export const ADMIN_PARKS = {
  list: "/admin/parks",
  create: "/admin/parks/new",
  view: {
    path: "/admin/parks/:id/view",
    build: (id: string | number) => `/admin/parks/${id}/view`,
  },
  edit: {
    path: "/admin/parks/:id/edit",
    build: (id: string | number) => `/admin/parks/${id}/edit`,
  },
} as const;

// ============================================
// MÓDULO: ACTIVIDADES
// ============================================

export const ADMIN_ACTIVITIES = {
  list: "/admin/activities/catalog",
  create: "/admin/activities/catalog/new",
  view: {
    path: "/admin/activities/catalog/:id/view",
    build: (id: string | number) => `/admin/activities/catalog/${id}/view`,
  },
  edit: {
    path: "/admin/activities/catalog/:id/edit",
    build: (id: string | number) => `/admin/activities/catalog/${id}/edit`,
  },
  calendar: "/admin/activities/calendar",
  registrations: "/admin/activities/registrations",
  registrationDetail: {
    path: "/admin/activities/registrations/:id/view",
    build: (id: string | number) => `/admin/activities/registrations/${id}/view`,
  },
  categories: {
    list: "/admin/activities/categories",
    create: "/admin/activities/categories/new",
    edit: {
      path: "/admin/activities/categories/:id/edit",
      build: (id: string | number) => `/admin/activities/categories/${id}/edit`,
    },
  },
  instructors: {
    list: "/admin/activities/instructors",
    create: "/admin/activities/instructors/new",
    view: {
      path: "/admin/activities/instructors/:id/view",
      build: (id: string | number) =>
        `/admin/activities/instructors/${id}/view`,
    },
    edit: {
      path: "/admin/activities/instructors/:id/edit",
      build: (id: string | number) =>
        `/admin/activities/instructors/${id}/edit`,
    },
  },
} as const;

// ============================================
// MÓDULO: AMENIDADES
// ============================================

export const ADMIN_AMENITIES = {
  list: "/admin/amenities",
  // Creación y edición nuevas
  create: "/admin/amenities/new",
  edit: {
    path: "/admin/amenities/:id/edit",
    build: (id: string | number) => `/admin/amenities/${id}/edit`,
  },
} as const;

// ============================================
// MÓDULO: ARBOLADO
// ============================================

export const ADMIN_TREES = {
  list: "/admin/trees/inventory",
  create: "/admin/trees/inventory/new",
  view: {
    path: "/admin/trees/inventory/:id/view",
    build: (id: string | number) => `/admin/trees/inventory/${id}/view`,
  },
  edit: {
    path: "/admin/trees/inventory/:id/edit",
    build: (id: string | number) => `/admin/trees/inventory/${id}/edit`,
  },
  operation: "/admin/trees/operation",
  operationDetail: {
    path: "/admin/trees/operation/:id/view",
    build: (id: string | number) => `/admin/trees/operation/${id}/view`,
  },
  species: {
    list: "/admin/trees/catalog",
    create: "/admin/trees/catalog/new",
    view: {
      path: "/admin/trees/catalog/:id/view",
      build: (id: string | number) => `/admin/trees/catalog/${id}/view`,
    },
    edit: {
      path: "/admin/trees/catalog/:id/edit",
      build: (id: string | number) => `/admin/trees/catalog/${id}/edit`,
    },
  },
  maintenance: {
    list: "/admin/trees/maintenance",
    create: "/admin/trees/maintenance/new",
    edit: {
      path: "/admin/trees/maintenance/:id/edit",
      build: (id: string | number) => `/admin/trees/maintenance/${id}/edit`,
    },
  },
  reports: "/admin/trees/reports",
} as const;

// ============================================
// MÓDULO: FAUNA
// ============================================

export const ADMIN_FAUNA = {
  list: "/admin/fauna/species",
  create: "/admin/fauna/species/new",
  edit: {
    path: "/admin/fauna/species/:id/edit",
    build: (id: string | number) => `/admin/fauna/species/${id}/edit`,
  },
} as const;

// ============================================
// MÓDULO: VISITANTES
// ============================================

export const ADMIN_VISITORS = {
  count: "/admin/visitors/count",
  create: "/admin/visitors/count/new",
  edit: {
    path: "/admin/visitors/count/:id/edit",
    build: (id: string | number) => `/admin/visitors/count/${id}/edit`,
  },
  feedback: "/admin/visitors/feedback",
} as const;

// ============================================
// MÓDULO: EVENTOS
// ============================================

export const ADMIN_EVENTS = {
  list: "/admin/events/catalog",
  create: "/admin/events/catalog/new",
  view: {
    path: "/admin/events/catalog/:id/view",
    build: (id: string | number) => `/admin/events/catalog/${id}/view`,
  },
  edit: {
    path: "/admin/events/:id/edit",
    build: (id: string | number) => `/admin/events/catalog/${id}/edit`,
  },
  registrations: "/admin/events/registrations",
  calendar: "/admin/events/calendar",
  categories: {
    list: "/admin/events/categories",
    create: "/admin/events/categories/new",
    edit: {
      path: "/admin/events/categories/:id/edit",
      build: (id: string | number) => `/admin/events/categories/${id}/edit`,
    },
  },
} as const;

// ============================================
// MÓDULO: RESERVAS DE ESPACIOS
// ============================================

export const ADMIN_SPACE_RESERVATIONS = {
  list: "/admin/space-reservations/management",
  create: "/admin/space-reservations/management/new",
  edit: {
    path: "/admin/space-reservations/management/:id/edit",
    build: (id: string | number) => `/admin/space-reservations/management/${id}/edit`,
  },
  calendar: "/admin/space-reservations/calendar",
  spaces: {
    list: "/admin/space-reservations/spaces",
    create: "/admin/space-reservations/spaces/new",
    edit: {
      path: "/admin/space-reservations/space/:id/edit",
      build: (id: string | number) =>
        `/admin/space-reservations/space/${id}/edit`,
    },
  },
} as const;

// ============================================
// MÓDULO: EVALUACIONES
// ============================================

export const ADMIN_EVALUATIONS = {
  // Criterios
  criteria: {
    list: "/admin/evaluations/criteria",
    // Creación y edición nuevas
    create: "/admin/evaluations/criteria/new",
    edit: (id: string | number) => `/admin/evaluations/criteria/${id}/edit`,
  },

  // Evaluaciones
  parks: "/admin/evaluations/parks",
  activities: "/admin/evaluations/activities",
  instructors: "/admin/evaluations/instructors",
  events: "/admin/evaluations/events",
  volunteers: "/admin/evaluations/volunteers",
  concessionaires: "/admin/evaluations/concessionaires",
} as const;

// ============================================
// MÓDULO: ACTIVOS
// ============================================

export const ADMIN_ASSETS = {
  list: "/admin/assets/inventory",
  map: "/admin/assets/map",
  create: "/admin/assets/inventory/new",
  view: {
    path: "/admin/assets/inventory/:id/view",
    build: (id: string | number) => `/admin/assets/inventory/${id}/view`,
  },
  edit: {
    path: "/admin/assets/inventory/:id/edit",
    build: (id: string | number) => `/admin/assets/inventory/${id}/edit`,
  },
  categories: {
    list: "/admin/assets/categories",
    create: "/admin/assets/categories/new",
    edit: {
      path: "/admin/assets/categories/:id/edit",
      build: (id: string | number) => `/admin/assets/categories/${id}/edit`,
    },
  },
  inventory: {
    list: "/admin/assets/inventory",
    create: "/admin/assets/inventory/new",
    edit: {
      path: "/admin/assets/inventory/:id/edit",
      build: (id: string | number) => `/admin/assets/inventory/${id}/edit`,
    },
  },
  assignments: {
    list: "/admin/assets/assignments",
    create: "/admin/assets/assignments/new",
    edit: {
      path: "/admin/assets/assignments/:id/edit",
      build: (id: string | number) => `/admin/assets/assignments/${id}/edit`,
    },
  },
  maintenance: {
    list: "/admin/assets/maintenance/management",
    create: "/admin/assets/maintenance/management/new",
    edit: {
      path: "/admin/assets/maintenance/management/:id/edit",
      build: (id: string | number) => `/admin/assets/maintenance/management/${id}/edit`,
    },
    calendar: "/admin/assets/maintenance/calendar",
  },
} as const;

// ============================================
// MÓDULO: INCIDENCIAS
// ============================================

export const ADMIN_INCIDENTS = {
  list: "/admin/incidents/management",
  create: "/admin/incidents/management/new",
  view: {
    path: "/admin/incidents/management/:id/view",
    build: (id: string | number) => `/admin/incidents/management/${id}/view`,
  },
  edit: {
    path: "/admin/incidents/management/:id/edit",
    build: (id: string | number) => `/admin/incidents/management/${id}/edit`,
  },
  categories: {
    list: "/admin/incidents/categories",
    create: "/admin/incidents/categories/new",
    edit: {
      path: "/admin/incidents/categories/:id/edit",
      build: (id: string | number) => `/admin/incidents/categories/${id}/edit`,
    },
  },
} as const;

// ============================================
// MÓDULO: ÓRDENES DE TRABAJO
// ============================================

export const ADMIN_WORK_ORDERS = {
  list: "/admin/work-orders",
  create: "/admin/work-orders/new",
  view: {
    path: "/admin/work-orders/:id/view",
    build: (id: string | number) => `/admin/work-orders/${id}/view`,
  },
} as const;

// ============================================
// MÓDULO: ALMACÉN
// ============================================

export const ADMIN_WAREHOUSE = {
  list: "/admin/warehouse/consumables",
  create: "/admin/warehouse/consumables/new",
  edit: {
    path: "/admin/warehouse/consumables/:id/edit",
    build: (id: string | number) => `/admin/warehouse/consumables/${id}/edit`,
  },
  stock: {
    list: "/admin/warehouse/stock",
    create: "/admin/warehouse/stock/new",
    view: {
      path: "/admin/warehouse/stock/:id/view",
      build: (id: string | number) => `/admin/warehouse/stock/${id}/view`,
    },
    edit: {
      path: "/admin/warehouse/stock/:id/edit",
      build: (id: string | number) => `/admin/warehouse/stock/${id}/edit`,
    },
  },
  movements: {
    list: "/admin/warehouse/movements",
    create: "/admin/warehouse/movements/new",
    edit: {
      path: "/admin/warehouse/movements/:id/edit",
      build: (id: string | number) => `/admin/warehouse/movements/${id}/edit`,
    },
  },
  requisitions: {
    list: "/admin/warehouse/requisitions",
    create: "/admin/warehouse/requisitions/new",
    edit: {
      path: "/admin/warehouse/requisitions/:id/edit",
      build: (id: string | number) =>
        `/admin/warehouse/requisitions/${id}/edit`,
    },
  },
  categories: {
    list: "/admin/warehouse/categories",
    create: "/admin/warehouse/categories/new",
    edit: {
      path: "/admin/warehouse/categories/:id/edit",
      build: (id: string | number) => `/admin/warehouse/categories/${id}/edit`,
    },
  },
} as const;

// ============================================
// MÓDULO: VOLUNTARIOS
// ============================================

export const ADMIN_VOLUNTEERS = {
  list: "/admin/volunteers/management",
  create: "/admin/volunteers/management/register",
  edit: {
    path: "/admin/volunteers/management/edit/:id",
    build: (id: string | number) => `/admin/volunteers/management/edit/${id}`,
  },
  activities: {
    list: '/admin/volunteers/activities',
    create: '/admin/volunteers/activities/new',
    view: {
      path: '/admin/volunteers/activities/:id/view',
      build: (id: string | number) => `/admin/volunteers/activities/${id}/view`,
    },
    edit: {
      path: '/admin/volunteers/activities/:id/edit',
      build: (id: string | number) => `/admin/volunteers/activities/${id}/edit`,
    },
  },
  participations: {
    list: "/admin/volunteers/participations",
    create: "/admin/volunteers/participations/new",
    view: {
      path: "/admin/volunteers/participations/:id/view",
      build: (id: string | number) => `/admin/volunteers/participations/${id}/view`,
    },
    edit: {
      path: "/admin/volunteers/participations/:id/edit",
      build: (id: string | number) => `/admin/volunteers/participations/${id}/edit`,
    },
  },
  recognition: "/admin/volunteers/recognition",
  settings: "/admin/volunteers/settings",
} as const;

// ============================================
// MÓDULO: FINANZAS
// ============================================

export const ADMIN_FINANCE = {
  // Presupuesto
  budgetPlanning: "/admin/finance/budget-planning",

  // Cédulas
  incomes: "/admin/finance/incomes",
  expenses: "/admin/finance/expenses",

  // Flujo de efectivo
  cashFlowMatrix: "/admin/finance/cash-flow-matrix",

  // Calculadora financiera (rutas unificadas)
  calculator: "/admin/finance/calculator",

  // Reportes - duplicado de dashboard
  reports: "/admin/finance/reports",

  // Catálogo - categorías financieras
  catalog: "/admin/finance/catalog",

  // Aprobaciones - para actividades
  pendingApproval: "/admin/finance/pending-approval",

  // Pagos
  payments: "/admin/finance/payments",
} as const;

// ============================================
// MÓDULO: CONTABILIDAD
// ============================================

export const ADMIN_ACCOUNTING = {
  // Categorías contables
  categories: "/admin/accounting/categories",

  // Transacciones
  transactions: "/admin/accounting/transactions",

  // Asientos contables
  journalEntries: "/admin/accounting/journal-entries",

  // Balance de comprobación
  trialBalance: "/admin/accounting/trial-balance",

  // Estados financieros
  financialStatements: "/admin/accounting/financial-statements",

  // Activos fijos
  fixedAssets: "/admin/accounting/fixed-assets",

  // Integración
  integration: "/admin/accounting/integration",
} as const;

// ============================================
// MÓDULO: CONCESIONES
// ============================================

export const ADMIN_CONCESSIONS = {
  // Catálogo
  list: "/admin/concessions/catalog",
  // Creación y edición nuevas
  create: "/admin/concessions/catalog/new",
  edit: {
    path: "/admin/concessions/catalog/:id/edit",
    build: (id: string | number) => `/admin/concessions/catalog/${id}/edit`,
  },

  // Concesionarios
  concessionaires: {
    list: "/admin/concessions/concessionaires",
    // Creación y edición nuevas
    create: "/admin/concessions/concessionaires/new",
    edit: {
      path: "/admin/concessions/concessionaires/:id/edit",
      build: (id: string | number) =>
        `/admin/concessions/concessionaires/${id}/edit`,
    },
  },

  // Contratos
  contracts: {
    list: "/admin/concessions/contracts",
    // Creación y edición nuevas
    create: "/admin/concessions/contracts/new",
    edit: {
      path: "/admin/concessions/contracts/:id/edit",
      build: (id: string | number) => `/admin/concessions/contracts/${id}/edit`,
    },
  },

  // Ubicaciones - no implementada - agregar a catálogo
  locations: "/admin/concessions/locations",

  // Pagos y finanzas - centralizar en módulo de finanzas
  payments: "/admin/concessions/payments",
  hybridPayments: "/admin/concessions/hybrid-payments",

  // Evaluaciones - centralizado en módulo de evaluaciones
  evaluations: "/admin/concessions/evaluations",

  // Concesiones activas
  active: {
    list: "/admin/concessions/active",
    create: "/admin/concessions/active/new",
    edit: {
      path: "/admin/concessions/active/:id/edit",
      build: (id: string | number) => `/admin/concessions/active/${id}/edit`,
    },
    // Página de imágenes que se agregará a editar
    images: {
      path: "/admin/concessions/active/:id/images",
      build: (id: string | number) => `/admin/concessions/active/${id}/images`,
    },
  },

  // Reportes - duplicado de dashboard
  reports: "/admin/concessions/reports",
} as const;

// ============================================
// MÓDULO: MARKETING
// ============================================

export const ADMIN_MARKETING = {
  // Página de inicio - obsoleta
  main: "/admin/marketing",

  // Patrocinadores
  sponsors: {
    list: "/admin/marketing/sponsors",
    // Creación y edición en páginas independientes
    create: "/admin/marketing/sponsors/new",
    edit: {
      path: "/admin/marketing/sponsors/:id/edit",
      buils: (id: string | number) => `/admin/marketing/sponsors/${id}/edit`,
    },
  },

  // Contratos de patrocinio
  contracts: {
    list: "/admin/marketing/contracts",
    // Creación y edición en páginas independientes
    create: "/admin/marketing/contracts/new",
    edit: {
      path: "/admin/marketing/contracts/:id/edit",
      build: (id: string | number) => `/admin/marketing/contracts/${id}/edit`,
    },
  },

  // Paquetes de patrocinio
  packages: {
    list: "/admin/marketing/packages",
    // Creación y edición en páginas independientes
    create: "/admin/marketing/packages/new",
    edit: {
      path: "/admin/marketing/packages/:id/edit",
      build: (id: string | number) => `/admin/marketing/packages/${id}/edit`,
    },
  },

  // Beneficios
  benefits: {
    list: "/admin/marketing/benefits",
    // Creación y edición en páginas independientes
    create: "/admin/marketing/benefits/new",
    edit: {
      path: "/admin/marketing/benefits/:id/edit",
      build: (id: string | number) => `/admin/marketing/benefits/${id}/edit`,
    },
  },

  // Eventos patrocinados
  events: {
    list: "/admin/marketing/events",
    // Creación y edición en páginas independientes
    create: "/admin/marketing/events/new",
    edit: {
      path: "/admin/marketing/events/:id/edit",
      build: (id: string | number) => `/admin/marketing/events/${id}/edit`,
    },
  },

  // Activos patrocinados
  assets: {
    list: "/admin/marketing/assets",
    create: "/admin/marketing/assets/new",
  },
} as const;

// ============================================
// MÓDULO: ADVERTISING
// ============================================

export const ADMIN_ADVERTISING = {
  spaces: {
    list: "/admin/advertising/spaces",
    create: "/admin/advertising/spaces/new",
    edit: {
      path: "/admin/advertising/spaces/:id/edit",
      build: (id: string | number) => `/admin/advertising/spaces/${id}/edit`,
    },
  },

  advertisements: {
    list: "/admin/advertising/advertisements",
    create: "/admin/advertising/advertisements/new",
    edit: {
      path: "/admin/advertising/advertisements/:id/edit",
      build: (id: string | number) =>
        `/admin/advertising/advertisements/${id}/edit`,
    },
  },

  campaigns: {
    list: "/admin/advertising/campaigns",
    create: "/admin/advertising/campaigns/new",
    edit: {
      path: "/admin/advertising/campaigns/:id/edit",
      build: (id: string | number) => `/admin/advertising/campaigns/${id}/edit`,
    },
  },

  placements: {
    list: "/admin/advertising/placements",
    create: "/admin/advertising/placements/new",
    edit: {
      path: "/admin/advertising/placements/:id/edit",
      build: (id: string | number) =>
        `/admin/advertising/placements/${id}/edit`,
    },
  },
} as const;

// ============================================
// MÓDULO: COMUNICACIONES
// ============================================

export const ADMIN_COMMUNICATIONS = {
  // Plantillas
  templates: {
    list: "/admin/communications/templates",
    // Creación y edición en páginas independientes
    create: "/admin/communications/templates/new",
    edit: {
      path: "/admin/communications/templates/:id/edit",
      build: (id: string | number) =>
        `/admin/communications/templates/${id}/edit`,
    },
  },

  // Cola de emails
  queue: "/admin/communications/queue",

  // Campañas - no implementado
  campaigns: {
    list: "/admin/communications/campaigns",
    create: "/admin/communications/campaigns/new",
    edit: {
      path: "/admin/communications/campaigns/:id/edit",
      build: (id: string | number) =>
        `/admin/communications/campaigns/${id}/edit`,
    },
  },

  // Envío masivo
  bulk: "/admin/communications/bulk",

  // Analytics - no implementado (se puede recuperar para el dashboard)
  analytics: "/admin/communications/analytics",
} as const;

// ============================================
// MÓDULO: RECURSOS HUMANOS
// ============================================

export const ADMIN_HR = {
  // Personal
  employees: {
    list: "/admin/hr/employees",
    // Crear y editar en páginas independientes
    create: "/admin/hr/employees/new",
    edit: {
      path: "/admin/hr/employees/:id/edit",
      build: (id: string | number) => `/admin/hr/employees/${id}/edit`,
    },
  },

  // Vacaciones y permisos
  timeOff: {
    list: "/admin/hr/vacations",
    // Crear y editar en páginas independientes
    create: "/admin/hr/vacations/new",
    edit: {
      path: "/admin/hr/vacations/:id/edit",
      build: (id: string | number) => `/admin/hr/vacations/${id}/edit`,
    },
  },

  // Módulo más simple - obsoleto
  vacaciones: "/admin/hr/vacaciones",

  // Capacitación - no implementado
  training: {
    list: "/admin/hr/training",
    // Crear y editar en páginas independientes
    create: "/admin/hr/training/new",
    edit: {
      path: "/admin/hr/training/:id/edit",
      build: (id: string | number) => `/admin/hr/training/${id}/edit`,
    },
  },

  // Nómina
  payroll: {
    list: "/admin/hr/payroll",
    // Crear y editar en páginas independientes
    create: "/admin/hr/payroll/new",
    edit: {
      path: "/admin/hr/payroll/:id/edit",
      build: (id: string | number) => `/admin/hr/payroll/${id}/edit`,
    },
  },

  // Recibos de nómina - no implementado
  receipts: {
    list: "/admin/hr/receipts",
    // Crear y editar en páginas independientes
    create: "/admin/hr/receipts/new",
    edit: {
      path: "/admin/hr/receipts/:id/edit",
      build: (id: string | number) => `/admin/hr/receipts/${id}/edit`,
    },
  },

  // Control de horas - no implementado
  timeTracking: "/admin/hr/control-horas",

  // Bienestar - no implementado
  wellness: "/admin/hr/wellness",

  // Analytics - no implementado (recuperar en dashboard)
  analytics: "/admin/hr/analytics",
} as const;

// ============================================
// MÓDULO: CONFIGURACIÓN
// ============================================

export const ADMIN_SETTINGS = {
  // Unificado obsoleto (formato dashboard)
  main: "/admin/configuracion-seguridad",

  // Control de acceso
  roles: {
    list: "/admin/configuracion-seguridad/access/roles",
    create: "/admin/configuracion-seguridad/access/roles/new",
    edit: {
      path: "/admin/configuracion-seguridad/access/roles/:id/edit",
      build: (id: string | number) =>
        `/admin/configuracion-seguridad/access/roles/${id}/edit`,
    },
  },
  permissions: "/admin/configuracion-seguridad/access/permissions",
  users: {
    list: "/admin/configuracion-seguridad/access/users",
    // Nueva página para editar usuario
    create: "/admin/configuracion-seguridad/access/users/new",
    edit: {
      path: "/admin/configuracion-seguridad/access/users/:id/edit",
      build: (id: string | number) =>
        `/admin/configuracion-seguridad/access/users/${id}/edit`,
    },
  },

  // Políticas - revisar opciones a eliminar
  policies: "/admin/configuracion-seguridad/policies",

  // Notificaciones - en desarrollo
  notifications: "/admin/configuracion-seguridad/notifications",

  // Auditoría - en desarrollo
  audit: "/admin/configuracion-seguridad/audit",
  // Ya está en auditoría (candidato a eliminar)
  auditRoleAudits: "/admin/configuracion-seguridad/audit/role-audits",

  // Mantenimiento - probable eliminación
  maintenance: "/admin/configuracion-seguridad/maintenance",

  // Página de respaldo a mantener
  backup: "/admin/configuracion-seguridad/maintenance/backup",

  // Páginas a eliminar
  maintenancePerformance:
    "/admin/configuracion-seguridad/maintenance/performance",
  maintenanceUpdates: "/admin/configuracion-seguridad/maintenance/updates",

  // Exportaciones - en desarrollo
  exports: "/admin/configuracion-seguridad/exports",
} as const;

// ============================================
// MÓDULO: USUARIOS - OBSOLETO
// ============================================

export const ADMIN_USERS = {
  list: "/admin/users",
  pending: "/admin/pending-users",

  // Notificaciones (tomar de base para la página que se queda de notificaciones del sistema)
  notifications: "/admin/users/notifications",
} as const;

// ============================================
// MÓDULO: PERMISOS (LEGACY)
// ============================================

export const ADMIN_PERMISSIONS = {
  // Duplicidad con matriz de permisos
  main: "/admin/permissions",

  // Dashboard a eliminar
  dashboard: "/admin/permissions/dashboard",

  // Duplicidad con matriz de permisos
  matrix: "/admin/permissions/matrix",
} as const;

// ============================================
// MÓDULO: ROLES - RUTA HUÉRFANA
// ============================================

export const ADMIN_ROLES = {
  list: "/admin/roles",
} as const;

// ============================================
// MÓDULO: CONFIGURACIÓN DEL USUSARIO
// ============================================

export const ADMIN_PROFILE = {
  // Página de configuración obsoleta
  main: "/admin/settings",

  // Ajustes de usuario (rediseñar con base firebase)
  profile: "/admin/settings/profile",

  activity: "/admin/user-activity",
  notifications: "/admin/user-notifications", // ✅ AGREGAR
} as const;

// ============================================
// MÓDULO: ANALYTICS - DASHBOARDS OBSOLETOS
// ============================================

export const ADMIN_ANALYTICS = {
  main: "/admin/analytics",
} as const;

// ============================================
// MÓDULO: DOCUMENTOS - NO IMPLEMENTADO
// ============================================

export const ADMIN_DOCUMENTS = {
  list: "/admin/documents",
} as const;

// ============================================
// MÓDULO: COMENTARIOS - NO IMPLEMENTADO
// ============================================

export const ADMIN_COMMENTS = {
  list: "/admin/comments",
} as const;

// ============================================
// MÓDULO: SISTEMA - REUBICAR EN CONFIGURACIÓN
// ============================================

export const ADMIN_SYSTEM = {
  emailSettings: "/admin/system/email-settings",
  backup: "/admin/system/backup",

  // Duplicado en módulo configuración
  performance: "/admin/system/performance",
  updates: "/admin/system/updates",
} as const;

// ============================================
// MÓDULO: CENTRO DE AYUDA
// ============================================

export const HELP_ROUTES = {
  manuals: {
    visitors: "/help/visitantes-manual",
    parks: "/help/parques-manual",
    activities: "/help/actividades-manual",
  },
} as const;

// ============================================
// EXPORTACIÓN CONSOLIDADA
// ============================================

export const ROUTES = {
  // Rutas públicas
  public: PUBLIC_ROUTES,

  // Autenticación
  auth: AUTH_ROUTES,

  // Dashboards centralizados
  dashboards: DASHBOARD_ROUTES,

  // Centro de ayuda
  help: HELP_ROUTES,

  // Módulos administrativos
  admin: {
    // Gestión
    parks: ADMIN_PARKS,
    activities: ADMIN_ACTIVITIES,
    amenities: ADMIN_AMENITIES,
    trees: ADMIN_TREES,
    fauna: ADMIN_FAUNA,

    // Operación
    visitors: ADMIN_VISITORS,
    events: ADMIN_EVENTS,
    spaceReservations: ADMIN_SPACE_RESERVATIONS,
    evaluations: ADMIN_EVALUATIONS,

    // Operación y Mantenimiento
    assets: ADMIN_ASSETS,
    incidents: ADMIN_INCIDENTS,
    workOrders: ADMIN_WORK_ORDERS,
    warehouse: ADMIN_WAREHOUSE,

    // Personas
    volunteers: ADMIN_VOLUNTEERS,

    // Administración y Finanzas
    finance: ADMIN_FINANCE,
    accounting: ADMIN_ACCOUNTING,
    concessions: ADMIN_CONCESSIONS,

    // Marketing y Comunicaciones
    marketing: ADMIN_MARKETING,
    advertising: ADMIN_ADVERTISING,
    communications: ADMIN_COMMUNICATIONS,

    // Recursos Humanos
    hr: ADMIN_HR,

    // Configuración y Administración
    settings: ADMIN_SETTINGS,
    users: ADMIN_USERS,
    permissions: ADMIN_PERMISSIONS,
    roles: ADMIN_ROLES,
    profile: ADMIN_PROFILE,

    // Sistema (Legacy)
    analytics: ADMIN_ANALYTICS,
    documents: ADMIN_DOCUMENTS,
    comments: ADMIN_COMMENTS,
    system: ADMIN_SYSTEM,
  },
} as const;

// Exportación por defecto
export default ROUTES;
