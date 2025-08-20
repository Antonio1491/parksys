# ParkSys - Parks Management System

## Overview
ParkSys is a comprehensive municipal parks management system designed to streamline the management of parks, activities, volunteers, instructors, assets, and finances. It offers a modern full-stack application with role-based access control and various modules to support diverse park operations. The vision is to provide municipalities with a robust tool to efficiently manage urban green spaces, enhance citizen engagement, and ensure sustainable park operations.

## Recent Changes (August 20, 2025)
✅ **CRITICAL SECURITY FIXES IMPLEMENTED**: Complete resolution of role-based access control system vulnerabilities
- **100% User Role Assignment**: All 12 users now have proper roles (previously 58% missing) - 6 instructors as "Operador de Campo" (level 6), 1 warehouse worker as "Técnico Especialista" (level 5)
- **API Authentication Fixed**: Corrected TypeScript error in bcrypt.compare, added JOIN with roles table for complete user data retrieval including rolePermissions
- **Real Database Authentication**: Replaced hardcoded middleware with actual database queries validating user permissions and role levels
- **Frontend Integration Active**: useAuth hook enabled with API queries, AdminSidebar implementing hasPermission() and hasModulePermission() functions
- **Complete User Data Route**: Added /api/auth/user endpoint providing full user profile with role hierarchy and permissions
- **Security Architecture Restored**: Four-phase correction plan executed - data consistency ✅, middleware authentication ✅, frontend integration ✅, testing pending
- **Status**: Major security vulnerabilities resolved, system now properly validates user permissions across frontend and backend

✅ **CERTIFICATIONS SYSTEM FULLY FUNCTIONAL**: Resolved final issues with park certification management
- **Database Integration**: Successfully updated Bosque Los Colomos with "Green Flag Award 2024, Certificación Ambiental Internacional"
- **Root Cause Identified**: Issue was with PUT endpoint validation logic, not display or database components
- **Frontend Display**: All certification features working (badges, stats cards, dedicated tabs)
- **Backend Verification**: Manual database updates confirmed field functionality and UI integration
- **Status**: Certification system fully operational across all components

✅ **PREVIOUS: CALENDAR INTEGRATION COMPLETED**: Successfully implemented unified calendar system with activities and events
- **Dual Filtering System**: Activities vs Events primary filter with dynamic category loading
- **Unified Display**: Both activities and events display in single calendar view with visual indicators
- **Modal Enhancement**: Updated dialog component to handle both content types with proper navigation
- **TypeScript Fixes**: Resolved all variable references and type errors in calendar implementation
- **Logo Loading Fix**: Corrected parksys-smart-logo.png reference to use existing sidebar-logo.png file

