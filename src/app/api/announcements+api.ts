/**
 * GET /api/announcements — global announcements, newest first.
 */
import { desc } from 'drizzle-orm';

import { announcements } from '@/db/schema';
import { db } from '@/lib/server/db';
import { handle, json } from '@/lib/server/http';
import { toAnnouncement } from '@/lib/server/serialize';
import { requireSession } from '@/lib/server/session';

export const GET = handle(async (request) => {
  await requireSession(request);
  const rows = await db.select().from(announcements).orderBy(desc(announcements.date));
  return json(rows.map(toAnnouncement));
});
