import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, Home, Users, Settings, Activity, Calendar, MapPin, FileText, Shield, Bell, BarChart3, Package, FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { Link } from 'wouter';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  href: string;
  module: string;
  icon: React.ReactNode;
}

export function SidebarSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Base de datos completa de elementos del sistema
  const allSystemElements = useMemo<SearchResult[]>(() => [
    // Panel de Control
    { id: 'dashboard', title: 'Panel de Control', description: 'Dashboard principal administrativo', href: '/admin', module: 'Dashboard', icon: <Home className="h-4 w-4" /> },
    
    // Configuración
    { id: 'settings', title: 'Configuración', description: 'Configuración del sistema', href: '/admin/settings', module: 'Sistema', icon: <Settings className="h-4 w-4" /> },
    { id: 'users', title: 'Usuarios', description: 'Gestión de usuarios administrativos', href: '/admin/users', module: 'Sistema', icon: <Users className="h-4 w-4" /> },
    { id: 'permissions', title: 'Permisos', description: 'Control de permisos y roles', href: '/admin/permissions', module: 'Sistema', icon: <Shield className="h-4 w-4" /> },
    { id: 'notifications', title: 'Notificaciones', description: 'Sistema de notificaciones', href: '/admin/users/notifications', module: 'Sistema', icon: <Bell className="h-4 w-4" /> },

    // Gestión - Visitantes
    { id: 'visitors-dashboard', title: 'Dashboard Visitantes', description: 'Panel de control de visitantes', href: '/admin/visitors/dashboard', module: 'Visitantes', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'visitor-count', title: 'Conteo de Visitantes', description: 'Registro y conteo de visitantes', href: '/admin/visitors/count', module: 'Visitantes', icon: <Users className="h-4 w-4" /> },


    { id: 'visitor-feedback', title: 'Retroalimentación', description: 'Feedback de visitantes', href: '/admin/visitors/feedback', module: 'Visitantes', icon: <FileText className="h-4 w-4" /> },

    // Gestión - Parques
    { id: 'parks-dashboard', title: 'Dashboard Parques', description: 'Panel de control de parques', href: '/admin/parks/dashboard', module: 'Parques', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'parks-management', title: 'Gestión de Parques', description: 'Administración de parques', href: '/admin/parks', module: 'Parques', icon: <MapPin className="h-4 w-4" /> },
    { id: 'park-evaluations', title: 'Evaluaciones de Parques', description: 'Evaluaciones ciudadanas de parques', href: '/admin/parks/evaluations', module: 'Parques', icon: <FileText className="h-4 w-4" /> },
    { id: 'amenities-dashboard', title: 'Dashboard Amenidades', description: 'Panel de amenidades', href: '/admin/amenities-dashboard', module: 'Parques', icon: <Activity className="h-4 w-4" /> },

    // Gestión - Arbolado
    { id: 'trees-dashboard', title: 'Dashboard Arbolado', description: 'Panel de control de árboles', href: '/admin/trees/dashboard', module: 'Arbolado', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'trees-inventory', title: 'Inventario de Árboles', description: 'Inventario completo de árboles', href: '/admin/trees/inventory', module: 'Arbolado', icon: <Package className="h-4 w-4" /> },
    { id: 'tree-species', title: 'Especies Arbóreas', description: 'Catálogo de especies', href: '/admin/trees/species', module: 'Arbolado', icon: <FileText className="h-4 w-4" /> },
    { id: 'tree-maintenance', title: 'Mantenimiento de Árboles', description: 'Gestión de mantenimiento', href: '/admin/trees/maintenance', module: 'Arbolado', icon: <Settings className="h-4 w-4" /> },

    // Gestión - Actividades
    { id: 'activities-organizer', title: 'Organizador de Actividades', description: 'Panel principal de actividades', href: '/admin/organizador', module: 'Actividades', icon: <Calendar className="h-4 w-4" /> },

    { id: 'activities-calendar', title: 'Calendario de Actividades', description: 'Calendario y programación', href: '/admin/activities/calendar', module: 'Actividades', icon: <Calendar className="h-4 w-4" /> },
    { id: 'activities-categories', title: 'Categorías de Actividades', description: 'Gestión de categorías', href: '/admin/activities/categories', module: 'Actividades', icon: <FileText className="h-4 w-4" /> },

    // Gestión - Eventos
    { id: 'events-categories', title: 'Categorías de Eventos', description: 'Gestión de categorías de eventos', href: '/admin/events/categories', module: 'Eventos', icon: <FileText className="h-4 w-4" /> },
    { id: 'events-listing', title: 'Listado de Eventos', description: 'Listado completo de eventos', href: '/admin/events/list', module: 'Eventos', icon: <Calendar className="h-4 w-4" /> },
    { id: 'events-ambu-calendar', title: 'Calendario AMBU', description: 'Calendario de eventos AMBU', href: '/admin/eventos-ambu/calendar', module: 'Eventos', icon: <Calendar className="h-4 w-4" /> },

    // Gestión - Reservas de Espacios
    { id: 'space-reservations', title: 'Gestión de Espacios', description: 'Administración de espacios', href: '/admin/space-reservations/spaces', module: 'Reservas', icon: <MapPin className="h-4 w-4" /> },
    { id: 'space-reservations-new', title: 'Nueva Reserva', description: 'Crear nueva reserva de espacio', href: '/admin/space-reservations/new', module: 'Reservas', icon: <Calendar className="h-4 w-4" /> },
    { id: 'space-reservations-calendar', title: 'Calendario de Reservas', description: 'Calendario de reservas de espacios', href: '/admin/space-reservations/calendar', module: 'Reservas', icon: <Calendar className="h-4 w-4" /> },

    // O & M - Activos
    { id: 'assets-dashboard', title: 'Dashboard de Activos', description: 'Panel de control de activos', href: '/admin/assets/dashboard', module: 'Activos', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'assets-categories', title: 'Categorías de Activos', description: 'Gestión de categorías', href: '/admin/assets/categories', module: 'Activos', icon: <FileText className="h-4 w-4" /> },
    { id: 'assets-inventory', title: 'Inventario de Activos', description: 'Inventario completo', href: '/admin/assets/inventory', module: 'Activos', icon: <Package className="h-4 w-4" /> },
    { id: 'assets-map', title: 'Mapa de Activos', description: 'Ubicación de activos en mapa', href: '/admin/assets/map', module: 'Activos', icon: <MapPin className="h-4 w-4" /> },
    { id: 'assets-maintenance', title: 'Mantenimiento de Activos', description: 'Gestión de mantenimiento', href: '/admin/assets/maintenance', module: 'Activos', icon: <Settings className="h-4 w-4" /> },

    // O & M - Incidencias
    { id: 'incidents', title: 'Gestión de Incidencias', description: 'Administración de incidencias', href: '/admin/incidents', module: 'Incidencias', icon: <Shield className="h-4 w-4" /> },
    { id: 'incidents-categories', title: 'Categorías de Incidencias', description: 'Gestión de categorías', href: '/admin/incidents/categories', module: 'Incidencias', icon: <FileText className="h-4 w-4" /> },

    // O & M - Voluntarios
    { id: 'volunteers', title: 'Gestión de Voluntarios', description: 'Administración de voluntarios', href: '/admin/volunteers', module: 'Voluntarios', icon: <Users className="h-4 w-4" /> },

    { id: 'volunteers-recognition', title: 'Reconocimientos', description: 'Sistema de reconocimientos', href: '/admin/volunteers/recognition', module: 'Voluntarios', icon: <Shield className="h-4 w-4" /> },

    // Admin & Finanzas
    { id: 'finance', title: 'Dashboard Finanzas', description: 'Panel de control financiero', href: '/admin/finance', module: 'Finanzas', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'accounting-dashboard', title: 'Dashboard Contabilidad', description: 'Panel de contabilidad', href: '/admin/accounting/dashboard', module: 'Contabilidad', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'concessions-reports', title: 'Reportes de Concesiones', description: 'Informes de concesiones', href: '/admin/concessions/reports', module: 'Concesiones', icon: <FileText className="h-4 w-4" /> },

    // Marketing y Comunicación - Dashboard Unificado
    { id: 'communications-dashboard', title: 'Marketing y Comunicación', description: 'Panel unificado de comunicaciones, patrocinios y publicidad digital', href: '/admin/communications', module: 'Marketing y Comunicación', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'communications-templates', title: 'Plantillas de Email', description: 'Plantillas de comunicación', href: '/admin/communications/templates', module: 'Comunicaciones', icon: <FileText className="h-4 w-4" /> },
    { id: 'communications-queue', title: 'Cola de Emails', description: 'Cola de envío de emails', href: '/admin/communications/queue', module: 'Comunicaciones', icon: <Calendar className="h-4 w-4" /> },
    { id: 'communications-campaigns', title: 'Campañas de Email', description: 'Campañas de comunicación', href: '/admin/communications/campaigns', module: 'Comunicaciones', icon: <Calendar className="h-4 w-4" /> },
    { id: 'communications-bulk', title: 'Envío Masivo', description: 'Envío masivo de emails', href: '/admin/communications/bulk', module: 'Comunicaciones', icon: <Users className="h-4 w-4" /> },
    { id: 'communications-analytics', title: 'Análisis de Comunicaciones', description: 'Análisis de rendimiento de comunicaciones', href: '/admin/communications/analytics', module: 'Comunicaciones', icon: <BarChart3 className="h-4 w-4" /> },

    // Recursos Humanos
    { id: 'hr-dashboard', title: 'Dashboard RH', description: 'Panel de control de recursos humanos', href: '/admin/hr/dashboard', module: 'RH', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'hr-employees', title: 'Empleados', description: 'Gestión de personal y empleados', href: '/admin/hr/employees', module: 'RH', icon: <Users className="h-4 w-4" /> },
    { id: 'hr-payroll', title: 'Nómina', description: 'Gestión de nóminas y pagos', href: '/admin/hr/payroll', module: 'RH', icon: <Users className="h-4 w-4" /> },
    { id: 'hr-vacations', title: 'Vacaciones', description: 'Gestión de vacaciones y permisos', href: '/admin/hr/vacations', module: 'RH', icon: <Calendar className="h-4 w-4" /> },

    // Seguridad
    { id: 'security-dashboard', title: 'Dashboard Seguridad', description: 'Panel de control de seguridad', href: '/admin/security', module: 'Seguridad', icon: <Shield className="h-4 w-4" /> },
    { id: 'security-password', title: 'Cambiar Contraseña', description: 'Gestión de contraseñas', href: '/admin/security/password', module: 'Seguridad', icon: <Shield className="h-4 w-4" /> },
    { id: 'security-audit', title: 'Auditoría', description: 'Auditoría de seguridad del sistema', href: '/admin/security/audit', module: 'Seguridad', icon: <Shield className="h-4 w-4" /> },
    { id: 'security-settings', title: 'Configuración de Seguridad', description: 'Configuración de seguridad', href: '/admin/security/settings', module: 'Seguridad', icon: <Settings className="h-4 w-4" /> },

    // Instructores
    { id: 'instructors', title: 'Gestión de Instructores', description: 'Administración de instructores', href: '/admin/activities/instructors', module: 'Instructores', icon: <Users className="h-4 w-4" /> },
  ], []);

  // Filtrar resultados basado en la consulta
  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase().trim();
    return allSystemElements.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm) ||
      item.module.toLowerCase().includes(searchTerm)
    ).slice(0, 8); // Limitar a 8 resultados
  }, [query, allSystemElements]);

  // Cerrar búsqueda cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.sidebar-search-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (href: string) => {
    setLocation(href);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div className="sidebar-search-container relative px-3 mb-4" style={{ marginTop: '20px' }}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar en el sistema..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.trim().length > 0);
          }}
          onFocus={() => setIsOpen(query.trim().length > 0)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 py-2 w-full text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Resultados de búsqueda */}
      {isOpen && filteredResults.length > 0 && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="py-2">
            {filteredResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result.href)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 group"
              >
                <div className="flex-shrink-0 text-gray-500 group-hover:text-primary">
                  {result.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {result.title}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {result.description}
                  </div>
                  <div className="text-xs text-primary font-medium">
                    {result.module}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            ))}
          </div>
          
          {query.trim() && filteredResults.length === 0 && (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              No se encontraron resultados para "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}