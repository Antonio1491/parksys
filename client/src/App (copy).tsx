import React, { Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProfileCompletionProvider } from "@/components/ProfileCompletionContext";
import "./i18n";
import { ROUTES } from '@/routes';
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Parks from "@/pages/parks";
import AdminDashboard from "@/pages/admin";
import AdminParks from "@/pages/admin/parks";
import AdminParkEdit from "@/pages/admin/park-edit";
import AdminParkView from "@/pages/admin/park-view";
import AdminParksImport from "@/pages/admin/parks-import";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminDocuments from "@/pages/admin/documents";
import AdminComments from "@/pages/admin/comments";
import AdminActivities from "@/pages/admin/activities";
import AdminAmenities from "@/pages/admin/amenities";
import AdminSettings from "@/pages/admin/settings";
import AdminPayments from "@/pages/admin/payments";
import AdminLogin from "@/pages/admin/login";
import PendingUsersPage from "@/pages/admin/pending-users";
import InstructorRegistration from "@/pages/public/instructor-registration";
import AccessUsersPage from "@/pages/admin/configuracion-seguridad/access/users";
import ActivityDetailPage from "@/pages/activity-detail";
import AdminVolunteerParticipations from "@/pages/admin/volunteers/participations";
import AdminParticipationEdit from "@/pages/admin/volunteers/participations/edit";
import EventCategoriesPage from "@/pages/admin/events/categories";
import NewEventPage from "@/pages/admin/events/new";
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
       
        {/* ========================================== */}
        {/* MÓDULOS ADMINISTRATIVOS - POR MIGRAR       */}
        {/* ========================================== */}            
        {/* Ruta del módulo de Configuración y Seguridad */}
     
          <Route path="/admin/configuracion-seguridad">
            <Suspense fallback={<div className="p-8 text-center">Cargando configuración y seguridad...</div>}>
              {React.createElement(React.lazy(() => import('@/pages/admin/configuracion-seguridad')))}
           </Suspense>
          </Route>
       
          <Route path="/admin/analytics" component={AdminAnalytics} />
          <Route path="/admin/documents" component={AdminDocuments} />
          <Route path="/admin/comments" component={AdminComments} />
        
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

        {/* Rutas del módulo de Almacén - Fixed imports */}
        <Route path="/admin/warehouse/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard del almacén...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/warehouse/Dashboard')))}
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
        <Route path="/admin/permissions">
          <Suspense fallback={<div className="p-8 text-center">Cargando gestión de permisos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/permissions')))}
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
        



        {/* Rutas para el módulo de eventos AMBU */}
        <Route path="/admin/eventos-ambu">
          {() => { setLocation('/admin/eventos-ambu/calendar'); return null; }}
        </Route>

        <Route path="/admin/eventos-ambu/calendar">
          <Suspense fallback={<div className="p-8 text-center">Cargando calendario de eventos AMBU...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/eventos-ambu/calendar')))}
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
        
        
        
        
                
        
        

        
        
        
        

        <Route path="/admin/assets/:id/edit-simple">
          <Suspense fallback={<div className="p-8 text-center">Cargando editor simple...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/assets/edit-simple')))}
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
        
        {/* Rutas de Fauna */}
        
        <Route path="/admin/trees/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de arbolado...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/trees/dashboard')))}
          </Suspense>
        </Route>

        {/* Rutas para el módulo financiero reestructurado */}
        <Route path="/admin/finance/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard financiero...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/dashboard')))}
          </Suspense>
        </Route>
        

        

        

        

        

        
        {/* Redirección de compatibilidad - rutas antiguas apuntan a calculadora unificada */}

        
        <Route path="/admin/finance/advanced-calculator">
          <Suspense fallback={<div className="p-8 text-center">Cargando calculadora financiera...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/CalculadoraFinanciera')))}
          </Suspense>
        </Route>
        
        <Route path="/admin/finance/reports">
          <Suspense fallback={<div className="p-8 text-center">Cargando reportes ejecutivos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/reports')))}
          </Suspense>
        </Route>





        
      
        
        <Route path="/admin/finance/calculadora-financiera">
          <Suspense fallback={<div className="p-8 text-center">Cargando calculadora financiera...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/finance/CalculadoraFinanciera')))}
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

        {/* Rutas del módulo Marketing */}
        <Route path={ROUTES.admin.marketing.main}>
          <Suspense fallback={<div className="p-8 text-center">Cargando módulo de marketing...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/marketing')))}
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
        <Route path="/admin/permissions/dashboard">
          <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de permisos...</div>}>
            {React.createElement(React.lazy(() => import('@/pages/admin/permissions/dashboard')))}
          </Suspense>
        </Route>
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

          {/* RUTAS OBSOLETAS */}
          <Route path="/admin/parks/visitor-dashboard">
            <Suspense fallback={<div className="p-8 text-center">Cargando dashboard de visitantes...</div>}>
              {React.createElement(React.lazy(() => import('@/pages/admin/parks/visitor-dashboard')))}
            </Suspense>
          </Route>

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