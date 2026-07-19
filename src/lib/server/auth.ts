/**
 * Better Auth server instance. Reads BETTER_AUTH_SECRET / BETTER_AUTH_URL
 * from the environment. Server-only — consumed by the /api/auth/* catch-all
 * route, requireSession, and the seed script.
 */
import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import * as schema from '../../db/schema';
import { db } from './db';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: { enabled: true },
  plugins: [expo()],
  trustedOrigins: [
    'bdsapp://', // production deep-link scheme
    'exp://**', // Expo Go in development
    'http://localhost:*', // Expo web dev server (any port, incl. preview proxy)
    'http://127.0.0.1:*',
  ],
});
