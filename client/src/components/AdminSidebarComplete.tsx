import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { SidebarSearch } from './SidebarSearch';
import { adminSidebarStructure } from '@/config/adminSidebarStructure';
import { sidebarSubmenus, sidebarMeta, navigableRoutes} from '@/config/sidebarSubmenus';
import { sidebarModules } from '@/config/sidebarConfig';
import {
  getActiveSubmenuFromLocation,
  getActiveModuleFromLocation,
} from '@/utils/sidebarHelpers';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const parksysLogo = "/parksys-logo-final.png";

// Tipos
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

// Componente NavItem
const NavItem: React.FC<NavItemProps> = ({ href, icon, children, active, moduleColor }) => {
  const iconWithClass = React.cloneElement(icon as React.ReactElement, {
    className: cn(
      (icon as React.ReactElement).props.className,
      'menu-icon',
      moduleColor || 'text-header-background'
    ),
  });

  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          "w-full flex items-center justify-start rounded-full text-sm font-light h-9 px-2 transition-colors duration-200",
          active
            ? "bg-white text-sidebar-primary hover:bg-white hover:text-header-background"
            : "text-sidebar-primary hover:bg-sidebar-hover hover:text-header-background"
        )}
      >
        {iconWithClass}
        <span className="ml-1">{children}</span>
      </Button>
    </Link>
  );
};

