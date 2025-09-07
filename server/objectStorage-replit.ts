/**
 * REPLIT OBJECT STORAGE SERVICE - VERSIÓN OFICIAL
 * ===============================================
 * 
 * Usa @replit/object-storage (librería oficial) 
 * con autenticación automática - SIN problemas 401
 */

import { Client } from "@replit/object-storage";
import { Response } from "express";
import { randomUUID } from "crypto";

// Cliente oficial de Replit - autenticación automática
const replitStorageClient = new Client();

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ReplitObjectStorageService {
  constructor() {
    console.log('✅ [REPLIT-STORAGE] Cliente oficial inicializado con autenticación automática');
  }

  /**
   * 🚀 UPLOAD: Subir archivo usando la librería oficial de Replit
   */
  async uploadFile(file: Buffer, filename: string): Promise<string> {
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
   * 📥 DOWNLOAD: Descargar archivo para servir al cliente
   */
  async downloadFile(filename: string, res: Response): Promise<void> {
    try {
      console.log(`📥 [REPLIT-STORAGE] Descargando archivo: ${filename}`);
      
      const { ok, value, error } = await replitStorageClient.downloadAsBytes(filename);
      
      if (!ok) {
        console.error('❌ [REPLIT-STORAGE] Error descargando archivo:', error);
        res.status(404).json({ error: 'Archivo no encontrado' });
        return;
      }

      // DEBUG: Verificar qué tipo de datos recibimos
      console.log(`🔍 [DEBUG] Tipo de value:`, typeof value);
      console.log(`🔍 [DEBUG] Es Array:`, Array.isArray(value));
      console.log(`🔍 [DEBUG] Es Buffer:`, Buffer.isBuffer(value));
      console.log(`🔍 [DEBUG] Length original:`, value?.length);
      if (value && value.length > 0) {
        console.log(`🔍 [DEBUG] Primeros 10 elementos:`, value.slice(0, 10));
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
      
      // Servir archivo - Asegurar que sea Buffer
      const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
      
      res.set({
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600'
      });
      
      res.end(buffer);
      console.log(`✅ [REPLIT-STORAGE] Archivo servido exitosamente: ${filename}`);
      
    } catch (error) {
      console.error('❌ [REPLIT-STORAGE] Error descargando archivo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * 🗑️ DELETE: Eliminar archivo
   */
  async deleteFile(filename: string): Promise<boolean> {
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
    const encodedFilename = encodeURIComponent(filename);
    
    // En producción, usar URL completa si está disponible
    const isProduction = process.env.REPLIT_ENVIRONMENT === 'production' ||
                         process.env.NODE_ENV === 'production' || 
                         process.env.REPLIT_DEPLOYMENT;
    
    if (isProduction && process.env.REPLIT_DEV_DOMAIN) {
      // Usar dominio completo para producción
      return `https://${process.env.REPLIT_DEV_DOMAIN}/api/storage/file/${encodedFilename}`;
    }
    
    // Fallback: URL relativa (funciona en desarrollo y mayoría de deployments)
    return `/api/storage/file/${encodedFilename}`;
  }

  /**
   * 🛠️ NORMALIZAR URL: Corregir URLs que vengan del cliente oficial de Replit
   * (Puede que el cliente genere URLs con dominios incorrectos)
   */
  normalizeUrl(originalUrl: string): string {
    // Si ya es una URL relativa, generar la correcta
    if (originalUrl.startsWith('/api/storage/file/')) {
      const filename = originalUrl.replace('/api/storage/file/', '');
      return this.getPublicUrl(decodeURIComponent(filename));
    }
    
    // Si es una URL absoluta con dominio de spock.replit.dev, corregirla
    if (originalUrl.includes('.spock.replit.dev/api/storage/file/')) {
      const match = originalUrl.match(/\/api\/storage\/file\/(.+)$/);
      if (match) {
        const filename = match[1];
        console.log(`🔧 [NORMALIZE] Corrigiendo URL con dominio incorrecto: ${originalUrl}`);
        const correctedUrl = this.getPublicUrl(decodeURIComponent(filename));
        console.log(`✅ [NORMALIZE] URL corregida: ${correctedUrl}`);
        return correctedUrl;
      }
    }
    
    // Si ya está correcta, devolverla tal como está
    return originalUrl;
  }
}

// Instancia singleton del servicio
export const replitObjectStorage = new ReplitObjectStorageService();