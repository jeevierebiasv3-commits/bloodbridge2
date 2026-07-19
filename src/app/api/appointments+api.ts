/**
 * /api/appointments — the caller's donation appointments.
 *   GET  → the caller's appointments, joined to their center.
 *   POST → book an appointment { centerId, date, type }.
 */
import { desc, eq } from 'drizzle-orm';

import { appointments, donationCenters } from '@/db/schema';
import { db } from '@/lib/server/db';
import { badRequest, handle, json, notFound, readJson } from '@/lib/server/http';
import { toAppointment } from '@/lib/server/serialize';
import { requireSession } from '@/lib/server/session';
import type { CreateAppointmentBody } from '@/types/api';

export const GET = handle(async (request) => {
  const { user } = await requireSession(request);
  const rows = await db
    .select({ apt: appointments, center: donationCenters })
    .from(appointments)
    .innerJoin(donationCenters, eq(appointments.centerId, donationCenters.id))
    .where(eq(appointments.userId, user.id))
    .orderBy(desc(appointments.date));
  return json(rows.map((x) => toAppointment(x.apt, x.center)));
});

export const POST = handle(async (request) => {
  const { user } = await requireSession(request);
  const body = await readJson<CreateAppointmentBody>(request);

  if (!body.centerId) throw badRequest('centerId is required');
  if (!body.date) throw badRequest('date is required');

  const [center] = await db
    .select()
    .from(donationCenters)
    .where(eq(donationCenters.id, body.centerId));
  if (!center) throw notFound('Center not found');

  const [apt] = await db
    .insert(appointments)
    .values({
      userId: user.id,
      centerId: body.centerId,
      date: new Date(body.date),
      type: body.type ?? 'whole',
    })
    .returning();

  return json(toAppointment(apt, center), 201);
});