// Componente ModuleNav con colores
const ModuleNav: React.FC<ModuleNavProps> = ({ title, icon, children, value }) => {
  // Esquemas de color para cada módulo
  const getModuleColors = (moduleValue: string) => {
    const colorSchemes: Record<string, { iconColor: string; textColor: string; hoverBg: string; bgColor: string }> = {
      system: {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-sidebar-hover',
        bgColor: '#61B1A0',
      },
      gestion: {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-sidebar-hover',
        bgColor: '#513C73',
      },
      operations: {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-sidebar-hover',
        bgColor: '#B275B0',
      },
      adminFinance: {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-sidebar-hover',
        bgColor: '#B3C077',
      },
      mktComm: {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-sidebar-hover',
        bgColor: '#1E5AA6',
      },
      hr: {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-sidebar-hover',
        bgColor: '#198DCE',
      },
      configSecurity: {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-sidebar-hover',
        bgColor: '#90D3EC',
      },
    };

    return (
      colorSchemes[moduleValue] || {
        iconColor: 'text-white',
        textColor: 'text-white',
        hoverBg: 'hover:bg-sidebar-hover',
        bgColor: '#90D3EC',
      }
    );
  };

  const colors = getModuleColors(value);

  const iconWithClass = React.cloneElement(icon as React.ReactElement, {
    className: cn((icon as React.ReactElement).props.className, 'menu-icon', colors.iconColor),
  });

  return (
    <AccordionItem value={value} className="border-0">
      <AccordionTrigger className={cn("py-2 hover:no-underline [&>svg]:text-white", colors.hoverBg)}>
        <div className={cn("flex items-center text-sm font-normal font-poppins", colors.textColor)}>
          <div
            className="mr-2 flex items-center justify-center w-8 h-8 rounded-full"
            style={{ backgroundColor: colors.bgColor }}
          >
            {iconWithClass}
          </div>
          {title}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pl-4 pb-0">
        <div className="flex flex-col gap-1 pt-1">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              if (child.type === NavItem) {
                return React.cloneElement(child, { moduleColor: colors.iconColor } as any);
              }
              // Procesar divs recursivamente
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
const CollapsibleSubmenu: React.FC<CollapsibleSubmenuProps> = ({
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

  const content = (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-center justify-between p-2 text-sm font-light font-poppins rounded-lg transition-colors',
        isActive
          ? 'bg-header-background text-white'
          : 'bg-transparent text-white hover:bg-sidebar-hover'
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
          className={cn('h-4 w-4 text-white transition-transform', isExpanded && 'rotate-90')}
        />
      )}
    </button>
  );

  return href ? (
    <Link to={href}>
      {content}
      {collapsible && isExpanded && <div className="pl-2 ml-2 space-y-1 mt-2">{children}</div>}
    </Link>
  ) : (
    <div>
      {content}
      {collapsible && isExpanded && <div className="pl-2 ml-2 space-y-1 mt-2">{children}</div>}
    </div>
  );
};

// Componente principal del Sidebar
const AdminSidebarComplete: React.FC = () => {
  const [location] = useLocation();
  const { t } = useTranslation('common');

  // Estados
  const [expandedSubmenus, setExpandedSubmenus] = useState<string[]>([]);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Obtener módulo y submenu activos
  const activeModule = getActiveModuleFromLocation(location, sidebarModules);
  const activeSubmenu = getActiveSubmenuFromLocation(location, sidebarSubmenus);

  // Toggle de submenús
  const toggleSubmenu = (submenuId: string) => {
    setExpandedSubmenus((prev) =>
      prev.includes(submenuId) ? prev.filter((id) => id !== submenuId) : [...prev, submenuId]
    );
  };

  // Inicializar submenús expandidos basado en la ruta actual
  useEffect(() => {
    if (activeSubmenu && !expandedSubmenus.includes(activeSubmenu)) {
      setExpandedSubmenus([activeSubmenu]);
    }
  }, [activeSubmenu]);

  // Mantener acordeones abiertos basado en la navegación
  useEffect(() => {
    if (activeModule && !openAccordions.includes(activeModule)) {
      setOpenAccordions((prev) => Array.from(new Set([...prev, activeModule])));
    }
  }, [activeModule]);

  // Cerrar mobile sidebar al navegar
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  // Renderizar submenús
  const renderSubmenu = (submenuId: string, type: 'link' | 'group') => {
    const meta = sidebarMeta[submenuId];
    if (!meta) return null;

    const IconComponent = meta.icon;
    const submenuIcon = <IconComponent className="h-4 w-4" />;
    const isActive = activeSubmenu === submenuId;

    // Si es un link simple (sin hijos)
    if (type === 'link') {
      const routes = sidebarSubmenus[submenuId];
      const href = typeof routes[0] === 'string' ? routes[0] : routes[0](':id');

      return (
        <CollapsibleSubmenu
          key={submenuId}
          id={submenuId}
          title={t(meta.label)}
          icon={submenuIcon}
          href={href}
          collapsible={false}
          isExpanded={false}
          onToggle={() => {}}
          isActive={isActive}
        />
      );
    }

    // Si es un grupo (con hijos colapsables)
    const navRoutes = navigableRoutes[submenuId] || [];

    return (
      <CollapsibleSubmenu
        key={submenuId}
        id={submenuId}
        title={t(meta.label)}
        icon={submenuIcon}
        isActive={isActive}
        isExpanded={expandedSubmenus.includes(submenuId)}
        onToggle={toggleSubmenu}
        collapsible
      >
        {navRoutes.map(({ route, labelKey, icon: RouteIcon }) => {
          const isRouteActive = location.startsWith(route);
          const routeIcon = <RouteIcon className="h-4 w-4" />;

          return (
            <NavItem 
              key={route} 
              href={route} 
              icon={routeIcon}
              active={isRouteActive}
            >
              {t(labelKey)}
            </NavItem>
          );
        })}
      </CollapsibleSubmenu>
    );
  };

  // Contenido de navegación (compartido entre desktop y mobile)
  const navigationContent = (
    <Accordion
      type="multiple"
      value={openAccordions}
      onValueChange={setOpenAccordions}
      className="space-y-1"
    >
      {adminSidebarStructure.map(({ moduleKey, labelKey, icon: Icon, submenus }) => (
        <ModuleNav key={moduleKey} title={t(labelKey)} icon={<Icon className="h-5 w-5" />} value={moduleKey}>
          {submenus.map(({ id: submenuId, type }) => renderSubmenu(submenuId, type))}
        </ModuleNav>
      ))}
    </Accordion>
  );

  // Footer (compartido entre desktop y mobile)
  const footerContent = (
    <div className="p-8 border-t border-header-background" style={{ backgroundColor: '#003D49' }}>
      <div className="flex flex-col items-center justify-center gap-4">
        <img
          src={parksysLogo}
          alt="ParkSys - Sistema de parques"
          className="h-14 w-auto max-w-64 opacity-80 hover:opacity-100 transition-opacity pl-[5px] pr-[5px]"
        />
        <a
          href="https://parquesdemexico.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 hover:bg-opacity-80 block text-center"
          style={{
            backgroundColor: '#003D49',
            color: '#61B1A0',
            border: '1px solid #61B1A0',
          }}
        >
          By Parques de México
        </a>
      </div>
    </div>
  );

  // Contenido del sidebar DESKTOP (con ScrollArea)
  const sidebarContentDesktop = (
    <>
      <div className="p-0">
        <SidebarSearch />
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        {navigationContent}
      </ScrollArea>
      {footerContent}
    </>
  );

  // Contenido del sidebar MOBILE (scroll nativo)
  const sidebarContentMobile = (
    <>
      {/* Barra de búsqueda - fija arriba */}
      <div className="p-0 flex-shrink-0">
        <SidebarSearch />
      </div>

      {/* Navegación - scrolleable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
        {navigationContent}
      </div>

      {/* Footer - fijo abajo */}
      <div className="flex-shrink-0">
        {footerContent}
      </div>
    </>
  );

  return (
    <>
      {/* Botón de menú mobile - Inferior izquierdo */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className={cn(
          "fixed bottom-4 z-50 lg:hidden p-3 rounded-full bg-sidebar text-white shadow-lg transition-all duration-300",
          isMobileOpen ? "left-[272px]" : "left-4"
        )}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <ChevronLeft className="h-6 w-6" />
        ) : (
          <ChevronRight className="h-6 w-6" />
        )}
      </button>

      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Desktop */}
      <div
        className="hidden lg:flex fixed left-0 w-64 flex-col shadow-lg z-40 bg-sidebar"
        style={{ top: '80px', height: 'calc(100vh - 80px)' }}
      >
        {sidebarContentDesktop}
      </div>

      {/* Sidebar Mobile */}
      <div
        className={cn(
          'fixed left-0 w-64 flex flex-col shadow-lg z-50 bg-sidebar transition-transform duration-300 lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ 
          top: '0', 
          height: '100vh',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {sidebarContentMobile}
      </div>
    </>
  );
};

export default AdminSidebarComplete;