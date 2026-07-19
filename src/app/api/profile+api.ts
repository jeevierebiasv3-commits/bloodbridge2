/**
 * /api/profile — the current user's donor profile.
 *   GET   → compose UserProfile from `user` + `profiles`; 404 gates onboarding.
 *   POST  → upsert from the profile-setup wizard (also syncs `user.name`).
 *   PATCH → partial update of an existing profile.
 *
 * Stored coordinates are write-only: `toProfile` never emits them, so they are
 * invisible even to their owner. Only computed distances leave the server.
 */
import { eq } from 'drizzle-orm';

import { profiles, user as authUser } from '@/db/schema';
import { isValidLat, isValidLng, roundCoord } from '@/lib/geo';
import { db } from '@/lib/server/db';
import { badRequest, handle, json, notFound, readJson } from '@/lib/server/http';
import { toProfile } from '@/lib/server/serialize';
import { requireSession } from '@/lib/server/session';
import type { CreateProfileBody, UpdateProfileBody } from '@/types/api';

/**
 * Coordinate half of a profile write. Omitted coords leave any stored location
 * untouched (it is maintained by the location hook, not the profile forms);
 * explicit null clears it; invalid values are ignored.
 */
function coordFields(body: UpdateProfileBody): Partial<typeof profiles.$inferInsert> {
  if (body.latitude === null || body.longitude === null) {
    return { latitude: null, longitude: null };
  }
  if (isValidLat(body.latitude) && isValidLng(body.longitude)) {
    return { latitude: roundCoord(body.latitude), longitude: roundCoord(body.longitude) };
  }
  return {};
}

export const GET = handle(async (request) => {
  const { user } = await requireSession(request);
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
  if (!p) throw notFound('Profile not set up');
  return json(toProfile(user, p));
});

export const POST = handle(async (request) => {
  const { user } = await requireSession(request);
  const body = await readJson<CreateProfileBody>(request);

  if (!body.fullName?.trim()) throw badRequest('fullName is required');
  if (!body.bloodType) throw badRequest('bloodType is required');
  if (!body.phone?.trim()) throw badRequest('phone is required');
  if (!body.city?.trim()) throw badRequest('city is required');

  const fullName = body.fullName.trim();
  await db
    .update(authUser)
    .set({ name: fullName, updatedAt: new Date() })
    .where(eq(authUser.id, user.id));

  const fields = {
    bloodType: body.bloodType,
    phone: body.phone.trim(),
    city: body.city.trim(),
    region: body.region?.trim() || null,
    gender: body.gender ?? null,
    dateOfBirth: body.dateOfBirth ?? null,
    avatarColor: body.avatarColor ?? null,
    weightKg: body.weightKg ?? null,
    ...coordFields(body),
    updatedAt: new Date(),
  };

  const [p] = await db
    .insert(profiles)
    .values({ userId: user.id, ...fields })
    .onConflictDoUpdate({ target: profiles.userId, set: fields })
    .returning();

  return json(toProfile({ ...user, name: fullName }, p), 201);
});

export const PATCH = handle(async (request) => {
  const { user } = await requireSession(request);
  const body = await readJson<UpdateProfileBody>(request);

  const [existing] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
  if (!existing) throw notFound('Profile not set up');

  const fullName = body.fullName?.trim();
  if (fullName) {
    await db
      .update(authUser)
      .set({ name: fullName, updatedAt: new Date() })
      .where(eq(authUser.id, user.id));
  }

  const patch: Partial<typeof profiles.$inferInsert> = { updatedAt: new Date() };
  if (body.bloodType) patch.bloodType = body.bloodType;
  if (body.phone !== undefined) patch.phone = body.phone.trim();
  if (body.city !== undefined) patch.city = body.city.trim();
  if (body.region !== undefined) patch.region = body.region?.trim() || null;
  if (body.gender !== undefined) patch.gender = body.gender ?? null;
  if (body.dateOfBirth !== undefined) patch.dateOfBirth = body.dateOfBirth ?? null;
  if (body.avatarColor !== undefined) patch.avatarColor = body.avatarColor ?? null;
  if (body.weightKg !== undefined) patch.weightKg = body.weightKg ?? null;
  Object.assign(patch, coordFields(body));

  const [p] = await db
    .update(profiles)
    .set(patch)
    .where(eq(profiles.userId, user.id))
    .returning();

  return json(toProfile({ ...user, name: fullName || user.name }, p));
});
