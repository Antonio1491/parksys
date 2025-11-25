import React, { Suspense, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProfileCompletionProvider } from "@/components/ProfileCompletionContext";
import "./i18n";
import { ROUTES } from '@/routes';

// ============================================
// COMPONENTES REUTILIZABLES
// ============================================
import LoadingPage from "@/components/LoadingPage";

// ============================================
// PÁGINAS CON CARGA INMEDIATA (Critical Path)
// ============================================
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Parks from "@/pages/parks";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin";

// ============================================
// PÁGINAS PÚBLICAS CON LAZY LOADING
// ============================================

// Parques
const ParkLandingPage = lazy(() => import('./pages/ParkLandingPage'));
const ParkEvaluations = lazy(() => import('@/pages/ParkEvaluations'));
const ParkEvaluationForm = lazy(() => import('@/pages/ParkEvaluationForm'));

// Actividades
const Activities = lazy(() => import('@/pages/activities'));
const ActivityDetailPage = lazy(() => import('@/pages/activity-detail'));
const ActivityPayment = lazy(() => import('@/pages/activity-payment'));

// Eventos
const Events = lazy(() => import('@/pages/Events'));
const EventDetail = lazy(() => import('@/pages/event-detail'));

// Reservaciones
const Reservations = lazy(() => import('@/pages/reservations'));
const SpaceDetail = lazy(() => import('@/pages/space-detail'));

// Calendario
const Calendar = lazy(() => import('@/pages/calendar'));

// Concesiones
const ConcessionsList = lazy(() => import('@/pages/ConcessionsList'));
const ConcessionDetail = lazy(() => import('@/pages/ConcessionDetail'));

// Especies Arbóreas
const TreeSpecies = lazy(() => import('@/pages/TreeSpecies'));
const TreeSpeciesDetail = lazy(() => import('@/pages/TreeSpeciesDetail'));

// Fauna
const Fauna = lazy(() => import('@/pages/Fauna'));
const FaunaDetail = lazy(() => import('@/pages/FaunaDetail'));

// Voluntarios
const VolunteersList = lazy(() => import('@/pages/VolunteersList'));
const VolunteerRegistration = lazy(() => import('@/pages/VolunteerRegistration'));

// Instructores
const Instructors = lazy(() => import('@/pages/instructors'));
const PublicInstructorProfile = lazy(() => import('@/pages/PublicInstructorProfile'));

// ============================================
// DASHBOARDS ADMINISTRATIVOS CON LAZY LOADING
// ============================================
const ParksDashboard = lazy(() => import('@/pages/admin/parks-dashboard'));
const ActivitiesDashboard = lazy(() => import('@/pages/admin/organizador/index'));
const AmenitiesDashboard = lazy(() => import('@/pages/admin/amenities-dashboard'));
const TreesDashboard = lazy(() => import('@/pages/admin/trees/dashboard'));
const VisitorsDashboard = lazy(() => import('@/pages/admin/visitors/dashboard-simple'));
const EventsDashboard = lazy(() => import('@/pages/admin/events/index'));
const ReservationsDashboard = lazy(() => import('@/pages/admin/dashboard-reservas'));
const EvaluationsDashboard = lazy(() => import('@/pages/admin/evaluaciones/dashboard'));
const AssetsDashboard = lazy(() => import('@/pages/admin/assets/dashboard'));
const IncidentsDashboard = lazy(() => import('@/pages/admin/incidents/dashboard'));
const WorkOrdersDashboard = lazy(() => import('@/pages/admin/work-orders/dashboard'));
const WarehouseDashboard = lazy(() => import('@/pages/admin/warehouse/Dashboard'));
const VolunteersDashboard = lazy(() => import('@/pages/admin/volunteers/dashboard/index'));
const FinanceDashboard = lazy(() => import('@/pages/admin/finance/dashboard'));
const AccountingDashboard = lazy(() => import('@/pages/admin/accounting/dashboard'));
const ConcessionsDashboard = lazy(() => import('@/pages/admin/concessions/dashboard'));
const MarketingDashboard = lazy(() => import('@/pages/admin/marketing/dashboard'));
const HRDashboard = lazy(() => import('@/pages/admin/hr/dashboard'));

// ============================================
// MÓDULOS ADMINISTRATIVOS (Mantenemos importación directa por ahora)
// ============================================
import AdminParks from "@/pages/admin/parks";
import AdminParkEdit from "@/pages/admin/park-edit";
import AdminParkView from "@/pages/admin/park-view";
import AdminActivities from "@/pages/admin/activities";
import AdminAmenities from "@/pages/admin/amenities";
import EvaluacionesParques from "@/pages/admin/evaluaciones/parques";
import EventsIndex from "@/pages/admin/events/index";
import NewEventPage from "@/pages/admin/events/new";
import EditEventPage from "@/pages/admin/events/edit";
import EventCategoriesPage from "@/pages/admin/events/categories";
import EventRegistrationsPage from "@/pages/admin/events/registrations";
import AdminVolunteerParticipations from "@/pages/admin/volunteers/participations";
import AdminParticipationEdit from "@/pages/admin/volunteers/participations/edit";
import PendingUsersPage from "@/pages/admin/pending-users";
import AccessUsersPage from "@/pages/admin/configuracion-seguridad/access/users";
import AdminSettings from "@/pages/admin/settings";
import AdminPayments from "@/pages/admin/payments";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminDocuments from "@/pages/admin/documents";
import AdminComments from "@/pages/admin/comments";

