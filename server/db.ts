import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// 🔍 Debug: Log environment variables for deployment troubleshooting
console.log('🔍 [DB-DEBUG] Environment check:');
console.log('🔍 [DB-DEBUG] NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 [DB-DEBUG] REPLIT_DEPLOYMENT:', process.env.REPLIT_DEPLOYMENT);
console.log('🔍 [DB-DEBUG] DATABASE_URL available:', !!process.env.DATABASE_URL);
console.log('🔍 [DB-DEBUG] DATABASE_URL_OVERRIDE available:', !!process.env.DATABASE_URL_OVERRIDE);

// 🎯 Priority: Use DATABASE_URL_OVERRIDE if available (for deployment overrides)
const databaseUrl = process.env.DATABASE_URL_OVERRIDE || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ [DB-ERROR] Neither DATABASE_URL nor DATABASE_URL_OVERRIDE found');
  console.error('❌ [DB-ERROR] Available env vars:', Object.keys(process.env).filter(key => key.includes('PG') || key.includes('DB')));
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