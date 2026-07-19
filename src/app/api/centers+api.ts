/**
 * GET /api/centers — all donation centers, nearest first.
 */
import { asc } from 'drizzle-orm';

import { donationCenters } from '@/db/schema';
import { db } from '@/lib/server/db';
import { handle, json } from '@/lib/server/http';
import { toCenter } from '@/lib/server/serialize';
import { requireSession } from '@/lib/server/session';

export const GET = handle(async (request) => {
  await requireSession(request);
  const rows = await db.select().from(donationCenters).orderBy(asc(donationCenters.distanceKm));
  return json(rows.map(toCenter));
});
