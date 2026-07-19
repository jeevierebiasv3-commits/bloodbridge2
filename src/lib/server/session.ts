/**
 * Session guard for API routes. `requireSession` resolves the Better Auth
 * session from the request headers (cookie on web, forwarded Cookie header on
 * native) and throws a 401 envelope when absent. Server-only.
 */
import { auth } from './auth';
import { unauthorized } from './http';

export async function requireSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw unauthorized();
  return session;
}
