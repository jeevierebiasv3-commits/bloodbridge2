/**
 * Row → domain-type mappers. Drizzle returns Date objects for timestamptz
 * columns while the client domain types use ISO strings, so all serialization
 * happens here in one place. Server-only.
 */
import type {
  announcements,
  appointments,
  donationCenters,
  donations,
  educationArticles,
  emergencyRequests,
  profiles,
} from '@/db/schema';
import type {
  Announcement,
  Appointment,
  Donation,
  DonationCenter,
  EducationArticle,
  EmergencyRequest,
  Responder,
  UserProfile,
} from '@/types/domain';

type ProfileRow = typeof profiles.$inferSelect;
type RequestRow = typeof emergencyRequests.$inferSelect;
type CenterRow = typeof donationCenters.$inferSelect;
type AppointmentRow = typeof appointments.$inferSelect;
type DonationRow = typeof donations.$inferSelect;
type AnnouncementRow = typeof announcements.$inferSelect;
type ArticleRow = typeof educationArticles.$inferSelect;

export function toProfile(
  u: { id: string; name: string; email: string },
  p: ProfileRow,
): UserProfile {
  return {
    id: u.id,
    fullName: u.name,
    email: u.email,
    phone: p.phone,
    bloodType: p.bloodType,
    gender: p.gender ?? undefined,
    dateOfBirth: p.dateOfBirth ?? undefined,
    city: p.city,
    region: p.region ?? undefined,
    avatarColor: p.avatarColor ?? undefined,
    health: p.weightKg != null ? { weightKg: p.weightKg } : undefined,
    lastDonationDate: p.lastDonationDate ? p.lastDonationDate.toISOString() : undefined,
    createdAt: p.createdAt.toISOString(),
  };
}

export function toEmergencyRequest(r: RequestRow, respondersCount: number): EmergencyRequest {
  return {
    id: r.id,
    ownerId: r.ownerId,
    patientInitials: r.patientInitials,
    bloodType: r.bloodType,
    unitsNeeded: r.unitsNeeded,
    unitsFulfilled: r.unitsFulfilled,
    urgency: r.urgency,
    hospital: r.hospital,
    city: r.city,
    distanceKm: r.distanceKm,
    neededBy: r.neededBy.toISOString(),
    postedAt: r.postedAt.toISOString(),
    contactName: r.contactName,
    contactPhone: r.contactPhone,
    note: r.note ?? undefined,
    status: r.status,
    respondersCount,
  };
}

/** Owner-facing responder row assembled from a responders ⋈ user ⋈ profiles join. */
export function toResponder(
  row: {
    id: string;
    fullName: string;
    bloodType: Responder['bloodType'];
    city: string;
    avatarColor: string | null;
    respondedAt: Date;
    status: Responder['status'];
  },
  distanceKm: number,
): Responder {
  return {
    id: row.id,
    fullName: row.fullName,
    bloodType: row.bloodType,
    city: row.city,
    distanceKm,
    avatarColor: row.avatarColor ?? undefined,
    respondedAt: row.respondedAt.toISOString(),
    status: row.status,
  };
}

export function toAppointment(a: AppointmentRow, c: CenterRow): Appointment {
  return {
    id: a.id,
    centerName: c.name,
    address: c.address,
    date: a.date.toISOString(),
    status: a.status,
    type: a.type,
  };
}

export function toDonation(d: DonationRow): Donation {
  return {
    id: d.id,
    date: d.date.toISOString(),
    centerName: d.centerName,
    city: d.city,
    units: d.units,
    type: d.type,
  };
}

export function toCenter(c: CenterRow): DonationCenter {
  return {
    id: c.id,
    name: c.name,
    kind: c.kind,
    address: c.address,
    city: c.city,
    distanceKm: c.distanceKm,
    openNow: c.openNow,
    hours: c.hours,
    rating: c.rating,
    needsUrgent: c.needsUrgent ?? undefined,
  };
}

export function toAnnouncement(a: AnnouncementRow): Announcement {
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    tag: a.tag,
    date: a.date.toISOString(),
    tone: a.tone,
  };
}

export function toArticle(a: ArticleRow): EducationArticle {
  return {
    id: a.id,
    title: a.title,
    summary: a.summary,
    minutes: a.minutes,
    category: a.category,
    icon: a.icon,
    body: a.body,
  };
}

/**
 * Deterministic placeholder distance (km) derived from the city name — stable
 * per city until real geolocation lands (v2). Range ~1.0–12.0.
 */
export function cityDistanceKm(city: string): number {
  let h = 0;
  for (let i = 0; i < city.length; i += 1) h = (h * 31 + city.charCodeAt(i)) % 997;
  return Math.round((1 + (h / 997) * 11) * 10) / 10;
}
