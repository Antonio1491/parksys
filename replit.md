# ParkSys - Parks Management System

## Overview
ParkSys is a comprehensive municipal parks management system designed to streamline the management of parks, activities, volunteers, instructors, assets, and finances. Its primary purpose is to provide municipalities with a robust tool to efficiently manage urban green spaces, enhance citizen engagement, and ensure sustainable park operations. The system features a modern full-stack application with role-based access control and various modules to support diverse park operations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application utilizes a client-server architecture with a modern full-stack implementation.

**UI/UX Decisions**: The system emphasizes a consistent design language using `Card` patterns, standardized iconography, and a corporate color palette (green, blue, orange, purple, teal). It features responsive layouts, intuitive navigation, and a visual-first approach. The Admin UI is standardized with consistent layouts, and all sidebar modules are integrated into the main content flow for improved accessibility.

**Technical Implementations**: Key technical aspects include dynamic form handling, robust data validation, lazy loading for routes, centralized state management, and optimized image loading via a local multer-based file upload system. Server health checks are optimized for rapid response.

**Feature Specifications**:
- **Park Management**: Comprehensive CRUD operations for parks, amenities, and multimedia, including park statistics and certifications.
- **Activity Management**: Creation, scheduling, categorization, image management, instructor assignment, and a public catalog with a comprehensive status management system. Supports both free and paid events with approval workflows.
- **Visitor Management**: Daily and range-based visitor counting, demographic breakdown, and statistical reporting.
- **HR Management**: Employee directory, payroll processing, vacation requests, departmental organization, and CSV import/export.
- **Financial Management**: Accounting (SAT codes, journal entries, cash flow matrix), expense/income categories, and budget planning.
- **Asset Management**: Inventory tracking, maintenance scheduling, incident reporting, and asset assignments.
- **Work Orders Management**: A complete system integrating incidents, assets, warehouse, and HR, featuring folio generation, priority management, material tracking, checklist execution, evidence attachments, and full history logging with automatic cost calculation.
- **Communication & Marketing**: Email campaigns, templates, bulk sending, analytics, and dynamic advertising spaces with impression/click tracking.
- **Volunteer & Instructor Management**: Registration, evaluation, recognition, and profile management with an email-based invitation system.
- **Concession Management**: Contracts, active concessions, financial integration, and detailed public pages.
- **Security**: Advanced authentication, login attempt tracking, audit logs, password recovery, and a comprehensive role-based access control system with hierarchical roles and granular permissions.
- **Tree Management**: Inventory, species catalog, maintenance tracking, and ecological data.
- **Event Management**: General and specific AMBU events with differentiated forms and cost calculators, including an integrated event pricing system.
- **Space Reservations**: Management of reservable spaces with automatic cost calculation and calendar views.
- **Sponsor Management**: Supports a 10-tier sponsorship system with unique icons, color schemes, and graduated benefits.
- **Configuration & Security Maintenance**: Centralized modules for backup, performance monitoring, and system updates.
- **Unified Evaluation System**: Centralized system for parks, instructors, volunteers, and concessionaires evaluations with real-time updates, filtering, and CSV export.
- **Help Center**: Integrated comprehensive Activities manual with navigation and search capabilities.
- **Calendar Integration**: Unified calendar system for activities and events with dual filtering.

**System Design Choices**: Adheres to a Single Source of Truth architecture for data consistency. Features a clear separation between organizational users and external catalogs. Employs an email-based invitation system for instructor registration with token validation. Supports Internationalization (i18n) for Spanish, English, and Portuguese. Error handling includes detailed logging and user-friendly notifications. The system is optimized for Replit deployment and hosting, with static file serving configured via Express routes.

## External Dependencies
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Radix UI (shadcn/ui), React Query, React Router, React Hook Form, Zod.
- **Backend**: Node.js, Express, TypeScript, Multer, bcryptjs.
- **Database**: PostgreSQL, Drizzle ORM, @neondatabase/serverless.
- **Email Services**: Nodemailer (configured with Gmail), Handlebars.
- **Data Handling**: PapaParse.
- **Charting**: Recharts.
- **Scheduling**: node-cron.
- **Routing**: wouter.