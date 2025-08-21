# ParkSys - Parks Management System

## Overview
ParkSys is a comprehensive municipal parks management system designed to streamline the management of parks, activities, volunteers, instructors, assets, and finances. It offers a modern full-stack application with role-based access control and various modules to support diverse park operations. The vision is to provide municipalities with a robust tool to efficiently manage urban green spaces, enhance citizen engagement, and ensure sustainable park operations.

## Recent Changes (August 21, 2025)
✅ **PARK EDIT FORM FULLY FIXED**: Corrected critical issue with park edit form submission not responding
- **Critical Bug Fixed**: /api/dev/parks/:id endpoint was missing essential park fields (certificaciones, area, administrator, etc.)
- **Root Cause**: Development endpoint only handled basic fields, causing form submissions to fail silently for comprehensive park data
- **Solution**: Extended /api/dev/parks/:id endpoint to handle all park fields including certificaciones, area, greenArea, foundationYear, administrator, conservationStatus, regulationUrl, videoUrl
- **Verification**: Successfully updated test park (ID: 29) with complete data including "Green Flag Award 2024, Certificación ISO 14001" certifications
- **Form Functionality**: "Guardar cambios" button now responds correctly and processes all form fields
- **Impact**: Park edit forms now work completely for all park properties, resolving form submission failures
- **Status**: Complete park editing functionality achieved across all fields and workflows

✅ **PARK CREATION WITH CERTIFICATIONS FULLY FIXED**: Completed critical fix for certification handling in park creation workflow
- **Critical Bug Fixed**: storage.createPark() method was missing certificaciones field in database insertion
- **Root Cause**: Method was inserting all park fields except certificaciones, causing newly created parks to lose certification data
- **Solution**: Added `certificaciones: parkData.certificaciones || null,` to the INSERT VALUES in storage.createPark()
- **Verification**: Successfully created test park (ID: 29) "Parque Test Final Certificaciones" with "Green Flag Award 2024" certification
- **Endpoint Testing**: Both /api/parks and /api/parks/:id/details now correctly handle certifications for new and existing parks
- **Impact**: New parks can now be created with certifications, and certification data persists correctly across all endpoints
- **Status**: Complete certification system functionality achieved for both creation and retrieval workflows

✅ **PREVIOUS: CERTIFICATION API ENDPOINTS FULLY CORRECTED**: Fixed critical inconsistency in park certification data between endpoints
- **Root Cause**: storage.getPark() method was using Drizzle ORM select which wasn't properly including certificaciones field  
- **Solution**: Updated storage.getPark() to use direct SQL query that explicitly includes certificaciones field
- **Endpoint Fix**: Added certificaciones field to /api/parks/:id/details response object
- **Verification**: Both /api/parks/5 and /api/parks/5/details now consistently return: "Green Flag Award 2024, Certificación Ambiental Internacional"
- **Impact**: Park certifications now display correctly in both list views (ExtendedParksList) and individual park tabs (ParkCertificationsTab)
- **Status**: Complete API consistency achieved for park certification data across all endpoints

✅ **PREVIOUS: CALENDAR INTEGRATION COMPLETED**: Successfully implemented unified calendar system with activities and events
- **Dual Filtering System**: Activities vs Events primary filter with dynamic category loading
- **Unified Display**: Both activities and events display in single calendar view with visual indicators  
- **Modal Enhancement**: Updated dialog component to handle both content types with proper navigation
- **TypeScript Fixes**: Resolved all variable references and type errors in calendar implementation
- **Logo Loading Fix**: Corrected parksys-smart-logo.png reference to use existing sidebar-logo.png file

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