/**
 * Etiquetas de Campos para Import/Export
 * 
 * ÚNICA FUENTE DE VERDAD para los nombres que ven los usuarios.
 * Los tipos de datos, requerimientos, etc. se derivan automáticamente del schema de Drizzle.
 * 
 * Formato: 'entidad.campo': 'Etiqueta en español'
 * 
 * Si un campo no tiene etiqueta aquí, se usa el nombre del campo humanizado como fallback
 *
 * Pendiente por agregar función de traducción para otros idiomas
 */

export const FIELD_LABELS: Record<string, string> = {
  // ============================================
  // PARKS - Parques
  // ============================================
  'parks.name': 'Nombre',
  'parks.slug': 'URL amigable',
  'parks.codePrefix': 'Prefijo de código',
  'parks.municipalityText': 'Municipio',
  'parks.parkType': 'Tipo de parque',
  'parks.typologyId': 'Tipología',
  'parks.description': 'Descripción',
  'parks.address': 'Dirección',
  'parks.postalCode': 'Código postal',
  'parks.latitude': 'Latitud',
  'parks.longitude': 'Longitud',
  'parks.area': 'Área total (m²)',
  'parks.greenArea': 'Área verde (m²)',
  'parks.foundationYear': 'Año de fundación',
  'parks.administrator': 'Administrador',
  'parks.status': 'Estado',
  'parks.regulationUrl': 'URL del reglamento',
  'parks.openingHours': 'Horarios de apertura',
  'parks.contactEmail': 'Email de contacto',
  'parks.contactPhone': 'Teléfono de contacto',
  'parks.videoUrl': 'URL del video',
  'parks.certificaciones': 'Certificaciones',

  // ============================================
  // ACTIVITIES - Actividades
  // ============================================
  'activities.title': 'Título',
  'activities.description': 'Descripción',
  'activities.parkId': 'Parque',
  'activities.categoryId': 'Categoría',
  'activities.instructorId': 'Instructor',
  'activities.startDate': 'Fecha de inicio',
  'activities.endDate': 'Fecha de fin',
  'activities.startTime': 'Hora de inicio',
  'activities.endTime': 'Hora de fin',
  'activities.location': 'Ubicación',
  'activities.latitude': 'Latitud',
  'activities.longitude': 'Longitud',
  'activities.capacity': 'Capacidad',
  'activities.duration': 'Duración (minutos)',
  'activities.price': 'Precio',
  'activities.isFree': '¿Es gratuita?',
  'activities.materials': 'Materiales',
  'activities.requirements': 'Requisitos',
  'activities.isRecurring': '¿Es recurrente?',
  'activities.recurringDays': 'Días recurrentes',
  'activities.targetMarket': 'Mercado objetivo',
  'activities.specialNeeds': 'Necesidades especiales',
  'activities.allowsPublicRegistration': 'Permite registro público',
  'activities.maxRegistrations': 'Máximo de registros',
  'activities.registrationDeadline': 'Fecha límite de registro',
  'activities.registrationInstructions': 'Instrucciones de registro',
  'activities.requiresApproval': 'Requiere aprobación',
  'activities.ageRestrictions': 'Restricciones de edad',
  'activities.healthRequirements': 'Requisitos de salud',
  'activities.status': 'Estado',

  // ============================================
  // AMENITIES - Amenidades
  // ============================================
  'amenities.name': 'Nombre',
  'amenities.icon': 'Icono',
  'amenities.category': 'Categoría',
  'amenities.iconType': 'Tipo de icono',
  'amenities.customIconUrl': 'URL de icono personalizado',

  // ============================================
  // PARK_AMENITIES - Amenidades de Parques
  // ============================================
  'parkAmenities.parkId': 'Parque',
  'parkAmenities.amenityId': 'Amenidad',
  'parkAmenities.description': 'Descripción',
  'parkAmenities.moduleName': 'Nombre del módulo',
  'parkAmenities.locationLatitude': 'Latitud',
  'parkAmenities.locationLongitude': 'Longitud',
  'parkAmenities.surfaceArea': 'Superficie (m²)',
  'parkAmenities.status': 'Estado',

  // ============================================
  // TREES - Árboles
  // ============================================
  'trees.code': 'Código',
  'trees.park_id': 'Parque',
  'trees.species_id': 'Especie',
  'trees.area_id': 'Área',
  'trees.latitude': 'Latitud',
  'trees.longitude': 'Longitud',
  'trees.height': 'Altura (m)',
  'trees.trunk_diameter': 'Diámetro de tronco (cm)',
  'trees.age_estimate': 'Edad estimada (años)',
  'trees.canopy_coverage': 'Cobertura de copa (m²)',
  'trees.planting_date': 'Fecha de plantación',
  'trees.location_description': 'Descripción de ubicación',
  'trees.notes': 'Notas',
  'trees.condition': 'Condición',
  'trees.development_stage': 'Etapa de desarrollo',
  'trees.health_status': 'Estado de salud',
  'trees.has_hollows': '¿Tiene huecos?',
  'trees.has_exposed_roots': '¿Tiene raíces expuestas?',
  'trees.has_pests': '¿Tiene plagas?',
  'trees.is_protected': '¿Está protegido?',
  'trees.image_url': 'URL de imagen',

  // ============================================
  // TREE_SPECIES - Especies de Árboles
  // ============================================
  'treeSpecies.commonName': 'Nombre común',
  'treeSpecies.scientificName': 'Nombre científico',
  'treeSpecies.speciesCode': 'Código de especie',
  'treeSpecies.family': 'Familia',
  'treeSpecies.origin': 'Origen',

  // ============================================
  // ASSETS - Activos
  // ============================================
  'assets.name': 'Nombre',
  'assets.serialNumber': 'Número de serie',
  'assets.categoryId': 'Categoría',
  'assets.subcategoryId': 'Subcategoría',
  'assets.customAssetId': 'ID personalizado',
  'assets.description': 'Descripción',
  'assets.parkId': 'Parque',
  'assets.amenityId': 'Amenidad',
  'assets.locationDescription': 'Descripción de ubicación',
  'assets.latitude': 'Latitud',
  'assets.longitude': 'Longitud',
  'assets.manufacturer': 'Fabricante',
  'assets.model': 'Modelo',
  'assets.material': 'Material',
  'assets.dimensionsCapacity': 'Dimensiones/Capacidad',
  'assets.installationDate': 'Fecha de instalación',
  'assets.lastInspectionDate': 'Última inspección',
  'assets.estimatedUsefulLife': 'Vida útil estimada (meses)',
  'assets.status': 'Estado',
  'assets.condition': 'Condición',
  'assets.acquisitionValue': 'Valor de adquisición',
  'assets.currentValue': 'Valor actual',
  'assets.responsiblePersonId': 'Responsable',

  // ============================================
  // ASSET_CATEGORIES - Categorías de Activos
  // ============================================
  'assetCategories.name': 'Nombre',
  'assetCategories.description': 'Descripción',
  'assetCategories.icon': 'Icono',
  'assetCategories.color': 'Color',
  'assetCategories.parentId': 'Categoría padre',

  // ============================================
  // INSTRUCTORS - Instructores
  // ============================================
  'instructors.name': 'Nombre completo',
  'instructors.email': 'Email',
  'instructors.phone': 'Teléfono',
  'instructors.specialization': 'Especialización',
  'instructors.bio': 'Biografía',
  'instructors.certifications': 'Certificaciones',
  'instructors.status': 'Estado',
  'instructors.hourlyRate': 'Tarifa por hora',
  'instructors.availability': 'Disponibilidad',

  // ============================================
  // VOLUNTEERS - Voluntarios
  // ============================================
  'volunteers.firstName': 'Nombre',
  'volunteers.lastName': 'Apellidos',
  'volunteers.email': 'Email',
  'volunteers.phone': 'Teléfono',
  'volunteers.birthDate': 'Fecha de nacimiento',
  'volunteers.skills': 'Habilidades',
  'volunteers.availability': 'Disponibilidad',
  'volunteers.status': 'Estado',
  'volunteers.totalHours': 'Horas totales',

  // ============================================
  // USERS - Usuarios
  // ============================================
  'users.email': 'Email',
  'users.username': 'Nombre de usuario',
  'users.firstName': 'Nombre',
  'users.lastName': 'Apellido',
  'users.phone': 'Teléfono',
  'users.status': 'Estado',
  'users.position': 'Puesto',
  'users.department': 'Departamento',

  // ============================================
  // CONSUMABLES - Consumibles (Almacén)
  // ============================================
  'consumables.name': 'Nombre',
  'consumables.sku': 'SKU',
  'consumables.categoryId': 'Categoría',
  'consumables.description': 'Descripción',
  'consumables.unit': 'Unidad de medida',
  'consumables.minStock': 'Stock mínimo',
  'consumables.maxStock': 'Stock máximo',
  'consumables.reorderPoint': 'Punto de reorden',
  'consumables.unitCost': 'Costo unitario',
  'consumables.status': 'Estado',

  // ============================================
  // INCIDENTS - Incidencias
  // ============================================
  'incidents.title': 'Título',
  'incidents.description': 'Descripción',
  'incidents.parkId': 'Parque',
  'incidents.type': 'Tipo',
  'incidents.priority': 'Prioridad',
  'incidents.status': 'Estado',
  'incidents.reportedBy': 'Reportado por',
  'incidents.assignedTo': 'Asignado a',
  'incidents.location': 'Ubicación',
  'incidents.latitude': 'Latitud',
  'incidents.longitude': 'Longitud',

  // ============================================
  // CAMPOS COMUNES (aplicables a múltiples entidades)
  // ============================================
  'common.id': 'ID',
  'common.createdAt': 'Fecha de creación',
  'common.updatedAt': 'Última actualización',
  'common.deletedAt': 'Fecha de eliminación',
  'common.isDeleted': 'Eliminado',
  'common.isActive': 'Activo',
};

