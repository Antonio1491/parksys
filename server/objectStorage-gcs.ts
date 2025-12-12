/**
 * GOOGLE CLOUD STORAGE SERVICE
 * ============================
 *
 * Servicio de almacenamiento usando Google Cloud Storage.
 * Se usa como alternativa a Replit Object Storage en entornos como Railway.
 */

import { Storage } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

// Configuración de GCS
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || "parksys_central";
const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID || "parksys-c3d30";

// Inicializar cliente de GCS
let gcsClient: Storage | null = null;
let gcsBucket: any = null;

function initializeGCS() {
  if (gcsClient) return true;

  try {
    // Opción 1: Credenciales desde variable de entorno (JSON string)
    if (process.env.GCS_CREDENTIALS) {
      const credentials = JSON.parse(process.env.GCS_CREDENTIALS);
      gcsClient = new Storage({
        projectId: GCS_PROJECT_ID,
        credentials: credentials,
      });
      console.log('✅ [GCS] Cliente inicializado con credenciales de variable de entorno');
    }
    // Opción 2: Credenciales desde archivo
    else if (process.env.GCS_KEY_FILE) {
      gcsClient = new Storage({
        projectId: GCS_PROJECT_ID,
        keyFilename: process.env.GCS_KEY_FILE,
      });
      console.log('✅ [GCS] Cliente inicializado con archivo de credenciales');
    }
    // Opción 3: Credenciales por defecto (ADC - para desarrollo local con gcloud auth)
    else {
      gcsClient = new Storage({
        projectId: GCS_PROJECT_ID,
      });
      console.log('✅ [GCS] Cliente inicializado con credenciales por defecto (ADC)');
    }

    gcsBucket = gcsClient.bucket(GCS_BUCKET_NAME);
    console.log(`✅ [GCS] Bucket configurado: ${GCS_BUCKET_NAME}`);
    return true;

  } catch (error) {
    console.error('❌ [GCS] Error inicializando cliente:', error);
    return false;
  }
}

// Intentar inicializar al cargar el módulo
const isGCSAvailable = initializeGCS();

export class GCSObjectStorageService {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = isGCSAvailable && !!gcsBucket;
    if (this.isAvailable) {
      console.log('✅ [GCS] Servicio de Google Cloud Storage disponible');
    } else {
      console.log('ℹ️ [GCS] Servicio de Google Cloud Storage no disponible');
    }
  }

  /**
   * Verificar si el servicio está disponible
   */
  isServiceAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * 🚀 UPLOAD: Subir archivo a GCS
   */
  async uploadFile(file: Buffer, filename: string): Promise<string> {
    if (!this.isAvailable || !gcsBucket) {
      throw new Error('Google Cloud Storage no está disponible');
    }

    try {
      const uniqueFilename = `uploads/${Date.now()}-${randomUUID()}-${filename}`;

      console.log(`📤 [GCS] Subiendo archivo: ${uniqueFilename}`);
      console.log(`📤 [GCS] Tamaño: ${file.length} bytes`);

      const blob = gcsBucket.file(uniqueFilename);
      await blob.save(file, {
        resumable: false,
        metadata: {
          contentType: this.getContentType(filename),
        },
      });

      console.log(`✅ [GCS] Upload exitoso: ${uniqueFilename}`);
      return uniqueFilename;

    } catch (error) {
      console.error('❌ [GCS] Error en upload:', error);
      throw error;
    }
  }

  /**
   * 📥 DOWNLOAD AS BUFFER: Descargar archivo como Buffer
   */
  async downloadFile(filename: string): Promise<Buffer | null> {
    if (!this.isAvailable || !gcsBucket) {
      console.warn('⚠️ [GCS] Servicio no disponible - no se puede descargar archivo');
      return null;
    }

    try {
      console.log(`📥 [GCS] Descargando archivo: ${filename}`);

      const blob = gcsBucket.file(filename);
      const [exists] = await blob.exists();

      if (!exists) {
        console.warn(`⚠️ [GCS] Archivo no encontrado: ${filename}`);
        return null;
      }

      const [buffer] = await blob.download();
      console.log(`✅ [GCS] Archivo descargado: ${filename}`);
      return buffer;

    } catch (error) {
      console.error('❌ [GCS] Error descargando archivo:', error);
      return null;
    }
  }

  /**
   * 📥 DOWNLOAD TO RESPONSE: Descargar archivo para servir directamente al cliente
   */
  async downloadFileToResponse(filename: string, res: Response): Promise<void> {
    try {
      console.log(`📥 [GCS] Sirviendo archivo: ${filename}`);

      const buffer = await this.downloadFile(filename);

      if (!buffer) {
        res.status(404).json({ error: 'Archivo no encontrado' });
        return;
      }

      const contentType = this.getContentType(filename);

      res.set({
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600'
      });

      res.end(buffer);
      console.log(`✅ [GCS] Archivo servido: ${filename}`);

    } catch (error) {
      console.error('❌ [GCS] Error sirviendo archivo:', error);
      if (res && !res.headersSent) {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  }

  /**
   * 🗑️ DELETE: Eliminar archivo
   */
  async deleteFile(filename: string): Promise<boolean> {
    if (!this.isAvailable || !gcsBucket) {
      console.warn('⚠️ [GCS] Servicio no disponible - no se puede eliminar archivo');
      return false;
    }

    try {
      console.log(`🗑️ [GCS] Eliminando archivo: ${filename}`);

      const blob = gcsBucket.file(filename);
      await blob.delete();

      console.log(`✅ [GCS] Archivo eliminado: ${filename}`);
      return true;

    } catch (error) {
      console.error('❌ [GCS] Error eliminando archivo:', error);
      return false;
    }
  }

  /**
   * 📂 LIST: Listar archivos
   */
  async listFiles(prefix?: string): Promise<string[]> {
    if (!this.isAvailable || !gcsBucket) {
      console.warn('⚠️ [GCS] Servicio no disponible - no se puede listar archivos');
      return [];
    }

    try {
      const options = prefix ? { prefix } : {};
      const [files] = await gcsBucket.getFiles(options);
      return files.map((file: any) => file.name);

    } catch (error) {
      console.error('❌ [GCS] Error listando archivos:', error);
      return [];
    }
  }

  /**
   * 🔍 EXISTS: Verificar si un archivo existe
   */
  async fileExists(filename: string): Promise<boolean> {
    if (!this.isAvailable || !gcsBucket) {
      return false;
    }

    try {
      const blob = gcsBucket.file(filename);
      const [exists] = await blob.exists();
      return exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * 🔗 PUBLIC URL: Generar URL pública para archivo
   */
  getPublicUrl(filename: string): string {
    // URL pública de GCS (requiere que el bucket sea público)
    return `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${filename}`;
  }

  /**
   * 🔗 SIGNED URL: Generar URL firmada temporal
   */
  async getSignedUrl(filename: string, expiresInMinutes: number = 60): Promise<string | null> {
    if (!this.isAvailable || !gcsBucket) {
      return null;
    }

    try {
      const blob = gcsBucket.file(filename);
      const [url] = await blob.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInMinutes * 60 * 1000,
      });
      return url;
    } catch (error) {
      console.error('❌ [GCS] Error generando signed URL:', error);
      return null;
    }
  }

  /**
   * Detectar tipo de contenido
   */
  private getContentType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      'txt': 'text/plain',
      'json': 'application/json',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}

// Instancia singleton del servicio
export const gcsObjectStorage = new GCSObjectStorageService();
