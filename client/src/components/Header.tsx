import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import {
  Menu,
  X,
  ChevronDown,
  LogIn,
  HelpCircle,
  FolderOpen,
  Wrench,
  DollarSign,
  Megaphone,
  Users,
  Gauge,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalSearch from "@/components/GlobalSearch";
import { HelpCenter } from "@/components/HelpCenter";
import { LanguageSelector } from "@/components/LanguageSelector";
import UserProfileImage from "@/components/UserProfileImage";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import NotificationBell from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from '@/routes';

const agencyLogo = "/images/logo-pdm.png";

interface NavItem {
  labelKey: string;
  href?: string;
  children?: NavItem[];
}

const publicNavStructure: NavItem[] = [
  {
    labelKey: 'nav.home',
    href: ROUTES.public.home,
  },
  {
    labelKey: 'nav.parks',
    href: ROUTES.public.parks,
  },
  {
    labelKey: 'nav.content',
    children: [
      {
        labelKey: 'nav.activities',
        href: ROUTES.public.activities,
      },
      {
        labelKey: 'nav.events',
        href: ROUTES.public.events,
      },
      {
        labelKey: 'nav.reservations',
        href: ROUTES.public.reservations,
      },
      {
        labelKey: 'nav.calendar',
        href: ROUTES.public.calendar,
      },
      {
        labelKey: 'nav.commercialServices',
        href: ROUTES.public.concessions,
      },
    ],
  },
  {
    labelKey: 'nav.biodiversity',
    children: [
      {
        labelKey: 'nav.treeSpecies',
        href: ROUTES.public.treeSpecies,
      },
      {
        labelKey: 'nav.fauna',
        href: ROUTES.public.fauna,
      },
    ],
  },
  {
    labelKey: 'nav.users',
    children: [
      {
        labelKey: 'nav.volunteers',
        href: ROUTES.public.volunteers,
      },
      {
        labelKey: 'nav.instructors',
        href: ROUTES.public.instructors,
      },
    ],
  },
];

interface AdminNavItem {
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: {
    labelKey: string;
    href: string;
  }[];
}

const adminNavStructure: AdminNavItem[] = [
  {
    labelKey: 'admin.dashboard',
    icon: Gauge,
    href: ROUTES.dashboards.main,
  },
  {
    labelKey: 'admin.management',
    icon: FolderOpen,
    children: [
      { labelKey: 'admin.parks', href: ROUTES.dashboards.parks },
      { labelKey: 'admin.activities', href: ROUTES.dashboards.activities },
      { labelKey: 'admin.amenities', href: ROUTES.dashboards.amenities },
      { labelKey: 'admin.trees', href: ROUTES.dashboards.trees },
      { labelKey: 'admin.visitors', href: ROUTES.dashboards.visitors },
      { labelKey: 'admin.events', href: ROUTES.dashboards.events },
      { labelKey: 'admin.reservations', href: ROUTES.dashboards.reservations },
      { labelKey: 'admin.evaluations', href: ROUTES.dashboards.evaluations },
    ],
  },
  {
    labelKey: 'admin.operations',
    icon: Wrench,
    children: [
      { labelKey: 'admin.assets', href: ROUTES.dashboards.assets },
      { labelKey: 'admin.incidents', href: ROUTES.dashboards.incidents },
      { labelKey: 'admin.warehouse', href: ROUTES.dashboards.warehouse },
      { labelKey: 'admin.volunteers', href: ROUTES.dashboards.volunteers },
    ],
  },
  {
    labelKey: 'admin.finance',
    icon: DollarSign,
    children: [
      { labelKey: 'admin.finance', href: ROUTES.dashboards.finance },
      { labelKey: 'admin.accounting', href: ROUTES.dashboards.accounting },
      { labelKey: 'admin.concessions', href: ROUTES.dashboards.concessions },
    ],
  },
  {
    labelKey: 'admin.marketing',
    icon: Megaphone,
    href: ROUTES.dashboards.marketing,
  },
  {
    labelKey: 'admin.hr',
    icon: Users,
    href: ROUTES.dashboards.hr,
  },
];

const Header: React.FC = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdowns, setMobileDropdowns] = useState<Record<string, boolean>>({});
  const [adminMobileMenuOpen, setAdminMobileMenuOpen] = useState(false);
  const [adminMobileDropdowns, setAdminMobileDropdowns] = useState<Record<string, boolean>>({});
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useUnifiedAuth();
  const isAdmin = location.startsWith("/admin");
  const isActive = (
    href?: string, 
    children?: NavItem[] | { labelKey: string; href: string }[]
  ) => {
    if (!href && !children) return false;

    if (href) {
      if (href === ROUTES.public.home || href === ROUTES.dashboards.main) {
        return location === href;
      }
      return location.startsWith(href);
    }

    if (children) {
      return children.some(child => child.href && location.startsWith(child.href));
    }

    return false;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const toggleMobileDropdown = (key: string) => {
    setMobileDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleAdminMobileMenu = () => {
    setAdminMobileMenuOpen((prev) => !prev);
  };

  const toggleAdminMobileDropdown = (key: string) => {
    setAdminMobileDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 shadow-sm border-b border-gray-200"
      style={{ backgroundColor: isAdmin ? "#f4f5f7" : "white" }}
    >
      <div className="flex items-center h-20">
        {/* Logo administrativo - Solo desktop (posición absoluta) */}
        {isAdmin && (
        <div className="hidden lg:flex absolute left-0 top-0 bottom-0 w-64 items-center justify-center z-10" style={{ backgroundColor: '#f4f5f7' }}>
          <img
            src={agencyLogo}
            alt="Parques de México"
            className="h-16 w-auto object-contain"
          />
        </div>
        )}

        <div className={`${isAdmin ? 'lg:ml-64' : ''} max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full`}>
          <div className="flex items-center justify-between h-20">

            {/* SECCIÓN IZQUIERDA - Logo y navegación */}
            <div className="flex items-center min-w-0">
              {/* Logo público */}
              {!isAdmin && (
                <>
                  <Link href={ROUTES.public.home}>
                    <div className="flex-shrink-0 flex items-center cursor-pointer">
                      <img
                        src={agencyLogo}
                        alt="Parques de México"
                        className="h-16 w-auto"
                      />
                    </div>
                  </Link>

                  {/* Desktop navigation */}
                  <nav className="hidden md:ml-8 md:flex md:space-x-6">
                    {publicNavStructure.map((item) => {
                      const hasChildren = item.children && item.children.length > 0;
                      const active = isActive(item.href, item.children);

                      if (hasChildren) {
                        // Dropdown item
                        return (
                          <div key={item.labelKey} className="relative group">
                            <button
                              className={`border-b-2 pt-1 pb-3 px-1 text-sm font-medium flex items-center ${
                                active
                                  ? "border-primary text-gray-900"
                                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              {t(item.labelKey)}
                              <ChevronDown className="ml-1 h-3 w-3" />
                            </button>

                            {/* Dropdown menu */}
                            <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                              <div className="py-1">
                                {item.children?.map((child) => (
                                  <Link
                                    key={child.labelKey}
                                    href={child.href || '#'}
                                    className={`block px-4 py-2 text-sm ${
                                      location === child.href
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                                  >
                                    {t(child.labelKey)}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Simple link item
                      return (
                        <Link
                          key={item.labelKey}
                          href={item.href || '#'}
                          className={`border-b-2 pt-1 pb-3 px-1 text-sm font-medium ${
                            active
                              ? "border-primary text-gray-900"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {t(item.labelKey)}
                        </Link>
                      );
                    })}
                  </nav>
                </>
              )}

            {/* Logo móvil administrativo */}
            {isAdmin && (
              <Link href={ROUTES.dashboards.main} className="lg:hidden">
                <div className="flex-shrink-0 flex items-center cursor-pointer">
                  <img
                    src={agencyLogo}
                    alt="Parques de México"
                    className="h-12 w-auto object-contain"
                  />
                </div>
              </Link>
            )}
            </div>

            {/* Menús administrativos centralizados - Solo mostrar en páginas administrativas */}
            {isAdmin && (
              <>
                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center rounded-3xl px-4 py-1 shadow-sm absolute left-1/2 transform -translate-x-1/2 bg-accent">
                  {/* Leyenda Métricas */}
                  <div className="text-base font-light text-white mr-4 font-poppins">
                    {t('admin.metrics')}
                  </div>

                  <nav className="flex items-center space-x-4">
                    {adminNavStructure.map((item) => {
                      const Icon = item.icon;
                      const hasChildren = item.children && item.children.length > 0;
                      const active = isActive(item.href, item.children);

                      if (hasChildren) {
                        return (
                          <div key={item.labelKey} className="relative group">
                            <button 
                              className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80 transition-colors"
                              style={{ backgroundColor: active ? "Background" : "transparent" }}
                              title={t(item.labelKey)}
                            >
                              <Icon className={`h-4 w-4 ${active ? "text-[#00444f]" : "text-white"}`} />
                            </button>

                            {/* Dropdown menu */}
                            <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                              <div className="py-1">
                                {item.children?.map((child) => (
                                  <Link
                                    key={child.labelKey}
                                    href={child.href}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                  >
                                    {t(child.labelKey)}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Simple link
                      return (
                        <Link 
                          key={item.labelKey} 
                          href={item.href || '#'} 
                          className="flex flex-col items-center hover:opacity-80"
                          title={t(item.labelKey)}
                        >
                          <div 
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                            style={{ backgroundColor: active ? "Background" : "transparent" }}
                          >
                            <Icon className={`h-4 w-4 ${active ? "text-[#00444f]" : "text-white"}`} />
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Mobile Menu Button */}
                <div className="lg:hidden">
                  <button
                    type="button"
                    className="p-2 rounded-full bg-accent text-background hover:opacity-80 transition-colors"
                    onClick={toggleAdminMobileMenu}
                  >
                    {adminMobileMenuOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Right side - Help, language, user */}
            <div className="flex items-center gap-4">
              {/* Right side - Public */}
              {!isAdmin && (
                <div className="flex items-center gap-2 md:gap-2">
                  {/* Global search */}
                  {!isAuthenticated && (
                    <div className="hidden lg:block max-w-md border rounded-full">
                      <GlobalSearch />
                    </div>
                  )}

                  {isAuthenticated && user ? (
                    // Usuario autenticado en página pública
                    <>
                      {/* Global search */}
                      <div className="hidden lg:block max-w-md border rounded-full">
                        <GlobalSearch />
                      </div>

                      {/* Help Center */}
                      <HelpCenter>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-10 h-10 p-0 rounded-full hover:bg-gray-100"
                          title={t('admin.help')}
                        >
                          <HelpCircle className="!h-5 !w-5 text-gray-600" />
                        </Button>
                      </HelpCenter>

                      {/* Botón para ir al admin */}
                      <Link href={ROUTES.dashboards.main}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hidden rounded-full md:flex w-10 h-10 bg-primary text-background hover:text-gray-600 items-center gap-2"
                        >
                          <LogIn className="!h-5 !w-5" />
                        </Button>
                      </Link>

                      {/* Dropdown del usuario */}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
                          <UserProfileImage
                            userId={user?.id || 0}
                            role={user?.role || "user"}
                            name={user?.username || user?.fullName || user?.displayName || "Usuario"}
                            size="sm"
                          />
                          <div className="hidden md:flex flex-col text-left">
                            <span className="text-sm font-medium text-gray-800">
                              {user?.username || user?.fullName || user?.displayName || "Usuario"}
                            </span>
                            <span className="text-xs text-gray-600">
                              {user?.role || "usuario"}
                            </span>
                          </div>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent 
                          align="end" 
                          side="bottom" 
                          className="w-56 z-[60] transform -translate-x-2"
                          sideOffset={8}
                          alignOffset={-60}
                          avoidCollisions={true}
                          collisionPadding={24}
                          style={{ 
                            maxWidth: 'calc(100vw - 32px)',
                            right: '16px',
                            left: 'auto'
                          }}
                          >
                          <DropdownMenuLabel>{t('admin.myAccount')}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/admin/settings/profile">{t('admin.profile')}</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/admin/user-activity">{t('admin.activity')}</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()}
                            className="focus:bg-transparent hover:bg-transparent p-0"
                          >
                            <LanguageSelector variant="inline" />
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleLogout}>{t('admin.logout')}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
                    // Usuario NO autenticado
                    <>
                      {/* Language Selector */}
                      <div className="hidden md:block">
                        <LanguageSelector variant="dropdown" showLabel={false} className="border text-gray-600 rounded-full h-10 hover:bg-gray-100 hover:text-gray-600"/>
                      </div>
                      {/* Global search */}
                      <div className="hidden lg:block max-w-md border rounded-full">
                        <GlobalSearch />
                      </div>

                      {/* Help Center FAQ*/}
                      <Link href={ROUTES.public.faq}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-10 h-10 p-0 rounded-full hover:bg-gray-100"
                          title={t('admin.help')}
                          aria-label={t('admin.help')}
                        >
                          <HelpCircle className="!h-5 !w-5 text-gray-600" />
                        </Button>
                      </Link>


                      {/* Login Button */}
                      <Link href={ROUTES.auth.login}>
                        <div className="w-10 h-10 bg-primary hover:bg-buttonHover text-background hover:text-foreground rounded-full flex items-center justify-center transition-colors duration-200">
                          <LogIn className="h-5 w-5" />
                        </div>
                      </Link>
                    </>
                  )}
                </div>
              )}

              {/* Right side - Admin */}
              {isAdmin && user && (
                <div className="flex items-center gap-2">
                  {/* Botón de ayuda */}
                  <HelpCenter>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-9 h-9 p-0 rounded-lg border"
                      style={{ backgroundColor: "#f4f5f7", borderColor: "#003D49" }}
                      title={t('admin.help')}
                    >
                      <HelpCircle className="h-6 w-8 text-gray-700" />
                    </Button>
                  </HelpCenter>

                  {/* Botón de notificaciones */}
                  <NotificationBell />

                  {/* Botón para acceder a la página pública */}
                  <Link href="/">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-9 h-9 p-0 rounded-lg border"
                      style={{ backgroundColor: "#f4f5f7", borderColor: "#003D49" }}
                      title={t('admin.publicPage')}
                    >
                      <Home className="h-6 w-8 text-gray-700" />
                    </Button>
                  </Link>

                  {/* Dropdown del usuario */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
                      <UserProfileImage
                        userId={user?.id || 0}
                        role={user?.role || "user"}
                        name={user?.username || user?.fullName || user?.displayName || "Usuario"}
                        size="sm"
                      />
                      <div className="hidden md:flex flex-col text-left">
                        <span className="text-sm font-medium text-gray-800">
                          {user?.username || user?.fullName || user?.displayName || "Usuario"}
                        </span>
                        <span className="text-xs text-gray-600">
                          {user?.role || "usuario"}
                        </span>
                      </div>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent 
                      align="end" 
                      side="bottom"
                      className="w-56 z-[60] transform -translate-x-2"
                      sideOffset={8}
                      alignOffset={-60}
                      avoidCollisions={true}
                      collisionPadding={24}
                      style={{ 
                        maxWidth: 'calc(100vw - 32px)',
                        right: '16px',
                        left: 'auto'
                      }}
                    >
                      <DropdownMenuLabel>{t('admin.myAccount')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/settings/profile">{t('admin.profile')}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/user-activity">{t('admin.activity')}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users/notifications">{t('admin.notifications')}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <LanguageSelector variant="inline"/>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>{t('admin.logout')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* Mobile menu button */}
              {!isAdmin && (
                <button
                  type="button"
                  className="md:hidden ml-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  onClick={toggleMobileMenu}
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {mobileMenuOpen && !isAdmin && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {publicNavStructure.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const active = isActive(item.href, item.children);

              if (hasChildren) {
                return (
                  <div key={item.labelKey} className="space-y-1">
                    <button
                      onClick={() => toggleMobileDropdown(item.labelKey)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium ${
                        active
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {t(item.labelKey)}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          mobileDropdowns[item.labelKey] ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {mobileDropdowns[item.labelKey] && (
                      <div className="ml-4 space-y-1">
                        {item.children?.map((child) => (
                          <Link
                            key={child.labelKey}
                            href={child.href || '#'}
                            className={`block px-3 py-2 rounded-md text-sm font-medium ${
                              location === child.href
                                ? "bg-primary-100 text-primary-800"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {t(child.labelKey)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Items simples sin children
              return (
                <Link
                  key={item.labelKey}
                  href={item.href || '#'}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    active
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Admin Menu */}
      {adminMobileMenuOpen && isAdmin && (
        <div className="lg:hidden" style={{ backgroundColor: "#f4f5f7" }}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {adminNavStructure.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const active = isActive(item.href, item.children);

              if (hasChildren) {
                return (
                  <div key={item.labelKey} className="space-y-1">
                    <button
                      onClick={() => toggleAdminMobileDropdown(item.labelKey)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium ${
                        active
                          ? "bg-[#003d49] text-white"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span>{t(item.labelKey)}</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          adminMobileDropdowns[item.labelKey] ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {adminMobileDropdowns[item.labelKey] && (
                      <div className="ml-4 space-y-1">
                        {item.children?.map((child) => (
                          <Link
                            key={child.labelKey}
                            href={child.href}
                            className={`block px-3 py-2 rounded-md text-sm font-medium ${
                              location === child.href
                                ? "bg-[#003d49] text-white"
                                : "text-gray-600 hover:bg-gray-200"
                            }`}
                            onClick={() => setAdminMobileMenuOpen(false)}
                          >
                            {t(child.labelKey)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.labelKey}
                  href={item.href || '#'}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                    active
                      ? "bg-[#003d49] text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setAdminMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;