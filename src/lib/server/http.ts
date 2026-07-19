/**
 * Shared plumbing for API route handlers. `handle()` wraps a handler so thrown
 * ApiErrors become a consistent `{ error: { code, message } }` envelope and any
 * unexpected error becomes a 500. Server-only.
 */

import { type Coords, isValidLat, isValidLng } from '@/lib/geo';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const badRequest = (message: string) => new ApiError(400, 'bad_request', message);
export const unauthorized = (message = 'Sign in required') =>
  new ApiError(401, 'unauthorized', message);
export const forbidden = (message = 'Not allowed') => new ApiError(403, 'forbidden', message);
export const notFound = (message = 'Not found') => new ApiError(404, 'not_found', message);
export const conflict = (message: string) => new ApiError(409, 'conflict', message);

export function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Parse a JSON request body, surfacing a clean 400 on malformed input. */
export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw badRequest('Invalid JSON body');
  }
}

/**
 * The viewer's coordinates from `?lat=&lng=`. Missing or malformed params yield
 * null rather than a 400 — distances degrade to stored fallbacks, and a bad
 * param must never break the 20s feed poll.
 */
export function readCoords(request: Request): Coords | null {
  const { searchParams } = new URL(request.url);
  const rawLat = searchParams.get('lat')?.trim();
  const rawLng = searchParams.get('lng')?.trim();
  if (!rawLat || !rawLng) return null;
  const latitude = Number(rawLat);
  const longitude = Number(rawLng);
  if (!isValidLat(latitude) || !isValidLng(longitude)) return null;
  return { latitude, longitude };
}

type Ctx = Record<string, string>;
type Handler = (request: Request, ctx: Ctx) => Promise<Response> | Response;

/** Wrap a handler so ApiErrors serialize to the standard error envelope. */
export function handle(fn: Handler): Handler {
  return async (request, ctx) => {
    try {
      return await fn(request, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return json({ error: { code: err.code, message: err.message } }, err.status);
      }
      console.error('[api] unhandled error', err);
      return json({ error: { code: 'internal', message: 'Something went wrong' } }, 500);
    }
  };
}
