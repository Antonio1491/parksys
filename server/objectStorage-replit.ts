/**
 * REPLIT OBJECT STORAGE SERVICE - VERSIÓN OFICIAL
 * ===============================================
 *
 * Usa @replit/object-storage (librería oficial)
 * con autenticación automática - SIN problemas 401
 *
 * NOTA: Solo funciona en entorno Replit. En otros entornos (Railway, etc.)
 * este servicio estará deshabilitado.
 */

import { Response } from "express";
import { randomUUID } from "crypto";

// Detectar si estamos en Replit
const isReplit = !!(process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT);

// Cliente oficial de Replit - solo inicializar en Replit
let replitStorageClient: any = null;

if (isReplit) {
  try {
    const { Client } = require("@replit/object-storage");
    replitStorageClient = new Client();
    console.log('✅ [REPLIT-STORAGE] Cliente inicializado en entorno Replit');
  } catch (error) {
    console.warn('⚠️ [REPLIT-STORAGE] No se pudo inicializar el cliente:', error);
  }
} else {
  console.log('ℹ️ [REPLIT-STORAGE] No estamos en Replit - Object Storage deshabilitado');
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ReplitObjectStorageService {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = !!replitStorageClient;
    if (this.isAvailable) {
      console.log('✅ [REPLIT-STORAGE] Cliente oficial inicializado con autenticación automática');
    } else {
      console.log('ℹ️ [REPLIT-STORAGE] Servicio no disponible (no estamos en Replit)');
    }
  }

  /**
   * Verificar si el servicio está disponible
   */
  isServiceAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * 🚀 UPLOAD: Subir archivo usando la librería oficial de Replit
   */
  async uploadFile(file: Buffer, filename: string): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('Replit Object Storage no está disponible en este entorno');
    }

    try {
      const uniqueFilename = `uploads/${Date.now()}-${randomUUID()}-${filename}`;

      console.log(`📤 [REPLIT-STORAGE] DETALLE: Iniciando upload`);
      console.log(`📤 [REPLIT-STORAGE] - Filename objetivo: ${uniqueFilename}`);
      console.log(`📤 [REPLIT-STORAGE] - Buffer size: ${file.length} bytes`);
      console.log(`📤 [REPLIT-STORAGE] - Client disponible: ${!!replitStorageClient}`);

      const { ok, error } = await replitStorageClient.uploadFromBytes(
        uniqueFilename,
        file
      );

      console.log(`📤 [REPLIT-STORAGE] RESPUESTA: ok=${ok}, error=${error}`);

      if (!ok) {
        console.error('❌ [REPLIT-STORAGE] Upload falló:', error);
        throw new Error(`Error subiendo archivo: ${error}`);
      }

      console.log(`✅ [REPLIT-STORAGE] Upload exitoso: ${uniqueFilename}`);
      return uniqueFilename;

    } catch (error) {
      console.error('❌ [REPLIT-STORAGE] Excepción en upload:', error);
      console.error('❌ [REPLIT-STORAGE] Error type:', typeof error);
      console.error('❌ [REPLIT-STORAGE] Error message:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * 📥 DOWNLOAD AS BUFFER: Descargar archivo como Buffer
   */
  async downloadFile(filename: string): Promise<Buffer | null> {
    if (!this.isAvailable) {
      console.warn('⚠️ [REPLIT-STORAGE] Servicio no disponible - no se puede descargar archivo');
      return null;
    }

    try {
      console.log(`📥 [REPLIT-STORAGE] Descargando archivo: ${filename}`);

      const { ok, value, error } = await replitStorageClient.downloadAsBytes(filename);
      
      if (!ok) {
        console.error('❌ [REPLIT-STORAGE] Error descargando archivo:', error);
        return null;
      }

      // Convertir valor a Buffer - Extraer Buffer del Array si es necesario
      const buffer = Array.isArray(value) && value.length === 1 && Buffer.isBuffer(value[0]) 
        ? value[0]  // Extraer el Buffer del Array
        : Buffer.isBuffer(value) 
          ? value 
          : Buffer.from(value as any);
      
      console.log(`✅ [REPLIT-STORAGE] Archivo descargado exitosamente: ${filename}`);
      return buffer;
      
    } catch (error) {
      console.error('❌ [REPLIT-STORAGE] Error descargando archivo:', error);
      return null;
    }
  }

  /**
   * 📥 DOWNLOAD TO RESPONSE: Descargar archivo para servir directamente al cliente
   */
  async downloadFileToResponse(filename: string, res: Response): Promise<void> {
    try {
      console.log(`📥 [REPLIT-STORAGE] Descargando archivo para response: ${filename}`);
      
      const buffer = await this.downloadFile(filename);
      
      if (!buffer) {
        res.status(404).json({ error: 'Archivo no encontrado' });
        return;
      }

      // Detectar tipo de contenido
      let contentType = 'application/octet-stream';
      if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (filename.toLowerCase().endsWith('.png')) {
        contentType = 'image/png';
      } else if (filename.toLowerCase().endsWith('.gif')) {
        contentType = 'image/gif';
      } else if (filename.toLowerCase().endsWith('.webp')) {
        contentType = 'image/webp';
      }
      
      res.set({
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600'
      });
      
      res.end(buffer);
      console.log(`✅ [REPLIT-STORAGE] Archivo servido exitosamente: ${filename}`);
      
    } catch (error) {
      console.error('❌ [REPLIT-STORAGE] Error descargando archivo:', error);
      if (res && !res.headersSent) {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  }

  /**
   * 🗑️ DELETE: Eliminar archivo
   */
  async deleteFile(filename: string): Promise<boolean> {
    if (!this.isAvailable) {
      console.warn('⚠️ [REPLIT-STORAGE] Servicio no disponible - no se puede eliminar archivo');
      return false;
    }

    try {
      console.log(`🗑️ [REPLIT-STORAGE] Eliminando archivo: ${filename}`);

      const { ok, error } = await replitStorageClient.delete(filename);
      
      if (!ok) {
        console.error('❌ [REPLIT-STORAGE] Error eliminando archivo:', error);
        return false;
      }
      
      console.log(`✅ [REPLIT-STORAGE] Archivo eliminado exitosamente: ${filename}`);
      return true;
      
    } catch (error) {
      console.error('❌ [REPLIT-STORAGE] Error eliminando archivo:', error);
      return false;
    }
  }

  /**
   * 📂 LIST: Listar archivos (para debugging)
   */
  async listFiles(): Promise<string[]> {
    if (!this.isAvailable) {
      console.warn('⚠️ [REPLIT-STORAGE] Servicio no disponible - no se puede listar archivos');
      return [];
    }

    try {
      const { ok, value, error } = await replitStorageClient.list();
      
      if (!ok) {
        console.error('❌ [REPLIT-STORAGE] Error listando archivos:', error);
        return [];
      }
      
      return value.map(file => file.name);
      
    } catch (error) {
      console.error('❌ [REPLIT-STORAGE] Error listando archivos:', error);
      return [];
    }
  }

  /**
   * 🔍 EXISTS: Verificar si un archivo existe
   */
  async fileExists(filename: string): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const { ok } = await replitStorageClient.downloadAsBytes(filename);
      return ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * 🔗 PUBLIC URL: Generar URL pública para archivo
   * (Para Replit, ajustar según entorno de desarrollo vs producción)
   */
  getPublicUrl(filename: string): string {
    // Codificar solo partes individuales del path, no las barras
    const pathParts = filename.split('/');
    const encodedParts = pathParts.map(part => encodeURIComponent(part));
    const encodedFilename = encodedParts.join('/');
    
    // 🎯 PRODUCCIÓN Y DESARROLLO: Usar URLs relativas para mayor compatibilidad
    // Las URLs relativas funcionan en cualquier dominio y evitan problemas de CORS
    console.log(`🔗 [URL] Generando URL relativa para mayor compatibilidad`);
    
    // 🔧 URL RELATIVA: Funciona tanto en desarrollo como en producción
    return `/api/storage/file/${encodedFilename}`;
  }

  /**
   * 🛠️ NORMALIZAR URL: Corregir URLs que vengan del cliente oficial de Replit
   * (Genera URLs apropiadas según el entorno: relativas en desarrollo, absolutas en producción)
   */
  normalizeUrl(originalUrl: string): string {
    console.log(`🔧 [NORMALIZE] Evaluando URL: ${originalUrl}`);
    
    // Si es una URL filesystem (/uploads/...), convertirla al endpoint correcto
    if (originalUrl.startsWith('/uploads/')) {
      const filename = originalUrl.substring(1); // Quitar el '/' inicial
      // Codificar solo partes individuales del path, no las barras
      const pathParts = filename.split('/');
      const encodedParts = pathParts.map(part => encodeURIComponent(part));
      const encodedFilename = encodedParts.join('/');
      
      // Usar URL relativa para máxima compatibilidad
      const relativeUrl = `/api/storage/file/${encodedFilename}`;
      console.log(`🔧 [NORMALIZE] Convirtiendo filesystem a relativa: ${relativeUrl}`);
      return relativeUrl;
    }
    
    // Si ya es una URL relativa correcta, mantenerla
    if (originalUrl.startsWith('/api/storage/file/')) {
      return originalUrl;
    }
    
    // Si es una URL absoluta con cualquier dominio de Replit, extraer filename y regenerar URL correcta
    if (originalUrl.includes('/api/storage/file/') && 
        (originalUrl.includes('.replit.dev/') || 
         originalUrl.includes('.repl.co/') ||
         originalUrl.match(/https:\/\/[a-f0-9-]+\..*\.repl/))) {
      const match = originalUrl.match(/\/api\/storage\/file\/(.+)$/);
      if (match) {
        const filename = match[1];
        console.log(`🔧 [NORMALIZE] Regenerando URL correcta para entorno: ${originalUrl}`);
        const correctUrl = this.getPublicUrl(decodeURIComponent(filename));
        console.log(`✅ [NORMALIZE] URL normalizada: ${correctUrl}`);
        return correctUrl;
      }
    }
    
    // Si ya está correcta, devolverla tal como está
    return originalUrl;
  }
}

// Instancia singleton del servicio
export const replitObjectStorage = new ReplitObjectStorageService();