function Router() {
  const [location, setLocation] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
        <Switch>

          {/* ========================================== */}
          {/* RUTAS PÚBLICAS ✅ REFACTORIZADAS           */}
          {/* ========================================== */}

          {/* Página de inicio - Carga inmediata */}
          <Route path={ROUTES.public.home} component={Home} />

          {/* Listado de parques - Carga inmediata */}
          <Route path={ROUTES.public.parks} component={Parks} />

          {/* Detalle de parque por ID */}
          <Route path={ROUTES.public.parkDetail.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.parks" />}>
              <ParkLandingPage />
            </Suspense>
          </Route>

          {/* Detalle de parque por slug */}
          <Route path={ROUTES.public.parkBySlug.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.parks" />}>
              <ParkLandingPage />
            </Suspense>
          </Route>

          {/* Evaluaciones del parque */}
          <Route path={ROUTES.public.parkEvaluations.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.parkEvaluations" />}>
              <ParkEvaluations />
            </Suspense>
          </Route>

          {/* Formulario de evaluación */}
          <Route path={ROUTES.public.parkEvaluate.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.parkForm" />}>
              <ParkEvaluationForm />
            </Suspense>
          </Route>

          {/* ========== ACTIVIDADES ========== */}

          <Route path={ROUTES.public.activities}>
            <Suspense fallback={<LoadingPage messageKey="loading.activities" />}>
              <Activities />
            </Suspense>
          </Route>

          <Route path={ROUTES.public.activityDetail.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.activity" />}>
              <ActivityDetailPage />
            </Suspense>
          </Route>

          <Route path={ROUTES.public.activityPayment.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.activityPayment" />}>
              <ActivityPayment />
            </Suspense>
          </Route>

          {/* ========== EVENTOS ========== */}

          <Route path={ROUTES.public.events}>
            <Suspense fallback={<LoadingPage messageKey="loading.events" />}>
              <Events />
            </Suspense>
          </Route>

          <Route path={ROUTES.public.eventDetail.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.event" />}>
              <EventDetail />
            </Suspense>
          </Route>

          {/* ========== RESERVACIONES ========== */}

          <Route path={ROUTES.public.reservations}>
            <Suspense fallback={<LoadingPage messageKey="loading.reservations" />}>
              <Reservations />
            </Suspense>
          </Route>

          <Route path={ROUTES.public.spaceDetail.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.space" />}>
              <SpaceDetail />
            </Suspense>
          </Route>

          {/* ========== CALENDARIO ========== */}

          <Route path={ROUTES.public.calendar}>
            <Suspense fallback={<LoadingPage messageKey="loading.calendar" />}>
              <Calendar />
            </Suspense>
          </Route>

          {/* ========== CONCESIONES ========== */}

          <Route path={ROUTES.public.concessions}>
            <Suspense fallback={<LoadingPage messageKey="loading.concessions" />}>
              <ConcessionsList />
            </Suspense>
          </Route>

          <Route path={ROUTES.public.concessionDetail.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.concession" />}>
              <ConcessionDetail />
            </Suspense>
          </Route>

          {/* ========== ESPECIES ARBÓREAS ========== */}

          <Route path={ROUTES.public.treeSpecies}>
            <Suspense fallback={<LoadingPage messageKey="loading.treeSpecies" />}>
              <TreeSpecies />
            </Suspense>
          </Route>

          <Route path={ROUTES.public.treeSpeciesDetail.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.treeSpeciesDetail" />}>
              <TreeSpeciesDetail />
            </Suspense>
          </Route>

          {/* ========== FAUNA ========== */}

          <Route path={ROUTES.public.fauna}>
            <Suspense fallback={<LoadingPage messageKey="loading.fauna" />}>
              <Fauna />
            </Suspense>
          </Route>

          <Route path={ROUTES.public.faunaDetail.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.faunaDetail" />}>
              <FaunaDetail />
            </Suspense>
          </Route>

          {/* ========== VOLUNTARIOS ========== */}

          <Route path={ROUTES.public.volunteers}>
            <Suspense fallback={<LoadingPage messageKey="loading.volunteers" />}>
              <VolunteersList />
            </Suspense>
          </Route>

          <Route path={ROUTES.public.volunteerRegister}>
            <Suspense fallback={<LoadingPage messageKey="loading.volunteerForm" />}>
              <VolunteerRegistration />
            </Suspense>
          </Route>

          {/* ========== INSTRUCTORES ========== */}

          <Route path={ROUTES.public.instructors}>
            <Suspense fallback={<LoadingPage messageKey="loading.instructors" />}>
              <Instructors />
            </Suspense>
          </Route>

          <Route path={ROUTES.public.instructorProfile.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.instructorProfile" />}>
              <PublicInstructorProfile />
            </Suspense>
          </Route>

          {/* ========================================== */}
          {/* AUTENTICACIÓN                              */}
          {/* ========================================== */}

          <Route path={ROUTES.auth.login} component={AdminLogin} />

          {/* ========================================== */}
          {/* DASHBOARDS ADMINISTRATIVOS ✅ REFACTORIZADOS */}
          {/* ========================================== */}

          {/* Dashboard Principal - Carga inmediata */}
          <Route path={ROUTES.dashboards.main} component={AdminDashboard} />

          <Route path={ROUTES.dashboards.parks}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardParks" />}>
              <ParksDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.activities}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardActivities" />}>
              <ActivitiesDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.amenities}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardamenities" />}>
              <AmenitiesDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.trees}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboard de arbolado..." />}>
              <TreesDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.visitors}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardVisitors" />}>
              <VisitorsDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.events} component={EventsIndex} />

          <Route path={ROUTES.dashboards.reservations}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardReservations" />}>
              <ReservationsDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.evaluations}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardEvaluations" />}>
              <EvaluationsDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.assets}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardAssets" />}>
              <AssetsDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.incidents}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardIncidents" />}>
              <IncidentsDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.workOrders}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardWorkOrders" />}>
              <WorkOrdersDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.warehouse}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardWarehouse" />}>
              <WarehouseDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.volunteers}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardVolunteers" />}>
              <VolunteersDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.finance}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardFinance" />}>
              <FinanceDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.accounting}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardAccounting" />}>
              <AccountingDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.concessions}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardConcessions" />}>
              <ConcessionsDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.marketing}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardMarketing" />}>
              <MarketingDashboard />
            </Suspense>
          </Route>

          <Route path={ROUTES.dashboards.hr}>
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardHR" />}>
              <HRDashboard />
            </Suspense>
          </Route>

          {/* Página para pruebas */}
          <Route path="/prueba">
            <Suspense fallback={<LoadingPage messageKey="loading.test" />}>
              {React.createElement(React.lazy(() => import('@/pages/public/test')))}
            </Suspense>
          </Route>

          {/* ========================================== */}
          {/* MÓDULOS ADMINISTRATIVOS                     */}
          {/* (Por revisar - Mantenido tal cual)         */}
          {/* ========================================== */}

          {/* Rutas del módulo de Parques */}
          <Route path={ROUTES.admin.parks.list} component={AdminParks} />
          <Route path={ROUTES.admin.parks.create} component={AdminParkEdit} />
          <Route path={ROUTES.admin.parks.view.path} component={AdminParkView} />
          <Route path={ROUTES.admin.parks.edit.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.parkManagement" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/park-manage')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de Actividades */}
          <Route path={ROUTES.admin.activities.list} component={AdminActivities} />
          <Route path={ROUTES.admin.activities.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.activityForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/organizador/catalogo/crear')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.activities.view.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.activityDetail" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/organizador/catalogo/detalle')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.activities.edit.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.activityEdit" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/organizador/catalogo/editar')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.activities.calendar}>
            <Suspense fallback={<LoadingPage messageKey="loading.calendar" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/activities/calendar')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.activities.categories.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.categories" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/activities/categories')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.activities.registrations}>
            <Suspense fallback={<LoadingPage messageKey="loading.registrations" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/activities/registrations')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.activities.registrationDetail.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.registrationDetail" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/activities/registrations/detail')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.activities.instructors.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.instructorsManagement" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/activities/instructors')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.activities.instructors.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.instructorForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/activities/instructors/new')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.activities.instructors.view.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.instructorDetail" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/activities/instructors/detail')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.activities.instructors.edit.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.instructorEdit" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/activities/instructors/edit')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de Amenidades */}
          <Route path={ROUTES.admin.amenities.list} component={AdminAmenities} />
          <Route path={ROUTES.admin.amenities.import}>
            <Suspense fallback={<LoadingPage messageKey="loading.amenityImport" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/amenities-import')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de Arbolado */}
          <Route path={ROUTES.admin.trees.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.treesCatalog" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/trees/inventory')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.trees.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.treeForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/trees/inventory/new')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.trees.operation}>
            <Suspense fallback={<LoadingPage messageKey="loading.areasManagement" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/trees/operation')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.trees.operationDetail.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.areaDetail" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/trees/operation/[id]/view')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.trees.species.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.treeSpeciesCatalog" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/trees/catalog/index')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.trees.species.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.treeSpeciesForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/trees/catalog/new/simple')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.trees.species.view.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.treeSpeciesDetail" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/trees/catalog/[id]/view')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.trees.maintenance.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.treeMaintenance" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/trees/maintenance/index')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.trees.reports}>
            <Suspense fallback={<LoadingPage messageKey="loading.treeReports" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/trees/reports/index')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de Fauna */}
          <Route path={ROUTES.admin.fauna.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.faunaManagement" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/fauna/species')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de visitantes */}
          <Route path={ROUTES.admin.visitors.count}>
            <Suspense fallback={<LoadingPage messageKey="loading.visitorsCount" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/parks/visitor-count')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.visitors.feedback}>
            <Suspense fallback={<LoadingPage messageKey="loading.Feedback" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/visitors/feedback')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de eventos */}
          <Route path={ROUTES.admin.events.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.events" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/events/EventsList')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.events.create} component={NewEventPage} />
          <Route path={ROUTES.admin.events.edit.path} component={EditEventPage} />
          <Route path={ROUTES.admin.events.registrations} component={EventRegistrationsPage} />
          <Route path={ROUTES.admin.events.calendar}>
            <Suspense fallback={<LoadingPage messageKey="loading.eventsCalendar" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/events/calendar')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.events.categories.list} component={EventCategoriesPage} />

          {/* Rutas del módulo de reservas */}
          <Route path={ROUTES.admin.spaceReservations.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.spaceReservations" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/index')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.spaceReservations.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.reservationForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/new')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.spaceReservations.edit.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.reservationEdit" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/edit')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.spaceReservations.calendar}>
            <Suspense fallback={<LoadingPage messageKey="loading.reservationCalendar" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/calendar')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.spaceReservations.spaces.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.spaces" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/spaces')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.spaceReservations.spaces.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.spaceForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/spaces/new')))}
            </Suspense>
          </Route>

          {/* MÓDULO DE EVALUACIONES */}
          <Route path={ROUTES.admin.evaluations.criteria.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.criteria" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones/criterios')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.evaluations.parks} component={EvaluacionesParques} />
          <Route path={ROUTES.admin.evaluations.activities}>
            <Suspense fallback={<LoadingPage messageKey="loading.activityEvaluations" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones/actividades')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.evaluations.instructors}>
            <Suspense fallback={<LoadingPage messageKey="loading.instructorEvaluations" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones/instructores')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.evaluations.events}>
            <Suspense fallback={<LoadingPage messageKey="loading.eventEvaluations" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones/eventos')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.evaluations.volunteers}>
            <Suspense fallback={<LoadingPage messageKey="loading.volunteerEvaluations" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones/voluntarios')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.evaluations.concessionaires}>
            <Suspense fallback={<LoadingPage messageKey="loading.concessionaireEvaluations" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones/concesionarios')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de activos */}
          <Route path={ROUTES.admin.assets.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.assetInventory" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/inventory/index')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.assets.map}>
            <Suspense fallback={<LoadingPage messageKey="loading.assetMap" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/map')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.assets.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.assetForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/new')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.assets.view.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.assetDetail" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/[id]')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.assets.edit.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.assetEdit" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/edit-enhanced')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.assets.categories.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.assetCategories" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/categories/index')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.assets.assignments.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.assignments" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/assignments/index')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de incidencias */}
          <Route path={ROUTES.admin.incidents.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.incidents" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/incidents/incidents-nueva')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.incidents.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.incidentForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/incidents/new')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.incidents.view.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.incidentDetail" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/incidents/DetailedIncidentPage')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.incidents.categories.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.incidentCategories" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/incidents/categories')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de órdenes de trabajo */}
          <Route path={ROUTES.admin.workOrders.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.workOrders" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/work-orders/index')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.workOrders.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.workOrderForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/work-orders/new')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.workOrders.view.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.workOrderDetail" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/work-orders/[id]')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de almacén */}
          <Route path={ROUTES.admin.warehouse.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.warehouse" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/warehouse/Consumables')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.warehouse.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.warehouseForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/warehouse/ConsumableForm')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.warehouse.edit.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.warehouseEdit" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/warehouse/ConsumableEdit')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.warehouse.stock.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.inventory" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/warehouse/Stock')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.warehouse.stock.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.stockForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/warehouse/StockForm')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.warehouse.stock.edit.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.stockEdit" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/warehouse/StockEdit')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.warehouse.movements.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.movements" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/warehouse/Movements')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.warehouse.requisitions.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.requisitions" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/warehouse/Requisitions')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.warehouse.categories.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.warehouseCategories" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/warehouse/Categories')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de voluntarios */}
          <Route path={ROUTES.admin.volunteers.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.volunteerManagement" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/volunteers/index')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.volunteers.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.volunteerForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/volunteers/register')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.volunteers.edit.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.volunteerEdit" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/volunteers/edit')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.volunteers.activities.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.volunteerActivities" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/volunteers/activities')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.volunteers.activities.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.volunteerActivityForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/volunteers/activities/new')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.volunteers.activities.view.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.volunteerActivityDetail" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/volunteers/activities/view')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.volunteers.activities.edit.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.volunteerActivityEdit" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/volunteers/activities/edit')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.volunteers.participations.list} component={AdminVolunteerParticipations} />
          <Route path={ROUTES.admin.volunteers.participations.edit.path} component={AdminParticipationEdit} />

          {/* Rutas del módulo de Finanzas */}
          <Route path={ROUTES.admin.finance.catalog}>
            <Suspense fallback={<LoadingPage messageKey="loading.financeCatalog" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/finance/catalog')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.finance.pendingApproval}>
            <Suspense fallback={<LoadingPage messageKey="loading.financeApproval" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/finance/PendingActivitiesApproval')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.finance.payments} component={AdminPayments} />

          {/* Rutas del módulo de Contabilidad */}
          <Route path={ROUTES.admin.accounting.categories}>
            <Suspense fallback={<LoadingPage messageKey="loading.accountingCategories" />}>
              {React.createElement(React.lazy(() => import('@/pages/accounting/categories')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.accounting.transactions}>
            <Suspense fallback={<LoadingPage messageKey="loading.transactions" />}>
              {React.createElement(React.lazy(() => import('@/pages/accounting/transactions')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.accounting.journalEntries}>
            <Suspense fallback={<LoadingPage messageKey="loading.journalEntries" />}>
              {React.createElement(React.lazy(() => import('@/pages/accounting/journal-entries')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.accounting.trialBalance}>
            <Suspense fallback={<LoadingPage messageKey="loading.trialBalance" />}>
              {React.createElement(React.lazy(() => import('@/pages/accounting/trial-balance')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.accounting.financialStatements}>
            <Suspense fallback={<LoadingPage messageKey="loading.financialStatements" />}>
              {React.createElement(React.lazy(() => import('@/pages/accounting/financial-statements')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.accounting.fixedAssets}>
            <Suspense fallback={<LoadingPage messageKey="loading.fixedAssets" />}>
              {React.createElement(React.lazy(() => import('@/pages/accounting/fixed-assets')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.accounting.integration}>
            <Suspense fallback={<LoadingPage messageKey="loading.integration" />}>
              {React.createElement(React.lazy(() => import('@/pages/accounting/integration')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de Concesiones */}
          <Route path={ROUTES.admin.concessions.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.concessionsCatalog" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/concessions/catalog/index')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.concessions.contracts.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.contracts" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/concessions/contracts/index')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.concessions.active.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.activeConcessions" />}>
              {React.createElement(React.lazy(() => import('@/pages/ActiveConcessionsList')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.concessions.active.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.activeConcessionForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/ActiveConcessionForm')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.concessions.active.edit.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.activeConcessionEdit" />}>
              {React.createElement(React.lazy(() => import('@/pages/ActiveConcessionForm')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.concessions.payments}>
            <Suspense fallback={<LoadingPage messageKey="loading.concessionPayments" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/concessions/payments/index')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.concessions.evaluations}>
            <Suspense fallback={<LoadingPage messageKey="loading.concessionEvaluations" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/concessions/evaluations/index')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.concessions.hybridPayments}>
            <Suspense fallback={<LoadingPage messageKey="loading.hybridPayments" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/concessions/hybrid-payments')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de Marketing */}
          <Route path={ROUTES.admin.marketing.sponsors.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.sponsors" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/marketing/sponsors')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.marketing.contracts.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.contracts" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/marketing/contracts')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.marketing.packages.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.packages" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/marketing/packages')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.marketing.benefits.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.benefits" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/marketing/benefits')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.marketing.events.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.sponsoredEvents" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/marketing/events')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.marketing.assets.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.sponsoredAssets" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/marketing/assets')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.marketing.assets.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.sponsoredAssetForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/marketing/AssetsForm')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de Publicidad */}
          <Route path={ROUTES.admin.advertising.spaces.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.adSpaces" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/advertising/spaces')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.advertising.spaces.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.adSpaceForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/advertising/spaces/new')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.advertising.spaces.edit.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.adSpaceEdit" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/advertising/spaces/edit')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.advertising.advertisements.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.advertisements" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/advertising/advertisements')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.advertising.advertisements.create}>
            <Suspense fallback={<LoadingPage messageKey="loading.advertisementForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/advertising/advertisements/new')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.advertising.advertisements.edit.path}>
            <Suspense fallback={<LoadingPage messageKey="loading.advertisementForm" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/advertising/advertisements/edit')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.advertising.campaigns.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.campaigns" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/advertising/campaigns')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.advertising.placements.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.placements" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/advertising/placements')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de Comunicaciones */}
          <Route path={ROUTES.admin.communications.templates.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.templates" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/communications/templates')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.communications.queue}>
            <Suspense fallback={<LoadingPage messageKey="loading.emailQueue" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/communications/queue')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.communications.bulk}>
            <Suspense fallback={<LoadingPage messageKey="loading.bulk" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/communications/bulk')))}
            </Suspense>
          </Route>

          {/* Rutas del módulo de Recursos Humanos */}
          <Route path={ROUTES.admin.hr.employees.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.employees" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/hr/employees')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.hr.timeOff.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.timeOff" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/hr/vacations')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.hr.training.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.training" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/hr/training')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.hr.payroll.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.payroll" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/hr/payroll')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.hr.receipts.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.receipts" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/hr/receipts')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.hr.timeTracking}>
            <Suspense fallback={<LoadingPage messageKey="loading.timeTracking" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/hr/control-horas')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.hr.wellness}>
            <Suspense fallback={<LoadingPage messageKey="loading.wellness" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/hr/wellness')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.hr.analytics}>
            <Suspense fallback={<LoadingPage messageKey="loading.timeTracking" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/hr/analytics')))}
            </Suspense>
          </Route>

          {/* Rutas de Configuración y Seguridad */}
          <Route path={ROUTES.admin.settings.users.list}>
            <AccessUsersPage />
          </Route>
          <Route path={ROUTES.admin.settings.notifications}>
            <Suspense fallback={<LoadingPage messageKey="loading.notificationPreferences" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/settings/NotificationPreferences')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.profile.main} component={AdminSettings} />
          <Route path={ROUTES.admin.users.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.users" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/users')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.permissions.main}>
            <Suspense fallback={<LoadingPage messageKey="loading.permissions" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/permissions')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.roles.list}>
            <Suspense fallback={<LoadingPage messageKey="loading.roles" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/roles/index')))}
            </Suspense>
          </Route>
          <Route path={ROUTES.admin.profile.settings}>
            <Suspense fallback={<LoadingPage messageKey="loading.profile" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/settings/profile')))}
            </Suspense>
          </Route>

          {/* Sistema (Legacy) */}
          <Route path={ROUTES.admin.analytics.main} component={AdminAnalytics} />
          <Route path={ROUTES.admin.documents.list} component={AdminDocuments} />
          <Route path={ROUTES.admin.comments.list} component={AdminComments} />
          <Route path={ROUTES.admin.users.pending}>
            <Suspense fallback={<LoadingPage messageKey="loading.pendingUsers" />}>
              <PendingUsersPage />
            </Suspense>
          </Route>

          {/* ========================================== */}
          {/* MÓDULOS ADMINISTRATIVOS - POR MIGRAR       */}
          {/* ========================================== */}

          {/* Rutas Legacy y redirects */}

          <Route path="/admin/amenities-import">
            <Suspense fallback={<LoadingPage messageKey="loading.amenityImport" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/amenities-import')))}
            </Suspense>
          </Route>
          <Route path="/admin/amenities-dashboard">
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardAmenities" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/amenities-dashboard')))}
            </Suspense>
          </Route>

          {/* Legacy redirects - Rutas de instructores redirigen a la nueva ubicación */}
          <Route path="/admin/instructors/applications">
            {() => { setLocation('/admin/activities/instructors/applications'); return null; }}
          </Route>
          <Route path="/admin/instructors/invitations">
            {() => { setLocation('/admin/activities/instructors/invitations'); return null; }}
          </Route>
          <Route path="/admin/instructors/evaluations">
            {() => { setLocation('/admin/activities/instructors/evaluations'); return null; }}
          </Route>
          <Route path="/admin/instructors/cards">
            {() => { setLocation('/admin/activities/instructors/cards'); return null; }}
          </Route>
          <Route path="/admin/instructors/detail/:id">
            {({ id }: { id: string }) => { setLocation(`/admin/activities/instructors/detail/${id}`); return null; }}
          </Route>
          <Route path="/admin/instructors/edit/:id">
            {({ id }: { id: string }) => { setLocation(`/admin/activities/instructors/edit/${id}`); return null; }}
          </Route>
          <Route path="/admin/instructors/:id">
            {({ id }: { id: string }) => { setLocation(`/admin/activities/instructors/detail/${id}`); return null; }}
          </Route>
          <Route path="/admin/instructors">
            {() => { setLocation('/admin/activities/instructors'); return null; }}
          </Route>

          {/* Ruta para el calendario de actividades */}
          <Route path="/admin/activities/calendar">
            <Suspense fallback={<LoadingPage messageKey="loading.activityCalendar" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/activities/calendar')))}
            </Suspense>
          </Route>

          {/* Rutas para eventos generales */}
          <Route path="/admin/events" component={EventsIndex} />
          <Route path="/admin/events/new" component={NewEventPage} />
          <Route path="/admin/events/edit/:id" component={EditEventPage} />
          <Route path="/admin/events/categories" component={EventCategoriesPage} />
          <Route path="/admin/events/registrations" component={EventRegistrationsPage} />
          <Route path="/admin/events/list">
            <Suspense fallback={<LoadingPage messageKey="loading.events" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/events/EventsList')))}
            </Suspense>
          </Route>

          {/* Rutas de sistema */}
          <Route path="/admin/system/email-settings">
            <Suspense fallback={<LoadingPage messageKey="loading.emailSettings" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/system/email-settings')))}
            </Suspense>
          </Route>
          <Route path="/admin/system/backup">
            <Suspense fallback={<LoadingPage messageKey="loading.backups" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/system/backup')))}
            </Suspense>
          </Route>
          <Route path="/admin/system/performance">
            <Suspense fallback={<LoadingPage messageKey="loading.performance" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/system/performance')))}
            </Suspense>
          </Route>

          {/* Rutas de comunicaciones legacy */}
          <Route path="/admin/communications">
            <Suspense fallback={<LoadingPage messageKey="loading.dashboardCommunications" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/communications')))}
            </Suspense>
          </Route>
          <Route path="/admin/communications/templates">
            <Suspense fallback={<LoadingPage messageKey="loading.templates" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/communications/templates')))}
            </Suspense>
          </Route>
          <Route path="/admin/communications/queue">
            <Suspense fallback={<LoadingPage messageKey="loading.emailQueue" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/communications/queue')))}
            </Suspense>
          </Route>
          <Route path="/admin/communications/campaigns">
            <Suspense fallback={<LoadingPage messageKey="loading.campaigns" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/communications/campaigns')))}
            </Suspense>
          </Route>
          <Route path="/admin/communications/bulk">
            <Suspense fallback={<LoadingPage messageKey="loading.bulk" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/communications/bulk')))}
            </Suspense>
          </Route>
          <Route path="/admin/communications/analytics">
            <Suspense fallback={<LoadingPage messageKey="loading.analytics" />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/communications/analytics')))}
            </Suspense>
          </Route>

          {/* Rutas para el módulo de contabilidad legacy */}
          <Route path="/admin/accounting/dashboard">
            <Suspense fallback={<LoadingPage messageKey="loading.dashboard de contabilidad..." />}>
              {React.createElement(React.lazy(() => import('@/pages/accounting/dashboard')))}
            </Suspense>
          </Route>
          <Route path="/admin/accounting/categories">
            <Suspense fallback={<LoadingPage messageKey="loading.categorías contables..." />}>
              {React.createElement(React.lazy(() => import('@/pages/accounting/categories')))}
            </Suspense>
          </Route>
          <Route path="/admin/accounting/transactions">
            <Suspense fallback={<LoadingPage messageKey="loading.transacciones..." />}>
              {React.createElement(React.lazy(() => import('@/pages/accounting/transactions')))}
            </Suspense>
          </Route>

          {/* Rutas de activos legacy */}
          <Route path="/admin/assets/dashboard">
            <Suspense fallback={<LoadingPage messageKey="loading.dashboard de activos..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/dashboard-fixed')))}
            </Suspense>
          </Route>
          <Route path="/admin/assets/new">
            <Suspense fallback={<LoadingPage messageKey="loading.formulario de nuevo activo..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/new')))}
            </Suspense>
          </Route>
          <Route path="/admin/assets/categories">
            <Suspense fallback={<LoadingPage messageKey="loading.categorías de activos..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/categories/index')))}
            </Suspense>
          </Route>
          <Route path="/admin/assets/inventory">
            <Suspense fallback={<LoadingPage messageKey="loading.inventario de activos..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/inventory/index')))}
            </Suspense>
          </Route>
          <Route path="/admin/assets/map">
            <Suspense fallback={<LoadingPage messageKey="loading.mapa de activos..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/map')))}
            </Suspense>
          </Route>
          <Route path="/admin/assets/maintenance/calendar">
            <Suspense fallback={<LoadingPage messageKey="loading.calendario de mantenimiento..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/maintenance-calendar-simple')))}
            </Suspense>
          </Route>
          <Route path="/admin/assets/maintenance/schedule/:id">
            <Suspense fallback={<LoadingPage messageKey="loading.formulario de mantenimiento..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/schedule-maintenance')))}
            </Suspense>
          </Route>
          <Route path="/admin/assets/maintenance">
            <Suspense fallback={<LoadingPage messageKey="loading.gestión de mantenimientos..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/maintenance/index')))}
            </Suspense>
          </Route>
          <Route path="/admin/assets/assignments">
            <Suspense fallback={<LoadingPage messageKey="loading.gestión de asignaciones..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/assignments/index')))}
            </Suspense>
          </Route>
          <Route path="/admin/assets/assign-manager">
            <Suspense fallback={<LoadingPage messageKey="loading.asignación de responsable..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/assign-manager')))}
            </Suspense>
          </Route>
          <Route path="/admin/assets/report-issue">
            <Suspense fallback={<LoadingPage messageKey="loading.reporte de problema..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/assets/report-issue')))}
            </Suspense>
          </Route>

          {/* Rutas de incidencias legacy */}
          <Route path="/admin/analytics" component={AdminAnalytics} />
          <Route path="/admin/documents" component={AdminDocuments} />
          <Route path="/admin/comments" component={AdminComments} />
          <Route path="/admin/incidents">
            {() => { setLocation('/admin/incidents/nueva'); return null; }}
          </Route>
          <Route path="/admin/incidents/nueva">
            <Suspense fallback={<LoadingPage messageKey="loading.incidencias..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/incidents/incidents-nueva')))}
            </Suspense>
          </Route>
          <Route path="/admin/incidents/new">
            <Suspense fallback={<LoadingPage messageKey="loading.formulario de nueva incidencia..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/incidents/new')))}
            </Suspense>
          </Route>
          <Route path="/admin/incidents/dashboard">
            <Suspense fallback={<LoadingPage messageKey="loading.dashboard de incidencias..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/incidents/dashboard')))}
            </Suspense>
          </Route>
          <Route path="/admin/incidents/categories">
            <Suspense fallback={<LoadingPage messageKey="loading.categorías de incidencias..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/incidents/categories')))}
            </Suspense>
          </Route>
          <Route path="/admin/incidents/:id">
            <Suspense fallback={<LoadingPage messageKey="loading.detalles de incidencia..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/incidents/DetailedIncidentPage')))}
            </Suspense>
          </Route>
          <Route path="/admin/incidentes-dashboard">
            <Suspense fallback={<LoadingPage messageKey="loading.página de acceso al dashboard..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/incidentes-dashboard')))}
            </Suspense>
          </Route>
          <Route path="/admin/dashboard-incidencias">
            <Suspense fallback={<LoadingPage messageKey="loading.acceso al dashboard..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/dashboard-incidencias')))}
            </Suspense>
          </Route>

          {/* Rutas de usuarios legacy */}
          <Route path="/admin/users">
            <Suspense fallback={<LoadingPage messageKey="loading.gestión de usuarios..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/users')))}
            </Suspense>
          </Route>

          {/* Rutas de Configuración y Seguridad legacy */}
          <Route path="/admin/configuracion-seguridad">
            <Suspense fallback={<LoadingPage messageKey="loading.configuración y seguridad..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad')))}
            </Suspense>
          </Route>
          <Route path="/admin/configuracion-seguridad/access/roles">
            <Suspense fallback={<LoadingPage messageKey="loading.gestión de roles..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/roles/index')))}
            </Suspense>
          </Route>
          <Route path="/admin/configuracion-seguridad/access/permissions">
            <Suspense fallback={<LoadingPage messageKey="loading.matriz de permisos..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/permissions/matrix')))}
            </Suspense>
          </Route>
          <Route path="/admin/configuracion-seguridad/policies">
            <Suspense fallback={<LoadingPage messageKey="loading.políticas..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad/Politicas')))}
            </Suspense>
          </Route>
          <Route path="/admin/configuracion-seguridad/notifications">
            <Suspense fallback={<LoadingPage messageKey="loading.notificaciones administrativas..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad/NotificacionesAdmin')))}
            </Suspense>
          </Route>
          <Route path="/admin/configuracion-seguridad/audit">
            <Suspense fallback={<LoadingPage messageKey="loading.auditoría..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad/Auditoria')))}
            </Suspense>
          </Route>
          <Route path="/admin/configuracion-seguridad/maintenance">
            <Suspense fallback={<LoadingPage messageKey="loading.mantenimiento..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad/Mantenimiento')))}
            </Suspense>
          </Route>
          <Route path="/admin/configuracion-seguridad/exports">
            <Suspense fallback={<LoadingPage messageKey="loading.configuración de exportaciones..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad/ExportacionesConfig')))}
            </Suspense>
          </Route>
          <Route path="/admin/configuracion-seguridad/maintenance/backup">
            <Suspense fallback={<LoadingPage messageKey="loading.respaldos..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/system/backup')))}
            </Suspense>
          </Route>
          <Route path="/admin/configuracion-seguridad/maintenance/performance">
            <Suspense fallback={<LoadingPage messageKey="loading.rendimiento..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/system/performance')))}
            </Suspense>
          </Route>
          <Route path="/admin/configuracion-seguridad/maintenance/updates">
            <Suspense fallback={<LoadingPage messageKey="loading.actualizaciones..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/system/updates')))}
            </Suspense>
          </Route>
          <Route path="/admin/permissions/dashboard">
            <Suspense fallback={<LoadingPage messageKey="loading.dashboard de permisos..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/permissions/dashboard')))}
            </Suspense>
          </Route>
          <Route path="/admin/permissions/matrix">
            <Suspense fallback={<LoadingPage messageKey="loading.matriz de permisos..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/permissions/matrix')))}
            </Suspense>
          </Route>
          <Route path="/admin/configuracion-seguridad/audit/role-audits">
            <Suspense fallback={<LoadingPage messageKey="loading.auditoría de roles..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad/audit/role-audits')))}
            </Suspense>
          </Route>

          {/* Rutas obsoletas */}
          <Route path="/admin/parks/visitor-dashboard">
            <Suspense fallback={<LoadingPage messageKey="loading.dashboard de visitantes..." />}>
              {React.createElement(React.lazy(() => import('@/pages/admin/parks/visitor-dashboard')))}
            </Suspense>
          </Route>

          {/* Help pages */}
          <Route path="/help/parques-manual">
            <Suspense fallback={<LoadingPage messageKey="loading.manual de parques..." />}>
              {React.createElement(React.lazy(() => import('@/pages/ParkPage')))}
            </Suspense>
          </Route>
          <Route path="/help/actividades-manual">
            <Suspense fallback={<LoadingPage messageKey="loading.manual de actividades..." />}>
              {React.createElement(React.lazy(() => import('@/pages/help/ActividadesManual')))}
            </Suspense>
          </Route>

          {/* 404 - Not Found */}
          <Route component={NotFound} />

        </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileCompletionProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ProfileCompletionProvider>
    </QueryClientProvider>
  );
}

export default App;