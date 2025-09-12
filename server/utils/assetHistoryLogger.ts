/**
 * SECURE SERVER-SIDE ASSET HISTORY LOGGER
 * 
 * This module provides secure server-side functions for logging asset history.
 * These functions should ONLY be called from server-side operations to prevent
 * forged history entries from clients.
 */

import { pool } from '../db';
import type { PoolClient } from 'pg';

// Field labels for user-friendly descriptions
const FIELD_LABELS: { [key: string]: string } = {
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

// Status and condition translations
const STATUS_TRANSLATIONS: { [key: string]: string } = {
  'active': 'Activo',
  'activo': 'Activo',
  'maintenance': 'Mantenimiento',
  'mantenimiento': 'Mantenimiento',
  'retired': 'Retirado',
  'retirado': 'Retirado',
  'damaged': 'Dañado',
  'dañado': 'Dañado',
  'storage': 'Almacenado',
  'almacenado': 'Almacenado',
  'inactive': 'Inactivo',
  'inactivo': 'Inactivo'
};

const CONDITION_TRANSLATIONS: { [key: string]: string } = {
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
function formatValueForHistory(value: any, fieldName: string): string {
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
 * Normalize values for comparison
 */
function normalizeValue(value: any): any {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Handle string numbers
  if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
    return Number(value);
  }
  
  return value;
}

/**
 * Check if two values are effectively equal (handles null/undefined/empty string equivalence)
 */
function valuesAreEqual(oldValue: any, newValue: any): boolean {
  const normalizedOld = normalizeValue(oldValue);
  const normalizedNew = normalizeValue(newValue);
  
  return normalizedOld === normalizedNew;
}

/**
 * SECURE: Create a history entry within a transaction
 * This function should ONLY be called from server-side operations
 */
async function createHistoryEntry(
  client: PoolClient | typeof pool,
  assetId: number,
  changeType: string,
  description: string,
  fieldName?: string,
  previousValue?: any,
  newValue?: any,
  userId?: number,
  notes?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const query = `
      INSERT INTO asset_history (
        asset_id, change_type, previous_value, 
        new_value, description, changed_by, notes, 
        date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, NOW())
    `;

    await client.query(query, [
      assetId,
      changeType,
      previousValue ? String(previousValue) : null,
      newValue ? String(newValue) : null,
      description,
      userId ? `User ID: ${userId}` : 'Sistema',
      notes || null
    ]);

    console.log(`🔒 [SECURE HISTORY] ${changeType}: ${description} para activo ${assetId}`);
  } catch (error) {
    console.error('🚨 [SECURE HISTORY] Error creating history entry:', error);
    throw error; // Re-throw to ensure transaction rollback
  }
}

/**
 * SECURE: Log asset creation within a transaction
 */
export async function logAssetCreation(
  client: PoolClient | typeof pool,
  assetId: number,
  assetData: any,
  userId?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    // Get category and park names for better description
    let categoryName = 'No especificada';
    let parkName = 'No especificado';
    
    if (assetData.categoryId) {
      const categoryResult = await client.query(
        'SELECT name FROM asset_categories WHERE id = $1',
        [assetData.categoryId]
      );
      if (categoryResult.rows.length > 0) {
        categoryName = categoryResult.rows[0].name;
      }
    }
    
    if (assetData.parkId) {
      const parkResult = await client.query(
        'SELECT name FROM parks WHERE id = $1',
        [assetData.parkId]
      );
      if (parkResult.rows.length > 0) {
        parkName = parkResult.rows[0].name;
      }
    }

    const description = `Activo creado: ${assetData.name}`;
    const notes = `Categoría: ${categoryName}, Parque: ${parkName}, Estado: ${formatValueForHistory(assetData.status, 'status')}`;

    await createHistoryEntry(
      client,
      assetId,
      'creation',
      description,
      undefined,
      undefined,
      undefined,
      userId,
      notes,
      ipAddress,
      userAgent
    );
  } catch (error) {
    console.error('🚨 [SECURE HISTORY] Error logging asset creation:', error);
    throw error;
  }
}

/**
 * SECURE: Log asset updates within a transaction by comparing old and new data
 */
