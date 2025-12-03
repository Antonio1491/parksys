# ESTRUCTURA-PARKSYS
## Esquema Completo de Archivos del Sistema

---

## ESTRUCTURA RAÍZ DEL PROYECTO

```
ParkSys/
│
├── 📁 client/                     # Frontend React
├── 📁 server/                     # Backend Express
├── 📁 shared/                     # Código compartido (schemas)
├── 📁 attached_assets/            # Assets cargados por usuarios
├── 📁 docs/                       # Documentación
├── 📁 exports/                    # Archivos de exportación
├── 📁 migrations/                 # Migraciones (legacy)
├── 📁 public/                     # Archivos públicos estáticos
├── 📁 scripts/                    # Scripts de utilidad
├── 📁 uploads/                    # Archivos subidos
│
├── 📄 .dockerignore               # Ignorar archivos para Docker
├── 📄 .env                        # Variables de entorno
├── 📄 .gitignore                  # Ignorar archivos para Git
├── 📄 .replit                     # Configuración de Replit
├── 📄 .vercelignore               # Ignorar archivos para Vercel
├── 📄 components.json             # Configuración shadcn/ui
├── 📄 CONFIGURAR_GMAIL.md         # Guía de configuración Gmail
├── 📄 CONTEXTO-PARKSYS.md         # Documentación técnica completa
├── 📄 ESTRUCTURA-PARKSYS.md       # Este archivo
├── 📄 Dockerfile                  # Configuración Docker
├── 📄 drizzle.config.ts           # Configuración Drizzle ORM
├── 📄 package.json                # Dependencias npm
├── 📄 package-lock.json           # Lock de dependencias
├── 📄 postcss.config.js           # Configuración PostCSS
├── 📄 quick-start-guide.md        # Guía de inicio rápido
├── 📄 replit.md                   # Documentación del proyecto
├── 📄 tailwind.config.ts          # Configuración Tailwind CSS
├── 📄 tsconfig.json               # Configuración TypeScript
└── 📄 vite.config.ts              # Configuración Vite
```

---

## 📁 CLIENT (Frontend)

