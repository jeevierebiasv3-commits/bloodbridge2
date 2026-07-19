/**
 * POST /api/appointments/[id]/cancel — caller cancels their own appointment.
 */
import { eq } from 'drizzle-orm';

import { appointments, donationCenters } from '@/db/schema';
import { db } from '@/lib/server/db';
import { forbidden, handle, json, notFound } from '@/lib/server/http';
import { toAppointment } from '@/lib/server/serialize';
import { requireSession } from '@/lib/server/session';

export const POST = handle(async (request, { id }) => {
  const { user } = await requireSession(request);

  const [apt] = await db.select().from(appointments).where(eq(appointments.id, id));
  if (!apt) throw notFound('Appointment not found');
  if (apt.userId !== user.id) throw forbidden('Not your appointment');

  const [row] = await db
    .update(appointments)
    .set({ status: 'cancelled' })
    .where(eq(appointments.id, id))
    .returning();

  const [center] = await db
    .select()
    .from(donationCenters)
    .where(eq(donationCenters.id, row.centerId));

  return json(toAppointment(row, center));
});
