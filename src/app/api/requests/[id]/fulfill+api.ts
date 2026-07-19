/**
 * POST /api/requests/[id]/fulfill — owner marks their request fully met.
 */
import { count, eq } from 'drizzle-orm';

import { emergencyRequests, responders } from '@/db/schema';
import { db } from '@/lib/server/db';
import { forbidden, handle, json, notFound } from '@/lib/server/http';
import { toEmergencyRequest } from '@/lib/server/serialize';
import { requireSession } from '@/lib/server/session';

export const POST = handle(async (request, { id }) => {
  const { user } = await requireSession(request);

  const [req] = await db.select().from(emergencyRequests).where(eq(emergencyRequests.id, id));
  if (!req) throw notFound('Request not found');
  if (req.ownerId !== user.id) throw forbidden('Only the owner can fulfill this request');

  const [row] = await db
    .update(emergencyRequests)
    .set({ status: 'fulfilled', unitsFulfilled: req.unitsNeeded })
    .where(eq(emergencyRequests.id, id))
    .returning();

  const [{ c }] = await db
    .select({ c: count() })
    .from(responders)
    .where(eq(responders.requestId, id));

  return json(toEmergencyRequest(row, Number(c)));
});
