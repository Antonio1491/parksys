import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import UserProfileImage from '@/components/UserProfileImage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  BarChart,
  Package,
  Shield,
  User,
  ListFilter,
  Workflow,
  Building,
  CreditCard,
  ClipboardCheck,
  Upload,
  Archive,
  Boxes,
  Box,
  Wrench,
  CalendarDays,
  CircleDollarSign,
  MapPin,
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
  FileEdit,
  Scissors,
  TreePine,
  HardHat,
  Camera,
  Heart,
  AlertCircle,
  Star,
  ClipboardList,
  PersonStanding,
  UserCheck,
  Activity,
  Banknote,
  PieChart,
  Receipt,
  Wallet,
  ChevronsUpDown,
  ChevronDown,
  Briefcase,
  UserCog,
  Zap
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

interface ModuleNavProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  value: string;
  defaultOpen?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, children, active }) => {
  const iconWithClass = React.cloneElement(icon as React.ReactElement, {
    className: cn((icon as React.ReactElement).props.className, 'menu-icon')
  });

  return (
    <Link href={href}>
      <Button
        variant={active ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start text-sm font-normal h-9",
          active && "bg-primary/10 text-primary font-medium"
        )}
      >
        {iconWithClass}
        <span className="ml-2">{children}</span>
      </Button>
    </Link>
  );
};