```
client/
│
├── 📁 public/                              # Assets públicos estáticos
│   ├── 📄 download-background.jpg
│   ├── 📄 image-transformer.webp
│   ├── 📄 jardin-japones.jpg
│   └── 📄 parksys-logo-final.png
│
└── 📁 src/                                 # Código fuente
    │
    ├── 📁 assets/                          # Assets del proyecto
    │   └── 📄 gatorade-banner.svg
    │
    ├── 📁 components/                      # Componentes reutilizables
    │   │
    │   ├── 📁 admin/                       # Componentes administrativos
    │   │   └── 📁 advertising/
    │   │       ├── 📄 AdvertisementForm.tsx
    │   │       ├── 📄 CampaignDialog.tsx
    │   │       ├── 📄 CampaignForm.tsx
    │   │       ├── 📄 PlacementDialog.tsx
    │   │       ├── 📄 PlacementForm.tsx
    │   │       └── 📄 SpaceForm.tsx
    │   │
    │   ├── 📁 roles/                       # Componentes de roles
    │   │   ├── 📄 RoleBadge.tsx
    │   │   ├── 📄 RoleCreationModal.tsx
    │   │   └── 📄 RoleGuard.tsx
    │   │
    │   ├── 📁 ui/                          # Componentes shadcn/ui
    │   │   ├── 📄 accordion.tsx
    │   │   ├── 📄 alert-dialog.tsx
    │   │   ├── 📄 alert.tsx
    │   │   ├── 📄 amenity-icon.tsx
    │   │   ├── 📄 aspect-ratio.tsx
    │   │   ├── 📄 avatar.tsx
    │   │   ├── 📄 badge.tsx
    │   │   ├── 📄 breadcrumb.tsx
    │   │   ├── 📄 button.tsx
    │   │   ├── 📄 calendar.tsx
    │   │   ├── 📄 card.tsx
    │   │   ├── 📄 carousel.tsx
    │   │   ├── 📄 chart.tsx
    │   │   ├── 📄 checkbox.tsx
    │   │   ├── 📄 checkout-form.tsx
    │   │   ├── 📄 collapsible.tsx
    │   │   ├── 📄 command.tsx
    │   │   ├── 📄 context-menu.tsx
    │   │   ├── 📄 dashboard-layout.tsx
    │   │   ├── 📄 date-picker.tsx
    │   │   ├── 📄 dialog.tsx
    │   │   ├── 📄 drawer.tsx
    │   │   ├── 📄 dropdown-menu.tsx
    │   │   ├── 📄 export-button.tsx
    │   │   ├── 📄 export-config-form.tsx
    │   │   ├── 📄 form.tsx
    │   │   ├── 📄 graphic-card.tsx
    │   │   ├── 📄 hover-card.tsx
    │   │   ├── 📄 input-otp.tsx
    │   │   ├── 📄 input.tsx
    │   │   ├── 📄 label.tsx
    │   │   ├── 📄 map-selector.tsx
    │   │   ├── 📄 map-viewer.tsx
    │   │   ├── 📄 menubar.tsx
    │   │   ├── 📄 metric-card.tsx
    │   │   ├── 📄 navigation-menu.tsx
    │   │   ├── 📄 page-header.tsx
    │   │   ├── 📄 pagination.tsx
    │   │   ├── 📄 park-star-rating-chart.tsx
    │   │   ├── 📄 permissions-hierarchical-matrix.tsx
    │   │   ├── 📄 permissions-matrix.tsx
    │   │   ├── 📄 popover.tsx
    │   │   ├── 📄 progress.tsx
    │   │   ├── 📄 radio-group.tsx
    │   │   ├── 📄 resizable.tsx
    │   │   ├── 📄 return-header.tsx
    │   │   ├── 📄 scroll-area.tsx
    │   │   ├── 📄 select.tsx
    │   │   ├── 📄 separator.tsx
    │   │   ├── 📄 sheet.tsx
    │   │   ├── 📄 sidebar.tsx
    │   │   ├── 📄 skeleton.tsx
    │   │   ├── 📄 slider.tsx
    │   │   ├── 📄 stripe-checkout.tsx
    │   │   ├── 📄 switch.tsx
    │   │   ├── 📄 table.tsx
    │   │   ├── 📄 tabs.tsx
    │   │   ├── 📄 textarea.tsx
    │   │   ├── 📄 toast.tsx
    │   │   ├── 📄 toaster.tsx
    │   │   ├── 📄 toggle-group.tsx
    │   │   ├── 📄 toggle.tsx
    │   │   ├── 📄 toolbar.tsx
    │   │   ├── 📄 tooltip.tsx
    │   │   ├── 📄 tree-species-icon.tsx
    │   │   └── 📄 vertical-bar-chart.tsx
    │   │
    │   ├── 📄 ActivityImageManagerSimple.tsx
    │   ├── 📄 ActivityInstructorSection.tsx
    │   ├── 📄 ActivityPaymentForm.tsx
    │   ├── 📄 AdminHeader.tsx
    │   ├── 📄 AdminLayout.tsx
    │   ├── 📄 AdminRouteWrapper.tsx
    │   ├── 📄 AdminSidebarComplete.tsx
    │   ├── 📄 AdSpaceIntelligent.tsx
    │   ├── 📄 AmenityIcon.tsx
    │   ├── 📄 AmenitySelector.tsx
    │   ├── 📄 AreaTreesMap.tsx
    │   ├── 📄 AssetImageManager.tsx
    │   ├── 📄 ConcessionImageManager.tsx
    │   ├── 📄 CostingSection.tsx
    │   ├── 📄 DocumentationViewer.tsx
    │   ├── 📄 DynamicAdminLayout.tsx
    │   ├── 📄 DynamicRoleGuard.tsx
    │   ├── 📄 EmptyState.tsx
    │   ├── 📄 ErrorState.tsx
    │   ├── 📄 EventImageUploader.tsx
    │   ├── 📄 EventPaymentForm.tsx
    │   ├── 📄 EventRegistrationForm.tsx
    │   ├── 📄 ExtendedParksList.tsx
    │   ├── 📄 FirebaseLoginForm.tsx
    │   ├── 📄 Footer.tsx
    │   ├── 📄 GlobalSearch.tsx
    │   ├── 📄 Header.tsx
    │   ├── 📄 HelpCenter.tsx
    │   ├── 📄 HybridLoginForm.tsx
    │   ├── 📄 ImageUploader.tsx
    │   ├── 📄 IncidentCard.tsx
    │   ├── 📄 IncidentReportForm.tsx
    │   ├── 📄 InstructorActivitiesList.tsx
    │   ├── 📄 InstructorCard.tsx
    │   ├── 📄 InstructorEditDialog.tsx
    │   ├── 📄 InstructorEvaluationDialog.tsx
    │   ├── 📄 InstructorEvaluationForm.tsx
    │   ├── 📄 InstructorEvaluationsList.tsx
    │   ├── 📄 InstructorProfileDialog.tsx
    │   ├── 📄 LanguageSelector.tsx
    │   ├── 📄 LeafletMap.tsx
    │   ├── 📄 LoadingPage.tsx
    │   ├── 📄 LoadingSpinner.tsx
    │   ├── 📄 LoadingState.tsx
    │   ├── 📄 LocationSelector.tsx
    │   ├── 📄 MultiRoleBadge.tsx
    │   ├── 📄 NotificationBell.tsx
    │   ├── 📄 ObjectUploader.tsx
    │   ├── 📄 ParkActivitiesManager.tsx
    │   ├── 📄 ParkAmenitiesManager.tsx
    │   ├── 📄 ParkAssetsInventory.tsx
    │   ├── 📄 ParkCard.tsx
    │   ├── 📄 ParkDetail.tsx
    │   ├── 📄 ParkEvaluationsSection.tsx
    │   ├── 📄 ParkEvaluationsSectionSimple.tsx
    │   ├── 📄 ParkImageManager.tsx
    │   ├── 📄 ParkIncidentsInventory.tsx
    │   ├── 📄 ParkMultimediaManager.tsx
    │   ├── 📄 ParkMultimediaViewer.tsx
    │   ├── 📄 ParkQuickActions.tsx
    │   ├── 📄 ParksDashboardMap.tsx
    │   ├── 📄 ParksList.tsx
    │   ├── 📄 ParksMap.tsx
    │   ├── 📄 ParkTreesInventory.tsx
    │   ├── 📄 ParkTreeSpeciesManager.tsx
    │   ├── 📄 ParkVolunteersInventory.tsx
    │   ├── 📄 ParkVolunteersManager.tsx
    │   ├── 📄 ProfileCompletionContext.tsx
    │   ├── 📄 ProfileCompletionIndicator.tsx
    │   ├── 📄 ProtectedRoute.tsx
    │   ├── 📄 PublicInstructorEvaluationForm.tsx
    │   ├── 📄 PublicLayout.tsx
    │   ├── 📄 RoleBadge.tsx
    │   ├── 📄 RoleBasedSidebar.tsx
    │   ├── 📄 RoleTestComponent.tsx
    │   ├── 📄 ScheduleConfiguration.tsx
    │   ├── 📄 SidebarSearch.tsx
    │   ├── 📄 SimpleMap.tsx
    │   ├── 📄 SpaceMediaManager.tsx
    │   ├── 📄 SpacePaymentForm.tsx
    │   ├── 📄 Spinner.tsx
    │   ├── 📄 TranslationDemo.tsx
    │   ├── 📄 TreePhotoViewer.tsx
    │   ├── 📄 UnifiedDiscountSelector.tsx
    │   ├── 📄 UnifiedPaymentForm.tsx
    │   ├── 📄 UserActivityCalendar.tsx
    │   ├── 📄 UserAvatar.tsx
    │   ├── 📄 UserParksSection.tsx
    │   └── 📄 UserProfileImage.tsx
    │
    ├── 📁 config/                          # Configuraciones
    │   ├── 📄 adminSidebarStructure.ts
    │   ├── 📄 routePermissions.ts
    │   ├── 📄 sidebarConfig.ts
    │   └── 📄 sidebarSubmenus.ts
    │
    ├── 📁 hooks/                           # Custom React Hooks
    │   ├── 📄 use-activity-payment.ts
    │   ├── 📄 use-export.ts
    │   ├── 📄 use-mobile.tsx
    │   ├── 📄 use-stripe-payment.ts
    │   ├── 📄 use-toast.ts
    │   ├── 📄 useAdaptiveModules.tsx
    │   ├── 📄 useAdaptivePermissions.tsx
    │   ├── 📄 useAdaptiveRoles.tsx
    │   ├── 📄 useArrayQuery.ts
    │   ├── 📄 useAuth.ts
    │   ├── 📄 useFirebaseAuth.ts
    │   ├── 📄 useHybridAuth.ts
    │   ├── 📄 useRouteGuard.ts
    │   ├── 📄 useTranslation.ts
    │   └── 📄 useUnifiedAuth.ts
    │
    ├── 📁 i18n/                            # Internacionalización
    │   └── 📄 index.ts
    │
    ├── 📁 lib/                             # Utilidades y configuración
    │   ├── 📄 api-utils.ts
    │   ├── 📄 authHelper.ts
    │   ├── 📄 constants.ts
    │   ├── 📄 firebase.ts
    │   ├── 📄 queryClient.ts
    │   ├── 📄 schedule-utils.ts
    │   └── 📄 utils.ts
    │
    ├── 📁 pages/                           # Páginas de la aplicación
    │   │
    │   ├── 📁 accounting/                  # Contabilidad (público)
    │   │   ├── 📄 categories.tsx
    │   │   ├── 📄 dashboard.tsx
    │   │   ├── 📄 financial-statements.tsx
    │   │   ├── 📄 fixed-assets.tsx
    │   │   ├── 📄 integration.tsx
    │   │   ├── 📄 journal-entries.tsx
    │   │   ├── 📄 transactions.tsx
    │   │   └── 📄 trial-balance.tsx
    │   │
    │   ├── 📁 admin/                       # Páginas administrativas
    │   │   │
    │   │   ├── 📁 accounting/              # Contabilidad admin
    │   │   │   ├── 📄 categories.tsx
    │   │   │   ├── 📄 dashboard.tsx
    │   │   │   ├── 📄 financial-statements.tsx
    │   │   │   ├── 📄 fixed-assets.tsx
    │   │   │   ├── 📄 integration.tsx
    │   │   │   ├── 📄 journal-entries.tsx
    │   │   │   ├── 📄 transactions.tsx
    │   │   │   └── 📄 trial-balance.tsx
    │   │   │
    │   │   ├── 📁 activities/              # Actividades
    │   │   │   ├── 📁 instructors/
    │   │   │   │   ├── 📄 detail.tsx
    │   │   │   │   ├── 📄 edit.tsx
    │   │   │   │   ├── 📄 index.tsx
    │   │   │   │   └── 📄 new.tsx
    │   │   │   ├── 📁 registrations/
    │   │   │   │   ├── 📄 detail.tsx
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📄 activity-images.tsx
    │   │   │   ├── 📄 calendar.tsx
    │   │   │   ├── 📄 categories.tsx
    │   │   │   └── 📄 images.tsx
    │   │   │
    │   │   ├── 📁 advertising/             # Publicidad
    │   │   │   ├── 📁 advertisements/
    │   │   │   │   ├── 📄 edit.tsx
    │   │   │   │   ├── 📄 index.tsx
    │   │   │   │   └── 📄 new.tsx
    │   │   │   ├── 📁 campaigns/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 placements/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   └── 📁 spaces/
    │   │   │       ├── 📄 edit.tsx
    │   │   │       ├── 📄 index.tsx
    │   │   │       └── 📄 new.tsx
    │   │   │
    │   │   ├── 📁 assets/                  # Activos
    │   │   │   ├── 📁 assignments/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 categories/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 inventory/
    │   │   │   │   ├── 📄 index.tsx
    │   │   │   │   └── 📄 index_backup.tsx
    │   │   │   ├── 📁 maintenance/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📄 [id].tsx
    │   │   │   ├── 📄 assign-equipment.tsx
    │   │   │   ├── 📄 assign-manager.tsx
    │   │   │   ├── 📄 dashboard-fixed.tsx
    │   │   │   ├── 📄 dashboard-static.tsx
    │   │   │   ├── 📄 dashboard.tsx
    │   │   │   ├── 📄 edit-basic.tsx
    │   │   │   ├── 📄 edit-enhanced.tsx
    │   │   │   ├── 📄 edit-location.tsx
    │   │   │   ├── 📄 edit-simple.tsx
    │   │   │   ├── 📄 edit.tsx
    │   │   │   ├── 📄 index.tsx
    │   │   │   ├── 📄 maintenance-calendar-simple.tsx
    │   │   │   ├── 📄 maintenance-calendar-static.tsx
    │   │   │   ├── 📄 maintenance-calendar.tsx
    │   │   │   ├── 📄 map-simple.tsx
    │   │   │   ├── 📄 map.tsx
    │   │   │   ├── 📄 new.tsx
    │   │   │   ├── 📄 report-issue.tsx
    │   │   │   └── 📄 schedule-maintenance.tsx
    │   │   │
    │   │   ├── 📁 communications/          # Comunicaciones
    │   │   │   ├── 📄 analytics.tsx
    │   │   │   ├── 📄 bulk.tsx
    │   │   │   ├── 📄 campaigns.tsx
    │   │   │   ├── 📄 components.tsx
    │   │   │   ├── 📄 index.tsx
    │   │   │   ├── 📄 queue.tsx
    │   │   │   └── 📄 templates.tsx
    │   │   │
    │   │   ├── 📁 concessions/             # Concesiones
    │   │   │   ├── 📁 catalog/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 concessionaires/
    │   │   │   │   ├── 📄 ConcessionairesTabbed.tsx
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 contracts/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 evaluations/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 locations/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 payments/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📄 dashboard.tsx
    │   │   │   └── 📄 hybrid-payments.tsx
    │   │   │
    │   │   ├── 📁 configuracion-seguridad/ # Seguridad
    │   │   │   ├── 📁 access/
    │   │   │   │   └── 📄 users.tsx
    │   │   │   ├── 📁 audit/
    │   │   │   │   ├── 📄 index.tsx
    │   │   │   │   └── 📄 role-audits.tsx
    │   │   │   ├── 📁 componentes/
    │   │   │   │   └── 📄 RolesManagement.tsx
    │   │   │   ├── 📄 Auditoria.tsx
    │   │   │   ├── 📄 ControlDeAcceso.tsx
    │   │   │   ├── 📄 ExportacionesConfig.tsx
    │   │   │   ├── 📄 Mantenimiento.tsx
    │   │   │   ├── 📄 NotificacionesAdmin.tsx
    │   │   │   ├── 📄 PanelDeControl.tsx
    │   │   │   └── 📄 Politicas.tsx
    │   │   │
    │   │   ├── 📁 configuration/           # Configuración
    │   │   │   ├── 📄 backups.tsx
    │   │   │   └── 📄 security.tsx
    │   │   │
    │   │   ├── 📁 evaluaciones/            # Evaluaciones
    │   │   │   ├── 📄 actividades.tsx
    │   │   │   ├── 📄 concesionarios.tsx
    │   │   │   ├── 📄 criterios.tsx
    │   │   │   ├── 📄 dashboard.tsx
    │   │   │   ├── 📄 eventos.tsx
    │   │   │   ├── 📄 index.tsx
    │   │   │   ├── 📄 instructores.tsx
    │   │   │   ├── 📄 parques.tsx
    │   │   │   └── 📄 voluntarios.tsx
    │   │   │
    │   │   ├── 📁 eventos-ambu/            # Eventos AMBU
    │   │   │   ├── 📄 calendar.tsx
    │   │   │   ├── 📄 categorias.tsx
    │   │   │   ├── 📄 detail.tsx
    │   │   │   └── 📄 edit.tsx
    │   │   │
    │   │   ├── 📁 events/                  # Eventos
    │   │   │   ├── 📁 participants/
    │   │   │   │   └── 📄 [id].tsx
    │   │   │   ├── 📁 registrations/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 volunteers/
    │   │   │   │   └── 📄 [id].tsx
    │   │   │   ├── 📄 [id].tsx
    │   │   │   ├── 📄 calendar.tsx
    │   │   │   ├── 📄 categories.tsx
    │   │   │   ├── 📄 edit.tsx
    │   │   │   ├── 📄 EventsList.tsx
    │   │   │   ├── 📄 index.tsx
    │   │   │   ├── 📄 new-complete-backup.tsx
    │   │   │   ├── 📄 new-event.tsx
    │   │   │   ├── 📄 new-fixed.tsx
    │   │   │   └── 📄 new.tsx
    │   │   │
    │   │   ├── 📁 fauna/                   # Fauna
    │   │   │   └── 📄 species.tsx
    │   │   │
    │   │   ├── 📁 finance/                 # Finanzas
    │   │   │   ├── 📄 budget-planning.tsx
    │   │   │   ├── 📄 CalculadoraFinanciera.tsx
    │   │   │   ├── 📄 cash-flow-matrix.tsx
    │   │   │   ├── 📄 catalog-simplified.tsx
    │   │   │   ├── 📄 catalog.tsx
    │   │   │   ├── 📄 dashboard.tsx
    │   │   │   ├── 📄 expenses-fixed.tsx
    │   │   │   ├── 📄 expenses-working.tsx
    │   │   │   ├── 📄 expenses.tsx
    │   │   │   ├── 📄 incomes-broken.tsx
    │   │   │   ├── 📄 incomes.tsx
    │   │   │   ├── 📄 index.tsx
    │   │   │   ├── 📄 PendingActivitiesApproval.tsx
    │   │   │   └── 📄 reports.tsx
    │   │   │
    │   │   ├── 📁 hr/                      # Recursos Humanos
    │   │   │   ├── 📁 vacations/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📄 analytics.tsx
    │   │   │   ├── 📄 control-horas.tsx
    │   │   │   ├── 📄 dashboard.tsx
    │   │   │   ├── 📄 employees-backup.tsx
    │   │   │   ├── 📄 employees-fixed.tsx
    │   │   │   ├── 📄 employees-original.tsx
    │   │   │   ├── 📄 employees.tsx
    │   │   │   ├── 📄 payroll.tsx
    │   │   │   ├── 📄 receipts.tsx
    │   │   │   ├── 📄 training.tsx
    │   │   │   ├── 📄 vacaciones.tsx
    │   │   │   └── 📄 wellness.tsx
    │   │   │
    │   │   ├── 📁 incidents/               # Incidentes
    │   │   │   ├── 📄 [id].tsx
    │   │   │   ├── 📄 categories.tsx
    │   │   │   ├── 📄 dashboard-charts.tsx
    │   │   │   ├── 📄 dashboard-link.tsx
    │   │   │   ├── 📄 dashboard.tsx
    │   │   │   ├── 📄 DetailedIncidentPage.tsx
    │   │   │   ├── 📄 incidents-nueva.tsx
    │   │   │   ├── 📄 index.tsx
    │   │   │   └── 📄 new.tsx
    │   │   │
    │   │   ├── 📁 instructors/             # Instructores
    │   │   │   ├── 📁 evaluations/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📄 applications.tsx
    │   │   │   ├── 📄 cards.tsx
    │   │   │   ├── 📄 detail.tsx
    │   │   │   ├── 📄 edit.tsx
    │   │   │   └── 📄 index.tsx
    │   │   │
    │   │   ├── 📁 marketing/               # Marketing/Patrocinadores
    │   │   │   ├── 📄 assets.tsx
    │   │   │   ├── 📄 AssetsForm.tsx
    │   │   │   ├── 📄 benefits.tsx
    │   │   │   ├── 📄 contracts.tsx
    │   │   │   ├── 📄 dashboard.tsx
    │   │   │   ├── 📄 events.tsx
    │   │   │   ├── 📄 index.tsx
    │   │   │   ├── 📄 packages.tsx
    │   │   │   └── 📄 sponsors.tsx
    │   │   │
    │   │   ├── 📁 organizador/             # Organizador actividades
    │   │   │   ├── 📁 catalogo/
    │   │   │   │   ├── 📄 crear.tsx
    │   │   │   │   ├── 📄 detalle-basico.tsx
    │   │   │   │   ├── 📄 detalle.tsx
    │   │   │   │   └── 📄 editar.tsx
    │   │   │   ├── 📄 categorias.tsx
    │   │   │   ├── 📄 index.tsx
    │   │   │   └── 📄 nueva-actividad.tsx
    │   │   │
    │   │   ├── 📁 parks/                   # Parques admin
    │   │   │   ├── 📄 amenities.tsx
    │   │   │   ├── 📄 visitor-count.tsx
    │   │   │   └── 📄 visitor-dashboard.tsx
    │   │   │
    │   │   ├── 📁 permissions/             # Permisos
    │   │   │   ├── 📄 dashboard.tsx
    │   │   │   ├── 📄 index.tsx
    │   │   │   └── 📄 matrix.tsx
    │   │   │
    │   │   ├── 📁 role-assignments/        # Asignación de roles
    │   │   │   └── 📄 index.tsx
    │   │   │
    │   │   ├── 📁 roles/                   # Roles
    │   │   │   └── 📄 index.tsx
    │   │   │
    │   │   ├── 📁 settings/                # Configuración
    │   │   │   ├── 📄 NotificationPreferences.tsx
    │   │   │   ├── 📄 profile.tsx
    │   │   │   └── 📄 UserNotificationPreferences.tsx
    │   │   │
    │   │   ├── 📁 space-reservations/      # Reservaciones
    │   │   │   ├── 📁 spaces/
    │   │   │   │   ├── 📁 edit/
    │   │   │   │   └── 📄 new.tsx
    │   │   │   ├── 📄 calendar.tsx
    │   │   │   ├── 📄 edit.tsx
    │   │   │   ├── 📄 index.tsx
    │   │   │   ├── 📄 new.tsx
    │   │   │   └── 📄 spaces.tsx
    │   │   │
    │   │   ├── 📁 system/                  # Sistema
    │   │   │   ├── 📄 backup.tsx
    │   │   │   ├── 📄 email-settings.tsx
    │   │   │   ├── 📄 performance.tsx
    │   │   │   └── 📄 updates.tsx
    │   │   │
    │   │   ├── 📁 trees/                   # Arbolado
    │   │   │   ├── 📁 catalog/
    │   │   │   │   ├── 📁 [id]/
    │   │   │   │   │   └── 📄 view.tsx
    │   │   │   │   ├── 📁 new/
    │   │   │   │   │   ├── 📄 index.tsx
    │   │   │   │   │   └── 📄 simple.tsx
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 dashboard/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 environmental/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 inventory/
    │   │   │   │   ├── 📁 new/
    │   │   │   │   │   └── 📄 index.tsx
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 maintenance/
    │   │   │   │   ├── 📄 enhanced.tsx
    │   │   │   │   ├── 📄 index.tsx
    │   │   │   │   └── 📄 simple.tsx
    │   │   │   ├── 📁 map/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 operation/
    │   │   │   │   ├── 📁 [id]/
    │   │   │   │   │   └── 📄 view.tsx
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 reports/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 technical/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   └── 📄 dashboard.tsx
    │   │   │
    │   │   ├── 📁 visitors/                # Visitantes
    │   │   │   ├── 📄 dashboard-simple.tsx
    │   │   │   ├── 📄 dashboard.tsx
    │   │   │   └── 📄 feedback.tsx
    │   │   │
    │   │   ├── 📁 volunteers/              # Voluntarios
    │   │   │   ├── 📁 activities/
    │   │   │   │   ├── 📄 edit.tsx
    │   │   │   │   ├── 📄 index.tsx
    │   │   │   │   ├── 📄 new.tsx
    │   │   │   │   └── 📄 view.tsx
    │   │   │   ├── 📁 dashboard/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 participations/
    │   │   │   │   ├── 📄 edit.tsx
    │   │   │   │   └── 📄 new.tsx
    │   │   │   ├── 📁 recognition/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📁 settings/
    │   │   │   │   └── 📄 index.tsx
    │   │   │   ├── 📄 dashboard-demo.tsx
    │   │   │   ├── 📄 dashboard-page.tsx
    │   │   │   ├── 📄 edit.tsx
    │   │   │   ├── 📄 index.tsx
    │   │   │   ├── 📄 participations.tsx
    │   │   │   └── 📄 register.tsx
    │   │   │
    │   │   ├── 📁 warehouse/               # Almacén
    │   │   │   ├── 📄 Categories.tsx
    │   │   │   ├── 📄 ConsumableEdit.tsx
    │   │   │   ├── 📄 ConsumableForm.tsx
    │   │   │   ├── 📄 Consumables.tsx
    │   │   │   ├── 📄 Dashboard.tsx
    │   │   │   ├── 📄 Movements.tsx
    │   │   │   ├── 📄 NewMovement.tsx
    │   │   │   ├── 📄 NewRequisition.tsx
    │   │   │   ├── 📄 Requisitions.tsx
    │   │   │   ├── 📄 Stock.tsx
    │   │   │   ├── 📄 StockEdit.tsx
    │   │   │   ├── 📄 StockForm.tsx
    │   │   │   └── 📄 test.tsx
    │   │   │
    │   │   ├── 📁 work-orders/             # Órdenes de trabajo
    │   │   │   ├── 📄 [id].tsx
    │   │   │   ├── 📄 dashboard.tsx
    │   │   │   ├── 📄 index.tsx
    │   │   │   └── 📄 new.tsx
    │   │   │
    │   │   ├── 📄 activities.tsx
    │   │   ├── 📄 amenities-clean.tsx
    │   │   ├── 📄 amenities-dashboard.tsx
    │   │   ├── 📄 amenities-import.tsx
    │   │   ├── 📄 amenities.tsx
    │   │   ├── 📄 analytics.tsx
    │   │   ├── 📄 comments.tsx
    │   │   ├── 📄 configuracion-seguridad.tsx
    │   │   ├── 📄 dashboard-incidencias.tsx
    │   │   ├── 📄 dashboard-reservas.tsx
    │   │   ├── 📄 documents.tsx
    │   │   ├── 📄 incidentes-dashboard.tsx
    │   │   ├── 📄 incidents.tsx
    │   │   ├── 📄 index.tsx
    │   │   ├── 📄 instructor-invitations.tsx
    │   │   ├── 📄 login.tsx
    │   │   ├── 📄 park-edit.tsx
    │   │   ├── 📄 park-manage.tsx
    │   │   ├── 📄 park-view.tsx
    │   │   ├── 📄 parks-dashboard.tsx
    │   │   ├── 📄 parks-import.tsx
    │   │   ├── 📄 parks.tsx
    │   │   ├── 📄 payments.tsx
    │   │   ├── 📄 pending-users.tsx
    │   │   ├── 📄 settings.tsx
    │   │   ├── 📄 system-settings.tsx
    │   │   ├── 📄 user-activity.tsx
    │   │   └── 📄 users.tsx
    │   │
    │   ├── 📁 auth/                        # Autenticación
    │   │   └── 📄 ResetPassword.tsx
    │   │
    │   ├── 📁 help/                        # Ayuda/Manuales
    │   │   ├── 📄 ActividadesManual.tsx
    │   │   ├── 📄 ParquesManual.tsx
    │   │   └── 📄 VisitantesManual.tsx
    │   │
    │   ├── 📁 public/                      # Páginas públicas
    │   │   ├── 📄 evaluar-instructor.tsx
    │   │   └── 📄 test.tsx
    │   │
    │   ├── 📄 ActiveConcessionForm.tsx
    │   ├── 📄 ActiveConcessionsList.tsx
    │   ├── 📄 activities.tsx
    │   ├── 📄 activity-detail.tsx
    │   ├── 📄 activity-payment.tsx
    │   ├── 📄 calendar.tsx
    │   ├── 📄 ConcessionDetail.tsx
    │   ├── 📄 ConcessionImages.tsx
    │   ├── 📄 ConcessionsList.tsx
    │   ├── 📄 event-detail.tsx
    │   ├── 📄 Events.tsx
    │   ├── 📄 Fauna.tsx
    │   ├── 📄 FaunaDetail.tsx
    │   ├── 📄 home.tsx
    │   ├── 📄 incidents.tsx
    │   ├── 📄 instructors.tsx
    │   ├── 📄 Landing.tsx
    │   ├── 📄 not-found.tsx
    │   ├── 📄 ParkEvaluationForm.tsx
    │   ├── 📄 ParkEvaluations.tsx
    │   ├── 📄 ParkLandingPage.tsx
    │   ├── 📄 ParkPage.tsx
    │   ├── 📄 parks.tsx
    │   ├── 📄 ParksModuleShowcase.tsx
    │   ├── 📄 PublicInstructorProfile.tsx
    │   ├── 📄 reservations.tsx
    │   ├── 📄 sales-basic.tsx
    │   ├── 📄 sales-municipal.tsx
    │   ├── 📄 sales-network.tsx
    │   ├── 📄 sales-pro.tsx
    │   ├── 📄 sales-simple.tsx
    │   ├── 📄 sales.tsx
    │   ├── 📄 space-detail.tsx
    │   ├── 📄 TreeSpecies.tsx
    │   ├── 📄 TreeSpeciesDetail.tsx
    │   ├── 📄 volunteer-registration.tsx
    │   ├── 📄 VolunteerRegistration.tsx
    │   └── 📄 VolunteersList.tsx
    │
    ├── 📄 App.tsx                          # Componente raíz
    ├── 📄 index.css                        # Estilos globales
    ├── 📄 main.tsx                         # Entry point
    ├── 📄 routes.ts                        # Definición de rutas
    └── 📄 vite-env.d.ts                    # Tipos Vite
```

