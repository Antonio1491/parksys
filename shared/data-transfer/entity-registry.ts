/**
 * Entity Registry - Registro Central de Entidades para Import/Export
 * 
 * Este archivo registra todas las entidades que soportan import/export.
 * Cada entidad se configura con su tabla Drizzle correspondiente.
 * 
 * Para agregar una nueva entidad:
 * 1. Importar la tabla de schema.ts
 * 2. Agregar etiquetas en field-labels.ts (opcional pero recomendado)
 * 3. Registrar la entidad aquí con createEntityConfig()
 */

import { EntityConfig } from './types';
import { createEntityConfig } from './field-resolver';

// Importar tablas de Drizzle
// NOTA: Estas importaciones se harán desde el schema real cuando se integre
// Por ahora definimos la estructura esperada

/**
 * Registro de todas las entidades configuradas
 * 
 * Clave: nombre de la entidad (usado en API)
 * Valor: configuración completa de la entidad
 */
export const ENTITY_REGISTRY: Record<string, EntityConfig> = {};

/**
 * Registra una entidad en el sistema
 */
export function registerEntity(config: EntityConfig): void {
  ENTITY_REGISTRY[config.entity] = config;
}

/**
 * Obtiene la configuración de una entidad
 */
export function getEntityConfig(entityName: string): EntityConfig | undefined {
  return ENTITY_REGISTRY[entityName];
}

/**
 * Verifica si una entidad está registrada
 */
export function isEntityRegistered(entityName: string): boolean {
  return entityName in ENTITY_REGISTRY;
}

/**
 * Obtiene todas las entidades registradas
 */
export function getAllEntities(): EntityConfig[] {
  return Object.values(ENTITY_REGISTRY);
}

/**
 * Obtiene entidades que soportan importación
 */
export function getImportableEntities(): EntityConfig[] {
  return getAllEntities().filter(e => e.import.enabled);
}

/**
 * Obtiene entidades que soportan exportación
 */
export function getExportableEntities(): EntityConfig[] {
  return getAllEntities().filter(e => e.export.enabled);
}

// ============================================
// INICIALIZACIÓN DE ENTIDADES
// ============================================

/**
 * Función para inicializar el registro con las tablas de Drizzle
 * Debe llamarse al iniciar la aplicación
 * 
 * @param schema Objeto con todas las tablas de Drizzle
 */