const ModuleNav: React.FC<ModuleNavProps> = ({ 
  title,
  icon,
  children,
  value,
  defaultOpen
}) => {
  const iconWithClass = React.cloneElement(icon as React.ReactElement, {
    className: cn((icon as React.ReactElement).props.className, 'menu-icon')
  });

  return (
    <AccordionItem value={value} className="border-0">
      <AccordionTrigger className="py-2 hover:no-underline">
        <div className="flex items-center text-sm font-medium">
          <div className="mr-2">{iconWithClass}</div>
          {title}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pl-2 pb-0">
        <div className="flex flex-col gap-1 pt-1">
          {children}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

// Sidebar para Administrador (acceso completo)
const AdminSidebarContent: React.FC<{ location: string; defaultAccordion: string[] }> = ({ location, defaultAccordion }) => (
  <Accordion
    type="multiple"
    defaultValue={defaultAccordion}
    className="px-3 space-y-1"
  >
    <NavItem 
      href="/admin" 
      icon={<Home className="h-5 w-5" />}
      active={location === '/admin'}
    >
      Dashboard
    </NavItem>

    <ModuleNav 
      title="Usuarios" 
      icon={<Users className="h-5 w-5" />}
      value="users"
    >
      <NavItem 
        href="/admin/users" 
        icon={<User className="h-5 w-5" />}
        active={location === '/admin/users'}
      >
        Lista
      </NavItem>
      <NavItem 
        href="/admin/permissions" 
        icon={<Shield className="h-5 w-5" />}
        active={location === '/admin/permissions'}
      >
        Permisos
      </NavItem>
    </ModuleNav>

    <ModuleNav 
      title="Operaciones" 
      icon={<MapPin className="h-5 w-5" />}
      value="operations"
    >
      <NavItem 
        href="/admin/parks" 
        icon={<Map className="h-5 w-5" />}
        active={location === '/admin/parks'}
      >
        Parques
      </NavItem>
      <NavItem 
        href="/admin/amenities" 
        icon={<Box className="h-5 w-5" />}
        active={location === '/admin/amenities'}
      >
        Amenidades
      </NavItem>
      <NavItem 
        href="/admin/incidents" 
        icon={<AlertCircle className="h-5 w-5" />}
        active={location === '/admin/incidents'}
      >
        Incidentes
      </NavItem>
    </ModuleNav>

    <ModuleNav 
      title="Finanzas" 
      icon={<DollarSign className="h-5 w-5" />}
      value="finance"
    >
      <NavItem 
        href="/admin/finance/catalog" 
        icon={<Tag className="h-5 w-5" />}
        active={location === '/admin/finance/catalog'}
      >
        Catálogo
      </NavItem>
      <NavItem 
        href="/admin/finance/incomes" 
        icon={<TrendingUp className="h-5 w-5" />}
        active={location === '/admin/finance/incomes'}
      >
        Ingresos
      </NavItem>
      <NavItem 
        href="/admin/finance/expenses" 
        icon={<TrendingDown className="h-5 w-5" />}
        active={location === '/admin/finance/expenses'}
      >
        Egresos
      </NavItem>
    </ModuleNav>

    <ModuleNav 
      title="Actividades" 
      icon={<Calendar className="h-5 w-5" />}
      value="activities"
    >
      <NavItem 
        href="/admin/activities/management" 
        icon={<Activity className="h-5 w-5" />}
        active={location === '/admin/activities/management'}
      >
        Listado
      </NavItem>
      <NavItem 
        href="/admin/activities/instructors" 
        icon={<GraduationCap className="h-5 w-5" />}
        active={location === '/admin/activities/instructors'}
      >
        Instructores
      </NavItem>
    </ModuleNav>

    <NavItem 
      href="/admin/settings" 
      icon={<Settings className="h-5 w-5" />}
      active={location === '/admin/settings'}
    >
      Configuración
    </NavItem>
  </Accordion>
);

// Sidebar para Director (gestión estratégica)
const DirectorSidebar: React.FC<{ location: string; defaultAccordion: string[] }> = ({ location, defaultAccordion }) => (
  <Accordion
    type="multiple"
    defaultValue={defaultAccordion}
    className="px-3 space-y-1"
  >
    <NavItem 
      href="/admin" 
      icon={<Home className="h-5 w-5" />}
      active={location === '/admin'}
    >
      Dashboard
    </NavItem>

    <ModuleNav 
      title="Finanzas" 
      icon={<DollarSign className="h-5 w-5" />}
      value="finance"
    >
      <NavItem 
        href="/admin/finance/catalog" 
        icon={<Tag className="h-5 w-5" />}
        active={location === '/admin/finance/catalog'}
      >
        Catálogo
      </NavItem>
      <NavItem 
        href="/admin/finance/incomes" 
        icon={<TrendingUp className="h-5 w-5" />}
        active={location === '/admin/finance/incomes'}
      >
        Ingresos
      </NavItem>
      <NavItem 
        href="/admin/finance/expenses" 
        icon={<TrendingDown className="h-5 w-5" />}
        active={location === '/admin/finance/expenses'}
      >
        Egresos
      </NavItem>
    </ModuleNav>

    <ModuleNav 
      title="Operaciones" 
      icon={<MapPin className="h-5 w-5" />}
      value="operations"
    >
      <NavItem 
        href="/admin/parks" 
        icon={<Map className="h-5 w-5" />}
        active={location === '/admin/parks'}
      >
        Parques
      </NavItem>
      <NavItem 
        href="/admin/incidents" 
        icon={<AlertCircle className="h-5 w-5" />}
        active={location === '/admin/incidents'}
      >
        Incidentes
      </NavItem>
    </ModuleNav>

    <NavItem 
      href="/admin/users" 
      icon={<Users className="h-5 w-5" />}
      active={location === '/admin/users'}
    >
      Personal
    </NavItem>
  </Accordion>
);

// Sidebar para Manager (gestión operativa)
const ManagerSidebar: React.FC<{ location: string; defaultAccordion: string[] }> = ({ location, defaultAccordion }) => (
  <Accordion
    type="multiple"
    defaultValue={defaultAccordion}
    className="px-3 space-y-1"
  >
    <NavItem 
      href="/admin" 
      icon={<Home className="h-5 w-5" />}
      active={location === '/admin'}
    >
      Dashboard
    </NavItem>

    <ModuleNav 
      title="Operaciones" 
      icon={<MapPin className="h-5 w-5" />}
      value="operations"
    >
      <NavItem 
        href="/admin/parks" 
        icon={<Map className="h-5 w-5" />}
        active={location === '/admin/parks'}
      >
        Parques
      </NavItem>
      <NavItem 
        href="/admin/amenities" 
        icon={<Box className="h-5 w-5" />}
        active={location === '/admin/amenities'}
      >
        Amenidades
      </NavItem>
      <NavItem 
        href="/admin/incidents" 
        icon={<AlertCircle className="h-5 w-5" />}
        active={location === '/admin/incidents'}
      >
        Incidentes
      </NavItem>
    </ModuleNav>

    <ModuleNav 
      title="Actividades" 
      icon={<Calendar className="h-5 w-5" />}
      value="activities"
    >
      <NavItem 
        href="/admin/activities/management" 
        icon={<Activity className="h-5 w-5" />}
        active={location === '/admin/activities/management'}
      >
        Listado
      </NavItem>
      <NavItem 
        href="/admin/activities/instructors" 
        icon={<GraduationCap className="h-5 w-5" />}
        active={location === '/admin/activities/instructors'}
      >
        Instructores
      </NavItem>
    </ModuleNav>

    <NavItem 
      href="/admin/users" 
      icon={<Users className="h-5 w-5" />}
      active={location === '/admin/users'}
    >
      Personal
    </NavItem>
  </Accordion>
);

// Sidebar para Instructor (gestión de actividades)
const InstructorSidebar: React.FC<{ location: string; defaultAccordion: string[] }> = ({ location, defaultAccordion }) => (
  <Accordion
    type="multiple"
    defaultValue={defaultAccordion}
    className="px-3 space-y-1"
  >
    <NavItem 
      href="/admin" 
      icon={<Home className="h-5 w-5" />}
      active={location === '/admin'}
    >
      Dashboard
    </NavItem>

    <ModuleNav 
      title="Mis Actividades" 
      icon={<Calendar className="h-5 w-5" />}
      value="activities"
    >
      <NavItem 
        href="/admin/activities/management" 
        icon={<Activity className="h-5 w-5" />}
        active={location === '/admin/activities/management'}
      >
        Listado
      </NavItem>
    </ModuleNav>

    <NavItem 
      href="/admin/settings/profile" 
      icon={<User className="h-5 w-5" />}
      active={location === '/admin/settings/profile'}
    >
      Mi Perfil
    </NavItem>
  </Accordion>
);

// Sidebar para Supervisor (supervisión y reportes)
const SupervisorSidebar: React.FC<{ location: string; defaultAccordion: string[] }> = ({ location, defaultAccordion }) => (
  <Accordion
    type="multiple"
    defaultValue={defaultAccordion}
    className="px-3 space-y-1"
  >
    <NavItem 
      href="/admin" 
      icon={<Home className="h-5 w-5" />}
      active={location === '/admin'}
    >
      Dashboard
    </NavItem>

    <ModuleNav 
      title="Supervisión" 
      icon={<MapPin className="h-5 w-5" />}
      value="operations"
    >
      <NavItem 
        href="/admin/parks" 
        icon={<Map className="h-5 w-5" />}
        active={location === '/admin/parks'}
      >
        Parques
      </NavItem>
      <NavItem 
        href="/admin/incidents" 
        icon={<AlertCircle className="h-5 w-5" />}
        active={location === '/admin/incidents'}
      >
        Incidentes
      </NavItem>
    </ModuleNav>

    <NavItem 
      href="/admin/activities/management" 
      icon={<Calendar className="h-5 w-5" />}
      active={location === '/admin/activities/management'}
    >
      Actividades
    </NavItem>
  </Accordion>
);

// Componente principal que selecciona el sidebar según el rol
const RoleBasedSidebar: React.FC = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  // Determinar qué sección debe estar abierta basado en la URL actual
  const getInitialOpenSections = () => {
    if (location.startsWith('/admin/assets')) return ['assets'];
    if (location.startsWith('/admin/activities/management')) return ['activities'];
    if (location.startsWith('/admin/activities/instructors')) return ['activities'];
    if (location.startsWith('/admin/parks') || 
        location.startsWith('/admin/amenities') || 
        location.startsWith('/admin/incidents')) return ['operations'];
    if (location.startsWith('/admin/volunteers')) return ['volunteers'];
    if (location.startsWith('/admin/finance')) return ['finance'];
    if (location.startsWith('/admin/events')) return ['events'];
    if (location.startsWith('/admin/marketing')) return ['marketing'];
    if (location.startsWith('/admin/concessions')) return ['concessions'];
    if (location.startsWith('/admin/users') || location.startsWith('/admin/permissions')) return ['users'];
    if (location.startsWith('/admin/settings')) return ['settings'];
    return [];
  };
  
  const [defaultAccordion, setDefaultAccordion] = useState<string[]>(getInitialOpenSections());
  
  // Función para obtener el sidebar según el rol
  const getSidebarForRole = () => {
    const role = (user as any)?.role;
    
    switch (role) {
      case 'admin':
        return <AdminSidebarContent location={location} defaultAccordion={defaultAccordion} />;
      case 'director':
        return <DirectorSidebar location={location} defaultAccordion={defaultAccordion} />;
      case 'manager':
        return <ManagerSidebar location={location} defaultAccordion={defaultAccordion} />;
      case 'instructor':
        return <InstructorSidebar location={location} defaultAccordion={defaultAccordion} />;
      case 'supervisor':
        return <SupervisorSidebar location={location} defaultAccordion={defaultAccordion} />;
      default:
        // Por defecto, mostrar un sidebar básico
        return <InstructorSidebar location={location} defaultAccordion={defaultAccordion} />;
    }
  };
  
  return (
    <div className="h-screen border-r bg-white flex flex-col">
      <div className="p-4 flex items-center">
        <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 16c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0-8c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm4 8c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0-8c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm7.5-4c.28 0 .5.22.5.5s-.22.5-.5.5-.5-.22-.5-.5.22-.5.5-.5zM5 12c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm7 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm1-8.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM17 12c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm2-5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-7-10c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-4-8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"></path>
        </svg>
        <div className="ml-2 flex flex-col">
          <h1 className="text-xl font-heading font-semibold text-gray-900">
            ParkSys
          </h1>
          <span className="text-xs text-gray-500 capitalize">
            Panel {(user as any)?.role || 'Usuario'}
          </span>
        </div>
      </div>
      
      <Separator />
      
      <ScrollArea className="flex-1 py-2">
        {getSidebarForRole()}
      </ScrollArea>
      
      <Separator />
      
      <div className="p-3">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
          {(user as any)?.profileImageUrl ? (
            <img 
              src={(user as any).profileImageUrl}
              alt="Foto de perfil"
              className="h-8 w-8 rounded-full object-cover border border-gray-200"
              onError={(e) => {
                // Si la imagen falla, mostrar el avatar con inicial
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const nextSibling = target.nextElementSibling as HTMLElement;
                if (nextSibling) {
                  nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {((user as any)?.fullName || (user as any)?.username || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">
              {(user as any)?.fullName || (user as any)?.username || 'Usuario'}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {(user as any)?.role || 'usuario'}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleBasedSidebar;