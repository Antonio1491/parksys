/**
 * Sistema de automatización de Landing Pages de Parques
 * Genera automáticamente landing pages cuando se crean nuevos parques
 */

/**
 * Genera un slug SEO-friendly para las landing pages
 */
export function generateParkSlug(parkName: string, parkId: number): string {
  return parkName
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    + '-' + parkId;
}

/**
 * Configuración de campos que se sincronizarán desde el admin hacia las landing pages
 * SOLO los campos que realmente se usan en los contenedores existentes
 */
export const SYNC_FIELDS = {
  // Header y información principal
  header: [
    'name',           // Título principal
    'description',    // Descripción que aparece en hero
    'municipality'    // Para subtitle municipio/estado
  ],
  
  // Sección de Ubicación (sidebar compacta)
  location: [
    'address',        // Dirección en ficha de ubicación
    'latitude',       // Para mapa integrado
    'longitude'      // Para mapa integrado
  ],
  
  // Información Adicional (sidebar)
  additional: [
    'conservationStatus', // Estado de conservación
    'regulationUrl',      // Link a reglamento si existe
    'updatedAt'          // Fecha de última actualización
  ],
  
  // Contacto (sidebar)
  contact: [
    'administrator',  // Administrador responsable
    'contactPhone',   // Teléfono de contacto
    'contactEmail'    // Email de contacto
  ],
  
  // Estadísticas (sidebar)
  stats: [
    'area',           // Superficie en hectáreas  
    'foundationYear'  // Año de fundación
  ]
};

/**
 * Procesa automáticamente un nuevo parque creado desde el admin
 * y prepara todos los datos necesarios para su landing page
 */
export async function processNewParkForLanding(parkData: any): Promise<{
  slug: string;
  syncedData: any;
  landingPageUrl: string;
}> {
  try {
    console.log(`🏗️ Procesando nuevo parque para landing page: ${parkData.name}`);
    
    // Generar slug único para la landing page
    const slug = generateParkSlug(parkData.name, parkData.id);
    
    // Extraer solo los campos que necesita la landing page
    const syncedData: any = {};
    
    // Copiar campos del header
    SYNC_FIELDS.header.forEach(field => {
      if (parkData[field] !== undefined) {
        syncedData[field] = parkData[field];
      }
    });
    
    // Copiar campos de ubicación
    SYNC_FIELDS.location.forEach(field => {
      if (parkData[field] !== undefined) {
        syncedData[field] = parkData[field];
      }
    });
    
    // Copiar información adicional
    SYNC_FIELDS.additional.forEach(field => {
      if (parkData[field] !== undefined) {
        syncedData[field] = parkData[field];
      }
    });
    
    // Copiar información de contacto
    SYNC_FIELDS.contact.forEach(field => {
      if (parkData[field] !== undefined) {
        syncedData[field] = parkData[field];
      }
    });
    
    // Copiar estadísticas
    SYNC_FIELDS.stats.forEach(field => {
      if (parkData[field] !== undefined) {
        syncedData[field] = parkData[field];
      }
    });
    
    // Agregar metadatos de sincronización
    syncedData.id = parkData.id;
    syncedData.slug = slug;
    syncedData.createdAt = parkData.createdAt || new Date().toISOString();
    syncedData.landingPageGenerated = true;
    syncedData.lastSyncAt = new Date().toISOString();
    
    // URL de la landing page generada
    const landingPageUrl = `/parque/${slug}`;
    
    console.log(`✅ Landing page preparada para "${parkData.name}"`);
    console.log(`📍 URL: ${landingPageUrl}`);
    console.log(`🔗 Slug: ${slug}`);
    
    return {
      slug,
      syncedData,
      landingPageUrl
    };
    
  } catch (error) {
    console.error(`❌ Error procesando parque para landing page:`, error);
    throw new Error(`Error en automatización de landing page: ${error.message}`);
  }
}

/**
 * Valida que un parque tenga los datos mínimos necesarios para una landing page
 */
export function validateParkForLanding(parkData: any): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  
  // Campos obligatorios para que funcionen los contenedores existentes
  const requiredFields = ['name'];
  
  requiredFields.forEach(field => {
    if (!parkData[field]) {
      missingFields.push(field);
    }
  });
  
  // Campos recomendados para completar los contenedores visibles
  const recommendedFields = ['description', 'address', 'administrator', 'conservationStatus'];
  
  recommendedFields.forEach(field => {
    if (!parkData[field]) {
      warnings.push(`Campo recomendado faltante: ${field}`);
    }
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
}

/**
 * Log de eventos de automatización para debugging
 */
export function logLandingPageAutomation(event: string, parkData: any, details?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🤖 LANDING PAGE AUTOMATION - ${event}`);
  console.log(`Park: ${parkData.name} (ID: ${parkData.id})`);
  if (details) {
    console.log('Details:', details);
  }
}