/**
 * Campos del sistema que NUNCA se exportan/importan
 */
export const SYSTEM_FIELDS = [
  'id',
  'createdAt', 
  'created_at',
  'updatedAt', 
  'updated_at',
  'deletedAt',
  'deleted_at',
  'isDeleted',
  'is_deleted',
];

/**
 * Campos que solo se pueden EXPORTAR (no importar)
 * Útil para campos calculados o autogenerados
 */
export const EXPORT_ONLY_FIELDS = [
  'id',
  'createdAt',
  'created_at',
  'slug', // Usualmente autogenerado
];

/**
 * Campos sensibles que requieren permisos especiales
 */
export const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'apiKey',
  'secretKey',
];

/**
 * Obtiene la etiqueta para un campo
 * @param entity Nombre de la entidad
 * @param field Nombre del campo
 * @returns Etiqueta o nombre humanizado como fallback
 */
export function getFieldLabel(entity: string, field: string): string {
  // Intentar con clave específica de entidad
  const specificKey = `${entity}.${field}`;
  if (FIELD_LABELS[specificKey]) {
    return FIELD_LABELS[specificKey];
  }
  
  // Intentar con clave común
  const commonKey = `common.${field}`;
  if (FIELD_LABELS[commonKey]) {
    return FIELD_LABELS[commonKey];
  }
  
  // Fallback: humanizar el nombre del campo
  return humanizeFieldName(field);
}

/**
 * Convierte un nombre de campo técnico a formato legible
 * Ejemplos:
 *   'parkType' → 'Park Type'
 *   'created_at' → 'Created At'
 *   'isActive' → 'Is Active'
 */
export function humanizeFieldName(fieldName: string): string {
  return fieldName
    // Convertir snake_case a espacios
    .replace(/_/g, ' ')
    // Insertar espacio antes de mayúsculas (camelCase)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Capitalizar primera letra de cada palabra
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim();
}

/**
 * Verifica si un campo es del sistema (no exportable/importable)
 */
export function isSystemField(fieldName: string): boolean {
  return SYSTEM_FIELDS.includes(fieldName);
}

/**
 * Verifica si un campo es solo de exportación
 */
export function isExportOnlyField(fieldName: string): boolean {
  return EXPORT_ONLY_FIELDS.includes(fieldName);
}

/**
 * Verifica si un campo es sensible
 */
export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELDS.some(sensitive => 
    fieldName.toLowerCase().includes(sensitive.toLowerCase())
  );
}
