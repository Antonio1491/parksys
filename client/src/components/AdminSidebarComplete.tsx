import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { SidebarSearch } from './SidebarSearch';
const parksysLogo = "/parksys-logo-final.png";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Map, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Bell, 
  Users, 
  Settings, 
  LogOut,
  Tag,
  BarChart3,
  BarChart,
  Package,
  Shield,
  User,
  ListFilter,
  Workflow,
  Building,
  CreditCard,
  ClipboardCheck,
  Boxes,
  Box,
  CalendarDays,
  CircleDollarSign,
  MapPin,
  CalendarClock,
  GraduationCap,
  Award,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowRightLeft,
  Calculator,
  Megaphone,
  Handshake,
  Store,
  ListChecks,
  Clipboard,
  BadgeCheck,
  LayoutGrid,
  Flower2,
  FolderOpen,
  FolderTree,
  BookOpen,
  Scissors,
  TreePine,
  HardHat,
  Camera,
  Heart,
  AlertCircle,
  Mail,
  Clock,
  AlertTriangle,
  Database,
  Lock,
  Leaf,
  HeartHandshake,
  HandHeart,
  Star,
  ClipboardList,
  PersonStanding,
  ChevronRight,
  UserCheck,
  Activity,
  Banknote,
  PieChart,
  Receipt,
  Wallet,
  ChevronsUpDown,
  ChevronDown,
  Wrench,
  Archive,
  FileEdit,
  Briefcase,
  UserCog,
  Zap,
  Book,
  Plus,
  Image,
  Scale,
  Monitor,
  Grid,
  History,
  Download,
  Upload,
  Bird,
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  moduleColor?: string;
}

interface ModuleNavProps {
  title: string | React.ReactNode;
  icon: React.ReactNode;
  children: React.ReactNode;
  value: string;
  defaultOpen?: boolean;
}

type CollapsibleSubmenuProps = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  href?: string;
  collapsible?: boolean;
  isExpanded?: boolean;
  onToggle?: (id: string) => void;
  isActive?: boolean;
};

const NavItem: React.FC<NavItemProps> = ({ href, icon, children, active, moduleColor }) => {
  const iconWithClass = React.cloneElement(icon as React.ReactElement, {
    className: cn((icon as React.ReactElement).props.className, 'menu-icon', moduleColor || 'text-[#3DB59F]')
  });

  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          "w-full flex items-center justify-start text-sm font-light h-9 px-2 transition-colors duration-200",
          active
            ? "bg-white text-header-background"
            : "text-[#3DB59F] hover:bg-[#036668] hover:text-[#3DB59F]"
        )}
      >
        {iconWithClass}
        <span className="ml-0">{children}</span>
      </Button>
    </Link>
  );
};

