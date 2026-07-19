/**
 * Server-only Drizzle client over Neon's HTTP driver.
 * Only import from API routes (*+api.ts), other src/lib/server modules,
 * or scripts — never from client code (DATABASE_URL must not reach the bundle).
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from '../../db/schema';

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
