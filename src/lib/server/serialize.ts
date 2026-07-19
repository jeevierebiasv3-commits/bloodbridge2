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
import { type Coords, haversineKm } from '@/lib/geo';
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

/** Nullable row coords → Coords, or null when either half is missing. */
function rowCoords(row: { latitude: number | null; longitude: number | null }): Coords | null {
  if (row.latitude == null || row.longitude == null) return null;
  return { latitude: row.latitude, longitude: row.longitude };
}

/**
 * Real distance when both endpoints have coordinates, else the stored per-city
 * fallback. Callers can't tell the two apart — that's deliberate, so every
 * screen works without conditional logic.
 */
function distanceFrom(
  from: Coords | null | undefined,
  to: Coords | null,
  fallbackKm: number,
): number {
  return from && to ? haversineKm(from, to) : fallbackKm;
}

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

export function toEmergencyRequest(
  r: RequestRow,
  respondersCount: number,
  viewer?: Coords | null,
): EmergencyRequest {
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
    distanceKm: distanceFrom(viewer, rowCoords(r), r.distanceKm),
    neededBy: r.neededBy.toISOString(),
    postedAt: r.postedAt.toISOString(),
    contactName: r.contactName,
    contactPhone: r.contactPhone,
    note: r.note ?? undefined,
    status: r.status,
    respondersCount,
  };
}

/**
 * Owner-facing responder row assembled from a responders ⋈ user ⋈ profiles join.
 * The distance shown is donor→hospital (how far this donor must travel), not
 * viewer→anything; it falls back to the request's stored distance whenever
 * either the donor's or the hospital's coordinates are missing.
 */
export function toResponder(
  row: {
    id: string;
    fullName: string;
    bloodType: Responder['bloodType'];
    city: string;
    avatarColor: string | null;
    respondedAt: Date;
    status: Responder['status'];
    latitude: number | null;
    longitude: number | null;
  },
  fallbackDistanceKm: number,
  requestCoords?: Coords | null,
): Responder {
  return {
    id: row.id,
    fullName: row.fullName,
    bloodType: row.bloodType,
    city: row.city,
    distanceKm: distanceFrom(rowCoords(row), requestCoords ?? null, fallbackDistanceKm),
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

export function toCenter(c: CenterRow, viewer?: Coords | null): DonationCenter {
  return {
    id: c.id,
    name: c.name,
    kind: c.kind,
    address: c.address,
    city: c.city,
    distanceKm: distanceFrom(viewer, rowCoords(c), c.distanceKm),
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
 * Deterministic distance (km) derived from the city name — stable per city.
 * Still seeds `distance_km` on create; it is the fallback whenever real
 * coordinates are unavailable on either end. Range ~1.0–12.0.
 */
export function cityDistanceKm(city: string): number {
  let h = 0;
  for (let i = 0; i < city.length; i += 1) h = (h * 31 + city.charCodeAt(i)) % 997;
  return Math.round((1 + (h / 997) * 11) * 10) / 10;
}
