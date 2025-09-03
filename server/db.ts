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
console.log('🔍 [DB-DEBUG] PGHOST available:', !!process.env.PGHOST);
console.log('🔍 [DB-DEBUG] PGUSER available:', !!process.env.PGUSER);
console.log('🔍 [DB-DEBUG] PGPASSWORD available:', !!process.env.PGPASSWORD);
console.log('🔍 [DB-DEBUG] PGDATABASE available:', !!process.env.PGDATABASE);
console.log('🔍 [DB-DEBUG] PGPORT available:', !!process.env.PGPORT);

if (!process.env.DATABASE_URL) {
  console.error('❌ [DB-ERROR] DATABASE_URL not found in environment variables');
  console.error('❌ [DB-ERROR] Available env vars:', Object.keys(process.env).filter(key => key.includes('PG') || key.includes('DB')));
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('✅ [DB-SUCCESS] Database configuration loaded successfully');
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });