/**
 * UTILIDADES DE OBJECT STORAGE PARA FRONTEND
 * =========================================
 * 
 * Sistema de upload persistente que garantiza 
 * que las imágenes sobrevivan a deployments.
 */

import { apiRequest } from '@/lib/queryClient';

interface ObjectStorageUploadResult {
  success: boolean;
  imageId: string;
  filename: string;
  imageUrl: string;
  error?: string;
}

/**
 * 🚀 FUNCIÓN PRINCIPAL: Upload de imagen de parque con Object Storage
 * Garantiza persistencia total en deployments
 */
export async function uploadParkImageWithObjectStorage(
  parkId: number,
  file: File,
  caption: string = '',
  isPrimary: boolean = false
): Promise<ObjectStorageUploadResult> {
  try {
    console.log(`🚀 [OBJECT-STORAGE] Iniciando upload para parque ${parkId}`);
    console.log(`📁 [OBJECT-STORAGE] Archivo: ${file.name}, Tamaño: ${file.size} bytes`);

    // PASO 1: Obtener URL de upload del backend
    const uploadResponse = await fetch(`/api/parks/${parkId}/images/upload-os`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer direct-token-1750522117022',
        'X-User-Id': '1',
        'X-User-Role': 'super_admin',
        'Content-Type': 'application/json'
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`Error obteniendo URL de upload: ${uploadResponse.status}`);
    }

    const { uploadUrl, imageId, filename } = await uploadResponse.json();
    console.log(`📤 [OBJECT-STORAGE] URL de upload obtenida: ${uploadUrl}`);

    // PASO 2: Subir archivo directamente a Object Storage
    const uploadFileResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file
    });

    if (!uploadFileResponse.ok) {
      throw new Error(`Error subiendo archivo a Object Storage: ${uploadFileResponse.status}`);
    }

    console.log(`✅ [OBJECT-STORAGE] Archivo subido exitosamente a Object Storage`);

    // PASO 3: Confirmar upload y guardar metadata en la base de datos
    const confirmResponse = await fetch(`/api/parks/${parkId}/images/confirm-os`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer direct-token-1750522117022',
        'X-User-Id': '1',
        'X-User-Role': 'super_admin',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageId,
        filename,
        caption,
        isPrimary,
        uploadUrl
      })
    });

    if (!confirmResponse.ok) {
      throw new Error(`Error confirmando upload: ${confirmResponse.status}`);
    }

    const confirmData = await confirmResponse.json();
    console.log(`🎯 [OBJECT-STORAGE] Upload confirmado y guardado en DB:`, confirmData);

    return {
      success: true,
      imageId: confirmData.id,
      filename: confirmData.filename || filename,
      imageUrl: confirmData.imageUrl
    };

  } catch (error) {
    console.error('❌ [OBJECT-STORAGE] Error en upload:', error);
    return {
      success: false,
      imageId: '',
      filename: '',
      imageUrl: '',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * 🔄 FUNCIÓN DE FALLBACK: Si Object Storage falla, usa sistema tradicional
 * Solo para compatibilidad - no garantiza persistencia
 */
export async function uploadParkImageFallback(
  parkId: number,
  file: File,
  caption: string = '',
  isPrimary: boolean = false
): Promise<ObjectStorageUploadResult> {
  try {
    console.log(`⚠️ [FALLBACK] Usando sistema traditional (no persistente)`);
    
    const formData = new FormData();
    formData.append('imageFile', file);
    formData.append('caption', caption);
    formData.append('isPrimary', isPrimary.toString());

    const response = await fetch(`/api/parks/${parkId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer direct-token-1750522117022',
        'X-User-Id': '1',
        'X-User-Role': 'super_admin'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Error en upload fallback: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ [FALLBACK] Upload completado (no persistente):`, data);

    return {
      success: true,
      imageId: data.id,
      filename: data.filename || '',
      imageUrl: data.imageUrl
    };

  } catch (error) {
    console.error('❌ [FALLBACK] Error en upload fallback:', error);
    return {
      success: false,
      imageId: '',
      filename: '',
      imageUrl: '',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * 🎯 FUNCIÓN INTELIGENTE: Intenta Object Storage primero, fallback automático
 * Recomendada para uso general
 */
export async function uploadParkImageSmart(
  parkId: number,
  file: File,
  caption: string = '',
  isPrimary: boolean = false
): Promise<ObjectStorageUploadResult> {
  console.log(`🧠 [SMART-UPLOAD] Iniciando upload inteligente`);
  
  // Intentar Object Storage primero
  const objectStorageResult = await uploadParkImageWithObjectStorage(parkId, file, caption, isPrimary);
  
  if (objectStorageResult.success) {
    console.log(`✅ [SMART-UPLOAD] Object Storage exitoso - PERSISTENCIA GARANTIZADA`);
    return objectStorageResult;
  }
  
  // Si falla, usar fallback
  console.log(`⚠️ [SMART-UPLOAD] Object Storage falló, usando fallback...`);
  const fallbackResult = await uploadParkImageFallback(parkId, file, caption, isPrimary);
  
  if (fallbackResult.success) {
    console.log(`✅ [SMART-UPLOAD] Fallback exitoso - persistencia NO garantizada`);
  }
  
  return fallbackResult;
}