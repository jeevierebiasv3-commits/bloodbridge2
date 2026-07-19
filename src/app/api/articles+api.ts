/**
 * GET /api/articles — education articles, including bodies (the article detail
 * screen selects from this cached list).
 */
import { educationArticles } from '@/db/schema';
import { db } from '@/lib/server/db';
import { handle, json } from '@/lib/server/http';
import { toArticle } from '@/lib/server/serialize';
import { requireSession } from '@/lib/server/session';

export const GET = handle(async (request) => {
  await requireSession(request);
  const rows = await db.select().from(educationArticles);
  return json(rows.map(toArticle));
});
