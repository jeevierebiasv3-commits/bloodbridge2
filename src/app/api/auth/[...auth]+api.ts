/**
 * Better Auth catch-all route. Mounts the Better Auth handler at /api/auth/*
 * — sign-up, sign-in, get-session, sign-out, and the Expo plugin endpoints.
 */
import { auth } from '@/lib/server/auth';

const handler = auth.handler;

export { handler as GET, handler as POST };
