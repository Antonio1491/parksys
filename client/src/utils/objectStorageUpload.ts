/**
 * UTILIDADES PARA OBJECT STORAGE
 * ===============================
 * 
 * Funciones para manejo de uploads con Object Storage de Replit
 * Migración completa desde filesystem local
 */

interface UploadResponse {
  uploadUrl: string;
  imageId: string;
  filename: string;
  [key: string]: any;
}

interface ConfirmResponse {
  imageUrl: string;
  success: boolean;
  [key: string]: any;
}

/**
 * Upload de imágenes de parques usando Object Storage
 */
export async function uploadParkImageOS(
  parkId: number,
  file: File,
  caption?: string,
  isPrimary?: boolean
): Promise<string> {
  try {
    console.log(`🚀 [FRONTEND] Iniciando upload OS para parque ${parkId}`);
    
    // 1. Obtener URL de upload
    const uploadResponse = await fetch(`/api/parks/${parkId}/images/upload-os`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Error obteniendo URL de upload: ${uploadResponse.statusText}`);
    }
    
    const uploadData: UploadResponse = await uploadResponse.json();
    console.log(`📤 [FRONTEND] URL de upload obtenida:`, uploadData);
    
    // 2. Subir archivo a Object Storage
    const fileUpload = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    });
    
    if (!fileUpload.ok) {
      throw new Error(`Error subiendo archivo: ${fileUpload.statusText}`);
    }
    
    console.log(`✅ [FRONTEND] Archivo subido exitosamente a Object Storage`);
    
    // 3. Confirmar upload y guardar en BD
    const confirmResponse = await fetch(`/api/parks/${parkId}/images/confirm-os`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        imageId: uploadData.imageId,
        filename: uploadData.filename,
        uploadUrl: uploadData.uploadUrl,
        caption: caption || '',
        isPrimary: isPrimary || false
      })
    });
    
    if (!confirmResponse.ok) {
      throw new Error(`Error confirmando upload: ${confirmResponse.statusText}`);
    }
    
    const confirmData = await confirmResponse.json();
    console.log(`💾 [FRONTEND] Upload confirmado:`, confirmData);
    
    return confirmData.imageUrl;
    
  } catch (error) {
    console.error('❌ [FRONTEND] Error en upload de imagen de parque:', error);
    throw error;
  }
}

/**
 * Upload de imágenes de actividades usando Object Storage
 */
export async function uploadActivityImageOS(
  activityId: number,
  file: File
): Promise<string> {
  try {
    console.log(`🚀 [FRONTEND] Iniciando upload OS para actividad ${activityId}`);
    
    // 1. Obtener URL de upload
    const uploadResponse = await fetch(`/api/activities/${activityId}/images/upload-os`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Error obteniendo URL de upload: ${uploadResponse.statusText}`);
    }
    
    const uploadData: UploadResponse = await uploadResponse.json();
    console.log(`📤 [FRONTEND] URL de upload obtenida para actividad:`, uploadData);
    
    // 2. Subir archivo a Object Storage
    const fileUpload = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    });
    
    if (!fileUpload.ok) {
      throw new Error(`Error subiendo archivo: ${fileUpload.statusText}`);
    }
    
    console.log(`✅ [FRONTEND] Archivo de actividad subido exitosamente a Object Storage`);
    
    // 3. Confirmar upload
    const confirmResponse = await fetch(`/api/activities/${activityId}/images/confirm-os`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        imageId: uploadData.imageId,
        filename: uploadData.filename,
        uploadUrl: uploadData.uploadUrl
      })
    });
    
    if (!confirmResponse.ok) {
      throw new Error(`Error confirmando upload: ${confirmResponse.statusText}`);
    }
    
    const confirmData: ConfirmResponse = await confirmResponse.json();
    console.log(`💾 [FRONTEND] Upload de actividad confirmado:`, confirmData);
    
    return confirmData.imageUrl;
    
  } catch (error) {
    console.error('❌ [FRONTEND] Error en upload de imagen de actividad:', error);
    throw error;
  }
}

/**
 * Upload de imágenes de eventos usando Object Storage
 */
