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
      
      // Servir archivo - Extraer Buffer del Array si es necesario
      const buffer = Array.isArray(value) && value.length === 1 && Buffer.isBuffer(value[0]) 
        ? value[0]  // Extraer el Buffer del Array
        : Buffer.isBuffer(value) 
          ? value 
          : Buffer.from(value);
      
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
    
    // 🎯 PRODUCCIÓN: Usar dominio absoluto para deployment
    if (process.env.REPLIT_DEPLOYMENT) {
      // En deployment, construir URL absoluta usando variables de entorno de Replit
      const replitId = process.env.REPL_ID;
      const replitOwner = process.env.REPL_OWNER;
      
      if (replitId && replitOwner) {
        // Formato estándar de URLs de Replit para deployments
        const deploymentUrl = `https://${replitId}.${replitOwner}.repl.co/api/storage/file/${encodedFilename}`;
        console.log(`🚀 [PRODUCTION] Generando URL absoluta para deployment: ${deploymentUrl}`);
        return deploymentUrl;
      }
      
      // Fallback para deployments: usar dominio actual del request
      if (process.env.REPLIT_DEV_DOMAIN) {
        const fallbackUrl = `https://${process.env.REPLIT_DEV_DOMAIN}/api/storage/file/${encodedFilename}`;
        console.log(`🚀 [PRODUCTION] Usando fallback con REPLIT_DEV_DOMAIN: ${fallbackUrl}`);
        return fallbackUrl;
      }
    }
    
    // 🔧 DESARROLLO: URL relativa (funciona perfectamente con Vite)
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
      const encodedFilename = encodeURIComponent(filename);
      
      // En producción, usar URL absoluta
      if (process.env.REPLIT_DEPLOYMENT) {
        const domain = process.env.REPL_URL || process.env.REPLIT_URL || 'https://localhost:5000';
        const absoluteUrl = `${domain}/api/storage/file/${encodedFilename}`;
        console.log(`🔧 [NORMALIZE] Convirtiendo filesystem a absoluta: ${absoluteUrl}`);
        return absoluteUrl;
      }
      
      // En desarrollo, usar URL relativa
      const relativeUrl = `/api/storage/file/${encodedFilename}`;
      console.log(`🔧 [NORMALIZE] Convirtiendo filesystem a relativa: ${relativeUrl}`);
      return relativeUrl;
    }
    
    // Si ya es una URL relativa, verificar si necesita ser absoluta para producción
    if (originalUrl.startsWith('/api/storage/file/')) {
      // En producción, convertir URLs relativas a absolutas
      if (process.env.REPLIT_DEPLOYMENT) {
        const filename = originalUrl.replace('/api/storage/file/', '');
        return this.getPublicUrl(decodeURIComponent(filename));
      }
      // En desarrollo, mantener relativa
      return originalUrl;
    }
    
    // Si es una URL absoluta con cualquier dominio de Replit, extraer filename y regenerar URL correcta
    if (originalUrl.includes('.replit.dev/api/storage/file/') || 
        originalUrl.includes('.spock.replit.dev/api/storage/file/') ||
        originalUrl.includes('.aspallatam.repl.co/api/storage/file/') ||
        originalUrl.includes('.repl.co/api/storage/file/')) {
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