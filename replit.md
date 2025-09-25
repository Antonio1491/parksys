# ParkSys - Parks Management System

## Overview
ParkSys is a comprehensive municipal parks management system designed to streamline the management of parks, activities, volunteers, instructors, assets, and finances. It offers a modern full-stack application with role-based access control and various modules to support diverse park operations. The vision is to provide municipalities with a robust tool to efficiently manage urban green spaces, enhance citizen engagement, and ensure sustainable park operations.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
**2025-09-25:** ENDPOINT CRÍTICO RESTAURADO - Resuelto error 404 en `/api/advertising-management/space-mapping` que causaba fallas del sistema de publicidad en producción. Agregado endpoint con máxima prioridad directamente en servidor principal para garantizar disponibilidad en ambos entornos (desarrollo y producción). Endpoint now respond in ~244ms con datos correctos.
**2025-09-25:** PRODUCCIÓN ESTABILIZADA - Resueltos todos los problemas críticos de producción: (1) Errores de autenticación 401 en /api/users corregidos actualizando middleware Firebase, (2) Errores 404 en space-mapping solucionados con rutas de compatibilidad, (3) Errores JSON en /api/hr/employees arreglados eliminando duplicación de rutas, (4) Calculadora Financiera actualizada con sistema unificado de descuentos y costeo, (5) Módulo de Aprobación de Actividades verificado con todas las características financieras implementadas. Sistema completamente operativo en producción.
**2025-09-25:** SEGURIDAD CRÍTICA - Deshabilitadas rutas públicas de parques en producción por seguridad. Endpoints /api/parks, /api/parks/filter y /api/parks-with-images ahora solo están disponibles en desarrollo, no en producción. Esto previene la exposición no autorizada de datos de parques en sitios de producción como parksys-demo.replit.app.
**2025-09-20:** Implementado exitosamente sistema unificado de descuentos en formulario de edición de eventos - Agregados campos de descuentos (adultos mayores, estudiantes, familias, discapacidad, inscripción temprana) y costeo financiero que aparecen condicionalmente cuando el evento no es gratuito. Migración SQL exitosa para agregar columnas: discount_seniors, discount_students, discount_families, discount_disability, discount_early_bird, discount_early_bird_deadline, cost_recovery_percentage, financial_notes. Formularios de creación y edición ahora tienen paridad completa de funcionalidades.
**2025-09-17:** Resuelto problema crítico de la matriz de permisos - API /api/permissions/system ahora devuelve correctamente 189 permisos granulares con permissionKey válidos en formato modulo:submodulo:pagina:accion. Implementación usando SQL crudo con pool.query para evitar conflictos de mapeo Drizzle/TypeScript. Sistema mantiene 8 acciones reales (view, create, edit, delete, approve, publish, export, import) con endpoints backend operativos para matriz granular.
**2025-09-15:** Implementado sistema robusto de permisos jerárquicos - Estructura module:submodule:page:action con 7 módulos, 27 submódulos, 19 páginas y 8 acciones estándar. Implementación en memoria con seeder completo, storage CRUD, middleware de validación y inicialización automática al arranque del servidor.
**2025-09-12:** Fixed React Query v5 compatibility issues in marketing module - Added missing queryFn implementations to sponsors.tsx, packages.tsx, and benefits.tsx pages. All marketing module queries now properly display existing data from database (sponsors, contracts, packages, benefits).
**2025-09-05:** Sistema de permisos múltiples roles completamente funcional - Resolved critical useAdaptivePermissions hook bug, fixed hardcoded permission checks, implemented proper Super Administrator functionality, cleaned obsolete files and routes. All permission validation now works through unified userHasPermission hook with {"all": true} recognition for Super Admin role.