---

## 📁 SERVER (Backend)

```
server/
│
├── 📁 api/                                 # Endpoints específicos
│   ├── 📄 activities.ts
│   ├── 📄 activityHandler.ts
│   ├── 📄 advertising-upload.ts
│   ├── 📄 auth.ts
│   ├── 📄 iconUpload.ts
│   ├── 📄 imageUpload.ts
│   ├── 📄 parksImport.ts
│   ├── 📄 profileImageEndpoints.ts
│   ├── 📄 profileImageUpload.ts
│   └── 📄 treeIconUpload.ts
│
├── 📁 communications/                      # Servicios de comunicación
│   ├── 📄 activity-registration-templates.ts
│   ├── 📄 communicationsRoutes.ts
│   ├── 📄 emailQueueService.ts
│   ├── 📄 emailTemplateService.ts
│   └── 📄 seedCommunications.ts
│
├── 📁 email/                               # Servicios de email
│   ├── 📄 emailDemo.ts
│   ├── 📄 emailHooks.ts
│   ├── 📄 emailRoutes.ts
│   ├── 📄 emailService.ts
│   └── 📄 testEmail.ts
│
├── 📁 exports/                             # Sistema de exportación
│   ├── 📁 formatters/
│   │   ├── 📄 CSVFormatter.ts
│   │   ├── 📄 PDFFormatter.ts
│   │   └── 📄 XLSXFormatter.ts
│   └── 📄 ExportEngine.ts
│
├── 📁 middleware/                          # Middleware
│   ├── 📄 auth.ts
│   ├── 📄 requirePermission.ts
│   └── 📄 upload.ts
│
├── 📁 migrations/                          # Migraciones
│   └── 📄 migrateToFirebase.ts
│
├── 📁 routes/                              # Rutas organizadas
│   ├── 📄 activity-registrations.ts
│   ├── 📄 activity-stats.ts
│   ├── 📄 activityPayments.ts
│   ├── 📄 activityPaymentsSimple.ts
│   ├── 📄 costing-integration.ts
│   ├── 📄 event-payments.ts
│   ├── 📄 event-registrations.ts
│   ├── 📄 exports.ts
│   ├── 📄 parks-media.routes.ts
│   ├── 📄 parks.routes.ts
│   ├── 📄 payments.ts
│   ├── 📄 space-mapping-routes.ts
│   ├── 📄 space-payments.ts
│   └── 📄 unified-discounts.ts
│
├── 📁 security/                            # Seguridad
│   ├── 📄 initSecurityTables.ts
│   ├── 📄 securityRoutes.ts
│   └── 📄 securityService.ts
│
├── 📁 services/                            # Servicios
│   └── 📄 stripeService.ts
│
├── 📁 utils/                               # Utilidades
│   ├── 📄 assetHistoryLogger.ts
│   └── 📄 userSanitizer.ts
│
├── 📄 accounting-routes.ts                 # Rutas de contabilidad
├── 📄 active-concessions-routes.ts         # Rutas de concesiones activas
├── 📄 activities-delete-handler.ts         # Eliminación de actividades
├── 📄 activitiesRoutes.ts                  # Rutas de actividades
├── 📄 activity-image-routes.ts             # Rutas de imágenes de actividades
├── 📄 activity-simple-routes.ts            # Rutas simples de actividades
├── 📄 activityRoutes.ts                    # Rutas de actividades
├── 📄 advertising-init.ts                  # Inicialización de publicidad
├── 📄 advertising-management-routes.ts     # Gestión de publicidad
├── 📄 advertising-routes.ts                # Rutas de publicidad
├── 📄 amenities-import-routes.ts           # Importación de amenidades
├── 📄 amenity_routes.ts                    # Rutas de amenidades
├── 📄 asset-categories-routes.ts           # Categorías de activos
├── 📄 asset-history-routes.ts              # Historial de activos
├── 📄 asset-image-routes.ts                # Imágenes de activos
├── 📄 asset_assignment_routes.ts           # Asignación de activos
├── 📄 asset_routes.ts                      # Rutas de activos
├── 📄 assets-finance-integration.ts        # Integración finanzas-activos
├── 📄 assets-routes.ts                     # Rutas de activos
├── 📄 audit-routes.ts                      # Rutas de auditoría
├── 📄 budget-planning-routes.ts            # Planificación presupuestaria
├── 📄 budget-routes.ts                     # Rutas de presupuesto
├── 📄 concession-contracts-routes.ts       # Contratos de concesiones
├── 📄 concession-evaluations-routes.ts     # Evaluaciones de concesiones
├── 📄 concession-locations-routes.ts       # Ubicaciones de concesiones
├── 📄 concession-payments-routes.ts        # Pagos de concesiones
├── 📄 concession-routes.ts                 # Rutas de concesiones
├── 📄 concessionaire-routes.ts             # Rutas de concesionarios
├── 📄 concessions-finance-integration.ts   # Integración finanzas
├── 📄 db.ts                                # Configuración de BD
├── 📄 direct-park-queries.ts               # Consultas directas de parques
├── 📄 directAuth.ts                        # Autenticación directa
├── 📄 directRoutes.ts                      # Rutas directas
├── 📄 evaluaciones-routes.ts               # Rutas de evaluaciones
├── 📄 evaluation-criteria-routes.ts        # Criterios de evaluación
├── 📄 event-categories-routes.ts           # Categorías de eventos
├── 📄 eventos-ambu-routes.ts               # Rutas eventos AMBU
├── 📄 events-evaluations-handlers.ts       # Handlers de evaluaciones
├── 📄 events-finance-integration.ts        # Integración finanzas-eventos
├── 📄 events-handlers.ts                   # Handlers de eventos
├── 📄 events-image-routes.ts               # Imágenes de eventos
├── 📄 events-participants-handlers.ts      # Handlers de participantes
├── 📄 events-resources-handlers.ts         # Handlers de recursos
├── 📄 events-routes.ts                     # Rutas de eventos
├── 📄 events-volunteers-handlers.ts        # Handlers de voluntarios
├── 📄 faunaRoutes.ts                       # Rutas de fauna
├── 📄 feedback-routes.ts                   # Rutas de feedback
├── 📄 finance-accounting-integration.ts    # Integración contable
├── 📄 finance-routes.ts                    # Rutas de finanzas
├── 📄 finance-update-routes.ts             # Actualización de finanzas
├── 📄 financial-category-sync.ts           # Sincronización de categorías
├── 📄 financial-integrations-api.ts        # API de integraciones
├── 📄 firebaseAuthRoutes.ts                # Rutas Firebase Auth
├── 📄 firebaseUserSync.ts                  # Sincronización Firebase
├── 📄 hr-routes.ts                         # Rutas de RRHH
├── 📄 hybrid-payment-routes.ts             # Pagos híbridos
├── 📄 hybridRoleRoutes.ts                  # Rutas de roles híbridos
├── 📄 incident_categories_routes.ts        # Categorías de incidentes
├── 📄 index.ts                             # Entry point del servidor
├── 📄 initialize-db.ts                     # Inicialización de BD
├── 📄 instructor-evaluations-routes.ts     # Evaluaciones de instructores
├── 📄 instructor-routes.ts                 # Rutas de instructores
├── 📄 instructor-specialties-routes.ts     # Especialidades
├── 📄 instructorApplicationRoutes.ts       # Solicitudes de instructores
├── 📄 instructorInvitationRoutes.ts        # Invitaciones de instructores
├── 📄 maintenance_routes.ts                # Rutas de mantenimiento
├── 📄 multimedia-system.ts                 # Sistema multimedia
├── 📄 objectStorage.ts                     # Almacenamiento de objetos
├── 📄 objectStorageRoutes.ts               # Rutas de almacenamiento
├── 📄 park-evaluations-routes.ts           # Evaluaciones de parques
├── 📄 password-recovery-routes.ts          # Recuperación de contraseña
├── 📄 payroll-receipts-routes.ts           # Recibos de nómina
├── 📄 pdf-generator.ts                     # Generador de PDF
├── 📄 permissions-middleware.ts            # Middleware de permisos
├── 📄 permissions-seeder.ts                # Seeder de permisos
├── 📄 profileImageCache.ts                 # Cache de imágenes
├── 📄 publicRoutes.ts                      # Rutas públicas
├── 📄 replitAuth.ts                        # Autenticación Replit
├── 📄 reservable-spaces-routes.ts          # Espacios reservables
├── 📄 roleRoutes.ts                        # Rutas de roles
├── 📄 roleSeeder.ts                        # Seeder de roles
├── 📄 roleService.ts                       # Servicio de roles
├── 📄 routes.ts                            # Rutas principales
├── 📄 space-reservations-routes.ts         # Reservaciones de espacios
├── 📄 sponsorship-routes.ts                # Rutas de patrocinios
├── 📄 storage.ts                           # Capa de persistencia
├── 📄 time-off-routes.ts                   # Solicitudes de tiempo libre
├── 📄 tree-inventory-generator-routes.ts   # Generador de inventario
├── 📄 tree_areas_routes.ts                 # Áreas de árboles
├── 📄 tree_details_route.ts                # Detalles de árboles
├── 📄 tree_inventory_routes.ts             # Inventario de árboles
├── 📄 tree_links_routes.ts                 # Enlaces de árboles
├── 📄 tree_maintenance_routes.ts           # Mantenimiento de árboles
├── 📄 tree_maintenance_stats.ts            # Estadísticas de mantenimiento
├── 📄 tree_routes.ts                       # Rutas de árboles
├── 📄 tree_stats_routes.ts                 # Estadísticas de árboles
├── 📄 UnifiedStorageService.ts             # Servicio de almacenamiento
├── 📄 user-preferences-routes.ts           # Preferencias de usuario
├── 📄 userRoutes.ts                        # Rutas de usuarios
├── 📄 users-concessionaires-routes.ts      # Usuarios concesionarios
├── 📄 vacation-routes.ts                   # Rutas de vacaciones
├── 📄 video_routes.ts                      # Rutas de videos
├── 📄 visitor-count-routes.ts              # Conteo de visitantes
├── 📄 visitors-dashboard-routes.ts         # Dashboard de visitantes
├── 📄 vite.ts                              # Integración Vite
├── 📄 volunteer-fields-updater.ts          # Actualizador de voluntarios
├── 📄 volunteerData.ts                     # Datos de voluntarios
├── 📄 volunteerFieldRoutes.ts              # Campos de voluntarios
├── 📄 volunteerRoutes.ts                   # Rutas de voluntarios
└── 📄 warehouse-routes.ts                  # Rutas de almacén
```

