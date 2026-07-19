/**
 * GET /api/centers — all donation centers, nearest first.
 * Optional `?lat=&lng=` gives real distances (and a real sort order); without
 * them the seeded fallback distances and their SQL ordering are used.
 */
import { asc } from 'drizzle-orm';

import { donationCenters } from '@/db/schema';
import { db } from '@/lib/server/db';
import { handle, json, readCoords } from '@/lib/server/http';
import { toCenter } from '@/lib/server/serialize';
import { requireSession } from '@/lib/server/session';

export const GET = handle(async (request) => {
  await requireSession(request);
  const viewer = readCoords(request);

  const rows = await db.select().from(donationCenters).orderBy(asc(donationCenters.distanceKm));
  const centers = rows.map((row) => toCenter(row, viewer));
  // Computed distances don't follow the SQL order, so re-sort in JS.
  if (viewer) centers.sort((a, b) => a.distanceKm - b.distanceKm);

  return json(centers);
});
