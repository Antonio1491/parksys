/**
 * Utility functions for automatic asset history tracking
 */
import { apiRequest } from '@/lib/queryClient';

// Field labels for user-friendly descriptions
export const FIELD_LABELS: { [key: string]: string } = {
  name: 'Nombre',
  status: 'Estado',
  condition: 'Condición',
  parkId: 'Parque',
  categoryId: 'Categoría',
  manufacturer: 'Fabricante',
  model: 'Modelo',
  serialNumber: 'Número de Serie',
  acquisitionCost: 'Costo de Adquisición',
  currentValue: 'Valor Actual',
  responsiblePersonId: 'Responsable',
  locationDescription: 'Descripción de Ubicación',
  notes: 'Notas',
  description: 'Descripción',
  acquisitionDate: 'Fecha de Adquisición',
  installationDate: 'Fecha de Instalación',
  material: 'Material',
  dimensionsCapacity: 'Dimensiones/Capacidad',
  estimatedUsefulLife: 'Vida Útil Estimada',
  assignedArea: 'Área Asignada',
  latitude: 'Latitud',
  longitude: 'Longitud',
  amenityId: 'Amenidad',
  financingSource: 'Fuente de Financiamiento',
  usagePolicies: 'Políticas de Uso',
  maintenanceManualUrl: 'Manual de Mantenimiento',
};

// Status translations for better descriptions
export const STATUS_TRANSLATIONS: { [key: string]: string } = {
  'active': 'Activo',
  'activo': 'Activo',
  'maintenance': 'Mantenimiento',
  'mantenimiento': 'Mantenimiento',
  'retired': 'Retirado',
  'retirado': 'Retirado',
  'damaged': 'Dañado',
  'dañado': 'Dañado',
  'storage': 'Almacenado',
  'almacenado': 'Almacenado'
};

// Condition translations
export const CONDITION_TRANSLATIONS: { [key: string]: string } = {
  'excellent': 'Excelente',
  'excelente': 'Excelente',
  'good': 'Bueno',
  'bueno': 'Bueno',
  'fair': 'Regular',
  'regular': 'Regular',
  'poor': 'Malo',
  'malo': 'Malo',
  'critical': 'Crítico',
  'crítico': 'Crítico'
};

/**
 * Format value for display in history descriptions
 */
export function formatValueForHistory(value: any, fieldName: string): string {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  // Handle status translations
  if (fieldName === 'status') {
    return STATUS_TRANSLATIONS[value] || value;
  }

  // Handle condition translations
  if (fieldName === 'condition') {
    return CONDITION_TRANSLATIONS[value] || value;
  }

  // Handle currency values
  if (fieldName === 'acquisitionCost' || fieldName === 'currentValue') {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(Number(value));
  }

  // Handle dates
  if (fieldName.toLowerCase().includes('date')) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (e) {
      // If date parsing fails, return the original value
    }
  }

  return String(value);
}

/**
 * Get category name from ID using categories data
 */
export function getCategoryName(categoryId: number | null, categories: any[]): string {
  if (!categoryId || !categories || categories.length === 0) {
    return 'No especificada';
  }
  
  const category = categories.find(cat => cat.id === categoryId);
  return category?.name || 'Categoría desconocida';
}

/**
 * Get park name from ID using parks data
 */
export function getParkName(parkId: number | null, parks: any[]): string {
  if (!parkId || !parks || parks.length === 0) {
    return 'No especificado';
  }
  
  const park = parks.find(p => p.id === parkId);
  return park?.name || 'Parque desconocido';
}

/**
 * Get user name from ID using users data
 */
export function getUserName(userId: number | null, users: any[]): string {
  if (!userId || !users || users.length === 0) {
    return 'No asignado';
  }
  
  const user = users.find(u => u.id === userId);
  return user?.fullName || user?.full_name || 'Usuario desconocido';
}

/**
 * Create a creation history entry
 */
export async function logAssetCreation(
  assetId: number,
  assetData: any,
  categories: any[] = [],
  parks: any[] = [],
  users: any[] = []
): Promise<void> {
  try {
    const categoryName = getCategoryName(assetData.categoryId, categories);
    const parkName = getParkName(assetData.parkId, parks);
    
    await apiRequest(`/api/assets/${assetId}/history`, {
      method: 'POST',
      data: {
        changeType: 'creation',
        description: `Activo creado: ${assetData.name}`,
        notes: `Categoría: ${categoryName}, Parque: ${parkName}, Estado: ${formatValueForHistory(assetData.status, 'status')}`
      }
    });
    
    console.log(`✅ Entrada de historial de creación registrada para activo ${assetId}`);
  } catch (error) {
    console.error('Error al registrar entrada de historial de creación:', error);
    // Don't throw the error to avoid breaking the main flow
  }
}

