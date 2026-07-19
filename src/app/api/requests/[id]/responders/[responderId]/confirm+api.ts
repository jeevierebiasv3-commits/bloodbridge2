/**
 * POST /api/requests/[id]/responders/[responderId]/confirm — owner confirms a
 * donor. Recomputes unitsFulfilled = min(unitsNeeded, confirmedCount) and flips
 * the request to `partial` / `fulfilled` accordingly. Ports app-store.tsx:165.
 *
 * neon-http has no interactive transactions, so the confirm write, the count,
 * and the request update run as sequential statements.
 */
import { and, count, eq } from 'drizzle-orm';

import { emergencyRequests, responders } from '@/db/schema';
import { db } from '@/lib/server/db';
import { forbidden, handle, json, notFound } from '@/lib/server/http';
import { toEmergencyRequest } from '@/lib/server/serialize';
import { requireSession } from '@/lib/server/session';

export const POST = handle(async (request, { id, responderId }) => {
  const { user } = await requireSession(request);

  const [req] = await db.select().from(emergencyRequests).where(eq(emergencyRequests.id, id));
  if (!req) throw notFound('Request not found');
  if (req.ownerId !== user.id) throw forbidden('Only the owner can confirm donors');

  const [resp] = await db
    .select({ id: responders.id })
    .from(responders)
    .where(and(eq(responders.id, responderId), eq(responders.requestId, id)));
  if (!resp) throw notFound('Responder not found');

  await db.update(responders).set({ status: 'confirmed' }).where(eq(responders.id, responderId));

  const [{ c: confirmed }] = await db
    .select({ c: count() })
    .from(responders)
    .where(and(eq(responders.requestId, id), eq(responders.status, 'confirmed')));

  const unitsFulfilled = Math.min(req.unitsNeeded, Number(confirmed));
  const status = unitsFulfilled >= req.unitsNeeded ? 'fulfilled' : 'partial';

  const [row] = await db
    .update(emergencyRequests)
    .set({ unitsFulfilled, status })
    .where(eq(emergencyRequests.id, id))
    .returning();

  const [{ c: total }] = await db
    .select({ c: count() })
    .from(responders)
    .where(eq(responders.requestId, id));

  return json(toEmergencyRequest(row, Number(total)));
});
