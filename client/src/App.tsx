import React, { Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProfileCompletionProvider } from "@/components/ProfileCompletionContext";
import "./i18n";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Parks from "@/pages/parks";
import ParkDetail from "@/pages/park-detail";
import AdminDashboard from "@/pages/admin";
import AdminParks from "@/pages/admin/parks";
import AdminParkEdit from "@/pages/admin/park-edit";
import AdminParkView from "@/pages/admin/park-view";
import AdminParksImport from "@/pages/admin/parks-import";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminDocuments from "@/pages/admin/documents";
import AdminComments from "@/pages/admin/comments";
import AdminIncidents from "@/pages/admin/incidents";
import AdminUsers from "@/pages/admin/users";
import AdminActivities from "@/pages/admin/activities";
import AdminAmenities from "@/pages/admin/amenities";
import AdminSettings from "@/pages/admin/settings";
import AdminPayments from "@/pages/admin/payments";
import AdminLogin from "@/pages/admin/login";
import PendingUsersPage from "@/pages/admin/pending-users";
import AdminInstructorInvitations from "@/pages/admin/instructor-invitations";
import InstructorRegistration from "@/pages/public/instructor-registration";
import AccessUsersPage from "@/pages/admin/configuracion-seguridad/access/users";
import ActivityDetailPage from "@/pages/activity-detail";
import TestAccess from "@/pages/test-access";
import AdminVolunteers from "@/pages/admin/volunteers";
import Landing from "@/pages/Landing";
import ParksModuleShowcase from "@/pages/ParksModuleShowcase";
// El import de AdminVolunteerNew ha sido eliminado
import AdminVolunteerParticipations from "@/pages/admin/volunteers/participations";
import AdminParticipationEdit from "@/pages/admin/volunteers/participations/edit";

import DashboardPage from "@/pages/admin/volunteers/dashboard-page";
import EventCategoriesPage from "@/pages/admin/events/categories";
import NewEventPageFixed from "@/pages/admin/events/new-fixed";
import EventsIndex from "@/pages/admin/events/index";
import EditEventPage from "@/pages/admin/events/edit";
import EventRegistrationsPage from "@/pages/admin/events/registrations";
import Header from "@/components/Header";
import ParkEvaluationForm from "@/pages/ParkEvaluationForm";
import EvaluacionesParques from "@/pages/admin/evaluaciones/parques";