export function initializeEntityRegistry(schema: Record<string, any>): void {
  // Parks - Parques
  if (schema.parks) {
    registerEntity(
      createEntityConfig(
        schema.parks,
        'parks',
        'Parque',
        'Parques',
        {
          import: {
            uniqueFields: ['name'],
            allowUpdate: true,
          },
          export: {
            formats: ['csv', 'xlsx', 'pdf'],
          },
        }
      )
    );
  }

  // Activities - Actividades
  if (schema.activities) {
    registerEntity(
      createEntityConfig(
        schema.activities,
        'activities',
        'Actividad',
        'Actividades',
        {
          import: {
            uniqueFields: ['title', 'parkId', 'startDate'],
          },
        }
      )
    );
  }

  // Amenities - Amenidades
  if (schema.amenities) {
    registerEntity(
      createEntityConfig(
        schema.amenities,
        'amenities',
        'Amenidad',
        'Amenidades',
        {
          import: {
            uniqueFields: ['name'],
          },
        }
      )
    );
  }

  // Park Amenities - Amenidades de Parques
  if (schema.parkAmenities) {
    registerEntity(
      createEntityConfig(
        schema.parkAmenities,
        'parkAmenities',
        'Amenidad de Parque',
        'Amenidades de Parques',
        {
          import: {
            uniqueFields: ['parkId', 'amenityId'],
          },
        }
      )
    );
  }

  // Trees - Árboles
  if (schema.trees) {
    registerEntity(
      createEntityConfig(
        schema.trees,
        'trees',
        'Árbol',
        'Árboles',
        {
          import: {
            uniqueFields: ['code'],
            maxRecords: 10000, // Los parques grandes pueden tener muchos árboles
          },
        }
      )
    );
  }

  // Tree Species - Especies de Árboles
  if (schema.treeSpecies) {
    registerEntity(
      createEntityConfig(
        schema.treeSpecies,
        'treeSpecies',
        'Especie de Árbol',
        'Especies de Árboles',
        {
          import: {
            uniqueFields: ['scientificName'],
          },
        }
      )
    );
  }

  // Assets - Activos
  if (schema.assets) {
    registerEntity(
      createEntityConfig(
        schema.assets,
        'assets',
        'Activo',
        'Activos',
        {
          import: {
            uniqueFields: ['serialNumber', 'customAssetId'],
            allowUpdate: true,
          },
        }
      )
    );
  }

  // Asset Categories - Categorías de Activos
  if (schema.assetCategories) {
    registerEntity(
      createEntityConfig(
        schema.assetCategories,
        'assetCategories',
        'Categoría de Activo',
        'Categorías de Activos',
        {
          import: {
            uniqueFields: ['name'],
          },
        }
      )
    );
  }

  // Instructors - Instructores
  if (schema.instructors) {
    registerEntity(
      createEntityConfig(
        schema.instructors,
        'instructors',
        'Instructor',
        'Instructores',
        {
          import: {
            uniqueFields: ['email'],
          },
        }
      )
    );
  }

  // Volunteers - Voluntarios
  if (schema.volunteers) {
    registerEntity(
      createEntityConfig(
        schema.volunteers,
        'volunteers',
        'Voluntario',
        'Voluntarios',
        {
          import: {
            uniqueFields: ['email'],
          },
        }
      )
    );
  }

  // Users - Usuarios
  if (schema.users) {
    registerEntity(
      createEntityConfig(
        schema.users,
        'users',
        'Usuario',
        'Usuarios',
        {
          import: {
            enabled: false, // Usuarios no se importan por seguridad
          },
          export: {
            formats: ['xlsx'], // Solo Excel para usuarios
          },
        }
      )
    );
  }

  // Consumables - Consumibles (Almacén)
  if (schema.consumables) {
    registerEntity(
      createEntityConfig(
        schema.consumables,
        'consumables',
        'Consumible',
        'Consumibles',
        {
          import: {
            uniqueFields: ['sku'],
            allowUpdate: true,
          },
        }
      )
    );
  }

  // Incidents - Incidencias
  if (schema.incidents) {
    registerEntity(
      createEntityConfig(
        schema.incidents,
        'incidents',
        'Incidencia',
        'Incidencias',
        {
          import: {
            enabled: false, // Incidencias no se importan
          },
          export: {
            formats: ['csv', 'xlsx', 'pdf'],
          },
        }
      )
    );
  }

  // Activity Categories - Categorías de Actividades
  if (schema.activityCategories) {
    registerEntity(
      createEntityConfig(
        schema.activityCategories,
        'activityCategories',
        'Categoría de Actividad',
        'Categorías de Actividades',
        {
          import: {
            uniqueFields: ['name'],
          },
        }
      )
    );
  }

  console.log(`[ENTITY REGISTRY] Registradas ${Object.keys(ENTITY_REGISTRY).length} entidades`);
}

// ============================================
// UTILIDADES DE BÚSQUEDA
// ============================================

/**
 * Busca entidades por módulo
 */
export function getEntitiesByModule(module: string): EntityConfig[] {
  const moduleMap: Record<string, string[]> = {
    'management': ['parks', 'activities', 'amenities', 'parkAmenities'],
    'operations': ['trees', 'treeSpecies', 'assets', 'assetCategories', 'incidents'],
    'hr': ['users', 'instructors', 'volunteers'],
    'warehouse': ['consumables'],
  };
  
  const entityNames = moduleMap[module] || [];
  return entityNames
    .map(name => getEntityConfig(name))
    .filter((config): config is EntityConfig => config !== undefined);
}
