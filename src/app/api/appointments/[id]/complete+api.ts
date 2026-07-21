/**
 * POST /api/appointments/[id]/complete — caller marks their own appointment
 * done. This is the one flow that records a real donation: it flips the
 * appointment to `completed`, inserts a `donations` row (feeding impact stats
 * and history), and advances the profile's `lastDonationDate` so the eligibility
 * countdown and the "eligible again" reminder run on real data, not seed data.
 *
 * neon-http has no interactive transactions, so the writes go through
 * `db.batch` — they commit together or not at all.
 */
import { eq } from 'drizzle-orm';

import { appointments, donationCenters, donations, profiles } from '@/db/schema';
import { db } from '@/lib/server/db';
import { conflict, forbidden, handle, json, notFound } from '@/lib/server/http';
import { toAppointment } from '@/lib/server/serialize';
import { requireSession } from '@/lib/server/session';

export const POST = handle(async (request, { id }) => {
  const { user } = await requireSession(request);

  const [row] = await db
    .select({ apt: appointments, center: donationCenters })
    .from(appointments)
    .innerJoin(donationCenters, eq(appointments.centerId, donationCenters.id))
    .where(eq(appointments.id, id));
  if (!row) throw notFound('Appointment not found');

  const { apt, center } = row;
  if (apt.userId !== user.id) throw forbidden('Not your appointment');
  // Idempotency guard: completing twice would create duplicate donation rows.
  if (apt.status === 'completed') throw conflict('Appointment already completed');
  if (apt.status === 'cancelled') throw conflict('A cancelled appointment cannot be completed');

  // Never move the countdown backward: if a newer donation already exists, keep
  // it. Only advance `lastDonationDate` when this visit is the most recent one.
  const [profile] = await db
    .select({ lastDonationDate: profiles.lastDonationDate })
    .from(profiles)
    .where(eq(profiles.userId, user.id));
  const advancesCountdown = !profile?.lastDonationDate || apt.date > profile.lastDonationDate;

  const completeAppointment = db
    .update(appointments)
    .set({ status: 'completed' })
    .where(eq(appointments.id, id))
    .returning();

  const recordDonation = db.insert(donations).values({
    userId: user.id,
    date: apt.date,
    centerName: center.name,
    city: center.city,
    units: 1, // a whole-blood visit yields one unit; the model tracks units, not sessions
    type: apt.type,
  });

  const advanceProfile = db
    .update(profiles)
    .set({ lastDonationDate: apt.date, updatedAt: new Date() })
    .where(eq(profiles.userId, user.id));

  // Two fixed shapes keep `db.batch`'s tuple typing intact (no casts). The
  // status guards above already reject a re-submit before any write.
  const [[aptRow]] = advancesCountdown
    ? await db.batch([completeAppointment, recordDonation, advanceProfile])
    : await db.batch([completeAppointment, recordDonation]);

  return json(toAppointment(aptRow, center));
});