function Router() {
  const [location, setLocation] = useLocation();
  const isVentasRoute = location === '/ventas' || location === '/landing' || location === '/sales';
  const isAdminRoute = location.startsWith('/admin');
  
  return (
    <div className="flex flex-col min-h-screen">
      {!isVentasRoute && !isAdminRoute && <Header />}
      <div className={!isVentasRoute && !isAdminRoute ? "pt-20" : ""}>
        <Switch>
        <Route path="/" component={Home} />
        <Route path="/home" component={Home} />
        <Route path="/ventas" component={Landing} />
        <Route path="/landing" component={Landing} />
        <Route path="/sales">
          <Suspense fallback={<div className="p-8 text-center">Cargando página de ventas...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/sales-basic')))}
          </Suspense>
        </Route>
        <Route path="/sales/municipal">
          <Suspense fallback={<div className="p-8 text-center">Cargando página de ParkSys Municipal...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/sales-municipal')))}
          </Suspense>
        </Route>
        <Route path="/sales/network">
          <Suspense fallback={<div className="p-8 text-center">Cargando página de ParkSys Network...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/sales-network')))}
          </Suspense>
        </Route>
        <Route path="/sales/pro">
          <Suspense fallback={<div className="p-8 text-center">Cargando página de ParkSys Pro...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/sales-pro')))}
          </Suspense>
        </Route>
        <Route path="/parks-module" component={ParksModuleShowcase} />
        <Route path="/parks" component={Parks} />
        <Route path="/parks/:id" component={ParkDetail} />
        <Route path="/parque/:slug">
          <Suspense fallback={<div className="p-8 text-center">Cargando parque...</div>}>
            {React.createElement(React.lazy(() => import('./pages/ParkLandingPage')))}
          </Suspense>
        </Route>
        <Route path="/instructors">
          <Suspense fallback={<div className="p-8 text-center">Cargando instructores...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/instructors')))}
          </Suspense>
        </Route>
        <Route path="/instructor/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando perfil del instructor...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/PublicInstructorProfile')))}
          </Suspense>
        </Route>
        <Route path="/activities">
          <Suspense fallback={<div className="p-8 text-center">Cargando actividades...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/activities')))}
          </Suspense>
        </Route>
        <Route path="/reservations">
          <Suspense fallback={<div className="p-8 text-center">Cargando espacios...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/reservations')))}
          </Suspense>
        </Route>
        <Route path="/events">
          <Suspense fallback={<div className="p-8 text-center">Cargando eventos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/Events')))}
          </Suspense>
        </Route>
        <Route path="/event/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando evento...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/event-detail')))}
          </Suspense>
        </Route>
        <Route path="/activity/:id" component={ActivityDetailPage} />
        <Route path="/activity/:id/payment">
          <Suspense fallback={<div className="p-8 text-center">Cargando página de pago...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/activity-payment')))}
          </Suspense>
        </Route>
        <Route path="/space/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando detalle del espacio...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/space-detail')))}
          </Suspense>
        </Route>
        <Route path="/calendar">
          <Suspense fallback={<div className="p-8 text-center">Cargando calendario...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/calendar')))}
          </Suspense>
        </Route>
        <Route path="/concessions">
          <Suspense fallback={<div className="p-8 text-center">Cargando concesiones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/ConcessionsList')))}
          </Suspense>
        </Route>
        <Route path="/concession/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando detalle de concesión...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/ConcessionDetail')))}
          </Suspense>
        </Route>
        <Route path="/volunteers">
          <Suspense fallback={<div className="p-8 text-center">Cargando voluntarios...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/VolunteersList')))}
          </Suspense>
        </Route>
        <Route path="/volunteers/register">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de registro...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/VolunteerRegistration')))}
          </Suspense>
        </Route>
        <Route path="/instructors/register" component={InstructorRegistration} />
        <Route path="/tree-species">
          <Suspense fallback={<div className="p-8 text-center">Cargando especies arbóreas...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/TreeSpecies')))}
          </Suspense>
        </Route>
        <Route path="/tree-species/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando detalle de especie...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/TreeSpeciesDetail')))}
          </Suspense>
        </Route>
        <Route path="/fauna">
          <Suspense fallback={<div className="p-8 text-center">Cargando fauna...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/Fauna')))}
          </Suspense>
        </Route>
        <Route path="/fauna/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando detalle de especie...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/FaunaDetail')))}
          </Suspense>
        </Route>
        <Route path="/parque/:slug/evaluar" component={ParkEvaluationForm} />
        <Route path="/parque/:parkSlug/evaluaciones">
          <Suspense fallback={<div className="p-8 text-center">Cargando evaluaciones del parque...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/ParkEvaluations')))}
          </Suspense>
        </Route>

        {/* Ruta de login principal */}
        <Route path="/login" component={AdminLogin} />
        
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/parks" component={AdminParks} />
        <Route path="/admin/payments" component={AdminPayments} />
        <Route path="/admin/parks/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de parques...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/parks-dashboard')))}
          </Suspense>
        </Route>
        <Route path="/admin/parks/visitor-dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de visitantes...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/parks/visitor-dashboard')))}
          </Suspense>
        </Route>
        {/* Rutas del módulo de visitantes - nuevas rutas */}
        <Route path="/admin/visitors">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de visitantes...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/parks/visitor-dashboard')))}
          </Suspense>
        </Route>
        <Route path="/admin/visitors/count">
          <Suspense fallback={<div className="p-8 text-center">Cargando sistema de conteo de visitantes...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/parks/visitor-count')))}
          </Suspense>
        </Route>
        <Route path="/admin/visitors/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard integral de visitantes...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/visitors/dashboard-simple')))}
          </Suspense>
        </Route>


        <Route path="/admin/visitors/feedback">
          <Suspense fallback={<div className="p-8 text-center">Cargando retroalimentación de usuarios...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/visitors/feedback')))}
          </Suspense>
        </Route>
        
        {/* MÓDULO DE EVALUACIONES */}
        <Route path="/admin/evaluaciones">
          <Suspense fallback={<div className="p-8 text-center">Cargando sistema de evaluaciones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones')))}
          </Suspense>
        </Route>
        <Route path="/admin/evaluaciones/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de evaluaciones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones/dashboard')))}
          </Suspense>
        </Route>
        <Route path="/admin/evaluaciones/parques" component={EvaluacionesParques} />
        <Route path="/admin/evaluaciones/instructores">
          <Suspense fallback={<div className="p-8 text-center">Cargando evaluaciones de instructores...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones/instructores')))}
          </Suspense>
        </Route>
        <Route path="/admin/evaluaciones/voluntarios">
          <Suspense fallback={<div className="p-8 text-center">Cargando evaluaciones de voluntarios...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones/voluntarios')))}
          </Suspense>
        </Route>
        <Route path="/admin/evaluaciones/actividades">
          <Suspense fallback={<div className="p-8 text-center">Cargando evaluaciones de actividades...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones/actividades')))}
          </Suspense>
        </Route>
        <Route path="/admin/evaluaciones/concesionarios">
          <Suspense fallback={<div className="p-8 text-center">Cargando evaluaciones de concesionarios...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones/concesionarios')))}
          </Suspense>
        </Route>
        <Route path="/admin/evaluaciones/eventos">
          <Suspense fallback={<div className="p-8 text-center">Cargando evaluaciones de eventos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones/eventos')))}
          </Suspense>
        </Route>
        <Route path="/admin/evaluaciones/criterios">
          <Suspense fallback={<div className="p-8 text-center">Cargando criterios de evaluación...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/evaluaciones/criterios')))}
          </Suspense>
        </Route>
        
        {/* Ruta del módulo de Configuración y Seguridad */}
        <Route path="/admin/configuracion-seguridad">
          <Suspense fallback={<div className="p-8 text-center">Cargando configuración y seguridad...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad')))}
          </Suspense>
        </Route>

        <Route path="/admin/parks-import" component={AdminParksImport} />
        <Route path="/admin/parks/new" component={AdminParkEdit} />
        <Route path="/admin/parks/:id" component={AdminParkEdit} />
        <Route path="/admin/parks/:id/edit" component={AdminParkEdit} />
        <Route path="/admin/parks/:id/view" component={AdminParkView} />
        <Route path="/admin/parks/:id/manage">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión del parque...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/park-manage')))}
          </Suspense>
        </Route>
        <Route path="/admin/parks/:id/amenities">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de amenidades...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/parks/amenities')))}
          </Suspense>
        </Route>
        <Route path="/admin/activities/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de actividades...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/organizador/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/organizador/nueva-actividad">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de actividad...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/organizador/nueva-actividad')))}
          </Suspense>
        </Route>
        <Route path="/admin/organizador/categorias">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de categorías...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/organizador/categorias')))}
          </Suspense>
        </Route>
        <Route path="/admin/organizador/catalogo/crear">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de nueva actividad...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/organizador/catalogo/crear')))}
          </Suspense>
        </Route>

        <Route path="/admin/organizador/catalogo/editar/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando editor de actividad...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/organizador/catalogo/editar')))}
          </Suspense>
        </Route>
        <Route path="/admin/organizador/catalogo/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando detalles de actividad...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/organizador/catalogo/detalle')))}
          </Suspense>
        </Route>
        <Route path="/admin/activities" component={() => {
          setLocation('/admin/activities/management');
          return null;
        }} />
        <Route path="/admin/activities/management" component={AdminActivities} />

        <Route path="/admin/activities/categories">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de categorías...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/activities/categories')))}
          </Suspense>
        </Route>
        <Route path="/admin/activities/calendar">
          <Suspense fallback={<div className="p-8 text-center">Cargando calendario...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/activities/calendar')))}
          </Suspense>
        </Route>
        <Route path="/admin/activities/instructors">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de instructores...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/activities/instructors')))}
          </Suspense>
        </Route>
        <Route path="/admin/activities/instructors/new">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de nuevo instructor...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/activities/instructors/new')))}
          </Suspense>
        </Route>
        <Route path="/admin/activities/instructors/detail/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando detalles del instructor...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/activities/instructors/detail')))}
          </Suspense>
        </Route>
        <Route path="/admin/activities/instructors/edit/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando edición del instructor...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/activities/instructors/edit')))}
          </Suspense>
        </Route>
        <Route path="/admin/activities/:id/images">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de imágenes...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/activities/activity-images')))}
          </Suspense>
        </Route>
        <Route path="/admin/activities/registrations">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de inscripciones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/activities/registrations')))}
          </Suspense>
        </Route>
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/documents" component={AdminDocuments} />
        <Route path="/admin/comments" component={AdminComments} />
        <Route path="/admin/incidents" component={AdminIncidents} />
        <Route path="/admin/incidents/new">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de nueva incidencia...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/incidents/new')))}
          </Suspense>
        </Route>
        <Route path="/admin/incidents/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de incidencias...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/incidents/dashboard')))}
          </Suspense>
        </Route>
        <Route path="/admin/incidents/categories">
          <Suspense fallback={<div className="p-8 text-center">Cargando categorías de incidencias...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/incidents/categories')))}
          </Suspense>
        </Route>
        <Route path="/admin/incidents/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando detalles de incidencia...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/incidents/DetailedIncidentPage')))}
          </Suspense>
        </Route>
        {/* Página de acceso directo al dashboard */}
        <Route path="/admin/incidentes-dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando página de acceso al dashboard...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/incidentes-dashboard')))}
          </Suspense>
        </Route>
        
        {/* Nueva página dedicada para acceso al dashboard de incidencias */}
        <Route path="/admin/dashboard-incidencias">
          <Suspense fallback={<div className="p-8 text-center">Cargando acceso al dashboard...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/dashboard-incidencias')))}
          </Suspense>
        </Route>
        <Route path="/admin/users">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de usuarios...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/users')))}
          </Suspense>
        </Route>
        <Route path="/admin/pending-users">
          <Suspense fallback={<div className="p-8 text-center">Cargando usuarios pendientes...</div>}>
            <PendingUsersPage />
          </Suspense>
        </Route>

        {/* Rutas para concesionarios movidas al módulo de Concesiones */}
        <Route path="/admin/amenities" component={AdminAmenities} />
        <Route path="/admin/amenities-import">
          <Suspense fallback={<div className="p-8 text-center">Cargando importación de amenidades...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/amenities-import')))}
          </Suspense>
        </Route>
        <Route path="/admin/amenities-dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de amenidades...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/amenities-dashboard')))}
          </Suspense>
        </Route>
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/permissions">
          <Suspense fallback={<div className="p-8 text-center">Cargando permisos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/permissions')))}
          </Suspense>
        </Route>
        <Route path="/admin/settings/profile">
          <Suspense fallback={<div className="p-8 text-center">Cargando perfil...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/settings/profile')))}
          </Suspense>
        </Route>
        <Route path="/admin/users/notifications">
          <Suspense fallback={<div className="p-8 text-center">Cargando preferencias de notificaciones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/settings/NotificationPreferences')))}
          </Suspense>
        </Route>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/test-access" component={TestAccess} />
        <Route path="/admin/permissions">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de permisos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/permissions')))}
          </Suspense>
        </Route>
        <Route path="/admin/volunteers">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de voluntarios...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/volunteers/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/volunteers/participations" component={AdminVolunteerParticipations} />
        <Route path="/admin/volunteers/participations/:id" component={AdminParticipationEdit} />

        <Route path="/admin/volunteers/recognition">
          <Suspense fallback={<div className="p-8 text-center">Cargando reconocimientos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/volunteers/recognition')))}
          </Suspense>
        </Route>
        <Route path="/admin/volunteers/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de voluntariado...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/volunteers/dashboard/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/volunteers/settings">
          <Suspense fallback={<div className="p-8 text-center">Cargando configuración de voluntariado...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/volunteers/settings/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/volunteers/register">
          <Suspense fallback={<div className="p-8 text-center">Cargando registro de voluntarios...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/volunteers/register')))}
          </Suspense>
        </Route>
        <Route path="/admin/volunteers/edit/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando edición de voluntario...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/volunteers/edit')))}
          </Suspense>
        </Route>
        
        {/* La ruta de registro y edición de voluntarios ha sido eliminada del módulo de Voluntarios
             ya que ahora se gestiona desde el módulo de Usuarios */}
        
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
        



        {/* Rutas para el módulo de eventos AMBU */}
        <Route path="/admin/eventos-ambu">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de eventos AMBU...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/eventos-ambu/index')))}
          </Suspense>
        </Route>

        <Route path="/admin/eventos-ambu/calendar">
          <Suspense fallback={<div className="p-8 text-center">Cargando calendario de eventos AMBU...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/eventos-ambu/calendar')))}
          </Suspense>
        </Route>
        <Route path="/admin/eventos-ambu/calendario">
          <Suspense fallback={<div className="p-8 text-center">Cargando calendario de eventos AMBU...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/eventos-ambu/calendar')))}
          </Suspense>
        </Route>
        <Route path="/admin/eventos-ambu/tabulador">
          <Suspense fallback={<div className="p-8 text-center">Cargando tabulador de costos AMBU...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/eventos-ambu/tabulador')))}
          </Suspense>
        </Route>
        <Route path="/admin/eventos-ambu/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando detalles del evento AMBU...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/eventos-ambu/detail')))}
          </Suspense>
        </Route>
        <Route path="/admin/eventos-ambu/:id/edit">
          <Suspense fallback={<div className="p-8 text-center">Cargando editor de evento AMBU...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/eventos-ambu/edit')))}
          </Suspense>
        </Route>
        
        {/* Ruta para el calendario de actividades */}
        <Route path="/admin/activities/calendar">
          <Suspense fallback={<div className="p-8 text-center">Cargando calendario de actividades...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/activities/calendar')))}
          </Suspense>
        </Route>
        
        {/* Rutas para eventos generales */}
        <Route path="/admin/events" component={EventsIndex} />
        
        <Route path="/admin/events/new" component={NewEventPageFixed} />
        
        <Route path="/admin/events/edit/:id" component={EditEventPage} />

        <Route path="/admin/events/categories" component={EventCategoriesPage} />

        <Route path="/admin/events/registrations" component={EventRegistrationsPage} />

        <Route path="/admin/events/list">
          <Suspense fallback={<div className="p-8 text-center">Cargando listado de eventos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/events/EventsList')))}
          </Suspense>
        </Route>

        <Route path="/admin/system/email-settings">
          <Suspense fallback={<div className="p-8 text-center">Cargando configuración de email...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/system/email-settings')))}
          </Suspense>
        </Route>
        <Route path="/admin/system/backup">
          <Suspense fallback={<div className="p-8 text-center">Cargando sistema de respaldos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/system/backup')))}
          </Suspense>
        </Route>
        <Route path="/admin/system/performance">
          <Suspense fallback={<div className="p-8 text-center">Cargando monitor de rendimiento...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/system/performance')))}
          </Suspense>
        </Route>
        <Route path="/admin/system/updates">
          <Suspense fallback={<div className="p-8 text-center">Cargando centro de actualizaciones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/system/updates')))}
          </Suspense>
        </Route>
        <Route path="/admin/communications">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de comunicaciones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/communications')))}
          </Suspense>
        </Route>
        <Route path="/admin/communications/templates">
          <Suspense fallback={<div className="p-8 text-center">Cargando plantillas...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/communications/templates')))}
          </Suspense>
        </Route>
        <Route path="/admin/communications/queue">
          <Suspense fallback={<div className="p-8 text-center">Cargando cola de emails...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/communications/queue')))}
          </Suspense>
        </Route>
        <Route path="/admin/communications/campaigns">
          <Suspense fallback={<div className="p-8 text-center">Cargando campañas...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/communications/campaigns')))}
          </Suspense>
        </Route>
        <Route path="/admin/communications/bulk">
          <Suspense fallback={<div className="p-8 text-center">Cargando envío masivo...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/communications/bulk')))}
          </Suspense>
        </Route>
        <Route path="/admin/communications/analytics">
          <Suspense fallback={<div className="p-8 text-center">Cargando análisis...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/communications/analytics')))}
          </Suspense>
        </Route>

        {/* Rutas para el módulo de seguridad */}
        <Route path="/admin/security">
          <Suspense fallback={<div className="p-8 text-center">Cargando módulo de seguridad...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/security')))}
          </Suspense>
        </Route>

        {/* Rutas para el módulo de contabilidad */}
        <Route path="/admin/accounting/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de contabilidad...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/accounting/dashboard')))}
          </Suspense>
        </Route>
        <Route path="/admin/accounting/categories">
          <Suspense fallback={<div className="p-8 text-center">Cargando categorías contables...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/accounting/categories')))}
          </Suspense>
        </Route>
        <Route path="/admin/accounting/transactions">
          <Suspense fallback={<div className="p-8 text-center">Cargando transacciones contables...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/accounting/transactions')))}
          </Suspense>
        </Route>
        <Route path="/admin/accounting/journal-entries">
          <Suspense fallback={<div className="p-8 text-center">Cargando asientos contables...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/accounting/journal-entries')))}
          </Suspense>
        </Route>
        <Route path="/admin/accounting/trial-balance">
          <Suspense fallback={<div className="p-8 text-center">Cargando balance de comprobación...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/accounting/trial-balance')))}
          </Suspense>
        </Route>
        <Route path="/admin/accounting/financial-statements">
          <Suspense fallback={<div className="p-8 text-center">Cargando estados financieros...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/accounting/financial-statements')))}
          </Suspense>
        </Route>
        <Route path="/admin/accounting/fixed-assets">
          <Suspense fallback={<div className="p-8 text-center">Cargando activos fijos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/accounting/fixed-assets')))}
          </Suspense>
        </Route>
        <Route path="/admin/accounting/integration">
          <Suspense fallback={<div className="p-8 text-center">Cargando integración contable-financiera...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/accounting/integration')))}
          </Suspense>
        </Route>


        {/* Rutas para reset de contraseña */}
        <Route path="/reset-password">
          <Suspense fallback={<div className="p-8 text-center">Cargando página de recuperación...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/auth/ResetPassword')))}
          </Suspense>
        </Route>
        <Route path="/auth/reset-password">
          <Suspense fallback={<div className="p-8 text-center">Cargando página de recuperación...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/auth/ResetPassword')))}
          </Suspense>
        </Route>

        {/* Rutas para el módulo de activos */}
        <Route path="/admin/assets/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de activos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/dashboard-static')))}
          </Suspense>
        </Route>
        <Route path="/admin/assets">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de activos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/dashboard-fixed')))}
          </Suspense>
        </Route>
        <Route path="/admin/assets/new">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de nuevo activo...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/new')))}
          </Suspense>
        </Route>
        <Route path="/admin/assets/categories">
          <Suspense fallback={<div className="p-8 text-center">Cargando categorías de activos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/categories/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/assets/inventory">
          <Suspense fallback={<div className="p-8 text-center">Cargando inventario de activos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/inventory/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/assets/map">
          <Suspense fallback={<div className="p-8 text-center">Cargando mapa de activos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/map')))}
          </Suspense>
        </Route>
        <Route path="/admin/assets/maintenance/calendar">
          <Suspense fallback={<div className="p-8 text-center">Cargando calendario de mantenimiento...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/maintenance-calendar-simple')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/assets/maintenance/schedule/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de mantenimiento...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/schedule-maintenance')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/assets/maintenance">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de mantenimientos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/maintenance/index')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/assets/assignments">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de asignaciones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/assignments/index')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/assets/assign-manager">
          <Suspense fallback={<div className="p-8 text-center">Cargando asignación de responsable...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/assign-manager')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/assets/report-issue">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de reporte...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/report-issue')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/assets/assign-equipment">
          <Suspense fallback={<div className="p-8 text-center">Cargando asignación de equipamiento...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/assign-equipment')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/assets/:id/location">
          <Suspense fallback={<div className="p-8 text-center">Cargando editor de ubicación...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/edit-location')))}
          </Suspense>
        </Route>

        {/* RUTAS RESERVAS DE ESPACIOS */}
        <Route path="/admin/dashboard-reservas">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de reservas...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/dashboard-reservas')))}
          </Suspense>
        </Route>
        <Route path="/admin/space-reservations">
          <Suspense fallback={<div className="p-8 text-center">Cargando reservas de espacios...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/space-reservations/spaces/edit/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando edición de espacio...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/spaces/edit/[id]')))}
          </Suspense>
        </Route>
        <Route path="/admin/space-reservations/spaces/new">
          <Suspense fallback={<div className="p-8 text-center">Cargando nuevo espacio...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/spaces/new')))}
          </Suspense>
        </Route>
        <Route path="/admin/space-reservations/spaces">
          <Suspense fallback={<div className="p-8 text-center">Cargando espacios reservables...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/spaces')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/space-reservations/spaces">
          <Suspense fallback={<div className="p-8 text-center">Cargando espacios disponibles...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/spaces')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/space-reservations/new">
          <Suspense fallback={<div className="p-8 text-center">Cargando nueva reserva...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/new')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/space-reservations/calendar">
          <Suspense fallback={<div className="p-8 text-center">Cargando calendario de reservas...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/calendar')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/space-reservations/spaces/new">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de nuevo espacio...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/spaces/new')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/space-reservations/edit/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando editor de reserva...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/space-reservations/edit')))}
          </Suspense>
        </Route>
        <Route path="/admin/assets/:id/edit">
          <Suspense fallback={<div className="p-8 text-center">Cargando editor de activo...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/edit')))}
          </Suspense>
        </Route>
        <Route path="/admin/assets/:id/edit-simple">
          <Suspense fallback={<div className="p-8 text-center">Cargando editor simple...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/edit-simple')))}
          </Suspense>
        </Route>
        <Route path="/admin/assets/:id/edit-basic">
          <Suspense fallback={<div className="p-8 text-center">Cargando editor básico...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/edit-basic')))}
          </Suspense>
        </Route>
        <Route path="/admin/assets/:id/edit-enhanced">
          <Suspense fallback={<div className="p-8 text-center">Cargando editor mejorado...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/edit-enhanced')))}
          </Suspense>
        </Route>
        <Route path="/admin/assets/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando detalles del activo...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/[id]')))}
          </Suspense>
        </Route>
        
        {/* Rutas para el módulo de árboles */}
        <Route path="/admin/trees/catalog">
          <Suspense fallback={<div className="p-8 text-center">Cargando catálogo de especies arbóreas...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/catalog/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/trees/species">
          <Suspense fallback={<div className="p-8 text-center">Cargando catálogo de especies arbóreas...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/catalog/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/trees/catalog/new">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de nueva especie arbórea...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/catalog/new/simple')))}
          </Suspense>
        </Route>
        <Route path="/admin/trees/catalog/new/simple">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario simplificado de nueva especie arbórea...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/catalog/new/simple')))}
          </Suspense>
        </Route>
        <Route path="/admin/trees/catalog/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando detalles de especie arbórea...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/catalog/[id]/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/trees/catalog/:id/edit">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de edición de especie arbórea...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/catalog/[id]/edit/index')))}
          </Suspense>
        </Route>
        
        {/* Rutas de Fauna */}
        <Route path="/admin/fauna/species">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de fauna...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/fauna/species')))}
          </Suspense>
        </Route>
        <Route path="/admin/trees/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de arbolado...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/dashboard')))}
          </Suspense>
        </Route>
        
        {/* Ruta del Mapa de Árboles */}
        <Route path="/admin/trees/map">
          <Suspense fallback={<div className="p-8 text-center">Cargando mapa de árboles...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/map/fixed-map')))}
          </Suspense>
        </Route>

        {/* Rutas del Inventario de Árboles */}
        <Route path="/admin/trees/inventory">
          <Suspense fallback={<div className="p-8 text-center">Cargando inventario de árboles...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/inventory/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/trees/inventory/new">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de nuevo árbol...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/inventory/new/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/trees/inventory/:id">
          <Suspense fallback={<div className="p-8 text-center">Cargando detalles del árbol...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/inventory/[id]/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/trees/inventory/:id/edit">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de edición del árbol...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/inventory/[id]/edit/index')))}
          </Suspense>
        </Route>
        
        {/* Ruta para Reportes de Árboles */}
        <Route path="/admin/trees/reports">
          <Suspense fallback={<div className="p-8 text-center">Cargando reportes de árboles...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/reports/index')))}
          </Suspense>
        </Route>

        {/* Rutas para Gestión Técnica de Árboles */}
        <Route path="/admin/trees/technical">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión técnica de árboles...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/technical/index')))}
          </Suspense>
        </Route>

        {/* Rutas para Gestión Ambiental de Árboles */}
        <Route path="/admin/trees/environmental">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión ambiental de árboles...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/environmental/index')))}
          </Suspense>
        </Route>
        
        {/* Ruta para Gestión de Mantenimiento de Árboles - Enhanced Version */}
        <Route path="/admin/trees/maintenance">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de mantenimiento de árboles...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/maintenance/simple')))}
          </Suspense>
        </Route>
        
        {/* Rutas para el Módulo de Concesiones */}
        <Route path="/admin/concessions/catalog">
          <Suspense fallback={<div className="p-8 text-center">Cargando catálogo de concesiones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/concessions/catalog/index')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/concessions/concessionaires">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de concesionarios...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/concessions/concessionaires/index')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/concessions/contracts">
          <Suspense fallback={<div className="p-8 text-center">Cargando contratos de concesiones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/concessions/contracts/index')))}
          </Suspense>
        </Route>

        {/* Nuevas rutas para el módulo extendido de concesiones */}
        <Route path="/admin/concessions/locations">
          <Suspense fallback={<div className="p-8 text-center">Cargando ubicaciones de concesiones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/concessions/locations/index')))}
          </Suspense>
        </Route>

        <Route path="/admin/concessions/payments">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión financiera de concesiones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/concessions/payments/index')))}
          </Suspense>
        </Route>

        <Route path="/admin/concessions/evaluations">
          <Suspense fallback={<div className="p-8 text-center">Cargando evaluaciones de concesiones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/concessions/evaluations/index')))}
          </Suspense>
        </Route>

        <Route path="/admin/concessions/hybrid-payments">
          <Suspense fallback={<div className="p-8 text-center">Cargando sistema de cobro híbrido...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/concessions/hybrid-payments')))}
          </Suspense>
        </Route>

        <Route path="/admin/concessions/active">
          <Suspense fallback={<div className="p-8 text-center">Cargando concesiones activas...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/ActiveConcessionsList')))}
          </Suspense>
        </Route>

        <Route path="/admin/concessions/active/new">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de nueva concesión...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/ActiveConcessionForm')))}
          </Suspense>
        </Route>

        <Route path="/admin/concessions/active/:id/edit">
          <Suspense fallback={<div className="p-8 text-center">Cargando formulario de edición...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/ActiveConcessionForm')))}
          </Suspense>
        </Route>

        <Route path="/admin/concessions/active/:id/images">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de imágenes...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/ConcessionImages')))}
          </Suspense>
        </Route>

        <Route path="/admin/concessions/reports">
          <Suspense fallback={<div className="p-8 text-center">Cargando reportes de concesiones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/concessions/reports/index')))}
          </Suspense>
        </Route>

        {/* Rutas para el módulo financiero reestructurado */}
        <Route path="/admin/finance/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard financiero...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/dashboard')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/finance/incomes">
          <Suspense fallback={<div className="p-8 text-center">Cargando cédula de ingresos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/incomes')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/finance/expenses">
          <Suspense fallback={<div className="p-8 text-center">Cargando cédula de egresos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/expenses')))}
          </Suspense>
        </Route>
        

        
        <Route path="/admin/finance/cash-flow-matrix">
          <Suspense fallback={<div className="p-8 text-center">Cargando matriz de flujo de efectivo...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/cash-flow-matrix')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/finance/budget-planning">
          <Suspense fallback={<div className="p-8 text-center">Cargando planificación presupuestaria...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/budget-planning')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/finance/calculator">
          <Suspense fallback={<div className="p-8 text-center">Cargando calculadora avanzada...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/AdvancedCalculator')))}
          </Suspense>
        </Route>
        

        
        {/* Redirección de compatibilidad para la calculadora avanzada */}
        <Route path="/admin/finance/advanced-calculator">
          <Suspense fallback={<div className="p-8 text-center">Cargando calculadora avanzada...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/AdvancedCalculator')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/finance/reports">
          <Suspense fallback={<div className="p-8 text-center">Cargando reportes ejecutivos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/reports')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/finance/catalog">
          <Suspense fallback={<div className="p-8 text-center">Cargando catálogo...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/catalog')))}
          </Suspense>
        </Route>
        


        {/* Rutas del módulo de Recursos Humanos */}
        <Route path="/admin/hr/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de recursos humanos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/hr/dashboard')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/hr/employees">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de personal...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/hr/employees')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/hr/vacations">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de vacaciones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/hr/vacations')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/hr/training">
          <Suspense fallback={<div className="p-8 text-center">Cargando módulo de capacitación...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/hr/training')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/hr/payroll">
          <Suspense fallback={<div className="p-8 text-center">Cargando módulo de nómina...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/hr/payroll')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/hr/receipts">
          <Suspense fallback={<div className="p-8 text-center">Cargando recibos de nómina...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/hr/receipts')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/hr/vacaciones">
          <Suspense fallback={<div className="p-8 text-center">Cargando módulo de vacaciones y permisos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/hr/vacaciones')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/hr/control-horas">
          <Suspense fallback={<div className="p-8 text-center">Cargando control de horas...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/hr/control-horas')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/hr/wellness">
          <Suspense fallback={<div className="p-8 text-center">Cargando módulo de bienestar...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/hr/wellness')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/hr/analytics">
          <Suspense fallback={<div className="p-8 text-center">Cargando analytics de RH...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/hr/analytics')))}
          </Suspense>
        </Route>


        {/* Ruta de redirección para compatibilidad */}
        <Route path="/admin/finance">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard financiero...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/dashboard')))}
          </Suspense>
        </Route>

        {/* Rutas del Centro de Ayuda */}
        <Route path="/help/visitantes-manual">
          <Suspense fallback={<div className="p-8 text-center">Cargando manual de visitantes...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/help/VisitantesManual')))}
          </Suspense>
        </Route>
        
        <Route path="/help/parques-manual">
          <Suspense fallback={<div className="p-8 text-center">Cargando manual de parques...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/help/ParquesManual')))}
          </Suspense>
        </Route>
        
        <Route path="/help/actividades-manual">
          <Suspense fallback={<div className="p-8 text-center">Cargando manual de actividades...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/help/ActividadesManual')))}
          </Suspense>
        </Route>


        

        {/* NUEVAS RUTAS REESTRUCTURADAS: Configuración y Seguridad */}
        {/* Control de Acceso */}
        <Route path="/admin/configuracion-seguridad/access/roles">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de roles...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/roles/index')))}
          </Suspense>
        </Route>
        <Route path="/admin/configuracion-seguridad/access/permissions">
          <Suspense fallback={<div className="p-8 text-center">Cargando matriz de permisos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/permissions/matrix')))}
          </Suspense>
        </Route>
        {/* RUTA ELIMINADA: /assignments duplicaba funcionalidad de /users */}
        <Route path="/admin/configuracion-seguridad/access/users">
          <AccessUsersPage />
        </Route>

        {/* Políticas */}
        <Route path="/admin/configuracion-seguridad/policies">
          <Suspense fallback={<div className="p-8 text-center">Cargando políticas...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad/Politicas')))}
          </Suspense>
        </Route>

        {/* Notificaciones */}
        <Route path="/admin/configuracion-seguridad/notifications">
          <Suspense fallback={<div className="p-8 text-center">Cargando notificaciones administrativas...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad/NotificacionesAdmin')))}
          </Suspense>
        </Route>

        {/* Auditoría */}
        <Route path="/admin/configuracion-seguridad/audit">
          <Suspense fallback={<div className="p-8 text-center">Cargando auditoría...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad/Auditoria')))}
          </Suspense>
        </Route>

        {/* Mantenimiento */}
        <Route path="/admin/configuracion-seguridad/maintenance">
          <Suspense fallback={<div className="p-8 text-center">Cargando mantenimiento...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad/Mantenimiento')))}
          </Suspense>
        </Route>

        {/* Exportaciones */}
        <Route path="/admin/configuracion-seguridad/exports">
          <Suspense fallback={<div className="p-8 text-center">Cargando configuración de exportaciones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad/ExportacionesConfig')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/configuracion-seguridad/maintenance/backup">
          <Suspense fallback={<div className="p-8 text-center">Cargando respaldos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/system/backup')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/configuracion-seguridad/maintenance/performance">
          <Suspense fallback={<div className="p-8 text-center">Cargando rendimiento...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/system/performance')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/configuracion-seguridad/maintenance/updates">
          <Suspense fallback={<div className="p-8 text-center">Cargando actualizaciones...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/system/updates')))}
          </Suspense>
        </Route>

        {/* COMPATIBILIDAD: Rutas antigas con redirección */}
        <Route path="/admin/permissions/matrix">
          <Suspense fallback={<div className="p-8 text-center">Cargando matriz de permisos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/permissions/matrix')))}
          </Suspense>
        </Route>
        <Route path="/admin/configuracion-seguridad/audit/role-audits">
          <Suspense fallback={<div className="p-8 text-center">Cargando auditoría de roles...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad/audit/role-audits')))}
          </Suspense>
        </Route>

        <Route component={NotFound} />
        </Switch>
      </div>
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