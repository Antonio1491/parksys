# CONTEXTO-PARKSYS
## Documentación Técnica Completa del Sistema de Gestión de Parques Municipales

---

## 📋 TABLA DE CONTENIDOS

1. [Descripción General](#1-descripción-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura de Base de Datos](#4-estructura-de-base-de-datos)
5. [Módulos del Sistema](#5-módulos-del-sistema)
6. [Estructura de Directorios](#6-estructura-de-directorios)
7. [Componentes de UI](#7-componentes-de-ui)
8. [Sistemas de Seguridad](#8-sistemas-de-seguridad)
9. [Integraciones](#9-integraciones)
10. [Flujos de Trabajo](#10-flujos-de-trabajo)
11. [APIs y Endpoints](#11-apis-y-endpoints)
12. [Configuración y Despliegue](#12-configuración-y-despliegue)

---

## 1. DESCRIPCIÓN GENERAL

### 1.1 ¿Qué es ParkSys?

**ParkSys** es un sistema integral de gestión municipal de parques diseñado para optimizar y digitalizar todas las operaciones relacionadas con espacios verdes urbanos. Es una plataforma full-stack moderna que permite a los municipios gestionar de manera eficiente:

- **Infraestructura**: Parques, amenidades, arbolado, fauna
- **Operaciones**: Mantenimiento, incidentes, órdenes de trabajo, almacén
- **Recursos Humanos**: Empleados, nómina, vacaciones, capacitación
- **Finanzas**: Presupuestos, ingresos, gastos, contabilidad SAT
- **Actividades**: Eventos, programas educativos, instructores
- **Comunidad**: Voluntarios, visitantes, evaluaciones públicas
- **Comercio**: Concesiones, patrocinadores, reservaciones de espacios

### 1.2 Propósito y Objetivos

**Propósito Principal**: Proporcionar una herramienta robusta y escalable para la gestión integral de parques municipales, mejorando la eficiencia operativa, la transparencia y el compromiso ciudadano.

**Objetivos Clave**:
- Centralizar toda la información de parques en una única plataforma
- Automatizar procesos administrativos y operativos
- Mejorar la toma de decisiones mediante análisis de datos
- Facilitar la participación ciudadana y la retroalimentación
- Optimizar la gestión de recursos humanos y financieros
- Garantizar la sostenibilidad de espacios verdes urbanos

### 1.3 Usuarios del Sistema

**Usuarios Internos**:
- Administradores del sistema
- Personal de operaciones y mantenimiento
- Recursos humanos
- Departamento financiero
- Coordinadores de actividades
- Guardaparques

**Usuarios Externos**:
- Ciudadanos (visitantes, evaluadores)
- Instructores de actividades
- Voluntarios
- Concesionarios
- Patrocinadores

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Arquitectura General

ParkSys utiliza una **arquitectura cliente-servidor moderna** con las siguientes características:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Frontend)                        │
│  React + TypeScript + Vite + Tailwind CSS + shadcn/ui      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Páginas    │  │ Componentes  │  │   Hooks      │      │
│  │   Públicas   │  │      UI      │  │   React      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         React Query (TanStack Query v5)              │   │
│  │      Cache Management + State Management             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                   SERVIDOR (Backend)                         │
│           Node.js + Express + TypeScript                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Rutas      │  │  Middleware  │  │  Servicios   │      │
│  │   API REST   │  │     Auth     │  │   Email      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Drizzle ORM                             │   │
│  │         Type-safe Database Layer                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL
┌─────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS                             │
│              PostgreSQL (Neon-backed)                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Tablas     │  │  Relaciones  │  │   Índices    │      │
│  │   (90+)      │  │   Foreign    │  │  Optimized   │      │
│  │              │  │     Keys     │  │    Queries   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Principios de Diseño

**Single Source of Truth (SSOT)**:
- Un único sistema de registro para todos los datos
- Evita duplicación y desincronización de información
- Centraliza la lógica de negocio

**Separation of Concerns**:
- Frontend: Presentación y UX
- Backend: Lógica de negocio y persistencia
- Base de datos: Almacenamiento estructurado

**Type Safety**:
- TypeScript en todo el stack (frontend + backend)
- Validación con Zod en ambos lados
- Schemas compartidos entre cliente y servidor

**Performance First**:
- Lazy loading de rutas
- React Query para cache inteligente
- Optimización de consultas SQL
- Endpoints especializados (ej: `/api/parks/filter`)

### 2.3 Patrones de Arquitectura

**MVC Adaptado**:
- Models: Schemas de Drizzle ORM (`shared/schema.ts`)
- Views: Componentes React (`client/src/pages/`, `client/src/components/`)
- Controllers: Rutas Express (`server/*-routes.ts`)

**Repository Pattern**:
- Storage abstraction (`server/storage.ts`)
- Interfaz `IStorage` para operaciones CRUD
- Facilita testing y cambio de implementación

**Service Layer**:
- Servicios especializados (email, file upload, etc.)
- Lógica de negocio reutilizable
- Separación de responsabilidades

---

## 3. STACK TECNOLÓGICO

### 3.1 Frontend

#### Frameworks y Librerías Core
- **React 18**: Librería UI principal
- **TypeScript**: Type safety y mejor DX
- **Vite**: Build tool ultra-rápido
- **Wouter**: Routing ligero (alternativa a React Router)

#### UI y Estilado
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Componentes accesibles headless
- **shadcn/ui**: Colección de componentes pre-diseñados sobre Radix
- **Lucide React**: Librería de iconos
- **React Icons**: Iconos adicionales (especialmente `react-icons/si` para logos)
- **Framer Motion**: Animaciones fluidas

#### State Management y Data Fetching
- **TanStack Query v5** (React Query): 
  - Cache management
  - Server state synchronization
  - Automatic refetching
  - Optimistic updates
- **React Hook Form**: Gestión de formularios
- **Zod**: Validación de schemas

#### Utilidades Frontend
- **date-fns**: Manipulación de fechas
- **recharts**: Gráficos y visualizaciones
- **react-day-picker**: Selectores de fecha
- **react-helmet**: Meta tags SEO
- **i18next**: Internacionalización (ES, EN, PT)
- **DOMPurify**: Sanitización HTML
- **Marked**: Renderizado Markdown

### 3.2 Backend

#### Runtime y Framework
- **Node.js v20**: JavaScript runtime
- **Express**: Framework web minimalista
- **TypeScript**: Tipado estático
- **tsx**: TypeScript execution para Node

#### Database y ORM
- **PostgreSQL**: Base de datos relacional
- **@neondatabase/serverless**: Cliente Postgres serverless
- **Drizzle ORM**: Type-safe ORM
- **Drizzle Kit**: Herramientas de migración

#### Autenticación y Seguridad
- **bcryptjs**: Hashing de passwords
- **express-session**: Gestión de sesiones
- **connect-pg-simple**: Almacenamiento de sesiones en PostgreSQL
- **Passport.js**: Estrategias de autenticación
- **passport-local**: Autenticación local

#### File Management
- **Multer**: Manejo de uploads multipart/form-data
- **@replit/object-storage**: Almacenamiento de archivos en cloud

#### Email y Comunicaciones
- **Nodemailer**: Envío de emails
- **Handlebars**: Templates de emails
- **@sendgrid/mail**: Integración SendGrid

#### Utilidades Backend
- **node-cron**: Tareas programadas
- **PapaParse**: Parsing CSV
- **ExcelJS**: Generación de Excel
- **jsPDF**: Generación de PDFs
- **html-to-text**: Conversión HTML a texto plano

### 3.3 Integraciones Externas

- **Stripe**: Procesamiento de pagos
- **Google Maps API**: Mapas y geolocalización
- **Firebase**: Autenticación complementaria
- **Replit Object Storage**: Almacenamiento de archivos

### 3.4 Herramientas de Desarrollo

- **Vite**: Build tool y dev server
- **ESBuild**: Compilador ultra-rápido
- **PostCSS**: Procesamiento CSS
- **Autoprefixer**: Prefijos CSS automáticos
- **Concurrently**: Ejecución paralela de procesos

---

## 4. ESTRUCTURA DE BASE DE DATOS

### 4.1 Tablas Principales (90+ tablas)

#### **Gestión de Parques**
- `parks`: Información principal de parques
- `park_typology`: Tipologías de parques
- `park_images`: Imágenes de parques
- `park_videos`: Videos de parques
- `park_amenities`: Relación parques-amenidades
- `amenities`: Catálogo de amenidades
- `municipalities`: Municipios

#### **Arbolado y Medio Ambiente**
- `tree_species`: Especies arbóreas
- `trees`: Inventario de árboles
- `tree_maintenances`: Mantenimiento de árboles
- `park_tree_species`: Especies por parque
- `tree_environmental_services`: Servicios ecosistémicos
- `tree_risk_assessments`: Evaluación de riesgos
- `tree_interventions`: Intervenciones forestales
- `fauna_species`: Especies de fauna

#### **Actividades y Eventos**
- `activity_categories`: Categorías de actividades
- `activities`: Actividades/programas educativos
- `activity_images`: Imágenes de actividades
- `activity_registrations`: Inscripciones a actividades
- `activity_registration_history`: Historial de inscripciones
- `activity_financial_decisions`: Decisiones financieras de actividades
- `event_categories`: Categorías de eventos
- `events`: Eventos especiales
- `event_images`: Imágenes de eventos

#### **Recursos Humanos**
- `employees`: Personal del municipio
- `payroll_periods`: Períodos de nómina
- `payroll_details`: Detalles de nómina
- `payroll_concepts`: Conceptos de nómina
- `payroll_receipts`: Recibos de nómina
- `payroll_receipt_details`: Detalles de recibos
- `time_off_requests`: Solicitudes de vacaciones
- `vacation_balances`: Saldos de vacaciones
- `time_records`: Registros de tiempo
- `daily_time_sheets`: Hojas de tiempo diarias
- `work_schedules`: Horarios de trabajo

#### **Finanzas y Contabilidad**
- `income_categories`: Categorías de ingresos
- `expense_categories`: Categorías de gastos
- `budgets`: Presupuestos
- `actual_incomes`: Ingresos reales
- `actual_expenses`: Gastos reales
- `income_records`: Registros de ingresos
- `providers`: Proveedores

#### **Activos y Mantenimiento**
- `asset_categories`: Categorías de activos
- `assets`: Inventario de activos
- `asset_maintenances`: Mantenimientos de activos
- `asset_assignments`: Asignaciones de activos
- `asset_images`: Imágenes de activos

#### **Almacén e Inventario**
- `consumable_categories`: Categorías de consumibles
- `consumables`: Catálogo de consumibles
- `inventory_stock`: Stock de inventario
- `inventory_movements`: Movimientos de inventario
- `requisitions`: Requisiciones
- `requisition_items`: Items de requisiciones

#### **Incidentes y Órdenes de Trabajo**
- `incident_categories`: Categorías de incidentes
- `incident_subcategories`: Subcategorías
- `incidents`: Incidentes reportados
- `incident_comments`: Comentarios de incidentes
- `incident_history`: Historial de incidentes
- `incident_notifications`: Notificaciones

#### **Instructores y Voluntarios**
- `instructors`: Instructores de actividades
- `instructor_invitations`: Invitaciones a instructores
- `instructor_assignments`: Asignaciones de instructores
- `instructor_evaluations`: Evaluaciones de instructores
- `instructor_recognitions`: Reconocimientos
- `instructor_application_campaigns`: Campañas de reclutamiento
- `volunteers`: Voluntarios registrados
- `volunteer_activities`: Actividades de voluntarios
- `volunteer_participations`: Participaciones
- `volunteer_evaluations`: Evaluaciones de voluntarios
- `volunteer_recognitions`: Reconocimientos

#### **Concesiones**
- `concession_types`: Tipos de concesiones
- `concessions`: Concesiones activas
- `concession_contracts`: Contratos
- `concession_locations`: Ubicaciones
- `concession_payments`: Pagos
- `concession_evaluations`: Evaluaciones
- `concession_evaluation_checklists`: Listas de verificación
- `concession_sanctions`: Sanciones
- `concessionaire_profiles`: Perfiles de concesionarios
- `concessionaire_documents`: Documentos
- `contract_payment_configs`: Configuraciones de pago
- `contract_charges`: Cargos
- `contract_investments`: Inversiones
- `contract_bonuses`: Bonificaciones
- `contract_authorized_services`: Servicios autorizados
- `contract_income_reports`: Reportes de ingresos
- `contract_monthly_payments`: Pagos mensuales

#### **Patrocinadores**
- `sponsorship_packages`: Paquetes de patrocinio (10 niveles)
- `sponsorship_benefits`: Beneficios por nivel

#### **Comunicaciones y Marketing**
- `email_templates`: Plantillas de email
- `email_queue`: Cola de emails
- `email_campaigns`: Campañas de email
- `email_logs`: Logs de envío

#### **Seguridad y Acceso**
- `users`: Usuarios del sistema
- `roles`: Roles de usuario
- `user_roles`: Asignación de roles a usuarios
- `pending_users`: Usuarios pendientes de aprobación
- `sessions`: Sesiones activas

#### **Otros**
- `documents`: Documentos del sistema
- `comments`: Comentarios generales

### 4.2 Enumeraciones (Enums)

```typescript
- impact_level: ['bajo', 'medio', 'alto', 'muy_alto']
- payment_status: ['pending', 'paid', 'overdue', 'cancelled', 'refunded']
- payment_type: ['monthly', 'quarterly', 'biannual', 'annual', 'one_time', 'variable']
- evaluation_status: ['draft', 'completed', 'pending_review', 'approved', 'rejected']
- sanction_status: ['pending', 'resolved', 'appealed', 'cancelled']
- change_type: ['creation', 'acquisition', 'updated', 'maintenance', 'retirement', 
                'status_changed', 'location_changed', 'assigned']
```

### 4.3 Relaciones Clave

- **Parks ↔ Amenities**: Many-to-many mediante `park_amenities`
- **Parks ↔ Trees**: One-to-many
- **Activities ↔ Instructors**: Many-to-many mediante `instructor_assignments`
- **Activities ↔ Registrations**: One-to-many
- **Employees ↔ Payroll**: One-to-many
- **Assets ↔ Maintenances**: One-to-many
- **Incidents ↔ Work Orders**: One-to-one o One-to-many
- **Users ↔ Roles**: Many-to-many mediante `user_roles`

---

## 5. MÓDULOS DEL SISTEMA

### 5.1 Módulo de Gestión (Dashboard Principal)
**Ruta**: `/admin`

**Funcionalidades**:
- Dashboard unificado con métricas clave
- Acceso rápido a todos los módulos
- Notificaciones y alertas
- Widgets personalizables

### 5.2 Módulo de Parques
**Rutas**: `/admin/parks/*`, `/parques/*`

**Funcionalidades Admin**:
- CRUD completo de parques
- Gestión de amenidades
- Importación masiva (CSV)
- Carga de imágenes y videos
- Estadísticas de parques
- Certificaciones
- Asignación de tipologías

**Funcionalidades Públicas**:
- Catálogo de parques
- Páginas de detalle por parque
- Sistema de evaluaciones ciudadanas
- Filtrado y búsqueda

**Componentes**:
- `AdminParksDashboard`
- `AdminParks` (listado)
- `AdminParkEdit` (edición)
- `AdminParkView` (vista detallada)
- `ParkLandingPage` (página pública)
- `ParkEvaluationForm`

### 5.3 Módulo de Actividades
**Rutas**: `/admin/activities/*`, `/admin/organizador/*`, `/actividades/*`

**Funcionalidades**:
- Creación y programación de actividades
- Gestión de categorías
- Asignación de instructores
- Sistema de inscripciones
- Calendario unificado
- Gestión de imágenes
- Aprobación financiera (actividades pagas vs gratuitas)
- Catálogo público

**Submódulos**:
- **Instructores**: CRUD, evaluaciones, invitaciones
- **Inscripciones**: Gestión, reportes, historial
- **Calendario**: Vista mensual/semanal, filtros
- **Categorías**: Organización taxonómica

**Componentes Clave**:
- `AdminActivitiesCalendar`
- `ActivityCatalog` (público)
- `ActivityDetailPage`
- `InstructorsList`
- `RegistrationManagement`

### 5.4 Módulo de Eventos
**Rutas**: `/admin/events/*`, `/eventos/*`

**Funcionalidades**:
- Gestión de eventos especiales
- Eventos AMBU (eventos específicos con calculadora de costos)
- Sistema de categorías
- Gestión de participantes
- Integración con calendario
- Registro de voluntarios en eventos

**Componentes**:
- `EventsList`
- `NewEventPage`
- `EditEventPage`
- `EventDetail` (público)
- `EventsCalendar`

### 5.5 Módulo de Reservaciones de Espacios
**Rutas**: `/admin/space-reservations/*`, `/reservaciones/*`

**Funcionalidades**:
- Gestión de espacios reservables
- Calendario de disponibilidad
- Calculadora automática de costos
- Aprobación de reservaciones
- Catálogo público de espacios

**Componentes**:
- `SpacesManagement`
- `ReservationCalendar`
- `SpaceDetail` (público)
- `NewReservation`

### 5.6 Módulo de Visitantes
**Rutas**: `/admin/visitors/*`

**Funcionalidades**:
- Conteo diario de visitantes
- Conteo por rango de fechas
- Desglose demográfico
- Reportes estadísticos
- Dashboard integral

**Componentes**:
- `VisitorDashboard`
- `VisitorCount`
- `VisitorFeedback`

### 5.7 Módulo de Recursos Humanos (HR)
**Rutas**: `/admin/hr/*`

**Funcionalidades**:
- **Empleados**: Directorio, CRUD, organización departamental
- **Nómina**: Procesamiento, recibos, conceptos
- **Vacaciones**: Solicitudes, aprobaciones, saldos
- **Tiempo**: Registros de asistencia, hojas de tiempo
- **Capacitación**: Cursos, certificaciones
- **Bienestar**: Programas de wellness
- **Analytics**: Reportes de RRHH
- **Importación**: CSV de empleados

**Componentes**:
- `EmployeesList`
- `PayrollProcessing`
- `VacationRequests`
- `TimeRecords`
- `HRDashboard`

### 5.8 Módulo Financiero y Contabilidad
**Rutas**: `/admin/finance/*`, `/admin/accounting/*`

**Funcionalidades Finanzas**:
- Planificación presupuestaria
- Gestión de ingresos
- Gestión de gastos
- Catálogo de categorías
- Reportes financieros
- Calculadora financiera
- Aprobación de actividades pagas

**Funcionalidades Contabilidad**:
- Códigos SAT
- Pólizas contables (journal entries)
- Matriz de flujo de efectivo
- Estados financieros
- Balanza de comprobación
- Activos fijos
- Integración con concesiones

**Componentes**:
- `FinanceDashboard`
- `BudgetPlanning`
- `IncomesManagement`
- `ExpensesManagement`
- `AccountingDashboard`
- `JournalEntries`
- `FinancialStatements`

### 5.9 Módulo de Activos
**Rutas**: `/admin/assets/*`

**Funcionalidades**:
- Inventario de activos
- Categorización
- Rastreo de ubicación
- Programación de mantenimiento
- Reporte de incidentes
- Asignación de activos
- Gestión de responsables
- Dashboard de activos
- Calendario de mantenimiento
- Mapa de ubicaciones

**Componentes**:
- `AssetsDashboard`
- `AssetsInventory`
- `AssetMaintenanceCalendar`
- `AssetMap`
- `AssetCategories`
- `ReportIssue`

### 5.10 Módulo de Almacén e Inventario
**Rutas**: `/admin/warehouse/*`

**Funcionalidades**:
- Catálogo de consumibles
- Control de stock
- Movimientos de inventario
- Requisiciones
- Categorías de materiales
- Dashboard de almacén

**Componentes**:
- `WarehouseDashboard`
- `Consumables`
- `Stock`
- `Movements`
- `Requisitions`
- `Categories`

### 5.11 Módulo de Incidentes
**Rutas**: `/admin/incidents/*`

**Funcionalidades**:
- Registro de incidentes
- Categorización y subcategorización
- Asignación de responsables
- Seguimiento de estado
- Comentarios y actualizaciones
- Notificaciones
- Dashboard con gráficos
- Historial completo

**Componentes**:
- `IncidentsDashboard`
- `IncidentsList`
- `DetailedIncidentPage`
- `NewIncident`
- `IncidentCategories`

### 5.12 Módulo de Órdenes de Trabajo
**Rutas**: `/admin/work-orders/*`

**Funcionalidades**:
- Sistema completo de órdenes de trabajo
- Generación automática de folio
- Integración con incidentes
- Integración con activos
- Integración con almacén (requisición de materiales)
- Integración con HR (asignación de personal)
- Gestión de prioridades
- Listas de verificación (checklists)
- Adjuntos de evidencia
- Historial completo
- Cálculo automático de costos
- Dashboard de órdenes

**Componentes**:
- `WorkOrdersDashboard`
- `WorkOrdersList`
- `WorkOrderDetail`
- `NewWorkOrder`

### 5.13 Módulo de Arbolado (Trees)
**Rutas**: `/admin/trees/*`, `/especies-arboreas/*`

**Funcionalidades Admin**:
- Inventario de árboles
- Catálogo de especies
- Rastreo de mantenimiento
- Datos ecológicos
- Servicios ambientales
- Evaluación de riesgos
- Intervenciones forestales
- Mapa interactivo
- Reportes técnicos

**Funcionalidades Públicas**:
- Catálogo de especies
- Páginas de detalle por especie
- Información ecológica

**Componentes**:
- `TreesDashboard`
- `TreeInventory`
- `TreeCatalog`
- `TreeMaintenance`
- `TreeMap`
- `TreeSpeciesDetail` (público)

### 5.14 Módulo de Fauna
**Rutas**: `/admin/fauna/*`, `/fauna/*`

**Funcionalidades**:
- Catálogo de especies de fauna
- Información biológica
- Galería de imágenes
- Página pública de especies

**Componentes**:
- `FaunaSpecies`
- `FaunaList` (público)
- `FaunaDetail` (público)

### 5.15 Módulo de Voluntarios
**Rutas**: `/admin/volunteers/*`, `/voluntarios/*`

**Funcionalidades Admin**:
- Gestión de voluntarios
- Registro y aprobación
- Actividades de voluntariado
- Participaciones
- Evaluaciones
- Reconocimientos
- Dashboard de voluntarios

**Funcionalidades Públicas**:
- Formulario de registro
- Catálogo de voluntarios
- Información de actividades

**Componentes**:
- `VolunteersDashboard`
- `VolunteersList`
- `VolunteerActivities`
- `VolunteerParticipations`
- `VolunteerRegistration` (público)

### 5.16 Módulo de Concesiones
**Rutas**: `/admin/concessions/*`, `/concesiones/*`

**Funcionalidades Admin**:
- Gestión de concesionarios
- Contratos de concesión
- Configuración de pagos
- Pagos mensuales
- Evaluaciones
- Sanciones
- Ubicaciones
- Dashboard híbrido
- Integración financiera

**Funcionalidades Públicas**:
- Catálogo de concesiones
- Páginas detalladas por concesión
- Información de servicios

**Componentes**:
- `ConcessionsDashboard`
- `ConcessionairesList`
- `Contracts`
- `Payments`
- `Evaluations`
- `ConcessionDetail` (público)

### 5.17 Módulo de Patrocinadores
**Rutas**: `/admin/marketing/*`

**Funcionalidades**:
- Sistema de 10 niveles de patrocinio
- Paquetes de beneficios graduados
- Gestión de contratos
- Activos de marketing
- Eventos patrocinados
- Dashboard de patrocinadores

**Componentes**:
- `MarketingDashboard`
- `Sponsors`
- `Packages`
- `Benefits`
- `Contracts`

### 5.18 Módulo de Comunicaciones
**Rutas**: `/admin/communications/*`

**Funcionalidades**:
- Campañas de email
- Plantillas de email
- Envío masivo
- Cola de emails
- Analytics de campañas
- Métricas de apertura/clicks

**Componentes**:
- `EmailCampaigns`
- `EmailTemplates`
- `BulkSending`
- `EmailQueue`
- `CommunicationsAnalytics`

### 5.19 Módulo de Publicidad
**Rutas**: `/admin/advertising/*`

**Funcionalidades**:
- Espacios publicitarios dinámicos
- Gestión de anuncios
- Campañas publicitarias
- Placements (ubicaciones)
- Tracking de impresiones y clicks

**Componentes**:
- `AdvertisingSpaces`
- `Advertisements`
- `Campaigns`
- `Placements`

### 5.20 Módulo de Configuración y Seguridad
**Rutas**: `/admin/configuracion-seguridad/*`

**Funcionalidades**:
- **Control de Acceso**: Gestión de usuarios, roles, permisos
- **Auditoría**: Logs de sistema, auditoría de roles
- **Políticas**: Configuración de políticas de seguridad
- **Mantenimiento**: Backups, rendimiento, actualizaciones
- **Notificaciones**: Configuración de notificaciones admin

**Subcomponentes**:
- `PanelDeControl`
- `ControlDeAcceso`
- `RolesManagement`
- `Auditoria`
- `Politicas`
- `Mantenimiento`

### 5.21 Módulo de Evaluaciones Unificado
**Rutas**: `/admin/evaluaciones/*`

**Funcionalidades**:
- Sistema centralizado de evaluaciones
- Evaluaciones de parques
- Evaluaciones de instructores
- Evaluaciones de voluntarios
- Evaluaciones de concesionarios
- Evaluaciones de actividades
- Evaluaciones de eventos
- Criterios de evaluación
- Filtrado en tiempo real
- Exportación a CSV

**Componentes**:
- `EvaluacionesDashboard`
- `EvaluacionesParques`
- `EvaluacionesInstructores`
- `EvaluacionesVoluntarios`
- `EvaluacionesConcesionarios`

### 5.22 Módulo de Ayuda
**Rutas**: Integrado en interfaz admin

**Funcionalidades**:
- Manual completo de actividades
- Navegación por secciones
- Búsqueda de contenido
- Guías paso a paso

---

## 6. ESTRUCTURA DE DIRECTORIOS

### 6.1 Estructura General

```
ParkSys/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── assets/           # Assets estáticos (imágenes, etc.)
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── ui/          # Componentes shadcn/ui
│   │   │   ├── Header.tsx   # Header público
│   │   │   └── ...
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilidades y configuración
│   │   │   ├── queryClient.ts  # Configuración React Query
│   │   │   └── utils.ts        # Funciones helper
│   │   ├── pages/           # Páginas de la aplicación
│   │   │   ├── admin/       # Páginas administrativas
│   │   │   └── public/      # Páginas públicas
│   │   ├── i18n/            # Configuración i18n
│   │   ├── routes.ts        # Definición de rutas
│   │   ├── App.tsx          # Componente raíz
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Estilos globales
│   └── index.html           # HTML template
├── server/                   # Backend Express
│   ├── routes.ts            # Rutas principales
│   ├── *-routes.ts          # Rutas por módulo
│   ├── storage.ts           # Capa de persistencia
│   ├── db.ts                # Configuración de BD
│   ├── vite.ts              # Integración Vite
│   ├── email-service.ts     # Servicio de email
│   └── index.ts             # Entry point del servidor
├── shared/                   # Código compartido
│   └── schema.ts            # Schemas de Drizzle ORM
├── attached_assets/         # Assets cargados por usuario
├── uploads/                 # Archivos subidos
├── node_modules/            # Dependencias
├── package.json             # Configuración npm
├── tsconfig.json            # Configuración TypeScript
├── vite.config.ts           # Configuración Vite
├── tailwind.config.ts       # Configuración Tailwind
├── drizzle.config.ts        # Configuración Drizzle
├── replit.md                # Documentación del proyecto
└── CONTEXTO-PARKSYS.md      # Este documento
```

### 6.2 Estructura de Páginas Admin

```
client/src/pages/admin/
├── accounting/              # Módulo de contabilidad
├── activities/              # Módulo de actividades
│   ├── instructors/        # Submodulo instructores
│   └── registrations/      # Submodulo inscripciones
├── advertising/             # Módulo de publicidad
├── assets/                  # Módulo de activos
├── communications/          # Módulo de comunicaciones
├── concessions/             # Módulo de concesiones
├── configuracion-seguridad/ # Módulo de seguridad
├── events/                  # Módulo de eventos
├── evaluaciones/            # Módulo de evaluaciones
├── fauna/                   # Módulo de fauna
├── finance/                 # Módulo financiero
├── hr/                      # Módulo de RRHH
├── incidents/               # Módulo de incidentes
├── marketing/               # Módulo de marketing
├── organizador/             # Organizador de actividades
├── parks/                   # Módulo de parques
├── space-reservations/      # Reservaciones de espacios
├── trees/                   # Módulo de arbolado
├── visitors/                # Módulo de visitantes
├── volunteers/              # Módulo de voluntarios
├── warehouse/               # Módulo de almacén
├── work-orders/             # Órdenes de trabajo
└── index.tsx                # Dashboard principal
```

---

## 7. COMPONENTES DE UI

### 7.1 Componentes shadcn/ui Utilizados

```
├── accordion          # Acordeones colapsables
├── alert-dialog       # Diálogos de confirmación
├── avatar             # Avatares de usuario
├── button             # Botones
├── calendar           # Selectores de calendario
├── card               # Tarjetas de contenido
├── checkbox           # Checkboxes
├── dialog             # Diálogos modales
├── dropdown-menu      # Menús desplegables
├── form               # Componentes de formulario
├── input              # Inputs de texto
├── label              # Etiquetas
├── popover            # Popovers
├── progress           # Barras de progreso
├── radio-group        # Grupos de radio buttons
├── scroll-area        # Áreas con scroll
├── select             # Selectores dropdown
├── separator          # Separadores visuales
├── slider             # Sliders
├── switch             # Toggles/switches
├── tabs               # Pestañas
├── textarea           # Áreas de texto
├── toast              # Notificaciones toast
├── tooltip            # Tooltips
└── toaster            # Sistema de toasts
```

### 7.2 Componentes Personalizados

- `Header`: Header público con navegación
- `ProfileCompletionContext`: Context para completitud de perfil
- `Sidebar`: Navegación lateral admin
- `DataTable`: Tablas de datos reutilizables
- `ImageUpload`: Componente de carga de imágenes
- `FileUpload`: Componente de carga de archivos
- `DateRangePicker`: Selector de rango de fechas
- `StatCard`: Tarjetas de estadísticas
- `ChartCard`: Tarjetas con gráficos

### 7.3 Paleta de Colores

```css
:root {
  /* Colores corporativos */
  --green: #10b981;    /* Verde parques */
  --blue: #3b82f6;     /* Azul agua */
  --orange: #f97316;   /* Naranja energía */
  --purple: #8b5cf6;   /* Púrpura creatividad */
  --teal: #14b8a6;     /* Teal naturaleza */
  
  /* Sistema de colores */
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(222.2 84% 4.9%);
  --primary: hsl(142 76% 36%);
  --primary-foreground: hsl(0 0% 100%);
  /* ... más variables */
}
```

---

## 8. SISTEMAS DE SEGURIDAD

### 8.1 Autenticación

**Múltiples Estrategias**:
- Autenticación local (usuario/password)
- Firebase Authentication (complementaria)
- Sistema unificado de autenticación

**Características**:
- Hashing de passwords con bcryptjs
- Sesiones persistentes en PostgreSQL
- Tracking de intentos de login
- Sistema de tokens para invitaciones

### 8.2 Autorización

**Sistema de Roles y Permisos**:
- Roles jerárquicos
- Permisos granulares por módulo
- Matriz de permisos
- Asignación múltiple de roles a usuarios

**Roles Predefinidos**:
- Super Admin
- Administrador
- Coordinador
- Operador
- Guardaparque
- Instructor
- Voluntario
- Usuario público

### 8.3 Auditoría

**Sistema de Logs**:
- Registro de acciones de usuario
- Auditoría de cambios en roles
- Tracking de acceso a módulos
- Historial de modificaciones

**Información Registrada**:
- Usuario que realizó la acción
- Timestamp
- Tipo de acción
- Recursos afectados
- IP de origen

### 8.4 Recuperación de Contraseña

- Sistema de tokens temporales
- Envío de emails de recuperación
- Validación de tokens
- Cambio seguro de contraseña

---

## 9. INTEGRACIONES

### 9.1 Stripe (Pagos)

**Estado**: Configurado, requiere setup
**Uso**:
- Procesamiento de pagos para actividades
- Procesamiento de pagos para reservaciones
- Pagos de concesionarios

**Variables de entorno**:
- `TESTING_STRIPE_SECRET_KEY`
- `TESTING_VITE_STRIPE_PUBLIC_KEY`

### 9.2 Google Maps

**Estado**: Configurado
**Uso**:
- Mapas de ubicación de parques
- Mapa de activos
- Mapa de árboles
- Geolocalización

**Variables de entorno**:
- `VITE_GOOGLE_MAPS_API_KEY`

### 9.3 Replit Object Storage

**Estado**: Instalado y configurado
**Uso**:
- Almacenamiento de imágenes (parques, actividades, eventos)
- Almacenamiento de documentos
- Almacenamiento de currículums de instructores
- Assets públicos y privados

**Directorios**:
- `public/`: Assets públicos
- `.private/`: Archivos privados

### 9.4 Email Services

**Nodemailer + Gmail**:
- Envío de emails transaccionales
- Confirmaciones de registro
- Notificaciones
- Recuperación de contraseña

**SendGrid** (opcional):
- Campañas masivas de email
- Analytics de emails

### 9.5 Firebase

**Uso complementario**:
- Autenticación alternativa
- Notificaciones push (futuro)

---

## 10. FLUJOS DE TRABAJO

### 10.1 Flujo de Registro de Instructor

```
1. Admin crea campaña de reclutamiento
2. Admin genera invitación con token único
3. Sistema envía email con link de registro
4. Instructor accede al link y completa formulario
5. Sistema valida token y crea perfil
6. Admin revisa y aprueba solicitud
7. Instructor recibe credenciales de acceso
```

### 10.2 Flujo de Actividad Paga

```
1. Coordinador crea actividad
2. Coordinador marca como "paga" y establece precio
3. Actividad queda en estado "pendiente_aprobacion"
4. Director financiero revisa y aprueba
5. Actividad se publica en catálogo público
6. Ciudadano se inscribe y paga vía Stripe
7. Sistema confirma inscripción
8. Ciudadano recibe confirmación por email
```

### 10.3 Flujo de Orden de Trabajo

```
1. Se reporta incidente o se programa mantenimiento
2. Supervisor crea orden de trabajo
3. Sistema genera folio automático
4. Se asigna prioridad y responsables (HR)
5. Se requisicionan materiales (Almacén)
6. Personal ejecuta checklist
7. Se adjunta evidencia fotográfica
8. Sistema calcula costos automáticamente
9. Se cierra orden con reporte final
10. Historial queda registrado
```

### 10.4 Flujo de Evaluación Pública de Parque

```
1. Ciudadano visita parque
2. Accede a página del parque vía QR o web
3. Selecciona "Evaluar este parque"
4. Completa formulario de evaluación
5. Sistema guarda evaluación
6. Admin puede ver evaluaciones en dashboard
7. Evaluaciones se muestran en página pública
```

---

## 11. APIS Y ENDPOINTS

### 11.1 Convenciones de API

**Patrón de URLs**:
```
GET    /api/[recurso]              # Listar todos
GET    /api/[recurso]/:id          # Obtener uno
POST   /api/[recurso]              # Crear
PATCH  /api/[recurso]/:id          # Actualizar
DELETE /api/[recurso]/:id          # Eliminar
```

**Endpoints Especiales**:
```
GET    /api/[recurso]/filter       # Listado optimizado
GET    /api/[recurso]/stats        # Estadísticas
POST   /api/[recurso]/bulk         # Operación masiva
GET    /api/[recurso]/export       # Exportar datos
```

### 11.2 Principales Endpoints

#### Parques
- `GET /api/parks` - Listado completo con relaciones (N+1, evitar)
- `GET /api/parks/filter` - Listado optimizado (usar este)
- `GET /api/parks/:id` - Detalle de parque
- `POST /api/parks` - Crear parque
- `PATCH /api/parks/:id` - Actualizar parque
- `DELETE /api/parks/:id` - Eliminar parque

#### Actividades
- `GET /api/activities` - Listado de actividades
- `GET /api/activities/:id` - Detalle de actividad
- `POST /api/activities` - Crear actividad
- `GET /api/activities/calendar` - Vista calendario

#### Instructores
- `GET /api/instructors` - Listado de instructores
- `GET /api/instructors/:id` - Detalle de instructor
- `POST /api/instructors` - Crear instructor
- `PATCH /api/instructors/:id` - Actualizar instructor
- `POST /api/instructors/invite` - Enviar invitación

#### Empleados
- `GET /api/employees` - Listado de empleados
- `POST /api/employees/import` - Importar desde CSV
- `GET /api/payroll/:periodId` - Nómina de período

#### Activos
- `GET /api/assets` - Inventario de activos
- `POST /api/assets/maintenance` - Programar mantenimiento
- `GET /api/assets/map` - Datos para mapa

#### Órdenes de Trabajo
- `GET /api/work-orders` - Listado de órdenes
- `POST /api/work-orders` - Crear orden
- `GET /api/work-orders/:id` - Detalle con historial

### 11.3 Validación de Requests

**Backend**: Validación con Zod schemas
```typescript
const body = insertActivitySchema.parse(req.body);
```

**Frontend**: Validación con React Hook Form + Zod
```typescript
const form = useForm({
  resolver: zodResolver(insertActivitySchema)
});
```

---

## 12. CONFIGURACIÓN Y DESPLIEGUE

### 12.1 Variables de Entorno

```bash
# Base de datos
DATABASE_URL=postgresql://...

# Stripe
TESTING_STRIPE_SECRET_KEY=sk_test_...
TESTING_VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=AIza...

# Frontend
USE_PROD_FRONTEND=false

# Email (configurar según proveedor)
EMAIL_USER=...
EMAIL_PASSWORD=...
```

### 12.2 Scripts de NPM

```json
{
  "dev": "NODE_ENV=development tsx server/index.ts",
  "build": "vite build",
  "start": "NODE_ENV=production tsx server/index.ts",
  "db:push": "drizzle-kit push",
  "db:push --force": "Forzar push con pérdida de datos",
  "db:studio": "drizzle-kit studio"
}
```

### 12.3 Workflow de Desarrollo

1. **Desarrollo local**:
   ```bash
   npm run dev
   ```
   - Inicia servidor Express en modo desarrollo
   - Vite dev server integrado
   - Hot reload automático

2. **Cambios en base de datos**:
   ```bash
   # Editar shared/schema.ts
   npm run db:push
   # o con --force si hay pérdida de datos
   ```

3. **Testing**:
   - Verificar logs del servidor
   - Verificar consola del navegador
   - Probar flujos completos

4. **Despliegue** (Replit):
   - Push a repositorio Git
   - Replit auto-deploy
   - Variables de entorno configuradas en Replit Secrets

### 12.4 Optimizaciones de Producción

**Backend**:
- Compresión gzip
- Caching de consultas frecuentes
- Connection pooling PostgreSQL
- Rate limiting

**Frontend**:
- Code splitting automático (Vite)
- Lazy loading de rutas
- Optimización de imágenes
- Minificación de assets

**Base de Datos**:
- Índices en columnas frecuentes
- Consultas optimizadas
- Endpoints especializados (evitar N+1)

---

## 13. CARACTERÍSTICAS TÉCNICAS AVANZADAS

### 13.1 Internacionalización (i18n)

**Idiomas soportados**:
- Español (ES) - Principal
- Inglés (EN)
- Portugués (PT)

**Implementación**:
- i18next + react-i18next
- Detección automática de idioma del navegador
- Persistencia de preferencia
- Archivos de traducción separados

### 13.2 Sistema de Archivos

**Multer** para uploads:
- Límite de tamaño configurable
- Validación de tipos MIME
- Nombres de archivo seguros
- Almacenamiento en Object Storage

**Tipos de archivos soportados**:
- Imágenes: JPG, PNG, WEBP
- Documentos: PDF, DOC, DOCX
- Hojas de cálculo: XLS, XLSX, CSV

### 13.3 Generación de Reportes

**Formatos**:
- CSV (PapaParse)
- Excel (ExcelJS)
- PDF (jsPDF + jsPDF-AutoTable)

**Tipos de reportes**:
- Reportes de nómina
- Exportación de datos de empleados
- Estadísticas de visitantes
- Reportes financieros
- Inventarios

### 13.4 Sistema de Tareas Programadas

**node-cron**:
- Limpieza de sesiones expiradas
- Recordatorios de mantenimiento
- Procesamiento de nómina automático
- Generación de reportes periódicos

### 13.5 Performance y Caching

**React Query**:
- Cache automático de queries
- Stale-while-revalidate
- Background refetching
- Optimistic updates

**Estrategias de cache**:
```typescript
{
  staleTime: 5 * 60 * 1000,  // 5 minutos
  cacheTime: 30 * 60 * 1000,  // 30 minutos
}
```

---

## 14. PATRONES DE CÓDIGO

### 14.1 Patrón de Componentes React

```typescript
// Imports
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

// Tipos
interface Props {
  // ...
}

// Componente
export default function ComponentName({ prop }: Props) {
  // Hooks
  const [state, setState] = useState();
  
  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['/api/resource'],
  });
  
  // Mutations
  const mutation = useMutation({
    mutationFn: async (data) => {
      // ...
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resource'] });
    },
  });
  
  // Handlers
  const handleAction = () => {
    // ...
  };
  
  // Render
  if (isLoading) return <LoadingState />;
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### 14.2 Patrón de Rutas Express

```typescript
// server/module-routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { insertSchema, type SelectType } from '@shared/schema';

export function registerModuleRoutes(app: Router) {
  // GET all
  app.get('/api/resources', async (req, res) => {
    const data = await storage.getResources();
    res.json(data);
  });
  
  // GET one
  app.get('/api/resources/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const data = await storage.getResource(id);
    res.json(data);
  });
  
  // POST create
  app.post('/api/resources', async (req, res) => {
    const validated = insertSchema.parse(req.body);
    const created = await storage.createResource(validated);
    res.status(201).json(created);
  });
  
  // PATCH update
  app.patch('/api/resources/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const validated = insertSchema.partial().parse(req.body);
    const updated = await storage.updateResource(id, validated);
    res.json(updated);
  });
}
```

### 14.3 Patrón de Schema Drizzle

```typescript
// shared/schema.ts
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
```

---

## 15. MEJORES PRÁCTICAS

### 15.1 Desarrollo Frontend

- ✅ Usar TypeScript para todo
- ✅ Validar formularios con Zod
- ✅ Manejar estados de loading y error
- ✅ Invalidar cache después de mutaciones
- ✅ Usar lazy loading para rutas
- ✅ Agregar `data-testid` a elementos interactivos
- ✅ Seguir guías de diseño en `design_guidelines.md`
- ❌ No usar `process.env` (usar `import.meta.env`)
- ❌ No importar React explícitamente
- ❌ No usar mock data en producción

### 15.2 Desarrollo Backend

- ✅ Validar requests con Zod
- ✅ Manejar errores apropiadamente
- ✅ Usar transacciones para operaciones complejas
- ✅ Implementar rate limiting
- ✅ Logs detallados para debugging
- ❌ No exponer información sensible
- ❌ No ejecutar SQL destructivo sin validación
- ❌ No escribir migraciones manuales (usar `db:push`)

### 15.3 Base de Datos

- ✅ Usar índices en columnas de búsqueda frecuente
- ✅ Mantener consistencia en tipos de ID
- ✅ Usar foreign keys para integridad
- ✅ Documentar enums y relaciones
- ❌ No cambiar tipos de columna ID existentes
- ❌ No hacer queries N+1 (usar joins)
- ❌ No eliminar datos sin backup

---

## 16. ROADMAP Y FUTURAS MEJORAS

### 16.1 Funcionalidades Planificadas

- [ ] App móvil nativa (React Native)
- [ ] Sistema de notificaciones push
- [ ] Dashboard ejecutivo con BI
- [ ] Integración con redes sociales
- [ ] Sistema de gamificación para voluntarios
- [ ] API pública para terceros
- [ ] Análisis predictivo con ML
- [ ] Realidad aumentada para tours de parques

### 16.2 Mejoras Técnicas

- [ ] Migración a PostgreSQL nativo (si aplicable)
- [ ] Implementación de tests unitarios
- [ ] Tests E2E con Playwright
- [ ] CI/CD pipeline
- [ ] Monitoreo con Sentry
- [ ] Análisis de rendimiento con Lighthouse
- [ ] Optimización de bundle size
- [ ] Service Workers para PWA

---

## 17. GLOSARIO TÉCNICO

**Drizzle ORM**: ORM type-safe para TypeScript que genera SQL optimizado

**React Query (TanStack Query)**: Librería para gestión de estado del servidor

**shadcn/ui**: Colección de componentes React accesibles y personalizables

**Wouter**: Router minimalista para React (alternativa ligera a React Router)

**Multer**: Middleware Express para manejar uploads multipart/form-data

**Zod**: Librería de validación de schemas TypeScript-first

**Neon**: Plataforma de PostgreSQL serverless

**Vite**: Build tool y dev server de próxima generación

**Tailwind CSS**: Framework CSS utility-first

**Express**: Framework web minimalista para Node.js

---

## 18. CONTACTO Y SOPORTE

**Documentación del proyecto**: `replit.md`
**Documentación técnica**: `CONTEXTO-PARKSYS.md`
**Guías de diseño**: `design_guidelines.md`

**Recursos externos**:
- [Documentación de Drizzle ORM](https://orm.drizzle.team)
- [Documentación de React Query](https://tanstack.com/query)
- [Documentación de shadcn/ui](https://ui.shadcn.com)
- [Documentación de Tailwind CSS](https://tailwindcss.com)

---

**Versión del documento**: 1.0  
**Última actualización**: Noviembre 2024  
**Sistema**: ParkSys - Parks Management System  
**Stack**: React + TypeScript + Express + PostgreSQL