---

## 📁 SHARED (Código Compartido)

```
shared/
│
├── 📁 exports/                             # Configuración de exportación
│   ├── 📄 branding.ts
│   ├── 📄 config.ts
│   └── 📄 registry.ts
│
├── 📄 accounting-schema.ts                 # Schema de contabilidad
├── 📄 advertising-schema.ts                # Schema de publicidad
├── 📄 asset-schema.ts                      # Schema de activos
├── 📄 budget-planning-schema.ts            # Schema de presupuestos
├── 📄 events-ambu-schema.ts                # Schema de eventos AMBU
├── 📄 events-schema.ts                     # Schema de eventos
├── 📄 finance-schema.ts                    # Schema de finanzas
├── 📄 financial-integration-types.ts       # Tipos de integración
├── 📄 hr-finance-integration.ts            # Integración HR-Finanzas
├── 📄 schema.ts                            # Schema principal (90+ tablas)
└── 📄 security-schema.ts                   # Schema de seguridad
```

---

## 📁 OTRAS CARPETAS

### attached_assets/
```
attached_assets/
├── 📄 [Múltiples imágenes y archivos cargados por usuarios]
├── 📄 Actividades Final.csv
├── 📄 Activos Final.csv
├── 📄 COMPLEMENTO_3 Proforma Operativa.xlsx
├── 📄 F_DIC_22_Solicitud_de_permiso_para_evento_de_Bajo_Impacto.pdf
├── 📄 F_DIC_23_Informacion_para_Solicitud_de_Eventos_de_Alto_Impacto.pdf
├── 📄 LOGO PDM.png
├── 📄 Parksys smart Management.png
└── 📄 [Screenshots y logs de debugging]
```