export async function uploadEventImageOS(
  eventId: number,
  file: File
): Promise<string> {
  try {
    console.log(`🚀 [FRONTEND] Iniciando upload OS para evento ${eventId}`);
    
    // 1. Obtener URL de upload
    const uploadResponse = await fetch(`/api/events/${eventId}/images/upload-os`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Error obteniendo URL de upload: ${uploadResponse.statusText}`);
    }
    
    const uploadData: UploadResponse = await uploadResponse.json();
    console.log(`📤 [FRONTEND] URL de upload obtenida para evento:`, uploadData);
    
    // 2. Subir archivo a Object Storage
    const fileUpload = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    });
    
    if (!fileUpload.ok) {
      throw new Error(`Error subiendo archivo: ${fileUpload.statusText}`);
    }
    
    console.log(`✅ [FRONTEND] Archivo de evento subido exitosamente a Object Storage`);
    
    // 3. Confirmar upload
    const confirmResponse = await fetch(`/api/events/${eventId}/images/confirm-os`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        imageId: uploadData.imageId,
        filename: uploadData.filename,
        uploadUrl: uploadData.uploadUrl
      })
    });
    
    if (!confirmResponse.ok) {
      throw new Error(`Error confirmando upload: ${confirmResponse.statusText}`);
    }
    
    const confirmData: ConfirmResponse = await confirmResponse.json();
    console.log(`💾 [FRONTEND] Upload de evento confirmado:`, confirmData);
    
    return confirmData.imageUrl;
    
  } catch (error) {
    console.error('❌ [FRONTEND] Error en upload de imagen de evento:', error);
    throw error;
  }
}

/**
 * Upload genérico usando Object Storage
 */
export async function uploadGenericFileOS(
  category: string,
  entityId: string | number,
  file: File
): Promise<string> {
  try {
    console.log(`🚀 [FRONTEND] Iniciando upload genérico OS para ${category}:${entityId}`);
    
    // 1. Obtener URL de upload
    const uploadResponse = await fetch('/api/object-storage/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        category,
        entityId
      })
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Error obteniendo URL de upload: ${uploadResponse.statusText}`);
    }
    
    const uploadData: UploadResponse = await uploadResponse.json();
    console.log(`📤 [FRONTEND] URL de upload genérica obtenida:`, uploadData);
    
    // 2. Subir archivo a Object Storage
    const fileUpload = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    });
    
    if (!fileUpload.ok) {
      throw new Error(`Error subiendo archivo: ${fileUpload.statusText}`);
    }
    
    console.log(`✅ [FRONTEND] Archivo genérico subido exitosamente a Object Storage`);
    
    // Para uploads genéricos, retornamos la URL normalizada
    return `/objects/uploads/${uploadData.uploadId}`;
    
  } catch (error) {
    console.error('❌ [FRONTEND] Error en upload genérico:', error);
    throw error;
  }
}

/**
 * Upload de fotos de especies de árboles usando Object Storage
 */
export async function uploadTreeSpeciesPhotoOS(
  speciesId: number,
  file: File
): Promise<string> {
  try {
    console.log(`🚀 [FRONTEND] Iniciando upload OS para especie de árbol ${speciesId}`);
    
    // 1. Obtener URL de upload
    const uploadResponse = await fetch(`/api/tree-species/${speciesId}/photo/upload-os`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Error obteniendo URL de upload: ${uploadResponse.statusText}`);
    }
    
    const uploadData: UploadResponse = await uploadResponse.json();
    console.log(`📤 [FRONTEND] URL de upload obtenida para especie:`, uploadData);
    
    // 2. Subir archivo a Object Storage
    const fileUpload = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    });
    
    if (!fileUpload.ok) {
      throw new Error(`Error subiendo archivo: ${fileUpload.statusText}`);
    }
    
    console.log(`✅ [FRONTEND] Foto de especie subida exitosamente a Object Storage`);
    
    // 3. Confirmar upload
    const confirmResponse = await fetch(`/api/tree-species/${speciesId}/photo/confirm-os`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        imageId: uploadData.imageId,
        filename: uploadData.filename,
        uploadUrl: uploadData.uploadUrl
      })
    });
    
    if (!confirmResponse.ok) {
      throw new Error(`Error confirmando upload: ${confirmResponse.statusText}`);
    }
    
    const confirmData = await confirmResponse.json();
    console.log(`💾 [FRONTEND] Upload de foto de especie confirmado:`, confirmData);
    
    return confirmData.photoUrl;
    
  } catch (error) {
    console.error('❌ [FRONTEND] Error en upload de foto de especie:', error);
    throw error;
  }
}

/**
 * Upload de iconos de especies de árboles usando Object Storage
 */
export async function uploadTreeSpeciesIconOS(
  speciesId: number,
  file: File
): Promise<string> {
  try {
    console.log(`🚀 [FRONTEND] Iniciando upload OS para icono de especie ${speciesId}`);
    
    // 1. Obtener URL de upload
    const uploadResponse = await fetch(`/api/tree-species/${speciesId}/icon/upload-os`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Error obteniendo URL de upload: ${uploadResponse.statusText}`);
    }
    
    const uploadData: UploadResponse = await uploadResponse.json();
    console.log(`📤 [FRONTEND] URL de upload obtenida para icono:`, uploadData);
    
    // 2. Subir archivo a Object Storage
    const fileUpload = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    });
    
    if (!fileUpload.ok) {
      throw new Error(`Error subiendo archivo: ${fileUpload.statusText}`);
    }
    
    console.log(`✅ [FRONTEND] Icono de especie subido exitosamente a Object Storage`);
    
    // 3. Confirmar upload
    const confirmResponse = await fetch(`/api/tree-species/${speciesId}/icon/confirm-os`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        imageId: uploadData.imageId,
        filename: uploadData.filename,
        uploadUrl: uploadData.uploadUrl
      })
    });
    
    if (!confirmResponse.ok) {
      throw new Error(`Error confirmando upload: ${confirmResponse.statusText}`);
    }
    
    const confirmData = await confirmResponse.json();
    console.log(`💾 [FRONTEND] Upload de icono de especie confirmado:`, confirmData);
    
    return confirmData.iconUrl;
    
  } catch (error) {
    console.error('❌ [FRONTEND] Error en upload de icono de especie:', error);
    throw error;
  }
}

/**
 * Verificar health check de Object Storage
 */
export async function checkObjectStorageHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/object-storage/health');
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('❌ [FRONTEND] Error verificando health de Object Storage:', error);
    return false;
  }
}