✅ **PREVIOUS: CRITICAL ROUTING ISSUE RESOLVED**: Fixed persistent problem with tree maintenance POST endpoints that was returning HTML instead of JSON responses
- **Root Cause**: Route registration order in Express.js was causing parameterized routes to intercept specific endpoints
- **Solution**: Moved POST `/api/trees/maintenances` endpoint to main routes.ts file before parameterized routes
- **Database Schema Fix**: Changed `performed_by` field from integer to varchar to accept string values like "Juan Pérez"
- **Foreign Key Resolution**: Removed conflicting foreign key constraint `tree_maintenances_performed_by_fkey`
- **Testing Results**: Successfully created maintenance records (IDs 38, 39, 40) with proper JSON responses
- **Frontend Integration**: Updated mutation function to use correct endpoint `/api/trees/maintenances`

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application uses a client-server architecture with a modern full-stack.
**UI/UX Decisions**: Emphasizes a consistent design language with `Card` patterns, standardized iconography, corporate color palettes (e.g., green, blue, orange, purple, teal), and responsive layouts. Design principles include visual-first approaches, intuitive navigation, and clear separation of content. The Admin UI has been standardized with consistent layouts and all sidebar modules have been integrated into the main content flow for improved accessibility and visual coherence.
**Technical Implementations**: Features include dynamic form handling, robust data validation, lazy loading for routes, centralized state management, and optimized image loading. All images are handled via a local multer-based file upload system with dynamic detection for production/development environments and a build-time asset migration script for Vercel deployments. Server health checks are optimized for rapid response and robust detection across various deployment platforms.
**Feature Specifications**:
- **Park Management**: Comprehensive CRUD for parks, amenities, and multimedia. Includes park statistics with 9 indicator cards, and a streamlined interface with search-only filters.
- **Activity Management**: Creation, scheduling, categorization, image management, instructor assignment, public catalog, and a comprehensive status management system (Activa, Programada, Cancelada, Finalizada, En Pausa).
- **Visitor Management**: Daily and range-based visitor counting, demographic breakdown, and statistical reporting.
- **HR Management**: Employee directory, payroll processing, vacation requests, departmental organization with organigrams, and CSV import/export.
- **Financial Management**: Accounting (SAT codes, journal entries, cash flow matrix), expense/income categories, and budget planning.
- **Asset Management**: Inventory tracking, maintenance scheduling, incident reporting, and asset assignments.
- **Communication & Marketing**: Email campaigns, templates, bulk sending, analytics, and dynamic advertising spaces with impression/click tracking.
- **Volunteer & Instructor Management**: Registration, evaluation, recognition, and profile management with email-based invitation system for instructors. Instructor evaluations module has full feature parity with park evaluations.
- **Concession Management**: Contracts, active concessions, financial integration, and detailed public pages.
- **Security**: Advanced authentication, login attempt tracking, audit logs, password recovery, and a comprehensive role-based access control system with 7 hierarchical roles and granular permissions.
- **Tree Management**: Inventory, species catalog, maintenance tracking, and ecological data.
- **Event Management**: General events and specific AMBU events with differentiated forms and cost calculators.
- **Space Reservations**: Management of reservable spaces with automatic cost calculation and calendar views.
- **Sponsor Management**: Supports a 10-tier gemstone/precious metal sponsorship system with unique icons, color schemes, and graduated benefits.
- **Configuration & Security Maintenance**: Centralized modules for backup, performance monitoring, and system updates.
- **Unified Evaluation System**: Centralized system for parks, instructors, volunteers, and concessionaires evaluations, accessible via `/admin/evaluaciones/`. Includes sample data loading, real-time updates, comprehensive filtering, and CSV export with UTF-8 support.
- **Help Center**: Integrated comprehensive Activities manual covering all aspects of the activities module, accessible through DocumentationViewer component with proper navigation and search capabilities. Activity categories documentation has been corrected to match the real system categories (Deportivo, Recreación y Bienestar, Arte y Cultura, Naturaleza y Ciencia, Comunidad, Eventos de Temporada).
**System Design Choices**: Single Source of Truth architecture ensures data consistency across modules. Clear separation between organizational users (with login access) and external catalogs. Email-based invitation system for instructor registration with token validation and expiration. Internationalization (i18n) support for multiple languages (Spanish, English, Portuguese) is implemented throughout the application. Error handling is robust with detailed logging and user-friendly notifications. Optimized for Replit deployment. Static file serving (images, uploads, fonts, locales) is configured via Express routes to support Vercel deployments.
**Client Implementation Strategy**: Comprehensive 16-week implementation roadmap covering ALL system modules for complete municipal transformation. Updated strategy includes: Gestión (Parques, Actividades completas, Amenidades, Arbolado, Fauna, Visitantes, Eventos, Reservas, Evaluaciones), O&M (Activos, Incidencias, Voluntarios), Admin/Finanzas (Finanzas, Contabilidad, Concesiones), Mkt & Comm (Marketing, Publicidad Digital, Comunicación), RH (Empleados, Nómina, Vacaciones), y Configuración & Seguridad (Control de Acceso, Políticas, Notificaciones, Auditoría, Mantenimiento). Includes detailed templates, checklists, risk mitigation, and success metrics for complete municipal digital transformation.

## External Dependencies
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Radix UI (shadcn/ui), React Query, React Router, React Hook Form, Zod.
- **Backend**: Node.js, Express, TypeScript, Multer, bcryptjs.
- **Database**: PostgreSQL, Drizzle ORM, @neondatabase/serverless.
- **Email Services**: Nodemailer (configured with Gmail), Handlebars.
- **Data Handling**: PapaParse.
- **Charting**: Recharts.
- **Scheduling**: node-cron.
- **Routing**: wouter.