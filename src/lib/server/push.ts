/**
 * Push fan-out: notify donors whose blood type can serve a new request.
 *
 * Uses the Expo push API directly (no `expo-server-sdk` dependency, no API key
 * needed). Sends in batches of ≤100, and prunes tokens the API reports as
 * `DeviceNotRegistered`. Server-only.
 */
import { and, eq, inArray, ne } from 'drizzle-orm';

import { emergencyRequests, profiles, pushTokens } from '@/db/schema';
import { donorsFor } from '@/lib/blood';
import { db } from '@/lib/server/db';
import { type Coords, haversineKm } from '@/lib/geo';
import type { Urgency } from '@/types/domain';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CHUNK = 100;
const NEARBY_KM = 50;

const URGENCY_WORD: Record<Urgency, string> = {
  critical: 'Critical',
  urgent: 'Urgent',
  moderate: 'Moderate',
  routine: 'Routine',
};

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: { url: string };
  sound: 'default';
  channelId: 'default';
  priority: 'high';
}

type RequestRow = typeof emergencyRequests.$inferSelect;

/** Split an array into fixed-size chunks. */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Notify every donor who can give to `request.bloodType`, excluding the owner.
 * When both the request and a donor have coords, keep only donors within
 * ~50 km; donors without coords are always included (recall beats precision for
 * a blood alert — city-hash distances aren't meaningful to filter on).
 */
export async function notifyMatchingDonors(request: RequestRow): Promise<void> {
  const compatible = donorsFor(request.bloodType);
  if (compatible.length === 0) return;

  const rows = await db
    .select({
      token: pushTokens.token,
      lat: profiles.latitude,
      lng: profiles.longitude,
    })
    .from(pushTokens)
    .innerJoin(profiles, eq(profiles.userId, pushTokens.userId))
    .where(
      and(
        inArray(profiles.bloodType, compatible),
        ne(pushTokens.userId, request.ownerId),
      ),
    );
  if (rows.length === 0) return;

  const origin: Coords | null =
    request.latitude != null && request.longitude != null
      ? { latitude: request.latitude, longitude: request.longitude }
      : null;

  const recipients = rows.filter((r) => {
    if (!origin || r.lat == null || r.lng == null) return true; // no distance → include
    return haversineKm(origin, { latitude: r.lat, longitude: r.lng }) <= NEARBY_KM;
  });
  if (recipients.length === 0) return;

  const title = `🩸 ${request.bloodType} blood needed near you`;
  const body = `${request.hospital}, ${request.city} — ${URGENCY_WORD[request.urgency]}, ${request.unitsNeeded} unit${request.unitsNeeded === 1 ? '' : 's'}`;
  const messages: ExpoMessage[] = recipients.map((r) => ({
    to: r.token,
    title,
    body,
    data: { url: `/request/${request.id}` },
    sound: 'default',
    channelId: 'default',
    priority: 'high',
  }));

  for (const batch of chunk(messages, CHUNK)) {
    await sendBatch(batch);
  }
}

/** POST one ≤100 batch and prune tokens the API rejects as unregistered. */
async function sendBatch(batch: ExpoMessage[]): Promise<void> {
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(batch),
  });

  if (!res.ok) {
    console.error('[push] Expo API responded', res.status, await res.text().catch(() => ''));
    return;
  }

  // Tickets come back positionally aligned with the batch we sent.
  const payload = (await res.json().catch(() => null)) as {
    data?: { status: string; details?: { error?: string } }[];
  } | null;
  const tickets = payload?.data;
  if (!tickets) return;

  const dead = batch
    .filter((_, i) => tickets[i]?.details?.error === 'DeviceNotRegistered')
    .map((m) => m.to);
  if (dead.length > 0) {
    await db.delete(pushTokens).where(inArray(pushTokens.token, dead));
  }
}
