/**
 * /api/push-tokens — device push-token registry for the signed-in user.
 *   POST   { token, platform } → upsert by token (handles device handoffs:
 *          the same device re-registering under a new account reassigns it).
 *   DELETE { token }           → drop it (sign-out / opt-out hygiene).
 *
 * Tokens are Expo push tokens (`ExponentPushToken[...]`); we validate the shape
 * so junk never reaches the Expo send API.
 */
import { and, eq } from 'drizzle-orm';

import { pushTokens } from '@/db/schema';
import { db } from '@/lib/server/db';
import { badRequest, handle, json, readJson } from '@/lib/server/http';
import { requireSession } from '@/lib/server/session';

interface RegisterBody {
  token?: string;
  platform?: string;
}

const isExpoToken = (t: unknown): t is string =>
  typeof t === 'string' && t.startsWith('ExponentPushToken[') && t.endsWith(']');

export const POST = handle(async (request) => {
  const { user } = await requireSession(request);
  const body = await readJson<RegisterBody>(request);

  if (!isExpoToken(body.token)) throw badRequest('A valid Expo push token is required');
  const platform = body.platform === 'ios' || body.platform === 'android' ? body.platform : null;
  if (!platform) throw badRequest("platform must be 'ios' or 'android'");

  // Upsert by token: a device that changes hands re-points to the new owner and
  // refreshes the timestamp, rather than creating a duplicate or 409ing.
  await db
    .insert(pushTokens)
    .values({ userId: user.id, token: body.token, platform })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { userId: user.id, platform, updatedAt: new Date() },
    });

  return json({ ok: true }, 201);
});

export const DELETE = handle(async (request) => {
  const { user } = await requireSession(request);
  const body = await readJson<RegisterBody>(request);
  if (!isExpoToken(body.token)) throw badRequest('A valid Expo push token is required');

  // Scope the delete to the caller so one user can't unregister another's device.
  await db
    .delete(pushTokens)
    .where(and(eq(pushTokens.token, body.token), eq(pushTokens.userId, user.id)));

  return json({ ok: true });
});
