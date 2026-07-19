/**
 * API request/response contract types shared between the server routes and the
 * client fetch layer. Domain shapes live in ./domain; these describe the wire
 * envelopes and mutation bodies.
 */
import type { BloodType, Donation, EmergencyRequest, Gender, Urgency } from './domain';

/** Standard error envelope returned by every API route on failure. */
export interface ApiErrorBody {
  error: { code: string; message: string };
}

/** A feed request annotated with the current user's own response, if any. */
export type RequestWithMine = EmergencyRequest & {
  myResponse: { status: 'offered' | 'confirmed' } | null;
};

export interface CreateProfileBody {
  fullName: string;
  bloodType: BloodType;
  phone: string;
  city: string;
  region?: string;
  gender?: Gender;
  dateOfBirth?: string; // ISO date
  avatarColor?: string;
  weightKg?: number;
  /**
   * Optional device coords; stored fuzzed (~1 km) server-side and never
   * serialized back to any client. Send null to clear a stored location.
   */
  latitude?: number | null;
  longitude?: number | null;
}

export type UpdateProfileBody = Partial<CreateProfileBody>;

export interface CreateRequestBody {
  patientInitials?: string;
  bloodType: BloodType;
  unitsNeeded: number;
  urgency: Urgency;
  hospital: string;
  city: string;
  neededBy?: string; // ISO; defaults to +12h server-side
  contactName?: string;
  contactPhone: string;
  note?: string;
  /** Optional hospital coords from the creator's device; dropped if invalid. */
  latitude?: number;
  longitude?: number;
}

export interface CreateAppointmentBody {
  centerId: string;
  date: string; // ISO datetime
  type?: Donation['type'];
}
