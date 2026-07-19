/**
 * /api/requests — the emergency request feed.
 *   GET  → non-expired requests with responder counts and the caller's own
 *          response (replaces the old client-side respondedRequestIds).
 *   POST → create a request owned by the caller.
 */
import { count, desc, eq, ne } from 'drizzle-orm';

import { emergencyRequests, responders } from '@/db/schema';
import { db } from '@/lib/server/db';
import { badRequest, handle, json, readJson } from '@/lib/server/http';
import { cityDistanceKm, toEmergencyRequest } from '@/lib/server/serialize';
import { requireSession } from '@/lib/server/session';
import type { CreateRequestBody, RequestWithMine } from '@/types/api';

export const GET = handle(async (request) => {
  const { user } = await requireSession(request);

  const rows = await db
    .select()
    .from(emergencyRequests)
    .where(ne(emergencyRequests.status, 'expired'))
    .orderBy(desc(emergencyRequests.postedAt));

  const counts = await db
    .select({ requestId: responders.requestId, c: count() })
    .from(responders)
    .groupBy(responders.requestId);
  const countByRequest = new Map(counts.map((x) => [x.requestId, Number(x.c)]));

  const mine = await db
    .select({ requestId: responders.requestId, status: responders.status })
    .from(responders)
    .where(eq(responders.userId, user.id));
  const mineByRequest = new Map(mine.map((x) => [x.requestId, x.status]));

  const feed: RequestWithMine[] = rows.map((r) => {
    const status = mineByRequest.get(r.id);
    return {
      ...toEmergencyRequest(r, countByRequest.get(r.id) ?? 0),
      myResponse: status ? { status } : null,
    };
  });
  return json(feed);
});

export const POST = handle(async (request) => {
  const { user } = await requireSession(request);
  const body = await readJson<CreateRequestBody>(request);

  if (!body.bloodType) throw badRequest('bloodType is required');
  if (!body.urgency) throw badRequest('urgency is required');
  const unitsNeeded = Math.max(1, Math.floor(Number(body.unitsNeeded) || 0));
  if (!body.hospital?.trim()) throw badRequest('hospital is required');
  if (!body.city?.trim()) throw badRequest('city is required');
  if (!body.contactPhone?.trim()) throw badRequest('contactPhone is required');

  const city = body.city.trim();
  const neededBy = body.neededBy ? new Date(body.neededBy) : new Date(Date.now() + 12 * 3_600_000);

  const [row] = await db
    .insert(emergencyRequests)
    .values({
      ownerId: user.id,
      patientInitials: body.patientInitials?.trim() || 'A.B.',
      bloodType: body.bloodType,
      unitsNeeded,
      urgency: body.urgency,
      hospital: body.hospital.trim(),
      city,
      distanceKm: cityDistanceKm(city),
      neededBy,
      contactName: body.contactName?.trim() || user.name || 'Requester',
      contactPhone: body.contactPhone.trim(),
      note: body.note?.trim() || null,
    })
    .returning();

  const created: RequestWithMine = { ...toEmergencyRequest(row, 0), myResponse: null };
  return json(created, 201);
});