const ModuleNav: React.FC<ModuleNavProps> = ({ 
  title,
  icon,
  children,
  value,
}) => {
  // Define color schemes for each module - adapted for dark background #003D49
  const getModuleColors = (moduleValue: string) => {
    const colorSchemes = {
      'system': {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-[#036668]',
        bgColor: '#61B1A0'
      },
      'gestion': {
        iconColor: 'text-white',
        textColor: 'text-white', 
        hoverBg: 'hover:bg-[#036668]',
        bgColor: '#513C73'
      },
      'operations': {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-[#036668]',
        bgColor: '#B275B0'
      },
      'admin-finance': {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-[#036668]',
        bgColor: '#B3C077'
      },
      'mkt-comm': {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-[#036668]',
        bgColor: '#1E5AA6'
      },
      'hr': {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-[#036668]',
        bgColor: '#198DCE'
      },
      'security': {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-[#036668]',
        bgColor: '#90D3EC'
      },
      'public': {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-[#036668]',
        bgColor: '#1E5AA6'
      }
    };
    
    return colorSchemes[moduleValue as keyof typeof colorSchemes] || {
      iconColor: 'text-white',
      textColor: 'text-white',
      hoverBg: 'hover:bg-[#036668]',
      bgColor: '#90D3EC'
    };
  };

  const colors = getModuleColors(value);
  
  const iconWithClass = React.cloneElement(icon as React.ReactElement, {
    className: cn((icon as React.ReactElement).props.className, 'menu-icon', colors.iconColor)
  });

  return (
    <AccordionItem value={value} className="border-0">
      <AccordionTrigger className={cn("py-2 hover:no-underline [&>svg]:text-white", colors.hoverBg)}>
        <div className={cn("flex items-center text-sm font-normal font-poppins", colors.textColor)}>
          <div className="mr-2 flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: colors.bgColor }}>
            {iconWithClass}
          </div>
          {title}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pl-2 pb-0">
        <div className="flex flex-col gap-1 pt-1">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              if (child.type === NavItem) {
                return React.cloneElement(child, { moduleColor: colors.iconColor } as any);
              }
              // Si es un div, procesar sus hijos recursivamente pero evitar bucles infinitos
              if (child.type === 'div') {
                const processedChildren = React.Children.map(child.props.children, (grandChild) => {
                  if (React.isValidElement(grandChild) && grandChild.type === NavItem) {
                    return React.cloneElement(grandChild, { moduleColor: colors.iconColor } as any);
                  }
                  return grandChild;
                });
                return React.cloneElement(child, { children: processedChildren } as any);
              }
            }
            return child;
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

// Componente para submenús colapsables
export const CollapsibleSubmenu: React.FC<CollapsibleSubmenuProps> = ({
  id,
  title,
  icon,
  children,
  href,
  collapsible = true,
  isExpanded = false,
  onToggle,
  isActive = false,
}) => {
  const handleClick = () => {
    if (collapsible && onToggle) {
      onToggle(id);
    }
  };

  return (
    href ? (
      <Link to={href}>
        <button
          onClick={handleClick}
          className={cn(
            'w-full flex items-center justify-between p-2 text-sm font-light font-poppins rounded-lg transition-colors',
            isActive
              ? 'bg-[#3DB59F] text-white'
              : 'bg-transparent text-white hover:bg-[#036668]'
          )}
        >
          <div className="flex items-center">
            {icon &&
              React.cloneElement(icon as React.ReactElement, {
                className: 'h-4 w-4 text-white',
              })}
            <span className="ml-2">{title}</span>
          </div>
          {collapsible && (
            <ChevronRight
              className={cn(
                'h-4 w-4 text-white transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          )}
        </button>

        {collapsible && isExpanded && (
          <div className="pl-4 ml-2 space-y-1 mt-2">
            {children}
          </div>
        )}
      </Link>
    ) : (
      <div>
        <button
          onClick={handleClick}
          className={cn(
            'w-full flex items-center justify-between p-2 text-sm font-light font-poppins rounded-lg transition-colors',
            isActive
              ? 'bg-[#3DB59F] text-white'
              : 'bg-transparent text-white hover:bg-[#036668]'
          )}
        >
          <div className="flex items-center">
            {icon &&
              React.cloneElement(icon as React.ReactElement, {
                className: 'h-4 w-4 text-white',
              })}
            <span className="ml-2">{title}</span>
          </div>
          {collapsible && (
            <ChevronRight
              className={cn(
                'h-4 w-4 text-white transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          )}
        </button>

        {collapsible && isExpanded && (
          <div className="pl-4 ml-2 space-y-1 mt-2">
            {children}
          </div>
        )}
      </div>
    )
  );
};

const AdminSidebarComplete: React.FC = () => {
  const [location] = useLocation();
  const { } = useAuth();
  const { t } = useTranslation('common');
  
  // Estados para controlar los submenús colapsables dentro de "Gestión"
  const [expandedSubmenus, setExpandedSubmenus] = useState<string[]>([]);
  
  // Estado controlado para los acordeones principales
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  
  // Función para manejar el toggle de submenús dentro de "Gestión"
  const toggleSubmenu = (submenuId: string) => {
    setExpandedSubmenus(prev => 
      prev.includes(submenuId) 
        ? prev.filter(id => id !== submenuId)
        : [...prev, submenuId]
    );
  };

  // Determinar qué submenú debe estar abierto basado en la ruta actual
  const getActiveSubmenu = () => {
    if (location.startsWith('/admin/visitors')) return 'visitantes';
    if (location.startsWith('/admin/parks')) return 'parques';
    if (location.startsWith('/admin/trees')) return 'arbolado';
    if (location.startsWith('/admin/fauna')) return 'fauna';
    if (location.startsWith('/admin/organizador') || location.startsWith('/admin/activities') || location.startsWith('/admin/activities/instructors')) return 'actividades';
    if (location.startsWith('/admin/events') || location.startsWith('/admin/eventos-ambu')) return 'eventos';
    if (location.startsWith('/admin/space-reservations') || location.startsWith('/admin/dashboard-reservas')) return 'reservas';
    if (location.startsWith('/admin/amenities')) return 'amenidades';
    if (location.startsWith('/admin/evaluaciones')) return 'evaluaciones';
    if (location.startsWith('/admin/roles') || location.startsWith('/admin/permissions') || location.startsWith('/admin/role-')) return 'roles-sistema';
    if (location.startsWith('/admin/assets')) return 'activos';
    if (location.startsWith('/admin/incidents')) return 'incidencias';
    if (location.startsWith('/admin/volunteers')) return 'voluntarios';
    if (location.startsWith('/admin/finance')) return 'finanzas';
    if (location.startsWith('/admin/accounting')) return 'contabilidad';
    if (location.startsWith('/admin/concessions')) return 'concesiones';
    if (location.startsWith('/admin/marketing')) return 'marketing';
    if (location.startsWith('/admin/advertising')) return 'advertising';
    if (location.startsWith('/admin/communications')) return 'communications';
    // Rutas del módulo "Configuración y Seguridad"
    if (location.startsWith('/admin/configuracion-seguridad/access/')) return 'control-acceso';
    if (location.startsWith('/admin/configuracion-seguridad/policies')) return 'politicas';
    if (location.startsWith('/admin/configuracion-seguridad/notifications')) return 'notificaciones';
    if (location.startsWith('/admin/configuracion-seguridad/audit')) return 'auditoria';
    if (location.startsWith('/admin/configuracion-seguridad/maintenance')) return 'mantenimiento-sistema';
    if (location.startsWith('/admin/configuracion-seguridad/exports')) return 'mantenimiento-sistema';
    return null;
  };

  // Función helper para determinar si un submenu está activo
  const isSubmenuActive = (submenuId: string) => {
    const routeMap: { [key: string]: string[] } = {
      'actividades': ['/admin/activities', '/admin/organizador'],
      'arbolado': ['/admin/trees'],
      'visitantes': ['/admin/visitors'],
      'eventos': ['/admin/events', '/admin/eventos-ambu'],
      'reservas': ['/admin/space-reservations', '/admin/dashboard-reservas'],
      'activos': ['/admin/assets'],
      'incidencias': ['/admin/incidents'],
      'voluntarios': ['/admin/volunteers'],
      'finanzas': ['/admin/finance'],
      'contabilidad': ['/admin/accounting'],
      'concesiones': ['/admin/concessions'],
      'marketing': ['/admin/marketing'],
      'advertising': ['/admin/advertising'],
      'communications': ['/admin/communications'],
      'control-acceso': ['/admin/configuracion-seguridad/access/'],
      'auditoria': ['/admin/configuracion-seguridad/audit'],
      'mantenimiento-sistema': ['/admin/configuracion-seguridad/maintenance']
    };

    const routes = routeMap[submenuId];
    if (!routes) return false;
    
    return routes.some(route => location.startsWith(route));
  };
  
  // Inicializar submenús expandidos basado en la ruta actual
  useEffect(() => {
    const activeSubmenu = getActiveSubmenu();
    if (activeSubmenu && !expandedSubmenus.includes(activeSubmenu)) {
      setExpandedSubmenus([activeSubmenu]);
    }
  }, [location]);

  // Mantener acordeones abiertos basado en la navegación
  useEffect(() => {
    const activeModules = getActiveModule();
    if (activeModules.length > 0) {
      setOpenAccordions(prev => {
        const newAccordions = Array.from(new Set([...prev, ...activeModules]));
        return newAccordions;
      });
    }
  }, [location]);
  
  // Determinar qué módulo debe estar abierto basado en la ruta actual
  const getActiveModule = () => {
    // Rutas públicas
    if (location.startsWith('/public/')) {
      return ['public'];
    }
    
    // Rutas que pertenecen al módulo "Gestión"
    if (location.startsWith('/admin/visitors') || 
        location.startsWith('/admin/parks') || 
        location.startsWith('/admin/trees') || 
        location.startsWith('/admin/fauna') || 
        location.startsWith('/admin/organizador') || 
        location.startsWith('/admin/activities') || 
        location.startsWith('/admin/activities/instructors') || 
        location.startsWith('/admin/events') || 
        location.startsWith('/admin/eventos-ambu') || 
        location.startsWith('/admin/space-reservations') ||
        location.startsWith('/admin/dashboard-reservas') ||
        location.startsWith('/admin/amenities') ||
        location.startsWith('/admin/evaluaciones')) {
      return ['gestion'];
    }
    
    // Rutas que pertenecen al módulo "O & M"
    if (location.startsWith('/admin/assets') || location.startsWith('/admin/incidents') || location.startsWith('/admin/volunteers')) {
      return ['operations'];
    }
    
    // Rutas que pertenecen al módulo "Admin/Finanzas"
    if (location.startsWith('/admin/finance') || location.startsWith('/admin/accounting') || location.startsWith('/admin/concessions')) {
      return ['admin-finance'];
    }
    
    // Rutas que pertenecen al módulo "Mkt & Comm"
    if (location.startsWith('/admin/communications') || location.startsWith('/admin/marketing') || location.startsWith('/admin/advertising')) {
      return ['mkt-comm'];
    }
    
    // Rutas que pertenecen al módulo "Configuración y Seguridad"
    if (location.startsWith('/admin/configuracion-seguridad/')) {
      return ['config-security'];
    }
    
    // Otros módulos
    if (location.startsWith('/admin/hr')) return ['hr'];
    if (location.startsWith('/admin/documents') || location.startsWith('/admin/comments')) return ['system'];
    return []; // Sin módulos abiertos por defecto
  };
  
  // Inicializar acordeones al montar el componente
  useEffect(() => {
    const activeModules = getActiveModule();
    if (activeModules.length > 0) {
      setOpenAccordions(activeModules);
    }
  }, []);

  return (
    <div className="fixed left-0 w-64 flex flex-col shadow-lg z-40" style={{ top: '80px', height: 'calc(100vh - 80px)', backgroundColor: '#003D49' }}>
      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2 w-full">
        <Accordion
          type="multiple"
          value={openAccordions}
          onValueChange={setOpenAccordions}
          className="space-y-1"
        >
          {/* Barra de búsqueda */}
          <div className="p-0">
            <SidebarSearch />
          </div>

          {/* 1. GESTIÓN - MENÚ PRINCIPAL CON SUBMENÚS COLAPSABLES */}
          <ModuleNav 
            title="Gestión" 
            icon={<FolderOpen className="h-5 w-5" />}
            value="gestion"
            defaultOpen={location.startsWith('/admin/visitors') || location.startsWith('/admin/parks') || location.startsWith('/admin/trees') || location.startsWith('/admin/organizador') || location.startsWith('/admin/activities') || location.startsWith('/admin/events') || location.startsWith('/admin/space-reservations') || location.startsWith('/admin/dashboard-reservas')}
          >
            {/* PARQUES */}
            <CollapsibleSubmenu
              id="parques"
              title={t('navigation.parks')}
              icon={<Map className="h-4 w-4" />}
              href="/admin/parks"
              collapsible={false}
              isExpanded={false}
              onToggle={() => {}}
              isActive={location.startsWith('/admin/parks')}
            />

            {/* ACTIVIDADES */}
            <CollapsibleSubmenu
              id="actividades"
              title="Actividades"
              icon={<Calendar className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('actividades')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('actividades')}
            >
              <NavItem 
                href="/admin/activities/categories" 
                icon={<Tag className="h-4 w-4" />}
                active={location.startsWith('/admin/activities/categories')}
              >
                Categorías
              </NavItem>
              <NavItem 
                href="/admin/activities/management" 
                icon={<Activity className="h-4 w-4" />}
                active={location.startsWith('/admin/activities/management')}
              >
                {t('navigation.listing')}
              </NavItem>
              <NavItem 
                href="/admin/organizador/catalogo/crear" 
                icon={<Plus className="h-4 w-4" />}
                active={location.startsWith('/admin/organizador/catalogo/crear')}
              >
                Nueva Actividad
              </NavItem>
              <NavItem 
                href="/admin/activities/calendar" 
                icon={<Calendar className="h-4 w-4" />}
                active={location.startsWith('/admin/activities/calendar')}
              >
                Cal. Actividades
              </NavItem>
              <NavItem 
                href="/admin/activities/registrations" 
                icon={<UserCheck className="h-4 w-4" />}
                active={location.startsWith('/admin/activities/registrations')}
              >
                Inscripciones
              </NavItem>
              <NavItem 
                href="/admin/activities/instructors" 
                icon={<GraduationCap className="h-4 w-4" />}
                active={location.startsWith('/admin/activities/instructors')}
              >
                {t('navigation.instructors')}
              </NavItem>
            </CollapsibleSubmenu>

            {/* AMENIDADES */}
            <CollapsibleSubmenu
              id="amenidades"
              title="Amenidades"
              icon={<Package className="h-4 w-4" />}
              href="/admin/amenities"
              collapsible={false}
              isExpanded={false}
              onToggle={() => {}}
              isActive={location.startsWith('/admin/amenities')}
            />

            {/* ARBOLADO */}
            <CollapsibleSubmenu
              id="arbolado"
              title="Arbolado"
              icon={<TreePine className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('arbolado')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('arbolado')}
            >
              <NavItem 
                href="/admin/trees/inventory" 
                icon={<Archive className="h-4 w-4" />}
                active={location.startsWith('/admin/trees/inventory')}
              >
                {t('navigation.inventory')}
              </NavItem>
              <NavItem 
                href="/admin/trees/species" 
                icon={<Leaf className="h-4 w-4" />}
                active={location.startsWith('/admin/trees/species')}
              >
                {t('navigation.species')}
              </NavItem>
              <NavItem 
                href="/admin/trees/maintenance" 
                icon={<Scissors className="h-4 w-4" />}
                active={location.startsWith('/admin/trees/maintenance')}
              >
                {t('navigation.maintenance')}
              </NavItem>
            </CollapsibleSubmenu>

            {/* FAUNA */}
            <CollapsibleSubmenu
              id="fauna"
              title="Fauna"
              icon={<Heart className="h-4 w-4" />}
              href="/admin/fauna/species"
              collapsible={false}
              isExpanded={false}
              onToggle={() => {}}
              isActive={location.startsWith('/admin/fauna/species')}
            />

            {/* VISITANTES */}
            <CollapsibleSubmenu
              id="visitantes"
              title="Visitantes"
              icon={<Users className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('visitantes')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('visitantes')}
            >
              <NavItem 
                href="/admin/visitors/count" 
                icon={<Users className="h-4 w-4" />}
                active={location.startsWith('/admin/visitors/count')}
              >
                Conteo
              </NavItem>


              <NavItem 
                href="/admin/visitors/feedback" 
                icon={<MessageSquare className="h-4 w-4" />}
                active={location.startsWith('/admin/visitors/feedback')}
              >
                Retroalimentación
              </NavItem>
            </CollapsibleSubmenu>
            
            {/* EVENTOS */}
            <CollapsibleSubmenu
              id="eventos"
              title="Eventos"
              icon={<CalendarDays className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('eventos')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('eventos')}
            >
              <NavItem 
                href="/admin/events/new" 
                icon={<Plus className="h-4 w-4" />}
                active={location.startsWith('/admin/events/new')}
              >
                Nuevo Evento
              </NavItem>
              <NavItem 
                href="/admin/events/categories" 
                icon={<Tag className="h-4 w-4" />}
                active={location.startsWith('/admin/events/categories')}
              >
                Categorías
              </NavItem>
              <NavItem 
                href="/admin/events/list" 
                icon={<ClipboardList className="h-4 w-4" />}
                active={location.startsWith('/admin/events/list')}
              >
                Listado
              </NavItem>
              <NavItem 
                href="/admin/events/registrations" 
                icon={<UserCheck className="h-4 w-4" />}
                active={location.startsWith('/admin/events/registrations')}
              >
                Inscripciones
              </NavItem>
              <NavItem 
                href="/admin/eventos-ambu" 
                icon={<FileText className="h-4 w-4" />}
                active={location.startsWith('/admin/eventos-ambu')}
              >
                Eventos
              </NavItem>
              <NavItem 
                href="/admin/eventos-ambu/calendar" 
                icon={<Calendar className="h-4 w-4" />}
                active={location.startsWith('/admin/eventos-ambu/calendar')}
              >
                Calendario
              </NavItem>
              <NavItem 
                href="/admin/eventos-ambu/tabulador" 
                icon={<DollarSign className="h-4 w-4" />}
                active={location.startsWith('/admin/eventos-ambu/tabulador')}
              >
                Tabulador de Costos
              </NavItem>
            </CollapsibleSubmenu>

            {/* RESERVAS */}
            <CollapsibleSubmenu
              id="reservas"
              title="Reservas"
              icon={<CalendarClock className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('reservas')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('reservas')}
            >
              <NavItem 
                href="/admin/space-reservations" 
                icon={<Calendar className="h-4 w-4" />}
                active={location.startsWith('/admin/space-reservations')}
              >
                Reservas Activas
              </NavItem>
              <NavItem 
                href="/admin/space-reservations/spaces" 
                icon={<MapPin className="h-4 w-4" />}
                active={location.startsWith('/admin/space-reservations/spaces')}
              >
                Espacios Disponibles
              </NavItem>
              <NavItem 
                href="/admin/space-reservations/new" 
                icon={<Plus className="h-4 w-4" />}
                active={location.startsWith('/admin/space-reservations/new')}
              >
                Nueva Reserva
              </NavItem>
              <NavItem 
                href="/admin/space-reservations/calendar" 
                icon={<CalendarDays className="h-4 w-4" />}
                active={location.startsWith('/admin/space-reservations/calendar')}
              >
                Cal. Reservas
              </NavItem>
            </CollapsibleSubmenu>

            {/* EVALUACIONES */}
            <CollapsibleSubmenu
              id="evaluaciones"
              title="Evaluaciones"
              icon={<Star className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('evaluaciones')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('evaluaciones')}
            >
              <NavItem 
                href="/admin/evaluaciones/parques" 
                icon={<MapPin className="h-4 w-4" />}
                active={location.startsWith('/admin/evaluaciones/parques')}
              >
                Parques
              </NavItem>
              <NavItem 
                href="/admin/evaluaciones/instructores" 
                icon={<UserCheck className="h-4 w-4" />}
                active={location.startsWith('/admin/evaluaciones/instructores')}
              >
                Instructores
              </NavItem>
              <NavItem 
                href="/admin/evaluaciones/voluntarios" 
                icon={<Users className="h-4 w-4" />}
                active={location.startsWith('/admin/evaluaciones/voluntarios')}
              >
                Voluntarios
              </NavItem>
              <NavItem 
                href="/admin/evaluaciones/actividades" 
                icon={<Calendar className="h-4 w-4" />}
                active={location.startsWith('/admin/evaluaciones/actividades')}
              >
                Actividades
              </NavItem>
              <NavItem 
                href="/admin/evaluaciones/concesionarios" 
                icon={<Building className="h-4 w-4" />}
                active={location.startsWith('/admin/evaluaciones/concesionarios')}
              >
                Concesionarios
              </NavItem>
              <NavItem 
                href="/admin/evaluaciones/eventos" 
                icon={<Target className="h-4 w-4" />}
                active={location.startsWith('/admin/evaluaciones/eventos')}
              >
                Eventos
              </NavItem>
              <NavItem 
                href="/admin/evaluaciones/criterios" 
                icon={<Settings className="h-4 w-4" />}
                active={location.startsWith('/admin/evaluaciones/criterios')}
              >
                Criterios
              </NavItem>
            </CollapsibleSubmenu>
          </ModuleNav>

          {/* 3. O & M - OPERACIONES Y MANTENIMIENTO CON SUBMENÚS COLAPSABLES */}
          <ModuleNav 
            title={
              <div className="flex items-center gap-2">
                <span>O & M</span>
                <span className="px-1.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">BETA</span>
              </div>
            }
            icon={<Wrench className="h-5 w-5" />}
            value="operations"
            defaultOpen={location.startsWith('/admin/assets') || location.startsWith('/admin/incidents') || location.startsWith('/admin/volunteers')}
          >
            {/* ACTIVOS */}
            <CollapsibleSubmenu
              id="activos"
              title="Activos"
              icon={<Package className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('activos')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('activos')}
            >
              <NavItem 
                href="/admin/assets/categories" 
                icon={<Tag className="h-4 w-4" />}
                active={location.startsWith('/admin/assets/categories')}
              >
                Categorías
              </NavItem>
              <NavItem 
                href="/admin/assets/inventory" 
                icon={<Archive className="h-4 w-4" />}
                active={location.startsWith('/admin/assets/inventory')}
              >
                {t('navigation.inventory')}
              </NavItem>
              <NavItem 
                href="/admin/assets/map" 
                icon={<Map className="h-4 w-4" />}
                active={location.startsWith('/admin/assets/map')}
              >
                {t('navigation.map')}
              </NavItem>
              <NavItem 
                href="/admin/assets/maintenance" 
                icon={<Wrench className="h-4 w-4" />}
                active={location.startsWith('/admin/assets/maintenance') && !location.includes('/calendar')}
              >
                {t('navigation.maintenance')}
              </NavItem>
              <NavItem 
                href="/admin/assets/maintenance/calendar" 
                icon={<Calendar className="h-4 w-4" />}
                active={location.startsWith('/admin/assets/maintenance/calendar')}
              >
                Cal. Mantenimiento
              </NavItem>
              <NavItem 
                href="/admin/assets/assignments" 
                icon={<UserCheck className="h-4 w-4" />}
                active={location.startsWith('/admin/assets/assignments')}
              >
                {t('navigation.assignments')}
              </NavItem>
            </CollapsibleSubmenu>

            {/* INCIDENCIAS */}
            <CollapsibleSubmenu
              id="incidencias"
              title="Incidencias"
              icon={<AlertTriangle className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('incidencias')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('incidencias')}
            >
              <NavItem 
                href="/admin/incidents" 
                icon={<ClipboardList className="h-4 w-4" />}
                active={location.startsWith('/admin/incidents')}
              >
                {t('navigation.listing')}
              </NavItem>
              <NavItem 
                href="/admin/incidents/categories" 
                icon={<Tag className="h-4 w-4" />}
                active={location.startsWith('/admin/incidents/categories')}
              >
                {t('navigation.categories')}
              </NavItem>
            </CollapsibleSubmenu>

            {/* VOLUNTARIOS */}
            <CollapsibleSubmenu
              id="voluntarios"
              title="Voluntarios"
              icon={<HeartHandshake className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('voluntarios')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('voluntarios')}
            >
              <NavItem 
                href="/admin/volunteers" 
                icon={<Users className="h-4 w-4" />}
                active={location.startsWith('/admin/volunteers')}
              >
                {t('navigation.listing')}
              </NavItem>
              <NavItem 
                href="/admin/volunteers/register" 
                icon={<Plus className="h-4 w-4" />}
                active={location.startsWith('/admin/volunteers/register')}
              >
                Registro
              </NavItem>

              <NavItem 
                href="/admin/volunteers/recognition" 
                icon={<Award className="h-4 w-4" />}
                active={location.startsWith('/admin/volunteers/recognition')}
              >
                Reconocimientos
              </NavItem>
            </CollapsibleSubmenu>
          </ModuleNav>

          {/* 4. ADMIN & FINANZAS */}
          <ModuleNav 
            title={
              <div className="flex items-center gap-2">
                <span>Admin & Finanzas</span>
                <span className="px-1.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">BETA</span>
              </div>
            }
            icon={<DollarSign className="h-5 w-5" />}
            value="admin-finance"
            defaultOpen={location.startsWith('/admin/finance') || location.startsWith('/admin/accounting') || location.startsWith('/admin/concessions')}
          >
            {/* FINANZAS */}
            <CollapsibleSubmenu
              id="finanzas"
              title="Finanzas"
              icon={<Target className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('finanzas')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('finanzas')}
            >
              <NavItem 
                href="/admin/finance/budget-planning" 
                icon={<Target className="h-4 w-4" />}
                active={location.startsWith('/admin/finance/budget-planning')}
              >
                Presupuestos
              </NavItem>
              <NavItem 
                href="/admin/finance/cash-flow-matrix" 
                icon={<LayoutGrid className="h-4 w-4" />}
                active={location.startsWith('/admin/finance/cash-flow-matrix')}
              >
                {t('navigation.cashFlow')}
              </NavItem>
              <NavItem 
                href="/admin/finance/calculator" 
                icon={<Calculator className="h-4 w-4" />}
                active={location.startsWith('/admin/finance/calculator')}
              >
                Calculadora
              </NavItem>
              <NavItem 
                href="/admin/payments" 
                icon={<CreditCard className="h-4 w-4" />}
                active={location.startsWith('/admin/payments')}
              >
                Registro de Pagos
              </NavItem>
            </CollapsibleSubmenu>

            {/* CONTABILIDAD */}
            <CollapsibleSubmenu
              id="contabilidad"
              title="Contabilidad"
              icon={<BookOpen className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('contabilidad')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('contabilidad')}
            >
              <NavItem 
                href="/admin/accounting/categories" 
                icon={<FolderTree className="h-4 w-4" />}
                active={location.startsWith('/admin/accounting/categories')}
              >
                Categorías
              </NavItem>
              <NavItem 
                href="/admin/accounting/transactions" 
                icon={<Receipt className="h-4 w-4" />}
                active={location.startsWith('/admin/accounting/transactions')}
              >
                Transacciones
              </NavItem>
              <NavItem 
                href="/admin/accounting/journal-entries" 
                icon={<ClipboardList className="h-4 w-4" />}
                active={location.startsWith('/admin/accounting/journal-entries')}
              >
                Asientos Contables
              </NavItem>
              <NavItem 
                href="/admin/accounting/trial-balance" 
                icon={<Scale className="h-4 w-4" />}
                active={location.startsWith('/admin/accounting/trial-balance')}
              >
                Balanza
              </NavItem>
              <NavItem 
                href="/admin/accounting/financial-statements" 
                icon={<FileText className="h-4 w-4" />}
                active={location.startsWith('/admin/accounting/financial-statements')}
              >
                Estados Financieros
              </NavItem>
              <NavItem 
                href="/admin/accounting/integration" 
                icon={<ArrowRightLeft className="h-4 w-4" />}
                active={location.startsWith('/admin/accounting/integration')}
              >
                Integración
              </NavItem>
            </CollapsibleSubmenu>

            {/* CONCESIONES */}
            <CollapsibleSubmenu
              id="concesiones"
              title="Concesiones"
              icon={<Store className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('concesiones')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('concesiones')}
            >
              <NavItem 
                href="/admin/concessions/catalog" 
                icon={<ListChecks className="h-4 w-4" />}
                active={location.startsWith('/admin/concessions/catalog')}
              >
                Catálogo
              </NavItem>
              <NavItem 
                href="/admin/concessions/concessionaires" 
                icon={<Building className="h-4 w-4" />}
                active={location.startsWith('/admin/concessions/concessionaires')}
              >
                Concesionarios
              </NavItem>
              <NavItem 
                href="/admin/concessions/contracts" 
                icon={<FileText className="h-4 w-4" />}
                active={location.startsWith('/admin/concessions/contracts')}
              >
                {t('navigation.contracts')}
              </NavItem>
              <NavItem 
                href="/admin/concessions/active" 
                icon={<Handshake className="h-4 w-4" />}
                active={location.startsWith('/admin/concessions/active')}
              >
                C. Activas
              </NavItem>
            </CollapsibleSubmenu>
          </ModuleNav>

          {/* 5. MKT & COMM */}
          <ModuleNav 
            title="Mkt & Comm" 
            icon={<Megaphone className="h-5 w-5" />}
            value="mkt-comm"
            defaultOpen={location.startsWith('/admin/communications') || location.startsWith('/admin/marketing') || location.startsWith('/admin/advertising')}
          >

            {/* MARKETING */}
            <CollapsibleSubmenu
              id="marketing"
              title="Marketing"
              icon={<TrendingUp className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('marketing')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('marketing')}
            >
              <NavItem 
                href="/admin/marketing/campaigns" 
                icon={<Megaphone className="h-4 w-4" />}
                active={location.startsWith('/admin/marketing/campaigns')}
              >
                Campañas
              </NavItem>
              <NavItem 
                href="/admin/marketing/analytics" 
                icon={<TrendingUp className="h-4 w-4" />}
                active={location.startsWith('/admin/marketing/analytics')}
              >
                Análisis
              </NavItem>
              <NavItem 
                href="/admin/marketing/content" 
                icon={<FileText className="h-4 w-4" />}
                active={location.startsWith('/admin/marketing/content')}
              >
                Contenido
              </NavItem>
            </CollapsibleSubmenu>

            {/* ADVERTISING */}
            <CollapsibleSubmenu
              id="advertising"
              title="Advertising"
              icon={<Star className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('advertising')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('advertising')}
            >
              <NavItem 
                href="/admin/advertising/spaces" 
                icon={<LayoutGrid className="h-4 w-4" />}
                active={location.startsWith('/admin/advertising/spaces')}
              >
                Espacios
              </NavItem>
              <NavItem 
                href="/admin/advertising/placements" 
                icon={<MapPin className="h-4 w-4" />}
                active={location.startsWith('/admin/advertising/placements')}
              >
                Colocaciones
              </NavItem>
              <NavItem 
                href="/admin/advertising/analytics" 
                icon={<BarChart3 className="h-4 w-4" />}
                active={location.startsWith('/admin/advertising/analytics')}
              >
                Métricas
              </NavItem>
            </CollapsibleSubmenu>

            {/* COMMUNICATIONS */}
            <CollapsibleSubmenu
              id="communications"
              title="Communications"
              icon={<MessageSquare className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('communications')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('communications')}
            >
              <NavItem 
                href="/admin/communications/templates" 
                icon={<FileText className="h-4 w-4" />}
                active={location.startsWith('/admin/communications/templates')}
              >
                Plantillas
              </NavItem>
              <NavItem 
                href="/admin/communications/queue" 
                icon={<ListChecks className="h-4 w-4" />}
                active={location.startsWith('/admin/communications/queue')}
              >
                Cola de Emails
              </NavItem>
              <NavItem 
                href="/admin/communications/bulk" 
                icon={<Mail className="h-4 w-4" />}
                active={location.startsWith('/admin/communications/bulk')}
              >
                Envío Masivo
              </NavItem>
            </CollapsibleSubmenu>
          </ModuleNav>

          {/* 6. RECURSOS HUMANOS */}
          <ModuleNav 
            title={
              <div className="flex items-center gap-2">
                <span>RH</span>
                <span className="px-1.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">BETA</span>
              </div>
            }
            icon={<Users className="h-5 w-5" />}
            value="hr"
          >
            <CollapsibleSubmenu
              id="empleados"
              title="Empleados"
              icon={<Users className="h-5 w-5" />}
              href="/admin/hr/employees"
              collapsible={false}
              isExpanded={false}
              onToggle={() => {}}
              isActive={location.startsWith('/admin/hr/employees')}
            />

            <CollapsibleSubmenu
              id="nomina"
              title="Nómina"
              icon={<DollarSign className="h-5 w-5" />}
              href="/admin/hr/payroll"
              collapsible={false}
              isExpanded={false}
              onToggle={() => {}}
              isActive={location.startsWith('/admin/hr/payroll')}
            />

            <CollapsibleSubmenu
              id="vacaciones"
              title="Vacaciones"
              icon={<Calendar className="h-5 w-5" />}
              href="/admin/hr/vacations"
              collapsible={false}
              isExpanded={false}
              onToggle={() => {}}
              isActive={location.startsWith('/admin/hr/vacations')}
            />
          </ModuleNav>

          {/* 7. CONFIGURACIÓN Y SEGURIDAD */}
          <ModuleNav 
            title="Configuración" 
            icon={<Settings className="h-5 w-5" />}
            value="config-security"
            defaultOpen={location.startsWith('/admin/configuracion-seguridad') || 
                        location.startsWith('/admin/security') || 
                        location.startsWith('/admin/settings') || 
                        location.startsWith('/admin/users') || 
                        location.startsWith('/admin/roles') || 
                        location.startsWith('/admin/permissions') || 
                        location.startsWith('/admin/role-assignments')}
          >
            {/* CONTROL DE ACCESO */}
            <CollapsibleSubmenu
              id="control-acceso"
              title="Control de Acceso"
              icon={<Shield className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('control-acceso')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('control-acceso')}
            >
              <NavItem 
                href="/admin/configuracion-seguridad/access/roles" 
                icon={<UserCog className="h-4 w-4" />}
                active={location.startsWith('/admin/configuracion-seguridad/access/roles')}
              >
                Gestión de Roles
              </NavItem>
              <NavItem 
                href="/admin/configuracion-seguridad/access/permissions" 
                icon={<Grid className="h-4 w-4" />}
                active={location.startsWith('/admin/configuracion-seguridad/access/permissions')}
              >
                Matriz de Permisos
              </NavItem>

              <NavItem 
                href="/admin/configuracion-seguridad/access/users" 
                icon={<Users className="h-4 w-4" />}
                active={location.startsWith('/admin/configuracion-seguridad/access/users')}
              >
                Gestión de Usuarios
              </NavItem>
            </CollapsibleSubmenu>

            {/* POLÍTICAS */}
            <CollapsibleSubmenu
              id="politicas"
              title="Políticas"
              icon={<FileText className="h-4 w-4" />}
              href="/admin/configuracion-seguridad/policies"
              collapsible={false}
              isExpanded={false}
              onToggle={() => {}}
              isActive={location.startsWith('/admin/configuracion-seguridad/policies')}
            />

            {/* NOTIFICACIONES */}
            <CollapsibleSubmenu
              id="notificaciones"
              title="Notificaciones"
              icon={<Bell className="h-4 w-4" />}
              href="/admin/configuracion-seguridad/notifications"
              collapsible={false}
              isExpanded={false}
              onToggle={() => {}}
              isActive={location.startsWith('/admin/configuracion-seguridad/notifications')}
            />

            {/* AUDITORÍA */}
            <CollapsibleSubmenu
              id="auditoria"
              title="Auditoría"
              icon={<ClipboardList className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('auditoria')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('auditoria')}
            >
              <NavItem 
                href="/admin/configuracion-seguridad/audit" 
                icon={<ClipboardList className="h-4 w-4" />}
                active={location.startsWith('/admin/configuracion-seguridad/audit')}
              >
                Panel de Auditoría
              </NavItem>
              <NavItem 
                href="/admin/configuracion-seguridad/audit/role-audits" 
                icon={<UserCheck className="h-4 w-4" />}
                active={location.startsWith('/admin/configuracion-seguridad/audit/role-audits')}
              >
                Auditoría de Roles
              </NavItem>
            </CollapsibleSubmenu>

            {/* MANTENIMIENTO */}
            <CollapsibleSubmenu
              id="mantenimiento-sistema"
              title="Mantenimiento"
              icon={<Database className="h-4 w-4" />}
              isExpanded={expandedSubmenus.includes('mantenimiento-sistema')}
              onToggle={toggleSubmenu}
              isActive={isSubmenuActive('mantenimiento-sistema')}
            >
              <NavItem 
                href="/admin/configuracion-seguridad/maintenance" 
                icon={<Settings className="h-4 w-4" />}
                active={location.startsWith('/admin/configuracion-seguridad/maintenance')}
              >
                Panel de Mantenimiento
              </NavItem>
              <NavItem 
                href="/admin/configuracion-seguridad/maintenance/backup" 
                icon={<Download className="h-4 w-4" />}
                active={location.startsWith('/admin/configuracion-seguridad/maintenance/backup')}
              >
                Respaldos
              </NavItem>
              <NavItem 
                href="/admin/configuracion-seguridad/maintenance/performance" 
                icon={<TrendingUp className="h-4 w-4" />}
                active={location.startsWith('/admin/configuracion-seguridad/maintenance/performance')}
              >
                Rendimiento
              </NavItem>
              <NavItem 
                href="/admin/configuracion-seguridad/maintenance/updates" 
                icon={<Upload className="h-4 w-4" />}
                active={location.startsWith('/admin/configuracion-seguridad/maintenance/updates')}
              >
                Actualizaciones
              </NavItem>
            </CollapsibleSubmenu>

            {/* EXPORTACIONES */}
            <CollapsibleSubmenu
              id="exportaciones"
              title="Exportaciones"
              icon={<Download className="h-4 w-4" />}
              href="/admin/configuracion-seguridad/exports"
              collapsible={false}
              isActive={location.startsWith('/admin/configuracion-seguridad/exports')}
            />
          </ModuleNav>

        </Accordion>
      </ScrollArea>
      {/* Footer con logo de ParkSys */}
      <div className="p-8 border-t border-teal-600" style={{ backgroundColor: '#003D49' }}>
        <div className="flex flex-col items-center justify-center gap-4">
          <img 
            src={parksysLogo} 
            alt="ParkSys - Sistema de parques" 
            className="h-15 w-auto opacity-80 hover:opacity-100 transition-opacity pl-[5px] pr-[5px]"
          />
          <a 
            href="https://parquesdemexico.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 hover:bg-opacity-80 block text-center"
            style={{ 
              backgroundColor: '#003D49',
              color: '#61B1A0',
              border: '1px solid #61B1A0'
            }}
          >
            By Parques de México
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebarComplete;