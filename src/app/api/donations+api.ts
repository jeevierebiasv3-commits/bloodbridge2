/**
 * GET /api/donations — the caller's donation history (drives eligibility and
 * impact stats), newest first.
 */
import { desc, eq } from 'drizzle-orm';

import { donations } from '@/db/schema';
import { db } from '@/lib/server/db';
import { handle, json } from '@/lib/server/http';
import { toDonation } from '@/lib/server/serialize';
import { requireSession } from '@/lib/server/session';

export const GET = handle(async (request) => {
  const { user } = await requireSession(request);
  const rows = await db
    .select()
    .from(donations)
    .where(eq(donations.userId, user.id))
    .orderBy(desc(donations.date));
  return json(rows.map(toDonation));
});