### docs/
```
docs/
└── 📄 [Documentación adicional]
```

### exports/
```
exports/
└── 📄 [Archivos exportados del sistema]
```

### migrations/
```
migrations/
└── 📄 [Archivos de migración legacy]
```

### public/
```
public/
└── 📄 [Archivos públicos estáticos]
```

### scripts/
```
scripts/
└── 📄 [Scripts de utilidad y automatización]
```

### uploads/
```
uploads/
├── 📁 activities/          # Imágenes de actividades
├── 📁 assets/              # Imágenes de activos
├── 📁 concessions/         # Imágenes de concesiones
├── 📁 events/              # Imágenes de eventos
├── 📁 instructors/         # Fotos de instructores
├── 📁 parks/               # Imágenes de parques
├── 📁 profile-images/      # Fotos de perfil
├── 📁 spaces/              # Imágenes de espacios
├── 📁 trees/               # Imágenes de árboles
└── 📁 videos/              # Videos del sistema
```

---

## ESTADÍSTICAS DEL PROYECTO

| Categoría | Cantidad |
|-----------|----------|
| **Total de archivos** | ~500+ |
| **Páginas Admin** | ~150 |
| **Páginas Públicas** | ~25 |
| **Componentes UI** | ~100 |
| **Rutas de API** | ~80 |
| **Tablas en BD** | 90+ |
| **Custom Hooks** | 15 |
| **Schemas compartidos** | 11 |

---

## NOTAS

1. **Archivos de backup**: Varios archivos tienen sufijos como `-backup`, `-fixed`, `-original` que representan versiones alternativas durante el desarrollo.

2. **Scripts de seed**: El servidor contiene múltiples scripts `seed-*.ts` y `add-sample-*.ts` para poblar la base de datos con datos de prueba.

3. **Scripts de migración**: Hay scripts `create-*-tables.ts` para crear esquemas de tablas específicos.

4. **Organización modular**: El código sigue una estructura modular donde cada funcionalidad principal tiene su propia carpeta tanto en frontend como en backend.

---

**Versión del documento**: 1.0  
**Última actualización**: Noviembre 2024  
**Sistema**: ParkSys - Parks Management System