/**
 * Detect field changes and create history entries
 */
export async function logAssetUpdate(
  assetId: number,
  previousData: any,
  newData: any,
  categories: any[] = [],
  parks: any[] = [],
  users: any[] = []
): Promise<void> {
  try {
    const changes: Array<{
      fieldName: string;
      previousValue: any;
      newValue: any;
      description: string;
    }> = [];

    // Important fields to track
    const fieldsToTrack = [
      'name', 'status', 'condition', 'parkId', 'categoryId', 
      'manufacturer', 'model', 'serialNumber', 'acquisitionCost', 
      'currentValue', 'responsiblePersonId', 'locationDescription', 
      'notes', 'description', 'acquisitionDate', 'installationDate',
      'material', 'dimensionsCapacity', 'estimatedUsefulLife',
      'assignedArea', 'latitude', 'longitude', 'amenityId',
      'financingSource', 'usagePolicies', 'maintenanceManualUrl'
    ];

    // Check for changes in each field
    for (const field of fieldsToTrack) {
      const oldValue = previousData[field];
      const newValue = newData[field];
      
      // Skip if values are the same (handle null/undefined equality)
      if (oldValue === newValue) continue;
      
      // Handle cases where null/undefined/empty string should be considered equal
      const normalizeValue = (val: any) => {
        if (val === null || val === undefined || val === '') return null;
        return val;
      };
      
      const normalizedOld = normalizeValue(oldValue);
      const normalizedNew = normalizeValue(newValue);
      
      if (normalizedOld === normalizedNew) continue;

      // Create description based on field type
      let description = `Campo '${FIELD_LABELS[field] || field}' actualizado`;
      
      // Special handling for reference fields
      if (field === 'categoryId') {
        const oldCategoryName = getCategoryName(oldValue, categories);
        const newCategoryName = getCategoryName(newValue, categories);
        description = `Categoría cambiada de '${oldCategoryName}' a '${newCategoryName}'`;
      } else if (field === 'parkId') {
        const oldParkName = getParkName(oldValue, parks);
        const newParkName = getParkName(newValue, parks);
        description = `Parque cambiado de '${oldParkName}' a '${newParkName}'`;
      } else if (field === 'responsiblePersonId') {
        const oldUserName = getUserName(oldValue, users);
        const newUserName = getUserName(newValue, users);
        description = `Responsable cambiado de '${oldUserName}' a '${newUserName}'`;
      } else {
        const oldFormatted = formatValueForHistory(oldValue, field);
        const newFormatted = formatValueForHistory(newValue, field);
        description = `${FIELD_LABELS[field] || field} actualizado de '${oldFormatted}' a '${newFormatted}'`;
      }

      changes.push({
        fieldName: field,
        previousValue: oldValue,
        newValue: newValue,
        description: description
      });
    }

    // Create history entries for each change
    for (const change of changes) {
      let changeType = 'updated';
      
      // Special change types for certain fields
      if (change.fieldName === 'status') {
        changeType = 'status_changed';
      } else if (change.fieldName === 'locationDescription' || 
                 change.fieldName === 'latitude' || 
                 change.fieldName === 'longitude') {
        changeType = 'location_changed';
      }

      await apiRequest(`/api/assets/${assetId}/history`, {
        method: 'POST',
        data: {
          changeType: changeType,
          fieldName: change.fieldName,
          previousValue: change.previousValue ? String(change.previousValue) : null,
          newValue: change.newValue ? String(change.newValue) : null,
          description: change.description
        }
      });
    }

    if (changes.length > 0) {
      console.log(`✅ ${changes.length} entradas de historial de actualización registradas para activo ${assetId}`);
    } else {
      console.log(`ℹ️ No se detectaron cambios para registrar en el historial del activo ${assetId}`);
    }
  } catch (error) {
    console.error('Error al registrar entradas de historial de actualización:', error);
    // Don't throw the error to avoid breaking the main flow
  }
}

/**
 * Log a simple history entry
 */
export async function logSimpleEntry(
  assetId: number,
  changeType: string,
  description: string,
  notes?: string
): Promise<void> {
  try {
    await apiRequest(`/api/assets/${assetId}/history`, {
      method: 'POST',
      data: {
        changeType,
        description,
        notes
      }
    });
    
    console.log(`✅ Entrada de historial registrada para activo ${assetId}: ${changeType} - ${description}`);
  } catch (error) {
    console.error('Error al registrar entrada de historial:', error);
  }
}