/**
 * UNIFIED OBJECT STORAGE SERVICE
 * ==============================
 *
 * Servicio unificado que automáticamente selecciona el backend de almacenamiento:
 * - En Replit: usa Replit Object Storage
 * - En otros entornos (Railway, etc.): usa Google Cloud Storage
 */

import { Response } from "express";
import { replitObjectStorage, ReplitObjectStorageService } from "./objectStorage-replit";
import { gcsObjectStorage, GCSObjectStorageService } from "./objectStorage-gcs";

// Detectar entorno
const isReplit = !!(process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT);

export class UnifiedObjectStorageService {
  private backend: ReplitObjectStorageService | GCSObjectStorageService;
  private backendName: string;

  constructor() {
    if (isReplit && replitObjectStorage.isServiceAvailable()) {
      this.backend = replitObjectStorage;
      this.backendName = 'Replit Object Storage';
      console.log('🔄 [STORAGE] Usando Replit Object Storage');
    } else if (gcsObjectStorage.isServiceAvailable()) {
      this.backend = gcsObjectStorage;
      this.backendName = 'Google Cloud Storage';
      console.log('🔄 [STORAGE] Usando Google Cloud Storage');
    } else {
      // Fallback - usar GCS aunque no esté disponible (mostrará errores)
      this.backend = gcsObjectStorage;
      this.backendName = 'None (Storage no disponible)';
      console.warn('⚠️ [STORAGE] Ningún backend de almacenamiento disponible');
    }
  }

  /**
   * Obtener nombre del backend actual
   */
  getBackendName(): string {
    return this.backendName;
  }

  /**
   * Verificar si el servicio está disponible
   */
  isServiceAvailable(): boolean {
    return this.backend.isServiceAvailable();
  }

  /**
   * 🚀 UPLOAD: Subir archivo
   */
  async uploadFile(file: Buffer, filename: string): Promise<string> {
    return this.backend.uploadFile(file, filename);
  }

  /**
   * 📥 DOWNLOAD AS BUFFER: Descargar archivo como Buffer
   */
  async downloadFile(filename: string): Promise<Buffer | null> {
    return this.backend.downloadFile(filename);
  }

  /**
   * 📥 DOWNLOAD TO RESPONSE: Descargar archivo para servir al cliente
   */
  async downloadFileToResponse(filename: string, res: Response): Promise<void> {
    return this.backend.downloadFileToResponse(filename, res);
  }

  /**
   * 🗑️ DELETE: Eliminar archivo
   */
  async deleteFile(filename: string): Promise<boolean> {
    return this.backend.deleteFile(filename);
  }

  /**
   * 📂 LIST: Listar archivos
   */
  async listFiles(prefix?: string): Promise<string[]> {
    return this.backend.listFiles(prefix);
  }

  /**
   * 🔍 EXISTS: Verificar si un archivo existe
   */
  async fileExists(filename: string): Promise<boolean> {
    return this.backend.fileExists(filename);
  }

  /**
   * 🔗 PUBLIC URL: Generar URL pública para archivo
   */
  getPublicUrl(filename: string): string {
    return this.backend.getPublicUrl(filename);
  }
}

// Instancia singleton del servicio unificado
export const unifiedObjectStorage = new UnifiedObjectStorageService();

// Re-exportar para compatibilidad
export { replitObjectStorage } from "./objectStorage-replit";
export { gcsObjectStorage } from "./objectStorage-gcs";
