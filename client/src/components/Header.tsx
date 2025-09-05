import React, { useState } from "react";
import { Link, useLocation } from "wouter";
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
const logoImage = "/images/logo-ambu.png";
const agencyLogo = "/images/logo-pdm.png";

const Header: React.FC = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contentMenuOpen, setContentMenuOpen] = useState(false);
  const [biodiversityMenuOpen, setBiodiversityMenuOpen] = useState(false);
  const [usersMenuOpen, setUsersMenuOpen] = useState(false);
  const [gestionMenuOpen, setGestionMenuOpen] = useState(false);

  const { user, isAuthenticated, logout } = useUnifiedAuth();
  const isAdmin = location.startsWith("/admin");

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

  const toggleContentMenu = () => {
    setContentMenuOpen((prev) => !prev);
  };

  const toggleBiodiversityMenu = () => {
    setBiodiversityMenuOpen((prev) => !prev);
  };

  const toggleUsersMenu = () => {
    setUsersMenuOpen((prev) => !prev);
  };

  const toggleGestionMenu = () => {
    setGestionMenuOpen((prev) => !prev);
  };

  const isContentActive =
    location === "/activities" ||
    location === "/reservations" ||
    location === "/events" ||
    location === "/calendar" ||
    location === "/concessions";

  const isBiodiversityActive =
    location === "/tree-species" || location === "/fauna";

  const isUsersActive =
    location === "/volunteers" || location === "/instructors";

  // Estados activos para menús administrativos
  const isDashboardActive = location === "/admin";
  const isGestionActive = 
    location.startsWith("/admin/parks") || 
    location.startsWith("/admin/activities") ||
    location.startsWith("/admin/amenities") ||
    location.startsWith("/admin/trees") ||
    location.startsWith("/admin/visitors") ||
    location.startsWith("/admin/events") ||
    location.startsWith("/admin/dashboard-reservas") ||
    location.startsWith("/admin/evaluaciones");
  const isOMActive = 
    location.startsWith("/admin/assets") || 
    location.startsWith("/admin/incidents") || 
    location.startsWith("/admin/volunteers") ||
    location.startsWith("/admin/incidentes") ||
    location.startsWith("/admin/dashboard-incidencias");
  const isFinanzasActive = 
    location.startsWith("/admin/finance") || 
    location.startsWith("/admin/accounting") || 
    location.startsWith("/admin/concessions");
  const isMarketingActive = 
    location.startsWith("/admin/marketing") || 
    location.startsWith("/admin/advertising") || 
    location.startsWith("/admin/communications");
  const isRHActive = location.startsWith("/admin/hr");

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 shadow-sm border-b border-gray-200"
      style={{ backgroundColor: isAdmin ? "#f4f5f7" : "white" }}
    >
      <div className="flex items-center h-20">
        {/* Logo administrativo - Posicionado absolutamente al extremo izquierdo */}
        {isAdmin && (
          <div className="absolute left-0 top-0 bottom-0 w-64 flex items-center justify-center z-10" style={{ backgroundColor: '#f4f5f7' }}>
            <img
              src={agencyLogo}
              alt="Agencia de Bosques Urbanos"
              className="h-16 w-auto object-contain"
            />
          </div>
        )}
        
        <div className={`${isAdmin ? 'ml-64' : ''} max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full`}>
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center min-w-0">
              {/* Logo y navegación - Solo mostrar para páginas públicas */}
              {!isAdmin && (
                <>
                  <Link href="/">
                    <div className="flex-shrink-0 flex items-center cursor-pointer">
                      <img
                        src={agencyLogo}
                        alt="Agencia de Bosques Urbanos"
                        className="h-16 w-auto"
                      />
                    </div>
                  </Link>

                  {/* Desktop navigation */}
                  <nav className="hidden md:ml-8 md:flex md:space-x-6">
                    <Link
                      href="/"
                      className={`border-b-2 pt-1 pb-3 px-1 text-sm font-medium ${
                        location === "/"
                          ? "border-primary text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Inicio
                    </Link>

                    <Link
                      href="/parks"
                      className={`border-b-2 pt-1 pb-3 px-1 text-sm font-medium ${
                        location === "/parks"
                          ? "border-primary text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Parques
                    </Link>

                    {/* Menú de Contenido con dropdown */}
                    <div className="relative group">
                      <button
                        className={`border-b-2 pt-1 pb-3 px-1 text-sm font-medium flex items-center ${
                          isContentActive
                            ? "border-primary text-gray-900"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Contenido
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </button>

                      {/* Dropdown menu */}
                      <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="py-1">
                          <Link
                            href="/activities"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          >
                            Actividades
                          </Link>
                          <Link
                            href="/events"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          >
                            Eventos
                          </Link>
                          <Link
                            href="/reservations"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          >
                            Reservaciones
                          </Link>
                          <Link
                            href="/calendar"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          >
                            Calendario
                          </Link>
                          <Link
                            href="/concessions"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          >
                            Servicios Comerciales
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Menú de Biodiversidad con dropdown */}
                    <div className="relative group">
                      <button
                        className={`border-b-2 pt-1 pb-3 px-1 text-sm font-medium flex items-center ${
                          isBiodiversityActive
                            ? "border-primary text-gray-900"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Biodiversidad
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </button>

                      {/* Dropdown menu */}
                      <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="py-1">
                          <Link
                            href="/tree-species"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          >
                            Especies de Árboles
                          </Link>
                          <Link
                            href="/fauna"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          >
                            Fauna
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Menú de Usuarios con dropdown */}
                    <div className="relative group">
                      <button
                        className={`border-b-2 pt-1 pb-3 px-1 text-sm font-medium flex items-center ${
                          isUsersActive
                            ? "border-primary text-gray-900"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Usuarios
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </button>

                      {/* Dropdown menu */}
                      <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="py-1">
                          <Link
                            href="/volunteers"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          >
                            Voluntarios
                          </Link>
                          <Link
                            href="/instructors"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-900"
                          >
                            Instructores
                          </Link>
                        </div>
                      </div>
                    </div>
                  </nav>
                </>
              )}

            </div>

            {/* Menús administrativos centralizados - Solo mostrar en páginas administrativas */}
            {isAdmin && (
              <div className="flex items-center rounded-3xl px-4 py-1 shadow-sm absolute left-1/2 transform -translate-x-1/2" style={{ backgroundColor: "#003d49" }}>
                    {/* Leyenda Métricas */}
                    <div className="text-base font-light text-white mr-4 font-poppins">
                      Métricas
                    </div>
                    
                    <nav className="flex items-center space-x-4">
                  {/* Menú Dashboard */}
                  <Link href="/admin" className="flex flex-col items-center hover:opacity-80">
                    <div 
                      className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                      style={{ backgroundColor: isDashboardActive ? "#f4f5f7" : "transparent" }}
                    >
                      <Gauge className={`h-4 w-4 ${isDashboardActive ? "text-[#00444f]" : "text-white"}`} />
                    </div>
                  </Link>

                  {/* Menú Gestión */}
                  <div className="relative group">
                    <div className="flex flex-col items-center">
                      <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80 transition-colors"
                        style={{ backgroundColor: isGestionActive ? "#f4f5f7" : "transparent" }}
                      >
                        <FolderOpen className={`h-4 w-4 ${isGestionActive ? "text-[#00444f]" : "text-white"}`} />
                      </button>
                    </div>

                    {/* Dropdown menu */}
                    <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        <Link
                          href="/admin/parks/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Parques
                        </Link>
                        <Link
                              href="/admin/activities/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Actividades
                        </Link>
                        <Link
                        href="/admin/amenities-dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Amenidades
                        </Link>
                        <Link
                        href="/admin/trees/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Arbolado
                        </Link>
                        <Link
                              href="/admin/visitors/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Visitantes
                        </Link>
                        <Link
                              href="/admin/events"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Eventos
                        </Link>
                        <Link
                          href="/admin/dashboard-reservas"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                        Reservas
                        </Link>
                        <Link
                              href="/admin/evaluaciones"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Evaluaciones
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Menú O & M */}
                  <div className="relative group">
                    <div className="flex flex-col items-center">
                      <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80 transition-colors"
                        style={{ backgroundColor: isOMActive ? "#f4f5f7" : "transparent" }}
                      >
                        <Wrench className={`h-4 w-4 ${isOMActive ? "text-[#00444f]" : "text-white"}`} />
                      </button>
                    </div>

                    {/* Dropdown menu */}
                    <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        <Link
                          href="/admin/assets/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Activos
                        </Link>
                        <Link
                          href="/admin/incidents/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Incidencias
                        </Link>
                        <Link
                          href="/admin/volunteers/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Voluntarios
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Menú Admin & Finanzas */}
                  <div className="relative group">
                    <div className="flex flex-col items-center">
                      <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80 transition-colors"
                        style={{ backgroundColor: isFinanzasActive ? "#f4f5f7" : "transparent" }}
                      >
                        <DollarSign className={`h-4 w-4 ${isFinanzasActive ? "text-[#00444f]" : "text-white"}`} />
                      </button>
                    </div>

                    {/* Dropdown menu */}
                    <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        <Link
                          href="/admin/finance/reports"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Finanzas
                        </Link>
                        <Link
                          href="/admin/accounting/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Contabilidad
                        </Link>
                        <Link
                          href="/admin/concessions/reports"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Concesiones
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Menú MKT & Comm */}
                  <Link href="/admin/communications" className="flex flex-col items-center hover:opacity-80">
                    <div 
                      className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                      style={{ backgroundColor: isMarketingActive ? "#f4f5f7" : "transparent" }}
                    >
                      <Megaphone className={`h-4 w-4 ${isMarketingActive ? "text-[#00444f]" : "text-white"}`} />
                    </div>
                  </Link>

                  {/* Menú RH */}
                  <Link href="/admin/hr/dashboard" className="flex flex-col items-center hover:opacity-80">
                    <div 
                      className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                      style={{ backgroundColor: isRHActive ? "#f4f5f7" : "transparent" }}
                    >
                      <Users className={`h-4 w-4 ${isRHActive ? "text-[#00444f]" : "text-white"}`} />
                    </div>
                  </Link>
                </nav>
              </div>
            )}

            {/* Right side - Help, language, user */}
            <div className="flex items-center gap-4">
              {/* Global search - Solo para páginas públicas */}
              {!isAdmin && (
                <div className="hidden lg:block max-w-md">
                  <GlobalSearch />
                </div>
              )}

              {isAdmin && user ? (
                <div className="flex items-center gap-2">
                  {/* Botón de ayuda */}
                  <HelpCenter>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-9 h-9 p-0 rounded-lg border"
                      style={{ backgroundColor: "#f4f5f7", borderColor: "#003D49" }}
                      title="Centro de ayuda"
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
                      title="Ver página pública"
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
                      <div className="flex flex-col text-left">
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
                      className="w-56 z-[60]"
                      sideOffset={12}
                      alignOffset={-20}
                      avoidCollisions={true}
                      collisionPadding={20}
                      collisionBoundary={typeof window !== 'undefined' ? document.body : undefined}
                    >
                      <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/settings/profile">Perfil</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/user-activity">Actividad</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users/notifications">Notificaciones</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <LanguageSelector />
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Link href="/admin/login">
                  <div className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors duration-200 shadow-md hover:shadow-lg">
                    <LogIn className="h-5 w-5 text-white" />
                  </div>
                </Link>
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
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location === "/"
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Inicio
            </Link>

            <Link
              href="/parks"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location === "/parks"
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Parques
            </Link>

            {/* Menú móvil de Contenido */}
            <div className="space-y-1">
              <button
                onClick={toggleContentMenu}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium ${
                  isContentActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Contenido
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${contentMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {contentMenuOpen && (
                <div className="ml-4 space-y-1">
                  <Link
                    href="/activities"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      location === "/activities"
                        ? "bg-primary-100 text-primary-800"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Actividades
                  </Link>

                  <Link
                    href="/events"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      location === "/events"
                        ? "bg-primary-100 text-primary-800"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Eventos
                  </Link>

                  <Link
                    href="/calendar"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      location === "/calendar"
                        ? "bg-primary-100 text-primary-800"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Calendario
                  </Link>

                  <Link
                    href="/concessions"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      location === "/concessions"
                        ? "bg-primary-100 text-primary-800"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Servicios Comerciales
                  </Link>
                </div>
              )}
            </div>

            {/* Menú móvil de Biodiversidad */}
            <div className="space-y-1">
              <button
                onClick={toggleBiodiversityMenu}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium ${
                  isBiodiversityActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Biodiversidad
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${biodiversityMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {biodiversityMenuOpen && (
                <div className="ml-4 space-y-1">
                  <Link
                    href="/tree-species"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      location === "/tree-species"
                        ? "bg-primary-100 text-primary-800"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Especies de Árboles
                  </Link>

                  <Link
                    href="/fauna"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      location === "/fauna"
                        ? "bg-primary-100 text-primary-800"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Fauna
                  </Link>
                </div>
              )}
            </div>

            {/* Menú móvil de Usuarios */}
            <div className="space-y-1">
              <button
                onClick={toggleUsersMenu}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium ${
                  isUsersActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Usuarios
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${usersMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {usersMenuOpen && (
                <div className="ml-4 space-y-1">
                  <Link
                    href="/volunteers"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      location === "/volunteers"
                        ? "bg-primary-100 text-primary-800"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Voluntarios
                  </Link>

                  <Link
                    href="/instructors"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      location === "/instructors"
                        ? "bg-primary-100 text-primary-800"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Instructores
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;