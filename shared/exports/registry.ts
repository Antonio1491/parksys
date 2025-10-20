// Registro centralizado de entidades exportables
import { ExportConfig } from './config';

export const EXPORT_REGISTRY: Record<string, ExportConfig> = {
  parks: {
    entity: 'parks',
    displayName: 'Parques',
    description: 'Información completa de parques municipales',
    fields: [
      { key: 'name', label: 'Nombre del Parque', type: 'text', required: true, width: 25 },
      { key: 'description', label: 'Descripción', type: 'text', width: 40 },
      { key: 'type', label: 'Tipo', type: 'text', width: 15 },
      { key: 'municipality', label: 'Municipio', type: 'text', width: 20 },
      { key: 'area', label: 'Superficie (m²)', type: 'number', format: '#,##0', width: 15 },
      { key: 'coordinates', label: 'Coordenadas', type: 'text', width: 20 },
      { key: 'latitude', label: 'Latitud', type: 'number', format: '#,##0.000000', width: 15 },
      { key: 'longitude', label: 'Longitud', type: 'number', format: '#,##0.000000', width: 15 },
      { key: 'address', label: 'Dirección', type: 'text', width: 30 },
      { key: 'manager', label: 'Administrador', type: 'text', width: 20 },
      { key: 'contactPhone', label: 'Teléfono', type: 'text', width: 15 },
      { key: 'email', label: 'Correo Electrónico', type: 'email', width: 25 },
      { key: 'openingHours', label: 'Horario Apertura', type: 'text', width: 15 },
      { key: 'closingHours', label: 'Horario Cierre', type: 'text', width: 15 },
      { key: 'capacity', label: 'Capacidad', type: 'number', format: '#,##0', width: 12 },
      { key: 'accessibilityFeatures', label: 'Accesibilidad', type: 'text', width: 25 },
      { key: 'safetyFeatures', label: 'Seguridad', type: 'text', width: 25 },
      { key: 'maintenanceNotes', label: 'Notas de Mantenimiento', type: 'text', width: 30 },
      { key: 'conservationStatus', label: 'Estado de Conservación', type: 'text', width: 20 },
      { key: 'regulationUrl', label: 'URL Reglamento', type: 'url', width: 30 },
      { key: 'videoUrl', label: 'URL Video', type: 'url', width: 30 },
      { key: 'certificaciones', label: 'Certificaciones', type: 'array', width: 30 },
      { key: 'createdAt', label: 'Fecha de Registro', type: 'date', format: 'DD/MM/YYYY', width: 15 },
      { key: 'updatedAt', label: 'Última Actualización', type: 'date', format: 'DD/MM/YYYY HH:mm', width: 18 }
    ],
    permissions: ['parks.export', 'admin'],
    defaultFormat: 'xlsx',
    supportedFormats: ['csv', 'xlsx', 'pdf'],
    filters: {
      available: ['type', 'municipality', 'conservationStatus'],
      default: {}
    },
    sorting: {
      default: { field: 'name', direction: 'asc' },
      available: ['name', 'area', 'createdAt', 'updatedAt']
    }
  },

  amenities: {
    entity: 'amenities',
    displayName: 'Amenidades',
    description: 'Catálogo de amenidades disponibles',
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true, width: 25 },
      { key: 'category', label: 'Categoría', type: 'text', width: 20 },
      { key: 'icon', label: 'Icono', type: 'text', width: 15 },
      { key: 'iconType', label: 'Tipo de Icono', type: 'text', width: 15 },
      { key: 'customIconUrl', label: 'URL Icono Personalizado', type: 'url', width: 30 },
      { key: 'parksCount', label: 'Parques Asignados', type: 'number', format: '#,##0', width: 15 },
      { key: 'totalModules', label: 'Total Módulos', type: 'number', format: '#,##0', width: 15 },
      { key: 'utilizationRate', label: 'Tasa de Utilización (%)', type: 'number', format: '#,##0.0', width: 18 },
      { key: 'createdAt', label: 'Fecha de Registro', type: 'date', format: 'DD/MM/YYYY', width: 15 }
    ],
    permissions: ['amenities.export', 'admin'],
    defaultFormat: 'xlsx',
    supportedFormats: ['csv', 'xlsx'],
    filters: {
      available: ['category', 'iconType'],
      default: {}
    },
    sorting: {
      default: { field: 'parksCount', direction: 'desc' },
      available: ['name', 'category', 'parksCount', 'createdAt']
    }
  },

  activities: {
    entity: 'activities',
    displayName: 'Actividades',
    description: 'Actividades programadas en los parques',
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true, width: 30 },
      { key: 'description', label: 'Descripción', type: 'text', width: 40 },
      { key: 'category', label: 'Categoría', type: 'text', width: 20 },
      { key: 'instructor', label: 'Instructor', type: 'text', width: 25 },
      { key: 'parkName', label: 'Parque', type: 'text', width: 25 },
      { key: 'schedule', label: 'Horario', type: 'text', width: 20 },
      { key: 'capacity', label: 'Capacidad', type: 'number', format: '#,##0', width: 12 },
      { key: 'enrolled', label: 'Inscritos', type: 'number', format: '#,##0', width: 12 },
      { key: 'price', label: 'Precio', type: 'currency', width: 15 },
      { key: 'isFree', label: 'Gratuita', type: 'boolean', width: 10 },
      { key: 'status', label: 'Estado', type: 'text', width: 15 },
      { key: 'createdAt', label: 'Fecha de Registro', type: 'date', format: 'DD/MM/YYYY', width: 15 }
    ],
    permissions: ['activities.export', 'admin'],
    defaultFormat: 'xlsx',
    supportedFormats: ['csv', 'xlsx', 'pdf'],
    filters: {
      available: ['category', 'status', 'isFree'],
      default: {}
    },
    sorting: {
      default: { field: 'createdAt', direction: 'desc' },
      available: ['title', 'category', 'capacity', 'enrolled', 'createdAt']
    }
  },

  instructors: {
    entity: 'instructors',
    displayName: 'Instructores',
    description: 'Listado completo de instructores registrados en el sistema',
    fields: [
      { key: 'firstName', label: 'Nombre', type: 'text', required: true, width: 20 },
      { key: 'lastName', label: 'Apellido', type: 'text', required: true, width: 20 },
      { key: 'email', label: 'Correo Electrónico', type: 'email', width: 25 },
      { key: 'phone', label: 'Teléfono', type: 'text', width: 15 },
      { key: 'status', label: 'Estado', type: 'text', width: 15 },
      { key: 'specialties', label: 'Especialidades', type: 'array', width: 30 },
      { key: 'experienceYears', label: 'Años de Experiencia', type: 'number', format: '#,##0', width: 10 },
      { key: 'bio', label: 'Biografía', type: 'text', width: 40 },
      { key: 'hourlyRate', label: 'Tarifa por Hora', type: 'currency', width: 15 },
      { key: 'preferredParkName', label: 'Parque Preferido', type: 'text', width: 25 },
      { key: 'rating', label: 'Calificación', type: 'number', format: '#,##0.0', width: 10 },
      { key: 'activitiesCount', label: 'Actividades Asignadas', type: 'number', format: '#,##0', width: 10 },
      { key: 'createdAt', label: 'Fecha de Registro', type: 'date', format: 'DD/MM/YYYY', width: 15 }
    ],
    permissions: ['instructors.export', 'admin'],
    defaultFormat: 'xlsx',
    supportedFormats: ['csv', 'xlsx', 'pdf'],
    filters: {
      available: ['status', 'specialties', 'experienceYears'],
      default: {}
    },
    sorting: {
      default: { field: 'createdAt', direction: 'desc' },
      available: ['firstName', 'lastName', 'experienceYears', 'rating', 'createdAt']
    }
  },
  
  volunteers: {
    entity: 'volunteers',
    displayName: 'Voluntarios',
    description: 'Base de datos de voluntarios registrados',
    fields: [
      { key: 'name', label: 'Nombre Completo', type: 'text', required: true, width: 25 },
      { key: 'email', label: 'Correo Electrónico', type: 'email', width: 25 },
      { key: 'phone', label: 'Teléfono', type: 'text', width: 15 },
      { key: 'age', label: 'Edad', type: 'number', format: '#,##0', width: 10 },
      { key: 'occupation', label: 'Ocupación', type: 'text', width: 20 },
      { key: 'availability', label: 'Disponibilidad', type: 'text', width: 20 },
      { key: 'experience', label: 'Experiencia', type: 'text', width: 30 },
      { key: 'interests', label: 'Intereses', type: 'array', width: 30 },
      { key: 'isActive', label: 'Activo', type: 'boolean', width: 10 },
      { key: 'createdAt', label: 'Fecha de Registro', type: 'date', format: 'DD/MM/YYYY', width: 15 }
    ],
    permissions: ['volunteers.export', 'admin'],
    defaultFormat: 'xlsx',
    supportedFormats: ['csv', 'xlsx'],
    filters: {
      available: ['isActive', 'availability'],
      default: { isActive: true }
    },
    sorting: {
      default: { field: 'name', direction: 'asc' },
      available: ['name', 'age', 'createdAt']
    }
  }
};

// Función para obtener configuración de una entidad
export function getExportConfig(entity: string): ExportConfig | null {
  return EXPORT_REGISTRY[entity] || null;
}

// Función para listar todas las entidades disponibles
export function getAvailableEntities(): string[] {
  return Object.keys(EXPORT_REGISTRY);
}

// Función para verificar si un formato está soportado
export function isFormatSupported(entity: string, format: string): boolean {
  const config = getExportConfig(entity);
  return config ? config.supportedFormats.includes(format as any) : false;
}

// Función para obtener campos requeridos
export function getRequiredFields(entity: string): string[] {
  const config = getExportConfig(entity);
  return config ? config.fields.filter(field => field.required).map(field => field.key) : [];
}