export async function logAssetUpdate(
  client: PoolClient | typeof pool,
  assetId: number,
  previousData: any,
  newData: any,
  userId?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    // Important fields to track for changes
    const fieldsToTrack = [
      'name', 'status', 'condition', 'parkId', 'categoryId', 
      'manufacturer', 'model', 'serialNumber', 'acquisitionCost', 
      'currentValue', 'responsiblePersonId', 'locationDescription', 
      'notes', 'description', 'acquisitionDate', 'installationDate',
      'material', 'dimensionsCapacity', 'estimatedUsefulLife',
      'assignedArea', 'latitude', 'longitude', 'amenityId',
      'financingSource', 'usagePolicies', 'maintenanceManualUrl'
    ];

    // Track each changed field
    for (const field of fieldsToTrack) {
      const oldValue = previousData[field];
      const newValue = newData[field];
      
      // Skip if values are effectively the same
      if (valuesAreEqual(oldValue, newValue)) {
        continue;
      }

      // Create description based on field type
      let description = `Campo '${FIELD_LABELS[field] || field}' actualizado`;
      let fieldName = field;
      let previousValue = oldValue;
      let currentValue = newValue;
      
      // Special handling for reference fields
      if (field === 'categoryId') {
        try {
          const [oldCat, newCat] = await Promise.all([
            oldValue ? client.query('SELECT name FROM asset_categories WHERE id = $1', [oldValue]) : Promise.resolve({ rows: [] }),
            newValue ? client.query('SELECT name FROM asset_categories WHERE id = $1', [newValue]) : Promise.resolve({ rows: [] })
          ]);
          
          const oldCategoryName = oldCat.rows[0]?.name || 'No especificada';
          const newCategoryName = newCat.rows[0]?.name || 'No especificada';
          description = `Categoría cambiada de '${oldCategoryName}' a '${newCategoryName}'`;
        } catch (error) {
          console.error('Error getting category names for history:', error);
        }
      } else if (field === 'parkId') {
        try {
          const [oldPark, newPark] = await Promise.all([
            oldValue ? client.query('SELECT name FROM parks WHERE id = $1', [oldValue]) : Promise.resolve({ rows: [] }),
            newValue ? client.query('SELECT name FROM parks WHERE id = $1', [newValue]) : Promise.resolve({ rows: [] })
          ]);
          
          const oldParkName = oldPark.rows[0]?.name || 'No especificado';
          const newParkName = newPark.rows[0]?.name || 'No especificado';
          description = `Parque cambiado de '${oldParkName}' a '${newParkName}'`;
        } catch (error) {
          console.error('Error getting park names for history:', error);
        }
      } else if (field === 'responsiblePersonId') {
        try {
          const [oldUser, newUser] = await Promise.all([
            oldValue ? client.query('SELECT full_name FROM users WHERE id = $1', [oldValue]) : Promise.resolve({ rows: [] }),
            newValue ? client.query('SELECT full_name FROM users WHERE id = $1', [newValue]) : Promise.resolve({ rows: [] })
          ]);
          
          const oldUserName = oldUser.rows[0]?.full_name || 'No asignado';
          const newUserName = newUser.rows[0]?.full_name || 'No asignado';
          description = `Responsable cambiado de '${oldUserName}' a '${newUserName}'`;
        } catch (error) {
          console.error('Error getting user names for history:', error);
        }
      } else {
        // For other fields, use formatted values
        const formattedOld = formatValueForHistory(oldValue, field);
        const formattedNew = formatValueForHistory(newValue, field);
        description = `${FIELD_LABELS[field] || field} cambiado de '${formattedOld}' a '${formattedNew}'`;
      }

      await createHistoryEntry(
        client,
        assetId,
        'update',
        description,
        undefined,
        previousValue,
        currentValue,
        userId,
        undefined
      );
    }
  } catch (error) {
    console.error('🚨 [SECURE HISTORY] Error logging asset update:', error);
    throw error;
  }
}

/**
 * SECURE: Log asset deletion within a transaction
 */
export async function logAssetDeletion(
  client: PoolClient | typeof pool,
  assetId: number,
  assetData: any,
  userId?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const description = `Activo eliminado: ${assetData.name}`;
    const notes = `Estado al momento de eliminación: ${formatValueForHistory(assetData.status, 'status')}, Condición: ${formatValueForHistory(assetData.condition, 'condition')}`;

    await createHistoryEntry(
      client,
      assetId,
      'deletion',
      description,
      undefined,
      undefined,
      undefined,
      userId,
      notes,
      ipAddress,
      userAgent
    );
  } catch (error) {
    console.error('🚨 [SECURE HISTORY] Error logging asset deletion:', error);
    throw error;
  }
}

/**
 * SECURE: Log asset maintenance actions within a transaction
 */
export async function logAssetMaintenance(
  client: PoolClient | typeof pool,
  assetId: number,
  maintenanceData: any,
  userId?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const description = `Mantenimiento registrado: ${maintenanceData.maintenanceType || 'Tipo no especificado'}`;
    const notes = `Descripción: ${maintenanceData.description || 'N/A'}, Costo: ${maintenanceData.cost || 'N/A'}`;

    await createHistoryEntry(
      client,
      assetId,
      'maintenance',
      description,
      'maintenanceType',
      null,
      maintenanceData.maintenanceType,
      userId,
      notes,
      ipAddress,
      userAgent
    );
  } catch (error) {
    console.error('🚨 [SECURE HISTORY] Error logging asset maintenance:', error);
    throw error;
  }
}

/**
 * SECURE: Log custom asset events within a transaction
 */
export async function logAssetEvent(
  client: PoolClient | typeof pool,
  assetId: number,
  eventType: string,
  description: string,
  fieldName?: string,
  previousValue?: any,
  newValue?: any,
  userId?: number,
  notes?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await createHistoryEntry(
      client,
      assetId,
      eventType,
      description,
      fieldName,
      previousValue,
      newValue,
      userId,
      notes,
      ipAddress,
      userAgent
    );
  } catch (error) {
    console.error('🚨 [SECURE HISTORY] Error logging asset event:', error);
    throw error;
  }
}