## System Architecture
The application uses a client-server architecture with a modern full-stack.
**UI/UX Decisions**: Emphasizes a consistent design language with `Card` patterns, standardized iconography, corporate color palettes (e.g., green, blue, orange, purple, teal), and responsive layouts. Design principles include visual-first approaches, intuitive navigation, and clear separation of content. The Admin UI has been standardized with consistent layouts and all sidebar modules have been integrated into the main content flow for improved accessibility and visual coherence.
**Technical Implementations**: Features include dynamic form handling, robust data validation, lazy loading for routes, centralized state management, and optimized image loading. All images are handled via a local multer-based file upload system with dynamic detection for production/development environments and a build-time asset migration script for Vercel deployments. Server health checks are optimized for rapid response and robust detection across various deployment platforms.
**Feature Specifications**:
- **Park Management**: Comprehensive CRUD for parks, amenities, and multimedia. Includes park statistics and a streamlined interface with search-only filters. Park editing and creation support comprehensive field coverage including certifications.
- **Activity Management**: Creation, scheduling, categorization, image management, instructor assignment, public catalog, and a comprehensive status management system (Activa, Programada, Cancelada, Finalizada, En Pausa). Supports both free and paid events with flexible approval workflows.
- **Visitor Management**: Daily and range-based visitor counting, demographic breakdown, and statistical reporting.
- **HR Management**: Employee directory, payroll processing, vacation requests, departmental organization with organigrams, and CSV import/export.
- **Financial Management**: Accounting (SAT codes, journal entries, cash flow matrix), expense/income categories, and budget planning.
- **Asset Management**: Inventory tracking, maintenance scheduling, incident reporting, and asset assignments.
- **Communication & Marketing**: Email campaigns, templates, bulk sending, analytics, and dynamic advertising spaces with impression/click tracking.
- **Volunteer & Instructor Management**: Registration, evaluation, recognition, and profile management with email-based invitation system for instructors. Instructor evaluations module has full feature parity with park evaluations.
- **Concession Management**: Contracts, active concessions, financial integration, and detailed public pages.
- **Security**: Advanced authentication, login attempt tracking, audit logs, password recovery, and a comprehensive role-based access control system with 7 hierarchical roles and granular permissions. Supports multiple roles per user with combined permissions and full compatibility.
- **Tree Management**: Inventory, species catalog, maintenance tracking, and ecological data.
- **Event Management**: General events and specific AMBU events with differentiated forms and cost calculators. Integrates event pricing system.
- **Space Reservations**: Management of reservable spaces with automatic cost calculation and calendar views.
- **Sponsor Management**: Supports a 10-tier gemstone/precious metal sponsorship system with unique icons, color schemes, and graduated benefits.
- **Configuration & Security Maintenance**: Centralized modules for backup, performance monitoring, and system updates.
- **Unified Evaluation System**: Centralized system for parks, instructors, volunteers, and concessionaires evaluations, accessible via `/admin/evaluaciones/`. Includes sample data loading, real-time updates, comprehensive filtering, and CSV export with UTF-8 support.
- **Help Center**: Integrated comprehensive Activities manual accessible through DocumentationViewer component with proper navigation and search capabilities.
- **Calendar Integration**: Unified calendar system for activities and events with dual filtering and unified display.
**System Design Choices**: Single Source of Truth architecture ensures data consistency across modules. Clear separation between organizational users (with login access) and external catalogs. Email-based invitation system for instructor registration with token validation and expiration. Internationalization (i18n) support for multiple languages (Spanish, English, Portuguese) is implemented throughout the application. Error handling is robust with detailed logging and user-friendly notifications. Optimized exclusively for Replit deployment and hosting. Static file serving (images, uploads, fonts, locales) is configured via Express routes for production deployment on Replit infrastructure.
**Client Implementation Strategy**: Comprehensive 16-week implementation roadmap covering ALL system modules for complete municipal transformation, including Gestión, O&M, Admin/Finanzas, Mkt & Comm, RH, and Configuración & Seguridad.

## External Dependencies
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Radix UI (shadcn/ui), React Query, React Router, React Hook Form, Zod.
- **Backend**: Node.js, Express, TypeScript, Multer, bcryptjs.
- **Database**: PostgreSQL, Drizzle ORM, @neondatabase/serverless.
- **Email Services**: Nodemailer (configured with Gmail), Handlebars.
- **Data Handling**: PapaParse.
- **Charting**: Recharts.
- **Scheduling**: node-cron.
- **Routing**: wouter.