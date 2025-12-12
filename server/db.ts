import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// 🔍 Debug: Log ALL environment variables for Railway deployment troubleshooting
console.log('🔍 [DB-DEBUG] ========== ENVIRONMENT CHECK ==========');
console.log('🔍 [DB-DEBUG] NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 [DB-DEBUG] RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('🔍 [DB-DEBUG] RAILWAY_SERVICE_NAME:', process.env.RAILWAY_SERVICE_NAME);
console.log('🔍 [DB-DEBUG] REPLIT_DEPLOYMENT:', process.env.REPLIT_DEPLOYMENT);
console.log('🔍 [DB-DEBUG] DATABASE_URL available:', !!process.env.DATABASE_URL);
console.log('🔍 [DB-DEBUG] DATABASE_URL_OVERRIDE available:', !!process.env.DATABASE_URL_OVERRIDE);
console.log('🔍 [DB-DEBUG] Total env vars count:', Object.keys(process.env).length);

// Log keys that might be database related (without values for security)
const dbRelatedKeys = Object.keys(process.env).filter(key =>
  key.includes('PG') ||
  key.includes('DB') ||
  key.includes('DATABASE') ||
  key.includes('POSTGRES') ||
  key.includes('RAILWAY') ||
  key.includes('NEON')
);
console.log('🔍 [DB-DEBUG] Database-related env vars found:', dbRelatedKeys);
console.log('🔍 [DB-DEBUG] ========================================');

// 🎯 Priority: Use DATABASE_URL_OVERRIDE if available (for deployment overrides)
const databaseUrl = process.env.DATABASE_URL_OVERRIDE || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ [DB-ERROR] Neither DATABASE_URL nor DATABASE_URL_OVERRIDE found');
  console.error('❌ [DB-ERROR] This usually means:');
  console.error('❌ [DB-ERROR] 1. Variables were added AFTER the last deploy - Redeploy needed');
  console.error('❌ [DB-ERROR] 2. Variables are in wrong service in Railway');
  console.error('❌ [DB-ERROR] 3. Variables need to be in "Variables" tab, not "Shared"');
  throw new Error(
    "DATABASE_URL or DATABASE_URL_OVERRIDE must be set. Did you forget to provision a database?",
  );
}

if (process.env.DATABASE_URL_OVERRIDE) {
  console.log('🚀 [DB-OVERRIDE] Using DATABASE_URL_OVERRIDE for deployment');
} else {
  console.log('🔧 [DB-DEFAULT] Using standard DATABASE_URL');
}

console.log('✅ [DB-SUCCESS] Database configuration loaded successfully');
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });